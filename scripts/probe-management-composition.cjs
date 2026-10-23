// Synthetic-only exported-plugin proof, not live management acceptance.
// Invoke through test-management-composition.mjs: it sanitizes env and creates disposable HOME.
const assert = require('node:assert/strict');
const { realpathSync } = require('node:fs');
const { basename, join } = require('node:path');
const { Readable } = require('node:stream');
const { EventEmitter } = require('node:events');
const { syncBuiltinESMExports } = require('node:module');
const base = process.argv[2];
const flags = new Set(process.argv.slice(3));
assert.ok(base, 'Pass the installed runtime directory.');
assert.ok([...flags].every(flag => ['--red-membership'].includes(flag)), 'Unknown probe flag.');
assert.equal(process.env.DSH_MANAGEMENT_COMPOSITION_PROBE, '1', 'Use the isolated runner.');
const home = realpathSync(process.env.HOME);
assert.ok(basename(home).startsWith('dsh-management-composition-'), 'Disposable HOME required.');
assert.equal(realpathSync(process.env.DSH_HOME), home);
assert.equal(realpathSync(process.cwd()), home);

// Fail closed on accidental network/listener/subprocess use, including loopback.
const forbidden = () => { throw new Error('Admission probe forbids network, listeners and child processes.'); };
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
const native = load('dsh-client-connection');
const { CredentialProvider } = load('dsh-credentials');
// Only this synthetic provider is installed. Never load a filesystem credential provider.
class MemoryCredentials extends CredentialProvider {
  record;
  async modifyRecord(key, update) {
    assert.equal(key, 'client-connection/browser-session');
    const next = await update(this.record);
    if (next !== undefined) this.record = next;
    return this.record;
  }
}
// Inert public carrier boundary: captures registrations but never opens a socket.
class MemoryWebServer extends Service {
  protocol = 'http:';
  host = '127.0.0.1';
  routes = [];
  constructor(ctx) { super(ctx, 'webServer'); }
  register(route) {
    this.routes.push(route);
    return () => {
      const index = this.routes.indexOf(route);
      if (index !== -1) this.routes.splice(index, 1);
    };
  }
}
class MemoryResponse extends EventEmitter {
  status;
  headers;
  writableEnded = false;
  destroyed = false;
  chunks = [];
  writeHead(status, headers = {}) { this.status = status; this.headers = headers; }
  write(chunk) { this.chunks.push(Buffer.from(chunk)); return true; }
  end(chunk) { if (chunk !== undefined) this.write(chunk); this.writableEnded = true; }
  text() { return Buffer.concat(this.chunks).toString('utf8'); }
}
function incoming(path, headers = {}, method = 'POST', body = '{}') {
  const req = Readable.from(method === 'POST' ? [Buffer.from(body)] : []);
  req.url = path;
  req.method = method;
  req.headers = { host: '127.0.0.1:43123', 'content-type': 'application/json', ...headers };
  return req;
}
const { SessionStore } = load('dsh-session');
const { SessionPersistence } = load('dsh-session-persistence');
const { WorkspaceRegistry } = load('dsh-workspace');
const { DomainFacility } = load('dsh-storage-domain');
const { mkdirSync } = require('node:fs');
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

