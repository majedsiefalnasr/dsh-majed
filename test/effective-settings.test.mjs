// Effective-settings proof (ticket #130 items 4 and 9): saved Manage settings change what the adapter
// advertises and sends. Fake HTTP only; the reference analogue is test/subagent-speed.spec.ts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { apply } from '../dist/subscriptions.js';

const CATALOG = { models: [
  { slug: 'fast-model', display_name: 'Fast model', context_window: 1000, max_context_window: 2000, service_tiers: [{ id: 'priority' }],
    supported_reasoning_levels: [{ effort: 'low' }, { effort: 'high' }], default_reasoning_level: 'low' },
  { slug: 'plain-model', display_name: 'Plain model', context_window: 500 },
] };

async function mount(pool = {}, sessions = {}) {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t130/effective-');
  const { saveAccountSession } = await import('../dist/auth/store.js');
  for (const account of ['a', 'b']) await saveAccountSession('codex', account, { accountId: account, email: `${account}@example.test`, accessToken: `synthetic-${account}`, refreshToken: 'synthetic-refresh', expiresAt: 2000000000000 });
  const requests = [], rateLimited = new Set();
  const savedFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.includes('/codex/models')) return new Response(JSON.stringify(CATALOG));
    if (url.endsWith('/codex/responses')) {
      const account = init.headers['chatgpt-account-id'];
      requests.push({ body: JSON.parse(String(init.body)), account });
      if (rateLimited.has(account)) return new Response('{"error":{"message":"rate limited"}}', { status: 429, headers: { 'retry-after': '60' } });
      return new Response('data: {"type":"response.output_text.delta","delta":"OK"}\n\ndata: {"type":"response.completed","response":{"usage":{"input_tokens":1,"output_tokens":1}}}\n\ndata: [DONE]\n\n');
    }
    throw new Error(`Unexpected outbound request: ${url}`);
  };
  const routes = new Map(), cleanups = []; let adapter;
  const ctx = { logger: { warn() {} }, llm: { registerAdapter(ids, value) { if (ids[0] === 'codex') adapter = value; return { replace() {} }; } },
    get: name => name === 'agents' ? { get: id => sessions[id] === undefined ? undefined : { session: { header: sessions[id] } } }
      : name === 'connection' ? { fetch: { register(route) { routes.set(route.path, route); return () => routes.delete(route.path); } } } : undefined,
    inject(names, fn) { if ([].concat(names).includes('connection')) fn(ctx); }, effect(fn) { const off = fn(); if (off) cleanups.push(off); } };
  apply(ctx, { codexClientVersion: '1.2.3', ...(pool.config ?? {}) });
  const call = async (endpoint, payload = {}) => {
    const method = `majed-subscriptions.${endpoint}`;
    const response = await routes.get(`/api/${method}`).fetch(new Request(`http://localhost/api/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'client-request', rpcId: 'fixture', method, payload }) }));
    return (await response.json()).result;
  };
  const stream = async (model, sessionId, extra = {}, expected = 1) => {
    const before = requests.length;
    for await (const chunk of adapter.stream({ provider: 'codex', model, messages: [], ...(sessionId === undefined ? {} : { sessionId }), ...extra })) void chunk;
    assert.equal(requests.length, before + expected, `${expected} upstream request(s)`);
    return requests.at(-1);
  };
  return { call, stream, requests, rateLimited, get adapter() { return adapter; }, dispose() { cleanups.reverse().forEach(off => off()); globalThis.fetch = savedFetch; } };
}

test('context window overrides are bounded by the advertised maximum and drive the advertised model', async () => {
  const host = await mount();
  try {
    const info = async () => (await host.adapter.resolveModel('codex', 'fast-model')).context.contextWindow;
    assert.equal(await info(), 1000);
    assert.equal((await host.call('setProviderSettings', { provider: 'codex', settings: { contextWindows: { 'fast-model': 1500 } } })).ok, true);
    assert.equal(await info(), 1500);
    for (const bad of [2001, 0, -5, 1.5, '1500', null]) {
      const result = await host.call('setProviderSettings', { provider: 'codex', settings: { contextWindows: { 'fast-model': bad } } });
      assert.equal(result.ok, false, `rejects ${JSON.stringify(bad)}`);
    }
    assert.equal(await info(), 1500, 'rejected saves leave the stored override untouched');
    assert.equal((await host.call('setProviderSettings', { provider: 'codex', settings: { contextWindows: {} } })).ok, true);
    assert.equal(await info(), 1000, 'clearing restores the advertised default');
    const rows = (await host.call('providerSettings', { provider: 'codex' })).value.models;
    const fast = rows.find(row => row.id === 'fast-model');
    assert.deepEqual([fast.defaultContextWindow, fast.maxContextWindow, fast.fastTier], [1000, 2000, true]);
    assert.equal(rows.find(row => row.id === 'plain-model').fastTier, false);
  } finally { host.dispose(); }
});

test('reasoning defaults, subagent speed and ordinary sessions stay independent per model', async () => {
  const host = await mount({}, { parent: {}, child: { origin: 'subagent', parentSession: 'parent' } });
  try {
    const effortOf = async () => (await host.adapter.resolveModel('codex', 'fast-model')).reasoning.defaultEffort;
    assert.equal(await effortOf(), 'low');
    assert.equal((await host.call('setModelDefault', { model: 'fast-model', effort: 'high' })).ok, true);
    assert.equal(await effortOf(), 'high');
    const rejected = await host.call('setModelDefault', { model: 'fast-model', effort: 'max' });
    assert.equal(rejected.ok, false); assert.match(rejected.error.message, /does not advertise/);
    assert.equal(await effortOf(), 'high', 'a rejected effort leaves the saved default');
    assert.equal((await host.call('setModelDefault', { model: 'fast-model' })).ok, true);
    assert.equal(await effortOf(), 'low', 'clearing restores the catalog default');

    assert.equal((await host.stream('fast-model', 'child')).body.service_tier, undefined, 'standard by default');
    const save = speeds => host.call('setProviderSettings', { provider: 'codex', settings: { subagentSpeeds: speeds } });
    assert.equal((await save({ 'fast-model': 'fast', 'plain-model': 'fast' })).ok, true);
    assert.equal((await host.stream('fast-model', 'child')).body.service_tier, 'priority', 'subagent follows its saved speed');
    assert.equal((await host.stream('fast-model', 'parent')).body.service_tier, undefined, 'ordinary sessions are not changed');
    assert.equal((await host.stream('fast-model', undefined)).body.service_tier, undefined, 'unknown sessions are not changed');
    assert.equal((await host.stream('plain-model', 'child')).body.service_tier, undefined, 'a model without the fast tier never sends it');
    assert.equal((await save({ 'fast-model': 'standard' })).ok, true);
    assert.equal((await host.stream('fast-model', 'child')).body.service_tier, undefined);
    for (const bad of ['turbo', 1, null]) assert.equal((await save({ 'fast-model': bad })).ok, false, `rejects ${JSON.stringify(bad)}`);
    assert.equal((await host.stream('fast-model', 'child', { reasoningEffort: 'high' })).body.reasoning.effort, 'high');
  } finally { host.dispose(); }
});

test('pool configuration is forwarded: failover needs pooling and automatic accounts', async () => {
  const attempt = async config => {
    const host = await mount({ config });
    try {
      await host.call('setDefault', { account: 'a' });
      host.rateLimited.add('a');
      let outcome = 'served';
      try { for await (const chunk of host.adapter.stream({ provider: 'codex', model: 'fast-model', messages: [] })) void chunk; }
      catch (error) { outcome = `failed: ${error.message}`; }
      return { outcome, accounts: host.requests.map(request => request.account) };
    } finally { host.dispose(); }
  };
  const enabled = await attempt({});
  assert.deepEqual(enabled.accounts, ['a', 'b'], 'pooled request fails over from the limited account');
  assert.equal(enabled.outcome, 'served');
  for (const config of [{ pool: { enabled: false } }, { pool: { autoAccounts: false } }, { pool: { autoFamilies: false } }]) {
    const result = await attempt(config);
    assert.deepEqual(result.accounts, ['a'], `no failover for ${JSON.stringify(config)}`);
    assert.match(result.outcome, /^failed: .*(rate limit|429)/i);
  }
});
