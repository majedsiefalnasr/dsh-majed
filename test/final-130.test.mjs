// Final #130 review regressions (P2/P3). Each test pins one defect found by the independent review of 13e8db7.
// Reference: V1ki/dsh-plugin-subscriptions v0.9.12 (b802311) src/index.ts + src/auth/rpc.ts; see src/PROVENANCE.md.
// Fake HTTP only; AbortSignal.timeout is shortened inside the pool test so the bounded-time proof stays economical.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { Context } from '@deepseek-ai/cordis';
import * as plugin from '../dist/subscriptions.js';
import { apply, Config } from '../dist/subscriptions.js';
import { safeDiagnostic, proxyTestConnection, proxySetConfig, proxyGetConfig, resetProxyForTests, disposeProxyTransport } from '../dist/http.js';

const CATALOG = { models: [
  { slug: 'fast-model', display_name: 'Fast model', context_window: 1000, supported_reasoning_levels: [{ effort: 'low' }, { effort: 'high' }], default_reasoning_level: 'low' },
  { slug: 'plain-model', display_name: 'Plain model', context_window: 500 },
] };
const SSE = 'data: {"type":"response.output_text.delta","delta":"OK"}\n\ndata: {"type":"response.completed","response":{"usage":{"input_tokens":1,"output_tokens":1}}}\n\ndata: [DONE]\n\n';

