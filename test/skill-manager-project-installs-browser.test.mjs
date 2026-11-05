// #156 assembled registered EN/AR UI: repository and catalog installs into registered project DSH scopes.
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
import {
  archiveServer,
  gitCommit,
  gitRepo,
  skillDoc,
} from './skill-manager-repos-fixtures.mjs';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const code = await readFile(
  new URL('../dist/client.js', import.meta.url),
  'utf8',
);

// `layout` overrides project folders (relative to the temp root); `missing` registers a folder that does not exist.
async function mount(t, language, server, { layout, missing } = {}) {
  const root = await realpath(
    await mkdtemp(join(tmpdir(), 'waycraft-repo-ui-')),
  );
  t.after(() => rm(root, { recursive: true, force: true }));
  const projects = layout
    ? Object.fromEntries(
        Object.entries(layout).map(([key, rel]) => [key, join(root, rel)]),
      )
    : { a: join(root, 'proj-a'), b: join(root, 'proj-b') };
  for (const dir of Object.values(projects))
    await mkdir(join(dir, '.git'), { recursive: true });
  const registered = [
    ...Object.values(projects),
    ...(missing ? [join(root, missing)] : []),
  ];
  const registry = { list: () => registered.map((path) => ({ path })) };
  let hostRoute;
  const stops = [];
  applyHost(
    {
      skills: { registerProvider: () => () => {} },
      effect(start) {
        stops.push(start());
      },
      get: (name) => (name === 'workspaceRegistry' ? registry : undefined),
      inject(_, callback) {
        callback({
          effect(start) {
            stops.push(start());
          },
          get: (name) =>
            name === 'workspaceRegistry'
              ? registry
              : {
                  fetch: {
                    register(route) {
                      hostRoute = route;
                      return () => {};
                    },
                  },
                },
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
      view.root.findAllByType('button').find(
        (x) =>
          x.children.join('') === label ||
          x.props['aria-label'] === label ||
          // Per-copy buttons append their destination: `<label> — <destination>`.
          x.props['aria-label']?.startsWith(`${label} — `),
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
    projects,
    registered,
    d: dictionaries[language],
    dictionaries,
    hooks,
    render,
    tools,
    act2,
  };
}

const item = (n) => ({
  ownerHandle: 'acme',
  slug: n,
  displayName: `Skill ${n}`,
  summary: `About ${n}`,
  stats: { downloads: 10, installs: 2, stars: 1 },
});
const flat = (node) =>
  typeof node === 'string'
    ? node
    : (node?.children ?? []).map((child) => flat(child)).join('');
const exists = (p) =>
  lstat(p).then(
    () => true,
    () => false,
  );
const send = (res, value, type = 'application/json') => {
  res.writeHead(200, { 'content-type': type });
  res.end(
    typeof value === 'string' || Buffer.isBuffer(value)
      ? value
      : JSON.stringify(value),
  );
};
const stub = () =>
  archiveServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/api/v1/skills')
      return send(res, { items: [item('alpha')], nextCursor: null });
    if (url.pathname === '/api/v1/download')
      return send(
        res,
        Buffer.from(
          zipSync({ 'SKILL.md': Buffer.from(skillDoc('alpha', 'Alpha desc')) }),
        ),
        'application/zip',
      );
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end('{}');
  });

for (const language of ['en', 'ar']) {
  test(`registered ${language} catalog UI installs into project DSH scopes through the destination picker and manages each copy`, async (t) => {
    const server = await stub();
    t.after(() => server.close());
    const ui = await mount(t, language, server);
    const { d } = ui;
    for (const key of ['repoInstalledAt'])
      assert.ok(d[key] && ui.dictionaries.en[key] !== ui.dictionaries.ar[key]);
    const view = await ui.render();
    const u = ui.tools(view);
    const text = () => u.text();
    await ui.act2(() =>
      u.field(d.scope).props.onChange({ target: { value: 'discover' } }),
    );
    await ui.act2(() => u.button(d.catSourceClawhub).props.onClick());
    await ui.act2(() =>
      u.button(`${d.catInstall}: Skill alpha`).props.onClick(),
    );
    // The picker lists the user destinations and each registered project's DSH folder.
    const picker = u.field(d.repoDestination);
    const values = picker.findAllByType('option').map((x) => x.props.value);
    const ids = {};
    for (const value of values)
      if (value.startsWith('project-dsh:')) ids[value] = value.slice(12);
    assert.equal(values.length, 4);
    assert.deepEqual(values.slice(0, 2), ['user-dsh', 'user-agents']);
    const [pa, pb] = values.slice(2);
    assert.ok(
      picker
        .findAllByType('option')
        .some((x) => x.children.join('') === 'proj-a — DSH'),
    );
    await ui.act2(() => picker.props.onChange({ target: { value: pa } }));
    await ui.act2(() => u.button(d.catInstallConfirm).props.onClick());
    assert.equal(
      await exists(join(ui.projects.a, '.dsh', 'skills', 'alpha', 'SKILL.md')),
      true,
    );
    assert.equal(await exists(join(ui.root, 'skills', 'alpha')), false);
    assert.equal(await exists(join(ui.projects.b, '.dsh', 'skills')), false);
    assert.ok(text().includes('proj-a — DSH'));
    // Same skill again, now into the second project and the user scope.
    await ui.act2(() =>
      u.button(`${d.catInstallElsewhere}: Skill alpha`).props.onClick(),
    );
    await ui.act2(() =>
      u.field(d.repoDestination).props.onChange({ target: { value: pb } }),
    );
    await ui.act2(() => u.button(d.catInstallConfirm).props.onClick());
    await ui.act2(() =>
      u.button(`${d.catInstallElsewhere}: Skill alpha`).props.onClick(),
    );
    await ui.act2(() =>
      u
        .field(d.repoDestination)
        .props.onChange({ target: { value: 'user-dsh' } }),
    );
    await ui.act2(() => u.button(d.catInstallConfirm).props.onClick());
    for (const dir of [
      join(ui.projects.b, '.dsh', 'skills', 'alpha'),
      join(ui.root, 'skills', 'alpha'),
    ])
      assert.equal(await exists(join(dir, 'SKILL.md')), true);
    assert.equal(
      view.root.findAll((x) => x.props?.['data-majed-catalog-copy']).length,
      3,
    );
    // Uninstalling the project-a copy confirms the destination and project, and leaves the others.
    const copyRow = (name) =>
      view.root
        .findAll((x) => x.props?.['data-majed-catalog-copy'])
        .find((x) => flat(x).includes(name));
    await ui.act2(() =>
      copyRow('proj-a — DSH').findAllByType('button')[0].props.onClick(),
    );
    assert.ok(text().includes(d.catUninstallTitle));
    assert.ok(text().includes('proj-a — DSH'));
    assert.ok(text().includes(join(ui.projects.a, '.dsh', 'skills')));
    assert.ok(
      view.root.findAllByType('bdi').some((x) => x.props.dir === 'ltr'),
    );
    await ui.act2(() => u.button(d.catConfirmUninstall).props.onClick());
    assert.equal(
      await exists(join(ui.projects.a, '.dsh', 'skills', 'alpha')),
      false,
    );
    assert.equal(
      await exists(join(ui.projects.b, '.dsh', 'skills', 'alpha', 'SKILL.md')),
      true,
    );
    assert.equal(
      await exists(join(ui.root, 'skills', 'alpha', 'SKILL.md')),
      true,
    );
    assert.ok(text().includes(d['catStatus.trashed']));
    // A project that leaves the registry is unavailable: no picker entry, copy shown as unavailable, forgettable.
    ui.registered.splice(1, 1);
    await ui.act2(() => u.button(d.catSourceSkillsh).props.onClick());
    await ui.act2(() => u.button(d.catSourceClawhub).props.onClick());
    await ui.act2(() =>
      u.field(d.scope).props.onChange({ target: { value: 'global' } }),
    );
    await ui.act2(() =>
      u.field(d.scope).props.onChange({ target: { value: 'discover' } }),
    );
    await ui.act2(() => u.button(d.catSourceClawhub).props.onClick());
    assert.ok(text().includes(d['catStatus.invalid-root']));
    await ui.act2(() =>
      u.button(`${d.catInstallElsewhere}: Skill alpha`).props.onClick(),
    );
    assert.equal(
      u
        .field(d.repoDestination)
        .findAllByType('option')
        .some((x) => x.props.value === pb),
      false,
    );
    await ui.act2(() => u.button(d.cancel).props.onClick());
    await ui.act2(() =>
      u.button(`${d.catForget}: Skill alpha`).props.onClick(),
    );
    // The registry no longer names the project; the record still shows its selector id and folder.
    assert.ok(text().includes(pb.slice(12)));
    assert.ok(text().includes(join(ui.projects.b, '.dsh', 'skills')));
    await ui.act2(() => u.button(d.catConfirmForget).props.onClick());
    assert.equal(
      await exists(join(ui.projects.b, '.dsh', 'skills', 'alpha', 'SKILL.md')),
      true,
    );
    assert.ok(!text().includes(d['catStatus.invalid-root']));
  });

  test(`registered ${language} repository UI installs into project DSH scopes, shows destinations, updates and uninstalls without crossing scopes`, async (t) => {
    const server = await stub();
    t.after(() => server.close());
    const ui = await mount(t, language, server);
    const { d } = ui;
    const source = join(ui.root, 'upstream');
    await gitRepo(source, {
      'skills/alpha/SKILL.md': skillDoc('alpha'),
      'skills/alpha/data.bin': Buffer.from([1, 2, 3]),
    });
    const view = await ui.render();
    const u = ui.tools(view);
    const text = () => u.text();
    await ui.act2(() =>
      u.field(d.scope).props.onChange({ target: { value: 'discover' } }),
    );
    await ui.act2(() =>
      u.field(d.repoUrl).props.onChange({ target: { value: source } }),
    );
    await ui.act2(() =>
      u
        .field(d.repoSubdirectory)
        .props.onChange({ target: { value: 'skills' } }),
    );
    await ui.act2(() => u.form().props.onSubmit({ preventDefault() {} }));
    const picker = u.field(d.repoDestination);
    const values = picker.findAllByType('option').map((x) => x.props.value);
    assert.equal(values.length, 4);
    const [pa, pb] = values.slice(2);
    await ui.act2(() => picker.props.onChange({ target: { value: pa } }));
    await ui.act2(() => u.button(`${d.repoInstall}: alpha`).props.onClick());
    assert.equal(
      await exists(join(ui.projects.a, '.dsh', 'skills', 'alpha', 'SKILL.md')),
      true,
    );
    assert.equal(await exists(join(ui.root, 'skills', 'alpha')), false);
    // Installed there: the same destination offers no second install, other destinations still do.
    assert.equal(u.button(`${d.repoInstall}: alpha`), undefined);
    await ui.act2(() =>
      u.field(d.repoDestination).props.onChange({ target: { value: pb } }),
    );
    assert.ok(u.button(`${d.repoInstall}: alpha`));
    await ui.act2(() => u.button(`${d.repoInstall}: alpha`).props.onClick());
    await ui.act2(() =>
      u
        .field(d.repoDestination)
        .props.onChange({ target: { value: 'user-dsh' } }),
    );
    await ui.act2(() => u.button(`${d.repoInstall}: alpha`).props.onClick());
    const rows = view.root.findAll((x) => x.props?.['data-majed-repo-install']);
    assert.equal(rows.length, 3);
    assert.ok(
      text().includes('proj-a — DSH') && text().includes('proj-b — DSH'),
    );
    assert.ok(text().includes(d.repoInstalledAt));
    // Upstream change: update the project-b copy only.
    await gitCommit(source, { 'skills/alpha/data.bin': Buffer.from([9, 9]) });
    await ui.act2(() =>
      u.button(`${d.repoRefresh}: ${source}`).props.onClick(),
    );
    const rowOf = (name) =>
      view.root
        .findAll((x) => x.props?.['data-majed-repo-install'])
        .find((x) => flat(x).includes(name));
    const act = async (name, label) => {
      const button = rowOf(name)
        .findAllByType('button')
        .find((x) => x.props['aria-label'] === `${label}: alpha`);
      await ui.act2(() => button.props.onClick());
    };
    await act('proj-b — DSH', d.repoUpdatePreview);
    await act('proj-b — DSH', d.repoApplyUpdate);
    const bin = (dir) => readFile(join(dir, 'alpha', 'data.bin'));
    assert.deepEqual(
      [...(await bin(join(ui.projects.b, '.dsh', 'skills')))],
      [9, 9],
    );
    assert.deepEqual(
      [...(await bin(join(ui.projects.a, '.dsh', 'skills')))],
      [1, 2, 3],
    );
    assert.deepEqual([...(await bin(join(ui.root, 'skills')))], [1, 2, 3]);
    // Uninstall the project-a copy: the other two copies stay.
    await act('proj-a — DSH', d.repoUninstall);
    assert.equal(
      await exists(join(ui.projects.a, '.dsh', 'skills', 'alpha')),
      false,
    );
    assert.equal(await exists(join(ui.root, 'skills', 'alpha')), true);
    assert.equal(
      await exists(join(ui.projects.b, '.dsh', 'skills', 'alpha')),
      true,
    );
    // Project b leaves the registry: its copy is reported unavailable and can be forgotten (record only).
    ui.registered.splice(1, 1);
    await ui.act2(() =>
      u.field(d.scope).props.onChange({ target: { value: 'global' } }),
    );
    await ui.act2(() =>
      u.field(d.scope).props.onChange({ target: { value: 'discover' } }),
    );
    assert.ok(text().includes(d['repoStatus.invalid-root']));
    assert.equal(
      u
        .field(d.repoDestination)
        .findAllByType('option')
        .some((x) => x.props.value === pb),
      false,
    );
    await act(pb.slice(12), d.repoForget);
    await ui.act2(() =>
      u.button(`${d.repoConfirmForgetYes}: alpha`).props.onClick(),
    );
    assert.ok(!text().includes(d['repoStatus.invalid-root']));
    assert.equal(
      await exists(join(ui.projects.b, '.dsh', 'skills', 'alpha', 'SKILL.md')),
      true,
    );
    assert.equal(
      await exists(join(ui.root, 'skills', 'alpha', 'SKILL.md')),
      true,
    );
  });
}

const option = (picker, value) =>
  picker.findAllByType('option').find((x) => x.props.value === value);
const projectValues = (picker) =>
  picker
    .findAllByType('option')
    .map((x) => x.props.value)
    .filter((value) => value.startsWith('project-dsh:'));

for (const language of ['en', 'ar']) {
  test(`registered ${language} UI disambiguates projects with the same folder name in pickers, copy rows, confirmations and aria-labels`, async (t) => {
    const server = await stub();
    t.after(() => server.close());
    const ui = await mount(t, language, server, {
      layout: { a: 'one/app', b: 'two/app' },
    });
    const { d } = ui;
    const view = await ui.render();
    const u = ui.tools(view);
    const text = () => u.text();
    await ui.act2(() =>
      u.field(d.scope).props.onChange({ target: { value: 'discover' } }),
    );
    await ui.act2(() => u.button(d.catSourceClawhub).props.onClick());
    await ui.act2(() =>
      u.button(`${d.catInstall}: Skill alpha`).props.onClick(),
    );
    const picker = u.field(d.repoDestination);
    const [pa, pb] = projectValues(picker);
    const labels = [pa, pb].map((value) =>
      option(picker, value).children.join(''),
    );
    assert.deepEqual(labels, ['app (one) — DSH', 'app (two) — DSH']);
    // The project id stays the selector value; the label is display only.
    assert.match(pa, /^project-dsh:[0-9a-f]{16}$/);
    // Selecting a project previews its real folder and the commit-visibility note.
    await ui.act2(() => picker.props.onChange({ target: { value: pa } }));
    const folderA = join(ui.projects.a, '.dsh', 'skills');
    const folderB = join(ui.projects.b, '.dsh', 'skills');
    assert.ok(text().includes(d.destPath));
    assert.ok(text().includes(folderA) && !text().includes(folderB));
    assert.ok(text().includes(d.destProjectNote));
    assert.ok(
      view.root
        .findAllByType('bdi')
        .some((x) => x.props.dir === 'ltr' && flat(x) === folderA),
    );
    await ui.act2(() => u.button(d.catInstallConfirm).props.onClick());
    await ui.act2(() =>
      u.button(`${d.catInstallElsewhere}: Skill alpha`).props.onClick(),
    );
    await ui.act2(() =>
      u.field(d.repoDestination).props.onChange({ target: { value: pb } }),
    );
    // The preview shows exactly the selected folder (the copy row above lists `<folder>/alpha`).
    const previews = view.root
      .findAllByType('bdi')
      .map((x) => flat(x))
      .filter((value) => value === folderA || value === folderB);
    assert.deepEqual(previews, [folderB]);
    await ui.act2(() => u.button(d.catInstallConfirm).props.onClick());
    const rows = view.root.findAll((x) => x.props?.['data-majed-catalog-copy']);
    assert.equal(rows.length, 2);
    const rowTexts = rows.map((row) => flat(row));
    assert.ok(rowTexts[0].includes('app (one) — DSH'));
    assert.ok(rowTexts[1].includes('app (two) — DSH'));
    assert.equal(new Set(rowTexts).size, 2);
    // Copy rows wrap the destination name for RTL; per-copy buttons name their destination.
    for (const row of rows)
      assert.ok(
        row
          .findAllByType('bdi')
          .some((x) => x.props.dir === 'ltr' && flat(x).endsWith(' — DSH')),
      );
    const labelsOf = rows.map(
      (row) => row.findAllByType('button')[0].props['aria-label'],
    );
    assert.deepEqual(labelsOf, [
      `${d.catUninstall}: Skill alpha — app (one) — DSH`,
      `${d.catUninstall}: Skill alpha — app (two) — DSH`,
    ]);
    // The confirm dialog names the second project and acts on exactly it.
    await ui.act2(() => rows[1].findAllByType('button')[0].props.onClick());
    assert.ok(text().includes('app (two) — DSH'));
    assert.ok(text().includes(folderB));
    const confirmBdis = view.root
      .findAllByType('bdi')
      .map((x) => flat(x))
      .join('|');
    assert.ok(confirmBdis.includes('app (two) — DSH'));
    await ui.act2(() => u.button(d.catConfirmUninstall).props.onClick());
    assert.equal(await exists(join(folderB, 'alpha')), false);
    assert.equal(await exists(join(folderA, 'alpha', 'SKILL.md')), true);
  });

  test(`registered ${language} repository UI offers every project, disables unavailable ones with a reason and keeps Install gated on a valid destination`, async (t) => {
    const server = await stub();
    t.after(() => server.close());
    const ui = await mount(t, language, server, { missing: 'gone' });
    const { d } = ui;
    for (const key of [
      'destPath',
      'destInvalid',
      'destNoProjects',
      'destProjectNote',
    ])
      assert.ok(d[key] && ui.dictionaries.en[key] !== ui.dictionaries.ar[key]);
    const source = join(ui.root, 'upstream');
    await gitRepo(source, { 'skills/alpha/SKILL.md': skillDoc('alpha') });
    const view = await ui.render();
    const u = ui.tools(view);
    const text = () => u.text();
    await ui.act2(() =>
      u.field(d.scope).props.onChange({ target: { value: 'discover' } }),
    );
    await ui.act2(() =>
      u.field(d.repoUrl).props.onChange({ target: { value: source } }),
    );
    await ui.act2(() =>
      u
        .field(d.repoSubdirectory)
        .props.onChange({ target: { value: 'skills' } }),
    );
    await ui.act2(() => u.form().props.onSubmit({ preventDefault() {} }));
    const picker = () => u.field(d.repoDestination);
    // The default destination is the user DSH folder; Install is enabled there.
    assert.equal(picker().props.value, 'user-dsh');
    assert.equal(u.button(`${d.repoInstall}: alpha`).props.disabled, false);
    assert.ok(!text().includes(d.destProjectNote));
    // The unavailable registered project is listed greyed out with its reason.
    const values = picker()
      .findAllByType('option')
      .map((x) => x.props.value);
    assert.equal(values.length, 5);
    const disabled = picker()
      .findAllByType('option')
      .filter((x) => x.props.disabled);
    assert.equal(disabled.length, 1);
    assert.ok(
      disabled[0].children.join('').includes(d['code.project-missing']),
    );
    assert.ok(disabled[0].children.join('').includes('gone'));
    // Forcing the greyed value (no real browser would allow it) leaves Install disabled and explains why.
    await ui.act2(() =>
      picker().props.onChange({ target: { value: disabled[0].props.value } }),
    );
    assert.equal(u.button(`${d.repoInstall}: alpha`).props.disabled, true);
    assert.ok(text().includes(d.destInvalid));
    await ui.act2(() => u.button(`${d.repoInstall}: alpha`).props.onClick());
    assert.equal(await exists(join(ui.root, 'skills', 'alpha')), false);
    // A real project shows its folder, the note, and an enabled Install.
    const pa = projectValues(picker()).find(
      (value) => !option(picker(), value).props.disabled,
    );
    await ui.act2(() => picker().props.onChange({ target: { value: pa } }));
    assert.equal(u.button(`${d.repoInstall}: alpha`).props.disabled, false);
    assert.ok(text().includes(join(ui.projects.a, '.dsh', 'skills')));
    assert.ok(text().includes(d.destProjectNote));
    // The selected project leaves the registry: the picker value resets to the default.
    ui.registered.splice(ui.registered.indexOf(ui.projects.a), 1);
    await ui.act2(() =>
      u.field(d.scope).props.onChange({ target: { value: 'global' } }),
    );
    await ui.act2(() =>
      u.field(d.scope).props.onChange({ target: { value: 'discover' } }),
    );
    assert.equal(picker().props.value, 'user-dsh');
    assert.equal(u.button(`${d.repoInstall}: alpha`).props.disabled, false);
  });

  test(`registered ${language} UI shows an empty-projects hint and only user destinations when no project is registered`, async (t) => {
    const server = await stub();
    t.after(() => server.close());
    const ui = await mount(t, language, server);
    const { d } = ui;
    ui.registered.splice(0);
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
      u
        .field(d.repoSubdirectory)
        .props.onChange({ target: { value: 'skills' } }),
    );
    await ui.act2(() => u.form().props.onSubmit({ preventDefault() {} }));
    assert.deepEqual(
      u
        .field(d.repoDestination)
        .findAllByType('option')
        .map((x) => x.props.value),
      ['user-dsh', 'user-agents'],
    );
    assert.ok(u.text().includes(d.destNoProjects));
    assert.equal(u.button(`${d.repoInstall}: alpha`).props.disabled, false);
  });

  test(`registered ${language} repository UI updates and rolls back one project copy through the UI`, async (t) => {
    const server = await stub();
    t.after(() => server.close());
    const ui = await mount(t, language, server);
    const { d } = ui;
    const source = join(ui.root, 'upstream');
    await gitRepo(source, {
      'skills/alpha/SKILL.md': skillDoc('alpha'),
      'skills/alpha/notes.md': 'v1',
    });
    const view = await ui.render();
    const u = ui.tools(view);
    await ui.act2(() =>
      u.field(d.scope).props.onChange({ target: { value: 'discover' } }),
    );
    await ui.act2(() =>
      u.field(d.repoUrl).props.onChange({ target: { value: source } }),
    );
    await ui.act2(() =>
      u
        .field(d.repoSubdirectory)
        .props.onChange({ target: { value: 'skills' } }),
    );
    await ui.act2(() => u.form().props.onSubmit({ preventDefault() {} }));
    const [pa] = projectValues(u.field(d.repoDestination));
    await ui.act2(() =>
      u.field(d.repoDestination).props.onChange({ target: { value: pa } }),
    );
    await ui.act2(() => u.button(`${d.repoInstall}: alpha`).props.onClick());
    await ui.act2(() =>
      u
        .field(d.repoDestination)
        .props.onChange({ target: { value: 'user-dsh' } }),
    );
    await ui.act2(() => u.button(`${d.repoInstall}: alpha`).props.onClick());
    const inProject = join(ui.projects.a, '.dsh', 'skills', 'alpha');
    const global = join(ui.root, 'skills', 'alpha');
    await gitCommit(source, { 'skills/alpha/notes.md': 'v2' });
    await ui.act2(() =>
      u.button(`${d.repoRefresh}: ${source}`).props.onClick(),
    );
    const rowOf = (name) =>
      view.root
        .findAll((x) => x.props?.['data-majed-repo-install'])
        .find((x) => flat(x).includes(name));
    const press = async (name, label) =>
      ui.act2(() =>
        rowOf(name)
          .findAllByType('button')
          .find((x) => x.props['aria-label'] === `${label}: alpha`)
          .props.onClick(),
      );
    await press('proj-a — DSH', d.repoUpdatePreview);
    await press('proj-a — DSH', d.repoApplyUpdate);
    assert.equal(await readFile(join(inProject, 'notes.md'), 'utf8'), 'v2');
    assert.equal(await readFile(join(global, 'notes.md'), 'utf8'), 'v1');
    // Roll back only the project copy to its previous version.
    await press('proj-a — DSH', d.repoRollbackPreview);
    await press('proj-a — DSH', d.repoApplyRollback);
    assert.equal(await readFile(join(inProject, 'notes.md'), 'utf8'), 'v1');
    assert.equal(await readFile(join(global, 'notes.md'), 'utf8'), 'v1');
    assert.ok(u.text().includes(d.repoRolledBack.replace('{name}', 'alpha')));
  });
}
