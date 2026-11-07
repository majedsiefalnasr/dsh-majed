import assert from 'node:assert/strict';
import {
  mkdtemp,
  realpath,
  mkdir,
  writeFile,
  readFile,
  rm,
  lstat,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { symlink, readdir } from 'node:fs/promises';
import { apply } from '../dist/skills.js';

async function fixture(t) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'waycraft-trash-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  let route;
  const stops = [];
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
    {
      sources: [
        { id: 'user-dsh', path: join(root, 'skills') },
        { id: 'external', path: join(root, 'external') },
      ],
      statePath: join(root, 'state', 'state.json'),
    },
  );
  t.after(async () => {
    for (const stop of stops.reverse()) await stop?.();
  });
  const stop = async () => {
    for (const fn of [...stops].reverse()) await fn?.();
  };
  const post = async (body, signal) => {
    const r = await route.fetch(
      new Request('http://localhost/api/waycraft-skills.catalog', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-waycraft-skills': '1',
        },
        body: JSON.stringify({ source: 'user-dsh', ...body }),
        signal,
      }),
    );
    return { status: r.status, body: await r.json() };
  };
  return { root, post, stop };
}
test('registered catalog stays available with explicit Trash diagnostics while unsafe Trash writes stay rejected', async (t) => {
  const { root, post } = await fixture(t);
  const origin = join(root, 'skills', 'alpha');
  await mkdir(origin, { recursive: true });
  await writeFile(join(origin, 'SKILL.md'), doc);
  await writeFile(join(root, 'state'), 'not a directory');
  let listed = await post({ action: 'list' });
  assert.equal(listed.status, 200);
  assert.equal(listed.body.copies[0].name, 'alpha');
  assert.equal(listed.body.trashError, 'trash-unavailable');
  await rm(join(root, 'state'));
  await mkdir(join(root, 'outside'));
  await symlink(join(root, 'outside'), join(root, 'state'));
  listed = await post({ action: 'list' });
  assert.equal(listed.status, 200);
  assert.equal(listed.body.copies[0].name, 'alpha');
  assert.equal(listed.body.trashError, 'trash-linked');
  assert.equal(
    (await post({ action: 'trash', id: join(origin, 'SKILL.md') })).body.code,
    'trash-linked',
  );
  assert.equal(await readFile(join(origin, 'SKILL.md'), 'utf8'), doc);
  assert.deepEqual(await readdir(join(root, 'outside')), []);
});

const doc = '---\nname: alpha\ndescription: Alpha\n---\nOriginal';
test('registered Trash restores exact bundle origin, policy and annotations without overwriting active copies', async (t) => {
  const { root, post } = await fixture(t);
  await mkdir(join(root, 'skills', 'alpha'), { recursive: true });
  await writeFile(join(root, 'skills', 'alpha', 'SKILL.md'), doc);
  await writeFile(
    join(root, 'skills', 'alpha', 'data.bin'),
    Buffer.from([0, 255, 1]),
  );
  const category = await post({ action: 'category-create', name: 'Saved' });
  const categoryId = category.body.organization['user-dsh'].categories[0].id;
  await post({
    action: 'category-assign',
    names: ['alpha'],
    category: categoryId,
  });
  await post({ action: 'note', name: 'alpha', note: 'Keep this' });
  await post({
    action: 'toggle',
    kind: 'copy',
    id: join(root, 'skills', 'alpha', 'SKILL.md'),
    enabled: false,
  });
  const trashed = await post({
    action: 'trash',
    id: join(root, 'skills', 'alpha', 'SKILL.md'),
  });
  assert.equal(trashed.status, 200);
  assert.equal(
    await lstat(join(root, 'skills', 'alpha')).catch(() => undefined),
    undefined,
  );
  const item = trashed.body.trash[0];
  assert.equal(item.origin, join(root, 'skills', 'alpha'));
  await post({ action: 'category-create', name: 'Other' });
  await mkdir(join(root, 'skills', 'alpha'));
  await writeFile(join(root, 'skills', 'alpha', 'SKILL.md'), 'Active');
  assert.equal(
    (await post({ action: 'trash-restore', id: item.id })).body.code,
    'trash-conflict',
  );
  assert.equal(
    await readFile(join(root, 'skills', 'alpha', 'SKILL.md'), 'utf8'),
    'Active',
  );
  await rm(join(root, 'skills', 'alpha'), { recursive: true });
  const restored = await post({ action: 'trash-restore', id: item.id });
  assert.equal(restored.status, 200);
  assert.equal(restored.body.trash.length, 0);
  assert.equal(
    await readFile(join(root, 'skills', 'alpha', 'SKILL.md'), 'utf8'),
    doc,
  );
  assert.deepEqual(
    await readFile(join(root, 'skills', 'alpha', 'data.bin')),
    Buffer.from([0, 255, 1]),
  );
  assert.equal(restored.body.organization['user-dsh'].notes.alpha, 'Keep this');
  assert.equal(
    restored.body.organization['user-dsh'].members.alpha,
    categoryId,
  );
  assert.equal(restored.body.copies[0].eligible, false);
  const again = await post({
    action: 'trash',
    id: join(root, 'skills', 'alpha', 'SKILL.md'),
  });
  const id = again.body.trash[0].id;
  assert.equal(
    (await post({ action: 'trash-delete', id })).body.code,
    'trash-confirm',
  );
  const deleted = await post({ action: 'trash-delete', id, confirm: true });
  assert.equal(deleted.body.trash.length, 0);
  assert.equal(deleted.body.organization['user-dsh'].notes.alpha, undefined);
  assert.equal(deleted.body.organization['user-dsh'].members.alpha, undefined);
  const state = JSON.parse(
    await readFile(join(root, 'state', 'state.json'), 'utf8'),
  );
  assert.equal(
    state.copies[join(root, 'skills', 'alpha', 'SKILL.md')],
    undefined,
  );
});

