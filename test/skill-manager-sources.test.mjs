import assert from 'node:assert/strict';
import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { apply } from '../dist/skills.js';

// Symlink, permission and long-path cases rely on POSIX behavior and are skipped on Windows.
const posix = process.platform === 'win32' ? { skip: 'POSIX-only' } : {};
const unprivileged =
  process.platform === 'win32' || process.getuid?.() === 0
    ? { skip: 'needs a non-root POSIX user (chmod 000 must deny reads)' }
    : {};

const doc = (name, extra = '', body = 'Body') =>
  `---\nname: ${name}\ndescription: Example ${name}\n${extra}---\n${body}`;
const skill = async (root, dir, text) => {
  await mkdir(join(root, dir), { recursive: true });
  await writeFile(join(root, dir, 'SKILL.md'), text);
};

/** Real built Component behind a fake Host: registered route, provider and workspace registry. */
async function harness(t, { sources, workspaces = [], statePath } = {}) {
  const root = await realpath(
    await mkdtemp(join(tmpdir(), 'waycraft-sources-')),
  );
  t.after(() => rm(root, { recursive: true, force: true }));
  const state = statePath ?? join(root, 'state', 'state.json');
  // mode: 'ok' lists workspaces; 'missing' has no registry service; 'throw' makes list() fail.
  const registry = { workspaces: workspaces.map((p) => p(root)), mode: 'ok' };
  const boot = () => {
    let provider;
    let route;
    const stops = [];
    const controller = new AbortController();
    const ctx = {
      skills: {
        registerProvider(create) {
          provider = create({ signal: controller.signal, invalidate() {} });
          return () => controller.abort();
        },
      },
      effect(start) {
        stops.push(start());
      },
      inject(_names, callback) {
        callback(ctx);
      },
      get(name) {
        if (name === 'connection')
          return {
            fetch: {
              register(value) {
                route = value;
                return () => {
                  route = undefined;
                };
              },
            },
          };
        if (name === 'workspaceRegistry' && registry.mode !== 'missing')
          return {
            list: () => {
              if (registry.mode === 'throw') throw new Error('registry down');
              return registry.workspaces.map((path) => ({ path }));
            },
          };
      },
    };
    apply(ctx, { sources: sources?.(root) ?? [], statePath: state });
    const post = (body, headers = {}, signal) =>
      route.fetch(
        new Request('http://localhost/api/majed-skills.catalog', {
          method: 'POST',
          signal,
          headers: {
            'content-type': 'application/json',
            'x-majed-skills': '1',
            ...headers,
          },
          body: JSON.stringify(body),
        }),
      );
    return {
      post,
      get provider() {
        return provider;
      },
      stop: async () => {
        for (const stop of stops.splice(0)) await stop();
      },
    };
  };
  const first = boot();
  t.after(() => first.stop());
  return { root, state, registry, boot, ...first };
}

const json = async (response) => response.json();

async function tree(path) {
  const out = [];
  const walk = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      out.push(
        `${full}:${entry.isDirectory() ? 'd' : await readFile(full, 'utf8').catch(() => 'l')}`,
      );
      if (entry.isDirectory()) await walk(full);
    }
  };
  await walk(path);
  return out.sort();
}

test('scanning a product folder previews candidates two levels deep and registers nothing', async (t) => {
  const h = await harness(t, {
    sources: (r) => [{ id: 'base', path: join(r, 'base') }],
  });
  const product = join(h.root, 'acme');
  await skill(join(product, 'skills'), 'one', doc('one'));
  await skill(join(product, 'profiles', 'work', 'skills'), 'two', doc('two'));
  await skill(
    join(product, 'profiles', 'home', 'skills'),
    'three',
    doc('three'),
  );
  await mkdir(join(product, '.hidden', 'skills'), { recursive: true });
  await mkdir(join(product, 'node_modules', 'skills'), { recursive: true });
  await mkdir(join(product, 'a', 'b', 'c', 'skills'), { recursive: true });
  const outside = join(h.root, 'outside', 'skills');
  await skill(outside, 'leak', doc('leak'));
  await symlink(join(h.root, 'outside'), join(product, 'linked'));
  await mkdir(join(h.root, 'base'), { recursive: true });
  const before = await tree(h.root);
  const scan = await json(
    await h.post({ action: 'custom-scan', path: product }),
  );
  assert.deepEqual(
    scan.candidates.map((c) => [
      c.label,
      c.depth,
      c.skillCount,
      c.conflict,
      c.registered,
    ]),
    // Candidates are ordered by path, never by directory-listing order.
    [
      ['acme / profiles / home', 2, 1, false, false],
      ['acme / profiles / work', 2, 1, false, false],
      ['acme', 0, 1, false, false],
    ],
  );
  assert.equal(scan.candidates[2].group, 'acme');
  assert.equal(scan.truncated, false);
  assert.deepEqual(await tree(h.root), before);
  const list = await json(await h.post({ action: 'list' }));
  assert.deepEqual(
    list.sources.map((s) => s.id),
    ['base'],
  );
});

