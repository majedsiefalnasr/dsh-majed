// Rendered Manage/Proxy UI matrices (ticket #130 items 2, 5, 6, 7): real components under react-test-renderer
// with a controllable fake RPC. Reference analogues: account-manager-ui.spec.ts and SubscriptionsSection proxy dialog.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import React from 'react';
import Renderer, { act } from 'react-test-renderer';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mirrors the automatic JSX runtime: `jsxs` children are static, so only explicit keys matter.
function element(tag, props, key) {
  const { children, ...rest } = props;
  const list = children === undefined ? [] : Array.isArray(children) ? children : [children];
  return React.createElement(tag, key === undefined ? rest : { ...rest, key }, ...list);
}
function load(path) {
  const exports = {};
  const js = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(js, { exports, require(id) {
    if (id === 'react') return React;
    if (id === 'react/jsx-runtime') return { Fragment: React.Fragment, jsx: element, jsxs: element };
    const child = resolve(dirname(path), id.replace(/\.js$/, '.ts'));
    return load(existsSync(child) ? child : child + 'x');
  }, document: { activeElement: null }, HTMLElement: class {}, window: { dispatchEvent() {} }, CustomEvent: class {}, console, Error }, { filename: path });
  return exports;
}
const { ProviderAccountManager } = load(resolve('src/settings/ProviderAccountManager.tsx'));
const { ProxySettings } = load(resolve('src/settings/ProxySettings.tsx'));
const translator = locale => {
  const dictionary = JSON.parse(readFileSync(`locale/${locale}.json`)).subscriptions;
  return (key, params = {}) => Object.entries(params).reduce((s, [k, v]) => s.replace(`{${k}}`, v), dictionary[key] ?? key);
};
const deferred = () => { let resolveFn, rejectFn; const promise = new Promise((a, b) => { resolveFn = a; rejectFn = b; }); return { promise, resolve: resolveFn, reject: rejectFn }; };
const nodeMock = () => ({ showModal() {}, close() {} });
const text = node => node.children.map(child => typeof child === 'string' ? child : text(child)).join('');
const button = (root, label) => root.findAllByType('button').find(node => text(node) === label);
const alerts = root => root.findAll(node => node.props.role === 'alert' && typeof node.type === 'string').map(text);
const statuses = root => root.findAll(node => node.props.role === 'status' && typeof node.type === 'string').map(text);
const warnings = [];
const origError = console.error;
console.error = (...args) => { const line = args.map(String).join(' '); if (!line.includes('react-test-renderer is deprecated')) warnings.push(line); };
process.on('exit', () => { console.error = origError; });

function catalog(settings = {}) {
  return { provider: 'codex', settings, accounts: [{ key: 'one', label: 'Fixture', models: [{ id: 'm1', name: 'Model one' }, { id: 'm2', name: 'Model two' }] }],
    models: [{ id: 'm1', name: 'Model one', efforts: [{ id: 'low', name: 'Low' }, { id: 'high', name: 'High' }], fastTier: true, defaultContextWindow: 100, maxContextWindow: 200 },
      { id: 'm2', name: 'Model two', efforts: [{ id: 'low', name: 'Low' }, { id: 'high', name: 'High' }], defaultContextWindow: 100, maxContextWindow: 200 }],
    tools: ['image_generate', 'web_search'] };
}
async function mountManager(locale, handlers) {
  const t = translator(locale), calls = [], closed = [];
  const rpc = { async call(_, method, payload) {
    const name = method.replace('majed-subscriptions.', '');
    calls.push({ name, payload });
    return handlers[name](payload, calls.filter(call => call.name === name).length);
  } };
  let page;
  await act(async () => { page = Renderer.create(React.createElement(ProviderAccountManager, { provider: 'codex', name: 'Codex', rpc, t, onClose: () => closed.push(true) }), { createNodeMock: nodeMock }); });
  const root = page.root;
  const select = model => root.findAllByType('select').find(node => node.props['aria-label'] === `${model} ${t('modelDefaultsTitle')}`);
  const speed = model => root.findAllByType('select').find(node => node.props['aria-label'] === `${model} ${t('modelsSubagentSpeed')}`);
  const save = () => button(root, t('modelsSave'));
  return { page, root, t, calls, closed, select, speed, save, called: name => calls.filter(call => call.name === name) };
}
const ok = value => ({ ok: true, value });
const fail = message => ({ ok: false, error: { message } });

