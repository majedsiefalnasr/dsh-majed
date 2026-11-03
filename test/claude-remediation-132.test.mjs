// Ticket #132 remediation: registered-adapter presentation and pooling, binding survival, account-switch safety, disposal.
// Every credential, token and HTTP exchange below is a fixture. Nothing touches the real Keychain, ~/.claude or Anthropic.
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { apply, CLAUDE_KEYCHAIN_SYNC_MS } from '../dist/subscriptions.js';
import { refreshClaudeSynced } from '../dist/auth/claude-code-creds.js';
import { CLAUDE_TOKEN_URL } from '../dist/providers/claude.js';

const FAR = 4_000_000_000_000;
const blob = (extra = {}) => JSON.stringify({ claudeAiOauth: { accessToken: 'fake-a-access', refreshToken: 'fake-a-refresh', expiresAt: FAR, scopes: ['user:inference'], subscriptionType: 'max', emailAddress: 'a@example.test', ...extra }, other: { keep: true } });
const settle = () => new Promise(resolve => setImmediate(resolve));
const until = async (condition, label) => { for (let i = 0; i < 300; i++) { if (await condition()) return; await new Promise(resolve => setTimeout(resolve, 10)); } assert.fail(`timed out waiting for ${label}`); };
const home = async name => { process.env.DSH_HOME = await mkdtemp(join(tmpdir(), `majed-t132-${name}-`)); return process.env.DSH_HOME; };

function fakeIo({ keychain, platform = 'darwin' } = {}) {
  const state = { keychain, reads: 0, writes: [] };
  return { state, io: {
    platform,
    readKeychainRaw() { state.reads++; return state.keychain; },
    getKeychainAccountName() { return 'fixture-account'; },
    writeKeychainRaw(account, raw) { state.writes.push({ account, raw }); state.keychain = raw; return true; },
    credentialsFilePath() { return '/fixture/claude/.credentials.json'; },
    readFileRaw() { state.reads++; return undefined; },
    writeFileRaw() { state.writes.push({ target: 'file' }); return true; },
  } };
}

