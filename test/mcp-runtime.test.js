import './fetch-duplex-shim.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, realpath, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Context } from '@deepseek-ai/cordis';
import { createMcpManager } from '../modules/mcp/index.js';
import { createManagerService } from '../modules/managers/index.js';
import { createMcpDefinitionStore } from '../modules/mcp/storage.js';

const workspace = await realpath(fileURLToPath(new URL('..', import.meta.url)));
const stdioFixture = fileURLToPath(new URL('./fixtures/mcp-stdio.cjs', import.meta.url));
const httpFixture = fileURLToPath(new URL('./fixtures/mcp-http.mjs', import.meta.url));

const alive = pid => { try { process.kill(pid, 0); return true; } catch (error) { if (error.code === 'ESRCH') return false; throw error; } };
const eventsOf = async journal => { try { return (await readFile(journal, 'utf8')).trim().split('\n').filter(Boolean).map(line => JSON.parse(line)); } catch (error) { if (error.code === 'ENOENT') return []; throw error; } };
const lifecycle = rows => rows.map(({ serverName, transport, enabled, status }) => ({ serverName, transport, enabled, status }));

async function freePort() {
  const { createServer } = await import('node:http');
  return new Promise((resolve, reject) => { const s = createServer(); s.unref(); s.listen(0, '127.0.0.1', () => { const port = s.address().port; s.close(() => resolve(port)); }); s.on('error', reject); });
}

async function withHttpServer(fn) {
  const temporary = await mkdtemp(join(workspace, '.mcp-http-'));
  const journal = join(temporary, 'wire.jsonl');
  const port = await freePort();
  const proc = spawn(process.execPath, [httpFixture, String(port), journal], { stdio: ['ignore', 'pipe', 'pipe'] });
  let err = ''; proc.stderr.on('data', chunk => { err += chunk; });
  await new Promise(resolve => setTimeout(resolve, 1000));
  try { return await fn({ port, journal, proc, kill: () => proc.kill('SIGTERM'), err: () => err }); }
  finally { proc.kill('SIGTERM'); await new Promise(resolve => setTimeout(resolve, 300)); await rm(temporary, { recursive: true, force: true }); }
}

function toolsCtx() {
  const registry = new Map();
  const ctx = new Context();
  ctx.provide('tools', {
    register(definition) { registry.set(definition.name, definition); return () => registry.delete(definition.name); },
  });
  return { ctx, registry };
}

test('stdio: disabled server is saved but never spawned', { timeout: 20_000 }, async t => {
  const temporary = await realpath(await mkdtemp(join(workspace, '.mcp-stdio-')));
  const journal = join(temporary, 'wire.jsonl');
  const { ctx } = toolsCtx();
  const manager = createMcpManager(ctx);
  t.after(async () => { await manager.dispose(); await ctx.fiber.dispose(); await rm(temporary, { recursive: true, force: true }); });
  const config = enabled => ({ serverName: 'stdio_fixture', enabled, transport: 'stdio', command: process.execPath, args: [stdioFixture, journal, 'disabled'], cwd: temporary });
  assert.deepEqual(lifecycle(await manager.replace([config(false)])), [{ serverName: 'stdio_fixture', transport: 'stdio', enabled: false, status: 'configured' }]);
  assert.deepEqual(await eventsOf(journal), [], 'disabled entry must not spawn a server');
});

test('stdio: startup, tools/list, tool invocation and teardown', { timeout: 25_000 }, async t => {
  const temporary = await realpath(await mkdtemp(join(workspace, '.mcp-stdio-')));
  const journal = join(temporary, 'wire.jsonl');
  const { ctx, registry } = toolsCtx();
  const manager = createMcpManager(ctx);
  t.after(async () => {
    for (const row of await eventsOf(journal)) if (row.event === 'start' && alive(row.pid)) process.kill(row.pid, 'SIGKILL');
    await manager.dispose();
    await ctx.fiber.dispose();
    await rm(temporary, { recursive: true, force: true });
  });
  const config = generation => ({ serverName: 'stdio_fixture', enabled: true, transport: 'stdio', command: process.execPath, args: [stdioFixture, journal, generation], cwd: temporary });
  assert.deepEqual(lifecycle(await manager.replace([config('first')])), [{ serverName: 'stdio_fixture', transport: 'stdio', enabled: true, status: 'mounted' }]);
  assert.deepEqual([...registry.keys()], ['mcp__stdio_fixture__echo']);
  const first = registry.get('mcp__stdio_fixture__echo');
  assert.deepEqual(await first.execute({ message: 'hello' }, { signal: AbortSignal.timeout(3_000) }), { content: [{ type: 'text', text: 'first:hello' }] });
  const firstWire = (await eventsOf(journal)).filter(row => row.generation === 'first');
  assert.deepEqual(firstWire.filter(row => row.event === 'request').map(row => row.method), ['initialize', 'notifications/initialized', 'tools/list', 'tools/call']);
  assert.deepEqual(firstWire.find(row => row.method === 'tools/call').params, { name: 'echo', arguments: { message: 'hello' } });
  const firstPid = firstWire.find(row => row.event === 'start').pid;
  await manager.dispose();
  assert.equal(registry.size, 0);
  assert.equal(alive(firstPid), false, 'teardown must stop the stdio child');
  await assert.rejects(manager.replace([]), /Manager disposed/);
});

