// R01 controlled lifecycle: native Fetch route -> account service -> private store -> Codex consumer.
// Controlled fixtures only: injected transport, temp directories, loopback ephemeral callback ports.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, stat } from 'node:fs/promises';
import { createPrivateStore } from '../../modules/subscriptions/codex/storage.js';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Context } from '@deepseek-ai/cordis';
import * as llmModule from '@deepseek-ai/dsh-llm';
import { applyCodexAccounts } from '../../modules/subscriptions/codex/native.js';

const jwt = data => 'header.' + Buffer.from(JSON.stringify(data)).toString('base64url') + '.signature';
const identity = (email, workspace, user) => jwt({ email, 'https://api.openai.com/auth': { chatgpt_account_id: workspace, chatgpt_user_id: user } });
const frame = data => `data: ${JSON.stringify(data)}\n\n`;

async function native(t, { id = identity('fixture@example.test', 'workspace-one', 'user-one'), grants, responses, directory: reuse } = {}) {
  // `directory` reopens a fresh route/service/runtime over an existing temp store (restart fixture).
  const directory = reuse || await mkdtemp(join(tmpdir(), 'dsh-r01-')); if (!reuse) t.after(() => rm(directory, { recursive: true, force: true }));
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
  return { call, login, path, calls, directory, adapter: () => adapter, setIdentity: value => { idToken = value; }, stop: () => root.fiber.dispose() };
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
  assert.equal(out.value.accounts[0].default, false, 'a signed-out account is not reported as the selectable default');
  assert.equal(JSON.parse(await readFile(path, 'utf8')).default, connected.id, 'the stored pointer is retained so reconnection restores it');
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

const second = () => identity('second@example.test', 'workspace-two', 'user-two');
const stored = async path => JSON.parse(await readFile(path, 'utf8'));

test('pause and resume only act on states they can honor and never write a record the store rejects', async t => {
  const { call, login, path, setIdentity } = await native(t);
  const first = (await login()).value.accounts[0];
  setIdentity(second()); const other = (await login()).value.accounts.find(a => a.id !== first.id);
  await call({ action: 'signOut', account: first.id });
  const before = await readFile(path, 'utf8');
  for (const action of ['pause', 'resume']) {
    const refused = await call({ action, account: first.id });
    assert.equal(refused.ok, false); assert.equal(refused.error.code, 'invalid_state');
    assert.equal(await readFile(path, 'utf8'), before, `${action} on a signed-out account must leave the store untouched`);
  }
  // The store is still loadable and the other account still works through the same route.
  const status = await call({ action: 'status' });
  assert.equal(status.ok, true, JSON.stringify(status));
  assert.deepEqual(status.value.accounts.map(a => [a.id === first.id, a.state]).sort(), [[false, 'connected'], [true, 'signed_out']]);
  assert.equal((await call({ action: 'resume', account: other.id })).error.code, 'invalid_state', 'resume needs a paused account');
  assert.equal((await call({ action: 'pause', account: other.id })).ok, true);
  assert.equal((await call({ action: 'pause', account: other.id })).error.code, 'invalid_state', 'pause needs a connected account');
  assert.equal((await call({ action: 'resume', account: other.id })).ok, true);
});

test('the private store refuses to persist a record it would later reject as corrupt', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-r01-store-')); t.after(() => rm(directory, { recursive: true, force: true }));
  const path = join(directory, 'auth.json'), store = createPrivateStore(path);
  const id = 'b'.repeat(64);
  await store.transaction(data => { data.accounts.push({ id, revision: 'r', state: 'connected', session: { accessToken: 'a', refreshToken: 'r', accountId: 'w', label: 'l@x', expiresAt: 1 } }); data.default = id; });
  const before = await readFile(path, 'utf8');
  await assert.rejects(store.transaction(data => { data.accounts[0].state = 'paused'; delete data.accounts[0].session.refreshToken; }), { code: 'invalid_state' });
  assert.equal(await readFile(path, 'utf8'), before);
  await assert.rejects(store.transaction(data => { data.default = 'c'.repeat(64); }), { code: 'invalid_state' });
  assert.equal(await readFile(path, 'utf8'), before);
  assert.equal((await store.load()).accounts.length, 1);
});