async function mount({ accounts = ['a', 'b'], hang = [], config = {} } = {}) {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t130/final-');
  const { saveAccountSession } = await import('../dist/auth/store.js');
  for (const account of accounts) await saveAccountSession('codex', account, { accountId: account, email: `${account}@example.test`, accessToken: `synthetic-${account}`, refreshToken: 'synthetic-refresh', expiresAt: 2000000000000 });
  const requests = [], fetched = [];
  const savedFetch = globalThis.fetch;
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input);
    fetched.push(url);
    const account = init.headers?.['chatgpt-account-id'];
    if (url.includes('/codex/models')) {
      if (hang.includes(account)) return new Promise((_, reject) => init.signal?.addEventListener('abort', () => reject(init.signal.reason)));
      return new Response(JSON.stringify(CATALOG));
    }
    if (url.endsWith('/codex/responses')) { requests.push(account); return new Response(SSE); }
    throw new Error(`Unexpected outbound request: ${url}`);
  };
  const routes = new Map(), cleanups = []; let adapter;
  const ctx = { logger: { warn() {} },
    llm: { registerAdapter(_, value) { adapter = value; return { replace() {} }; },
      listProviders: () => adapter ? [{ id: 'codex', name: 'Codex' }] : [],
      listModels: provider => adapter.listModels(provider), resolveModelInfo: (provider, model) => adapter.resolveModel(provider, model) },
    get: name => name === 'connection' ? { fetch: { register(route) { routes.set(route.path, route); return () => routes.delete(route.path); } } } : undefined,
    inject(names, fn) { if ([].concat(names).includes('connection')) fn(ctx); }, effect(fn) { const off = fn(); if (off) cleanups.push(off); } };
  apply(ctx, { codexClientVersion: '1.2.3', ...config });
  const call = async (endpoint, payload = {}) => {
    const method = `majed-subscriptions.${endpoint}`;
    const response = await routes.get(`/api/${method}`).fetch(new Request(`http://localhost/api/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'client-request', rpcId: 'fixture', method, payload }) }));
    return { ...(await response.json()).result, text: undefined };
  };
  const raw = async (endpoint, payload = {}) => {
    const method = `majed-subscriptions.${endpoint}`;
    return (await routes.get(`/api/${method}`).fetch(new Request(`http://localhost/api/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'client-request', rpcId: 'fixture', method, payload }) }))).text();
  };
  return { call, raw, requests, fetched, get adapter() { return adapter; }, dispose() { cleanups.reverse().forEach(off => off()); globalThis.fetch = savedFetch; } };
}

test('P2 pool assembly: a hung account sits out and the healthy account still serves in bounded time', async () => {
  const realTimeout = AbortSignal.timeout;
  AbortSignal.timeout = ms => realTimeout.call(AbortSignal, ms >= 10_000 ? 50 : ms); // economical stand-in for the 10s/20s bounds
  const host = await mount({ hang: ['b'] });
  const keepAlive = setInterval(() => {}, 1_000); // AbortSignal.timeout timers are unref'd; hold the loop open while the hung read waits
  try {
    await host.call('setDefault', { account: 'a' });
    const started = Date.now();
    for await (const chunk of host.adapter.stream({ provider: 'codex', model: 'fast-model', messages: [] })) void chunk;
    assert.ok(Date.now() - started < 5_000, 'bounded time');
    assert.deepEqual(host.requests, ['a'], 'the healthy account served the request');
  } finally { clearInterval(keepAlive); host.dispose(); AbortSignal.timeout = realTimeout; }
});

test('P2 pool assembly: account policy lookup ignores inherited Object.prototype keys', async () => {
  const host = await mount({ accounts: ['constructor', 'b'] });
  try {
    await host.call('setDefault', { account: 'b' });
    for await (const chunk of host.adapter.stream({ provider: 'codex', model: 'fast-model', messages: [] })) void chunk;
    assert.deepEqual(host.requests, ['b']);
    const models = await host.adapter.listModels('codex');
    assert.ok(models.some(model => model.id === 'fast-model'), 'the account named like an inherited key is still pooled normally');
  } finally { host.dispose(); }
});

test('P2 proxyTest validates the outer payload and the draft before any work or network', async () => {
  const host = await mount({ accounts: [] });
  try {
    const before = host.fetched.length;
    const cases = [
      [{ url: 5 }, /payload\.url must be a non-empty string when present/],
      [{ url: '' }, /payload\.url must be a non-empty string when present/],
      [{ proxy: 'x' }, /payload\.proxy must be an object when present/],
      [{ proxy: null }, /payload\.proxy must be an object when present/],
      [{ proxy: { url: 5 } }, /payload\.proxy\.url must be a non-empty string/],
      [{ proxy: { url: '' } }, /payload\.proxy\.url must be a non-empty string/],
      [{ proxy: {} }, /payload\.proxy\.url must be a non-empty string/],
      [{ proxy: { url: 'http://p.test', username: 5 } }, /payload\.proxy\.username must be a string when present/],
      [{ proxy: { url: 'http://p.test', password: 5 } }, /payload\.proxy\.password must be a string or null when present/],
      [{ proxy: { url: 'http://p.test', enabled: 'yes' } }, /payload\.proxy\.enabled must be a boolean when present/],
      [{ proxy: { url: 'http://p.test', bypass: 'a.test' } }, /payload\.proxy\.bypass must be an array of strings when present/],
      [{ proxy: { url: 'http://p.test', bypass: ['a.test', 7] } }, /payload\.proxy\.bypass must be an array of strings when present/],
    ];
    for (const [payload, message] of cases) {
      const result = await host.call('proxyTest', payload);
      assert.equal(result.ok, false, JSON.stringify(payload));
      assert.match(result.error.message, message);
      assert.doesNotMatch(result.error.message, /TypeError|trim|undefined|Cannot read/);
    }
    assert.equal(host.fetched.length, before, 'invalid payloads never reach the network');
    // Valid shapes still work: absent payload, destination only, and a full draft.
    assert.equal((await host.call('proxyTest', {})).ok, true);
    assert.equal((await host.call('proxyTest', { proxy: { url: 'http://p.test', enabled: false, username: 'u', password: null, bypass: [] }, url: 'https://destination.test' })).ok, true);
  } finally { host.dispose(); }
});

test('P2 force must be a boolean on providerSettings, modelDefaults and usage', async () => {
  const host = await mount({ accounts: ['a'] });
  try {
    for (const endpoint of ['providerSettings', 'modelDefaults', 'usage']) {
      for (const force of ['yes', 1, null, 'true', {}]) {
        const result = await host.call(endpoint, { provider: 'codex', account: 'a', force });
        assert.equal(result.ok, false, `${endpoint} force=${JSON.stringify(force)}`);
        assert.match(result.error.message, /payload\.force must be a boolean when present/);
      }
    }
    assert.equal((await host.call('providerSettings', { provider: 'codex', force: false })).ok, true);
    assert.equal((await host.call('modelDefaults', { force: false })).ok, true);
  } finally { host.dispose(); }
});

test('P2 modelDefaults returns the reference ModelDefaultsCatalog[] and force refreshes catalogs', async () => {
  const host = await mount({ accounts: ['a'], config: { pool: { tiers: { 'smart-tier': [{ provider: 'codex', model: 'fast-model' }] } } } });
  try {
    const plain = (await host.call('modelDefaults')).value;
    assert.deepEqual(plain.map(entry => entry.provider), ['codex']);
    const view = plain[0].models.map(model => [model.id, model.name, model.efforts.map(effort => effort.id), model.configured]);
    assert.deepEqual(view, [['fast-model', 'Fast model', ['low', 'high'], undefined], ['plain-model', 'Plain model', ['minimal', 'low', 'medium', 'high', 'xhigh'], undefined]], 'tier rows are left out');
    assert.ok((await host.adapter.listModels('codex')).some(model => model.id.includes('smart-tier')), 'the tier row exists in the picker list, so the omission above is the filter at work');
    for (const effort of plain[0].models[0].efforts) assert.deepEqual(Object.keys(effort).sort(), ['id', 'name']);
    assert.equal('configured' in plain[0].models[0], false, 'configured is omitted when no override is stored');
    assert.equal((await host.call('setModelDefault', { model: 'fast-model', effort: 'high' })).ok, true);
    assert.equal((await host.call('modelDefaults')).value[0].models[0].configured, 'high');
    const before = host.fetched.filter(url => url.includes('/codex/models')).length;
    await host.call('modelDefaults', { force: false });
    assert.equal(host.fetched.filter(url => url.includes('/codex/models')).length, before, 'cached catalogs are reused without force');
    assert.equal((await host.call('modelDefaults', { force: true })).ok, true);
    assert.ok(host.fetched.filter(url => url.includes('/codex/models')).length > before, 'force bypasses the catalog cache');
    const bad = await host.call('setModelDefault', { model: 'fast-model', effort: 'max' });
    assert.equal(bad.ok, false);
    assert.match(bad.error.message, /model fast-model does not advertise a "max" reasoning effort/);
  } finally { host.dispose(); }
});

test('P3 safeDiagnostic redacts quoted JSON secrets, single quotes and nested objects', () => {
  const secrets = ['hunter2x', 'p w d', 'nested-secret-1', 'tok-123', 'k-9'];
  const samples = [
    'bad {"password":"hunter2x"}',
    'bad {"password": "p w d"}',
    "bad {'passwd': 'hunter2x'}",
    'bad {"a":{"b":{"apiKey":"nested-secret-1"}}}',
    'bad {"access_token":"tok-123","x":1}',
    'bad {"api_key" : "k-9"}',
    'bad password=hunter2x token: tok-123',
    'bad {"password":"has \\"escaped\\" quote hunter2x"}',
  ];
  for (const sample of samples) {
    const out = safeDiagnostic(sample);
    for (const secret of secrets) assert.equal(out.includes(secret), false, `${sample} -> ${out}`);
    assert.match(out, /\[redacted\]/);
  }
  assert.equal(safeDiagnostic('plain failure: connect ECONNREFUSED'), 'plain failure: connect ECONNREFUSED');
  assert.equal(safeDiagnostic('{"status":"failed","user":"x"}'), '{"status":"failed","user":"x"}', 'unrelated JSON stays readable');
});

test('P3 unknown JSON secrets never reach a serialized RPC response (saved and draft, nested)', async () => {
  await resetProxyForTests();
  const host = await mount({ accounts: [] });
  const originalFetch = globalThis.fetch;
  try {
    await host.call('proxySet', { enabled: false, url: 'http://127.0.0.1:9', password: 'saved-secret-QQ' });
    globalThis.fetch = async () => { throw new Error('upstream replied {"error":{"password":"unknown-json-secret-7","nested":{"token":"unknown-token-8"}}} and {"proxy":{"password":"saved-secret-QQ"}} draft {"password":"draft-secret-ZZ"}'); };
    const texts = [
      await host.raw('proxyTest', { url: 'https://destination.test' }),
      await host.raw('proxyTest', { url: 'https://bypass.test', proxy: { enabled: true, url: 'http://127.0.0.1:9', password: 'draft-secret-ZZ', bypass: ['bypass.test'] } }),
    ];
    for (const text of texts) for (const secret of ['unknown-json-secret-7', 'unknown-token-8', 'saved-secret-QQ', 'draft-secret-ZZ']) assert.equal(text.includes(secret), false, text);
    assert.match(texts[0], /redacted/);
  } finally { globalThis.fetch = originalFetch; host.dispose(); await resetProxyForTests(); }
});

test('P3 the draft password is redacted on the early draft-validation failure path too', async () => {
  await resetProxyForTests();
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t130/final-early-');
  const result = await proxyTestConnection('https://destination.test', { enabled: true, url: 'ftp://proxy.test', password: 'early-draft-secret', bypass: [] });
  assert.equal(result.ok, false);
  assert.equal(JSON.stringify(result).includes('early-draft-secret'), false);
  await resetProxyForTests();
});

test('P3 dispose clears owned proxy memory and aborts in-flight probes', async () => {
  await resetProxyForTests();
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t130/final-dispose-');
  const originalFetch = globalThis.fetch;
  try {
    await proxySetConfig({ enabled: false, url: 'http://127.0.0.1:9', username: 'u', password: 'resident-password-XY' });
    assert.equal(safeDiagnostic('boom resident-password-XY'), 'boom [redacted]', 'the saved password is held for redaction while mounted');
    globalThis.fetch = (_url, init) => new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted by dispose'))));
    const started = Date.now();
    const probe = proxyTestConnection('https://destination.test');
    await new Promise(resolve => setTimeout(resolve, 20));
    await disposeProxyTransport();
    const result = await probe;
    assert.equal(result.ok, false);
    assert.ok(Date.now() - started < 5_000, 'the probe ended long before the 15s probe deadline');
    assert.equal(safeDiagnostic('boom resident-password-XY'), 'boom resident-password-XY', 'owned password memory was released');
    // A bad stored file surfaces a configError; dispose releases it and the next load re-reads the disk.
    await mkdir(`${process.env.DSH_HOME}/plugins/majed/subscriptions`, { recursive: true });
    await writeFile(`${process.env.DSH_HOME}/plugins/majed/subscriptions/proxy.json`, '{ nope');
    assert.ok((await proxyGetConfig()).error);
    await writeFile(`${process.env.DSH_HOME}/plugins/majed/subscriptions/proxy.json`, JSON.stringify({ enabled: false, url: '' }));
    await disposeProxyTransport();
    assert.equal((await proxyGetConfig()).error, undefined);
  } finally { globalThis.fetch = originalFetch; await resetProxyForTests(); }
});

test('P3 pool Config schema validates strategy and switchMargin and applies the reference defaults', () => {
  assert.equal(typeof Config, 'function', 'a same-named schemastery schema is exported next to the interface');
  const parsed = Config({});
  assert.deepEqual(parsed.pool, { enabled: true, strategy: 'quota_aware', switchMargin: 2, autoAccounts: true, families: {}, tiers: {} });
  assert.deepEqual(Config({ pool: { strategy: 'priority', switchMargin: 1 } }).pool, { enabled: true, strategy: 'priority', switchMargin: 1, autoAccounts: true, families: {}, tiers: {} });
  for (const pool of [{ strategy: 'round_robin' }, { switchMargin: 0.5 }, { switchMargin: 0 }, { switchMargin: -1 }, { enabled: 'yes' }, { tiers: { t: [{ provider: 'nope', model: 'm' }] } }, { tiers: { t: [{ provider: 'codex' }] } }]) {
    assert.throws(() => Config({ pool }), undefined, JSON.stringify(pool));
  }
  assert.deepEqual(Config({ models: { codex: [{ id: 'm', name: 'M' }] }, codexClientVersion: '1.2.3' }).models.codex, [{ id: 'm', name: 'M', inputModalities: [] }]);
  assert.throws(() => Config({ models: { codex: [{ name: 'no id' }] } }));
  assert.equal(plugin.name, 'dsh-majed/subscriptions');
  assert.deepEqual(plugin.inject, ['llm']);
  void Context;
});
