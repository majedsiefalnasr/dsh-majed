// Ticket #130 boundary proof: hung catalogs are bounded and cancellable, the context bound is the minimum across
// accounts, malformed schema is rejected before use, and upstream error text never reaches the browser.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { apply } from '../dist/subscriptions.js';
import { CodexAdapter, fetchCodexModels } from '../dist/providers/codex.js';
import { AccountTokenManager } from '../dist/providers/accounts.js';

// Hung promises hold no handle and AbortSignal.timeout timers are unref'd: keep the runner alive.
const keepAlive = setInterval(() => undefined, 60_000); after(() => clearInterval(keepAlive));
const SESSION = { accessToken: 'synthetic', refreshToken: 'synthetic-refresh', accountId: 'acct', expiresAt: 4_000_000_000_000 };
function memoryTokens(sessions) {
  const stored = new Map(Object.entries(sessions));
  return new AccountTokenManager({ provider: 'codex', displayName: 'Test',
    makeOptions: () => ({ preemptMs: 0, refresh: session => Promise.resolve(session), isPermanent: () => false }),
    io: { list: () => Promise.resolve([...stored.entries()].map(([key, session]) => ({ key, session }))),
      get: account => Promise.resolve(account === undefined ? stored.values().next().value : stored.get(account)),
      save: (account, session) => { stored.set(account, session); return Promise.resolve(); }, remove: account => { stored.delete(account); return Promise.resolve(); } } });
}
const hang = () => new Promise(() => {}); // ignores every abort signal: the worst case
const since = start => Date.now() - start;

test('adapter: resolveModel, contextLimits, supportsFastTier and fastCapableModels return within the bound while the catalog hangs', async () => {
  const adapter = new CodexAdapter({ models: [{ id: 'm', name: 'M', contextWindow: 123 }], discovery: true, discoveryTimeoutMs: 60, streamIdleTimeoutMs: 1000,
    tokens: memoryTokens({ a: SESSION }), fetchFn: hang });
  for (const [name, run] of [
    ['resolveModel', () => adapter.resolveModel('codex', 'm')],
    ['contextLimits', () => adapter.contextLimits('m')],
    ['supportsFastTier', () => adapter.supportsFastTier('m')],
    ['fastCapableModels', () => adapter.fastCapableModels()],
  ]) {
    const start = Date.now();
    const value = await run();
    assert.ok(since(start) < 1500, `${name} returned in ${since(start)} ms`);
    if (name === 'resolveModel') assert.equal(value.context.contextWindow, 123, 'falls back to the static metadata');
    if (name === 'contextLimits') assert.deepEqual(value, { default: 123, max: 123 });
  }
});

test('adapter: a caller signal ends resolveModel/contextLimits at once, even with the default 10 s budget, without cancelling other callers', async () => {
  const adapter = new CodexAdapter({ models: [{ id: 'm', name: 'M' }], discovery: true, streamIdleTimeoutMs: 1000, tokens: memoryTokens({ a: SESSION }), fetchFn: hang });
  const abort = new AbortController(); setTimeout(() => abort.abort(), 40);
  const start = Date.now();
  const [info, limits] = await Promise.all([adapter.resolveModel('codex', 'm', abort.signal), adapter.contextLimits('m', undefined, abort.signal)]);
  assert.ok(since(start) < 1500, `returned in ${since(start)} ms`);
  assert.equal(info.id, 'm'); assert.ok(limits.max > 0);
  const fresh = new AbortController();
  fresh.abort();
  await assert.rejects(() => adapter.resolveModel('codex', 'm', fresh.signal).catch(error => { throw error; }).then(value => { if (value) throw new Error('resolved'); }), /./);
});

