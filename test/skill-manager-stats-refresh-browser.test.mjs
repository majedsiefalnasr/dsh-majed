import assert from 'node:assert/strict';
import {
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import vm from 'node:vm';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { apply as applyHost } from '../dist/skills.js';

const code = await readFile(
  new URL('../dist/client.js', import.meta.url),
  'utf8',
);
const doc = (name) =>
  `---\nname: ${name}\ndescription: About ${name}\n---\nBody`;
const skill = async (root, name) => {
  await mkdir(join(root, name), { recursive: true });
  await writeFile(join(root, name, 'SKILL.md'), doc(name));
};

async function mount(t, language, { failList = false } = {}) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'waycraft-stats-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const base = join(root, 'base');
  await skill(base, 'alpha');
  await skill(base, 'beta');
  await mkdir(join(base, 'broken'), { recursive: true });
  await writeFile(join(base, 'broken', 'SKILL.md'), 'no frontmatter here');
  const app = join(root, 'app');
  await mkdir(join(app, '.git'), { recursive: true });
  await skill(join(app, '.dsh', 'skills'), 'dsh-skill');
  await skill(join(app, '.agents', 'skills'), 'agent-skill');
  let hostRoute;
  const stops = [];
  const abort = new AbortController();
  const registry = { list: () => [{ path: app }] };
  applyHost(
    {
      skills: {
        registerProvider(create) {
          create({ signal: abort.signal, invalidate() {} });
          return () => abort.abort();
        },
      },
      effect(start) {
        stops.push(start());
      },
      inject(_, callback) {
        callback({
          effect(start) {
            stops.push(start());
          },
          get(name) {
            if (name === 'workspaceRegistry') return registry;
            return {
              fetch: {
                register(route) {
                  hostRoute = route;
                  return () => {};
                },
              },
            };
          },
        });
      },
      get(name) {
        if (name === 'workspaceRegistry') return registry;
      },
    },
    {
      sources: [{ id: 'base', path: base }],
      statePath: join(root, 'state', 'state.json'),
    },
  );
  t.after(async () => {
    for (const stop of stops) await stop?.();
  });
  let api;
  let Section;
  const cleanups = [];
  const dictionaries = {};
  const pending = [];
  const actions = [];
  // `gate.reload` holds the next reload request; `gate.fail` rejects it.
  const gate = { hold: undefined, fail: false, failList };
  vm.runInNewContext(code, {
    window: {
      __ModuleLoader__: {
        load({ factory }) {
          api = factory((id) => (id === 'react' ? React : {}));
        },
      },
    },
    document: { baseURI: 'https://example.test/' },
    URL,
    AbortController,
    console,
    setTimeout: () => 1,
    clearTimeout() {},
    fetch: async (url, options) => {
      const body = JSON.parse(options.body);
      actions.push(body);
      if (body.action === 'list' && gate.failList) throw new Error('offline');
      if (body.action === 'reload') {
        if (gate.hold) await gate.hold;
        if (gate.fail) throw new Error('offline');
      }
      const response = hostRoute.fetch(new Request(String(url), options));
      pending.push(response);
      return response;
    },
  });
  const ctx = {
    inject(_names, callback) {
      callback(ctx);
    },
    effect(start) {
      cleanups.push(start());
    },
    locale: {
      register(_ns, value) {
        Object.assign(dictionaries, value);
        return () => {};
      },
      bind: () => (key) => dictionaries[language][key],
      language: { getSnapshot: () => language },
    },
    slots: {
      inject: (_name, start) => start(),
      register(_entry, component) {
        Section = component;
        return () => {};
      },
    },
  };
  api.apply({
    ...ctx,
    effect(start, label) {
      if (label?.startsWith('waycraft-skills')) cleanups.push(start());
    },
    inject(names, callback) {
      if (names.length === 2 && names.includes('locale')) return callback(ctx);
    },
    slots: { inject: (_name, start) => start(), register: () => () => {} },
  });
  await new Promise(setImmediate);
  await Promise.all(pending);
  await new Promise(setImmediate);
  assert.ok(Section);
  assert.deepEqual(
    Object.keys(dictionaries.en).sort(),
    Object.keys(dictionaries.ar).sort(),
  );
  let view;
  const settle = async () => {
    for (let i = 0; i < 4; i++)
      await act(async () => {
        await Promise.all(pending);
        await new Promise(setImmediate);
      });
  };
  await act(async () => {
    view = create(React.createElement(Section));
  });
  await settle();
  t.after(async () => {
    await act(async () => view.unmount());
    for (const stop of cleanups.reverse()) stop?.();
  });
  const d = dictionaries[language];
  const field = (label) =>
    view.root.findAll(
      (x) =>
        ['input', 'select'].includes(x.type) && x.props['aria-label'] === label,
    )[0];
  const refreshButton = () =>
    view.root
      .findAllByType('button')
      .find((x) => x.props['data-waycraft-skills-refresh'] !== undefined);
  // Reads the strip as [number, label] pairs, in order.
  const stats = () => {
    const strip = view.root.findAll(
      (x) => x.props['data-waycraft-skills-stats'] !== undefined,
    )[0];
    if (!strip) return null;
    return strip.children.map((cell) => ({
      number: cell.findByType('bdi').children.join(''),
      text: cell.children
        .filter((x) => typeof x === 'string')
        .join('')
        .trim(),
      cell,
    }));
  };
  const strip = () =>
    view.root.findAll(
      (x) => x.props['data-waycraft-skills-stats'] !== undefined,
    )[0];
  const alerts = () =>
    view.root.findAll((x) => x.type === 'div' && x.props.role === 'alert');
  const retryButton = () =>
    view.root
      .findAllByType('button')
      .find((x) => x.children.join('') === d.retry);
  const pick = async (label, value) => {
    await act(async () => field(label).props.onChange({ target: { value } }));
    await settle();
  };
  return {
    d,
    root,
    app,
    base,
    gate,
    actions,
    view,
    field,
    refreshButton,
    strip,
    alerts,
    retryButton,
    stats,
    settle,
    pick,
    post: (body) =>
      hostRoute.fetch(
        new Request('https://example.test/api/waycraft-skills.catalog', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-waycraft-skills': '1',
          },
          body: JSON.stringify(body),
        }),
      ),
    text: () => JSON.stringify(view.toJSON()),
  };
}

