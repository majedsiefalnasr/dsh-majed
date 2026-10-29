// R01 controlled lifecycle: native Fetch route -> account service -> private store -> Codex consumer.
// Controlled fixtures only: injected transport, temp directories, loopback ephemeral callback ports.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Context } from '@deepseek-ai/cordis';
import * as llmModule from '@deepseek-ai/dsh-llm';
import { applyCodexAccounts } from '../../modules/subscriptions/codex/native.js';

const jwt = data => 'header.' + Buffer.from(JSON.stringify(data)).toString('base64url') + '.signature';
const identity = (email, workspace, user) => jwt({ email, 'https://api.openai.com/auth': { chatgpt_account_id: workspace, chatgpt_user_id: user } });
const frame = data => `data: ${JSON.stringify(data)}\n\n`;

async function native(t, { id = identity('fixture@example.test', 'workspace-one', 'user-one'), grants, responses } = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-r01-')); t.after(() => rm(directory, { recursive: true, force: true }));
  const root = new Context(), routes = new Map(), calls = []; let adapter, idToken = id;
  root.provide('connection', { fetch: { register(route) { routes.set(route.path, route); } } });
  root.provide('llm', { prepareCall() {}, registerAdapter(providers, value) { adapter = value; return Object.assign(() => {}, { replace() {} }); } });
  class PreparedAdapter extends llmModule.LlmAdapter { prepareCall() {} }
  root.provide('loader', { async import() { return { ...llmModule, LlmAdapter: PreparedAdapter }; } });
  const fetch = async (url, options) => {
    calls.push({ url, options });
    if (url === 'https://auth.openai.com/oauth/token') { grants?.(options); return Response.json({ access_token: 'fixture-access', refresh_token: 'fixture-refresh', expires_in: 3600, id_token: idToken }); }
    if (url.startsWith('https://chatgpt.com/backend-api/codex/models')) return Response.json({ models: [{ slug: 'fixture-codex', display_name: 'Fixture Codex' }] });
    if (responses) return responses(options);
    return new Response(frame({ type: 'response.output_text.delta', item_id: 'm', content_index: 0, delta: 'Fixture response' })
      + frame({ type: 'response.completed', response: { usage: { input_tokens: 1, output_tokens: 1 }, output: [] } }), { headers: { 'content-type': 'text/event-stream' } });
  };
  const path = join(directory, 'auth.json');
  const fiber = root.plugin(applyCodexAccounts, { path, ports: [0], fetch }); await fiber; t.after(() => root.fiber.dispose());
  const route = routes.get('/api/majed/subscriptions/codex');
  const call = async payload => (await (await route.fetch(new Request('http://fixture' + route.path, { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'client-request', rpcId: 'fixture', method: 'majed/subscriptions/codex', payload }) }))).json()).result;
  const login = async (reconnect) => {
    const begun = await call({ action: 'begin', ...(reconnect ? { account: reconnect } : {}) });
    const authorize = new URL(begun.value.authorizeUrl), callback = new URL(authorize.searchParams.get('redirect_uri'));
    callback.searchParams.set('state', authorize.searchParams.get('state')); callback.searchParams.set('code', 'fixture-code');
    return call({ action: 'complete', callback: callback.href });
  };
  await call({ action: 'enable', enabled: true }); assert.equal((await call({ action: 'runtime', enabled: true })).ok, true);
  return { call, login, path, calls, adapter: () => adapter, setIdentity: value => { idToken = value; } };
}
const run = async (prepared, model = 'fixture-codex') => { const out = []; for await (const chunk of prepared.stream({ provider: 'codex', model, messages: [] })) out.push(chunk); return out; };

test('pause blocks new and prepared requests but retains the login, settings and private credentials; resume restores', async t => {
  const { call, login, path, calls, adapter } = await native(t);
  const connected = (await login()).value.accounts[0];
  const prepared = await adapter().prepareCall('codex', 'fixture-codex');
  const paused = await call({ action: 'pause', account: connected.id });
  assert.equal(paused.ok, true, JSON.stringify(paused));
  assert.equal(paused.value.accounts[0].state, 'paused');
  assert.equal(paused.value.accounts[0].id, connected.id);
  assert.equal(JSON.stringify(paused).includes('fixture-access'), false);
  await assert.rejects(adapter().prepareCall('codex', 'fixture-codex'), { code: 'NO_ADAPTER' });
  await assert.rejects(run(prepared), { code: 'NO_ADAPTER' });
  assert.equal(calls.filter(c => c.url.endsWith('/responses')).length, 0);
  assert.equal(JSON.parse(await readFile(path, 'utf8')).accounts[0].session.refreshToken, 'fixture-refresh');
  assert.equal((await stat(path)).mode & 0o777, 0o600);
  const resumed = await call({ action: 'resume', account: connected.id });
  assert.equal(resumed.value.accounts[0].state, 'connected');
  assert.equal((await run(await adapter().prepareCall('codex', 'fixture-codex'))).some(c => c.type === 'text-delta'), true);
});

