import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCodexAccounts } from '../modules/subscriptions/codex/accounts.js';
import { createFixtureFetch } from './codex-fixture/transport.mjs';
import { Context } from '@deepseek-ai/cordis';
import { LlmRuntime } from '@deepseek-ai/dsh-llm';
import * as llmModule from '@deepseek-ai/dsh-llm';
import { createCodexRuntime } from '../modules/subscriptions/codex/runtime.js';

test('fixture refuses all URLs except exact token, catalog and Responses endpoints', async () => {
  const { fetch, counters } = createFixtureFetch();
  for (const url of ['https://example.test', 'https://auth.openai.com/oauth/token?x=1', 'https://chatgpt.com/backend-api/codex/models?client_version=other', 'https://chatgpt.com/backend-api/codex/responses/']) {
    await assert.rejects(fetch(url), /fixture_transport_denied/);
  }
  assert.deepEqual(counters(), { token: 0, catalog: 0, responses: 0, denied: 4 });
});

test('fixture returns labelled synthetic identity, catalog and terminal SSE', async () => {
  const { fetch, counters } = createFixtureFetch();
  const tokens = await (await fetch('https://auth.openai.com/oauth/token', { method: 'POST' })).json();
  assert.match(tokens.access_token, /^SYNTHETIC-FIXTURE/);
  const catalog = await (await fetch('https://chatgpt.com/backend-api/codex/models?client_version=0.153.4')).json();
  assert.equal(catalog.models[0].slug, 'synthetic-codex');
  const sse = await (await fetch('https://chatgpt.com/backend-api/codex/responses', { method: 'POST' })).text();
  assert.match(sse, /response.completed/); assert.match(sse, /no provider inference occurred/);
  assert.deepEqual(counters(), { token: 1, catalog: 1, responses: 1, denied: 0 });
});

test('fixture observes only fixed wire setting aggregates without retaining request data', async () => {
  const transport = createFixtureFetch();
  const send = body => transport.fetch('https://chatgpt.com/backend-api/codex/responses', { method: 'POST', body: JSON.stringify(body) });
  await send({ input: 'PRIVATE-SENTINEL', reasoning: { effort: 'high' } });
  await send({ service_tier: 'priority', reasoning: { effort: 'low' } });
  await send({ service_tier: 'PRIVATE-SENTINEL', reasoning: { effort: 'PRIVATE-SENTINEL' } });
  await transport.fetch('https://chatgpt.com/backend-api/codex/responses', { method: 'POST', body: '{malformed' });
  const expected = { speed: { standard: 1, fast: 1, other: 1 }, reasoning: { absent: 0, low: 1, high: 1, other: 1 }, malformed: 1 };
  assert.deepEqual(transport.observations(), expected);
  const detached = transport.observations(); detached.speed.fast = 99;
  assert.deepEqual(transport.observations(), expected);
  assert.doesNotMatch(JSON.stringify(transport.observations()), /PRIVATE-SENTINEL/);
});

test('real account service consumes synthetic callback and retains identity after service restart', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'majed-codex-service-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const transport = createFixtureFetch();
  const config = { path: join(directory, 'auth.json'), ports: [0], fetch: transport.fetch };
  const service = createCodexAccounts(config); t.after(() => service.dispose());
  const attempt = await service.begin();
  const authorize = new URL(attempt.authorizeUrl);
  assert.match(authorize.searchParams.get('code_challenge'), /^[A-Za-z0-9_-]{43}$/);
  const callback = new URL(authorize.searchParams.get('redirect_uri'));
  callback.searchParams.set('state', authorize.searchParams.get('state'));
  callback.searchParams.set('code', 'SYNTHETIC-FIXTURE-CODE');
  await service.complete(callback.href);
  assert.equal((await service.snapshot()).accounts[0].label, 'synthetic-codex@example.test');
  await service.dispose();
  const restarted = createCodexAccounts(config); t.after(() => restarted.dispose());
  assert.equal((await restarted.snapshot()).accounts[0].label, 'synthetic-codex@example.test');
  assert.equal(transport.counters().token, 1);
  await restarted.refresh((await restarted.snapshot()).accounts[0].id);
  assert.equal((await restarted.snapshot()).state, 'connected');
  assert.deepEqual(transport.authObservations(), { authorizationCode: 1, refresh: 1, invalidGrant: 0 });
});

