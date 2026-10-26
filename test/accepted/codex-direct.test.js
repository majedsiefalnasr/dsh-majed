import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Context } from '@deepseek-ai/cordis';
import { LlmRuntime, createUserMessage } from '@deepseek-ai/dsh-llm';
import * as llmModule from '@deepseek-ai/dsh-llm';
import { createCodexAccounts } from '../../modules/subscriptions/codex/accounts.js';
import { createCodexRuntime } from '../../modules/subscriptions/codex/runtime.js';
import { apply as product } from '../../index.js';

const jwt = data => 'header.' + Buffer.from(JSON.stringify(data)).toString('base64url') + '.signature';
const idToken = jwt({ email: 'fixture@example.test', 'https://api.openai.com/auth': { chatgpt_account_id: 'workspace-one', chatgpt_user_id: 'user-one' } });
const frame = data => `data: ${JSON.stringify(data)}\n\n`;
async function setup(t, fixtureOptions = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-r02-')); t.after(() => rm(directory, { recursive: true, force: true }));
  const calls = [];
  const transport = async (url, options) => {
    calls.push({ url, options });
    if (fixtureOptions.transport) {
      const response = await fixtureOptions.transport(url, options);
      if (response) return response;
    }
    if (url === 'https://auth.openai.com/oauth/token') return Response.json({ access_token: 'fixture-access', refresh_token: 'fixture-refresh', expires_in: 3600, id_token: idToken });
    if (url.startsWith('https://chatgpt.com/backend-api/codex/models')) return Response.json({ models: [{ slug: 'fixture-codex', display_name: 'Fixture Codex', context_window: 120000, max_context_window: 200000,
      supported_reasoning_levels: [{ effort: 'low' }, { effort: 'high' }], default_reasoning_level: 'high', service_tiers: [{ id: 'priority' }] }] });
    assert.equal(url, 'https://chatgpt.com/backend-api/codex/responses');
    return new Response(frame({ type: 'response.output_text.delta', item_id: 'message-one', content_index: 0, delta: 'Fixture response' })
      + frame({ type: 'response.completed', response: { usage: { input_tokens: 7, output_tokens: 3 }, output: [] } }), { headers: { 'content-type': 'text/event-stream' } });
  };
  const accounts = createCodexAccounts({ path: join(directory, 'auth.json'), ports: [0], fetch: transport }); t.after(() => accounts.dispose());
  const root = new Context(), llmFiber = root.plugin(LlmRuntime); await llmFiber; t.after(() => root.fiber.dispose());
  const runtime = await createCodexRuntime({ accounts, llm: root.llm, llmModule, path: join(directory, 'catalog.json'), fetch: transport,
    resolveAttachments: () => fixtureOptions.attachments }); t.after(() => runtime.dispose());
  const login = await accounts.begin(), authorize = new URL(login.authorizeUrl), callback = new URL(authorize.searchParams.get('redirect_uri'));
  callback.searchParams.set('code', 'fixture-code'); callback.searchParams.set('state', authorize.searchParams.get('state')); await accounts.complete(callback.href);
  return { runtime, accounts, llm: root.llm, calls, directory };
}

test('a real protected Codex account advertises a native catalog and streams through its selected direct route', async t => {
  const { runtime, llm, calls } = await setup(t);
  const listed = await llm.listModels('codex');
  assert.equal(listed[0].id, 'fixture-codex');
  assert.equal(listed[0].name, 'Fixture Codex');
  const prepared = await runtime.adapter.prepareCall('codex', 'fixture-codex');
  assert.equal(prepared.model.context.contextWindow, 120000);
  const chunks = [];
  for await (const chunk of llm.stream({ provider: 'codex', model: 'fixture-codex', reasoningEffort: 'low', messages: [createUserMessage({ content: [{ type: 'text', text: 'Fixture request' }], source: { kind: 'user' } })] })) chunks.push(chunk);
  assert.equal(chunks.filter(c => c.type === 'text-delta').map(c => c.text).join(''), 'Fixture response');
  assert.equal(chunks.at(-1).reason.kind, 'stop');
  const sent = calls.find(c => c.url.endsWith('/responses'));
  assert.equal(sent.options.headers['chatgpt-account-id'], 'workspace-one');
  assert.equal(JSON.parse(sent.options.body).reasoning.effort, 'low');
  assert.equal((await runtime.snapshot()).autoEnrolled, false);
});