test('confirmed removal deletes the account settings, catalog and default, and a re-added identity starts clean', async t => {
  const { call, login, path, adapter } = await native(t);
  const account = (await login()).value.accounts[0];
  await call({ action: 'configure', settings: { account: account.id, alias: 'Work', independentEntry: true } });
  const catalogPath = path + '.catalog', seeded = await stored(catalogPath);
  assert.equal(seeded.preferences.accounts[account.id].alias, 'Work'); assert.ok(seeded.catalogs[account.id], 'catalog seeded');
  assert.ok((await adapter().listModels('codex')).some(m => m.id.startsWith('~account:')));
  assert.equal((await call({ action: 'remove', account: account.id })).ok, true);
  const after = await stored(catalogPath);
  assert.equal(after.preferences.accounts?.[account.id], undefined); assert.equal(after.catalogs[account.id], undefined);
  assert.deepEqual(await stored(path), { version: 1, accounts: [], default: null });
  const again = (await login()).value;
  assert.equal(again.accounts[0].id, account.id);
  assert.equal(again.accounts[0].default, true);
  assert.equal(again.runtime.preferences.accounts?.[account.id], undefined, 'alias/consent must not be resurrected');
  assert.equal((await adapter().listModels('codex')).some(m => m.id.startsWith('~account:')), false);
  await assert.rejects(adapter().prepareCall('codex', `~account:${encodeURIComponent(account.id)}:fixture-codex`), { code: 'NO_ADAPTER' });
});

test('removal with the models runtime switched off still deletes the account settings', async t => {
  const { call, login, path } = await native(t);
  const account = (await login()).value.accounts[0];
  await call({ action: 'configure', settings: { account: account.id, alias: 'Work', independentEntry: true } });
  await call({ action: 'runtime', enabled: false });
  assert.equal((await call({ action: 'remove', account: account.id })).ok, true);
  const after = await stored(path + '.catalog');
  assert.equal(after.preferences.accounts?.[account.id], undefined); assert.equal(after.catalogs[account.id], undefined);
});

test('paused, signed-out and removed accounts keep exactly those states across a fresh route, service and runtime over the same store', async t => {
  const one = await native(t);
  const a = (await one.login()).value.accounts[0];
  one.setIdentity(second()); const b = (await one.login()).value.accounts.find(x => x.id !== a.id);
  const thirdIdentity = identity('third@example.test', 'workspace-three', 'user-three');
  one.setIdentity(thirdIdentity); const c = (await one.login()).value.accounts.find(x => ![a.id, b.id].includes(x.id));
  for (const [id, alias] of [[a.id, 'Alpha'], [b.id, 'Beta'], [c.id, 'Gamma']]) await one.call({ action: 'configure', settings: { account: id, alias, independentEntry: true } });
  await one.call({ action: 'pause', account: a.id }); await one.call({ action: 'signOut', account: b.id }); await one.call({ action: 'remove', account: c.id });
  await one.stop();
  const two = await native(t, { directory: one.directory });
  const status = (await two.call({ action: 'status' })).value;
  assert.deepEqual(status.accounts.map(x => [x.id, x.state, x.default]).sort(), [[a.id, 'paused', false], [b.id, 'signed_out', false]].sort());
  const file = await stored(one.path);
  assert.equal(file.default, a.id, 'the default pointer survives so resume restores it');
  assert.equal(file.accounts.find(x => x.id === a.id).session.refreshToken, 'fixture-refresh');
  assert.doesNotMatch(JSON.stringify(file.accounts.find(x => x.id === b.id)), /fixture-access|fixture-refresh/);
  assert.equal(status.runtime.preferences.accounts[a.id].alias, 'Alpha'); assert.equal(status.runtime.preferences.accounts[b.id].alias, 'Beta');
  assert.equal(status.runtime.preferences.accounts[c.id], undefined);
  assert.deepEqual(status.runtime.models, []);
  await assert.rejects(two.adapter().prepareCall('codex', 'fixture-codex'), { code: 'NO_ADAPTER' });
  const resumed = (await two.call({ action: 'resume', account: a.id })).value;
  assert.deepEqual(resumed.accounts.map(x => [x.id, x.state, x.default]).sort(), [[a.id, 'connected', true], [b.id, 'signed_out', false]].sort());
  assert.equal((await run(await two.adapter().prepareCall('codex', 'fixture-codex'))).some(x => x.type === 'text-delta'), true);
  two.setIdentity(second());
  const back = (await two.login(b.id)).value;
  assert.equal(back.accounts.find(x => x.id === b.id).state, 'connected'); assert.equal(back.runtime.preferences.accounts[b.id].alias, 'Beta');
  two.setIdentity(thirdIdentity);
  const fresh = (await two.login()).value;
  assert.equal(fresh.accounts.find(x => x.id === c.id).state, 'connected'); assert.equal(fresh.runtime.preferences.accounts[c.id], undefined);
});

