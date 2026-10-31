import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ActualReact from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { create, act } from 'react-test-renderer';
import { readFile } from 'node:fs/promises';
const code = await readFile(new URL('../dist/subscriptions-client.js', import.meta.url), 'utf8');
function browser(locale = 'en', initialAnswer, options = {}) {
  let api, timer, reconnect, dictionary, registrations = 0;
  // Live registrations keyed by slot entry id (the Settings section plus the #131 composer surfaces).
  const live = new Map();
  let referenceAnswer = () => Promise.reject(new Error('transport failure for /api/subscriptions-auth.proxyGet: HTTP 404'));
  let answer = initialAnswer ?? (() => Promise.resolve({ ok: true, value: { component: 'subscriptions' } }));
  const cleanups = []; const commandService = options.commandService;
  const React = options.React ?? { Component: class {}, forwardRef: fn => fn, createElement: (tag, props, ...children) => ({ tag, props, children }), useSyncExternalStore: (_, read) => read() };
  vm.runInNewContext(code + '\nresult(majedSubscriptionsFactory);', { result: factory => { api = factory(id => id === 'react' ? React : id === 'react/jsx-runtime' ? jsxRuntime : { IconSettingsOutlineMedium: 'svg' }); },
    setInterval: fn => { timer = fn; return 1; }, clearInterval() {}, Error });
  const connection = { rpc: { call: (...args) => args[1] === 'subscriptions-auth.proxyGet' ? referenceAnswer(...args) : answer(...args) }, state: { subscribe: fn => { reconnect = fn; return () => {}; }, getSnapshot: () => 'connected' } };
  const ctx = { effect: fn => cleanups.push(fn()),
    locale: { register: (_, dictionaries) => { dictionary = dictionaries[locale]; return () => {}; }, bind: () => key => dictionary[key] },
    slots: { inject: (slotName, fn) => { if (options.failSlot === slotName) throw new Error(`${slotName} failed`); let off; const run = () => { off = fn(); }; run(); return () => { off?.(); }; },
      register: (options, component) => { assert.equal(live.has(options.id), false, `no duplicate registration of ${options.id}`); if (options.id === 'majed-subscriptions') registrations++; live.set(options.id, { options, component }); return () => { live.delete(options.id); }; } },
    get: name => name === 'modelDirectories' ? models : connection };
  const models = { directoryFor: () => ({ load: async () => ({ current: { provider: 'codex', model: 'fast-model' } }) }) };
  ctx.get = name => name === 'modelDirectories' ? models : connection;
  ctx.inject = (names, fn) => {
    if (names.includes('commandUi')) { if (!commandService) return; const scope = { get: () => commandService, effect: (run) => cleanups.push(run()) }; return fn(scope); }
    return fn(ctx);
  };
  api.applySubscriptions(ctx);
  return { setReferenceAnswer(fn) { referenceAnswer = fn; }, get registrations() { return registrations; }, setAnswer(fn) { answer = fn; }, tick: () => timer(), reconnect: () => reconnect(),
    async settle() { await Promise.resolve(); await Promise.resolve(); },
    get section() { return live.get('majed-subscriptions'); }, live,
    get surfaces() { return [...live.keys()].filter(id => id !== 'majed-subscriptions').sort(); }, cleanup() { cleanups.reverse().forEach(fn => fn?.()); },
  };
}
test('actual public and alias video outlets recover after reference withdrawal and component remount', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const page = browser('en', undefined, { React: ActualReact }); await page.settle();
  try {
    for (const key of ['video_generate', 'dsh_majed_video_generate']) {
      const entry = page.live.get(`majed-toolview-${key}`);
      assert.equal(entry.options.key, key);
      let renderer;
      await act(async () => { renderer = create(ActualReact.createElement(entry.component, {
        t: key => key,
        block: { kind: 'result', call: { argsRaw: '{}' }, content: [{ type: 'text', text: 'Saved video to /fixture/video-outlet.mp4' }] },
        loadVideo: async name => { assert.equal(name, 'video-outlet.mp4'); throw new Error('fixture storage unavailable'); },
      })); });
      assert.match(JSON.stringify(renderer.toJSON()), /videoLoadFailed/);
      await act(async () => renderer.unmount());
    }
    for (const key of ['image_generate', 'dsh_majed_image_generate']) {
      const entry = page.live.get(`majed-toolview-${key}`);
      assert.equal(entry.options.key, key);
      let renderer;
      await act(async () => { renderer = create(ActualReact.createElement(entry.component, {
        t: key => key,
        block: { kind: 'result', call: { argsRaw: '{}' }, content: [{ type: 'image', attachment: { attachmentId: 'fixture', width: 20, height: 20 } }], isError: false },
        load: async () => { throw new Error('fixture unavailable'); },
      })); });
      assert.match(JSON.stringify(renderer.toJSON()), /imageLoadFailed/);
      await act(async () => renderer.unmount());
    }
    page.setReferenceAnswer(() => Promise.resolve({ ok: true })); page.tick(); await page.settle();
    assert.ok(!page.surfaces.some(id => id.includes('toolview')));
    page.setReferenceAnswer(() => Promise.reject(new Error('transport failure for /api/majed-subscriptions.status: HTTP 404'))); page.tick(); await page.settle();
    assert.ok(page.live.has('majed-toolview-dsh_majed_video_generate'));
    page.setAnswer(() => Promise.reject(new Error('transport failure for /api/majed-subscriptions.status: HTTP 404'))); page.tick(); await page.settle();
    assert.ok(!page.live.has('majed-toolview-video_generate'));
    page.setAnswer(() => Promise.resolve({ ok: true, value: { component: 'subscriptions' } })); page.tick(); await page.settle();
    assert.ok(page.live.has('majed-toolview-video_generate'));
  } finally { page.cleanup(); }
});
function text(node) { return typeof node === 'string' ? node : node?.children?.flat(Infinity).map(text).join(' ') ?? ''; }
test('present component registers one section with both empty parts, then withdraws on absence', async () => {
  const page = browser(); await page.settle();
  assert.equal(page.section.options.id, 'majed-subscriptions');
  assert.match(text(page.section.component()), /Subscription accounts.*API providers.*No API providers yet/);
  page.setAnswer(() => Promise.reject(new Error('transport failure for /api/majed-subscriptions.status: HTTP 404')));
  page.tick(); await page.settle(); assert.equal(page.section, undefined); page.cleanup();
});
test('unreachable known component displays a clear message; reconnect recovers', async () => {
  const page = browser(); await page.settle();
  page.setAnswer(() => Promise.reject(new Error('offline'))); page.tick(); await page.settle();
  assert.match(text(page.section.component()), /cannot be reached/);
  page.setAnswer(() => Promise.resolve({ ok: true, value: { component: 'subscriptions' } }));
  page.reconnect(); await page.settle(); assert.doesNotMatch(text(page.section.component()), /cannot be reached/); page.cleanup();
});
test('404 on first probe leaves the section absent', async () => {
  const page = browser('en', () => Promise.reject(new Error('transport failure for /api/majed-subscriptions.status: HTTP 404')));
  await page.settle(); assert.equal(page.section, undefined); page.cleanup();
});
for (const [failure, answer] of [
  ['transport', () => Promise.reject(new Error('offline'))],
  ['timeout', () => Promise.reject(new Error('timeout'))],
  ['5xx', () => Promise.reject(new Error('transport failure for /api/majed-subscriptions.status: HTTP 503'))],
  ['malformed body', () => Promise.resolve(null)],
]) {
  test(`enabled-but-unreachable on first probe shows the message: ${failure}`, async () => {
    const page = browser('en', answer); await page.settle();
    assert.match(text(page.section.component()), /cannot be reached/); page.cleanup();
  });
}
test('unreachable then 404 removes the section', async () => {
  const page = browser('en', () => Promise.reject(new Error('offline'))); await page.settle();
  assert.ok(page.section);
  page.setAnswer(() => Promise.reject(new Error('transport failure for /api/majed-subscriptions.status: HTTP 404')));
  page.tick(); await page.settle(); assert.equal(page.section, undefined); page.cleanup();
});
test('unreachable then success restores both parts', async () => {
  const page = browser('ar', () => Promise.reject(new Error('offline'))); await page.settle();
  assert.match(text(page.section.component()), /[\u0600-\u06ff]/);
  page.setAnswer(() => Promise.resolve({ ok: true, value: { component: 'subscriptions' } }));
  page.tick(); await page.settle();
  assert.match(text(page.section.component()), /حسابات الاشتراك.*موفرو API/);
  assert.equal(page.section.component().children.flat().filter(node => node?.props?.role === 'alert').length, 0);
  page.cleanup();
});

