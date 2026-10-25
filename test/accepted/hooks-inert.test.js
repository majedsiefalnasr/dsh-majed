import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { validateCommandHook, validateCommandHooks, validateCommandHookConfig, HOOK_EVENTS } from '../../modules/hooks/index.js';
import { createManagerService } from '../../modules/managers/index.js';
import { createManagerHandler } from '../../modules/managers/transport.js';

test('validateCommandHook accepts a minimal valid hook for each of the seven required events', () => {
  for (const event of ['SessionStart', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'PermissionRequest', 'Stop', 'PostCompact']) {
    const hook = validateCommandHook({ id: 'hook-1', events: [event], command: 'echo hi', source: 'inline', enabled: true });
    assert.equal(hook.id, 'hook-1');
    assert.deepEqual(hook.events, [event]);
    assert.equal(hook.command, 'echo hi');
    assert.equal(hook.source, 'inline');
    assert.equal(hook.enabled, true);
  }
});

test('validateCommandHook rejects an unsupported event with an explicit diagnostic', () => {
  assert.throws(() => validateCommandHook({ id: 'h', events: ['SessionEnd'], command: 'echo', source: 'inline', enabled: true }), /Invalid manager configuration/);
  assert.throws(() => validateCommandHook({ id: 'h', events: ['PreToolUse', 'UnknownEvent'], command: 'echo', source: 'inline', enabled: true }), /Invalid manager configuration/);
});

test('validateCommandHook rejects an unsupported field with an explicit diagnostic, never silent dropping', () => {
  assert.throws(() => validateCommandHook({ id: 'h', events: ['SessionStart'], command: 'echo', source: 'inline', enabled: true, envValues: { SECRET: 'value' } }), /Invalid manager configuration/);
  assert.throws(() => validateCommandHook({ id: 'h', events: ['SessionStart'], command: 'echo', source: 'inline', enabled: true, secret: 's3cr3t' }), /Invalid manager configuration/);
});

test('validateCommandHook requires id, events, command, source and enabled', () => {
  const base = { events: ['SessionStart'], command: 'echo', source: 'inline', enabled: true };
  for (const key of ['id', 'events', 'command', 'source', 'enabled']) {
    const input = { ...base };
    delete input[key];
    assert.throws(() => validateCommandHook(input), /Invalid manager configuration/);
  }
});

test('validateCommandHook shows env names only, never values', () => {
  const hook = validateCommandHook({ id: 'h', events: ['SessionStart'], command: 'echo $FOO', source: 'inline', enabled: true, env: ['FOO', 'BAR_BAZ'] });
  assert.deepEqual(hook.env, ['FOO', 'BAR_BAZ']);
  assert.throws(() => validateCommandHook({ id: 'h', events: ['SessionStart'], command: 'echo', source: 'inline', enabled: true, env: ['FOO=bar'] }), /Invalid manager configuration/);
  assert.throws(() => validateCommandHook({ id: 'h', events: ['SessionStart'], command: 'echo', source: 'inline', enabled: true, env: { FOO: 'bar' } }), /Invalid manager configuration/);
});

test('validateCommandHook validates source, cwd, shell, limits and watchedFiles', () => {
  const full = validateCommandHook({
    id: 'h', events: ['PreToolUse'], command: 'echo $TOOL_NAME', source: 'file', matcher: 'Bash.*',
    cwd: '/tmp/project', shell: '/bin/bash', limits: { timeout: 30000, output: 10000 },
    env: ['PATH'], watchedFiles: ['fp1', 'fp2'], enabled: true,
  });
  assert.equal(full.source, 'file');
  assert.equal(full.matcher, 'Bash.*');
  assert.equal(full.cwd, '/tmp/project');
  assert.equal(full.shell, '/bin/bash');
  assert.deepEqual(full.limits, { timeout: 30000, output: 10000 });
  assert.deepEqual(full.watchedFiles, ['fp1', 'fp2']);
  assert.throws(() => validateCommandHook({ id: 'h', events: ['SessionStart'], command: 'echo', source: 'pipe', enabled: true }), /Invalid manager configuration/);
  assert.throws(() => validateCommandHook({ id: 'h', events: ['SessionStart'], command: 'echo', source: 'inline', enabled: true, limits: { timeout: -5 } }), /Invalid manager configuration/);
  assert.throws(() => validateCommandHook({ id: 'h', events: ['SessionStart'], command: 'echo', source: 'inline', enabled: true, cwd: '' }), /Invalid manager configuration/);
});

test('validateCommandHooks accepts a valid array and rejects duplicate ids', () => {
  const hooks = validateCommandHooks([
    { id: 'a', events: ['SessionStart'], command: 'echo a', source: 'inline', enabled: true },
    { id: 'b', events: ['PreToolUse'], command: 'echo b', source: 'inline', matcher: 'Bash', enabled: false },
  ]);
  assert.equal(hooks.length, 2);
  assert.throws(() => validateCommandHooks([
    { id: 'a', events: ['SessionStart'], command: 'echo a', source: 'inline', enabled: true },
    { id: 'a', events: ['Stop'], command: 'echo a2', source: 'inline', enabled: true },
  ]), /Invalid manager configuration/);
  assert.throws(() => validateCommandHooks('not-an-array'), /Invalid manager configuration/);
});