for (const locale of ['en', 'ar']) {
  test(`manager partial save keeps every draft field, reports saved efforts and retries per field in ${locale}`, async () => {
    warnings.length = 0;
    let settingsFailures = 1;
    const ui = await mountManager(locale, {
      providerSettings: () => ok(catalog()),
      setModelDefault: () => ok({}),
      setProviderSettings: () => settingsFailures-- > 0 ? fail('disk full') : ok({}),
    });
    const { root, t } = ui;
    await act(async () => ui.select('Model one').props.onChange({ target: { value: 'high' } }));
    await act(async () => ui.select('Model two').props.onChange({ target: { value: 'low' } }));
    await act(async () => ui.speed('Model one').props.onChange({ target: { value: 'fast' } }));
    const name = root.findAllByType('input').find(node => node.props.placeholder === 'Codex');
    await act(async () => name.props.onChange({ target: { value: 'Draft name' } }));
    await act(async () => ui.save().props.onClick());
    assert.deepEqual(ui.called('setModelDefault').map(call => [call.payload.model, call.payload.effort]), [['m1', 'high'], ['m2', 'low']]);
    assert.equal(ui.called('setProviderSettings').length, 1);
    assert.deepEqual(alerts(root), [`${t('modelsPartialSave')} ${t('accountsSaveFailed', { message: 'disk full' })}`]);
    assert.equal(ui.closed.length, 0, 'the dialog stays open after a failed save');
    assert.equal(name.props.value, 'Draft name');
    assert.equal(ui.select('Model one').props.value, 'high'); assert.equal(ui.select('Model two').props.value, 'low');
    assert.equal(ui.speed('Model one').props.value, 'fast');
    assert.equal(ui.save().props.disabled, false, 'saving can be retried');
    await act(async () => ui.save().props.onClick());
    assert.equal(ui.closed.length, 1, 'retry succeeds and closes');
    assert.equal(ui.called('setProviderSettings').at(-1).payload.settings.displayName, 'Draft name');
    assert.equal(JSON.stringify(ui.called('setProviderSettings').at(-1).payload.settings.subagentSpeeds), JSON.stringify({ m1: 'fast' }));
    assert.deepEqual(warnings, []);
    await act(async () => ui.page.unmount());
  });

  test(`manager stops at the first failing effort, never writes settings and does not claim partial success without one in ${locale}`, async () => {
    const ui = await mountManager(locale, {
      providerSettings: () => ok(catalog()),
      setModelDefault: ({ model }) => model === 'm1' ? fail('Model does not advertise that reasoning effort') : ok({}),
      setProviderSettings: () => ok({}),
    });
    const { root, t } = ui;
    await act(async () => ui.select('Model one').props.onChange({ target: { value: 'high' } }));
    await act(async () => ui.select('Model two').props.onChange({ target: { value: 'low' } }));
    await act(async () => ui.save().props.onClick());
    assert.deepEqual(ui.called('setModelDefault').map(call => call.payload.model), ['m1'], 'stops at the first failure');
    assert.equal(ui.called('setProviderSettings').length, 0);
    assert.deepEqual(alerts(root), [t('accountsSaveFailed', { message: 'Model does not advertise that reasoning effort' })]);
    assert.equal(ui.select('Model two').props.value, 'low');
    await act(async () => ui.page.unmount());
  });

  test(`manager sends loaded original plus draft so the server patches only this draft's field in ${locale}`, async () => {
    const latest = catalog({ tools: { image_generate: false }, contextWindows: { m2: 150 }, displayName: 'Other client' });
    const loaded = catalog();
    const ui = await mountManager(locale, {
      providerSettings: () => ok(loaded),
      setModelDefault: () => ok({}), setProviderSettings: () => ok({}),
    });
    const { root } = ui;
    const webSearch = root.findAllByType('input').filter(node => node.props.type === 'checkbox').find(node => node.parent.children.some(child => typeof child === 'string' && child.includes(ui.t('modelsWebSearch'))));
    await act(async () => webSearch.props.onChange({ target: { checked: false } }));
    const readsBefore = ui.called('providerSettings').length;
    await act(async () => ui.save().props.onClick());
    assert.equal(ui.called('providerSettings').length, readsBefore, 'saving performs no client-side re-read/merge');
    const { settings, original } = ui.called('setProviderSettings').at(-1).payload;
    assert.equal(settings.tools.web_search, false, 'this draft field is saved');
    assert.deepEqual(original, loaded.settings, 'the loaded snapshot travels as the patch baseline');
    // What the server does with it: only the changed field lands on top of another client's write.
    const { mergeIntent } = await import('../dist/preference-merge.js');
    const merged = mergeIntent(latest.settings, original, settings);
    assert.equal(merged.tools.web_search, false);
    assert.equal(merged.tools.image_generate, false, "the other client's field survives");
    assert.equal(JSON.stringify(merged.contextWindows), JSON.stringify({ m2: 150 }));
    assert.equal(merged.displayName, 'Other client', 'an untouched display name follows the latest value');
    assert.equal(ui.closed.length, 1);
    await act(async () => ui.page.unmount());
  });

  test(`manager serializes double submits, disables Cancel while saving and ignores completion after unmount in ${locale}`, async () => {
    warnings.length = 0;
    const gate = deferred();
    const ui = await mountManager(locale, {
      providerSettings: () => ok(catalog()),
      setModelDefault: () => ok({}),
      setProviderSettings: () => gate.promise,
    });
    const { root, t } = ui;
    await act(async () => ui.select('Model one').props.onChange({ target: { value: 'high' } }));
    let first; await act(async () => { first = ui.save().props.onClick(); await Promise.resolve(); });
    const saving = button(root, t('modelDefaultsSaving'));
    assert.ok(saving, 'the save button shows its busy label');
    await act(async () => { await saving.props.onClick(); });
    assert.equal(ui.called('setModelDefault').length, 1, 'a second submit while saving is ignored');
    assert.equal(button(root, t('imageClose')).props.disabled, true, 'Close is disabled while saving');
    assert.equal(button(root, t('cancel')).props.disabled, true, 'Cancel is disabled while saving');
    await act(async () => ui.page.unmount());
    gate.resolve(ok({}));
    await first;
    assert.equal(ui.closed.length, 0, 'an unmounted manager never reports completion');
    assert.deepEqual(warnings, [], 'no state update after unmount');
  });

  test(`manager shows a load failure with retry that reloads in ${locale}`, async () => {
    let down = true;
    const ui = await mountManager(locale, { providerSettings: () => down ? fail('catalog down') : ok(catalog()) });
    const { root, t } = ui;
    assert.ok(alerts(root).includes(t('accountsLoadFailed', { message: 'catalog down' })));
    down = false;
    await act(async () => button(root, t('modelDefaultsRetry')).props.onClick());
    assert.ok(!alerts(root).includes(t('accountsLoadFailed', { message: 'catalog down' })), 'the manager failure clears on a successful retry');
    assert.ok(root.findAllByType('input').find(node => node.props.placeholder === 'Codex'), 'account controls render after the retry');
    // The embedded model editor owns its own load and recovers through its Refresh control.
    assert.deepEqual(alerts(root), ['catalog down']);
    await act(async () => button(root, t('usageRefresh')).props.onClick());
    assert.deepEqual(alerts(root), []);
    assert.ok(ui.select('Model one'));
    await act(async () => ui.page.unmount());
  });
}