test('custom sources are added, grouped, ranked after built-ins, persisted and survive re-entry', async (t) => {
  const h = await harness(t, {
    sources: (r) => [{ id: 'base', path: join(r, 'base') }],
  });
  await skill(join(h.root, 'base'), 'shared', doc('shared'));
  const mine = join(h.root, 'mine');
  await skill(mine, 'shared', doc('shared'));
  await skill(mine, 'own', doc('own'));
  const added = await json(
    await h.post({
      action: 'custom-add',
      items: [{ path: mine, label: 'My Agent', group: 'Mine' }],
    }),
  );
  assert.deepEqual(
    added.results.map((r) => [r.status, r.id]),
    [['added', 'custom:my-agent']],
  );
  const source = added.sources.find((s) => s.id === 'custom:my-agent');
  assert.equal(source.label, 'My Agent');
  assert.equal(source.group, 'Mine');
  assert.equal(source.custom, true);
  assert.equal(source.path, mine);
  assert.deepEqual(
    added.copies
      .filter((c) => c.name === 'shared')
      .map((c) => [c.source, !!c.shadowedBy]),
    [
      ['base', false],
      ['custom:my-agent', true],
    ],
  );
  const saved = JSON.parse(await readFile(h.state, 'utf8'));
  assert.deepEqual(saved.customSources, [
    { id: 'custom:my-agent', label: 'My Agent', path: mine, group: 'Mine' },
  ]);
  await h.stop();
  const second = h.boot();
  t.after(() => second.stop());
  const again = await json(await second.post({ action: 'list' }));
  assert.deepEqual(
    again.sources.map((s) => s.id),
    ['base', 'custom:my-agent'],
  );
});

test(
  'server-side path validation rejects unsafe custom source folders',
  posix,
  async (t) => {
    const h = await harness(t, {
      sources: (r) => [{ id: 'base', path: join(r, 'base') }],
    });
    await skill(join(h.root, 'base'), 'x', doc('x'));
    const file = join(h.root, 'file.txt');
    await writeFile(file, 'x');
    const link = join(h.root, 'link-to-base');
    await symlink(join(h.root, 'base'), link);
    await skill(join(h.root, 'ok'), 'y', doc('y'));
    await mkdir(join(h.root, 'base', 'nested'), { recursive: true });
    const cases = [
      ['relative/path', 'root-not-absolute'],
      ['', 'root-not-absolute'],
      [join(h.root, 'missing'), 'root-not-found'],
      [file, 'root-not-directory'],
      [`/${'a'.repeat(1030)}`, 'root-too-long'],
      [join(h.root, 'base'), 'root-overlap'],
      [join(h.root, 'base', 'nested'), 'root-overlap'],
      [h.root, 'root-reserved'],
      [link, 'root-overlap'],
      [join(h.root, 'state'), 'root-reserved'],
    ];
    await mkdir(join(h.root, 'state'), { recursive: true });
    for (const [path, code] of cases) {
      const response = await h.post({
        action: 'custom-add',
        items: [{ path }],
      });
      const body = await json(response);
      assert.equal(response.status, 200, path);
      assert.deepEqual(
        [body.results[0].status, body.results[0].code],
        ['rejected', code],
        path,
      );
    }
    const ok = await json(
      await h.post({
        action: 'custom-add',
        items: [{ path: join(h.root, 'ok') }],
      }),
    );
    assert.deepEqual(
      ok.results.map((r) => [r.status, r.id]),
      [['added', 'custom:ok']],
    );
    assert.equal(ok.sources.find((s) => s.id === 'custom:ok').label, 'ok');
    // The same folder (also through a link) is idempotent and never duplicated.
    await symlink(join(h.root, 'ok'), join(h.root, 'ok-link'));
    const dup = await json(
      await h.post({
        action: 'custom-add',
        items: [{ path: join(h.root, 'ok-link') }],
      }),
    );
    assert.equal(dup.results[0].status, 'registered');
    assert.equal(dup.sources.filter((s) => s.custom).length, 1);
    // Overlap with an existing custom source (nested and containing) is rejected too.
    await mkdir(join(h.root, 'ok', 'deeper'));
    const nested = await json(
      await h.post({
        action: 'custom-add',
        items: [{ path: join(h.root, 'ok', 'deeper') }],
      }),
    );
    assert.equal(nested.results[0].code, 'root-overlap');
    const label = await json(
      await h.post({
        action: 'custom-add',
        items: [{ path: join(h.root, 'state'), label: 'x'.repeat(49) }],
      }),
    );
    assert.equal(label.results[0].code, 'custom-label');
  },
);

