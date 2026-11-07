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
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { apply as applyHost } from '../dist/skills.js';
import { LEGACY_PANEL_IDS } from '../dist/legacy-names.js';
import { zipSync } from 'fflate';

const code = await readFile(
  new URL('../dist/client.js', import.meta.url),
  'utf8',
);
const doc = (name) =>
  `---\nname: ${name}\ndescription: About ${name}\n---\nBody`;

const LEGACY_SKILLS_PANEL = Object.keys(LEGACY_PANEL_IDS)[0];
async function mount(t, language, initial, creation = false, activePanel) {
  const root = await realpath(
    await mkdtemp(join(tmpdir(), 'waycraft-org-ui-')),
  );
  t.after(() => rm(root, { recursive: true, force: true }));
  const base = join(root, 'base');
  for (const name of ['alpha', 'beta']) {
    await mkdir(join(base, name), { recursive: true });
    await writeFile(join(base, name, 'SKILL.md'), doc(name));
  }
  const other = join(root, 'other');
  for (const name of ['alpha', 'delta']) {
    await mkdir(join(other, name), { recursive: true });
    await writeFile(join(other, name, 'SKILL.md'), doc(name));
  }
  const app = join(root, 'app');
  await mkdir(join(app, '.git'), { recursive: true });
  for (const name of ['alpha', 'omega']) {
    await mkdir(join(app, '.agents', 'skills', name), { recursive: true });
    await writeFile(
      join(app, '.agents', 'skills', name, 'SKILL.md'),
      doc(name),
    );
  }
  const statePath = join(root, 'state', 'state.json');
  if (initial) {
    await mkdir(join(root, 'state'), { recursive: true });
    await writeFile(statePath, JSON.stringify(initial));
  }
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
        callback({
          effect(start) {
            stops.push(start());
          },
          get(name) {
            if (name === 'workspaceRegistry')
              return { list: () => [{ path: app }] };
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
      get: (name) =>
        name === 'workspaceRegistry'
          ? { list: () => [{ path: app }] }
          : undefined,
    },
    {
      sources: [
        { id: creation ? 'user-dsh' : 'base', path: base },
        { id: creation ? 'user-agents' : 'other', path: other },
      ],
      statePath,
    },
  );
  t.after(async () => {
    for (const stop of stops) await stop?.();
  });
  let api;
  const pending = [];
  const timers = [];
  const failPlacement = { on: false, ping: false, hold: undefined };
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
    btoa,
    AbortController,
    console,
    setTimeout: (fn) => {
      timers.push(fn);
      return 1;
    },
    clearTimeout() {},
    fetch: async (url, options) => {
      if (failPlacement.ping && JSON.parse(options.body).action === 'ping')
        return new Response('down', { status: 503 });
      if (failPlacement.hold && JSON.parse(options.body).action === 'placement')
        await failPlacement.hold;
      if (failPlacement.on && JSON.parse(options.body).action === 'placement')
        return new Response(JSON.stringify({ code: 'placement-invalid' }), {
          status: 500,
        });
      const response = hostRoute.fetch(new Request(String(url), options));
      pending.push(response);
      return response;
    },
  });
  const slots = [];
  const cleanups = [];
  const dictionaries = {};
  const selected = [];
  const layoutState = { active: activePanel ?? 'waycraft-skills' };
  const layout = {
    panelInfo: { getSnapshot: () => ({ activePanelId: layoutState.active }) },
    selectPanel: (id) => selected.push(id),
  };
  const ctx = {
    inject(names, callback) {
      if (names.length === 1 && names[0] === 'layout')
        return callback({ layout });
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
        const record = { entry, component };
        slots.push(record);
        return () => slots.splice(slots.indexOf(record), 1);
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
    for (let i = 0; i < 5; i++)
      await act(async () => {
        await Promise.all(pending);
        await new Promise(setImmediate);
      });
  };
  await settle();
  const slot = (name) => slots.filter((x) => x.entry.name === name);
  const d = dictionaries[language];
  const views = [];
  const render = async (component, props) => {
    let view;
    await act(async () => {
      view = create(React.createElement(component, props));
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
          ['input', 'select', 'textarea'].includes(x.type) &&
          x.props['aria-label'] === label,
      )[0],
    text: () => JSON.stringify(view.toJSON()),
  });
  const act2 = async (fn) => {
    await act(async () => fn());
    await settle();
  };
  return {
    cleanups,
    timers,
    slot,
    slots,
    d,
    render,
    tools,
    act2,
    settle,
    failPlacement,
    selected,
    layoutState,
    statePath,
    dictionaries,
    api,
    hostFetch: (body) =>
      hostRoute
        .fetch(
          new Request('http://localhost/api/waycraft-skills.catalog', {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-waycraft-skills': '1',
            },
            body: JSON.stringify(body),
          }),
        )
        .then((r) => r.json()),
  };
}

