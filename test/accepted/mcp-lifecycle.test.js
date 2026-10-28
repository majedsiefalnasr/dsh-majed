// Mounted production flow for the scoped MCP lifecycle (#97): the owner-admitted
// Fetch route, the real native ToolRegistry and a local stdio fixture. No network,
// installed state or remote endpoint is involved.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, realpath, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { Context } from '@deepseek-ai/cordis';
import { ToolRegistry } from '@deepseek-ai/dsh-tools';
import { apply } from '../../index.js';

const fixture = fileURLToPath(new URL('../fixtures/mcp-stdio.cjs', import.meta.url));

async function mount(t) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'majed-mcp-life-')));
  const ctx = new Context(); let route;
  ctx.provide('systemPrompt', { tools() {}, section() {} });
  new ToolRegistry(ctx, {});
  ctx.provide('connection', { fetch: { register(value) { if (value.path === '/api/majed/mcp') route = value; } } });
  ctx.provide('loader', { import: name => import(name) });
  const fiber = ctx.plugin({ apply: context => apply(context, { managedMcp: { enabled: true, standaloneDisabled: true, stateDirectory: join(root, 'state'), userDirectory: root } }) });
  await fiber;
  t.after(async () => { await fiber.dispose(); await ctx.fiber.dispose(); await rm(root, { recursive: true, force: true }); });
  const call = async (action, input = {}) => {
    const response = await route.fetch(new Request('http://fixture/api/majed/mcp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'client-request', rpcId: 'life-1', method: 'majed/mcp', payload: { action, scope: 'global', ...input } }) }));
    return (await response.json()).result;
  };
  const stored = async () => JSON.parse(await readFile(join(root, 'state', 'global.json'), 'utf8'));
  const stdio = (name, extra = {}) => ({ serverName: name, transport: 'stdio', command: process.execPath, args: [fixture, join(root, name + '.jsonl'), name], cwd: root, reconnect: { enabled: false }, ...extra });
  const journal = async name => { try { return (await readFile(join(root, name + '.jsonl'), 'utf8')).trim().split('\n').filter(Boolean).map(line => JSON.parse(line)); } catch (error) { if (error.code === 'ENOENT') return []; throw error; } };
  const invoke = (name, message = 'hi') => ctx.tools.execute({ name, arguments: { message }, callId: 'life-' + Math.random(), signal: AbortSignal.timeout(5000) });
  return { root, ctx, call, stored, stdio, journal, invoke };
}

test('a new definition is always saved disabled and never launches software', async t => {
  const { call, journal, ctx, stored, stdio } = await mount(t);
  const saved = await call('save', { server: { ...stdio('fresh'), enabled: true } });
  assert.equal(saved.ok, true);
  assert.equal(saved.value.servers[0].enabled, false);
  assert.equal(saved.value.servers[0].status, 'saved');
  assert.equal((await stored()).servers[0].enabled, false);
  assert.equal(ctx.tools.get('mcp__fresh__echo'), undefined);
  assert.deepEqual(await journal('fresh'), []);
});

test('a stale or blank edit is refused with a conflict and never erases credentials', async t => {
  const { call, stored, stdio } = await mount(t);
  const created = await call('save', { server: { ...stdio('guarded'), env: { TOKEN: 'fixture-secret' } } });
  const first = created.value.revision;
  assert.equal(typeof first, 'string');
  assert.equal(JSON.stringify(created).includes('fixture-secret'), false, 'snapshot and revision never expose a secret');
  // Client A edits with the current revision and keeps the credential.
  const edited = await call('save', { originalName: 'guarded', revision: first, server: { ...stdio('guarded'), args: ['changed'], env: { TOKEN: '***' } } });
  assert.equal(edited.ok, true);
  assert.notEqual(edited.value.revision, first);
  // Client B still holds the old snapshot and submits a blank credential form: refused, nothing erased.
  const stale = await call('save', { originalName: 'guarded', revision: first, server: { ...stdio('guarded'), env: { TOKEN: null } } });
  assert.deepEqual([stale.ok, stale.error?.code], [false, 'stale_revision']);
  const omitted = await call('save', { originalName: 'guarded', server: { ...stdio('guarded'), env: { TOKEN: null } } });
  assert.deepEqual([omitted.ok, omitted.error?.code], [false, 'stale_revision']);
  assert.deepEqual((await stored()).servers[0].env, { TOKEN: 'fixture-secret' });
  assert.deepEqual((await stored()).servers[0].args.slice(-1), ['changed']);
  // Stale remove and stale disable are refused the same way; current ones succeed.
  assert.equal((await call('remove', { serverName: 'guarded', revision: first })).error?.code, 'stale_revision');
  assert.equal((await call('setEnabled', { serverName: 'guarded', enabled: true, revision: first })).error?.code, 'stale_revision');
  assert.equal((await stored()).servers.length, 1);
  assert.deepEqual((await call('remove', { serverName: 'guarded', revision: edited.value.revision })).value.servers, []);
});

test('characterization: enable, disable and remove act through the real ToolRuntime while secrets and other definitions survive', async t => {
  const { call, stored, stdio, invoke, ctx } = await mount(t);
  let view = (await call('save', { server: { ...stdio('one'), env: { TOKEN: 'one-secret' } } })).value;
  view = (await call('save', { revision: undefined, server: stdio('two') })).value;
  assert.deepEqual(view.servers.map(row => [row.serverName, row.status]), [['one', 'saved'], ['two', 'saved']]);
  view = (await call('setEnabled', { serverName: 'one', enabled: true, revision: view.revision })).value;
  assert.equal(view.servers[0].status, 'active');
  assert.deepEqual((await invoke('mcp__one__echo')).value, { content: [{ type: 'text', text: 'one:hi' }] });
  view = (await call('setEnabled', { serverName: 'one', enabled: false, revision: view.revision })).value;
  assert.equal(view.servers[0].status, 'saved');
  assert.equal((await invoke('mcp__one__echo')).isError, true, 'disabled definition accepts no new call');
  assert.deepEqual((await stored()).servers[0].env, { TOKEN: 'one-secret' }, 'disable retains stored credentials');
  // Enable BOTH, then remove only 'one': 'two' must stay registered and callable.
  view = (await call('setEnabled', { serverName: 'two', enabled: true, revision: view.revision })).value;
  view = (await call('setEnabled', { serverName: 'one', enabled: true, revision: view.revision })).value;
  assert.deepEqual(view.servers.map(row => [row.serverName, row.status]), [['one', 'active'], ['two', 'active']]);
  assert.ok(ctx.tools.get('mcp__one__echo') && ctx.tools.get('mcp__two__echo'), 'both tools are registered before the removal');
  view = (await call('remove', { serverName: 'one', revision: view.revision })).value;
  assert.deepEqual(view.servers.map(row => [row.serverName, row.status]), [['two', 'active']]);
  assert.equal(ctx.tools.get('mcp__one__echo'), undefined, 'the removed definition no longer has a registered tool');
  assert.ok(ctx.tools.get('mcp__two__echo'), 'the unrelated definition stays registered');
  assert.deepEqual((await invoke('mcp__two__echo')).value, { content: [{ type: 'text', text: 'two:hi' }] });
  assert.equal((await invoke('mcp__one__echo')).isError, true, 'the removed tool accepts no call');
  assert.deepEqual((await stored()).servers.map(row => row.serverName), ['two'], 'the removed stored definition is deleted');
});

test('characterization: native permission guards still deny an enabled MCP tool at invocation', async t => {
  const { call, stdio, invoke, ctx } = await mount(t);
  const saved = (await call('save', { server: stdio('guarded') })).value;
  await call('setEnabled', { serverName: 'guarded', enabled: true, revision: saved.revision });
  assert.equal((await invoke('mcp__guarded__echo')).isError, false);
  const release = ctx.tools.guard(exec => exec.name === 'mcp__guarded__echo' ? 'Denied by native permission policy' : undefined);
  const denied = await invoke('mcp__guarded__echo');
  assert.deepEqual([denied.isError, denied.error.message], [true, 'Denied by native permission policy']);
  release();
  assert.equal((await invoke('mcp__guarded__echo')).isError, false, 'MCP enablement never replaced the guard');
});

test('characterization: changing transport with stored credentials is refused and keeps them; a failed server is not restarted by refresh', async t => {
  const { call, stored, stdio, journal } = await mount(t);
  const saved = (await call('save', { server: { ...stdio('creds'), env: { TOKEN: 'keep-me' } } })).value;
  const refused = await call('save', { originalName: 'creds', revision: saved.revision, server: { serverName: 'creds', transport: 'streamable-http', url: 'http://127.0.0.1:9/mcp' } });
  assert.deepEqual([refused.ok, refused.error.code], [false, 'credential_transport_change']);
  assert.deepEqual((await stored()).servers[0].env, { TOKEN: 'keep-me' });
  const broken = (await call('save', { server: { ...stdio('broken'), command: join(tmpdir(), 'no-such-binary-m01') } })).value;
  const started = await call('setEnabled', { serverName: 'broken', enabled: true, revision: broken.revision });
  assert.equal(started.value.servers.find(row => row.serverName === 'broken').status, 'failed');
  const after = (await call('list')).value.servers.find(row => row.serverName === 'broken');
  assert.equal(after.status, 'failed', 'a status refresh must not restart or revive a failed server');
  assert.deepEqual(await journal('broken'), []);
});

test('status reports the deadline and a truthful last-result timestamp that refresh never rewrites', async t => {
  const { call, stdio } = await mount(t);
  const saved = (await call('save', { server: stdio('timed') })).value;
  assert.equal(saved.probeDeadlineMs, 10000);
  assert.equal(saved.servers[0].lastResult, null, 'a never-attempted server has no result to report');
  const before = Date.now();
  const probed = (await call('probe', { serverName: 'timed' })).value.servers[0];
  const after = Date.now();
  assert.deepEqual([probed.lastResult.action, probed.lastResult.outcome], ['probe', 'passed']);
  const at = Date.parse(probed.lastResult.at);
  assert.ok(at >= before && at <= after, 'timestamp is the time the probe actually finished');
  await new Promise(resolve => setTimeout(resolve, 20));
  const refreshed = (await call('list')).value.servers[0];
  assert.equal(refreshed.lastResult.at, probed.lastResult.at, 'refresh is not liveness and must not refresh the timestamp');
  assert.equal(refreshed.status, probed.status, 'refresh reports the recorded state, not a new check');
  const broken = (await call('save', { server: { ...stdio('dead'), command: join(tmpdir(), 'no-such-binary-m01') } })).value;
  const failed = (await call('setEnabled', { serverName: 'dead', enabled: true, revision: broken.revision })).value.servers.find(row => row.serverName === 'dead');
  assert.deepEqual([failed.status, failed.lastResult.action, failed.lastResult.outcome], ['failed', 'connect', 'failed']);
});

test('a revision token from one scope store is refused by another store with identical content', async t => {
  const first = await mount(t), second = await mount(t);
  const definition = { serverName: 'same', transport: 'streamable-http', url: 'http://127.0.0.1:9/mcp', reconnect: { enabled: false } };
  const a = (await first.call('save', { server: definition })).value, b = (await second.call('save', { server: definition })).value;
  assert.deepEqual((await first.stored()).servers, (await second.stored()).servers, 'precondition: identical stored content');
  assert.notEqual(a.revision, b.revision, 'the token is bound to the store identity, not only to its content');
  const crossed = await second.call('setEnabled', { serverName: 'same', enabled: true, revision: a.revision });
  assert.deepEqual([crossed.ok, crossed.error?.code], [false, 'stale_revision']);
  assert.equal((await second.stored()).servers[0].enabled, false);
  // Two empty stores (no file yet) must not share a token either.
  const emptyA = await mount(t), emptyB = await mount(t);
  assert.notEqual((await emptyA.call('list')).value.revision, (await emptyB.call('list')).value.revision);
});

test('characterization: two parallel saves holding the same revision let exactly one win', async t => {
  const { call, stored, stdio } = await mount(t);
  const base = (await call('save', { server: stdio('race') })).value;
  const attempt = args => call('save', { originalName: 'race', revision: base.revision, server: { ...stdio('race'), args } });
  const results = await Promise.all([attempt(['one']), attempt(['two'])]);
  assert.equal(results.filter(result => result.ok).length, 1, 'exactly one save succeeds');
  const loser = results.find(result => !result.ok);
  assert.equal(loser.error.code, 'stale_revision');
  const winner = results.find(result => result.ok).value.servers[0].args.at(-1);
  assert.equal((await stored()).servers[0].args.at(-1), winner, 'the stored definition is the winner, not a mix');
});

test('a replace credential with an empty value is refused and never overwrites the stored secret', async t => {
  const { call, stored, stdio } = await mount(t);
  const created = (await call('save', { server: { ...stdio('blank'), env: { TOKEN: 'fixture-secret' } } })).value;
  const refused = await call('save', { originalName: 'blank', revision: created.revision, server: { ...stdio('blank'), env: { TOKEN: '' } } });
  assert.deepEqual([refused.ok, refused.error?.code], [false, 'invalid_request']);
  assert.deepEqual((await stored()).servers[0].env, { TOKEN: 'fixture-secret' });
  // A non-empty replace and an explicit remove (null) still work.
  const replaced = await call('save', { originalName: 'blank', revision: created.revision, server: { ...stdio('blank'), env: { TOKEN: 'new-secret' } } });
  assert.equal(replaced.ok, true);
  assert.deepEqual((await stored()).servers[0].env, { TOKEN: 'new-secret' });
});
