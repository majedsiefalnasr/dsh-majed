// Ticket #132 second remediation: a rotated Claude Code login is adopted by ACCOUNT IDENTITY (normalized email, resolved
// through the profile lookup when a blob carries none), not by refresh-token continuity. Real blobs usually have no email
// and Anthropic issues a new refresh token on every refresh. Every credential, token and HTTP exchange is a fixture.
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { apply, CLAUDE_KEYCHAIN_SYNC_MS } from '../dist/subscriptions.js';
import { refreshClaudeSynced } from '../dist/auth/claude-code-creds.js';
import { CLAUDE_TOKEN_URL, isClaudePermanentRefreshError } from '../dist/providers/claude.js';

const FAR = 4_000_000_000_000;
// Real-world shape: no email in the blob.
const blob = (extra = {}) => JSON.stringify({ claudeAiOauth: { accessToken: 'fake-a-access', refreshToken: 'fake-a-refresh', expiresAt: FAR, scopes: ['user:inference'], subscriptionType: 'max', ...extra }, other: { keep: true } });
const until = async (condition, label) => { for (let i = 0; i < 300; i++) { if (await condition()) return; await new Promise(resolve => setTimeout(resolve, 10)); } assert.fail(`timed out waiting for ${label}`); };
const home = async name => { process.env.DSH_HOME = await mkdtemp(join(tmpdir(), `majed-t132-id-${name}-`)); return process.env.DSH_HOME; };
const stored = (extra = {}) => ({ accessToken: 'fake-a-access', refreshToken: 'fake-a-refresh', expiresAt: Date.now() - 1000, scopes: 's', keychainBound: true, ...extra });

function fakeIo({ keychain } = {}) {
  const state = { keychain, reads: 0, writes: [] };
  return { state, io: {
    platform: 'darwin',
    readKeychainRaw() { state.reads++; return state.keychain; },
    getKeychainAccountName() { return 'fixture-account'; },
    writeKeychainRaw(account, raw) { state.writes.push({ account, raw }); state.keychain = raw; return true; },
    credentialsFilePath() { return '/fixture/claude/.credentials.json'; },
    readFileRaw() { state.reads++; return undefined; },
    writeFileRaw() { state.writes.push({ target: 'file' }); return true; },
  } };
}
/** Profile lookup fake keyed by access token; records every call. */
const profiles = (byToken) => { const calls = []; return { calls, profile: async (token, signal) => { calls.push({ token, signal }); const value = byToken[token]; if (value instanceof Error) throw value; return value; } }; };
const refreshOnce = () => { const seen = []; return { seen, doRefresh: async base => { seen.push(base); return { ...base, accessToken: 'fake-a-new', refreshToken: 'fake-a-new-r', expiresAt: FAR }; } }; };
const noRefresh = async () => { throw new Error('the stale refresh token must not be spent'); };
const unhandledGuard = () => { const seen = []; const fn = reason => seen.push(reason); process.on('unhandledRejection', fn); return { seen, off() { process.off('unhandledRejection', fn); } }; };