test('assembled core entry completes registrations when Subscriptions setup throws or rejects', async () => {
  const assembled = await readFile(new URL('../dist/client.js', import.meta.url), 'utf8');
  for (const failure of ['inject', 'primitives', 'locale', 'effect', 'async inject', 'async effect', 'async locale']) {
    const registrations = [], effects = [], errors = [], pending = [];
    let entry;
    vm.runInNewContext(assembled, {
      window: { __ModuleLoader__: { load: ({ factory }) => { entry = factory(id => {
        if (id === '@deepseek-ai/dsh-client-ui-primitives' && failure === 'primitives') throw new Error('primitives failed');
        return id === 'react' ? { Component: class {}, forwardRef: fn => fn, createElement() {} } : {};
      }); } } },
      console: { error: (...args) => errors.push(args) }, Error,
      setInterval() {}, clearInterval() {},
    });
    const subscriptions = {
      get() { return { rpc: { call: () => Promise.resolve({ ok: true, value: { component: 'subscriptions' } }) }, state: { subscribe: () => () => {}, getSnapshot: () => 'connected' } }; },
      slots: { inject: () => () => {} },
      // The #131 /fast contribution asks the Subscriptions scope for the host command service.
      inject(_, callback) { callback({ get: () => ({ register: () => () => {} }), effect: fn => fn() }); },
      locale: { register() {
        if (failure === 'async locale') return Promise.reject(new Error('async locale failed'));
        throw new Error('locale failed');
      }, bind() { return () => ''; } },
      effect(fn, label) {
        if (failure === 'effect' && label.endsWith('dictionaries')) throw new Error('effect failed');
        if (failure === 'async effect' && label.endsWith('dictionaries')) return Promise.reject(new Error('async effect failed'));
        return fn();
      },
    };
    const ctx = {
      effect: (_, label) => effects.push(label),
      slots: { inject: (_, fn) => fn(), register: options => registrations.push(options.id) },
      inject(names, callback) {
        // The #131 /fast contribution asks for the host command service; give it a minimal one.
        if (names.includes('commandUi')) { pending.push(Promise.resolve().then(() => callback({ get: () => ({ register: () => () => {} }), effect: fn => fn() }))); return; }
        if (failure === 'inject') throw new Error('inject failed');
        if (failure === 'async inject') return Promise.reject(new Error('async inject failed'));
        // Exercise deferred injection callbacks as well as synchronous registration failures.
        pending.push(Promise.resolve().then(() => callback(subscriptions)));
      },
    };
    assert.doesNotThrow(() => entry.apply(ctx));
    await Promise.all(pending); await Promise.resolve(); await Promise.resolve();
    assert.equal(registrations.length, 11, failure);
    assert.ok(registrations.includes('majed-notifications'), failure);
    assert.ok(registrations.includes('majed-ui-font-size'), failure);
    assert.ok(effects.includes('dsh-majed: apply settings'), failure);
    assert.equal(errors.length, 1, failure);
    assert.match(errors[0][0], /^dsh-majed: Subscriptions/);
  }
});
test('Arabic copy covers every new key and rendered content uses logical alignment', async () => {
  const en = JSON.parse(await readFile(new URL('../locale/en.json', import.meta.url))).subscriptions;
  const ar = JSON.parse(await readFile(new URL('../locale/ar.json', import.meta.url))).subscriptions;
  assert.deepEqual(Object.keys(ar).sort(), Object.keys(en).sort());
  Object.values(ar).forEach(value => assert.match(value, /[\u0600-\u06ff]/));
  const page = browser('ar'); await page.settle(); const view = page.section.component();
  assert.match(text(view), /حسابات الاشتراك.*موفرو API/);
  assert.equal(view.props.style.textAlign, 'start');
  for (const part of view.children.flat().filter(node => node?.tag === 'section')) {
    assert.ok(part.props.style.paddingBlock); assert.ok(part.props.style.borderBlockEnd);
  }
  page.cleanup(); assert.equal(page.section, undefined);
});