const PROXY_SECRET = 'fixture-proxy-secret-Zq9';
async function mountProxy(locale, handlers, view = { enabled: true, url: 'http://proxy.example.test:8080', username: 'fixture', passwordSet: true, bypass: ['localhost'] }) {
  const t = translator(locale), calls = [];
  const rpc = { async call(_, method, payload) {
    const name = method.replace('majed-subscriptions.', '');
    calls.push({ name, payload });
    return name === 'proxyGet' ? ok(view) : handlers[name](payload);
  } };
  let page;
  await act(async () => { page = Renderer.create(React.createElement(ProxySettings, { rpc, t }), { createNodeMock: nodeMock }); });
  const root = page.root;
  const input = index => root.findAllByType('input').filter(node => node.props.type !== 'checkbox')[index];
  const [url, username, password, bypass] = [0, 1, 2, 3];
  return { page, root, t, calls, input, url, username, password, bypass, called: name => calls.filter(call => call.name === name),
    open: async () => act(async () => button(root, t('proxyConfigure')).props.onClick()),
    clickTest: async () => act(async () => { await button(root, t('proxyTest')).props.onClick(); }),
    clickSave: async () => act(async () => { await button(root, t('proxySave')).props.onClick(); }),
    cancel: async () => act(async () => button(root, t('proxyCancel')).props.onClick()) };
}

