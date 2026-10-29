import test from 'node:test';
import { createServer } from 'node:net';
import assert from 'node:assert/strict';
import { mkdtemp, rm, stat, readFile, writeFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCodexAccounts } from '../../modules/subscriptions/codex/accounts.js';

const token = claims => `header.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`;
const idToken = token({ email: 'fixture@example.test', 'https://api.openai.com/auth': { chatgpt_account_id: 'workspace-fixture', chatgpt_user_id: 'user-fixture' } });
async function fixture(t, options = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'majed-codex-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const calls = [];
  const config = { path: join(directory, 'auth.json'), ports: [0], fetch: async (url, init) => {
    calls.push({ url, init });
    return Response.json({ access_token: 'fixture-access', refresh_token: 'fixture-refresh', expires_in: 3600, id_token: idToken });
  }, ...options };
  const service = createCodexAccounts(config);
  t.after(() => service.dispose());
  return { service, config, calls };
}
// A verified duplicate identity is rejected; a replacement login names its account (explicit reconnection).
async function login(service, reconnect) {
  const attempt = await service.begin(reconnect);
  const url = new URL(attempt.authorizeUrl);
  const callback = new URL(url.searchParams.get('redirect_uri'));
  callback.searchParams.set('code', 'fixture-code');
  callback.searchParams.set('state', url.searchParams.get('state'));
  await service.complete(callback.href);
  return attempt;
}

test('Codex account survives restart and refreshes using actual authorization grants without leaking secrets', async t => {
  const { service, config, calls } = await fixture(t);
  await login(service);
  const view = await service.snapshot();
  assert.equal(view.state, 'connected');
  assert.equal(view.accounts[0].label, 'f•••@example.test');
  assert.equal(JSON.stringify(view).includes('fixture-access'), false);
  assert.equal((await stat(config.path)).mode & 0o777, 0o600);
  assert.equal(new URLSearchParams(calls[0].init.body).get('grant_type'), 'authorization_code');
  assert.match(new URLSearchParams(calls[0].init.body).get('code_verifier'), /^[A-Za-z0-9_-]{43}$/);
  await service.dispose();
  const restarted = createCodexAccounts(config); t.after(() => restarted.dispose());
  assert.equal((await restarted.snapshot()).accounts.length, 1);
  await restarted.refresh(view.accounts[0].id);
  assert.equal(JSON.parse(calls[1].init.body).grant_type, 'refresh_token');
});

test('wrong state, expired callbacks, cancellation and replay never replace a retained account', async t => {
  const { service, config, calls } = await fixture(t, { timeoutMs: 30 });
  await login(service); const before = await readFile(config.path, 'utf8');
  const pending = await service.begin(); const url = new URL(pending.authorizeUrl);
  const callback = new URL(url.searchParams.get('redirect_uri'));
  callback.searchParams.set('code', 'second'); callback.searchParams.set('state', 'forged');
  await assert.rejects(service.complete(callback.href), /invalid_callback/);
  await assert.rejects(service.complete('bare-code'), /invalid_callback/);
  await service.cancel();
  callback.searchParams.set('state', url.searchParams.get('state'));
  await assert.rejects(service.complete(callback.href), /login_not_pending/);
  assert.equal(await readFile(config.path, 'utf8'), before);
  await service.begin(); await new Promise(resolve => setTimeout(resolve, 50));
  assert.equal((await service.snapshot()).loginState, 'failed');
  assert.equal(calls.length, 1);
});

test('a stale refresh cannot overwrite or revoke a newer login and concurrent refreshes coalesce', async t => {
  let release, refreshing = false, refreshCalls = 0;
  const { service } = await fixture(t, { fetch: async (url, init) => {
    if (init.headers['content-type'] === 'application/json') {
      refreshCalls++; refreshing = true;
      return new Promise(resolve => { release = () => resolve(Response.json({ error: 'invalid_grant' }, { status: 400 })); });
    }
    return Response.json({ access_token: 'new-login-access', refresh_token: 'new-login-refresh', expires_in: 3600, id_token: idToken });
  } });
  await login(service); const id = (await service.snapshot()).accounts[0].id;
  const first = service.refresh(id), second = service.refresh(id);
  const settled = Promise.allSettled([first, second]);
  while (!refreshing) await new Promise(resolve => setImmediate(resolve));
  await login(service, id); release(); await settled;
  assert.equal(refreshCalls, 1);
  assert.equal((await service.snapshot()).accounts[0].state, 'connected');
});

