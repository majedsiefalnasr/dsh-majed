// Exact installed picker bundle exercised at its pickerExports, command and composer seams.
// This is a synthetic client boundary fixture, NOT a browser/React/live acceptance.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { join } = require('node:path');
const base = process.argv[2];
if (!base) throw new Error('Pass the installed DSH runtime directory.');
const path = join(base, 'node_modules/@deepseek-ai/dsh-client-ui-model-selection/lib/client.js');
function store(initial) {
  let value = initial;
  const listeners = new Set();
  return { getSnapshot: () => value, subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    set(next) { value = next; for (const fn of listeners) fn(); },
    update(fn) { const next = structuredClone(value); fn(next); this.set(next); } };
}
const checks = [];
const jsx = (type, props, key) => ({ type, props: props || {}, key });
const cells = [];
let cell = 0;
const react = {
  Fragment: Symbol('fragment'),
  useSyncExternalStore: (_subscribe, snapshot) => snapshot(),
  useState(initial) { const at = cell++; if (!(at in cells)) cells[at] = initial; return [cells[at], next => { cells[at] = typeof next === 'function' ? next(cells[at]) : next; }]; },
  useRef: initial => ({ current: initial }), useId: () => 'synthetic-picker',
  useMemo: fn => fn(), useEffect() {}, useLayoutEffect() {},
};
let pickerExports;
// Runtime dependencies are explicit boundary fixtures. No app boot, service URL or auth is loaded.
const sandbox = { window: { __ModuleLoader__: { load(spec) {
  assert.equal(spec.id, '@deepseek-ai/dsh-client-ui-model-selection');
  pickerExports = spec.factory(name => {
    if (name === '@deepseek-ai/cordis') return { Service: class {} };
    if (name === '@deepseek-ai/dsh-client-store') return { createSnapshotStore: store };
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'react-dom') return { createPortal: node => node };
    if (name === '@deepseek-ai/dsh-client-ui-primitives') return new Proxy({ rankByName: models => models }, { get: (target, key) => target[key] ?? key });
    throw new Error(`Unapproved client dependency: ${name}`);
  });
} } }, document: { body: {}, querySelector: () => ({}) } };
vm.runInNewContext(fs.readFileSync(path, 'utf8'), sandbox, { filename: path });
const literal = value => JSON.parse(JSON.stringify(value));
const auto = { provider: 'majed-auto-probe', model: 'auto' };
const manual = { provider: 'fixture-direct', model: 'manual', reasoningEffort: 'low' };
const catalogValue = {
  groups: [
    { id: auto.provider, name: 'Majed synthetic', models: [{ id: 'auto', name: 'Auto' }] },
    { id: manual.provider, name: 'Direct synthetic', models: [{ id: 'manual', name: 'Manual', reasoning: { efforts: [{ id: 'low', name: 'Low' }], defaultEffort: 'low' } }] },
  ], failures: [], default: manual,
};
const catalogStore = store({ value: catalogValue, status: 'ready', error: null });
const catalog = { store: catalogStore, load: async () => catalogValue,
  reasoningFor(selection) { return catalogValue.groups.find(group => group.id === selection.provider)?.models.find(model => model.id === selection.model)?.reasoning; } };
const projected = store({ next: manual });
const calls = [];
const waits = [];
let defer = false;
const sessions = { async selectModel(selection) {
  calls.push(literal(selection));
  if (defer) return new Promise(resolve => waits.push(resolve));
  const { sessionId, ...next } = selection;
  projected.set({ next });
  return { ok: true };
} };
const directory = new pickerExports.ModelDirectory(sessions, 'synthetic-session', () => true, catalog, projected, () => true);
let command;
let composer;
const scope = { modelDirectories: { directoryFor: () => directory }, sessions: { subagentAddress: () => undefined },
  get: () => ({ register(value) { command = value; return () => {}; } }),
  effect: fn => fn(), slots: { inject: (_name, fn) => fn(), register(_spec, component) { composer = component; return () => {}; } } };
