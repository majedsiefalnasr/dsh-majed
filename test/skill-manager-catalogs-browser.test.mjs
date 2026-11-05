// #155 assembled registered EN/AR catalog UI against the registered host and local 127.0.0.1 stubs.
import assert from 'node:assert/strict';
import {
  mkdtemp,
  mkdir,
  readFile,
  realpath,
  rm,
  lstat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import vm from 'node:vm';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { zipSync } from 'fflate';
import { apply as applyHost } from '../dist/skills.js';
import { archiveServer, skillDoc } from './skill-manager-repos-fixtures.mjs';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const code = await readFile(
  new URL('../dist/client.js', import.meta.url),
  'utf8',
);

async function mount(t, language, server) {
  const root = await realpath(
    await mkdtemp(join(tmpdir(), 'waycraft-repo-ui-')),
  );
  t.after(() => rm(root, { recursive: true, force: true }));
  let hostRoute;
  const stops = [];
  applyHost(
    {
      skills: { registerProvider: () => () => {} },
      effect(start) {
        stops.push(start());
      },
      inject(_, callback) {
        callback({
          effect(start) {
            stops.push(start());
          },
          get: () => ({
            fetch: {
              register(route) {
                hostRoute = route;
                return () => {};
              },
            },
          }),
        });
      },
    },
    {
      sources: [
        { id: 'user-dsh', path: join(root, 'skills') },
        { id: 'user-agents', path: join(root, 'agents') },
      ],
      statePath: join(root, 'state', 'state.json'),
      catalogs: {
        allowPrivateHosts: true,
        clawhubBase: server.url,
        skillsShBase: server.url,
        cacheMs: 0,
      },
    },
  );
  t.after(async () => {
    for (const stop of stops) await stop?.();
  });
  let api;
  const hooks = {};
  const pending = [];
  vm.runInNewContext(code, {
    window: {
      __ModuleLoader__: {
        load: ({ factory }) =>
          (api = factory((id) => (id === 'react' ? React : {}))),
      },
    },
    document: {
      baseURI: 'https://example.test/',
      activeElement: null,
      getElementById: () => null,
    },
    navigator: (hooks.navigator = {
      clipboard: { writeText: (value) => hooks.clipboard(value) },
    }),
    URL,
    btoa,
    AbortController,
    console,
    setTimeout: () => 1,
    clearTimeout() {},
    fetch: (url, options) => {
      hooks.signals?.push(options.signal);
      const response = hostRoute
        .fetch(new Request(String(url), options))
        .then(async (real) => {
          // hooks.fail injects a host error response (simulated race); other calls reach the real host.
          const injected = hooks.fail?.(JSON.parse(options.body).action);
          if (injected)
            return new Response(JSON.stringify(injected.body), {
              status: injected.status,
              headers: real.headers,
            });
          if (!hooks.rewrite) return real;
          const body = JSON.parse(await real.text());
          const action = JSON.parse(options.body).action;
          return new Response(JSON.stringify(hooks.rewrite(action, body)), {
            status: real.status,
            headers: real.headers,
          });
        });
      pending.push(response);
      return response;
    },
  });
  const slots = [];
  const cleanups = [];
  const dictionaries = {};
  const ctx = {
    inject(names, callback) {
      if (names.length === 1 && names[0] === 'layout')
        return callback({
          layout: {
            panelInfo: {
              getSnapshot: () => ({ activePanelId: 'majed-skills' }),
            },
            selectPanel() {},
          },
        });
      if (
        names.length === 2 &&
        names.includes('locale') &&
        names.includes('slots')
      )
        return callback(ctx);
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
      register(entry, component) {
        slots.push({ entry, component });
        return () => {};
      },
    },
  };
  api.apply({
    ...ctx,
    effect(start, label) {
      if (label?.startsWith('majed-skills')) cleanups.push(start());
    },
  });
  const settle = async () => {
    for (let i = 0; i < 6; i++)
      await act(async () => {
        await Promise.all(pending);
        await new Promise(setImmediate);
      });
  };
  await settle();
  const views = [];
  const render = async () => {
    let view;
    await act(async () => {
      view = create(
        React.createElement(
          slots.find((x) => x.entry.name === 'settings.section').component,
        ),
      );
    });
    views.push(view);
    await settle();
    return view;
  };
  t.after(async () => {
    for (const view of views) await act(async () => view.unmount());
    for (const stop of cleanups.reverse()) stop?.();
  });
  const tools = (view) => ({
    button: (label) =>
      view.root
        .findAllByType('button')
        .find(
          (x) =>
            x.children.join('') === label || x.props['aria-label'] === label,
        ),
    field: (label) =>
      view.root.findAll(
        (x) =>
          ['input', 'select'].includes(x.type) &&
          x.props['aria-label'] === label,
      )[0],
    form: () => view.root.findAllByType('form')[0],
    text: () => JSON.stringify(view.toJSON()),
  });
  const act2 = async (fn) => {
    await act(async () => fn());
    await settle();
  };
  return {
    root,
    d: dictionaries[language],
    dictionaries,
    hooks,
    render,
    tools,
    act2,
  };
}

const item = (n, extra = {}) => ({
  ownerHandle: 'acme',
  slug: n,
  displayName: `Skill ${n}`,
  summary: `About ${n} <b>x</b>`,
  stats: { downloads: 100 - n.length, installs: n.length, stars: 1 },
  ...extra,
});
const send = (res, value, type = 'application/json', status = 200) => {
  res.writeHead(status, { 'content-type': type });
  res.end(
    typeof value === 'string' || Buffer.isBuffer(value)
      ? value
      : JSON.stringify(value),
  );
};
const exists = (p) =>
  lstat(p).then(
    () => true,
    () => false,
  );

for (const language of ['en', 'ar']) {
  test(`registered ${language} catalog UI: browse, sort, filter, search, retry, details, confirmed install, uninstall`, async (t) => {
    let fail = false;
    const server = await archiveServer((req, res) => {
      const url = new URL(req.url, 'http://x');
      if (url.pathname === '/api/v1/skills') {
        if (fail) return send(res, {}, 'application/json', 500);
        return send(res, {
          items: url.searchParams.get('cursor')
            ? [item('zeta')]
            : [item('alpha'), item('beta-long')],
          nextCursor: url.searchParams.get('cursor') ? null : 'c2',
        });
      }
      if (url.pathname === '/api/v1/search')
        return send(res, { results: [item('found')] });
      if (url.pathname === '/api/search')
        return send(res, {
          skills: [{ source: 'a/b', skillId: 'one', name: 'One', installs: 3 }],
        });
      if (url.pathname === '/api/v1/skills/alpha/file')
        return send(
          res,
          skillDoc('alpha', 'Alpha desc', 'Body <script>x</script>'),
          'text/markdown',
        );
      if (url.pathname === '/api/v1/download')
        return send(
          res,
          Buffer.from(
            zipSync({
              'SKILL.md': Buffer.from(skillDoc('alpha', 'Alpha desc')),
            }),
          ),
          'application/zip',
        );
      send(res, {}, 'application/json', 404);
    });
    t.after(() => server.close());
    const ui = await mount(t, language, server);
    assert.deepEqual(
      Object.keys(ui.dictionaries.en).sort(),
      Object.keys(ui.dictionaries.ar).sort(),
    );
    for (const key of Object.keys(ui.dictionaries.en).filter((k) =>
      /^(cat|code\.catalog)/.test(k),
    ))
      assert.ok(
        ui.dictionaries[language][key] &&
          (ui.dictionaries.ar[key] !== ui.dictionaries.en[key] ||
            /^(catSource|catStatus\.|catSearchClawhub)/.test(key) ||
            ['catSourceClawhub', 'catSourceSkillsh'].includes(key)),
        key,
      );
    const { d } = ui;
    const view = await ui.render();
    const u = ui.tools(view);
    const text = () => u.text();
    await ui.act2(() =>
      u.field(d.scope).props.onChange({ target: { value: 'discover' } }),
    );
    // Discover Skills opens on Git Repos; the catalogs are sibling tabs of one tablist.
    assert.ok(u.button(d.tabGit).props['aria-selected']);
    await ui.act2(() => u.button(d.catSourceClawhub).props.onClick());
    assert.equal(u.button(d.catSourceClawhub).props['aria-selected'], true);
    assert.ok(text().includes(d.catPopularNote));
    assert.ok(
      text().includes('Skill alpha') && text().includes('Skill beta-long'),
    );
    assert.ok(text().includes('acme/alpha'));
    assert.ok(text().includes(`95 ${d.catDownloads}`));
    assert.ok(
      view.root.findAllByType('bdi').some((x) => x.props.dir === 'ltr'),
    );
    // Untrusted summary is plain text, never markup.
    assert.ok(text().includes('About alpha <b>x</b>'));
    assert.equal(view.root.findAll((x) => x.type === 'b').length, 0);
    // Load more appends; sorting applies to displayed items only.
    await ui.act2(() => u.button(d.catLoadMore).props.onClick());
    assert.ok(text().includes('Skill zeta'));
    assert.equal(u.button(d.catLoadMore), undefined);
    await ui.act2(() =>
      u.field(d.catSort).props.onChange({ target: { value: 'name' } }),
    );
    const order = view.root
      .findAll((x) => x.props?.['data-majed-catalog-item'])
      .map((x) => x.props['data-majed-catalog-item']);
    assert.deepEqual(order, [
      'clawhub:acme/alpha',
      'clawhub:acme/beta-long',
      'clawhub:acme/zeta',
    ]);
    // Details are read-only plain text; copy reports its state.
    let copied;
    ui.hooks.clipboard = async (v) => {
      copied = v;
    };
    await ui.act2(() =>
      u.button(`${d.catDetails}: Skill alpha`).props.onClick(),
    );
    assert.ok(text().includes('Alpha desc'));
    const area = view.root.findAllByType('textarea')[0];
    assert.equal(area.props.readOnly, true);
    assert.ok(area.props.value.includes('<script>x</script>'));
    await ui.act2(() => u.button(d.catCopy).props.onClick());
    assert.ok(copied.includes('Body'));
    assert.ok(text().includes(d.catCopied));
    await ui.act2(() => u.button(d.catClose).props.onClick());
    // Install requires the confirmation dialog and shows the destination.
    await ui.act2(() =>
      u.button(`${d.catInstall}: Skill alpha`).props.onClick(),
    );
    assert.ok(u.field(d.repoDestination));
    assert.equal(await exists(join(ui.root, 'skills', 'alpha')), false);
    await ui.act2(() => u.button(d.catInstallConfirm).props.onClick());
    assert.equal(
      await exists(join(ui.root, 'skills', 'alpha', 'SKILL.md')),
      true,
    );
    assert.ok(text().includes(d.catInstallDone));
    assert.ok(text().includes(d['catStatus.installed']));
    assert.ok(u.button(`${d.catInstallElsewhere}: Skill alpha`));
    // Status filter.
    await ui.act2(() =>
      u
        .field(d.catStatusFilter)
        .props.onChange({ target: { value: 'available' } }),
    );
    assert.ok(!text().includes('Skill alpha'));
    await ui.act2(() =>
      u.field(d.catStatusFilter).props.onChange({ target: { value: '' } }),
    );
    // Uninstall moves the copy to Trash.
    await ui.act2(() =>
      u.button(`${d.catUninstall}: Skill alpha`).props.onClick(),
    );
    // Cancel leaves the copy untouched; accepting moves it to Trash.
    assert.ok(text().includes(d.catUninstallTitle));
    await ui.act2(() => u.button(d.cancel).props.onClick());
    assert.equal(
      await exists(join(ui.root, 'skills', 'alpha', 'SKILL.md')),
      true,
    );
    await ui.act2(() =>
      u.button(`${d.catUninstall}: Skill alpha`).props.onClick(),
    );
    await ui.act2(() => u.button(d.catConfirmUninstall).props.onClick());
    assert.equal(await exists(join(ui.root, 'skills', 'alpha')), false);
    assert.ok(text().includes(d['catStatus.trashed']));
    // Search ClawHub, then skills.sh (search only).
    await ui.act2(() =>
      u
        .field(d.catSearchClawhub)
        .props.onChange({ target: { value: 'found' } }),
    );
    await ui.act2(() => u.form().props.onSubmit({ preventDefault() {} }));
    assert.ok(text().includes('Skill found'));
    assert.equal(u.field(d.catSort), undefined);
    await ui.act2(() => u.button(d.catSourceSkillsh).props.onClick());
    assert.ok(text().includes(d.catSkillshHint));
    await ui.act2(() =>
      u.field(d.catSearchSkillsh).props.onChange({ target: { value: 'one' } }),
    );
    await ui.act2(() => u.form().props.onSubmit({ preventDefault() {} }));
    assert.ok(text().includes('a/b/one'));
    assert.ok(text().includes(`3 ${d.catInstalls}`));
    // Error with retry.
    fail = true;
    await ui.act2(() => u.button(d.catSourceClawhub).props.onClick());
    await ui.act2(() =>
      u.field(d.catSearchClawhub).props.onChange({ target: { value: '' } }),
    );
    await ui.act2(() => u.form().props.onSubmit({ preventDefault() {} }));
    assert.ok(text().includes(d.catLoadError));
    fail = false;
    await ui.act2(() => u.button(d.catRetry).props.onClick());
    assert.ok(text().includes('Skill alpha'));
  });
}

// ---------------------------------------------------------------- additional UI behaviour
const alphaZip = (doc = skillDoc('alpha', 'Alpha desc')) =>
  Buffer.from(zipSync({ 'SKILL.md': Buffer.from(doc) }));
// Acts without waiting for deliberately pending requests.
const act1 = (fn) =>
  act(async () => {
    fn();
    await new Promise(setImmediate);
  });
const roles = (view, role) =>
  view.root.findAll((x) => typeof x.type === 'string' && x.props.role === role);

async function discover(t, language, handler, tab = 'clawhub') {
  const server = await archiveServer(handler);
  t.after(() => server.close());
  const ui = await mount(t, language, server);
  const view = await ui.render();
  const u = ui.tools(view);
  await ui.act2(() =>
    u.field(ui.d.scope).props.onChange({ target: { value: 'discover' } }),
  );
  if (tab)
    await ui.act2(() =>
      u
        .button(
          tab === 'clawhub' ? ui.d.catSourceClawhub : ui.d.catSourceSkillsh,
        )
        .props.onClick(),
    );
  return { server, ui, view, u, d: ui.d, text: () => u.text() };
}
const base =
  (extra = {}) =>
  (req, res) => {
    const url = new URL(req.url, 'http://x');
    if (extra.handle?.(req, res, url)) return;
    if (url.pathname === '/api/v1/skills')
      return send(res, { items: [item('alpha')] });
    if (url.pathname === '/api/v1/skills/alpha/file')
      return send(
        res,
        skillDoc('alpha', 'Alpha desc', 'Body'),
        'text/markdown',
      );
    if (url.pathname === '/api/v1/download')
      return send(res, alphaZip(), 'application/zip');
    send(res, {}, 'application/json', 404);
  };
const install = async (c, name = 'Skill alpha') => {
  await c.ui.act2(() =>
    c.u.button(`${c.d.catInstall}: ${name}`).props.onClick(),
  );
  await c.ui.act2(() => c.u.button(c.d.catInstallConfirm).props.onClick());
};

test('Discover Skills scope: options, tablist roles, keyboard navigation (EN/AR)', async (t) => {
  for (const language of ['en', 'ar']) {
    const c = await discover(t, language, base(), null);
    const options = c.view.root
      .findAll(
        (x) => x.type === 'select' && x.props['aria-label'] === c.d.scope,
      )[0]
      .findAllByType('option')
      .map((x) => x.props.value);
    assert.deepEqual(options, ['global', 'project', 'discover', 'trash']);
    const tablist = roles(c.view, 'tablist')[0];
    assert.equal(tablist.props['aria-label'], c.d.scopeDiscover);
    const tabs = roles(c.view, 'tab');
    assert.deepEqual(
      tabs.map((x) => x.children.join('')),
      [c.d.tabGit, c.d.catSourceClawhub, c.d.catSourceSkillsh],
    );
    assert.deepEqual(
      tabs.map((x) => x.props.tabIndex),
      [0, -1, -1],
    );
    assert.equal(roles(c.view, 'tabpanel').length, 1);
    // Arrow keys move the selection (mirrored in RTL); Home/End jump.
    const forward = language === 'ar' ? 'ArrowLeft' : 'ArrowRight';
    await c.ui.act2(() =>
      tabs[0].props.onKeyDown({ key: forward, preventDefault() {} }),
    );
    assert.equal(c.u.button(c.d.catSourceClawhub).props['aria-selected'], true);
    await c.ui.act2(() =>
      c.u.button(c.d.catSourceClawhub).props.onKeyDown({
        key: 'End',
        preventDefault() {},
      }),
    );
    assert.equal(c.u.button(c.d.catSourceSkillsh).props['aria-selected'], true);
    await c.ui.act2(() =>
      c.u.button(c.d.catSourceSkillsh).props.onKeyDown({
        key: 'Home',
        preventDefault() {},
      }),
    );
    assert.equal(c.u.button(c.d.tabGit).props['aria-selected'], true);
    assert.ok(c.text().includes(c.d.repoAddTitle));
  }
});

test('request cancellation: switching tabs and unmounting abort the in-flight request', async (t) => {
  const c = await discover(
    t,
    'en',
    base({
      handle: (req, res, url) => url.pathname === '/api/v1/skills',
    }),
    null,
  );
  c.ui.hooks.signals = [];
  await act1(() => c.u.button(c.d.catSourceClawhub).props.onClick());
  assert.ok(
    c.text().includes(c.d.catLoading),
    'loading indicator while pending',
  );
  const first = c.ui.hooks.signals.at(-1);
  assert.equal(first.aborted, false);
  await act1(() => c.u.button(c.d.catSourceSkillsh).props.onClick());
  assert.equal(first.aborted, true, 'tab switch aborts the earlier request');
  await act1(() => c.u.button(c.d.catSourceClawhub).props.onClick());
  const second = c.ui.hooks.signals.at(-1);
  assert.notEqual(second, first);
  assert.equal(second.aborted, false);
  await act1(() =>
    c.u.field(c.d.scope).props.onChange({ target: { value: 'global' } }),
  );
  assert.equal(second.aborted, true, 'leaving Discover aborts the request');
});

test('load-more shows a polite loading label while the next page is pending', async (t) => {
  let release;
  const c = await discover(
    t,
    'en',
    base({
      handle: (req, res, url) => {
        if (url.pathname !== '/api/v1/skills') return false;
        if (url.searchParams.get('cursor')) {
          release = () => send(res, { items: [item('zeta')] });
          return true;
        }
        send(res, { items: [item('alpha')], nextCursor: 'c2' });
        return true;
      },
    }),
  );
  assert.equal(c.d.catLoadMore, 'Load 10 more');
  await act1(() => c.u.button(c.d.catLoadMore).props.onClick());
  const busy = c.u.button(c.d.catLoadingMore);
  assert.ok(busy);
  assert.equal(busy.props['aria-live'], 'polite');
  assert.equal(busy.props.disabled, true);
  for (let i = 0; i < 50 && !release; i++)
    await new Promise((resolve) => setTimeout(resolve, 10));
  release();
  await c.ui.act2(() => {});
  assert.ok(c.text().includes('Skill zeta'));
});

test('install into the shared agents folder; uninstall warns and Escape/cancel keep the copy', async (t) => {
  const c = await discover(t, 'en', base());
  await c.ui.act2(() =>
    c.u.button(`${c.d.catInstall}: Skill alpha`).props.onClick(),
  );
  const dialog = roles(c.view, 'dialog')[0];
  assert.equal(dialog.props['aria-modal'], true);
  await c.ui.act2(() =>
    c.u.field(c.d.repoDestination).props.onChange({
      target: { value: 'user-agents' },
    }),
  );
  await c.ui.act2(() => c.u.button(c.d.catInstallConfirm).props.onClick());
  assert.equal(
    await exists(join(c.ui.root, 'agents', 'alpha', 'SKILL.md')),
    true,
  );
  assert.equal(await exists(join(c.ui.root, 'skills', 'alpha')), false);
  // Uninstall confirmation warns about the shared folder; Escape closes without acting.
  await c.ui.act2(() =>
    c.u.button(`${c.d.catUninstall}: Skill alpha`).props.onClick(),
  );
  assert.ok(c.text().includes(c.d.catSharedWarning));
  assert.ok(c.text().includes('Trash'));
  await c.ui.act2(() =>
    roles(c.view, 'dialog')[0].props.onKeyDown({ key: 'Escape' }),
  );
  assert.equal(roles(c.view, 'dialog').length, 0);
  assert.equal(
    await exists(join(c.ui.root, 'agents', 'alpha', 'SKILL.md')),
    true,
  );
});

test('install conflict offers adoption of an identical copy, then reports Installed', async (t) => {
  const c = await discover(t, 'en', base());
  await mkdir(join(c.ui.root, 'skills', 'alpha'), { recursive: true });
  await writeFile(
    join(c.ui.root, 'skills', 'alpha', 'SKILL.md'),
    skillDoc('alpha', 'Alpha desc'),
  );
  await install(c);
  assert.ok(c.text().includes(c.d['code.repo-conflict']));
  assert.ok(c.u.button(c.d.catReassociate));
  await c.ui.act2(() => c.u.button(c.d.catReassociate).props.onClick());
  assert.ok(c.text().includes(c.d.catInstallDone));
  assert.ok(c.text().includes(c.d['catStatus.installed']));
  assert.equal(c.u.button(c.d.catReassociate), undefined);
});

test('forget needs confirmation and removes only the record; non-live copies show a hint, not Install elsewhere', async (t) => {
  const c = await discover(t, 'en', base());
  await install(c);
  assert.ok(c.u.button(`${c.d.catInstallElsewhere}: Skill alpha`));
  // Simulate the destination disappearing: the stored root no longer matches any user source.
  const state = join(c.ui.root, 'state', 'catalogs.json');
  const saved = JSON.parse(await readFile(state, 'utf8'));
  saved.installs[0].root = join(c.ui.root, 'gone');
  await writeFile(state, JSON.stringify(saved));
  c.ui.hooks.rewrite = undefined;
  await c.ui.act2(() =>
    c.u.field(c.d.scope).props.onChange({ target: { value: 'global' } }),
  );
  await c.ui.act2(() =>
    c.u.field(c.d.scope).props.onChange({ target: { value: 'discover' } }),
  );
  await c.ui.act2(() => c.u.button(c.d.catSourceClawhub).props.onClick());
  assert.ok(c.text().includes(c.d['catStatus.invalid-root']));
  assert.ok(c.text().includes(c.d['catHint.invalid-root']));
  assert.equal(
    c.u.button(`${c.d.catInstallElsewhere}: Skill alpha`),
    undefined,
  );
  assert.ok(c.u.button(`${c.d.catInstall}: Skill alpha`));
  // Status filter treats the skill as available, not installed.
  await c.ui.act2(() =>
    c.u
      .field(c.d.catStatusFilter)
      .props.onChange({ target: { value: 'installed' } }),
  );
  assert.ok(!c.text().includes('Skill alpha'));
  await c.ui.act2(() =>
    c.u.field(c.d.catStatusFilter).props.onChange({ target: { value: '' } }),
  );
  // Forget asks first; cancelling keeps the record, accepting removes it.
  await c.ui.act2(() =>
    c.u.button(`${c.d.catForget}: Skill alpha`).props.onClick(),
  );
  assert.ok(c.text().includes(c.d.catForgetTitle));
  assert.ok(!c.text().includes(c.d.catSharedWarning));
  await c.ui.act2(() => c.u.button(c.d.cancel).props.onClick());
  assert.equal(JSON.parse(await readFile(state, 'utf8')).installs.length, 1);
  await c.ui.act2(() =>
    c.u.button(`${c.d.catForget}: Skill alpha`).props.onClick(),
  );
  await c.ui.act2(() => c.u.button(c.d.catConfirmForget).props.onClick());
  assert.equal(JSON.parse(await readFile(state, 'utf8')).installs.length, 0);
  assert.ok(!c.text().includes(c.d['catStatus.invalid-root']));
});

test('a trashed copy shows a Trash hint and the install button is not Install elsewhere', async (t) => {
  const c = await discover(t, 'en', base());
  await install(c);
  await c.ui.act2(() =>
    c.u.button(`${c.d.catUninstall}: Skill alpha`).props.onClick(),
  );
  await c.ui.act2(() => c.u.button(c.d.catConfirmUninstall).props.onClick());
  assert.ok(c.text().includes(c.d['catHint.trashed']));
  assert.equal(
    c.u.button(`${c.d.catInstallElsewhere}: Skill alpha`),
    undefined,
  );
  assert.ok(c.text().includes(c.d['catStatus.trashed']));
});

test('unsafe package, detail failure and clipboard failures surface as translated errors', async (t) => {
  for (const language of ['en', 'ar']) {
    let mode = 'bad-zip';
    const c = await discover(
      t,
      language,
      base({
        handle: (req, res, url) => {
          if (url.pathname === '/api/v1/download' && mode === 'bad-zip') {
            send(
              res,
              Buffer.from(zipSync({ '../evil.txt': Buffer.from('x') })),
              'application/zip',
            );
            return true;
          }
          if (
            url.pathname === '/api/v1/skills/alpha/file' &&
            mode === 'detail'
          ) {
            send(res, {}, 'application/json', 500);
            return true;
          }
          return false;
        },
      }),
    );
    await install(c);
    assert.ok(c.text().includes(c.d['code.repo-archive']), language);
    assert.equal(await exists(join(c.ui.root, 'skills', 'alpha')), false);
    mode = 'detail';
    await c.ui.act2(() => c.u.button(c.d.cancel)?.props.onClick());
    await c.ui.act2(() =>
      c.u.button(`${c.d.catDetails}: Skill alpha`).props.onClick(),
    );
    assert.ok(c.text().includes(c.d['code.catalog-upstream']), language);
    assert.equal(roles(c.view, 'dialog').length, 0);
    // Clipboard missing or rejecting shows the failed state instead of throwing.
    mode = 'ok';
    await c.ui.act2(() =>
      c.u.button(`${c.d.catDetails}: Skill alpha`).props.onClick(),
    );
    for (const clipboard of [
      undefined,
      {
        writeText: async () => {
          throw new Error('no');
        },
      },
    ]) {
      c.ui.hooks.navigator.clipboard = clipboard;
      await c.ui.act2(() => c.u.button(c.d.catCopy).props.onClick());
      assert.ok(c.text().includes(c.d.catCopyFailed), language);
    }
  }
});

test('Arabic: dialogs and the panel are right-to-left; paths stay left-to-right', async (t) => {
  const c = await discover(t, 'ar', base());
  await c.ui.act2(() =>
    c.u.button(`${c.d.catInstall}: Skill alpha`).props.onClick(),
  );
  assert.equal(roles(c.view, 'dialog')[0].props.dir, 'rtl');
  assert.ok(
    c.view.root.findAllByType('bdi').every((x) => x.props.dir === 'ltr'),
  );
  assert.equal(
    c.u.button(c.d.catDetails + ': Skill alpha')?.props?.dir,
    undefined,
  );
});

test('a record whose Trash entry vanished shows an accurate hint and can be forgotten', async (t) => {
  const c = await discover(t, 'en', base());
  await install(c);
  await c.ui.act2(() =>
    c.u.button(`${c.d.catUninstall}: Skill alpha`).props.onClick(),
  );
  await c.ui.act2(() => c.u.button(c.d.catConfirmUninstall).props.onClick());
  const state = join(c.ui.root, 'state', 'catalogs.json');
  const trashId = JSON.parse(await readFile(state, 'utf8')).installs[0].trashId;
  await rm(join(c.ui.root, 'state', 'trash', trashId), {
    recursive: true,
    force: true,
  });
  await c.ui.act2(() =>
    c.u.field(c.d.scope).props.onChange({ target: { value: 'global' } }),
  );
  await c.ui.act2(() =>
    c.u.field(c.d.scope).props.onChange({ target: { value: 'discover' } }),
  );
  await c.ui.act2(() => c.u.button(c.d.catSourceClawhub).props.onClick());
  assert.ok(c.text().includes(c.d['catStatus.missing']));
  assert.ok(c.text().includes(c.d['catHint.missing']));
  assert.ok(!c.d['catHint.missing'].includes('replaces'));
  await c.ui.act2(() =>
    c.u.button(`${c.d.catForget}: Skill alpha`).props.onClick(),
  );
  await c.ui.act2(() => c.u.button(c.d.catConfirmForget).props.onClick());
  assert.equal(JSON.parse(await readFile(state, 'utf8')).installs.length, 0);
});

test('corrupt catalog state keeps an empty, valid tabpanel for every tab', async (t) => {
  const c = await discover(t, 'en', base());
  c.ui.hooks.rewrite = (action, body) =>
    action === 'catalog-install' ? { ...body, corrupt: true } : body;
  await install(c);
  assert.equal(
    c.view.root.findAll((x) => x.props?.['data-majed-catalogs']).length,
    0,
  );
  const panels = roles(c.view, 'tabpanel');
  assert.equal(panels.length, 1);
  assert.equal(panels[0].props.id, 'majed-discover-panel');
});

test('two install clicks in the same tick send exactly one install request', async (t) => {
  const c = await discover(t, 'en', base());
  const calls = [];
  c.ui.hooks.fail = (action) => {
    calls.push(action);
  };
  await c.ui.act2(() =>
    c.u.button(`${c.d.catInstall}: Skill alpha`).props.onClick(),
  );
  const confirm = c.u.button(c.d.catInstallConfirm);
  await c.ui.act2(async () => {
    confirm.props.onClick();
    confirm.props.onClick();
  });
  assert.equal(calls.filter((a) => a === 'catalog-install').length, 1);
  assert.ok(c.text().includes(c.d['catStatus.installed']));
});
