// Real ReactDOM + installed renderer/Settings bundles, with explicit external adapters.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { join, basename } = require('node:path');
const { createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');
const { createHash } = require('node:crypto');
assert.equal(process.env.DSH_MOUNTED_SETTINGS_PROBE, '1', 'Use isolated runner.');
assert.equal(process.cwd(), process.env.HOME);
assert.equal(process.env.DSH_HOME, process.env.HOME);
assert.ok(basename(process.cwd()).startsWith('dsh-mounted-settings-'));
const [base, deps, ...flags] = process.argv.slice(2);
assert.ok(flags.every(x => ['--red-selection', '--red-disposal'].includes(x)));
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
for (const method of ['lookup', 'resolve', 'resolve4', 'resolve6']) require('node:dns')[method] = forbidden;
global.fetch = forbidden; global.WebSocket = forbidden;
const expectedVersions = { '@deepseek-ai/dsh-client-test-runtime': '0.2.1-rc.2', '@deepseek-ai/dsh-client-ui-slots': '0.2.1-rc.2',
  '@deepseek-ai/dsh-client-store': '0.2.1-rc.2', '@deepseek-ai/cordis': '4.0.5', react: '18.3.1', 'react-dom': '18.3.1', jsdom: '26.1.0', zustand: '4.5.7', immer: '10.1.1' };
for (const [name, version] of Object.entries(expectedVersions)) assert.equal(JSON.parse(fs.readFileSync(req.resolve(`${name}/package.json`), 'utf8')).version, version, `Dependency version: ${name}`);
function load(name, dependencies) {
  const path = join(base, 'node_modules/@deepseek-ai', name, 'lib/client.js');
  const source = fs.readFileSync(path, 'utf8'); hashes[name] = digest(source);
  let exported;
  const context = vm.createContext({ document, window: { __ModuleLoader__: { load(spec) {
    assert.equal(spec.id, `@deepseek-ai/${name}`);
    exported = spec.factory(id => { assert.ok(Object.hasOwn(dependencies, id), `Unapproved dependency: ${id}`); return dependencies[id]; });
  } } }, console, setTimeout, clearTimeout, queueMicrotask }, { codeGeneration: { strings: false, wasm: false } });
  vm.runInContext(source, context, { filename: path, timeout: 2000 });
  return exported;
}
async function main() {
  const { JSDOM } = req('jsdom');
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="mount"></div></body></html>', { url: 'https://fixture.invalid/' });
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
  // Presentation boundary only: real hooks/store/portal/slot engine are NOT replaced.
  const icon = () => react.createElement('span', { 'aria-hidden': true });
  const primitives = { Tooltip: ({ children }) => children, ConnectionIndicator: icon,
    IconSettingsOutlineMedium: icon, IconCloseOutlineRegular: icon, useModalLayer() {},
    Switch: ({ checked, disabled, label, onChange }) => react.createElement('input', { type: 'checkbox', checked, disabled, 'aria-label': label, onChange: event => onChange(event.target.checked) }) };
  const renderer = load('dsh-client-ui-renderer', shared);
  const settings = load('dsh-client-ui-settings', shared);
  const general = load('dsh-client-ui-settings-general', { ...shared, '@deepseek-ai/dsh-client-ui-primitives': primitives });
  const ctx = new cordis.Context();
  const events = new Map();
  let namespaces = [], reads = 0, dictionary;
  const localeRevision = stores.createSnapshotStore({ revision: 0 });
  const locale = { register(_ns, values) { dictionary = values.en; return () => { dictionary = undefined; }; },
    bind: () => key => dictionary?.[key] ?? key, getSnapshot: localeRevision.getSnapshot, subscribe: localeRevision.subscribe };
  const connection = { state: stores.createSnapshotStore('connected'), reconnect: forbidden };
  let command;
  ctx.reflect.provide('remote', { $host: { isLoopback: false }, $on(name, fn) { events.set(name, fn); return () => events.delete(name); },
    settings: { async describe() { reads++; return { ok: true, value: { namespaces } }; } } });
  ctx.reflect.provide('locale', locale);
  ctx.reflect.provide('connection', connection);
  ctx.reflect.provide('shortcuts', { catalog: stores.createSnapshotStore([]), register(value) { command = value; return () => { command = undefined; }; } });
  ctx.reflect.provide('modules', { entries: { releaseChange: stores.createSnapshotStore(undefined), dismissRelease: forbidden } });
  renderer.apply(ctx);
  ctx.slots.installLocale(locale);
  ctx.slots.installScope('session', { current: stores.createSnapshotStore(undefined), resolve: forbidden, subscribeRelease: () => () => {} });
  ctx.slots.provideRoot({ hooks: { sessions: stores.createSnapshotStore({ phase: 'loading', byId: {} }) } });
  settings.apply(ctx);
  await ctx.configForms.describe().ensure();
  assert.equal(reads, 1);
  general.apply(ctx);
  ctx.slots.register({ name: 'root', children: { 'sidebar.settings': { kind: 'single', scope: 'root' } } },
    ({ renderSlot }) => renderSlot('sidebar.settings', { wide: true }));
  let mounts = 0, cleanups = 0;
  function Content() {
    react.useEffect(() => { mounts++; return () => { cleanups++; }; }, []);
    return react.createElement('p', { 'data-fixture-manager': '' }, 'Synthetic section content');
  }
  const stop = ctx.configForms.whileServed(['fixture-manager'], () => ctx.slots.register({ name: 'settings.section', id: 'fixture-manager', order: 20, label: 'Fixture Manager' }, Content));
  let unmount;
  await act(async () => { unmount = ctx.uiRenderer.mount(document.getElementById('mount')); });
  const buttons = () => [...document.querySelectorAll('button')];
  const manager = () => buttons().find(b => b.textContent === 'Fixture Manager');
  assert.equal(manager(), undefined, 'unserved namespace must not register');
  await act(async () => {
    namespaces = [{ ns: 'fixture-manager' }]; events.get('settings/document-updated')(); await ctx.configForms.describe().ensure();
  });
  assert.equal(document.querySelector('[role=dialog]'), null);
  await act(async () => document.querySelector('[aria-haspopup=dialog]').click());
  assert.ok(document.querySelector('[role=dialog]'), 'native click opens mounted dialog');
  assert.ok(manager(), 'native navigation projects served section');
  await act(async () => { if (!flags.includes('--red-selection')) manager().click(); });
  assert.ok(document.querySelector('[data-fixture-manager]'), 'native-section-selection');
  assert.equal(manager().getAttribute('aria-current'), 'true');
  assert.equal(mounts, 1);
  await act(async () => {
    if (!flags.includes('--red-disposal')) namespaces = [];
    events.get('settings/document-updated')(); await ctx.configForms.describe().ensure();
  });
  assert.equal(document.querySelector('[data-fixture-manager]') !== null, false, 'withdrawn-section-disposal');
  assert.equal(cleanups, 1, 'withdrawal unmounts real component effect');
  assert.equal(manager(), undefined);
  assert.ok(buttons().some(b => b.textContent === 'General' && b.getAttribute('aria-current') === 'true'), 'native General fallback');
  await act(async () => { namespaces = [{ ns: 'fixture-manager' }]; await ctx.configForms.describe().load(); });
  assert.ok(manager());
  await act(async () => { stop(); await ctx.configForms.describe().load(); });
  assert.equal(manager(), undefined, 'disposed watcher cannot re-register');
  await act(async () => { unmount(); await ctx.fiber.dispose(); });
  assert.equal(document.getElementById('mount').childNodes.length, 0);
  assert.equal(events.size, 0); assert.equal(command, undefined);
  dom.window.close();
  const dependencies = {};
  for (const name of Object.keys(expectedVersions)) {
    const path = req.resolve(`${name}/package.json`);
    dependencies[name] = { version: JSON.parse(fs.readFileSync(path, 'utf8')).version, manifestSha256: digest(fs.readFileSync(path)), entrySha256: digest(fs.readFileSync(req.resolve(name))) };
  }
  console.log(JSON.stringify({ runtime: JSON.parse(fs.readFileSync(join(base, 'package.json'), 'utf8')).version, node: process.version, hashes, dependencies,
    checks: ['real renderer mount and native click', 'served namespace and native section navigation', 'withdrawal effect cleanup and General fallback', 'watcher disposal prevents re-registration', 'React unmount and Cordis disposal'],
    limitations: ['jsdom DOM mount, not browser/live proof', 'Presentation primitives are explicit adapters; no CSS/layout/focus proof', 'Synthetic remote/locale/session boundaries; no Manager operation, host admission, persistence or paired remote proof'] }, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