for (const locale of ['en', 'ar']) {
  test(`reference coexistence notice is localized and recovers on switch off: ${locale}`, async () => {
    const page = browser(locale); await page.settle();
    const notice = () => page.section.component().children.flat().find(node => node?.props?.role === 'status');
    assert.equal(notice(), undefined);
    page.setReferenceAnswer((channel, method, payload) => {
      assert.equal(channel, '/api'); assert.equal(method, 'subscriptions-auth.proxyGet');
      assert.equal(JSON.stringify(payload), '{}');
      return Promise.resolve({ ok: true, value: {} });
    });
    page.reconnect(); await page.settle();
    assert.match(text(notice()), locale === 'en' ? /reference plugin.*running.*only one.*switch.*off/i : /الإضافة المرجعية.*تعمل.*واحدة فقط.*أوقف/);
    for (const id of ['codex', 'claude', 'grok', 'copilot', 'antigravity']) assert.ok(text(notice()).includes(id));
    assert.equal(page.section.options.label(), locale === 'en' ? 'Subscriptions (Majed)' : 'الاشتراكات (Majed)');
    page.tick(); await page.settle(); assert.equal(page.registrations, 1);
    page.setReferenceAnswer(() => Promise.reject(new Error('transport failure for /api/subscriptions-auth.proxyGet: HTTP 404')));
    page.tick(); await page.settle(); assert.equal(notice(), undefined); page.cleanup();
  });
}
for (const response of [() => Promise.reject(new Error('offline')), () => Promise.reject(new Error('transport failure for /api/subscriptions-auth.proxyGet: HTTP 503')), () => Promise.resolve({ ok: false }), () => Promise.resolve(null)]) {
  test('unknown reference probe never displays a notice or blocks our section', async () => {
    const page = browser(); await page.settle();
    page.setReferenceAnswer(() => Promise.resolve({ ok: true })); page.tick(); await page.settle();
    page.setReferenceAnswer(response); page.tick(); await page.settle();
    assert.ok(page.section);
    assert.equal(page.section.component().children.flat().find(node => node?.props?.role === 'status'), undefined);
    page.cleanup();
  });
}