test('malformed custom requests are rejected and mutation needs the marker', async (t) => {
  const h = await harness(t);
  for (const body of [
    { action: 'custom-add' },
    { action: 'custom-add', items: 'x' },
    { action: 'custom-add', items: [] },
    { action: 'custom-add', items: [1] },
    { action: 'custom-update', id: 'custom:a' },
    { action: 'custom-remove', id: 7 },
  ])
    assert.equal((await h.post(body)).status, 400, JSON.stringify(body));
  for (const action of [
    'custom-scan',
    'custom-add',
    'custom-update',
    'custom-remove',
  ])
    assert.equal(
      (
        await h.post(
          { action, path: h.root, items: [{ path: h.root }], id: 'custom:a' },
          { 'x-majed-skills': '' },
        )
      ).status,
      403,
      action,
    );
});

test('custom sources are limited to 32 and the 33rd is reported', async (t) => {
  const h = await harness(t);
  const items = [];
  for (let i = 0; i < 33; i++) {
    const path = join(h.root, `s${i}`);
    await mkdir(path);
    items.push({ path, label: 'Same' });
  }
  const body = await json(await h.post({ action: 'custom-add', items }));
  assert.equal(body.results.filter((r) => r.status === 'added').length, 32);
  assert.equal(body.results[32].code, 'custom-limit');
  assert.equal(new Set(body.sources.map((s) => s.id)).size, 32);
  assert.ok(body.sources.some((s) => s.id === 'custom:same-32'));
});

test('editing a custom source changes label, group and path with the same validation', async (t) => {
  const h = await harness(t, {
    sources: (r) => [{ id: 'base', path: join(r, 'base') }],
  });
  await skill(join(h.root, 'a'), 'one', doc('one'));
  await skill(join(h.root, 'b'), 'two', doc('two'));
  await mkdir(join(h.root, 'base'), { recursive: true });
  await h.post({
    action: 'custom-add',
    items: [{ path: join(h.root, 'a'), label: 'A' }],
  });
  await h.post({
    action: 'custom-add',
    items: [{ path: join(h.root, 'b'), label: 'B' }],
  });
  const edit = (patch) =>
    h.post({ action: 'custom-update', id: 'custom:a', ...patch });
  const ok = await json(
    await edit({ label: 'Renamed', group: 'G', path: join(h.root, 'a') }),
  );
  const a = ok.sources.find((s) => s.id === 'custom:a');
  assert.deepEqual([a.label, a.group], ['Renamed', 'G']);
  const moved = await json(
    await edit({ label: 'Renamed', path: join(h.root, 'b', '..', 'a') }),
  );
  assert.equal(
    moved.sources.find((s) => s.id === 'custom:a').path,
    join(h.root, 'a'),
  );
  assert.equal((await edit({ label: '' })).status, 400);
  assert.equal((await edit({ label: 'x'.repeat(49) })).status, 409);
  const clash = await edit({ label: 'A', path: join(h.root, 'b') });
  assert.equal(clash.status, 409);
  assert.equal((await json(clash)).code, 'root-overlap');
  const base = await edit({ label: 'A', path: join(h.root, 'base') });
  assert.equal(base.status, 409);
  const unknown = await h.post({
    action: 'custom-update',
    id: 'custom:zzz',
    label: 'x',
  });
  assert.equal(unknown.status, 404);
  const builtin = await h.post({
    action: 'custom-update',
    id: 'base',
    label: 'x',
  });
  assert.equal(builtin.status, 404);
  const untouched = JSON.parse(await readFile(h.state, 'utf8')).customSources;
  assert.equal(
    untouched.find((s) => s.id === 'custom:a').path,
    join(h.root, 'a'),
  );
  const cleared = await json(await edit({ label: 'Renamed', group: '' }));
  assert.equal(
    cleared.sources.find((s) => s.id === 'custom:a').group,
    undefined,
  );
});

