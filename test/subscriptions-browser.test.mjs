import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const code = await readFile(new URL('../dist/subscriptions-client.js', import.meta.url), 'utf8');
function browser(locale = 'en') {
  let api, registered, timer, reconnect, dictionary;
  let answer = () => Promise.resolve({ ok: true, value: { component: 'subscriptions' } });
  const cleanups = [];
  const React = { createElement: (tag, props, ...children) => ({ tag, props, children }), useSyncExternalStore: (_, read) => read() };
  vm.runInNewContext(code + '\nresult(majedSubscriptionsFactory);', { result: factory => { api = factory(id => id === 'react' ? React : { IconSettingsOutlineMedium: 'svg' }); },
    setInterval: fn => { timer = fn; return 1; }, clearInterval() {}, Error });
  const connection = { rpc: { call: (...args) => answer(...args) }, state: { subscribe: fn => { reconnect = fn; return () => {}; }, getSnapshot: () => 'connected' } };
  const ctx = { get: () => connection, inject: (_, fn) => fn(ctx), effect: fn => cleanups.push(fn()),
    locale: { register: (_, dictionaries) => { dictionary = dictionaries[locale]; return () => {}; }, bind: () => key => dictionary[key] },
    slots: { inject: (_, fn) => { fn(); return () => { registered = undefined; }; }, register: (options, component) => { registered = { options, component }; return () => {}; } } };
  api.applySubscriptions(ctx);
  return { setAnswer(fn) { answer = fn; }, tick: () => timer(), reconnect: () => reconnect(),
    async settle() { await Promise.resolve(); await Promise.resolve(); },
    get section() { return registered; }, cleanup() { cleanups.reverse().forEach(fn => fn?.()); },
  };
}
function text(node) { return typeof node === 'string' ? node : node?.children?.flat(Infinity).map(text).join(' ') ?? ''; }
test('present component registers one section with both empty parts, then withdraws on absence', async () => {
  const page = browser(); await page.settle();
  assert.equal(page.section.options.id, 'subscriptions');
  assert.match(text(page.section.component()), /Subscription accounts.*No subscription accounts yet.*API providers.*No API providers yet/);
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
test('absent or unreachable never-seen component creates no section', async () => {
  const page = browser(); page.setAnswer(() => Promise.reject(new Error('transport failure for /api/majed-subscriptions.status: HTTP 404')));
  page.tick(); await page.settle(); assert.equal(page.section, undefined);
  page.setAnswer(() => Promise.reject(new Error('offline'))); page.tick(); await page.settle(); assert.equal(page.section, undefined); page.cleanup();
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
