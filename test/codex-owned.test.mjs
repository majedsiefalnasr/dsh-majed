import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apply } from '../dist/subscriptions.js';
import { mkdtemp, stat, mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';

test('owned Codex store isolates credentials and removes a logged-out account', async () => {
  const home = await mkdtemp('/tmp/majed-t129/store-');
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
  effect(fn) { const cleanup = fn(); if (cleanup) cleanups.push(cleanup); }, inject(names, fn) { if ([].concat(names).includes('connection')) fn(ctx); } };
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
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t129/empty-');
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
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t129/flow-');
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
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t129/cancel-');
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

test('foreign current and router stores remain byte-identical across reads, collision, own login and logout', async () => {
  const home = process.env.DSH_HOME = await mkdtemp('/tmp/majed-t129/foreign-');
  const foreign = ['subscriptions', 'router'].map(name => join(home, 'plugins', name, 'auth.json'));
  const bytes = JSON.stringify({ codex: { accountId: 'foreign', accessToken: 'fake-foreign', refreshToken: 'fake-foreign-refresh', expiresAt: 2000000000000 } });
  for (const file of foreign) { await mkdir(join(file, '..'), { recursive: true }); await writeFile(file, bytes); }
  const own = join(home, 'plugins/majed/subscriptions/auth.json');
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => { requests++; throw new Error('network forbidden'); };
  const component = host();
  const collision = host({ collision: true });
  try {
    assert.deepEqual((await component.call('status')).value.providers.codex.accounts, []);
    assert.deepEqual(await component.adapter.listModels('codex'), []);
    assert.deepEqual((await collision.call('status')).value.providers.codex.accounts, []);
    assert.equal(requests, 0);
    await assert.rejects(stat(own), { code: 'ENOENT' });
    const store = await import('../dist/auth/store.js');
    await store.saveAccountSession('codex', 'own', { accountId: 'own', accessToken: 'fake-own', refreshToken: 'fake-own-refresh', expiresAt: 2000000000000 });
    assert.equal((await component.call('logout', { account: 'own' })).ok, true);
    assert.deepEqual((await component.call('status')).value.providers.codex.accounts, []);
    for (const file of foreign) assert.equal(await readFile(file, 'utf8'), bytes);
  } finally { component.dispose(); collision.dispose(); globalThis.fetch = originalFetch; }
});

test('reference collision is reported without replacing its provider or allowing login', async () => {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t129/collision-');
  const component = host({ collision: true });
  try {
    assert.match((await component.call('status')).value.registrationError, /already registered/);
    assert.equal((await component.call('login', { provider: 'codex' })).ok, false);
    assert.equal(component.adapter, undefined);
  } finally { component.dispose(); }
});


// Codex adaptation of reference login.spec.ts finalizing/cancel and auth RPC cases.
test('auth RPC rejects mismatched state, reports exchange failure, and cancels an exchange already finalizing', async () => {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t129/auth-errors-');
  const component = host(); const saved = globalThis.fetch;
  let release, seen;
  const requested = new Promise(resolve => { seen = resolve; });
  globalThis.fetch = async () => { seen(); return new Promise(resolve => { release = resolve; }); };
  try {
    assert.equal((await component.call('manual', { input: 'code' })).ok, false);
    assert.equal((await component.call('login', { provider: 'other' })).ok, false);
    const login = await component.call('login');
    const pending = (await component.call('status')).value.providers.codex;
    assert.deepEqual(pending.pendingAuth, { authorizeUrl: login.value.authorizeUrl });
    assert.equal((await component.call('manual', { input: 'http://localhost/auth/callback?code=fake&state=wrong' })).ok, false);
    assert.equal((await component.call('status')).value.providers.codex.busy, true);
    await component.call('manual', { input: 'fake-code' }); await requested;
    assert.equal((await component.call('login')).ok, false);
    await component.call('cancel'); release(Response.json({ error: 'fixture exchange failure' }, { status: 400 }));
    for (let i = 0; i < 10; i++) await new Promise(resolve => setImmediate(resolve));
    let status = (await component.call('status')).value.providers.codex;
    assert.equal(status.busy, false); assert.deepEqual(status.accounts, []); assert.equal(status.detail, undefined);
    globalThis.fetch = async () => Response.json({ error: 'fixture exchange failure' }, { status: 400 });
    await component.call('login'); await component.call('manual', { input: 'fake-code' });
    for (let i = 0; i < 10; i++) await new Promise(resolve => setImmediate(resolve));
    status = (await component.call('status')).value.providers.codex;
    // The upstream body ('fixture exchange failure') is untrusted: the browser sees only the HTTP status.
    assert.match(status.detail, /^codex login endpoint error \(HTTP 400\)/); assert.doesNotMatch(status.detail, /fixture exchange failure/); assert.equal(status.busy, false);
  } finally { component.dispose(); globalThis.fetch = saved; }
});

test('assembled Codex stream refreshes once after 401 and preserves 429 retry/reset metadata', async () => {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t129/refresh-');
  const store = await import('../dist/auth/store.js');
  await store.saveAccountSession('codex', 'a', { accountId: 'a', accessToken: 'fake-old', refreshToken: 'fake-refresh', expiresAt: Date.now() + 3600000 });
  const component = host(); const saved = globalThis.fetch;
  let exchanges = 0, chats = 0, mode = 'refresh'; const headers = [];
  globalThis.fetch = async (url, init) => {
    if (String(url).endsWith('/oauth/token')) { exchanges++; return Response.json({ access_token: 'fake-new', expires_in: 3600 }); }
    if (!String(url).endsWith('/codex/responses')) throw new Error('unexpected fixture URL');
    chats++; headers.push(init.headers.authorization);
    if (mode === 'refresh' && chats === 1) return new Response('', { status: 401 });
    if (mode === '429') return Response.json({ detail: { resets_in_seconds: 600, type: 'usage_limit_reached' } }, { status: 429, headers: { 'retry-after': '1' } });
    if (mode === '401') return new Response('', { status: 401 });
    if (mode === 'abort') { init.signal.throwIfAborted(); throw new Error('expected abort'); }
    return new Response('data: {"type":"response.output_text.delta","delta":"OK"}\n\ndata: {"type":"response.completed","response":{}}\n\n');
  };
  const run = async (signal = new AbortController().signal) => { const chunks = []; for await (const chunk of component.adapter.stream({ provider: 'codex', model: 'fixture-model', messages: [], signal })) chunks.push(chunk); return chunks; };
  try {
    assert.ok((await run()).some(c => c.type === 'text-delta')); assert.equal(exchanges, 1); assert.deepEqual(headers, ['Bearer fake-old', 'Bearer fake-new']);
    mode = '429'; await assert.rejects(run(), error => error.code === 'RATE_LIMIT' && error.failure.providerRetryAfterMs > 590000);
    await component.call('setDefault', { account: 'a' }); // Auth changes clear the pool cooldown.
    mode = '401'; const before = chats; await assert.rejects(run(), error => error.code === 'AUTH'); assert.equal(chats - before, 2);
    mode = 'abort'; const controller = new AbortController(); controller.abort(); await assert.rejects(run(controller.signal));
  } finally { component.dispose(); globalThis.fetch = saved; }
});
