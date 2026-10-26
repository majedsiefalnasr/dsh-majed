import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, readdir, writeFile, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createMcpDefinitionStore } from '../../modules/mcp/storage.js';
import { validateServer } from '../../modules/mcp/index.js';
import { MASKED_SECRET } from '../../modules/managers/validation.js';
import { createManagerService } from '../../modules/managers/index.js';

async function withStore(fn) {
  const root = await mkdtemp(join(tmpdir(), 'dsh-t07-store-'));
  try { return await fn(join(root, 'mcp.json')); }
  finally { await rm(root, { recursive: true, force: true }); }
}

test('private store reads empty defaults when no file exists', async () => {
  await withStore(async filePath => {
    const store = createMcpDefinitionStore(filePath);
    const config = await store.read();
    assert.deepEqual(config, { servers: [] });
  });
});

test('private store round-trips saved config through atomic file write', async () => {
  await withStore(async filePath => {
    const store = createMcpDefinitionStore(filePath);
    const saved = await store.save({ servers: [{ serverName: 'one', transport: 'stdio', command: 'node', args: ['a.js'] }] });
    assert.equal(saved.servers.length, 1);
    const read = await store.read();
    assert.deepEqual(read, saved);
  });
});

test('private store preserves unrelated definitions when saving', async () => {
  await withStore(async filePath => {
    const store = createMcpDefinitionStore(filePath);
    await store.save({ servers: [
      { serverName: 'one', transport: 'stdio', command: 'node', args: ['a.js'] },
      { serverName: 'two', transport: 'streamable-http', url: 'https://example.test' },
    ] });
    const updated = await store.save({ servers: [
      { serverName: 'one', transport: 'stdio', command: 'node', args: ['b.js'] },
      { serverName: 'two', transport: 'streamable-http', url: 'https://example.test' },
    ] });
    assert.equal(updated.servers.length, 2);
    assert.equal(updated.servers.find(s => s.serverName === 'one').args.join(''), 'b.js');
    assert.equal(updated.servers.find(s => s.serverName === 'two').url, 'https://example.test');
  });
});

test('corrupt store is detected on read and does not clobber valid state', async () => {
  await withStore(async filePath => {
    const store = createMcpDefinitionStore(filePath);
    await store.save({ servers: [{ serverName: 'one', transport: 'stdio', command: 'node', args: ['a.js'] }] });
    // Corrupt the file externally.
    await writeFile(filePath, '{ not valid json', 'utf8');
    await assert.rejects(store.read(), { code: 'CORRUPT_STORE' });
    // A normal mutation cannot silently repair or overwrite corrupt state.
    await assert.rejects(store.save({ servers: [{ serverName: 'two', transport: 'stdio', command: 'node', args: ['b.js'] }] }), { code: 'CORRUPT_STORE' });
    assert.equal(await readFile(filePath, 'utf8'), '{ not valid json');
  });
});

test('atomic write leaves no temporary files behind on success', async () => {
  await withStore(async filePath => {
    const store = createMcpDefinitionStore(filePath);
    await store.save({ servers: [] });
    const { readdir } = await import('node:fs/promises');
    const entries = await readdir(dirname(filePath));
    assert.equal(entries.filter(name => name.startsWith('.majed-mcp-') && name.endsWith('.tmp')).length, 0);
  });
});

test('dispose rejects further reads and writes', async () => {
  await withStore(async filePath => {
    const store = createMcpDefinitionStore(filePath);
    store.dispose();
    await assert.rejects(store.read(), /disposed/);
    await assert.rejects(store.save({ servers: [] }), /disposed/);
  });
});

test('validateServer accepts global/project scope and rejects invalid scope', () => {
  assert.equal(validateServer({ serverName: 'one', transport: 'stdio', command: 'node' }).scope, 'global');
  assert.equal(validateServer({ serverName: 'one', transport: 'stdio', command: 'node', scope: 'project' }).scope, 'project');
  for (const bad of [null, 'user', 'GLOBAL', 'system', 1]) {
    assert.throws(() => validateServer({ serverName: 'one', transport: 'stdio', command: 'node', scope: bad }));
  }
});

