// Ticket #133: saved preferences exercised through the actual registered Grok adapter.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { apply } from '../dist/subscriptions.js';

async function mount() {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t133-registered-');
  const store = await import('../dist/auth/store.js');
  for (const key of ['a', 'b']) await store.saveAccountSession('grok', key, { accessToken: `fixture-${key}`, refreshToken: 'fixture-refresh', expiresAt: 4000000000000, tokenEndpoint: 'https://auth.x.ai/token', account: `${key}@example.test` });
  const saved = globalThis.fetch, requests = [], routes = new Map(), cleanups = [], limited = new Set();
  const billing = new Map();
  globalThis.fetch = async (url, init = {}) => {
    if (String(url).includes('/billing')) {
      const value = billing.get(new Headers(init.headers).get('authorization'));
      return value instanceof Response ? value : Response.json(value ?? { config: { creditUsagePercent: 0 } });
    }
    if (String(url).endsWith('/responses')) {
      requests.push({ body: JSON.parse(init.body), headers: init.headers });
      if (limited.has(new Headers(init.headers).get('authorization'))) return new Response('{"error":{"message":"rate limited"}}', { status: 429, headers: { 'retry-after': '60' } });
      return new Response('data: {"type":"response.output_text.delta","delta":"OK"}\n\ndata: {"type":"response.completed","response":{"usage":{"input_tokens":1,"output_tokens":1}}}\n\ndata: [DONE]\n\n');
    }
    throw new Error(`Unexpected fixture request: ${url}`);
  };
  let adapter;
  const ctx = { logger: { warn() {} }, llm: { registerAdapter(ids, value) { if (ids[0] === 'grok') adapter = value; return { replace() {} }; } },
    get: () => ({ fetch: { register(route) { routes.set(route.path, route); return () => routes.delete(route.path); } } }),
    effect(fn) { const off = fn(); if (off) cleanups.push(off); }, inject(names, fn) { if ([].concat(names).includes('connection')) fn(ctx); } };
  apply(ctx, { models: { grok: [{ id: 'grok-4', name: 'Grok 4' }, { id: 'grok-other', name: 'Other' }] } });
  return { adapter, requests, limited, billing, async call(endpoint, payload) {
    const method = `majed-subscriptions.${endpoint}`;
    return (await (await routes.get(`/api/${method}`).fetch(new Request(`http://localhost/api/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'client-request', rpcId: 'fixture', method, payload }) }))).json()).result;
  }, async stream(model, extra = {}) { for await (const chunk of adapter.stream({ provider: 'grok', model, messages: [], ...extra })) void chunk; },
  dispose() { cleanups.reverse().forEach(off => off()); globalThis.fetch = saved; } };
}

test('registered Grok quota matrix ranks healthy accounts and degrades unavailable telemetry safely', async () => {
  for (const [label, first, second, expected] of [
    ['exhausted default', { config: { creditUsagePercent: 100 } }, { config: { creditUsagePercent: 0 } }, 'b'],
    ['healthy default', { config: { creditUsagePercent: 0 } }, { config: { creditUsagePercent: 100 } }, 'a'],
    ['both exhausted last resort', { config: { creditUsagePercent: 100 } }, { config: { creditUsagePercent: 100 } }, 'a'],
    ['missing telemetry', { config: null }, { config: null }, 'a'],
    ['billing unavailable', new Response('unavailable', { status: 503 }), new Response('unavailable', { status: 503 }), 'a'],
  ]) {
    const host = await mount();
    try {
      host.billing.set('Bearer fixture-a', first); host.billing.set('Bearer fixture-b', second);
      await host.call('setDefault', { provider: 'grok', account: 'a' });
      await host.stream('grok-4');
      assert.equal(new Headers(host.requests[0].headers).get('authorization'), `Bearer fixture-${expected}`, label);
      assert.equal(host.requests.length, 1, label);
    } finally { host.dispose(); }
  }
});

test('registered Grok pool fails over a rate-limited default without retrying a disabled member', async () => {
  const host = await mount();
  try {
    await host.call('setDefault', { provider: 'grok', account: 'a' });
    host.limited.add('Bearer fixture-a');
    await host.stream('grok-4');
    assert.deepEqual(host.requests.map(request => new Headers(request.headers).get('authorization')), ['Bearer fixture-a', 'Bearer fixture-b']);
    await host.call('setProviderSettings', { provider: 'grok', settings: { accounts: { b: { poolEnabled: false } } } });
    host.requests.length = 0;
    await assert.rejects(host.stream('grok-4'));
    assert.ok(host.requests.every(request => new Headers(request.headers).get('authorization') !== 'Bearer fixture-b'));
  } finally { host.dispose(); }
});

test('registered Grok preferences govern model visibility, independent entries and revoked prepared calls', async () => {
  const host = await mount();
  try {
    const save = settings => host.call('setProviderSettings', { provider: 'grok', settings });
    assert.equal((await save({ displayName: 'My Grok', visibleModels: ['grok-4'], modelDisplayNames: { 'grok-4': 'Chosen model' }, accounts: { a: { alias: 'Pinned A', independentEntry: true, poolEnabled: false }, b: { poolModels: ['grok-4'] } } })).ok, true);
    assert.equal(host.adapter.providerInfo('grok').name, 'My Grok');
    const models = await host.adapter.listModels('grok');
    assert.ok(models.some(model => model.id === '~account:a:grok-4' && model.name === 'Pinned A · Chosen model'));
    assert.ok(models.some(model => model.id === 'grok-4' && model.name === 'Chosen model'));
    assert.ok(!models.some(model => model.id.includes('grok-other')));
    await host.stream('~account:a:grok-4', { sessionId: 'fixture-affinity' });
    assert.equal(host.requests.at(-1).body.prompt_cache_key, 'fixture-affinity');
    assert.equal(host.requests.at(-1).body.model, 'grok-4');
    const prepared = await host.adapter.prepareCall('grok', '~account:a:grok-4');
    assert.equal((await save({ accounts: { a: { independentEntry: false, poolEnabled: false }, b: { poolModels: [] } } })).ok, true);
    const before = host.requests.length;
    await assert.rejects(async () => { for await (const chunk of prepared.stream({ provider: 'grok', model: '~account:a:grok-4', messages: [] })) void chunk; }, /unavailable/);
    await assert.rejects(host.stream('grok-4'), /eligible|unavailable/);
    assert.equal(host.requests.length, before, 'revocation and empty allowlists send no provider request');
  } finally { host.dispose(); }
});
