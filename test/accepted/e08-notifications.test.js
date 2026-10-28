import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import userEvent from '@testing-library/user-event';

const source = await readFile(new URL('../../dist/client.js', import.meta.url), 'utf8');
const KEY = 'dsh-majed:settings:v1', h = React.createElement;
const secretTitle = 'Private project /secret/customer.txt';
// Q135: real mounted Settings and production built watcher/store. Only native
// hook inputs, presentation primitives and browser/OS effects are adapters.
// This is not evidence of installed native, paired or real OS delivery.
async function mount(t, { stored, permission = 'granted', supported = true, secure = true, constructorFails = false, registration, requestPermission } = {}) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><main></main></body></html>', { url: 'https://example.test', runScripts: 'outside-only', pretendToBeVisual: true });
  const { window } = dom, { document } = window, previous = new Map();
  for (const [key, value] of Object.entries({ window, document, IS_REACT_ACT_ENVIRONMENT: true })) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  if (stored) window.localStorage.setItem(KEY, JSON.stringify(stored));
  window.localStorage.setItem('unrelated', 'keep');
  let focused = false, permissionRequests = 0, vibrations = 0;
  document.hasFocus = () => focused;
  window.focus = () => { focused = true; };
  Object.defineProperty(window, 'isSecureContext', { value: secure });
  window.navigator.vibrate = () => { vibrations++; };
  if (registration) Object.defineProperty(window.navigator, 'serviceWorker', { value: { getRegistration: registration } });
  const notifications = [], navigation = [], effects = [], registrations = new Map(), dictionaries = new Map();
  class BrowserNotification {
    static permission = permission;
    static async requestPermission() { permissionRequests++; return this.permission = requestPermission ? await requestPermission() : 'granted'; }
    constructor(title, options) {
      if (constructorFails) throw new Error('Illegal constructor');
      this.title = title; this.options = options; notifications.push(this);
    }
    close() { this.closed = true; this.onclose?.(); }
  }
  if (supported) window.Notification = BrowserNotification;
  let plugin;
  const primitives = {
    Switch: ({ label, checked, onChange }) => h('button', { type: 'button', role: 'switch', 'aria-label': label, 'aria-checked': checked, onClick: () => onChange(!checked) }),
    Menu: ({ open, anchor, items, onSelect }) => h(React.Fragment, null, anchor, open && h('div', { role: 'menu' }, items.map(item => h('button', { key: item.id, onClick: () => onSelect(item.id) }, item.label)))),
  };
  window.__ModuleLoader__ = { load: module => { plugin = module.factory(name => {
    if (name === 'react') return React;
    if (name === '@deepseek-ai/dsh-client-ui-primitives') return primitives;
    throw new Error(`Unexpected dependency: ${name}`);
  }); } };
  window.eval(source);
  const ctx = {
    effect(fn) { const stop = fn(); if (typeof stop === 'function') effects.push(stop); },
    locale: { register(ns, values) { dictionaries.set(ns, values); return () => dictionaries.delete(ns); }, bind: ns => key => dictionaries.get(ns).en[key] ?? key },
    slots: { inject(name, fn) { const stop = fn(); if (stop) effects.push(stop); }, register(meta, Component) { registrations.set(meta.id, Component); return () => registrations.delete(meta.id); } },
    uiWorkspace: { openSession(id) { navigation.push(id); } },
    connection: { rpc: { call() { throw new Error('Notification preferences must not dispatch host operations'); } } },
  };
  plugin.apply(ctx);
  let status = new Map(), sessions = { byId: { target: { title: secretTitle } } }, listeners = new Set();
  const useSessionStatus = selector => React.useSyncExternalStore(fn => { listeners.add(fn); return () => listeners.delete(fn); }, () => selector(status));
  const useSessions = selector => selector(sessions);
  const root = createRoot(document.querySelector('main'));
  const render = (watch = true) => root.render(h(React.Fragment, null,
    ...['mode', 'done', 'action', 'title'].filter(id => registrations.has(`majed-notify-${id}`)).map(id => h('section', { key: id, 'data-row': id }, h(registrations.get(`majed-notify-${id}`), { t: ctx.locale.bind('majed') }))),
    watch && h(registrations.get('majed-notifications'), { useSessionStatus, useSessions, t: ctx.locale.bind('majed') })));
  await act(async () => render());
  let disposed = false;
  const dispose = async () => { if (!disposed) { disposed = true; await act(async () => { root.unmount(); effects.reverse().forEach(stop => stop()); }); } };
  t.after(async () => { await dispose(); window.close(); for (const [key, descriptor] of previous) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } });
  const user = userEvent.setup({ document }), interact = fn => act(async () => fn());
  return { window, document, notifications, navigation, dispose, interact, user,
    button: label => [...document.querySelectorAll('button')].find(b => b.textContent === label || b.getAttribute('aria-label') === label),
    saved: () => JSON.parse(window.localStorage.getItem(KEY)),
    focused(value) { focused = value; }, permission(value) { BrowserNotification.permission = value; },
    requests: () => permissionRequests, vibrations: () => vibrations,
    emitNow(value, id = 'target') { act(() => { status = new Map([[id, value]]); listeners.forEach(fn => fn()); }); },
    unmountWatcherNow() { act(() => render(false)); },
    unmountSettingsNow() { act(() => root.render(null)); },
    async emit(value, id = 'target') { await interact(() => { status = new Map([[id, value]]); listeners.forEach(fn => fn()); }); },
    async mode(label) { await interact(() => user.click(document.querySelector('[data-row="mode"] .majed-selector'))); await interact(() => user.click([...document.querySelectorAll('[role="menu"] button')].find(b => b.textContent === label))); },
    async remountWatcher() { await interact(() => render(false)); await interact(() => render()); },
  };
}

