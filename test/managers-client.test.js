import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../modules/managers/client.js', import.meta.url), 'utf8');

// A small element/hook harness, not a DOM: retain state across explicit renders
// and expose the actual callbacks supplied to the slot's React elements.
function loadClient(fetch = async () => { throw new Error('Unexpected fetch'); }) {
  const registrations = [];
  const states = [];
  let cursor = 0;
  const React = {
    createElement: (type, props, ...children) => ({ type, props: props || {}, children: children.flat(Infinity) }),
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = initial;
      return [states[index], value => { states[index] = value; }];
    },
    useCallback: callback => callback,
    // Effects are deliberately not scheduled: Refresh exercises the same callback
    // without simulating a React scheduler or introducing timing-dependent tests.
    useEffect: () => {},
  };
  vm.runInNewContext(source, {
    window: { __ModuleLoader__: { load: entry => registrations.push(entry) } },
    fetch,
  }, { filename: 'modules/managers/client.js', timeout: 1000 });
  assert.equal(registrations.length, 1, 'one module definition per evaluation');
  const module = registrations[0].factory(id => {
    assert.equal(id, 'react');
    return React;
  });
  return {
    registrations, module,
    render(service, sequence, kind = 'mcp') {
      if (sequence) states.splice(0, states.length, ...sequence);
      cursor = 0;
      return module.ManagersPanel({ service, kind });
    },
  };
}
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...tree.children.flatMap(nodes)];
}
function text(tree) {
  if (tree == null || tree === false) return '';
  return typeof tree === 'object' ? tree.children.map(text).join(' ') : String(tree);
}
function button(tree, label) {
  const found = nodes(tree).find(node => node.type === 'button' && text(node) === label);
  assert.ok(found, `button ${label} exists`);
  return found;
}
const secret = 'DO-NOT-ECHO-manager-credential';
function snapshot(writable = true) {
  return {
    writable, token: secret, credentials: { password: secret },
    servers: [{ serverName: 'local-tools', transport: 'stdio', status: 'mounted', enabled: false, env: { TOKEN: secret }, command: secret }],
    hooks: { status: 'configured', enabled: false, deny: ['shell.exec'], events: [{ time: '2026-01-01T12:00:00Z', tool: 'read_file', event: 'allowed', input: secret, output: secret }], secret },
  };
}

test('VM module factory has a unique load ID and registers the settings slot contract', () => {
  const harness = loadClient();
  assert.equal(harness.registrations[0].id, 'dsh-majed/internal/managers');
  assert.equal(new Set(harness.registrations.map(entry => entry.id)).size, harness.registrations.length);
  const service = {};
  const injected = [];
  const registered = [];
  harness.module.apply({ slots: {
    inject(name, callback) { injected.push(name); callback(); },
    register(contract, render) {
      const element = render();
      registered.push({ contract, element });
      assert.equal(element.type, harness.module.ManagersPanel);
      assert.equal(element.props.service, service);
    },
  } }, { service });
  assert.deepEqual(injected, ['settings.section', 'settings.section']);
  assert.deepEqual(registered.map(({ contract, element }) => ({
    name: contract.name, id: contract.id, order: contract.order,
    label: contract.label(), kind: element.props.kind,
  })), [
    { name: 'settings.section', id: 'majed-mcp', order: 30, label: 'MCPs', kind: 'mcp' },
    { name: 'settings.section', id: 'majed-hooks', order: 35, label: 'Hooks', kind: 'hooks' },
  ]);
  assert.doesNotMatch(source, /settings\.general/);
});

test('initial and populated MCP/Hooks renders use metadata only and respect writable/busy state', async () => {
  const harness = loadClient();
  let tree = harness.render(undefined);
  assert.equal(tree.props['aria-label'], 'MCPs manager');
  assert.match(text(tree), /No manager metadata available/);
  await button(tree, 'Refresh').props.onClick();
  tree = harness.render(undefined);
  assert.match(text(tree), /remote service unavailable/);
  assert.equal(nodes(tree).filter(node => node.props.role === 'alert').length, 1);

  for (const writable of [false, true]) {
    for (const tab of ['mcp', 'hooks']) {
      tree = harness.render({}, [snapshot(writable), '', false], tab);
      assert.equal(nodes(tree).some(node => node.type === 'nav'), false);
      assert.equal(nodes(tree).find(node => node.type === 'h2').children[0], tab === 'hooks' ? 'Hooks' : 'MCPs');
      assert.equal(button(tree, tab === 'mcp' ? 'Enable' : 'Enable hooks').props.disabled, !writable);
      assert.doesNotMatch(JSON.stringify(tree), new RegExp(secret));
      assert.match(text(tree), tab === 'mcp' ? /local-tools.*stdio.*mounted.*disabled/ : /Policy: configured.*disabled/);
      if (tab === 'hooks') {
        assert.match(text(tree), /shell.exec/);
        assert.match(text(tree), /read_file.*allowed/);
      }
    }
  }
  tree = harness.render({}, [snapshot(), '', true]);
  assert.ok(nodes(tree).filter(node => node.type === 'button').every(node => node.props.disabled));
  tree = harness.render({}, [{ ...snapshot(), servers: [] }, '', false]);
  assert.match(text(tree), /No servers configured/);
});

