import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, stat } from 'node:fs/promises';
import { apply } from '../dist/subscriptions.js';

function host() {
  const routes = new Map(), cleanups = []; let adapter;
  const ctx = { logger: { warn() {} }, llm: { registerAdapter(_, value) { adapter = value; return { replace() {} }; } },
    get: () => ({ fetch: { register(route) { routes.set(route.path, route); return () => routes.delete(route.path); } } }),
    inject(_, fn) { fn(ctx); }, effect(fn) { const off = fn(); if (off) cleanups.push(off); } };
  apply(ctx, { codexClientVersion: '1.2.3', models: { codex: [{ id: 'fixture-model', name: 'Fixture model' }] } });
  return { get adapter() { return adapter; }, async call(endpoint, payload = {}, owner = true) {
    if (!owner) return { status: 401 };
    const method = `majed-subscriptions.${endpoint}`, route = routes.get(`/api/${method}`);
    assert.ok(route, `registered ${endpoint}`);
    const response = await route.fetch(new Request(`http://localhost/api/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'client-request', rpcId: 'fixture', method, payload }) }));
    return (await response.json()).result;
  }, dispose() { cleanups.reverse().forEach(off => off()); } };
}

test('Manage settings round-trip through owned RPC, update picker and enforce pool exclusion', async () => {
  const home = process.env.DSH_HOME = await mkdtemp('/tmp/majed-t130/settings-');
  const { saveAccountSession } = await import('../dist/auth/store.js');
  await saveAccountSession('codex', 'fixture', { accountId: 'fixture', email: 'fixture@example.test', accessToken: 'fake-access', refreshToken: 'fake-refresh', expiresAt: 2000000000000 });
  const original = globalThis.fetch; globalThis.fetch = async () => { throw new Error('network forbidden'); };
  const component = host();
  try {
    const before = await component.call('providerSettings', { provider: 'codex' });
    assert.equal(before.ok, true); assert.equal(before.value.accounts[0].key, 'fixture');
    assert.ok(before.value.models.some(model => model.id === 'fixture-model'));
    assert.equal((await component.call('setProviderSettings', { provider: 'codex', settings: { displayName: 'Work', accounts: { fixture: { alias: 'Primary', poolEnabled: false, independentEntry: true, poolModels: [] } } } })).ok, true);
    assert.equal((await component.call('setModelDefault', { model: 'fixture-model', effort: 'high' })).ok, true);
    assert.deepEqual((await component.call('modelDefaults')).value, { codex: { 'fixture-model': 'high' } });
    assert.equal((await component.call('setModelDefault', { model: 'fixture-model' })).ok, true);
    assert.deepEqual((await component.call('modelDefaults')).value, {});
    assert.equal(component.adapter.providerInfo('codex').name, 'Work');
    const models = await component.adapter.listModels('codex');
    assert.equal(models.length, 1); assert.match(models[0].id, /^~account:/); assert.match(models[0].name, /Primary/);
    await assert.rejects(component.adapter.resolveModel('codex', 'fixture-model'), /No eligible account/);
    assert.equal((await stat(`${home}/plugins/majed/subscriptions/provider-settings.json`)).mode & 0o777, 0o600);
    assert.equal((await component.call('providerSettings', {}, false)).status, 401);
  } finally { component.dispose(); globalThis.fetch = original; }
});