test('stdio: hot reconcile awaits old shutdown before replacement starts', { timeout: 25_000 }, async t => {
  const temporary = await realpath(await mkdtemp(join(workspace, '.mcp-stdio-')));
  const journal = join(temporary, 'wire.jsonl');
  const { ctx, registry } = toolsCtx();
  const manager = createMcpManager(ctx);
  t.after(async () => {
    for (const row of await eventsOf(journal)) if (row.event === 'start' && alive(row.pid)) process.kill(row.pid, 'SIGKILL');
    await manager.dispose(); await ctx.fiber.dispose(); await rm(temporary, { recursive: true, force: true });
  });
  const config = generation => ({ serverName: 'stdio_fixture', enabled: true, transport: 'stdio', command: process.execPath, args: [stdioFixture, journal, generation], cwd: temporary });
  await manager.replace([config('first')]);
  const firstWire = await eventsOf(journal);
  const firstPid = firstWire.find(row => row.generation === 'first' && row.event === 'start').pid;
  assert.deepEqual(lifecycle(await manager.replace([config('second')])), [{ serverName: 'stdio_fixture', transport: 'stdio', enabled: true, status: 'mounted' }]);
  assert.equal(alive(firstPid), false, 'replacement must await old process shutdown');
  const all = await eventsOf(journal);
  assert.ok(all.findIndex(row => row.generation === 'first' && row.event === 'exit') < all.findIndex(row => row.generation === 'second' && row.event === 'start'), 'old server exits before replacement starts');
  const second = registry.get('mcp__stdio_fixture__echo');
  assert.notDeepEqual(second, undefined);
  assert.deepEqual(await second.execute({ message: 'again' }, { signal: AbortSignal.timeout(3_000) }), { content: [{ type: 'text', text: 'second:again' }] });
  await manager.dispose();
});

test('stdio: probe reports connected for a live server and error for an unreachable one', { timeout: 25_000 }, async t => {
  const temporary = await realpath(await mkdtemp(join(workspace, '.mcp-stdio-')));
  const journal = join(temporary, 'wire.jsonl');
  const { ctx } = toolsCtx();
  const manager = createMcpManager(ctx);
  t.after(async () => {
    for (const row of await eventsOf(journal)) if (row.event === 'start' && alive(row.pid)) process.kill(row.pid, 'SIGKILL');
    await manager.dispose(); await ctx.fiber.dispose(); await rm(temporary, { recursive: true, force: true });
  });
  const config = enabled => ({ serverName: 'stdio_fixture', enabled, transport: 'stdio', command: process.execPath, args: [stdioFixture, journal, 'probe'], cwd: temporary });
  assert.deepEqual(lifecycle(await manager.replace([config(true)])), [{ serverName: 'stdio_fixture', transport: 'stdio', enabled: true, status: 'mounted' }]);
  const probed = await manager.probeServer('stdio_fixture');
  assert.equal(probed.status, 'connected', 'successful probe reports connected');
  const wire = await eventsOf(journal);
  assert.ok(wire.some(row => row.event === 'request' && row.method === 'tools/list'), 'probe performs tools/list');
  // The probe is disposable: the mounted server stays up and the probe connection is closed.
  const mountedPid = wire.find(row => row.event === 'start').pid;
  assert.equal(alive(mountedPid), true);
  await assert.rejects(manager.probeServer('does-not-exist'), /Server not found/);
  await manager.dispose();
  await assert.rejects(manager.probeServer('stdio_fixture'), /Manager disposed/);
});

test('streamable-http: startup, tools/list, tool invocation and teardown', { timeout: 30_000 }, async t => {
  await withHttpServer(async ({ port, journal }) => {
    const { ctx, registry } = toolsCtx();
    const manager = createMcpManager(ctx);
    try {
      const config = { serverName: 'http_fixture', enabled: true, transport: 'streamable-http', url: `http://127.0.0.1:${port}` };
      assert.deepEqual(lifecycle(await manager.replace([config])), [{ serverName: 'http_fixture', transport: 'streamable-http', enabled: true, status: 'mounted' }]);
      assert.deepEqual([...registry.keys()], ['mcp__http_fixture__echo']);
      const tool = registry.get('mcp__http_fixture__echo');
      assert.deepEqual(await tool.execute({ message: 'hello' }, { signal: AbortSignal.timeout(5_000) }), { content: [{ type: 'text', text: 'http:hello' }] });
      const wire = await eventsOf(journal);
      assert.ok(wire.some(row => row.event === 'request' && row.method === 'POST'), 'http handshake');
      assert.ok(wire.some(row => row.event === 'request' && row.method === 'POST' && row.session), 'http sessioned requests');
    } finally {
      await manager.dispose();
      await ctx.fiber.dispose();
    }
  });
});