const click = (view, label) => view.interact(() => view.user.click(view.button(label)));

const approval = (key = 'approval-1') => ({ running: true, pendingInteraction: { key, callId: key, toolName: 'bash rm private.txt', command: 'private command', kind: 'approval' } });

test('mounted Always selection delivers private generic intervention and completion; constructor click targets the actual session', async t => {
  const view = await mount(t);
  await view.mode('Always (silent while app is focused)');
  assert.equal(view.saved().notifyMode, 'always');
  view.focused(true);
  await view.emit(approval());
  assert.equal(view.notifications.length, 1);
  assert.equal(view.notifications[0].title, 'DeepSeek Harness');
  assert.equal(view.notifications[0].options.body, 'Approval needed');
  assert.equal(view.notifications[0].options.silent, true);
  await view.interact(() => view.notifications[0].onclick());
  assert.deepEqual(view.navigation, ['target']);
  await view.emit({ running: false });
  assert.equal(view.notifications.length, 2);
  assert.equal(view.notifications[1].options.body, 'Finished — ready for review');
  assert.equal(view.vibrations(), 0);
  assert.equal(view.requests(), 0);
});

test('Off suppresses events but explicit test remains available; background skips foreground and switches stay independent', async t => {
  const view = await mount(t, { permission: 'default' });
  view.focused(true);
  await view.emit(approval());
  assert.equal(view.notifications.length, 0);
  assert.equal(view.requests(), 0);
  await view.mode('Off');
  await view.emit(approval('off-event'));
  await click(view, 'Send test');
  assert.equal(view.notifications.length, 1, 'explicit test works even in Off');
  assert.equal(view.requests(), 1, 'only explicit gesture asks OS');
  await view.mode('Always (silent while app is focused)');
  await click(view, 'Notify when action is needed');
  await view.emit(approval('muted-action'));
  assert.equal(view.notifications.length, 1);
  await view.emit({ running: false });
  assert.equal(view.notifications.length, 2, 'completion independent of action toggle');
  await click(view, 'Notify on completion');
  await click(view, 'Notify when action is needed');
  await view.emit(approval('enabled-action'));
  assert.equal(view.notifications.length, 3);
  await view.emit({ running: false });
  assert.equal(view.notifications.length, 3);
  view.focused(false);
  await view.mode('Only when app is in background');
  await view.emit(approval('background-action'));
  assert.equal(view.notifications.length, 4);
  assert.equal(view.notifications[3].options.silent, false, 'background sound follows OS');
});

test('per-setting notification resets are immediate, isolated and never request OS permission', async t => {
  const original = { fontSource: 'inter', uiFontSize: 18, bidi: false, notifyMode: 'off', notifyDone: false, notifyAction: false, notifyTitle: true, accountMenu: false, autoCopy: false, autoApprove: { fixture: 'safe' } };
  const view = await mount(t, { stored: original, permission: 'default' });
  for (const [label, key, value] of [
    ['Reset system notifications', 'notifyMode', 'background'],
    ['Reset completion notifications', 'notifyDone', true],
    ['Reset action notifications', 'notifyAction', true],
    ['Reset notification title', 'notifyTitle', false],
  ]) {
    const before = view.saved();
    const reset = view.button(label);
    assert.ok(reset, label);
    reset.focus();
    await view.interact(() => view.user.keyboard('[Enter]'));
    assert.deepEqual(view.saved(), { ...before, [key]: value });
    assert.equal(view.document.activeElement, reset);
    assert.equal(view.requests(), 0);
  }
  assert.equal(view.window.localStorage.getItem('unrelated'), 'keep');
  await view.emit(approval());
  assert.equal(view.notifications.length, 0, 'reset does not prompt or fake granted permission');
  assert.match(view.document.body.textContent, /Not allowed yet/);
  await click(view, 'Send test');
  assert.equal(view.requests(), 1);
  assert.equal(view.notifications.length, 1);
});

