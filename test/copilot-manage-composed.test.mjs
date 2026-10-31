// #134: actual rendered Manage -> owned RPC -> registered adapter. Synthetic accounts/HTTP only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { apply } from '../dist/subscriptions.js';
import { saveAccountSession } from '../dist/auth/store.js';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
function load(path) {
  const exports = {};
  const js = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(js, { exports, require(id) {
    if (id === 'react') return React;
    if (id === 'react/jsx-runtime') return { Fragment: React.Fragment, jsx: React.createElement ? (tag, props, key) => { const { children, ...rest } = props; return React.createElement(tag, { ...rest, key }, ...([].concat(children ?? []))); } : null, jsxs: (tag, props, key) => { const { children, ...rest } = props; return React.createElement(tag, { ...rest, key }, ...([].concat(children ?? []))); } };
    const child = resolve(dirname(path), id.replace(/\.js$/, '.ts'));
    return load(existsSync(child) ? child : child + 'x');
  }, document: { activeElement: null }, HTMLElement: class {}, window: { dispatchEvent() {} }, CustomEvent: class {}, console, Error });
  return exports;
}
const { ProviderAccountManager } = load(resolve('src/settings/ProviderAccountManager.tsx'));
const text = node => node.children.map(child => typeof child === 'string' ? child : text(child)).join('');
for (const locale of ['en', 'ar']) test(`Copilot rendered Manage persists two independent account drafts through real RPC in ${locale}`, async () => {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t134/manage-');
  for (const key of ['a', 'b']) await saveAccountSession('copilot', key, { account: `fixture-${key}`, accessToken: `fixture-${key}`, refreshToken: 'fixture-refresh', expiresAt: 4000000000000 });
  const savedFetch = globalThis.fetch, requests = [];
  globalThis.fetch = async (url, init) => {
    requests.push(String(url));
    if (String(url).includes('/api/releases/stable')) return Response.json(['1.107.0']);
    if (String(url).endsWith('/models')) return Response.json({ data: [{ id: 'shared', name: 'Shared', model_picker_enabled: true, supported_endpoints: ['/chat/completions'], capabilities: { supports: { vision: false, tool_calls: true } } }] });
    throw new Error(`Unexpected fixture HTTP ${url}`);
  };
  const routes = new Map(), cleanups = []; let adapter;
  const ctx = { logger: { warn() {} }, llm: { registerAdapter(ids, value) { if (ids[0] === 'copilot') adapter = value; return { replace() {} }; } },
    get: () => ({ fetch: { register(route) { routes.set(route.path, route); return () => routes.delete(route.path); } } }),
    effect(fn) { const off = fn(); if (off) cleanups.push(off); }, inject(names, fn) { if (names.includes('connection')) fn(ctx); } };
  apply(ctx, {});
  const calls = [];
  const rpc = { async call(_, method, payload) {
    calls.push({ method, payload });
    const response = await routes.get(`/api/${method}`).fetch(new Request(`http://localhost/api/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'client-request', rpcId: 'fixture', method, payload }) }));
    return (await response.json()).result;
  } };
  const dictionary = JSON.parse(readFileSync(`locale/${locale}.json`)).subscriptions;
  const t = (key, params = {}) => Object.entries(params).reduce((s, [k, v]) => s.replace(`{${k}}`, v), dictionary[key] ?? key);
  let page, closed = 0;
  try {
    await act(async () => { page = Renderer.create(React.createElement(ProviderAccountManager, { provider: 'copilot', name: 'Copilot', rpc, t, onClose() { closed++; } }), { createNodeMock: () => ({ showModal() {}, close() {} }) }); });
    for (let i = 0; i < 30 && !page.root.findAllByType('input').some(n => n.props.placeholder === 'Copilot'); i++) await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
    const root = page.root;
    assert.ok(root.findAllByType('input').some(n => n.props.placeholder === 'Copilot'), JSON.stringify(page.toJSON()));
    assert.equal(root.findAllByType('dialog').length, 1);
    const change = async (node, value) => act(async () => node.props.onChange({ target: typeof value === 'boolean' ? { checked: value } : { value } }));
    await change(root.findAllByType('input').find(n => n.props.placeholder === 'Copilot'), 'Fixture team');
    await change(root.findAllByType('input').find(n => n.props.placeholder === 'fixture-a'), 'Alpha');
    await change(root.findAllByType('input').find(n => n.props.placeholder === 'fixture-b'), 'Beta');
    const accounts = root.findAllByType('fieldset').filter(n => n.findAllByType('legend').length === 1 && n.findAllByType('legend')[0].parent === n);
    assert.equal(accounts.length, 2);
    for (const account of accounts) {
      const checks = account.findAllByType('input').filter(n => n.props.type === 'checkbox');
      await change(checks[0], false);
      await change(checks[1], true);
    }
    await act(async () => { root.findAllByType('button').find(n => text(n) === t('modelsSave')).props.onClick(); });
    for (let i = 0; i < 20 && !closed; i++) await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
    assert.equal(closed, 1);
    const saved = await rpc.call(null, 'majed-subscriptions.providerSettings', { provider: 'copilot', force: true });
    assert.equal(saved.ok, true);
    assert.equal(saved.value.settings.displayName, 'Fixture team');
    assert.equal(saved.value.settings.accounts.a.alias, 'Alpha');
    assert.equal(saved.value.settings.accounts.b.alias, 'Beta');
    const models = await adapter.listModels('copilot');
    assert.equal(models.length, 2);
    assert.ok(models.every(m => m.id.startsWith('~account:')));
    assert.ok(models.some(m => m.name.includes('Alpha')));
    assert.ok(models.some(m => m.name.includes('Beta')));
    assert.equal(adapter.providerInfo('copilot').name, 'Fixture team');
    assert.ok(calls.filter(c => c.method.endsWith('.providerSettings')).every(c => c.payload.provider === 'copilot'));
    assert.ok(requests.filter(url => url.endsWith('/models')).length >= 2);
  } finally { if (page) await act(async () => page.unmount()); cleanups.reverse().forEach(fn => fn()); globalThis.fetch = savedFetch; }
});
