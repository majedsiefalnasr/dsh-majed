import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
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
for (const language of ['en', 'ar'])
  test(`assembled registered Skill manager ${language} search and details`, async (t) => {
    const storage = await mkdtemp(join(tmpdir(), 'waycraft-ui-host-'));
    t.after(() => rm(storage, { recursive: true, force: true }));
    await mkdir(join(storage, 'example'));
    await writeFile(
      join(storage, 'example', 'SKILL.md'),
      '---\nname: example\ndescription: Exact description\n---\nExact original body',
    );
    let hostRoute;
    const hostStops = [];
    const hostController = new AbortController();
    applyHost(
      {
        skills: {
          registerProvider(create) {
            create({ signal: hostController.signal, invalidate() {} });
            return () => hostController.abort();
          },
        },
        effect(start) {
          hostStops.push(start());
        },
        inject(_, callback) {
          callback({
            effect(start) {
              hostStops.push(start());
            },
            get() {
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
      },
      {
        sources: [{ id: 'fixture', path: storage }],
        statePath: join(storage, 'state.json'),
      },
    );
    t.after(async () => {
      for (const stop of hostStops) await stop?.();
    });
    let api, Section;
    const cleanups = [];
    const dictionaries = {};
    const requests = [];
    const bodies = [];
    const pending = [];
    let timer;
    const catalog = {
      sources: [{ id: 'fixture', enabled: true }],
      copies: [
        {
          name: 'example',
          description: 'Exact description',
          path: '/fixture/example/SKILL.md',
          source: 'fixture',
          eligible: true,
        },
      ],
      diagnostics: [],
    };
    vm.runInNewContext(code, {
      window: {
        __ModuleLoader__: {
          load({ factory }) {
            api = factory((id) => (id === 'react' ? React : {}));
          },
        },
      },
      document: { baseURI: 'https://example.test/prefix/' },
      URL,
      AbortController,
      console,
      setTimeout(fn) {
        timer = fn;
        return 1;
      },
      clearTimeout() {},
      fetch: async (url, options) => {
        requests.push(String(url));
        bodies.push(JSON.parse(options.body).action);
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
        register(ns, value) {
          Object.assign(dictionaries, value);
          return () => {};
        },
        bind() {
          return (key) => dictionaries[language][key];
        },
        language: { getSnapshot: () => language },
      },
      slots: {
        inject(_name, start) {
          return start();
        },
        register(_entry, component) {
          Section = component;
          return () => {
            Section = undefined;
          };
        },
      },
    };
    const coreContext = {
      ...ctx,
      effect(start, label) {
        if (label?.startsWith('waycraft-skills')) cleanups.push(start());
      },
      inject(names, callback) {
        if (
          names.length === 2 &&
          names.includes('locale') &&
          names.includes('slots')
        )
          return callback(ctx);
      },
      slots: {
        inject(_name, start) {
          return start();
        },
        register() {
          return () => {};
        },
      },
    };
    api.apply(coreContext);
    await Promise.all(pending);
    await new Promise(setImmediate);
    assert.ok(Section);
    // Presence is a cheap ping; the section mount alone is what triggers the full list.
    assert.deepEqual(bodies, ['ping']);
    assert.deepEqual(
      Object.keys(dictionaries.en).sort(),
      Object.keys(dictionaries.ar).sort(),
    );
    assert.ok(dictionaries[language].copyText);
    let view;
    await act(async () => {
      view = create(React.createElement(Section));
      await new Promise(setImmediate);
    });
    await act(async () => {
      await Promise.all(pending);
      await new Promise(setImmediate);
    });
    assert.match(JSON.stringify(view.toJSON()), /example/);
    if (language === 'ar')
      assert.equal(view.root.findByType('section').props.dir, 'rtl');
    await act(async () => {
      view.root
        .findAllByType('button')
        .find((x) => x.children.join('') === dictionaries[language].details)
        .props.onClick();
      await new Promise(setImmediate);
    });
    await act(async () => {
      await Promise.all(pending);
      await new Promise(setImmediate);
    });
    assert.match(JSON.stringify(view.toJSON()), /Exact original body/);
    assert.match(
      JSON.stringify(view.toJSON()),
      new RegExp(dictionaries[language].copyText),
    );
    await act(async () => {
      view.root
        .findByProps({ 'aria-label': dictionaries[language].search })
        .props.onChange({ target: { value: 'missing' } });
    });
    assert.match(
      JSON.stringify(view.toJSON()),
      new RegExp(dictionaries[language].empty),
    );
    assert.ok(
      requests.every(
        (url) =>
          url === 'https://example.test/prefix/api/waycraft-skills.catalog',
      ),
    );
    await act(async () => view.unmount());
    for (const stop of cleanups.reverse()) stop?.();
    assert.equal(Section, undefined);
  });

test('presence ping backs off while the host route is missing and resets on success', async () => {
  const delays = [];
  let fire;
  let ok = false;
  const cleanups = [];
  const dictionaries = {};
  vm.runInNewContext(code, {
    window: {
      __ModuleLoader__: {
        load({ factory }) {
          globalThis.__skillApi = factory((id) =>
            id === 'react' ? React : {},
          );
        },
      },
    },
    document: { baseURI: 'https://example.test/' },
    URL,
    AbortController,
    console,
    setTimeout(fn, delay) {
      fire = fn;
      delays.push(delay);
      return 1;
    },
    clearTimeout() {},
    fetch: async () =>
      ok ? Response.json({ ok: true }) : new Response('x', { status: 404 }),
  });
  const api = globalThis.__skillApi;
  delete globalThis.__skillApi;
  const ctx = {
    inject(names, callback) {
      if (names.includes('locale') && names.includes('slots')) callback(ctx);
    },
    effect(start, label) {
      if (label?.startsWith('waycraft-skills')) cleanups.push(start());
    },
    locale: {
      register(_ns, value) {
        Object.assign(dictionaries, value);
        return () => {};
      },
      bind: () => (key) => key,
      language: { getSnapshot: () => 'en' },
    },
    slots: { inject: (_n, start) => start(), register: () => () => {} },
  };
  api.apply(ctx);
  const settle = () => new Promise((resolve) => setTimeout(resolve, 5));
  await settle();
  for (let i = 0; i < 7; i++) {
    fire();
    await settle();
  }
  assert.deepEqual(
    delays,
    [6000, 12000, 24000, 48000, 60000, 60000, 60000, 60000],
  );
  ok = true;
  fire();
  await settle();
  assert.equal(delays.at(-1), 3000);
  for (const stop of cleanups.reverse()) stop?.();
});
