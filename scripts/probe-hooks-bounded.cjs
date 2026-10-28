'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const load = name => require('/native/node_modules/@deepseek-ai/' + name + '/lib/index.js');
async function main() {
  const { Context } = load('cordis'); const ctx = new Context(); let route;
  ctx.provide('connection', { fetch: { register(value) { route = value; } } });
  for (const name of ['dsh-subprocess-local']) { const m = load(name); await ctx.plugin(m.default || m).await(); }
  const { applyCommandApproval } = await import(pathToFileURL('/source/modules/hooks/approval.js'));
  const { createBoundedSessionStart } = await import(pathToFileURL('/source/modules/hooks/bounded.js'));
  const root = '/scratch'; const options = { enabled: true, userDirectory: root, stateDirectory: root + '/state' };
  const fiber = ctx.plugin({ apply(owner) { applyCommandApproval(owner, options); } }); await fiber.await();
  const call = async (action, values = {}) => {
    const response = await route.fetch(new Request('http://fixture/api/majed/hooks/approval', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'client-request', rpcId: 'fixture', method: 'majed/hooks/approval', payload: { action, scope: 'user', ...values } }) }));
    const result = (await response.json()).result; assert.equal(result.ok, true, JSON.stringify(result)); return result.value;
  };
  const hook = { id: 'bounded', events: ['SessionStart'], command: 'printf synthetic > /scratch/marker; cat', source: 'inline', enabled: true, watchedFiles: ['watched'] };
  await fs.writeFile(root + '/watched', 'approved');
  // H01: saves need the current revision and always store disabled drafts; activation is a separate fenced action.
  const current = async (values = {}) => (await call('list', values)).hooks.find(item => item.hook.id === hook.id);
  const approve = async (values = {}) => { await call('save', { ...values, hook, revision: (await current(values))?.revision }); const review = await call('review', { ...values, id: hook.id }); await call('approve', { ...values, id: hook.id, nonce: review.nonce, phrase: 'RUN AS DSH USER' }); await call('setEnabled', { ...values, id: hook.id, enabled: true, revision: (await current(values)).revision }); };
  try {
    await approve();
    const engine = createBoundedSessionStart(ctx, options);
    const agent = { session: { header: { id: 'synthetic-session' } } };
    const results = await engine.run('SessionStart', agent, new AbortController().signal);
    assert.equal(await fs.readFile(root + '/marker', 'utf8'), 'synthetic'); assert.equal(results[0].status, 'completed');
    await fs.unlink(root + '/marker');
    hook.command = 'printf reviewed > /scratch/marker\r\n'; await approve();
    assert.equal((await engine.run('SessionStart', agent, new AbortController().signal))[0].status, 'completed');
    assert.equal(await fs.readFile(root + '/marker', 'utf8'), 'reviewed');
    await fs.unlink(root + '/marker');
    for (const stream of ['stdout', 'stderr']) {
      hook.command = `head -c 70000 /dev/zero${stream === 'stderr' ? ' >&2' : ''}`; await approve();
      assert.equal((await engine.run('SessionStart', agent, new AbortController().signal))[0].status, 'error', `${stream} overflow must not complete`);
    }
    for (const status of ['timeout', 'cancelled']) {
      hook.command = 'printf started > /scratch/running; sleep 20; printf escaped > /scratch/late';
      hook.limits = { timeout: 1000, output: 65536 }; await approve();
      const controller = new AbortController();
      const pending = engine.run('SessionStart', agent, controller.signal);
      // Observe actual native execution before cancellation, rather than cancelling selection.
      for (let attempt = 0; ; attempt++) {
        try { await fs.stat(root + '/running'); break; } catch (error) {
          if (error.code !== 'ENOENT' || attempt >= 100) throw error;
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      if (status === 'cancelled') controller.abort();
      assert.equal((await pending)[0].status, status);
      await assert.rejects(fs.stat(root + '/late'), { code: 'ENOENT' });
      await fs.unlink(root + '/running');
      hook.command = 'printf reusable > /scratch/reused'; await approve();
      assert.equal((await engine.run('SessionStart', agent, new AbortController().signal))[0].status, 'completed');
      assert.equal(await fs.readFile(root + '/reused', 'utf8'), 'reusable'); await fs.unlink(root + '/reused');
    }
    delete hook.limits;
    hook.command = 'printf synthetic > /scratch/marker; cat';
    const original = ctx.subprocess.resolveExecutable.bind(ctx.subprocess);
    for (const change of ['revoke', 'watch', 'cwd']) {
      await approve();
      ctx.subprocess.resolveExecutable = async (...args) => { const resolved = await original(...args); if (change === 'revoke') await call('revoke', { id: hook.id }); else if (change === 'watch') await fs.writeFile(root + '/watched', 'changed'); else { await fs.rename(root + '/state', root + '/old-state'); await fs.mkdir(root + '/state'); } return resolved; };
      assert.equal((await engine.run('SessionStart', agent, new AbortController().signal))[0].status, 'skipped');
      await assert.rejects(fs.stat(root + '/marker'), { code: 'ENOENT' });
      ctx.subprocess.resolveExecutable = original;
      if (change === 'cwd') { await fs.rmdir(root + '/state'); await fs.rename(root + '/old-state', root + '/state'); }
    }
    await fs.mkdir(root + '/cwd-a'); await fs.mkdir(root + '/cwd-b'); await fs.symlink(root + '/cwd-a', root + '/cwd');
    hook.cwd = 'cwd'; await approve();
    ctx.subprocess.resolveExecutable = async (...args) => { const resolved = await original(...args); await fs.unlink(root + '/cwd'); await fs.symlink(root + '/cwd-b', root + '/cwd'); return resolved; };
    assert.equal((await engine.run('SessionStart', agent, new AbortController().signal))[0].status, 'skipped');
    await assert.rejects(fs.stat(root + '/marker'), { code: 'ENOENT' }); ctx.subprocess.resolveExecutable = original;
    delete hook.cwd; await approve();
    let release; let entered; const waiting = new Promise(resolve => { entered = resolve; });
    ctx.subprocess.resolveExecutable = async (...args) => { const resolved = await original(...args); entered(); await new Promise(resolve => { release = resolve; }); return resolved; };
    const running = engine.run('SessionStart', agent, new AbortController().signal); await waiting;
    assert.deepEqual(await engine.run('SessionStart', agent, new AbortController().signal), []);
    await call('revoke', { id: hook.id }); release(); assert.equal((await running)[0].status, 'skipped');
    ctx.subprocess.resolveExecutable = original;
    await assert.rejects(fs.stat(root + '/marker'), { code: 'ENOENT' });
    for (const event of ['UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'PermissionRequest', 'Stop', 'PostCompact']) assert.deepEqual(await engine.run(event, agent, new AbortController().signal), []);
    assert.deepEqual(await createBoundedSessionStart(ctx, {}).run('SessionStart', agent, new AbortController().signal), []);
    await call('remove', { id: hook.id });
    await fs.mkdir(root + '/project-a'); await fs.mkdir(root + '/project-b');
    const header = { id: agent.session.header.id, cwd: root + '/project-a' };
    const workspace = { id: 'project-fixture', path: root + '/project-a', sessionIds: [header.id] };
    ctx.provide('sessions', { get: id => id === header.id ? { header } : undefined });
    ctx.provide('sessionPersistence', { stat: async () => undefined });
    ctx.provide('workspaceRegistry', { list: () => [workspace], get: id => id === workspace.id ? workspace : undefined });
    const selectors = { scope: 'project', sessionId: header.id, workspaceId: workspace.id };
    delete hook.watchedFiles;
    await approve(selectors);
    assert.equal((await engine.run('SessionStart', agent, new AbortController().signal))[0].status, 'completed');
    await fs.unlink(root + '/marker');
    ctx.subprocess.resolveExecutable = async (...args) => { const resolved = await original(...args); header.cwd = root + '/project-b'; return resolved; };
    assert.equal((await engine.run('SessionStart', agent, new AbortController().signal))[0].status, 'skipped');
    await assert.rejects(fs.stat(root + '/marker'), { code: 'ENOENT' });
    ctx.subprocess.resolveExecutable = original;
    assert.deepEqual(await engine.run('SessionStart', agent, new AbortController().signal), []);
    console.log('PASS CRLF reviewed bytes; stdout/stderr overflow; native timeout/cancellation and slot reuse; project canonical mismatch rejected. PASS production Approval -> bounded authority -> native subprocess; revoke/watch/store replacement immediately before spawn; activation off; six events inert. Synthetic SessionStart only; no native guard or lifecycle claim.');
  } finally { await ctx.fiber.dispose(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
