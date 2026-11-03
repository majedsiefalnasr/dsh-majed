// Ticket #130 security matrices: real DSH HostConnectionService gate (no hand-written 401) and
// proxy-secret absence across every serialized RPC response. Loopback-only; no real network.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, stat } from 'node:fs/promises';
import { Context } from '@deepseek-ai/cordis';
import { HostConnectionService, Peer } from '@deepseek-ai/dsh-client-connection';
import { apply } from '../dist/subscriptions.js';

const ENDPOINTS = ['image', 'video', 'status', 'login', 'manual', 'cancel', 'logout', 'setDefault', 'usage', 'prepareReset', 'consumeReset', 'providerSettings', 'setProviderSettings', 'modelDefaults', 'setModelDefault', 'proxyGet', 'proxySet', 'proxyTest'];
const SECRET = 'fixture-proxy-secret-Zq9';

async function mount() {
  const root = new Context();
  // Fake credential owner: only requests carrying the fixture cookie are the browser owner.
  const auth = { isAuthenticated: request => new Headers(request.headers).get('cookie') === 'owner=1', authenticateApi: () => undefined };
  const service = new HostConnectionService(root, [], auth);
  const cleanups = [];
  const ctx = { logger: { warn() {} }, llm: { registerAdapter: () => ({ replace() {} }) }, get: name => name === 'connection' ? service : undefined,
    effect: fn => { const off = fn(); if (off) cleanups.push(off); }, inject: (names, fn) => { if ([].concat(names).every(name => name === 'connection')) fn(ctx); } };
  apply(ctx, { codexClientVersion: '1.2.3', models: { codex: [{ id: 'fixture-model', name: 'Fixture model' }] } });
  const handler = service.createSharedFetchHandler('/api');
  const owner = new Peer(root, { principal: { kind: 'owner' } });
  const stranger = new Peer(root, { principal: { kind: 'api', id: 'stranger' } });
  const envelope = (endpoint, payload = {}, extra = {}) => new Request(`http://127.0.0.1/api/majed-subscriptions.${endpoint}`, { method: 'POST',
    headers: { 'content-type': 'application/json', ...extra.headers }, body: extra.raw ?? JSON.stringify({ type: 'client-request', rpcId: 'r', method: `majed-subscriptions.${endpoint}`, payload }), ...extra.init });
  return { service, handler, owner, stranger, envelope, dispose: () => cleanups.reverse().forEach(off => off()),
    async rpc(endpoint, payload) { const response = await handler.fetch(envelope(endpoint, payload), owner); return { status: response.status, text: await response.text() }; } };
}

test('every exact route is owner-only at the real host gate and never runs for a non-owner or untrusted caller', async () => {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t130/security-');
  const host = await mount();
  try {
    for (const endpoint of ENDPOINTS) {
      const denied = await host.handler.fetch(host.envelope(endpoint, { provider: 'codex', settings: { displayName: 'Intruder' } }), host.stranger);
      assert.equal(denied.status, 403, `${endpoint} non-owner`);
      assert.equal(await denied.text(), 'forbidden');
    }
    // The denied setProviderSettings never reached the store: no provider-settings file exists.
    await assert.rejects(stat(`${process.env.DSH_HOME}/plugins/majed/subscriptions/provider-settings.json`), { code: 'ENOENT' });
    await assert.rejects(stat(`${process.env.DSH_HOME}/plugins/majed/subscriptions/proxy.json`), { code: 'ENOENT' });
    // The transport admission gate (the caller of the shared handler) refuses untrusted and unauthenticated requests.
    const trusted = { host: '127.0.0.1:52059' };
    assert.equal(host.service.requestRejection({ headers: { ...trusted, cookie: 'owner=1' } }), undefined);
    assert.equal(host.service.requestRejection({ headers: { ...trusted } }), 401);
    assert.equal(host.service.requestRejection({ headers: { host: 'attacker.example', cookie: 'owner=1' } }), 403);
    assert.equal(host.service.requestRejection({ headers: { ...trusted, cookie: 'owner=1', 'sec-fetch-site': 'cross-site' } }), 403);
    assert.equal(host.service.requestRejection({ headers: { ...trusted, cookie: 'owner=1', origin: 'https://attacker.example' } }), 403);
    assert.equal(host.service.requestRejection({ headers: { cookie: 'owner=1' } }), 403, 'missing Host');
    for (const endpoint of ENDPOINTS) assert.notEqual((await host.handler.fetch(host.envelope(endpoint), host.owner)).status, 403, `${endpoint} owner is admitted`);
    const get = await host.handler.fetch(new Request('http://127.0.0.1/api/majed-subscriptions.status', { method: 'GET' }), host.owner);
    assert.equal(get.status, 404, 'only POST is owned');
  } finally { host.dispose(); }
});

