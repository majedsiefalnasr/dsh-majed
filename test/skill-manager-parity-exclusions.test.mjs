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
  test(`parity exclusion: the ${language} Skill manager shows no GitHub, Issues or Check-for-updates control in any scope`, async (t) => {
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
        register(entry, component) {
          if (entry.name === 'settings.section') Section = component;
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
    let view;
    await act(async () => {
      view = create(React.createElement(Section));
      await new Promise(setImmediate);
    });
    await act(async () => {
      await Promise.all(pending);
      await new Promise(setImmediate);
    });
    const excluded =
      /github|issues|feedback|check for update|updater|online.?update|التحقق من التحديث|الإبلاغ عن مشكلة|ملاحظات المستخدمين/i;
    const surface = () => {
      const labels = [
        ...view.root.findAllByType('button').map((x) => x.children.join('')),
        ...view.root.findAllByType('option').map((x) => x.children.join('')),
        ...view.root
          .findAll((x) => typeof x.props['aria-label'] === 'string')
          .map((x) => x.props['aria-label']),
        ...view.root.findAllByType('a').map((x) => String(x.props.href)),
      ];
      return labels.join('\n');
    };
    // Every scope the header select offers: global, project, discover (each sub-tab) and Trash.
    for (const scope of ['global', 'project', 'discover', 'trash']) {
      await act(async () => {
        view.root
          .findByProps({ 'aria-label': dictionaries[language].scope })
          .props.onChange({ target: { value: scope } });
        await new Promise(setImmediate);
      });
      await act(async () => {
        await Promise.all(pending);
        await new Promise(setImmediate);
      });
      assert.doesNotMatch(surface(), excluded, `scope ${scope}`);
      assert.equal(view.root.findAllByType('a').length, 0, `scope ${scope}`);
      assert.doesNotMatch(JSON.stringify(view.toJSON()), excluded, scope);
    }
    // The whole dictionary carries no excluded wording, so no hidden state can show it either.
    for (const [key, value] of Object.entries(dictionaries[language]))
      assert.doesNotMatch(`${key}=${value}`, excluded, key);
    // The host exposes no update-check or issue action either.
    for (const action of ['check-update', 'online-update', 'issues']) {
      const response = await hostRoute.fetch(
        new Request('https://example.test/api/waycraft-skills.catalog', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-waycraft-skills': '1',
          },
          body: JSON.stringify({ action }),
        }),
      );
      assert.equal(response.status, 400, action);
    }
    await act(async () => view.unmount());
    for (const stop of cleanups.reverse()) stop?.();
  });
