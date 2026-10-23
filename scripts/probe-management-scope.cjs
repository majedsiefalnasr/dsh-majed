// Synthetic-only exported-plugin proof, not live management acceptance.
// Invoke through test-management-scope-recovered.mjs: it sanitizes env and creates disposable HOME.
const assert = require('node:assert/strict');
const { realpathSync } = require('node:fs');
const { basename, join } = require('node:path');
const { syncBuiltinESMExports } = require('node:module');
const base = process.argv[2];
const flags = new Set(process.argv.slice(3));
assert.ok(base, 'Pass the installed runtime directory.');
assert.ok([...flags].every(flag => ['--red-membership'].includes(flag)), 'Unknown probe flag.');
assert.equal(process.env.DSH_MANAGEMENT_SCOPE_PROBE, '1', 'Use the isolated runner.');
const home = realpathSync(process.env.HOME);
assert.ok(basename(home).startsWith('dsh-management-scope-'), 'Disposable HOME required.');
assert.equal(realpathSync(process.env.DSH_HOME), home);
assert.equal(realpathSync(process.cwd()), home);

// Fail closed on accidental network/listener/subprocess use, including loopback.
const forbidden = () => { throw new Error('Scope probe forbids network, listeners and child processes.'); };
for (const name of ['node:http', 'node:https']) {
  const module = require(name);
  module.request = forbidden;
  module.get = forbidden;
}
require('node:net').Socket.prototype.connect = forbidden;
require('node:net').Server.prototype.listen = forbidden;
require('node:tls').connect = forbidden;
require('node:dgram').Socket.prototype.send = forbidden;
require('node:dgram').Socket.prototype.bind = forbidden;
// DNS has independent native bindings: socket guards do not cover promise/Resolver APIs.
for (const dns of [require('node:dns'), require('node:dns/promises')]) {
  for (const name of Object.keys(dns)) {
    if (typeof dns[name] === 'function') dns[name] = forbidden;
  }
}
assert.equal(require('node:dns').promises.lookup, forbidden);
assert.equal(require('node:dns/promises').resolveTxt, forbidden);
assert.equal(require('node:dns').Resolver, forbidden);
assert.equal(require('node:dns/promises').Resolver, forbidden);
for (const name of ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']) {
  require('node:child_process')[name] = forbidden;
}
globalThis.fetch = forbidden;
if (typeof globalThis.WebSocket === 'function') globalThis.WebSocket = forbidden;
syncBuiltinESMExports();

