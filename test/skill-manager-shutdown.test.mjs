import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { apply } from '../dist/skills.js';

// Pause the existing fs.rename seam after a complete stage has been written.
// No product injection API or production-only timing hook is necessary.
test('shutdown drains a fully staged creation and fresh reentry preserves it', async (t) => {
  const root = await fs.realpath(
    await fs.mkdtemp(join(tmpdir(), 'waycraft-shutdown-')),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const source = join(root, 'skills');
  const originalRename = fs.rename;
  let release;
  const resume = new Promise((resolve) => {
    release = resolve;
  });
  let reached;
  const staged = new Promise((resolve) => {
    reached = resolve;
  });
  fs.rename = async (from, to) => {
    if (String(from).startsWith(join(source, '.create-'))) {
      reached(from);
      await resume;
    }
    return originalRename(from, to);
  };
  syncBuiltinESMExports();
  t.after(() => {
    fs.rename = originalRename;
    syncBuiltinESMExports();
    release();
  });
  const mount = () => {
    const stops = [];
    let tool;
    apply(
      {
        skills: {
          registerProvider() {
            return () => {};
          },
        },
        effect(fn) {
          stops.push(fn());
        },
        on() {
          return () => {};
        },
        get(name) {
          if (name === 'tools')
            return {
              get() {},
              register(value) {
                tool = value;
                return () => {};
              },
            };
        },
      },
      {
        sources: [{ id: 'user-dsh', path: source }],
        statePath: join(root, 'state.json'),
      },
    );
    return {
      tool,
      async stop() {
        for (const stop of stops.reverse()) await stop?.();
      },
    };
  };
  const first = mount();
  const args = {
    name: 'Staged',
    description: 'Use for shutdown',
    body: '# Complete instructions',
  };
  const pending = first.tool.execute(args);
  const stage = await staged;
  assert.match(
    await fs.readFile(join(stage, 'SKILL.md'), 'utf8'),
    /Complete instructions/,
  );
  await assert.rejects(fs.stat(join(source, 'staged')), { code: 'ENOENT' });
  let drained = false;
  const stopping = first.stop().then(() => {
    drained = true;
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(drained, false, 'shutdown must wait for the staged transaction');
  release();
  const created = await pending;
  await stopping;
  assert.equal(created.name, 'staged');
  assert.match(
    await fs.readFile(created.path, 'utf8'),
    /Complete instructions/,
  );
  assert.deepEqual(await fs.readdir(source), ['staged']);
  assert.equal(
    (await first.tool.execute({ ...args, name: 'After stop' })).code,
    'stopping',
  );
  const second = mount();
  assert.equal((await second.tool.execute(args)).code, 'create-conflict');
  const next = await second.tool.execute({ ...args, name: 'Fresh' });
  assert.equal(next.name, 'fresh');
  await second.stop();
  assert.deepEqual((await fs.readdir(source)).sort(), ['fresh', 'staged']);
});
