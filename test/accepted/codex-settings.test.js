import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Context } from '@deepseek-ai/cordis';
import * as plugin from '../../index.js';
import { createBaselineHarness } from './helpers/baseline-client-harness.js';
const tick = async () => { for (let i = 0; i < 20; i++) await new Promise(resolve => setImmediate(resolve)); };

test('production entry mounts disabled Codex Settings and supports protected account restart through the native RPC envelope', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'majed-codex-settings-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const routes = new Map(), ctx = new Context();
  ctx.provide('connection', { fetch: { register(route) { routes.set(route.path, route); } } });
  const idToken = 'x.' + Buffer.from(JSON.stringify({ email: 'fixture@example.test', 'https://api.openai.com/auth': { chatgpt_account_id: 'workspace-fixture' } })).toString('base64url') + '.x';
  const fiber = ctx.plugin(plugin, { codexAccounts: { path: join(directory, 'auth.json'), ports: [0], fetch: async () => Response.json({ access_token: 'fixture-secret', refresh_token: 'fixture-refresh', expires_in: 3600, id_token: idToken }) } });
  await fiber; t.after(() => fiber.dispose());
  const route = routes.get('/api/majed/subscriptions/codex'); assert.ok(route);
  assert.deepEqual(route.methods, ['POST']);
  const call = async payload => (await (await route.fetch(new Request('http://fixture' + route.path, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'client-request', rpcId: 'fixture', method: 'majed/subscriptions/codex', payload }),
  }))).json()).result;
  assert.equal((await call({ action: 'status' })).value.enabled, false);
  assert.equal((await call({ action: 'begin' })).error.code, 'module_disabled');
  assert.equal((await call({ action: 'enable', enabled: true })).value.enabled, true);
  const attempt = (await call({ action: 'begin' })).value;
  const authorize = new URL(attempt.authorizeUrl), callback = new URL(authorize.searchParams.get('redirect_uri'));
  callback.searchParams.set('code', 'fixture-code'); callback.searchParams.set('state', authorize.searchParams.get('state'));
  const completed = await call({ action: 'complete', callback: callback.href });
  assert.equal(completed.value.accounts.length, 1);
  assert.equal(JSON.stringify(completed).includes('fixture-secret'), false);
  await call({ action: 'enable', enabled: false }); await call({ action: 'enable', enabled: true });
  assert.equal((await call({ action: 'status' })).value.state, 'connected');
});

for (const language of ['en', 'ar']) test(`native Settings exposes Codex enable/login/callback/cancel controls (${language})`, async t => {
  const source = await readFile(new URL('../../client.js', import.meta.url), 'utf8');
  const calls = [];
  const harness = createBaselineHarness(source, { language, connection: { rpc: { async call(channel, method, payload) {
    calls.push({ channel, method, payload });
    if (method === 'majed/settings/status') return { ok: true, value: { module: payload.module, enabled: false, state: 'disabled' } };
    return { ok: true, value: payload.action === 'begin' ? { enabled: true, state: 'pending', authorizeUrl: 'https://auth.openai.com/oauth/authorize?state=fixture' } : { enabled: payload.enabled ?? false, state: payload.enabled ? 'disconnected' : 'disabled', accounts: [] } };
  } } } });
  t.after(() => harness.dispose()); harness.apply(); const view = harness.render('majed-subscriptions'); await tick(); view.render();
  const area = view.one(n => n.props['data-majed-codex'] === true);
  assert.equal(area.props.dir, language === 'ar' ? 'rtl' : 'ltr');
  await view.one(n => n.props['data-codex-action'] === 'enable').props.onClick(); await tick(); view.render();
  await view.one(n => n.props['data-codex-action'] === 'begin').props.onClick(); await tick(); view.render();
  assert.equal(view.one(n => n.type === 'a').props.href.startsWith('https://auth.openai.com/'), true);
  assert.ok(view.one(n => n.props['data-codex-action'] === 'complete'));
  assert.ok(view.one(n => n.props['data-codex-action'] === 'cancel'));
  assert.ok(calls.some(c => c.channel === '/api' && c.method === 'majed/subscriptions/codex' && c.payload.action === 'begin'));
});

