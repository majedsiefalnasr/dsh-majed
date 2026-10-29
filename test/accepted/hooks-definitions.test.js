import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, realpath, writeFile, readFile, rm } from 'node:fs/promises';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Context } from '@deepseek-ai/cordis';
import { apply } from '../../index.js';

// H01 (#103): scoped definition management through the Owner-admitted Fetch route. No hook is ever executed here.
async function mount(t, root, options = {}) {
  const ctx = new Context(); let route;
  ctx.provide('connection', { fetch: { register(value) { if (value.path === '/api/majed/hooks/approval') route = value; } } });
  for (const [name, service] of Object.entries(options.services || {})) ctx.provide(name, service);
  const fiber = ctx.plugin({ apply(ctx) { apply(ctx, { hooksApproval: { enabled: true, stateDirectory: join(root, 'state'), userDirectory: root, ...options } }); } });
  await fiber; t.after(() => fiber.dispose());
  const call = async (action, input = {}) => {
    const response = await route.fetch(new Request('http://fixture/api/majed/hooks/approval', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'client-request', rpcId: 'test-1', method: 'majed/hooks/approval', payload: { action, scope: 'user', ...input } }),
    }));
    return (await response.json()).result;
  };
  const find = async id => (await call('list')).value.hooks.find(item => item.hook.id === id);
  const approve = async id => {
    const challenge = (await call('review', { id })).value;
    return call('approve', { id, nonce: challenge.nonce, phrase: 'RUN AS DSH USER' });
  };
  return { call, find, approve, dispose: () => fiber.dispose() };
}
async function fixture(t) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'majed-definitions-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}
const hook = { id: 'example', events: ['SessionStart'], command: 'printf hello', source: 'inline', enabled: false };

test('stale-edit fencing: overwriting an existing definition needs its current revision', async t => {
  const root = await fixture(t); const service = await mount(t, root);
  assert.equal((await service.call('save', { hook })).ok, true);
  const first = (await service.find('example')).revision;
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.equal((await service.call('save', { hook: { ...hook, command: 'printf one' } })).error.code, 'stale_revision');
  assert.equal((await service.call('save', { hook: { ...hook, command: 'printf one' }, revision: first })).ok, true);
  assert.equal((await service.call('save', { hook: { ...hook, command: 'printf two' }, revision: first })).error.code, 'stale_revision');
  assert.equal((await service.find('example')).hook.command, 'printf one');
});

test('draft, Approval and activation are distinct; disable keeps valid consent, edit or revoke does not', async t => {
  const root = await fixture(t); const service = await mount(t, root);
  // A client asking for enabled:true still only stores a draft: nothing is active without Approval.
  assert.equal((await service.call('save', { hook: { ...hook, enabled: true } })).ok, true);
  let item = await service.find('example');
  assert.equal(item.hook.enabled, false); assert.equal(item.state, 'draft');
  assert.equal((await service.call('setEnabled', { id: 'example', enabled: true, revision: item.revision })).error.code, 'invalid_approval');
  assert.equal((await service.approve('example')).ok, true);
  item = await service.find('example'); assert.equal(item.state, 'approved');
  assert.equal((await service.call('setEnabled', { id: 'example', enabled: true, revision: 'stale' })).error.code, 'stale_revision');
  assert.equal((await service.call('setEnabled', { id: 'example', enabled: true, revision: item.revision })).ok, true);
  item = await service.find('example'); assert.equal(item.state, 'active'); assert.equal(item.approval.valid, true);
  assert.equal((await service.call('setEnabled', { id: 'example', enabled: false, revision: item.revision })).ok, true);
  item = await service.find('example'); assert.equal(item.state, 'approved'); assert.equal(item.approval.valid, true);
  await service.call('setEnabled', { id: 'example', enabled: true, revision: item.revision });
  item = await service.find('example');
  await service.call('save', { hook: { ...hook, command: 'printf edited' }, revision: item.revision });
  item = await service.find('example'); assert.equal(item.state, 'draft'); assert.equal(item.hook.enabled, false); assert.equal(item.approval, null);
  assert.equal((await service.call('list')).value.executionAvailable, false);
});

