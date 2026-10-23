#!/usr/bin/env node
'use strict';
/** T02B gate fixture only. No production Auto, accounts, disk persistence or providers.
 * Run with ELECTRON_RUN_AS_NODE=1 '<DSH app executable>' scripts/probe-auto-host.cjs
 * --red-control intentionally disables the fixture's generation capture and MUST fail.
 * Pass the installed runtime tree as first positional argument (not DSH_HOME).
 * DSH_PROBE_RUNTIME is an explicit alternative for direct execution.
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const runtime = process.argv.slice(2).find(value => !value.startsWith('--')) || process.env.DSH_PROBE_RUNTIME;
if (!runtime || !path.isAbsolute(runtime)) throw new Error('Pass an absolute installed DSH runtime path as first argument or DSH_PROBE_RUNTIME');
const load = name => require(path.join(runtime, 'node_modules', '@deepseek-ai', name, 'lib/index.js'));
const redControl = process.argv.includes('--red-control');
let forbiddenNetworkCalls = 0;
const denyNetwork = () => { forbiddenNetworkCalls++; throw new Error('T02B fixture forbids network'); };
globalThis.fetch = denyNetwork;
for (const protocol of ['node:http', 'node:https']) {
  const module = require(protocol);
  module.request = denyNetwork;
  module.get = denyNetwork;
}
const net = require('node:net');
net.connect = net.createConnection = net.Socket.prototype.connect = denyNetwork;
require('node:tls').connect = denyNetwork;
const { Context } = load('cordis');
const { LlmRuntime, LlmAdapter, createUserMessage, textOnlyImageText } = load('dsh-llm');
const { installModelSelection } = load('dsh-agent');
const version = require(path.join(runtime, 'node_modules/@deepseek-ai/dsh-llm/package.json')).version;
const results = [];
const check = async (name, body) => {
  await body();
  results.push({ name, outcome: 'pass' });
  console.log(`PASS ${name}`);
};
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};
const image = Object.freeze({
  type: 'image', attachment: Object.freeze({ attachmentId: `sha256:${'0'.repeat(64)}`,
    mediaType: 'image/png', bytes: 1, width: 1, height: 1, name: 'synthetic-only.png' }),
});
const user = text => createUserMessage({ content: [{ type: 'text', text }], source: { kind: 'user' } });
const controls = { provider: 't02b-auto', model: 'auto' };
const minimalInfo = (provider, id) => ({ provider, id, name: id });
function member(id, contextWindow, inputModalities, efforts = ['low', 'high']) {
  return { id, contextWindow, inputModalities, efforts };
}
function generation(id, members) {
  return Object.freeze({ id, members: structuredClone(members) });
}
// This is deliberately fixture-owned policy, NOT a host-provided intersection API.
function conservativeInfo(snapshot, provider, id) {
  const members = snapshot.members;
  const knownContexts = members.every(item => Number.isSafeInteger(item.contextWindow) && item.contextWindow > 0);
  const knownModalities = members.every(item => Array.isArray(item.inputModalities));
  const commonModalities = knownModalities ? members[0].inputModalities.filter(value => members.every(item => item.inputModalities.includes(value))) : undefined;
  const knownEfforts = members.every(item => Array.isArray(item.efforts));
  const commonEfforts = knownEfforts ? members[0].efforts.filter(value => members.every(item => item.efforts.includes(value))) : [];
  return {
    provider, id, name: 'Synthetic Auto', description: 'T02B in-memory gate fixture only',
    ...(knownContexts ? { context: { contextWindow: Math.min(...members.map(item => item.contextWindow)) } } : {}),
    ...(commonModalities === undefined ? {} : { inputModalities: commonModalities }),
    ...(commonEfforts.length ? { reasoning: { efforts: commonEfforts.map(id => ({ id, name: id })), defaultEffort: commonEfforts[0] } } : {}),
  };
}
class SyntheticAuto extends LlmAdapter {
  constructor(snapshot) { super(); this.current = snapshot; this.dispatches = []; this.preparations = []; }
  providerInfo(provider) { return { id: provider, name: 'T02B fixture' }; }
  async listModels(provider) {
    const { context, reasoning, ...catalog } = conservativeInfo(this.current, provider, 'auto');
    return [catalog];
  }
  async resolveModel(provider, model) { return conservativeInfo(this.current, provider, model); }
  async prepareCall(provider, model, signal) {
    signal?.throwIfAborted();
    const captured = this.current;
    this.preparations.push(captured.id);
    return {
      model: conservativeInfo(captured, provider, model),
      stream: options => this.serve(options, redControl ? this.current : captured),
    };
  }
  async *serve(options, snapshot) {
    this.dispatches.push({ options, generation: snapshot.id, member: snapshot.members[0].id });
    yield { type: 'block-start', index: 0, blockType: 'text' };
    yield { type: 'text-delta', index: 0, text: `synthetic generation ${snapshot.id}` };
    yield { type: 'block-end', index: 0, block: { type: 'text', text: `synthetic generation ${snapshot.id}` } };
    yield { type: 'finish', reason: { kind: 'stop' } };
  }
  stream(options) { return this.serve(options, this.current); }
}
class SyntheticManual extends LlmAdapter {
  constructor() { super(); this.dispatches = []; }
  async listModels(provider) { return [{ provider, id: 'manual', name: 'Synthetic manual' }]; }
  async resolveModel(provider, model) { return minimalInfo(provider, model); }
  async *stream(options) {
    this.dispatches.push(options);
    yield { type: 'block-start', index: 0, blockType: 'text' };
    yield { type: 'text-delta', index: 0, text: 'synthetic manual' };
    yield { type: 'block-end', index: 0, block: { type: 'text', text: 'synthetic manual' } };
    yield { type: 'finish', reason: { kind: 'stop' } };
  }
}
const drain = async stream => {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return chunks;
};
async function mount(ctx, name, config = {}) {
  const fiber = ctx.plugin(load(name).default, config);
  await fiber.await();
  assert.equal(fiber.state, 2, `${name} must reach active Cordis state`);
}
async function main() {
  const ctx = new Context();
  const handles = [];
  try {
    await mount(ctx, 'dsh-llm');
    assert(ctx.llm instanceof LlmRuntime);
    const snapshotA = generation('A', [member('alpha', 8192, ['text', 'image']), member('beta', 4096, ['text'], ['low'])]);
    const adapter = new SyntheticAuto(snapshotA);
    let registration = ctx.llm.registerAdapter(['t02b-auto'], adapter);
    const manual = new SyntheticManual();
    ctx.llm.registerAdapter(['t02b-manual'], manual);
    await check('native registry and catalog preserve Auto identity', async () => {
      assert.deepEqual(ctx.llm.listProviders().map(item => item.id), ['t02b-auto', 't02b-manual']);
      const models = await ctx.llm.listModels('t02b-auto');
      assert.equal(models.length, 1);
      assert.equal(models[0].provider, 't02b-auto');
      assert.equal(models[0].id, 'auto');
      assert.equal(models[0].name, 'Synthetic Auto');
      assert.deepEqual(models[0].inputModalities, ['text']);
      assert.equal(models[0].reasoning, undefined, 'catalog is not exact-model effort API');
      assert.throws(() => ctx.llm.registerAdapter(['t02b-auto'], adapter), { code: 'DUPLICATE_ADAPTER' });
    });
    await check('public browser catalog builder enriches exact reasoning without global defaults', async () => {
      const { buildModelCatalog } = load('dsh-api-session-controller');
      const catalog = await buildModelCatalog(ctx, { provider: 't02b-manual', model: 'manual' });
      assert.deepEqual(catalog.failures, []);
      assert.deepEqual(catalog.default, { provider: 't02b-manual', model: 'manual' });
      const auto = catalog.groups.find(group => group.id === 't02b-auto').models[0];
      assert.equal(auto.id, 'auto');
      assert.equal(auto.name, 'Synthetic Auto');
      assert.deepEqual(auto.reasoning, { efforts: [{ id: 'low', name: 'low' }], defaultEffort: 'low' });
      assert.equal(auto.context, undefined);
      assert.equal(auto.inputModalities, undefined);
      assert.equal(ctx.get('agentDefaultModel'), undefined, 'explicit default avoids a settings service');
    });
    await check('exact metadata conservatively intersects fixture members', async () => {
      const info = await ctx.llm.resolveModelInfo('t02b-auto', 'auto');
      assert.equal(info.context.contextWindow, 4096);
      assert.deepEqual(info.inputModalities, ['text']);
      assert.deepEqual(info.reasoning.efforts.map(item => item.id), ['low']);
      const prepared = await ctx.llm.prepareCall(controls);
      assert.equal(prepared.config.reasoningEffort, 'low');
      assert.equal(prepared.adapterDefaults.reasoningEffort, true);
      assert.equal(prepared.context.contextWindow, 4096);
      assert.equal(Object.isFrozen(prepared.config), true);
    });
    await check('invalid effort rejects before adapter dispatch', async () => {
      const count = adapter.dispatches.length;
      await assert.rejects(ctx.llm.prepareCall({ ...controls, reasoningEffort: 'high' }), { code: 'UNSUPPORTED_REASONING_EFFORT' });
      assert.equal(adapter.dispatches.length, count);
    });
    await check('prepared generation survives alias policy and registry replacement', async () => {
      const prepared = await ctx.llm.prepareCall(controls);
      const replacementSnapshot = generation('B', [member('replacement', 2048, ['text', 'image'], ['high'])]);
      adapter.current = replacementSnapshot;
      registration();
      const replacement = new SyntheticAuto(replacementSnapshot);
      registration = ctx.llm.registerAdapter(['t02b-auto'], replacement);
      const chunks = await drain(prepared.stream({ ...prepared.config, messages: [user('generation capture')] }));
      assert.equal(chunks.at(-1).reason.kind, 'stop');
      assert.equal(adapter.dispatches.at(-1).generation, 'A');
      assert.equal(adapter.dispatches.at(-1).member, 'alpha');
      assert.equal(replacement.dispatches.length, 0);
      assert.equal(prepared.context.contextWindow, 4096);
      assert.equal(prepared.config.reasoningEffort, 'low');
      assert.throws(() => prepared.stream({ ...prepared.config, messages: [] }), { code: 'INVALID_PREPARED_CALL' });
      const next = await ctx.llm.prepareCall(controls);
      assert.equal(next.context.contextWindow, 2048);
      assert.equal(next.config.reasoningEffort, 'high');
      assert.throws(() => next.stream({ ...next.config, model: 'changed', messages: [] }), { code: 'INVALID_PREPARED_CALL' });
      registration();
      adapter.current = snapshotA;
      registration = ctx.llm.registerAdapter(['t02b-auto'], adapter);
    });
    await check('ConfigureCall sees frozen metadata and cannot redirect route', async () => {
      const prepared = await ctx.llm.prepareCall(controls, undefined, (call, info) => {
        assert(Object.isFrozen(call));
        assert(Object.isFrozen(info.reasoning.efforts));
        return { ...call, provider: 'not-registered', model: 'redirect', reasoningEffort: info.reasoning.efforts[0].id, maxTokens: 23 };
      });
      assert.equal(prepared.config.provider, controls.provider);
      assert.equal(prepared.config.model, controls.model);
      assert.equal(prepared.config.maxTokens, 23);
      const abort = new AbortController();
      abort.abort(new Error('synthetic canceled'));
      await assert.rejects(ctx.llm.prepareCall(controls, abort.signal), /synthetic canceled/);
    });
    await check('unknown metadata stays unknown, not proof of image compatibility', async () => {
      adapter.current = generation('unknown', [member('known', 4096, ['text', 'image']), { id: 'unknown' }]);
      const info = await ctx.llm.resolveModelInfo('t02b-auto', 'auto');
      for (const key of ['context', 'reasoning', 'inputModalities']) assert.equal(info[key], undefined);
      await assert.rejects(ctx.llm.prepareCall({ ...controls, reasoningEffort: 'low' }), { code: 'UNSUPPORTED_REASONING_EFFORT' });
      const prepared = await ctx.llm.prepareCall(controls);
      await drain(prepared.stream({ ...prepared.config, messages: [createUserMessage({ content: [image], source: { kind: 'user' } })] }));
      assert.equal(adapter.dispatches.at(-1).options.messages[0].content[0].type, 'image', 'host does not reject/project absent modality metadata');
      adapter.current = snapshotA;
    });
    await check('empty intersections grant no synthetic capability or effort', async () => {
      adapter.current = generation('disjoint', [member('text-only', 4096, ['text'], ['low']), member('image-only', 2048, ['image'], ['high'])]);
      const info = await ctx.llm.resolveModelInfo('t02b-auto', 'auto');
      assert.deepEqual(info.inputModalities, []);
      assert.equal(info.reasoning, undefined);
      assert.equal(info.context.contextWindow, 2048);
      await assert.rejects(ctx.llm.prepareCall({ ...controls, reasoningEffort: 'low' }), { code: 'UNSUPPORTED_REASONING_EFFORT' });
      // An empty modality intersection is not a serviceable candidate set. The
      // host preserves [] but does not reject this route; production eligibility
      // must reject it rather than interpreting [] as text or unknown support.
      const prepared = await ctx.llm.prepareCall(controls);
      assert.deepEqual(prepared.inputModalities, []);
      adapter.current = snapshotA;
    });
    await check('known text-only image projection and tools preserve input history', async () => {
      const original = createUserMessage({ content: [image], source: { kind: 'user' } });
      const abort = new AbortController();
      const tools = [{ name: 'synthetic_tool', description: 'never executed', parameters: { type: 'object', properties: {} } }];
      const prepared = await ctx.llm.prepareCall(controls, abort.signal);
      assert.deepEqual(prepared.inputModalities, ['text'], 'known metadata must be restored before projection');
      await drain(prepared.stream({ ...prepared.config, messages: [original], tools, signal: abort.signal }));
      const sent = adapter.dispatches.at(-1).options;
      assert.equal(sent.messages[0].content[0].type, 'text');
      assert.equal(sent.messages[0].content[0].text, textOnlyImageText(image.attachment));
      assert.equal(original.content[0].type, 'image');
      assert.equal(sent.signal, abort.signal);
      assert.deepEqual(sent.tools, tools);
      adapter.current = generation('image-capable', [member('image', 4096, ['text', 'image'])]);
      const capable = await ctx.llm.prepareCall(controls);
      await drain(capable.stream({ ...capable.config, messages: [original] }));
      assert.deepEqual(adapter.dispatches.at(-1).options.messages[0].content[0], image);
      adapter.current = snapshotA;
    });
    // Real in-memory loop composition: no persistence, FS, attachments, providers,
    // settings, accounts, HTTP server or client API are mounted.
    await mount(ctx, 'dsh-system-prompt', { includeHarnessIdentity: false });
    await mount(ctx, 'dsh-session-projection');
    await mount(ctx, 'dsh-session');
    await mount(ctx, 'dsh-agent');
    await mount(ctx, 'dsh-tools');
    await mount(ctx, 'dsh-agent-loop', { agents: [], maxParallelToolCalls: 1 });
    assert.equal(ctx.get('sessionPersistence'), undefined);
    await check('real loop binds prompt, tools, context and selection per step', async () => {
      const selection = { current: { ...controls, reasoningEffort: 'low' } };
      const assembled = deferred();
      const release = deferred();
      let blockOnce = true;
      let contextValue = 'before preparation';
      let handle;
      handle = await ctx.agents.create({
        sessionId: 't02b-host-memory-only',
        agentOptions: { ...controls, reasoningEffort: 'low' },
        setup(agentCtx) {
          installModelSelection(agentCtx, selection);
          agentCtx.systemPrompt.section({ name: 't02b:route', order: 900, text: 'Selected {{provider}}/{{model}}' });
          agentCtx.systemPrompt.context({ name: 't02b:context', order: 900, text: () => contextValue });
          agentCtx.systemPrompt.tools(() => ({ schemas: [{ name: 'synthetic_tool', description: 'schema only', parameters: { type: 'object', properties: {} } }] }));
          agentCtx.on('system-prompt/assemble', async (_assembly, _context, next) => {
            if (blockOnce) { blockOnce = false; assembled.resolve(); await release.promise; }
            return next();
          });
          agentCtx.on('agent/request', async (_payload, next) => {
            contextValue = 'after preparation';
            return next();
          });
        },
      });
      handles.push(handle);
      const autoBefore = adapter.dispatches.length;
      handle.agent.followup({ content: [{ type: 'text', text: 'coherent first step' }], source: { kind: 'user' } });
      await assembled.promise;
      // Replace, do not mutate, a selection value: the public seam captures the
      // selected object identity before awaiting downstream assembly middleware.
      selection.current = { provider: 't02b-manual', model: 'manual' };
      release.resolve();
      await handle.agent.whenIdle();
      assert.equal(adapter.dispatches.length, autoBefore + 1);
      const request = adapter.dispatches.at(-1).options;
      assert.equal(request.provider, 't02b-auto');
      assert.equal(request.reasoningEffort, 'low');
      assert(request.messages.some(message => message.role === 'system' && message.content.some(block => block.text === 'Selected t02b-auto/auto')));
      assert(request.messages.some(message => message.content.some(block => block.type === 'text' && block.text.includes('after preparation'))));
      assert(request.tools.some(tool => tool.name === 'synthetic_tool'));
      assert(Object.isFrozen(request));
      assert(Object.isFrozen(request.messages));
      assert.equal(handle.agent.session.requestContext().contextWindow, 4096);
      assert.equal(handle.agent.session.requestHeader().config.model, 'auto');
      assert.equal(handle.agent.session.deriveMessages().filter(message => message.role === 'assistant').at(-1).source.model, 'auto');
      const autoAfter = adapter.dispatches.length;
      handle.agent.followup({ content: [{ type: 'text', text: 'manual next step' }], source: { kind: 'user' } });
      await handle.agent.whenIdle();
      assert.equal(adapter.dispatches.length, autoAfter, 'manual selection must bypass Auto entirely');
      const manualRequest = manual.dispatches.at(-1);
      assert.equal(manualRequest.provider, 't02b-manual');
      assert.equal(manualRequest.reasoningEffort, undefined, 'absent selected effort clears persisted/initial effort');
      assert.equal(handle.agent.session.requestContext().contextWindow, undefined, 'unknown new model must not inherit old context');
      assert(manualRequest.messages.some(message => message.role === 'system' && message.content.some(block => block.text === 'Selected t02b-manual/manual')));
      assert(manualRequest.messages.some(message => message.source?.kind === 'model-selection' && message.content.some(block => block.text.includes('[model changed:'))));
      assert.equal(handle.agent.session.requestHeader().config.model, 'manual');
    });
    await check('preparation-only redirect cannot repair an already rendered alias prompt', async () => {
      const selection = { current: { ...controls, reasoningEffort: 'low' } };
      const handle = await ctx.agents.create({
        sessionId: 't02b-late-redirect', agentOptions: controls,
        setup(agentCtx) {
          installModelSelection(agentCtx, selection);
          agentCtx.systemPrompt.section({ name: 't02b:late-route', order: 900, text: 'Selected {{provider}}/{{model}}' });
          agentCtx.on('agent/request', async (_payload, next) => {
            const { reasoningEffort, ...config } = await next();
            return { ...config, provider: 't02b-manual', model: 'manual' };
          }, { prepend: true });
        },
      });
      handles.push(handle);
      handle.agent.followup({ content: [{ type: 'text', text: 'late redirect characterization' }], source: { kind: 'user' } });
      await handle.agent.whenIdle();
      const sent = manual.dispatches.at(-1);
      assert.equal(sent.provider, 't02b-manual');
      assert(sent.messages.some(message => message.role === 'system' && message.content.some(block => block.text === 'Selected t02b-auto/auto')));
      assert.equal(handle.agent.session.requestHeader().config.model, 'manual');
    });
    await check('scoped assembly and request wrappers bind a concrete route while preserving Auto selection', async () => {
      class Concrete extends SyntheticManual {
        async resolveModel(provider, model) {
          return { provider, id: model, name: 'Synthetic concrete target',
            context: { contextWindow: 6144 }, inputModalities: ['text', 'image'],
            reasoning: { efforts: [{ id: 'low', name: 'low' }], defaultEffort: 'low' } };
        }
      }
      const concrete = new Concrete();
      ctx.llm.registerAdapter(['t02b-concrete'], concrete);
      const selection = { current: { ...controls, reasoningEffort: 'low' } };
      let policy = { id: 'C1', route: { provider: 't02b-concrete', model: 'alpha', reasoningEffort: 'low' } };
      const reached = deferred();
      const release = deferred();
      let blockOnce = true;
      let captured;
      let assemblyCount = 0;
      const handle = await ctx.agents.create({
        sessionId: 't02b-concrete-wrappers', agentOptions: controls,
        setup(agentCtx) {
          installModelSelection(agentCtx, selection);
          agentCtx.systemPrompt.section({ name: 't02b:concrete-route', order: 900, text: 'Selected {{provider}}/{{model}}' });
          agentCtx.systemPrompt.section({ name: 't02b:evaluated-early', order: 901,
            text: () => `Provider read before waterfall: ${selection.current.model}` });
          // These are cooperative public scoped waterfalls, not a host patch.
          // Capture Owner intent and the fixture policy before asynchronous work.
          agentCtx.on('system-prompt/assemble', async (_assembly, _context, next) => {
            assemblyCount++;
            const intent = selection.current;
            const snapshot = policy;
            const route = intent.provider === controls.provider && intent.model === controls.model ? snapshot.route : intent;
            captured = { generation: snapshot.id, route: { ...route } };
            const assembled = await next();
            if (blockOnce) { blockOnce = false; reached.resolve(); await release.promise; }
            return { ...assembled, variables: { ...assembled.variables, provider: route.provider, model: route.model } };
          }, { prepend: true });
          agentCtx.on('agent/request', async (_payload, next) => {
            const { reasoningEffort, ...config } = await next();
            if (process.argv.includes('--red-concrete-route')) return { ...config, ...(reasoningEffort === undefined ? {} : { reasoningEffort }) };
            return { ...config, ...captured.route };
          }, { prepend: true });
        },
      });
      handles.push(handle);
      const autoDispatches = adapter.dispatches.length;
      handle.agent.followup({ content: [{ type: 'text', text: 'concrete route with Auto intent' }], source: { kind: 'user' } });
      await reached.promise;
      assert.equal(selection.current.model, 'auto', 'routing must not overwrite Owner intent');
      policy = { id: 'C2', route: { provider: 't02b-concrete', model: 'beta', reasoningEffort: 'low' } };
      selection.current = { provider: 't02b-manual', model: 'manual' };
      release.resolve();
      await handle.agent.whenIdle();
      assert.equal(concrete.dispatches.length, 1, 'native request must dispatch the concrete target');
      const sent = concrete.dispatches[0];
      assert.equal(sent.provider, 't02b-concrete');
      assert.equal(sent.model, 'alpha');
      assert.equal(sent.reasoningEffort, 'low');
      const systemText = sent.messages.filter(message => message.role === 'system').flatMap(message => message.content).map(block => block.text).join('\n');
      assert(systemText.includes('Selected t02b-concrete/alpha'));
      assert(systemText.includes('Provider read before waterfall: auto'), 'post-assembly variables cannot rerun already evaluated providers');
      assert.equal(handle.agent.session.requestHeader().config.model, 'alpha');
      assert.equal(handle.agent.session.requestContext().contextWindow, 6144);
      const answer = handle.agent.session.deriveMessages().filter(message => message.role === 'assistant').at(-1);
      assert(answer, JSON.stringify(handle.agent.session.snapshotEvents().filter(event => ['assistant/attempt', 'turn/end', 'step/end'].includes(event.type))));
      assert.equal(answer.source.provider, 't02b-concrete');
      assert.equal(answer.source.model, 'alpha');
      assert.equal(captured.generation, 'C1');
      assert.equal(selection.current.model, 'manual', 'new Owner intent must survive old prepared work');
      assert.equal(adapter.dispatches.length, autoDispatches, 'no recursive alias dispatch');
      // A concurrent/new manual intent must bypass Auto on the next step.
      selection.current = { provider: 't02b-manual', model: 'manual' };
      handle.agent.followup({ content: [{ type: 'text', text: 'manual after concrete Auto' }], source: { kind: 'user' } });
      await handle.agent.whenIdle();
      assert.equal(concrete.dispatches.length, 1);
      const sentManual = manual.dispatches.at(-1);
      assert.equal(sentManual.reasoningEffort, undefined);
      assert(sentManual.messages.some(message => message.role === 'system' && message.content.some(block => block.text.includes('Selected t02b-manual/manual'))));
      assert.equal(handle.agent.session.requestHeader().config.model, 'manual');
      assert.equal(handle.agent.session.requestContext().contextWindow, undefined);
      assert.equal(assemblyCount, 2);
    });
    await check('fixture attempted zero network calls and mounted no persistence', async () => {
      assert.equal(forbiddenNetworkCalls, 0);
      assert.equal(ctx.get('sessionPersistence'), undefined);
      assert.equal(ctx.get('credentials'), undefined);
      assert.equal(ctx.get('attachments'), undefined);
    });
    console.log(JSON.stringify({ kind: 't02b-host-proof', runtime, version, redControl, passed: results.length, forbiddenNetworkCalls, results, limitations: [
      'Fixture policy intersections are not host policy APIs; absence is unknown and host does not prove compatibility.',
      'No provider wire, actual image bytes, attachment normalization, account state, persistence, HTTP/remote authority, retry or real client picker exercised.',
      'Alias-only adapter preparation retains Auto identity. Scoped assembly/request middleware proves concrete identity with a fixture selection holder, not the real Session-controller selection store or mounted picker.',
      'Assembly registry providers run before the waterfall; post-assembly variables do not rerun route-sensitive section/tool providers. Full real-contributor coherence, retries/revocation, resume and middleware coexistence remain unproved.',
      'No generic tools-supported capability field exists in the exercised metadata; toolUpdate is a declaration-update protocol, not proof of tool execution support.',
      'Unknown modalities and empty modality intersections are not rejected by host preparation; future Auto eligibility policy must fail closed rather than claim compatibility.',
      'installModelSelection captures a selected object reference, so fixture replaces selection.current rather than mutating the selected value.',
    ] }, null, 2));
  } finally {
    for (const handle of handles.reverse()) await handle.dispose();
    await ctx.fiber.dispose();
  }
}
main().catch(error => { console.error(error.stack); process.exitCode = 1; });
