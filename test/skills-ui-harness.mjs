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

export async function mount(
  t,
  language,
  { failList = false, transform, workspace, primitives } = {},
) {
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
          api = factory((id) =>
            id === 'react'
              ? React
              : id === '@deepseek-ai/dsh-client-ui-primitives' && primitives
                ? primitives
                : {},
          );
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
      let response = hostRoute.fetch(new Request(String(url), options));
      if (transform && body.action === 'list')
        response = response.then(async (r) => {
          const json = transform(await r.json());
          return new Response(JSON.stringify(json), {
            status: r.status,
            headers: { 'content-type': 'application/json' },
          });
        });
      pending.push(response);
      return response;
    },
  });
  const ctx = {
    inject(names, callback) {
      if (names.includes('uiWorkspace'))
        return workspace ? callback({ uiWorkspace: workspace }) : undefined;
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
      register(entry, component) {
        if (entry.name === 'settings.section') Section = component;
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
      if (names.includes('uiWorkspace') && workspace)
        return callback({ uiWorkspace: workspace });
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
  const click = async (label) => {
    const target = view.root
      .findAllByType('button')
      .find(
        (x) => x.children.join('') === label || x.props['aria-label'] === label,
      );
    assert.ok(target, `button ${label}`);
    await act(async () => target.props.onClick());
    await settle();
  };
  return {
    click,
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
