// #153 assembled registered EN/AR client against the registered host and real local fixtures.
import assert from 'node:assert/strict';
import {
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
  lstat,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import vm from 'node:vm';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { apply as applyHost } from '../dist/skills.js';
import {
  gitCommit,
  gitRepo,
  skillDoc,
} from './skill-manager-repos-fixtures.mjs';

const code = await readFile(
  new URL('../dist/client.js', import.meta.url),
  'utf8',
);

async function mount(t, language) {
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
      repositories: { allowPrivateHosts: true },
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
    document: { baseURI: 'https://example.test/' },
    URL,
    btoa,
    AbortController,
    console,
    setTimeout: () => 1,
    clearTimeout() {},
    fetch: (url, options) => {
      const response = hostRoute
        .fetch(new Request(String(url), options))
        .then(async (real) => {
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

for (const language of ['en', 'ar']) {
  test(`registered ${language} repository UI subscribes, filters, installs, refreshes, uninstalls to Trash, restores and unsubscribes`, async (t) => {
    const ui = await mount(t, language);
    assert.deepEqual(
      Object.keys(ui.dictionaries.en).sort(),
      Object.keys(ui.dictionaries.ar).sort(),
    );
    for (const key of Object.keys(ui.dictionaries.en).filter((k) =>
      /^(repo|code\.repo)/.test(k),
    ))
      assert.ok(
        ui.dictionaries[language][key] &&
          ui.dictionaries.ar[key] !== ui.dictionaries.en[key],
        key,
      );
    const { d } = ui;
    const source = join(ui.root, 'upstream');
    await gitRepo(source, {
      'skills/alpha/SKILL.md': skillDoc('alpha'),
      'skills/alpha/data.bin': Buffer.from([1, 2, 3]),
      'skills/beta/SKILL.md': skillDoc('beta'),
    });
    const view = await ui.render();
    const u = ui.tools(view);
    await ui.act2(() =>
      u.field(d.scope).props.onChange({ target: { value: 'repositories' } }),
    );
    assert.ok(u.text().includes(d.repoEmpty));
    // Validation errors come from the host and are localized.
    await ui.act2(() =>
      u
        .field(d.repoUrl)
        .props.onChange({ target: { value: 'ssh://git@host/x/y' } }),
    );
    await ui.act2(() => u.form().props.onSubmit({ preventDefault() {} }));
    assert.ok(u.text().includes(d['code.repo-url']));
    // Subscribe to a real local Git repository with ref and subdirectory.
    await ui.act2(() =>
      u.field(d.repoUrl).props.onChange({ target: { value: source } }),
    );
    await ui.act2(() =>
      u.field(d.repoRef).props.onChange({ target: { value: 'main' } }),
    );
    await ui.act2(() =>
      u
        .field(d.repoSubdirectory)
        .props.onChange({ target: { value: 'skills' } }),
    );
    await ui.act2(() => u.form().props.onSubmit({ preventDefault() {} }));
    const text = () => u.text();
    assert.ok(text().includes('alpha') && text().includes('beta'));
    assert.ok(text().includes(d['repoKind.git-commit']));
    assert.ok(text().includes(d['repoStatus.available']));
    // Filter.
    await ui.act2(() =>
      u.field(d.repoFilter).props.onChange({ target: { value: 'beta' } }),
    );
    assert.ok(!text().includes(`${d.repoInstall}: alpha`));
    await ui.act2(() =>
      u.field(d.repoFilter).props.onChange({ target: { value: '' } }),
    );
    // Status and repository filters.
    await ui.act2(() =>
      u
        .field(d.repoStatusFilter)
        .props.onChange({ target: { value: 'installed' } }),
    );
    assert.ok(!text().includes(`${d.repoInstall}: alpha`));
    assert.ok(!text().includes('beta'));
    await ui.act2(() =>
      u
        .field(d.repoStatusFilter)
        .props.onChange({ target: { value: 'available' } }),
    );
    assert.ok(text().includes(`${d.repoInstall}: alpha`));
    await ui.act2(() =>
      u.field(d.repoStatusFilter).props.onChange({ target: { value: '' } }),
    );
    await ui.act2(() =>
      u.field(d.repoRepoFilter).props.onChange({ target: { value: 'nope' } }),
    );
    assert.ok(!text().includes('alpha'));
    await ui.act2(() =>
      u.field(d.repoRepoFilter).props.onChange({ target: { value: '' } }),
    );
    assert.ok(text().includes('alpha'));
    ui.hooks.rewrite = (action, body) =>
      action === 'repo-install'
        ? {
            ...body,
            result: {
              warnings: [
                {
                  name: 'alpha',
                  code: 'import-cleanup',
                  recovery: ['/backup'],
                },
              ],
            },
          }
        : body;
    // Install tracked copy.
    await ui.act2(() => u.button(`${d.repoInstall}: alpha`).props.onClick());
    assert.deepEqual(
      [...(await readFile(join(ui.root, 'skills', 'alpha', 'data.bin')))],
      [1, 2, 3],
    );
    assert.ok(text().includes(d['code.import-cleanup']));
    assert.ok(text().includes('/backup'));
    ui.hooks.rewrite = undefined;
    assert.ok(text().includes(d['repoStatus.installed']));
    assert.ok(text().includes(d.repoTracked));
    // Upstream changes; single refresh shows the new skill; bulk refresh reports progress summary.
    await gitCommit(source, { 'skills/gamma/SKILL.md': skillDoc('gamma') });
    const label = source;
    await ui.act2(() => u.button(`${d.repoRefresh}: ${label}`).props.onClick());
    assert.ok(text().includes('gamma'));
    await ui.act2(() => u.button(d.repoRefreshAll).props.onClick());
    assert.ok(
      text().includes(
        d.repoBulk
          .replace('{done}', '1')
          .replace('{total}', '1')
          .replace('{failed}', '0'),
      ),
    );
    // Failed refresh keeps the previous snapshot visible with a localized error.
    await rm(join(source, '.git'), { recursive: true });
    await ui.act2(() => u.button(`${d.repoRefresh}: ${label}`).props.onClick());
    assert.ok(text().includes(d.repoLastError));
    assert.ok(text().includes('gamma'));
    // Install/uninstall warnings (cleanup, recovery) are shown, not dropped.
    ui.hooks.rewrite = (action, body) =>
      action === 'repo-uninstall'
        ? { ...body, result: { warning: 'trash-cleanup', path: '/leftover' } }
        : body;
    await ui.act2(() => u.button(`${d.repoUninstall}: alpha`).props.onClick());
    assert.ok(text().includes(d['code.trash-cleanup']));
    assert.ok(text().includes('/leftover'));
    ui.hooks.rewrite = undefined;
    // Restore alpha for the Trash round trip below.
    await ui.act2(() =>
      u.field(d.scope).props.onChange({ target: { value: 'trash' } }),
    );
    await ui.act2(() => u.button(`${d.restoreTrash}: alpha`).props.onClick());
    await ui.act2(() =>
      u.field(d.scope).props.onChange({ target: { value: 'repositories' } }),
    );
    // Uninstall to Trash, restore from Trash.
    await ui.act2(() => u.button(`${d.repoUninstall}: alpha`).props.onClick());
    await assert.rejects(lstat(join(ui.root, 'skills', 'alpha')), {
      code: 'ENOENT',
    });
    assert.ok(text().includes(d['repoStatus.trashed']));
    await ui.act2(() =>
      u.field(d.scope).props.onChange({ target: { value: 'trash' } }),
    );
    await ui.act2(() => u.button(`${d.restoreTrash}: alpha`).props.onClick());
    assert.deepEqual(
      [...(await readFile(join(ui.root, 'skills', 'alpha', 'data.bin')))],
      [1, 2, 3],
    );
    await ui.act2(() =>
      u.field(d.scope).props.onChange({ target: { value: 'repositories' } }),
    );
    assert.ok(text().includes(d['repoStatus.installed']));
    // Unsubscribe keeps the installed files and their attribution.
    await ui.act2(() =>
      u.button(`${d.repoUnsubscribe}: ${label}`).props.onClick(),
    );
    // Unsubscribing asks first; cancelling changes nothing.
    assert.ok(text().includes(d.repoConfirmUnsubscribe));
    await ui.act2(() => u.button(`${d.cancel}: ${label}`).props.onClick());
    assert.ok(!text().includes(d.repoConfirmUnsubscribe));
    assert.ok(!text().includes(d.repoEmpty));
    await ui.act2(() =>
      u.button(`${d.repoUnsubscribe}: ${label}`).props.onClick(),
    );
    await ui.act2(() =>
      u.button(`${d.repoConfirmUnsubscribeYes}: ${label}`).props.onClick(),
    );
    assert.ok(text().includes(d.repoEmpty));
    assert.equal(
      await readFile(join(ui.root, 'skills', 'alpha', 'SKILL.md'), 'utf8'),
      skillDoc('alpha'),
    );
    assert.ok(
      text().includes(label),
      'source attribution remains on the tracked installation',
    );
    assert.ok(text().includes(`${d.repoUninstall}: alpha`));
    await writeFile(join(ui.root, 'noop'), '');
  });
}

for (const language of ['en', 'ar']) {
  test(`registered ${language} UI forgets an invalid-root install record after confirmation without touching files`, async (t) => {
    const ui = await mount(t, language);
    const { d } = ui;
    const source = join(ui.root, 'upstream');
    await gitRepo(source, { 'skills/alpha/SKILL.md': skillDoc('alpha') });
    const view = await ui.render();
    const u = ui.tools(view);
    await ui.act2(() =>
      u.field(d.scope).props.onChange({ target: { value: 'repositories' } }),
    );
    await ui.act2(() =>
      u.field(d.repoUrl).props.onChange({ target: { value: source } }),
    );
    await ui.act2(() =>
      u.field(d.repoRef).props.onChange({ target: { value: 'main' } }),
    );
    await ui.act2(() =>
      u
        .field(d.repoSubdirectory)
        .props.onChange({ target: { value: 'skills' } }),
    );
    await ui.act2(() => u.form().props.onSubmit({ preventDefault() {} }));
    await ui.act2(() => u.button(`${d.repoInstall}: alpha`).props.onClick());
    assert.ok(u.text().includes(d['repoStatus.installed']));
    assert.equal(u.button(`${d.repoForget}: alpha`), undefined);
    // The configured destination moves: the record now points at a different root.
    const file = join(ui.root, 'state', 'repositories.json');
    const state = JSON.parse(await readFile(file, 'utf8'));
    state.installs[0].root = join(ui.root, 'elsewhere');
    await writeFile(file, JSON.stringify(state));
    await ui.act2(() =>
      u.button(`${d.repoRefresh}: ${source}`).props.onClick(),
    );
    assert.ok(u.text().includes(d['repoStatus.invalid-root']));
    assert.equal(u.button(`${d.repoUninstall}: alpha`), undefined);
    await ui.act2(() => u.button(`${d.repoForget}: alpha`).props.onClick());
    assert.ok(u.text().includes(d.repoConfirmForget));
    await ui.act2(() => u.button(`${d.cancel}: alpha`).props.onClick());
    assert.ok(!u.text().includes(d.repoConfirmForget));
    assert.ok(u.text().includes(d['repoStatus.invalid-root']));
    await ui.act2(() => u.button(`${d.repoForget}: alpha`).props.onClick());
    await ui.act2(() =>
      u.button(`${d.repoConfirmForgetYes}: alpha`).props.onClick(),
    );
    assert.ok(u.text().includes(d.repoNoInstalls));
    assert.ok((await lstat(join(ui.root, 'skills', 'alpha'))).isDirectory());
  });
}
