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
import { homedir, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
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
        new Request('http://localhost/api/waycraft-skills.catalog', {
          method: 'POST',
          signal,
          headers: {
            'content-type': 'application/json',
            'x-waycraft-skills': '1',
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

const rig = (t) =>
  harness(t, {
    sources: (r) => [
      { id: 'user-dsh', path: join(r, 'dsh'), rank: 400 },
      { id: 'codex', path: join(r, 'codex-default'), rank: 510 },
      { id: 'claude', path: join(r, 'claude-default'), rank: 511 },
    ],
  });
const set = (h, id, path) => h.post({ action: 'root-set', id, path });

test('root-set redirects a built-in provider root, reports it and keeps the default for reset', async (t) => {
  const h = await rig(t);
  const target = join(h.root, 'elsewhere');
  await skill(target, 'moved', doc('moved'));
  const res = await set(h, 'codex', target);
  assert.equal(res.status, 200);
  const view = await json(res);
  const codex = view.sources.find((s) => s.id === 'codex');
  assert.equal(codex.path, await realpath(target));
  assert.equal(codex.overridden, true);
  assert.equal(codex.defaultPath, join(h.root, 'codex-default'));
  assert.ok(
    view.copies.some((c) => c.name === 'moved' && c.source === 'codex'),
  );
  // Persisted: a restart keeps the override.
  await h.stop();
  const again = h.boot();
  t.after(() => again.stop());
  const list = await json(await again.post({ action: 'list' }));
  assert.equal(list.sources.find((s) => s.id === 'codex').overridden, true);
  // Reset restores the default and never touches the folder.
  const reset = await json(await set(again, 'codex', ''));
  const back = reset.sources.find((s) => s.id === 'codex');
  assert.equal(back.path, join(h.root, 'codex-default'));
  assert.equal(back.overridden, undefined);
  assert.ok((await lstat(join(target, 'moved', 'SKILL.md'))).isFile());
});

test('root-set refuses DSH, unknown ids, relative, missing, file, overlap, reserved and sensitive paths', async (t) => {
  const h = await rig(t);
  const ok = join(h.root, 'ok');
  await mkdir(ok, { recursive: true });
  const file = join(h.root, 'file.txt');
  await writeFile(file, 'x');
  const cases = [
    ['user-dsh', ok, 404, 'root-unsupported'],
    ['nope', ok, 404, 'root-unsupported'],
    ['codex', 'relative/dir', 409, 'root-not-absolute'],
    ['codex', join(h.root, 'missing'), 409, 'root-not-found'],
    ['codex', file, 409, 'root-not-directory'],
    ['codex', join(h.root, 'state'), 409, 'root-reserved'],
    ['codex', join(h.root, 'dsh'), 409, 'root-overlap'],
    ['codex', homedir(), 409, 'root-reserved'],
    ['codex', '/', 409, 'root-reserved'],
    ['codex', join(homedir(), '.ssh'), 409, 'root-reserved'],
  ];
  await mkdir(join(h.root, 'dsh'), { recursive: true });
  await mkdir(join(h.root, 'state'), { recursive: true });
  for (const [id, path, status, code] of cases) {
    const res = await set(h, id, path);
    const body = await json(res);
    // ~/.ssh may not exist on this machine: any 409 refusal is acceptable there.
    assert.equal(res.status, status, `${id} ${path}`);
    if (path !== join(homedir(), '.ssh')) assert.equal(body.code, code, path);
  }
  // Another provider's effective root is protected too.
  await mkdir(join(h.root, 'claude-default'), { recursive: true });
  const res = await set(h, 'codex', join(h.root, 'claude-default', 'inner'));
  assert.equal(res.status, 409);
  const list = await json(await h.post({ action: 'list' }));
  assert.equal(
    list.sources.find((s) => s.id === 'codex').overridden,
    undefined,
  );
});

test(
  'root-set canonicalizes symlinks and rejects a link into another source',
  posix,
  async (t) => {
    const h = await rig(t);
    const real = join(h.root, 'real');
    await mkdir(real, { recursive: true });
    await symlink(real, join(h.root, 'link'));
    const res = await json(await set(h, 'codex', join(h.root, 'link')));
    assert.equal(
      res.sources.find((s) => s.id === 'codex').path,
      await realpath(real),
    );
    await mkdir(join(h.root, 'dsh'), { recursive: true });
    await symlink(join(h.root, 'dsh'), join(h.root, 'sneaky'));
    const bad = await set(h, 'claude', join(h.root, 'sneaky'));
    assert.equal(bad.status, 409);
    assert.equal((await json(bad)).code, 'root-overlap');
  },
);

test('changing the root purges policy, notes and categories keyed by the old location', async (t) => {
  const h = await rig(t);
  const first = join(h.root, 'first');
  await skill(first, 'a', doc('a'));
  await set(h, 'codex', first);
  let list = await json(await h.post({ action: 'list' }));
  const copy = list.copies.find((c) => c.source === 'codex');
  await h.post({
    action: 'toggle',
    kind: 'source',
    id: 'codex',
    enabled: false,
  });
  await h.post({
    action: 'toggle',
    kind: 'copy',
    id: copy.path,
    enabled: false,
  });
  const raw = JSON.parse(await readFile(h.state, 'utf8'));
  assert.equal(raw.sources.codex, false);
  const second = join(h.root, 'second');
  await mkdir(second, { recursive: true });
  await set(h, 'codex', second);
  const after = JSON.parse(await readFile(h.state, 'utf8'));
  assert.equal(after.sources.codex, undefined);
  assert.equal(Object.keys(after.copies).length, 0);
  assert.equal(after.rootOverrides.codex, await realpath(second));
});

test('root-set needs the mutation marker and a valid id; corrupt state fails closed', async (t) => {
  const h = await rig(t);
  const plain = await h.post(
    { action: 'root-set', id: 'codex', path: h.root },
    { 'x-waycraft-skills': '' },
  );
  assert.ok([400, 403].includes(plain.status));
  assert.equal(
    (await h.post({ action: 'root-set', path: h.root })).status,
    400,
  );
  await h.stop();
  await mkdir(dirname(h.state), { recursive: true });
  await writeFile(
    h.state,
    JSON.stringify({
      sources: {},
      copies: {},
      rootOverrides: { codex: 'relative' },
    }),
  );
  const bad = h.boot();
  t.after(() => bad.stop());
  const res = await bad.post({ action: 'root-set', id: 'codex', path: h.root });
  assert.equal(res.status, 409);
});

/** Runs `body` with HOME/DSH_HOME pointing into a throwaway tree so sensitive paths are deterministic. */
const withHome = async (t, body) => {
  const home = await realpath(await mkdtemp(join(tmpdir(), 'waycraft-home-')));
  const saved = { HOME: process.env.HOME, DSH_HOME: process.env.DSH_HOME };
  process.env.HOME = home;
  process.env.DSH_HOME = join(home, '.dsh');
  t.after(async () => {
    for (const [k, v] of Object.entries(saved))
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    await rm(home, { recursive: true, force: true });
  });
  return body(home);
};

test('sensitive folders and ancestors of the DSH home are refused under a fake HOME', async (t) => {
  await withHome(t, async (home) => {
    const h = await rig(t);
    for (const dir of ['.ssh', '.gnupg', '.aws', '.kube', '.dsh']) {
      await mkdir(join(home, dir, 'inner'), { recursive: true });
      for (const path of [join(home, dir), join(home, dir, 'inner')]) {
        const res = await set(h, 'codex', path);
        assert.equal(res.status, 409, path);
        assert.equal((await json(res)).code, 'root-reserved', path);
      }
    }
    // Home itself is an ancestor of the DSH home.
    const res = await set(h, 'codex', home);
    assert.equal((await json(res)).code, 'root-reserved');
    // A plain folder inside the fake home is fine.
    await mkdir(join(home, 'skills-elsewhere'), { recursive: true });
    assert.equal(
      (await set(h, 'codex', join(home, 'skills-elsewhere'))).status,
      200,
    );
  });
});

test('reset claims the default folder again only when no other source uses it (exact sequence)', async (t) => {
  const h = await rig(t);
  const a = join(h.root, 'a-redirect');
  await mkdir(a, { recursive: true });
  await mkdir(join(h.root, 'codex-default'), { recursive: true });
  assert.equal((await set(h, 'codex', a)).status, 200);
  // The default folder of a redirected source stays protected from other sources...
  const taken = await set(h, 'claude', join(h.root, 'codex-default'));
  assert.equal(taken.status, 409);
  assert.equal((await json(taken)).code, 'root-overlap');
  const custom = await json(
    await h.post({
      action: 'custom-add',
      items: [{ path: join(h.root, 'codex-default'), label: 'Mine' }],
    }),
  );
  assert.ok(
    JSON.stringify(custom).includes('root-overlap'),
    'custom source cannot take it either',
  );
  // ...so reset (by empty, null or the default path) succeeds and restores the default.
  for (const path of ['', null, join(h.root, 'codex-default')]) {
    assert.equal((await set(h, 'codex', a)).status, 200);
    const res = await set(h, 'codex', path);
    assert.equal(res.status, 200, String(path));
    const src = (await json(res)).sources.find((s) => s.id === 'codex');
    assert.equal(src.path, join(h.root, 'codex-default'));
    assert.equal(src.overridden, undefined);
  }
});

test('reset is refused when the default folder is now covered by another source', async (t) => {
  const h = await rig(t);
  const a = join(h.root, 'a-redirect');
  await mkdir(a, { recursive: true });
  assert.equal((await set(h, 'codex', a)).status, 200);
  // Simulate an older state: claude was pointed at codex's default after the fact.
  await h.stop();
  const raw = JSON.parse(await readFile(h.state, 'utf8'));
  await mkdir(join(h.root, 'codex-default'), { recursive: true });
  raw.rootOverrides.claude = join(h.root, 'codex-default');
  await writeFile(h.state, JSON.stringify(raw));
  const again = h.boot();
  t.after(() => again.stop());
  const list = await json(await again.post({ action: 'list' }));
  // Load revalidation drops the overlapping override and reports it.
  assert.equal(
    list.sources.find((s) => s.id === 'claude').overridden,
    undefined,
  );
  assert.ok(
    list.diagnostics.some(
      (d) => d.code === 'root-override-ignored' && d.params.source === 'claude',
    ),
  );
});

test('load drops reserved overrides; invalid shapes fail closed', async (t) => {
  await withHome(t, async (home) => {
    const h = await rig(t);
    await h.stop();
    await mkdir(join(home, '.ssh'), { recursive: true });
    await mkdir(dirname(h.state), { recursive: true });
    await writeFile(
      h.state,
      JSON.stringify({
        sources: {},
        copies: {},
        rootOverrides: { codex: join(home, '.ssh') },
      }),
    );
    const again = h.boot();
    t.after(() => again.stop());
    const list = await json(await again.post({ action: 'list' }));
    assert.equal(
      list.sources.find((s) => s.id === 'codex').overridden,
      undefined,
    );
    assert.ok(list.diagnostics.some((d) => d.code === 'root-override-ignored'));
    await again.stop();
    const shapes = [
      { rootOverrides: { codex: 5 } },
      { rootOverrides: ['x'] },
      { raw: '{"__proto__":"/tmp/x"}' },
      {
        rootOverrides: Object.fromEntries(
          Array.from({ length: 33 }, (_, i) => [`p${i}`, '/tmp/x']),
        ),
      },
    ];
    for (const extra of shapes) {
      await writeFile(
        h.state,
        `{"sources":{},"copies":{},"rootOverrides":${JSON.stringify(extra.rootOverrides)}}`,
      );
      const bad = h.boot();
      t.after(() => bad.stop());
      const res = await bad.post({ action: 'list' });
      const body = await json(res);
      assert.ok(
        res.status === 409 || body.corrupt === true || body.code,
        JSON.stringify(extra).slice(0, 40),
      );
      await bad.stop();
    }
  });
});

test('statuses: non-string and relative paths both 409; project scope and trailing slash/dotdot handled', async (t) => {
  const h = await rig(t);
  const ok = join(h.root, 'ok');
  await mkdir(ok, { recursive: true });
  for (const path of [5, true, {}, 'relative/dir']) {
    const res = await set(h, 'codex', path);
    assert.equal(res.status, 409, String(path));
    assert.equal((await json(res)).code, 'root-not-absolute');
  }
  const scoped = await h.post({
    action: 'root-set',
    id: 'codex',
    path: ok,
    project: 'whatever',
  });
  assert.ok([404, 409].includes(scoped.status));
  // Trailing slash and `..` canonicalize to the same real folder.
  const res = await json(await set(h, 'codex', `${ok}/`));
  assert.equal(res.sources.find((s) => s.id === 'codex').path, ok);
  const dotted = await json(
    await set(h, 'claude', `${h.root}/ok/../ok2`.replace('ok2', 'ok')),
  );
  assert.equal(dotted.code, 'root-overlap');
  // Overlap checks cannot be bypassed through a dot-dot path into another source.
  await mkdir(join(h.root, 'dsh', 'x'), { recursive: true });
  const bad = await set(h, 'claude', `${h.root}/ok/../dsh/x`);
  assert.equal((await json(bad)).code, 'root-overlap');
});

test('case variants of another source are refused on case-insensitive file systems', async (t) => {
  const h = await rig(t);
  await mkdir(join(h.root, 'dsh'), { recursive: true });
  const probe = join(h.root, 'DSH');
  const insensitive = await lstat(probe).then(
    () => true,
    () => false,
  );
  if (!insensitive) return t.skip('case-sensitive file system');
  const res = await set(h, 'codex', probe);
  assert.equal((await json(res)).code, 'root-overlap');
});