test('validateServer round-trips advanced reconnect/timeout/instruction-limit fields', () => {
  const row = validateServer({
    serverName: 'one', transport: 'stdio', command: 'node',
    reconnect: { enabled: true, maxAttempts: 7 }, timeout: 30000, instructionLimit: 500,
  });
  assert.deepEqual(row.reconnect, { enabled: true, maxAttempts: 7 });
  assert.equal(row.timeout, 30000);
  assert.equal(row.instructionLimit, 500);
  assert.equal(validateServer({ serverName: 'one', transport: 'stdio', command: 'node' }).reconnect, undefined);
  for (const bad of [
    { reconnect: { enabled: 'yes' } },
    { reconnect: { enabled: true, maxAttempts: 0 } },
    { reconnect: { enabled: true, maxAttempts: 101 } },
    { reconnect: { enabled: true, extra: 1 } },
    { timeout: 999 }, { timeout: 3600001 }, { timeout: '30s' },
    { instructionLimit: 0 }, { instructionLimit: 100001 },
  ]) assert.throws(() => validateServer({ serverName: 'one', transport: 'stdio', command: 'node', ...bad }));
});

test('validateServer rejects path traversal in cwd and malformed server inputs', () => {
  assert.throws(() => validateServer({ serverName: 'one', transport: 'stdio', command: 'node', cwd: '/a/../b' }));
  assert.throws(() => validateServer({ serverName: 'one', transport: 'stdio', command: 'node', cwd: '..' }));
  assert.equal(validateServer({ serverName: 'one', transport: 'stdio', command: 'node', cwd: '/a/b' }).cwd, '/a/b');
  assert.throws(() => validateServer({ serverName: '../bad', transport: 'stdio', command: 'node' }));
});

test('masked secret semantics: unchanged keeps, null removes, string replaces', () => {
  const base = { serverName: 'one', transport: 'stdio', command: 'node', env: { TOKEN: MASKED_SECRET, KEY: null, PASS: 'real-value' } };
  const row = validateServer(base);
  assert.equal(row.env.TOKEN, MASKED_SECRET);
  assert.equal(row.env.KEY, null);
  assert.equal(row.env.PASS, 'real-value');
  // Non-secret non-string rejected; unknown keys rejected.
  assert.throws(() => validateServer({ serverName: 'one', transport: 'stdio', command: 'node', env: { TOKEN: 5 } }));
  assert.throws(() => validateServer({ serverName: 'one', transport: 'stdio', command: 'node', env: { TOKEN: MASKED_SECRET, 'bad!': 'x' } }));
});

test('masked headers semantics: unchanged keeps, null removes, string replaces', () => {
  const row = validateServer({
    serverName: 'one', transport: 'streamable-http', url: 'https://example.test',
    headers: { Authorization: MASKED_SECRET, 'X-Old': null, 'X-New': 'real-value' },
  });
  assert.equal(row.headers.Authorization, MASKED_SECRET);
  assert.equal(row.headers['X-Old'], null);
  assert.equal(row.headers['X-New'], 'real-value');
  assert.throws(() => validateServer({
    serverName: 'one', transport: 'streamable-http', url: 'https://example.test',
    headers: { Authorization: 5 },
  }));
});

async function withService(fn) {
  await withStore(async filePath => {
    const store = createMcpDefinitionStore(filePath);
    const service = createManagerService({}, {}, { mcpStore: store });
    await service.ready;
    await fn(service, store, filePath);
    await service.dispose();
  });
}

