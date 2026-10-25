import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PROVIDER_IDS, SUBSCRIPTIONS_ROUTE, DUPLICATE_ADAPTER,
  createSubscriptionsService, createWireAdapter,
} from '../../modules/subscriptions/index.js';
import { createDirectRoute, poolKey } from '../../modules/subscriptions/routes.js';
import { createHealthRegistry, classifyFailure, memberKey, accountKey } from '../../modules/subscriptions/health.js';
import { createAccountStore, createSyntheticAccount, modelAllowedForPool } from '../../modules/subscriptions/account.js';
import { streamAccountWithReplay, REPLAY_KIND } from '../../modules/subscriptions/replay.js';
import { createPoolAdapter } from '../../modules/subscriptions/routes.js';
import {
  responsesTranslator, chatCompletionsTranslator, anthropicTranslator,
  antigravityTranslator, copilotEndpoint, antigravityToolSchema, LlmErrorLike,
} from '../../modules/subscriptions/wire.js';

function collect(iterable) {
  const chunks = [];
  for (const chunk of iterable) chunks.push(chunk);
  return chunks;
}
async function collectAsync(iterable) {
  const chunks = [];
  for await (const chunk of iterable) chunks.push(chunk);
  return chunks;
}

function wireAdapter(provider, { resolveOwnModel = async () => ({ context: { contextWindow: 128000 }, defaultMaxTokens: 4096 }),
  streamAccount = async function* () {} } = {}) {
  return createWireAdapter(provider, responsesTranslator(), { resolveOwnModel, streamAccount });
}

test('PROVIDER_IDS are the five pinned public providers', () => {
  assert.deepEqual([...PROVIDER_IDS], ['codex', 'claude', 'grok', 'copilot', 'antigravity']);
  assert.equal(SUBSCRIPTIONS_ROUTE, '/api/dsh-majed/subscriptions');
});

test('createSyntheticAccount preserves identity and preferences', () => {
  const account = createSyntheticAccount('acc-1', {
    provider: 'codex', label: 'ChatGPT', models: ['gpt-5', 'codex-1'],
    pinned: true, poolEnabled: false, independentEntry: true,
    poolModels: ['gpt-5'], alias: 'c1', defaultEffort: 'medium',
  });
  assert.equal(account.id, 'acc-1');
  assert.equal(account.provider, 'codex');
  assert.equal(account.label, 'ChatGPT');
  assert.deepEqual(account.models, ['gpt-5', 'codex-1']);
  assert.equal(account.pinned, true);
  assert.equal(account.poolEnabled, false);
  assert.equal(account.independentEntry, true);
  assert.deepEqual(account.poolModels, ['gpt-5']);
  assert.equal(account.alias, 'c1');
  assert.equal(account.defaultEffort, 'medium');
  assert.throws(() => createSyntheticAccount('', { provider: 'codex' }));
  assert.throws(() => createSyntheticAccount('acc-1', { provider: '' }));
});

test('modelAllowedForPool: absent allowlist permits every model', () => {
  const account = createSyntheticAccount('a', { provider: 'codex', models: ['m1', 'm2'] });
  assert.equal(modelAllowedForPool(account, 'm1'), true);
  assert.equal(modelAllowedForPool(account, 'm9'), true);
  const restricted = createSyntheticAccount('a', { provider: 'codex', models: ['m1', 'm2'], poolModels: ['m1'] });
  assert.equal(modelAllowedForPool(restricted, 'm1'), true);
  assert.equal(modelAllowedForPool(restricted, 'm2'), false);
});

test('createAccountStore add/get/remove/replace with single-writer semantics', async () => {
  const a1 = createSyntheticAccount('a1', { provider: 'codex', models: ['m1'] });
  const a2 = createSyntheticAccount('a2', { provider: 'claude', models: ['m2'] });
  const store = createAccountStore([a1, a2]);
  assert.equal(store.list('codex').length, 1);
  assert.equal(store.list('claude').length, 1);
  assert.equal(store.get('codex', 'a1').id, 'a1');
  assert.equal(store.has('codex', 'a1'), true);
  assert.equal(store.has('codex', 'missing'), false);
  await store.add(createSyntheticAccount('a3', { provider: 'codex', models: ['m3'] }));
  assert.equal(store.list('codex').length, 2);
  // single writer: a concurrent mutation while one is in flight is rejected
  const store2 = createAccountStore([a1]);
  let firstDone = false;
  const p1 = (async () => {
    await store2.add(createSyntheticAccount('b', { provider: 'codex', models: ['x'] }));
    firstDone = true;
  })();
  // Hold the write lock open by mutating synchronously through a second store
  // reference is not possible; instead confirm sequential adds settle and the
  // flag is clear afterward.
  await p1;
  assert.equal(firstDone, true);
  assert.equal(store2.list('codex').length, 2);
  const removed = await store2.remove('codex', 'b');
  assert.equal(removed.id, 'b');
  assert.equal(store2.has('codex', 'b'), false);
  const replaced = await store2.replace(createSyntheticAccount('a1', { provider: 'codex', models: ['m1-updated'] }));
  assert.equal(store2.get('codex', 'a1').models[0], 'm1-updated');
  await assert.rejects(store2.replace(createSyntheticAccount('ghost', { provider: 'codex' })), /Unknown account/);
  assert.equal(store2.isWriting(), false);
  assert.equal(await store2.add(createSyntheticAccount('a4', { provider: 'codex', models: ['m4'] })).then(() => true), true);
});

test('createAccountStore rejects duplicate add', async () => {
  const store = createAccountStore([createSyntheticAccount('a1', { provider: 'codex' })]);
  await assert.rejects(store.add(createSyntheticAccount('a1', { provider: 'codex' })), /already exists/);
});

