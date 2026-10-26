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
assert.ok(flags.every(x => ['--require-slash-refresh', '--red-membership'].includes(x)));
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
const watchers = [];
const realWatch = fs.watch;
fs.watch = function(path, ...args) {
  const target = require('node:path').resolve(path);
  assert.ok(target === process.env.HOME || target.startsWith(process.env.HOME + '/'), 'Only disposable watcher roots');
  const watcher = realWatch.call(this, path, ...args);
  const record = { closed: false }; watchers.push(record);
  // Chokidar removes raw watcher listeners before invoking public close().
  // Observe the successful native close call as well as the optional event.
  const close = watcher.close;
  watcher.close = function(...values) { const result = close.apply(this, values); record.closed = true; return result; };
  watcher.once('close', () => { record.closed = true; }); return watcher;
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
const endpoint = '/api/majed/skills';
  try {
    assert.throws(() => http.request('http://example.invalid/'), /AssertionError/);
    assert.throws(() => new net.Socket().connect(1, '127.0.0.1'), /Only checked HTTP internals may connect/);
    for (const attempt of [() => global.fetch('http://127.0.0.1/'), () => net.createServer(),
      () => require('node:https').request('https://example.invalid/'),
      () => require('node:dns').resolve('example.invalid', () => {}),
      () => require('node:child_process').spawn('forbidden')]) assert.throws(attempt, /Physical carrier forbids unowned I\/O/);
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
    mkdirSync(project); mkdirSync(foreign); mkdirSync(join(project, '.git'));
    mkdirSync(join(process.env.HOME, '.agents'), { recursive: true });
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
    const skillModule = hostLoad('dsh-skill');
    await mount(skillModule.SkillRegistry);
    await mount({ apply(owner) {
      class WorkingDirectory extends Service {
        constructor(ctx) { super(ctx, 'workingDirectory'); }
        defaultDirectory = project;
        async ensure() { return project; }
      }
      class Queries extends Service {
        constructor(ctx) { super(ctx, 'sessionQuery'); }
        async observeSession(id) {
          const header = host.sessions.get(id)?.header; assert.ok(header);
          return { header, projections: { values: {} }, [Symbol.dispose]() {} };
        }
      }
      class Agents extends Service {
        constructor(ctx) { super(ctx, 'agents'); }
        get() { return undefined; }
      }
      class Prompts extends Service {
        constructor(ctx) { super(ctx, 'systemPrompt'); }
        tools() { return () => {}; }
        section() { return () => {}; }
        getSectionOrder() { return 0; }
      }
      new WorkingDirectory(owner); new Queries(owner); new Agents(owner); new Prompts(owner);
    } });
    await mount(hostLoad('dsh-tools').ToolRuntime);
    await mount({ inject: ['tools', 'skills', 'workingDirectory'], apply: hostLoad('dsh-tool-skill').apply });
    await mount({ inject: ['sessionQuery', 'agents', 'workingDirectory', 'skills'], apply(owner) {
      new (hostLoad('dsh-api-session-controller').SessionSkillCatalog)(owner);
    } });
    await mount({ inject: ['skills'], apply(owner) { hostLoad('dsh-skill-filesystem').apply(owner, {
      dshHome: process.env.HOME, agentsHome: join(process.env.HOME, '.agents'), watch: true,
      watchStabilityThresholdMs: 20, watchPollIntervalMs: 10,
    }); } });
    const { apply: settingsHost } = await import('../index.js');
    let endpointFiber = await mount({ apply: settingsHost });
    const carrier = async (input, init) => {
      assert.equal(input, 'api/majed/skills'); assert.equal(init.method, 'POST');
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
    const dictionaries = new Map();
    const localeRevision = stores.createSnapshotStore({ revision: 0 });
    const locale = { register(ns, values) { dictionaries.set(ns, values.en); return () => dictionaries.delete(ns); },
      bind: ns => key => dictionaries.get(ns)?.[key] ?? key, getSnapshot: localeRevision.getSnapshot, subscribe: localeRevision.subscribe };
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
    let product;
    const bundle = fs.readFileSync(join(__dirname, '../dist/client.js'), 'utf8'); hashes.productClient = digest(bundle);
    const sandbox = vm.createContext({ window: { __ModuleLoader__: { load(spec) { product = spec.factory(id => {
      if (id === 'react') return react;
      if (id === '@deepseek-ai/dsh-client-ui-primitives') return primitives;
      throw Error('Unexpected product dependency');
    }); } } }, document, navigator: {}, localStorage: { getItem: () => null, setItem: forbidden },
      MutationObserver, requestAnimationFrame: fn => setTimeout(fn, 0), cancelAnimationFrame: clearTimeout,
      setTimeout, clearTimeout, AbortController });
    vm.runInContext(bundle, sandbox, { timeout: 2000 });
    ctx.reflect.provide('uiWorkspace', { openSession: forbidden });
    product.apply(ctx);
    let slashSource;
    const slashModule = load('dsh-client-ui-skill', { react, 'react/jsx-runtime': jsx,
      '@deepseek-ai/dsh-client-ui-primitives': { ...primitives, rankByName: (rows, query) => rows.filter(row => row.name.includes(query)) } });
    const slashStops = [];
    const slashCtx = {
      effect(run) { const stop = run(); if (typeof stop === 'function') slashStops.push(stop); },
      locale, slots: { inject() {}, register() { return () => {}; } },
      uiConversation: { userText: { register() {} } },
      get(name) { assert.equal(name, 'inputTriggers'); return { registerSource(source) { slashSource = source; return () => { slashSource = undefined; }; } }; },
      sessions: { binding: () => ({}), subagentAddress: () => undefined,
        async using(id, _options, callback) { return callback({ binding: { session: { getSnapshot: () => ({ openState: 'open' }) } } }); } },
      remote: { skills: { async list(request, signal) { return { ok: true, value: await host.sessionSkillCatalog.list(request, signal) }; } },
        $on(name, callback) { const stop = host.on(name, callback); slashStops.push(stop); } },
      on(name, callback) { assert.equal(name, 'connection/reset'); return () => {}; },
    };
    slashModule.apply(slashCtx);
    const slash = () => slashSource.candidates({ sessionId: 'fixture-session' }, { query: 'native-fixture', signal: new AbortController().signal });
    await act(async () => { unmount = ctx.uiRenderer.mount(document.getElementById('mount')); });
    await act(async () => document.querySelector('[aria-haspopup=dialog]').click());
    const settle = () => new Promise(resolve => setTimeout(resolve, 80));
    const select = async title => { await act(async () => { const button = [...document.querySelectorAll('button')].find(b => b.textContent === title); assert.ok(button, 'Missing title: ' + title + '; buttons: ' + [...document.querySelectorAll('button')].map(b => b.textContent).join('|')); button.click(); await settle(); }); };
    const refresh = async () => { await act(async () => { document.querySelector('[data-skills-refresh]').click(); await settle(); }); };
    const text = () => document.querySelector('.majed-skills').textContent;
    const click = async selector => { await act(async () => { const element = document.querySelector(selector); assert.ok(element, selector); element.click(); await settle(); }); };
    await select('Skills Manager'); await act(settle);
    assert.match(text(), /Skills are disabled/);
    await click('[data-skills-enable]');
    assert.match(text(), /Skills are enabled/);
    const rpc = async (action, input = {}, scope = {}) => ctx.connection.rpc.call('/api', 'majed/skills', { action, input, ...scope });
    for (const [field, value] of [['name', 'Native Fixture'], ['description', 'Native user fixture'], ['body', 'User instructions.']]) {
      await act(async () => {
        const input = document.querySelector(`[data-skills-field="${field}"]`);
        const prototype = field === 'body' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, value);
        input.dispatchEvent(new window.Event('input', { bubbles: true }));
      });
    }
    await click('[data-skills-create]');
    const readSkill = async cwd => (await host.skills.snapshot({ cwd })).skills.find(skill => skill.name === 'native-fixture');
    const first = await readSkill(project);
    assert.equal(first.invocation.modelInvocable, true);
    assert.equal(first.invocation.userInvocable, true);
    assert.equal((await slash()).length, 1, 'native slash menu starts visible and warms its session cache');
    const modelCall = () => host.tools.execute({ name: 'skill', arguments: { name: 'native-fixture' }, callId: 'model-proof', signal: new AbortController().signal });
    assert.equal((await modelCall()).isError, false, 'actual native tool loads enabled Skill');
    await refresh(); assert.match(text(), /native-fixture/);
    await click('[data-skills-toggle="native-fixture"]');
    const disabled = await readSkill(project);
    assert.equal(disabled.invocation.modelInvocable, false);
    assert.equal(disabled.invocation.userInvocable, false);
    assert.equal((await host.sessionSkillCatalog.list({ sessionId: 'fixture-session' })).skills.length, 0, 'Current native user catalog excludes disabled Skill');
    assert.equal((await slash()).length, flags.includes('--require-slash-refresh') ? 0 : 1, 'Known gap: warmed native slash source ignores catalog invalidation');
    const modelDenied = await modelCall();
    assert.equal(modelDenied.isError, true);
    assert.match(modelDenied.error.message, /not available for model invocation/);
    await click('[data-skills-toggle="native-fixture"]');
    assert.equal((await readSkill(project)).invocation.modelInvocable, true);
    assert.equal((await slash()).length, 1);
    remoteMode = true; document.head.innerHTML = `<base href="${outer.getOrigin()}/remote/">`;
    await refresh(); assert.match(text(), /native-fixture/); assert.ok(proxyCalls > 0);
    await click('[data-skills-trash="native-fixture"]');
    assert.equal(await readSkill(project), undefined);
    assert.equal((await host.sessionSkillCatalog.list({ sessionId: 'fixture-session' })).skills.length, 0);
    await click('[data-skills-restore]');
    assert.equal((await readSkill(project)).invocation.userInvocable, true);
    assert.equal((await slash()).length, 1);
    const projectSnapshot = await rpc('list', {}, selectors);
    assert.equal(projectSnapshot.ok, true, JSON.stringify(projectSnapshot));
    const projectRoot = projectSnapshot.value.roots.find(root => root.kind === 'project-dsh');
    assert.ok(projectRoot);
    const projectCreate = await rpc('create', { root: projectRoot.key, name: 'Native Fixture', description: 'Native project fixture', body: 'Project instructions.' }, selectors);
    assert.equal(projectCreate.ok, true, JSON.stringify(projectCreate));
    assert.equal((await host.skills.get('native-fixture', { cwd: project })).content.trim(), 'Project instructions.');
    assert.equal((await host.skills.get('native-fixture', { cwd: foreign })).content.trim(), 'User instructions.');
    assert.equal((await rpc('setEnabled', { root: projectRoot.key, name: 'native-fixture', enabled: false }, selectors)).ok, true);
    assert.equal((await host.skills.get('native-fixture', { cwd: project })).content.trim(), 'User instructions.');
    const userFile = join(process.env.HOME, 'skills/native-fixture/SKILL.md');
    const originalUserSource = fs.readFileSync(userFile, 'utf8');
    const eol = String.fromCharCode(10);
    fs.writeFileSync(userFile, originalUserSource.replace(eol + '---' + eol, eol + 'disable-model-invocation: true' + eol + '---' + eol));
    assert.equal((await rpc('setEnabled', { root: 'dsh', name: 'native-fixture', enabled: true })).ok, true);
    assert.equal((await modelCall()).isError, true, 'Manager enable never grants source-denied model invocation');
    assert.equal((await slash()).length, 1, 'User invocation remains independent');
    fs.writeFileSync(userFile, originalUserSource.replace(eol + '---' + eol, eol + 'user-invocable: false' + eol + '---' + eol));
    assert.equal((await rpc('setEnabled', { root: 'dsh', name: 'native-fixture', enabled: true })).ok, true);
    assert.equal((await modelCall()).isError, false);
    assert.equal((await host.sessionSkillCatalog.list({ sessionId: 'fixture-session' })).skills.length, 0, 'Source-denied user invocation remains denied in the current native catalog');
    fs.writeFileSync(userFile, originalUserSource);
    assert.equal((await rpc('setEnabled', { root: 'dsh', name: 'native-fixture', enabled: true })).ok, true);
    const privatePolicy = join(process.env.HOME, 'majed/skills/state.json');
    assert.equal(fs.statSync(privatePolicy).mode & 0o777, 0o600);
    assert.equal(fs.existsSync(join(process.env.HOME, 'skills-manager')), false, 'No reference-owned policy/trash store');
    assert.match(fs.readFileSync(join(process.env.HOME, 'skills/native-fixture/SKILL.md'), 'utf8'), /User instructions/);
    assert.doesNotMatch(fs.readFileSync(join(process.env.HOME, 'skills/native-fixture/SKILL.md'), 'utf8'), /disable-model-invocation/);
    assert.equal((await rpc('create', { root: 'dsh', name: 'Native Fixture', description: 'Collision', body: 'Different.' })).ok, false);
    assert.equal((await rpc('trash', { root: 'dsh', name: '../../foreign' })).ok, false);
    const userSkills = join(process.env.HOME, 'skills');
    fs.renameSync(userSkills, userSkills + '-saved'); fs.symlinkSync(foreign, userSkills);
    try { assert.equal((await rpc('create', { root: 'dsh', name: 'Escape', description: 'Blocked', body: 'Blocked' })).ok, false); }
    finally { fs.unlinkSync(userSkills); fs.renameSync(userSkills + '-saved', userSkills); }
    assert.equal(fs.existsSync(join(foreign, 'escape')), false);
    await endpointFiber.dispose();
    endpointFiber = await mount({ apply: settingsHost });
    assert.equal((await rpc('status')).value.enabled, false, 'Service restart requires fresh explicit enablement');
    assert.equal((await rpc('enable', { enabled: true, confirm: true })).ok, true);
    assert.equal((await host.skills.get('native-fixture', { cwd: project })).content.trim(), 'User instructions.', 'Private project disable survives service restart');
    assert.equal((await rpc('detail', { root: projectRoot.key, name: 'native-fixture' }, selectors)).value.body, 'Project instructions.');
    const wrong = await rpc('list', {}, { ...selectors, workspaceId: other.id });
    assert.equal(wrong.ok, false); assert.equal(wrong.error.code, 'scope_not_found');
    const forged = await rpc('list', { projectCwds: [foreign] });
    assert.equal(forged.ok, false); assert.equal(forged.error.code, 'invalid_request');
    remoteMode = false; document.head.innerHTML = `<base href="${inner.getOrigin()}/">`; browserCookie = '';
    await refresh(); assert.match(text(), /Owner access required/);
    browserCookie = cookie;
    remoteMode = true; document.head.innerHTML = `<base href="${outer.getOrigin()}/remote/">`;
    pairingCookie = ''; await refresh(); assert.match(text(), /Owner access required/);
    pairingCookie = 'synthetic-device=synthetic-live'; await refresh(); assert.match(text(), /native-fixture/);
    const post = { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ type: 'client-request', rpcId: 'scoped', method: 'majed/skills', payload: { action: 'list', input: {}, ...selectors } }) };
    for (const headers of [{ ...post.headers, origin: 'http://evil.invalid' }, { ...post.headers, 'sec-fetch-site': 'cross-site' }]) assert.equal((await physicalFetch(inner.getOrigin() + endpoint, { ...post, headers })).status, 403);
    assert.equal((await physicalFetch(inner.getOrigin() + endpoint + '/suffix', post)).status, 404);
    await endpointFiber.dispose();
    slashStops.reverse().forEach(stop => stop());
    assert.equal((await physicalFetch(inner.getOrigin() + endpoint, post)).status, 404);
    disposeRemote.forEach(dispose => dispose()); disposeRoot();
    await act(async () => { unmount(); unmount = undefined; await ctx.fiber.dispose(); }); ctx = undefined;
    assert.equal(document.getElementById('mount').childNodes.length, 0); assert.equal(events.size, 0);
    report = { runtime: JSON.parse(fs.readFileSync(join(base, 'package.json'), 'utf8')).version,
      node: process.version, hashes, statuses, physical, proxyCalls,
      checks: ['production Skills service and mounted native Settings over authenticated local/paired remote HTTP',
        'real core create/toggle/trash/restore reaches actual native model tool and current native user catalog',
        'source model/user invocation flags remain independent and cannot be overridden by enable',
        'private mode-0600 policy, mode-0700 directory, unchanged source, service restart restoration',
        'collision/traversal/symlink escape rejected without foreign writes',
        'authenticated canonical project scope and duplicate-source fallback; forged paths/membership deny',
        'missing local cookie/pairing, CSRF and suffix rejection; endpoint/client/listener cleanup'],
      limitations: ['jsdom and presentation/locale adapters; no browser layout or operational state',
        'known failed acceptance criterion: warmed native slash source remains stale; --require-slash-refresh fails',
        'synthetic credentials/pairing/memory persistence, real temporary Skill files',
        'native SessionSkillCatalog uses explicit query/agent/working-directory adapters; no live Agent resume',
        'native slash remote list/event callbacks are same-process adapters, not a proved paired event-stream carrier'] };
  } finally {
    const cleanupErrors = [];
    const clean = async callback => { try { await callback(); } catch (error) { cleanupErrors.push(error); } };
    if (unmount) await clean(async () => { const { act } = req('react'); await act(async () => unmount()); });
    if (ctx) await clean(() => ctx.fiber.dispose());
    await clean(() => dom?.window.close());
    for (const fiber of fibers.reverse()) await clean(() => fiber.dispose());
    await clean(() => host.fiber.dispose()); await clean(() => outerHost.fiber.dispose());
    await new Promise(resolve => setImmediate(resolve));
    console.error(JSON.stringify({ phase: 'cleanup', watchers: watchers.length, closedWatchers: watchers.filter(record => record.closed).length }));
    assert.equal(closedListeners, servers.length, 'Every owned listener closed, including red controls');
    assert.ok(servers.every(server => !server.listening));
    assert.ok(watchers.every(watcher => watcher.closed), 'Every owned native watcher closed');
    assert.equal(cleanupErrors.length, 0, 'All independent cleanup steps must succeed');
  }
  assert.equal(closes, 1); assert.equal(closedListeners, 2);
  assert.equal(host.get('webServer'), undefined); assert.equal(outerHost.get('webServer'), undefined);
  console.log(JSON.stringify({ ...report, listeners: servers.length, closedListeners, watchers: watchers.length, closedWatchers: watchers.filter(record => record.closed).length, checkpoint: 'complete' }, null, 2));
}
main().catch(error => {
  // Never print launch URLs, cookie values, requests or synthetic signing state.
  console.error(`Physical carrier proof failed at ${checkpoint}: ${error?.name || 'Error'}: ${error?.message || 'unknown failure'}`);
  process.exitCode = 1;
});
