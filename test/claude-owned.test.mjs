// Ticket #132: assembled Claude component (host RPC, login by import or browser, credential store sync, chat, security).
// Adapted from the Claude cases of V1ki v0.9.12 test/login.spec.ts (MIT) for the owned ClaudeAuthController and RPC;
// every credential, token and HTTP exchange below is a fixture. Nothing touches the real Keychain, ~/.claude or Anthropic.
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, stat, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { apply, CLAUDE_KEYCHAIN_SYNC_MS } from '../dist/subscriptions.js';
import { ClaudeAuthController } from '../dist/auth/claude-controller.js';
import { OAuthFlowManager } from '../dist/auth/oauth-flow.js';
import { readClaudeCodeCredentials, writeBackClaudeCodeCredentials, refreshClaudeSynced } from '../dist/auth/claude-code-creds.js';
import { CLAUDE_AUTHORIZE_URL, CLAUDE_CALLBACK_PATH, CLAUDE_CLIENT_ID, CLAUDE_SCOPE, CLAUDE_TOKEN_URL } from '../dist/providers/claude.js';

const FAR = 4_000_000_000_000;
const SECRETS = ['fake-claude-access', 'fake-claude-refresh', 'fake-imported-access', 'fake-imported-refresh', 'fake-rotated-access', 'fake-rotated-refresh'];
const blob = (extra = {}) => JSON.stringify({ claudeAiOauth: { accessToken: 'fake-imported-access', refreshToken: 'fake-imported-refresh', expiresAt: FAR, scopes: ['user:inference'], subscriptionType: 'max', emailAddress: 'imported@example.test', ...extra }, other: { keep: true } });

/** A fake credential store that records every touch, so tests can prove when it is (not) read. */
function fakeIo({ keychain, file, platform = 'darwin' } = {}) {
  const state = { keychain, file, reads: 0, writes: [], platform };
  return { state, io: {
    platform,
    readKeychainRaw() { state.reads++; return state.keychain; },
    getKeychainAccountName() { return 'fixture-account'; },
    writeKeychainRaw(account, raw) { state.writes.push({ target: 'keychain', account, raw }); state.keychain = raw; return true; },
    credentialsFilePath() { return '/fixture/claude/.credentials.json'; },
    readFileRaw() { state.reads++; return state.file; },
    writeFileRaw(path, raw) { state.writes.push({ target: 'file', path, raw }); state.file = raw; return true; },
  } };
}