for (const scenario of [
  { name: 'unsupported', supported: false, expected: /Unsupported here/ },
  { name: 'insecure', secure: false, expected: /not served over HTTPS/ },
  { name: 'denied', permission: 'denied', expected: /Blocked/ },
  { name: 'constructor and unowned service worker', constructorFails: true, expected: /In-app alert/ },
]) test(`${scenario.name} reports honest status, falls back privately without vibration, and opens actual session`, async t => {
  let swCalls = 0;
  const view = await mount(t, { ...scenario, registration: async () => ({ showNotification: async () => { swCalls++; throw new Error('SW failed'); } }) });
  await view.mode('Always (silent while app is focused)');
  await view.emit(approval());
  assert.equal(view.notifications.length, 0);
  assert.equal(swCalls, 0, 'unowned SW payload alone cannot supply click navigation');
  assert.match(view.document.body.textContent, scenario.expected);
  assert.ok(!view.document.body.textContent.includes(secretTitle));
  assert.ok(!view.document.body.textContent.includes('private command'));
  assert.equal(view.vibrations(), 0);
  const open = view.button('Open session');
  assert.ok(open, 'fallback has actual session navigation');
  await click(view, 'Open session');
  assert.deepEqual(view.navigation, ['target']);
  assert.equal(view.requests(), 0);
  await view.dispose();
  assert.equal(view.document.querySelector('[data-majed-notification]'), null);
});

test('native event identities deduplicate repeated and disappearing snapshots but distinguish callIds, plan/question and new completions', async t => {
  const view = await mount(t);
  await view.mode('Always (silent while app is focused)');
  await view.emit(approval());
  await view.emit(approval());
  assert.equal(view.notifications.length, 1);
  await view.emit({ running: true });
  await view.emit(approval());
  assert.equal(view.notifications.length, 1, 'same event does not re-alert after a transient absent pending');
  await view.emit({ running: true, pendingInteraction: { callId: 'call-2', toolName: 'secret tool' } });
  await view.emit({ running: true, pendingInteraction: { callId: 'call-3', toolName: 'secret tool' } });
  assert.equal(view.notifications.length, 3, 'distinct native callIds survive missing key');
  await view.emit({ running: true, pendingInteraction: { kind: 'plan-review', key: 'shared' } });
  await view.emit({ running: true, pendingInteraction: { questions: [{ text: 'private question' }], key: 'shared' } });
  assert.equal(view.notifications.length, 5, 'different native intervention kinds remain distinct');
  assert.deepEqual(view.notifications.slice(3).map(n => n.options.body), ['Plan ready for your review', 'Waiting for your answer']);
  await view.emit({ running: false });
  await view.emit({ running: false });
  assert.equal(view.notifications.length, 6);
  await view.emit({ running: true });
  await view.emit({ running: false });
  assert.equal(view.notifications.length, 7, 'new run produces a new completion');
  await view.emit(approval('last'));
  await view.remountWatcher();
  await view.emit(approval('last'));
  assert.equal(view.notifications.length, 8, 'overlay remount is not a new interface/event');
  await view.dispose();
  const other = await mount(t);
  await other.emit(approval());
  assert.equal(other.notifications.length, 1, 'independent interface has its own dedup ledger');
  await other.dispose();
});

for (const cancel of ['Off', 'action toggle', 'private reset', 'resolution', 'overlay unmount', 'disposal', 'permission revocation']) test(`queued alert is fenced by ${cancel} and never replays the claimed event`, async t => {
  const view = await mount(t, { stored: { notifyTitle: true } });
  await view.mode('Always (silent while app is focused)');
  // Flush the real watcher effect, then revoke synchronously before its awaited
  // browser permission continuation (already granted) resumes.
  view.emitNow(approval('race'));
  if (cancel === 'Off') {
    act(() => view.document.querySelector('[data-row="mode"] .majed-selector').click());
    act(() => [...view.document.querySelectorAll('[role="menu"] button')].find(b => b.textContent === 'Off').click());
  } else if (cancel === 'action toggle') act(() => view.button('Notify when action is needed').click());
  else if (cancel === 'private reset') act(() => view.button('Reset notification title').click());
  else if (cancel === 'resolution') view.emitNow({ running: true });
  else if (cancel === 'overlay unmount') view.unmountWatcherNow();
  else if (cancel === 'permission revocation') view.permission('denied');
  else await view.dispose();
  await view.interact(async () => {});
  assert.equal(view.notifications.length, 0, 'no late OS notification');
  if (cancel !== 'permission revocation') assert.equal(view.document.querySelector('[data-majed-notification]'), null, 'no stale fallback');
  if (cancel !== 'disposal' && cancel !== 'overlay unmount') {
    await view.emit(approval('race'));
    assert.equal(view.notifications.length, 0, 'claimed event is not retried');
  }
  await view.dispose();
});

