#!/usr/bin/env node
'use strict';
// T02C isolated characterization; synthetic sends only, no production failover.
const assert = require('node:assert/strict');
const path = require('node:path');
const runtime = process.argv[2];
assert(runtime && path.isAbsolute(runtime), 'Pass the absolute installed DSH runtime');
const load = name => require(path.join(runtime, 'node_modules/@deepseek-ai', name, 'lib/index.js'));
let networkAttempts = 0;
const deny = () => { networkAttempts++; throw new Error('T02C forbids network'); };
globalThis.fetch = deny;
for (const protocol of ['node:http', 'node:https']) {
  const api = require(protocol);
  api.request = api.get = deny;
}
const net = require('node:net');
net.connect = net.createConnection = net.Socket.prototype.connect = deny;
require('node:tls').connect = deny;
const { Context } = load('cordis');
const { LlmAdapter } = load('dsh-llm');
const negative = process.argv.includes('--red-reset-budget');
const noGuard = process.argv.includes('--red-disable-guard');
const replayPartial = process.argv.includes('--red-replay-partial');
const failure = { message: 'Synthetic transport failure', code: 'TRANSPORT' };
const results = [];
async function mount(ctx, name, config = {}) {
  const fiber = ctx.plugin(load(name).default || load(name), config);
  await fiber.await();
  assert.equal(fiber.state, 2, `${name} must activate`);
}
const policy = mode => ({ mode, ...(mode === 'normal' ? { maxRetries: 2, retryableCodes: ['TRANSPORT'] } : {}),
  initialDelayMs: 1, maxDelayMs: 1, jitterRatio: 0 });