test('duplicate and reversible removal never carry consent: copies and restores return as unapproved disabled drafts', async t => {
  const root = await fixture(t); const service = await mount(t, root);
  await service.call('save', { hook }); await service.approve('example');
  let item = await service.find('example');
  await service.call('setEnabled', { id: 'example', enabled: true, revision: item.revision });
  item = await service.find('example');
  assert.equal((await service.call('duplicate', { id: 'example', newId: 'example', revision: item.revision })).error.code, 'exists');
  assert.equal((await service.call('duplicate', { id: 'example', newId: 'copy', revision: 'stale' })).error.code, 'stale_revision');
  assert.equal((await service.call('duplicate', { id: 'example', newId: 'copy', revision: item.revision })).ok, true);
  const copy = await service.find('copy');
  assert.equal(copy.state, 'draft'); assert.equal(copy.approval, null); assert.equal(copy.hook.enabled, false); assert.equal(copy.hook.command, 'printf hello');
  assert.equal((await service.find('example')).state, 'active');
  // Removal is reversible: the entry moves to trash and drops consent and activation.
  const removed = await service.call('remove', { id: 'example', revision: item.revision });
  assert.equal(removed.ok, true);
  assert.equal(await service.find('example'), undefined);
  const trashed = removed.value.trash.find(entry => entry.hook.id === 'example');
  assert.ok(trashed.revision); assert.equal(trashed.approval, null); assert.equal(trashed.hook.enabled, false);
  assert.equal((await service.call('save', { hook })).error.code, 'exists');
  assert.equal((await service.call('restore', { id: 'example', revision: 'stale' })).error.code, 'stale_revision');
  assert.equal((await service.call('restore', { id: 'example', revision: trashed.revision })).ok, true);
  item = await service.find('example');
  assert.equal(item.state, 'draft'); assert.equal(item.approval, null); assert.equal(item.hook.enabled, false);
  assert.equal((await service.call('list')).value.trash.length, 0);
  // Purge is the only irreversible removal and is fenced as well.
  const again = await service.call('remove', { id: 'copy', revision: (await service.find('copy')).revision });
  const purged = await service.call('purge', { id: 'copy', revision: again.value.trash[0].revision });
  assert.equal(purged.ok, true); assert.equal(purged.value.trash.length, 0);
});

test('export excludes consent and secrets; import previews first and lands unapproved disabled without overwriting', async t => {
  const root = await fixture(t); const service = await mount(t, root);
  const secret = { ...hook, env: ['API_TOKEN'], watchedFiles: [] };
  await service.call('save', { hook: secret }); await service.approve('example');
  const item = await service.find('example');
  await service.call('setEnabled', { id: 'example', enabled: true, revision: item.revision });
  const exported = await service.call('export', {});
  assert.equal(exported.ok, true);
  const text = JSON.stringify(exported.value.bundle);
  assert.deepEqual(exported.value.bundle.hooks.map(entry => entry.id), ['example']);
  for (const word of ['approval', 'fingerprint', 'receivedAt', 'nonce', 'revision', 'generation', 'origin']) assert.equal(text.includes(word), false, word);
  assert.equal(exported.value.bundle.hooks[0].enabled, false);
  assert.deepEqual(exported.value.bundle.hooks[0].env, ['API_TOKEN']);
  // Preview is read-only; import into a fresh store lands disabled drafts and skips ids that already exist.
  const other = await mount(t, await fixture(t));
  const bundle = { ...exported.value.bundle, hooks: [{ ...exported.value.bundle.hooks[0], enabled: true }, { ...hook, id: 'second' }] };
  const preview = await other.call('previewImport', { bundle });
  assert.deepEqual(preview.value.items.map(entry => [entry.id, entry.status]), [['example', 'new'], ['second', 'new']]);
  assert.equal((await other.call('list')).value.hooks.length, 0);
  assert.equal((await other.call('import', { bundle })).ok, true);
  for (const id of ['example', 'second']) { const imported = await other.find(id); assert.equal(imported.state, 'draft'); assert.equal(imported.hook.enabled, false); assert.equal(imported.approval, null); }
  assert.deepEqual((await other.call('previewImport', { bundle })).value.items.map(entry => entry.status), ['exists', 'exists']);
  const again = await other.call('import', { bundle });
  assert.equal(again.ok, true); assert.equal((await other.call('list')).value.hooks.length, 2);
  // Consent fields smuggled into a bundle are refused, never honored.
  const forged = { ...bundle, hooks: [{ ...hook, id: 'forged', approval: { fingerprint: 'a'.repeat(64), receivedAt: 1, origin: 'local' } }] };
  assert.equal((await other.call('previewImport', { bundle: forged })).value.items[0].status, 'invalid');
  assert.equal((await other.call('import', { bundle: forged })).error.code, 'invalid_request');
  assert.equal(await other.find('forged'), undefined);
});