test('registered Trash rejects linked/external targets and retains complete recovery bytes on transaction faults', async (t) => {
  const { root, post } = await fixture(t);
  const origin = join(root, 'skills', 'alpha');
  await mkdir(origin, { recursive: true });
  await writeFile(join(origin, 'SKILL.md'), doc);
  await mkdir(join(root, 'external', 'alpha'), { recursive: true });
  await writeFile(join(root, 'external', 'alpha', 'SKILL.md'), doc);
  assert.equal(
    (
      await post({
        action: 'trash',
        source: 'external',
        id: join(root, 'external', 'alpha', 'SKILL.md'),
      })
    ).body.code,
    'trash-readonly',
  );
  await symlink(
    join(root, 'external', 'alpha', 'SKILL.md'),
    join(origin, 'linked'),
  );
  assert.equal(
    (await post({ action: 'trash', id: join(origin, 'SKILL.md') })).body.code,
    'trash-linked',
  );
  await rm(join(origin, 'linked'));
  const rename = fs.promises.rename;
  fs.promises.rename = async (source, target) => {
    if (String(source).includes('/.stage-'))
      throw new Error('publication fault');
    return rename(source, target);
  };
  syncBuiltinESMExports();
  try {
    assert.equal(
      (await post({ action: 'trash', id: join(origin, 'SKILL.md') })).body.code,
      'trash-failed',
    );
    assert.equal(await readFile(join(origin, 'SKILL.md'), 'utf8'), doc);
  } finally {
    fs.promises.rename = rename;
    syncBuiltinESMExports();
  }
  assert.equal((await post({ action: 'list' })).body.trash.length, 0);
  fs.promises.rename = async (source, target) => {
    if (source === origin) throw new Error('source removal fault');
    return rename(source, target);
  };
  syncBuiltinESMExports();
  let recovery;
  try {
    recovery = await post({ action: 'trash', id: join(origin, 'SKILL.md') });
    assert.equal(recovery.body.result.warning, 'trash-recovery');
    assert.equal(await readFile(join(origin, 'SKILL.md'), 'utf8'), doc);
    assert.equal(
      await readFile(
        join(recovery.body.result.path, 'content', 'SKILL.md'),
        'utf8',
      ),
      doc,
    );
  } finally {
    fs.promises.rename = rename;
    syncBuiltinESMExports();
  }
  await rm(origin, { recursive: true });
  const id = recovery.body.trash[0].id;
  fs.promises.rename = async (source, target) => {
    if (String(source).includes('/.restore-')) throw new Error('restore fault');
    return rename(source, target);
  };
  syncBuiltinESMExports();
  try {
    assert.equal(
      (await post({ action: 'trash-restore', id })).body.code,
      'trash-failed',
    );
    assert.equal(
      await readFile(
        join(recovery.body.result.path, 'content', 'SKILL.md'),
        'utf8',
      ),
      doc,
    );
    assert.equal(await lstat(origin).catch(() => undefined), undefined);
  } finally {
    fs.promises.rename = rename;
    syncBuiltinESMExports();
  }
  assert.equal((await post({ action: 'trash-restore', id })).status, 200);
  assert.equal(await readFile(join(origin, 'SKILL.md'), 'utf8'), doc);
});

test('registered Trash shutdown drains started staging and pre-aborted requests do not publish', async (t) => {
  const { root, post, stop } = await fixture(t);
  const origin = join(root, 'skills', 'alpha');
  await mkdir(origin, { recursive: true });
  await writeFile(join(origin, 'SKILL.md'), doc);
  const aborted = new AbortController();
  aborted.abort();
  assert.equal(
    (
      await post(
        { action: 'trash', id: join(origin, 'SKILL.md') },
        aborted.signal,
      )
    ).body.code,
    'trash-cancelled',
  );
  const cp = fs.promises.cp;
  let release, entered;
  const waiting = new Promise((resolve) => {
    entered = resolve;
  });
  const held = new Promise((resolve) => {
    release = resolve;
  });
  fs.promises.cp = async (...args) => {
    if (args[0] === origin) {
      entered();
      await held;
    }
    return cp(...args);
  };
  syncBuiltinESMExports();
  try {
    const request = post({ action: 'trash', id: join(origin, 'SKILL.md') });
    await waiting;
    let drained = false;
    const shutdown = stop().then(() => {
      drained = true;
    });
    await new Promise(setImmediate);
    assert.equal(drained, false);
    release();
    assert.equal((await request).body.code, 'trash-cancelled');
    await shutdown;
    assert.equal(await readFile(join(origin, 'SKILL.md'), 'utf8'), doc);
    assert.deepEqual(await readdir(join(root, 'state', 'trash')), []);
  } finally {
    release();
    fs.promises.cp = cp;
    syncBuiltinESMExports();
  }
});

