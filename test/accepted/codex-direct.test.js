import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Context } from '@deepseek-ai/cordis';
import { LlmRuntime, createUserMessage } from '@deepseek-ai/dsh-llm';
import { createCodexAccounts } from '../../modules/subscriptions/codex/accounts.js';
import { createCodexRuntime } from '../../modules/subscriptions/codex/runtime.js';

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
  const runtime = await createCodexRuntime({ accounts, llm: root.llm, path: join(directory, 'catalog.json'), fetch: transport }); t.after(() => runtime.dispose());
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
  await runtime.configure({ model: 'fixture-codex', name: 'Owner model', defaultEffort: 'low', contextWindow: 150000, speed: 'fast' });
  const listed = await llm.listModels('codex');
  const pinned = listed.find(m => m.id.startsWith('~account:'));
  assert.equal(pinned.name, 'Pinned fixture · Owner model');
  const prepared = await runtime.adapter.prepareCall('codex', pinned.id);
  assert.equal(prepared.model.reasoning.defaultEffort, 'low');
  assert.equal(prepared.model.context.contextWindow, 150000);
  const chunks = [];
  for await (const chunk of prepared.stream({ provider: 'codex', model: pinned.id, reasoningEffort: 'high', messages: [] })) chunks.push(chunk);
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
  const restarted = await createCodexRuntime({ accounts, llm, path: join(directory, 'catalog.json') }); t.after(() => restarted.dispose());
  assert.equal((await restarted.snapshot()).catalogs[0].source, 'manual');
  const unknown = await llm.resolveModelInfo('codex', 'unlisted-model');
  assert.equal(unknown.id, 'unlisted-model'); assert.equal(unknown.context, undefined); assert.equal(unknown.reasoning, undefined);
});