test('synthetic failure code fails login and cancellation leaves the store empty', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'majed-codex-failure-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const transport = createFixtureFetch();
  const service = createCodexAccounts({ path: join(directory, 'auth.json'), ports: [0], fetch: transport.fetch });
  t.after(() => service.dispose());
  const attempt = await service.begin();
  assert.equal((await service.snapshot()).loginState, 'pending');
  const authorize = new URL(attempt.authorizeUrl);
  const callback = new URL(authorize.searchParams.get('redirect_uri'));
  callback.searchParams.set('state', authorize.searchParams.get('state'));
  callback.searchParams.set('code', 'SYNTHETIC-FIXTURE-FAIL');
  const failed = await service.complete(callback.href);
  assert.equal(failed.loginState, 'failed');
  assert.deepEqual(failed.accounts, []);
  await service.begin();
  const cancelled = await service.cancel();
  assert.equal(cancelled.loginState, 'cancelled');
  assert.deepEqual(cancelled.accounts, []);
  assert.deepEqual(transport.counters(), { token: 1, catalog: 0, responses: 0, denied: 0 });
});

test('production native runtime retains explicit preferences and emits observed Standard/Fast wire settings', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'majed-codex-prefs-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const transport = createFixtureFetch();
  const accounts = createCodexAccounts({ path: join(directory, 'auth.json'), ports: [0], fetch: transport.fetch });
  t.after(() => accounts.dispose());
  const attempt = await accounts.begin(), authorize = new URL(attempt.authorizeUrl);
  const callback = new URL(authorize.searchParams.get('redirect_uri'));
  callback.searchParams.set('state', authorize.searchParams.get('state')); callback.searchParams.set('code', 'SYNTHETIC-FIXTURE-CODE');
  await accounts.complete(callback.href);
  const root = new Context(); await root.plugin(LlmRuntime); t.after(() => root.fiber.dispose());
  const config = { accounts, llm: root.llm, llmModule, path: join(directory, 'catalog.json'), fetch: transport.fetch };
  let runtime = await createCodexRuntime(config); t.after(() => runtime.dispose());
  const account = (await accounts.snapshot()).accounts[0].id;
  await runtime.configure({ account, independentEntry: true, alias: 'Fixture pinned' });
  await runtime.configure({ model: 'synthetic-codex', name: 'Fixture retained', defaultEffort: 'high', contextWindow: 64000 });
  const pinned = (await root.llm.listModels('codex')).find(model => model.id.startsWith('~account:'));
  assert.equal(pinned.name, 'Fixture pinned · Fixture retained');
  assert.ok((await runtime.speed('fixture-prefs')).fastModels.includes(pinned.id));
  const send = async effort => {
    const chunks = [];
    const prepared = await root.llm.prepareCall({ provider: 'codex', model: pinned.id, ...(effort === undefined ? {} : { reasoningEffort: effort }) });
    assert.equal(prepared.context.contextWindow, 64000);
    assert.equal(prepared.config.reasoningEffort, effort ?? 'high');
    for await (const chunk of prepared.stream({ ...prepared.config, sessionId: 'fixture-prefs', messages: [] })) chunks.push(chunk);
    assert.equal(chunks.filter(c => c.type === 'text-delta').map(c => c.text).join(''), 'SYNTHETIC CODEX FIXTURE: no provider inference occurred.');
    assert.equal(chunks.at(-1).reason.kind, 'stop');
  };
  await send();
  await runtime.setSpeed('fixture-prefs', 'fast'); await send('low');
  await runtime.dispose(); runtime = await createCodexRuntime(config);
  const info = await root.llm.resolveModelInfo('codex', pinned.id);
  assert.equal(info.name, 'Fixture pinned · Fixture retained');
  assert.equal(info.reasoning.defaultEffort, 'high'); assert.equal(info.context.contextWindow, 64000);
  assert.equal((await runtime.speed('fixture-prefs')).tier, 'standard');
  assert.equal((await runtime.snapshot()).autoEnrolled, false);
  await send();
  assert.deepEqual(transport.observations(), { speed: { standard: 2, fast: 1, other: 0 }, reasoning: { absent: 0, low: 1, high: 2, other: 0 }, malformed: 0 });
  assert.equal(transport.counters().responses, 3); assert.equal(transport.counters().denied, 0);
});

