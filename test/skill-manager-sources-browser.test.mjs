import assert from 'node:assert/strict';
import {
  chmod,
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

async function mount(t, language) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'waycraft-ui-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const base = join(root, 'base');
  await skill(base, 'global-skill');
  const app = join(root, 'app');
  await mkdir(join(app, '.git'), { recursive: true });
  await skill(join(app, '.dsh', 'skills'), 'dsh-skill');
  await skill(join(app, '.agents', 'skills'), 'agent-skill');
  const gone = join(root, 'gone');
  const product = join(root, 'acme');
  await skill(join(product, 'skills'), 'acme-skill');
  let hostRoute;
  const stops = [];
  const abort = new AbortController();
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
        const host = {
          effect(start) {
            stops.push(start());
          },
          get(name) {
            if (name === 'workspaceRegistry')
              return { list: () => [{ path: app }, { path: gone }] };
            return {
              fetch: {
                register(route) {
                  hostRoute = route;
                  return () => {};
                },
              },
            };
          },
        };
        callback(host);
      },
      get(name) {
        if (name === 'workspaceRegistry')
          return { list: () => [{ path: app }, { path: gone }] };
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
  // Holds the next toggle request until the returned function is called.
  const holds = [];
  const hold = () => {
    let open;
    holds.push(new Promise((resolve) => (open = resolve)));
    return open;
  };
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
      if (holds.length && JSON.parse(options.body).action === 'toggle')
        await holds.shift();
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
      if (label?.startsWith('majed-skills')) cleanups.push(start());
    },
    inject(names, callback) {
      if (
        names.length === 2 &&
        names.includes('locale') &&
        names.includes('slots')
      )
        return callback(ctx);
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
  const button = (label) =>
    view.root
      .findAllByType('button')
      .find((x) => x.children.join('') === label);
  const field = (label) =>
    view.root.findAll(
      (x) =>
        ['input', 'select'].includes(x.type) && x.props['aria-label'] === label,
    )[0];
  const click = async (label) => {
    const target = button(label);
    assert.ok(target, `button ${label}`);
    await act(async () => target.props.onClick());
    await settle();
  };
  const type = async (label, value) => {
    const target = field(label);
    assert.ok(target, `field ${label}`);
    await act(async () => target.props.onChange({ target: { value } }));
  };
  const text = () => JSON.stringify(view.toJSON());
  const switchLabels = () =>
    view.root
      .findAllByType('button')
      .map((x) => x.children.join(''))
      .filter((x) => x.startsWith(d.toggleSource));
  return {
    root,
    app,
    gone,
    product,
    d,
    button,
    field,
    click,
    type,
    text,
    switchLabels,
    settle,
    hold,
  };
}

for (const language of ['en', 'ar'])
  test(`registered ${language} UI selects projects, flags unavailable ones and keeps project DSH read-only`, async (t) => {
    const ui = await mount(t, language);
    assert.match(ui.text(), /global-skill/);
    assert.doesNotMatch(ui.text(), /agent-skill/);
    await ui.type(ui.d.scope, 'project');
    await ui.settle();
    const select = ui.field(ui.d.project);
    const options = select.findAllByType('option');
    const missing = options.find((x) => x.props.disabled);
    assert.ok(missing);
    assert.match(
      missing.children.join(''),
      new RegExp(ui.d['code.project-missing']),
    );
    const ok = options.find((x) => !x.props.disabled && x.props.value);
    await ui.type(ui.d.project, ok.props.value);
    await ui.settle();
    assert.match(ui.text(), /agent-skill/);
    assert.match(ui.text(), /dsh-skill/);
    assert.doesNotMatch(ui.text(), /global-skill/);
    // Project DSH source offers no switch; other project sources keep theirs.
    assert.equal(
      ui.switchLabels().some((x) => x.includes('DSH')),
      false,
    );
    // Selecting an unavailable project (forced) shows the diagnostic, never another scope.
    await ui.type(ui.d.project, missing.props.value);
    await ui.settle();
    assert.match(ui.text(), new RegExp(ui.d['code.project-missing']));
    assert.doesNotMatch(ui.text(), /agent-skill|global-skill/);
    if (language === 'ar') assert.match(ui.text(), /"dir":"rtl"/);
  });