test('a default that is paused, signed out or removed is never reported or selected as the default', async t => {
  const { call, login, setIdentity, path } = await native(t);
  const a = (await login()).value.accounts[0];
  setIdentity(second()); const b = (await login()).value.accounts.find(x => x.id !== a.id);
  const defaults = async () => Object.fromEntries((await call({ action: 'status' })).value.accounts.map(x => [x.id === a.id ? 'a' : 'b', x.default]));
  assert.deepEqual(await defaults(), { a: true, b: false });
  await call({ action: 'pause', account: a.id });
  assert.deepEqual(await defaults(), { a: false, b: false }, 'a paused default is not selectable');
  assert.equal((await call({ action: 'default', account: a.id })).error.code, 'invalid_state');
  assert.equal((await call({ action: 'default', account: b.id })).ok, true);
  assert.deepEqual(await defaults(), { a: false, b: true });
  await call({ action: 'signOut', account: b.id });
  assert.deepEqual(await defaults(), { a: false, b: false });
  assert.equal((await call({ action: 'default', account: b.id })).error.code, 'invalid_state');
  // Removing the default must not hand the default to a non-connected account.
  await call({ action: 'resume', account: a.id }); await call({ action: 'default', account: a.id });
  await call({ action: 'remove', account: a.id });
  assert.equal((await stored(path)).default, null, 'no non-connected account inherits the default');
});

test('begin validates the reconnect account id and complete reports account_not_found when it was removed mid-login', async t => {
  const { call, login, path } = await native(t);
  for (const account of ['xyz', 'A'.repeat(64), 'f'.repeat(63), 7, null]) assert.equal((await call({ action: 'begin', account })).error.code, 'invalid_request', String(account));
  assert.equal((await call({ action: 'begin', account: 'f'.repeat(64) })).error.code, 'account_not_found');
  const first = (await login()).value.accounts[0];
  await call({ action: 'signOut', account: first.id });
  const begun = await call({ action: 'begin', account: first.id });
  await call({ action: 'remove', account: first.id });
  const authorize = new URL(begun.value.authorizeUrl), callback = new URL(authorize.searchParams.get('redirect_uri'));
  callback.searchParams.set('state', authorize.searchParams.get('state')); callback.searchParams.set('code', 'fixture-code');
  const done = await call({ action: 'complete', callback: callback.href });
  assert.equal(done.ok, false); assert.equal(done.error.code, 'account_not_found');
  assert.deepEqual(await stored(path), { version: 1, accounts: [], default: null });
});

test('refresh of a paused account is refused with account_paused and makes no provider call', async t => {
  const { call, login, calls } = await native(t);
  const account = (await login()).value.accounts[0];
  await call({ action: 'pause', account: account.id });
  const grants = calls.filter(c => c.url.includes('/oauth/')).length;
  const refused = await call({ action: 'refresh', account: account.id });
  assert.equal(refused.ok, false); assert.equal(refused.error.code, 'account_paused');
  assert.equal(calls.filter(c => c.url.includes('/oauth/')).length, grants);
});

test('a loopback automatic callback that hits a duplicate or mismatched identity surfaces the distinct code in the snapshot', async t => {
  const { call, login, setIdentity } = await native(t);
  const first = (await login()).value.accounts[0];
  const automatic = async account => {
    const begun = await call({ action: 'begin', ...(account ? { account } : {}) });
    const authorize = new URL(begun.value.authorizeUrl), callback = new URL(authorize.searchParams.get('redirect_uri')); callback.hostname = '127.0.0.1';
    callback.searchParams.set('state', authorize.searchParams.get('state')); callback.searchParams.set('code', 'fixture-code');
    await fetch(callback);
    for (let i = 0; i < 100; i++) { const status = (await call({ action: 'status' })).value; if (status.loginState !== 'pending') return status; await new Promise(resolve => setTimeout(resolve, 5)); }
  };
  const duplicate = await automatic();
  assert.equal(duplicate.loginState, 'failed'); assert.equal(duplicate.loginFailure, 'duplicate_account');
  await call({ action: 'signOut', account: first.id });
  setIdentity(second());
  const mismatch = await automatic(first.id);
  assert.equal(mismatch.loginState, 'failed'); assert.equal(mismatch.loginFailure, 'identity_mismatch');
  setIdentity(identity('fixture@example.test', 'workspace-one', 'user-one'));
  const ok = await automatic(first.id);
  assert.equal(ok.loginState, 'connected'); assert.equal('loginFailure' in ok, false);
});