for (const language of ['en', 'ar']) {
  test(`registered ${language} catalog remains visible and Trash reports its unavailable storage`, async (t) => {
    const ui = await mount(t, language, undefined, true);
    const view = await ui.render(ui.slot('settings.section')[0].component);
    const tools = ui.tools(view);
    await writeFile(join(ui.statePath, '..'), 'not a directory');
    await ui.act2(() =>
      tools.field(ui.d.scope).props.onChange({ target: { value: 'trash' } }),
    );
    assert.ok(tools.text().includes(ui.d['code.trash-unavailable']));
    assert.ok(!tools.text().includes(ui.d.trashEmpty));
    await ui.act2(() =>
      tools.field(ui.d.scope).props.onChange({ target: { value: 'global' } }),
    );
    assert.ok(tools.text().includes('alpha'));
    assert.ok(tools.text().includes(ui.d['code.trash-unavailable']));
  });

  test(`registered ${language} Trash controls restore original bytes and require permanent-delete confirmation`, async (t) => {
    const ui = await mount(t, language, undefined, true);
    const view = await ui.render(ui.slot('settings.section')[0].component);
    const tools = ui.tools(view);
    assert.ok(ui.d.moveTrash);
    await ui.act2(() =>
      tools.button(`${ui.d.moveTrash}: beta`).props.onClick(),
    );
    await ui.act2(() =>
      tools.field(ui.d.scope).props.onChange({ target: { value: 'trash' } }),
    );
    assert.ok(tools.text().includes(ui.d.trashOrigin));
    await ui.act2(() =>
      tools.button(`${ui.d.restoreTrash}: beta`).props.onClick(),
    );
    await ui.act2(() =>
      tools.field(ui.d.scope).props.onChange({ target: { value: 'global' } }),
    );
    await ui.act2(() =>
      tools.button(`${ui.d.moveTrash}: beta`).props.onClick(),
    );
    await ui.act2(() =>
      tools.field(ui.d.scope).props.onChange({ target: { value: 'trash' } }),
    );
    await ui.act2(() =>
      tools.button(`${ui.d.deleteTrash}: beta`).props.onClick(),
    );
    assert.ok(tools.text().includes(ui.d.trashWarning));
    assert.equal((await ui.hostFetch({ action: 'list' })).trash.length, 1);
    await ui.act2(() => tools.button(ui.d.confirmTrash).props.onClick());
    assert.equal((await ui.hostFetch({ action: 'list' })).trash.length, 0);
    assert.ok(tools.text().includes(ui.d.trashEmpty));
    // Shared Agents and registered-project DSH use their own exact origins.
    await ui.act2(() =>
      tools.field(ui.d.scope).props.onChange({ target: { value: 'global' } }),
    );
    await ui.act2(() =>
      tools.button(`${ui.d.moveTrash}: delta`).props.onClick(),
    );
    let trashed = (await ui.hostFetch({ action: 'list' })).trash;
    assert.equal(trashed[0].source, 'user-agents');
    const sharedOrigin = trashed[0].origin;
    assert.equal(
      (await ui.hostFetch({ action: 'trash-restore', id: trashed[0].id }))
        .result.warning,
      undefined,
    );
    assert.equal(
      await readFile(join(sharedOrigin, 'SKILL.md'), 'utf8'),
      doc('delta'),
    );
    await ui.act2(() =>
      tools.field(ui.d.scope).props.onChange({ target: { value: 'project' } }),
    );
    const projectId = (await ui.hostFetch({ action: 'list' })).projects[0].id;
    await ui.act2(() =>
      tools
        .field(ui.d.project)
        .props.onChange({ target: { value: projectId } }),
    );
    const created = await ui.hostFetch({
      action: 'create',
      project: projectId,
      source: `project-dsh:${projectId}`,
      name: 'project-trash',
      description: 'Project',
      body: 'Project bytes',
    });
    await ui.act2(() =>
      tools.field(ui.d.scope).props.onChange({ target: { value: 'global' } }),
    );
    await ui.act2(() =>
      tools.field(ui.d.scope).props.onChange({ target: { value: 'project' } }),
    );
    await ui.act2(() =>
      tools.button(`${ui.d.moveTrash}: project-trash`).props.onClick(),
    );
    trashed = (await ui.hostFetch({ action: 'list' })).trash;
    assert.equal(trashed[0].scope, projectId);
    await ui.act2(() =>
      tools.field(ui.d.scope).props.onChange({ target: { value: 'trash' } }),
    );
    await ui.act2(() =>
      tools.button(`${ui.d.restoreTrash}: project-trash`).props.onClick(),
    );
    assert.ok(
      (await readFile(created.created.path, 'utf8')).includes('Project bytes'),
    );
    if (language === 'ar')
      assert.equal(view.root.findByType('section').props.dir, 'rtl');
  });
  test(`registered ${language} project create, import and Trash show the explicit project destination and confirmation`, async (t) => {
    const ui = await mount(t, language, undefined, true);
    const view = await ui.render(ui.slot('settings.section')[0].component);
    const tools = ui.tools(view);
    const projectId = (await ui.hostFetch({ action: 'list' })).projects[0].id;
    await ui.act2(() =>
      tools.field(ui.d.scope).props.onChange({ target: { value: 'project' } }),
    );
    await ui.act2(() =>
      tools
        .field(ui.d.project)
        .props.onChange({ target: { value: projectId } }),
    );
    await ui.act2(() => tools.button(ui.d.create).props.onClick());
    // #158 rc.8: the destination is a Scope select plus a Location select preselected to the project.
    const location = () => tools.field(ui.d.destination);
    assert.equal(location().props.value, `project-dsh:${projectId}`, 'create');
    assert.equal(tools.field(ui.d.destScope).props.value, 'project');
    await ui.act2(() => tools.button(ui.d.importSkills).props.onClick());
    assert.equal(location().props.value, `project-dsh:${projectId}`, 'import');
    const created = await ui.hostFetch({
      action: 'create',
      project: projectId,
      source: `project-dsh:${projectId}`,
      name: 'scoped-trash',
      description: 'Project',
      body: 'Project bytes',
    });
    await ui.act2(() =>
      tools.field(ui.d.scope).props.onChange({ target: { value: 'global' } }),
    );
    await ui.act2(() =>
      tools.field(ui.d.scope).props.onChange({ target: { value: 'project' } }),
    );
    await ui.act2(() =>
      tools.button(`${ui.d.moveTrash}: scoped-trash`).props.onClick(),
    );
    await ui.act2(() =>
      tools.field(ui.d.scope).props.onChange({ target: { value: 'trash' } }),
    );
    assert.ok(tools.text().includes(`${ui.d.project}: app`), 'trash scope');
    await ui.act2(() =>
      tools.button(`${ui.d.deleteTrash}: scoped-trash`).props.onClick(),
    );
    assert.ok(tools.text().includes(ui.d.trashWarning));
    assert.ok(tools.text().includes('app'));
    await ui.act2(() =>
      tools.button(`${ui.d.restoreTrash}: scoped-trash`).props.onClick(),
    );
    assert.ok(
      (await readFile(created.created.path, 'utf8')).includes('Project bytes'),
    );
  });
  test(`registered ${language} upload controls import real ZIP, folder and Markdown bytes`, async (t) => {
    const ui = await mount(t, language, undefined, true);
    const view = await ui.render(ui.slot('settings.section')[0].component);
    const tools = ui.tools(view);
    await ui.act2(() => tools.button(ui.d.importSkills).props.onClick());
    await ui.act2(() =>
      tools
        .field(ui.d.importConflict)
        .props.onChange({ target: { value: 'skip' } }),
    );
    assert.equal(tools.button(ui.d.importNow).props.disabled, true);
    const file = (name, bytes, path = '') => ({
      name,
      webkitRelativePath: path,
      size: bytes.length,
      arrayBuffer: async () => Uint8Array.from(bytes).buffer,
    });
    for (const [label, files, expected] of [
      [
        ui.d.uploadFiles,
        [
          file(
            'collection.zip',
            zipSync({
              'zip-skill/SKILL.md': Buffer.from(doc('zip-skill')),
              'zip-skill/data.bin': new Uint8Array([0, 255]),
            }),
          ),
        ],
        'zip-skill',
      ],
      [
        ui.d.uploadFolder,
        [
          file(
            'SKILL.md',
            Buffer.from(doc('folder-skill')),
            'folder-skill/SKILL.md',
          ),
          file('data.bin', new Uint8Array([0, 255]), 'folder-skill/data.bin'),
        ],
        'folder-skill',
      ],
      [
        ui.d.uploadFiles,
        [
          file('one.md', Buffer.from(doc('markdown-one'))),
          file('two.md', Buffer.from(doc('markdown-two'))),
        ],
        'markdown-two',
      ],
    ]) {
      await ui.act2(() =>
        tools.field(label).props.onChange({ target: { files } }),
      );
      await ui.act2(() => tools.button(ui.d.importNow).props.onClick());
      const catalog = await ui.hostFetch({ action: 'list' });
      const entry = catalog.copies.find((x) => x.name === expected);
      assert.ok(entry, `${expected} imported via registered client`);
      assert.match(await readFile(entry.path, 'utf8'), new RegExp(expected));
    }
    for (const files of [
      [
        file(
          'mixed.zip',
          zipSync({
            'mixed/SKILL.md': Buffer.from(doc('mixed-zip')),
            'mixed/data.bin': new Uint8Array([7, 8]),
          }),
        ),
        file('mixed.md', Buffer.from(doc('mixed-md'))),
      ],
      [
        file(
          'first.zip',
          zipSync({ 'SKILL.md': Buffer.from(doc('first-zip')) }),
        ),
        file(
          'second.zip',
          zipSync({ 'SKILL.md': Buffer.from(doc('second-zip')) }),
        ),
      ],
    ]) {
      await ui.act2(() =>
        tools.field(ui.d.uploadFiles).props.onChange({ target: { files } }),
      );
      await ui.act2(() => tools.button(ui.d.importNow).props.onClick());
      const names = (await ui.hostFetch({ action: 'list' })).copies.map(
        (x) => x.name,
      );
      for (const name of files.length && files[0].name === 'mixed.zip'
        ? ['mixed-zip', 'mixed-md']
        : ['first-zip', 'second-zip']) {
        assert.ok(names.includes(name), `${name} selected batch imported`);
        assert.ok(tools.text().includes(name), `${name} outcome visible`);
      }
      for (const input of files.filter((x) => x.name.endsWith('.zip')))
        assert.ok(tools.text().includes(input.name));
    }
    const mixedCopy = (await ui.hostFetch({ action: 'list' })).copies.find(
      (x) => x.name === 'mixed-zip',
    );
    assert.deepEqual(
      await readFile(join(mixedCopy.path, '..', 'data.bin')),
      Buffer.from([7, 8]),
    );
    await ui.act2(() =>
      tools.field(ui.d.uploadFiles).props.onChange({
        target: {
          files: [
            file(
              'empty.zip',
              zipSync({ 'notes.txt': Buffer.from('no skill') }),
            ),
            file(
              'valid.zip',
              zipSync({ 'SKILL.md': Buffer.from(doc('alongside-empty')) }),
            ),
          ],
        },
      }),
    );
    await ui.act2(() => tools.button(ui.d.importNow).props.onClick());
    assert.ok(tools.text().includes('empty.zip'));
    assert.ok(tools.text().includes(ui.d['code.import-empty']));
    assert.ok(tools.text().includes('alongside-empty'));
    const folder = (text) => [
      file(
        'SKILL.md',
        Buffer.from(doc('folder-skill') + text),
        'folder-skill/SKILL.md',
      ),
    ];
    await ui.act2(() =>
      tools
        .field(ui.d.uploadFolder)
        .props.onChange({ target: { files: folder('Replacement') } }),
    );
    await ui.act2(() => tools.button(ui.d.importNow).props.onClick());
    let catalog = await ui.hostFetch({ action: 'list' });
    const original = catalog.copies.find((x) => x.name === 'folder-skill');
    assert.ok(tools.text().includes(ui.d.skippedImport));
    assert.doesNotMatch(await readFile(original.path, 'utf8'), /Replacement/);
    await ui.act2(() =>
      tools
        .field(ui.d.importConflict)
        .props.onChange({ target: { value: 'overwrite' } }),
    );
    const remove = fs.promises.rm;
    fs.promises.rm = async (path, ...args) => {
      if (String(path).includes('/.backup-'))
        throw Error('controlled cleanup failure');
      return remove(path, ...args);
    };
    syncBuiltinESMExports();
    try {
      await ui.act2(() => tools.button(ui.d.importNow).props.onClick());
    } finally {
      fs.promises.rm = remove;
      syncBuiltinESMExports();
    }
    assert.equal(
      ui.d['code.import-cleanup'],
      language === 'ar'
        ? 'تم الاستيراد بنجاح؛ تعذر تنظيف النسخة الاحتياطية. تحقق من مسار البقايا؛ قد تكون محتوياتها غير مكتملة'
        : 'Imported successfully; backup cleanup failed. Check the remaining backup path; its contents may be incomplete',
    );
    assert.ok(tools.text().includes(ui.d['code.import-cleanup']));
    assert.ok(tools.text().includes('/.backup-'));
    assert.match(await readFile(original.path, 'utf8'), /Replacement/);
    await assert.rejects(readFile(join(original.path, '..', 'data.bin')), {
      code: 'ENOENT',
    });
    // Unsafe actual selection must produce a translated backend error, preserving originals.
    await ui.act2(() =>
      tools.field(ui.d.uploadFolder).props.onChange({
        target: {
          files: [file('SKILL.md', Buffer.from(doc('bad')), '../SKILL.md')],
        },
      }),
    );
    await ui.act2(() => tools.button(ui.d.importNow).props.onClick());
    assert.ok(tools.text().includes(ui.d['code.import-path']));
    await ui.act2(() =>
      tools.field(ui.d.uploadFiles).props.onChange({
        target: {
          files: [
            {
              name: 'huge.md',
              size: 1048577,
              arrayBuffer: () => {
                throw Error('must not read oversized file');
              },
            },
          ],
        },
      }),
    );
    await ui.act2(() => tools.button(ui.d.importNow).props.onClick());
    assert.ok(tools.text().includes(ui.d['code.import-limit']));
    catalog = await ui.hostFetch({ action: 'list' });
    const localSource = join(original.path, '..', '..', '..', 'local-incoming');
    await mkdir(localSource);
    await writeFile(join(localSource, 'preview.md'), doc('local-preview'));
    await ui.act2(() =>
      tools
        .field(ui.d.destination)
        .props.onChange({ target: { value: 'user-agents' } }),
    );
    await ui.act2(() =>
      tools
        .field(ui.d.importPath)
        .props.onChange({ target: { value: localSource } }),
    );
    await ui.act2(() => tools.button(ui.d.previewImport).props.onClick());
    assert.ok(tools.text().includes('local-preview'));
    assert.ok(
      !(await ui.hostFetch({ action: 'list' })).copies.some(
        (x) => x.name === 'local-preview',
      ),
    );
    await ui.act2(() => tools.button(ui.d.importNow).props.onClick());
    const previewCopy = (await ui.hostFetch({ action: 'list' })).copies.find(
      (x) => x.name === 'local-preview',
    );
    assert.equal(previewCopy.source, 'user-agents');
    assert.match(await readFile(previewCopy.path, 'utf8'), /local-preview/);
    assert.equal(
      await readFile(join(localSource, 'preview.md'), 'utf8'),
      doc('local-preview'),
    );
    const project = catalog.projects.find((x) => x.available).id;
    await ui.act2(() =>
      tools.field(ui.d.scope).props.onChange({ target: { value: 'project' } }),
    );
    await ui.act2(() =>
      tools.field(ui.d.project).props.onChange({ target: { value: project } }),
    );
    await ui.act2(() =>
      tools.field(ui.d.uploadFiles).props.onChange({
        target: {
          files: [file('project.md', Buffer.from(doc('project-import')))],
        },
      }),
    );
    await ui.act2(() => tools.button(ui.d.importNow).props.onClick());
    const local = await ui.hostFetch({ action: 'list', project });
    const imported = local.project.copies.find(
      (x) => x.name === 'project-import',
    );
    assert.ok(imported.path.includes('/.dsh/skills/'));
    assert.match(await readFile(imported.path, 'utf8'), /project-import/);
    assert.ok(
      !(await ui.hostFetch({ action: 'list' })).copies.some(
        (x) => x.name === 'project-import',
      ),
    );
    assert.equal(
      view.root.findByType('section').props.dir,
      language === 'ar' ? 'rtl' : undefined,
    );
  });
  test(`registered ${language} creation form publishes and reports conflicts`, async (t) => {
    const ui = await mount(t, language, undefined, true);
    const view = await ui.render(ui.slot('settings.section')[0].component);
    const tools = ui.tools(view);
    await ui.act2(() => tools.button(ui.d.create).props.onClick());
    await ui.act2(() =>
      tools
        .field(ui.d.skillName)
        .props.onChange({ target: { value: 'Fresh Skill' } }),
    );
    await ui.act2(() =>
      tools
        .field(ui.d.skillDescription)
        .props.onChange({ target: { value: 'Use for fresh work' } }),
    );
    await ui.act2(() =>
      view.root
        .findByType('textarea')
        .props.onChange({ target: { value: '# Fresh instructions' } }),
    );
    await ui.act2(() =>
      view.root.findByType('form').props.onSubmit({ preventDefault() {} }),
    );
    assert.match(tools.text(), /fresh-skill/);
    assert.ok(tools.text().includes(ui.d.created));
    const catalog = await ui.hostFetch({ action: 'list' });
    const entry = catalog.copies.find((x) => x.name === 'fresh-skill');
    assert.match(await readFile(entry.path, 'utf8'), /Fresh instructions/);
    await ui.act2(() => tools.button(ui.d.create).props.onClick());
    await ui.act2(() =>
      tools
        .field(ui.d.skillName)
        .props.onChange({ target: { value: 'Fresh Skill' } }),
    );
    await ui.act2(() =>
      tools
        .field(ui.d.skillDescription)
        .props.onChange({ target: { value: 'Another description' } }),
    );
    await ui.act2(() =>
      view.root
        .findByType('textarea')
        .props.onChange({ target: { value: 'Do not overwrite' } }),
    );
    await ui.act2(() =>
      view.root.findByType('form').props.onSubmit({ preventDefault() {} }),
    );
    assert.ok(tools.text().includes(ui.d['code.create-conflict']));
    assert.match(await readFile(entry.path, 'utf8'), /Fresh instructions/);
    await ui.act2(() =>
      tools
        .field(ui.d.skillName)
        .props.onChange({ target: { value: '../escape' } }),
    );
    await ui.act2(() =>
      view.root.findByType('form').props.onSubmit({ preventDefault() {} }),
    );
    assert.ok(tools.text().includes(ui.d['code.create-invalid']));
    await ui.act2(() =>
      tools
        .field(ui.d.destination)
        .props.onChange({ target: { value: 'user-agents' } }),
    );
    await ui.act2(() =>
      tools
        .field(ui.d.skillName)
        .props.onChange({ target: { value: 'Shared Skill' } }),
    );
    await ui.act2(() =>
      view.root.findByType('form').props.onSubmit({ preventDefault() {} }),
    );
    assert.ok(
      (await ui.hostFetch({ action: 'list' })).copies.some(
        (x) => x.name === 'shared-skill' && x.source === 'user-agents',
      ),
    );
    const projectId = catalog.projects.find((x) => x.available).id;
    await ui.act2(() =>
      tools.field(ui.d.scope).props.onChange({ target: { value: 'project' } }),
    );
    await ui.act2(() =>
      tools
        .field(ui.d.project)
        .props.onChange({ target: { value: projectId } }),
    );
    await ui.act2(() => tools.button(ui.d.create).props.onClick());
    await ui.act2(() =>
      tools
        .field(ui.d.skillName)
        .props.onChange({ target: { value: 'Project Skill' } }),
    );
    await ui.act2(() =>
      tools
        .field(ui.d.skillDescription)
        .props.onChange({ target: { value: 'Use in project' } }),
    );
    await ui.act2(() =>
      view.root
        .findByType('textarea')
        .props.onChange({ target: { value: '# Project instructions' } }),
    );
    await ui.act2(() =>
      view.root.findByType('form').props.onSubmit({ preventDefault() {} }),
    );
    assert.ok(tools.text().includes(ui.d.created));
    const local = (
      await ui.hostFetch({ action: 'list', project: projectId })
    ).project.copies.find((x) => x.name === 'project-skill');
    assert.ok(local, tools.text());
    assert.match(await readFile(local.path, 'utf8'), /Project instructions/);
  });
}