test('native catalog preferences retain public IDs and expose separately bound independent account entries', async t => {
  const { runtime, accounts, llm, calls } = await setup(t);
  const account = (await accounts.snapshot()).accounts[0].id;
  await runtime.configure({ account, independentEntry: true, alias: 'Pinned fixture' });
  await runtime.configure({ model: 'fixture-codex', name: 'Owner model', defaultEffort: 'low', contextWindow: 150000 });
  await runtime.setSpeed('fixture-session', 'fast');
  const listed = await llm.listModels('codex');
  const pinned = listed.find(m => m.id.startsWith('~account:'));
  assert.equal(pinned.name, 'Pinned fixture · Owner model');
  const prepared = await runtime.adapter.prepareCall('codex', pinned.id);
  assert.equal(prepared.model.reasoning.defaultEffort, 'low');
  assert.equal(prepared.model.context.contextWindow, 150000);
  const chunks = [];
  for await (const chunk of prepared.stream({ provider: 'codex', model: pinned.id, sessionId: 'fixture-session', reasoningEffort: 'high', messages: [] })) chunks.push(chunk);
  const sent = calls.find(c => c.url.endsWith('/responses'));
  assert.equal(JSON.parse(sent.options.body).model, 'fixture-codex');
  assert.equal(JSON.parse(sent.options.body).reasoning.effort, 'high');
  assert.equal(JSON.parse(sent.options.body).service_tier, 'priority');
  await accounts.remove(account);
  assert.deepEqual(await llm.listModels('codex'), []);
  await assert.rejects(async () => { for await (const chunk of prepared.stream({ provider: 'codex', model: pinned.id, messages: [] })) void chunk; }, { code: 'NO_ADAPTER' });
});

test('manual model metadata persists separately and unknown models acquire no invented capabilities', async t => {
  const { runtime, llm, directory, accounts } = await setup(t);
  await runtime.configure({ manualModels: [{ id: 'manual-codex', name: 'Manual model' }] });
  assert.deepEqual((await llm.listModels('codex')).map(m => m.id), ['manual-codex']);
  const info = await llm.resolveModelInfo('codex', 'manual-codex');
  assert.equal(info.context, undefined); assert.equal(info.reasoning, undefined); assert.equal(info.inputModalities, undefined);
  await runtime.dispose();
  const restarted = await createCodexRuntime({ accounts, llm, llmModule, path: join(directory, 'catalog.json') }); t.after(() => restarted.dispose());
  assert.equal((await restarted.snapshot()).catalogs[0].source, 'manual');
  const unknown = await llm.resolveModelInfo('codex', 'unlisted-model');
  assert.equal(unknown.id, 'unlisted-model'); assert.equal(unknown.context, undefined); assert.equal(unknown.reasoning, undefined);
});

test('partial provider failure preserves its prefix, redacts diagnostics and never resends', async t => {
  const { llm, calls } = await setup(t, { transport: async url => url.endsWith('/responses') ? new Response(
    frame({ type: 'response.output_text.delta', item_id: 'partial', content_index: 0, delta: 'Visible prefix' })
      + frame({ type: 'response.failed', response: { error: { code: 'server_error', message: 'fixture-access fixture-refresh' } } }), { headers: { 'content-type': 'text/event-stream' } }) : undefined });
  const chunks = [];
  for await (const chunk of llm.stream({ provider: 'codex', model: 'fixture-codex', messages: [] })) chunks.push(chunk);
  assert.equal(chunks.filter(c => c.type === 'text-delta').map(c => c.text).join(''), 'Visible prefix');
  assert.equal(chunks.at(-1).reason.kind, 'error');
  assert.equal(chunks.at(-1).reason.failure.code, 'SERVER');
  assert.doesNotMatch(JSON.stringify(chunks.at(-1)), /fixture-access|fixture-refresh/);
  assert.equal(calls.filter(c => c.url.endsWith('/responses')).length, 1);
});

