import test from 'node:test';
import assert from 'node:assert/strict';
import { validateServer, createMcpManager } from '../mcp/index.js';
import { createHooksManager, validateHooks, matchesTool } from '../hooks/index.js';
import { createOwnedPersistence, createManagerService } from './index.js';
import { trustedLocalRequest, createManagerHandler } from './transport.js';
import { Readable } from 'node:stream';
import { createContextOwnership } from './ownership.js';

test('real loader shape proves exact active root fiber, not inherited child entry', async () => {
  const ctx = {}; const fiber = { ctx, state: 2 }; ctx.fiber = fiber;
  const entry = { options: { id: 'majed' }, fiber, parent: { tree: { ctx: { fiber: { entry: { id: 'include' } } } } } }; fiber.entry = entry;
  let service; let edits = 0;
  const editor = { entries: () => [entry], configuration() { throw new Error('Must not read profiles'); }, async edit(row, change) { edits++; assert.equal(row, entry); assert.equal(change({ sibling: true }).sibling, true); } };
  const ownership = createContextOwnership(ctx);
  const persistence = createOwnedPersistence(() => service, ownership);
  assert.equal(persistence.available(), false); service = editor;
  assert.equal(persistence.available(), true); await persistence.save({}); assert.equal(edits, 1);
  const child = { fiber: { ctx: {}, state: 2, entry } };
  assert.equal(createOwnedPersistence(editor, createContextOwnership(child)).available(), false);
  fiber.state = 3; assert.equal(persistence.available(), false); fiber.state = 2;
  entry.parent.tree.ctx.fiber.entry.id = 'nested:include'; assert.equal(persistence.available(), false);
  entry.parent.tree.ctx.fiber.entry.id = 'include';
  editor.entries = () => [entry, entry]; assert.equal(persistence.available(), false);
  editor.entries = () => [entry]; service = undefined; await assert.rejects(persistence.save({}));
});

