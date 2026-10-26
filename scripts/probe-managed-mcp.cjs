const assert = require('node:assert/strict');
const fs = require('node:fs');
const { join, basename } = require('node:path');
const { pathToFileURL } = require('node:url');
const { syncBuiltinESMExports } = require('node:module');
assert.equal(process.env.DSH_MANAGED_MCP_PROBE, '1');
const home = fs.realpathSync(process.env.HOME);
assert.ok(basename(home).startsWith('dsh-managed-mcp-'));
assert.equal(fs.realpathSync(process.cwd()), home); assert.equal(fs.realpathSync(process.env.DSH_HOME), home);
const [base, remoteFile] = process.argv.slice(2);
const fixture = join(__dirname, 'fixture-managed-mcp.cjs');
const forbidden = () => { throw Error('Managed MCP probe forbids unowned I/O.'); };
for (const name of ['node:http', 'node:https']) for (const key of ['request', 'get']) require(name)[key] = forbidden;
require('node:net').Socket.prototype.connect = forbidden; require('node:net').Server.prototype.listen = forbidden; require('node:tls').connect = forbidden;
for (const key of ['send', 'bind', 'connect']) require('node:dgram').Socket.prototype[key] = forbidden;
for (const dns of [require('node:dns'), require('node:dns/promises')]) for (const key of Object.keys(dns)) if (typeof dns[key] === 'function') dns[key] = forbidden;
const cp = require('node:child_process'), spawn = cp.spawn, children = [];
cp.spawn = (command, args, options) => {
  assert.equal(command, process.execPath); assert.equal(args[0], fixture); assert.ok(args.length <= 2);
  assert.equal(options.env.HOME, home); assert.equal(options.env.DSH_MANAGED_MCP_FIXTURE, '1');
  assert.ok(options.cwd === home || options.cwd === join(home, 'project'));
  assert.ok(children.length < 30);
  const child = spawn(command, args, options); const closed = new Promise(resolve => child.once('close', resolve)); children.push({ child, closed }); return child;
};
for (const key of ['spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']) cp[key] = forbidden;
global.fetch = forbidden; global.WebSocket = forbidden; syncBuiltinESMExports();
const load = name => require(join(base, 'node_modules/@deepseek-ai', name, 'lib/index.js'));
let checkpoint = 'native-carrier';
async function main() {
  const carrier = await require('./native-workflow-carrier.cjs').mountNativeCarrier(base, remoteFile);
  const { Service } = load('cordis');
  try {
    const { Loader } = load('cordis-plugin-loader');
    carrier.ctx.baseUrl = pathToFileURL(base + '/').href;
    await carrier.mount({ apply(context) { new Loader(context, { baseUrl: pathToFileURL(base + '/').href }); } });
    const imported = await carrier.ctx.get('loader').import('@deepseek-ai/dsh-mcp-client');
    assert.equal(imported.apply, load('dsh-mcp-client').apply, 'Public Loader must return the actual host namespace instance');
    const unit = { async loadAll() { return { global: null, tables: { workspaces: {} } }; }, async setGlobal() {}, async putRecord() {}, async deleteRecord() {}, async close() {} };
    class Storage extends Service { constructor(ctx) { super(ctx, 'storage'); } backend = { get() { return { kv: { async open() { return unit; } } }; } }; }
    await carrier.mount({ apply(ctx) { new Storage(ctx); } });
    const { DomainFacility } = load('dsh-storage-domain');
    await carrier.mount({ inject: ['storage'], apply(ctx) { const facility = new DomainFacility(ctx, { backend: 'fixture' }); ctx.provide('storageDomain', facility); ctx.effect(() => () => facility.closeAll()); } });
    for (const name of ['dsh-llm', 'dsh-system-prompt', 'dsh-session-projection', 'dsh-session', 'dsh-agent', 'dsh-tools', 'dsh-agent-loop', 'dsh-session-persistence-jsonl', 'dsh-workspace']) {
      const plugin = load(name); await carrier.mount(plugin.default || plugin, name === 'dsh-agent-loop' ? { agents: [], maxParallelToolCalls: 1 } : name === 'dsh-system-prompt' ? { includeHarnessIdentity: false } : name === 'dsh-session-persistence-jsonl' ? { root: join(home, 'sessions'), compression: 'none' } : {});
    }
    checkpoint = 'native-agents';
    const project = join(home, 'project'); fs.mkdirSync(project);
    const workspace = await carrier.ctx.workspaceRegistry.create(project);
    const agent = await carrier.ctx.agents.create({ sessionId: 'project-agent', meta: { cwd: project }, agentOptions: { provider: 'fixture', model: 'fixture' } });
    await workspace.attachSession('project-agent');
    const other = await carrier.ctx.agents.create({ sessionId: 'other-agent', meta: { cwd: home }, agentOptions: { provider: 'fixture', model: 'fixture' } });
    const { apply } = await import(pathToFileURL(join(__dirname, '../index.js')).href);
    const options = { managedMcp: { enabled: true, standaloneDisabled: true, stateDirectory: join(home, 'state'), userDirectory: home } };
    let product = await carrier.mount({ apply: context => apply(context, options) });
    let rpc = 0;
    const call = async (action, extra = {}, mode = 'local', headers = {}) => {
      const response = await carrier.send('/api/majed/mcp', { type: 'client-request', method: 'majed/mcp', rpcId: 'mcp-' + ++rpc, payload: { action, scope: 'global', ...extra } }, mode, headers);
      assert.equal(response.status, 200); assert.equal(response.body.result.ok, true, response.body.result.error?.code); return response.body.result.value;
    };
    const server = { serverName: 'controlled', transport: 'stdio', command: process.execPath, args: [fixture], enabled: true, timeout: 1000, reconnect: { enabled: true, maxAttempts: 2 }, env: { HOME: home, DSH_HOME: home, ELECTRON_RUN_AS_NODE: '1', DSH_MANAGED_MCP_FIXTURE: '1' } };
    checkpoint = 'global-save-call';
    assert.equal((await call('save', { server })).servers[0].status, 'active');
    const tool = 'mcp__controlled__echo'; assert.ok(carrier.ctx.tools.get(tool));
    const invoke = (mode, target, signal = new AbortController().signal) => carrier.ctx.tools.execute({ name: tool, arguments: { mode }, callId: 'call-' + ++rpc, signal, ...(target ? { agent: target } : {}) });
    assert.deepEqual((await invoke('hello')).value, { content: [{ type: 'text', text: 'fixture MCP result' }] });
    assert.equal((await invoke('error')).isError, true);
    assert.equal((await invoke('image')).value.content[0].type, 'image');
    assert.equal((await invoke('hang')).isError, true);
    const controller = new AbortController(); const pending = invoke('hang', undefined, controller.signal); setTimeout(() => controller.abort(), 20); assert.equal((await pending).isError, true);
    const deny = carrier.ctx.tools.guard(exec => exec.name === tool ? 'Fixture native denial' : undefined);
    assert.equal((await invoke('hello')).isError, true); deny();
    await call('probe', { serverName: server.serverName }, 'remote');
    await invoke('refresh'); await new Promise(resolve => setTimeout(resolve, 50)); assert.ok(carrier.ctx.tools.get('mcp__controlled__added'));
    checkpoint = 'isolated-bad-server';
    const before = carrier.ctx.tools.get(tool);
    const bad = await call('save', { server: { ...server, serverName: 'bad', args: [fixture, '--bad'], reconnect: { enabled: false } } }, 'remote');
    assert.equal(bad.servers.find(row => row.serverName === 'bad').status, 'failed'); assert.equal(carrier.ctx.tools.get(tool), before);
    const badStarts = children.length; await call('list'); assert.equal(children.length, badStarts, 'Status refresh must not restart a failed server');
    await call('remove', { serverName: 'bad' });
    await call('reconnect', { serverName: server.serverName }, 'remote'); assert.equal((await invoke('hello')).isError, false);
    const connected = carrier.ctx.tools.get(tool);
    await invoke('disconnect');
    for (let attempt = 0; attempt < 30 && carrier.ctx.tools.get(tool) === connected; attempt++) await new Promise(resolve => setTimeout(resolve, 100));
    assert.notEqual(carrier.ctx.tools.get(tool), connected, 'Native bounded reconnect must replace its tool generation');
    assert.equal((await invoke('hello')).isError, false);
    await call('setEnabled', { serverName: server.serverName, enabled: false }); assert.equal(carrier.ctx.tools.get(tool), undefined);
    checkpoint = 'project-scope';
    const selectors = { scope: 'project', sessionId: 'project-agent', workspaceId: workspace.id };
    const beforeInvalidScope = children.length;
    for (const payload of [{ ...selectors, workspaceId: 'foreign', action: 'save', server }, { ...selectors, action: 'save', server: { ...server, cwd: home } }]) {
      const rejected = await carrier.send('/api/majed/mcp', { type: 'client-request', method: 'majed/mcp', rpcId: 'invalid-' + ++rpc, payload }, 'remote');
      assert.equal(rejected.status, 200); assert.equal(rejected.body.result.ok, false); assert.equal(rejected.body.result.error.code, 'invalid_scope');
    }
    assert.equal(children.length, beforeInvalidScope, 'Rejected scope/cwd must not start a process');
    const projectState = await call('save', { ...selectors, server: { ...server, serverName: 'scoped' } }, 'remote');
    assert.equal(projectState.servers[0].status, 'active');
    const { scopeOf } = load('dsh-scope');
    assert.ok(carrier.ctx.tools.get('mcp__scoped__echo', scopeOf(agent.agent.ctx)));
    assert.equal(carrier.ctx.tools.get('mcp__scoped__echo'), undefined);
    assert.equal(carrier.ctx.tools.get('mcp__scoped__echo', scopeOf(other.agent.ctx)), undefined);
    const scopedResult = await carrier.ctx.tools.execute({ name: 'mcp__scoped__echo', arguments: { mode: 'cwd' }, agent: agent.agent, callId: 'scoped-cwd', signal: new AbortController().signal });
    assert.deepEqual(scopedResult.value, { content: [{ type: 'text', text: 'project' }] });
    await product.dispose(); product = await carrier.mount({ apply: context => apply(context, options) });
    assert.equal((await call('list', selectors, 'remote')).servers[0].status, 'active');
    await call('remove', { ...selectors, serverName: 'scoped' });
    assert.equal(carrier.ctx.tools.get('mcp__scoped__echo', scopeOf(agent.agent.ctx)), undefined);
    await agent.dispose(); await other.dispose();
    console.log(JSON.stringify({ runtime: carrier.runtime, checks: ['public native Loader namespace identity', 'production admitted local/paired save/discovery/native tool calls/permission/cancellation/image/error', 'bad-server isolation/tool-list refresh/reconnect/disable', 'actual native agent project scope/CWD isolation', 'persisted restart/remove'], children: children.length, limits: ['Synthetic memory signing/pair registry and HTTP carrier; no installed state/provider inference.', 'HTTP MCP and actual native mounted Settings acceptance run separately.'] }, null, 2));
  } finally {
    await carrier.dispose();
    for (const { child, closed } of children) {
      let timer;
      try { await Promise.race([closed, new Promise((_, reject) => { timer = setTimeout(() => reject(Error('Owned protocol child did not close')), 3000); })]); }
      catch (error) { child.kill('SIGKILL'); await closed; throw error; }
      finally { clearTimeout(timer); }
    }
  }
}
main().catch(error => { console.error('Managed MCP proof failed at ' + checkpoint + ': ' + (error.code || error.name) + ': ' + error.message); process.exitCode = 1; });