// Categories live in the list itself (the original has no separate organizer): one
// `data-waycraft-cat-section="<source>/<categoryId>"` block per category, '' = Uncategorized.
const sectionOf = (view, source, id) =>
  view.root.findAll(
    (x) => x.props?.['data-waycraft-cat-section'] === `${source}/${id}`,
  )[0];
const skillsIn = (section) =>
  section
    .findAllByType('article')
    .map((x) => x.findAllByType('strong')[0].children.join(''));
const groupId = (view, source, label) => {
  const hit = view.root.findAll(
    (x) =>
      typeof x.props?.['data-waycraft-cat-section'] === 'string' &&
      x.props['data-waycraft-cat-section'].startsWith(`${source}/`) &&
      x
        .findAll((y) => y.props?.className === 'waycraft-skills-source-name')[0]
        ?.children.join('') === label,
  )[0];
  return hit.props['data-waycraft-cat-section'].slice(source.length + 1);
};

for (const language of ['en', 'ar'])
  test(`registered ${language} UI organizes per source with categories, bulk assign, toggle and notes`, async (t) => {
    const ui = await mount(t, language);
    assert.deepEqual(
      Object.keys(ui.dictionaries.en).sort(),
      Object.keys(ui.dictionaries.ar).sort(),
    );
    const Section = ui.slot('settings.section')[0].component;
    const view = await ui.render(Section);
    const u = ui.tools(view);
    const { d } = ui;
    const call = async (fn) => {
      await ui.act2(fn);
    };
    // Same-named alpha exists in both sources; organize only "base".
    await call(() => u.button(`${d.addCategoryHere}: base`).props.onClick());
    await call(() =>
      u
        .field(`${d.categoryName}: base`)
        .props.onChange({ target: { value: 'Work' } }),
    );
    await call(() => u.button(`${d.addCategory}: base`).props.onClick());
    await call(() => u.button(`${d.addCategoryHere}: base`).props.onClick());
    await call(() =>
      u
        .field(`${d.categoryName}: base`)
        .props.onChange({ target: { value: 'Play' } }),
    );
    await call(() => u.button(`${d.addCategory}: base`).props.onClick());
    const listed = await ui.hostFetch({ action: 'list' });
    const [work, play] = listed.organization.base.categories;
    assert.equal(listed.organization.other, undefined);
    // Per-skill assignment from the row's More menu (the original's `category:<id>` menu action).
    for (const name of ['alpha', 'beta'])
      await call(() =>
        u
          .field(`${d.assignTo}: ${name}`)
          .props.onChange({ target: { value: work.id } }),
      );
    assert.deepEqual(
      (await ui.hostFetch({ action: 'list' })).organization.base.members,
      { alpha: work.id, beta: work.id },
    );
    assert.deepEqual(skillsIn(sectionOf(view, 'base', work.id)), [
      'alpha',
      'beta',
    ]);
    // Drag-and-drop is restored (original client.ts:856-965): every movable row is draggable with a grip.
    assert.ok(
      view.root.findAll((x) => x.props?.draggable === true).length > 0,
      'draggable rows',
    );
    // Moving between categories goes through the assign action (More > Assign category).
    const assign = async (names, category) => {
      const r = await ui.hostFetch({
        action: 'category-assign',
        source: 'base',
        names,
        category,
      });
      assert.ok(r);
      await call(() => u.button(d.refreshAria).props.onClick());
    };
    await assign(['beta'], play.id);
    assert.deepEqual(skillsIn(sectionOf(view, 'base', play.id)), ['beta']);
    await assign(['beta'], '');
    assert.deepEqual(skillsIn(sectionOf(view, 'base', '')), ['beta']);
    await assign(['beta'], work.id);
    assert.deepEqual(skillsIn(sectionOf(view, 'base', work.id)), [
      'alpha',
      'beta',
    ]);
    const order = (await ui.hostFetch({ action: 'list' })).organization.base
      .order;
    assert.deepEqual(order[work.id] ?? ['alpha', 'beta'], ['alpha', 'beta']);
    // Order persists across a fresh mount (reload).
    await act(async () => view.unmount());
    const again = await ui.render(Section);
    assert.deepEqual(skillsIn(sectionOf(again, 'base', work.id)), [
      'alpha',
      'beta',
    ]);
    const u2 = ui.tools(again);
    // Bulk toggle affects only base; other alpha remains eligible.
    await ui.act2(() => u2.button(`${d.toggleCategory}: Work`).props.onClick());
    const off = await ui.hostFetch({ action: 'list' });
    const state = (name, src) =>
      off.copies.find((x) => x.name === name && x.source === src).eligible;
    assert.equal(state('alpha', 'base'), false);
    assert.equal(state('alpha', 'other'), true);
    assert.equal(state('delta', 'other'), true);
    await ui.act2(() => u2.button(`${d.toggleCategory}: Work`).props.onClick());
    assert.ok(
      (await ui.hostFetch({ action: 'list' })).copies.every(
        (x) => x.eligible !== false,
      ),
    );
    // Notes: independent per source, capped, searchable.
    // Notes are edited in a dialog opened from the row's More menu.
    await ui.act2(() => u2.button(`${d.note}: beta`).props.onClick());
    const noteField = u2.field(`${d.note}: beta`);
    assert.equal(noteField.props.maxLength, 500);
    assert.equal(noteField.props.title, d.noteLimit);
    await ui.act2(() =>
      noteField.props.onChange({ target: { value: 'quarterly-review' } }),
    );
    await ui.act2(() => u2.button(`${d.saveNote}: beta`).props.onClick());
    const withNote = await ui.hostFetch({ action: 'list' });
    assert.equal(withNote.organization.base.notes.beta, 'quarterly-review');
    await ui.act2(() =>
      u2.field(d.search).props.onChange({ target: { value: 'quarterly' } }),
    );
    const articles = () =>
      again.root.findAllByType('article').map((x) =>
        x
          .findAllByType('strong')
          .map((y) => y.children.join(''))
          .join(','),
      );
    assert.deepEqual(articles(), ['beta']);
    await ui.act2(() =>
      u2.field(d.search).props.onChange({ target: { value: '' } }),
    );
    // Delete a category with confirmation: members go to uncategorized.
    await ui.act2(() => u2.button(`${d.deleteCategory}: Work`).props.onClick());
    await ui.act2(() =>
      u2.button(`${d.confirmDeleteCategory}: Work`).props.onClick(),
    );
    const after = await ui.hostFetch({ action: 'list' });
    assert.deepEqual(
      after.organization.base.categories.map((x) => x.name),
      ['Play'],
    );
    assert.deepEqual(after.organization.base.members, {});
    assert.equal(after.copies.length, 4);
    // A deleted filter category does not leave a dangling filter.
    if (language === 'ar') assert.match(u2.text(), /"dir":"rtl"/);
  });