test('ownership revalidated inside synchronous editor callback rejects replacement', async () => {
  const entry = { options: { id: 'majed' } }; let active = entry;
  const editor = { entries: () => [active], async edit(_entry, change) { active = { options: { id: 'majed' } }; change({}); } };
  const persistence = createOwnedPersistence(editor, { id: 'majed', isOwnedRoot: row => row === entry });
  await assert.rejects(persistence.save({}), { reason: 'OWNED_CHANGED_ENTRY_FIBER_REPLACED' });
});
test('owned save tolerates a fresh editor facade for the same proven entry', async () => {
  const entry = { options: { id: 'majed' } }; let edits = 0;
  const persistence = createOwnedPersistence(() => ({ entries: () => [entry], async edit(_e, change) { edits++; change({}); } }), { id: 'majed', isOwnedRoot: row => row === entry });
  await persistence.save({}); assert.equal(edits, 1);
});
test('local transport refuses remote peers, cross origins, missing marker, and oversized payloads', async () => {
  const req = { socket: { remoteAddress: '127.0.0.1' }, headers: { host: '127.0.0.1:61823', origin: 'http://127.0.0.1:61823', 'x-dsh-majed-manager': '1', 'content-type': 'application/json' } };
  assert.equal(trustedLocalRequest(req, true), true);
  assert.equal(trustedLocalRequest({ ...req, socket: { remoteAddress: '192.168.1.2' } }, true), false);
  assert.equal(trustedLocalRequest({ ...req, headers: { ...req.headers, origin: 'https://evil.test' } }, true), false);
  assert.equal(trustedLocalRequest({ ...req, headers: { ...req.headers, 'x-dsh-majed-manager': undefined } }, true), false);
  assert.equal(trustedLocalRequest({ ...req, headers: { host: 'evil.test' } }), false);
  let called = false, status, body;
  const stream = Readable.from(['x'.repeat(65537)]); Object.assign(stream, req, { method: 'POST' });
  await createManagerHandler({ update() { called = true; } }, { admit: () => ({ peer: { principal: { kind: 'owner' } } }) })(stream, { writeHead(code) { status = code; }, end(value) { body = value; } });
  assert.equal(status, 400); assert.equal(called, false); assert.equal(body.includes('xxxxx'), false);
});
test('nonsecret server CRUD preserves credentials and hook updates preserve servers', async () => {
  const saved = [];
  const service = createManagerService({}, { servers: [{ serverName: 'one', transport: 'stdio', command: 'old', env: { TOKEN: 'hidden-value' } }] }, { persistence: { available: () => true, save: async value => saved.push(structuredClone(value)) } });
  await service.ready;
  assert.equal((await service.upsertServer({ originalName: 'one', server: { serverName: 'renamed', transport: 'stdio', command: 'new', args: ['a'] } })).ok, true);
  assert.equal(saved.at(-1).servers[0].env.TOKEN, 'hidden-value');
  const state = await service.snapshot();
  assert.equal(state.servers[0].command, 'new'); assert.equal(state.servers[0].envCount, 1);
  assert.equal(JSON.stringify(state).includes('hidden-value'), false);
  assert.equal((await service.upsertServer({ originalName: 'renamed', server: { serverName: 'renamed', transport: 'streamable-http', url: 'https://example.test' } })).ok, false);
  assert.equal((await service.upsertServer({ server: { serverName: 'two', transport: 'streamable-http', url: 'https://example.test' } })).ok, true);
  assert.equal((await service.updateHooks({ enabled: false, deny: ['shell.*'], audit: true, auditLimit: 12 })).ok, true);
  assert.equal(saved.at(-1).servers.length, 2);
  assert.equal((await service.removeServer({ serverName: 'renamed' })).ok, true);
  assert.equal((await service.snapshot()).servers.length, 1);
  await service.dispose();
});
test('editor-triggered root disposal settles without waiting on its own mutation', { timeout: 1000 }, async () => {
  let service;
  service = createManagerService({}, {}, { persistence: { available: () => true, save: async () => { await service.dispose(); } } });
  await service.ready;
  const result = await service.upsertServer({ server: { serverName: 'demo', transport: 'stdio', command: 'never-launched', args: [] } });
  assert.equal(result.ok, true);
  assert.equal(result.state.writable, false);
  assert.equal(service.dispose(), service.dispose());
});
test('disposal during an active mount does not remount hooks afterward', async () => {
  let mounted; let finishMount; let guards = 0; let childrenDisposed = 0;
  const started = new Promise(resolve => { mounted = resolve; });
  const blocked = new Promise(resolve => { finishMount = resolve; });
  const service = createManagerService({
    tools: { guard() { guards++; return () => {}; } },
    plugin() { mounted(); return { then(resolve) { blocked.then(resolve); }, async dispose() { childrenDisposed++; } }; },
  }, { servers: [{ serverName: 'demo', enabled: true, transport: 'stdio', command: 'never-launched' }], hooks: { enabled: true } }, { loadMcp: async () => ({}) });
  await started;
  const disposal = service.dispose();
  assert.equal(service.dispose(), disposal);
  finishMount();
  await disposal; await service.ready;
  assert.equal(guards, 0); assert.equal(childrenDisposed, 1);
});
test('manager failures expose fixed stage codes without editor diagnostics', async () => {
  const service = createManagerService({}, {}, { persistence: { available: () => true, save: async () => { throw Object.assign(new Error('credential-private'), { code: 'SECRET_CODE' }); } } });
  await service.ready;
  const invalid = await service.upsertServer({ server: { serverName: '../invalid' } });
  assert.equal(invalid.code, 'MANAGER_VALIDATION_FAILED');
  const failed = await service.upsertServer({ server: { serverName: 'demo', transport: 'stdio', command: 'never-launched', args: [] } });
  assert.equal(failed.code, 'MANAGER_PERSISTENCE_FAILED'); assert.equal(failed.reason, undefined);
  assert.equal(JSON.stringify(failed).includes('credential-private'), false);
  assert.equal(JSON.stringify(failed).includes('SECRET_CODE'), false);
  await service.dispose();
  assert.equal((await service.removeServer({ serverName: 'demo' })).code, 'MANAGER_UNAVAILABLE');
});
const server = (extra = {}) => ({ serverName: 'safe', transport: 'stdio', command: 'never-launched', ...extra });
test('strict server validation defaults disabled and rejects malformed/unknown keys', () => {
  assert.equal(validateServer(server()).enabled, false);
  for (const input of [server({ serverName: '../bad' }), server({ enabled: 'yes' }), server({ args: 'x' }), server({ url: 'https://x' }), server({ extra: true }), server({ env: JSON.parse('{"__proto__":"bad"}') })]) assert.throws(() => validateServer(input));
  assert.throws(() => validateServer({ serverName: 'x', transport: 'streamable-http', url: 'https://user:secret@x' }));
  assert.equal(validateServer({ serverName: 'x', transport: 'streamable-http', url: 'https://example.test', headers: { Authorization: 'secret' } }).enabled, false);
});
test('MCP operations serialize, await activation and disposal, and redact state', async () => {
  const events = [];
  const ctx = { plugin(namespace, config) {
    assert.equal(namespace.named, true); assert.equal(config.enabled, undefined);
    events.push('mount');
    return { then(resolve) { events.push('await'); resolve(); }, async dispose() { await Promise.resolve(); events.push('dispose'); } };
  } };
  const manager = createMcpManager(ctx, async () => ({ named: true }));
  await manager.replace([server()]); assert.deepEqual(events, []);
  await Promise.all([manager.replace([server({ enabled: true, env: { SECRET: 'private' } })]), manager.replace([server({ enabled: true })])]);
  assert.deepEqual(events, ['mount', 'await', 'dispose', 'mount', 'await']);
  assert.equal(JSON.stringify(manager.snapshot()).includes('private'), false);
  assert.equal(manager.snapshot()[0].status, 'mounted');
  await manager.dispose(); assert.equal(events.at(-1), 'dispose');
});
test('activation failures contain no raw errors or secrets', async () => {
  const manager = createMcpManager({ plugin() { throw new Error('secret'); } }, async () => ({}));
  await manager.replace([server({ enabled: true })]);
  assert.equal(manager.snapshot()[0].status, 'activation-failed');
  assert.equal(JSON.stringify(manager.snapshot()).includes('secret'), false);
});
test('hooks deny deterministically and audit only bounded metadata', () => {
  let guard, observe; let disposed = 0;
  const hooks = createHooksManager({ tools: { guard(fn) { guard = fn; return () => disposed++; } }, on(name, fn) { assert.equal(name, 'tools/result'); observe = fn; return () => disposed++; } });
  hooks.replace({ enabled: true, deny: ['bash', 'danger_*'], audit: true, auditLimit: 2 });
  assert.ok(guard({ name: 'danger_delete', args: { secret: 'x' } }));
  assert.equal(guard({ name: 'read' }), undefined);
  for (let i = 0; i < 4; i++) observe({ name: 'read', args: 'secret', token: 'private', agent: {} }, { secret: 'result' });
  assert.equal(hooks.snapshot().events.length, 2);
  assert.deepEqual(Object.keys(hooks.snapshot().events[0]), ['time', 'tool', 'event']);
  hooks.dispose(); assert.equal(disposed, 2);
  assert.equal(matchesTool('a*b', 'axxxb'), true); assert.equal(matchesTool('a*b', 'axxxc'), false);
  assert.throws(() => validateHooks({ deny: ['(bad)+'] }));
});
test('ownership fails closed and editor callback is synchronous and complete', async () => {
  const entry = { options: { id: 'majed' } }; let result;
  const editor = { entries: () => [entry], configuration: () => ({ entry, inherited: {} }), async edit(e, change) { assert.equal(e, entry); result = change({ skills: { enabled: true } }, { other: 1 }); assert.equal(typeof result?.then, 'undefined'); } };
  assert.equal(createOwnedPersistence(editor, { id: 'majed' }).available(), false);
  const persistence = createOwnedPersistence(editor, { id: 'majed', isOwnedRoot: row => row === entry });
  assert.equal(persistence.available(), true);
  await persistence.save({ servers: [], hooks: {} }); assert.equal(result.other, undefined); assert.equal(result.skills.enabled, true); assert.equal(result.managers.hooks.enabled, false);
  editor.entries = () => [entry, entry]; assert.equal(persistence.available(), false); await assert.rejects(persistence.save({}));
});
test('service refuses mutation without ownership and never echoes secrets', async () => {
  const service = createManagerService({ tools: {}, plugin() { throw new Error('private'); } });
  await service.ready;
  assert.equal((await service.snapshot()).writable, false);
  assert.equal((await service.update({ servers: [server({ env: { SECRET: 'private' } })] })).ok, false);
  assert.equal(JSON.stringify(await service.snapshot()).includes('private'), false);
  await service.dispose();
});
