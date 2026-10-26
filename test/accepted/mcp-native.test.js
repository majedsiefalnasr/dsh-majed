import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, realpath, readFile, stat, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createMcpDefinitionStore } from '../../modules/mcp/storage.js';
import { Context } from '@deepseek-ai/cordis';
import { apply } from '../../index.js';
import { createMcpManager } from '../../modules/mcp/index.js';

test('private MCP updates serialize across store instances, protect permissions and preserve corrupt state', async t => {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'majed-mcp-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = join(root, 'private', 'mcp.json');
  const one = createMcpDefinitionStore(file), two = createMcpDefinitionStore(file);
  await Promise.all([one.update(value => ({ servers: [...value.servers, { serverName: 'one', transport: 'stdio', command: 'node' }] })), two.update(value => ({ servers: [...value.servers, { serverName: 'two', transport: 'stdio', command: 'node' }] }))]);
  assert.deepEqual((await one.read()).servers.map(value => value.serverName), ['one', 'two']);
  if (process.platform !== 'win32') assert.equal((await stat(file)).mode & 0o777, 0o600);
  await writeFile(file, '{bad state');
  await assert.rejects(one.save({ servers: [] }));
  assert.equal(await readFile(file, 'utf8'), '{bad state');
});

test('plugin cleanup failure refuses a replacement generation until the old registration closes', async () => {
  // Explicit external Cordis plugin-boundary failure; exact native lifecycle is
  // exercised separately by the opt-in stdio/HTTP probes.
  const visible = new Map(); let failClose = true;
  const manager = createMcpManager({ plugin(namespace, config) {
    assert.equal(visible.has(config.serverName), false, 'No overlapping owner may register');
    visible.set(config.serverName, config.command);
    return { then(resolve) { resolve(); }, async dispose() { if (failClose) throw new Error('Controlled disposal failure'); visible.delete(config.serverName); } };
  } }, async () => ({}));
  const server = { serverName: 'one', transport: 'stdio', command: 'first', enabled: true };
  await manager.replace([server]);
  await assert.rejects(manager.replace([{ ...server, command: 'second' }]));
  assert.equal(visible.get('one'), 'first'); assert.equal(manager.snapshot()[0].status, 'cleanup-failed');
  failClose = false; await manager.replace([{ ...server, command: 'second' }]);
  assert.equal(visible.get('one'), 'second'); await manager.dispose(); assert.equal(visible.size, 0);
});

