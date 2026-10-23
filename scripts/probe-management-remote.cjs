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
assert.ok(flags.every(flag => ['--red-pairing', '--red-content-type'].includes(flag)));
assert.equal(process.env.DSH_MANAGEMENT_REMOTE_PROBE, '1', 'Use the isolated runner.');
const home = realpathSync(process.env.HOME);
assert.ok(basename(home).startsWith('dsh-management-remote-'));
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
      if (flags.includes('--red-content-type')) delete forwardedHeaders['content-type'];
      assert.equal(forwardedHeaders['content-type'], 'application/json');
      const req = incoming(options.path, forwardedHeaders, options.method, Buffer.concat(chunks));
      const response = new MemoryResponse();
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
let signedCookie;
let expectedInnerCookie;
let checkpoint = 'public-export-import';
const checks = [];
async function main() {
  // Import only this leaf graph, never the remote top-level runtime/inner-auth.
  checkpoint = 'guard-validation';
  assert.equal((await import('node:http')).request, memoryHttpRequest);
  assert.throws(() => memoryHttpRequest({ host: 'remote.invalid' }, () => {}));
  for (const [index, attempt] of [
    () => require('node:http').get('http://127.0.0.1/'),
    () => require('node:https').request('https://example.invalid/'),
    () => new (require('node:net').Socket)().connect(1, '127.0.0.1'),
    () => require('node:net').createServer().listen(0),
    () => require('node:tls').connect(443),
    () => require('node:dns').lookup('example.invalid'),
    () => require('node:dns/promises').resolveTxt('example.invalid'),
    () => new (require('node:dns').Resolver)(),
    () => new (require('node:dns/promises').Resolver)(),
    () => require('node:child_process').spawn('forbidden'),
    () => globalThis.fetch('http://127.0.0.1/'),
  ].entries()) {
    checkpoint = `guard-validation-${index}`;
    assert.throws(attempt, /Remote probe forbids/);
  }
  checks.push('Fail-closed network/listener/DNS/subprocess guards actively reject; only validated in-memory HTTP request interception is installed and synchronized to ESM.');
  checkpoint = 'public-export-import';
  const remote = await import(pathToFileURL(remoteFile).href);
  assert.equal(typeof remote.makeRemoteApiRoutes, 'function');
  const ctx = new Context();
  const fibers = [];
  const mount = async plugin => { const fiber = ctx.plugin(plugin); fibers.push(fiber); await fiber; };
  try {
    await mount({ apply(owner) { new MemoryCredentials(owner); new MemoryWebServer(owner); } });
    await mount({ inject: ['credentials'], apply: owner => native.apply(owner, { cookieMaxAgeDays: 1 }) });
    const connection = ctx.get('connection');
    innerHandler = ctx.get('webServer').routes.find(route => route.path === '/api').handler;
    const launch = new URL(connection.authenticatedUrl(`http://127.0.0.1:${port}/`));
    const redemption = new MemoryResponse();
    assert.equal(connection.authorizeIndex(incoming(launch.pathname + launch.search, { host: `127.0.0.1:${port}` }, 'GET'), redemption), false);
    assert.equal(redemption.status, 303);
    signedCookie = redemption.headers['set-cookie'].split(';', 1)[0];
    let operations = 0;
    let authCalls = 0;
    let invalidations = 0;
    let cookie = signedCookie;
    let boundPort = port;
    const liveDevices = new Set(['synthetic-live']);
    // Negative control changes a pairing fact, never an expected assertion.
    if (flags.includes('--red-pairing')) liveDevices.add('synthetic-revoked');
    const touched = [];
    const service = {
      config: { cookieName: 'synthetic-device' },
      touchDevice(id) { touched.push(id); return liveDevices.has(id); },
    };
    const auth = { ready() { authCalls++; expectedInnerCookie = cookie; return cookie; }, invalidate() { invalidations++; } };
    const [outer] = remote.makeRemoteApiRoutes({ service, port: () => boundPort, auth });
    assert.equal(outer.kind, 'prefix');
    assert.equal(outer.path, '/remote');
    const path = '/api/dsh-majed/remote-probe';
    await mount({ inject: ['connection'], apply(owner) {
      owner.connection.fetch.register({ path, methods: ['POST'], requestBody: 'buffered',
        fetch: async function (request) {
          assert.equal(arguments.length, 1);
          assert.ok(request instanceof Request);
          assert.equal(new URL(request.url).pathname, path);
          assert.equal(new URL(request.url).search, '?scope=alpha%2Fbeta&tag=one&tag=two');
          assert.equal(request.headers.get('content-type'), 'application/json');
          assert.equal(await request.text(), '{"action":"inert","text":"paired ✓"}');
          operations++;
          return Response.json({ ok: true, synthetic: true });
        },
      });
    } });
    const target = '/remote' + path + '?scope=alpha%2Fbeta&tag=one&tag=two';
    const body = '{"action":"inert","text":"paired ✓"}';
    const paired = { cookie: 'synthetic-device=synthetic-live; outer-only=never-forward',
      origin: 'https://remote.invalid', host: 'remote.invalid', 'sec-fetch-site': 'cross-site',
      authorization: 'Bearer synthetic-not-native', 'x-fixture-source': 'local',
      'content-length': String(Buffer.byteLength(body)), accept: 'application/json' };
    const send = async (headers = {}, route = target, method = 'POST') => {
      const response = new MemoryResponse();
      outer.handler(incoming(route, { host: `127.0.0.1:${port}`,
        'content-type': 'application/json', ...headers }, method, body), response);
      if (!response.writableFinished) await once(response, 'finish');
      return response;
    };
    const outerReject = async (headers, status, route = target, method = 'POST', code) => {
      const before = [authCalls, proxyCalls, innerCalls, operations];
      const response = await send(headers, route, method);
      assert.equal(response.status, status);
      if (code) assert.equal(JSON.parse(response.text()).result.error.code, code);
      assert.deepEqual([authCalls, proxyCalls, innerCalls, operations], before,
        'Outer denial must precede inner auth, HTTP proxy and operation.');
    };
    checkpoint = 'missing-and-revoked-pairing';
    await outerReject({}, 403, target, 'POST', 'unpaired');
    await outerReject({ cookie: 'synthetic-device=synthetic-revoked' }, 403, target, 'POST', 'unpaired');
    assert.deepEqual(touched, ['synthetic-revoked']);
    checks.push('Missing/revoked pairing denies before inner credential resolution, proxy, native handler or operation.');
    checkpoint = 'paired-native-exact-fetch';
    const accepted = await send(paired);
    assert.equal(accepted.status, 200);
    assert.deepEqual(JSON.parse(accepted.text()), { ok: true, synthetic: true });
    assert.equal(operations, 1);
    assert.deepEqual([authCalls, proxyCalls, innerCalls], [1, 1, 1]);
    checks.push('Actual remote gate/rewrite/proxy delivers Majed namespace, encoded/repeated query and UTF-8 body to actual native BrowserAuth/exact Fetch using a native signed synthetic cookie.');
    checkpoint = 'outer-path-method-local-controls';
    for (const route of ['/remote', '/remote/', '/remote//api/x', '/remote/api/%2Fetc',
      '/remote/api/%5Cetc', '/remote/api/%00', '/remote/api/%ZZ', '/remotely/api/x']) {
      await outerReject(paired, 404, route);
    }
    await outerReject(paired, 405, target, 'TRACE');
    // Pin the actual table rather than extrapolating comments about a fourth plane.
    assert.deepEqual(remote.LOCAL_ONLY_PREFIXES, ['/api/pair', '/api/update', '/api/plugin-manager']);
    for (const prefix of remote.LOCAL_ONLY_PREFIXES) {
      await outerReject(paired, 403, '/remote' + prefix, 'POST', 'forbidden');
      await outerReject(paired, 403, '/remote' + prefix + '/nested?x=1', 'POST', 'forbidden');
    }
    boundPort = undefined;
    await outerReject(paired, 503, target, 'POST', 'port-unbound');
    boundPort = port;
    checks.push('Unsafe/empty prefixes, unsupported method, all three installed local-only control prefixes and unbound port reject without inner auth/proxy/delivery.');

    checkpoint = 'missing-and-stale-inner-auth';
    const before = operations;
    cookie = undefined;
    const missing = await send(paired);
    assert.equal(missing.status, 401);
    assert.equal(operations, before);
    assert.equal(invalidations, 0);
    // Well-shaped but invalid signed credential: native rejection invalidates proxy cache.
    const last = signedCookie.at(-1);
    cookie = signedCookie.slice(0, -1) + (last === 'A' ? 'B' : 'A');
    // The carrier validates that only the selected synthetic inner cookie travels.
    const invalidCookie = cookie;
    assert.notEqual(invalidCookie, signedCookie);
    const stale = await send(paired);
    assert.equal(stale.status, 401);
    assert.equal(operations, before);
    assert.equal(invalidations, 1);
    cookie = signedCookie;
    checks.push('Pairing alone cannot bypass native BrowserAuth: missing inner auth yields 401; stale synthetic signed cookie yields 401 and actual proxy cache invalidation; neither delivers.');

    checkpoint = 'header-pairing-exact-path-revocation';
    const headerAccepted = await send({ ...paired, cookie: 'outer-only=never-forward',
      [remote.REMOTE_DEVICE_HEADER]: 'synthetic-live' });
    assert.equal(headerAccepted.status, 200);
    assert.equal(operations, before + 1);
    // Cookie precedence must not let a live header rescue a revoked cookie.
    await outerReject({ ...paired, cookie: 'synthetic-device=synthetic-revoked',
      [remote.REMOTE_DEVICE_HEADER]: 'synthetic-live' }, 403, target, 'POST', 'unpaired');
    for (const route of ['/remote' + path + '/extra', '/remote/api/dsh-majed/remote-probex']) {
      const delivered = operations;
      assert.equal((await send(paired, route)).status, 404);
      assert.equal(operations, delivered);
    }
    liveDevices.delete('synthetic-live');
    await outerReject(paired, 403, target, 'POST', 'unpaired');
    checks.push('Cookieless live-device header admits; revoked primary cookie wins over live header; exact path rejects suffixes; revocation prevents subsequent inner calls.');
    console.log(JSON.stringify({ runtime: require(join(base, 'package.json')).version,
      node: process.versions.node, checks, counts: { proxyCalls, innerCalls, operations, invalidations },
      limitations: [
        'Unchanged installed remote leaf graph plus native apply/BrowserAuth/exact Fetch; synthetic memory credentials and pairing touchDevice only.',
        'Explicit in-memory Node HTTP carrier double, no sockets/listeners/browser/TLS, real pairing persistence, installed edits or operational auth.',
        'Not mounted/live paired service acceptance; no production Manager operations, Settings UI, authenticated project/session resolution, Skills or MCP composition.',
        'No trusted original local/remote provenance or Command hook Approval/execution proof; T02A remains incomplete and T02E unavailable.',
      ] }, null, 2));
  } finally {
    for (const fiber of fibers.reverse()) await fiber.dispose();
  }
}
main().catch(error => {
  // Do not print requests, cookie values, launch URLs or signing material.
  console.error(`Remote probe failed at ${checkpoint}: ${error?.code || error?.name || 'Error'}`);
  process.exitCode = 1;
});