test('cancellation closes an outstanding provider body even when the source ignores AbortSignal', async t => {
  let cancelled = 0;
  const { llm } = await setup(t, { transport: async url => url.endsWith('/responses') ? new Response(new ReadableStream({
    start(controller) { controller.enqueue(new TextEncoder().encode(frame({ type: 'response.output_text.delta', item_id: 'partial', content_index: 0, delta: 'Visible prefix' }))); },
    cancel() { cancelled++; },
  })) : undefined });
  const controller = new AbortController(), chunks = [];
  for await (const chunk of llm.stream({ provider: 'codex', model: 'fixture-codex', messages: [], signal: controller.signal })) {
    chunks.push(chunk); if (chunk.type === 'text-delta') controller.abort();
  }
  assert.equal(cancelled, 1);
  assert.notEqual(chunks.at(-1).reason.kind, 'stop');
});

test('expired credentials refresh before catalog/dispatch and catalog failure has a labelled reviewed fallback', async t => {
  let grants = 0;
  const { runtime, llm, calls } = await setup(t, { transport: async url => {
    if (url === 'https://auth.openai.com/oauth/token') { grants++; return Response.json({ access_token: grants === 1 ? 'expired-fixture-access' : 'refreshed-fixture-access', refresh_token: 'fixture-refresh', expires_in: grants === 1 ? 1 : 3600, id_token: idToken }); }
    if (url.includes('/codex/models')) return Response.json({ error: 'controlled catalog failure' }, { status: 503 });
  } });
  const catalog = await llm.listModels('codex');
  assert.equal(catalog[0].id, 'gpt-5.1-codex');
  const status = await runtime.snapshot();
  assert.equal(status.catalogs[0].source, 'static'); assert.equal(status.catalogs[0].failed, true);
  assert.equal(grants, 2);
  assert.equal(calls.find(c => c.url.includes('/codex/models')).options.headers.authorization, 'Bearer refreshed-fixture-access');
});

test('reasoning and tool fragments retain native blocks and usage without duplicate text', async t => {
  const events = [
    { type: 'response.output_item.added', item: { id: 'reason-one', type: 'reasoning' } },
    { type: 'response.reasoning_summary_text.delta', item_id: 'reason-one', summary_index: 0, delta: 'Reasoning fragment' },
    { type: 'response.output_item.done', item: { id: 'reason-one', type: 'reasoning' } },
    { type: 'response.output_item.added', item: { id: 'call-one', type: 'function_call', call_id: 'tool-call-one', name: 'fixture_tool' } },
    { type: 'response.function_call_arguments.delta', item_id: 'call-one', delta: '{"value":1}' },
    { type: 'response.output_item.done', item: { id: 'call-one', type: 'function_call', call_id: 'tool-call-one', name: 'fixture_tool', arguments: '{"value":1}' } },
    { type: 'response.completed', response: { usage: { input_tokens: 10, output_tokens: 4, input_tokens_details: { cached_tokens: 3 } }, output: [] } },
  ];
  const { llm } = await setup(t, { transport: async url => url.endsWith('/responses') ? new Response(events.map(frame).join('')) : undefined });
  const chunks = [];
  for await (const chunk of llm.stream({ provider: 'codex', model: 'fixture-codex', messages: [] })) chunks.push(chunk);
  assert.equal(chunks.find(c => c.type === 'reasoning-delta').text, 'Reasoning fragment');
  const tool = chunks.find(c => c.type === 'block-end' && c.block.type === 'tool-call').block;
  assert.equal(tool.id, 'tool-call-one'); assert.equal(tool.name, 'fixture_tool'); assert.equal(tool.arguments, '{"value":1}');
  assert.equal(chunks.find(c => c.type === 'usage').usage.inputTokens, 7);
  assert.equal(chunks.at(-1).reason.kind, 'tool-calls');
});