const load = name => require(join(base, 'node_modules', '@deepseek-ai', name, 'lib/index.js'));
const { Context, Service } = load('cordis');
const { SessionStore } = load('dsh-session');
const { SessionPersistence } = load('dsh-session-persistence');
const { WorkspaceRegistry } = load('dsh-workspace');
const { DomainFacility } = load('dsh-storage-domain');
const { mkdirSync } = require('node:fs');
const { realpath, stat } = require('node:fs/promises');
const records = new Map();
let statCalls = 0;
let onStat;
class MemoryPersistence extends SessionPersistence {
  async list() { return [...records.values()].map(header => ({ header, revision: 'fixture' })); }
  async stat(id, { signal } = {}) {
    statCalls++;
    signal?.throwIfAborted();
    await onStat?.(id, signal);
    signal?.throwIfAborted();
    const header = records.get(id);
    return header ? { header, revision: 'fixture' } : undefined;
  }
  open() { throw new Error('No event reads or Agent resume permitted'); }
  create() { throw new Error('No persistence writes permitted'); }
}
// Synthetic KV medium only: actual DomainFacility owns schemas, tables and write chains.
let writes = 0;
let closes = 0;
const unit = {
  async loadAll() { return { global: null, tables: { workspaces: {} } }; },
  async setGlobal() { writes++; }, async putRecord() { writes++; },
  async deleteRecord() { writes++; }, async close() { closes++; },
};
class MemoryStorage extends Service {
  constructor(ctx) { super(ctx, 'storage'); }
  backend = { get(name) { assert.equal(name, 'scope-memory'); return { kv: {
    async open(descriptor) { assert.equal(descriptor.name, 'workspace'); return unit; },
  } }; } };
}
// Probe-local policy composition, NOT a production Manager resolver.
async function resolveScope(ctx, id, workspaceId, signal) {
  signal?.throwIfAborted();
  let header = ctx.sessions.get(id)?.header;
  if (!header) {
    const snapshot = await ctx.sessionPersistence.stat(id, { signal });
    signal?.throwIfAborted();
    header = ctx.sessions.get(id)?.header ?? snapshot?.header;
  }
  if (!header || header.id !== id || typeof header.cwd !== 'string') return undefined;
  const workspace = ctx.workspaceRegistry.get(workspaceId);
  if (!workspace || !workspace.sessionIds.includes(id)) return undefined;
  let canonical;
  try {
    canonical = await realpath(header.cwd);
    if (!(await stat(canonical)).isDirectory()) return undefined;
  } catch (error) {
    signal?.throwIfAborted();
    if (['ENOENT', 'ENOTDIR'].includes(error.code)) return undefined;
    throw error;
  }
  signal?.throwIfAborted();
  if (ctx.workspaceRegistry.get(workspaceId) !== workspace || !workspace.sessionIds.includes(id)) return undefined;
  return canonical === workspace.path ? canonical : undefined;
}
let checkpoint = 'mount';
async function main() {
  const ctx = new Context();
  const fibers = [];
  const mount = async plugin => { const fiber = ctx.plugin(plugin); fibers.push(fiber); await fiber; return fiber; };
  const project = join(home, 'project');
  const foreign = join(home, 'foreign');
  mkdirSync(project); mkdirSync(foreign);
  try {
    await mount({ apply(owner) { new MemoryStorage(owner); new MemoryPersistence(owner); } });
    await mount(SessionStore);
    await mount({ inject: ['storage'], apply(owner) {
      const facility = new DomainFacility(owner, { backend: 'scope-memory' });
      owner.provide('storageDomain', facility);
      owner.effect(() => () => facility.closeAll());
    } });
    await mount(WorkspaceRegistry);
    assert.ok(ctx.sessions instanceof SessionStore);
    assert.ok(ctx.workspaceRegistry instanceof WorkspaceRegistry);
    const workspace = await ctx.workspaceRegistry.create(project);
    const live = ctx.sessions.create('live', { meta: { cwd: project } });
    await workspace.attachSession(live.id);
    checkpoint = 'actual-service-live-resolution';
    assert.equal(await resolveScope(ctx, 'live', workspace.id), project);
    assert.equal(statCalls, 0);
    live.append('working-directory/change', { cwd: foreign });
    assert.equal(live.header.cwd, project);
    assert.equal(await resolveScope(ctx, 'live', workspace.id), project, 'Later directory event must not redefine creation scope');
    checkpoint = 'membership-and-cold-fallback';
    const header = (id, cwd = project) => ({ version: 4, id, cwd, createdAt: 1, isSeeded: false });
    records.set('cold', header('cold'));
    await workspace.attachSession('cold');
    const beforeCold = statCalls;
    assert.equal(await resolveScope(ctx, 'cold', workspace.id), project);
    assert.equal(statCalls, beforeCold + 1);
    assert.equal(ctx.sessions.get('cold'), undefined, 'Cold observation must not publish/resume a session');
    ctx.sessions.create('unaccounted', { meta: { cwd: project } });
    assert.equal(await resolveScope(ctx, 'unaccounted', workspace.id), flags.has('--red-membership') ? project : undefined);
    const other = await ctx.workspaceRegistry.create(foreign);
    ctx.sessions.create('foreign', { meta: { cwd: foreign } });
    await other.attachSession('foreign');
    assert.equal(await resolveScope(ctx, 'foreign', workspace.id), undefined);
    assert.equal(await resolveScope(ctx, 'missing', workspace.id), undefined);
    assert.equal(await resolveScope(ctx, 'live', 'unknown-workspace'), undefined);
    records.set('cold', header('wrong-id'));
    assert.equal(await resolveScope(ctx, 'cold', workspace.id), undefined);
    records.set('cold', header('cold', foreign));
    assert.ok(workspace.sessionIds.includes('cold'), 'Cached membership alone remains insufficient');
    assert.equal(await resolveScope(ctx, 'cold', workspace.id), undefined);
    records.set('cold', header('cold'));
    const beforeRead = writes;
    await resolveScope(ctx, 'cold', workspace.id);
    assert.equal(writes, beforeRead, 'Read-only resolution must not write workspace storage');

    checkpoint = 'cold-live-race-and-cancellation';
    onStat = async (id, signal) => {
      assert.equal(id, 'cold');
      ctx.sessions.create('cold', { meta: { cwd: foreign } });
    };
    assert.equal(await resolveScope(ctx, 'cold', workspace.id), undefined, 'Live publication wins over stale cold snapshot');
    onStat = undefined;
    const cancelled = new AbortController(); cancelled.abort();
    const beforeAbort = statCalls;
    await assert.rejects(resolveScope(ctx, 'live', workspace.id, cancelled.signal), { name: 'AbortError' });
    assert.equal(statCalls, beforeAbort);
    const during = new AbortController();
    onStat = async (id, signal) => { assert.equal(signal, during.signal); during.abort(); };
    await assert.rejects(resolveScope(ctx, 'missing', workspace.id, during.signal), { name: 'AbortError' });
    onStat = async () => { throw new Error('synthetic-storage-fault'); };
    await assert.rejects(resolveScope(ctx, 'missing', workspace.id), /synthetic-storage-fault/);
    onStat = undefined;

    checkpoint = 'fresh-path-and-stale-registration';
    const { symlinkSync, unlinkSync } = require('node:fs');
    const alias = join(home, 'alias');
    symlinkSync(project, alias);
    ctx.sessions.create('alias', { meta: { cwd: alias } });
    await workspace.attachSession('alias');
    assert.equal(await resolveScope(ctx, 'alias', workspace.id), project);
    // Verify exact owned link location before unlink; never remove its target.
    assert.equal(require('node:path').dirname(alias), home);
    assert.equal(require('node:fs').lstatSync(alias).isSymbolicLink(), true);
    unlinkSync(alias); symlinkSync(foreign, alias);
    assert.ok(workspace.sessionIds.includes('alias'));
    assert.equal(await resolveScope(ctx, 'alias', workspace.id), undefined);
    assert.equal(require('node:fs').lstatSync(alias).isSymbolicLink(), true);
    unlinkSync(alias);
    assert.equal(await resolveScope(ctx, 'alias', workspace.id), undefined);
    await ctx.workspaceRegistry.delete(workspace.id);
    assert.equal(await resolveScope(ctx, 'live', workspace.id), undefined);
    console.log(JSON.stringify({ runtime: require(join(base, 'package.json')).version, node: process.versions.node, checkpoint }));
  } finally { for (const fiber of fibers.reverse()) await fiber.dispose(); }
  assert.equal(closes, 1);
}
main().catch(error => { console.error(`Scope probe failed at ${checkpoint}: ${error?.code || error?.name || 'Error'}`); process.exitCode = 1; });
