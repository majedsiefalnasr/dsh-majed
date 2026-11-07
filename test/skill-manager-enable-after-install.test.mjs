import assert from 'node:assert/strict';
import { mkdtemp, mkdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { apply } from '../dist/skills.js';

async function fixture(t) {
  const root = await realpath(
    await mkdtemp(join(tmpdir(), 'waycraft-enable-')),
  );
  t.after(() => rm(root, { recursive: true, force: true }));
  let route;
  const stops = [];
  const ctx = {
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
  };
  apply(ctx, {
    sources: [{ id: 'user-dsh', path: join(root, 'skills') }],
    statePath: join(root, 'state', 'state.json'),
  });
  t.after(async () => {
    for (const stop of stops.reverse()) await stop?.();
  });
  const post = async (body) => {
    const r = await route.fetch(
      new Request('http://localhost/api/waycraft-skills.catalog', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-waycraft-skills': '1',
        },
        body: JSON.stringify({ source: 'user-dsh', ...body }),
      }),
    );
    return { status: r.status, body: await r.json().catch(() => null) };
  };
  return { root, post };
}

const eligible = async (post, name) =>
  (await post({ action: 'list' })).body.copies
    .filter((copy) => copy.name === name)
    .map((copy) => copy.eligible);

test('a skill created over a disabled-then-trashed path starts enabled, like the reference install', async (t) => {
  const { root, post } = await fixture(t);
  const make = () =>
    post({ action: 'create', name: 'alpha', description: 'd', body: 'b' });
  assert.equal((await make()).status, 200);
  const doc = join(root, 'skills', 'alpha', 'SKILL.md');
  await post({ action: 'toggle', kind: 'copy', id: doc, enabled: false });
  assert.deepEqual(await eligible(post, 'alpha'), [false]);
  assert.equal((await post({ action: 'trash', id: doc })).status, 200);
  assert.equal((await make()).status, 200);
  assert.deepEqual(await eligible(post, 'alpha'), [true]);
});

test('a plain first install stays enabled and an untouched disabled sibling stays disabled', async (t) => {
  const { root, post } = await fixture(t);
  for (const name of ['one', 'two'])
    await post({ action: 'create', name, description: 'd', body: 'b' });
  await post({
    action: 'toggle',
    kind: 'copy',
    id: join(root, 'skills', 'two', 'SKILL.md'),
    enabled: false,
  });
  await post({ action: 'create', name: 'three', description: 'd', body: 'b' });
  assert.deepEqual(await eligible(post, 'one'), [true]);
  assert.deepEqual(await eligible(post, 'two'), [false]);
  assert.deepEqual(await eligible(post, 'three'), [true]);
});

test('importing over a stale disabled flag enables the imported skill', async (t) => {
  const { root, post } = await fixture(t);
  await post({ action: 'create', name: 'beta', description: 'd', body: 'b' });
  const doc = join(root, 'skills', 'beta', 'SKILL.md');
  await post({ action: 'toggle', kind: 'copy', id: doc, enabled: false });
  await post({ action: 'trash', id: doc });
  const src = join(root, 'incoming', 'beta');
  await mkdir(src, { recursive: true });
  await writeFile(
    join(src, 'SKILL.md'),
    '---\nname: beta\ndescription: d\n---\n\nb\n',
  );
  const r = await post({ action: 'import', path: src, conflict: 'skip' });
  assert.equal(r.status, 200);
  assert.equal(r.body.result.imported.length, 1);
  assert.deepEqual(await eligible(post, 'beta'), [true]);
});
