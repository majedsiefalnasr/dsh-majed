import assert from 'node:assert/strict';
import {
  mkdtemp,
  realpath,
  mkdir,
  writeFile,
  readFile,
  readdir,
  rm,
  lstat,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { apply } from '../dist/skills.js';

const doc = (name) =>
  `---\nname: ${name}\ndescription: About ${name}\n---\nBody`;

async function fixture(t) {
  const root = await realpath(
    await mkdtemp(join(tmpdir(), 'waycraft-project-files-')),
  );
  t.after(() => rm(root, { recursive: true, force: true }));
  const projects = { a: join(root, 'a'), b: join(root, 'b') };
  for (const dir of Object.values(projects))
    await mkdir(join(dir, '.git'), { recursive: true });
  const registered = [projects.a, projects.b];
  let route;
  const stops = [];
  apply(
    {
      skills: { registerProvider: () => () => {} },
      effect: (fn) => stops.push(fn()),
      get(name) {
        if (name === 'workspaceRegistry')
          return { list: () => registered.map((path) => ({ path })) };
      },
      inject(_, fn) {
        fn({
          effect: (f) => stops.push(f()),
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
      sources: [{ id: 'user-dsh', path: join(root, 'global') }],
      statePath: join(root, 'state', 'state.json'),
    },
  );
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
        body: JSON.stringify(body),
      }),
    );
    return { status: r.status, body: await r.json().catch(() => null) };
  };
  const listed = await post({ action: 'list' });
  const ids = Object.fromEntries(
    listed.body.projects.map((p) => [p.name, p.id]),
  );
  return { root, projects, ids, post, registered };
}

const exists = (p) =>
  lstat(p).then(
    () => true,
    () => false,
  );

