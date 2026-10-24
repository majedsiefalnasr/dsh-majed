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
assert.equal(process.env.DSH_CARRIER_EFFECTS_PROBE, '1', 'Use isolated runner.');
assert.equal(process.cwd(), process.env.HOME);
assert.equal(process.env.DSH_HOME, process.env.HOME);
assert.ok(basename(process.cwd()).startsWith('dsh-carrier-effects-'));
const [base, deps, remoteFile, ...flags] = process.argv.slice(2);
assert.ok(flags.every(x => ['--red-result', '--red-watch'].includes(x)));
// Electron/macOS may inject locale metadata despite the runner's cleared environment.
delete process.env.__CF_USER_TEXT_ENCODING;
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
for (const name of ['spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']) require('node:child_process')[name] = forbidden;
const children = [];
const cp = require('node:child_process'), realSpawn = cp.spawn;
const fixture = join(__dirname, 'fixture-management-mcp.cjs');
const childFlags = flags.includes('--red-result') ? ['--red-result'] : [];
let spawning = false;
cp.spawn = (command, args, options) => {
  assert.ok(spawning, 'Spawn requires admitted scoped MCP effect');
  assert.equal(command, process.execPath);
  assert.deepEqual(args, [fixture, ...childFlags]);
  assert.equal(options.cwd, process.env.HOME);
  assert.equal(options.env.HOME, process.env.HOME);
  assert.equal(options.env.DSH_HOME, process.env.HOME);
  const allowedEnvironment = new Set(['HOME', 'DSH_HOME', 'TMPDIR', 'ELECTRON_RUN_AS_NODE', 'DSH_CARRIER_EFFECTS_PROBE', 'DSH_MANAGEMENT_MCP_FIXTURE']);
  assert.ok(Object.keys(options.env).every(key => allowedEnvironment.has(key)), `Unexpected child environment keys: ${Object.keys(options.env).join(',')}`);
  assert.equal(options.env.DSH_MANAGEMENT_MCP_FIXTURE, '1');
  assert.equal(options.env.ELECTRON_RUN_AS_NODE, '1');
  assert.equal(options.env.TMPDIR, process.env.HOME);
  assert.ok(children.length < 4, 'Two lifecycles permit at most four negotiation/transport children');
  const child = realSpawn(command, args, options);
  const closed = new Promise(resolve => child.once('close', () => resolve()));
  children.push({ child, closed }); return child;
};
const watchers = [];
const realWatch = fs.watch;
fs.watch = function(path, ...args) {
  assert.ok(require('node:path').resolve(path).startsWith(process.env.HOME + '/'), 'Only disposable watcher roots');
  const watcher = realWatch.call(this, path, ...args);
  const record = { closed: false }; watchers.push(record);
  watcher.once('close', () => { record.closed = true; }); return watcher;
};
const bounded = (promise, label) => {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => {
    timer = setTimeout(() => reject(Error(`Bound exceeded: ${label}`)), 6000);
  })]).finally(() => clearTimeout(timer));
};
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
  const mount = async (plugin, context = host, config) => { const fiber = context.plugin(plugin, config); fibers.push(fiber); await fiber; return fiber; };
  const mountServer = async context => {
    creating = true;
    try { const fiber = context.plugin(WebServer, { host: '127.0.0.1', port: 0, compression: 'none' }); fibers.push(fiber); await fiber; }
    finally { creating = false; }
    const server = context.get('webServer'); assert.ok(server.port > 0); ports.add(server.port); return server;
  };
  let dom, ctx, unmount, report;
  const inFlightEffects = new Set();
  let skillWrites = 0, mcpCalls = 0, skillChanges = 0;
  let operations = 0, deliveries = 0, resolutions = 0, authCalls = 0;
  const physical = [], statuses = [];
  const endpoint = '/api/fixture/read';
  try {
    assert.throws(() => http.request('http://example.invalid/'), /AssertionError/);
    assert.throws(() => new net.Socket().connect(1, '127.0.0.1'), /Only checked HTTP internals may connect/);
    for (const attempt of [() => global.fetch('http://127.0.0.1/'), () => net.createServer(),
      () => require('node:https').request('https://example.invalid/'),
      () => require('node:dns').resolve('example.invalid', () => {})]) assert.throws(attempt, /Physical carrier forbids unowned I\/O/);
    assert.throws(() => cp.spawn('forbidden'), /Spawn requires admitted scoped MCP effect/);
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
    mkdirSync(join(project, '.git'));
    mkdirSync(join(project, '.dsh/skills'), { recursive: true });
    const dshHome = join(process.env.HOME, 'isolated-dsh'), agentsHome = join(process.env.HOME, 'isolated-agents');
    mkdirSync(join(dshHome, 'skills'), { recursive: true }); mkdirSync(agentsHome);
    const skillFile = join(project, '.dsh/skills/fixture-skill.md');
    const definition = enabled => `---\nname: fixture-skill\ndescription: ${enabled ? 'Enabled' : 'Disabled'} fixture\ndisable-model-invocation: ${!enabled}\nuser-invocable: ${enabled}\n---\nSynthetic instructions.\n`;
    fs.writeFileSync(skillFile, definition(true));
    const skillsModule = hostLoad('dsh-skill');
    await mount(skillsModule.SkillRegistry);
    await mount({ apply(owner) { owner.on('skills/change', () => { skillChanges++; }); } });
    await mount(hostLoad('dsh-skill-filesystem'), host, { dshHome, agentsHome, watch: !flags.includes('--red-watch'),
      watchStabilityThresholdMs: 30, watchPollIntervalMs: 20 });
    class PromptSink extends Service {
      constructor(owner) { super(owner, 'systemPrompt'); }
      tools() { return () => {}; } section() { return () => {}; } getSectionOrder() { return 0; }
    }
    await mount(PromptSink); await mount(hostLoad('dsh-tools').ToolRuntime);
    const skillList = async () => {
      const snapshot = await host.get('skills').snapshot({ cwd: project });
      assert.equal(snapshot.complete, true, 'Warm native catalog must be complete'); return snapshot.skills;
    };
    const initial = (await skillList()).find(row => row.name === 'fixture-skill');
    assert.equal(skillsModule.isModelInvocable(initial), true);
    assert.equal(skillsModule.isUserInvocable(initial), true);
    async function effect(action, signal) {
      signal.throwIfAborted();
      if (action === 'skill-disable' || action === 'skill-enable') {
        await skillList(); const before = skillChanges, enabled = action === 'skill-enable';
        skillWrites++; fs.writeFileSync(skillFile, definition(enabled));
        const deadline = Date.now() + 1500;
        let row;
        while (Date.now() < deadline) {
          signal.throwIfAborted();
          row = (await skillList()).find(row => row.name === 'fixture-skill');
          if (skillChanges > before && row.description === `${enabled ? 'Enabled' : 'Disabled'} fixture`) break;
          await new Promise(resolve => setTimeout(resolve, 25));
        }
        assert.ok(skillChanges > before, 'Native watcher must invalidate warm catalog');
        return `Skill model=${skillsModule.isModelInvocable(row)} user=${skillsModule.isUserInvocable(row)}`;
      }
      assert.equal(action, 'mcp-lifecycle'); mcpCalls++;
      let fiber;
      const start = children.length;
      let text;
      try {
        spawning = true;
        fiber = host.plugin(hostLoad('dsh-mcp-client'), { transport: 'stdio', serverName: 'proof', command: process.execPath,
          args: [fixture, ...childFlags], cwd: process.env.HOME,
          env: { HOME: process.env.HOME, DSH_HOME: process.env.HOME, ELECTRON_RUN_AS_NODE: '1', DSH_MANAGEMENT_MCP_FIXTURE: '1' },
          toolCallTimeoutMs: 500, failOnStartupError: true, reconnect: { enabled: false } });
        fibers.push(fiber);
        let abortedDisposal, abortKill;
        const abortMount = () => {
          abortKill = setTimeout(() => {
            for (const { child } of children.slice(start)) if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
          }, 1000);
          abortedDisposal = fiber.dispose();
        };
        signal.addEventListener('abort', abortMount, { once: true });
        try { await fiber; signal.throwIfAborted(); }
        finally {
          signal.removeEventListener('abort', abortMount);
          try { if (abortedDisposal) await abortedDisposal; } finally { clearTimeout(abortKill); }
        }
        spawning = false;
        assert.ok(host.get('tools').get('mcp__proof__echo'));
        const result = await host.get('tools').execute({ name: 'mcp__proof__echo', arguments: { mode: 'hello' },
          callId: `carrier-${mcpCalls}`, signal });
        assert.equal(result.isError, false); text = result.value.content[0].text;
      } catch (error) { console.error(`MCP startup/call: ${error.name}: ${error.message}`); throw error; }
      finally {
        spawning = false;
        const forceClose = setTimeout(() => {
          for (const { child } of children.slice(start)) if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
        }, 1000);
        try { if (fiber) await fiber.dispose(); }
        finally { clearTimeout(forceClose); }
        assert.equal(host.get('tools').get('mcp__proof__echo'), undefined);
        assert.ok(children.length > start);
        for (const record of children.slice(start)) await bounded(record.closed, 'MCP child close');
      }
      return `MCP ${text}; tool absent; children closed`;
    }
    const workspace = await host.workspaceRegistry.create(project), other = await host.workspaceRegistry.create(foreign);
    host.sessions.create('fixture-session', { meta: { cwd: project } }); await workspace.attachSession('fixture-session');
    let selectors = { sessionId: 'fixture-session', workspaceId: workspace.id };
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
        const actionSignal = AbortSignal.any([request.signal, AbortSignal.timeout(2000)]);
        const task = effect(message.payload.action, actionSignal);
        inFlightEffects.add(task);
        let value;
        try { value = await task; }
        catch (error) { console.error(`Effect failed: ${error.name}: ${error.message}`); throw error; }
        finally { inFlightEffects.delete(task); }
        return Response.json({ type: 'server-response', rpcId: message.rpcId,
          result: { ok: true, value } });
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
    let pending, selectedAction = 'skill-disable';
    function Content() {
      const [value, setValue] = react.useState('Not requested');
      return react.createElement('section', null,
        react.createElement('select', { 'data-fixture-action': '', onChange(event) { selectedAction = event.target.value; } },
          ...['skill-disable', 'skill-enable', 'mcp-lifecycle'].map(action => react.createElement('option', { key: action, value: action }, action))),
        react.createElement('button', { 'data-fixture-read': '', onClick() {
          pending = ctx.connection.rpc.call('/api', 'fixture/read', { ...selectors, action: selectedAction })
            .then(result => { setValue(result.ok ? result.value : 'Operation failed'); })
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
    const selectAction = async action => { await act(async () => {
      const select = document.querySelector('[data-fixture-action]'); select.value = action;
      select.dispatchEvent(new window.Event('change', { bubbles: true }));
    }); };
    assert.equal(output(), 'Not requested');
    const beforeWrites = writes;
    checkpoint = 'admission-before-effects';
    const effectCounts = () => [skillWrites, mcpCalls, children.length];
    const noEffects = [0, 0, 0];
    remoteMode = false; browserCookie = '';
    await read(); assert.equal(output(), 'Operation failed'); assert.equal(deliveries, 0); assert.deepEqual(effectCounts(), noEffects);
    remoteMode = true; document.head.innerHTML = `<base href="${outer.getOrigin()}/remote/">`;
    for (pairingCookie of ['', 'synthetic-device=synthetic-revoked']) {
      const before = [authCalls, proxyCalls, deliveries, resolutions, operations];
      await read(); assert.equal(output(), 'Operation failed');
      assert.deepEqual([authCalls, proxyCalls, deliveries, resolutions, operations], before);
      assert.deepEqual(effectCounts(), noEffects);
    }
    pairingCookie = 'synthetic-device=synthetic-live'; innerCookie = cookie.slice(0, -1) + (cookie.at(-1) === 'A' ? 'B' : 'A');
    await read(); assert.equal(output(), 'Operation failed'); assert.equal(deliveries, 0); assert.deepEqual(effectCounts(), noEffects);
    innerCookie = cookie; selectors = { ...selectors, workspaceId: other.id };
    await read(); assert.equal(output(), 'Operation failed'); assert.equal(operations, 0); assert.deepEqual(effectCounts(), noEffects);
    assert.equal(resolutions, 1); assert.equal(writes, beforeWrites);
    selectors = { ...selectors, workspaceId: workspace.id }; browserCookie = cookie;
    checkpoint = 'mounted-local-skill';
    remoteMode = false; document.head.innerHTML = `<base href="${inner.getOrigin()}/">`;
    await read(); assert.equal(output(), 'Skill model=false user=false', 'local native watcher DOM result');
    checkpoint = 'mounted-local-mcp'; await selectAction('mcp-lifecycle');
    await read(); assert.equal(output(), 'MCP fixture hello; tool absent; children closed', 'local official MCP DOM result');
    checkpoint = 'mounted-remote-skill'; await selectAction('skill-enable');
    remoteMode = true; document.head.innerHTML = `<base href="${outer.getOrigin()}/remote/">`;
    await read(); assert.equal(output(), 'Skill model=true user=true', 'remote native watcher DOM result');
    checkpoint = 'mounted-remote-mcp'; await selectAction('mcp-lifecycle');
    await read(); assert.equal(output(), 'MCP fixture hello; tool absent; children closed', 'remote official MCP DOM result');
    assert.equal(operations, 4); assert.equal(skillWrites, 2); assert.equal(mcpCalls, 2);
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
      skillWrites, mcpCalls, skillChanges,
      checks: ['real public inner and outer WebServer listeners; real bounded Node HTTP without interception',
        'mounted actual Settings local and remote clicks through native RPC to native Skills and official MCP effects',
        'missing local cookie, missing/revoked pairing, invalid inner cookie, wrong membership deny before operation',
        'exact-path suffix and disposed endpoint/routes deny; mounted UI, fibers and listeners disposed'],
      limitations: ['jsdom; explicit presentation/locale/session/transport adapters; no browser or TLS',
        'exactFetch correlated RPC fixture, not native genericFetch/host generic RPC dispatcher',
        'synthetic credentials/pairing/memory persistence/KV only; no operational auth discovery or state',
        'temporary combined T02A proof pending parent acceptance audit; no production CRUD, T03 or automatic closure'] };
  } finally {
    const cleanupErrors = [];
    const clean = async callback => { try { await callback(); } catch (error) { cleanupErrors.push(error); } };
    // Drain actual work (not only its HTTP waiter) before any service/listener teardown.
    await clean(async () => { await Promise.allSettled([...inFlightEffects]); });
    if (unmount) await clean(async () => { const { act } = req('react'); await act(async () => unmount()); });
    if (ctx) await clean(() => ctx.fiber.dispose());
    await clean(() => dom?.window.close());
    for (const fiber of fibers.reverse()) await clean(() => bounded(fiber.dispose(), 'fiber cleanup'));
    for (const record of children) await clean(async () => {
      if (record.child.exitCode === null && record.child.signalCode === null) record.child.kill('SIGKILL');
      await bounded(record.closed, 'forced child cleanup');
    });
    await clean(() => host.fiber.dispose()); await clean(() => outerHost.fiber.dispose());
    assert.equal(closedListeners, servers.length, 'Every owned listener closed, including red controls');
    assert.ok(servers.every(server => !server.listening));
    assert.ok(watchers.every(record => record.closed), 'Every owned native watcher closed');
    console.error(JSON.stringify({ phase: 'post-cleanup', checkpoint, closedListeners, listeners: servers.length,
      children: children.length, closedChildren: children.filter(x => x.child.exitCode !== null || x.child.signalCode !== null).length,
      watchers: watchers.length, watchersClosed: watchers.filter(x => x.closed).length, cleanupErrors: cleanupErrors.length }));
    assert.equal(cleanupErrors.length, 0, 'All independent cleanup steps must succeed');
  }
  assert.equal(closes, 1); assert.equal(closedListeners, 2);
  assert.equal(host.get('webServer'), undefined); assert.equal(outerHost.get('webServer'), undefined);
  console.log(JSON.stringify({ ...report, listeners: servers.length, closedListeners, children: children.length, closedChildren: children.filter(x => x.child.exitCode !== null || x.child.signalCode !== null).length, watchers: watchers.length, watchersClosed: watchers.filter(x => x.closed).length, checkpoint: 'complete' }, null, 2));
}
main().catch(error => {
  // Never print launch URLs, cookie values, requests or synthetic signing state.
  console.error(`Physical carrier proof failed at ${checkpoint}: ${error?.name || 'Error'}: ${error?.message || 'unknown failure'}`);
  process.exitCode = 1;
});