test('removing a custom source (reset is the same operation) drops only its record and never deletes files', async (t) => {
  const h = await harness(t);
  const mine = join(h.root, 'mine');
  await skill(mine, 'own', doc('own'));
  await h.post({
    action: 'custom-add',
    items: [{ path: mine, label: 'Mine' }],
  });
  const off = await h.post({
    action: 'toggle',
    kind: 'source',
    id: 'custom:mine',
    enabled: false,
  });
  assert.equal(off.status, 200);
  const before = await tree(mine);
  const removed = await json(
    await h.post({ action: 'custom-remove', id: 'custom:mine' }),
  );
  assert.deepEqual(removed.sources, []);
  assert.deepEqual(await tree(mine), before);
  const saved = JSON.parse(await readFile(h.state, 'utf8'));
  assert.deepEqual(saved.customSources, []);
  assert.equal('custom:mine' in saved.sources, false);
  // A different folder that later receives the same slug is not inherited as disabled.
  await skill(join(h.root, 'other'), 'two', doc('two'));
  const again = await json(
    await h.post({
      action: 'custom-add',
      items: [{ path: join(h.root, 'other'), label: 'Mine' }],
    }),
  );
  assert.equal(again.results[0].id, 'custom:mine');
  assert.equal(again.sources[0].enabled, true);
  assert.equal(
    (await h.post({ action: 'custom-remove', id: 'custom:nope' })).status,
    404,
  );
  assert.equal(
    (await h.post({ action: 'custom-remove', id: 'user-dsh' })).status,
    404,
  );
});

test('invalid persisted custom sources fail closed and lock custom mutations', async (t) => {
  const h = await harness(t);
  await mkdir(join(h.root, 'state'), { recursive: true });
  await writeFile(
    h.state,
    JSON.stringify({
      sources: {},
      copies: {},
      customSources: [{ id: 'bad id', label: 'x', path: '/x' }],
    }),
  );
  const second = h.boot();
  t.after(() => second.stop());
  const list = await json(await second.post({ action: 'list' }));
  assert.equal(list.corrupt, true);
  const add = await second.post({
    action: 'custom-add',
    items: [{ path: h.root }],
  });
  assert.equal(add.status, 409);
});

test('same-rank sources resolve by identity, and custom ranks avoid the native custom rank', async (t) => {
  const h = await harness(t, {
    sources: (r) => [
      { id: 'zeta', path: join(r, 'zeta'), rank: 300 },
      { id: 'alpha', path: join(r, 'alpha'), rank: 300 },
    ],
  });
  await skill(join(h.root, 'zeta'), 'example', doc('example'));
  await skill(join(h.root, 'alpha'), 'example', doc('example'));
  const list = await json(await h.post({ action: 'list' }));
  const winner = list.copies.find((c) => !c.shadowedBy);
  assert.equal(winner.source, 'alpha');
  assert.equal(
    list.copies.find((c) => c.source === 'zeta').shadowedBy,
    winner.path,
  );
  const mine = join(h.root, 'mine');
  await skill(mine, 'solo', doc('solo'));
  await h.post({
    action: 'custom-add',
    items: [{ path: mine, label: 'Mine' }],
  });
  await h.post({
    action: 'toggle',
    kind: 'source',
    id: 'custom:mine',
    enabled: false,
  });
  const [overlay] = (await h.provider.list()).filter((c) => c.name === 'solo');
  assert.equal(overlay.rank, 534);
  assert.notEqual(overlay.rank, 300);
  assert.equal(overlay.invocation.modelInvocable, false);
});

// ---- registered projects ------------------------------------------------------------------

async function project(root, name, layout) {
  const dir = join(root, name);
  await mkdir(join(dir, '.git'), { recursive: true });
  for (const [skillsDir, names] of Object.entries(layout))
    for (const skillName of names)
      await skill(join(dir, skillsDir, 'skills'), skillName, doc(skillName));
  return dir;
}
const view = async (h, id, extra = {}) =>
  json(await h.post({ action: 'list', project: id, ...extra }));

test(
  'registered projects list their availability and unavailable ones yield diagnostics',
  unprivileged,
  async (t) => {
    const h = await harness(t);
    const ok = await project(h.root, 'ok', { '.agents': ['a'] });
    const denied = await project(h.root, 'denied', { '.agents': ['a'] });
    await chmod(denied, 0o000);
    try {
      const missing = join(h.root, 'gone');
      h.registry.workspaces.push(ok, missing, denied, 'relative/dir');
      const list = await json(await h.post({ action: 'list' }));
      assert.deepEqual(
        list.projects.map((p) => [p.name, p.available, p.code]),
        [
          ['ok', true, undefined],
          ['gone', false, 'project-missing'],
          ['denied', false, 'project-unreadable'],
          ['dir', false, 'project-unavailable'],
        ],
      );
      assert.equal(new Set(list.projects.map((p) => p.id)).size, 4);
      assert.equal(list.copies.length, 0);
      for (const p of list.projects.slice(1)) {
        const body = await view(h, p.id);
        assert.equal(body.project.available, false);
        assert.equal(body.project.code, p.code);
        assert.deepEqual(body.project.copies, []);
        assert.deepEqual(
          body.project.diagnostics.map((d) => d.code),
          [p.code],
        );
      }
    } finally {
      await chmod(denied, 0o755);
    }
  },
);