pickerExports.apply({ effect: fn => fn(), locale: { register: () => () => {}, bind: () => key => key }, plugin() {}, inject: (_deps, fn) => fn(scope) });
function flatten(node) {
  if (node == null || typeof node !== 'object') return [];
  return [node, ...[node.props?.children].flat(Infinity).flatMap(flatten)];
}
function render() {
  cell = 0;
  return composer({ locked: false, available: true, directory: directory.store, load: () => directory.load(),
    select: selection => directory.select(selection), t: key => key, renderSlot: (_name, _props, options) => options.fallback });
}
async function main() {
  try {
    await directory.load();
    const options = await command.ui.options({ sessionId: 'synthetic-session' });
    const row = options.find(option => option.id === 'majed-auto-probe/auto');
    assert.ok(row, 'Native model contribution must expose the catalog Auto identity');
    assert.equal(row.label, 'Auto');
    await command.ui.onSelect(row, { sessionId: 'synthetic-session' });
    assert.deepEqual(calls.at(-1), { sessionId: 'synthetic-session', ...auto });
    assert.deepEqual(literal(directory.store.getSnapshot().current), auto);
    checks.push('unaltered native /model contribution lists and selects the synthetic Auto catalog identity');
    let nodes = flatten(render());
    assert.equal(nodes.find(node => node.type === 'button').props.title, 'Auto');
    nodes.find(node => node.type === 'button').props.onClick();
    nodes = flatten(render());
    // The native composer produces its own model pane; no DOM option is fabricated.
    const modelPane = nodes.find(node => node.props?.role === 'menuitem');
    assert.ok(modelPane);
    modelPane.props.onClick();
    nodes = flatten(render());
    const nativeAutoRow = nodes.find(node => node.props?.role === 'menuitemradio' && node.props.title === 'Auto');
    assert.equal(nativeAutoRow.props['aria-checked'], true);
    assert.equal(nodes.some(node => node.props?.children === 'menu.effort'), false);
    checks.push('native composer renders its own checked Auto row and omits unknown reasoning choices');
    const directRow = nodes.find(node => node.props?.role === 'menuitemradio' && node.props.title === 'Manual');
    directRow.props.onClick();
    await Promise.resolve(); await Promise.resolve();
    assert.deepEqual(literal(directory.store.getSnapshot().current), { provider: manual.provider, model: manual.model });
    checks.push('manual native composer choice replaces Auto via session selection; no global default write');
    defer = true;
    const earlier = directory.select(auto);
    const later = directory.select(manual);
    projected.set({ next: manual });
    waits[1]({ ok: true }); await later;
    waits[0]({ ok: false, error: { code: 'synthetic/stale', message: 'Old generation failed' } }); await earlier;
    assert.deepEqual(literal(directory.store.getSnapshot().current), manual);
    assert.equal(directory.store.getSnapshot().error, null);
    directory.resetConnected();
    assert.equal(directory.store.getSnapshot().pending, null);
    checks.push('late old selection failure does not overwrite newer manual projection or reconnect state');
    directory.dispose();
    const before = literal(directory.store.getSnapshot());
    projected.set({ next: auto });
    assert.deepEqual(literal(directory.store.getSnapshot()), before);
    const unavailable = new pickerExports.ModelDirectory(sessions, 'synthetic-child', () => false, catalog, projected, () => true);
    await assert.rejects(unavailable.load(), /unavailable for addressed subagent sessions/);
    unavailable.dispose();
    checks.push('directory disposal unsubscribes inputs; addressed child selector fails closed');
    console.log(JSON.stringify({ runtime: require(join(base, 'package.json')).version, checks, limitations: [
      'Actual unmodified picker bundle, but synthetic store/React/service/remote boundaries, not mounted React/browser or RPC.',
      'Effects, focus, layout, search ranking and visual/keyboard/RTL/theme behavior are not exercised.',
      'Catalog is literal synthetic input; actual LLM metadata/dispatch is a separate host proof.',
      'Client operation generation is not proof of host routing-generation capture or server manual-selection concurrency.',
      'No production Auto module, installed-state change, operational account/provider call or live desktop/remote acceptance.'
    ] }, null, 2));
  } finally { directory.dispose(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