test('validateCommandHookConfig accepts user and project scopes and rejects unknown scopes', () => {
  const config = validateCommandHookConfig({
    user: { enabled: true, hooks: [{ id: 'a', events: ['SessionStart'], command: 'echo a', source: 'inline', enabled: true }] },
    project: { enabled: false, hooks: [] },
  });
  assert.equal(config.user.enabled, true);
  assert.equal(config.user.hooks.length, 1);
  assert.equal(config.project.enabled, false);
  assert.deepEqual(config.project.hooks, []);
  const defaults = validateCommandHookConfig({});
  assert.equal(defaults.user.enabled, false);
  assert.deepEqual(defaults.user.hooks, []);
  assert.equal(defaults.project.enabled, false);
  assert.deepEqual(defaults.project.hooks, []);
  assert.throws(() => validateCommandHookConfig({ global: { enabled: true, hooks: [] } }), /Invalid manager configuration/);
  assert.throws(() => validateCommandHookConfig({ user: { enabled: true, hooks: [], secret: 'x' } }), /Invalid manager configuration/);
});

test('HOOK_EVENTS lists exactly the seven required first-release events', () => {
  assert.deepEqual(HOOK_EVENTS, ['SessionStart', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'PermissionRequest', 'Stop', 'PostCompact']);
});

function managerService(overrides = {}) {
  const ctx = {
    plugin: () => ({ dispose: () => {} }),
    tools: { guard: () => () => {} },
    on: () => () => {},
    effect: () => {},
    inject: () => {},
    provide: () => {},
    get: () => undefined,
    reflect: { get: () => undefined },
  };
  const persistence = {
    available: () => true,
    save: async (config) => config,
  };
  return createManagerService(ctx, { servers: [], hooks: { enabled: false, deny: [], audit: false, auditLimit: 100 }, commandHooks: { user: { enabled: false, hooks: [] }, project: { enabled: false, hooks: [] } } }, { persistence, ...overrides });
}

test('manager service upsertCommandHook adds and replaces hook definitions inertly', async () => {
  const service = managerService();
  await service.ready;
  const created = await service.upsertCommandHook({ scope: 'user', hook: { id: 'h1', events: ['SessionStart'], command: 'echo hi', source: 'inline', enabled: true } });
  assert.equal(created.ok, true);
  const snapshot = await service.snapshot();
  assert.equal(snapshot.commandHooks.user.hooks.length, 1);
  assert.equal(snapshot.commandHooks.user.hooks[0].id, 'h1');
  assert.equal(snapshot.commandHooks.user.hooks[0].command, 'echo hi');
  assert.equal(snapshot.commandHooks.user.hooks[0].enabled, true);
  // Replace same id
  await service.upsertCommandHook({ scope: 'user', hook: { id: 'h1', events: ['Stop'], command: 'echo bye', source: 'inline', enabled: false } });
  const snapshot2 = await service.snapshot();
  assert.equal(snapshot2.commandHooks.user.hooks.length, 1);
  assert.equal(snapshot2.commandHooks.user.hooks[0].command, 'echo bye');
  assert.equal(snapshot2.commandHooks.user.hooks[0].enabled, false);
  // Different scope is isolated
  await service.upsertCommandHook({ scope: 'project', hook: { id: 'h2', events: ['PreToolUse'], command: 'echo x', source: 'inline', matcher: 'Bash', enabled: true } });
  const snapshot3 = await service.snapshot();
  assert.equal(snapshot3.commandHooks.project.hooks.length, 1);
  assert.equal(snapshot3.commandHooks.user.hooks.length, 1);
});

test('manager service removeCommandHook deletes a hook by id within a scope', async () => {
  const service = managerService();
  await service.ready;
  await service.upsertCommandHook({ scope: 'user', hook: { id: 'h1', events: ['SessionStart'], command: 'echo hi', source: 'inline', enabled: true } });
  await service.upsertCommandHook({ scope: 'user', hook: { id: 'h2', events: ['Stop'], command: 'echo bye', source: 'inline', enabled: true } });
  const removed = await service.removeCommandHook({ scope: 'user', id: 'h1' });
  assert.equal(removed.ok, true);
  const snapshot = await service.snapshot();
  assert.deepEqual(snapshot.commandHooks.user.hooks.map(h => h.id), ['h2']);
  const missing = await service.removeCommandHook({ scope: 'user', id: 'missing' });
  assert.equal(missing.ok, false);
});

test('manager service setCommandHookEnabled toggles enabled without changing definition', async () => {
  const service = managerService();
  await service.ready;
  await service.upsertCommandHook({ scope: 'project', hook: { id: 'h1', events: ['PreToolUse'], command: 'echo x', source: 'inline', enabled: true } });
  const toggled = await service.setCommandHookEnabled({ scope: 'project', id: 'h1', enabled: false });
  assert.equal(toggled.ok, true);
  const snapshot = await service.snapshot();
  assert.equal(snapshot.commandHooks.project.hooks[0].enabled, false);
  assert.equal(snapshot.commandHooks.project.hooks[0].command, 'echo x');
});