let checkpoint = 'mount';
async function main() {
  const { resolveManagementScope } = await import('../lib/management/scope.js');
  const ctx = new Context();
  const fibers = [];
  const mount = async plugin => { const fiber = ctx.plugin(plugin); fibers.push(fiber); await fiber; return fiber; };
  const project = join(home, 'project');
  const foreign = join(home, 'foreign');
  mkdirSync(project); mkdirSync(foreign);
  try {
    await mount({ apply(owner) { new MemoryCredentials(owner); new MemoryWebServer(owner); new MemoryStorage(owner); new MemoryPersistence(owner); } });
    await mount(SessionStore);
    await mount({ inject: ['storage'], apply(owner) {
      const facility = new DomainFacility(owner, { backend: 'scope-memory' });
      owner.provide('storageDomain', facility);
      owner.effect(() => () => facility.closeAll());
    } });
    await mount(WorkspaceRegistry);
    await mount({ inject: ['credentials'], apply: owner => native.apply(owner, { cookieMaxAgeDays: 1 }) });
    const workspace = await ctx.workspaceRegistry.create(project);
    ctx.sessions.create('live', { meta: { cwd: project } });
    await workspace.attachSession('live');
    let filesystem; // Undefined uses the resolver's real-fs default; never patch host/runtime APIs.
    let resolutions = 0;
    const operations = [];
    const path = '/api/dsh-majed/composition-probe';
    await mount({ inject: ['connection'], apply(owner) {
      owner.connection.fetch.register({ path, methods: ['POST'], requestBody: 'buffered',
        fetch: async function(request) {
          assert.equal(arguments.length, 1);
          try {
            const selectors = await request.json();
            resolutions++;
            const scope = await resolveManagementScope(ctx, selectors, request.signal, filesystem);
            if (!scope) return new Response(null, { status: 404 });
            request.signal.throwIfAborted();
            operations.push(scope);
            return Response.json(scope);
          } catch (error) {
            if (error.name === 'AbortError') return new Response(null, { status: 499 });
            throw error;
          }
        },
      });
    } });
    const connection = ctx.get('connection');
    const api = ctx.get('webServer').routes.find(route => route.path === '/api');
    const launch = new URL(connection.authenticatedUrl('http://127.0.0.1:43123/'));
    const exchange = new MemoryResponse();
    assert.equal(connection.authorizeIndex(incoming(launch.pathname + launch.search, {}, 'GET'), exchange), false);
    assert.equal(exchange.status, 303);
    const cookie = exchange.headers['set-cookie'].split(';', 1)[0];
    const send = async (selectors, headers = { cookie }, response = new MemoryResponse(), route = path, method = 'POST') => {
      const beforeWrites = writes;
      await api.handler(incoming(route, headers, method, JSON.stringify(selectors)), response);
      assert.equal(writes, beforeWrites, 'Scope requests are read-only, including successful resolutions');
      assert.equal(response.writableEnded, true);
      return response;
    };
    checkpoint = 'authenticated-live-scope';
    const selectors = { sessionId: 'live', workspaceId: workspace.id };
    const accepted = await send(selectors);
    assert.equal(accepted.status, 200);
    assert.deepEqual(JSON.parse(accepted.text()), { sessionId: 'live', workspaceId: workspace.id, projectPath: project });
    assert.equal(operations.length, 1);
    assert.equal(resolutions, 1);
    checkpoint = 'admission-before-resolution';
    const rejected = async (input, headers = { cookie }, expected = 404, route = path, method = 'POST') => {
      const before = { operations: operations.length, writes };
      assert.equal((await send(input, headers, new MemoryResponse(), route, method)).status, expected);
      assert.equal(operations.length, before.operations, 'Rejection must not invoke operation');
      assert.equal(writes, before.writes, 'Rejection must not write workspace storage');
    };
    const beforeAuth = { resolutions, statCalls };
    const [cookieName, cookieValue] = cookie.split('=');
    const cookieParts = cookieValue.split('.');
    cookieParts[2] = (cookieParts[2][0] === 'A' ? 'B' : 'A') + cookieParts[2].slice(1);
    for (const headers of [{}, { cookie: 'invalid=synthetic' }, { cookie: `${cookieName}=${cookieParts.join('.')}` }, { 'x-fixture-owner': 'yes' },
      { authorization: `Bearer ${launch.searchParams.get('token')}` },
      { cookie, origin: 'https://attacker.invalid' }]) {
      await rejected(selectors, headers, headers.origin ? 403 : 401);
    }
    assert.equal(resolutions, beforeAuth.resolutions, 'Native admission must precede resolver invocation');
    assert.equal(statCalls, beforeAuth.statCalls);
    await rejected(selectors, { cookie }, 404, path + '/suffix');
    await rejected(selectors, { cookie }, 404, path, 'GET');
    assert.equal(resolutions, beforeAuth.resolutions);

    checkpoint = 'selectors-and-cold-membership';
    ctx.sessions.create('foreign', { meta: { cwd: foreign } });
    const other = await ctx.workspaceRegistry.create(foreign);
    await other.attachSession('foreign');
    for (const input of [null, {}, { workspaceId: workspace.id }, { sessionId: 'live' },
      { ...selectors, sessionId: 'missing' }, { ...selectors, workspaceId: other.id },
      { ...selectors, sessionId: 'foreign' }, { ...selectors, workspaceId: 'unknown' },
      { sessionId: {}, workspaceId: workspace.id }, { projectPath: project }]) await rejected(input);
    assert.equal((await send({ ...selectors, projectPath: foreign, cwd: foreign, path: foreign })).status, 200);
    assert.equal(operations.at(-1).projectPath, project, 'Client paths must never override canonical scope');
    ctx.sessions.get('live').append('working-directory/change', { cwd: foreign });
    assert.equal((await send(selectors)).status, 200);
    assert.equal(operations.at(-1).projectPath, project);
    const header = (id, cwd = project) => ({ version: 4, id, cwd, createdAt: 1, isSeeded: false });
    records.set('cold', header('cold'));
    await workspace.attachSession('cold');
    const cold = { ...selectors, sessionId: 'cold' };
    // Negative control changes an actual registry fact, never the expected assertion.
    if (flags.has('--red-membership')) await workspace.detachSession('cold');
    const beforeCold = statCalls;
    assert.equal((await send(cold)).status, 200, 'Admitted cold member must resolve');
    assert.equal(statCalls, beforeCold + 1);
    assert.equal(ctx.sessions.get('cold'), undefined, 'Cold observation must not publish/resume a session');
    records.set('cold', header('wrong-id')); await rejected(cold);
    records.set('cold', header('cold', foreign)); await rejected(cold);
    records.set('cold', header('cold'));
    ctx.sessions.create('unaccounted', { meta: { cwd: project } });
    await rejected({ ...selectors, sessionId: 'unaccounted' });

    checkpoint = 'cancellation-and-stale-facts';
    const cancelledResponse = new MemoryResponse();
    onStat = async (id, signal) => {
      assert.equal(id, 'cold');
      cancelledResponse.emit('close');
      assert.equal(signal.aborted, true, 'Actual HTTP bridge must propagate close to resolver signal');
    };
    const beforeCancel = { operations: operations.length, writes };
    assert.equal((await send(cold, { cookie }, cancelledResponse)).status, 499);
    assert.equal(operations.length, beforeCancel.operations);
    assert.equal(writes, beforeCancel.writes);
    onStat = async () => { ctx.sessions.create('cold', { meta: { cwd: foreign } }); };
    await rejected(cold);
    onStat = undefined;

    checkpoint = 'live-publication-during-filesystem-await';
    const realFilesystem = require('node:fs/promises');
    for (const boundary of ['realpath', 'stat']) {
      const id = `published-during-${boundary}`;
      records.set(id, header(id));
      await workspace.attachSession(id);
      let observations = 0;
      filesystem = { realpath: realFilesystem.realpath, stat: realFilesystem.stat,
        async [boundary](path) {
          const observed = await realFilesystem[boundary](path);
          assert.equal(ctx.sessions.get(id), undefined);
          ctx.sessions.create(id, { meta: { cwd: foreign } });
          observations++;
          return observed;
        },
      };
      await rejected({ ...selectors, sessionId: id });
      assert.equal(observations, 1, 'Publication must occur inside the awaited filesystem observation');
    }
    checkpoint = 'live-disappearance-during-filesystem-await';
    for (const boundary of ['realpath', 'stat']) {
      const id = `disappeared-during-${boundary}`;
      const session = ctx.sessions.prepare(id, { meta: { cwd: project } });
      const detach = ctx.sessions.enter(session);
      records.set(id, header(id)); // A matching cold record must not rescue vanished live authority.
      await workspace.attachSession(id);
      let observations = 0;
      filesystem = { realpath: realFilesystem.realpath, stat: realFilesystem.stat,
        async [boundary](path) {
          const observed = await realFilesystem[boundary](path);
          assert.equal(ctx.sessions.get(id), session);
          detach();
          observations++;
          return observed;
        },
      };
      try {
        await rejected({ ...selectors, sessionId: id });
        assert.equal(observations, 1);
        assert.equal(ctx.sessions.get(id), undefined);
      } finally { detach(); }
    }
    filesystem = undefined;

    checkpoint = 'canonical-path-substitution';
    const { symlinkSync, unlinkSync, lstatSync } = require('node:fs');
    const { dirname } = require('node:path');
    const alias = join(home, 'alias');
    symlinkSync(project, alias);
    ctx.sessions.create('alias', { meta: { cwd: alias } });
    await workspace.attachSession('alias');
    const aliasSelectors = { ...selectors, sessionId: 'alias' };
    assert.equal((await send(aliasSelectors)).status, 200);
    assert.equal(operations.at(-1).projectPath, project);
    assert.equal(dirname(alias), home); assert.equal(lstatSync(alias).isSymbolicLink(), true);
    unlinkSync(alias); symlinkSync(foreign, alias);
    await rejected(aliasSelectors);
    assert.equal(dirname(alias), home); assert.equal(lstatSync(alias).isSymbolicLink(), true);
    unlinkSync(alias);
    await rejected(aliasSelectors);
    await workspace.detachSession('live');
    await rejected(selectors);
    await ctx.workspaceRegistry.delete(workspace.id);
    await rejected(aliasSelectors);
    console.log(JSON.stringify({ runtime: require(join(base, 'package.json')).version, node: process.versions.node,
      checkpoint, checks: ['native admission before scope and operation', 'exact Fetch method/path',
        'live/cold membership and canonical scope', 'untrusted path selectors ignored',
        'close cancellation and cold/live race fail closed',
        'conflicting live publication during realpath/stat awaits rejected',
        'live disappearance during realpath/stat awaits rejected', 'fresh symlink substitution and removal rejected',
        'rejections perform no operation or storage writes'],
      limitations: ['Synthetic memory credentials, persistence and KV; no operational state or providers.',
        'In-memory HTTP streams and WebServer registration; no listener, browser or paired remote service.',
        'Read-only canonical scope observation, not a race-free filesystem capability for later mutations.',
        'No production Manager wiring, packaging, Settings/client, Skills/MCP composition or T02A closure.',
        'No Command Approval, provenance, challenge, persistence or execution.'] }));
  } finally { for (const fiber of fibers.reverse()) await fiber.dispose(); }
  assert.equal(closes, 1);
}
main().catch(error => { console.error(`Composition probe failed at ${checkpoint}: ${error?.code || error?.name || 'Error'}`); process.exitCode = 1; });
