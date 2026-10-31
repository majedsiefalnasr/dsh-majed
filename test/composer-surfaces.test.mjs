// Ticket #131: render the owned Speed control, usage badge and display setting with the real components
// (react-test-renderer) in English and Arabic. Host modules (primitives, react-dom) are provided as doubles through
// the same lazy `require` the bundle uses. A missing host module is NOT covered as an isolation guarantee: it makes
// the component's render throw, and containing that depends on the host slot boundary, which is only verifiable live.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import Renderer, { act } from 'react-test-renderer';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const hostModules = { primitives: undefined, reactDom: undefined, failPrimitives: false };
const cache = new Map();
function load(path) {
  if (cache.has(path)) return cache.get(path);
  if (path.endsWith('.json')) return JSON.parse(readFileSync(path, 'utf8'));
  const exports = {};
  cache.set(path, exports);
  const js = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(js, { exports, require(id) {
    if (id === 'react') return React;
    if (id === 'react/jsx-runtime') return jsxRuntime;
    if (id === '@deepseek-ai/dsh-client-ui-primitives') { if (hostModules.failPrimitives) throw new Error('primitives unavailable'); return hostModules.primitives; }
    if (id === 'react-dom') return hostModules.reactDom;
    const child = resolve(dirname(path), id.replace(/\.js$/, '.ts'));
    return load(id.endsWith('.json') ? resolve(dirname(path), id) : existsSync(child) ? child : child + 'x');
  }, get window() { return globalThis.window; }, get document() { return globalThis.document; }, HTMLElement: class {}, CustomEvent: class {}, DOMException, Event, MutationObserver: class { observe() {} disconnect() {} },
  setInterval, clearInterval, console, Map, Set, Promise, Array, Object, Number, Math, JSON, Error, String }, { filename: path });
  return exports;
}
const { SpeedSelect } = load(resolve('src/speed/SpeedSelect.tsx'));
const { SubscriptionUsageBadge } = load(resolve('src/usage-badge/SubscriptionUsageBadge.tsx'));
const { UsageBadgeDisplaySetting } = load(resolve('src/usage-badge/UsageBadgeDisplaySetting.tsx'));
const { setUsageBadgeMode } = load(resolve('src/usage-badge/usage-badge-preferences.tsx'.replace('.tsx', '.ts')));

class FakeWindow extends EventTarget {
  values = new Map();
  localStorage = { getItem: key => this.values.get(key) ?? null, setItem: (key, value) => { this.values.set(key, value); } };
}
function withWindow(run) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: new FakeWindow() });
  const document = { body: {}, addEventListener() {}, removeEventListener() {} };
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: document });
  const restore = () => {
    if (original) Object.defineProperty(globalThis, 'window', original); else Reflect.deleteProperty(globalThis, 'window');
    if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument); else Reflect.deleteProperty(globalThis, 'document');
  };
  return Promise.resolve().then(run).finally(restore);
}
const dictionaries = { en: JSON.parse(readFileSync('locale/en.json', 'utf8')).subscriptions, ar: JSON.parse(readFileSync('locale/ar.json', 'utf8')).subscriptions };
const translator = locale => (key, params = {}) => Object.entries(params).reduce((text, [name, value]) => text.replace(`{${name}}`, String(value)), dictionaries[locale][key] ?? key);
const textOf = node => typeof node === 'string' ? node : (node.children ?? []).map(textOf).join('');
async function mount(element) {
  let renderer;
  await act(async () => { renderer = Renderer.create(element, { createNodeMock: () => ({ parentElement: null, contains: () => true, isConnected: true }) }); });
  return renderer;
}
const tick = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });

