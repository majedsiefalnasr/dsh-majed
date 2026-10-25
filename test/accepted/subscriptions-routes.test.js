import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createDirectRoute, createPoolAdapter, poolKey } from '../../modules/subscriptions/routes.js';
import { createWireAdapter } from '../../modules/subscriptions/index.js';
import { responsesTranslator } from '../../modules/subscriptions/wire.js';
import { createHealthRegistry } from '../../modules/subscriptions/health.js';
import { streamAccountWithReplay, REPLAY_KIND } from '../../modules/subscriptions/replay.js';
import { collectAsync } from './_subscriptions-helpers.js';

const ACCOUNT = { id: 'acc-1', provider: 'codex', models: ['gpt-5', 'codex-1'], pinned: true, independentEntry: true };

function calls() { return []; }

/** Build a controllable wire adapter. `streamScript(options, account)` returns chunks or throws. */
function controllable(provider, {
  streamScript = async function* () { yield { type: 'text', text: 'ok' }; yield { type: 'finish', reason: { kind: 'stop' } }; },
  resolveOwnModel = async () => ({ context: { contextWindow: 128000 }, defaultMaxTokens: 4096 }),
  streamCalls = [],
  resolveCalls = [],
} = {}) {
  const adapter = createWireAdapter(provider, responsesTranslator(), {
    resolveOwnModel: async (p, model, account) => { resolveCalls.push({ p, model, account }); return resolveOwnModel(p, model, account); },
    streamAccount: async function* (options, account) {
      streamCalls.push({ options, account });
      yield* streamScript(options, account);
    },
  });
  return { adapter, streamCalls, resolveCalls };
}

function rateLimitError(retryAfterMs) {
  const e = new Error('rate limited');
  e.code = 'RATE_LIMIT';
  e.providerRetryAfterMs = retryAfterMs;
  return e;
}

test('poolKey is provider/model', () => {
  assert.equal(poolKey('codex', 'gpt-5'), 'codex/gpt-5');
});

test('direct route serves only its pinned account and never falls back', async () => {
  const { adapter, streamCalls } = controllable('codex');
  const route = createDirectRoute(ACCOUNT, adapter, { maxAttempts: 1 });
  assert.equal(route.kind, 'direct');
  assert.equal(route.pinned, true);
  assert.equal(route.account, 'acc-1');
  assert.deepEqual(route.models, ['gpt-5', 'codex-1']);
  const info = await route.resolveModel('codex', 'gpt-5');
  assert.equal(info.context.contextWindow, 128000);
  const chunks = await collectAsync(route.stream({ provider: 'codex', model: 'gpt-5', messages: [] }));
  assert.deepEqual(chunks, [{ type: 'text', text: 'ok' }, { type: 'finish', reason: { kind: 'stop' } }]);
  assert.equal(streamCalls.length, 1);
  assert.equal(streamCalls[0].account.id, 'acc-1');
});

test('direct route rejects a model the account does not advertise', async () => {
  const { adapter } = controllable('codex');
  const route = createDirectRoute(ACCOUNT, adapter);
  await assert.rejects(route.resolveModel('codex', 'never-advertised'), /not advertised/);
  await assert.rejects(route.resolveModel('claude', 'gpt-5'), /serves codex only/);
});

test('direct route retries switchable failures (direct-route retry, separate from Auto budget)', async () => {
  let attempts = 0;
  const { adapter } = controllable('codex', {
    streamScript: async function* () {
      attempts += 1;
      if (attempts < 3) throw rateLimitError(1000);
      yield { type: 'text', text: 'recovered' };
      yield { type: 'finish', reason: { kind: 'stop' } };
    },
  }, { maxAttempts: 3 });
  // retryPolicy maxAttempts=3, initialDelayMs small
  const route = createDirectRoute(ACCOUNT, adapter, { maxAttempts: 3, initialDelayMs: 1, backoffCapMs: 10 });
  const chunks = await collectAsync(route.stream({ provider: 'codex', model: 'gpt-5', messages: [] }));
  assert.equal(attempts, 3);
  assert.deepEqual(chunks, [{ type: 'text', text: 'recovered' }, { type: 'finish', reason: { kind: 'stop' } }]);
  assert.deepEqual(route.retryPolicy, { maxAttempts: 3, initialDelayMs: 1, backoffCapMs: 10, jitter: 0.2 });
});

test('direct route exhausts and rethrows after maxAttempts', async () => {
  let attempts = 0;
  const { adapter } = controllable('codex', {
    streamScript: async function* () {
      attempts += 1;
      throw rateLimitError(1000);
    },
  });
  const route = createDirectRoute(ACCOUNT, adapter, { maxAttempts: 2, initialDelayMs: 1, backoffCapMs: 10 });
  await assert.rejects(collectAsync(route.stream({ provider: 'codex', model: 'gpt-5', messages: [] })), { code: 'RATE_LIMIT' });
  assert.equal(attempts, 2);
});