for (const withLoader of [false, true]) test(`missing prepared-host contract refuses runtime activation without disturbing account management (loader: ${withLoader})`, async t => {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-r02-')); t.after(() => rm(directory, { recursive: true, force: true }));
  const root = new Context(), routes = [];
  root.provide('connection', { fetch: { register(route) { routes.push(route); } } });
  if (withLoader) root.provide('loader', { async import(name) { assert.equal(name, '@deepseek-ai/dsh-llm'); return llmModule; } });
  await root.plugin(LlmRuntime);
  const fiber = root.plugin({ apply: product }, { codexAccounts: { path: join(directory, 'auth.json'), fetch() { throw Error('No provider access permitted'); } } }); await fiber;
  t.after(() => root.fiber.dispose());
  const route = routes.find(route => route.path === '/api/majed/subscriptions/codex');
  const call = async payload => (await (await route.fetch(new Request('http://fixture' + route.path, { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'client-request', rpcId: 'fixture', method: 'majed/subscriptions/codex', payload }) }))).json()).result;
  assert.equal((await call({ action: 'enable', enabled: true })).ok, true);
  assert.equal((await call({ action: 'runtime', enabled: true })).error.code, 'runtime_unavailable');
  assert.equal((await call({ action: 'status' })).value.enabled, true);
  assert.deepEqual(root.llm.listProviders(), []);
});

test('a canceled preparation leaves a shared account refresh available to another waiter and never dispatches its stream', async t => {
  let grants = 0, release, started;
  const received = new Promise(resolve => { started = resolve; });
  const { runtime, calls } = await setup(t, { transport: async url => {
    if (url !== 'https://auth.openai.com/oauth/token') return;
    grants++;
    if (grants === 1) return Response.json({ access_token: 'expired-fixture', refresh_token: 'fixture-refresh', expires_in: 1, id_token: idToken });
    started(); return new Promise(resolve => { release = () => resolve(Response.json({ access_token: 'refreshed-fixture', refresh_token: 'fixture-refresh', expires_in: 3600, id_token: idToken })); });
  } });
  const controller = new AbortController();
  const cancelled = assert.rejects(runtime.adapter.prepareCall('codex', 'fixture-codex', controller.signal), { code: 'ABORTED' });
  await received;
  const second = runtime.adapter.prepareCall('codex', 'fixture-codex');
  controller.abort(); await cancelled;
  assert.equal(calls.filter(c => c.url.endsWith('/responses')).length, 0);
  release(); const prepared = await second;
  assert.equal(grants, 2);
  for await (const chunk of prepared.stream({ provider: 'codex', model: 'fixture-codex', messages: [] })) void chunk;
  assert.equal(calls.filter(c => c.url.endsWith('/responses')).length, 1);
});

test('Standard/Fast is scoped to the explicit session and only applies to a supported model', async t => {
  const { runtime, calls } = await setup(t);
  assert.equal((await runtime.speed('session-a')).tier, 'standard');
  await runtime.setSpeed('session-a', 'fast');
  assert.equal((await runtime.speed('session-b')).tier, 'standard');
  for (const sessionId of ['session-a', 'session-b']) {
    const prepared = await runtime.adapter.prepareCall('codex', 'fixture-codex');
    for await (const chunk of prepared.stream({ provider: 'codex', model: 'fixture-codex', sessionId, messages: [] })) void chunk;
  }
  const requests = calls.filter(c => c.url.endsWith('/responses')).map(c => JSON.parse(c.options.body));
  assert.equal(requests[0].service_tier, 'priority'); assert.equal(requests[1].service_tier, undefined);
});