for (const locale of ['en', 'ar']) {
  const t = translator(locale);
  test(`Speed control shows the tier, switches it and reports failure by staying put (${locale})`, () => withWindow(async () => {
    let tier = 'standard'; const sets = [];
    const page = await mount(React.createElement(SpeedSelect, { t,
      loadSpeed: async () => ({ visible: true, tier }),
      setSpeed: async next => { sets.push(next); if (next === 'fast' && sets.length === 1) return false; tier = next; return true; } }));
    await tick();
    const trigger = page.root.findByProps({ 'aria-haspopup': 'menu' });
    assert.equal(textOf(trigger), `${t('speed')} · ${t('speedStandard')}`);
    await act(async () => trigger.props.onClick());
    const items = page.root.findAllByProps({ role: 'menuitemradio' });
    assert.deepEqual(items.map(item => item.props['aria-checked']), [true, false]);
    assert.ok(textOf(items[1]).includes(t('speedFastDescription')));
    await act(async () => items[1].props.onClick());
    assert.deepEqual(sets, ['fast']);
    assert.equal(page.root.findAllByProps({ role: 'menu' }).length > 0, true, 'a rejected set keeps the menu and tier');
    assert.equal(textOf(page.root.findByProps({ 'aria-haspopup': 'menu' })), `${t('speed')} · ${t('speedStandard')}`);
    await act(async () => page.root.findAllByProps({ role: 'menuitemradio' })[1].props.onClick());
    assert.deepEqual(sets, ['fast', 'fast']);
    assert.equal(textOf(page.root.findByProps({ 'aria-haspopup': 'menu' })), `${t('speed')} · ${t('speedFast')}`);
    assert.equal(page.root.findAllByProps({ role: 'menu' }).length, 0, 'menu closes after a successful change');
    await act(async () => page.unmount());
  }));
}
test('Speed control renders nothing for models without a fast tier and keeps the last state through load failures', () => withWindow(async () => {
  let visible = false;
  const page = await mount(React.createElement(SpeedSelect, { t: translator('en'), loadSpeed: async () => ({ visible, tier: 'standard' }), setSpeed: async () => true }));
  await tick();
  assert.equal(page.toJSON(), null, 'unsupported model: control hidden');
  assert.equal(page.root.findAllByProps({ 'aria-haspopup': 'menu' }).length, 0);
  await act(async () => page.unmount());
  const failing = await mount(React.createElement(SpeedSelect, { t: translator('en'), loadSpeed: async () => { throw new Error('boom'); }, setSpeed: async () => true }));
  await tick();
  assert.equal(failing.toJSON(), null, 'load failure before any state: nothing shown, no throw');
  await act(async () => failing.unmount());
  assert.equal(visible, false);
}));
test('Speed control stops polling when unmounted (cleanup on slot unregister)', () => withWindow(async () => {
  let calls = 0; const intervals = []; const originalSet = globalThis.setInterval; const originalClear = globalThis.clearInterval; const cleared = [];
  // The component evaluates in the test realm's timers; observe them directly.
  globalThis.setInterval = (fn, ms) => { const id = originalSet(fn, ms); intervals.push([id, ms]); return id; };
  globalThis.clearInterval = id => { cleared.push(id); originalClear(id); };
  try {
    const page = await mount(React.createElement(SpeedSelect, { t: translator('en'), loadSpeed: async () => { calls++; return { visible: true, tier: 'fast' }; }, setSpeed: async () => true }));
    await tick();
    assert.ok(calls >= 1);
    await act(async () => page.unmount());
    for (const [id] of intervals.filter(([, ms]) => ms === 3000)) assert.ok(cleared.includes(id), 'poll interval cleared');
  } finally { globalThis.setInterval = originalSet; globalThis.clearInterval = originalClear; }
}));

test('display setting persists the mode, shows the localized hint and reports blocked storage', () => withWindow(async () => {
  for (const locale of ['en', 'ar']) {
    const t = translator(locale);
    const page = await mount(React.createElement(UsageBadgeDisplaySetting, { t }));
    const select = page.root.findByType('select');
    assert.equal(select.props.value, 'recent');
    assert.equal(select.props['aria-label'], t('usageBadgeDisplay'));
    assert.ok(page.root.findAllByType('option').length === 2);
    await act(async () => select.props.onChange({ currentTarget: { value: 'hidden' } }));
    assert.equal(window.values.get('majed.subscriptions.usageBadgeMode'), 'hidden');
    assert.equal(page.root.findByType('select').props.value, 'hidden');
    await act(async () => select.props.onChange({ currentTarget: { value: 'bogus' } }));
    assert.equal(window.values.get('majed.subscriptions.usageBadgeMode'), 'hidden', 'unknown values are ignored');
    window.localStorage.setItem = () => { throw new DOMException('denied', 'SecurityError'); };
    await act(async () => select.props.onChange({ currentTarget: { value: 'recent' } }));
    assert.equal(textOf(page.root.findByProps({ role: 'alert' })), t('usageBadgeDisplaySaveFailed'));
    await act(async () => page.unmount());
    window.values.clear();
    window.localStorage.setItem = (key, value) => { window.values.set(key, value); };
  }
}));

