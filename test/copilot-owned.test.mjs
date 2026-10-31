// #134 assembled host seam. All traffic, identities and credentials are fixtures.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { apply } from '../dist/subscriptions.js';
import { COPILOT_API_URL } from '../dist/providers/copilot.js';

const settle = () => new Promise(resolve => setImmediate(resolve));
function host() {
  const routes = new Map(), adapters = {}, cleanups = [];
  const ctx = { logger: { warn() {} }, llm: { registerAdapter(ids, adapter) { adapters[ids[0]] = adapter; return { replace() {} }; } },
    get: () => ({ fetch: { register(route) { routes.set(route.path, route); return () => routes.delete(route.path); } } }),
    effect(fn) { const cleanup = fn(); if (cleanup) cleanups.push(cleanup); }, inject(names, fn) { if (names.includes('connection')) fn(ctx); } };
  apply(ctx, { models: { copilot: [{ id: 'fixture-model', name: 'Fixture model' }] }, pool: { enabled: false } });
  return { adapters, async call(endpoint, payload = {}) {
    const method = `majed-subscriptions.${endpoint}`;
    const response = await routes.get(`/api/${method}`).fetch(new Request(`http://localhost/api/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'client-request', rpcId: 'fixture', method, payload: { provider: 'copilot', ...payload } }) }));
    return (await response.json()).result;
  }, dispose() { cleanups.reverse().forEach(fn => fn()); } };
}

test('Copilot RPC device login persists privately, lists models, streams chat and logs out without leaking tokens', async () => {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t134/host-');
  const savedFetch = globalThis.fetch, requests = [];
  let release;
  const token = new Promise(resolve => { release = resolve; });
  globalThis.fetch = async (url, init) => {
    url = String(url); requests.push({ url, init });
    if (url.endsWith('/login/device/code')) return Response.json({ device_code: 'fixture-private-code', user_code: 'ABCD-EFGH', verification_uri: 'https://github.com/login/device', interval: 0.001 });
    if (url.endsWith('/login/oauth/access_token')) { await token; return Response.json({ access_token: 'fixture-github-token' }); }
    if (url.includes('/api/releases/stable')) return Response.json(['1.107.0']);
    if (url.endsWith('/copilot_internal/v2/token')) return Response.json({ token: 'fixture-copilot-token', expires_at: 4000000000 });
    if (url.endsWith('/user')) return Response.json({ login: 'fixture-owner' });
    if (url === COPILOT_API_URL) return new Response('data: {"choices":[{"delta":{"content":"Fixture reply"},"finish_reason":null}]}\n\ndata: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n');
    throw new Error(`unexpected fixture request ${url}`);
  };
  const mounted = host();
  try {
    await settle();
    assert.deepEqual(await mounted.adapters.copilot.listModels('copilot'), []);
    assert.equal(requests.length, 0, 'unused provider has no network');
    const login = await mounted.call('login');
    assert.deepEqual(login.value, { authorizeUrl: 'https://github.com/login/device', userCode: 'ABCD-EFGH' });
    const pending = await mounted.call('status');
    assert.equal(pending.value.providers.copilot.busy, true);
    assert.equal(JSON.stringify(pending).includes('fixture-private-code'), false);
    release();
    // Poll only fixture progress; bounded and no real endpoint is reachable.
    for (let i = 0; i < 30; i++) { await new Promise(resolve => setTimeout(resolve, 2)); if (!(await mounted.call('status')).value.providers.copilot.busy) break; }
    const status = await mounted.call('status');
    const account = status.value.providers.copilot.accounts[0];
    assert.equal(account.account, 'fixture-owner');
    assert.equal(JSON.stringify(status).includes('fixture-github-token'), false);
    assert.equal(JSON.stringify(status).includes('fixture-copilot-token'), false);
    assert.equal((await mounted.adapters.copilot.listModels('copilot'))[0].id, 'fixture-model');
    const chunks = [];
    for await (const chunk of mounted.adapters.copilot.stream({ provider: 'copilot', model: 'fixture-model', messages: [], signal: new AbortController().signal })) chunks.push(chunk);
    assert.ok(JSON.stringify(chunks).includes('Fixture reply'));
    assert.equal((await mounted.call('usage', { account: account.key })).value.supported, false);
    assert.equal((await mounted.call('logout', { account: account.key })).ok, true);
    assert.deepEqual(await mounted.adapters.copilot.listModels('copilot'), []);
  } finally { release(); mounted.dispose(); globalThis.fetch = savedFetch; }
});