// Native-shaped project services: each entry is { id, cwd } and becomes one session in one workspace.
function projects(entries) {
  const sessions = new Map(entries.map(entry => [entry.id, { header: { id: 'session-' + entry.id, cwd: entry.cwd } }]));
  const workspaces = new Map(entries.map(entry => [entry.id, { id: 'workspace-' + entry.id, path: entry.cwd, sessionIds: ['session-' + entry.id] }]));
  const select = id => ({ scope: 'project', sessionId: 'session-' + id, workspaceId: 'workspace-' + id });
  return { select, observe: { sessions: { get: id => sessions.get(id.replace('session-', '')) } }, services: {
    sessions: { get: id => sessions.get(id.replace('session-', '')) }, sessionPersistence: { async stat() {} },
    workspaceRegistry: { get: id => workspaces.get(id.replace('workspace-', '')), list: () => [...workspaces.values()] } } };
}

test('import and preview treat a repeated id inside one bundle as a duplicate and never write two entries', async t => {
  const root = await fixture(t); const service = await mount(t, root);
  const bundle = { version: 1, kind: 'dsh-majed-hooks', hooks: [{ ...hook, id: 'twin' }, { ...hook, id: 'twin', command: 'printf other' }, { ...hook, id: 'solo' }] };
  const preview = await service.call('previewImport', { bundle });
  assert.deepEqual(preview.value.items.map(entry => [entry.id, entry.status]), [['twin', 'new'], ['twin', 'duplicate'], ['solo', 'new']]);
  assert.equal((await service.call('import', { bundle })).ok, true);
  const listed = (await service.call('list')).value.hooks;
  assert.deepEqual(listed.map(item => item.hook.id).sort(), ['solo', 'twin']);
  assert.equal(listed.find(item => item.hook.id === 'twin').hook.command, 'printf hello');
  // The store stays readable: every later operation still works.
  assert.equal((await service.approve('twin')).ok, true);
  assert.equal((await service.call('save', { hook: { ...hook, id: 'later' } })).ok, true);
  const raw = JSON.parse(await readFile(join(root, 'state', 'commands.json'), 'utf8'));
  assert.equal(new Set(raw.entries.map(entry => entry.hook.id)).size, raw.entries.length);
  // A repeated id that already exists in the store is never importable either.
  const again = await service.call('previewImport', { bundle: { ...bundle, hooks: [{ ...hook, id: 'twin' }, { ...hook, id: 'twin' }] } });
  assert.ok(again.value.items.every(entry => entry.status !== 'new'));
});

test('save refuses the 129th entry (trash counts) and the store stays readable', async t => {
  const root = await fixture(t); const service = await mount(t, root);
  for (let index = 0; index < 128; index++) assert.equal((await service.call('save', { hook: { ...hook, id: 'h' + index } })).ok, true, 'h' + index);
  const refused = await service.call('save', { hook: { ...hook, id: 'overflow' } });
  assert.equal(refused.ok, false); assert.equal(refused.error.code, 'store_full');
  assert.equal((await service.call('list')).value.hooks.length, 128);
  // Overwriting an existing entry does not grow the store and still works at the cap.
  assert.equal((await service.call('save', { hook: { ...hook, id: 'h0', command: 'printf edited' }, revision: (await service.find('h0')).revision })).ok, true);
  // A trashed entry still occupies a slot until it is purged.
  const removed = await service.call('remove', { id: 'h1', revision: (await service.find('h1')).revision });
  assert.equal((await service.call('save', { hook: { ...hook, id: 'overflow' } })).error.code, 'store_full');
  assert.equal((await service.call('purge', { id: 'h1', revision: removed.value.trash[0].revision })).ok, true);
  assert.equal((await service.call('save', { hook: { ...hook, id: 'overflow' } })).ok, true);
  assert.equal(JSON.parse(await readFile(join(root, 'state', 'commands.json'), 'utf8')).entries.length, 128);
});

