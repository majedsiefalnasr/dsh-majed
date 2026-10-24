#!/usr/bin/env node
'use strict';
// Public native registry, Loader, persona and spawn; synthetic inference only.
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const runtime = process.argv[2];
const flags = process.argv.slice(3);
assert(runtime && path.isAbsolute(runtime));
assert(flags.every(flag => flag === '--red-inherit-preset'));
assert.equal(process.env.HOME, process.cwd());
assert.equal(process.env.DSH_HOME, process.cwd());
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
const modulePath = name => path.join(runtime, 'node_modules/@deepseek-ai', name, 'lib/index.js');
const load = name => require(modulePath(name));
const { Context, Service } = load('cordis');
const { LlmAdapter } = load('dsh-llm');
const { scopeOf } = load('dsh-scope');
const { SubagentDepthError } = load('dsh-subagent');
const ctx = new Context();
const lifecycle = [];
let parent;
let receipt;
let streams = 0;
let enterStream;
let releaseStream;
const entered = new Promise(resolve => { enterStream = resolve; });
const released = new Promise(resolve => { releaseStream = resolve; });
class FixtureDirectory extends Service {
  constructor(owner) { super(owner, 'workingDirectory'); }
  ensure(_agent, signal) { signal.throwIfAborted(); return Promise.resolve(process.cwd()); }
  set() { return Promise.resolve(); }
  get() { return process.cwd(); }
}
class FixtureAdapter extends LlmAdapter {
  async listModels(provider) { return [{ provider, id: 'explicit', name: 'Synthetic fixture' }]; }
  async resolveModel(provider, id) {
    return { provider, id, name: id, reasoning: { efforts: [{ id: 'low', name: 'Low' }], defaultEffort: 'low' } };
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
async function persona(agent) {
  const assembly = await ctx.systemPrompt.assemble({ scope: scopeOf(agent.ctx), agent });
  return assembly.sections.find(section => section.name === 'deployment:persona-prefix').text;
}
async function proof() {
  try {
    for (const plugin of ['dsh-llm', 'dsh-system-prompt', 'dsh-session-projection', 'dsh-session', 'dsh-agent', 'dsh-tools', 'dsh-agent-loop']) {
      await mount(plugin, plugin === 'dsh-system-prompt' ? { includeHarnessIdentity: false, personaPrefix: 'Global deployment' } :
        plugin === 'dsh-agent-loop' ? { agents: [], maxParallelToolCalls: 1 } : {});
    }
    await mount('cordis-plugin-loader', { baseUrl: pathToFileURL(path.join(runtime, 'package.json')).href });
    await mount('dsh-agent-preset-registry', { default: 'parent-preset' });
    for (const [id, prefix] of [['parent-preset', 'Parent composition'], ['child-preset', 'Requested child composition']]) {
      await mount('dsh-agent-preset', { id, plugins: [{ name: modulePath('dsh-persona'), config: { prefix } }] });
    }
    assert.deepEqual(await ctx.agentPresets.resolve('child-preset'), { id: 'child-preset' });
    await ctx.plugin(FixtureDirectory).await();
    await mount('dsh-subagent', { maxDepth: 1, maxActiveSubagents: 1 });
    await mount('dsh-subagent-spawn-in-process', { providerName: 'spawn' });
    ctx.llm.registerAdapter(['t02d-fixture'], new FixtureAdapter());
    ctx.on('subagent/start', event => lifecycle.push({ type: 'start', event }));
    ctx.on('subagent/end', event => lifecycle.push({ type: 'end', event }));
    parent = await ctx.agents.create({ sessionId: 't02d-preset-parent', meta: { cwd: process.cwd(), agentPreset: 'parent-preset' },
      agentOptions: { provider: 't02d-fixture', model: 'parent', reasoningEffort: 'high' },
      setup: async owner => { await ctx.agentPresets.mount(owner, 'parent-preset'); } });
    assert.equal(await persona(parent.agent), 'Parent composition');
    const request = { parent: parent.agent, cwd: process.cwd(), maxDepth: 1,
      agentPreset: flags.includes('--red-inherit-preset') ? undefined : 'child-preset',
      agentOptions: { provider: 't02d-fixture', model: 'explicit', reasoningEffort: 'low' },
      prompt: [{ type: 'text', text: 'Synthetic preset ownership only' }] };
    receipt = await ctx.subagents.startActivation({ provider: 'spawn', label: 'Native preset child', request,
      signal: new AbortController().signal, delivery: 'caller' });
    await entered;
    const child = ctx.agents.get(receipt.childId);
    assert.ok(child, 'Native spawn must publish a live child');
    assert.equal(await persona(child), 'Requested child composition');
    assert.equal(ctx.agentPresets.composedPreset(child.ctx), 'child-preset');
    assert.equal(child.session.header.agentPreset, 'child-preset');
    const compositions = ctx.agentPresets.inspectCompositions(child.ctx);
    assert.equal(compositions.length, 1);
    assert.equal(compositions[0].id, 'child-preset');
    assert.deepEqual(compositions[0].leakedServices, []);
    assert.deepEqual(compositions[0].modules.map(row => row.moduleName), [modulePath('dsh-persona')]);
    assert.equal(child.options.provider, 't02d-fixture');
    assert.equal(child.options.model, 'explicit');
    assert.equal(child.options.reasoningEffort, 'low');
    assert.equal(child.session.header.parentSession, parent.agent.id);
    assert.equal(child.session.header.delegationDepth, 1);
    assert.equal(streams, 1);
    assert.equal(lifecycle.filter(row => row.type === 'start').length, 1);
    assert.equal(await persona(parent.agent), 'Parent composition');
    assert.equal(ctx.agentPresets.composedPreset(parent.agent.ctx), 'parent-preset');
    console.log('PASS native requested preset composition survives explicit caller child model/effort without changing parent');
    await assert.rejects(ctx.subagents.startActivation({ provider: 'spawn', label: 'Depth refused',
      request: { ...request, parent: child }, signal: new AbortController().signal, delivery: 'caller' }),
    error => error instanceof SubagentDepthError);
    assert.equal(streams, 1);
    assert.equal(lifecycle.length, 1);
    console.log('PASS native depth cutoff rejects descendant without another stream or lifecycle');
    releaseStream();
    const settled = await receipt.result;
    assert.equal(settled.stopReason, 'completed');
    assert.equal(ctx.agents.get(receipt.childId), undefined);
    assert.equal(lifecycle.length, 2);
    assert.equal(lifecycle[1].type, 'end');
    assert.equal(lifecycle[0].event.runId, lifecycle[1].event.runId);
    assert.equal(await persona(parent.agent), 'Parent composition');
    console.log('PASS native completion removes child and pairs lifecycle while parent composition remains');
  } finally {
    releaseStream();
    if (receipt) await receipt.dispose();
    if (parent) await parent.dispose();
    await ctx.fiber.dispose();
  }
}
const watchdog = setTimeout(() => { console.error('T02D preset fixture did not settle'); process.exit(1); }, 20000);
proof().then(() => {
  assert.equal(networkAttempts, 0);
  console.log(JSON.stringify({ hostVersion: require(path.join(runtime, 'package.json')).version, checks: 3, streams, networkAttempts,
    boundary: 'Native positive preset/persona composition, caller route/effort, depth and lifecycle only; no real inference, actual permission proof, cold resume or whole T02D acceptance.' }));
}).catch(error => { console.error(error); process.exitCode = 1; }).finally(() => clearTimeout(watchdog));