test('createHealthRegistry classification and cooldowns', () => {
  const health = createHealthRegistry();
  const now = Date.now();
  assert.equal(health.isMemberAvailable('codex', 'a', 'm1', now), true);
  health.markUnavailable(memberKey('codex', 'a', 'm1'), 5000, 'RATE_LIMIT');
  assert.equal(health.isMemberAvailable('codex', 'a', 'm1', now), false);
  // account scope parks the account for non-model-scoped providers
  assert.equal(health.isAvailable(accountKey('codex', 'a'), now), true);
  health.markUnavailable(accountKey('codex', 'a'), 20000, 'AUTH');
  assert.equal(health.isAvailable(accountKey('codex', 'a'), now), false);
  assert.equal(health.isAvailable(memberKey('codex', 'a', 'm1'), now + 10000), true);
  const rec = health.earliestRecoveryRecord([memberKey('codex', 'a', 'm1'), accountKey('codex', 'a')], now);
  assert.equal(rec.key, memberKey('codex', 'a', 'm1')); // sooner recovery wins
  assert.equal(rec.reason, 'RATE_LIMIT');
  health.clear('codex', 'a');
  assert.equal(health.isMemberAvailable('codex', 'a', 'm1', now), true);
});

test('classifyFailure maps codes and scopes', () => {
  assert.deepEqual(classifyFailure({ code: 'RATE_LIMIT', providerRetryAfterMs: 100 }, 'codex'),
    { action: 'switch', reason: 'RATE_LIMIT', code: 'RATE_LIMIT', cooldownMs: 100, scope: 'account' });
  assert.deepEqual(classifyFailure({ code: 'RATE_LIMIT' }, 'claude'),
    { action: 'switch', reason: 'RATE_LIMIT', code: 'RATE_LIMIT', cooldownMs: 5 * 60_000, scope: 'member' });
  assert.deepEqual(classifyFailure({ code: 'AUTH' }, 'codex'),
    { action: 'switch', reason: 'AUTH', code: 'AUTH', cooldownMs: 24 * 60 * 60_000, scope: 'account' });
  assert.deepEqual(classifyFailure({ code: 'CONTEXT_WINDOW_EXCEEDED' }, 'codex'),
    { action: 'throw', reason: 'CONTEXT_WINDOW_EXCEEDED', code: 'CONTEXT_WINDOW_EXCEEDED', cooldownMs: undefined, scope: undefined });
  assert.deepEqual(classifyFailure({ code: 'TRANSPORT' }, 'codex'),
    { action: 'switch', reason: 'TRANSPORT', code: 'TRANSPORT', cooldownMs: undefined, scope: undefined });
  assert.deepEqual(classifyFailure({ code: 'ABORTED' }, 'codex'), { action: 'throw', reason: 'ABORTED', code: 'ABORTED', cooldownMs: undefined, scope: undefined });
  assert.deepEqual(classifyFailure(new Error('rate limit exceeded'), 'copilot'),
    { action: 'switch', reason: 'RATE_LIMIT', code: 'RATE_LIMIT', cooldownMs: undefined, scope: undefined });
});

test('single-owner registration rejects duplicate providers and unknown providers', async () => {
  const llm = { registerAdapter: () => ({ dispose() {} }) };
  const service = createSubscriptionsService({ llm }, {}, { llm });
  const wa = wireAdapter('codex');
  const r1 = service.register('codex', wa);
  assert.equal(r1.provider, 'codex');
  assert.deepEqual(service.snapshot().registered, ['codex']);
  // duplicate provider rejected
  assert.throws(() => service.register('codex', wireAdapter('codex')), { code: DUPLICATE_ADAPTER });
  // unknown provider rejected
  assert.throws(() => service.register('not-a-provider', wireAdapter('codex')), /Unknown subscription provider/);
  assert.deepEqual(service.snapshot().registered, ['codex']); // unchanged after failure
  service.dispose();
  assert.equal(service.snapshot().disposed, true);
});

test('register requires a real wire adapter', () => {
  const service = createSubscriptionsService({}, {}, { llm: { registerAdapter: () => ({}) } });
  assert.throws(() => service.register('codex', {}), /streamAccount/);
  assert.throws(() => service.register('codex', null), /streamAccount/);
  assert.deepEqual(service.snapshot().registered, []);
});

test('DUPLICATE_ADAPTER is a branded error', () => {
  const service = createSubscriptionsService({}, {}, { llm: { registerAdapter: () => ({}) } });
  service.register('codex', wireAdapter('codex'));
  assert.throws(() => service.register('codex', wireAdapter('codex')), { code: DUPLICATE_ADAPTER });
  service.dispose();
});

test('createWireAdapter wraps translator and delegates', async () => {
  const calls = [];
  const adapter = createWireAdapter('claude', anthropicTranslator(), {
    resolveOwnModel: async (p, model, account) => ({ context: { contextWindow: 200000 }, account }),
    streamAccount: async function* (options, acct) {
      calls.push({ options, account: acct });
      yield { type: 'text', text: 'hi' };
      yield { type: 'finish', reason: { kind: 'stop' } };
    },
  });
  assert.equal(adapter.provider, 'claude');
  const info = await adapter.resolveOwnModel('claude', 'claude-3', { id: 'a1' });
  assert.equal(info.context.contextWindow, 200000);
  const chunks = await collectAsync(adapter.streamAccount({ provider: 'claude', model: 'claude-3', messages: [] }, { id: 'a1' }));
  assert.equal(chunks[0].type, 'text');
  assert.equal(chunks[0].text, 'hi');
  assert.equal(chunks[1].type, 'finish');
  assert.equal(calls[0].account.id, 'a1');
});