test('slot default localService refresh and toggle buttons send bounded same-origin requests', async () => {
  const requests = [];
  let state = snapshot();
  const harness = loadClient(async (url, options) => {
    requests.push(JSON.parse(JSON.stringify({ url, options })));
    if (options.method === 'POST') {
      const { input } = JSON.parse(options.body);
      state = structuredClone(state);
      if (input.kind === 'server') state.servers[0].enabled = input.enabled;
      else state.hooks.enabled = input.enabled;
      return { ok: true, json: async () => ({ ok: true, state }) };
    }
    return { ok: true, json: async () => state };
  });
  let service;
  harness.module.apply({ slots: {
    inject: (_name, callback) => callback(),
    register: (_contract, render) => { service = render().props.service; },
  } });
  let tree = harness.render(service);
  await button(tree, 'Refresh').props.onClick();
  tree = harness.render(service);
  assert.match(text(tree), /local-tools/);
  await button(tree, 'Enable').props.onClick();
  tree = harness.render(service);
  assert.ok(button(tree, 'Disable'));
  tree = harness.render(service, undefined, 'hooks');
  await button(tree, 'Enable hooks').props.onClick();
  tree = harness.render(service, undefined, 'hooks');
  assert.ok(button(tree, 'Disable hooks'));
  assert.equal(requests.length, 3);
  assert.deepEqual(requests[0], { url: '/api/dsh-majed/managers', options: { cache: 'no-store', credentials: 'same-origin' } });
  for (const [index, input] of [[1, { kind: 'server', serverName: 'local-tools', enabled: true }], [2, { kind: 'hooks', enabled: true }]]) {
    const request = requests[index];
    assert.equal(request.url, '/api/dsh-majed/managers');
    assert.equal(request.options.method, 'POST');
    assert.equal(request.options.credentials, 'same-origin');
    assert.equal(request.options.headers['content-type'], 'application/json');
    assert.equal(request.options.headers['x-dsh-majed-manager'], '1');
    assert.deepEqual(JSON.parse(request.options.body), { action: 'setEnabled', input });
  }
});

test('failed refresh and refused mutation show generic errors without echoing exceptions', async () => {
  const harness = loadClient();
  const service = {
    snapshot: async () => { throw new Error(secret); },
    setEnabled: async () => ({ ok: false, error: secret }),
  };
  let tree = harness.render(service, [snapshot(), '', false]);
  await button(tree, 'Refresh').props.onClick();
  tree = harness.render(service);
  assert.match(text(tree), /Could not load manager metadata/);
  assert.doesNotMatch(text(tree), new RegExp(secret));
  await button(tree, 'Enable').props.onClick();
  tree = harness.render(service);
  assert.match(text(tree), /Change refused/);
  assert.doesNotMatch(text(tree), new RegExp(secret));
  assert.equal(button(tree, 'Refresh').props.disabled, false);
});

