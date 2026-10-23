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
assert.equal(process.env.DSH_PHYSICAL_CARRIER_PROBE, '1', 'Use isolated runner.');
assert.equal(process.cwd(), process.env.HOME);
assert.equal(process.env.DSH_HOME, process.env.HOME);
assert.ok(basename(process.cwd()).startsWith('dsh-physical-carrier-'));
const [base, deps, remoteFile, ...flags] = process.argv.slice(2);
assert.ok(flags.every(x => ['--red-result', '--red-correlation', '--red-membership'].includes(x)));
const dependencyRequire = createRequire(join(deps, '..', '__probe.cjs'));
const req = name => dependencyRequire(join(deps, name));
req.resolve = name => dependencyRequire.resolve(join(deps, name));
const hashes = {};
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
// Guards precede all installed code. Wrappers validate then delegate to REAL HTTP.
const forbidden = () => { throw Error('Physical carrier forbids unowned I/O'); };
const http = require('node:http'), net = require('node:net');
const realRequest = http.request, realServer = http.createServer;
const realListen = net.Server.prototype.listen, realConnect = net.Socket.prototype.connect;
const servers = [], ports = new Set(), owned = new WeakSet();
let creating = false, requesting = 0, proxyCalls = 0, closedListeners = 0;
http.createServer = function(...args) {
  assert.ok(creating && servers.length < 2, 'Only two public WebServer listeners permitted');
  const server = realServer.apply(this, args); owned.add(server); servers.push(server);
  server.once('close', () => closedListeners++);
  return server;
};
net.createServer = forbidden;
net.Server.prototype.listen = function(port, host, ...rest) {
  assert.ok(owned.has(this)); assert.equal(port, 0); assert.equal(host, '127.0.0.1');
  return realListen.call(this, port, host, ...rest);
};
net.Socket.prototype.connect = function(...args) {
  const o = Array.isArray(args[0]) ? args[0][0] : args[0];
  assert.ok(requesting > 0 && o && typeof o === 'object', 'Only checked HTTP internals may connect');
  assert.equal(o.host, '127.0.0.1'); assert.ok(ports.has(Number(o.port)));
  return realConnect.apply(this, args);
};
const realNetConnect = net.createConnection;
net.connect = net.createConnection = function(...args) {
  assert.ok(requesting > 0, 'Only checked HTTP internals may create connections');
  return realNetConnect.apply(this, args);
};
http.request = function(input, options, callback) {
  const o = typeof input === 'string' || input instanceof URL
    ? { ...Object.fromEntries([['protocol', new URL(input).protocol], ['hostname', new URL(input).hostname], ['port', new URL(input).port]]), ...(typeof options === 'object' ? options : {}) }
    : input;
  assert.equal(o.protocol ?? 'http:', 'http:');
  assert.equal(o.hostname ?? o.host, '127.0.0.1');
  assert.ok(ports.has(Number(o.port))); assert.equal(o.socketPath, undefined);
  assert.equal(o.createConnection, undefined); assert.ok(o.agent === undefined || o.agent === false);
  if (o.headers?.['sec-fetch-site'] === 'same-origin') proxyCalls++;
  requesting++;
  try {
    const request = realRequest.apply(this, arguments);
    request.setTimeout(3000, () => request.destroy(Error('HTTP deadline')));
    return request;
  } finally { requesting--; }
};
http.get = forbidden;
for (const method of ['request', 'get', 'createServer']) require('node:https')[method] = forbidden;
require('node:tls').connect = forbidden;
for (const method of ['createSocket']) require('node:dgram')[method] = forbidden;
for (const method of ['send', 'bind', 'connect']) require('node:dgram').Socket.prototype[method] = forbidden;
for (const name of ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']) require('node:child_process')[name] = forbidden;
for (const dns of [require('node:dns'), require('node:dns/promises')]) {
  for (const key of Object.keys(dns)) if (typeof dns[key] === 'function') dns[key] = forbidden;
}
// Node's literal bind lookup is satisfied synchronously without invoking DNS.
require('node:dns').lookup = (host, options, callback) => {
  assert.equal(host, '127.0.0.1'); assert.ok(creating);
  (typeof options === 'function' ? options : callback)(null, host, 4);
};
syncBuiltinESMExports();
global.fetch = forbidden; global.WebSocket = forbidden;
function physicalFetch(input, init = {}) {
  const url = new URL(input);
  assert.equal(url.protocol, 'http:'); assert.equal(url.hostname, '127.0.0.1');
  assert.ok(ports.has(Number(url.port))); assert.equal(url.username, ''); assert.equal(url.password, '');
  assert.ok(Buffer.byteLength(init.body ?? '') <= 16384);
  return new Promise((resolve, reject) => {
    const request = http.request(url, { method: init.method ?? 'GET', headers: init.headers, agent: false }, response => {
      const chunks = []; let bytes = 0;
      response.on('data', chunk => { bytes += chunk.length; if (bytes > 65536) response.destroy(Error('HTTP byte bound')); else chunks.push(chunk); });
      response.on('error', reject);
      response.on('end', () => resolve(new Response(Buffer.concat(chunks), { status: response.statusCode, headers: response.headers })));
    });
    const deadline = setTimeout(() => request.destroy(Error('HTTP absolute deadline')), 5000);
    request.on('error', reject); request.on('close', () => clearTimeout(deadline)); request.end(init.body);
  });
}
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
const { SessionStore } = hostLoad('dsh-session');
const { SessionPersistence } = hostLoad('dsh-session-persistence');
const { WorkspaceRegistry } = hostLoad('dsh-workspace');
const { DomainFacility } = hostLoad('dsh-storage-domain');
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

let checkpoint = 'public-physical-services';
async function main() {
  const WebServer = hostLoad('dsh-host-webserver').default;
  const remote = await import(pathToFileURL(remoteFile).href);
  for (const name of ['dsh-host-webserver', 'dsh-client-connection']) hashes[name + '-host'] = digest(fs.readFileSync(join(base, 'node_modules/@deepseek-ai', name, 'lib/index.js')));
  for (const name of ['remote-api.js', 'loopback-proxy.js']) hashes[name] = digest(fs.readFileSync(join(require('node:path').dirname(remoteFile), name)));
  const { resolveManagementScope } = await import('../lib/management/scope.js');
  const host = new Context(), outerHost = new Context();
  const fibers = [];
  const mount = async (plugin, context = host) => { const fiber = context.plugin(plugin); fibers.push(fiber); await fiber; return fiber; };
  const mountServer = async context => {
    creating = true;
    try { const fiber = context.plugin(WebServer, { host: '127.0.0.1', port: 0, compression: 'none' }); fibers.push(fiber); await fiber; }
    finally { creating = false; }
    const server = context.get('webServer'); assert.ok(server.port > 0); ports.add(server.port); return server;
  };
  let dom, ctx, unmount, report;
  let operations = 0, deliveries = 0, resolutions = 0, authCalls = 0;
  const physical = [], statuses = [];
  const endpoint = '/api/fixture/read';
  try {
    for (const attempt of [() => http.request('http://example.invalid/'), () => global.fetch('http://127.0.0.1/'),
      () => net.createServer(), () => new net.Socket().connect(1, '127.0.0.1'),
      () => require('node:https').request('https://example.invalid/'), () => require('node:dns').resolve('example.invalid'),
      () => require('node:child_process').spawn('forbidden')]) assert.throws(attempt);
    const inner = await mountServer(host), outer = await mountServer(outerHost);
    await mount({ apply(owner) { new MemoryCredentials(owner); new MemoryStorage(owner); new MemoryPersistence(owner); } });
    await mount(SessionStore);
    await mount({ inject: ['storage'], apply(owner) {
      const facility = new DomainFacility(owner, { backend: 'scope-memory' });
      owner.provide('storageDomain', facility); owner.effect(() => () => facility.closeAll());
    } });
    await mount(WorkspaceRegistry);
    await mount({ inject: ['credentials'], apply: owner => native.apply(owner, { cookieMaxAgeDays: 1 }) });
    const project = join(process.env.HOME, 'project'), foreign = join(process.env.HOME, 'foreign');
    mkdirSync(project); mkdirSync(foreign);
    const workspace = await host.workspaceRegistry.create(project), other = await host.workspaceRegistry.create(foreign);
    host.sessions.create('fixture-session', { meta: { cwd: project } }); await workspace.attachSession('fixture-session');
    let selectors = { sessionId: 'fixture-session', workspaceId: workspace.id };
    if (flags.includes('--red-membership')) await workspace.detachSession('fixture-session');
    const hostConnection = host.get('connection');
    const disposeRoot = inner.register({ kind: 'exact', path: '/', handler(request, response) {
      if (hostConnection.authorizeIndex(request, response)) { response.writeHead(200); response.end('fixture'); }
    } });
    const exchange = await physicalFetch(hostConnection.authenticatedUrl(inner.getOrigin() + '/'));
    assert.equal(exchange.status, 303);
    const cookie = exchange.headers.get('set-cookie').split(';', 1)[0];
    let browserCookie = cookie, innerCookie = cookie, pairingCookie = 'synthetic-device=synthetic-live';
    const service = { config: { cookieName: 'synthetic-device' }, touchDevice: id => id === 'synthetic-live' };
    const auth = { ready() { authCalls++; return innerCookie; }, invalidate() {} };
    const disposeRemote = remote.makeRemoteApiRoutes({ service, port: () => inner.port, auth }).map(route => outer.register(route));
    let remoteMode = false;
    const endpointFiber = await mount({ inject: ['connection'], apply(owner) {
      // ExactFetch fixture only: NOT native genericFetch or host RPC dispatch.
      owner.connection.fetch.register({ path: endpoint, methods: ['POST'], requestBody: 'buffered', async fetch(request) {
        deliveries++;
        assert.equal(request.headers.get('content-type'), 'application/json');
        assert.equal(request.headers.get('authorization'), null);
        assert.equal(request.headers.get('x-dsh-remote-device'), null);
        assert.equal(new URL(request.url).pathname, endpoint);
        const message = await request.json();
        assert.deepEqual(Object.keys(message).sort(), ['method', 'payload', 'rpcId', 'type']);
        assert.equal(message.type, 'client-request'); assert.equal(message.method, 'fixture/read');
        assert.match(message.rpcId, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
        resolutions++;
        const scope = await resolveManagementScope(host, message.payload, request.signal);
        if (!scope) return new Response(null, { status: 404 });
        assert.equal(scope.projectPath, project);
        request.signal.throwIfAborted(); operations++;
        return Response.json({ type: 'server-response', rpcId: flags.includes('--red-correlation') ? 'wrong-correlation' : message.rpcId,
          result: { ok: true, value: { count: flags.includes('--red-result') ? 99 : operations } } });
      } });
    } });
    const carrier = async (input, init) => {
      assert.equal(input, 'api/fixture/read'); assert.equal(init.method, 'POST');
      // Deliberate document base; no repair of native URL, RPC payload or headers.
      const url = new URL(input, document.baseURI);
      assert.equal(url.origin, remoteMode ? outer.getOrigin() : inner.getOrigin());
      assert.equal(url.pathname, remoteMode ? '/remote' + endpoint : endpoint);
      physical.push(url.pathname);
      const response = await physicalFetch(url, { ...init, headers: { ...init.headers,
        ...((remoteMode ? pairingCookie : browserCookie) ? { cookie: remoteMode ? pairingCookie : browserCookie } : {}) } });
      statuses.push(response.status); return response;
    };
    const { JSDOM } = req('jsdom');
    dom = new JSDOM('<!doctype html><html><head></head><body><div id="mount"></div></body></html>', { url: inner.getOrigin() + '/' });
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
          pending = ctx.connection.rpc.call('/api', 'fixture/read', selectors)
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
    checkpoint = 'mounted-local-and-remote';
    await read(); assert.equal(output(), 'Count: 1', 'local correlated DOM result');
    remoteMode = true; document.head.innerHTML = `<base href="${outer.getOrigin()}/remote/">`;
    await read(); assert.equal(output(), 'Count: 2', 'remote correlated DOM result');
    assert.equal(proxyCalls, 1); assert.equal(operations, 2);
    const beforeWrites = writes;
    checkpoint = 'admission-before-operation';
    remoteMode = false; document.head.innerHTML = `<base href="${inner.getOrigin()}/">`; browserCookie = '';
    await read(); assert.equal(output(), 'Operation failed'); assert.equal(deliveries, 2);
    remoteMode = true; document.head.innerHTML = `<base href="${outer.getOrigin()}/remote/">`;
    for (pairingCookie of ['', 'synthetic-device=synthetic-revoked']) {
      const before = [authCalls, proxyCalls, deliveries, resolutions, operations];
      await read(); assert.equal(output(), 'Operation failed');
      assert.deepEqual([authCalls, proxyCalls, deliveries, resolutions, operations], before);
    }
    pairingCookie = 'synthetic-device=synthetic-live'; innerCookie = cookie.slice(0, -1) + (cookie.at(-1) === 'A' ? 'B' : 'A');
    await read(); assert.equal(output(), 'Operation failed'); assert.equal(deliveries, 2);
    innerCookie = cookie; selectors = { ...selectors, workspaceId: other.id };
    await read(); assert.equal(output(), 'Operation failed'); assert.equal(operations, 2);
    assert.equal(resolutions, 3); assert.equal(writes, beforeWrites);
    checkpoint = 'exact-path-and-disposal';
    const before = [deliveries, resolutions, operations];
    const post = { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: '{}' };
    assert.equal((await physicalFetch(inner.getOrigin() + endpoint + '/suffix', post)).status, 404);
    assert.deepEqual([deliveries, resolutions, operations], before);
    await endpointFiber.dispose();
    assert.equal((await physicalFetch(inner.getOrigin() + endpoint, post)).status, 404);
    assert.deepEqual([deliveries, resolutions, operations], before);
    disposeRemote.forEach(dispose => dispose()); disposeRoot();
    assert.equal((await physicalFetch(outer.getOrigin() + '/remote' + endpoint, post)).status, 404);
    await act(async () => { unmount(); unmount = undefined; await ctx.fiber.dispose(); }); ctx = undefined;
    assert.equal(document.getElementById('mount').childNodes.length, 0); assert.equal(events.size, 0);
    report = { runtime: JSON.parse(fs.readFileSync(join(base, 'package.json'), 'utf8')).version,
      node: process.version, hashes, operations, statuses, physical, proxyCalls,
      checks: ['real public inner and outer WebServer listeners; real bounded Node HTTP without interception',
        'mounted actual Settings local and remote clicks through native RPC to scoped inert operation',
        'missing local cookie, missing/revoked pairing, invalid inner cookie, wrong membership deny before operation',
        'exact-path suffix and disposed endpoint/routes deny; mounted UI, fibers and listeners disposed'],
      limitations: ['jsdom; explicit presentation/locale/session/transport adapters; no browser or TLS',
        'exactFetch correlated RPC fixture, not native genericFetch/host generic RPC dispatcher',
        'synthetic credentials/pairing/memory persistence/KV only; no operational auth discovery or state',
        'no production Manager CRUD, trusted approval provenance, T03 acceptance or T02A closure'] };
  } finally {
    const cleanupErrors = [];
    const clean = async callback => { try { await callback(); } catch (error) { cleanupErrors.push(error); } };
    if (unmount) await clean(async () => { const { act } = req('react'); await act(async () => unmount()); });
    if (ctx) await clean(() => ctx.fiber.dispose());
    await clean(() => dom?.window.close());
    for (const fiber of fibers.reverse()) await clean(() => fiber.dispose());
    await clean(() => host.fiber.dispose()); await clean(() => outerHost.fiber.dispose());
    assert.equal(closedListeners, servers.length, 'Every owned listener closed, including red controls');
    assert.ok(servers.every(server => !server.listening));
    assert.equal(cleanupErrors.length, 0, 'All independent cleanup steps must succeed');
  }
  assert.equal(closes, 1); assert.equal(closedListeners, 2);
  assert.equal(host.get('webServer'), undefined); assert.equal(outerHost.get('webServer'), undefined);
  console.log(JSON.stringify({ ...report, listeners: servers.length, closedListeners, checkpoint: 'complete' }, null, 2));
}
main().catch(error => {
  // Never print launch URLs, cookie values, requests or synthetic signing state.
  console.error(`Physical carrier proof failed at ${checkpoint}: ${error?.name || 'Error'}: ${error?.message || 'unknown failure'}`);
  process.exitCode = 1;
});
