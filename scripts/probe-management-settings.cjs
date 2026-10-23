// Unchanged native client execution with explicit boundary doubles; NOT mounted React.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { join, basename } = require('node:path');
const { createHash } = require('node:crypto');
assert.equal(process.env.DSH_MANAGEMENT_SETTINGS_PROBE, '1', 'Use the isolated runner.');
assert.equal(process.cwd(), process.env.HOME);
assert.equal(process.env.DSH_HOME, process.env.HOME);
assert.ok(basename(process.cwd()).startsWith('dsh-management-settings-'));
const base = process.argv[2];
const flags = process.argv.slice(3);
assert.ok(flags.every(x => ['--red-selection', '--red-disposal'].includes(x)));
// These bundles receive no Node require/process, network, timers or dynamic imports.
// The only host reads below are the two public bundles and runtime version manifest.
function store(initial) {
  let value = initial;
  const listeners = new Set();
  return { getSnapshot: () => value, subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    set(next) { value = next; for (const fn of listeners) fn(); },
    update(fn) { const draft = structuredClone(value); fn(draft); this.set(draft); } };
}
const stores = { createSnapshotStore: store, defineStore(spec) { return { create() {
  const state = store(spec.init());
  return { ...state, actions: Object.fromEntries(Object.entries(spec.actions).map(([name, fn]) => [name, (...args) => {
    const next = { ...state.getSnapshot() }; fn(next, ...args); state.set(next);
  }])) };
} }; } };
const jsx = (type, props, key) => ({ type, props: props || {}, key });
const react = { useState: initial => [typeof initial === 'function' ? initial() : initial, () => { throw Error('Unexpected React state mutation'); }],
  useRef: current => ({ current }), useId: () => 'fixture-title', useCallback: fn => fn, useEffect() {}, useLayoutEffect() {} };
const primitiveNames = ['Tooltip', 'ConnectionIndicator', 'IconSettingsOutlineMedium', 'IconCloseOutlineRegular'];
const primitives = Object.fromEntries(primitiveNames.map(name => [name, `fixture-${name}`]));
primitives.useModalLayer = () => {};
const hashes = {};
function load(name, dependencies) {
  const path = join(base, 'node_modules/@deepseek-ai', name, 'lib/client.js');
  const source = fs.readFileSync(path, 'utf8');
  hashes[name] = createHash('sha256').update(source).digest('hex');
  let exported;
  const context = vm.createContext({ window: { __ModuleLoader__: { load(spec) {
    assert.equal(spec.id, `@deepseek-ai/${name}`);
    exported = spec.factory(id => { assert.ok(Object.hasOwn(dependencies, id), `Unapproved dependency: ${id}`); return dependencies[id]; });
  } } } }, { codeGeneration: { strings: false, wasm: false } });
  vm.runInContext(source, context, { filename: path, timeout: 2000 });
  // No document during module evaluation: CSS injection is intentionally not tested.
  context.document = { body: Object.freeze({ fixturePortalTarget: true }) };
  return exported;
}
const baseClient = load('dsh-client-ui-settings', {
  '@deepseek-ai/cordis': { Service: class { constructor(ctx, name) { ctx[name] = this; } } },
  '@deepseek-ai/dsh-client-store': stores,
});
const shellClient = load('dsh-client-ui-settings-general', {
  '@deepseek-ai/dsh-client-store': stores, '@deepseek-ai/dsh-client-ui-slots': { resolveSlotLabel: label => typeof label === 'function' ? label() : label },
  '@deepseek-ai/dsh-client-ui-primitives': primitives, react, 'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'fixture-fragment' },
  'react-dom': { createPortal: (node, target) => { assert.equal(target.fixturePortalTarget, true); return node; } },
});
const effects = [];
const events = new Map();
const on = (name, fn) => { events.set(name, fn); return () => events.delete(name); };
let namespaces = [];
let reads = 0;
const ctx = { effect(fn) { effects.push(fn()); }, on,
  remote: { $host: { isLoopback: false }, $on: on, settings: { async describe() { reads++; return { ok: true, value: { namespaces } }; } } } };
// Explicit ledger double: not native SlotCore/renderer or Cordis lifecycle evidence.
const entries = [];
let version = 0;
const listeners = new Set();
const bump = () => { version++; for (const fn of listeners) fn(); };
ctx.slots = {
  inject(_name, fn) { effects.push(fn()); },
  register(options, component) { const entry = { options, component }; entries.push(entry); bump(); return () => { const i = entries.indexOf(entry); if (i >= 0) { entries.splice(i, 1); bump(); } }; },
  entries: name => entries.filter(e => e.options.name === name), getVersion: () => version,
  subscribe(_name, fn) { listeners.add(fn); return () => listeners.delete(fn); },
};
let dictionary;
const localeListeners = new Set();
ctx.locale = { register(_ns, dictionaries) { dictionary = dictionaries.en; return () => { dictionary = undefined; }; },
  bind: () => key => dictionary?.[key] ?? key, getSnapshot: () => ({ revision: 0 }),
  subscribe(fn) { localeListeners.add(fn); return () => localeListeners.delete(fn); } };
