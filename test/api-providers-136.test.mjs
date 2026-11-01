// Actual React component against native-shaped fake remotes. No live operations.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { create, act } from 'react-test-renderer';
import ts from 'typescript';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/api-providers.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, URL, JSON, Object, Set, Error });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const ok = value => ({ ok: true, value });
const model = [{ id: 'fixture-model', name: 'Fixture', contextWindow: 8192, maxTokens: 1024, input: ['text'], reasoningEfforts: false }];
async function fixture(locale, { omitCredentialMetadata = false, includeAccountProvider = false } = {}) {
  const dict = JSON.parse(readFileSync(new URL(`../locale/${locale}.json`, import.meta.url))).subscriptions;
  const ns = { ns: 'llm-pi-ai', revision: 4, base: { providers: { deployment: { baseURL: 'https://deployment.example.test' } } }, user: { providers: { custom: { displayName: 'Custom', baseURL: 'https://custom.example.test', api: 'openai-completions', models: model, apiKeyEnv: 'CUSTOM_API_KEY' } } }, value: {} };
  function resolve() { ns.value = { providers: { ...ns.base.providers, ...ns.user.providers } }; }
  resolve();
  const calls = [], listeners = new Map(); let failKey = false, failSettings = false;
  const entries = [{ provider: 'builtin', displayName: 'Built in', declared: false }, { provider: 'custom', displayName: 'Custom', declared: true }, { provider: 'deployment', displayName: 'Deployment', declared: true }].map(e => ({ ...e, settingsNs: ns.ns, settingsPath: ['providers', e.provider] }));
  if (includeAccountProvider) entries.push({ provider: 'deepseek-account', displayName: 'DeepSeek Account', settingsNs: ns.ns, settingsPath: [], declared: false });
  const credentials = { CUSTOM_API_KEY: { configured: true, writable: true, source: 'store' } };
  const remote = {
    $on(event, fn) { listeners.set(event, fn); return () => listeners.delete(event); },
    settings: {
      async describe() { calls.push(['describe']); return ok({ writable: true, namespaces: [structuredClone(ns)] }); },
      async mutate(name, ops, revision) {
        calls.push(['mutate', name, structuredClone(ops), revision]);
        if (revision !== ns.revision || failSettings) return { ok: false, error: { code: 'settings/conflict', message: 'UNSAFE_DIAGNOSTIC' } };
        for (const op of ops) {
          let target = ns.user;
          for (const part of op.path.slice(0, -1)) target = target[part] ??= {};
          if (op.op === 'unset') delete target[op.path.at(-1)]; else target[op.path.at(-1)] = structuredClone(op.value);
        }
        ns.revision++; resolve(); return ok(structuredClone(ns));
      },
    },
    credentials: {
      async describe(refs) { calls.push(['credentials.describe', refs]); return ok(omitCredentialMetadata ? {} : Object.fromEntries(refs.map(ref => [ref, credentials[ref] ?? { configured: false, writable: true }]))); },
      async set(ref, value) { calls.push(['set', ref, value]); if (failKey) return { ok: false, error: { message: value } }; credentials[ref] = { configured: true, writable: true }; return ok(); },
      async unset(ref) { calls.push(['unset', ref]); credentials[ref] = { configured: false, writable: true }; return ok(); },
    },
    llm: {
      async listConfigurableProviders() { return ok(entries); },
      async listProviders() { return ok([{ id: 'registered-only', name: 'Registered only' }]); },
      async discoverModels(...args) { calls.push(['discover', ...args]); return ok([{ id: 'discovered', name: 'Found', contextWindow: 4096, maxTokens: 512, inputModalities: ['text', 'image'] }]); },
    },
  };
  const Card = exports.createApiProviders(React, remote, key => dict[key]);
  let renderer, focusCount = 0;
  await act(async () => { renderer = create(React.createElement(Card), { createNodeMock: node => node.type === 'button' ? { focus() { focusCount++; } } : null }); });
  const textNode = node => typeof node === 'string' ? node : (node.children ?? []).map(textNode).join('');
  const buttons = (key, root = renderer.root) => root.findAll(n => n.type === 'button' && textNode(n) === dict[key]);
  const click = async (key, root) => { const button = buttons(key, root)[0]; assert.ok(button, key); assert.equal(button.props.disabled, false); await act(async () => { button.props.onClick(); }); };
  const field = async (key, value) => { const input = renderer.root.find(n => n.props['aria-label'] === dict[key] && ['input', 'select', 'textarea'].includes(n.type)); await act(async () => { input.props.onChange({ target: { value } }); }); };
  const row = id => renderer.root.find(n => n.props['data-majed-api-provider'] === id);
  const text = () => JSON.stringify(renderer.toJSON());
  return { dict, ns, calls, entries, credentials, remote, renderer, buttons, click, field, row, text, focusCount: () => focusCount,
    failKey(value) { failKey = value; }, failSettings(value) { failSettings = value; },
    async emit(event) { await act(async () => { listeners.get(event)?.(); }); },
    async dispose() { await act(async () => renderer.unmount()); assert.equal(listeners.size, 0); },
  };
}
test('safe API mode drafts survive a visit to the other mode (#138)', async () => {
  const p = await fixture('en');
  try {
    await p.click('apiAdd');
    await p.field('apiName', 'Retained catalog name');
    await p.field('apiKeyAction', 'set');
    await p.field('apiKey', 'dummy-visited-secret');
    await p.click('apiCustom');
    await p.field('apiRoute', 'retained-custom');
    await p.click('apiCatalog');
    assert.equal(p.renderer.root.find(n => n.type === 'input' && n.props['aria-label'] === p.dict.apiName).props.value, 'Retained catalog name');
    assert.equal(p.text().includes('dummy-visited-secret'), false);
    await p.click('apiCustom');
    assert.equal(p.renderer.root.find(n => n.type === 'input' && n.props['aria-label'] === p.dict.apiRoute).props.value, 'retained-custom');
    await p.click('apiCancel');
    await p.click('apiAdd');
    assert.equal(p.renderer.root.find(n => n.type === 'input' && n.props['aria-label'] === p.dict.apiName).props.value, '');
  } finally { await p.dispose(); }
});
test('inline API Add replaces its entry button and restores it on Cancel (#138)', async () => {
  const p = await fixture('en');
  try {
    await p.click('apiAdd');
    assert.equal(p.buttons('apiAdd').length, 0);
    await p.click('apiCancel');
    assert.equal(p.buttons('apiAdd').length, 1);
    assert.equal(p.focusCount(), 1);
  } finally { await p.dispose(); }
});
test('DeepSeek Account never exposes a generic key editor or credential lookup (#138)', async () => {
  const p = await fixture('en', { includeAccountProvider: true });
  try {
    assert.equal(p.buttons('apiEdit', p.row('deepseek-account')).length, 0);
    assert.equal(p.row('deepseek-account').findAll(n => n.props['data-majed-credential-status'] === 'account-unknown').length, 1);
    assert.equal(p.calls.filter(c => c[0] === 'credentials.describe').flatMap(c => c[1]).some(ref => ref.includes('DEEPSEEK_ACCOUNT')), false);
  } finally { await p.dispose(); }
});
test('missing credential metadata is unknown, not a missing key (#138)', async () => {
  const p = await fixture('en', { omitCredentialMetadata: true });
  try {
    assert.equal(p.row('custom').findAll(n => n.props['data-majed-credential-status'] === 'unknown').length, 1);
    assert.equal(p.text().includes(p.dict.apiKeyMissing), false);
  } finally { await p.dispose(); }
});
for (const locale of ['en', 'ar']) {
  test(`native provider list, catalog add, edit and key set/unset in ${locale}`, async () => {
    const p = await fixture(locale);
    try {
      assert.equal(p.renderer.root.findAll(n => n.props['data-majed-api-provider'] === 'registered-only').length, 0);
      assert.equal(p.renderer.root.findAll(n => n.props['data-majed-api-provider'] === 'builtin').length, 0);
      assert.ok(p.text().includes(p.dict.apiKeySet));
      assert.ok(p.row('deployment'), 'profile without a key is configured');
      assert.equal(p.buttons('apiDelete', p.row('deployment')).length, 0);
      await p.click('apiAdd');
      await p.field('apiCatalog', 'builtin');
      await p.field('apiName', 'My catalog');
      await p.field('apiURL', 'https://catalog.example.test');
      await p.field('apiKeyAction', 'set');
      await p.field('apiKey', 'dummy-fixture-only');
      assert.equal(p.renderer.root.find(n => n.type === 'input' && n.props['aria-label'] === p.dict.apiKey).props.type, 'password');
      await p.click('apiSave');
      assert.equal(p.ns.user.providers.builtin.displayName, 'My catalog');
      assert.equal(p.ns.user.providers.builtin.apiKeyEnv, 'BUILTIN_API_KEY');
      assert.equal(p.calls.find(c => c[0] === 'mutate')[3], 4);
      assert.deepEqual(p.calls.find(c => c[0] === 'set'), ['set', 'BUILTIN_API_KEY', 'dummy-fixture-only']);
      assert.equal(p.text().includes('dummy-fixture-only'), false);
      await p.click('apiEdit', p.row('custom'));
      await p.field('apiName', 'Edited'); await p.field('apiKeyAction', 'unset'); await p.click('apiSave');
      assert.equal(p.ns.user.providers.custom.displayName, 'Edited');
      assert.deepEqual(p.calls.find(c => c[0] === 'unset'), ['unset', 'CUSTOM_API_KEY']);
      assert.equal(p.buttons('apiDelete', p.row('builtin')).length, 0);
      assert.equal(p.text().includes('UNSAFE_DIAGNOSTIC'), false);
      assert.equal(p.dict.apiConflict === 'apiConflict', false);
      if (locale === 'ar') assert.match(p.dict.apiConflict, /[\u0600-\u06ff]/);
    } finally { await p.dispose(); }
  });
  test(`custom protocols, discovery and complete model editing in ${locale}`, async () => {
    for (const protocol of ['openai-completions', 'openai-responses', 'anthropic-messages']) {
      const p = await fixture(locale);
      try {
        await p.click('apiAdd'); await p.click('apiCustom'); await p.field('apiRoute', 'new-route'); await p.field('apiProtocol', protocol);
        await p.field('apiURL', 'https://new.example.test'); await p.click('apiFetch');
        assert.deepEqual(JSON.parse(JSON.stringify(p.calls.find(c => c[0] === 'discover').slice(1))), ['llm-pi-ai', { provider: 'new-route', baseURL: 'https://new.example.test', api: protocol }]);
        const edited = [{ id: 'discovered', name: 'Edited found', contextWindow: 4096, maxTokens: 512, input: ['text', 'image'] }];
        await p.field('apiModelName', 'Edited found'); await p.click('apiSave');
        assert.equal(p.ns.user.providers['new-route'].api, protocol);
        assert.equal(Object.hasOwn(p.ns.user.providers['new-route'], 'displayName'), false, 'blank optional name uses native fallback');
        assert.deepEqual(p.ns.user.providers['new-route'].models, edited);
        assert.equal(p.calls.some(c => c[0] === 'set'), false);
      } finally { await p.dispose(); }
    }
  });
  test(`inset model rows preserve metadata, add/remove and cancel in ${locale}`, async () => {
    const p = await fixture(locale);
    try {
      await p.click('apiEdit', p.row('custom'));
      assert.ok(p.row('custom').find(n => n.props['aria-label'] === p.dict.apiEditor));
      assert.equal(p.renderer.root.findAll(n => n.type === 'textarea').length, 0);
      await p.field('apiModelName', 'Renamed'); await p.click('apiSave');
      assert.deepEqual(p.ns.user.providers.custom.models, [{ ...model[0], name: 'Renamed' }]);
      await p.click('apiEdit', p.row('custom')); await p.click('apiModelAdd');
      const rows = p.renderer.root.findAll(n => n.props['data-majed-api-model'] !== undefined);
      assert.equal(rows.length, 2); await p.click('apiModelRemove', rows[1]);
      await p.field('apiModelID', 'cancelled'); await p.click('apiCancel');
      assert.equal(p.ns.user.providers.custom.models[0].id, 'fixture-model');
    } finally { await p.dispose(); }
  });
  test(`conflicts retain draft on edit and deletion; external invalidations refresh in ${locale}`, async () => {
    const p = await fixture(locale);
    try {
      await p.click('apiEdit', p.row('custom')); await p.field('apiName', 'Local intent');
      p.ns.revision++; p.ns.user.providers.custom.displayName = 'External'; p.ns.value.providers.custom.displayName = 'External';
      await p.emit('settings/document-updated'); await p.click('apiSave');
      assert.ok(p.text().includes(p.dict.apiConflict)); assert.ok(p.text().includes('Local intent')); assert.equal(p.ns.user.providers.custom.displayName, 'External');
      await p.click('apiCancel'); await p.emit('settings/document-updated'); assert.ok(p.text().includes('External'));
      p.ns.revision++; await p.click('apiDelete', p.row('custom')); assert.ok(p.text().includes(p.dict.apiConflict)); assert.ok(p.ns.user.providers.custom);
      await p.emit('llm/adapters-updated'); await p.click('apiDelete', p.row('custom')); assert.equal(p.ns.user.providers.custom, undefined);
      assert.equal(p.calls.some(c => c[0] === 'unset'), false, 'delete never removes shared credential');
    } finally { await p.dispose(); }
  });
  test(`read-only credentials refuse key changes without altering settings in ${locale}`, async () => {
    const p = await fixture(locale);
    try {
      p.credentials.CUSTOM_API_KEY.writable = false;
      await p.emit('credentials/reference-updated');
      await p.click('apiEdit', p.row('custom')); await p.field('apiKeyAction', 'unset'); await p.click('apiSave');
      assert.equal(p.calls.some(c => c[0] === 'unset'), false);
      assert.ok(p.text().includes(p.dict.apiFailed));
    } finally { await p.dispose(); }
  });
  test(`invalid drafts and settings failure never write keys or unrelated providers in ${locale}`, async () => {
    const p = await fixture(locale);
    try {
      const unrelated = JSON.stringify(p.ns.user.providers.custom);
      await p.click('apiAdd'); await p.click('apiCustom'); await p.field('apiRoute', 'invalid-route');
      await p.field('apiURL', 'https://invalid.example.test'); await p.click('apiModelAdd'); await p.field('apiModelID', '');
      await p.click('apiSave'); assert.ok(p.text().includes(p.dict.apiInvalid));
      assert.equal(p.calls.some(c => c[0] === 'mutate'), false);
      await p.click('apiCancel'); await p.click('apiAdd'); await p.field('apiCatalog', 'builtin');
      await p.field('apiKeyAction', 'set'); await p.field('apiKey', 'dummy-never-written');
      p.failSettings(true); await p.click('apiSave');
      assert.ok(p.text().includes(p.dict.apiConflict));
      assert.equal(p.calls.some(c => c[0] === 'set'), false);
      assert.equal(JSON.stringify(p.ns.user.providers.custom), unrelated);
    } finally { await p.dispose(); }
  });
  test(`partial key failure retries intent without replaying settings in ${locale}`, async () => {
    const p = await fixture(locale);
    try {
      await p.click('apiEdit', p.row('custom')); await p.field('apiName', 'Committed'); await p.field('apiKeyAction', 'set'); await p.field('apiKey', 'dummy-retry-only');
      p.failKey(true); await p.click('apiSave');
      assert.ok(p.text().includes(p.dict.apiPartial)); assert.equal(p.ns.user.providers.custom.displayName, 'Committed');
      assert.equal(p.text().includes('UNSAFE_DIAGNOSTIC'), false);
      const writes = p.calls.filter(c => c[0] === 'mutate').length;
      p.failKey(false); await p.click('apiSave');
      assert.equal(p.calls.filter(c => c[0] === 'mutate').length, writes);
      assert.equal(p.calls.filter(c => c[0] === 'set').length, 2);
      assert.equal(p.text().includes('dummy-retry-only'), false);
    } finally { await p.dispose(); }
  });
}