test('manager service snapshot excludes env values and approval state from hook definitions', async () => {
  const service = managerService();
  await service.ready;
  await service.upsertCommandHook({ scope: 'user', hook: { id: 'h1', events: ['SessionStart'], command: 'echo $TOKEN', source: 'inline', env: ['TOKEN'], enabled: true } });
  const snapshot = await service.snapshot();
  const hook = snapshot.commandHooks.user.hooks[0];
  assert.deepEqual(hook.env, ['TOKEN']);
  assert.ok(!hook.envValues);
  assert.ok(!hook.secret);
  assert.ok(!hook.approval);
  assert.ok(!hook.approved);
  const json = JSON.stringify(snapshot);
  assert.doesNotMatch(json, /TOKEN=.+/);
  assert.doesNotMatch(json, /secret/i);
  assert.doesNotMatch(json, /approval/i);
});

test('manager service rejects unknown scope and invalid hook for command hook mutations', async () => {
  const service = managerService();
  await service.ready;
  const unknownScope = await service.upsertCommandHook({ scope: 'global', hook: { id: 'h1', events: ['SessionStart'], command: 'echo', source: 'inline', enabled: true } });
  assert.equal(unknownScope.ok, false);
  const unsupportedEvent = await service.upsertCommandHook({ scope: 'user', hook: { id: 'h1', events: ['SessionEnd'], command: 'echo', source: 'inline', enabled: true } });
  assert.equal(unsupportedEvent.ok, false);
  const missing = await service.removeCommandHook({ scope: 'user', id: 'missing' });
  assert.equal(missing.ok, false);
  const toggled = await service.setCommandHookEnabled({ scope: 'user', id: 'missing', enabled: false });
  assert.equal(toggled.ok, false);
});

test('transport allows upsertCommandHook, removeCommandHook and setCommandHookEnabled for Owner', async t => {
  let calls = [];
  const service = {
    snapshot: async () => ({ writable: true, servers: [], hooks: { enabled: false }, commandHooks: { user: { enabled: false, hooks: [] }, project: { enabled: false, hooks: [] } } }),
    upsertCommandHook: async (input) => { calls.push({ action: 'upsertCommandHook', input }); return { ok: true }; },
    removeCommandHook: async (input) => { calls.push({ action: 'removeCommandHook', input }); return { ok: true }; },
    setCommandHookEnabled: async (input) => { calls.push({ action: 'setCommandHookEnabled', input }); return { ok: true }; },
  };
  const server = http.createServer(createManagerHandler(service, { admit: () => ({ peer: { principal: { kind: 'owner' } } }) }));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (action, input) => fetch(base, { method: 'POST', headers: { origin: base, 'content-type': 'application/json', 'x-dsh-majed-manager': '1' }, body: JSON.stringify({ action, input }) });
  for (const [action, input] of [
    ['upsertCommandHook', { scope: 'user', hook: { id: 'h1', events: ['SessionStart'], command: 'echo hi', source: 'inline', enabled: true } }],
    ['removeCommandHook', { scope: 'user', id: 'h1' }],
    ['setCommandHookEnabled', { scope: 'user', id: 'h1', enabled: false }],
  ]) {
    const res = await post(action, input);
    assert.equal(res.status, 200, `${action} must be accepted`);
    assert.equal((await res.json()).ok, true);
  }
  assert.equal(calls.length, 3);
});

test('transport rejects unsupported actions and non-Owner requests for hook mutations', async t => {
  const service = { snapshot: async () => ({ writable: true, hooks: { enabled: false }, commandHooks: { user: { enabled: false, hooks: [] }, project: { enabled: false, hooks: [] } } }), upsertCommandHook: async () => ({ ok: true }) };
  const server = http.createServer(createManagerHandler(service, { admit: () => ({ peer: { principal: { kind: 'owner' } } }) }));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (action, input) => fetch(base, { method: 'POST', headers: { origin: base, 'content-type': 'application/json', 'x-dsh-majed-manager': '1' }, body: JSON.stringify({ action, input }) });
  const res = await post('challenge', {});
  assert.equal(res.status, 400);
  const nonOwner = http.createServer(createManagerHandler(service, { admit: () => ({ peer: { principal: { kind: 'browser' } } }) }));
  await new Promise(resolve => nonOwner.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => nonOwner.close(resolve)));
  const base2 = `http://127.0.0.1:${nonOwner.address().port}`;
  const res2 = await fetch(base2, { method: 'POST', headers: { origin: base2, 'content-type': 'application/json', 'x-dsh-majed-manager': '1' }, body: JSON.stringify({ action: 'upsertCommandHook', input: { scope: 'user', hook: { id: 'h1', events: ['SessionStart'], command: 'echo', source: 'inline', enabled: true } } }) });
  assert.equal(res2.status, 403);
});


