import test from 'node:test';
import assert from 'node:assert/strict';
import { createManagerService } from '../../modules/managers/index.js';
import { createManagerFetchHandler, createManagerHandler } from '../../modules/managers/transport.js';

function guardCtx() {
  let guard;
  const ctx = {
    tools: { guard(fn) { guard = fn; return () => { guard = undefined; }; } },
    plugin() { return { then(resolve) { resolve(); }, async dispose() {} }; },
    on() { return () => {}; },
  };
  return { ctx, get guard() { return guard; } };
}

const legacyRules = [
  { id: 'r1', pattern: 'rule_*', enabled: true, scope: 'global' },
  { id: 'r2', pattern: '*_delete', enabled: true, scope: 'project' },
  { id: 'r3', pattern: 'read', enabled: false, scope: 'agent' },
];
const baseHooks = { enabled: true, deny: ['hook_*'], audit: false, auditLimit: 100 };

async function serviceWith(options = {}) {
  const g = guardCtx();
  const saved = [];
  const service = createManagerService(g.ctx, { hooks: baseHooks, rules: legacyRules }, {
    loadMcp: async () => ({}),
    persistence: { available: () => true, save: async value => { saved.push(structuredClone(value)); } },
    ...options,
  });
  await service.ready;
  return { service, g, saved };
}

test('both manager HTTP handlers reject standalone rule actions before service dispatch', async () => {
  let calls = 0;
  const service = Object.fromEntries(['upsertRule', 'removeRule', 'setRuleEnabled'].map(action => [action, async () => { calls++; return { ok: true }; }]));
  const fetchHandler = createManagerFetchHandler(service);
  const nodeHandler = createManagerHandler(service, { admit: () => ({ peer: { principal: { kind: 'owner' } } }) });
  for (const action of ['upsertRule', 'removeRule', 'setRuleEnabled']) {
    const body = JSON.stringify({ action, input: { id: 'r1', enabled: true } });
    const response = await fetchHandler(new Request('http://localhost/api/dsh-majed/managers', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body,
    }));
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: 'Invalid action.' });
    let status; let result;
    await nodeHandler({
      method: 'POST',
      headers: { origin: 'http://localhost', 'x-dsh-majed-manager': '1', 'content-type': 'application/json' },
      async *[Symbol.asyncIterator]() { yield body; },
    }, { writeHead(code) { status = code; }, end(value) { result = JSON.parse(value); } });
    assert.equal(status, 400);
    assert.deepEqual(result, { error: 'Invalid action.' });
  }
  assert.equal(calls, 0);
});

test('MCP startup and server writes preserve inert legacy rule definitions', async t => {
  let stored = { servers: [{ serverName: 's1', transport: 'stdio', command: 'cmd', args: [], enabled: false }] };
  const { service, g, saved } = await serviceWith({ mcpStore: {
    read: async () => structuredClone(stored),
    save: async value => { stored = structuredClone(value); },
  } });
  t.after(() => service.dispose());
  assert.deepEqual((await service.snapshot()).rules, legacyRules);
  assert.equal((await service.snapshot()).rulesStatus, 'disabled');
  assert.equal((await service.upsertServer({ server: { serverName: 's2', transport: 'stdio', command: 'cmd', args: [], enabled: false } })).ok, true);
  assert.deepEqual(stored.servers.map(row => row.serverName), ['s1', 's2']);
  assert.deepEqual((await service.snapshot()).rules, legacyRules);
  assert.equal(g.guard({ name: 'rule_delete', args: {} }), undefined);
  assert.equal(g.guard({ name: 'hook_call', args: {} }), 'Denied by managed tool policy.');
  assert.equal((await service.updateHooks(baseHooks)).ok, true);
  assert.deepEqual(saved[0].rules, legacyRules);
  assert.deepEqual(Object.keys(stored), ['servers']);
});

test('standalone rule mutations are unavailable and preserve existing definitions', async t => {
  const { service, saved } = await serviceWith();
  t.after(() => service.dispose());
  const before = await service.snapshot();
  for (const [action, input] of [
    ['upsertRule', { id: 'new', pattern: '*', enabled: true, scope: 'global' }],
    ['setRuleEnabled', { id: 'r3', enabled: true }],
    ['removeRule', { id: 'r1' }],
  ]) {
    assert.deepEqual(await service[action](input), { ok: false, code: 'TOOL_RULES_DISABLED', error: 'Tool Rules are disabled.' });
    assert.deepEqual(await service.snapshot(), before);
  }
  assert.deepEqual(saved, []);
});

test('legacy enabled Tool Rules stay inert while Hooks denial remains active', async t => {
  const { service, g, saved } = await serviceWith();
  t.after(() => service.dispose());
  assert.equal(g.guard({ name: 'rule_delete', args: {} }), undefined);
  assert.equal(g.guard({ name: 'file_delete', args: {} }), undefined);
  assert.equal(g.guard({ name: 'hook_call', args: {} }), 'Denied by managed tool policy.');
  assert.equal((await service.snapshot()).rulesStatus, 'disabled');
  assert.deepEqual((await service.snapshot()).rules, legacyRules);
  assert.deepEqual((await service.snapshot()).hooks.deny, ['hook_*']);

  assert.equal((await service.updateHooks({ ...baseHooks, deny: ['other_*'] })).ok, true);
  assert.equal(g.guard({ name: 'rule_delete', args: {} }), undefined);
  assert.equal(g.guard({ name: 'other_call', args: {} }), 'Denied by managed tool policy.');
  assert.deepEqual(saved[0].rules, legacyRules);
  assert.equal((await service.setEnabled({ kind: 'hooks', enabled: false })).ok, true);
  assert.equal(g.guard, undefined);
  assert.equal((await service.setEnabled({ kind: 'hooks', enabled: true })).ok, true);
  assert.equal(g.guard({ name: 'rule_delete', args: {} }), undefined);
  assert.equal(g.guard({ name: 'other_call', args: {} }), 'Denied by managed tool policy.');
});