test('reference responses after a newer probe or disposal are ignored', async () => {
  const page = browser(); await page.settle();
  let resolve;
  page.setReferenceAnswer(() => new Promise(done => { resolve = done; }));
  page.tick();
  page.setReferenceAnswer(() => Promise.reject(new Error('transport failure for /api/subscriptions-auth.proxyGet: HTTP 404')));
  page.tick(); await page.settle(); resolve({ ok: true }); await page.settle();
  assert.equal(page.section.component().children.flat().find(node => node?.props?.role === 'status'), undefined);
  page.setReferenceAnswer(() => new Promise(done => { resolve = done; })); page.tick();
  page.cleanup(); resolve({ ok: true }); await page.settle(); assert.equal(page.section, undefined);
});
test('owned global registrations in src use the Majed namespace', async () => {
  for (const file of ['browser.ts', 'subscriptions.ts']) {
    const source = await readFile(new URL(`../src/${file}`, import.meta.url), 'utf8');
    const ids = [...source.matchAll(/(?:\bid:|\bpath:|\bmethod !==|\bNS =)\s*['"]([^'"]+)['"]/g)].map(match => match[1]);
    assert.ok(ids.length, file);
    // Deliberately shared provider-native model IDs and the reference's speed-tier option ids are not owned
    // global registrations (ADR-0002); the tier ids are values sent to the `setSpeed` endpoint.
    // #132: Claude's provider-native model IDs (`claude-*`) are shared the same way, and `oauth`/`keychain` are the values of the
    // Claude login `method` enum sent to the `login` endpoint, not a registration.
    for (const id of ids.filter(id => !['gpt-4o', 'gemini-2.5-pro', 'gpt-4.1', 'gpt-5.1-codex', 'gpt-5.1-codex-mini', 'gpt-5.1', 'standard', 'fast', 'oauth', 'keychain'].includes(id) && !/^(claude|grok)-/.test(id))) assert.match(id, /^(?:\/api\/)?majed[.-]/, `${file}: ${id}`);
    for (const [, label] of source.matchAll(/},?\)?\), ['"]([^'"]+)['"]\)/g)) assert.match(label, /^(?:dsh-)?majed:/, `${file}: ${label}`);
  }
});