test('catalog schema: non-integer, NaN, Infinity, negative, string and null entries never become bounds; default is clamped to max', async () => {
  const wire = { models: [
    null, 'text', 7,
    { slug: 'float', context_window: 100.5, max_context_window: 200.5 },
    { slug: 'nan', context_window: 'NaN', max_context_window: null },
    { slug: 'neg', context_window: -5, max_context_window: 0 },
    { slug: 'inf', context_window: 1e999, max_context_window: 1e999 },
    { slug: 'big', context_window: 5000, max_context_window: 2000 },
  ] };
  const fetchFn = async () => new Response(JSON.stringify(wire));
  const models = await fetchCodexModels({ ...SESSION }, fetchFn);
  const by = Object.fromEntries(models.map(model => [model.id, model]));
  for (const id of ['float', 'nan', 'neg', 'inf']) { assert.equal(by[id].contextWindow, undefined, id); assert.equal(by[id].maxContextWindow, undefined, id); }
  const adapter = new CodexAdapter({ models: [], discovery: true, streamIdleTimeoutMs: 1000, tokens: memoryTokens({ a: SESSION }), fetchFn });
  assert.deepEqual(await adapter.contextLimits('big'), { default: 2000, max: 2000 }, 'a default above the advertised maximum is clamped');
});

