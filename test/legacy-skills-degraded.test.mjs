// Failed skills-root migration: the manager must keep ONE consistent store (the legacy root),
// never fork state into a new root that holds only state.json.
import assert from 'node:assert/strict';
import {
  realpath,
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  readdir,
  rm,
  access,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { apply } from '../dist/skills.js';
import { LEGACY_SKILLS_DIR } from '../dist/legacy-names.js';

function start(root, warnings = []) {
  let route;
  const stops = [];
  process.env.DSH_HOME = root;
  const originalWarn = console.warn;
  console.warn = (message) => warnings.push(String(message));
  try {
    apply(
      {
        skills: { registerProvider: () => () => {} },
        effect(fn) {
          stops.push(fn());
        },
        inject(_, fn) {
          fn({
            effect(fn) {
              stops.push(fn());
            },
            get() {
              return {
                fetch: {
                  register(value) {
                    route = value;
                    return () => {};
                  },
                },
              };
            },
          });
        },
      },
      { sources: [{ id: 'user-dsh', path: join(root, 'skills') }] },
    );
  } finally {
    console.warn = originalWarn;
  }
  const post = async (body) => {
    const response = await route.fetch(
      new Request('http://localhost/api/waycraft-skills.catalog', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-waycraft-skills': '1',
        },
        body: JSON.stringify({ source: 'user-dsh', ...body }),
      }),
    );
    const text = await response.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { text };
    }
    return { status: response.status, body: parsed };
  };
  return {
    post,
    stop: async () => {
      for (const s of stops.reverse()) await s?.();
    },
  };
}

test('failed migration keeps reading and writing the legacy root; no forked new root', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'waycraft-t159-degraded-'));
  const saved = process.env.DSH_HOME;
  t.after(async () => {
    process.env.DSH_HOME = saved;
    await rm(root, { recursive: true, force: true });
  });
  const legacy = join(root, LEGACY_SKILLS_DIR);
  await mkdir(join(legacy, 'trash'), { recursive: true });
  await writeFile(
    join(legacy, 'state.json'),
    JSON.stringify({ sources: {}, copies: {}, placement: 'sidebar' }),
  );
  await writeFile(join(legacy, 'trash', 'keep.txt'), 'trash entry');
  // A corrupt top-level JSON makes the tree migration fail (parse validation).
  await writeFile(join(legacy, 'repositories.json'), '{broken');

  const first = start(root);
  assert.equal(
    (await first.post({ action: 'ping', include: 'placement' })).body.placement,
    'sidebar',
  );
  assert.equal(
    (await first.post({ action: 'placement', location: 'settings' })).status,
    200,
  );
  await first.stop();

  await assert.rejects(
    access(join(root, 'waycraft-skills')),
    'no new root was created by the write',
  );
  assert.equal(
    JSON.parse(await readFile(join(legacy, 'state.json'), 'utf8')).placement,
    'settings',
  );
  assert.deepEqual((await readdir(join(legacy, 'trash'))).sort(), ['keep.txt']);
  assert.equal(
    await readFile(join(legacy, 'repositories.json'), 'utf8'),
    '{broken',
  );

  // Restart: still one consistent store, nothing diverged.
  const second = start(root);
  assert.equal(
    (await second.post({ action: 'ping', include: 'placement' })).body
      .placement,
    'settings',
  );
  await second.stop();
  await assert.rejects(access(join(root, 'waycraft-skills')));
});

const doc = '---\nname: alpha\ndescription: d\n---\nbody\n';

test('degraded: a trash write lands in the legacy root; fixing the cause then migrates the newest state with no divergence', async (t) => {
  const root = await realpath(
    await mkdtemp(join(tmpdir(), 'waycraft-t159-recover-')),
  );
  const saved = process.env.DSH_HOME;
  t.after(async () => {
    process.env.DSH_HOME = saved;
    await rm(root, { recursive: true, force: true });
  });
  const legacy = join(root, LEGACY_SKILLS_DIR);
  await mkdir(join(legacy, 'trash'), { recursive: true });
  await writeFile(
    join(legacy, 'state.json'),
    JSON.stringify({ sources: {}, copies: {}, placement: 'sidebar' }),
  );
  await writeFile(join(legacy, 'repositories.json'), '{broken');
  const origin = join(root, 'skills', 'alpha');
  await mkdir(origin, { recursive: true });
  await writeFile(join(origin, 'SKILL.md'), doc);

  const first = start(root);
  assert.equal(
    (await first.post({ action: 'placement', location: 'both' })).status,
    200,
  );
  const trashed = await first.post({
    action: 'trash',
    id: join(origin, 'SKILL.md'),
  });
  assert.equal(trashed.status, 200, JSON.stringify(trashed.body));
  await first.stop();
  const legacyTrash = await readdir(join(legacy, 'trash'));
  assert.ok(legacyTrash.length >= 1, 'trash write landed in the legacy root');
  await assert.rejects(access(join(root, 'waycraft-skills')));

  // Owner fixes the corrupt file; the next start migrates the whole (newest) legacy tree.
  await writeFile(join(legacy, 'repositories.json'), '{}');
  const second = start(root);
  assert.equal(
    (await second.post({ action: 'ping', include: 'placement' })).body
      .placement,
    'both',
  );
  await second.stop();
  const migrated = join(root, 'waycraft-skills');
  assert.equal(
    JSON.parse(await readFile(join(migrated, 'state.json'), 'utf8')).placement,
    'both',
  );
  assert.deepEqual(
    (await readdir(join(migrated, 'trash'))).sort(),
    legacyTrash.sort(),
  );
  assert.equal(
    JSON.parse(await readFile(join(legacy, 'state.json'), 'utf8')).placement,
    'both',
  );
});

test('degraded: a legacy path that is a file fails closed with a clear diagnostic', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'waycraft-t159-notdir-'));
  const saved = process.env.DSH_HOME;
  t.after(async () => {
    process.env.DSH_HOME = saved;
    await rm(root, { recursive: true, force: true });
  });
  await writeFile(join(root, LEGACY_SKILLS_DIR), 'i am a file');
  const warnings = [];
  const run = start(root, warnings);
  const result = await run.post({ action: 'placement', location: 'sidebar' });
  await run.stop();
  assert.notEqual(result.status, 200, 'writes are refused, not silently lost');
  assert.ok(
    warnings.some((w) => /not a directory/.test(w)),
    warnings.join('|'),
  );
  assert.equal(
    await readFile(join(root, LEGACY_SKILLS_DIR), 'utf8'),
    'i am a file',
  );
  await assert.rejects(access(join(root, 'waycraft-skills')));
});