test('registered project writes land only in the selected project and reject mismatched, unregistered and global fallbacks', async (t) => {
  const { root, projects, ids, post } = await fixture(t);
  const a = ids.a;
  const b = ids.b;
  const src = join(root, 'incoming', 'imp');
  await mkdir(src, { recursive: true });
  await writeFile(join(src, 'SKILL.md'), doc('imp'));
  const create = (project, source, name = 'made') => ({
    action: 'create',
    project,
    source,
    name,
    description: 'D',
    body: 'Body',
  });
  const upload = (project, source) => ({
    action: 'upload',
    project,
    source,
    conflict: 'skip',
    entries: [
      {
        path: 'up/SKILL.md',
        data: Buffer.from(doc('up')).toString('base64'),
      },
    ],
  });
  const imp = (project, source) => ({
    action: 'import',
    project,
    source,
    conflict: 'skip',
    path: src,
  });
  const snapshot = async () => [
    await exists(join(projects.a, '.dsh')),
    await exists(join(projects.b, '.dsh')),
    await exists(join(root, 'global')),
  ];
  const bad = [
    ['create', create(a, `project-dsh:${b}`)],
    ['create global source', create(a, 'user-dsh')],
    ['create unregistered', create('nope', 'project-dsh:nope')],
    ['upload', upload(a, `project-dsh:${b}`)],
    ['upload global source', upload(a, 'user-dsh')],
    ['upload unregistered', upload('nope', 'project-dsh:nope')],
    ['import', imp(a, `project-dsh:${b}`)],
    ['import global source', imp(a, 'user-dsh')],
    ['import unregistered', imp('nope', 'project-dsh:nope')],
    ['project source without project', create(undefined, `project-dsh:${a}`)],
    [
      'upload project source without project',
      upload(undefined, `project-dsh:${a}`),
    ],
  ];
  for (const [label, body] of bad) {
    const r = await post(body);
    assert.ok([403, 404].includes(r.status), `${label}: ${r.status}`);
  }
  assert.deepEqual(await snapshot(), [false, false, false]);
  // Real scoped operations.
  const made = await post(create(a, `project-dsh:${a}`));
  assert.equal(made.status, 200);
  assert.equal((await post(upload(b, `project-dsh:${b}`))).status, 200);
  assert.equal((await post(imp(a, `project-dsh:${a}`))).status, 200);
  assert.ok(
    await exists(join(projects.a, '.dsh', 'skills', 'made', 'SKILL.md')),
  );
  assert.ok(
    await exists(join(projects.a, '.dsh', 'skills', 'imp', 'SKILL.md')),
  );
  assert.ok(await exists(join(projects.b, '.dsh', 'skills', 'up', 'SKILL.md')));
  assert.ok(!(await exists(join(projects.b, '.dsh', 'skills', 'made'))));
  assert.ok(!(await exists(join(projects.a, '.dsh', 'skills', 'up'))));
  assert.ok(!(await exists(join(root, 'global'))));
  // Trash: mismatched project/source/copy are rejected without moving bytes.
  const madePath = join(projects.a, '.dsh', 'skills', 'made', 'SKILL.md');
  for (const body of [
    { action: 'trash', project: b, source: `project-dsh:${b}`, id: madePath },
    { action: 'trash', project: a, source: `project-dsh:${b}`, id: madePath },
    { action: 'trash', project: a, source: 'user-dsh', id: madePath },
    {
      action: 'trash',
      project: 'nope',
      source: 'project-dsh:nope',
      id: madePath,
    },
    { action: 'trash', source: `project-dsh:${a}`, id: madePath },
  ]) {
    const r = await post(body);
    assert.ok([403, 404].includes(r.status), JSON.stringify(body) + r.status);
  }
  assert.ok(await exists(madePath));
  const trashed = await post({
    action: 'trash',
    project: a,
    source: `project-dsh:${a}`,
    id: madePath,
  });
  assert.equal(trashed.status, 200);
  assert.ok(!(await exists(join(projects.a, '.dsh', 'skills', 'made'))));
  const item = trashed.body.trash.find((x) => x.scope === a);
  // Restore/delete with a mismatched project must not touch the copy.
  for (const action of ['trash-restore', 'trash-delete']) {
    for (const project of [b, 'nope']) {
      const r = await post({ action, project, id: item.id, confirm: true });
      assert.ok(
        [403, 404, 409].includes(r.status),
        `${action} ${project} ${r.status}`,
      );
    }
  }
  assert.ok(!(await exists(join(projects.a, '.dsh', 'skills', 'made'))));
  assert.ok(!(await exists(join(projects.b, '.dsh', 'skills', 'made'))));
  assert.equal(
    (await post({ action: 'list' })).body.trash.some((x) => x.id === item.id),
    true,
  );
  // Matching project restores into the exact project origin.
  const restored = await post({
    action: 'trash-restore',
    project: a,
    id: item.id,
  });
  assert.equal(restored.status, 200);
  assert.ok(await exists(madePath));
  assert.deepEqual((await readdir(join(projects.b, '.dsh', 'skills'))).sort(), [
    'up',
  ]);
});

test('trash restore and delete refuse an item whose project was unregistered', async (t) => {
  const { projects, ids, post, registered } = await fixture(t);
  const a = ids.a;
  await post({
    action: 'create',
    project: a,
    source: `project-dsh:${a}`,
    name: 'gone',
    description: 'D',
    body: 'Body',
  });
  const path = join(projects.a, '.dsh', 'skills', 'gone', 'SKILL.md');
  const trashed = await post({
    action: 'trash',
    project: a,
    source: `project-dsh:${a}`,
    id: path,
  });
  const id = trashed.body.trash[0].id;
  registered.shift();
  for (const action of ['trash-restore', 'trash-delete']) {
    const r = await post({ action, id, confirm: true });
    assert.equal(r.status, 404, action);
    assert.equal(r.body.code, 'project-unregistered');
  }
  assert.ok(!(await exists(join(projects.a, '.dsh', 'skills', 'gone'))));
  assert.equal(await readFile(path, 'utf8').catch(() => 'absent'), 'absent');
});