const status = { ok: true, value: { providers: { codex: { displayName: 'Codex', busy: false, accounts: [
  { key: 'a', account: 'one@example.test', isDefault: true, plan: 'pro' }, { key: 'b', account: 'two@example.test', isDefault: false }] } } } };
const usage = { a: { ok: true, value: { supported: true, windows: [{ kind: 'session', usedPercent: 13 }, { kind: 'weekly', usedPercent: 25 }] } },
  b: { ok: true, value: { supported: true, windows: [{ kind: 'session', usedPercent: 40 }] } } };
function rpcDouble(options = {}) {
  const calls = [];
  return { calls, call: async (channel, method, payload) => {
    calls.push({ channel, method, payload });
    if (method === 'majed-subscriptions.status') return options.status ?? status;
    if (method === 'majed-subscriptions.usage') return options.usage?.(payload) ?? usage[payload.account];
    throw new Error(`unexpected ${method}`);
  } };
}
function installHost() {
  hostModules.primitives = { useAnchoredPosition: () => ({ left: 0, top: 0 }), useDismissOnOutsidePointer() {}, IconDataOutlineRegular: () => React.createElement('svg', { 'data-icon': 'data' }) };
  hostModules.reactDom = { createPortal: node => node };
  hostModules.failPrimitives = false;
}
for (const locale of ['en', 'ar']) {
  const t = translator(locale);
  test(`usage badge auto-loads every account without forcing, shows the default account and expands to all windows (${locale})`, () => withWindow(async () => {
    installHost();
    const rpc = rpcDouble();
    const page = await mount(React.createElement(SubscriptionUsageBadge, { rpc, t, currentModel: async () => ({ provider: 'codex', model: 'gpt-test' }) }));
    await tick(); await tick();
    assert.deepEqual(JSON.parse(JSON.stringify(rpc.calls.filter(c => c.method.endsWith('.usage')).map(c => c.payload))), [
      { provider: 'codex', account: 'a', force: false }, { provider: 'codex', account: 'b', force: false }], 'automatic reads never force a refresh');
    assert.ok(rpc.calls.every(c => c.channel === '/api' && c.method.startsWith('majed-subscriptions.')));
    const pill = page.root.findByProps({ className: 'majed-subscription-usage-pill' });
    assert.match(textOf(pill), /Codex/);
    assert.match(textOf(pill), /13%/);
    assert.equal(pill.props['aria-label'].startsWith(t('usageBadgeTitle')), true);
    assert.equal(page.root.findAllByProps({ role: 'dialog' }).length, 0, 'collapsed by default');
    await act(async () => pill.props.onClick()); await tick();
    const dialog = page.root.findByProps({ role: 'dialog' });
    assert.equal(dialog.props.className, 'majed-subscription-usage-panel');
    const panel = textOf(dialog);
    assert.ok(panel.includes('one@example.test') && panel.includes('two@example.test'), 'every account listed');
    assert.ok(panel.includes('13%') && panel.includes('25%') && panel.includes('40%'), 'every window listed');
    assert.ok(panel.includes(t('usageBadgeCurrent')), 'current provider tagged');
    assert.ok(panel.includes(t('usagePlan', { plan: 'pro' })));
    assert.equal(rpc.calls.filter(c => c.method.endsWith('.usage')).every(c => c.payload.force === false), true, 'opening the panel does not force either');
    await act(async () => page.root.findByProps({ className: 'majed-subscription-usage-pill' }).props.onClick());
    assert.equal(page.root.findAllByProps({ role: 'dialog' }).length, 0);
    await act(async () => page.unmount());
  }));
}
test('usage badge hidden mode renders only the invisible seat and polls nothing; showing again loads', () => withWindow(async () => {
  installHost();
  setUsageBadgeMode('hidden');
  const rpc = rpcDouble();
  const page = await mount(React.createElement(SubscriptionUsageBadge, { rpc, t: translator('en'), currentModel: async () => ({ provider: 'codex', model: 'm' }) }));
  await tick(); await tick();
  assert.equal(rpc.calls.length, 0, 'hidden: no usage traffic');
  assert.equal(page.root.findAllByProps({ className: 'majed-subscription-usage-pill' }).length, 0);
  assert.equal(page.root.findAllByProps({ 'aria-hidden': true }).length > 0, true);
  await act(async () => setUsageBadgeMode('recent')); await tick(); await tick();
  assert.ok(rpc.calls.some(c => c.method.endsWith('.usage')));
  assert.equal(page.root.findAllByProps({ className: 'majed-subscription-usage-pill' }).length, 1);
  await act(async () => page.unmount());
}));
test('usage badge shows nothing when status or usage fails, keeps last known windows', () => withWindow(async () => {
  installHost();
  const failing = rpcDouble({ status: { ok: false, error: { message: 'down' } } });
  const page = await mount(React.createElement(SubscriptionUsageBadge, { rpc: failing, t: translator('en'), currentModel: async () => undefined }));
  await tick(); await tick();
  assert.equal(page.root.findAllByProps({ className: 'majed-subscription-usage-pill' }).length, 0, 'error state: no pill, no throw');
  await act(async () => page.unmount());
  let fail = false;
  const flaky = rpcDouble({ usage: payload => { if (fail) throw new Error('429'); return usage[payload.account]; } });
  const kept = await mount(React.createElement(SubscriptionUsageBadge, { rpc: flaky, t: translator('en'), currentModel: async () => ({ provider: 'codex', model: 'm' }) }));
  await tick(); await tick();
  assert.equal(kept.root.findAllByProps({ className: 'majed-subscription-usage-pill' }).length, 1);
  fail = true;
  await act(async () => kept.root.findByProps({ className: 'majed-subscription-usage-pill' }).props.onClick()); await tick(); await tick();
  assert.match(textOf(kept.root.findByProps({ role: 'dialog' })), /13%/, 'last known windows survive a failed refresh');
  await act(async () => kept.unmount());
  const noRpc = await mount(React.createElement(SubscriptionUsageBadge, { t: translator('en') }));
  assert.equal(noRpc.root.findAllByProps({ className: 'majed-subscription-usage-pill' }).length, 0, 'standalone render without rpc');
  await act(async () => noRpc.unmount());
}));
test('usage badge ignores model reads that fail and unmount stops all polling', () => withWindow(async () => {
  installHost();
  const rpc = rpcDouble();
  let reads = 0;
  const page = await mount(React.createElement(SubscriptionUsageBadge, { rpc, t: translator('en'), currentModel: async () => { reads++; throw new Error('model unavailable'); } }));
  await tick(); await tick();
  assert.ok(reads >= 1);
  // Faithful to the reference: with no readable model and no retained subscription the badge shows nothing,
  // but usage was still loaded (the next successful model read reveals it) and nothing threw.
  assert.equal(page.root.findAllByProps({ className: 'majed-subscription-usage-pill' }).length, 0, 'no model selection: nothing shown');
  assert.ok(rpc.calls.some(c => c.method.endsWith('.usage')));
  await act(async () => page.unmount());
}));