// ---- #131 composer surfaces: usage badge, Speed control and /fast ----
function commandService() {
  const commands = new Map();
  return { commands, register(command) { commands.set(command.name, command); return () => { commands.delete(command.name); }; } };
}
const MEDIA_SURFACES = ['image_generate', 'dsh_majed_image_generate', 'video_generate', 'dsh_majed_video_generate'].map(key => `majed-toolview-${key}`).sort();
const SURFACES = ['majed-subscription-speed', 'majed-subscription-usage', ...MEDIA_SURFACES].sort();
test('composer surfaces register with majed ids while present and withdraw when absent', async () => {
  const page = browser('en', undefined, { commandService: commandService() }); await page.settle();
  assert.deepEqual(page.surfaces, SURFACES);
  assert.equal(page.live.get('majed-subscription-speed').options.name, 'conversation.input.right');
  assert.equal(page.live.get('majed-subscription-usage').options.name, 'conversation.composer.dock');
  assert.equal(page.live.get('majed-subscription-speed').options.order, 0);
  assert.equal(page.live.get('majed-subscription-usage').options.order, 10);
  assert.equal(page.live.get('majed-subscription-speed').options.locale, 'majed.subscriptions');
  page.setAnswer(() => Promise.reject(new Error('transport failure for /api/majed-subscriptions.status: HTTP 404')));
  page.tick(); await page.settle();
  assert.deepEqual(page.surfaces, [], 'component off: every composer surface is withdrawn');
  page.setAnswer(() => Promise.resolve({ ok: true, value: { component: 'subscriptions' } }));
  page.tick(); await page.settle();
  assert.deepEqual(page.surfaces, SURFACES, 'component back on: surfaces return once, without duplicates');
  page.cleanup();
  assert.deepEqual(page.surfaces, [], 'dispose unregisters every surface');
});
test('composer surfaces are withdrawn while the reference plugin serves and return when it stops', async () => {
  const page = browser('en', undefined, { commandService: commandService() }); await page.settle();
  assert.deepEqual(page.surfaces, SURFACES);
  page.setReferenceAnswer(() => Promise.resolve({ ok: true, value: {} }));
  page.tick(); await page.settle();
  assert.deepEqual(page.surfaces, []);
  assert.ok(page.section, 'the Settings section stays (with its coexistence notice)');
  page.setReferenceAnswer(() => Promise.reject(new Error('transport failure for /api/subscriptions-auth.proxyGet: HTTP 404')));
  page.tick(); await page.settle();
  assert.deepEqual(page.surfaces, SURFACES);
});
test('a composer surface that fails to register does not affect the section or the other surface', async () => {
  const originalError = console.error; const reports = []; console.error = (...args) => reports.push(args);
  try {
    const page = browser('en', undefined, { commandService: commandService(), failSlot: 'conversation.input.right' }); await page.settle();
    assert.ok(page.section, 'Settings section registered');
    assert.deepEqual(page.surfaces, ['majed-subscription-usage', ...MEDIA_SURFACES].sort());
  } finally { console.error = originalError; }
});
test('/fast registers as `fast`, is listed only while wanted, and offers Standard/Fast for a fast-capable model', async () => {
  const service = commandService(); const calls = [];
  const page = browser('en', (...args) => {
    calls.push(args);
    if (args[1] === 'majed-subscriptions.speed') return Promise.resolve({ ok: true, value: { tier: 'fast', fastModels: ['fast-model'] } });
    if (args[1] === 'majed-subscriptions.setSpeed') return Promise.resolve({ ok: true, value: { ok: true } });
    return Promise.resolve({ ok: true, value: { component: 'subscriptions' } });
  }, { commandService: service }); await page.settle();
  const command = service.commands.get('fast');
  assert.ok(command, '/fast registered');
  assert.equal(command.description(), 'Switch the Codex speed tier (Standard/Fast)');
  assert.equal(command.available(), true);
  assert.equal(command.ui.kind, 'popupSelect');
  const options = await command.ui.options({ sessionId: 's1' });
  assert.deepEqual(JSON.parse(JSON.stringify(options.map(o => [o.id, o.label, o.active]))), [['standard', 'Standard', false], ['fast', 'Fast', true]]);
  await command.ui.onSelect({ id: 'standard' }, { sessionId: 's1' });
  assert.deepEqual(JSON.parse(JSON.stringify(calls.filter(c => c[1] === 'majed-subscriptions.setSpeed').map(c => c[2]))), [{ sessionId: 's1', tier: 'standard' }]);
  assert.ok(calls.some(c => c[1] === 'majed-subscriptions.speed' && c[2].sessionId === 's1' && c[2].model === 'fast-model'), 'speed read carries the Codex model');
  page.setAnswer(() => Promise.reject(new Error('transport failure for /api/majed-subscriptions.status: HTTP 404')));
  page.tick(); await page.settle();
  assert.equal(command.available(), false, 'component off: /fast is not offered');
  await assert.rejects(() => command.ui.options({ sessionId: 's1' }), /no fast tier/);
  const before = calls.length;
  await command.ui.onSelect({ id: 'fast' }, { sessionId: 's1' });
  assert.equal(calls.length, before, 'component off: selecting does nothing');
});
test('/fast refuses a model without a fast tier and surfaces speed errors as a rejected popup', async () => {
  const service = commandService();
  const page = browser('en', (...args) => args[1] === 'majed-subscriptions.speed'
    ? Promise.resolve({ ok: true, value: { tier: 'standard', fastModels: ['other'] } })
    : Promise.resolve({ ok: true, value: { component: 'subscriptions' } }), { commandService: service }); await page.settle();
  await assert.rejects(() => service.commands.get('fast').ui.options({ sessionId: 's1' }), /no fast tier/);
  const failing = browser('en', (...args) => args[1] === 'majed-subscriptions.speed'
    ? Promise.reject(new Error('boom'))
    : Promise.resolve({ ok: true, value: { component: 'subscriptions' } }), { commandService: service }); await failing.settle();
  await assert.rejects(() => service.commands.get('fast').ui.options({ sessionId: 's1' }));
});
test('/fast contribution is removed on dispose and Arabic copy resolves', async () => {
  const service = commandService();
  const page = browser('ar', undefined, { commandService: service }); await page.settle();
  assert.match(service.commands.get('fast').description(), /Codex/);
  assert.notEqual(service.commands.get('fast').description(), 'commandFast');
  page.cleanup();
  assert.equal(service.commands.has('fast'), false);
});