test('a selected project discovers agent-specific hidden roots with their own precedence', async (t) => {
  const h = await harness(t);
  const dir = await project(h.root, 'app', {
    '.dsh': ['shared'],
    '.agents': ['shared', 'agents-only'],
    '.claude': ['claude-only'],
    '.github': ['pilot'],
  });
  await mkdir(join(dir, '.codex'));
  h.registry.workspaces.push(dir);
  const [entry] = (await json(await h.post({ action: 'list' }))).projects;
  const body = await view(h, entry.id);
  assert.deepEqual(
    body.project.sources.map((s) => [s.kind, s.rank, s.project]),
    [
      ['dsh', 100, entry.id],
      ['agents', 200, entry.id],
      ['copilot', 210, entry.id],
      ['claude', 230, entry.id],
    ],
  );
  const shared = body.project.copies.filter((c) => c.name === 'shared');
  assert.deepEqual(
    shared.map((c) => [c.source.split(':')[0], !!c.shadowedBy]),
    [
      ['project-dsh', false],
      ['project-agents', true],
    ],
  );
  assert.equal(body.project.copies.length, 5);
  // Global payload and global provider never contain project copies.
  assert.equal(body.copies.length, 0);
  assert.deepEqual(await h.provider.list(), []);
});

test('unregistered or client-supplied project identities are refused without falling back to another scope', async (t) => {
  const h = await harness(t, {
    sources: (r) => [{ id: 'base', path: join(r, 'base') }],
  });
  await skill(join(h.root, 'base'), 'g', doc('g'));
  const dir = await project(h.root, 'app', { '.agents': ['p'] });
  for (const id of ['nope', dir, 'x'.repeat(64), '']) {
    const response = await h.post({ action: 'list', project: id });
    assert.equal(response.status, 404, id);
    assert.equal((await json(response)).code, 'project-unregistered');
  }
  assert.equal((await h.post({ action: 'list', project: 3 })).status, 400);
  // A project path is never a valid global copy id.
  h.registry.workspaces.push(dir);
  const [entry] = (await json(await h.post({ action: 'list' }))).projects;
  const body = await view(h, entry.id);
  const copy = body.project.copies[0];
  assert.equal((await h.post({ action: 'detail', id: copy.path })).status, 404);
  assert.equal(
    (await h.post({ action: 'detail', id: copy.path, project: entry.id }))
      .status,
    200,
  );
  assert.equal(
    (
      await h.post({
        action: 'toggle',
        kind: 'copy',
        id: copy.path,
        enabled: false,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await h.post({
        action: 'toggle',
        kind: 'copy',
        id: join(h.root, 'base', 'g', 'SKILL.md'),
        enabled: false,
        project: entry.id,
      })
    ).status,
    400,
  );
});

test('project policy is isolated from other projects and global state; project DSH has no source switch', async (t) => {
  const h = await harness(t, {
    sources: (r) => [{ id: 'base', path: join(r, 'base') }],
  });
  await skill(join(h.root, 'base'), 'x', doc('x'));
  const a = await project(h.root, 'a', { '.dsh': ['x'], '.agents': ['x'] });
  const b = await project(h.root, 'b', { '.dsh': ['x'], '.agents': ['x'] });
  h.registry.workspaces.push(a, b);
  const {
    projects: [pa, pb],
  } = await json(await h.post({ action: 'list' }));
  const copyA = (await view(h, pa.id)).project.copies.find((c) =>
    c.source.startsWith('project-dsh'),
  );
  const off = await json(
    await h.post({
      action: 'toggle',
      kind: 'copy',
      id: copyA.path,
      enabled: false,
      project: pa.id,
    }),
  );
  assert.equal(
    off.project.copies.find((c) => c.path === copyA.path).eligible,
    false,
  );
  // A's agents copy becomes the fallback winner inside A only.
  assert.equal(
    off.project.copies.filter((c) => c.eligible && !c.shadowedBy).length,
    1,
  );
  const bView = await view(h, pb.id);
  assert.ok(bView.project.copies.every((c) => c.eligible));
  assert.equal(bView.project.copies.filter((c) => !c.shadowedBy).length, 1);
  assert.ok(bView.copies.every((c) => c.eligible));
  assert.equal(
    (await json(await h.post({ action: 'list' }))).copies[0].eligible,
    true,
  );
  // Source switch: project DSH is read-only, other project sources toggle for that project only.
  const dshSource = off.project.sources.find((s) => s.kind === 'dsh');
  const refused = await h.post({
    action: 'toggle',
    kind: 'source',
    id: dshSource.id,
    enabled: false,
    project: pa.id,
  });
  assert.equal(refused.status, 409);
  assert.equal((await json(refused)).code, 'project-dsh-source');
  const agents = off.project.sources.find((s) => s.kind === 'agents');
  const agentsOff = await json(
    await h.post({
      action: 'toggle',
      kind: 'source',
      id: agents.id,
      enabled: false,
      project: pa.id,
    }),
  );
  assert.equal(
    agentsOff.project.sources.find((s) => s.kind === 'agents').enabled,
    false,
  );
  const bAgents = (await view(h, pb.id)).project.sources.find(
    (s) => s.kind === 'agents',
  );
  assert.equal(bAgents.enabled, true);
  assert.notEqual(agents.id, bAgents.id);
  // Global toggles cannot address a project source and vice versa.
  assert.equal(
    (
      await h.post({
        action: 'toggle',
        kind: 'source',
        id: agents.id,
        enabled: true,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await h.post({
        action: 'toggle',
        kind: 'source',
        id: 'base',
        enabled: false,
        project: pa.id,
      })
    ).status,
    400,
  );
});

test('provider overlays follow the working directory project only', async (t) => {
  const h = await harness(t);
  const a = await project(h.root, 'a', { '.agents': ['x'] });
  const b = await project(h.root, 'b', { '.agents': ['x'] });
  const stray = join(h.root, 'stray');
  await skill(join(stray, '.agents', 'skills'), 'x', doc('x'));
  h.registry.workspaces.push(a, b);
  const {
    projects: [pa],
  } = await json(await h.post({ action: 'list' }));
  const copy = (await view(h, pa.id)).project.copies[0];
  await h.post({
    action: 'toggle',
    kind: 'copy',
    id: copy.path,
    enabled: false,
    project: pa.id,
  });
  const forA = await h.provider.list({ cwd: a });
  assert.deepEqual(
    forA.map((c) => [c.name, c.rank, c.invocation.modelInvocable]),
    [['x', 199, false]],
  );
  assert.deepEqual(await h.provider.list({ cwd: b }), []);
  assert.deepEqual(await h.provider.list({ cwd: stray }), []);
  // A cwd that vanished below a registered project keeps that project's deny policy.
  assert.deepEqual(
    (await h.provider.list({ cwd: join(a, 'missing') })).map((c) => c.rank),
    [199],
  );
  assert.deepEqual(await h.provider.list(), []);
  assert.equal((await h.provider.get(forA[0]))?.path, copy.path);
});

test(
  'project skill folders that escape the project or overlap a protected source are skipped with diagnostics',
  posix,
  async (t) => {
    const outside = join(
      await realpath(await mkdtemp(join(tmpdir(), 'waycraft-out-'))),
      'out',
    );
    t.after(() => rm(join(outside, '..'), { recursive: true, force: true }));
    await skill(outside, 'leak', doc('leak'));
    const h = await harness(t, {
      sources: (r) => [{ id: 'base', path: join(r, 'shared-skills') }],
    });
    const dir = await project(h.root, 'app', { '.agents': ['ok'] });
    await mkdir(join(dir, '.claude'));
    await symlink(outside, join(dir, '.claude', 'skills'));
    await mkdir(join(dir, '.codex'));
    await skill(join(h.root, 'shared-skills'), 'g', doc('g'));
    await symlink(join(h.root, 'shared-skills'), join(dir, '.codex', 'skills'));
    h.registry.workspaces.push(dir);
    const [entry] = (await json(await h.post({ action: 'list' }))).projects;
    const body = await view(h, entry.id);
    assert.deepEqual(
      body.project.copies.map((c) => c.name),
      ['ok'],
    );
    assert.deepEqual(body.project.diagnostics.map((d) => d.code).sort(), [
      'project-source-outside',
      'project-source-outside',
    ]);
  },
);

test('custom sources cannot overlap a registered project skills folder', async (t) => {
  const h = await harness(t);
  const dir = await project(h.root, 'app', { '.agents': ['ok'] });
  h.registry.workspaces.push(dir);
  const body = await json(
    await h.post({
      action: 'custom-add',
      items: [{ path: join(dir, '.agents', 'skills') }, { path: dir }],
    }),
  );
  assert.deepEqual(
    body.results.map((r) => r.code),
    ['root-overlap', 'root-overlap'],
  );
});

test(
  'the project overlap diagnostic is reported when two project roots point at the same folder',
  posix,
  async (t) => {
    const h = await harness(t);
    const dir = await project(h.root, 'app', { '.agents': ['ok'] });
    await mkdir(join(dir, '.claude'));
    await symlink(
      join(dir, '.agents', 'skills'),
      join(dir, '.claude', 'skills'),
    );
    h.registry.workspaces.push(dir);
    const [entry] = (await json(await h.post({ action: 'list' }))).projects;
    const body = await view(h, entry.id);
    assert.deepEqual(
      body.project.diagnostics.map((d) => d.code),
      ['project-source-overlap'],
    );
    assert.deepEqual(
      body.project.sources.map((s) => s.kind),
      ['agents'],
    );
  },
);

test(
  'a project skills parent folder linked outside the project is skipped',
  posix,
  async (t) => {
    const outside = await realpath(
      await mkdtemp(join(tmpdir(), 'waycraft-out-')),
    );
    t.after(() => rm(outside, { recursive: true, force: true }));
    await skill(join(outside, 'skills'), 'leak', doc('leak'));
    const h = await harness(t);
    const dir = await project(h.root, 'app', { '.agents': ['ok'] });
    await symlink(outside, join(dir, '.claude'));
    h.registry.workspaces.push(dir);
    const [entry] = (await json(await h.post({ action: 'list' }))).projects;
    const body = await view(h, entry.id);
    assert.deepEqual(
      body.project.copies.map((c) => c.name),
      ['ok'],
    );
    assert.deepEqual(
      body.project.diagnostics.map((d) => d.code),
      ['project-source-outside'],
    );
  },
);

test('project deny policy survives a missing or failing workspace registry and reports it', async (t) => {
  for (const mode of ['throw', 'missing']) {
    const h = await harness(t);
    const dir = await project(h.root, 'app', { '.agents': ['x'] });
    h.registry.workspaces.push(dir);
    const [entry] = (await json(await h.post({ action: 'list' }))).projects;
    const copy = (await view(h, entry.id)).project.copies[0];
    await h.post({
      action: 'toggle',
      kind: 'copy',
      id: copy.path,
      enabled: false,
      project: entry.id,
    });
    const denied = (await h.provider.list({ cwd: dir })).map((c) => [
      c.name,
      c.invocation.modelInvocable,
    ]);
    assert.deepEqual(denied, [['x', false]]);
    h.registry.mode = mode;
    // The last known-good project set keeps the deny overlay in place.
    assert.deepEqual(
      (await h.provider.list({ cwd: dir })).map((c) => [
        c.name,
        c.invocation.modelInvocable,
      ]),
      denied,
      mode,
    );
    const list = await json(await h.post({ action: 'list' }));
    assert.ok(
      list.diagnostics.some((d) => d.code === 'registry-unavailable'),
      mode,
    );
    h.registry.mode = 'ok';
    const healthy = await json(await h.post({ action: 'list' }));
    assert.equal(
      healthy.diagnostics.some((d) => d.code === 'registry-unavailable'),
      false,
    );
  }
});

test('previewing a folder is bounded, ordered and refuses reserved or protected roots before walking', async (t) => {
  const h = await harness(t, {
    sources: (r) => [{ id: 'base', path: join(r, 'base') }],
  });
  await mkdir(join(h.root, 'base', 'inner'), { recursive: true });
  await mkdir(join(h.root, 'state'), { recursive: true });
  for (const [path, code] of [
    [h.root, 'root-reserved'],
    [join(h.root, 'state'), 'root-reserved'],
    [join(h.root, 'base', 'inner'), 'root-overlap'],
  ]) {
    const response = await h.post({ action: 'custom-scan', path });
    assert.equal(response.status, 409, path);
    assert.equal((await json(response)).code, code, path);
  }
  // 2100 sibling folders exceed the 2000-directory visit cap; the last one is never reached.
  const wide = join(h.root, 'wide');
  await mkdir(wide);
  for (let i = 0; i < 2100; i += 100)
    await Promise.all(
      Array.from({ length: 100 }, (_, n) =>
        mkdir(join(wide, `d${String(i + n).padStart(4, '0')}`)),
      ),
    );
  await skill(join(wide, 'd0001', 'skills'), 'early', doc('early'));
  await skill(join(wide, 'd2099', 'skills'), 'late', doc('late'));
  const capped = await json(
    await h.post({ action: 'custom-scan', path: wide }),
  );
  assert.equal(capped.truncated, true);
  assert.deepEqual(
    capped.candidates.map((c) => c.label),
    ['wide / d0001'],
  );
});

test('an aborted preview stops and reports the abort', async (t) => {
  const h = await harness(t);
  await skill(join(h.root, 'acme', 'skills'), 'one', doc('one'));
  const controller = new AbortController();
  controller.abort();
  const response = await h
    .post(
      { action: 'custom-scan', path: join(h.root, 'acme') },
      {},
      controller.signal,
    )
    .catch((error) => error);
  // Either the runtime rejects the aborted request or the host answers with the abort code.
  if (response instanceof Response) {
    assert.equal(response.status, 409);
    assert.equal((await json(response)).code, 'scan-aborted');
  } else assert.equal(response.name, 'AbortError');
});

test('editing a custom source path drops policy keyed by the old location', async (t) => {
  const h = await harness(t);
  await skill(join(h.root, 'a'), 'one', doc('one'));
  await skill(join(h.root, 'b'), 'two', doc('two'));
  await h.post({
    action: 'custom-add',
    items: [{ path: join(h.root, 'a'), label: 'A' }],
  });
  await h.post({
    action: 'toggle',
    kind: 'source',
    id: 'custom:a',
    enabled: false,
  });
  const copyPath = join(h.root, 'a', 'one', 'SKILL.md');
  await h.post({
    action: 'toggle',
    kind: 'copy',
    id: copyPath,
    enabled: false,
  });
  const before = JSON.parse(await readFile(h.state, 'utf8'));
  assert.equal(before.copies[copyPath], false);
  await h.post({
    action: 'custom-update',
    id: 'custom:a',
    label: 'A',
    path: join(h.root, 'b'),
  });
  const after = JSON.parse(await readFile(h.state, 'utf8'));
  assert.deepEqual(after.copies, {});
  assert.deepEqual(after.sources, {});
  const list = await json(await h.post({ action: 'list' }));
  assert.equal(list.sources.find((s) => s.id === 'custom:a').enabled, true);
});

test('state flags keep a null prototype so a __proto__ id toggles like any other', async (t) => {
  const h = await harness(t, {
    sources: (r) => [{ id: '__proto__', path: join(r, 'proto') }],
  });
  await skill(join(h.root, 'proto'), 'p', doc('p'));
  const off = await json(
    await h.post({
      action: 'toggle',
      kind: 'source',
      id: '__proto__',
      enabled: false,
    }),
  );
  assert.equal(off.sources[0].enabled, false);
  assert.equal(
    Object.getOwnPropertyDescriptor(
      JSON.parse(await readFile(h.state, 'utf8')).sources,
      '__proto__',
    )?.value,
    false,
  );
  // A second mutation clones the state again and must keep the flag.
  await h.post({ action: 'custom-add', items: [{ path: join(h.root, 'x') }] });
  const list = await json(await h.post({ action: 'list' }));
  assert.equal(list.sources[0].enabled, false);
});

test('a failed state write is reported and leaves memory unchanged', async (t) => {
  const h = await harness(t, {
    sources: (r) => [{ id: 'base', path: join(r, 'base') }],
  });
  await skill(join(h.root, 'base'), 'x', doc('x'));
  await h.post({ action: 'list' });
  await rm(join(h.root, 'state'), { recursive: true, force: true });
  await writeFile(join(h.root, 'state'), 'not a directory');
  const failed = await h.post({
    action: 'toggle',
    kind: 'source',
    id: 'base',
    enabled: false,
  });
  assert.equal(failed.status, 400);
  const list = await json(await h.post({ action: 'list' }));
  assert.equal(list.sources[0].enabled, true);
  assert.equal(list.corrupt, false);
});

test('the limit rejection names the limit, and project selectors need the marker', async (t) => {
  const h = await harness(t);
  const items = [];
  for (let i = 0; i < 33; i++) {
    const path = join(h.root, `s${i}`);
    await mkdir(path);
    items.push({ path });
  }
  const body = await json(await h.post({ action: 'custom-add', items }));
  assert.deepEqual(body.results[32].params, { limit: '32' });
  const dir = await project(h.root, 'app', { '.agents': ['ok'] });
  h.registry.workspaces.push(dir);
  const none = { 'x-majed-skills': '' };
  const plain = await json(await h.post({ action: 'list' }, none));
  assert.deepEqual(plain.projects, []);
  const [entry] = (await json(await h.post({ action: 'list' }))).projects;
  assert.equal(
    (await h.post({ action: 'list', project: entry.id }, none)).status,
    403,
  );
});