test('upsertServer creates and persists a server through the private store', async () => {
  await withService(async (service, store) => {
    const result = await service.upsertServer({
      originalName: undefined,
      server: { serverName: 'one', transport: 'stdio', command: 'node', args: ['a.js'], env: { TOKEN: 'secret-value' }, scope: 'project' },
    });
    assert.equal(result.ok, true);
    const stored = await store.read();
    assert.equal(stored.servers.length, 1);
    assert.equal(stored.servers[0].serverName, 'one');
    assert.equal(stored.servers[0].env.TOKEN, 'secret-value');
    assert.equal(stored.servers[0].scope, 'project');
    const state = await service.snapshot();
    assert.equal(JSON.stringify(state).includes('secret-value'), false);
    assert.equal(state.servers[0].envCount, 1);
  });
});

test('unchanged masked secret keeps the existing value', async () => {
  await withService(async (service, store) => {
    await service.upsertServer({ originalName: undefined, server: { serverName: 'one', transport: 'stdio', command: 'node', env: { TOKEN: 'original' } } });
    const kept = await service.upsertServer({ originalName: 'one', server: { serverName: 'one', transport: 'stdio', command: 'node', env: { TOKEN: MASKED_SECRET } } });
    assert.equal(kept.ok, true);
    assert.equal((await store.read()).servers[0].env.TOKEN, 'original');
  });
});

test('null secret operation removes the secret', async () => {
  await withService(async (service, store) => {
    await service.upsertServer({ originalName: undefined, server: { serverName: 'one', transport: 'stdio', command: 'node', env: { TOKEN: 'original' } } });
    const removed = await service.upsertServer({ originalName: 'one', server: { serverName: 'one', transport: 'stdio', command: 'node', env: { TOKEN: null } } });
    assert.equal(removed.ok, true);
    assert.equal((await store.read()).servers[0].env.TOKEN, undefined);
  });
});

test('real secret value replaces the previous value', async () => {
  await withService(async (service, store) => {
    await service.upsertServer({ originalName: undefined, server: { serverName: 'one', transport: 'stdio', command: 'node', env: { TOKEN: 'first' } } });
    const replaced = await service.upsertServer({ originalName: 'one', server: { serverName: 'one', transport: 'stdio', command: 'node', env: { TOKEN: 'second' } } });
    assert.equal(replaced.ok, true);
    assert.equal((await store.read()).servers[0].env.TOKEN, 'second');
  });
});

test('headers masked secret semantics through the service', async () => {
  await withService(async (service, store) => {
    await service.upsertServer({ originalName: undefined, server: { serverName: 'one', transport: 'streamable-http', url: 'https://example.test', headers: { Authorization: 'token-1' } } });
    await service.upsertServer({ originalName: 'one', server: { serverName: 'one', transport: 'streamable-http', url: 'https://example.test', headers: { Authorization: MASKED_SECRET, 'X-Gone': null } } });
    const stored = (await store.read()).servers[0];
    assert.equal(stored.headers.Authorization, 'token-1');
    assert.equal(stored.headers['X-Gone'], undefined);
    assert.equal(JSON.stringify(await service.snapshot()).includes('token-1'), false);
  });
});

test('removeServer deletes the definition from the private store', async () => {
  await withService(async (service, store) => {
    await service.upsertServer({ originalName: undefined, server: { serverName: 'one', transport: 'stdio', command: 'node', args: ['a.js'] } });
    assert.equal((await store.read()).servers.length, 1);
    assert.equal((await service.removeServer({ serverName: 'one' })).ok, true);
    assert.equal((await store.read()).servers.length, 0);
    assert.equal((await service.removeServer({ serverName: 'one' })).ok, false);
  });
});

test('setEnabled toggles and persists enabled state', async () => {
  await withService(async (service, store) => {
    await service.upsertServer({ originalName: undefined, server: { serverName: 'one', transport: 'stdio', command: 'node', args: ['a.js'], enabled: true } });
    assert.equal((await service.setEnabled({ kind: 'server', serverName: 'one', enabled: false })).ok, true);
    assert.equal((await store.read()).servers[0].enabled, false);
    assert.equal((await service.setEnabled({ kind: 'server', serverName: 'one', enabled: true })).ok, true);
    assert.equal((await store.read()).servers[0].enabled, true);
    assert.equal((await service.setEnabled({ kind: 'server', serverName: 'missing', enabled: true })).ok, false);
  });
});

