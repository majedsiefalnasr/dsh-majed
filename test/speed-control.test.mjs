// Composer Speed host half (ticket #131): `speed` / `setSpeed` endpoints and the per-session tier that drives the
// Codex `service_tier`. Fake HTTP only. Reference analogues: src/auth/rpc.ts `speed`/`setSpeed`, src/index.ts
// `speedBySession` / `selectedSpeed` / `speedFor` (v0.9.12) and test/subagent-speed.spec.ts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { apply } from '../dist/subscriptions.js';

const CATALOG = { models: [
  { slug: 'fast-model', display_name: 'Fast model', context_window: 1000, service_tiers: [{ id: 'priority' }] },
  { slug: 'plain-model', display_name: 'Plain model', context_window: 500 },
] };

async function mount(sessions = {}, accounts = ['a']) {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t131-speed-');
  const { saveAccountSession } = await import('../dist/auth/store.js');
  for (const account of accounts) await saveAccountSession('codex', account, { accountId: account, email: `${account}@example.test`, accessToken: `synthetic-${account}`, refreshToken: 'synthetic-refresh', expiresAt: 2000000000000 });
  const requests = [];
  const savedFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.includes('/codex/models')) return new Response(JSON.stringify(CATALOG));
    if (url.endsWith('/codex/responses')) {
      requests.push({ body: JSON.parse(String(init.body)), account: init.headers['chatgpt-account-id'] });
      return new Response('data: {"type":"response.output_text.delta","delta":"OK"}\n\ndata: {"type":"response.completed","response":{"usage":{"input_tokens":1,"output_tokens":1}}}\n\ndata: [DONE]\n\n');
    }
    throw new Error(`Unexpected outbound request: ${url}`);
  };
  const routes = new Map(), cleanups = []; let adapter;
  const ctx = { logger: { warn() {} }, llm: { registerAdapter(ids, value) { if (ids[0] === 'codex') adapter = value; return { replace() {} }; } },
    get: name => name === 'agents' ? { get: id => sessions[id] === undefined ? undefined : { session: { header: sessions[id] } } }
      : name === 'connection' ? { fetch: { register(route) { routes.set(route.path, route); return () => routes.delete(route.path); } } } : undefined,
    inject(names, fn) { if ([].concat(names).includes('connection')) fn(ctx); }, effect(fn) { const off = fn(); if (off) cleanups.push(off); } };
  apply(ctx, { codexClientVersion: '1.2.3' });
  const call = async (endpoint, payload = {}) => {
    const method = `majed-subscriptions.${endpoint}`;
    const response = await routes.get(`/api/${method}`).fetch(new Request(`http://localhost/api/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'client-request', rpcId: 'fixture', method, payload }) }));
    return (await response.json()).result;
  };
  const stream = async (model, sessionId) => {
    for await (const chunk of adapter.stream({ provider: 'codex', model, messages: [], ...(sessionId === undefined ? {} : { sessionId }) })) void chunk;
    return requests.at(-1);
  };
  return { call, stream, requests, routes, get adapter() { return adapter; }, dispose() { cleanups.reverse().forEach(off => off()); globalThis.fetch = savedFetch; } };
}

test('speed and setSpeed are registered under the majed-subscriptions prefix only', async () => {
  const host = await mount();
  try {
    assert.ok(host.routes.has('/api/majed-subscriptions.speed'));
    assert.ok(host.routes.has('/api/majed-subscriptions.setSpeed'));
    for (const path of host.routes.keys()) assert.ok(path.startsWith('/api/majed-subscriptions.'), path);
  } finally { host.dispose(); }
});

test('speed reports the session tier and the fast-capable models', async () => {
  const host = await mount({ s: {} });
  try {
    const state = await host.call('speed', { sessionId: 's', model: 'fast-model' });
    assert.equal(state.ok, true);
    assert.deepEqual(state.value, { tier: 'standard', fastModels: ['fast-model'] });
    assert.equal((await host.call('setSpeed', { sessionId: 's', tier: 'fast' })).ok, true);
    assert.equal((await host.call('speed', { sessionId: 's' })).value.tier, 'fast');
    assert.equal((await host.call('speed', { sessionId: 'other' })).value.tier, 'standard', 'tiers are per session');
  } finally { host.dispose(); }
});

test('an explicit Fast choice sends service_tier only on fast-capable models, and Standard stops it', async () => {
  const host = await mount({ ordinary: {}, other: {} });
  try {
    assert.equal((await host.stream('fast-model', 'ordinary')).body.service_tier, undefined);
    await host.call('setSpeed', { sessionId: 'ordinary', tier: 'fast' });
    assert.equal((await host.stream('fast-model', 'ordinary')).body.service_tier, 'priority');
    assert.equal((await host.stream('plain-model', 'ordinary')).body.service_tier, undefined, 'unsupported model never sends it');
    assert.equal((await host.stream('fast-model', 'other')).body.service_tier, undefined, 'other sessions unchanged');
    assert.equal((await host.stream('fast-model', undefined)).body.service_tier, undefined, 'unknown session unchanged');
    await host.call('setSpeed', { sessionId: 'ordinary', tier: 'standard' });
    assert.equal((await host.stream('fast-model', 'ordinary')).body.service_tier, undefined);
  } finally { host.dispose(); }
});

test('a subagent follows its saved model default until an explicit choice overrides it', async () => {
  const host = await mount({ parent: {}, child: { origin: 'subagent', parentSession: 'parent' } });
  try {
    assert.equal((await host.call('setProviderSettings', { provider: 'codex', settings: { subagentSpeeds: { 'fast-model': 'fast' } } })).ok, true);
    assert.equal((await host.call('speed', { sessionId: 'child', model: 'fast-model' })).value.tier, 'fast');
    assert.equal((await host.call('speed', { sessionId: 'parent', model: 'fast-model' })).value.tier, 'standard');
    assert.equal((await host.stream('fast-model', 'child')).body.service_tier, 'priority');
    await host.call('setSpeed', { sessionId: 'child', tier: 'standard' });
    assert.equal((await host.call('speed', { sessionId: 'child', model: 'fast-model' })).value.tier, 'standard', 'explicit Standard overrides the default');
    assert.equal((await host.stream('fast-model', 'child')).body.service_tier, undefined);
  } finally { host.dispose(); }
});

test('independent-entry accounts add their per-account model ids to the fast list', async () => {
  const host = await mount({ s: {} }, ['a', 'b']);
  try {
    assert.equal((await host.call('setProviderSettings', { provider: 'codex', settings: { accounts: { b: { independentEntry: true, poolEnabled: false, poolModels: [] } } } })).ok, true);
    const { value } = await host.call('speed', { sessionId: 's' });
    assert.ok(value.fastModels.includes('fast-model'));
    assert.ok(value.fastModels.some(id => id.startsWith('~account:') && id.endsWith(':fast-model')), JSON.stringify(value.fastModels));
    assert.ok(!value.fastModels.some(id => id.endsWith(':plain-model')));
  } finally { host.dispose(); }
});

test('speed validates its payload and rejects other providers', async () => {
  const host = await mount();
  try {
    for (const payload of [{}, { sessionId: '' }, { sessionId: 1 }, { sessionId: 's', model: 3 }, { sessionId: 's', model: '' }]) {
      assert.equal((await host.call('speed', payload)).ok, false, JSON.stringify(payload));
    }
    for (const payload of [{}, { sessionId: 's' }, { sessionId: 's', tier: 'turbo' }, { sessionId: 's', tier: 1 }, { sessionId: '', tier: 'fast' }]) {
      assert.equal((await host.call('setSpeed', payload)).ok, false, JSON.stringify(payload));
    }
    const tier = await host.call('setSpeed', { sessionId: 's', tier: 'turbo' });
    assert.match(tier.error.message, /payload\.tier must be "standard" or "fast"/);
    assert.equal((await host.call('speed', { sessionId: 's', provider: 'grok' })).ok, false);
  } finally { host.dispose(); }
});

test('no fast models are reported without a saved login', async () => {
  const host = await mount({ s: {} }, []);
  try { assert.deepEqual((await host.call('speed', { sessionId: 's' })).value, { tier: 'standard', fastModels: [] }); }
  finally { host.dispose(); }
});

test('after disposal the speed endpoints are gone from the transport', async () => {
  const host = await mount({ s: {} });
  host.dispose();
  assert.equal(host.routes.has('/api/majed-subscriptions.speed'), false);
  assert.equal(host.routes.has('/api/majed-subscriptions.setSpeed'), false);
});
