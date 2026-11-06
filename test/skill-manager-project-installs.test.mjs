// #156 project-scoped repository and catalog installs through the registered host route.
// Local only: temp projects, a local git repository and a 127.0.0.1 catalog stub. No real network.
import assert from 'node:assert/strict';
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { zipSync } from 'fflate';
import { apply } from '../dist/skills.js';
import {
  archiveServer,
  gitCommit,
  gitRepo,
  skillDoc,
} from './skill-manager-repos-fixtures.mjs';

const exists = (path) =>
  lstat(path).then(
    () => true,
    () => false,
  );

/** `existing` restarts a host over the same root; `registered` is the live (mutable) workspace registry. */
async function fixture(t, existing) {
  const server = await archiveServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/api/v1/download') {
      res.writeHead(200, { 'content-type': 'application/zip' });
      return res.end(
        Buffer.from(
          zipSync({
            'SKILL.md': Buffer.from(skillDoc('cat', 'Catalog skill')),
          }),
        ),
      );
    }
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end('{}');
  });
  t.after(() => server.close());
  const root =
    existing?.root ??
    (await realpath(await mkdtemp(join(tmpdir(), 'waycraft-proj-inst-'))));
  if (!existing) t.after(() => rm(root, { recursive: true, force: true }));
  const projects = { a: join(root, 'a'), b: join(root, 'b') };
  for (const dir of Object.values(projects))
    await mkdir(join(dir, '.git'), { recursive: true });
  const registered = existing?.registered ?? [projects.a, projects.b];
  // `registry.failing` simulates a workspace registry read error.
  const registry = { failing: false };
  let route;
  const stops = [];
  apply(
    {
      skills: { registerProvider: () => () => {} },
      effect: (fn) => stops.push(fn()),
      get(name) {
        if (name === 'workspaceRegistry')
          return {
            list: () => {
              if (registry.failing) throw new Error('registry down');
              return registered.map((path) => ({ path }));
            },
          };
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
      sources: [
        { id: 'user-dsh', path: join(root, 'global') },
        { id: 'user-agents', path: join(root, 'agents') },
      ],
      statePath: join(root, 'state', 'state.json'),
      repositories: { allowPrivateHosts: true },
      catalogs: {
        allowPrivateHosts: true,
        clawhubBase: server.url,
        skillsShBase: server.url,
      },
    },
  );
  const stop = async () => {
    for (const fn of stops.splice(0).reverse()) await fn?.();
  };
  t.after(stop);
  const send = async (body) => {
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
  const listed = await send({ action: 'list' });
  const ids = Object.fromEntries(
    listed.body.projects.map((p) => [p.name, p.id]),
  );
  return { root, projects, registered, ids, send, stop, registry };
}

async function repoFixture(t) {
  const f = await fixture(t);
  const source = join(f.root, 'upstream');
  await gitRepo(source, {
    'skills/alpha/SKILL.md': skillDoc('alpha'),
    'skills/alpha/notes.md': 'v1 notes',
  });
  const added = await f.send({
    action: 'repo-add',
    repository: { url: source, ref: 'main', subdirectory: 'skills' },
  });
  assert.equal(added.status, 200, JSON.stringify(added.body));
  const entry = added.body.repositories[0];
  const install = (extra) =>
    f.send({
      action: 'repo-install',
      id: entry.id,
      path: 'alpha',
      snapshot: entry.fingerprint,
      ...extra,
    });
  const inProject = (name) =>
    install({ project: f.ids[name], source: `project-dsh:${f.ids[name]}` });
  const records = async () =>
    (await f.send({ action: 'list' })).body.repoInstalls;
  const dir = (name) => join(f.projects[name], '.dsh', 'skills', 'alpha');
  return { ...f, source, entry, install, inProject, records, dir };
}
const claw = { catalog: 'clawhub', owner: 'acme', slug: 'cat' };

test('repository install: registered projects each get an isolated DSH copy; destination and project are validated server-side', async (t) => {
  const f = await repoFixture(t);
  const a = await f.inProject('a');
  assert.equal(a.status, 200, JSON.stringify(a.body));
  assert.equal(
    await readFile(join(f.dir('a'), 'SKILL.md'), 'utf8'),
    skillDoc('alpha'),
  );
  const [record] = a.body.repoInstalls;
  assert.equal(record.scope, 'project');
  assert.equal(record.project, f.ids.a);
  assert.equal(record.source, `project-dsh:${f.ids.a}`);
  assert.equal(record.root, join(f.projects.a, '.dsh', 'skills'));
  assert.equal(record.status, 'installed');
  // The same skill in the second project, the user scope and Shared Agents: four independent copies.
  assert.equal((await f.inProject('b')).status, 200);
  assert.equal((await f.install({})).status, 200);
  assert.equal((await f.install({ source: 'user-agents' })).status, 200);
  const all = await f.records();
  assert.equal(all.length, 4);
  assert.deepEqual(all.map((r) => r.scope).sort(), [
    'project',
    'project',
    'user',
    'user',
  ]);
  // Same destination twice: refused, nothing overwritten.
  assert.equal((await f.inProject('a')).body.code, 'repo-conflict');
  // Mismatched / forged / unregistered selectors never write anywhere.
  await rm(f.dir('b'), { recursive: true });
  const bad = [
    { project: f.ids.a, source: `project-dsh:${f.ids.b}` },
    { project: f.ids.b, source: 'user-dsh' },
    { project: f.ids.b, source: 'user-agents' },
    { source: `project-dsh:${f.ids.b}` },
    { project: f.ids.b, source: 'project-agents:' + f.ids.b },
  ];
  for (const extra of bad) {
    const r = await f.install(extra);
    assert.equal(r.status, 403, JSON.stringify(extra));
    assert.equal(r.body.code, 'create-readonly');
  }
  assert.equal(await exists(f.dir('b')), false);
  for (const project of ['0'.repeat(16), '../x', join(f.projects.b)]) {
    const r = await f.install({ project, source: `project-dsh:${project}` });
    assert.equal(r.status, 404, String(project));
    assert.equal(r.body.code, 'project-unregistered');
  }
  assert.equal(
    (await f.install({ project: 7, source: 'project-dsh:7' })).status,
    400,
  );
  assert.equal(await exists(f.dir('b')), false);
  // Per-skill listing shows where each copy lives and blocks only those destinations.
  const view = (await f.send({ action: 'list' })).body.repositories[0]
    .skills[0];
  assert.ok(view.installedIn.includes(`project-dsh:${f.ids.a}`));
  // Project destinations are checked by the install itself (the registry is re-read), not listed as conflicts.
  assert.ok(!view.conflicts.includes(`project-dsh:${f.ids.a}`));
  assert.deepEqual(view.conflicts, []);
});

test('repository uninstall, restore, update and rollback stay inside the copy scope with no global fallback', async (t) => {
  const f = await repoFixture(t);
  await f.inProject('a');
  await f.inProject('b');
  await f.install({});
  const rows = await f.records();
  const rowOf = (project) => rows.find((r) => r.project === project);
  const ra = rowOf(f.ids.a);
  const rb = rowOf(f.ids.b);
  const rg = rows.find((r) => r.project === undefined);
  // Cross-scope attempts are rejected before touching any disk.
  const attempts = [
    ['repo-uninstall', ra, { project: f.ids.b }],
    ['repo-uninstall', ra, {}],
    ['repo-uninstall', rg, { project: f.ids.a }],
    ['repo-update-preview', ra, {}],
    ['repo-rollback-preview', rb, { project: f.ids.a }],
    ['repo-update-preview', rg, { project: f.ids.a }],
  ];
  for (const [action, row, extra] of attempts) {
    const r = await f.send({ action, installId: row.id, ...extra });
    assert.equal(r.status, 409, `${action} ${JSON.stringify(extra)}`);
    assert.equal(r.body.code, 'project-mismatch');
  }
  for (const name of ['a', 'b']) assert.ok(await exists(f.dir(name)));
  assert.ok(await exists(join(f.root, 'global', 'alpha')));
  // An upstream change is applied only to the selected project copy.
  await gitCommit(f.source, { 'skills/alpha/notes.md': 'v2 notes' });
  assert.equal(
    (await f.send({ action: 'repo-refresh', id: f.entry.id })).status,
    200,
  );
  const preview = await f.send({
    action: 'repo-update-preview',
    installId: ra.id,
    project: f.ids.a,
  });
  assert.equal(preview.status, 200, JSON.stringify(preview.body));
  const p = preview.body.result;
  const apply = (kind, extra) =>
    f.send({
      action: `repo-${kind}`,
      installId: ra.id,
      current: p.current,
      target: p.target.digest,
      snapshot: p.snapshot,
      ...extra,
    });
  assert.equal((await apply('update', {})).body.code, 'project-mismatch');
  assert.equal(
    (await apply('update', { project: f.ids.b })).body.code,
    'project-mismatch',
  );
  assert.equal(
    await readFile(join(f.dir('a'), 'notes.md'), 'utf8'),
    'v1 notes',
  );
  const done = await apply('update', { project: f.ids.a });
  assert.equal(done.status, 200, JSON.stringify(done.body));
  assert.equal(
    await readFile(join(f.dir('a'), 'notes.md'), 'utf8'),
    'v2 notes',
  );
  assert.equal(
    await readFile(join(f.dir('b'), 'notes.md'), 'utf8'),
    'v1 notes',
  );
  assert.equal(
    await readFile(join(f.root, 'global', 'alpha', 'notes.md'), 'utf8'),
    'v1 notes',
  );
  const rp = (
    await f.send({
      action: 'repo-rollback-preview',
      installId: ra.id,
      project: f.ids.a,
    })
  ).body.result;
  const back = await f.send({
    action: 'repo-rollback',
    installId: ra.id,
    project: f.ids.a,
    current: rp.current,
    target: rp.target.digest,
    snapshot: rp.snapshot,
  });
  assert.equal(back.status, 200, JSON.stringify(back.body));
  assert.equal(
    await readFile(join(f.dir('a'), 'notes.md'), 'utf8'),
    'v1 notes',
  );
  // Exact uninstall: only project a moves to Trash, scoped to that project; restore relinks it.
  const removed = await f.send({
    action: 'repo-uninstall',
    installId: ra.id,
    project: f.ids.a,
  });
  assert.equal(removed.status, 200, JSON.stringify(removed.body));
  assert.equal(await exists(f.dir('a')), false);
  assert.ok(await exists(f.dir('b')));
  assert.ok(await exists(join(f.root, 'global', 'alpha')));
  const trashed = removed.body.trash[0];
  assert.equal(trashed.scope, f.ids.a);
  assert.equal(
    removed.body.repoInstalls.find((r) => r.id === ra.id).status,
    'trashed',
  );
  const wrong = await f.send({
    action: 'trash-restore',
    id: trashed.id,
    project: f.ids.b,
  });
  assert.equal(wrong.body.code, 'project-mismatch');
  const restored = await f.send({
    action: 'trash-restore',
    id: trashed.id,
    project: f.ids.a,
  });
  assert.equal(restored.status, 200, JSON.stringify(restored.body));
  assert.ok(await exists(f.dir('a')));
  assert.equal(
    restored.body.repoInstalls.find((r) => r.id === ra.id).status,
    'installed',
  );
  // The generic Trash button of a project copy keeps provenance; permanent delete forgets it.
  const generic = await f.send({
    action: 'trash',
    project: f.ids.a,
    source: `project-dsh:${f.ids.a}`,
    id: join(f.dir('a'), 'SKILL.md'),
  });
  assert.equal(generic.status, 200, JSON.stringify(generic.body));
  assert.equal(
    generic.body.repoInstalls.find((r) => r.id === ra.id).status,
    'trashed',
  );
  const purged = await f.send({
    action: 'trash-delete',
    project: f.ids.a,
    id: generic.body.trash[0].id,
    confirm: true,
  });
  assert.equal(purged.status, 200, JSON.stringify(purged.body));
  assert.equal(
    purged.body.repoInstalls.some((r) => r.id === ra.id),
    false,
  );
  assert.equal(purged.body.repoInstalls.length, 2);
});

test('a project that leaves the registry is unavailable: no disk access, no global fallback, records can be forgotten', async (t) => {
  const f = await repoFixture(t);
  await f.inProject('a');
  await f.inProject('b');
  const rows = await f.records();
  const rb = rows.find((r) => r.project === f.ids.b);
  f.registered.splice(f.registered.indexOf(f.projects.b), 1);
  const after = await f.records();
  assert.equal(after.find((r) => r.id === rb.id).status, 'invalid-root');
  assert.equal(after.find((r) => r.project === f.ids.a).status, 'installed');
  // Every action on the vanished project is a safe error; its files are untouched.
  for (const action of [
    'repo-uninstall',
    'repo-update-preview',
    'repo-rollback-preview',
  ]) {
    const r = await f.send({ action, installId: rb.id, project: f.ids.b });
    assert.equal(r.status, 404, action);
    assert.equal(r.body.code, 'project-unregistered');
  }
  assert.equal(
    (await f.install({ project: f.ids.b, source: `project-dsh:${f.ids.b}` }))
      .status,
    404,
  );
  // Without the project selector the global scope still refuses (mismatch), never falling back.
  assert.equal(
    (await f.send({ action: 'repo-uninstall', installId: rb.id })).body.code,
    'project-mismatch',
  );
  assert.ok(await exists(f.dir('b')));
  // Forget is record-only and works while the project is unregistered, never against an available root.
  assert.equal(
    (await f.send({ action: 'repo-forget', installId: rb.id })).body.code,
    'project-mismatch',
  );
  const live = rows.find((r) => r.project === f.ids.a);
  assert.equal(
    (
      await f.send({
        action: 'repo-forget',
        installId: live.id,
        project: f.ids.a,
      })
    ).body.code,
    'repo-root-valid',
  );
  const forgot = await f.send({
    action: 'repo-forget',
    installId: rb.id,
    project: f.ids.b,
  });
  assert.equal(forgot.status, 200, JSON.stringify(forgot.body));
  assert.equal(forgot.body.repoInstalls.length, 1);
  assert.ok(await exists(f.dir('b')), 'forget never deletes files');
});

test('state survives a restart; a project registered again is available; hostile project identities invalidate state', async (t) => {
  const f = await repoFixture(t);
  await f.inProject('a');
  await f.install({});
  await f.stop();
  const again = await fixture(t, { root: f.root, registered: [f.projects.a] });
  const rows = (await again.send({ action: 'list' })).body.repoInstalls;
  assert.equal(rows.length, 2);
  assert.equal(rows.find((r) => r.project).status, 'installed');
  assert.equal(rows.find((r) => !r.project).scope, 'user');
  await again.stop();
  // Project removed across the restart: shown unavailable, still listed.
  const gone = await fixture(t, { root: f.root, registered: [] });
  const after = (await gone.send({ action: 'list' })).body;
  assert.equal(after.repoError, undefined);
  assert.equal(
    after.repoInstalls.find((r) => r.project).status,
    'invalid-root',
  );
  await gone.stop();
  // A record whose project and source disagree (or is not a 16-hex id) is invalid state, not trusted.
  const file = join(f.root, 'state', 'repositories.json');
  const original = await readFile(file, 'utf8');
  for (const edit of [
    (r) => (r.project = '../../etc'),
    (r) => (r.source = 'project-dsh:' + '0'.repeat(16)),
    (r) => (r.scope = 'user'),
    (r) => delete r.project,
    // A consistent forged pair is still not a 16-hex project id.
    (r) => {
      r.project = '../../etc';
      r.source = 'project-dsh:../../etc';
    },
    // A user-scope record must not carry a project selector, even with a user source.
    (r) => {
      r.scope = 'user';
      r.source = 'user-dsh';
    },
  ]) {
    const state = JSON.parse(original);
    edit(state.installs.find((r) => r.project));
    await writeFile(file, JSON.stringify(state));
    const bad = await fixture(t, { root: f.root, registered: [f.projects.a] });
    assert.equal(
      (await bad.send({ action: 'list' })).body.repoError,
      'repo-state-invalid',
    );
    await bad.stop();
  }
});

test('catalog install: registered projects hold independent copies; uninstall, forget and trash stay in scope', async (t) => {
  const f = await fixture(t);
  const install = (extra) =>
    f.send({ action: 'catalog-install', skill: claw, confirm: true, ...extra });
  const inProject = (n) =>
    install({
      project: f.ids[n],
      source: undefined,
      destination: `project-dsh:${f.ids[n]}`,
    });
  const a = await inProject('a');
  assert.equal(a.status, 200, JSON.stringify(a.body));
  const dir = (n) => join(f.projects[n], '.dsh', 'skills', 'cat');
  assert.ok(await exists(dir('a')));
  const [row] = a.body.catalogInstalls;
  assert.equal(row.scope, 'project');
  assert.equal(row.project, f.ids.a);
  assert.equal(row.status, 'installed');
  assert.equal((await inProject('b')).status, 200);
  assert.equal((await install({ destination: 'user-dsh' })).status, 200);
  assert.equal((await inProject('a')).body.code, 'repo-conflict');
  // Forged destination/project pairs and unregistered projects.
  for (const extra of [
    { project: f.ids.a, destination: `project-dsh:${f.ids.b}` },
    { project: f.ids.a, destination: 'user-dsh' },
    { destination: `project-dsh:${f.ids.a}` },
  ]) {
    const r = await install(extra);
    assert.equal(r.status, 403, JSON.stringify(extra));
    assert.equal(r.body.code, 'create-readonly');
  }
  const unreg = await install({
    project: '1'.repeat(16),
    destination: `project-dsh:${'1'.repeat(16)}`,
  });
  assert.equal(unreg.body.code, 'project-unregistered');
  const rows = (await f.send({ action: 'list' })).body.catalogInstalls;
  assert.equal(rows.length, 3);
  const ra = rows.find((r) => r.project === f.ids.a);
  const rg = rows.find((r) => !r.project);
  for (const [id, extra] of [
    [ra.id, { project: f.ids.b }],
    [ra.id, {}],
    [rg.id, { project: f.ids.a }],
  ]) {
    const r = await f.send({
      action: 'catalog-uninstall',
      installId: id,
      ...extra,
    });
    assert.equal(r.body.code, 'project-mismatch');
  }
  assert.ok(await exists(dir('a')));
  const un = await f.send({
    action: 'catalog-uninstall',
    installId: ra.id,
    project: f.ids.a,
  });
  assert.equal(un.status, 200, JSON.stringify(un.body));
  assert.equal(await exists(dir('a')), false);
  assert.ok(await exists(dir('b')));
  assert.ok(await exists(join(f.root, 'global', 'cat')));
  assert.equal(un.body.trash[0].scope, f.ids.a);
  const back = await f.send({
    action: 'trash-restore',
    id: un.body.trash[0].id,
    project: f.ids.a,
  });
  assert.equal(back.status, 200, JSON.stringify(back.body));
  assert.equal(
    back.body.catalogInstalls.find((r) => r.id === ra.id).status,
    'installed',
  );
  // Project b leaves the registry: unavailable, never acted on, forgettable record-only.
  const rbRow = rows.find((r) => r.project === f.ids.b);
  f.registered.splice(f.registered.indexOf(f.projects.b), 1);
  const listed = (await f.send({ action: 'list' })).body.catalogInstalls;
  assert.equal(listed.find((r) => r.id === rbRow.id).status, 'invalid-root');
  const forced = await f.send({
    action: 'catalog-uninstall',
    installId: rbRow.id,
    project: f.ids.b,
  });
  assert.equal(forced.body.code, 'project-unregistered');
  assert.equal(
    (await f.send({ action: 'catalog-forget', installId: rbRow.id })).body.code,
    'project-mismatch',
  );
  const forgot = await f.send({
    action: 'catalog-forget',
    installId: rbRow.id,
    project: f.ids.b,
  });
  assert.equal(forgot.status, 200, JSON.stringify(forgot.body));
  assert.equal(forgot.body.catalogInstalls.length, 2);
  assert.ok(await exists(dir('b')));
  assert.deepEqual((await readdir(f.projects.b)).sort(), ['.dsh', '.git']);
});

test('project skill folders that resolve outside the project are refused as destinations', async (t) => {
  const f = await repoFixture(t);
  const outside = join(f.root, 'outside');
  await mkdir(outside, { recursive: true });
  await mkdir(join(f.projects.a, '.dsh'), { recursive: true });
  const { symlink } = await import('node:fs/promises');
  await symlink(outside, join(f.projects.a, '.dsh', 'skills'));
  const r = await f.inProject('a');
  assert.equal(r.status, 403, JSON.stringify(r.body));
  assert.deepEqual(await readdir(outside), []);
});

test('a registry read failure fails closed: no project destination resolves and nothing is written', async (t) => {
  const f = await repoFixture(t);
  assert.equal((await f.inProject('a')).status, 200);
  f.registry.failing = true;
  const blocked = await f.inProject('b');
  assert.equal(blocked.status, 403, JSON.stringify(blocked.body));
  assert.equal(blocked.body.code, 'create-readonly');
  assert.equal(await exists(f.dir('b')), false);
  const catalog = await f.send({
    action: 'catalog-install',
    skill: claw,
    confirm: true,
    project: f.ids.b,
    destination: `project-dsh:${f.ids.b}`,
  });
  assert.equal(catalog.status, 403, JSON.stringify(catalog.body));
  assert.equal(await exists(join(f.projects.b, '.dsh')), false);
  // User destinations keep working; the registry returning restores project installs.
  assert.equal((await f.install({})).status, 200);
  f.registry.failing = false;
  assert.equal((await f.inProject('b')).status, 200);
});