test('advanced reconnect/timeout/instruction-limit fields round-trip through the store', async () => {
  await withService(async (service, store) => {
    assert.equal((await service.upsertServer({
      originalName: undefined,
      server: { serverName: 'one', transport: 'stdio', command: 'node', args: ['a.js'], reconnect: { enabled: true, maxAttempts: 7 }, timeout: 30000, instructionLimit: 500 },
    })).ok, true);
    const stored = (await store.read()).servers[0];
    assert.deepEqual(stored.reconnect, { enabled: true, maxAttempts: 7 });
    assert.equal(stored.timeout, 30000);
    assert.equal(stored.instructionLimit, 500);
  });
});

test('preserves unrelated definitions and rejects duplicate names', async () => {
  await withService(async (service, store) => {
    await service.upsertServer({ originalName: undefined, server: { serverName: 'one', transport: 'stdio', command: 'node', args: ['a.js'] } });
    await service.upsertServer({ originalName: undefined, server: { serverName: 'two', transport: 'streamable-http', url: 'https://example.test' } });
    const edited = await service.upsertServer({ originalName: 'one', server: { serverName: 'one', transport: 'stdio', command: 'node', args: ['b.js'] } });
    assert.equal(edited.ok, true);
    const stored = (await store.read()).servers;
    assert.equal(stored.length, 2);
    assert.equal(stored.find(s => s.serverName === 'one').args.join(''), 'b.js');
    assert.equal(stored.find(s => s.serverName === 'two').url, 'https://example.test/');
    const dup = await service.upsertServer({ originalName: 'one', server: { serverName: 'two', transport: 'stdio', command: 'node' } });
    assert.equal(dup.ok, false);
    assert.equal((await store.read()).servers.length, 2);
  });
});

test('corrupt store fails mutations safely without clobbering valid state', async () => {
  await withStore(async filePath => {
    const store = createMcpDefinitionStore(filePath);
    await store.save({ servers: [{ serverName: 'one', transport: 'stdio', command: 'node', args: ['a.js'] }] });
    await writeFile(filePath, '{ not valid json', 'utf8');
    const service = createManagerService({}, {}, { mcpStore: store });
    const result = await service.upsertServer({ originalName: 'one', server: { serverName: 'one', transport: 'stdio', command: 'node', args: ['b.js'] } });
    assert.equal(result.ok, false);
    assert.equal(result.code, 'MANAGER_OPERATION_FAILED');
    // The corrupt store is not overwritten with valid state.
    assert.equal(await readFile(filePath, 'utf8'), '{ not valid json');
    await service.dispose();
  });
});

test('secret never appears in snapshot or failure message', async () => {
  await withStore(async filePath => {
    const store = createMcpDefinitionStore(filePath);
    await store.save({ servers: [{ serverName: 'one', transport: 'stdio', command: 'node', args: ['a.js'], env: { TOKEN: 'top-secret' } }] });
    const service = createManagerService({}, {}, { mcpStore: store });
    await service.ready;
    assert.equal(JSON.stringify(await service.snapshot()).includes('top-secret'), false);
    const broken = await service.upsertServer({ originalName: 'missing', server: { serverName: 'nope', transport: 'stdio', command: 'node' } });
    assert.equal(JSON.stringify(broken).includes('top-secret'), false);
    await service.dispose();
  });
});

test('save does not claim connection success: activation-failed server is still saved', async () => {
  await withService(async (service, store) => {
    const result = await service.upsertServer({ originalName: undefined, server: { serverName: 'one', transport: 'stdio', command: 'node', args: ['a.js'], enabled: true } });
    assert.equal(result.ok, true);
    assert.equal((await store.read()).servers.length, 1);
    const state = await service.snapshot();
    assert.notEqual(state.servers[0].status, 'connected');
  });
});


