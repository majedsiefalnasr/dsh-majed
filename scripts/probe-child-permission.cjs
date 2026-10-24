#!/usr/bin/env node
'use strict';
// Approved seams: public native child admission, Tools.execute, ApprovalService and events.
// No host patch, operational storage, real inference, or filesystem confinement claim.
const assert = require('node:assert/strict');
const path = require('node:path');
const runtime = process.argv[2];
const flags = process.argv.slice(3);
assert(runtime && path.isAbsolute(runtime), 'Pass the absolute installed DSH runtime');
assert(flags.every(flag => flag === '--red-late-approval'), 'Only the named negative control is supported');
let networkAttempts = 0;
const deny = () => { networkAttempts++; throw new Error('T02D permission probe forbids network'); };
globalThis.fetch = deny;
for (const protocol of ['node:http', 'node:https']) {
  const api = require(protocol);
  api.request = api.get = deny;
}
const net = require('node:net');
net.connect = net.createConnection = net.Socket.prototype.connect = deny;
require('node:tls').connect = deny;
const load = name => require(path.join(runtime, 'node_modules/@deepseek-ai', name, 'lib/index.js'));
const results = [];
function pass(name) { results.push(name); console.log(`PASS ${name}`); }
async function proof() {
  const { Context, Service } = load('cordis');
  const { LlmAdapter } = load('dsh-llm');
  const { defineTool } = load('dsh-tools');
  const { setApprovalPolicy } = load('dsh-user-approval');
  const ctx = new Context();
  let parentHandle;
  let receipt;
  let enterStream;
  let releaseStream;
  let streams = 0;
  const entered = new Promise(resolve => { enterStream = resolve; });
  const released = new Promise(resolve => { releaseStream = resolve; });
  const bodies = [];
  const answererCalls = [];
  const gateCalls = [];
  const mount = async (name, config = {}) => {
    const plugin = load(name);
    const fiber = ctx.plugin(plugin.default || plugin, config);
    await fiber.await();
    assert.equal(fiber.state, 2, `${name} must activate`);
  };
  class FixtureDirectory extends Service {
    constructor(owner) { super(owner, 'workingDirectory'); }
    ensure(_agent, signal) { signal.throwIfAborted(); return Promise.resolve(process.cwd()); }
    set() { return Promise.resolve(); }
    get() { return process.cwd(); }
  }
  class FixtureAdapter extends LlmAdapter {
    async *stream() {
      streams++;
      enterStream();
      await released;
      yield { type: 'finish', reason: { kind: 'stop' } };
    }
  }
  try {
    for (const plugin of ['dsh-llm', 'dsh-system-prompt', 'dsh-session-projection', 'dsh-session', 'dsh-agent', 'dsh-tools', 'dsh-agent-loop']) {
      await mount(plugin, plugin === 'dsh-system-prompt' ? { includeHarnessIdentity: false } :
        plugin === 'dsh-agent-loop' ? { agents: [], maxParallelToolCalls: 1 } : {});
    }
    const directory = ctx.plugin(FixtureDirectory);
    await directory.await();
    assert.equal(directory.state, 2);
    // Sensitivity control changes only service-mount timing, never assertions or host code.
    if (!flags.includes('--red-late-approval')) await mount('dsh-user-approval', { policy: 'ask' });
    await mount('dsh-subagent', { maxDepth: 2, maxActiveSubagents: 1 });
    await mount('dsh-subagent-spawn-in-process', { providerName: 'spawn' });
    ctx.llm.registerAdapter(['t02d-permission-fixture'], new FixtureAdapter());
    ctx.on('tools/pre-execute', async (exec, next) => {
      if (exec.name !== 't02d_sentinel') return next();
      gateCalls.push(exec.arguments.operation);
      return exec.arguments.operation === 'restricted' ? { kind: 'ask', reason: 'Fixture restricted operation' } : next();
    });
    ctx.on('approval/request', async req => {
      answererCalls.push({ toolName: req.toolName, callId: req.callId });
      return 'allowed-once';
    });
    ctx.tools.register(defineTool({
      name: 't02d_sentinel', description: 'Isolated in-memory permission sentinel',
      parameters: { operation: { type: 'string', enum: ['allowed', 'restricted'] } },
      output: { schema: { type: 'string' }, render: (_args, value) => [{ type: 'text', text: value }] },
      execute: async args => { bodies.push(args.operation); return `sentinel:${args.operation}`; },
    }));
    parentHandle = await ctx.agents.create({ sessionId: 't02d-permission-parent', meta: { cwd: process.cwd() },
      agentOptions: { provider: 't02d-permission-fixture', model: 'parent' } });
    receipt = await ctx.subagents.startActivation({ provider: 'spawn', label: 'Synthetic permission child',
      request: { parent: parentHandle.agent, cwd: process.cwd(), maxDepth: 2,
        agentOptions: { provider: 't02d-permission-fixture', model: 'explicit' },
        prompt: [{ type: 'text', text: 'Hold synthetic native turn for permission probe' }] },
      signal: new AbortController().signal, delivery: 'caller' });
    await entered;
    if (flags.includes('--red-late-approval')) await mount('dsh-user-approval', { policy: 'ask' });
    const child = ctx.agents.get(receipt.childId);
    assert.ok(child);
    assert.equal(child.options.model, 'explicit');
    assert.equal(streams, 1);
    const turnEvents = child.session.snapshotEvents().filter(event => event.type === 'turn/start' || event.type === 'turn/end');
    assert.equal(turnEvents.at(-1)?.type, 'turn/start', 'Actual child loop must hold an open native turn');
    pass('actual explicitly routed child holds its native turn without a fabricated turn');
    const invoke = (operation, callId) => ctx.tools.execute({ name: 't02d_sentinel', arguments: { operation }, callId,
      agent: child, signal: new AbortController().signal });
    const allowed = await invoke('allowed', 't02d-allowed');
    assert.ok(!allowed.isError, JSON.stringify(allowed));
    assert.deepEqual(bodies, ['allowed']);
    assert.deepEqual(answererCalls, []);
    pass('actual ToolRuntime dispatches the allowed sentinel exactly once');
    const restricted = await invoke('restricted', 't02d-restricted');
    assert.equal(restricted.isError, true, 'Ask-gated sentinel must be denied before body dispatch');
    assert.match(restricted.error.message, /the user rejected tool "t02d_sentinel"/);
    assert.deepEqual(bodies, ['allowed'], 'Denied operation must not change sentinel body state');
    assert.deepEqual(answererCalls, [], 'Native never policy must short-circuit even a willing granting answerer');
    assert.deepEqual(gateCalls, ['allowed', 'restricted']);
    assert.equal(ctx.approval.effectivePolicy(parentHandle.agent.session), 'ask');
    assert.equal(ctx.approval.effectivePolicy(child.session), 'never');
    const events = child.session.snapshotEvents();
    assert.deepEqual(events.filter(event => event.type === 'approval/policy').map(event => event.data),
      [{ policy: 'never', source: 'delegation' }]);
    const asked = events.filter(event => event.type === 'approval/asked');
    const decided = events.filter(event => event.type === 'approval/decided');
    assert.equal(asked.length, 1);
    assert.equal(asked[0].data.callId, 't02d-restricted');
    assert.equal(asked[0].data.toolName, 't02d_sentinel');
    assert.deepEqual(decided.map(event => event.data), [{ id: asked[0].data.id, outcome: 'rejected' }]);
    pass('delegated native never policy denies ask before answerer or body and records paired audit');
    // A public policy switch checks that this same fixture answerer really can grant.
    setApprovalPolicy(child.session, 'ask');
    const granted = await invoke('restricted', 't02d-grant-control');
    assert.ok(!granted.isError, JSON.stringify(granted));
    assert.deepEqual(bodies, ['allowed', 'restricted']);
    assert.deepEqual(answererCalls, [{ toolName: 't02d_sentinel', callId: 't02d-grant-control' }]);
    assert.equal(ctx.approval.effectivePolicy(parentHandle.agent.session), 'ask');
    pass('public ask policy positive control reaches the willing answerer and dispatches');
    releaseStream();
    assert.equal((await receipt.result).stopReason, 'completed');
    assert.equal(ctx.agents.get(receipt.childId), undefined);
    pass('native child completes and disposes after the held stream is released');
  } finally {
    releaseStream();
    if (receipt) await receipt.dispose();
    if (parentHandle) await parentHandle.dispose();
    await ctx.fiber.dispose();
  }
}
const watchdog = setTimeout(() => { console.error('T02D permission fixture did not settle'); process.exit(1); }, 20000);
proof().then(() => {
  assert.equal(networkAttempts, 0);
  console.log(JSON.stringify({ hostVersion: require(path.join(runtime, 'package.json')).version, results, networkAttempts,
    boundary: 'Native approval enforcement for a fixture ask-gated tool, not filesystem confinement or live routing acceptance.' }));
}).catch(error => { console.error(error); process.exitCode = 1; }).finally(() => clearTimeout(watchdog));