for (const language of ['en', 'ar'])
  test(`registered ${language} UI previews, adds, edits and removes custom sources without touching files`, async (t) => {
    const ui = await mount(t, language);
    await ui.click(ui.d.folders);
    await ui.type(ui.d.folderPath, ui.product);
    await ui.click(ui.d.scanFolder);
    assert.match(ui.text(), /acme/);
    assert.doesNotMatch(ui.text(), /acme-skill/);
    // Previewing registered nothing.
    assert.doesNotMatch(ui.text(), new RegExp(`${ui.d.customBadge}`));
    await ui.click(ui.d.addSource);
    assert.match(ui.text(), /acme \(1\)/);
    assert.match(ui.text(), /acme-skill/);
    await ui.click(ui.d.edit);
    await ui.type(ui.d.label, 'Renamed');
    await ui.click(ui.d.save);
    assert.match(ui.text(), /Renamed \(1\)/);
    // Overlapping folders are refused by the host and surfaced with a translated message.
    await ui.type(ui.d.folderPath, ui.product);
    await ui.click(ui.d.addFolder);
    assert.match(ui.text(), new RegExp(ui.d['code.root-overlap']));
    await ui.type(ui.d.folderPath, join(ui.product, 'skills'));
    await ui.click(ui.d.addFolder);
    assert.match(ui.text(), new RegExp(ui.d.registered));
    await ui.click(ui.d.remove);
    assert.match(ui.text(), new RegExp(ui.d.removeNote));
    await ui.click(ui.d.confirmRemove);
    assert.doesNotMatch(ui.text(), /Renamed/);
    assert.match(
      await readFile(
        join(ui.product, 'skills', 'acme-skill', 'SKILL.md'),
        'utf8',
      ),
      /acme-skill/,
    );
  });

for (const language of ['en', 'ar'])
  test(`registered ${language} UI names row actions, isolates paths, clears stale notices and interpolates limits`, async (t) => {
    const ui = await mount(t, language);
    const { d } = ui;
    for (const key of ['code.custom-limit']) assert.match(d[key], /\{limit\}/);
    for (const key of [
      'code.forbidden',
      'code.unsupported',
      'code.stopping',
      'code.state-invalid',
      'code.scan-aborted',
    ])
      assert.ok(d[key], key);
    await ui.click(d.folders);
    await ui.type(d.folderPath, ui.product);
    await ui.click(d.scanFolder);
    // The preview button is enabled again once the preview settled.
    assert.equal(ui.button(d.scanFolder).props.disabled, false);
    const named = (label) =>
      ui.button(d.addSource).props['aria-label'] === label;
    assert.ok(named(`${d.addSourceNamed}: acme`));
    assert.match(ui.text(), /"dir":"ltr"/);
    await ui.click(d.addSource);
    const labels = ui.button(d.edit).props['aria-label'];
    assert.match(labels, new RegExp(`^${d.editNamed}: `));
    assert.match(
      ui.button(d.remove).props['aria-label'],
      new RegExp(`^${d.removeNamed}: `),
    );
    // A notice from the previous scope never lingers after switching scope.
    await ui.type(d.folderPath, ui.product);
    await ui.click(d.addFolder);
    assert.match(ui.text(), new RegExp(d['code.root-overlap']));
    await ui.type(d.scope, 'project');
    await ui.settle();
    assert.doesNotMatch(ui.text(), new RegExp(d['code.root-overlap']));
  });

for (const language of ['en', 'ar'])
  test(`registered ${language} UI leaves no stuck loading state when selection changes during a toggle`, async (t) => {
    const ui = await mount(t, language);
    const { d } = ui;
    const label = ui.switchLabels()[0];
    assert.ok(label, 'global source toggle');
    // Start a toggle whose response is held, then switch to a project before it returns.
    const release = ui.hold();
    // Not awaited: the held toggle must stay pending while the selection changes.
    void ui.button(label).props.onClick();
    await ui.type(d.scope, 'project');
    const ok = ui
      .field(d.project)
      .findAllByType('option')
      .find((x) => !x.props.disabled && x.props.value);
    await ui.type(d.project, ok.props.value);
    await ui.settle();
    assert.match(ui.text(), /agent-skill/);
    release();
    await ui.settle();
    // The stale toggle must not replace the project list or leave the UI loading.
    assert.doesNotMatch(ui.text(), new RegExp(d.loading));
    assert.match(ui.text(), /agent-skill/);
  });
