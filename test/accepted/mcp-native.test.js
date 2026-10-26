import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, realpath, readFile, stat, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createMcpDefinitionStore } from '../../modules/mcp/storage.js';
import { Context } from '@deepseek-ai/cordis';
import { apply } from '../../index.js';

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

test('production MCP management preserves masked secrets and isolates disabled startup', async t => {
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
