#!/usr/bin/env node
'use strict';
// One bounded registered-tool admission proof; no real inference or host patching.
const assert = require('node:assert/strict');
const path = require('node:path');
const runtime = process.argv[2];
const flags = process.argv.slice(3);
assert(runtime && path.isAbsolute(runtime));
assert(flags.every(flag => ['--red-no-persistence', '--red-advertise-explicit'].includes(flag)));
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
const { Context, Service } = load('cordis');
const { LlmAdapter } = load('dsh-llm');
const { foldSubagentDescriptor } = load('dsh-subagent');
const ctx = new Context();
const lifecycle = [];
const metadata = [];
const inventoryRequests = [];
let streams = 0;
let parent;
let readHandle;
let releaseStream;
let enterStream;
const released = new Promise(resolve => { releaseStream = resolve; });
const entered = new Promise(resolve => { enterStream = resolve; });
class FixtureDirectory extends Service {
  constructor(owner) { super(owner, 'workingDirectory'); }
  ensure(_agent, signal) { signal.throwIfAborted(); return Promise.resolve(process.cwd()); }
  set() { return Promise.resolve(); }
  get() { return process.cwd(); }
}
class FixtureSelection extends Service {
  constructor(owner) { super(owner, 'subagentModelSelection'); }
  current() { return { enabled: true, allowedModels: [{ provider: 't02d-fixture', model: 'explicit' }] }; }
}
class FixtureAdapter extends LlmAdapter {
  async listModels(provider) {
    inventoryRequests.push(provider);
    return [
      { provider, id: 'disallowed-decoy', name: 'Disallowed decoy' },
      ...(flags.includes('--red-advertise-explicit') ? [{ provider, id: 'explicit', name: 'Explicit' }] : []),
    ];
  }
  async resolveModel(provider, id) {
    metadata.push({ provider, id });
    return { provider, id, name: id, reasoning: {
      efforts: [{ id: 'low', name: 'Low' }], defaultEffort: 'low',
    } };
  }
  async *stream() {
    streams++;
    enterStream();
    await released;
    yield { type: 'finish', reason: { kind: 'stop' } };
  }
}
async function mount(name, config = {}) {
  const plugin = load(name);
  const fiber = ctx.plugin(plugin.default || plugin, config);
  await fiber.await();
  assert.equal(fiber.state, 2, `${name} must activate`);
}
async function proof() {
  try {
    for (const plugin of ['dsh-llm', 'dsh-system-prompt', 'dsh-session-projection', 'dsh-session', 'dsh-agent', 'dsh-tools', 'dsh-agent-loop']) {
      await mount(plugin, plugin === 'dsh-system-prompt' ? { includeHarnessIdentity: false } : plugin === 'dsh-agent-loop' ? { agents: [], maxParallelToolCalls: 1 } : {});
    }
    // Official public backend; all files stay beneath the runner's generated temporary HOME.
    assert.equal(process.env.HOME, process.cwd());
    assert.equal(process.env.DSH_HOME, process.cwd());
    if (!flags.includes('--red-no-persistence')) {
      await mount('dsh-session-persistence-jsonl', { root: path.join(process.cwd(), 'sessions'), compression: 'none' });
    }
    for (const service of [FixtureDirectory, FixtureSelection]) await ctx.plugin(service).await();
    await mount('dsh-subagent', { maxDepth: 2, maxActiveSubagents: 1 });
    await mount('dsh-subagent-spawn-in-process', { providerName: 'spawn' });
    ctx.llm.registerAdapter(['t02d-fixture'], new FixtureAdapter());
    ctx.on('subagent/start', event => lifecycle.push({ type: 'start', event }));
    ctx.on('subagent/end', event => lifecycle.push({ type: 'end', event }));
    parent = await ctx.agents.create({ sessionId: 't02d-persisted-parent', meta: { cwd: process.cwd() },
      agentOptions: { provider: 't02d-fixture', model: 'parent' } });
    const nativeTool = load('dsh-tool-subagent');
    const toolScope = ctx.inject(nativeTool.inject, owner => nativeTool.apply(owner, {
      provider: 'spawn', toolName: 't02d_delegate', modelSelectionSettings: true,
      agentOptions: { provider: 't02d-fixture', model: 'configured', reasoningEffort: 'high' },
    }, parent.agent.session));
    await toolScope.await();
    assert.equal(toolScope.state, 2);
    const discovery = ctx.tools.get('list_subagent_models');
    assert.ok(discovery, 'Actual exported native discovery tool must be registered');
    const discoveryExec = { agent: parent.agent, signal: new AbortController().signal };
    const advertised = await discovery.execute({ provider: 't02d-fixture' }, discoveryExec);
    assert.equal(advertised, '(no advertised models for t02d-fixture)',
      'Public listing must omit unlisted explicit and filter the disallowed decoy');
    assert.deepEqual(inventoryRequests, ['t02d-fixture'], 'Public discovery must query adapter inventory');
    assert.deepEqual(metadata, [], 'Provider listing must not resolve exact model metadata');
    assert.equal(streams, 0, 'Inventory discovery must not start inference');
    const exact = await discovery.execute({ provider: 't02d-fixture', model: 'explicit' }, discoveryExec);
    assert.equal(exact, 't02d-fixture/explicit — explicit\nReasoning efforts:\nlow (default) — Low');
    assert.deepEqual(metadata, [{ provider: 't02d-fixture', id: 'explicit' }],
      'Exact discovery must resolve the allowed unlisted route');
    assert.equal(streams, 0, 'Exact-model discovery must not start inference');
    const definition = ctx.tools.get('t02d_delegate');
    assert.ok(definition, 'Actual exported native tool must be registered');
    const result = await definition.execute({ description: 'Synthetic persisted child', prompt: 'No real inference',
      provider: 't02d-fixture', model: 'explicit' }, { agent: parent.agent, signal: new AbortController().signal });
    assert.equal(result.kind, 'activation');
    assert.equal(typeof result.subagentId, 'string');
    await entered;
    const child = ctx.agents.get(result.subagentId);
    assert.ok(child, 'Native tool must return an admitted live child');
    assert.equal(child.options.provider, 't02d-fixture');
    assert.equal(child.options.model, 'explicit');
    assert.equal(child.options.reasoningEffort, undefined, 'Route change clears configured high');
    assert.equal(child.session.header.parentSession, parent.agent.id);
    assert.equal(child.session.header.delegationDepth, 1);
    assert.equal(streams, 1);
    assert.equal(lifecycle.filter(row => row.type === 'start').length, 1);
    await ctx.sessionPersistence.flush();
    readHandle = await ctx.sessionPersistence.open(result.subagentId, 'read');
    assert.equal(readHandle.header.parentSession, parent.agent.id);
    const stored = await readHandle.read();
    const descriptor = foldSubagentDescriptor(stored.events);
    assert.ok(descriptor, 'Actual persistence must contain the native child descriptor');
    assert.equal(descriptor.version, 3);
    assert.equal(descriptor.mode, 'continuable');
    assert.equal(descriptor.provider, 'spawn');
    assert.equal(descriptor.label, 'Synthetic persisted child');
    assert.equal(descriptor.agentProvider, 't02d-fixture');
    assert.equal(descriptor.agentModel, 'explicit');
    assert.equal(descriptor.agentReasoningEffort, undefined);
    assert.deepEqual(metadata[0], { provider: 't02d-fixture', id: 'explicit' });
    const catalog = parent.agent.session.snapshotEvents().filter(event => event.type === 'subagent/catalog');
    assert.ok(catalog.length > 0, 'Native parent delivery must establish the parent catalog');
  } finally {
    releaseStream();
    if (readHandle) await readHandle.close();
    if (parent) await ctx.subagents.drainDescendants([parent.agent]);
    if (lifecycle.some(row => row.type === 'start')) {
      const starts = lifecycle.filter(row => row.type === 'start');
      const ends = lifecycle.filter(row => row.type === 'end');
      assert.equal(ends.length, starts.length, 'Cleanup must pair each native child start/end');
      assert.equal(ends[0].event.runId, starts[0].event.runId);
    }
    if (parent) await parent.dispose();
    await ctx.fiber.dispose();
  }
}
const watchdog = setTimeout(() => { console.error('T02D parent-delivery fixture did not settle'); process.exit(1); }, 20000);
proof().then(() => {
  assert.equal(networkAttempts, 0);
  console.log('PASS registered native tool admits parent-delivery child with actual JSONL persistence and stored descriptor');
  console.log('PASS registered discovery filters advisory inventory and resolves allowed unlisted model efforts without inference');
  console.log('PASS cleanup pairs native child lifecycle');
  console.log(JSON.stringify({ hostVersion: require(path.join(runtime, 'package.json')).version,
    checks: 2, streams, networkAttempts, boundary: 'Synthetic advisory inventory discovery plus native parent-delivery admission and persisted descriptor only; not completion notification, cold resume, positive preset/actual permission acceptance, enabled routing or whole #7 acceptance.' }));
}).catch(error => { console.error(error); process.exitCode = 1; }).finally(() => clearTimeout(watchdog));