test('prepared direct calls retain their account across default changes and removed account-only models never fall back', async t => {
  let grants = 0;
  const secondIdToken = jwt({ email: 'second@example.test', 'https://api.openai.com/auth': { chatgpt_account_id: 'workspace-two', chatgpt_user_id: 'user-two' } });
  const { runtime, accounts, calls } = await setup(t, { transport: async (url, options) => {
    if (url === 'https://auth.openai.com/oauth/token') return Response.json({ access_token: 'fixture-access', refresh_token: 'fixture-refresh', expires_in: 3600, id_token: ++grants === 1 ? idToken : secondIdToken });
    if (url.includes('/codex/models')) return Response.json({ models: [
      { slug: 'shared-model', display_name: 'Shared model' },
      { slug: options.headers['chatgpt-account-id'] === 'workspace-two' ? 'only-second' : 'only-first', display_name: 'Account-only model' },
    ] });
  } });
  const attempt = await accounts.begin(), authorize = new URL(attempt.authorizeUrl), callback = new URL(authorize.searchParams.get('redirect_uri'));
  callback.searchParams.set('state', authorize.searchParams.get('state')); callback.searchParams.set('code', 'second-fixture-code'); await accounts.complete(callback.href);
  const entries = (await accounts.snapshot()).accounts;
  const first = entries.find(a => a.default), second = entries.find(a => !a.default);
  const prepared = await runtime.adapter.prepareCall('codex', 'shared-model');
  await accounts.setDefault(second.id);
  for await (const chunk of prepared.stream({ provider: 'codex', model: 'shared-model', messages: [] })) void chunk;
  assert.equal(calls.find(c => c.url.endsWith('/responses')).options.headers['chatgpt-account-id'], 'workspace-one');
  const onlySecond = await runtime.adapter.prepareCall('codex', 'only-second');
  await accounts.setDefault(first.id); await accounts.remove(second.id);
  await assert.rejects(async () => { for await (const chunk of onlySecond.stream({ provider: 'codex', model: 'only-second', messages: [] })) void chunk; }, { code: 'NO_ADAPTER' });
  await assert.rejects(runtime.adapter.prepareCall('codex', 'only-second'), { code: 'NO_ADAPTER' });
});

test('source-backed request preparation resolves retained attachments and preserves first-class tool pairing', async t => {
  const ref = { attachmentId: 'sha256:' + '0'.repeat(64), mediaType: 'image/png', bytes: 3, width: 1, height: 1 };
  let reads = 0;
  const { runtime, calls } = await setup(t, { attachments: { async readImage(actual, signal) { assert.deepEqual(actual, ref); signal.throwIfAborted(); reads++; return { data: new Uint8Array([1, 2, 3]), ref }; } } });
  const prepared = await runtime.adapter.prepareCall('codex', 'fixture-codex');
  const longId = 'call_' + 'a'.repeat(100);
  const messages = [
    { role: 'user', source: { kind: 'user' }, content: [{ type: 'image', attachment: ref }] },
    { role: 'assistant', source: { kind: 'model', provider: 'codex', model: 'fixture-codex' }, content: [{ type: 'tool-call', id: longId, name: 'fixture_tool', arguments: '{"value":1}' }] },
    { role: 'tool', toolCallId: longId, source: { kind: 'tool', callId: longId }, content: [{ type: 'text', text: 'Fixture tool result' }] },
  ];
  for await (const chunk of prepared.stream({ provider: 'codex', model: 'fixture-codex', messages, tools: [{ name: 'fixture_tool', description: 'Fixture tool', parameters: { type: 'object', properties: { value: { type: 'number' } } } }] })) void chunk;
  const sent = JSON.parse(calls.find(c => c.url.endsWith('/responses')).options.body);
  assert.equal(reads, 1);
  assert.equal(sent.input[0].content[0].image_url, 'data:image/png;base64,AQID');
  const call = sent.input.find(item => item.type === 'function_call'), output = sent.input.find(item => item.type === 'function_call_output');
  assert.equal(call.call_id, output.call_id); assert.ok(call.call_id.length <= 64); assert.equal(output.output, 'Fixture tool result');
  assert.equal(sent.tools[0].name, 'fixture_tool');
});

test('a catalog rejecting an unexpired access token retries once through the real refresh lifecycle', async t => {
  let discoveries = 0;
  const { runtime, calls } = await setup(t, { transport: async url => {
    if (url.includes('/codex/models') && ++discoveries === 1) return Response.json({ error: 'invalid_token' }, { status: 401 });
  } });
  const snapshot = await runtime.snapshot();
  assert.equal(snapshot.catalogs[0].source, 'discovered');
  assert.equal(calls.filter(c => c.url === 'https://auth.openai.com/oauth/token').length, 2);
  assert.equal(discoveries, 2);
});
