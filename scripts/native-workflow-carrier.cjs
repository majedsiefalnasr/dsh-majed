// Test-only public carrier. Real native BrowserAuth and installed paired proxy;
// memory credentials/pair registry and in-memory Node HTTP streams are explicit.
const assert = require('node:assert/strict');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');
const { Readable, Writable } = require('node:stream');
const { once } = require('node:events');
const { syncBuiltinESMExports } = require('node:module');

class MemoryResponse extends Writable {
  status; headers = {}; chunks = []; headersSent = false;
  _write(chunk, encoding, done) { this.chunks.push(Buffer.from(chunk)); done(); }
  writeHead(status, headers = {}) { this.status = status; this.headers = headers; this.headersSent = true; return this; }
  text() { return Buffer.concat(this.chunks).toString('utf8'); }
}
function incoming(path, headers = {}, body = '', method = 'POST') {
  const request = Readable.from(method === 'POST' ? [Buffer.from(body)] : []);
  Object.assign(request, { url: path, method, headers, socket: { remoteAddress: '127.0.0.1' } });
  return request;
}

exports.mountNativeCarrier = async function(base, remoteFile) {
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
    protocol = 'http:'; host = '127.0.0.1'; routes = [];
    constructor(ctx) { super(ctx, 'webServer'); }
    register(route) { this.routes.push(route); return () => { this.routes.splice(this.routes.indexOf(route), 1); }; }
  }
  const ctx = new Context(); const fibers = [];
  async function mount(plugin) { const fiber = ctx.plugin(plugin); fibers.push(fiber); await fiber; return fiber; }
  await mount({ apply(ctx) { new MemoryCredentials(ctx); new MemoryWebServer(ctx); } });
  await mount({ inject: ['credentials'], apply: ctx => native.apply(ctx, { cookieMaxAgeDays: 1 }) });
  const connection = ctx.get('connection');
  const inner = ctx.get('webServer').routes.find(route => route.path === '/api').handler;
  const host = '127.0.0.1:43123';
  const launch = new URL(connection.authenticatedUrl('http://' + host + '/'));
  const redemption = new MemoryResponse();
  assert.equal(connection.authorizeIndex(incoming(launch.pathname + launch.search, { host }, '', 'GET'), redemption), false);
  assert.equal(redemption.status, 303);
  const cookie = redemption.headers['set-cookie'].split(';', 1)[0];
  const http = require('node:http'); const originalRequest = http.request;
  let proxyCalls = 0;
  http.request = function(options, callback) {
    assert.equal(options.host, '127.0.0.1'); assert.equal(options.port, 43123);
    assert.ok(options.path.startsWith('/api/')); assert.equal(options.method, 'POST');
    assert.equal(options.headers.cookie, cookie); assert.equal(options.headers.origin, undefined);
    proxyCalls++;
    const chunks = [];
    return new Writable({ write(chunk, encoding, done) { chunks.push(Buffer.from(chunk)); done(); }, final(done) {
      const response = new MemoryResponse();
      Promise.resolve(inner(incoming(options.path, options.headers, Buffer.concat(chunks)), response)).then(async () => {
        if (!response.writableFinished) await once(response, 'finish');
        const upstream = Readable.from([Buffer.concat(response.chunks)]);
        upstream.statusCode = response.status; upstream.headers = response.headers; callback(upstream); done();
      }).catch(done);
    } });
  };
  syncBuiltinESMExports();
  const remote = await import(pathToFileURL(remoteFile).href);
  const live = new Set(['synthetic-paired-device']);
  const service = { config: { cookieName: 'synthetic-device' }, touchDevice(id) { return live.has(id); } };
  const auth = { ready() { return cookie; }, invalidate() {} };
  const [outer] = remote.makeRemoteApiRoutes({ service, port: () => 43123, auth });
  async function send(path, message, mode = 'local', headers = {}) {
    const body = JSON.stringify(message); const response = new MemoryResponse();
    const paired = mode === 'remote';
    const defaultCookie = paired ? 'synthetic-device=synthetic-paired-device' : cookie;
    const request = incoming((paired ? '/remote' : '') + path, { host, 'content-type': 'application/json', cookie: defaultCookie, ...headers }, body);
    await (paired ? outer.handler(request, response) : inner(request, response));
    if (!response.writableFinished) await once(response, 'finish');
    let parsed; try { parsed = JSON.parse(response.text()); } catch {}
    return { status: response.status, body: parsed };
  }
  return { ctx, mount, send, revokePairing() { live.clear(); }, counts: () => ({ proxyCalls }),
    async dispose() { for (const fiber of fibers.reverse()) await fiber.dispose(); http.request = originalRequest; syncBuiltinESMExports(); },
    runtime: require(join(base, 'package.json')).version };
};
