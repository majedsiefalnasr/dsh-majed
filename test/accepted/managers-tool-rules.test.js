import test from 'node:test';
import assert from 'node:assert/strict';
import { createManagerService } from '../../modules/managers/index.js';
import { validateRules } from '../../modules/managers/rules.js';
import { createManagerFetchHandler } from '../../modules/managers/transport.js';

function guardCtx() {
  let guard; let releases = 0;
  const ctx = {
    tools: { guard(fn) { guard = fn; return () => { releases += 1; }; } },
    plugin() { return { then(resolve) { resolve(); }, async dispose() {} }; },
    on() { return () => {}; },
  };
  return { ctx, get guard() { return guard; }, releases: () => releases };
}

function persistence() {
  const saved = [];
  return { saved, available: () => true, save: async value => { saved.push(structuredClone(value)); } };
}

const baseHooks = { enabled: true, deny: [], audit: false, auditLimit: 100 };

async function serviceWith(initial = {}, options = {}) {
  const g = guardCtx();
  const p = persistence();
  const service = createManagerService(g.ctx, { hooks: baseHooks, rules: [], ...initial }, { loadMcp: async () => ({}), persistence: p, ...options });
  await service.ready;
  return { service, g, p };
}

test('tool rules CRUD persist privately and are reflected in the snapshot', async () => {
  const { service, p } = await serviceWith();
  assert.equal((await service.upsertRule({ id: 'r1', pattern: 'danger_*', enabled: true, scope: 'global' })).ok, true);
  assert.deepEqual((await service.snapshot()).rules, [{ id: 'r1', pattern: 'danger_*', enabled: true, scope: 'global' }]);
  assert.equal(p.saved.length, 1);

  assert.equal((await service.upsertRule({ id: 'r1', pattern: 'danger_*', enabled: false, scope: 'project' })).ok, true);
  assert.equal((await service.snapshot()).rules[0].enabled, false);
  assert.equal((await service.snapshot()).rules[0].scope, 'project');

  assert.equal((await service.setRuleEnabled({ id: 'r1', enabled: true })).ok, true);
  assert.equal((await service.snapshot()).rules[0].enabled, true);

  assert.equal((await service.removeRule({ id: 'r1' })).ok, true);
  assert.deepEqual((await service.snapshot()).rules, []);
  assert.equal((await service.removeRule({ id: 'missing' })).ok, false);
  await service.dispose();
});

test('malformed rules are rejected with a fixed validation code and no secrets echoed', async () => {
  const { service } = await serviceWith();
  for (const input of [
    { id: 'bad', pattern: '(unclosed', enabled: true, scope: 'global' },
    { id: 'bad', pattern: 'x'.repeat(129), enabled: true, scope: 'global' },
    { id: '../bad', pattern: 'x', enabled: true, scope: 'global' },
    { id: 'r', pattern: 'x', enabled: 'yes', scope: 'global' },
    { id: 'r', pattern: 'x', enabled: true, scope: 'realm' },
    { id: 'r', pattern: 'x', enabled: true },
    { extra: true },
  ]) {
    const result = await service.upsertRule(input);
    assert.equal(result.ok, false);
    assert.equal(result.code, 'MANAGER_VALIDATION_FAILED');
    assert.equal(JSON.stringify(result).includes('secret'), false);
  }
  assert.deepEqual((await service.snapshot()).rules, []);
  await service.dispose();
});

test('duplicate rule ids are rejected at validation; upsert updates the existing rule in place', async () => {
  assert.throws(() => validateRules([
    { id: 'r1', pattern: 'a', enabled: true, scope: 'global' },
    { id: 'r1', pattern: 'b', enabled: true, scope: 'global' },
  ]));
  const { service } = await serviceWith();
  assert.equal((await service.upsertRule({ id: 'r1', pattern: 'a', enabled: true, scope: 'global' })).ok, true);
  assert.equal((await service.upsertRule({ id: 'r1', pattern: 'b', enabled: true, scope: 'global' })).ok, true);
  const rules = (await service.snapshot()).rules;
  assert.equal(rules.length, 1);
  assert.equal(rules[0].pattern, 'b');
  await service.dispose();
});