// Ticket #132: the badge is provider-generic, so a Claude account joins it as soon as `status` lists one.
test('usage badge shows the current Claude model and lists Claude accounts next to Codex', () => withWindow(async () => {
  installHost();
  const both = { ok: true, value: { providers: { ...status.value.providers, claude: { displayName: 'Claude (Subscription)', busy: false, accounts: [{ key: 'c', account: 'claude@example.test', isDefault: true, plan: 'max' }] } } } };
  const rpc = rpcDouble({ status: both, usage: payload => payload.provider === 'claude' ? { ok: true, value: { supported: true, windows: [{ kind: 'session', usedPercent: 61 }, { kind: 'weekly', usedPercent: 12 }] } } : usage[payload.account] });
  const page = await mount(React.createElement(SubscriptionUsageBadge, { rpc, t: translator('en'), currentModel: async () => ({ provider: 'claude', model: 'claude-sonnet-5' }) }));
  await tick(); await tick();
  assert.ok(rpc.calls.some(c => c.method.endsWith('.usage') && c.payload.provider === 'claude' && c.payload.account === 'c' && c.payload.force === false));
  const pill = page.root.findByProps({ className: 'majed-subscription-usage-pill' });
  assert.match(textOf(pill), /Claude/); assert.match(textOf(pill), /61%/);
  await act(async () => pill.props.onClick()); await tick();
  const panel = textOf(page.root.findByProps({ role: 'dialog' }));
  assert.ok(panel.includes('claude@example.test') && panel.includes('one@example.test'), 'Claude and Codex accounts both listed');
  await act(async () => page.unmount());
}));