for (const language of ['en', 'ar'])
  test(`registered ${language} UI shows the skills/enabled/disabled/diagnostics stats strip in Global and Project scopes`, async (t) => {
    const ui = await mount(t, language);
    const { d } = ui;
    let cells = ui.stats();
    assert.ok(cells, 'strip is shown in Global scope');
    assert.equal(cells.length, 4);
    // The strip is one labelled group for assistive technology (structure only; no screen reader was run).
    assert.equal(ui.strip().props.role, 'group');
    assert.equal(ui.strip().props['aria-label'], d.statsAria);
    assert.ok(d.statsAria.length > 0);
    if (language === 'en') assert.equal(d.statsAria, 'Skill statistics');
    // alpha + beta + broken; broken is invalid, so it is neither enabled nor disabled.
    assert.deepEqual(
      cells.map((x) => x.number),
      ['3', '2', '0', '1'],
    );
    assert.match(cells[0].text, new RegExp(d.statSkills));
    assert.match(cells[1].text, new RegExp(d.statEnabled));
    assert.match(cells[2].text, new RegExp(d.statDisabled));
    assert.match(cells[3].text, new RegExp(d.statDiagnostic));
    // Numbers are isolated so right-to-left text never reorders them.
    for (const cell of cells)
      assert.equal(cell.cell.findAllByType('bdi').length, 1);
    // Disabling a skill moves it from enabled to disabled; the strip ignores filters.
    const copies = (await (await ui.post({ action: 'list' })).json()).copies;
    const alpha = copies.find((x) => x.name === 'alpha');
    await ui.post({
      action: 'toggle',
      kind: 'copy',
      id: alpha.path,
      enabled: false,
    });
    await ui.pick(d.scope, 'discover');
    assert.equal(ui.stats(), null, 'no strip in Discover');
    await ui.pick(d.scope, 'global');
    assert.deepEqual(
      ui.stats().map((x) => x.number),
      ['3', '1', '1', '1'],
    );
    // A search narrowing the list never changes the scope totals.
    await act(async () =>
      ui.field(d.search).props.onChange({ target: { value: 'zzz-no-match' } }),
    );
    assert.deepEqual(
      ui.stats().map((x) => x.number),
      ['3', '1', '1', '1'],
    );
    await act(async () =>
      ui.field(d.search).props.onChange({ target: { value: '' } }),
    );
    // Project scope counts only the selected project's own skills.
    await ui.pick(d.scope, 'project');
    assert.equal(ui.stats(), null, 'no strip until a project is selected');
    const option = ui
      .field(d.project)
      .findAllByType('option')
      .find((x) => x.props.value);
    await ui.pick(d.project, option.props.value);
    cells = ui.stats();
    assert.ok(cells, 'strip is shown in Project scope');
    assert.deepEqual(
      cells.map((x) => x.number),
      ['2', '2', '0', '0'],
    );
    assert.equal(ui.text().includes('"dir":"rtl"'), language === 'ar');
  });

test('the stats strip pluralises English labels and is the only counter source', async (t) => {
  const ui = await mount(t, 'en');
  assert.equal(ui.stats()[0].text, 'skills');
  assert.equal(ui.stats()[3].text, 'diagnostic');
  await rm(join(ui.base, 'broken'), { recursive: true });
  await rm(join(ui.base, 'beta'), { recursive: true });
  await act(async () => ui.refreshButton().props.onClick());
  await ui.settle();
  assert.equal(ui.stats()[0].text, 'skill');
  assert.equal(ui.stats()[3].text, 'diagnostics');
});