for (const locale of ['en', 'ar']) {
  test(`proxy dialog never pre-fills the saved password and reuses, replaces or clears it by intent in ${locale}`, async () => {
    warnings.length = 0;
    const saved = [];
    const ui = await mountProxy(locale, { proxySet: payload => { saved.push(payload); return ok({ enabled: payload.enabled, url: payload.url, passwordSet: payload.password !== null, bypass: payload.bypass }); } });
    await ui.open();
    assert.equal(ui.input(ui.password).props.value, '', 'the password field is empty although one is saved');
    assert.equal(JSON.stringify(ui.page.toJSON()).includes(PROXY_SECRET), false);
    await ui.clickSave();
    assert.equal('password' in saved[0], false, 'an untouched password is omitted so the host reuses the stored one');
    await ui.open();
    await act(async () => ui.input(ui.password).props.onChange({ target: { value: PROXY_SECRET } }));
    await ui.clickSave();
    assert.equal(saved[1].password, PROXY_SECRET, 'a typed password replaces');
    await ui.open();
    assert.equal(ui.input(ui.password).props.value, '', 'reopening after a save never shows the typed password');
    assert.equal(JSON.stringify(ui.page.toJSON()).includes(PROXY_SECRET), false);
    const clear = ui.root.findAllByType('input').find(node => node.props.type === 'checkbox' && node.parent.children.some(child => typeof child === 'string' && child.includes(ui.t('proxyClearPassword'))));
    await act(async () => clear.props.onChange({ target: { checked: true } }));
    await act(async () => ui.input(ui.password).props.onChange({ target: { value: 'ignored-when-clearing' } }));
    await ui.clickSave();
    assert.equal(saved[2].password, null, 'clear wins over typed text');
    assert.deepEqual(warnings, []);
  });

  test(`proxy test sends the unsaved draft including disabled and bypass state and renders each outcome in ${locale}`, async () => {
    const outcomes = [{ ok: true, viaProxy: true, status: 204, latencyMs: 12 }, { ok: true, viaProxy: false, status: 200, latencyMs: 3 }, { ok: false, viaProxy: true, error: 'connect ECONNREFUSED' }];
    const ui = await mountProxy(locale, { proxyTest: () => ok(outcomes.shift()) }, { enabled: false, url: '', passwordSet: false, bypass: [] });
    const { root, t } = ui;
    await ui.open();
    await act(async () => ui.input(ui.url).props.onChange({ target: { value: ' http://proxy.example.test:8080 ' } }));
    await act(async () => ui.input(ui.bypass).props.onChange({ target: { value: 'localhost, *.internal\nexample.org' } }));
    await ui.clickTest();
    const sent = ui.called('proxyTest')[0].payload.proxy;
    assert.equal(JSON.stringify([sent.enabled, sent.url, sent.bypass]), JSON.stringify([false, 'http://proxy.example.test:8080', ['localhost', '*.internal', 'example.org']]));
    assert.equal('password' in sent, false);
    assert.deepEqual(statuses(root).filter(line => line.includes('204')), [t('proxyTestOk', { status: '204', ms: '12' })]);
    await ui.clickTest();
    assert.ok(statuses(root).includes(t('proxyTestOkDirect', { status: '200', ms: '3' })));
    await ui.clickTest();
    assert.ok(statuses(root).includes(t('proxyTestFail', { message: 'connect ECONNREFUSED' })));
  });

  test(`proxy save errors render as alerts, keep the dialog and draft, and carry no secret in ${locale}`, async () => {
    const ui = await mountProxy(locale, { proxySet: () => fail('Invalid proxy settings: credentials in URL [redacted]') });
    await ui.open();
    await act(async () => ui.input(ui.password).props.onChange({ target: { value: PROXY_SECRET } }));
    await ui.clickSave();
    assert.deepEqual(alerts(ui.root), ['Invalid proxy settings: credentials in URL [redacted]']);
    assert.equal(ui.root.findAllByType('dialog').length, 1, 'the dialog stays open');
    assert.equal(ui.input(ui.password).props.value, PROXY_SECRET, 'the user draft is kept for a retry');
    assert.equal(alerts(ui.root).join().includes(PROXY_SECRET), false);
  });

  test(`proxy stale test and stale save results are ignored after cancel, reopen and unmount in ${locale}`, async () => {
    warnings.length = 0;
    const testGate = deferred(), saveGate = deferred();
    const ui = await mountProxy(locale, { proxyTest: () => testGate.promise, proxySet: () => saveGate.promise });
    const { root, t } = ui;
    await ui.open();
    let pendingTest; await act(async () => { pendingTest = button(root, t('proxyTest')).props.onClick(); await Promise.resolve(); });
    assert.equal(button(root, t('proxyTesting')).props.disabled, true);
    await ui.cancel();
    await ui.open();
    assert.equal(button(root, t('proxyTest')).props.disabled, false, 'a reopened dialog is not stuck busy');
    await act(async () => { testGate.resolve(ok({ ok: true, viaProxy: true, status: 200, latencyMs: 1 })); await pendingTest; });
    assert.deepEqual(statuses(root).filter(line => line.includes('200')), [], 'the stale test result is not shown in the reopened dialog');
    let pendingSave; await act(async () => { pendingSave = button(root, t('proxySave')).props.onClick(); await Promise.resolve(); });
    await ui.cancel();
    await act(async () => { saveGate.resolve(ok({ enabled: false, url: 'http://stale.example.test', passwordSet: false, bypass: [] })); await pendingSave; });
    assert.equal(root.findAllByType('dialog').length, 0, 'a stale save never reopens or closes anything');
    assert.ok(statuses(root).some(line => line.includes('proxy.example.test')), 'the stale save does not replace the displayed status');
    // Unmount while a request is in flight.
    const lateGate = deferred();
    const second = await mountProxy(locale, { proxySet: () => lateGate.promise });
    await second.open();
    let pending; await act(async () => { pending = button(second.root, second.t('proxySave')).props.onClick(); await Promise.resolve(); });
    await act(async () => second.page.unmount());
    await act(async () => { lateGate.resolve(ok({ enabled: true, url: 'http://late.example.test', passwordSet: false, bypass: [] })); await pending; });
    assert.deepEqual(warnings, [], 'no state update after unmount');
    await act(async () => ui.page.unmount());
  });

  test(`proxy status line reflects load failure and stored configuration errors in ${locale}`, async () => {
    const broken = await mountProxy(locale, {}, { enabled: false, url: '', passwordSet: false, bypass: [], error: 'proxy.json is corrupt' });
    assert.ok(statuses(broken.root).includes(broken.t('proxyStatusError', { message: 'proxy.json is corrupt' })));
    const none = await mountProxy(locale, {}, { enabled: false, url: '', passwordSet: false, bypass: [] });
    assert.ok(statuses(none.root).includes(none.t('proxyStatusNone')));
  });
}
