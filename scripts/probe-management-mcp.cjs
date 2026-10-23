// Actual exported official client + Cordis + ToolRuntime; no host patch or provider.
const assert = require('node:assert/strict');
const { realpathSync } = require('node:fs');
const { join, basename } = require('node:path');
const { syncBuiltinESMExports } = require('node:module');
const base = process.argv[2];
const flags = process.argv.slice(3);
assert.ok(flags.every(flag => flag === '--red-result'));
assert.equal(process.env.DSH_MANAGEMENT_MCP_PROBE, '1');
const home = realpathSync(process.env.HOME);
assert.ok(basename(home).startsWith('dsh-management-mcp-'));
assert.equal(realpathSync(process.env.DSH_HOME), home);
assert.equal(realpathSync(process.cwd()), home);
const fixture = join(__dirname, 'fixture-management-mcp.cjs');
const forbidden = () => { throw new Error('MCP proof forbids network and unowned processes'); };
for (const name of ['node:http', 'node:https']) {
  require(name).request = forbidden; require(name).get = forbidden;
}
require('node:net').Socket.prototype.connect = forbidden;
require('node:net').Server.prototype.listen = forbidden;
require('node:tls').connect = forbidden;
require('node:dgram').Socket.prototype.send = forbidden;
require('node:dgram').Socket.prototype.bind = forbidden;
for (const dns of [require('node:dns'), require('node:dns/promises')]) {
  for (const key of Object.keys(dns)) if (typeof dns[key] === 'function') dns[key] = forbidden;
}
globalThis.fetch = forbidden;
globalThis.WebSocket = forbidden;
const cp = require('node:child_process');
const spawn = cp.spawn;
const children = [];
cp.spawn = (command, args, options) => {
  assert.equal(command, process.execPath);
  assert.deepEqual(args, [fixture, ...flags]);
  assert.equal(options.cwd, home);
  assert.equal(options.env.HOME, home);
  assert.equal(options.env.DSH_HOME, home);
  assert.ok(children.length < 2, 'At most two owned protocol negotiation processes');
  const child = spawn(command, args, options);
  const closed = new Promise(resolve => child.once('close', (code, signal) => resolve({ code, signal })));
  children.push({ child, closed });
  return child;
};
for (const key of ['spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']) cp[key] = forbidden;
syncBuiltinESMExports();
const load = name => require(join(base, 'node_modules', '@deepseek-ai', name, 'lib/index.js'));
const { Context, Service } = load('cordis');
const { ToolRuntime } = load('dsh-tools');
const mcp = load('dsh-mcp-client');
// Only prompt sink is synthetic; actual registry, dispatch, MCP SDK and lifecycle run unchanged.
class PromptSink extends Service {
  constructor(ctx) { super(ctx, 'systemPrompt'); }
  tools() { return () => {}; }
  section() { return () => {}; }
  getSectionOrder() { return 0; }
}
const ctx = new Context();
const bounded = (promise, label) => {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Bound exceeded: ${label}`)), 4000);
  })]).finally(() => clearTimeout(timer));
};
(async () => {
  const promptFiber = ctx.plugin(PromptSink); await promptFiber;
  const toolsFiber = ctx.plugin(ToolRuntime); await toolsFiber;
  const config = {
    transport: 'stdio', serverName: 'proof', command: process.execPath,
    args: [fixture, ...flags], cwd: home,
    env: { HOME: home, DSH_HOME: home, ELECTRON_RUN_AS_NODE: '1', DSH_MANAGEMENT_MCP_FIXTURE: '1' },
    toolCallTimeoutMs: 180, failOnStartupError: true, reconnect: { enabled: false },
  };
  let fiber;
  try {
    fiber = ctx.plugin(mcp, config);
    await bounded(Promise.resolve(fiber), 'startup');
    assert.ok(ctx.tools.get('mcp__proof__echo'), 'Official bridge must register fixture tool');
    console.log('PASS handshake and actual ToolRuntime registration');
    const call = (mode, signal = new AbortController().signal) => bounded(ctx.tools.execute({
      name: 'mcp__proof__echo', arguments: { mode }, callId: `proof-${mode}`, signal,
    }), mode);
    const result = await call('hello');
    assert.equal(result.isError, false);
    assert.deepEqual(result.value, { content: [{ type: 'text', text: 'fixture hello' }] }, 'Registered tool result sensitivity');
    console.log('PASS actual registered tool call: fixture hello');
    const error = await call('error');
    assert.equal(error.isError, true);
    assert.match(error.error.message, /fixture intentional error/);
    console.log('PASS MCP isError propagation');
    const timeout = await call('hang');
    assert.equal(timeout.isError, true);
    assert.match(timeout.error.message, /timed out|timeout/i);
    console.log('PASS bounded SDK tool deadline');
    const controller = new AbortController();
    const pending = call('hang', controller.signal);
    const abort = setTimeout(() => controller.abort(), 30);
    const cancelled = await pending.finally(() => clearTimeout(abort));
    assert.equal(cancelled.isError, true);
    assert.match(cancelled.error.message, /abort/i);
    console.log('PASS caller cancellation');
  } finally {
    if (fiber) await bounded(fiber.dispose(), 'plugin disposal');
    assert.equal(ctx.tools.get('mcp__proof__echo'), undefined);
    // SDK automatic protocol negotiation may launch a disposable probe first.
    assert.ok(children.length >= 1 && children.length <= 2, 'Bounded transport generations');
    for (const { child, closed } of children) {
      await bounded(closed, 'owned child close');
      assert.ok(child.exitCode !== null || child.signalCode !== null);
    }
    console.log(`PASS awaited disposal: tool absent and all ${children.length} owned stdio children closed`);
    await toolsFiber.dispose();
    await promptFiber.dispose();
  }
})().catch(async error => {
  for (const { child, closed } of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    await closed;
  }
  console.error(error);
  process.exitCode = 1;
});