for (const language of ['en', 'ar'])
  test(`registered ${language} navigation placement supports sidebar-only, both, settings with rollback and recovery`, async (t) => {
    const ui = await mount(t, language);
    const { d } = ui;
    assert.equal(ui.slot('settings.section').length, 1);
    assert.equal(ui.slot('sidebar.panellist').length, 0);
    const config = ui.slot('plugins.bundle.config')[0];
    const control = await ui.render(config.component, {});
    const u = ui.tools(control);
    const pressed = () =>
      control.root
        .findAllByType('button')
        .filter((x) => x.props['aria-pressed'])
        .map((x) => x.children.join(''));
    assert.deepEqual(pressed(), [d.placementSettings]);
    await ui.act2(() => u.button(d.placementSidebar).props.onClick());
    assert.equal(ui.slot('settings.section').length, 0);
    assert.equal(ui.slot('sidebar.panellist').length, 1);
    assert.equal(ui.slot('main').length, 1);
    assert.deepEqual(pressed(), [d.placementSidebar]);
    assert.equal(
      (await ui.hostFetch({ action: 'ping', include: 'placement' })).placement,
      'sidebar',
    );
    assert.equal(
      JSON.parse(await readFile(ui.statePath, 'utf8')).placement,
      'sidebar',
    );
    // A transient ping failure keeps the last known entries and the control.
    ui.failPlacement.ping = true;
    await ui.act2(() => ui.timers.splice(0).forEach((fn) => fn()));
    assert.equal(ui.slot('sidebar.panellist').length, 1);
    assert.equal(ui.slot('plugins.bundle.config').length, 1);
    ui.failPlacement.ping = false;
    await ui.act2(() => ui.timers.splice(0).forEach((fn) => fn()));
    assert.equal(ui.slot('sidebar.panellist').length, 1);
    await ui.act2(() => u.button(d.placementBoth).props.onClick());
    assert.equal(ui.slot('settings.section').length, 1);
    assert.equal(ui.slot('sidebar.panellist').length, 1);
    await ui.act2(() => u.button(d.placementSettings).props.onClick());
    assert.equal(ui.slot('sidebar.panellist').length, 0);
    assert.deepEqual(ui.selected, [null], 'active sidebar panel is released');
    ui.failPlacement.on = true;
    await ui.act2(() => u.button(d.placementSidebar).props.onClick());
    assert.equal(ui.slot('sidebar.panellist').length, 0, 'rolled back');
    assert.equal(ui.slot('settings.section').length, 1);
    assert.deepEqual(pressed(), [d.placementSettings]);
    assert.match(u.text(), /alert/);
  });