test('Grok auth, billing and media routes pass the real Owner admission gate and refuse foreign principals without network', async () => {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t133-security-');
  const original = globalThis.fetch;
  let network = 0;
  globalThis.fetch = async () => { network++; throw new Error('network forbidden'); };
  const host = await mount();
  try {
    for (const endpoint of ['login', 'manual', 'cancel', 'logout', 'setDefault', 'usage', 'image', 'video']) {
      const payload = { provider: 'grok', account: 'missing', input: 'fixture', name: '../foreign.mp4', attachmentId: 'invalid' };
      assert.equal((await host.handler.fetch(host.envelope(endpoint, payload), host.stranger)).status, 403);
    }
    assert.equal(network, 0);
    const admitted = await host.rpc('usage', { provider: 'grok', account: 'missing' });
    assert.equal(admitted.status, 200);
    assert.equal(JSON.parse(admitted.text).result.ok, false);
    assert.equal(network, 0);
  } finally { host.dispose(); globalThis.fetch = original; }
});

test('Grok billing current, legacy, null and error responses cross the assembled Owner RPC with tier fallback', async () => {
  const original = globalThis.fetch;
  try {
    for (const [payload, percent] of [
      [{ config: { currentPeriod: { type: 'USAGE_PERIOD_TYPE_WEEKLY' }, creditUsagePercent: 23 }, subscriptionTier: 'Fixture plan' }, 23],
      [{ config: { monthlyLimit: { val: 100 }, used: { val: 17 } } }, 17],
      [{ config: null }, undefined],
      [undefined, undefined],
    ]) {
      process.env.DSH_HOME = await mkdtemp('/tmp/majed-t133-billing-');
      const { saveAccountSession } = await import('../dist/auth/store.js');
      const token = `fixture.${Buffer.from(JSON.stringify({ tier: 1 })).toString('base64url')}.fixture`;
      await saveAccountSession('grok', 'fixture', { accessToken: token, refreshToken: 'fixture-refresh', expiresAt: 4000000000000, tokenEndpoint: 'https://accounts.x.ai/token' });
      let billing = 0;
      globalThis.fetch = async url => {
        if (String(url).includes('/v1/billing')) { billing++; return payload === undefined ? new Response('fixture unavailable', { status: 503 }) : Response.json(payload); }
        return Response.json({ data: [] });
      };
      const host = await mount();
      try {
        const response = await host.rpc('usage', { provider: 'grok', account: 'fixture', force: true });
        const result = JSON.parse(response.text).result;
        assert.equal(response.status, 200);
        assert.equal(result.ok, payload !== undefined);
        assert.ok(billing > 0);
        assert.ok(!response.text.includes(token));
        if (payload !== undefined) {
          const serialized = JSON.stringify(result.value);
          assert.match(serialized, /supported/);
          if (percent !== undefined) assert.ok(serialized.includes(`"usedPercent":${percent}`));
          assert.match(serialized, payload.subscriptionTier ? /Fixture plan/ : /plan/);
        }
      } finally { host.dispose(); }
    }
  } finally { globalThis.fetch = original; }
});

test('invalid envelopes are rejected before any endpoint runs and are not business errors', async () => {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t130/security-');
  const host = await mount();
  try {
    const status = async request => (await host.handler.fetch(request, host.owner)).status;
    const url = 'http://127.0.0.1/api/majed-subscriptions.setProviderSettings';
    const post = (body, type = 'application/json') => new Request(url, { method: 'POST', headers: { 'content-type': type }, body });
    assert.equal(await status(post('{}', 'text/plain')), 415);
    assert.equal(await status(post('{}', 'application/x-www-form-urlencoded')), 415);
    assert.equal(await status(post('not json')), 400);
    assert.equal(await status(post('null')), 400);
    assert.equal(await status(post(JSON.stringify({ type: 'server-response', rpcId: 'r', method: 'majed-subscriptions.setProviderSettings' }))), 400);
    assert.equal(await status(post(JSON.stringify({ type: 'client-request', rpcId: 7, method: 'majed-subscriptions.setProviderSettings' }))), 400);
    assert.equal(await status(post(JSON.stringify({ type: 'client-request', rpcId: 'r', method: 'majed-subscriptions.status' }))), 400);
    assert.equal(await status(post(JSON.stringify({ type: 'client-request', rpcId: 'r', method: 'subscriptions-auth.setProviderSettings' }))), 400);
    await assert.rejects(stat(`${process.env.DSH_HOME}/plugins/majed/subscriptions/provider-settings.json`), { code: 'ENOENT' });
    // An unknown endpoint under our prefix is not owned by any route.
    assert.equal(await status(host.envelope('nonexistent')), 404);
    // Business errors keep the envelope: HTTP 200 with ok:false and the caller's rpcId.
    const response = await host.handler.fetch(host.envelope('setProviderSettings', { provider: 'unsupported', settings: {} }), host.owner);
    const body = await response.json();
    assert.deepEqual([response.status, body.type, body.rpcId, body.result.ok, body.result.error.code], [200, 'server-response', 'r', false, 'subscriptions/error']);
    assert.match(body.result.error.message, /payload\.provider must be one of codex, claude/);
  } finally { host.dispose(); }
});

