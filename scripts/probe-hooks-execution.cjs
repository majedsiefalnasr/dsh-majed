'use strict';
// Native public AgentService/ToolRuntime/SubprocessRuntime; all files and commands
// are harmless fixtures inside the wrapper's disposable HOME.
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const fs = require('node:fs/promises');
let networkAttempts = 0;
const denyNetwork = () => { networkAttempts++; throw new Error('R14 fixture forbids network'); };
globalThis.fetch = denyNetwork;
for (const protocol of ['node:http', 'node:https']) { const api = require(protocol); api.request = api.get = denyNetwork; }
const net = require('node:net'); net.connect = net.createConnection = net.Socket.prototype.connect = denyNetwork;
require('node:tls').connect = denyNetwork;
const runtime = process.argv[2];
const load = name => require(path.join(runtime, 'node_modules/@deepseek-ai', name, 'lib/index.js'));
async function proof() {
  const { Context } = load('cordis');
  const ctx = new Context();
  const { applyCommandApproval } = await import(pathToFileURL(path.resolve(__dirname, '../modules/hooks/approval.js')));
  const { applyCommandExecution } = await import(pathToFileURL(path.resolve(__dirname, '../modules/hooks/execution.js')));
  let route; let handle;
  ctx.provide('connection', { fetch: { register(value) { route = value; } } });
  const options = { enabled: true, stateDirectory: path.join(process.cwd(), 'state'), userDirectory: process.cwd() };
  const mount = async (name, options = {}) => { const module = load(name); const fiber = ctx.plugin(module.default || module, options); await fiber.await(); assert.equal(fiber.state, 2, name); };
  try {
    for (const name of ['dsh-llm', 'dsh-system-prompt', 'dsh-session-projection', 'dsh-session', 'dsh-agent', 'dsh-tools', 'dsh-agent-loop', 'dsh-subprocess-local']) await mount(name, name === 'dsh-system-prompt' ? { includeHarnessIdentity: false } : {});
    const fiber = ctx.plugin({ apply(owner) { applyCommandApproval(owner, options); applyCommandExecution(owner, options); } });
    await fiber.await();
    const call = async (action, values = {}) => {
      const result = (await (await route.fetch(new Request('http://fixture/api/majed/hooks/approval', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'client-request', rpcId: 'fixture', method: 'majed/hooks/approval', payload: { action, scope: 'user', ...values } }) }))).json()).result;
      assert.equal(result.ok, true, JSON.stringify(result)); return result.value;
    };
    const hook = { id: 'native-start', events: ['SessionStart'], source: 'inline', command: 'printf harmless > native-start-marker; printf startup-context', enabled: true };
    await call('save', { hook });
    const review = await call('review', { id: hook.id });
    await call('approve', { id: hook.id, nonce: review.nonce, phrase: 'RUN AS DSH USER' });
    handle = await ctx.agents.create({ sessionId: 'r14-native', meta: { cwd: process.cwd() }, agentOptions: { provider: 'fixture', model: 'fixture' } });
    assert.equal(await fs.readFile('native-start-marker', 'utf8'), 'harmless');
    const history = (await call('history')).runs;
    assert.equal(history[0].status, 'completed');
    assert.equal(history[0].event, 'SessionStart');
    assert.ok(!JSON.stringify(history).includes('startup-context'));
    assert.ok(!JSON.stringify(history).includes(process.cwd()));
    await call('revoke', { id: hook.id });
    await fs.unlink('native-start-marker');
    await handle.dispose(); handle = await ctx.agents.create({ sessionId: 'r14-revoked', meta: { cwd: process.cwd() }, agentOptions: { provider: 'fixture', model: 'fixture' } });
    await assert.rejects(fs.stat('native-start-marker'), { code: 'ENOENT' });
    const { runCommand, parseOutput } = await import(pathToFileURL(path.resolve(__dirname, '../modules/hooks/vendor/pouch/runner.js')));
    const base = { event: 'SessionStart', cwd: process.cwd(), shell: 'bash', env: {}, timeout: 1, maxOutputBytes: 32, contextBytes: 32, onError: 'continue' };
    const stdin = await runCommand(ctx.subprocess, { ...base, command: 'cat' }, { value: '$(touch forbidden-marker)' }, new AbortController().signal);
    assert.equal(stdin.status, 'error', 'oversized stdout must reject truncated protocol');
    await assert.rejects(fs.stat('forbidden-marker'), { code: 'ENOENT' });
    const timed = await runCommand(ctx.subprocess, { ...base, command: 'printf "%s" "$$" > timeout-pid; sleep 3' }, {}, new AbortController().signal);
    assert.equal(timed.status, 'timeout');
    const timeoutPid = Number(await fs.readFile('timeout-pid', 'utf8'));
    assert.throws(() => process.kill(timeoutPid, 0), { code: 'ESRCH' }, 'timed-out native command must exit');
    const cancel = new AbortController(); const timer = setTimeout(() => cancel.abort(), 50);
    const cancelled = await runCommand(ctx.subprocess, { ...base, command: 'sleep 3' }, {}, cancel.signal); clearTimeout(timer);
    assert.equal(cancelled.status, 'cancelled');
    const invalidated = await runCommand(ctx.subprocess, { ...base, command: 'touch forbidden-marker', onError: 'block' }, {}, new AbortController().signal,
      () => { throw Object.assign(new Error('invalid_approval'), { code: 'invalid_approval' }); });
    assert.equal(invalidated.status, 'skipped'); assert.equal(parseOutput({ ...base, onError: 'block' }, invalidated).block, false);
    await assert.rejects(fs.stat('forbidden-marker'), { code: 'ENOENT' });
    assert.equal(networkAttempts, 0);
    console.log(JSON.stringify({ checkpoint: 'native-sessionstart-approval-run-history-revoke', checks: ['native AgentService event', 'native subprocess', 'metadata-only history', 'revocation', 'stdin-only event data', 'output limit', 'timeout', 'cancellation', 'pre-spawn rejection', 'process quiescence'], hostVersion: require(path.join(runtime, 'package.json')).version, networkAttempts, boundary: 'Real AgentService creation and native subprocess; route callback adapter is not admission or mounted UI proof. Other lifecycle adapters are source candidates.' }));
  } finally { await handle?.dispose(); await ctx.fiber.dispose(); }
}
const watchdog = setTimeout(() => { console.error('R14 native fixture timeout'); process.exit(1); }, 20000);
proof().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => clearTimeout(watchdog));