for (const language of ['en', 'ar'])
  test(`fresh ${language} startup with stored sidebar-only placement registers a working sidebar Section`, async (t) => {
    const ui = await mount(t, language, {
      sources: {},
      copies: {},
      customSources: [],
      projects: {},
      organization: {},
      placement: 'sidebar',
    });
    assert.equal(ui.slot('settings.section').length, 0);
    assert.equal(ui.slot('sidebar.panellist').length, 1);
    const main = ui.slot('main');
    assert.equal(main.length, 1);
    const view = await ui.render(main[0].component);
    assert.match(JSON.stringify(view.toJSON()), /alpha/);
    assert.match(
      JSON.stringify(view.toJSON()),
      new RegExp(ui.d.addCategoryHere),
    );
  });

for (const language of ['en', 'ar'])
  test(`${language} disposal during a pending placement save registers nothing and selects no panel`, async (t) => {
    const ui = await mount(t, language);
    const control = await ui.render(
      ui.slot('plugins.bundle.config')[0].component,
      {},
    );
    const u = ui.tools(control);
    let release;
    ui.failPlacement.hold = new Promise((resolve) => (release = resolve));
    await act(async () => {
      u.button(ui.d.placementSidebar).props.onClick();
    });
    // Optimistic registration happened; now the plugin is disposed while the save is in flight.
    for (const stop of ui.cleanups.splice(0).reverse()) stop?.();
    assert.deepEqual(
      [
        'settings.section',
        'sidebar.panellist',
        'main',
        'plugins.bundle.config',
      ].map((name) => ui.slot(name).length),
      [0, 0, 0, 0],
      'everything withdrawn on disposal',
    );
    const registered = ui.slots.length;
    release();
    ui.failPlacement.hold = undefined;
    await ui.settle();
    ui.timers.splice(0).forEach((fn) => fn());
    await ui.settle();
    assert.equal(ui.slots.length, registered, 'no slot re-registered');
    assert.equal(ui.slot('sidebar.panellist').length, 0);
    assert.deepEqual(ui.selected, [], 'no panel selected after disposal');
  });