async function trashAlphaWithNote(root, post) {
  const origin = join(root, 'skills', 'alpha');
  await mkdir(origin, { recursive: true });
  await writeFile(join(origin, 'SKILL.md'), doc);
  await post({ action: 'note', name: 'alpha', note: 'Keep this' });
  const trashed = await post({ action: 'trash', id: join(origin, 'SKILL.md') });
  assert.equal(trashed.status, 200);
  return trashed.body.trash[0];
}
const noteOf = async (post) =>
  (await post({ action: 'category-create', name: `C${Math.random()}` })).body
    .organization['user-dsh'].notes.alpha;

test('junk stage entries do not consume Trash slots and valid entries beyond them still list', async (t) => {
  const { root, post } = await fixture(t);
  const item = await trashAlphaWithNote(root, post);
  const trashRoot = join(root, 'state', 'trash');
  for (let i = 0; i < 2100; i++) await mkdir(join(trashRoot, `.stage-${i}`));
  const listed = await post({ action: 'list' });
  assert.equal(listed.body.trash.length, 1);
  assert.equal(listed.body.trash[0].id, item.id);
  assert.equal(listed.body.trashError, undefined);
});

test('more than 2000 Trash entries report trash-overflow and never prune annotations', async (t) => {
  const { root, post } = await fixture(t);
  await trashAlphaWithNote(root, post);
  const trashRoot = join(root, 'state', 'trash');
  for (let i = 0; i < 2001; i++) {
    const id = `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`;
    await mkdir(join(trashRoot, id));
  }
  const listed = await post({ action: 'list' });
  assert.equal(listed.status, 200);
  assert.equal(listed.body.trashError, 'trash-overflow');
  assert.equal(await noteOf(post), 'Keep this');
});

test('unreadable Trash records are surfaced and block annotation pruning', async (t) => {
  const { root, post } = await fixture(t);
  const item = await trashAlphaWithNote(root, post);
  const trashRoot = join(root, 'state', 'trash');
  const bad = '11111111-1111-1111-1111-111111111111';
  await mkdir(join(trashRoot, bad));
  await writeFile(join(trashRoot, bad, 'metadata.json'), '{not json');
  const listed = await post({ action: 'list' });
  assert.equal(listed.body.trashError, 'trash-skipped');
  assert.equal(listed.body.trash.length, 1);
  assert.equal(listed.body.trash[0].id, item.id);
  await rm(join(trashRoot, item.id), { recursive: true });
  assert.equal(await noteOf(post), 'Keep this');
});

test('linked Trash storage does not fail organization actions or prune annotations', async (t) => {
  const { root, post } = await fixture(t);
  const item = await trashAlphaWithNote(root, post);
  const trashRoot = join(root, 'state', 'trash');
  await mkdir(join(root, 'outside'));
  await rm(trashRoot, { recursive: true });
  await symlink(join(root, 'outside'), trashRoot);
  assert.equal(await noteOf(post), 'Keep this');
  const restored = await post({ action: 'trash-restore', id: item.id });
  assert.equal(restored.body.code, 'trash-linked');
});

test('missing Trash content reports trash-missing and tampered metadata reports trash-invalid', async (t) => {
  const { root, post } = await fixture(t);
  const item = await trashAlphaWithNote(root, post);
  const trashRoot = join(root, 'state', 'trash');
  const metadata = join(trashRoot, item.id, 'metadata.json');
  const original = await readFile(metadata, 'utf8');
  await writeFile(
    metadata,
    JSON.stringify({ ...item, root: join(root, 'elsewhere') }),
  );
  assert.equal(
    (await post({ action: 'trash-restore', id: item.id })).body.code,
    'trash-invalid',
  );
  await writeFile(metadata, original);
  await rm(join(trashRoot, item.id, 'content'), { recursive: true });
  assert.equal(
    (await post({ action: 'trash-restore', id: item.id })).body.code,
    'trash-missing',
  );
});

test('permanent deletion keeps note when a newer active same-name copy exists', async (t) => {
  const { root, post } = await fixture(t);
  const item = await trashAlphaWithNote(root, post);
  const active = join(root, 'skills', 'alpha');
  await mkdir(active, { recursive: true });
  await writeFile(join(active, 'SKILL.md'), doc);
  const deleted = await post({
    action: 'trash-delete',
    id: item.id,
    confirm: true,
  });
  assert.equal(deleted.status, 200);
  assert.equal(deleted.body.organization['user-dsh'].notes.alpha, 'Keep this');
});
