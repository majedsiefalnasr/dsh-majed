// Actual remote/native algorithms; only public carriers and persistence are doubled.
const assert = require('node:assert/strict');
const { realpathSync } = require('node:fs');
const { basename, join } = require('node:path');
const { pathToFileURL } = require('node:url');
const { Readable, Writable } = require('node:stream');
const { once } = require('node:events');
const { syncBuiltinESMExports } = require('node:module');
const [base, remoteFile, ...flags] = process.argv.slice(2);
assert.ok(base && remoteFile);
assert.ok(flags.every(flag => ['--red-membership'].includes(flag)));
assert.equal(process.env.DSH_MANAGEMENT_SCOPED_REMOTE_PROBE, '1', 'Use the isolated runner.');
const home = realpathSync(process.env.HOME);
assert.ok(basename(home).startsWith('dsh-management-scoped-remote-'));
assert.equal(realpathSync(process.env.DSH_HOME), home);
assert.equal(realpathSync(process.cwd()), home);

function forbidden() { throw new Error('Remote probe forbids network, listeners, DNS and child processes.'); }
for (const name of ['node:http', 'node:https']) {
  require(name).request = forbidden;
  require(name).get = forbidden;
}
require('node:net').Socket.prototype.connect = forbidden;
require('node:net').Server.prototype.listen = forbidden;
require('node:tls').connect = forbidden;
for (const name of ['send', 'bind', 'connect']) require('node:dgram').Socket.prototype[name] = forbidden;
for (const dns of [require('node:dns'), require('node:dns/promises')]) {
  for (const name of Object.keys(dns)) if (typeof dns[name] === 'function') dns[name] = forbidden;
}
for (const name of ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']) {
  require('node:child_process')[name] = forbidden;
}
globalThis.fetch = forbidden;
if (typeof globalThis.WebSocket === 'function') globalThis.WebSocket = forbidden;

let innerHandler;
let currentInnerResponse;
let proxyCalls = 0;
let innerCalls = 0;
const port = 43123;
// Explicit Node HTTP public-boundary double. No fallback to the real request.
function memoryHttpRequest(options, callback) {
  assert.equal(arguments.length, 2);
  assert.equal(options.host, '127.0.0.1');
  assert.equal(options.port, port);
  assert.equal(typeof options.path, 'string');
  assert.ok(options.path.startsWith('/api/'));
  assert.equal(options.method, 'POST');
  assert.equal(options.headers.host, `127.0.0.1:${port}`);
  assert.equal(options.headers['sec-fetch-site'], 'same-origin');
  assert.equal(options.headers.origin, undefined);
  assert.equal(options.headers.authorization, undefined);
  assert.equal(options.headers['x-dsh-remote-device'], undefined);
  assert.equal(options.headers['x-fixture-source'], undefined);
  if (options.headers.cookie !== undefined) assert.equal(options.headers.cookie, expectedInnerCookie);
  proxyCalls++;
  const chunks = [];
  return new Writable({
    write(chunk, encoding, done) { chunks.push(Buffer.from(chunk)); done(); },
    final(done) {
      // Preserve forwarded headers exactly; never repair the inner carrier.
      const forwardedHeaders = { ...options.headers };
      assert.equal(forwardedHeaders['content-type'], 'application/json');
      const req = incoming(options.path, forwardedHeaders, options.method, Buffer.concat(chunks));
      const response = new MemoryResponse();
      currentInnerResponse = response;
      innerCalls++;
      Promise.resolve(innerHandler(req, response)).then(async () => {
        if (!response.writableFinished) await once(response, 'finish');
        const upstream = Readable.from([Buffer.concat(response.chunks)]);
        upstream.statusCode = response.status;
        upstream.headers = response.headers;
        callback(upstream);
        done();
      }).catch(done);
    },
  });
}
require('node:http').request = memoryHttpRequest;
syncBuiltinESMExports();

