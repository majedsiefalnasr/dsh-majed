#!/usr/bin/env node
'use strict';
// T02D exact-host characterization. No real child inference or production routing.
const assert = require('node:assert/strict');
const path = require('node:path');
const runtime = process.argv[2];
const flags = process.argv.slice(3);
assert(flags.every(flag => flag === '--red-drop-route'), 'Only the named negative control is supported');
assert(runtime && path.isAbsolute(runtime), 'Pass the absolute installed DSH runtime');
let networkAttempts = 0;
const deny = () => { networkAttempts++; throw new Error('T02D forbids network'); };
globalThis.fetch = deny;
for (const protocol of ['node:http', 'node:https']) {
  const api = require(protocol);
  api.request = api.get = deny;
}
const net = require('node:net');
net.connect = net.createConnection = net.Socket.prototype.connect = deny;
require('node:tls').connect = deny;
const load = name => require(path.join(runtime, 'node_modules/@deepseek-ai', name, 'lib/index.js'));
const seam = load('dsh-subagent');
const results = [];
function recordPass(name) {
  results.push({ name, outcome: 'pass' });
  console.log(`PASS ${name}`);
}
function check(name, action) {
  action();
  recordPass(name);
}
const parent = {
  options: { provider: 'created', model: 'old', reasoningEffort: 'high', maxTokens: 200, subagentDepth: 0 },
  session: { header: { id: 'parent', delegationDepth: 2, cwd: process.cwd() },
    requestHeader: () => ({ config: { provider: 'selected', model: 'current', reasoningEffort: 'low' } }) },
};
check('latest request route wins over creation options and detached result preserves token limit', () => {
  const resolved = seam.resolveChildAgentOptions(parent, undefined, 3);
  assert.deepEqual(resolved, { provider: 'selected', model: 'current', reasoningEffort: 'low', maxTokens: 200, subagentDepth: 3 });
  resolved.model = 'changed';
  assert.equal(parent.options.model, 'old');
  assert.equal(seam.resolveChildAgentOptions(parent, undefined, 3).model, 'current');
});
check('explicit route overrides win and route changes clear inherited effort', () => {
  assert.deepEqual(seam.resolveChildAgentOptions(parent, { provider: 'chosen', model: 'explicit' }, 3),
    { provider: 'chosen', model: 'explicit', maxTokens: 200, subagentDepth: 3 });
  assert.deepEqual(seam.resolveChildAgentOptions(parent, { model: 'explicit', reasoningEffort: 'medium' }, 3),
    { provider: 'selected', model: 'explicit', reasoningEffort: 'medium', maxTokens: 200, subagentDepth: 3 });
  assert.equal(seam.resolveChildAgentOptions(parent, { reasoningEffort: undefined }, 3).reasoningEffort, undefined);
  const noEffort = { ...parent, session: { ...parent.session, requestHeader: () => ({ config: { provider: 'selected', model: 'current' } }) } };
  assert.equal(Object.hasOwn(seam.resolveChildAgentOptions(noEffort, undefined, 3), 'reasoningEffort'), false);
});
check('creation fallback and persisted delegation floor are native-owned', () => {
  const fresh = { ...parent, session: { ...parent.session, requestHeader: () => undefined } };
  assert.deepEqual(seam.resolveChildAgentOptions(fresh, undefined, 3),
    { provider: 'created', model: 'old', reasoningEffort: 'high', maxTokens: 200, subagentDepth: 3 });
  assert.equal(seam.resolveChildDepth(parent, 3), 3);
  assert.throws(() => seam.resolveChildDepth(parent, 2), seam.SubagentDepthError);
  assert.throws(() => seam.delegationDepthOf({ ...parent, options: { subagentDepth: -1 } }), /non-negative safe integer/);
});
check('descriptor snapshot detaches nested restrictions and first supported record owns replay', () => {
  const input = { mode: 'continuable', provider: 'spawn', label: 'Synthetic child',
    agentProvider: 'chosen', agentModel: 'explicit', agentReasoningEffort: 'medium', toolFilter: { deny: ['never_execute'] } };
  const snapshot = seam.snapshotSubagentDescriptor(input);
  input.toolFilter.deny.push('later_mutation');
  assert.deepEqual(snapshot.toolFilter, { deny: ['never_execute'] });
  const replay = seam.foldSubagentDescriptor([
    { type: 'subagent/descriptor', data: snapshot },
    { type: 'subagent/descriptor', data: { ...snapshot, agentModel: 'later' } },
  ]);
  assert.equal(replay.agentModel, 'explicit');
  assert.equal(replay.agentReasoningEffort, 'medium');
  assert.equal(seam.foldSubagentDescriptor([{ type: 'subagent/descriptor', data: { ...snapshot, version: 999 } }]), undefined);
});
check('permission capture pins approvals and session overrides before later parent changes', () => {
  let current = 'auto';
  let sandbox = 'workspace-write';
  const scoped = { ...parent, ctx: { get: name => ({ permissionPresets: { current: () => current },
    sandboxPolicy: { overrideOf: () => sandbox }, approval: {} })[name] } };
  const captured = seam.captureDelegatedPolicyOverrides(scoped);
  current = 'danger-full-access'; sandbox = 'danger-full-access';
  const events = [];
  seam.appendDelegatedPolicyOverrides({ append: (type, data) => events.push({ type, data }) }, captured);
  assert.deepEqual(events, [
    { type: 'sandbox/mode', data: { mode: 'workspace-write', source: 'delegation' } },
    { type: 'approval/policy', data: { policy: 'never', source: 'delegation' } },
    { type: 'permission/preset', data: { preset: 'auto' } },
  ]);
});
async function serviceProof() {
  const { Context, Service } = load('cordis');
  const { LlmAdapter } = load('dsh-llm');
  const ctx = new Context();
  let parentHandle;
  let receipt;
  let streams = 0;
  let enterStream;
  let releaseStream;
  const entered = new Promise(resolve => { enterStream = resolve; });
  const released = new Promise(resolve => { releaseStream = resolve; });
  const lifecycle = [];
  const mount = async (name, config = {}) => {
    const plugin = load(name);
    const fiber = ctx.plugin(plugin.default || plugin, config);
    await fiber.await();
    assert.equal(fiber.state, 2, `${name} must activate`);
  };
  class FixtureDirectory extends Service {
    constructor(owner) { super(owner, 'workingDirectory'); }
    ensure(_agent, signal) { signal.throwIfAborted(); return Promise.resolve(process.cwd()); }
    set(_session, _cwd) { return Promise.resolve(); }
    get() { return process.cwd(); }
  }
  class FixtureAdapter extends LlmAdapter {
    async listModels(provider) { return [{ provider, id: 'fixture', name: 'Synthetic child fixture' }]; }
    async resolveModel(provider, id) { return { provider, id, name: id }; }
    async *stream() {
      streams++;
      enterStream();
      await released;
      yield { type: 'finish', reason: { kind: 'stop' } };
    }
  }
  try {
    for (const plugin of ['dsh-llm', 'dsh-system-prompt', 'dsh-session-projection', 'dsh-session', 'dsh-agent', 'dsh-tools', 'dsh-agent-loop']) {
      await mount(plugin, plugin === 'dsh-system-prompt' ? { includeHarnessIdentity: false } : plugin === 'dsh-agent-loop' ? { agents: [], maxParallelToolCalls: 1 } : {});
    }
    const directory = ctx.plugin(FixtureDirectory);
    await directory.await();
    await mount('dsh-subagent', { maxDepth: 2, maxActiveSubagents: 1 });
    await mount('dsh-subagent-spawn-in-process', { providerName: 'spawn' });
    await mount('dsh-subagent-fork-in-process', { providerName: 'fork' });
    ctx.llm.registerAdapter(['t02d-fixture'], new FixtureAdapter());
    ctx.on('subagent/start', event => lifecycle.push({ type: 'start', event }));
    ctx.on('subagent/end', event => lifecycle.push({ type: 'end', event }));
    parentHandle = await ctx.agents.create({ sessionId: 't02d-parent', meta: { cwd: process.cwd() },
      agentOptions: { provider: 't02d-fixture', model: 'parent' } });
    const request = { parent: parentHandle.agent, cwd: process.cwd(), maxDepth: 2,
      agentOptions: { provider: 't02d-fixture', model: 'explicit' }, prompt: [{ type: 'text', text: 'Synthetic child admission only' }] };
    assert.equal(ctx.subagents.getProvider('spawn').inheritsParentContext, false);
    assert.equal(ctx.subagents.getProvider('fork').inheritsParentContext, true);
    await assert.rejects(ctx.subagents.startActivation({ provider: 'fork', label: 'Independent fork preset',
      request: { ...request, agentPreset: 'fixture' }, signal: new AbortController().signal, delivery: 'caller' }),
    error => error.code === 'UNSUPPORTED_CAPABILITY');
    await assert.rejects(ctx.subagents.startActivation({ provider: 'spawn', label: 'Unavailable spawn preset',
      request: { ...request, agentPreset: 'fixture' }, signal: new AbortController().signal, delivery: 'caller' }),
    error => error.code === 'PRESET_UNAVAILABLE');
    assert.equal(streams, 0);
    assert.equal(lifecycle.length, 0);
    recordPass('independent presets fail closed on fork and without native preset service');
    await assert.rejects(ctx.subagents.startActivation({ provider: 'spawn', label: 'Depth refused',
      request: { ...request, maxDepth: 0 }, signal: new AbortController().signal, delivery: 'caller' }),
    error => error instanceof seam.SubagentDepthError);
    assert.equal(streams, 0);
    assert.equal(lifecycle.length, 0);
    recordPass('native depth rejection precedes child inference');
    const controller = new AbortController();
    controller.abort('Synthetic pre-admission cancellation');
    await assert.rejects(ctx.subagents.startActivation({ provider: 'spawn', label: 'Cancelled child', request,
      signal: controller.signal, delivery: 'caller' }));
    assert.equal(lifecycle.length, 0);
    assert.equal(parentHandle.agent.session.snapshotEvents().filter(event => event.type === 'subagent/catalog').length, 0);
    assert.equal(streams, 0);
    recordPass('aborted local admission creates no child lifecycle or inference');
    const admittedSignal = new AbortController();
    receipt = await ctx.subagents.startActivation({ provider: 'spawn', label: 'Synthetic explicit child',
      request: flags.includes('--red-drop-route') ? { ...request, agentOptions: undefined } : request,
      signal: admittedSignal.signal, delivery: 'caller' });
    await entered;
    const child = ctx.agents.get(receipt.childId);
    assert.equal(child.options.model, 'explicit');
    assert.equal(child.session.header.delegationDepth, 1);
    assert.equal(child.session.header.parentSession, parentHandle.agent.id);
    assert.equal(lifecycle.filter(event => event.type === 'start').length, 1);
    const descriptor = seam.foldSubagentDescriptor(child.session.snapshotEvents());
    assert.equal(descriptor.agentModel, 'explicit');
    request.agentOptions.model = 'mutated-after-admission';
    assert.equal(descriptor.agentModel, 'explicit');
    assert.equal(child.options.model, 'explicit');
    recordPass('native local service snapshots explicit route and owns child depth');
    await assert.rejects(ctx.subagents.startActivation({ provider: 'spawn', label: 'Over capacity', request,
      signal: new AbortController().signal, delivery: 'caller' }), error => error.code === 'ACTIVATION_LIMIT_REACHED');
    assert.equal(streams, 1);
    assert.equal(lifecycle.filter(event => event.type === 'start').length, 1);
    recordPass('native activation capacity rejects a concurrent sibling without another stream');
    admittedSignal.abort('Caller detached after accepted admission');
    assert.equal(ctx.agents.get(receipt.childId), child);
    releaseStream();
    const settled = await receipt.result;
    assert.equal(settled.stopReason, 'completed');
    assert.equal(ctx.agents.get(receipt.childId), undefined);
    assert.equal(lifecycle.filter(event => event.type === 'end').length, 1);
    assert.equal(lifecycle[0].event.runId, lifecycle[1].event.runId);
    recordPass('post-admission caller abort leaves native completion and paired disposal intact');
    const fork = await ctx.subagents.startActivation({ provider: 'fork', label: 'Synthetic inherited fork',
      request: { ...request, agentOptions: undefined }, signal: new AbortController().signal, delivery: 'caller' });
    const forkResult = await fork.result;
    assert.equal(forkResult.stopReason, 'completed');
    assert.equal(streams, 2);
    assert.equal(ctx.agents.get(fork.childId), undefined);
    assert.equal(lifecycle.filter(event => event.type === 'start').length, 2);
    assert.equal(lifecycle.filter(event => event.type === 'end').length, 2);
    await fork.dispose();
    recordPass('released native capacity admits a local fork and settles it');
  } finally {
    releaseStream();
    if (receipt) await receipt.dispose();
    if (parentHandle) await parentHandle.dispose();
    await ctx.fiber.dispose();
  }
}
// A pending barrier is not success: Node may otherwise exit with an unresolved promise.
const watchdog = setTimeout(() => { console.error('T02D fixture did not settle'); process.exit(1); }, 20000);
serviceProof().then(() => {
  assert.equal(networkAttempts, 0);
  console.log(JSON.stringify({ hostVersion: require(path.join(runtime, 'package.json')).version, results, networkAttempts,
    boundary: 'Synthetic public helper and local service characterization; not enabled production routing or live acceptance.' }));
}).catch(error => { console.error(error); process.exitCode = 1; }).finally(() => clearTimeout(watchdog));