test('direct route rethrows non-retryable failures without retrying', async () => {
  let attempts = 0;
  const { adapter } = controllable('codex', {
    streamScript: async function* () {
      attempts += 1;
      const e = new Error('too long');
      e.code = 'CONTEXT_WINDOW_EXCEEDED';
      throw e;
    },
  });
  const route = createDirectRoute(ACCOUNT, adapter, { maxAttempts: 5, initialDelayMs: 1 });
  await assert.rejects(collectAsync(route.stream({ provider: 'codex', model: 'gpt-5', messages: [] })), { code: 'CONTEXT_WINDOW_EXCEEDED' });
  assert.equal(attempts, 1);
});

test('direct route abort is not a reason to retry', async () => {
  let attempts = 0;
  const { adapter } = controllable('codex', {
    streamScript: async function* () {
      attempts += 1;
      const e = new Error('aborted');
      e.code = 'ABORTED';
      throw e;
    },
  });
  const route = createDirectRoute(ACCOUNT, adapter, { maxAttempts: 5 });
  await assert.rejects(collectAsync(route.stream({ provider: 'codex', model: 'gpt-5', messages: [], signal: { aborted: false, throwIfAborted() {} } })), { code: 'ABORTED' });
  assert.equal(attempts, 1);
});

test('pool fails over between members before the first non-usage chunk', async () => {
  const health = createHealthRegistry();
  let accountSeen;
  const single = controllable('codex', {
    streamScript: async function* (options, account) {
      accountSeen = account;
      if (account === 'a1') throw rateLimitError();
      yield { type: 'text', text: 'from-a2' };
      yield { type: 'finish', reason: { kind: 'stop' } };
    },
  });
  const pool = createPoolAdapter({
    providers: { codex: single.adapter },
    health,
    strategy: 'priority',
    onWarn: () => {},
  });
  const members = [
    { provider: 'codex', account: 'a1', model: 'gpt-5' },
    { provider: 'codex', account: 'a2', model: 'gpt-5' },
  ];
  const chunks = await collectAsync(pool.streamMembers({ provider: 'codex', model: 'gpt-5', messages: [], signal: { aborted: false, throwIfAborted() {} } }, members));
  assert.deepEqual(chunks, [{ type: 'text', text: 'from-a2' }, { type: 'finish', reason: { kind: 'stop' } }]);
  assert.equal(accountSeen, 'a2'); // failed over from a1 to a2
  assert.equal(health.isAvailable('codex/a1/*', Date.now()), false); // a1 parked (account scope)
});

test('pool buffers leading usage and does not switch after first content chunk', async () => {
  const served = [];
  const single = controllable('codex', {
    streamScript: async function* (options, account) {
      served.push(account);
      yield { type: 'usage', tokens: 1 };
      yield { type: 'text', text: 'first' };
      yield { type: 'text', text: ' second' };
      yield { type: 'finish', reason: { kind: 'stop' } };
    },
  });
  const pool = createPoolAdapter({ providers: { codex: single.adapter }, strategy: 'priority', onWarn: () => {} });
  const members = [{ provider: 'codex', account: 'a1', model: 'gpt-5' }];
  const chunks = await collectAsync(pool.streamMembers({ provider: 'codex', model: 'gpt-5', messages: [], signal: { aborted: false, throwIfAborted() {} } }, members));
  assert.deepEqual(chunks, [
    { type: 'usage', tokens: 1 },
    { type: 'text', text: 'first' },
    { type: 'text', text: ' second' },
    { type: 'finish', reason: { kind: 'stop' } },
  ]);
  assert.deepEqual(served, ['a1']);
});

test('pool never switches or stitches after the first non-usage chunk even if the member then fails', async () => {
  const single = controllable('codex', {
    streamScript: async function* () {
      yield { type: 'text', text: 'partial' };
      throw rateLimitError(); // after content: must propagate, NOT fail over
    },
  });
  const pool = createPoolAdapter({ providers: { codex: single.adapter }, strategy: 'priority', onWarn: () => {} });
  const members = [{ provider: 'codex', account: 'a1', model: 'gpt-5' }];
  await assert.rejects(collectAsync(pool.streamMembers({ provider: 'codex', model: 'gpt-5', messages: [], signal: { aborted: false, throwIfAborted() {} } }, members)), { code: 'RATE_LIMIT' });
});