test('non-OK mutation JSON surfaces only fixed allowlisted codes', async () => {
  for (const code of ['MANAGER_PERSISTENCE_FAILED', secret]) {
    const harness = loadClient(async () => ({ ok: false, json: async () => ({ ok: false, code, error: secret }) }));
    let service;
    harness.module.apply({ slots: { inject: (_name, callback) => callback(), register: (_contract, render) => { service = render().props.service; } } });
    let tree = harness.render(service, [snapshot(), '', false]);
    await button(tree, 'Enable').props.onClick();
    tree = harness.render(service);
    assert.match(text(tree), /Change refused/);
    assert.doesNotMatch(text(tree), new RegExp(secret));
    if (code !== secret) assert.match(text(tree), /MANAGER_PERSISTENCE_FAILED/);
    assert.equal(button(tree, 'Refresh').props.disabled, false);
  }
});
test('server forms save bounded nonsecret fields, confirm delete, and save hook policies', async () => {
  const calls = [];
  const state = snapshot();
  const service = Object.fromEntries(['upsertServer', 'removeServer', 'updateHooks'].map(action => [action, async input => { calls.push(JSON.parse(JSON.stringify({ action, input }))); return { ok: true, state }; }]));
  const harness = loadClient();
  let tree = harness.render(service, [state, '', false, null, '']);
  await button(tree, 'Add server').props.onClick();
  const fill = (label, value) => {
    tree = harness.render(service);
    nodes(tree).find(node => node.props['aria-label'] === label).props.onChange({ target: { value } });
  };
  fill('Server name', 'new-server'); fill('Command', 'node'); fill('Arguments (JSON array)', '["tool.js"]');
  tree = harness.render(service);
  await nodes(tree).find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.deepEqual(calls[0], { action: 'upsertServer', input: { server: { serverName: 'new-server', transport: 'stdio', command: 'node', args: ['tool.js'] } } });
  tree = harness.render(service);
  await button(tree, 'Delete local-tools').props.onClick();
  assert.equal(calls.length, 1);
  tree = harness.render(service);
  await button(tree, 'Confirm delete').props.onClick();
  assert.deepEqual(calls[1], { action: 'removeServer', input: { serverName: 'local-tools' } });
  tree = harness.render(service, [state, '', false, null, ''], 'hooks');
  await button(tree, 'Edit hook policies').props.onClick();
  tree = harness.render(service, undefined, 'hooks');
  await nodes(tree).find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.deepEqual(calls[2], { action: 'updateHooks', input: { enabled: false, deny: ['shell.exec'], audit: false, auditLimit: 100 } });
  assert.doesNotMatch(JSON.stringify(calls), /DO-NOT-ECHO/);
});

test('test connection button probes a server and updates its status', async () => {
  const requests = [];
  let state = snapshot();
  const harness = loadClient(async (url, options) => {
    requests.push(JSON.parse(JSON.stringify({ url, options })));
    if (options.method === 'POST') {
      const { action, input } = JSON.parse(options.body);
      if (action === 'probeServer') {
        state = structuredClone(state);
        state.servers = state.servers.map(s => s.serverName === input.serverName ? { ...s, status: 'connected' } : s);
      }
      return { ok: true, json: async () => ({ ok: true, state }) };
    }
    return { ok: true, json: async () => state };
  });
  let service;
  harness.module.apply({ slots: { inject: (_name, callback) => callback(), register: (_contract, render) => { service = render().props.service; } } });
  let tree = harness.render(service, [snapshot(), '', false]);
  await button(tree, 'Refresh').props.onClick();
  tree = harness.render(service);
  assert.match(text(tree), /local-tools.*stdio.*mounted/);
  await button(tree, 'Test connection').props.onClick();
  tree = harness.render(service);
  assert.match(text(tree), /local-tools.*stdio.*connected/);
  assert.equal(requests.length, 2);
  const probeRequest = requests.find(r => r.options.body && JSON.parse(r.options.body).action === 'probeServer');
  assert.ok(probeRequest, 'probeServer request sent');
  assert.equal(probeRequest.options.method, 'POST');
  assert.equal(probeRequest.options.headers['x-dsh-majed-manager'], '1');
  assert.deepEqual(JSON.parse(probeRequest.options.body), { action: 'probeServer', input: { serverName: 'local-tools' } });
});

// The vendored manager is the authority for the native sidebar extension point.
test('native section registration matches actual bundled Skills Manager API', async () => {
  const vendor = await readFile(new URL('../modules/skills/vendor/lib/client.js', import.meta.url), 'utf8');
  assert.match(vendor, /slots\.inject\("settings\.section",function\(\)\{return a\.slots\.register\(\{name:"settings\.section",id:"skills-manager",order:25,label:function\(\)/);
});

test('initialTab compatibility renders a single Hooks page without manager navigation', () => {
  const harness = loadClient();
  const tree = harness.module.ManagersPanel({ service: {}, initialTab: 'hooks' });
  assert.equal(tree.props['aria-label'], 'Hooks manager');
  assert.equal(nodes(tree).some(node => node.type === 'nav'), false);
});