test('export never produces a bundle that import cannot accept, at the count and size boundaries', async t => {
  const root = await fixture(t); const service = await mount(t, root); const other = await mount(t, await fixture(t));
  for (let index = 0; index < 32; index++) await service.call('save', { hook: { ...hook, id: 'b' + index } });
  const exported = await service.call('export', {});
  assert.equal(exported.ok, true); assert.equal(exported.value.bundle.hooks.length, 32);
  assert.equal((await other.call('import', { bundle: exported.value.bundle })).ok, true);
  assert.equal((await other.call('list')).value.hooks.length, 32);
  await service.call('save', { hook: { ...hook, id: 'b32' } });
  const refused = await service.call('export', {});
  assert.equal(refused.ok, false); assert.equal(refused.error.code, 'bundle_too_large');
  // Size boundary: the whole import request must fit the 32768-byte Fetch body limit.
  const big = await mount(t, await fixture(t)); const target = await mount(t, await fixture(t));
  for (let index = 0; index < 7; index++) await big.call('save', { hook: { ...hook, id: 'big' + index, command: 'x'.repeat(3000) } });
  const fits = await big.call('export', {});
  assert.equal(fits.ok, true);
  assert.equal((await target.call('import', { bundle: fits.value.bundle })).ok, true);
  await big.call('save', { hook: { ...hook, id: 'big7', command: 'x'.repeat(3000) } });
  assert.equal((await big.call('export', {})).error.code, 'bundle_too_large');
});

test('every revision-fenced action refuses a stale revision, including revoke, remove and purge', async t => {
  const root = await fixture(t); const service = await mount(t, root);
  await service.call('save', { hook }); await service.approve('example');
  let item = await service.find('example');
  for (const action of ['revoke', 'remove', 'setEnabled', 'duplicate', 'save']) {
    const input = action === 'save' ? { hook } : { id: 'example', ...(action === 'setEnabled' ? { enabled: false } : {}), ...(action === 'duplicate' ? { newId: 'copy' } : {}) };
    assert.equal((await service.call(action, { ...input, revision: 'stale' })).error.code, 'stale_revision', action);
    assert.equal((await service.call(action, input)).error.code, 'stale_revision', action + ' without revision');
  }
  // Refusals changed nothing: the Approval is still valid and the entry is still listed.
  item = await service.find('example'); assert.equal(item.approval.valid, true);
  const removed = await service.call('remove', { id: 'example', revision: item.revision });
  assert.equal(removed.ok, true);
  assert.equal((await service.call('restore', { id: 'example', revision: 'stale' })).error.code, 'stale_revision');
  assert.equal((await service.call('purge', { id: 'example', revision: 'stale' })).error.code, 'stale_revision');
  assert.equal((await service.call('purge', { id: 'example' })).error.code, 'stale_revision');
  assert.equal((await service.call('list')).value.trash.length, 1);
  assert.equal((await service.call('purge', { id: 'example', revision: removed.value.trash[0].revision })).ok, true);
});

