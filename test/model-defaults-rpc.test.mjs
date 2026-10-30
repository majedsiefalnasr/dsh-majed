// Adapted from V1ki/dsh-plugin-subscriptions v0.9.12 (b802311) test/model-defaults-rpc.spec.ts, MIT; see src/PROVENANCE.md.
// Dispositions (owned endpoints differ from the reference by design):
//  - `provider` is optional and only `codex` is accepted, with the owned message "Only Codex is available"
//    (the reference listed every provider: "payload.provider must be one of").
//  - `modelDefaults` returns the reference `ModelDefaultsCatalog[]` (`[{ provider, models: [{ id, name, efforts, configured? }] }]`)
//    and honours a boolean `force` (final #130 review, test/final-130.test.mjs); the old stored-snapshot shape is gone.
//  - The unadvertised-effort message names the model and effort, as the reference does (final #130 review).
//  - Tier rows are never offered because the editor lists only real discovered models; asserted below.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { apply } from '../dist/subscriptions.js';

const CATALOG = { models: [{ slug: 'gpt-5.6-sol', display_name: 'GPT-5.6-Sol', supported_reasoning_levels: [{ effort: 'low' }, { effort: 'high' }], default_reasoning_level: 'low' }] };

async function mount(config = {}) {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t130/model-defaults-rpc-');
  const { saveAccountSession } = await import('../dist/auth/store.js');
  await saveAccountSession('codex', 'a', { accountId: 'a', accessToken: 'synthetic-a', refreshToken: 'synthetic-r', expiresAt: 2000000000000 });
  const savedFetch = globalThis.fetch;
  globalThis.fetch = async input => {
    if (String(input).includes('/codex/models')) return new Response(JSON.stringify(CATALOG));
    throw new Error(`Unexpected outbound request: ${String(input)}`);
  };
  const routes = new Map(), cleanups = []; const replaced = []; let adapter;
  const ctx = { logger: { warn() {} }, llm: { registerAdapter(_, value) { adapter = value; return { replace(ids) { replaced.push(...ids); } }; },
      listProviders: () => [{ id: 'codex', name: 'Codex' }], listModels: provider => adapter.listModels(provider), resolveModelInfo: (provider, model) => adapter.resolveModel(provider, model) },
    get: name => name === 'connection' ? { fetch: { register(route) { routes.set(route.path, route); return () => routes.delete(route.path); } } } : undefined,
    inject(names, fn) { if ([].concat(names).includes('connection')) fn(ctx); }, effect(fn) { const off = fn(); if (off) cleanups.push(off); } };
  apply(ctx, { codexClientVersion: '1.2.3', ...config });
  await new Promise(resolve => setTimeout(resolve, 30));
  const call = async (endpoint, payload = {}) => {
    const method = `majed-subscriptions.${endpoint}`;
    const response = await routes.get(`/api/${method}`).fetch(new Request(`http://localhost/api/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'client-request', rpcId: 'r', method, payload }) }));
    return (await response.json()).result;
  };
  const configured = async () => (await call('providerSettings', { provider: 'codex' })).value.models.find(model => model.id === 'gpt-5.6-sol')?.configured;
  const stored = async () => Object.fromEntries(((await call('modelDefaults')).value[0]?.models ?? []).filter(model => model.configured !== undefined).map(model => [model.id, model.configured]));
  return { call, replaced, configured, stored, dispose() { cleanups.reverse().forEach(off => off()); globalThis.fetch = savedFetch; } };
}

test('modelDefaults serves the stored snapshot and the editor rows carry the advertised efforts', async () => {
  const host = await mount();
  try {
    const catalog = (await host.call('modelDefaults')).value;
    assert.deepEqual(catalog, [{ provider: 'codex', models: [{ id: 'gpt-5.6-sol', name: 'GPT-5.6-Sol', efforts: [{ id: 'low', name: 'Low' }, { id: 'high', name: 'High' }] }] }], 'reference ModelDefaultsCatalog[], nothing configured yet');
    const row = (await host.call('providerSettings', { provider: 'codex' })).value.models[0];
    assert.deepEqual([row.id, row.name, row.efforts.map(effort => effort.id)], ['gpt-5.6-sol', 'GPT-5.6-Sol', ['low', 'high']]);
    assert.equal(row.configured, undefined);
  } finally { host.dispose(); }
});

test('setModelDefault persists, re-announces the picker, and the snapshot and rows report it', async () => {
  const host = await mount();
  try {
    await host.call('providerSettings', { provider: 'codex' }); // settle discovery announcements first
    const before = host.replaced.length;
    assert.deepEqual(await host.call('setModelDefault', { provider: 'codex', model: 'gpt-5.6-sol', effort: 'high' }), { ok: true, value: { ok: true } });
    assert.deepEqual(host.replaced.slice(before), ['codex'], 'the picker re-queries the catalog');
    assert.deepEqual(await host.stored(), { 'gpt-5.6-sol': 'high' });
    assert.equal(await host.configured(), 'high');
  } finally { host.dispose(); }
});

test('setModelDefault without effort clears the override', async () => {
  const host = await mount();
  try {
    await host.call('setModelDefault', { provider: 'codex', model: 'gpt-5.6-sol', effort: 'high' });
    assert.equal((await host.call('setModelDefault', { provider: 'codex', model: 'gpt-5.6-sol' })).ok, true);
    assert.equal(await host.configured(), undefined);
    assert.deepEqual(await host.stored(), {});
  } finally { host.dispose(); }
});

test('setModelDefault rejects unknown providers, empty efforts and a missing model', async () => {
  const host = await mount();
  try {
    await host.call('providerSettings', { provider: 'codex' }); // settle discovery announcements first
    const before = host.replaced.length;
    const badProvider = await host.call('setModelDefault', { provider: 'nope', model: 'gpt-5.6-sol', effort: 'high' });
    assert.equal(badProvider.ok, false); assert.match(badProvider.error.message, /Only Codex is available/);
    const badEffort = await host.call('setModelDefault', { provider: 'codex', model: 'gpt-5.6-sol', effort: '' });
    assert.equal(badEffort.ok, false); assert.match(badEffort.error.message, /payload\.effort must be a non-empty string/);
    const noModel = await host.call('setModelDefault', { provider: 'codex', effort: 'high' });
    assert.equal(noModel.ok, false); assert.match(noModel.error.message, /payload\.model must be a non-empty string/);
    assert.equal((await host.call('setModelDefault', { provider: 'codex', model: 'gpt-5.6-sol', effort: 7 })).ok, false);
    assert.deepEqual(await host.stored(), {}, 'nothing was persisted');
    assert.deepEqual(host.replaced.slice(before), [], 'rejected calls do not re-announce the picker');
  } finally { host.dispose(); }
});

test('setModelDefault rejects an effort the model catalog does not advertise and persists nothing', async () => {
  const host = await mount();
  try {
    const result = await host.call('setModelDefault', { provider: 'codex', model: 'gpt-5.6-sol', effort: 'max' });
    assert.equal(result.ok, false); assert.match(result.error.message, /model gpt-5\.6-sol does not advertise a "max" reasoning effort/);
    assert.equal(await host.configured(), undefined);
    assert.deepEqual(await host.stored(), {});
    assert.equal((await host.call('setModelDefault', { provider: 'codex', model: 'gpt-5.6-sol', effort: 'low' })).ok, true, 'an advertised effort passes');
    assert.equal((await host.call('setModelDefault', { provider: 'codex', model: 'gpt-5.6-sol' })).ok, true, 'clearing always passes the whitelist');
  } finally { host.dispose(); }
});

test('configured tier rows carry no effort or fast-tier controls', async () => {
  const host = await mount({ pool: { tiers: { 'smart-tier': [{ provider: 'codex', model: 'gpt-5.6-sol' }] } } });
  try {
    const rows = (await host.call('providerSettings', { provider: 'codex' })).value.models;
    const real = rows.find(model => model.id === 'gpt-5.6-sol'), tier = rows.find(model => model.id === 'smart-tier');
    assert.deepEqual(real.efforts.map(effort => effort.id), ['low', 'high'], 'the real model keeps its efforts');
    assert.ok(tier, 'the tier stays visible so it can be hidden or renamed');
    assert.deepEqual(tier.efforts, [], 'no effort control: the override would never apply to a tier');
    assert.equal(tier.fastTier, false, 'no speed control for a tier');
  } finally { host.dispose(); }
});