function host({ io, config = {} }) {
  const routes = new Map(), cleanups = [], adapters = {};
  const ctx = { logger: { warn() {} }, llm: { registerAdapter(ids, value) { adapters[ids[0]] = value; return { replace() {} }; } },
    get: () => ({ fetch: { register(route) { routes.set(route.path, route); return () => routes.delete(route.path); } } }),
    effect(fn) { const cleanup = fn(); if (cleanup) cleanups.push(cleanup); }, inject(names, fn) { if ([].concat(names).includes('connection')) fn(ctx); } };
  apply(ctx, { models: { claude: [{ id: 'claude-fixture', name: 'Claude fixture' }] }, ...config }, { claudeCredsIo: io });
  return { adapters, async call(endpoint, payload = {}) {
    const method = `majed-subscriptions.${endpoint}`;
    const response = await routes.get(`/api/${method}`).fetch(new Request(`http://localhost/api/${method}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'client-request', rpcId: 'fixture', method, payload }) }));
    return (await response.json()).result;
  }, dispose() { cleanups.splice(0).reverse().forEach(fn => fn()); } };
}

const sse = events => new Response(events.map(event => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join(''), { headers: { 'content-type': 'text/event-stream' } });
const reply = text => sse([
  { type: 'message_start', message: { usage: { input_tokens: 1 } } }, { type: 'content_block_start', index: 0, content_block: { type: 'text' } },
  { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text } }, { type: 'content_block_stop', index: 0 },
  { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 1 } }, { type: 'message_stop' }]);
const session = (token, extra = {}) => ({ accessToken: `fake-${token}-access`, refreshToken: `fake-${token}-refresh`, expiresAt: FAR, scopes: 's', ...extra });

// ---- P2-1 ----
test('P2-1: the REGISTERED Claude adapter carries display name, model names, independent entries and pool failover', async () => {
  await home('registered');
  const store = await import('../dist/auth/store.js');
  await store.saveAccountSession('claude', 'a@example.test', session('a', { emailAddress: 'a@example.test' }));
  await store.saveAccountSession('claude', 'b@example.test', session('b', { emailAddress: 'b@example.test' }));
  const originalFetch = globalThis.fetch;
  const bearers = [];
  globalThis.fetch = async (url, init) => {
    const target = String(url);
    if (target.startsWith('https://api.anthropic.com/v1/messages')) {
      const bearer = String(init.headers.authorization ?? init.headers.Authorization);
      bearers.push(bearer);
      return bearer.includes('fake-a-access')
        ? Response.json({ type: 'error', error: { type: 'rate_limit_error', message: 'limited' } }, { status: 429 })
        : reply('served by b');
    }
    throw new Error('network forbidden');
  };
  const component = host({ io: fakeIo({}).io, config: { pool: { strategy: 'priority' } } });
  try {
    const registered = component.adapters.claude;
    assert.equal((await component.call('setProviderSettings', { provider: 'claude', original: {}, settings: {
      displayName: 'My Claude', modelDisplayNames: { 'claude-fixture': 'Renamed fixture' },
      accounts: { 'b@example.test': { alias: 'Second', independentEntry: true } } } })).ok, true);
    assert.equal(registered.providerInfo('claude').name, 'My Claude', 'the picker provider name follows the preference');
    const models = await registered.listModels('claude');
    const byId = Object.fromEntries(models.map(model => [model.id, model.name]));
    assert.equal(byId['claude-fixture'], 'Renamed fixture', 'model renaming reaches the picker');
    const independentId = models.find(model => model.id.startsWith('~account:'))?.id;
    assert.ok(independentId, 'an independent-account entry is listed');
    assert.match(byId[independentId], /^Second · Renamed fixture$/);
    const chunks = [];
    for await (const chunk of registered.stream({ provider: 'claude', model: 'claude-fixture', messages: [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }], signal: new AbortController().signal })) chunks.push(chunk);
    assert.ok(JSON.stringify(chunks).includes('served by b'), 'a rate-limited account fails over inside the Claude pool');
    assert.ok(bearers.some(bearer => bearer.includes('fake-a-access')) && bearers.some(bearer => bearer.includes('fake-b-access')));
  } finally { component.dispose(); globalThis.fetch = originalFetch; }
});

// ---- P2-2 ----
test('P2-2: a bound account stays bound through source adoption and through two successive refresh rotations', async () => {
  const bound = session('a', { emailAddress: 'a@example.test', keychainBound: true, expiresAt: Date.now() - 1000 });
  const adopted = await refreshClaudeSynced(bound, async () => { throw new Error('must not refresh'); },
    fakeIo({ keychain: blob({ accessToken: 'fake-a-rotated', refreshToken: 'fake-a-rotated-r', expiresAt: FAR }) }).io);
  assert.equal(adopted.accessToken, 'fake-a-rotated'); assert.equal(adopted.keychainBound, true, 'source-adopted session stays bound');
  let step = 0;
  const doRefresh = async base => ({ ...base, accessToken: `fake-r${++step}-access`, refreshToken: `fake-r${step}-refresh`, expiresAt: Date.now() + 1000 }); // refresh results never carry the flag
  const { io } = fakeIo({ keychain: blob({ expiresAt: Date.now() - 1000 }) });
  const first = await refreshClaudeSynced({ ...bound, accessToken: 'fake-a-access', refreshToken: 'fake-a-refresh' }, doRefresh, io);
  assert.equal(first.keychainBound, true, 'first rotation stays bound');
  const second = await refreshClaudeSynced(first, doRefresh, io);
  assert.equal(second.keychainBound, true, 'second rotation stays bound');
  assert.equal(second.accessToken, 'fake-r2-access');
});

test('P2-2: through the component, the persisted session is still bound after the first sync so the next tick syncs again', async () => {
  await home('rebind');
  mock.timers.enable({ apis: ['setInterval'] });
  const { io, state } = fakeIo({ keychain: blob({ expiresAt: Date.now() - 1000 }) });
  const originalFetch = globalThis.fetch;
  let refreshes = 0;
  globalThis.fetch = async url => {
    if (String(url) !== CLAUDE_TOKEN_URL) throw new Error('network forbidden');
    refreshes++;
    return Response.json({ access_token: `fake-r${refreshes}-access`, refresh_token: `fake-r${refreshes}-refresh`, expires_in: 1 });
  };
  const component = host({ io });
  try {
    const store = await import('../dist/auth/store.js');
    await store.saveAccountSession('claude', 'a@example.test', session('a', { emailAddress: 'a@example.test', keychainBound: true, expiresAt: Date.now() - 1000 }));
    mock.timers.tick(CLAUDE_KEYCHAIN_SYNC_MS);
    await until(async () => refreshes === 1 && (await store.listAccounts('claude'))[0].session.accessToken === 'fake-r1-access', 'first sync');
    assert.equal((await store.listAccounts('claude'))[0].session.keychainBound, true, 'the persisted session keeps the binding');
    mock.timers.tick(CLAUDE_KEYCHAIN_SYNC_MS);
    await until(async () => refreshes === 2 && (await store.listAccounts('claude'))[0].session.accessToken === 'fake-r2-access', 'second sync');
    assert.equal((await store.listAccounts('claude'))[0].session.keychainBound, true);
    assert.equal(JSON.parse(state.keychain).claudeAiOauth.refreshToken, 'fake-r2-refresh', 'Claude Code store holds the latest rotation');
  } finally { mock.timers.reset(); component.dispose(); globalThis.fetch = originalFetch; }
});

// ---- P2-3 ----
test('P2-3: a different account in the source is never adopted or overwritten; the stored account refreshes its own token', async () => {
  const stored = session('a', { emailAddress: 'a@example.test', keychainBound: true, expiresAt: Date.now() - 1000 });
  const { io, state } = fakeIo({ keychain: blob({ accessToken: 'fake-b-access', refreshToken: 'fake-b-refresh', emailAddress: 'b@example.test', expiresAt: FAR }) });
  const seen = [];
  const result = await refreshClaudeSynced(stored, async base => { seen.push(base); return { ...base, accessToken: 'fake-a-new', refreshToken: 'fake-a-new-r', expiresAt: FAR }; }, io);
  assert.equal(seen.length, 1); assert.equal(seen[0].refreshToken, 'fake-a-refresh', "A's own refresh token is spent, not B's");
  assert.equal(result.emailAddress, 'a@example.test'); assert.equal(result.accessToken, 'fake-a-new');
  assert.deepEqual(state.writes, [], "B's store is never written with A's tokens");
  assert.equal(JSON.parse(state.keychain).claudeAiOauth.accessToken, 'fake-b-access');
});

test('P2-3: with no comparable identity only refresh-token continuity allows adoption', async () => {
  const noEmail = session('a', { keychainBound: true, expiresAt: Date.now() - 1000 });
  const strangerSource = blob({ accessToken: 'fake-x-access', refreshToken: 'fake-x-refresh', emailAddress: undefined, expiresAt: FAR });
  let refreshed = 0;
  const kept = await refreshClaudeSynced(noEmail, async base => { refreshed++; assert.equal(base.refreshToken, 'fake-a-refresh'); return { ...base, accessToken: 'fake-a-new', expiresAt: FAR }; }, fakeIo({ keychain: strangerSource }).io);
  assert.equal(refreshed, 1); assert.equal(kept.accessToken, 'fake-a-new');
  const sameRefresh = await refreshClaudeSynced(noEmail, async () => { throw new Error('must not refresh'); },
    fakeIo({ keychain: blob({ accessToken: 'fake-a-access-2', refreshToken: 'fake-a-refresh', emailAddress: undefined, expiresAt: FAR }) }).io);
  assert.equal(sameRefresh.accessToken, 'fake-a-access-2', 'same refresh token proves the same login');
});

// ---- P2-4 ----
const tickWith = async (name, { holdList }) => {
  await home(name);
  mock.timers.enable({ apis: ['setInterval'] });
  const { io, state } = fakeIo({ keychain: blob({ expiresAt: Date.now() - 1000 }) });
  const component = host({ io });
  const store = await import('../dist/auth/store.js');
  await store.saveAccountSession('claude', 'a@example.test', session('a', { emailAddress: 'a@example.test', keychainBound: true, expiresAt: Date.now() - 1000 }));
  return { component, state, store, holdList };
};

test('P2-4: disposing while the account list is pending does no credential read, refresh, write-back or save', async () => {
  const unhandled = []; const onRejection = reason => unhandled.push(reason); process.on('unhandledRejection', onRejection);
  const originalFetch = globalThis.fetch; const urls = [];
  globalThis.fetch = async url => { urls.push(String(url)); throw new Error('network forbidden'); };
  const { component, state, store } = await tickWith('dispose-list', {});
  try {
    mock.timers.tick(CLAUDE_KEYCHAIN_SYNC_MS);
    component.dispose(); // the list read from disk is still in flight
    await new Promise(resolve => setTimeout(resolve, 150)); await settle();
    assert.equal(state.reads, 0, 'Claude Code store is not read after disposal');
    assert.deepEqual(state.writes, []); assert.deepEqual(urls, []);
    assert.equal((await store.listAccounts('claude'))[0].session.accessToken, 'fake-a-access', 'nothing was saved');
    assert.deepEqual(unhandled, []);
  } finally { mock.timers.reset(); component.dispose(); globalThis.fetch = originalFetch; process.off('unhandledRejection', onRejection); }
});

test('P2-4: disposing during an in-flight refresh aborts the request and neither writes back nor saves', async () => {
  const unhandled = []; const onRejection = reason => unhandled.push(reason); process.on('unhandledRejection', onRejection);
  const originalFetch = globalThis.fetch;
  let release; const gate = new Promise(resolve => { release = resolve; });
  const calls = [];
  globalThis.fetch = async (url, init) => {
    if (String(url) !== CLAUDE_TOKEN_URL) throw new Error('network forbidden');
    calls.push(init); await gate;
    return Response.json({ access_token: 'fake-late-access', refresh_token: 'fake-late-refresh', expires_in: 3600 });
  };
  const { component, state, store } = await tickWith('dispose-refresh', {});
  try {
    mock.timers.tick(CLAUDE_KEYCHAIN_SYNC_MS);
    await until(() => calls.length === 1, 'refresh request');
    component.dispose();
    assert.equal(calls[0].signal?.aborted, true, 'the refresh request carries the lifecycle signal, now aborted');
    release(); await new Promise(resolve => setTimeout(resolve, 150)); await settle();
    assert.deepEqual(state.writes, [], 'no write-back after disposal');
    assert.equal((await store.listAccounts('claude'))[0].session.accessToken, 'fake-a-access', 'no save after disposal');
    assert.deepEqual(unhandled, []);
  } finally { release(); mock.timers.reset(); component.dispose(); globalThis.fetch = originalFetch; process.off('unhandledRejection', onRejection); }
});

// ---- P3 hardening: the real writer (SYSTEM_CLAUDE_CREDS_IO) against a temp directory only ----
test('writeFileRaw refuses to write through a symlink at the credentials path and still writes a plain file owner-only', async () => {
  const { SYSTEM_CLAUDE_CREDS_IO } = await import('../dist/auth/claude-code-creds.js');
  const { symlink, writeFile, readFile, stat } = await import('node:fs/promises');
  const dir = await mkdtemp(join(tmpdir(), 'majed-t132-symlink-'));
  const saved = process.env.CLAUDE_CONFIG_DIR; process.env.CLAUDE_CONFIG_DIR = dir;
  try {
    const target = join(dir, 'victim.txt'); await writeFile(target, 'untouched');
    const path = SYSTEM_CLAUDE_CREDS_IO.credentialsFilePath();
    assert.equal(path, join(dir, '.credentials.json'));
    await symlink(target, path);
    assert.equal(SYSTEM_CLAUDE_CREDS_IO.writeFileRaw(path, 'overwritten'), false, 'a symlink is refused');
    assert.equal(await readFile(target, 'utf8'), 'untouched', 'the link target is never written');
    const plain = join(dir, 'sub', '.credentials.json');
    assert.equal(SYSTEM_CLAUDE_CREDS_IO.writeFileRaw(plain, 'ok'), true);
    assert.equal((await stat(plain)).mode & 0o777, 0o600);
  } finally { if (saved === undefined) delete process.env.CLAUDE_CONFIG_DIR; else process.env.CLAUDE_CONFIG_DIR = saved; }
});