test('opt-in refresh invalid_grant retains identity, revokes native dispatch and reconnects through PKCE', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'majed-codex-reauth-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const transport = createFixtureFetch({ scenario: 'refresh-invalid-grant' });
  const accounts = createCodexAccounts({ path: join(directory, 'auth.json'), ports: [0], fetch: transport.fetch });
  t.after(() => accounts.dispose());
  const connect = async () => {
    const attempt = await accounts.begin(), authorize = new URL(attempt.authorizeUrl);
    assert.match(authorize.searchParams.get('code_challenge'), /^[A-Za-z0-9_-]{43}$/);
    const callback = new URL(authorize.searchParams.get('redirect_uri'));
    callback.searchParams.set('state', authorize.searchParams.get('state'));
    callback.searchParams.set('code', 'SYNTHETIC-FIXTURE-CODE');
    return accounts.complete(callback.href);
  };
  const initial = (await connect()).accounts[0];
  const root = new Context(); await root.plugin(LlmRuntime); t.after(() => root.fiber.dispose());
  const runtime = await createCodexRuntime({ accounts, llm: root.llm, llmModule, path: join(directory, 'catalog.json'), fetch: transport.fetch });
  t.after(() => runtime.dispose());
  const prepare = () => root.llm.prepareCall({ provider: 'codex', model: 'synthetic-codex' });
  const send = async prepared => {
    const chunks = [];
    for await (const chunk of prepared.stream({ ...prepared.config, messages: [], sessionId: 'fixture-reauth' })) chunks.push(chunk);
    assert.equal(chunks.filter(c => c.type === 'text-delta').map(c => c.text).join(''), 'SYNTHETIC CODEX FIXTURE: no provider inference occurred.');
    assert.equal(chunks.at(-1).reason.kind, 'stop');
  };
  assert.ok((await root.llm.listModels('codex')).some(m => m.id === 'synthetic-codex'));
  await send(await prepare());
  const held = await prepare();
  const assertBlocked = async prepared => {
    const chunks = [];
    for await (const chunk of prepared.stream({ ...prepared.config, messages: [] })) chunks.push(chunk);
    assert.equal(chunks.at(-1).reason.kind, 'error');
    assert.equal(chunks.some(chunk => chunk.type === 'text-delta'), false);
  };
  await assert.rejects(accounts.refresh(initial.id), { code: 'reauthentication_required' });
  const revoked = await accounts.snapshot();
  assert.equal(revoked.state, 'reauthentication_required');
  assert.deepEqual(revoked.accounts.map(a => [a.id, a.label, a.state, a.default]), [[initial.id, initial.label, 'reauthentication_required', true]]);
  assert.deepEqual(await root.llm.listModels('codex'), []);
  await assertBlocked(held);
  await assert.rejects(prepare());
  assert.equal(transport.counters().responses, 1);
  const recovered = await connect();
  assert.equal(recovered.state, 'connected');
  assert.deepEqual(recovered.accounts.map(a => [a.id, a.label, a.state]), [[initial.id, initial.label, 'connected']]);
  assert.ok((await root.llm.listModels('codex')).some(m => m.id === 'synthetic-codex'));
  await send(await prepare());
  await accounts.refresh(initial.id); // Failure is one-shot for this owned transport.
  assert.deepEqual(transport.authObservations(), { authorizationCode: 2, refresh: 2, invalidGrant: 1 });
  assert.equal(transport.counters().responses, 2);
  assert.equal(transport.counters().denied, 0);
});

test('launcher rejects arbitrary retained paths and invalid arguments before spawning a host', () => {
  for (const args of [['restart', '/'], ['new', '/tmp'], ['new-reauth', '/tmp'], ['new-reauth', '--scenario=other'], ['unknown']]) {
    const result = spawnSync(process.execPath, ['scripts/codex-fixture/launch.mjs', ...args], { encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.doesNotMatch(result.stdout, /Owned fixture run:/);
    assert.match(result.stderr, /unsafe fixture run|usage:/);
  }
});