test('a saved proxy password is never present in any serialized RPC response, including errors', async () => {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t130/security-');
  const { resetProxyForTests } = await import('../dist/http.js');
  await resetProxyForTests();
  const original = globalThis.fetch;
  const host = await mount();
  const transcript = [];
  const rpc = async (endpoint, payload) => { const result = await host.rpc(endpoint, payload); transcript.push(result.text); return JSON.parse(result.text).result; };
  try {
    const saved = await rpc('proxySet', { enabled: true, url: 'http://127.0.0.1:9', username: 'fixture-user', password: SECRET, bypass: ['bypass.test'] });
    assert.equal(saved.ok, true); assert.equal(saved.value.passwordSet, true); assert.equal(saved.value.password, undefined);
    assert.equal((await rpc('proxyGet', {})).value.passwordSet, true);
    // Replacement keeps nothing of the old secret; omitted password reuses it (host-side), cleared password removes it.
    const reused = await rpc('proxySet', { enabled: false, url: 'http://127.0.0.1:9', username: 'fixture-user' });
    assert.equal(reused.value.passwordSet, true);
    // Error paths that echo payloads: invalid shapes carrying the secret must not reflect it.
    for (const [endpoint, payload] of [
      ['proxySet', { enabled: 'yes', url: 'x', password: SECRET }],
      ['proxySet', { enabled: true, url: `http://u:${SECRET}@127.0.0.1:9` }],
      ['proxySet', { enabled: true, url: 'http://127.0.0.1:9', password: { nested: SECRET } }],
      ['proxySet', { enabled: true, url: 'ftp://127.0.0.1:9', password: SECRET }],
      ['proxySet', { enabled: true, url: 'http://127.0.0.1:9', bypass: [SECRET, 7] }],
      ['proxyTest', { url: 'ftp://destination.test', proxy: { url: 'http://127.0.0.1:9', password: SECRET } }],
      ['proxyTest', { url: 'https://destination.test', proxy: { enabled: true, url: `http://u:${SECRET}@127.0.0.1:9` } }],
      ['setProviderSettings', { provider: 'codex', settings: { displayName: SECRET.repeat(10) } }],
      ['login', { password: SECRET }], ['logout', { account: 7, password: SECRET }],
    ]) {
      const result = await rpc(endpoint, payload);
      assert.equal(typeof result.ok, 'boolean', `${endpoint} answered inside the envelope`);
    }
    // Transport failures whose message and cause chain contain the secret, via bypassed global fetch.
    globalThis.fetch = async () => { throw new Error(`outer ${SECRET} Proxy-Authorization: Basic ${Buffer.from(`u:${SECRET}`).toString('base64')}`, { cause: new Error(`http://u:${SECRET}@127.0.0.1:9 password=${SECRET}`) }); };
    const failing = await rpc('proxyTest', { url: 'https://bypass.test/health', proxy: { enabled: true, url: 'http://127.0.0.1:9', username: 'fixture-user', password: SECRET, bypass: ['bypass.test'] } });
    assert.equal(failing.ok, true); assert.equal(failing.value.ok, false);
    const stored = await rpc('proxyTest', { url: 'https://bypass.test/health' });
    assert.equal(stored.ok, true);
    // Cleared password.
    assert.equal((await rpc('proxySet', { enabled: false, url: '', password: null })).value.passwordSet, false);
    const serialized = transcript.join('\n');
    assert.ok(transcript.length > 14);
    assert.equal(serialized.includes(SECRET), false);
    assert.equal(serialized.includes(encodeURIComponent(SECRET)), false);
    assert.equal(serialized.includes(Buffer.from(`u:${SECRET}`).toString('base64')), false);
    assert.equal(/bearer\s+[a-z0-9]/i.test(serialized), false);
    // The secret is persisted only in the owner-only proxy file.
    assert.deepEqual((await readdir(`${process.env.DSH_HOME}/plugins/majed/subscriptions`)).includes('proxy.json'), true);
  } finally { globalThis.fetch = original; host.dispose(); await resetProxyForTests(); }
});
