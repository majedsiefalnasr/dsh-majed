// Adapted from V1ki/dsh-plugin-subscriptions v0.9.12 test/provider-settings-rpc.spec.ts (MIT, b802311).
// Disposition: Codex portion only (Grok/Antigravity/MiniMax parts are other tickets); mounted on the real cordis
// Context, real LlmRuntime and the real tools/agent-created event; endpoints are ours (`majed-subscriptions.*`).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { LlmRuntime, ReasoningEffortId } from '@deepseek-ai/dsh-llm';
import { Context } from '@deepseek-ai/cordis';
import * as plugin from '../dist/subscriptions.js';
import { CodexAdapter } from '../dist/providers/codex.js';

test('provider settings RPC edits picker visibility, names and tool policy without losing the editor catalog or existing sessions', async () => {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t130/settings-rpc-');
  const { saveAccountSession } = await import('../dist/auth/store.js');
  const ctx = new Context();
  const adapters = new Map(), tools = new Map(), routes = new Map();
  const llm = new LlmRuntime(ctx);
  const registerAdapter = llm.registerAdapter.bind(llm);
  llm.registerAdapter = (ids, adapter) => { adapters.set(ids[0], adapter); return registerAdapter(ids, adapter); };
  ctx.provide('connection', { fetch: { register(route) { routes.set(route.path, route); return async () => { routes.delete(route.path); }; } } });
  ctx.provide('tools', { register(definition) { tools.set(definition.name, definition); return () => {}; } });
  const originalResolve = CodexAdapter.prototype.resolveOwnModel;
  let unavailable = false;
  CodexAdapter.prototype.resolveOwnModel = async (provider, model) => {
    if (unavailable && model === 'm2') throw new Error('capabilities unavailable');
    return { provider, id: model, name: model, reasoning: { efforts: [{ id: ReasoningEffortId('high'), name: 'High' }] } };
  };
  const runtime = ctx.plugin(plugin, { codexClientVersion: '1.2.3', pool: { enabled: false }, models: { codex: [{ id: 'm1', name: 'Model 1', inputModalities: ['text'] }, { id: 'm2', name: 'Model 2', inputModalities: ['text'] }] } });
  const savedFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('network forbidden'); };
  try {
    await new Promise(resolve => setTimeout(resolve, 50));
    assert.ok(routes.has('/api/majed-subscriptions.providerSettings'), 'the component mounted');
    assert.deepEqual(llm.listProviders(), [{ id: 'codex', name: 'ChatGPT (Codex)' }, { id: 'claude', name: 'Claude (Subscription)' }, { id: 'grok', name: 'Grok (Subscription)' }]);
    await saveAccountSession('codex', 'account', { accessToken: 'token', refreshToken: 'refresh', expiresAt: Date.now() + 3600_000, accountId: 'account' });
    const call = async (endpoint, payload) => {
      const method = `majed-subscriptions.${endpoint}`;
      const response = await routes.get(`/api/${method}`).fetch(new Request(`http://127.0.0.1/api/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'client-request', rpcId: 'r', method, payload }) }));
      assert.equal(response.status, 200); return (await response.json()).result;
    };
    assert.equal((await call('setProviderSettings', { provider: 'codex', settings: { visibleModels: ['m1'], tools: { image_generate: false, web_search: false } } })).ok, true);
    assert.deepEqual((await adapters.get('codex').listModels('codex')).map(model => model.id), ['m1']);
    assert.equal((await adapters.get('codex').resolveModel('codex', 'm2')).id, 'm2', 'a hidden model still resolves for existing sessions');
    unavailable = true;
    const catalog = await call('providerSettings', { provider: 'codex', force: true });
    assert.ok(catalog.ok);
    assert.deepEqual(catalog.value.models.map(model => model.id), ['m1', 'm2'], 'the editor catalog keeps hidden models');
    assert.deepEqual(catalog.value.models[0].efforts.map(effort => effort.id), ['high']);
    assert.deepEqual(catalog.value.models[1].efforts, [], 'a model whose capabilities cannot be resolved offers no efforts');
    assert.equal((await call('setModelDefault', { provider: 'codex', model: 'm1', effort: 'high' })).ok, true);
    assert.equal((await call('providerSettings', { provider: 'codex' })).value.models[0].configured, 'high');
    const badForce = await call('providerSettings', { provider: 'codex', force: 'yes' });
    assert.equal(badForce.ok, false, 'a non-boolean force is rejected, as in the reference');
    assert.match(badForce.error.message, /payload\.force must be a boolean when present/);
    assert.equal((await call('setProviderSettings', { provider: 'codex', settings: { contextWindows: { m1: 0 } } })).ok, false);
    assert.equal((await call('setProviderSettings', { provider: 'unsupported', settings: {} })).ok, false, 'unknown providers are rejected');

    const names = { displayName: '我的 Codex', modelDisplayNames: { m1: '主力模型' }, visibleModels: ['m1'], tools: { image_generate: false, web_search: false } };
    assert.equal((await call('setProviderSettings', { provider: 'codex', settings: names })).ok, true);
    assert.equal((await call('status', {})).value.providers.codex.displayName, '我的 Codex');
    assert.equal(llm.listProviders().find(provider => provider.id === 'codex')?.name, '我的 Codex');
    assert.equal((await adapters.get('codex').listModels('codex'))[0].name, '主力模型');
    const fresh = await call('providerSettings', { provider: 'codex', force: true });
    assert.equal(fresh.value.settings.displayName, '我的 Codex');
    assert.equal(fresh.value.models[0].name, 'Model 1', 'the editor sees the real model name, not the custom one');
    const renamed = await adapters.get('codex').resolveModel('codex', 'm1');
    assert.deepEqual([renamed.id, renamed.name, renamed.reasoning?.efforts.map(effort => effort.id)], ['m1', '主力模型', ['high']]);

    const create = at => {
      const denied = [];
      ctx.emit('agent/created', { agent: { session: { header: { createdAt: at } }, ctx: { tools: { restrict: ({ deny }) => { denied.push(...deny); } } } }, source: 'startup' });
      return denied;
    };
    assert.deepEqual([...tools.keys()], ['image_generate', 'video_generate', 'x_search']);
    await call('setProviderSettings', { provider: 'grok', settings: { tools: { image_generate: false } } });
    assert.deepEqual(create(Date.now() - 1000), [], 'a session created before the switch keeps the tool');
    assert.deepEqual(create(Date.now() + 1000), ['image_generate'], 'a session created after the switch loses it');
    assert.equal((await call('setProviderSettings', { provider: 'codex', settings: {} })).ok, true);
    assert.equal(llm.listProviders().find(provider => provider.id === 'codex')?.name, 'ChatGPT (Codex)', 'clearing restores the default name');
    assert.equal((await adapters.get('codex').listModels('codex')).length, 2);
    assert.deepEqual(create(Date.now() + 2000), [], 're-enabling applies to later sessions');
  } finally {
    globalThis.fetch = savedFetch;
    await runtime.dispose();
    CodexAdapter.prototype.resolveOwnModel = originalResolve;
  }
});
