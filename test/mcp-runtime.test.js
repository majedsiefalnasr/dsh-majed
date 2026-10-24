import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, realpath, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Context } from '@deepseek-ai/cordis';
import { createMcpManager } from '../modules/mcp/index.js';

// Agreed seam: real Cordis + actual MCP namespace/SDK + local stdio JSON-RPC.
// Only tools registration is doubled. This does NOT exercise actual ToolRuntime.
test('MCP real namespace handshakes, calls raw names, replaces and tears down', { timeout: 20_000 }, async t => {
  const workspace = await realpath(fileURLToPath(new URL('..', import.meta.url)));
  const temporary = await mkdtemp(join(workspace, '.mcp-runtime-'));
  const journal = join(temporary, 'wire.jsonl');
  const fixture = fileURLToPath(new URL('./fixtures/mcp-stdio.cjs', import.meta.url));
  const registry = new Map();
  const registrations = [];
  const ctx = new Context();
  ctx.provide('tools', {
    register(definition) {
      assert.ok(!registry.has(definition.name), `Duplicate registration: ${definition.name}`);
      registry.set(definition.name, definition);
      registrations.push(definition.name);
      return () => registry.delete(definition.name);
    },
  });
  const manager = createMcpManager(ctx);
  const events = async () => {
    try { return (await readFile(journal, 'utf8')).trim().split('\n').filter(Boolean).map(line => JSON.parse(line)); }
    catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  };
  const alive = pid => { try { process.kill(pid, 0); return true; } catch (error) { if (error.code === 'ESRCH') return false; throw error; } };
  // Emergency cleanup is registered before any server can start, including timeout paths.
  t.after(async () => {
    for (const row of await events()) {
      if (row.event === 'start' && alive(row.pid)) process.kill(row.pid, 'SIGKILL');
    }
    await manager.dispose();
    await ctx.fiber.dispose();
    assert.equal(dirname(await realpath(temporary)), workspace);
    assert.ok(temporary.startsWith(join(workspace, '.mcp-runtime-')));
    await rm(temporary, { recursive: true, force: true });
  });
  const config = (generation, enabled = true) => ({ serverName: 'runtime_fixture', enabled, transport: 'stdio', command: process.execPath, args: [fixture, journal, generation], cwd: temporary });
  const lifecycle = rows => rows.map(({ serverName, transport, enabled, status }) => ({ serverName, transport, enabled, status }));
  const expected = status => [{ serverName: 'runtime_fixture', transport: 'stdio', enabled: true, status }];

  assert.deepEqual(lifecycle(await manager.replace([config('disabled', false)])),  [{ serverName: 'runtime_fixture', transport: 'stdio', enabled: false, status: 'configured' }]);
  assert.deepEqual(await events(), [], 'disabled entry must not spawn a server');
  assert.equal(registry.size, 0);

  assert.deepEqual(lifecycle(await manager.replace([config('first')])), expected('mounted'));
  assert.deepEqual([...registry.keys()], ['mcp__runtime_fixture__echo']);
  const first = registry.get('mcp__runtime_fixture__echo');
  assert.deepEqual(await first.execute({ message: 'hello' }, { signal: AbortSignal.timeout(3_000) }), { content: [{ type: 'text', text: 'first:hello' }] });
  const firstWire = (await events()).filter(row => row.generation === 'first');
  assert.deepEqual(firstWire.filter(row => row.event === 'request').map(row => row.method), ['server/discover', 'initialize', 'notifications/initialized', 'tools/list', 'tools/call']);
  assert.deepEqual(firstWire.find(row => row.method === 'tools/call').params, { name: 'echo', arguments: { message: 'hello' } });
  const firstPid = firstWire.find(row => row.event === 'start').pid;

  assert.deepEqual(lifecycle(await manager.replace([config('second')])), expected('mounted'));
  assert.equal(alive(firstPid), false, 'replacement must await old process shutdown');
  assert.deepEqual(registrations, ['mcp__runtime_fixture__echo', 'mcp__runtime_fixture__echo']);
  assert.equal(registry.size, 1);
  const second = registry.get('mcp__runtime_fixture__echo');
  assert.notEqual(second, first);
  assert.deepEqual(await second.execute({ message: 'again' }, { signal: AbortSignal.timeout(3_000) }), { content: [{ type: 'text', text: 'second:again' }] });
  const all = await events();
  assert.ok(all.findIndex(row => row.generation === 'first' && row.event === 'exit') < all.findIndex(row => row.generation === 'second' && row.event === 'start'), 'old server exits before replacement starts');
  assert.deepEqual(all.find(row => row.generation === 'second' && row.method === 'tools/call').params, { name: 'echo', arguments: { message: 'again' } });
  const secondPid = all.find(row => row.generation === 'second' && row.event === 'start').pid;
  await manager.dispose();
  assert.equal(registry.size, 0);
  assert.equal(alive(secondPid), false, 'teardown must stop the stdio child');
  await assert.rejects(manager.replace([]), /Manager disposed/);
});