test('corruption is reported without overwriting the durable store', async t => {
  const { service, config } = await fixture(t);
  await login(service); await writeFile(config.path, '{broken');
  await assert.rejects(service.snapshot(), /corrupt_account_store/);
  assert.equal(await readFile(config.path, 'utf8'), '{broken');
});

test('cancelling while a durable write is pending preserves the previous valid account file', async t => {
  let large = false;
  const { service, config } = await fixture(t, { fetch: async () => Response.json({
    access_token: large ? 'x'.repeat(16 * 1024 * 1024) : 'fixture-access', refresh_token: 'fixture-refresh', expires_in: 3600, id_token: idToken,
  }) });
  await login(service); const before = await readFile(config.path, 'utf8'); large = true;
  const id = (await service.snapshot()).accounts[0].id;
  let cancelled = false, done = false;
  const writing = login(service, id).finally(() => { done = true; });
  while (!done) {
    if ((await readdir(join(config.path, '..'))).some(name => name.endsWith('.tmp'))) { cancelled = true; await service.cancel(); break; }
    await new Promise(resolve => setImmediate(resolve));
  }
  await writing;
  assert.ok(cancelled, 'cancellation occurs while the new temporary write exists');
  assert.equal(await readFile(config.path, 'utf8'), before);
  assert.equal((await service.snapshot()).loginState, 'cancelled');
});

test('browser redirect validates state before exchanging a code and reports token exchange separately', async t => {
  const { service, calls } = await fixture(t);
  const attempt = await service.begin(), authorize = new URL(attempt.authorizeUrl);
  const callback = new URL(authorize.searchParams.get('redirect_uri')); callback.hostname = '127.0.0.1';
  callback.searchParams.set('state', 'wrong'); callback.searchParams.set('error', 'forged-provider-error');
  assert.equal((await fetch(callback)).status, 400); assert.equal(calls.length, 0);
  callback.searchParams.delete('error'); callback.searchParams.set('code', 'fixture-code'); callback.searchParams.set('state', authorize.searchParams.get('state'));
  const response = await fetch(callback); assert.match(await response.text(), /Authorization received/);
  for (let i = 0; i < 50 && (await service.snapshot()).state === 'pending'; i++) await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal((await service.snapshot()).state, 'connected'); assert.equal(calls.length, 1);
});

test('provider errors never create fabricated credentials and permanent refresh failures retain a reauthentication state', async t => {
  let failGrant = false;
  const { service, config } = await fixture(t, { fetch: async () => failGrant
    ? Response.json({ error: 'invalid_grant', error_description: 'secret-provider-detail' }, { status: 400 })
    : Response.json({ access_token: 'fixture-access', refresh_token: 'fixture-refresh', expires_in: 3600, id_token: idToken }) });
  await login(service); const id = (await service.snapshot()).accounts[0].id;
  failGrant = true; await assert.rejects(service.refresh(id), /reauthentication_required/);
  assert.equal((await service.snapshot()).accounts[0].state, 'reauthentication_required');
  const before = await readFile(config.path, 'utf8'); await login(service);
  assert.equal((await service.snapshot()).loginState, 'failed');
  assert.equal(await readFile(config.path, 'utf8'), before);
});

test('disposing a pending login stays bounded when a provider transport ignores cancellation', async t => {
  let started;
  const received = new Promise(resolve => { started = resolve; });
  const { service, config } = await fixture(t, { fetch: () => { started(); return new Promise(() => {}); } });
  const signingIn = login(service);
  const result = Promise.allSettled([signingIn]);
  await received; await service.dispose(); await result;
  await assert.rejects(readFile(config.path), { code: 'ENOENT' });
});


test('cancelling during callback listener startup closes that attempt and preserves the prior account', async t => {
  const reservation = createServer();
  await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const { service, config, calls } = await fixture(t, { ports: [port] });
  await login(service);
  const before = await readFile(config.path, 'utf8');
  const opening = service.begin();
  const cancelling = service.cancel();
  await Promise.all([opening, cancelling]);
  assert.equal((await service.snapshot()).loginState, 'cancelled');
  await assert.rejects(fetch(`http://127.0.0.1:${port}/auth/callback?code=late&state=late`));
  await assert.rejects(service.complete(`http://localhost:${port}/auth/callback?code=late&state=late`), /login_not_pending/);
  assert.equal(calls.length, 1, 'A cancelled startup never exchanges a code');
  assert.equal(await readFile(config.path, 'utf8'), before);
  await login(service, (await service.snapshot()).accounts[0].id);
  assert.equal((await service.snapshot()).loginState, 'connected', 'A new login is allowed after cancelled startup');
});