test('production MCP management saves inert definitions and preserves masked secrets', async t => {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'majed-mcp-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const ctx = new Context(); let route;
  ctx.provide('connection', { fetch: { register(value) { if (value.path === '/api/majed/mcp') route = value; } } });
  ctx.provide('tools', { register() { return () => {}; } });
  ctx.provide('loader', { import() { throw new Error('Disabled definitions must not load a runtime.'); } });
  const fiber = ctx.plugin({ apply: context => apply(context, { managedMcp: { enabled: true, standaloneDisabled: true, stateDirectory: root } }) });
  await fiber; t.after(() => fiber.dispose());
  assert.ok(route, 'Production entry mounts the owner-admitted management route');
  async function call(action, input = {}) {
    const response = await route.fetch(new Request('http://fixture/api/majed/mcp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'client-request', rpcId: 'test-1', method: 'majed/mcp', payload: { action, scope: 'global', ...input } }) }));
    return (await response.json()).result;
  }
  const server = { serverName: 'saved', transport: 'stdio', command: 'node', enabled: false, env: { TOKEN: 'fixture-secret' } };
  assert.equal((await call('save', { server })).ok, true);
  assert.equal(JSON.stringify(await call('list')).includes('fixture-secret'), false);
  await call('save', { originalName: 'saved', server: { ...server, env: { TOKEN: '***', EXTRA: 'replace-me' } } });
  await call('save', { originalName: 'saved', server: { ...server, env: { TOKEN: '***', EXTRA: null } } });
  const stored = JSON.parse(await readFile(join(root, 'global.json'), 'utf8'));
  assert.deepEqual(stored.servers[0].env, { TOKEN: 'fixture-secret' });
  assert.equal((await call('list')).value.servers[0].status, 'saved');
});

test('disabled production MCP composition opens no store and needs no native loader or tools', async t => {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'majed-mcp-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const ctx = new Context(); let route;
  ctx.provide('connection', { fetch: { register(value) { if (value.path === '/api/majed/mcp') route = value; } } });
  const fiber = ctx.plugin({ apply: context => apply(context, { managedMcp: { enabled: false, stateDirectory: join(root, 'unopened') } }) });
  await fiber; t.after(() => fiber.dispose());
  const response = await route.fetch(new Request('http://fixture/api/majed/mcp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'client-request', rpcId: 'disabled', method: 'majed/mcp', payload: { action: 'save', scope: 'global' } }) }));
  assert.equal((await response.json()).result.value.enabled, false);
  await assert.rejects(stat(join(root, 'unopened')), { code: 'ENOENT' });
});

for (const operation of ['replace', 'probe']) test(`disposing during deferred native loading prevents ${operation} from starting a plugin`, async t => {
  const ctx = new Context(); t.after(() => ctx.fiber.dispose());
  const { createScope } = await import('@deepseek-ai/dsh-scope');
  ctx.provide('loader', { import: async () => ({ createScope }) });
  let release, entered, starts = 0;
  const loading = new Promise(resolve => { release = resolve; });
  const reached = new Promise(resolve => { entered = resolve; });
  const manager = createMcpManager(ctx, () => { entered(); return loading; });
  const server = { serverName: 'deferred', transport: 'stdio', command: 'never-launched', enabled: operation === 'replace' };
  if (operation === 'probe') await manager.replace([server]);
  const pending = operation === 'probe' ? manager.probeServer(server.serverName) : manager.replace([server]);
  await reached;
  const closing = manager.dispose();
  release({ apply() { starts++; } });
  await pending; await closing;
  assert.equal(starts, 0, 'Disposal must prevent native startup, rather than only clean it up afterward');
});


test('a saved unavailable stdio CWD fails only that server and remains manageable', async t => {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'majed-mcp-cwd-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const cwd = join(root, 'vanished'); await mkdir(cwd);
  const store = createMcpDefinitionStore(join(root, 'global.json'));
  await store.save({ servers: [
    { serverName: 'bad', transport: 'stdio', command: 'controlled', cwd, enabled: true },
    { serverName: 'healthy', transport: 'stdio', command: 'controlled', cwd: root, enabled: true },
  ] });
  await rm(cwd, { recursive: true });
  // Controlled external native plugin boundary: no actual process is launched.
  const active = new Set();
  const ctx = { on() {}, get(name) { return name === 'loader' ? { import: async () => ({}) } : undefined; },
    plugin(namespace, config) {
      active.add(config.serverName);
      return { then(resolve) { resolve(); }, async dispose() { active.delete(config.serverName); } };
    } };
  const { createManagedMcpService } = await import('../../modules/mcp/native.js');
  const service = createManagedMcpService(ctx, { stateDirectory: root });
  t.after(() => service.dispose());
  await service.ready;
  const call = (action, extra = {}) => service.operation({ action, scope: 'global', ...extra }, new AbortController().signal);
  let view = await call('list');
  assert.deepEqual(view.servers.map(row => [row.serverName, row.status]), [['bad', 'failed'], ['healthy', 'active']]);
  assert.deepEqual([...active], ['healthy']);
  await assert.rejects(call('probe', { serverName: 'bad' }));
  assert.deepEqual([...active], ['healthy']);
  view = await call('setEnabled', { serverName: 'bad', enabled: false });
  assert.equal(view.servers[0].status, 'saved');
  await call('setEnabled', { serverName: 'bad', enabled: true });
  await mkdir(cwd);
  view = await call('list');
  assert.equal(view.servers[0].status, 'active');
  await rm(cwd, { recursive: true });
  view = await call('remove', { serverName: 'bad' });
  assert.deepEqual(view.servers.map(row => row.serverName), ['healthy']);
  assert.deepEqual([...active], ['healthy']);
  await writeFile(join(root, 'global.json'), '{corrupt');
  await assert.rejects(call('list'));
  assert.equal(await readFile(join(root, 'global.json'), 'utf8'), '{corrupt');
  await service.dispose();
  const restarted = createManagedMcpService(ctx, { stateDirectory: root });
  t.after(() => restarted.dispose());
  await assert.rejects(restarted.ready);
  await assert.rejects(restarted.operation({ action: 'remove', scope: 'global', serverName: 'healthy' }, new AbortController().signal));
  assert.equal(await readFile(join(root, 'global.json'), 'utf8'), '{corrupt');

});