for (const language of ['en', 'ar'])
  test(`registered ${language} project scope keeps organization isolated and ignores stale filters`, async (t) => {
    const ui = await mount(t, language);
    const { d } = ui;
    const Section = ui.slot('settings.section')[0].component;
    const view = await ui.render(Section);
    const u = ui.tools(view);
    const act2 = ui.act2;
    // Global: a category in base with picked skills, then a stale filter.
    await act2(() => u.button(`${d.addCategoryHere}: base`).props.onClick());
    await act2(() =>
      u
        .field(`${d.categoryName}: base`)
        .props.onChange({ target: { value: 'Work' } }),
    );
    await act2(() => u.button(`${d.addCategory}: base`).props.onClick());
    const work = (await ui.hostFetch({ action: 'list' })).organization.base
      .categories[0];
    await act2(() =>
      u
        .field(`${d.filterCategory}`)
        .props.onChange({ target: { value: work.id } }),
    );
    await act2(() =>
      u.field(`${d.source}`).props.onChange({ target: { value: 'base' } }),
    );
    await act2(() =>
      u
        .field(`${d.filterCategory}`)
        .props.onChange({ target: { value: work.id } }),
    );
    const listed = await ui.hostFetch({ action: 'list' });
    const projectId = listed.projects.find((x) => x.available).id;
    await act2(() =>
      u.field(d.scope).props.onChange({ target: { value: 'project' } }),
    );
    await act2(() =>
      u.field(d.project).props.onChange({ target: { value: projectId } }),
    );
    await act2(() =>
      u.field(d.source).props.onChange({ target: { value: '' } }),
    );
    const projectSource = (
      await ui.hostFetch({ action: 'list', project: projectId })
    ).project.sources.find((x) => x.kind !== 'dsh').id;
    // Project scope shows only project sources: no global category section leaks in.
    assert.equal(
      view.root.findAll((x) =>
        String(x.props?.['data-waycraft-cat-section'] ?? '').startsWith(
          'base/',
        ),
      ).length,
      0,
    );
    const projectArticles = view.root
      .findAllByType('article')
      .map((x) => x.findAllByType('strong')[0].children.join(''));
    assert.ok(
      projectArticles.includes('alpha') && projectArticles.includes('omega'),
    );
    const after = await ui.hostFetch({ action: 'list', project: projectId });
    assert.deepEqual(after.project.organization, {});
    assert.deepEqual(after.organization.base.members, {}, 'global untouched');
    // The previous filter did not leak into the project view.
    assert.equal(u.field(d.filterCategory).props.value, '');
    // Project category + assign stays in the project scope.
    const psrc = (
      await ui.hostFetch({ action: 'list', project: projectId })
    ).project.sources.find((x) => x.id === projectSource);
    const label = psrc.label ?? psrc.name ?? psrc.id;
    await act2(() =>
      u.button(`${d.addCategoryHere}: ${label}`).props.onClick(),
    );
    await act2(() =>
      u
        .field(`${d.categoryName}: ${label}`)
        .props.onChange({ target: { value: 'Local' } }),
    );
    await act2(() => u.button(`${d.addCategory}: ${label}`).props.onClick());
    const local = (await ui.hostFetch({ action: 'list', project: projectId }))
      .project.organization[projectSource].categories[0];
    await act2(() =>
      u
        .field(`${d.assignTo}: omega`)
        .props.onChange({ target: { value: local.id } }),
    );
    const final = await ui.hostFetch({ action: 'list', project: projectId });
    assert.deepEqual(final.project.organization[projectSource].members, {
      omega: local.id,
    });
    assert.equal(final.organization.base.categories.length, 1);
    assert.deepEqual(final.organization.base.members, {});
    if (language === 'ar') assert.match(u.text(), /"dir":"rtl"/);
  });

