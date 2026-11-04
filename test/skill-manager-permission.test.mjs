import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, realpath, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Context } from '@deepseek-ai/cordis';
import { ToolRuntime } from '@deepseek-ai/dsh-tools';
import { apply } from '../dist/skills.js';

// Public runtime setup follows lifecycle-owned.test.mjs, not a simulated gate.
test('create_skill uses the real public tools.execute approval pipeline', async (t) => {
  const root = await realpath(
    await mkdtemp(join(tmpdir(), 'waycraft-permission-')),
  );
  t.after(() => rm(root, { recursive: true, force: true }));
  const ctx = new Context();
  ctx.provide('systemPrompt', {
    tools() {},
    section() {
      return () => {};
    },
    getSectionOrder() {
      return 0;
    },
  });
  ctx.set('tools', new ToolRuntime(ctx, {}));
  ctx.provide('skills', {
    registerProvider() {
      return () => {};
    },
  });
  // A real plugin fiber owns registrations; do not prototype-clone Context.
  const fiber = ctx.plugin(
    { apply },
    {
      sources: [{ id: 'user-dsh', path: join(root, 'skills') }],
      statePath: join(root, 'state.json'),
    },
  );
  await new Promise((resolve) => setImmediate(resolve));
  t.after(() => fiber.dispose());
  assert.ok(
    ctx.tools.get('create_skill'),
    'plugin fiber registers optional tool',
  );
  const call = (name, signal = new AbortController().signal) =>
    ctx.tools.execute({
      callId: name,
      name: 'create_skill',
      arguments: {
        name,
        description: 'Use for permission work',
        body: '# Instructions',
      },
      signal,
      agent: { id: 'fixture' },
    });
  assert.equal((await call('Missing approval')).isError, true);
  assert.deepEqual(await readdir(root), []);
  let outcome = 'rejected';
  let requests = 0;
  ctx.provide('approval', {
    async request() {
      requests++;
      return outcome;
    },
  });
  assert.equal((await call('Rejected')).isError, true);
  outcome = 'cancelled';
  assert.equal((await call('Cancelled')).isError, true);
  outcome = 'allowed-once';
  const approved = await call('Approved');
  assert.equal(approved.isError, false, JSON.stringify(approved));
  assert.equal(requests, 3);
  const abort = new AbortController();
  abort.abort();
  assert.equal((await call('Aborted', abort.signal)).isError, true);
  assert.deepEqual(await readdir(join(root, 'skills')), ['approved']);
});