test('sign-out deletes local credentials, retains the card and settings, fences consumers and makes no provider revocation call', async t => {
  const { call, login, path, calls, adapter } = await native(t);
  const connected = (await login()).value.accounts[0];
  await call({ action: 'configure', settings: { account: connected.id, alias: 'Work', independentEntry: true } });
  const prepared = await adapter().prepareCall('codex', 'fixture-codex');
  const tokenCalls = calls.filter(c => c.url.includes('/oauth/')).length;
  const out = await call({ action: 'signOut', account: connected.id });
  assert.equal(out.ok, true, JSON.stringify(out));
  assert.equal(out.value.accounts.length, 1);
  assert.equal(out.value.accounts[0].id, connected.id);
  assert.equal(out.value.accounts[0].state, 'signed_out');
  assert.equal(out.value.accounts[0].default, true);
  assert.equal(out.value.runtime.preferences.accounts[connected.id].alias, 'Work');
  const stored = await readFile(path, 'utf8');
  assert.doesNotMatch(stored, /fixture-access|fixture-refresh/);
  assert.equal(JSON.parse(stored).accounts[0].state, 'signed_out');
  assert.equal((await stat(path)).mode & 0o777, 0o600);
  assert.equal(calls.filter(c => c.url.includes('/oauth/')).length, tokenCalls, 'local sign-out must not call the provider (no revocation claim)');
  await assert.rejects(run(prepared), { code: 'NO_ADAPTER' });
  await assert.rejects(adapter().prepareCall('codex', 'fixture-codex'), { code: 'NO_ADAPTER' });
  assert.equal((await call({ action: 'refresh', account: connected.id })).ok, false);
  assert.equal(calls.filter(c => c.url.endsWith('/responses')).length, 0);
});

test('a verified duplicate identity is rejected without replacing the retained account; only explicit reconnection restores it', async t => {
  const { call, login, path, setIdentity } = await native(t);
  const first = (await login()).value.accounts[0];
  await call({ action: 'configure', settings: { account: first.id, alias: 'Work' } });
  const before = await readFile(path, 'utf8');
  const duplicate = await login();
  assert.equal(duplicate.ok, false); assert.equal(duplicate.error.code, 'duplicate_account');
  assert.equal(await readFile(path, 'utf8'), before, 'duplicate login must not rewrite the store');
  assert.equal((await call({ action: 'status' })).value.accounts.length, 1);
  // Explicit reconnection after sign-out restores the same card (id, default, settings) with new credentials.
  await call({ action: 'signOut', account: first.id });
  const mismatched = (setIdentity(identity('other@example.test', 'workspace-two', 'user-two')), await login(first.id));
  assert.equal(mismatched.ok, false); assert.equal(mismatched.error.code, 'identity_mismatch');
  assert.equal((await call({ action: 'status' })).value.accounts[0].state, 'signed_out');
  setIdentity(identity('fixture@example.test', 'workspace-one', 'user-one'));
  const reconnected = await login(first.id);
  assert.equal(reconnected.ok, true, JSON.stringify(reconnected));
  assert.deepEqual(reconnected.value.accounts.map(a => [a.id, a.state, a.default]), [[first.id, 'connected', true]]);
  assert.equal(reconnected.value.runtime.preferences.accounts[first.id].alias, 'Work');
  assert.equal((await call({ action: 'begin', account: 'f'.repeat(64) })).error.code, 'account_not_found');
});

test('identity is masked by default in every native response and in the independent picker entry unless the Owner sets an alias', async t => {
  const { call, login, adapter } = await native(t);
  const account = (await login()).value.accounts[0];
  assert.equal(account.label, 'f•••@example.test');
  const configured = await call({ action: 'configure', settings: { account: account.id, independentEntry: true } });
  assert.doesNotMatch(JSON.stringify(configured), /fixture@example\.test/);
  const pinned = (await adapter().listModels('codex')).find(model => model.id.startsWith('~account:'));
  assert.doesNotMatch(pinned.name, /fixture@/); assert.match(pinned.name, /^f•••@example\.test · /);
  assert.doesNotMatch(JSON.stringify(await call({ action: 'status' })), /fixture@example\.test/);
});