function host({ io, config = {}, collideClaude = false } = {}) {
  const routes = new Map(), cleanups = [];
  const adapters = {};
  const ctx = { logger: { warn() {} }, llm: { registerAdapter(ids, value) {
    if (ids[0] === 'claude' && collideClaude) throw new Error('provider claude already registered');
    adapters[ids[0]] = value; return { replace() {} };
  } }, get: () => ({ fetch: { register(route) { routes.set(route.path, route); return () => routes.delete(route.path); } } }),
  effect(fn) { const cleanup = fn(); if (cleanup) cleanups.push(cleanup); }, inject(names, fn) { if ([].concat(names).includes('connection')) fn(ctx); } };
  apply(ctx, { models: { claude: [{ id: 'claude-fixture', name: 'Claude fixture' }] }, ...config }, { claudeCredsIo: io });
  return { adapters, routes, async call(endpoint, payload = {}) {
    const method = `majed-subscriptions.${endpoint}`;
    const response = await routes.get(`/api/${method}`).fetch(new Request(`http://localhost/api/${method}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'client-request', rpcId: 'fixture', method, payload }),
    }));
    return (await response.json()).result;
  }, dispose() { cleanups.splice(0).reverse().forEach(fn => fn()); } };
}
const home = async name => { process.env.DSH_HOME = await mkdtemp(join(tmpdir(), `majed-t129-claude-${name}-`)); return process.env.DSH_HOME; };
const forbidFetch = () => { const saved = globalThis.fetch; const urls = []; globalThis.fetch = async url => { urls.push(String(url)); throw new Error('network forbidden'); }; return { urls, restore() { globalThis.fetch = saved; } }; };
const noSecrets = (value, label) => { const text = JSON.stringify(value); for (const secret of SECRETS) assert.equal(text.includes(secret), false, `${label} leaks ${secret}`); };
const settle = () => new Promise(resolve => setImmediate(resolve));

test('Claude OAuth parameters match what Claude Code sends (literals on purpose)', () => {
  assert.equal(CLAUDE_AUTHORIZE_URL, 'https://claude.ai/oauth/authorize');
  assert.equal(CLAUDE_CLIENT_ID, '9d1c250a-e61b-44d9-88ed-5944d1962f5e');
  assert.equal(CLAUDE_CALLBACK_PATH, '/callback');
  assert.equal(CLAUDE_SCOPE, 'org:create_api_key user:profile user:inference user:sessions:claude_code user:mcp_servers user:file_upload');
});

// ---- Claude Code credential reader (reference login.spec.ts cases, through the injectable store) ----
test('readClaudeCodeCredentials: keychain first on macOS, then file; malformed, incomplete and empty-string blobs are rejected', () => {
  assert.equal(readClaudeCodeCredentials(fakeIo({ keychain: blob(), file: undefined }).io).accessToken, 'fake-imported-access');
  assert.equal(readClaudeCodeCredentials(fakeIo({ keychain: undefined, file: blob({ accessToken: 'file-token' }) }).io).accessToken, 'file-token');
  assert.equal(readClaudeCodeCredentials(fakeIo({ keychain: blob({ accessToken: 'kc' }), file: blob({ accessToken: 'file' }) }).io).accessToken, 'kc', 'the keychain wins');
  assert.equal(readClaudeCodeCredentials(fakeIo({ platform: 'linux', keychain: blob({ accessToken: 'kc' }), file: blob({ accessToken: 'file' }) }).io).accessToken, 'file', 'off macOS only the file is read');
  assert.equal(readClaudeCodeCredentials(fakeIo({}).io), undefined);
  assert.equal(readClaudeCodeCredentials(fakeIo({ file: '{not valid json!!!' }).io), undefined);
  assert.equal(readClaudeCodeCredentials(fakeIo({ file: JSON.stringify({ claudeAiOauth: { accessToken: 'only-access' } }) }).io), undefined);
  assert.equal(readClaudeCodeCredentials(fakeIo({ file: blob({ accessToken: '', refreshToken: '', expiresAt: 0 }) }).io), undefined, 'empty tokens are rejected');
  const bare = readClaudeCodeCredentials(fakeIo({ file: JSON.stringify({ accessToken: 'bare-at', refreshToken: 'bare-rt', expiresAt: FAR }) }).io);
  assert.equal(bare.accessToken, 'bare-at');
  assert.equal(readClaudeCodeCredentials(fakeIo({ file: blob({ expiresAt: 'soon' }) }).io), undefined, 'a non-numeric expiry is rejected');
});

test('write-back merges only the three token fields, and only when the store still holds the token the refresh started from', () => {
  const next = { accessToken: 'fake-rotated-access', refreshToken: 'fake-rotated-refresh', expiresAt: FAR + 1, scopes: 'x' };
  const stale = fakeIo({ keychain: blob({ accessToken: 'someone-else' }) });
  assert.equal(writeBackClaudeCodeCredentials(next, 'fake-imported-access', stale.io), false);
  assert.deepEqual(stale.state.writes, [], 'a stale blob is never overwritten');
  const fresh = fakeIo({ keychain: blob() });
  assert.equal(writeBackClaudeCodeCredentials(next, 'fake-imported-access', fresh.io), true);
  const written = JSON.parse(fresh.state.writes[0].raw);
  assert.equal(fresh.state.writes[0].account, 'fixture-account');
  assert.deepEqual(written.claudeAiOauth, { accessToken: 'fake-rotated-access', refreshToken: 'fake-rotated-refresh', expiresAt: FAR + 1, scopes: ['user:inference'], subscriptionType: 'max', emailAddress: 'imported@example.test' });
  assert.deepEqual(written.other, { keep: true }, 'unrelated fields survive');
  const onFile = fakeIo({ platform: 'linux', file: blob() });
  assert.equal(writeBackClaudeCodeCredentials(next, 'fake-imported-access', onFile.io), true);
  assert.equal(onFile.state.writes[0].target, 'file');
  assert.equal(writeBackClaudeCodeCredentials(next, 'fake-imported-access', fakeIo({}).io), false, 'no store, no write');
});

test('refreshClaudeSynced prefers a fresher token already in Claude Code store and refreshes + writes back otherwise', async () => {
  const session = { accessToken: 'fake-imported-access', refreshToken: 'fake-imported-refresh', expiresAt: Date.now() - 1000, scopes: 's', emailAddress: 'imported@example.test', keychainBound: true };
  const rotated = fakeIo({ keychain: blob({ accessToken: 'fake-rotated-access', refreshToken: 'fake-rotated-refresh', expiresAt: FAR }) });
  let refreshes = 0;
  const viaSource = await refreshClaudeSynced(session, async () => { refreshes++; throw new Error('must not refresh'); }, rotated.io);
  assert.equal(viaSource.accessToken, 'fake-rotated-access'); assert.equal(refreshes, 0);
  const stored = fakeIo({ keychain: blob({ expiresAt: Date.now() - 1000 }) });
  const result = await refreshClaudeSynced(session, async base => { refreshes++; return { ...base, accessToken: 'fake-claude-access', refreshToken: 'fake-claude-refresh', expiresAt: FAR }; }, stored.io);
  assert.equal(refreshes, 1); assert.equal(result.accessToken, 'fake-claude-access');
  assert.equal(stored.state.writes.length, 1, 'write-back runs because the store still holds the token this refresh started from');
  const written = JSON.parse(stored.state.keychain).claudeAiOauth;
  assert.deepEqual([written.accessToken, written.refreshToken, written.emailAddress, written.subscriptionType], ['fake-claude-access', 'fake-claude-refresh', 'imported@example.test', 'max'], 'only the three token fields change');
});

// ---- controller ----
function controller(readImported, flows = new OAuthFlowManager()) {
  const changed = [];
  return { flows, changed, controller: new ClaudeAuthController(flows, account => changed.push(account), error => error instanceof Error ? error.message : String(error), readImported) };
}
const session = { accessToken: 'fake-imported-access', refreshToken: 'fake-imported-refresh', expiresAt: FAR, scopes: 'user:inference', emailAddress: 'imported@example.test', subscriptionType: 'max' };

test('login: credentials found → instant import, bound to Claude Code, persisted in the protected store only', async () => {
  const dir = await home('import');
  const { controller: auth } = controller(() => session);
  try {
    assert.deepEqual(await auth.login(), { authorizeUrl: '' });
    const store = await import('../dist/auth/store.js');
    const saved = (await store.listAccounts('claude'))[0];
    assert.equal(saved.session.accessToken, 'fake-imported-access');
    assert.equal(saved.session.keychainBound, true, 'imported accounts are the only ones that sync back');
    assert.equal((await stat(store.authFilePath())).mode & 0o777, 0o600);
    const status = await auth.status();
    assert.equal(status.accounts.length, 1); assert.equal(status.accounts[0].account, 'imported@example.test'); assert.equal(status.accounts[0].plan, 'max');
    noSecrets(status, 'controller status');
    assert.equal(dir, process.env.DSH_HOME);
  } finally { auth.dispose(); }
});

test("login('keychain') without Claude Code credentials fails with a safe, actionable message and opens no flow", async () => {
  await home('nocreds');
  const { controller: auth, flows } = controller(() => undefined);
  try {
    await assert.rejects(auth.login('keychain'), /no Claude Code credentials found; run `claude` and log in first/);
    assert.equal(flows.isBusy('claude'), false);
  } finally { auth.dispose(); }
});

test('login: credentials absent → browser OAuth with Claude Code parameters, PKCE and a 32-byte state; method oauth never reads the store', async () => {
  await home('oauth');
  let reads = 0;
  const { controller: auth } = controller(() => { reads++; return session; });
  try {
    const { authorizeUrl } = await auth.login('oauth');
    assert.equal(reads, 0, "'oauth' skips the import entirely");
    const url = new URL(authorizeUrl);
    assert.equal(`${url.origin}${url.pathname}`, CLAUDE_AUTHORIZE_URL);
    const p = url.searchParams;
    assert.equal(p.get('code'), 'true'); assert.equal(p.get('client_id'), CLAUDE_CLIENT_ID); assert.equal(p.get('response_type'), 'code');
    assert.equal(p.get('scope'), CLAUDE_SCOPE); assert.equal(p.get('code_challenge_method'), 'S256'); assert.ok(p.get('code_challenge'));
    const redirect = new URL(p.get('redirect_uri'));
    assert.equal(redirect.hostname, 'localhost'); assert.ok(Number(redirect.port) > 0); assert.equal(redirect.pathname, CLAUDE_CALLBACK_PATH);
    assert.ok((p.get('state') ?? '').length >= 43);
    assert.equal((await auth.status()).busy, true);
    assert.equal((await auth.status()).pendingAuth.authorizeUrl, authorizeUrl);
  } finally { await auth.cancel(); auth.dispose(); }
});

test('login with no method falls back to browser OAuth when Claude Code holds no login', async () => {
  await home('fallback');
  const { controller: auth } = controller(() => undefined);
  try {
    const { authorizeUrl } = await auth.login();
    assert.ok(new URL(authorizeUrl).searchParams.get('code_challenge'));
  } finally { await auth.cancel(); auth.dispose(); }
});

test('a later import cancels the OAuth attempt left in flight and the import wins', async () => {
  await home('supersede');
  let available;
  const { controller: auth, flows } = controller(() => available);
  try {
    await auth.login('oauth');
    assert.equal(flows.isBusy('claude'), true);
    available = session;
    assert.deepEqual(await auth.login('keychain'), { authorizeUrl: '' });
    await settle();
    assert.equal((await auth.status()).busy, false, 'the cancelled listener is freed');
    assert.equal((await auth.status()).accounts.length, 1);
  } finally { auth.dispose(); }
});

test('logout and cancel beat an in-flight attempt: nothing is exchanged or persisted afterwards', async () => {
  await home('logout');
  const fetchGuard = forbidFetch();
  const { controller: auth } = controller(() => session);
  try {
    await auth.login('keychain');
    const key = (await auth.status()).accounts[0].key;
    await auth.login('oauth');
    await auth.logout(key);
    await settle();
    const status = await auth.status();
    assert.deepEqual(status.accounts, []); assert.equal(status.busy, false);
    await auth.login('oauth'); await auth.cancel(); await settle();
    assert.equal((await auth.status()).busy, false);
    assert.deepEqual(fetchGuard.urls, [], 'no token exchange was attempted');
  } finally { fetchGuard.restore(); auth.dispose(); }
});

test('an import and a logout fired together settle in call order', async () => {
  await home('order');
  const { controller: auth } = controller(() => session);
  try {
    await auth.login('keychain');
    const key = (await auth.status()).accounts[0].key;
    await Promise.all([auth.logout(key), auth.login('keychain')]);
    assert.equal((await auth.status()).accounts.length, 1, 'logout first, then the import re-adds the account');
    await Promise.all([auth.login('keychain'), auth.logout(key)]);
    assert.equal((await auth.status()).accounts.length, 0, 'import first, then the logout removes it');
  } finally { auth.dispose(); }
});

// ---- assembled host ----
test('assembled never-logged-in Claude does no network and never touches the credential store; disposal removes every route', async () => {
  await home('empty');
  const fetchGuard = forbidFetch();
  const { io, state } = fakeIo({ keychain: blob() });
  const component = host({ io });
  try {
    const status = await component.call('status');
    assert.equal(status.ok, true);
    assert.deepEqual(status.value.providers.claude.accounts, []);
    assert.equal('clientVersion' in status.value.providers.claude && status.value.providers.claude.clientVersion !== undefined, false, 'an unused provider presents no CLI version');
    assert.deepEqual(await component.adapters.claude.listModels('claude'), []);
    assert.equal((await component.call('usage', { provider: 'claude', account: 'missing' })).ok, false);
    assert.equal(state.reads, 0, 'the Claude Code store is read only on an explicit login');
    assert.deepEqual(fetchGuard.urls, []);
  } finally { component.dispose(); fetchGuard.restore(); }
});

test('assembled import through the RPC: no token reaches the browser, the status, an error or the store listing', async () => {
  await home('rpc-import');
  const fetchGuard = forbidFetch();
  const { io, state } = fakeIo({ keychain: blob() });
  const component = host({ io });
  try {
    const login = await component.call('login', { provider: 'claude', method: 'keychain' });
    assert.deepEqual(login, { ok: true, value: { authorizeUrl: '' } });
    assert.ok(state.reads > 0, 'an explicit import reads the store');
    assert.deepEqual(fetchGuard.urls, [], 'the import itself makes no network call');
    const status = await component.call('status');
    const account = status.value.providers.claude.accounts[0];
    assert.equal(account.account, 'imported@example.test'); assert.equal(account.plan, 'max');
    noSecrets(status, 'status'); noSecrets(login, 'login');
    const missing = await component.call('login', { provider: 'claude', method: 'keychain' }); // still importable
    assert.equal(missing.ok, true);
    // Once an account exists, status presents the Claude CLI version (reference behaviour): the npm registry lookup is
    // the only network use here, it fails closed in this test, and nothing else is contacted.
    assert.ok(fetchGuard.urls.every(url => url.startsWith('https://registry.npmjs.org/@anthropic-ai%2fclaude-code')), fetchGuard.urls.join(','));
    const models = await component.adapters.claude.listModels('claude');
    assert.deepEqual(models.map(model => model.id), ['claude-fixture']);
    assert.equal((await component.call('logout', { provider: 'claude', account: account.key })).ok, true);
    assert.deepEqual((await component.call('status')).value.providers.claude.accounts, []);
    assert.equal(state.writes.length, 0, 'login and logout never write to Claude Code store');
  } finally { component.dispose(); fetchGuard.restore(); }
});

test('an import failure reports a safe message without leaking credentials', async () => {
  await home('rpc-nocreds');
  const { io } = fakeIo({});
  const component = host({ io });
  try {
    const result = await component.call('login', { provider: 'claude', method: 'keychain' });
    assert.equal(result.ok, false);
    assert.match(result.error.message, /no Claude Code credentials found/);
    noSecrets(result, 'error');
  } finally { component.dispose(); }
});

test('RPC payloads are validated: provider, method and cache lifetime enums, Codex-only endpoints and method scoping', async () => {
  await home('validation');
  const { io, state } = fakeIo({ keychain: blob() });
  const component = host({ io });
  try {
    const rejected = async (endpoint, payload, pattern) => {
      const result = await component.call(endpoint, payload);
      assert.equal(result.ok, false, `${endpoint} ${JSON.stringify(payload)}`);
      assert.match(result.error.message, pattern);
    };
    await rejected('login', { provider: 'claude', method: 'password' }, /payload\.method must be "oauth" or "keychain"/);
    await rejected('login', { provider: 'claude', method: 7 }, /payload\.method/);
    await rejected('login', { provider: 'codex', method: 'oauth' }, /payload\.method is only valid for claude/);
    await rejected('login', { provider: 'grok' }, /payload\.provider must be one of codex, claude/);
    await rejected('login', { provider: ['claude'] }, /payload\.provider/);
    for (const endpoint of ['speed', 'setSpeed', 'prepareReset', 'consumeReset']) await rejected(endpoint, { provider: 'claude', account: 'a', ticket: 't', tier: 'fast' }, /Only Codex is available/);
    await rejected('setProviderSettings', { provider: 'claude', settings: { promptCacheTtl: '24h' }, original: {} }, /promptCacheTtl must be one of 5m, 1h/);
    await rejected('setProviderSettings', { provider: 'claude', settings: { contextWindows: { 'claude-fixture': 100 } }, original: {} }, /context window overrides are currently supported only for Codex/);
    await rejected('setProviderSettings', { provider: 'codex', settings: { promptCacheTtl: '1h' }, original: {} }, /promptCacheTtl is currently supported only for Claude/);
    assert.equal(state.reads, 0, 'no rejected request reached the credential store');
  } finally { component.dispose(); }
});

test('the prompt cache lifetime persists, follows config when cleared, and reaches the provider settings the Manage dialog reads', async () => {
  const dir = await home('ttl');
  const component = host({ io: fakeIo({}).io, config: { claudePromptCacheTtl: '1h' } });
  try {
    const initial = await component.call('providerSettings', { provider: 'claude' });
    assert.equal(initial.ok, true);
    assert.equal(initial.value.provider, 'claude');
    assert.equal(initial.value.promptCacheTtlDefault, '1h', 'the dialog shows what follow-config resolves to');
    assert.equal(initial.value.settings.promptCacheTtl, undefined);
    assert.deepEqual(initial.value.tools, []);
    assert.equal((await component.call('setProviderSettings', { provider: 'claude', settings: { promptCacheTtl: '5m' }, original: {} })).ok, true);
    assert.equal((await component.call('providerSettings', { provider: 'claude' })).value.settings.promptCacheTtl, '5m');
    const file = JSON.parse(await readFile(join(dir, 'plugins/majed/subscriptions/provider-settings.json'), 'utf8').catch(() => '{}'));
    assert.ok(JSON.stringify(file).includes('"promptCacheTtl": "5m"') || JSON.stringify(file).includes('"promptCacheTtl":"5m"'), 'persisted in the owned settings file');
    assert.equal((await component.call('setProviderSettings', { provider: 'claude', settings: {}, original: { promptCacheTtl: '5m' } })).ok, true);
    assert.equal((await component.call('providerSettings', { provider: 'claude' })).value.settings.promptCacheTtl, undefined, 'omitting the field restores follow-config');
  } finally { component.dispose(); }
});

test('browser OAuth through the RPC: state is verified, the token exchange is fake, status never shows tokens, and the model chats', async () => {
  await home('oauth-chat');
  const originalFetch = globalThis.fetch;
  const requests = [];
  const sse = events => new Response(events.map(event => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join(''), { headers: { 'content-type': 'text/event-stream' } });
  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), init });
    if (String(url) === CLAUDE_TOKEN_URL) return Response.json({ access_token: 'fake-claude-access', refresh_token: 'fake-claude-refresh', expires_in: 3600, account: { email_address: 'oauth@example.test' } });
    if (String(url).startsWith('https://api.anthropic.com/api/oauth/profile')) return Response.json({ account: { email: 'oauth@example.test' }, organization: { organization_type: 'claude_pro' } });
    if (String(url).startsWith('https://api.anthropic.com/v1/messages')) return sse([
      { type: 'message_start', message: { usage: { input_tokens: 3 } } },
      { type: 'content_block_start', index: 0, content_block: { type: 'text' } },
      { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Fixture Claude reply' } },
      { type: 'content_block_stop', index: 0 },
      { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 4 } },
      { type: 'message_stop' }]);
    throw new Error(`unexpected fixture request: ${url}`);
  };
  const component = host({ io: fakeIo({}).io });
  try {
    const login = await component.call('login', { provider: 'claude', method: 'oauth' });
    assert.equal(login.ok, true);
    const url = new URL(login.value.authorizeUrl);
    const callback = new URL(url.searchParams.get('redirect_uri'));
    callback.searchParams.set('code', 'fake-code'); callback.searchParams.set('state', 'forged-state-value');
    const forged = await component.call('manual', { provider: 'claude', input: callback.href });
    await settle();
    assert.equal(requests.filter(request => request.url === CLAUDE_TOKEN_URL).length, 0, 'a forged state never reaches the token endpoint');
    callback.searchParams.set('state', url.searchParams.get('state'));
    assert.equal((await component.call('manual', { provider: 'claude', input: callback.href })).ok, true);
    let status;
    for (let tries = 0; tries < 200; tries++) { status = (await component.call('status')).value.providers.claude; if (!status.busy) break; await settle(); }
    assert.equal(status.busy, false);
    assert.equal(status.accounts.length, 1);
    assert.equal(status.accounts[0].keychainBound, undefined);
    noSecrets(await component.call('status'), 'status after login'); noSecrets(forged, 'forged-state error');
    const exchange = requests.find(request => request.url === CLAUDE_TOKEN_URL);
    assert.equal(JSON.parse(exchange.init.body).code_verifier.length >= 43, true, 'PKCE verifier sent');
    assert.equal((await stat(join(process.env.DSH_HOME, 'plugins/majed/subscriptions/auth.json'))).mode & 0o777, 0o600);
    const models = await component.adapters.claude.listModels('claude');
    assert.deepEqual(models.map(model => model.id), ['claude-fixture']);
    const chunks = [];
    for await (const chunk of component.adapters.claude.stream({ provider: 'claude', model: 'claude-fixture', messages: [{ role: 'user', content: [{ type: 'text', text: 'Fixture request' }] }], signal: new AbortController().signal })) chunks.push(chunk);
    assert.ok(JSON.stringify(chunks).includes('Fixture Claude reply'));
    const chat = requests.find(request => request.url.startsWith('https://api.anthropic.com/v1/messages'));
    assert.equal(chat.init.headers.authorization ?? chat.init.headers.Authorization, 'Bearer fake-claude-access', 'the bearer goes on the wire only');
  } finally { component.dispose(); globalThis.fetch = originalFetch; }
});

test('a provider id collision leaves Claude unavailable with a safe status while Codex and the routes keep working', async () => {
  await home('collision');
  const component = host({ io: fakeIo({ keychain: blob() }).io, collideClaude: true });
  try {
    const status = await component.call('status');
    assert.equal(status.ok, true);
    assert.equal(status.value.claudeRegistrationError, 'Claude registration is unavailable');
    assert.deepEqual(status.value.providers.codex.accounts, []);
    const login = await component.call('login', { provider: 'claude' });
    assert.equal(login.ok, false);
    assert.match(login.error.message, /Claude is already registered\. Disable the reference component first\./);
    assert.equal((await component.call('login', { provider: 'codex' })).ok, true, 'Codex login is unaffected');
    await component.call('cancel', { provider: 'codex' });
  } finally { component.dispose(); }
});

test('the background sync is one bounded timer: it reads only bound accounts, stops on dispose and never keeps the process alive', async () => {
  await home('sync');
  mock.timers.enable({ apis: ['setInterval'] });
  const { io, state } = fakeIo({ keychain: blob() });
  const component = host({ io });
  try {
    assert.equal(CLAUDE_KEYCHAIN_SYNC_MS, 5 * 60_000);
    const store = await import('../dist/auth/store.js');
    const expired = Date.now() - 1000;
    await store.saveAccountSession('claude', 'bound', { accessToken: 'fake-claude-access', refreshToken: 'fake-claude-refresh', expiresAt: expired, scopes: 's', emailAddress: 'imported@example.test', keychainBound: true });
    await store.saveAccountSession('claude', 'plain', { accessToken: 'fake-claude-access', refreshToken: 'fake-claude-refresh', expiresAt: expired, scopes: 's' });
    const fetchGuard = forbidFetch();
    try {
      mock.timers.tick(CLAUDE_KEYCHAIN_SYNC_MS);
      // The account store is read from disk, so wait on real I/O (setTimeout is not mocked) instead of counting turns.
      for (let i = 0; i < 100 && state.reads === 0; i++) await new Promise(resolve => setTimeout(resolve, 10));
      assert.ok(state.reads > 0, 'the bound account consults Claude Code store');
      assert.deepEqual(fetchGuard.urls, [], 'a fresher token in the store avoids any refresh call');
      await new Promise(resolve => setTimeout(resolve, 100));
      const reads = state.reads;
      component.dispose();
      mock.timers.tick(CLAUDE_KEYCHAIN_SYNC_MS * 3);
      await new Promise(resolve => setTimeout(resolve, 100));
      assert.equal(state.reads, reads, 'no tick runs after disposal');
    } finally { fetchGuard.restore(); }
  } finally { mock.timers.reset(); component.dispose(); }
});
