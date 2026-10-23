// Synthetic-only exported-plugin proof, not live management acceptance.
// Invoke through test-management-admission.mjs: it sanitizes env and creates disposable HOME.
const assert = require('node:assert/strict');
const { realpathSync } = require('node:fs');
const { basename, join } = require('node:path');
const { Readable } = require('node:stream');
const { EventEmitter } = require('node:events');
const { syncBuiltinESMExports } = require('node:module');
const base = process.argv[2];
const flags = new Set(process.argv.slice(3));
assert.ok(base, 'Pass the installed runtime directory.');
assert.ok([...flags].every(flag => ['--red-auth', '--red-dispatch'].includes(flag)), 'Unknown probe flag.');
assert.equal(process.env.DSH_MANAGEMENT_ADMISSION_PROBE, '1', 'Use the isolated runner.');
const home = realpathSync(process.env.HOME);
assert.ok(basename(home).startsWith('dsh-management-admission-'), 'Disposable HOME required.');
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
const checks = [];
let checkpoint = 'native-plugin-mount';

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
async function main() {
  const ctx = new Context();
  const fibers = [];
  const mount = async plugin => { const fiber = ctx.plugin(plugin); fibers.push(fiber); await fiber; return fiber; };
  const originalNow = Date.now;
  try {
    await mount({ apply(owner) { new MemoryCredentials(owner); new MemoryWebServer(owner); } });
    // Public native apply creates the real, non-exported BrowserAuth internally.
    const nativeFiber = await mount({ inject: ['credentials'], apply: owner => native.apply(owner, { cookieMaxAgeDays: 1 }) });
    const connection = ctx.get('connection');
    const web = ctx.get('webServer');
    assert.ok(connection instanceof native.HostConnectionService);
    const api = web.routes.find(route => route.path === '/api');
    assert.ok(api, 'Native apply must register /api.');
    let deliveries = 0;
    const path = '/api/dsh-majed/admission-probe';
    const routeFiber = await mount({ inject: ['connection'], apply(owner) {
      owner.connection.fetch.register({ path, methods: ['POST'], requestBody: 'buffered',
        fetch: async function (request) {
          assert.equal(arguments.length, 1, 'Exact handler receives Request, not transport attestation.');
          assert.ok(request instanceof Request);
          assert.equal(await request.text(), '{}');
          deliveries++;
          return Response.json({ ok: true, synthetic: true });
        },
      });
    } });
    const send = async (headers = {}, route = path, method = 'POST') => {
      const response = new MemoryResponse();
      await api.handler(incoming(route, headers, method), response);
      assert.equal(response.writableEnded, true);
      return response;
    };
    checkpoint = 'missing-authentication-rejection';
    assert.equal((await send()).status, flags.has('--red-auth') ? 200 : 401,
      'Native unauthenticated /api must reject before exact dispatch.');
    assert.equal(deliveries, 0);
    checks.push('Real exported native apply mounts /api; missing authentication is rejected before dispatch.');

    const issuedAt = 1800000000000;
    Date.now = () => issuedAt;
    const launch = new URL(connection.authenticatedUrl('http://127.0.0.1:43123/'));
    const response = new MemoryResponse();
    assert.equal(connection.authorizeIndex(incoming(launch.pathname + launch.search, {}, 'GET'), response), false);
    assert.equal(response.status, 303);
    assert.equal(response.headers.location, './');
    const setCookie = response.headers['set-cookie'];
    assert.ok(setCookie.includes('HttpOnly; SameSite=Strict'));
    const cookie = setCookie.split(';', 1)[0];
    checkpoint = 'signed-cookie-exact-dispatch';
    const accepted = await send({ cookie });
    assert.equal(accepted.status, flags.has('--red-dispatch') ? 401 : 200,
      'Native signed synthetic cookie must reach exact dispatch.');
    assert.deepEqual(JSON.parse(accepted.text()), { ok: true, synthetic: true });
    assert.equal(deliveries, 1);
    checkpoint = 'signature-authority-expiry-and-lifecycle';
    checks.push('Native internal BrowserAuth exchanges a synthetic launch token and admits its signed browser cookie.');

    const rejected = async (headers, expected = 401, route = path) => {
      const before = deliveries;
      assert.equal((await send(headers, route)).status, expected);
      assert.equal(deliveries, before, 'Rejected requests must not reach the exact handler.');
    };
    const [name, value] = cookie.split('=');
    const parts = value.split('.');
    assert.equal(parts.length, 3);
    const flip = text => (text[0] === 'A' ? 'B' : 'A') + text.slice(1);
    await rejected({ cookie: `${name}=${parts[0]}.${parts[1]}.${flip(parts[2])}` });
    await rejected({ cookie: `${name}=${parts[0]}.${flip(parts[1])}.${parts[2]}` });
    await rejected({ cookie: `${name}=not-a-signed-cookie` });
    await rejected({ cookie: 'unrelated=cookie' });
    checks.push('Native signature verification rejects altered signature, altered payload, malformed and unrelated cookies.');

    await rejected({ cookie, host: '127.0.0.1:43124' });
    await rejected({ cookie, host: 'attacker.invalid' }, 403);
    await rejected({ cookie, origin: 'https://attacker.invalid' }, 403);
    await rejected({ cookie, 'sec-fetch-site': 'cross-site' }, 403);
    await rejected({ authorization: `Bearer ${launch.searchParams.get('token')}` });
    await rejected({}, 401, `${path}?${launch.searchParams}`);
    await rejected({ 'x-fixture-owner': 'yes', 'x-fixture-source': 'local' });
    checks.push('Native Host/Origin/Fetch-Metadata fences and authority binding reject valid-cookie misuse; query, bearer and client labels grant no admission.');

    Date.now = () => issuedAt - 1;
    await rejected({ cookie });
    Date.now = () => issuedAt + 86400000 - 1;
    assert.equal((await send({ cookie })).status, 200);
    Date.now = () => issuedAt + 86400000;
    await rejected({ cookie });
    Date.now = () => issuedAt;
    checks.push('Native validity interval rejects future-issued and exactly expired cookies, accepting one millisecond before expiry (synthetic clock).');

    // Match only proxy-shaped INNER request facts. This is not the paired remote service.
    const direct = connection.admit(incoming(path, { cookie }));
    const proxyShape = { cookie, 'sec-fetch-site': 'same-origin', 'x-fixture-source': 'remote' };
    const proxied = connection.admit(incoming(path, proxyShape));
    assert.equal(direct.peer.principal.kind, 'owner');
    assert.equal(proxied.peer, direct.peer);
    assert.equal((await send(proxyShape)).status, 200);
    await rejected(proxyShape, 404, '/remote' + path);
    checks.push('Direct and explicitly proxy-shaped fixture share Owner Peer and exact handler; native /remote prefix is not a route or provenance proof.');

    const nonOwner = connection.createPeer({ principal: { kind: 'synthetic-non-owner' } });
    const carrier = connection.createSharedFetchHandler('/api');
    const before = deliveries;
    assert.equal((await carrier.fetch(new Request('http://dsh.internal' + path, { method: 'POST', body: '{}' }), nonOwner)).status, 403);
    assert.equal(deliveries, before);
    await nonOwner.dispose();
    assert.equal((await send({ cookie }, path, 'GET')).status, 404);
    await routeFiber.dispose();
    assert.equal((await send({ cookie })).status, 404);
    await nativeFiber.dispose();
    assert.equal(connection.admit(incoming(path, { cookie })).rejection, 401);
    assert.equal(web.routes.length, 0);
    assert.equal(direct.peer.signal.aborted, true);
    checks.push('Non-Owner carrier rejection, exact method/path, route disposal and native plugin disposal deny further delivery.');
    console.log(JSON.stringify({ runtime: require(join(base, 'package.json')).version,
      node: process.versions.node, checks, limitations: [
        'Real native BrowserAuth algorithm, synthetic in-memory signing state and token only; no real Owner login or auth store.',
        'In-memory HTTP streams and WebServer registration fixture; no socket, browser, TLS listener or paired remote service.',
        'No Settings rendering, authenticated session/project resolution, Skills watcher or official MCP lifecycle proof.',
        'No command Approval provenance, approval persistence, execution or operational requests; T02A/T02E remain unproved.',
      ] }, null, 2));
  } finally {
    Date.now = originalNow;
    for (const fiber of fibers.reverse()) await fiber.dispose();
  }
}
main().catch(error => {
  // Avoid printing Request objects, launch URLs, cookies or synthetic signing material on failure.
  console.error(`Admission probe failed at ${checkpoint}: ${error?.code || error?.name || 'Error'}`);
  process.exitCode = 1;
});
