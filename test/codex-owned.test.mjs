import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apply } from '../dist/subscriptions.js';
import { mkdtemp, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('owned Codex store isolates credentials and removes a logged-out account', async () => {
  const home = await mkdtemp(join(tmpdir(), 'majed-t129-store-'));
  process.env.DSH_HOME = home;
  const store = await import('../dist/auth/store.js');
  assert.equal(store.authFilePath(), join(home, 'plugins/majed/subscriptions/auth.json'));
  await store.saveAccountSession('codex', 'fixture', { accountId: 'fixture', accessToken: 'fake-access', refreshToken: 'fake-refresh', expiresAt: 2000000000000 });
  assert.equal((await stat(store.authFilePath())).mode & 0o777, 0o600);
  assert.equal((await stat(join(home, 'plugins/majed/subscriptions'))).mode & 0o777, 0o700);
  await store.deleteAccountSession('codex', 'fixture');
  assert.deepEqual(await store.listAccounts('codex'), []);
});

function host({ collision = false } = {}) {
  const routes = new Map(), cleanups = [];
  let adapter;
  const ctx = { logger: { warn() {} }, llm: { registerAdapter(ids, value) {
    assert.deepEqual(ids, ['codex']);
    if (collision) throw new Error('provider codex already registered');
    adapter = value; return { replace() {} };
  } }, get: () => ({ fetch: { register(route) { routes.set(route.path, route); return () => routes.delete(route.path); } } }),
  effect(fn) { const cleanup = fn(); if (cleanup) cleanups.push(cleanup); }, inject(_, fn) { fn(ctx); } };
  apply(ctx, { codexClientVersion: '1.2.3', models: { codex: [{ id: 'fixture-model', name: 'Fixture model' }] } });
  return { get adapter() { return adapter; }, async call(endpoint, payload = {}) {
    const method = `majed-subscriptions.${endpoint}`;
    const response = await routes.get(`/api/${method}`).fetch(new Request(`http://localhost/api/${method}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'client-request', rpcId: 'fixture', method, payload }),
    }));
    return (await response.json()).result;
  }, dispose() { cleanups.reverse().forEach(fn => fn()); }, routes };
}

test('assembled never-logged-in provider has no models or network; disposal removes every route', async () => {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t129-empty-');
  const savedFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error('network forbidden'); };
  const component = host();
  try {
    assert.deepEqual(await component.adapter.listModels('codex'), []);
    const status = await component.call('status');
    assert.deepEqual(status.value.providers.codex.accounts, []);
    assert.equal((await component.call('usage', { provider: 'codex', account: 'missing' })).ok, false);
    assert.equal(calls, 0);
  } finally { component.dispose(); globalThis.fetch = savedFetch; }
  assert.equal(component.routes.size, 0);
});

test('assembled login paste fallback persists identity, selects default, chats and logs out with fake HTTP only', async () => {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t129-flow-');
  const originalFetch = globalThis.fetch;
  const requests = [];
  const jwt = payload => `e30.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.fixture`;
  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), init });
    if (String(url).endsWith('/oauth/token')) return Response.json({ access_token: 'fake-access', refresh_token: 'fake-refresh', expires_in: 3600,
      id_token: jwt({ email: 'fixture@example.test', 'https://api.openai.com/auth': { chatgpt_account_id: 'fixture-workspace', chatgpt_plan_type: 'plus' } }) });
    if (String(url).endsWith('/codex/responses')) return new Response('data: {"type":"response.output_text.delta","delta":"Fixture reply"}\n\ndata: {"type":"response.completed","response":{"usage":{"input_tokens":1,"output_tokens":2}}}\n\n');
    throw new Error(`unexpected fixture request: ${url}`);
  };
  const component = host();
  try {
    const login = await component.call('login', { provider: 'codex' });
    assert.equal(login.ok, true);
    const url = new URL(login.value.authorizeUrl);
    const callback = new URL(url.searchParams.get('redirect_uri'));
    callback.searchParams.set('code', 'fake-code'); callback.searchParams.set('state', url.searchParams.get('state'));
    assert.equal((await component.call('manual', { provider: 'codex', input: callback.href })).ok, true);
    let status;
    for (let tries = 0; tries < 100; tries++) {
      status = (await component.call('status')).value.providers.codex;
      if (!status.busy) break;
      await new Promise(resolve => setImmediate(resolve));
    }
    assert.equal(status.busy, false);
    assert.equal(status.accounts[0].account, 'fixture@example.test');
    assert.equal(status.accounts[0].plan, 'plus');
    const account = status.accounts[0].key;
    assert.equal((await component.call('setDefault', { provider: 'codex', account })).ok, true);
    assert.equal((await component.adapter.listModels('codex'))[0].id, 'fixture-model');
    const chunks = [];
    for await (const chunk of component.adapter.stream({ provider: 'codex', model: 'fixture-model', messages: [{ role: 'user', content: [{ type: 'text', text: 'Fixture request' }] }], signal: new AbortController().signal })) chunks.push(chunk);
    assert.ok(chunks.some(chunk => JSON.stringify(chunk).includes('Fixture reply')));
    assert.equal((await component.call('logout', { provider: 'codex', account })).ok, true);
    assert.deepEqual((await component.call('status')).value.providers.codex.accounts, []);
    assert.deepEqual(await component.adapter.listModels('codex'), []);
    assert.equal(requests.filter(request => request.url.endsWith('/oauth/token')).length, 1);
  } finally { component.dispose(); globalThis.fetch = originalFetch; }
});

test('cancelling or disposing a pending authorization never exchanges or persists credentials', async () => {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t129-cancel-');
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => { requests++; throw new Error('forbidden'); };
  const component = host();
  try {
    assert.equal((await component.call('login', { provider: 'codex' })).ok, true);
    assert.equal((await component.call('cancel')).ok, true);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal((await component.call('status')).value.providers.codex.busy, false);
    assert.equal((await component.call('login', { provider: 'codex' })).ok, true);
    component.dispose();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(requests, 0);
    assert.deepEqual(await (await import('../dist/auth/store.js')).listAccounts('codex'), []);
  } finally { globalThis.fetch = originalFetch; if (component.routes.size) component.dispose(); }
});

test('reference collision is reported without replacing its provider or allowing login', async () => {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t129-collision-');
  const component = host({ collision: true });
  try {
    assert.match((await component.call('status')).value.registrationError, /already registered/);
    assert.equal((await component.call('login', { provider: 'codex' })).ok, false);
    assert.equal(component.adapter, undefined);
  } finally { component.dispose(); }
});
