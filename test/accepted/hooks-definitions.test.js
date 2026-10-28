import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, realpath, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Context } from '@deepseek-ai/cordis';
import { apply } from '../../index.js';

// H01 (#103): scoped definition management through the Owner-admitted Fetch route. No hook is ever executed here.
async function mount(t, root, options = {}) {
  const ctx = new Context(); let route;
  ctx.provide('connection', { fetch: { register(value) { if (value.path === '/api/majed/hooks/approval') route = value; } } });
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
  assert.equal((await service.call('executionAvailable' in {} ? 'list' : 'list')).value.executionAvailable, false);
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