test('streamable-http: probe is a bounded disposable connection for a saved server', { timeout: 30_000 }, async t => {
  await withHttpServer(async ({ port, journal }) => {
    const { ctx } = toolsCtx();
    const manager = createMcpManager(ctx);
    try {
      const config = { serverName: 'http_fixture', enabled: false, transport: 'streamable-http', url: `http://127.0.0.1:${port}` };
      assert.deepEqual(lifecycle(await manager.replace([config])), [{ serverName: 'http_fixture', transport: 'streamable-http', enabled: false, status: 'configured' }]);
      const probed = await manager.probeServer('http_fixture');
      assert.equal(probed.status, 'connected', 'probe of a saved server reports connected');
      const wire = await eventsOf(journal);
      assert.ok(wire.some(row => row.event === 'request' && row.method === 'POST' && row.session), 'probe performs sessioned tools/list');
      // Probe is disposable: it leaves the server unmounted and the probe connection closed.
      assert.deepEqual(lifecycle(await manager.snapshot()), [{ serverName: 'http_fixture', transport: 'streamable-http', enabled: false, status: 'connected' }]);
      await assert.rejects(manager.probeServer('does-not-exist'), /Server not found/);
      await manager.dispose();
      await assert.rejects(manager.probeServer('http_fixture'), /Manager disposed/);
    } finally {
      await ctx.fiber.dispose();
    }
  });
});

test('stdio: failure of one server does not stop another (isolation)', { timeout: 25_000 }, async t => {
  const temporary = await realpath(await mkdtemp(join(workspace, '.mcp-stdio-')));
  const journal = join(temporary, 'wire.jsonl');
  const { ctx, registry } = toolsCtx();
  const manager = createMcpManager(ctx);
  t.after(async () => {
    for (const row of await eventsOf(journal)) if (row.event === 'start' && alive(row.pid)) process.kill(row.pid, 'SIGKILL');
    await manager.dispose(); await ctx.fiber.dispose(); await rm(temporary, { recursive: true, force: true });
  });
  const good = { serverName: 'good', enabled: true, transport: 'stdio', command: process.execPath, args: [stdioFixture, journal, 'good'], cwd: temporary };
  const bad = { serverName: 'bad', enabled: true, transport: 'stdio', command: 'node-no-such-binary', args: [], cwd: temporary };
  const result = await manager.replace([good, bad]);
  const statuses = lifecycle(result);
  assert.equal(statuses.find(row => row.serverName === 'good').status, 'mounted', 'good server mounts');
  assert.equal(statuses.find(row => row.serverName === 'bad').status, 'activation-failed', 'bad server fails activation');
  const goodTool = registry.get('mcp__good__echo');
  assert.deepEqual(await goodTool.execute({ message: 'ok' }, { signal: AbortSignal.timeout(3_000) }), { content: [{ type: 'text', text: 'good:ok' }] }, 'good server still invocable after sibling failure');
  await manager.dispose();
});

test('restore: enabled servers restart from the private store', { timeout: 25_000 }, async t => {
  const temporary = await realpath(await mkdtemp(join(workspace, '.mcp-restore-')));
  const storePath = join(temporary, 'mcp.json');
  const journal = join(temporary, 'wire.jsonl');
  t.after(async () => { await rm(temporary, { recursive: true, force: true }); });
  const store = createMcpDefinitionStore(storePath);
  const server = { serverName: 'restore_fixture', enabled: true, transport: 'stdio', command: process.execPath, args: [stdioFixture, journal, 'restore'], cwd: temporary };
  await store.save({ servers: [server] });
  const mountFromStore = async () => {
    const { ctx, registry } = toolsCtx();
    const service = createManagerService(ctx, {}, { mcpStore: store });
    await service.ready;
    const state = await service.snapshot();
    const row = state.servers.find(r => r.serverName === 'restore_fixture');
    assert.equal(row.status, 'mounted', 'restored server is mounted from store');
    const tool = registry.get('mcp__restore_fixture__echo');
    assert.deepEqual(await tool.execute({ message: 'back' }, { signal: AbortSignal.timeout(3_000) }), { content: [{ type: 'text', text: 'restore:back' }] });
    await service.dispose();
    await ctx.fiber.dispose();
  };
  await mountFromStore();
  await mountFromStore();
  await store.dispose();
});