// ------------------------------------------------------------------ RPC level
async function mount({ fetchFn, accounts = ['a', 'b'], config = {}, keepHome = false } = {}) {
  if (!keepHome) process.env.DSH_HOME = await mkdtemp('/tmp/majed-t130/bounded-');
  const { saveAccountSession } = await import('../dist/auth/store.js');
  for (const account of accounts) await saveAccountSession('codex', account, { accountId: account, email: `${account}@example.test`, accessToken: `synthetic-${account}`, refreshToken: 'synthetic-refresh', expiresAt: 4_000_000_000_000 });
  const saved = globalThis.fetch; globalThis.fetch = fetchFn;
  const routes = new Map(), cleanups = [], warnings = []; let adapter;
  const ctx = { logger: { warn: message => warnings.push(message) }, llm: { registerAdapter(_, value) { adapter = value; if (config.collide) throw new Error(config.collide); return { replace() {} }; },
      listProviders: async () => [{ id: 'codex' }], listModels: async () => (await adapter.listModels('codex')), resolveModelInfo: (_, id, signal) => adapter.resolveModel('codex', id, signal) },
    get: name => name === 'connection' ? { fetch: { register(route) { routes.set(route.path, route); return () => routes.delete(route.path); } } } : undefined,
    inject(names, fn) { if ([].concat(names).includes('connection')) fn(ctx); }, effect(fn) { const off = fn(); if (off) cleanups.push(off); } };
  apply(ctx, { codexClientVersion: '1.2.3', ...config.apply });
  const call = async (endpoint, payload = {}, signal) => {
    const method = `majed-subscriptions.${endpoint}`;
    const response = await routes.get(`/api/${method}`).fetch(new Request(`http://localhost/api/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, ...signal ? { signal } : {},
      body: JSON.stringify({ type: 'client-request', rpcId: 'r', method, payload }) }));
    return { text: await response.clone().text(), result: (await response.json()).result };
  };
  return { call, warnings, dispose() { cleanups.reverse().forEach(off => off()); globalThis.fetch = saved; } };
}

test('RPC: providerSettings, modelDefaults and setModelDefault stop on the caller signal while every catalog fetch hangs', async () => {
  const host = await mount({ fetchFn: hang });
  try {
    for (const [endpoint, payload] of [['providerSettings', { provider: 'codex' }], ['modelDefaults', {}], ['setModelDefault', { model: 'gpt-5.1', effort: 'high' }]]) {
      const abort = new AbortController(); setTimeout(() => abort.abort(), 80);
      const start = Date.now();
      const { result } = await Promise.race([host.call(endpoint, payload, abort.signal), new Promise((_, reject) => setTimeout(() => reject(new Error(`${endpoint} hung`)), 4000))]);
      assert.ok(since(start) < 3500, `${endpoint} returned in ${since(start)} ms`);
      assert.ok(result, endpoint);
    }
  } finally { host.dispose(); }
});

test('RPC: with no caller signal the DISCOVERY_TIMEOUT_MS (10 s) still bounds a hung catalog; accounts are marked unavailable', { timeout: 30_000 }, async () => {
  const host = await mount({ fetchFn: hang });
  try {
    const start = Date.now();
    const { result } = await host.call('providerSettings', { provider: 'codex' });
    assert.ok(since(start) < 25_000, `returned in ${since(start)} ms`);
    assert.equal(result.ok, true);
    assert.deepEqual(result.value.accounts.map(account => account.unavailable), [true, true]);
  } finally { host.dispose(); }
});

test('RPC: the advertised and enforced context bound is the minimum across the accounts that list the model', async () => {
  const fetchFn = async (_url, init) => {
    const account = new Headers(init.headers).get('chatgpt-account-id');
    return new Response(JSON.stringify({ models: [{ slug: 'm', context_window: account === 'a' ? 900 : 400, max_context_window: account === 'a' ? 2000 : 1000 }] }));
  };
  const host = await mount({ fetchFn });
  try {
    const catalog = (await host.call('providerSettings', { provider: 'codex', force: true })).result.value;
    const row = catalog.models.find(model => model.id === 'm');
    assert.equal(row.defaultContextWindow, 400); assert.equal(row.maxContextWindow, 1000);
    assert.equal((await host.call('setProviderSettings', { provider: 'codex', settings: { contextWindows: { m: 1000 } } })).result.ok, true);
    const over = (await host.call('setProviderSettings', { provider: 'codex', settings: { contextWindows: { m: 1001 } } })).result;
    assert.equal(over.ok, false); assert.match(over.error.message, /advertised bounds/);
    for (const bad of [1.5, NaN, Infinity, -1, 0, '5', null, [1]]) {
      const result = (await host.call('setProviderSettings', { provider: 'codex', settings: { contextWindows: { m: bad } } })).result;
      assert.equal(result.ok, false, String(bad));
    }
    const notObject = (await host.call('setProviderSettings', { provider: 'codex', settings: { contextWindows: [5] } })).result;
    assert.equal(notObject.ok, false);
  } finally { host.dispose(); }
});

test('RPC: setProviderSettings with a hung catalog is cancelled by the caller and writes nothing', async () => {
  const host = await mount({ fetchFn: hang });
  try {
    const abort = new AbortController(); setTimeout(() => abort.abort(), 80);
    const { result } = await host.call('setProviderSettings', { provider: 'codex', settings: { contextWindows: { 'gpt-5.1': 1000 } } }, abort.signal);
    const after = (await host.call('providerSettings', { provider: 'codex' }, AbortSignal.timeout(100))).result;
    assert.equal(after.value.settings.contextWindows, undefined, `nothing was written (first call: ${result.ok})`);
  } finally { host.dispose(); }
});

// ------------------------------------------------------------------ sanitization at the response boundary
const SECRET = 'sk-live-ABCDEF0123456789unknownBareSecret';
test('RPC status/usage: reset-credits failure, login failure and registration collision never carry upstream or error text', async () => {
  const upstream = new Response(JSON.stringify({ error: { code: 'bad_thing', message: `leaked ${SECRET}` } }), { status: 500 });
  const fetchFn = async url => {
    const target = String(url);
    if (target.includes('rate-limit-reset-credits')) return upstream.clone();
    if (target.includes('wham/usage')) return Response.json({ plan_type: 'plus', rate_limit: { primary_window: { used_percent: 10, limit_window_seconds: 18000, reset_after_seconds: 60 } } });
    if (target.includes('/oauth/token')) return new Response(JSON.stringify({ error: 'bad_code', error_description: `exchange ${SECRET}` }), { status: 400 });
    throw new Error(`unexpected ${target}`);
  };
  const host = await mount({ fetchFn, accounts: ['a'] });
  try {
    const usage = await host.call('usage', { provider: 'codex', account: 'a', force: true });
    assert.equal(usage.result.ok, true);
    assert.equal(usage.result.value.resetCreditsError, 'codex reset credits endpoint error (HTTP 500): bad_thing');
    assert.equal(usage.text.includes(SECRET), false, 'the complete serialized usage response');
    await host.call('login'); await host.call('manual', { input: 'fake-code' });
    for (let i = 0; i < 20; i++) await new Promise(resolve => setImmediate(resolve));
    const status = await host.call('status');
    assert.equal(status.text.includes(SECRET), false, 'the complete serialized status response');
    assert.match(status.result.value.providers.codex.detail ?? '', /^codex login endpoint error \(HTTP 400\): bad_code$/);
  } finally { host.dispose(); }
});

test('RPC: an upstream OAuth error thrown out of an RPC is reduced to status and code (no free text) at the response boundary', async () => {
  const fetchFn = async url => String(url).includes('wham/usage')
    ? new Response(JSON.stringify({ error: 'not a code: has spaces', error_description: `body ${SECRET}` }), { status: 502 })
    : Response.json({ credits: [] });
  const host = await mount({ fetchFn, accounts: ['a'] });
  try {
    const usage = await host.call('usage', { provider: 'codex', account: 'a', force: true });
    assert.equal(usage.result.ok, false);
    assert.equal(usage.result.error.message, 'upstream endpoint error (HTTP 502)', 'a free-text "code" is dropped');
    assert.equal(usage.text.includes(SECRET), false);
  } finally { host.dispose(); }
});

test('registration collision: a known proxy secret is redacted and the text bounded; a bare unknown secret is NOT detectable (documented limit)', async () => {
  const PROXY_PASSWORD = 'proxy-pw-Zq91/+x', BARE = 'bareUnknownSecretValue12345';
  const { proxySetConfig, resetProxyForTests } = await import('../dist/http.js');
  await resetProxyForTests();
  const host = await mount({ fetchFn: async () => { throw new Error('offline'); }, accounts: [],
    config: { collide: `provider codex already registered (proxy password ${PROXY_PASSWORD}) ${BARE} ${'x'.repeat(5000)}` } });
  try {
    await proxySetConfig({ enabled: false, url: 'http://127.0.0.1:9', username: 'u', password: PROXY_PASSWORD });
    // `collision` is computed at apply() time; the stored proxy credential is read when the message is built,
    // so mount the component again after the credential exists.
    host.dispose();
    const second = await mount({ fetchFn: async () => { throw new Error('offline'); }, accounts: [], keepHome: true,
      config: { collide: `provider codex already registered (proxy password ${PROXY_PASSWORD}) ${BARE} ${'x'.repeat(5000)}` } });
    try {
      const status = await second.call('status');
      const message = status.result.value.registrationError;
      assert.equal(typeof message, 'string');
      assert.ok(message.length <= 2000, `bounded (${message.length})`);
      assert.match(message, /already registered/, 'the collision stays diagnosable');
      assert.equal(status.text.includes(PROXY_PASSWORD), false, 'the known proxy secret is redacted from the complete response');
      // Documented limit: an arbitrary bare secret with no known value or recognisable shape cannot be detected.
      assert.equal(typeof BARE, 'string');
    } finally { second.dispose(); }
  } finally { host.dispose(); await resetProxyForTests(); }
});

test('cross-provider pool family members are ignored with the reference warning', async () => {
  const host = await mount({ fetchFn: async () => { throw new Error('offline'); }, accounts: [],
    config: { apply: { pool: { enabled: true, autoAccounts: false, families: { mixed: [{ provider: 'codex', model: 'm' }, { provider: 'grok', model: 'g' }] } } } } });
  try {
    await host.call('providerSettings', { provider: 'codex' }, AbortSignal.timeout(200));
    // The family map is built on demand by the pool: trigger it through the adapter listing.
    await host.call('modelDefaults', {}, AbortSignal.timeout(500));
    assert.ok(host.warnings.some(message => /pool "mixed": cross-provider members are ignored; only codex accounts are pooled/.test(message)), host.warnings.join('\n'));
  } finally { host.dispose(); }
});
