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
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import vm from 'node:vm';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { apply as applyHost } from '../dist/skills.js';

const code = await readFile(
  new URL('../dist/client.js', import.meta.url),
  'utf8',
);

const doc = (name) =>
  `---\nname: ${name}\ndescription: About ${name}\n---\nBody`;
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

test('a 500-skill catalog renders a bounded window and search still finds skills outside it', async (t) => {
  const ui = await mount(t, 'en', undefined, true);
  const base = join(dirname(dirname(ui.statePath)), 'base');
  for (let i = 0; i < 500; i++) {
    const name = `bulk-${String(i).padStart(3, '0')}`;
    await mkdir(join(base, name), { recursive: true });
    await writeFile(join(base, name, 'SKILL.md'), doc(name));
  }
  await ui.hostFetch({ action: 'reload' });
  const view = await ui.render(ui.slot('settings.section')[0].component);
  const tools = ui.tools(view);
  const rows = () => view.root.findAll((x) => x.props?.['data-waycraft-skill']);
  const mounted = () =>
    new Set(rows().map((x) => x.props['data-waycraft-skill']));
  assert.ok(mounted().size > 0 && mounted().size <= 110);
  assert.ok(!mounted().has('bulk-499'));
  // Totals still describe the full catalog.
  assert.ok(tools.text().includes('502') || tools.text().includes('500'));
  // Search filters before the window, so an off-window skill is found.
  await ui.act2(() =>
    tools.field(ui.d.search).props.onChange({ target: { value: 'bulk-499' } }),
  );
  assert.deepEqual([...mounted()], ['bulk-499']);
  await ui.act2(() =>
    tools.field(ui.d.search).props.onChange({ target: { value: '' } }),
  );
  // Show more is a quiet link; it expands, Show less collapses again.
  const toggle = () =>
    view.root.findAll(
      (x) => x.type === 'button' && x.props['data-waycraft-rows-toggle'],
    )[0];
  assert.ok(toggle());
  assert.equal(toggle().props.className, 'waycraft-skills-link');
  await ui.act2(() => toggle().props.onClick());
  assert.ok(mounted().has('bulk-499'));
  assert.ok(mounted().size >= 500);
  await ui.act2(() => toggle().props.onClick());
  assert.ok(mounted().size <= 110);
});