function host({ io, profile }) {
  const routes = new Map(), cleanups = [];
  const ctx = { logger: { warn() {} }, llm: { registerAdapter() { return { replace() {} }; } },
    get: () => ({ fetch: { register(route) { routes.set(route.path, route); return () => routes.delete(route.path); } } }),
    effect(fn) { const cleanup = fn(); if (cleanup) cleanups.push(cleanup); }, inject(names, fn) { if ([].concat(names).includes('connection')) fn(ctx); } };
  apply(ctx, { models: { claude: [{ id: 'claude-fixture', name: 'Claude fixture' }] } }, { claudeCredsIo: io, claudeProfile: profile });
  return { async call(endpoint, payload = {}) {
    const method = `majed-subscriptions.${endpoint}`;
    const response = await routes.get(`/api/${method}`).fetch(new Request(`http://localhost/api/${method}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'client-request', rpcId: 'fixture', method, payload }) }));
    return (await response.json()).result;
  }, dispose() { cleanups.splice(0).reverse().forEach(fn => fn()); } };
}

// ---- (a) rotated by the CLI, same account, no email anywhere in the blobs ----
test('(a) an email-less bound account adopts a source the CLI rotated with a NEW refresh token; the stale token is not spent; two rotations work', async () => {
  const { profile, calls } = profiles({ 'fake-r1-access': { emailAddress: 'a@example.test' }, 'fake-r2-access': { emailAddress: 'a@example.test' }, 'fake-a-access': { emailAddress: 'a@example.test' } });
  const { io, state } = fakeIo({ keychain: blob({ accessToken: 'fake-r1-access', refreshToken: 'fake-r1-refresh' }) });
  const first = await refreshClaudeSynced(stored(), noRefresh, io, undefined, { profile });
  assert.equal(first.accessToken, 'fake-r1-access'); assert.equal(first.refreshToken, 'fake-r1-refresh');
  assert.equal(first.keychainBound, true, 'stays keychainBound'); assert.equal(first.emailAddress, 'a@example.test', 'the learned email is recorded');
  assert.deepEqual(state.writes, [], 'adoption writes nothing back');
  state.keychain = blob({ accessToken: 'fake-r2-access', refreshToken: 'fake-r2-refresh' }); // the CLI rotates again
  const callsBefore = calls.length;
  const second = await refreshClaudeSynced(first, noRefresh, io, undefined, { profile });
  assert.equal(second.accessToken, 'fake-r2-access'); assert.equal(second.keychainBound, true);
  assert.equal(calls.length, callsBefore + 1, 'with the email on the stored session only the source is looked up');
  assert.equal(calls.at(-1).token, 'fake-r2-access', 'the SOURCE access token is used');
});

test('(a) through the component: the tick adopts the CLI rotation without spending our refresh token and the account stays bound', async () => {
  await home('component-rotation');
  mock.timers.enable({ apis: ['setInterval'] });
  const { io } = fakeIo({ keychain: blob({ accessToken: 'fake-r1-access', refreshToken: 'fake-r1-refresh' }) });
  const originalFetch = globalThis.fetch; const urls = [];
  globalThis.fetch = async url => { urls.push(String(url)); throw new Error('network forbidden'); };
  const component = host({ io, profile: profiles({ 'fake-r1-access': { emailAddress: 'a@example.test' }, 'fake-a-access': { emailAddress: 'a@example.test' } }).profile });
  try {
    const store = await import('../dist/auth/store.js');
    await store.saveAccountSession('claude', 'k', stored());
    mock.timers.tick(CLAUDE_KEYCHAIN_SYNC_MS);
    await until(async () => (await store.listAccounts('claude'))[0]?.session.accessToken === 'fake-r1-access', 'adoption');
    const session = (await store.listAccounts('claude'))[0].session;
    assert.equal(session.refreshToken, 'fake-r1-refresh'); assert.equal(session.keychainBound, true); assert.equal(session.emailAddress, 'a@example.test');
    assert.equal(urls.includes(CLAUDE_TOKEN_URL), false, 'the OAuth refresh endpoint was never called');
  } finally { mock.timers.reset(); component.dispose(); globalThis.fetch = originalFetch; }
});

// ---- (b) account switch ----
test('(b) the account stays protected: the profile of the source token names another account, so it is not adopted and not written', async () => {
  const { profile } = profiles({ 'fake-b-access': { emailAddress: 'b@example.test' }, 'fake-a-access': { emailAddress: 'a@example.test' } });
  const original = blob({ accessToken: 'fake-b-access', refreshToken: 'fake-b-refresh' });
  const { io, state } = fakeIo({ keychain: original });
  const refresh = refreshOnce();
  const result = await refreshClaudeSynced(stored(), refresh.doRefresh, io, undefined, { profile });
  assert.equal(refresh.seen.length, 1); assert.equal(refresh.seen[0].refreshToken, 'fake-a-refresh', "A's own refresh token is used");
  assert.equal(result.accessToken, 'fake-a-new'); assert.equal(result.keychainBound, true);
  assert.deepEqual(state.writes, [], "no write-back of A over B's login"); assert.equal(state.keychain, original, "B's blob is unchanged");
  // Stored side already carries an email: only the source is looked up.
  const second = await refreshClaudeSynced(stored({ emailAddress: 'a@example.test' }), refreshOnce().doRefresh, io, undefined, { profile });
  assert.equal(second.accessToken, 'fake-a-new'); assert.deepEqual(state.writes, []);
});

// ---- (c) lookup failure ----
const unproven = async (label, identity, { signal } = {}) => {
  const guard = unhandledGuard();
  const { io, state } = fakeIo({ keychain: blob({ accessToken: 'fake-r1-access', refreshToken: 'fake-r1-refresh' }) });
  const original = state.keychain; const refresh = refreshOnce();
  try {
    const result = await refreshClaudeSynced(stored(), refresh.doRefresh, io, signal, identity);
    assert.equal(refresh.seen.length, 1, `${label}: not adopted, own refresh used`); assert.equal(refresh.seen[0].refreshToken, 'fake-a-refresh');
    assert.equal(result.accessToken, 'fake-a-new'); assert.equal(result.keychainBound, true);
    assert.deepEqual(state.writes, [], `${label}: no write-back`); assert.equal(state.keychain, original);
    await new Promise(resolve => setImmediate(resolve)); assert.deepEqual(guard.seen, [], `${label}: no unhandled rejection`);
  } finally { guard.off(); }
};
test('(c) a failing, empty or email-less profile lookup does not adopt and does not write back', async () => {
  await unproven('throws', { profile: profiles({ 'fake-r1-access': new Error('network down'), 'fake-a-access': new Error('network down') }).profile });
  await unproven('no email', { profile: async () => ({}) });
  await unproven('undefined', { profile: async () => undefined });
});
test('(c) a lookup that hangs and ignores its signal is cut off by the timeout', async () => {
  const started = Date.now();
  await unproven('timeout', { profile: () => new Promise(() => {}), profileTimeoutMs: 30 });
  assert.ok(Date.now() - started < 2000, 'bounded by the timeout');
});
test('(c) an abort during the lookup stops everything and is not a permanent failure', async () => {
  const guard = unhandledGuard();
  const controller = new AbortController();
  const { io, state } = fakeIo({ keychain: blob({ accessToken: 'fake-r1-access', refreshToken: 'fake-r1-refresh' }) });
  let seenSignal;
  const profile = (token, signal) => new Promise(() => { seenSignal = signal; controller.abort(); });
  try {
    const error = await refreshClaudeSynced(stored(), noRefresh, io, controller.signal, { profile }).then(() => undefined, caught => caught);
    assert.ok(error !== undefined, 'the refresh is abandoned');
    assert.equal(isClaudePermanentRefreshError(error), false, 'an abort never deletes the account');
    assert.equal(seenSignal.aborted, true, 'the lookup received an aborted signal'); assert.deepEqual(state.writes, []);
    await new Promise(resolve => setImmediate(resolve)); assert.deepEqual(guard.seen, []);
  } finally { guard.off(); }
});
test('(c) refresh-token continuity stays only as a signal when both emails are unknown after a failed lookup', async () => {
  const { io } = fakeIo({ keychain: blob({ accessToken: 'fake-a-access-2', refreshToken: 'fake-a-refresh' }) });
  const result = await refreshClaudeSynced(stored(), noRefresh, io, undefined, { profile: async () => { throw new Error('offline'); } });
  assert.equal(result.accessToken, 'fake-a-access-2');
  const none = fakeIo({ keychain: blob({ accessToken: 'fake-a-access-2', refreshToken: 'fake-a-refresh' }) });
  const knownDifferent = await refreshClaudeSynced(stored(), refreshOnce().doRefresh, none.io, undefined, { profile: profiles({ 'fake-a-access-2': { emailAddress: 'b@example.test' }, 'fake-a-access': { emailAddress: 'a@example.test' } }).profile });
  assert.equal(knownDifferent.accessToken, 'fake-a-new', 'a known different email beats an identical refresh token');
});
test('(c) without any profile seam nothing is looked up and nothing unproven is adopted', async () => {
  const { io, state } = fakeIo({ keychain: blob({ accessToken: 'fake-r1-access', refreshToken: 'fake-r1-refresh' }) });
  const refresh = refreshOnce();
  await refreshClaudeSynced(stored(), refresh.doRefresh, io);
  assert.equal(refresh.seen.length, 1); assert.deepEqual(state.writes, []);
});

// ---- (d) normalization ----
test('(d) emails that differ only in case or surrounding whitespace are the same account', async () => {
  const { io } = fakeIo({ keychain: blob({ accessToken: 'fake-r1-access', refreshToken: 'fake-r1-refresh', emailAddress: '  A@Example.TEST ' }) });
  const direct = await refreshClaudeSynced(stored({ emailAddress: 'a@example.test' }), noRefresh, io);
  assert.equal(direct.accessToken, 'fake-r1-access');
  const { io: io2 } = fakeIo({ keychain: blob({ accessToken: 'fake-r1-access', refreshToken: 'fake-r1-refresh' }) });
  const looked = await refreshClaudeSynced(stored({ emailAddress: ' A@EXAMPLE.test' }), noRefresh, io2, undefined, { profile: async () => ({ emailAddress: 'a@Example.Test\n' }) });
  assert.equal(looked.accessToken, 'fake-r1-access');
  const { io: io3 } = fakeIo({ keychain: blob({ accessToken: 'fake-r1-access', refreshToken: 'fake-r1-refresh', emailAddress: 'b@example.test' }) });
  const other = await refreshClaudeSynced(stored({ emailAddress: 'a@example.test' }), refreshOnce().doRefresh, io3);
  assert.equal(other.accessToken, 'fake-a-new', 'different emails are still different accounts');
});

// ---- (e) email recorded at import ----
test('(e) importing an email-less Claude Code login records the profile email on the stored session', async () => {
  await home('import');
  const { io } = fakeIo({ keychain: blob() });
  const lookup = profiles({ 'fake-a-access': { emailAddress: 'a@example.test' } });
  const component = host({ io, profile: lookup.profile });
  try {
    assert.equal((await component.call('login', { provider: 'claude', method: 'keychain' })).ok, true);
    const store = await import('../dist/auth/store.js');
    const [entry] = await store.listAccounts('claude');
    assert.equal(entry.session.emailAddress, 'a@example.test'); assert.equal(entry.session.keychainBound, true);
    assert.equal(entry.key, 'a@example.test', 'the account is keyed and labelled by the email');
    assert.deepEqual(lookup.calls.map(call => call.token), ['fake-a-access']);
    assert.ok(lookup.calls[0].signal instanceof AbortSignal, 'the lookup is cancellable');
  } finally { component.dispose(); }
});
test('(e) an import still succeeds, without an email, when the profile lookup fails', async () => {
  await home('import-fail');
  const { io } = fakeIo({ keychain: blob() });
  const component = host({ io, profile: async () => { throw new Error('offline'); } });
  try {
    assert.equal((await component.call('login', { provider: 'claude', method: 'keychain' })).ok, true);
    const store = await import('../dist/auth/store.js');
    const [entry] = await store.listAccounts('claude');
    assert.equal(entry.session.emailAddress, undefined); assert.equal(entry.session.keychainBound, true);
  } finally { component.dispose(); }
});