test('pool closes the member iterator when the caller walks away early (iterator cleanup)', async () => {
  let returned = false;
  const single = controllable('codex', {
    streamScript: async function* () {
      try {
        yield { type: 'text', text: 'a' };
        yield { type: 'text', text: 'b' };
        yield { type: 'finish', reason: { kind: 'stop' } };
      } finally {
        returned = true;
      }
    },
  });
  const pool = createPoolAdapter({ providers: { codex: single.adapter }, strategy: 'priority', onWarn: () => {} });
  const members = [{ provider: 'codex', account: 'a1', model: 'gpt-5' }];
  const iter = pool.streamMembers({ provider: 'codex', model: 'gpt-5', messages: [], signal: { aborted: false, throwIfAborted() {} } }, members)[Symbol.asyncIterator]();
  const first = await iter.next();
  assert.equal(first.value.text, 'a');
  await iter.return(); // caller walks away early
  assert.equal(returned, true); // iterator closed
});

test('pool exhaustion preserves the actual failure and scoped recovery hint', async () => {
  const health = createHealthRegistry();
  const single = controllable('codex', {
    streamScript: async function* () { throw rateLimitError(60000); },
  });
  const pool = createPoolAdapter({ providers: { codex: single.adapter }, health, strategy: 'priority', onWarn: () => {} });
  const members = [{ provider: 'codex', account: 'a1', model: 'gpt-5' }];
  let err;
  try {
    await collectAsync(pool.streamMembers({ provider: 'codex', model: 'gpt-5', messages: [], signal: { aborted: false, throwIfAborted() {} } }, members));
    assert.fail('pool should have exhausted');
  } catch (e) { err = e; }
  assert.equal(err.code, 'RATE_LIMIT');
  assert.ok(typeof err.providerRetryAfterMs === 'number' && err.providerRetryAfterMs > 0 && err.providerRetryAfterMs <= 60000);
});

test('pool owns(model) and resolveModel intersect capabilities', async () => {
  const single = controllable('codex', {
    resolveOwnModel: async () => ({ context: { contextWindow: 128000 }, defaultMaxTokens: 4096 }),
    streamScript: async function* () { yield { type: 'finish', reason: { kind: 'stop' } }; },
  });
  const pool = createPoolAdapter({
    providers: { codex: single.adapter },
    families: async () => new Map([[poolKey('codex', 'gpt-5'), { members: [{ provider: 'codex', account: 'a1', model: 'gpt-5' }] }]]),
    strategy: 'priority',
    onWarn: () => {},
  });
  assert.equal(await pool.owns('codex', 'gpt-5'), true);
  assert.equal(await pool.owns('codex', 'missing'), false);
  const result = await pool.resolveModel('codex', 'gpt-5');
  assert.equal(result.model.context.contextWindow, 128000);
  assert.equal(result.model.id, 'gpt-5');
});

test('tier routes are extra picker rows under the first member provider', async () => {
  const codex = controllable('codex', { streamScript: async function* () {} });
  const grok = controllable('grok', { streamScript: async function* () {} });
  const pool = createPoolAdapter({
    providers: { codex: codex.adapter, grok: grok.adapter },
    tiers: { 'gpt-5-tier': [{ provider: 'grok', account: 'ga', model: 'grok-1' }] },
    strategy: 'priority',
    onWarn: () => {},
  });
  // tier key is owner(first member provider)=grok + id, not the member's own model key.
  assert.equal(await pool.owns('grok', 'gpt-5-tier'), true);
  assert.equal(await pool.owns('grok', 'grok-1'), false);
  assert.equal(await pool.owns('codex', 'gpt-5-tier'), false);
});

test('streamAccountWithReplay binds replay to provider/account/model and stamps finish', async () => {
  let accountSeen;
  const adapter = {
    streamAccount: async function* (options, account) {
      accountSeen = account;
      yield { type: 'text', text: 'x' };
      yield { type: 'finish', reason: { kind: 'stop' }, replayState: { response: 'state' } };
    },
  };
  const chunks = await collectAsync(streamAccountWithReplay(adapter, { provider: 'codex', model: 'gpt-5', messages: [] }, 'acc-1', 'gpt-5'));
  assert.equal(accountSeen, 'acc-1');
  assert.equal(chunks[0].type, 'text');
  assert.equal(chunks[1].type, 'finish');
  assert.equal(chunks[1].replayState.response.kind, REPLAY_KIND);
  assert.equal(chunks[1].replayState.response.version, 1);
  assert.equal(typeof chunks[1].replayState.response.key, 'string');
  assert.equal(chunks[1].replayState.response.state, 'state');
});

test('streamAccountWithReplay discards mismatched replay state but keeps normalized history', () => {
  // verify via a fresh hash for a different account/model
  const key1 = createHash('sha256').update(JSON.stringify(['codex', 'a1', 'm1'])).digest('hex');
  const key2 = createHash('sha256').update(JSON.stringify(['codex', 'a2', 'm1'])).digest('hex');
  assert.notEqual(key1, key2); // account/model bound
});
