// Real ReactDOM + installed renderer/Settings bundles, with explicit external adapters.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { join, basename } = require('node:path');
const { createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');
const { Readable } = require('node:stream');
const { EventEmitter } = require('node:events');
const { syncBuiltinESMExports } = require('node:module');
const { createHash, webcrypto } = require('node:crypto');
assert.equal(process.env.DSH_MOUNTED_TRANSPORT_PROBE, '1', 'Use isolated runner.');
assert.equal(process.cwd(), process.env.HOME);
assert.equal(process.env.DSH_HOME, process.env.HOME);
assert.ok(basename(process.cwd()).startsWith('dsh-mounted-transport-'));
const [base, deps, ...flags] = process.argv.slice(2);
assert.ok(flags.every(x => ['--red-result', '--red-correlation'].includes(x)));
const dependencyRequire = createRequire(join(deps, '..', '__probe.cjs'));
const req = name => dependencyRequire(join(deps, name));
req.resolve = name => dependencyRequire.resolve(join(deps, name));
const hashes = {};
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
// Fail closed before any public dependency or product bundle is evaluated.
const forbidden = () => { throw Error('Operational I/O forbidden in mounted Settings proof'); };
for (const [name, methods] of Object.entries({ 'node:net': ['connect', 'createConnection', 'createServer'], 'node:http': ['request', 'get', 'createServer'], 'node:https': ['request', 'get', 'createServer'], 'node:dgram': ['createSocket'], 'node:child_process': ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork'] })) {
  const api = require(name); for (const method of methods) api[method] = forbidden;
}
require('node:net').Socket.prototype.connect = forbidden;
require('node:net').Server.prototype.listen = forbidden;
require('node:tls').connect = forbidden;
for (const method of ['send', 'bind']) require('node:dgram').Socket.prototype[method] = forbidden;
for (const dns of [require('node:dns'), require('node:dns/promises')]) {
  for (const key of Object.keys(dns)) if (typeof dns[key] === 'function') dns[key] = forbidden;
}
syncBuiltinESMExports();
global.fetch = forbidden; global.WebSocket = forbidden;
const expectedVersions = { '@deepseek-ai/dsh-client-test-runtime': '0.2.1-rc.2', '@deepseek-ai/dsh-client-ui-slots': '0.2.1-rc.2',
  '@deepseek-ai/dsh-client-store': '0.2.1-rc.2', '@deepseek-ai/cordis': '4.0.5', react: '18.3.1', 'react-dom': '18.3.1', jsdom: '26.1.0', zustand: '4.5.7', immer: '10.1.1' };
for (const [name, version] of Object.entries(expectedVersions)) assert.equal(JSON.parse(fs.readFileSync(req.resolve(`${name}/package.json`), 'utf8')).version, version, `Dependency version: ${name}`);
function load(name, dependencies) {
  const path = join(base, 'node_modules/@deepseek-ai', name, name === 'dsh-client-connection' ? 'lib/client.browser.js' : 'lib/client.js');
  const source = fs.readFileSync(path, 'utf8'); hashes[name] = digest(source);
  let exported;
  const context = vm.createContext({ document, window: { __ModuleLoader__: { load(spec) {
    assert.equal(spec.id, `@deepseek-ai/${name}`);
    exported = spec.factory(id => { assert.ok(Object.hasOwn(dependencies, id), `Unapproved dependency: ${id}`); return dependencies[id]; });
  } } }, console, setTimeout, clearTimeout, queueMicrotask, crypto: webcrypto, URL, AbortController }, { codeGeneration: { strings: false, wasm: false } });
  vm.runInContext(source, context, { filename: path, timeout: 2000 });
  return exported;
}
const hostLoad = name => require(join(base, 'node_modules', '@deepseek-ai', name, 'lib/index.js'));
const { Context, Service } = hostLoad('cordis');
const native = hostLoad('dsh-client-connection');
const { CredentialProvider } = hostLoad('dsh-credentials');
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
  const host = new Context();
  const fibers = [];
  const mount = async plugin => { const fiber = host.plugin(plugin); fibers.push(fiber); await fiber; };
  let dom, ctx, unmount, report;
  let operations = 0, deliveries = 0;
  const physical = [], statuses = [];
  const endpoint = '/api/fixture/read';
  try {
    await mount({ apply(owner) { new MemoryCredentials(owner); new MemoryWebServer(owner); } });
    await mount({ inject: ['credentials'], apply: owner => native.apply(owner, { cookieMaxAgeDays: 1 }) });
    const hostConnection = host.get('connection');
    const api = host.get('webServer').routes.find(route => route.path === '/api');
    const launch = new URL(hostConnection.authenticatedUrl('http://127.0.0.1:43123/'));
    const exchange = new MemoryResponse();
    assert.equal(hostConnection.authorizeIndex(incoming(launch.pathname + launch.search, {}, 'GET'), exchange), false);
    assert.equal(exchange.status, 303);
    const cookie = exchange.headers['set-cookie'].split(';', 1)[0];
    let browserCookie = cookie;
    await mount({ inject: ['connection'], apply(owner) {
      // This is an exactFetch FIXTURE endpoint speaking Connection RPC envelopes.
      // It is not the native genericFetch/RPC dispatcher, nor a production Manager.
      owner.connection.fetch.register({ path: endpoint, methods: ['POST'], requestBody: 'buffered',
        async fetch(request) {
          deliveries++;
          assert.equal(request.headers.get('content-type'), 'application/json');
          const message = await request.json();
          assert.deepEqual(Object.keys(message).sort(), ['method', 'payload', 'rpcId', 'type']);
          assert.equal(message.type, 'client-request');
          assert.match(message.rpcId, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
          assert.equal(message.method, 'fixture/read');
          assert.deepEqual(message.payload, { sessionId: 'fixture-session', workspaceId: 'fixture-workspace' });
          operations++;
          return Response.json({ type: 'server-response',
            rpcId: flags.includes('--red-correlation') ? 'wrong-correlation' : message.rpcId,
            result: { ok: true, value: { count: flags.includes('--red-result') ? 99 : operations } } });
        },
      });
    } });
    const carrier = async (input, init) => {
      assert.equal(input, 'api/fixture/read', 'native RPC must produce a document-relative URL');
      assert.equal(init.method, 'POST');
      const url = new URL(input, document.baseURI);
      assert.equal(url.href, 'http://127.0.0.1:43123/api/fixture/read');
      physical.push(url.pathname);
      const response = new MemoryResponse();
      await api.handler(incoming(url.pathname, { ...init.headers, ...(browserCookie ? { cookie: browserCookie } : {}) }, init.method, init.body), response);
      assert.equal(response.writableEnded, true);
      statuses.push(response.status);
      return new Response(response.text(), { status: response.status, headers: response.headers });
    };
    const { JSDOM } = req('jsdom');
    dom = new JSDOM('<!doctype html><html><head></head><body><div id="mount"></div></body></html>', { url: 'http://127.0.0.1:43123/' });
    for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node', 'MutationObserver']) Object.defineProperty(global, name, { configurable: true, value: dom.window[name] });
    window.fetch = forbidden; window.WebSocket = forbidden; window.XMLHttpRequest = forbidden;
    global.IS_REACT_ACT_ENVIRONMENT = true;
    const react = req('react'), reactDOM = req('react-dom'), client = req('react-dom/client');
    const jsx = req('react/jsx-runtime');
    const cordis = await import(pathToFileURL(req.resolve('@deepseek-ai/cordis')).href);
    const slots = await import(pathToFileURL(req.resolve('@deepseek-ai/dsh-client-ui-slots')).href);
    const stores = await import(pathToFileURL(req.resolve('@deepseek-ai/dsh-client-store')).href);
    const { act } = react;
    const shared = { react, 'react-dom': reactDOM, 'react-dom/client': client, 'react/jsx-runtime': jsx,
      '@deepseek-ai/cordis': cordis, '@deepseek-ai/dsh-client-ui-slots': slots, '@deepseek-ai/dsh-client-store': stores };
    const icon = () => react.createElement('span', { 'aria-hidden': true });
    const primitives = { Tooltip: ({ children }) => children, ConnectionIndicator: icon,
      IconSettingsOutlineMedium: icon, IconCloseOutlineRegular: icon, useModalLayer() {},
      Switch: ({ checked, disabled, label, onChange }) => react.createElement('input', { type: 'checkbox', checked, disabled, 'aria-label': label, onChange: event => onChange(event.target.checked) }) };
    const browserConnection = load('dsh-client-connection', {});
    const renderer = load('dsh-client-ui-renderer', shared);
    const settings = load('dsh-client-ui-settings', shared);
    const general = load('dsh-client-ui-settings-general', { ...shared, '@deepseek-ai/dsh-client-ui-primitives': primitives });
    ctx = new cordis.Context();
    browserConnection.installConnection(ctx, { location: new URL(document.baseURI), interactions: 'none',
      transport: { fetch: carrier, openStream: forbidden } });
    assert.equal(typeof ctx.connection.rpc.open, 'function');
    const events = new Map();
    let dictionary;
    const localeRevision = stores.createSnapshotStore({ revision: 0 });
    const locale = { register(_ns, values) { dictionary = values.en; return () => { dictionary = undefined; }; },
      bind: () => key => dictionary?.[key] ?? key, getSnapshot: localeRevision.getSnapshot, subscribe: localeRevision.subscribe };
    ctx.reflect.provide('remote', { $host: { isLoopback: true }, $on(name, fn) { events.set(name, fn); return () => events.delete(name); },
      settings: { async describe() { return { ok: true, value: { namespaces: [{ ns: 'fixture-manager' }] } }; } } });
    ctx.reflect.provide('locale', locale);
    ctx.reflect.provide('shortcuts', { catalog: stores.createSnapshotStore([]), register() { return () => {}; } });
    ctx.reflect.provide('modules', { entries: { releaseChange: stores.createSnapshotStore(undefined), dismissRelease: forbidden } });
    renderer.apply(ctx);
    ctx.slots.installLocale(locale);
    ctx.slots.installScope('session', { current: stores.createSnapshotStore(undefined), resolve: forbidden, subscribeRelease: () => () => {} });
    ctx.slots.provideRoot({ hooks: { sessions: stores.createSnapshotStore({ phase: 'loading', byId: {} }) } });
    settings.apply(ctx);
    await ctx.configForms.describe().ensure();
    general.apply(ctx);
    ctx.slots.register({ name: 'root', children: { 'sidebar.settings': { kind: 'single', scope: 'root' } } },
      ({ renderSlot }) => renderSlot('sidebar.settings', { wide: true }));
    let pending;
    function Content() {
      const [value, setValue] = react.useState('Not requested');
      return react.createElement('section', null,
        react.createElement('button', { 'data-fixture-read': '', onClick() {
          pending = ctx.connection.rpc.call('/api', 'fixture/read', { sessionId: 'fixture-session', workspaceId: 'fixture-workspace' })
            .then(result => { setValue(result.ok ? `Count: ${result.value.count}` : 'Operation failed'); })
            .catch(() => { setValue('Operation failed'); });
        } }, 'Read fixture'), react.createElement('output', { 'data-fixture-result': '' }, value));
    }
    ctx.configForms.whileServed(['fixture-manager'], () => ctx.slots.register({ name: 'settings.section', id: 'fixture-manager', order: 20, label: 'Fixture Manager' }, Content));
    checkpoint = 'mounted-settings-navigation';
    await act(async () => { unmount = ctx.uiRenderer.mount(document.getElementById('mount')); });
    await act(async () => document.querySelector('[aria-haspopup=dialog]').click());
    await act(async () => [...document.querySelectorAll('button')].find(b => b.textContent === 'Fixture Manager').click());
    const read = async () => { await act(async () => { document.querySelector('[data-fixture-read]').click(); await pending; }); };
    const output = () => document.querySelector('[data-fixture-result]').textContent;
    assert.equal(output(), 'Not requested');
    checkpoint = 'native-rpc-clicked-result';
    await read();
    assert.equal(output(), 'Count: 1', 'native-rpc-clicked-result');
    assert.equal(operations, 1); assert.equal(deliveries, 1);
    const [cookieName, cookieValue] = cookie.split('=');
    const parts = cookieValue.split('.');
    parts[2] = (parts[2][0] === 'A' ? 'B' : 'A') + parts[2].slice(1);
    checkpoint = 'native-admission-dom-failure';
    for (browserCookie of ['', `${cookieName}=${parts.join('.')}`]) {
      await read();
      assert.equal(output(), 'Operation failed');
      assert.equal(operations, 1, 'denied click performs no operation');
      assert.equal(deliveries, 1, 'BrowserAuth denies before exactFetch endpoint');
    }
    browserCookie = cookie;
    await read();
    assert.equal(output(), 'Count: 2'); assert.equal(operations, 2);
    assert.deepEqual(physical, Array(4).fill(endpoint));
    assert.deepEqual(statuses, [200, 401, 401, 200]);
    await act(async () => { unmount(); unmount = undefined; await ctx.fiber.dispose(); });
    ctx = undefined;
    assert.equal(document.getElementById('mount').childNodes.length, 0);
    assert.equal(events.size, 0);
    const dependencies = {};
    for (const name of Object.keys(expectedVersions)) dependencies[name] = {
      version: expectedVersions[name], entrySha256: digest(fs.readFileSync(req.resolve(name))),
      manifestSha256: digest(fs.readFileSync(req.resolve(`${name}/package.json`))),
    };
    hashes['dsh-client-connection-host'] = digest(fs.readFileSync(join(base, 'node_modules/@deepseek-ai/dsh-client-connection/lib/index.js')));
    report = { runtime: JSON.parse(fs.readFileSync(join(base, 'package.json'), 'utf8')).version,
      node: process.version, hashes, dependencies, operations, physicalRequests: physical.length, statuses,
      checks: ['mounted native Settings navigation and real ReactDOM click', 'unchanged native installConnection serializes correlated RPC',
        'document-relative URL reaches native BrowserAuth and exactFetch fixture', 'signed synthetic cookie accepted; missing/tampered denied before endpoint with DOM failure',
        'accepted recovery renders second operation count; real UI and host disposal'],
      limitations: ['jsdom and explicit presentation/locale/remote/settings/session adapters; no live GUI proof',
        'exactFetch fixture validates RPC envelopes; NOT genericFetch or native host RPC dispatch',
        'synthetic signing state, memory HTTP carrier, inert counter and literal selectors only; no authenticated scope resolver',
        'no paired remote prefix/service, persistence, operational auth/state, production Manager/T03 acceptance or T02A closure'] };
  } finally {
    if (unmount) { const { act } = req('react'); await act(async () => { unmount(); }); }
    if (ctx) await ctx.fiber.dispose();
    dom?.window.close();
    for (const fiber of fibers.reverse()) await fiber.dispose();
  }
  assert.equal(host.get('webServer'), undefined, 'host services disposed');
  checkpoint = 'complete';
  console.log(JSON.stringify({ ...report, checkpoint }, null, 2));
}
main().catch(error => {
  // Never print cookies, launch URLs, Requests or synthetic signing material.
  console.error(`Mounted transport proof failed at ${checkpoint}: ${error?.name || 'Error'}: ${error?.message || 'unknown failure'}`);
  process.exitCode = 1;
});