class MemoryResponse extends Writable {
  status;
  headers = {};
  chunks = [];
  headersSent = false;
  _write(chunk, encoding, done) { this.chunks.push(Buffer.from(chunk)); done(); }
  writeHead(status, headers = {}) { this.status = status; this.headers = headers; this.headersSent = true; return this; }
  text() { return Buffer.concat(this.chunks).toString('utf8'); }
}
function incoming(path, headers = {}, method = 'POST', body = '{}') {
  const req = Readable.from(method === 'POST' ? [Buffer.from(body)] : []);
  req.url = path;
  req.method = method;
  req.headers = { ...headers };
  req.socket = { remoteAddress: '127.0.0.1' };
  return req;
}
const load = name => require(join(base, 'node_modules', '@deepseek-ai', name, 'lib/index.js'));
const { Context, Service } = load('cordis');
const native = load('dsh-client-connection');
const { CredentialProvider } = load('dsh-credentials');
class MemoryCredentials extends CredentialProvider {
  record;
  async modifyRecord(key, update) {
    assert.equal(key, 'client-connection/browser-session');
    const next = await update(this.record);
    if (next !== undefined) this.record = next;
    return this.record;
  }
}
class MemoryWebServer extends Service {
  protocol = 'http:';
  host = '127.0.0.1';
  routes = [];
  constructor(ctx) { super(ctx, 'webServer'); }
  register(route) {
    this.routes.push(route);
    return () => { this.routes.splice(this.routes.indexOf(route), 1); };
  }
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

let signedCookie;
let expectedInnerCookie;
let checkpoint = 'guard-validation';
const checks = [];
async function main() {
  assert.equal((await import('node:http')).request, memoryHttpRequest);
  assert.throws(() => memoryHttpRequest({ host: 'remote.invalid' }, () => {}));
  for (const attempt of [
    () => require('node:http').get('http://127.0.0.1/'),
    () => require('node:https').request('https://example.invalid/'),
    () => new (require('node:net').Socket)().connect(1, '127.0.0.1'),
    () => require('node:net').createServer().listen(0),
    () => require('node:tls').connect(443),
    () => require('node:dgram').Socket.prototype.bind.call({}, 0),
    () => require('node:dns').lookup('example.invalid'),
    () => require('node:dns/promises').resolveTxt('example.invalid'),
    () => new (require('node:dns').Resolver)(),
    () => new (require('node:dns/promises').Resolver)(),
    () => require('node:child_process').spawn('forbidden'),
    () => globalThis.fetch('http://127.0.0.1/'),
  ]) assert.throws(attempt, /Remote probe forbids/);
  checks.push('Active fail-closed guards and validated in-memory HTTP interception; no sockets or subprocesses.');
  checkpoint = 'public-services';
  const remote = await import(pathToFileURL(remoteFile).href);
  const { resolveManagementScope } = await import('../lib/management/scope.js');
  const ctx = new Context();
  const fibers = [];
  const mount = async plugin => { const fiber = ctx.plugin(plugin); fibers.push(fiber); await fiber; };
  const project = join(home, 'project');
  const foreign = join(home, 'foreign');
  mkdirSync(project); mkdirSync(foreign);
  let operations = 0;
  let resolutions = 0;
  let authCalls = 0;
  let invalidations = 0;
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
    checkpoint = 'create-other-workspace';
    const other = await ctx.workspaceRegistry.create(foreign);
    checkpoint = 'session-fixtures';
    ctx.sessions.create('live', { meta: { cwd: project } });
    await workspace.attachSession('live');
    ctx.sessions.create('unpublished-member', { meta: { cwd: project } });
    // Membership is established while cwd agrees, then a fresh filesystem observation disagrees.
    records.set('canonical-mismatch-cold', { version: 4, id: 'canonical-mismatch-cold', cwd: project, createdAt: 1, isSeeded: false });
    await workspace.attachSession('canonical-mismatch-cold');
    records.set('canonical-mismatch-cold', { version: 4, id: 'canonical-mismatch-cold', cwd: foreign, createdAt: 1, isSeeded: false });
    checkpoint = 'fetch-registration';
    const path = '/api/dsh-majed/scoped-remote-probe';
    const query = '?scope=alpha%2Fbeta&tag=one&tag=two';
    await mount({ inject: ['connection'], apply(owner) {
      owner.connection.fetch.register({ path, methods: ['POST'], requestBody: 'buffered',
        fetch: async function(request) {
          assert.equal(arguments.length, 1);
          assert.ok(request instanceof Request);
          assert.equal(new URL(request.url).pathname, path);
          assert.equal(new URL(request.url).search, query);
          assert.equal(request.headers.get('content-type'), 'application/json');
          const selectors = await request.json();
          assert.equal(selectors.text, 'paired ✓');
          try {
            resolutions++;
            const scope = await resolveManagementScope(ctx, selectors, request.signal);
            if (!scope) return new Response(null, { status: 404 });
            request.signal.throwIfAborted();
            operations++;
            return Response.json({ ok: true, synthetic: true, scope });
          } catch (error) {
            if (error.name === 'AbortError') return new Response(null, { status: 499 });
            throw error;
          }
        },
      });
    } });
    const connection = ctx.get('connection');
    innerHandler = ctx.get('webServer').routes.find(route => route.path === '/api').handler;
    const launch = new URL(connection.authenticatedUrl(`http://127.0.0.1:${port}/`));
    const exchange = new MemoryResponse();
    assert.equal(connection.authorizeIndex(incoming(launch.pathname + launch.search, { host: `127.0.0.1:${port}` }, 'GET'), exchange), false);
    assert.equal(exchange.status, 303);
    signedCookie = exchange.headers['set-cookie'].split(';', 1)[0];
    let cookie = signedCookie;
    const liveDevices = new Set(['synthetic-live']);
    const service = { config: { cookieName: 'synthetic-device' }, touchDevice: id => liveDevices.has(id) };
    const auth = { ready() { authCalls++; expectedInnerCookie = cookie; return cookie; }, invalidate() { invalidations++; } };
    const [outer] = remote.makeRemoteApiRoutes({ service, port: () => port, auth });
    assert.equal(outer.path, '/remote');
    const paired = { cookie: 'synthetic-device=synthetic-live; outer-only=never-forward',
      origin: 'https://remote.invalid', host: 'remote.invalid', 'sec-fetch-site': 'cross-site',
      authorization: 'Bearer synthetic-not-native', 'x-fixture-source': 'local' };
    const selectors = { sessionId: 'live', workspaceId: workspace.id, text: 'paired ✓' };
    const send = async (input = selectors, headers = paired, route = '/remote' + path + query) => {
      const beforeWrites = writes;
      const body = JSON.stringify(input);
      const response = new MemoryResponse();
      outer.handler(incoming(route, { 'content-type': 'application/json',
        'content-length': String(Buffer.byteLength(body)), ...headers }, 'POST', body), response);
      if (!response.writableFinished) await once(response, 'finish');
      assert.equal(writes, beforeWrites, 'Request must not write workspace storage.');
      return response;
    };
    checkpoint = 'paired-native-live-scope';
    const accepted = await send({ ...selectors, projectPath: foreign, cwd: foreign });
    assert.equal(accepted.status, 200);
    assert.deepEqual(JSON.parse(accepted.text()), { ok: true, synthetic: true,
      scope: { sessionId: 'live', workspaceId: workspace.id, projectPath: project } });
    assert.deepEqual([authCalls, proxyCalls, innerCalls, resolutions, operations], [1, 1, 1, 1, 1]);
    checks.push('One request traverses actual remote gate/rewrite/proxy, native BrowserAuth/exact Fetch and real resolver before inert scoped operation; client paths ignored.');
    checkpoint = 'pairing-and-inner-admission';
    const snapshot = () => [authCalls, proxyCalls, innerCalls, resolutions, statCalls, operations];
    for (const headers of [{}, { cookie: 'synthetic-device=synthetic-revoked' }]) {
      const before = snapshot();
      const rejected = await send(selectors, headers);
      assert.equal(rejected.status, 403);
      assert.equal(JSON.parse(rejected.text()).result.error.code, 'unpaired');
      assert.deepEqual(snapshot(), before, 'Pairing denial precedes all inner work.');
    }
    const beforeNative = [resolutions, statCalls, operations];
    for (const credential of [undefined, signedCookie.slice(0, -1) + (signedCookie.at(-1) === 'A' ? 'B' : 'A')]) {
      cookie = credential;
      assert.equal((await send()).status, 401);
      assert.deepEqual([resolutions, statCalls, operations], beforeNative, 'Native admission precedes scope and operation.');
    }
    cookie = signedCookie;
    assert.equal(invalidations, 1);
    checks.push('Missing/revoked pairing and missing/invalid native cookie deny before scope and operation.');
    checkpoint = 'scope-denials';
    for (const input of [
      { ...selectors, sessionId: 'missing' }, { ...selectors, workspaceId: other.id },
      { ...selectors, workspaceId: 'missing' }, { ...selectors, sessionId: 'unpublished-member' },
      { ...selectors, sessionId: 'canonical-mismatch-cold' },
    ]) {
      const before = operations;
      assert.equal((await send(input)).status, 404);
      assert.equal(operations, before, 'Invalid scoped selector must never perform the operation.');
    }
    const beforeExact = [resolutions, operations];
    assert.equal((await send(selectors, paired, '/remote' + path + '/suffix' + query)).status, 404);
    assert.deepEqual([resolutions, operations], beforeExact);
    checks.push('Wrong session/workspace, unpublished membership, canonical mismatch and exact-path suffix deny without operation.');
    checkpoint = 'authorized-cold-membership';
    records.set('cold', { version: 4, id: 'cold', cwd: project, createdAt: 1, isSeeded: false });
    await workspace.attachSession('cold');
    if (flags.includes('--red-membership')) await workspace.detachSession('cold');
    const beforeCold = statCalls;
    const cold = { ...selectors, sessionId: 'cold' };
    const acceptedCold = await send(cold);
    assert.equal(acceptedCold.status, 200, 'Admitted cold member must resolve.');
    assert.deepEqual(JSON.parse(acceptedCold.text()).scope, { sessionId: 'cold', workspaceId: workspace.id, projectPath: project });
    assert.equal(statCalls, beforeCold + 1);
    assert.equal(ctx.sessions.get('cold'), undefined, 'Read-only cold observation must not publish/resume.');
    checkpoint = 'inner-close-cancellation';
    onStat = async (id, signal) => {
      assert.equal(id, 'cold');
      currentInnerResponse.emit('close');
      assert.equal(signal.aborted, true, 'Actual native HTTP close propagates to resolver.');
    };
    const beforeCancel = operations;
    assert.equal((await send(cold)).status, 499);
    assert.equal(operations, beforeCancel);
    onStat = undefined;
    checks.push('Cold member resolves without publication; inner carrier close aborts actual native Fetch/resolver before operation.');
  } finally { for (const fiber of fibers.reverse()) await fiber.dispose(); }
  assert.equal(closes, 1);
  checkpoint = 'completed';
  console.log(JSON.stringify({ runtime: require(join(base, 'package.json')).version,
    node: process.versions.node, checkpoint, checks,
    counts: { proxyCalls, innerCalls, resolutions, operations, invalidations, closes },
    limitations: ['Synthetic memory credentials/pairing/persistence/KV and disposable project directories.',
      'Explicit in-memory Node HTTP carrier, not sockets/listeners/TLS/browser or mounted remote service.',
      'Cancellation starts at inner response close; no outer disconnect propagation claim.',
      'Inert preparatory scoped operation only; no production Manager CRUD, Skills/MCP composition or T02A closure.',
      'No operational inner-auth discovery, pairing persistence or trusted Command Approval provenance.'] }, null, 2));
}
main().catch(error => {
  console.error(`Scoped remote probe failed at ${checkpoint}: ${error?.code || error?.name || 'Error'}`);
  process.exitCode = 1;
});