for (const language of ['en', 'ar']) test(`native Settings drives pause, resume, sign-out, reconnection and confirmed removal through the route (${language})`, async t => {
  const { readFile: read } = await import('node:fs/promises');
  const { createBaselineHarness } = await import('./helpers/baseline-client-harness.js');
  const source = await read(new URL('../../dist/client.js', import.meta.url), 'utf8');
  const id = 'a'.repeat(64), calls = []; let state = 'connected';
  const value = () => ({ enabled: true, state: state === 'connected' ? 'connected' : 'reauthentication_required', loginState: 'disconnected', runtimeAvailable: false, runtimeEnabled: false,
    accounts: [{ id, label: 'f•••@example.test', state, default: true }] });
  const harness = createBaselineHarness(source, { language, connection: { rpc: { async call(channel, method, payload) {
    calls.push(payload);
    if (method === 'majed/settings/status') return { ok: true, value: { module: payload.module, enabled: true, state: 'ready' } };
    if (payload.action === 'pause') state = 'paused'; if (payload.action === 'resume') state = 'connected'; if (payload.action === 'signOut') state = 'signed_out';
    if (payload.action === 'remove') return { ok: true, value: { enabled: true, state: 'disconnected', accounts: [], runtimeAvailable: false, runtimeEnabled: false } };
    if (payload.action === 'begin') return { ok: true, value: { enabled: true, state: 'pending', authorizeUrl: 'https://auth.openai.com/oauth/authorize?state=fixture', accounts: value().accounts } };
    return { ok: true, value: value() };
  } } } });
  t.after(() => harness.dispose()); harness.apply(); const view = harness.render('majed-subscriptions');
  const settle = async () => { for (let i = 0; i < 20; i++) await new Promise(resolve => setImmediate(resolve)); view.render(); };
  const action = name => view.one(n => n.props['data-codex-action'] === name);
  const has = name => view.nodes(n => n.props?.['data-codex-action'] === name).length > 0;
  await settle();
  assert.deepEqual(['pause', 'signOut', 'remove'].map(has), [true, true, true]); assert.equal(has('resume'), false);
  await action('pause').props.onClick(); await settle();
  assert.deepEqual(JSON.parse(JSON.stringify(calls.at(-1))), { action: 'pause', account: id }); assert.equal(has('resume'), true); assert.equal(has('pause'), false);
  await action('resume').props.onClick(); await settle();
  await action('signOut').props.onClick(); await settle();
  assert.deepEqual(JSON.parse(JSON.stringify(calls.at(-1))), { action: 'signOut', account: id });
  assert.equal(has('reconnect'), true); assert.equal(has('pause'), false);
  await action('reconnect').props.onClick(); await settle();
  assert.deepEqual(JSON.parse(JSON.stringify(calls.at(-1))), { action: 'begin', account: id });
  // Removal needs a second, explicit confirmation; keeping the account sends nothing.
  const count = calls.length;
  await action('remove').props.onClick(); await settle();
  assert.equal(calls.length, count, 'first click must not remove'); assert.equal(has('confirmRemove'), true);
  await action('keep').props.onClick(); await settle(); assert.equal(has('confirmRemove'), false); assert.equal(calls.length, count);
  await action('remove').props.onClick(); await settle(); await action('confirmRemove').props.onClick(); await settle();
  assert.deepEqual(JSON.parse(JSON.stringify(calls.at(-1))), { action: 'remove', account: id });
});

for (const revoke of ['pause', 'signOut', 'remove']) test(`${revoke} cooperatively cancels an already streaming request and closes its provider body`, async t => {
  let closed = false, push;
  const body = new ReadableStream({ start(controller) { push = text => controller.enqueue(new TextEncoder().encode(text)); }, cancel() { closed = true; } });
  const { call, login, adapter } = await native(t, { responses: () => new Response(body, { headers: { 'content-type': 'text/event-stream' } }) });
  const account = (await login()).value.accounts[0].id;
  const prepared = await adapter().prepareCall('codex', 'fixture-codex');
  const iterator = prepared.stream({ provider: 'codex', model: 'fixture-codex', messages: [] })[Symbol.asyncIterator]();
  push(frame({ type: 'response.output_text.delta', item_id: 'm', content_index: 0, delta: 'partial' }));
  let first; do first = (await iterator.next()).value; while (first.type !== 'text-delta');
  assert.equal((await call({ action: revoke, account })).ok, true);
  await assert.rejects(iterator.next(), { code: 'NO_ADAPTER' });
  assert.equal(closed, true);
});
