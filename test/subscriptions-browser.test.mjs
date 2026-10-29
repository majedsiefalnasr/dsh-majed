import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const code = await readFile(new URL('../dist/subscriptions-client.js', import.meta.url), 'utf8');
function browser(locale = 'en', initialAnswer) {
  let api, registered, timer, reconnect, dictionary, registrations = 0;
  let referenceAnswer = () => Promise.reject(new Error('transport failure for /api/subscriptions-auth.proxyGet: HTTP 404'));
  let answer = initialAnswer ?? (() => Promise.resolve({ ok: true, value: { component: 'subscriptions' } }));
  const cleanups = [];
  const React = { createElement: (tag, props, ...children) => ({ tag, props, children }), useSyncExternalStore: (_, read) => read() };
  vm.runInNewContext(code + '\nresult(majedSubscriptionsFactory);', { result: factory => { api = factory(id => id === 'react' ? React : { IconSettingsOutlineMedium: 'svg' }); },
    setInterval: fn => { timer = fn; return 1; }, clearInterval() {}, Error });
  const connection = { rpc: { call: (...args) => args[1] === 'subscriptions-auth.proxyGet' ? referenceAnswer(...args) : answer(...args) }, state: { subscribe: fn => { reconnect = fn; return () => {}; }, getSnapshot: () => 'connected' } };
  const ctx = { get: () => connection, inject: (_, fn) => fn(ctx), effect: fn => cleanups.push(fn()),
    locale: { register: (_, dictionaries) => { dictionary = dictionaries[locale]; return () => {}; }, bind: () => key => dictionary[key] },
    slots: { inject: (_, fn) => { fn(); return () => { registered = undefined; }; }, register: (options, component) => { assert.equal(registered, undefined, 'no duplicate registration'); registrations++; registered = { options, component }; return () => {}; } } };
  api.applySubscriptions(ctx);
  return { setReferenceAnswer(fn) { referenceAnswer = fn; }, get registrations() { return registrations; }, setAnswer(fn) { answer = fn; }, tick: () => timer(), reconnect: () => reconnect(),
    async settle() { await Promise.resolve(); await Promise.resolve(); },
    get section() { return registered; }, cleanup() { cleanups.reverse().forEach(fn => fn?.()); },
  };
}
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
        return id === 'react' ? { createElement() {} } : {};
      }); } } },
      console: { error: (...args) => errors.push(args) }, Error,
      setInterval() {}, clearInterval() {},
    });
    const subscriptions = {
      get() { return { rpc: { call: () => Promise.resolve({ ok: true, value: { component: 'subscriptions' } }) }, state: { subscribe: () => () => {}, getSnapshot: () => 'connected' } }; },
      slots: { inject: () => () => {} },
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
      inject(_, callback) {
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
    // Deliberately shared provider-native model IDs are not owned global registrations (ADR-0002).
    for (const id of ids.filter(id => !['gpt-5.1-codex', 'gpt-5.1-codex-mini', 'gpt-5.1'].includes(id))) assert.match(id, /^(?:\/api\/)?majed[.-]/, `${file}: ${id}`);
    for (const [, label] of source.matchAll(/},?\)?\), ['"]([^'"]+)['"]\)/g)) assert.match(label, /^(?:dsh-)?majed:/, `${file}: ${label}`);
  }
});