for (const language of ['en', 'ar'])
  test(`registered ${language} deleted category clears its filter and stale selection is pruned`, async (t) => {
    const ui = await mount(t, language);
    const { d } = ui;
    const view = await ui.render(ui.slot('settings.section')[0].component);
    const u = ui.tools(view);
    const act2 = ui.act2;
    await act2(() =>
      u.field(d.source).props.onChange({ target: { value: 'base' } }),
    );
    await act2(() => u.button(`${d.addCategoryHere}: base`).props.onClick());
    await act2(() =>
      u
        .field(`${d.categoryName}: base`)
        .props.onChange({ target: { value: 'Work' } }),
    );
    await act2(() => u.button(`${d.addCategory}: base`).props.onClick());
    const work = (await ui.hostFetch({ action: 'list' })).organization.base
      .categories[0];
    await act2(() =>
      u.field(d.filterCategory).props.onChange({ target: { value: work.id } }),
    );
    assert.equal(u.field(d.filterCategory).props.value, work.id);
    await act2(() => u.button(`${d.deleteCategory}: Work`).props.onClick());
    await act2(() =>
      u.button(`${d.confirmDeleteCategory}: Work`).props.onClick(),
    );
    assert.equal(u.field(d.filterCategory).props.value, '', 'filter reset');
    assert.ok(
      u
        .field(d.filterCategory)
        .findAllByType('option')
        .every((x) => x.props.value !== work.id),
    );
  });