ctx.connection = { state: store('connected'), reconnect() { throw Error('No reconnect allowed'); } };
ctx.get = name => { assert.equal(name, 'connection'); return ctx.connection; };
let command;
ctx.shortcuts = { catalog: store([]), register(value) { command = value; return () => { command = undefined; }; } };
ctx.modules = { entries: { releaseChange: store(undefined), dismissRelease() { throw Error('No release action allowed'); } } };
function flatten(node) {
  if (Array.isArray(node)) return node.flatMap(flatten);
  if (node == null || typeof node !== 'object') return [];
  return [node, ...flatten(node.props?.children)];
}
function expand(node) {
  if (Array.isArray(node)) return node.map(expand);
  if (node == null || typeof node !== 'object') return node;
  if (typeof node.type === 'function') return expand(node.type(node.props));
  return { ...node, props: { ...node.props, children: expand(node.props.children) } };
}
async function main() {
  baseClient.apply(ctx);
  await ctx.configForms.describe().ensure();
  assert.equal(reads, 1);
  shellClient.apply(ctx);
  const shell = entries.find(e => e.options.name === 'sidebar.settings');
  assert.equal(shell.options.children['settings.section'].kind, 'list');
  const state = shell.options.store.create();
  const injected = shell.options.inject();
  let notifications = 0;
  const unsubscribe = injected.hooks.sections.subscribe(() => notifications++);
  const stop = ctx.configForms.whileServed(['fixture-manager'], () => ctx.slots.register({ name: 'settings.section', id: 'fixture-manager', order: 20, label: 'Fixture Manager' }, () => jsx('p', { children: 'Synthetic section content' })));
  assert.equal(injected.hooks.sections.getSnapshot().length, 1, 'Unserved namespace must not register');
  namespaces = [{ ns: 'fixture-manager' }];
  events.get('settings/document-updated')();
  await ctx.configForms.describe().ensure();
  assert.deepEqual(Array.from(injected.hooks.sections.getSnapshot(), row => row.id), ['general', 'fixture-manager']);
  const renderSlot = (name, props, options = {}) => {
    const matches = ctx.slots.entries(name).filter(e => (!options.only || e.options.id === options.only) && !(name === 'settings.section' && e.options.id === 'general'));
    return matches.length ? matches.map(e => jsx(e.component, { ...props, t: ctx.locale.bind('settings'), renderSlot })) : options.fallback ?? null;
  };
  // General rows are not this seam: avoid evaluating their injected form editors.
  const render = () => expand(jsx(shell.component, {
    wide: true, ...Object.fromEntries(Object.entries(injected.hooks).map(([key, value]) => [`use${key[0].toUpperCase()}${key.slice(1)}`, select => select(value.getSnapshot())])),
    useStore: select => select(state.getSnapshot()), actions: state.actions,
    useSessions: select => select({ phase: 'loading', byId: {} }), t: ctx.locale.bind('settings'),
    renderSlot: (name, props, options) => name === 'settings.general.item' ? null : renderSlot(name, props, options),
  }));
  let nodes = flatten(render());
  assert.equal(nodes.some(n => n.props.role === 'dialog'), false);
  nodes.find(n => n.props['aria-haspopup'] === 'dialog').props.onClick();
  nodes = flatten(render());
  assert.ok(nodes.some(n => n.props.role === 'dialog'));
  const row = nodes.find(n => n.type === 'button' && flatten(n).some(child => child.props.children === 'Fixture Manager'));
  assert.ok(row, 'Native navigation must project contributed label');
  row.props.onClick();
  nodes = flatten(render());
  assert.equal(state.getSnapshot().activeId, flags.includes('--red-selection') ? 'wrong-section' : 'fixture-manager', 'native-section-selection');
  assert.ok(nodes.some(n => n.type === 'p' && n.props.children === 'Synthetic section content'));
  assert.equal(nodes.filter(n => n.props['aria-current'] === 'true').length, 1);
  namespaces = [];
  events.get('settings/document-updated')();
  await ctx.configForms.describe().ensure();
  nodes = flatten(render());
  assert.equal(nodes.some(n => n.props.children === 'Synthetic section content'), flags.includes('--red-disposal'), 'withdrawn-section-disposal');
  assert.ok(nodes.some(n => n.type === 'button' && n.props['aria-current'] === 'true'), 'Native fallback selects remaining General');
  namespaces = [{ ns: 'fixture-manager' }];
  await ctx.configForms.describe().load();
  stop();
  assert.equal(ctx.slots.entries('settings.section').length, 1);
  await ctx.configForms.describe().load();
  assert.equal(ctx.slots.entries('settings.section').length, 1, 'Disposed watcher must not re-register');
  assert.ok(notifications >= 4);
  unsubscribe();
  assert.equal(listeners.size, 0); assert.equal(localeListeners.size, 0);
  for (const dispose of effects.reverse()) if (typeof dispose === 'function') await dispose();
  assert.equal(entries.length, 0); assert.equal(events.size, 0); assert.equal(command, undefined);
  console.log(JSON.stringify({ runtime: JSON.parse(fs.readFileSync(join(base, 'package.json'), 'utf8')).version, node: process.version, hashes,
    checks: ['native apply and served-namespace registration', 'native trigger and navigation select contributed content', 'withdrawal falls back to General', 'explicit watcher disposal prevents re-registration', 'captured native cleanup removes registrations/events'],
    limitations: ['Synthetic element-tree execution, NOT mounted React/browser/SSR.', 'Ledger, store, Cordis service binding, React hooks, portal and primitives are explicit doubles; effects/focus/CSS are not exercised.', 'No native SlotCore lifecycle, host admission, persistence, paired remote, authenticated project scope, MCP or production Manager proof.'] }, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