for (const [language, note] of [['en', 'Sign out only deletes credentials stored on this host. It does not revoke the session at the provider.'], ['ar', 'تسجيل الخروج يحذف بيانات الاعتماد المخزنة على هذا المضيف فقط ولا يلغي الجلسة لدى المزود.']])
  test(`a signed-out account renders the local-only sign-out note and surfaces the automatic-callback failure code (${language})`, async t => {
    const { createBaselineHarness } = await import('./helpers/baseline-client-harness.js');
    const source = await readFile(new URL('../../dist/client.js', import.meta.url), 'utf8');
    const id = 'a'.repeat(64), other = 'b'.repeat(64);
    const harness = createBaselineHarness(source, { language, connection: { rpc: { async call(channel, method, payload) {
      if (method === 'majed/settings/status') return { ok: true, value: { module: payload.module, enabled: true, state: 'ready' } };
      return { ok: true, value: { enabled: true, state: 'reauthentication_required', loginState: 'failed', loginFailure: 'duplicate_account', runtimeAvailable: false, runtimeEnabled: false,
        accounts: [{ id, label: 'f•••@example.test', state: 'signed_out', default: false }, { id: other, label: 's•••@example.test', state: 'connected', default: true }] } };
    } } } });
    t.after(() => harness.dispose()); harness.apply(); const view = harness.render('majed-subscriptions');
    for (let i = 0; i < 20; i++) await new Promise(resolve => setImmediate(resolve)); view.render();
    const leaves = node => typeof node === 'string' ? [node] : Array.isArray(node) ? node.flatMap(leaves) : node?.props ? leaves(node.props.children) : [];
    const texts = view.nodes(n => n.type === 'p').map(n => leaves(n.props.children).join(''));
    assert.equal(texts.filter(x => x === note).length, 1, 'the note renders exactly once, for the signed-out account only');
    assert.ok(texts.some(x => /already connected|متصلة بالفعل/.test(x)), 'the automatic-callback duplicate code renders its own message: ' + JSON.stringify(texts));
  });

for (const language of ['en', 'ar']) test(`Codex accounts render as provider/account cards without a stale cancelled line beside a connected account (${language})`, async t => {
  const { createBaselineHarness } = await import('./helpers/baseline-client-harness.js');
  const source = await readFile(new URL('../../client.js', import.meta.url), 'utf8');
  const id = 'a'.repeat(64);
  const harness = createBaselineHarness(source, { language, connection: { rpc: { async call(channel, method, payload) {
    if (method === 'majed/settings/status') return { ok: true, value: { module: payload.module, enabled: true, state: 'ready' } };
    return { ok: true, value: { enabled: true, state: 'connected', loginState: 'cancelled', runtimeAvailable: false, runtimeEnabled: false,
      accounts: [{ id, label: 'f•••@example.test', state: 'connected', default: true, expiresAt: 4102444800000 }] } };
  } } } });
  t.after(() => harness.dispose()); harness.apply(); const view = harness.render('majed-subscriptions');
  for (let i = 0; i < 20; i++) await new Promise(resolve => setImmediate(resolve)); view.render();
  assert.ok(view.one(n => n.type === 'section' && n.props['data-majed-codex'] === true), 'one provider card');
  assert.ok(view.one(n => n.type === 'article' && n.props['data-account-state'] === 'connected'), 'one account card');
  const star = view.one(n => n.props['data-codex-action'] === 'default');
  assert.equal(star.props['aria-pressed'], true);
  const leaves = node => typeof node === 'string' ? [node] : Array.isArray(node) ? node.flatMap(leaves) : node?.props ? leaves(node.props.children) : [];
  const all = view.nodes(() => true).flatMap(n => leaves(n.props?.children));
  assert.equal(all.some(x => /Login cancelled|تم إلغاء تسجيل الدخول/.test(x)), false, 'no stale cancelled message');
});