test('Subscriptions Settings separately enables native Codex dispatch and edits supported model settings', async t => {
  const source = await readFile(new URL('../../client.js', import.meta.url), 'utf8');
  const calls = [];
  const model = { id: 'fixture-codex', name: 'Fixture model', contextWindow: 120000, maxContextWindow: 200000, fastTier: true,
    reasoning: { efforts: [{ id: 'low', name: 'Low' }, { id: 'high', name: 'High' }], defaultEffort: 'high' } };
  const harness = createBaselineHarness(source, { connection: { rpc: { async call(channel, method, payload) {
    calls.push({ method, payload });
    if (method === 'majed/settings/status') return { ok: true, value: { module: payload.module, enabled: false, state: 'disabled' } };
    return { ok: true, value: { enabled: true, state: 'connected', runtimeAvailable: true, runtimeEnabled: payload.action === 'runtime' || payload.action === 'configure', accounts: [],
      runtime: { models: [model], catalogs: [{ account: 'fixture-account', source: 'discovered', models: [model] }], preferences: {} } } };
  } } } });
  t.after(() => harness.dispose()); harness.apply(); const view = harness.render('majed-subscriptions'); await tick(); view.render();
  await view.one(n => n.props['data-codex-action'] === 'runtime').props.onClick(); await tick(); view.render();
  assert.ok(view.one(n => n.props['data-codex-model-settings'] === true));
  await view.one(n => n.props['data-codex-model-settings'] === true).props.onSubmit({ preventDefault() {} }); await tick(); view.render();
  assert.ok(calls.some(c => c.payload.action === 'runtime' && c.payload.enabled === true));
  assert.ok(calls.some(c => c.payload.action === 'configure' && c.payload.settings.model === 'fixture-codex'));
});

test('the Codex composer and /fast contribution control the same supported session speed and dispose cleanly', async t => {
  const source = await readFile(new URL('../../client.js', import.meta.url), 'utf8');
  let tier = 'standard', command, unregisters = 0;
  const harness = createBaselineHarness(source, { connection: { rpc: { async call(channel, method, payload) {
    assert.equal(method, 'majed/subscriptions/codex'); assert.equal(payload.sessionId, 'session-a');
    if (payload.action === 'setSpeed') tier = payload.tier;
    return { ok: true, value: { runtimeEnabled: true, tier, fastModels: ['fixture-codex'] } };
  } } } });
  let context;
  harness.apply((plugin, fixtures) => {
    context = { ...fixtures, get(name) {
      if (name === 'modelDirectories') return { directoryFor: () => ({ load: async () => ({ current: { provider: 'codex', model: 'fixture-codex' } }) }) };
      if (name === 'commandUi') return { register(value) { command = value; return () => { command = undefined; unregisters++; }; } };
    }, inject(names, callback) { if (names[0] === 'commandUi') callback(context); } };
    return plugin.apply(context);
  });
  t.after(() => harness.dispose());
  assert.equal(command, undefined, 'disabled or unknown runtime does not claim /fast');
  const view = harness.render('majed-codex-speed', { sessionId: 'session-a' }); await tick(); view.render();
  assert.equal(command.name, 'fast'); assert.equal(typeof command.description, 'function');
  await view.one(n => n.props['data-codex-speed'] === true).props.onChange({ target: { value: 'fast' } }); view.render();
  assert.equal(view.one(n => n.props['data-codex-speed'] === true).props.value, 'fast');
  const choices = await command.ui.options({ sessionId: 'session-a' });
  assert.equal(choices.find(c => c.id === 'fast').active, true);
  await command.ui.onSelect({ id: 'standard' }, { sessionId: 'session-a' });
  assert.equal(tier, 'standard');
  harness.dispose(); assert.equal(unregisters, 1); assert.equal(harness.timers.size, 0);
});