test('enabled wildcard rules deny matching tool calls through the composed guard', async () => {
  const { service, g } = await serviceWith({
    rules: [
      { id: 'r1', pattern: 'danger_*', enabled: true, scope: 'global' },
      { id: 'r2', pattern: 'read', enabled: false, scope: 'agent' },
    ],
  });
  assert.equal(g.guard({ name: 'danger_delete', args: {} }), 'Denied by managed tool policy.');
  assert.equal(g.guard({ name: 'read', args: {} }), undefined);
  assert.equal(g.guard({ name: 'safe', args: {} }), undefined);
  await service.dispose();
});

test('overlapping rules: any enabled matching rule denies', async () => {
  const { service, g } = await serviceWith({
    rules: [
      { id: 'r1', pattern: 'danger_*', enabled: true, scope: 'global' },
      { id: 'r2', pattern: '*_delete', enabled: true, scope: 'project' },
    ],
  });
  assert.equal(g.guard({ name: 'danger_delete', args: {} }), 'Denied by managed tool policy.');
  assert.equal(g.guard({ name: 'file_delete', args: {} }), 'Denied by managed tool policy.');
  assert.equal(g.guard({ name: 'safe_get', args: {} }), undefined);
  await service.dispose();
});

test('rules changed during an active session take effect on the next mutation', async () => {
  const { service, g } = await serviceWith({
    rules: [{ id: 'r1', pattern: 'old_*', enabled: true, scope: 'global' }],
  });
  assert.equal(g.guard({ name: 'old_call', args: {} }), 'Denied by managed tool policy.');
  assert.equal(g.guard({ name: 'new_call', args: {} }), undefined);

  assert.equal((await service.upsertRule({ id: 'r1', pattern: 'new_*', enabled: true, scope: 'global' })).ok, true);
  assert.equal(g.guard({ name: 'new_call', args: {} }), 'Denied by managed tool policy.');
  assert.equal(g.guard({ name: 'old_call', args: {} }), undefined);
  await service.dispose();
});

test('rules are additive: they never allow a call and compose with hooks denial', async () => {
  const { service, g } = await serviceWith({
    hooks: { enabled: true, deny: ['hook_*'], audit: false, auditLimit: 100 },
    rules: [{ id: 'r1', pattern: 'rule_*', enabled: true, scope: 'global' }],
  });
  assert.equal(g.guard({ name: 'hook_denied', args: {} }), 'Denied by managed tool policy.');
  assert.equal(g.guard({ name: 'rule_denied', args: {} }), 'Denied by managed tool policy.');
  assert.equal(g.guard({ name: 'allowed', args: {} }), undefined);
  // Denial is reported honestly as a string; the tool is not hidden (model-visible).
  assert.equal(typeof g.guard({ name: 'rule_denied', args: {} }), 'string');
  await service.dispose();
});

test('rule changes do not mutate MCP server config or disturb unrelated preferences', async () => {
  const { service } = await serviceWith({
    servers: [{ serverName: 's1', transport: 'stdio', command: 'cmd', args: [], enabled: true }],
  });
  const before = await service.snapshot();
  assert.equal((await service.upsertRule({ id: 'r1', pattern: 'x_*', enabled: true, scope: 'global' })).ok, true);
  const after = await service.snapshot();
  assert.deepEqual(after.servers, before.servers);
  assert.deepEqual(after.rules, [{ id: 'r1', pattern: 'x_*', enabled: true, scope: 'global' }]);

  assert.equal((await service.setEnabled({ kind: 'hooks', enabled: false })).ok, true);
  assert.equal((await service.snapshot()).hooks.enabled, false);
  assert.deepEqual((await service.snapshot()).rules, before.rules.concat([{ id: 'r1', pattern: 'x_*', enabled: true, scope: 'global' }]));
  await service.dispose();
});

test('manager transport exposes the rule actions and rejects unknown actions', async () => {
  const service = {
    snapshot: async () => ({}),
    upsertRule: async () => ({ ok: true }),
    removeRule: async () => ({ ok: true }),
    setRuleEnabled: async () => ({ ok: true }),
  };
  const handler = createManagerFetchHandler(service);
  for (const action of ['upsertRule', 'removeRule', 'setRuleEnabled']) {
    const req = new Request('http://127.0.0.1/api/dsh-majed/managers', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action, input: {} }),
    });
    const res = await handler(req);
    assert.equal(res.status, 200, `${action} must be accepted`);
  }
  const bad = new Request('http://127.0.0.1/api/dsh-majed/managers', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'challenge', input: {} }),
  });
  const res = await handler(bad);
  assert.equal(res.status, 400);
  assert.equal((await res.json()).error, 'Invalid action.');
});