// The ticket-approved synthetic shared budget is fixture-owned, NOT a host primitive.
// It is retained outside prepareCall and charged immediately before each synthetic send.
function budget(limit) {
  return { limit, sends: [], candidates: new Set(), partial: false,
    reserve(candidate, phase) {
      if (this.sends.length >= this.limit) return false;
      this.candidates.add(candidate);
      this.sends.push({ candidate, phase });
      return true;
    } };
}
class SyntheticPool extends LlmAdapter {
  constructor(state, options) {
    super(); this.state = state; this.options = options;
    this.preparations = 0; this.dispatches = 0; this.closed = 0; this.signals = [];
  }
  providerRetryPolicy() { return policy(this.options.mode || 'always'); }
  async listModels(provider) { return [{ provider, id: 'fixture', name: 'Synthetic retry fixture' }]; }
  async resolveModel(provider, id) { return { provider, id, name: id }; }
  async prepareCall(provider, id, signal) {
    this.preparations++;
    if (negative && this.preparations > 1) this.state.sends.length = 0;
    signal.throwIfAborted();
    return { model: { provider, id, name: id }, stream: options => this.stream(options) };
  }
  async *stream(options) {
    this.dispatches++;
    // A finite fixture watchdog prevents the red control from looping forever.
    if (this.dispatches > 8) {
      options.signal.throwIfAborted();
      this.options.cancel('Synthetic watchdog: negative control exceeded boundary');
      return;
    }
    this.signals.push(options.signal);
    try {
      if (this.options.cancelDuringStream) {
        this.state.reserve('alpha', 'request');
        this.options.cancel('Synthetic caller cancellation');
        options.signal.throwIfAborted();
      }
      for (const [candidate, phase] of this.options.inner || [['alpha', 'request']]) {
        options.signal.throwIfAborted();
        if (!this.state.reserve(candidate, phase)) break;
        if (this.options.partial) {
          this.state.partial = true; // Set BEFORE publishing any assistant output.
          if (this.options.partial === 'tool-call') {
            yield { type: 'block-start', index: 0, blockType: 'tool-call', id: 'synthetic-call', name: 'never_execute' };
            yield { type: 'tool-call-delta', index: 0, id: 'synthetic-call', name: 'never_execute', argumentsDelta: '{}' };
            yield { type: 'block-end', index: 0, block: { type: 'tool-call', id: 'synthetic-call', name: 'never_execute', arguments: '{}' } };
          } else {
            const type = this.options.partial;
            yield { type: 'block-start', index: 0, blockType: type };
            yield { type: type === 'text' ? 'text-delta' : 'reasoning-delta', index: 0, text: 'synthetic visible output' };
            yield { type: 'block-end', index: 0, block: { type, text: 'synthetic visible output' } };
          }
          break;
        }
      }
      yield { type: 'finish', reason: { kind: 'error', failure: this.options.failure || failure } };
    } finally {
      this.closed++;
    }
  }
}
async function scenario(name, options, verify) {
  const ctx = new Context();
  let handle;
  try {
    for (const plugin of ['dsh-llm', 'dsh-system-prompt', 'dsh-session-projection', 'dsh-session', 'dsh-agent', 'dsh-tools', 'dsh-agent-loop']) {
      await mount(ctx, plugin, plugin === 'dsh-system-prompt' ? { includeHarnessIdentity: false } : plugin === 'dsh-agent-loop' ? { agents: [], maxParallelToolCalls: 1 } : {});
    }
    if (options.retry && !options.retryAfter) await mount(ctx, 'dsh-llm-retry');
    const state = budget(options.limit || 3);
    const adapter = new SyntheticPool(state, options);
    ctx.llm.registerAdapter(['t02c-fixture'], adapter);
    let recoveries = 0;
    let abortedSignal;
    handle = await ctx.agents.create({ sessionId: `t02c-${results.length}`, agentOptions: { provider: 't02c-fixture', model: 'fixture' },
      setup(agentCtx) {
        // Public scoped guard, including when global retry middleware is outermost.
        agentCtx.on('agent/request-error', async ({ agent, signal }, next) => {
          recoveries++;
          abortedSignal = signal;
          if (!noGuard && options.guard !== false && ((state.partial && !replayPartial) || state.sends.length >= state.limit)) {
            agent.cancel({ kind: 'hook', reason: state.partial ? 'Synthetic partial output: explicit recovery required' : 'Synthetic shared budget exhausted' });
            return;
          }
          if (!options.retry && options.guard !== false) return { kind: 'retry' };
          return next();
        }, { prepend: true });
      } });
    if (options.retry && options.retryAfter) await mount(ctx, 'dsh-llm-retry');
    options.cancel = reason => handle.agent.cancel({ kind: 'hook', reason });
    assert.equal(ctx.get('sessionPersistence'), undefined);
    assert.equal(ctx.get('credentials'), undefined);
    assert.equal(ctx.get('attachments'), undefined);
    handle.agent.followup({ content: [{ type: 'text', text: 'synthetic retry characterization' }], source: { kind: 'user' } });
    await handle.agent.whenIdle();
    const events = handle.agent.session.snapshotEvents();
    assert.equal(adapter.closed, Math.min(adapter.dispatches, 8), 'every admitted synthetic iterator must close');
    assert(adapter.signals.every(signal => signal === adapter.signals[0]), 'original turn signal must survive re-preparation');
    await verify({ state, adapter, recoveries, abortedSignal, events });
    assert.equal(networkAttempts, 0);
    results.push({ name, outcome: 'pass' });
    console.log(`PASS ${name}`);
  } finally {
    if (handle) await handle.dispose();
    await ctx.fiber.dispose();
  }
}
async function main() {
  await scenario('shared budget survives host retry and re-preparation', { retry: true }, ({ state, adapter, abortedSignal, events }) => {
    assert.equal(state.sends.length, 3);
    assert.equal(adapter.preparations, 3, 'budget must not reset in prepareCall');
    assert.equal(adapter.dispatches, 3);
    assert.equal(abortedSignal.aborted, true);
    assert.equal(events.filter(event => event.type === 'llm/retry').length, 2);
    assert.equal(events.at(-1).type, 'turn/end');
    assert.equal(events.at(-1).data.reason.kind, 'aborted');
  });
  await scenario('synthetic pool, refresh and endpoint attempts consume one ledger', {
    retry: true, limit: 5, inner: [['alpha', 'request'], ['alpha', 'credential-refresh'], ['beta', 'endpoint-fallback']],
  }, ({ state, adapter }) => {
    assert.deepEqual(state.sends, [
      { candidate: 'alpha', phase: 'request' }, { candidate: 'alpha', phase: 'credential-refresh' },
      { candidate: 'beta', phase: 'endpoint-fallback' }, { candidate: 'alpha', phase: 'request' },
      { candidate: 'alpha', phase: 'credential-refresh' },
    ]);
    assert.equal(state.candidates.size, 2);
    assert.equal(adapter.preparations, 2);
  });
  for (const retry of [false, true, 'normal', 'after-guard']) {
    for (const partial of ['text', 'reasoning', 'tool-call']) {
      await scenario(`${partial} partial output stops replay with retry ${retry || 'absent'}`, {
        retry: Boolean(retry), partial, mode: retry === 'normal' ? 'normal' : 'always', retryAfter: retry === 'after-guard',
      }, ({ state, adapter, abortedSignal, events }) => {
        assert.equal(state.sends.length, 1);
        assert.equal(adapter.preparations, 1);
        assert.equal(adapter.dispatches, 1);
        assert.equal(abortedSignal.aborted, true);
        assert.equal(events.filter(event => event.type === 'llm/retry').length, 0);
        const attempts = events.filter(event => event.type === 'assistant/attempt');
        assert.equal(attempts.length, 1);
        assert(attempts[0].data.stream.some(item => item.chunk?.type === 'block-end' && item.chunk.block.type === partial), 'failed prefix must be present in durable attempt');
        assert.equal(events.filter(event => event.type === 'assistant/message').length, 0, 'failed prefix must not become a successful assistant message');
        assert.equal(events.filter(event => event.type.startsWith('tool/')).length, 0, 'failed partial tools must not dispatch');
        assert.equal(events.at(-1).data.reason.kind, 'aborted');
        assert(JSON.stringify(events.at(-1).data.reason).includes('Synthetic partial output: explicit recovery required'));
      });
    }
  }
  await scenario('caller cancellation closes stream without recovery or additional send', {
    retry: true, cancelDuringStream: true,
  }, ({ state, adapter, recoveries, events }) => {
    assert.equal(state.sends.length, 1);
    assert.equal(adapter.preparations, 1);
    assert.equal(recoveries, 0);
    assert.equal(events.at(-1).data.reason.kind, 'aborted');
    assert(JSON.stringify(events.at(-1).data.reason).includes('Synthetic caller cancellation'));
  });
  await scenario('normal middleware does not retry a nonretryable failure', {
    retry: true, mode: 'normal', failure: { message: 'Synthetic authentication failure', code: 'AUTH' },
  }, ({ state, adapter, events }) => {
    assert.equal(state.sends.length, 1);
    assert.equal(adapter.preparations, 1);
    assert.equal(events.filter(event => event.type === 'llm/retry').length, 0);
    assert.equal(events.at(-1).data.reason.kind, 'error');
    assert.equal(events.at(-1).data.reason.error.code, 'AUTH');
  });
  console.log(JSON.stringify({ hostVersion: require(path.join(runtime, 'package.json')).version, results, networkAttempts,
    boundary: 'Fixture-owned cooperative synthetic send ledger; not provider integration, durable restart recovery or T02C completion.' }));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
