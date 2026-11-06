// #153 assembled registered EN/AR client against the registered host and real local fixtures.
import assert from 'node:assert/strict';
import {
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
  lstat,
  symlink,
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
              getSnapshot: () => ({ activePanelId: 'waycraft-skills' }),
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
      if (label?.startsWith('waycraft-skills')) cleanups.push(start());
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
      u.field(d.scope).props.onChange({ target: { value: 'discover' } }),
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
      u.field(d.scope).props.onChange({ target: { value: 'discover' } }),
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
      u.field(d.scope).props.onChange({ target: { value: 'discover' } }),
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
      u.field(d.scope).props.onChange({ target: { value: 'discover' } }),
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

// #154 update preview, digest-bound apply, overwrite consent, stale preview and rollback in the assembled client.
for (const language of ['en', 'ar']) {
  test(`registered ${language} repository UI previews and applies updates with consent, reports stale previews and rolls back`, async (t) => {
    const ui = await mount(t, language);
    const { d } = ui;
    for (const key of [
      'repoStatus.update',
      'repoUpdatePreview',
      'repoRollbackPreview',
      'repoApplyUpdate',
      'repoApplyRollback',
      'repoOverwrite',
      'repoChange.added',
      'repoChange.removed',
      'repoChange.modified',
      'code.repo-preview-stale',
      'code.repo-local-modified',
      'code.repo-recovery',
    ])
      assert.ok(d[key], key);
    const source = join(ui.root, 'upstream');
    await gitRepo(source, {
      'skills/alpha/SKILL.md': skillDoc('alpha'),
      'skills/alpha/notes.md': 'v1',
    });
    const view = await ui.render();
    const u = ui.tools(view);
    const text = () => u.text();
    const change = (target) =>
      ui.act2(() =>
        u.field(d.scope).props.onChange({ target: { value: target } }),
      );
    await change('discover');
    for (const [field, value] of [
      [d.repoUrl, source],
      [d.repoRef, 'main'],
      [d.repoSubdirectory, 'skills'],
    ])
      await ui.act2(() => u.field(field).props.onChange({ target: { value } }));
    await ui.act2(() => u.form().props.onSubmit({ preventDefault() {} }));
    await ui.act2(() => u.button(`${d.repoInstall}: alpha`).props.onClick());
    assert.ok(!u.button(`${d.repoUpdatePreview}: alpha`));
    await gitCommit(source, {
      'skills/alpha/notes.md': 'v2',
      'skills/alpha/new.md': 'added',
    });
    await ui.act2(() =>
      u.button(`${d.repoRefresh}: ${source}`).props.onClick(),
    );
    assert.ok(text().includes(d['repoStatus.update']));
    // A local edit makes the preview demand explicit consent.
    const target = join(ui.root, 'skills', 'alpha');
    await writeFile(join(target, 'notes.md'), 'local edit');
    await ui.act2(() =>
      u.button(`${d.repoUpdatePreview}: alpha`).props.onClick(),
    );
    assert.ok(text().includes(d['repoChange.added']));
    assert.ok(text().includes(d['repoChange.modified']));
    assert.ok(text().includes('new.md'));
    assert.ok(text().includes(d.repoLocalModified));
    assert.equal(u.button(`${d.repoApplyUpdate}: alpha`).props.disabled, true);
    await ui.act2(() =>
      u
        .field(`${d.repoOverwrite}: alpha`)
        .props.onChange({ target: { checked: true } }),
    );
    // The repository moves on after the preview: the stale preview is refused and nothing changes.
    await gitCommit(source, { 'skills/alpha/new.md': 'added again' });
    await ui.act2(() =>
      u.button(`${d.repoRefresh}: ${source}`).props.onClick(),
    );
    await ui.act2(() =>
      u.button(`${d.repoApplyUpdate}: alpha`).props.onClick(),
    );
    assert.ok(text().includes(d['code.repo-preview-stale']));
    assert.equal(
      await readFile(join(target, 'notes.md'), 'utf8'),
      'local edit',
    );
    // Fresh preview, consent, apply.
    await ui.act2(() =>
      u.button(`${d.repoUpdatePreview}: alpha`).props.onClick(),
    );
    await ui.act2(() =>
      u
        .field(`${d.repoOverwrite}: alpha`)
        .props.onChange({ target: { checked: true } }),
    );
    await ui.act2(() =>
      u.button(`${d.repoApplyUpdate}: alpha`).props.onClick(),
    );
    assert.equal(await readFile(join(target, 'notes.md'), 'utf8'), 'v2');
    assert.equal(await readFile(join(target, 'new.md'), 'utf8'), 'added again');
    assert.ok(
      text().includes(d.repoUpdated.replace('{name}', 'alpha')),
      'update success is announced',
    );
    assert.ok(
      view.root.findAll(
        (x) =>
          x.type === 'p' &&
          x.props.role === 'status' &&
          x.children
            .join('')
            .includes(d.repoUpdated.replace('{name}', 'alpha')),
      ).length,
      'the success message is a role=status region',
    );
    assert.ok(!u.button(`${d.repoUpdatePreview}: alpha`));
    // Roll back to the previous version (which includes the local edit).
    await ui.act2(() =>
      u.button(`${d.repoRollbackPreview}: alpha`).props.onClick(),
    );
    assert.ok(text().includes(d['repoChange.removed']));
    await ui.act2(() =>
      u
        .field(`${d.repoOverwrite}: alpha`)
        ?.props.onChange({ target: { checked: true } }),
    );
    await ui.act2(() =>
      u.button(`${d.repoApplyRollback}: alpha`).props.onClick(),
    );
    assert.equal(
      await readFile(join(target, 'notes.md'), 'utf8'),
      'local edit',
    );
    await assert.rejects(lstat(join(target, 'new.md')));
    assert.ok(text().includes(d['repoStatus.modified']));
    assert.ok(
      text().includes(d.repoRolledBack.replace('{name}', 'alpha')),
      'rollback success is announced',
    );
  });
}

for (const language of ['en', 'ar']) {
  test(`registered ${language} repository UI shows update availability on modified rows, filters them, names the preview, wraps paths and surfaces removed upstream skills`, async (t) => {
    const ui = await mount(t, language);
    const { d } = ui;
    for (const key of [
      'repoApplying',
      'repoUpdated',
      'repoRolledBack',
      'repoTrackedHint',
      'repoUpstream',
    ]) {
      assert.ok(d[key], key);
      assert.notEqual(
        ui.dictionaries.en[key],
        ui.dictionaries.ar[key],
        `${key} is translated`,
      );
    }
    const source = join(ui.root, 'upstream');
    await gitRepo(source, {
      'skills/alpha/SKILL.md': skillDoc('alpha'),
      'skills/alpha/notes.md': 'v1',
    });
    const view = await ui.render();
    const u = ui.tools(view);
    const text = () => u.text();
    await ui.act2(() =>
      u.field(d.scope).props.onChange({ target: { value: 'discover' } }),
    );
    for (const [field, value] of [
      [d.repoUrl, source],
      [d.repoRef, 'main'],
      [d.repoSubdirectory, 'skills'],
    ])
      await ui.act2(() => u.field(field).props.onChange({ target: { value } }));
    await ui.act2(() => u.form().props.onSubmit({ preventDefault() {} }));
    await ui.act2(() => u.button(`${d.repoInstall}: alpha`).props.onClick());
    const target = join(ui.root, 'skills', 'alpha');
    // Locally edited AND an update is available: both are visible and the filter still finds it.
    await writeFile(join(target, 'notes.md'), 'local edit');
    await gitCommit(source, { 'skills/alpha/notes.md': 'v2' });
    await ui.act2(() =>
      u.button(`${d.repoRefresh}: ${source}`).props.onClick(),
    );
    const article = () =>
      view.root.findAll(
        (x) => x.type === 'article' && x.props['data-waycraft-repo-install'],
      )[0];
    const flat = (node) =>
      typeof node === 'string'
        ? node
        : (node?.children ?? []).map(flat).join('');
    const articleText = () => flat(article());
    assert.ok(articleText().includes(d['repoStatus.modified']));
    assert.ok(
      articleText().includes(d['repoStatus.update']),
      'a modified copy with an update shows Update available on its row',
    );
    await ui.act2(() =>
      u
        .field(d.repoStatusFilter)
        .props.onChange({ target: { value: 'update' } }),
    );
    const skillRows = () =>
      view.root.findAll(
        (x) => x.type === 'div' && x.props['data-waycraft-repo-skill'],
      );
    assert.equal(
      skillRows().length,
      1,
      'the update filter keeps the modified install that has an update',
    );
    await ui.act2(() =>
      u.field(d.repoStatusFilter).props.onChange({ target: { value: '' } }),
    );
    // Preview: accessible name, LTR-isolated paths, tracked-attribute hint.
    await ui.act2(() =>
      u.button(`${d.repoUpdatePreview}: alpha`).props.onClick(),
    );
    const group = view.root.findAll((x) => x.props?.role === 'group')[0];
    const labelledBy = group.props['aria-labelledby'];
    assert.ok(labelledBy);
    assert.ok(
      view.root.findAll((x) => x.props?.id === labelledBy).length,
      'the group is named by its heading',
    );
    assert.ok(
      view.root.findAll(
        (x) =>
          x.type === 'bdi' &&
          x.props.dir === 'ltr' &&
          x.children.join('') === 'notes.md',
      ).length,
      'file paths are LTR-isolated',
    );
    assert.ok(text().includes(d.repoTrackedHint));
    // Removing the skill upstream is reported on the installed row.
    await rm(join(source, 'skills', 'alpha'), { recursive: true });
    await gitCommit(source, { 'skills/other/SKILL.md': skillDoc('other') });
    await ui.act2(() =>
      u.button(`${d.repoRefresh}: ${source}`).props.onClick(),
    );
    assert.ok(
      articleText().includes(d['code.repo-skill-missing']),
      'a removed upstream skill is surfaced on the install row',
    );
  });
}

for (const language of ['en', 'ar']) {
  test(`registered ${language} repository UI renders update/rollback failure states (local-unsafe is real; the others are injected host responses)`, async (t) => {
    const ui = await mount(t, language);
    const { d } = ui;
    const source = join(ui.root, 'upstream');
    await gitRepo(source, {
      'skills/alpha/SKILL.md': skillDoc('alpha'),
      'skills/alpha/notes.md': 'v1',
    });
    const view = await ui.render();
    const u = ui.tools(view);
    const text = () => u.text();
    await ui.act2(() =>
      u.field(d.scope).props.onChange({ target: { value: 'discover' } }),
    );
    for (const [field, value] of [
      [d.repoUrl, source],
      [d.repoRef, 'main'],
      [d.repoSubdirectory, 'skills'],
    ])
      await ui.act2(() => u.field(field).props.onChange({ target: { value } }));
    await ui.act2(() => u.form().props.onSubmit({ preventDefault() {} }));
    await ui.act2(() => u.button(`${d.repoInstall}: alpha`).props.onClick());
    await gitCommit(source, { 'skills/alpha/notes.md': 'v2' });
    await ui.act2(() =>
      u.button(`${d.repoRefresh}: ${source}`).props.onClick(),
    );
    const target = join(ui.root, 'skills', 'alpha');
    // Real host error: a link inside the installed copy is not safe to compare or replace.
    await symlink(join(ui.root, 'elsewhere'), join(target, 'link'));
    await ui.act2(() =>
      u.button(`${d.repoUpdatePreview}: alpha`).props.onClick(),
    );
    assert.ok(text().includes(d['code.repo-local-unsafe']));
    await rm(join(target, 'link'));
    // Injected responses: the rollback button is hidden without a backup, so these are simulated races.
    await ui.act2(() =>
      u.button(`${d.repoUpdatePreview}: alpha`).props.onClick(),
    );
    ui.hooks.fail = (action) =>
      action === 'repo-update'
        ? { status: 409, body: { code: 'repo-local-modified' } }
        : undefined;
    await ui.act2(() =>
      u.button(`${d.repoApplyUpdate}: alpha`).props.onClick(),
    );
    assert.ok(text().includes(d['code.repo-local-modified']));
    ui.hooks.fail = (action) =>
      action === 'repo-update'
        ? {
            status: 500,
            body: { code: 'repo-recovery', params: { recovery: '/kept/copy' } },
          }
        : undefined;
    await ui.act2(() =>
      u.button(`${d.repoApplyUpdate}: alpha`).props.onClick(),
    );
    assert.ok(
      text().includes(
        d['code.repo-recovery'].replace('{recovery}', '/kept/copy'),
      ),
      'the recovery location is substituted into the message',
    );
    assert.ok(!text().includes('{recovery}'));
    ui.hooks.fail = (action) =>
      action === 'repo-update-preview'
        ? { status: 409, body: { code: 'repo-no-backup' } }
        : undefined;
    await ui.act2(() =>
      u.button(`${d.repoUpdatePreview}: alpha`).props.onClick(),
    );
    assert.ok(text().includes(d['code.repo-no-backup']));
    ui.hooks.fail = undefined;
  });
}
