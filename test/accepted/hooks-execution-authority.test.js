import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Context } from '@deepseek-ai/cordis';
import { applyCommandApproval } from '../../modules/hooks/approval.js';

test('runtime authority uses the same private reviewed Approval and rejects revocation before dispatch', async t => {
  const directory = await realpath(await mkdtemp(join(tmpdir(), 'majed-hook-runtime-')));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const options = { enabled: true, stateDirectory: join(directory, 'state'), userDirectory: directory };
  const ctx = new Context(); let route;
  ctx.provide('connection', { fetch: { register(value) { route = value; } } });
  const fiber = ctx.plugin({ apply(owner) { applyCommandApproval(owner, options); } });
  await fiber; t.after(() => fiber.dispose());
  const call = async (action, values = {}) => (await (await route.fetch(new Request('http://fixture/api/majed/hooks/approval', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'client-request', rpcId: 'test', method: 'majed/hooks/approval', payload: { action, scope: 'user', ...values } }),
  }))).json()).result;
  const hook = { id: 'approved', events: ['SessionStart'], source: 'inline', command: 'printf harmless', enabled: true };
  assert.equal((await call('save', { hook })).ok, true);
  const reviewed = (await call('review', { id: hook.id })).value;
  assert.equal((await call('approve', { id: hook.id, nonce: reviewed.nonce, phrase: 'RUN AS DSH USER' })).ok, true);
  const { createCommandExecutionAuthority } = await import('../../modules/hooks/approval.js');
  const authority = createCommandExecutionAuthority(options, ctx);
  const agent = { session: { header: { id: 'fixture', cwd: directory } } };
  const signal = new AbortController().signal;
  const [entry] = await authority.list(agent, 'SessionStart', signal);
  assert.equal(entry.hook.id, hook.id);
  assert.equal((await authority.revalidate(agent, entry, signal)).fingerprint, reviewed.review.fingerprint);
  assert.equal((await call('revoke', { id: hook.id })).ok, true);
  await assert.rejects(authority.revalidate(agent, entry, signal), /invalid_approval/);
});