test('a revision from another scope or project root never fences a same-id entry', async t => {
  const root = await fixture(t);
  const a = join(root, 'a'); const b = join(root, 'b');
  await Promise.all([mkdir(a), mkdir(b)]);
  const setup = projects([{ id: 'a', cwd: a }, { id: 'b', cwd: b }]);
  const service = await mount(t, root, { services: setup.services });
  const scopes = { user: { scope: 'user' }, a: setup.select('a'), b: setup.select('b') };
  const revisions = {};
  for (const [name, scope] of Object.entries(scopes)) {
    assert.equal((await service.call('save', { ...scope, hook })).ok, true);
    revisions[name] = (await service.call('list', scope)).value.hooks[0].revision;
  }
  assert.equal(new Set(Object.values(revisions)).size, 3);
  for (const [target, foreign] of [['a', 'user'], ['a', 'b'], ['b', 'a'], ['user', 'b']]) {
    for (const [action, extra] of [['revoke', {}], ['remove', {}], ['setEnabled', { enabled: false }], ['duplicate', { newId: 'copy' }], ['save', { hook }]]) {
      const input = action === 'save' ? { hook, revision: revisions[foreign] } : { id: 'example', revision: revisions[foreign], ...extra };
      assert.equal((await service.call(action, { ...scopes[target], ...input })).error.code, 'stale_revision', `${action} ${target} with ${foreign} revision`);
    }
  }
  // The matching revision still works, and only in its own scope.
  assert.equal((await service.call('remove', { ...scopes.a, id: 'example', revision: revisions.a })).ok, true);
  for (const name of ['user', 'b']) assert.equal((await service.call('list', scopes[name])).value.hooks.length, 1);
});

test('enabling re-reviews the watched bytes after the asynchronous scope check', async t => {
  const root = await fixture(t); const project = join(root, 'p'); await mkdir(project);
  await writeFile(join(project, 'watched.txt'), 'reviewed bytes');
  const setup = projects([{ id: 'p', cwd: project }]);
  let reads = 0; let armed = false; let fired = false;
  const sessions = { get(id) {
    // One scope resolution reads the session three times; the fourth read is the post-work scope check.
    if (armed && ++reads === 4) { fired = true; writeFileSync(join(project, 'watched.txt'), 'changed during enable'); }
    return setup.services.sessions.get(id);
  } };
  const service = await mount(t, root, { services: { ...setup.services, sessions } });
  const scope = setup.select('p');
  await service.call('save', { ...scope, hook: { ...hook, watchedFiles: ['watched.txt'] } });
  const challenge = (await service.call('review', { ...scope, id: 'example' })).value;
  assert.equal((await service.call('approve', { ...scope, id: 'example', nonce: challenge.nonce, phrase: 'RUN AS DSH USER' })).ok, true);
  const item = (await service.call('list', scope)).value.hooks[0];
  armed = true;
  const result = await service.call('setEnabled', { ...scope, id: 'example', enabled: true, revision: item.revision });
  assert.equal(fired, true);
  assert.equal(result.error?.code, 'state_changed');
  armed = false;
  const after = (await service.call('list', scope)).value.hooks[0];
  assert.equal(after.hook.enabled, false); assert.equal(after.state, 'draft');
});

test('preview and import enforce the export byte bound by bytes, not characters', async t => {
  const service = await mount(t, await fixture(t));
  // 5 hooks of 2500 two-byte characters: under 24576 characters but over 24576 bytes, and under the 32768-byte request limit.
  const hooks = Array.from({ length: 5 }, (_, index) => ({ ...hook, id: 'wide' + index, command: 'é'.repeat(2500) }));
  const bundle = { version: 1, kind: 'dsh-majed-hooks', hooks };
  const serialized = JSON.stringify(bundle);
  assert.ok(serialized.length < 24576 && Buffer.byteLength(serialized) > 24576 && Buffer.byteLength(serialized) < 30000, 'fixture straddles the byte bound');
  const preview = await service.call('previewImport', { bundle });
  assert.equal(preview.ok, false); assert.equal(preview.error.code, 'bundle_too_large');
  const imported = await service.call('import', { bundle });
  assert.equal(imported.ok, false); assert.equal(imported.error.code, 'bundle_too_large');
  assert.deepEqual((await service.call('list')).value.hooks, []);
  // One fewer wide hook fits the bound and is accepted.
  const fits = { ...bundle, hooks: hooks.slice(0, 4) };
  assert.ok(Buffer.byteLength(JSON.stringify(fits)) <= 24576);
  assert.equal((await service.call('import', { bundle: fits })).ok, true);
  assert.equal((await service.call('list')).value.hooks.length, 4);
});