test('queued completion survives equivalent snapshots without losing a new completion or completing an unresolved intervention', async t => {
  const view = await mount(t);
  await view.emit({ running: true });
  view.emitNow({ running: false });
  view.emitNow({ running: false });
  await view.interact(async () => {});
  assert.equal(view.notifications.length, 1, 'equivalent snapshot is not cancellation');
  await view.emit({ running: true });
  await view.emit({ running: false, pendingInteraction: { kind: 'approval' } });
  assert.equal(view.notifications.length, 1, 'unidentified unresolved interaction is not completion');
  await view.emit({ running: true });
  await view.emit({ running: false });
  assert.equal(view.notifications.length, 2);
});

test('explicit test permission wait is canceled by Off without a late alert or automatic re-prompt', async t => {
  let release;
  const view = await mount(t, { permission: 'default', requestPermission: () => new Promise(resolve => { release = resolve; }) });
  act(() => view.button('Send test').click());
  assert.equal(view.requests(), 1);
  await view.mode('Off');
  await view.interact(() => release('granted'));
  assert.equal(view.notifications.length, 0);
  assert.equal(view.document.querySelector('[data-majed-notification]'), null);
  await view.emit(approval());
  assert.equal(view.requests(), 1);
  await click(view, 'Send test');
  assert.equal(view.notifications.length, 1, 'a fresh explicit Off test is still available');
});

test('unowned failing service-worker lookup is never invoked and constructor failure falls back once per native event', async t => {
  let lookups = 0;
  const view = await mount(t, { constructorFails: true, registration: async () => { lookups++; throw new Error('lookup failed'); } });
  await view.emit(approval());
  assert.equal(view.document.querySelectorAll('[data-majed-notification]').length, 1);
  await click(view, 'Dismiss alert');
  await view.emit(approval());
  assert.equal(view.document.querySelectorAll('[data-majed-notification]').length, 0, 'failed delivery does not retry after dismissal');
  await view.emit(approval('new'));
  assert.equal(view.document.querySelectorAll('[data-majed-notification]').length, 1);
  assert.equal(lookups, 0);
  await click(view, 'Notify when action is needed');
  assert.equal(view.document.querySelector('[data-majed-notification]'), null);
});

test('unmounting Settings while explicit permission waits cancels the test alert', async t => {
  let release;
  const view = await mount(t, { permission: 'default', requestPermission: () => new Promise(resolve => { release = resolve; }) });
  act(() => view.button('Send test').click());
  view.unmountSettingsNow();
  await view.interact(() => release('granted'));
  assert.equal(view.notifications.length, 0);
  assert.equal(view.document.querySelector('[data-majed-notification]'), null);
});

test('returning from browser permission settings refreshes denied status without prompting', async t => {
  const view = await mount(t);
  assert.match(view.document.body.textContent, /Allowed on this device/);
  view.permission('denied');
  await view.interact(() => view.window.dispatchEvent(new view.window.Event('focus')));
  assert.match(view.document.body.textContent, /Blocked/);
  assert.equal(view.requests(), 0);
  await view.emit(approval());
  assert.equal(view.notifications.length, 0);
  assert.ok(view.button('Open session'));
});

test('title disclosure is explicit, persisted per profile, and its reset immediately restores private text without changing other preferences', async t => {
  const view = await mount(t, { stored: { fontSource: 'inter', notifyDone: false } });
  const toggle = view.button('Include session title');
  assert.ok(toggle, 'native Settings exposes the optional title disclosure');
  await view.interact(() => view.user.click(toggle));
  assert.equal(view.saved().notifyTitle, true);
  await view.emit(approval());
  assert.equal(view.notifications[0].title, secretTitle);
  assert.equal(view.notifications[0].options.body, 'Approval needed');
  await view.interact(() => view.user.click(view.button('Reset notification title')));
  assert.equal(view.saved().notifyTitle, false);
  assert.equal(view.saved().notifyDone, false);
  assert.equal(view.saved().fontSource, 'inter');
  await view.emit(approval('approval-2'));
  assert.equal(view.notifications[1].title, 'DeepSeek Harness');
  assert.equal(view.requests(), 0);
  const persisted = view.saved();
  await view.dispose();
  const reload = await mount(t, { stored: { ...persisted, notifyTitle: true } });
  await reload.emit(approval());
  assert.equal(reload.notifications[0].title, secretTitle);
  await reload.dispose();
  const independent = await mount(t);
  await independent.emit(approval());
  assert.equal(independent.notifications[0].title, 'DeepSeek Harness');
  assert.equal(independent.window.localStorage.getItem(KEY), null);
});
