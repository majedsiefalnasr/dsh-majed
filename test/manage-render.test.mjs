import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import React from 'react';
import Renderer, { act } from 'react-test-renderer';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
function load(path) {
  const exports = {};
  const source = readFileSync(path, 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(js, { exports, require(id) {
    if (id === 'react') return React;
    if (id === 'react/jsx-runtime') return { Fragment: React.Fragment, jsx: (tag, props) => React.createElement(tag, props, props.children), jsxs: (tag, props) => React.createElement(tag, props, props.children) };
    const child = resolve(dirname(path), id.replace(/\.js$/, '.ts'));
    return load(existsSync(child) ? child : child + 'x');
  }, document: { activeElement: null }, HTMLElement: class {}, window: { dispatchEvent() {} }, CustomEvent: class {}, console });
  return exports;
}
for (const locale of ['en', 'ar']) test(`actual embedded manager controls retain failed drafts in ${locale}`, async () => {
  const dictionary = JSON.parse(readFileSync(`locale/${locale}.json`)).subscriptions;
  const t = (key, params = {}) => Object.entries(params).reduce((s, [k, v]) => s.replace(`{${k}}`, v), dictionary[key] ?? key);
  const calls = [];
  const rpc = { async call(_, method, payload) {
    calls.push({ method, payload });
    if (method.endsWith('.providerSettings')) return { ok: true, value: { provider: 'codex', settings: {}, accounts: [{ key: 'one', label: 'Fixture', models: [{ id: 'model', name: 'Model' }] }], models: [{ id: 'model', name: 'Model', efforts: [{ id: 'high', name: 'High' }], fastTier: true, defaultContextWindow: 100, maxContextWindow: 200 }], tools: ['image_generate', 'web_search'] } };
    return { ok: false, error: { message: 'fixture save failure' } };
  } };
  const { ProviderAccountManager } = load(resolve('src/settings/ProviderAccountManager.tsx'));
  let page;
  await act(async () => { page = Renderer.create(React.createElement(ProviderAccountManager, { provider: 'codex', name: 'Codex', rpc, t, onClose() {} }), { createNodeMock: () => ({ showModal() {}, close() {} }) }); });
  const root = page.root;
  assert.ok(root.findAllByType('dialog').length);
  assert.ok(root.findAllByType('input').filter(node => node.props.type === 'checkbox').length >= 3);
  const input = root.findAllByType('input').find(node => node.props.placeholder === 'Codex');
  assert.ok(input);
  await act(async () => input.props.onChange({ target: { value: 'Draft name' } }));
  const save = root.findAllByType('button').find(node => node.children.join('') === t('modelsSave'));
  await act(async () => save.props.onClick());
  assert.equal(input.props.value, 'Draft name');
  assert.ok(root.findAll(node => node.props.role === 'alert').length);
  assert.ok(calls.some(call => call.method.endsWith('.setProviderSettings')));
  await act(async () => page.unmount());
});