for (const language of ['en', 'ar'])
  test(`registered ${language} UI Refresh reloads the catalog, shows a busy state and reports failures in the notice`, async (t) => {
    const ui = await mount(t, language);
    const { d } = ui;
    const button = ui.refreshButton();
    assert.ok(button, 'Refresh is in the toolbar');
    assert.equal(button.children.join(''), d.refresh);
    assert.equal(button.props['aria-label'], d.refreshAria);
    assert.equal(button.props['aria-busy'], false);
    assert.equal(button.props.disabled, false);
    // Arabic uses "reload", not "update", so it is not confused with updating a skill.
    if (language === 'ar') {
      assert.equal(d.refresh, 'إعادة تحميل');
      assert.equal(d.refreshing, 'جارٍ إعادة التحميل…');
      assert.equal(d.refreshAria, 'إعادة تحميل المهارات');
    }
    assert.equal(button.props.type, 'button');
    // Disk changes become visible after Refresh without remounting.
    await skill(ui.base, 'gamma');
    assert.doesNotMatch(ui.text(), /gamma/);
    let release;
    ui.gate.hold = new Promise((resolve) => (release = resolve));
    await act(async () => {
      ui.refreshButton().props.onClick();
    });
    assert.equal(ui.refreshButton().props.disabled, true);
    assert.equal(ui.refreshButton().props['aria-busy'], true);
    assert.equal(ui.refreshButton().props['aria-label'], d.refreshAria);
    assert.equal(ui.refreshButton().children.join(''), d.refreshing);
    // A second click while busy sends no second request.
    await act(async () => ui.refreshButton().props.onClick());
    release();
    ui.gate.hold = undefined;
    await ui.settle();
    assert.equal(ui.actions.filter((x) => x.action === 'reload').length, 1);
    assert.match(ui.text(), /gamma/);
    assert.deepEqual(
      ui.stats().map((x) => x.number),
      ['4', '3', '0', '1'],
    );
    assert.equal(ui.refreshButton().props.disabled, false);
    assert.equal(ui.refreshButton().props['aria-busy'], false);
    assert.equal(ui.refreshButton().props['aria-label'], d.refreshAria);
    assert.equal(ui.refreshButton().children.join(''), d.refresh);
    // A failed reload keeps the list and reports through the existing notice.
    ui.gate.fail = true;
    await act(async () => ui.refreshButton().props.onClick());
    await ui.settle();
    const notice = ui.view.root.findAll(
      (x) => x.type === 'p' && x.props.role === 'status',
    );
    assert.ok(notice.some((x) => x.children.join('') === d.error));
    assert.match(ui.text(), /gamma/);
    assert.equal(ui.refreshButton().props.disabled, false);
    ui.gate.fail = false;
    // Project scope reloads that project, not the global list.
    await ui.pick(d.scope, 'project');
    const option = ui
      .field(d.project)
      .findAllByType('option')
      .find((x) => x.props.value);
    await ui.pick(d.project, option.props.value);
    await act(async () => ui.refreshButton().props.onClick());
    await ui.settle();
    assert.equal(ui.actions.at(-1).action, 'reload');
    assert.equal(ui.actions.at(-1).project, option.props.value);
    // Discover and Trash have no catalog list to refresh.
    for (const scope of ['discover', 'trash']) {
      await ui.pick(d.scope, scope);
      assert.equal(ui.refreshButton(), undefined, scope);
    }
  });

for (const language of ['en', 'ar'])
  test(`registered ${language} UI clears the stale load-error alert after a successful Refresh`, async (t) => {
    const ui = await mount(t, language, { failList: true });
    const { d } = ui;
    assert.equal(ui.alerts().length, 1, 'first load failed: alert shown');
    assert.equal(ui.stats(), null);
    // Refresh stays available in the toolbar and reloads through the host.
    await act(async () => ui.refreshButton().props.onClick());
    await ui.settle();
    assert.equal(ui.alerts().length, 0, 'alert cleared after Refresh');
    assert.ok(ui.stats(), 'catalog and strip are shown');
    assert.deepEqual(
      ui.stats().map((x) => x.number),
      ['3', '2', '0', '1'],
    );
    assert.match(ui.text(), /alpha/);
    assert.equal(ui.refreshButton().props.disabled, false);
    assert.ok(d.error);
  });

for (const language of ['en', 'ar'])
  test(`registered ${language} UI clears the stale load-error alert after a successful Retry`, async (t) => {
    const ui = await mount(t, language, { failList: true });
    assert.equal(ui.alerts().length, 1);
    assert.ok(ui.retryButton(), 'Retry is offered');
    await act(async () => ui.retryButton().props.onClick());
    await ui.settle();
    assert.equal(ui.alerts().length, 0, 'alert cleared after Retry');
    assert.deepEqual(
      ui.stats().map((x) => x.number),
      ['3', '2', '0', '1'],
    );
  });

test('a failed Refresh after a failed first load keeps the alert and reports in the notice', async (t) => {
  const ui = await mount(t, 'en', { failList: true });
  ui.gate.fail = true;
  await act(async () => ui.refreshButton().props.onClick());
  await ui.settle();
  assert.equal(
    ui.alerts().length,
    1,
    'alert stays while the host is unreachable',
  );
  assert.equal(ui.stats(), null);
});