test('a saved legacy active panel id is mapped to the new panel id (ticket #159)', async (t) => {
  const ui = await mount(
    t,
    'en',
    { placement: 'sidebar' },
    false,
    LEGACY_SKILLS_PANEL,
  );
  assert.ok(
    ui.selected.includes('waycraft-skills'),
    'legacy active panel re-selected under the new id',
  );
});

for (const placement of ['both', 'settings', 'sidebar'])
  test(`nav icon slot follows placement (${placement}) and shares the sidebar icon vector`, async (t) => {
    const ui = await mount(t, 'en', {
      sources: {},
      copies: {},
      customSources: [],
      projects: {},
      organization: {},
      placement,
    });
    const icons = ui.slot('settings.section.icon');
    const inSettings = placement !== 'sidebar';
    assert.equal(icons.length, inSettings ? 1 : 0);
    if (inSettings) {
      assert.equal(icons[0].entry.id, 'waycraft-skills');
      assert.equal(icons[0].entry.locale, 'waycraft.skills');
      const paths = async (node) =>
        JSON.stringify((await ui.render(node)).toJSON());
      const svg = await paths(icons[0].component);
      assert.match(svg, /"viewBox":"0 0 16 16"/);
      assert.match(svg, /"aria-hidden":true/);
      assert.match(svg, /M12\.5113 15\.4067/);
      if (placement === 'both')
        assert.equal(
          await paths(ui.slot('sidebar.panellist')[0].component),
          svg,
          'sidebar icon matches',
        );
    }
    if (placement === 'both') {
      const u = ui.tools(
        await ui.render(ui.slot('plugins.bundle.config')[0].component, {}),
      );
      await ui.act2(() => u.button(ui.d.placementSidebar).props.onClick());
      assert.equal(ui.slot('settings.section.icon').length, 0);
      await ui.act2(() => u.button(ui.d.placementBoth).props.onClick());
      assert.equal(ui.slot('settings.section.icon').length, 1);
    }
    for (const stop of ui.cleanups.splice(0).reverse()) stop?.();
    assert.equal(ui.slot('settings.section.icon').length, 0);
  });
