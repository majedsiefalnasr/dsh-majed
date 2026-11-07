// ClawHub / skills.sh discovery and installation through the registered host route.
// Everything is local: 127.0.0.1 stubs behind the host-only Config.catalogs seam. No test touches the real network.
import assert from 'node:assert/strict';
import {
  lstat,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  writeFile,
  mkdir,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { zipSync } from 'fflate';
import { apply } from '../dist/skills.js';
import { archiveServer, skillDoc } from './skill-manager-repos-fixtures.mjs';

const json = (response, value, status = 200, type = 'application/json') => {
  response.writeHead(status, { 'content-type': type });
  response.end(typeof value === 'string' ? value : JSON.stringify(value));
};
const flatZip = (files) =>
  Buffer.from(
    zipSync(
      Object.fromEntries(
        Object.entries(files).map(([path, data]) => [path, Buffer.from(data)]),
      ),
    ),
  );
const exists = (path) =>
  lstat(path).then(
    () => true,
    () => false,
  );

async function fixture(t, catalogs = {}, serverHandler, state) {
  const server = await archiveServer(
    serverHandler ?? ((_, r) => json(r, {}, 404)),
  );
  t.after(() => server.close());
  const root =
    state?.root ??
    (await realpath(await mkdtemp(join(tmpdir(), 'waycraft-cat-'))));
  if (!state) t.after(() => rm(root, { recursive: true, force: true }));
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
                register(v) {
                  route = v;
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
        { id: 'user-agents', path: join(root, 'agents') },
        { id: 'codex', path: join(root, 'codex') },
      ],
      statePath: join(root, 'state', 'state.json'),
      catalogs: {
        allowPrivateHosts: true,
        clawhubBase: server.url,
        skillsShBase: server.url,
        ...catalogs,
      },
    },
  );
  const stop = async () => {
    for (const fn of stops.splice(0).reverse()) await fn?.();
  };
  t.after(stop);
  const send = async (body, { marker = true, signal } = {}) => {
    const r = await route.fetch(
      new Request('http://localhost/api/waycraft-skills.catalog', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(marker ? { 'x-waycraft-skills': '1' } : {}),
        },
        body: JSON.stringify({ source: 'user-dsh', ...body }),
        signal,
      }),
    );
    const text = await r.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
    return { status: r.status, body: parsed };
  };
  return { root, send, server, stop };
}
const clawItem = (slug, extra = {}) => ({
  ownerHandle: 'acme',
  slug,
  displayName: `Skill ${slug}`,
  summary: `About ${slug}`,
  stats: { downloads: 10, installs: 2, stars: 1 },
  ...extra,
});
const skillId = { catalog: 'clawhub', owner: 'acme', slug: 'alpha' };

test('ClawHub popular list: fixed query, validation, pagination cursor, cache', async (t) => {
  let hits = 0;
  const f = await fixture(t, {}, (req, res) => {
    hits++;
    const url = new URL(req.url, 'http://x');
    assert.equal(url.pathname, '/api/v1/skills');
    assert.equal(url.searchParams.get('sort'), 'downloads');
    assert.equal(url.searchParams.get('limit'), '10');
    json(res, {
      items: [
        clawItem('alpha'),
        clawItem('bad slug!'),
        { slug: 'x' },
        clawItem('beta', { summary: 'x'.repeat(9000), displayName: '' }),
      ],
      nextCursor: url.searchParams.get('cursor') ? null : 'c2',
    });
  });
  const first = await f.send({ action: 'catalog-clawhub-list' });
  assert.equal(first.status, 200);
  assert.deepEqual(
    first.body.items.map((i) => i.id),
    ['clawhub:acme/alpha', 'clawhub:acme/beta'],
  );
  assert.equal(first.body.items[1].name, 'beta');
  assert.equal(first.body.items[1].summary, '');
  assert.equal(first.body.nextCursor, 'c2');
  await f.send({ action: 'catalog-clawhub-list' });
  assert.equal(
    hits,
    1,
    'second identical request is served from the TTL cache',
  );
  const second = await f.send({ action: 'catalog-clawhub-list', cursor: 'c2' });
  assert.equal(second.body.nextCursor, null);
  assert.equal(hits, 2);
  for (const bad of [
    { sort: 'stars' },
    { limit: 11 },
    { limit: 0 },
    { cursor: 'x'.repeat(4097) },
    { cursor: 5 },
  ])
    assert.equal(
      (await f.send({ action: 'catalog-clawhub-list', ...bad })).body.code,
      'catalog-query',
      JSON.stringify(bad),
    );
  assert.equal(
    (await f.send({ action: 'catalog-clawhub-list' }, { marker: false }))
      .status,
    403,
  );
});

test('ClawHub search and skills.sh search: validation, filtering, dedupe, caps', async (t) => {
  const f = await fixture(t, {}, (req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/api/v1/search')
      return json(res, {
        results: [
          clawItem('alpha'),
          clawItem('alpha'),
          clawItem('other', { source: 'github' }),
          clawItem('beta', { source: 'clawhub' }),
        ],
      });
    if (url.pathname === '/api/search')
      return json(res, {
        skills: [
          { source: 'a/b', skillId: 'one', name: ' One ', installs: 5 },
          { source: 'a/b', skillId: 'one', name: 'Dup' },
          { source: 'bad', skillId: 'x', name: 'x' },
          { source: 'a/b', skillId: 'two', name: 'Two', installs: -1 },
        ],
      });
    json(res, {}, 404);
  });
  const claw = await f.send({ action: 'catalog-clawhub-search', q: ' alpha ' });
  assert.deepEqual(
    claw.body.items.map((i) => i.id),
    ['clawhub:acme/alpha', 'clawhub:acme/beta'],
  );
  const sh = await f.send({ action: 'catalog-skillsh-search', q: 'one' });
  assert.deepEqual(
    sh.body.items.map((i) => [i.id, i.name, i.installs]),
    [
      ['skillsh:a/b/one', 'One', 5],
      ['skillsh:a/b/two', 'Two', undefined],
    ],
  );
  for (const q of ['', '   ', 'x'.repeat(101), 7, undefined]) {
    assert.equal(
      (await f.send({ action: 'catalog-clawhub-search', q })).body.code,
      'catalog-query',
    );
    assert.equal(
      (await f.send({ action: 'catalog-skillsh-search', q })).body.code,
      'catalog-query',
    );
  }
  assert.equal(
    (await f.send({ action: 'catalog-clawhub-search', q: 'a', limit: 101 }))
      .body.code,
    'catalog-query',
  );
});

test('network failure modes: upstream, malformed, wrong type, oversize, redirect, timeout, cancellation', async (t) => {
  let mode = 'ok';
  let upstreamClosed = false;
  // A second local stub proves the redirect is refused rather than followed.
  const target = await archiveServer((_, res) => json(res, { items: [] }));
  t.after(() => target.close());
  const f = await fixture(t, { timeoutMs: 300 }, (req, res) => {
    if (mode === 'ok') return json(res, { items: [clawItem('alpha')] });
    if (mode === '500') return json(res, {}, 500);
    if (mode === 'bad-json') return json(res, '{nope');
    if (mode === 'array') return json(res, '[]');
    if (mode === 'html') return json(res, '<html/>', 200, 'text/html');
    if (mode === 'big')
      return json(
        res,
        JSON.stringify({ items: [], pad: 'x'.repeat(1024 * 1024 + 10) }),
      );
    if (mode === 'redirect') {
      res.writeHead(302, { location: `${target.url}/redirected` });
      return res.end();
    }
    if (mode === 'items') return json(res, { items: 'no' });
    if (mode === 'hang') {
      // Never answers; records when the host drops the upstream connection.
      res.on('close', () => (upstreamClosed = true));
      return;
    }
  });
  const expected = {
    500: 'catalog-upstream',
    'bad-json': 'catalog-response',
    array: 'catalog-response',
    html: 'catalog-response',
    big: 'repo-limit',
    redirect: 'catalog-upstream',
    items: 'catalog-response',
    hang: 'repo-timeout',
  };
  for (const [name, code] of Object.entries(expected)) {
    mode = name;
    const r = await f.send({
      action: 'catalog-clawhub-list',
      limit: 1 + Object.keys(expected).indexOf(name),
    });
    assert.equal(r.body.code, code, name);
    assert.ok(r.status >= 400);
  }
  assert.equal(target.hits.length, 0, 'redirects are never followed');
  // Failures are never cached: retry succeeds once the upstream recovers.
  mode = 'ok';
  const retry = await f.send({ action: 'catalog-clawhub-list', limit: 1 });
  assert.equal(retry.status, 200);
  // Cancellation through the request signal.
  mode = 'hang';
  const controller = new AbortController();
  const pending = f.send(
    { action: 'catalog-clawhub-list', limit: 9 },
    { signal: controller.signal },
  );
  setTimeout(() => controller.abort(), 30);
  const r = await pending.catch((e) => ({ aborted: true, e }));
  assert.ok(r.aborted || r.body?.code === 'repo-cancelled' || r.status >= 400);
  for (let i = 0; i < 50 && !upstreamClosed; i++)
    await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(upstreamClosed, true, 'cancelling aborts the upstream request');
});

test('endpoints are fixed https unless the host-only test seam allows loopback', async (t) => {
  const plain = await fixture(t, {
    allowPrivateHosts: false,
    clawhubBase: 'http://127.0.0.1:9',
  });
  assert.equal(
    (await plain.send({ action: 'catalog-clawhub-list' })).body.code,
    'catalog-upstream',
  );
  const priv = await fixture(t, {
    allowPrivateHosts: false,
    clawhubBase: 'https://127.0.0.1:9',
  });
  assert.equal(
    (await priv.send({ action: 'catalog-clawhub-list' })).body.code,
    'repo-host',
  );
  // Request bodies cannot redirect the endpoints.
  const f = await fixture(t, {}, (_, r) => json(r, { items: [] }));
  const r = await f.send({
    action: 'catalog-clawhub-list',
    clawhubBase: 'http://169.254.169.254',
    url: 'http://169.254.169.254',
  });
  assert.equal(r.status, 200);
  assert.ok(f.server.hits.length >= 1);
});

test('detail returns plain sanitised text for ClawHub and skills.sh', async (t) => {
  const f = await fixture(t, {}, (req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/api/v1/skills/alpha/file') {
      assert.equal(url.searchParams.get('path'), 'SKILL.md');
      assert.equal(url.searchParams.get('owner'), 'acme');
      return json(
        res,
        skillDoc(
          'alpha',
          'Desc\u202e',
          '[x](javascript:alert(1)) <b>hi</b>\u0007',
        ),
        200,
        'text/markdown; charset=utf-8',
      );
    }
    if (url.pathname === '/api/download/a/b/one')
      return json(res, {
        files: [
          { path: 'SKILL.md', contents: skillDoc('one', 'One desc', 'Body') },
        ],
      });
    json(res, {}, 404);
  });
  const claw = await f.send({ action: 'catalog-detail', skill: skillId });
  assert.equal(claw.body.name, 'alpha');
  assert.equal(claw.body.description, 'Desc');
  assert.ok(!/[\u0007\u202e]/.test(JSON.stringify(claw.body)));
  assert.equal(
    claw.body.body.includes('<b>hi</b>'),
    true,
    'text is returned verbatim as data, never converted to markup',
  );
  const sh = await f.send({
    action: 'catalog-detail',
    skill: { catalog: 'skillsh', source: 'a/b', skillId: 'one' },
  });
  assert.equal(sh.body.origin, 'a/b/one');
  for (const bad of [
    null,
    {},
    { catalog: 'clawhub', owner: '../x', slug: 'a' },
    { catalog: 'skillsh', source: 'a', skillId: 'x' },
    { catalog: 'other' },
  ])
    assert.equal(
      (await f.send({ action: 'catalog-detail', skill: bad })).body.code,
      'catalog-identity',
    );
});

const installServer =
  (extra = {}) =>
  (req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/api/v1/download') {
      if (extra.clawhub) return extra.clawhub(res, url);
      res.writeHead(200, { 'content-type': 'application/zip' });
      return res.end(
        flatZip({
          'SKILL.md': skillDoc('alpha', 'Alpha skill'),
          'scripts/run.sh': '#!/bin/sh\n',
        }),
      );
    }
    if (url.pathname === '/api/download/a/b/one')
      return json(res, {
        files: [
          { path: 'SKILL.md', contents: skillDoc('one', 'One') },
          { path: 'notes/a.txt', contents: 'hi' },
        ],
      });
    json(res, {}, 404);
  };

test('install requires confirmation and a user destination; provenance, conflicts, uninstall, restore', async (t) => {
  const f = await fixture(t, {}, installServer());
  assert.equal(
    (await f.send({ action: 'catalog-install', skill: skillId })).body.code,
    'catalog-confirm',
  );
  assert.equal(
    (
      await f.send({
        action: 'catalog-install',
        skill: skillId,
        confirm: true,
        destination: 'project-dsh:x',
      })
    ).status,
    403,
  );
  assert.equal(
    f.server.hits.length,
    0,
    'nothing is downloaded before confirmation and destination checks',
  );
  const done = await f.send({
    action: 'catalog-install',
    skill: skillId,
    confirm: true,
  });
  assert.equal(done.status, 200, JSON.stringify(done.body));
  assert.equal(
    await readFile(join(f.root, 'skills', 'alpha', 'SKILL.md'), 'utf8'),
    skillDoc('alpha', 'Alpha skill'),
  );
  const [row] = done.body.catalogInstalls;
  assert.equal(row.catalogId, 'clawhub:acme/alpha');
  assert.equal(row.status, 'installed');
  assert.match(row.digest, /^[0-9a-f]{64}$/);
  assert.match(row.url, /\/api\/v1\/download\?slug=alpha&owner=acme$/);
  assert.equal(row.source, 'user-dsh');
  // Same destination conflicts; another destination is allowed ("install elsewhere").
  assert.equal(
    (await f.send({ action: 'catalog-install', skill: skillId, confirm: true }))
      .body.code,
    'repo-conflict',
  );
  const elsewhere = await f.send({
    action: 'catalog-install',
    skill: skillId,
    confirm: true,
    destination: 'user-agents',
  });
  assert.equal(elsewhere.body.catalogInstalls.length, 2);
  // Local edits are reported.
  await writeFile(join(f.root, 'skills', 'alpha', 'extra.txt'), 'x');
  const listed = await f.send({ action: 'list' });
  assert.equal(
    listed.body.catalogInstalls.find((i) => i.source === 'user-dsh').status,
    'modified',
  );
  // Uninstall to Trash, exact restore.
  const id = listed.body.catalogInstalls.find(
    (i) => i.source === 'user-dsh',
  ).id;
  const un = await f.send({ action: 'catalog-uninstall', installId: id });
  assert.equal(un.status, 200);
  assert.equal(await exists(join(f.root, 'skills', 'alpha')), false);
  const trashed = un.body.catalogInstalls.find((i) => i.id === id);
  assert.equal(trashed.status, 'trashed');
  assert.equal(
    (await f.send({ action: 'catalog-uninstall', installId: id })).body.code,
    'repo-trashed',
  );
  const restored = await f.send({
    action: 'trash-restore',
    id: trashed.trashId,
  });
  assert.equal(restored.status, 200, JSON.stringify(restored.body));
  assert.equal(
    restored.body.catalogInstalls.find((i) => i.id === id).trashId,
    undefined,
  );
  assert.equal(
    await exists(join(f.root, 'skills', 'alpha', 'extra.txt')),
    true,
  );
  // Permanent delete forgets the record.
  await f.send({ action: 'catalog-uninstall', installId: id });
  const t2 = (await f.send({ action: 'list' })).body.catalogInstalls.find(
    (i) => i.id === id,
  );
  const gone = await f.send({
    action: 'trash-delete',
    id: t2.trashId,
    confirm: true,
  });
  assert.equal(
    gone.body.catalogInstalls.some((i) => i.id === id),
    false,
  );
});

test('install via skills.sh JSON package and unsafe packages are refused', async (t) => {
  const f = await fixture(t, {}, installServer());
  const ok = await f.send({
    action: 'catalog-install',
    skill: { catalog: 'skillsh', source: 'a/b', skillId: 'one' },
    confirm: true,
  });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  assert.equal(
    await readFile(join(f.root, 'skills', 'one', 'notes', 'a.txt'), 'utf8'),
    'hi',
  );
  assert.equal(ok.body.catalogInstalls[0].catalogId, 'skillsh:a/b/one');
});

for (const [label, build, code] of [
  [
    'path traversal',
    () => ({ '../evil.txt': 'x', 'SKILL.md': skillDoc('alpha') }),
    'repo-archive',
  ],
  ['no SKILL.md', () => ({ 'readme.md': 'x' }), 'catalog-package'],
  [
    'bad skill name',
    () => ({ 'SKILL.md': skillDoc('Bad Name') }),
    'catalog-package',
  ],
  ['no front matter', () => ({ 'SKILL.md': 'just text' }), 'catalog-package'],
  [
    'file too large',
    () => ({ 'SKILL.md': skillDoc('alpha'), big: 'x'.repeat(1024 * 1024 + 1) }),
    'repo-limit',
  ],
]) {
  test(`unsafe ClawHub package refused: ${label}`, async (t) => {
    const f = await fixture(
      t,
      {},
      installServer({
        clawhub: (res) => {
          res.writeHead(200, { 'content-type': 'application/zip' });
          res.end(flatZip(build()));
        },
      }),
    );
    const r = await f.send({
      action: 'catalog-install',
      skill: skillId,
      confirm: true,
    });
    assert.equal(r.body.code, code);
    assert.equal(await exists(join(f.root, 'skills', 'alpha')), false);
    assert.equal(await exists(join(f.root, 'state', 'catalogs.json')), false);
  });
}

test('zip bomb, wrong content type and cancelled install leave nothing behind', async (t) => {
  let mode = 'bomb';
  const f = await fixture(
    t,
    { timeoutMs: 2000 },
    installServer({
      clawhub: (res) => {
        if (mode === 'type') {
          res.writeHead(200, { 'content-type': 'text/html' });
          return res.end('<html>');
        }
        if (mode === 'hang') {
          res.writeHead(200, { 'content-type': 'application/zip' });
          return res.write('PK');
        }
        res.writeHead(200, { 'content-type': 'application/zip' });
        res.end(
          flatZip({
            'SKILL.md': skillDoc('alpha'),
            'bomb.bin': '\0'.repeat(20 * 1024 * 1024),
          }),
        );
      },
    }),
  );
  assert.equal(
    (await f.send({ action: 'catalog-install', skill: skillId, confirm: true }))
      .body.code,
    'repo-limit',
  );
  mode = 'type';
  assert.equal(
    (await f.send({ action: 'catalog-install', skill: skillId, confirm: true }))
      .body.code,
    'catalog-response',
  );
  mode = 'hang';
  const controller = new AbortController();
  const pending = f.send(
    { action: 'catalog-install', skill: skillId, confirm: true },
    { signal: controller.signal },
  );
  setTimeout(() => controller.abort(), 50);
  await pending.catch(() => undefined);
  assert.equal(await exists(join(f.root, 'skills', 'alpha')), false);
});

test('reassociate adopts an identical untracked copy; otherwise conflict', async (t) => {
  const f = await fixture(t, {}, installServer());
  await mkdir(join(f.root, 'skills', 'alpha', 'scripts'), { recursive: true });
  await writeFile(
    join(f.root, 'skills', 'alpha', 'SKILL.md'),
    skillDoc('alpha', 'Alpha skill'),
  );
  await writeFile(
    join(f.root, 'skills', 'alpha', 'scripts', 'run.sh'),
    '#!/bin/sh\n',
  );
  assert.equal(
    (await f.send({ action: 'catalog-install', skill: skillId, confirm: true }))
      .body.code,
    'repo-conflict',
  );
  const r = await f.send({
    action: 'catalog-install',
    skill: skillId,
    confirm: true,
    reassociate: true,
  });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.result.reassociated, true);
  assert.equal(r.body.catalogInstalls[0].status, 'installed');
  await writeFile(join(f.root, 'skills', 'alpha', 'SKILL.md'), 'edited');
  const f2 = await fixture(t, {}, installServer());
  await mkdir(join(f2.root, 'skills', 'alpha'), { recursive: true });
  await writeFile(join(f2.root, 'skills', 'alpha', 'SKILL.md'), 'different');
  assert.equal(
    (
      await f2.send({
        action: 'catalog-install',
        skill: skillId,
        confirm: true,
        reassociate: true,
      })
    ).body.code,
    'repo-conflict',
  );
});

test('forget removes only the record of a copy whose destination is gone', async (t) => {
  const f = await fixture(t, {}, installServer());
  await f.send({ action: 'catalog-install', skill: skillId, confirm: true });
  const { body } = await f.send({ action: 'list' });
  assert.equal(
    (
      await f.send({
        action: 'catalog-forget',
        installId: body.catalogInstalls[0].id,
      })
    ).body.code,
    'repo-root-valid',
  );
  assert.equal(
    (await f.send({ action: 'catalog-forget', installId: 'nope' })).body.code,
    'repo-not-installed',
  );
  assert.equal((await f.send({ action: 'catalog-nothing' })).status, 400);
});

test('a record whose Trash entry vanished outside the app can be forgotten (record only)', async (t) => {
  const f = await fixture(t, {}, installServer());
  await f.send({ action: 'catalog-install', skill: skillId, confirm: true });
  const id = (await f.send({ action: 'list' })).body.catalogInstalls[0].id;
  const un = await f.send({ action: 'catalog-uninstall', installId: id });
  const entry = un.body.catalogInstalls.find((i) => i.id === id);
  assert.equal(entry.status, 'trashed');
  // Still in Trash: forgetting is refused.
  assert.equal(
    (await f.send({ action: 'catalog-forget', installId: id })).body.code,
    'repo-trashed',
  );
  await rm(join(f.root, 'state', 'trash', entry.trashId), {
    recursive: true,
    force: true,
  });
  assert.equal(
    (await f.send({ action: 'list' })).body.catalogInstalls.find(
      (i) => i.id === id,
    ).status,
    'missing',
  );
  const r = await f.send({ action: 'catalog-forget', installId: id });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(
    r.body.catalogInstalls.some((i) => i.id === id),
    false,
  );
});

test('state: persists across restart, old/invalid state never bricks, hard maxima', async (t) => {
  const f = await fixture(t, {}, installServer());
  await f.send({ action: 'catalog-install', skill: skillId, confirm: true });
  await f.stop();
  const again = await fixture(t, {}, installServer(), { root: f.root });
  assert.equal(
    (await again.send({ action: 'list' })).body.catalogInstalls.length,
    1,
  );
  await again.stop();
  // Corrupt catalog state: the manager keeps listing; catalog mutations report the invalid state.
  await writeFile(
    join(f.root, 'state', 'catalogs.json'),
    '{"version":1,"installs":[{"id":"bad"}]}',
  );
  const broken = await fixture(t, {}, installServer(), { root: f.root });
  const listed = await broken.send({ action: 'list' });
  assert.equal(listed.status, 200);
  assert.deepEqual(listed.body.catalogInstalls, []);
  assert.equal(
    (
      await broken.send({
        action: 'catalog-install',
        skill: { ...skillId, slug: 'alpha' },
        confirm: true,
        destination: 'user-agents',
      })
    ).body.code,
    'repo-state-invalid',
  );
  // Over-the-hard-maximum record counts are invalid, not truncated.
  const many = {
    version: 1,
    installs: Array.from({ length: 2001 }, () => ({})),
  };
  await writeFile(join(f.root, 'state', 'catalogs.json'), JSON.stringify(many));
  const big = await fixture(t, {}, installServer(), { root: f.root });
  assert.equal((await big.send({ action: 'list' })).status, 200);
  // Lowered write caps never make saved state unreadable.
  await rm(join(f.root, 'state', 'catalogs.json'));
  const capped = await fixture(t, { maxInstalls: 1 }, installServer(), {
    root: f.root,
  });
  assert.equal(
    (
      await capped.send({
        action: 'catalog-install',
        skill: skillId,
        confirm: true,
        destination: 'user-agents',
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await capped.send({
        action: 'catalog-install',
        skill: { catalog: 'skillsh', source: 'a/b', skillId: 'one' },
        confirm: true,
      })
    ).body.code,
    'repo-limit',
  );
});

test('cache is bounded and honours TTL', async (t) => {
  let hits = 0;
  const f = await fixture(
    t,
    { cacheMs: 20, maxCacheEntries: 2 },
    (req, res) => {
      hits++;
      json(res, { results: [] });
    },
  );
  for (const q of ['a', 'b', 'c'])
    await f.send({ action: 'catalog-clawhub-search', q });
  await f.send({ action: 'catalog-clawhub-search', q: 'c' });
  assert.equal(hits, 3);
  await f.send({ action: 'catalog-clawhub-search', q: 'a' });
  assert.equal(hits, 4, 'oldest entry was evicted by the bound');
  await new Promise((r) => setTimeout(r, 40));
  await f.send({ action: 'catalog-clawhub-search', q: 'c' });
  assert.equal(hits, 5, 'entry expired after the TTL');
});

test('ClawHub search items keep top-level downloads (stats fallback preserved)', async (t) => {
  const f = await fixture(t, {}, (req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/api/v1/search')
      return json(res, {
        results: [
          { ...clawItem('alpha', { stats: undefined }), downloads: 42 },
          clawItem('beta'),
          { ...clawItem('gamma'), downloads: 7 },
        ],
      });
    json(res, {}, 404);
  });
  const r = await f.send({ action: 'catalog-clawhub-search', q: 'a' });
  assert.deepEqual(
    r.body.items.map((i) => [i.slug, i.downloads]),
    [
      ['alpha', 42],
      ['beta', 10],
      ['gamma', 7],
    ],
  );
});

test('catalog text drops bidi marks, line separators and zero-width characters', async (t) => {
  const f = await fixture(t, {}, (req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/api/v1/skills')
      return json(res, {
        items: [
          clawItem('alpha', {
            displayName: 'A\u200eB\u200fC\u061cD\u2028E\u2029F\u200bG\ufeffJ',
            summary:
              'x\u200ey \u0645\u06cc\u200c\u062e\u0648\u0627\u0647\u0645 \u{1F468}\u200d\u{1F469}\u200d\u{1F467}',
          }),
        ],
      });
    json(res, {}, 404);
  });
  const r = await f.send({ action: 'catalog-clawhub-list' });
  assert.equal(r.body.items[0].name, 'ABCDEFGJ');
  // ZWNJ (Persian) and ZWJ (emoji sequences) are legitimate text and are kept.
  assert.equal(
    r.body.items[0].summary,
    'xy \u0645\u06cc\u200c\u062e\u0648\u0627\u0647\u0645 \u{1F468}\u200d\u{1F469}\u200d\u{1F467}',
  );
});

test('destination must be a user source: built-in sources are read-only', async (t) => {
  const f = await fixture(t, {}, installServer());
  const r = await f.send({
    action: 'catalog-install',
    skill: skillId,
    confirm: true,
    destination: 'codex',
  });
  assert.equal(r.status, 403);
  assert.equal(r.body.code, 'create-readonly');
  assert.equal(await exists(join(f.root, 'codex')), false);
  assert.equal(f.server.hits.length, 0);
});

test('a failed state write rolls the installed copy back', async (t) => {
  const f = await fixture(t, {}, installServer());
  // A regular file where the state directory belongs makes persisting fail.
  await writeFile(join(f.root, 'state'), 'not a directory');
  const r = await f.send({
    action: 'catalog-install',
    skill: skillId,
    confirm: true,
  });
  assert.ok(r.status >= 400, JSON.stringify(r));
  assert.equal(await exists(join(f.root, 'skills', 'alpha')), false);
});

for (const bad of [
  { catalog: 'skillsh', source: 'a/..', skillId: 'x' },
  { catalog: 'skillsh', source: 'a/b', skillId: '../x' },
  { catalog: 'skillsh', source: 'a/b/c' },
]) {
  test(`skills.sh identity refused: ${JSON.stringify(bad)}`, async (t) => {
    const f = await fixture(t, {}, installServer());
    for (const action of ['catalog-detail', 'catalog-install']) {
      const r = await f.send({ action, skill: bad, confirm: true });
      assert.equal(r.body.code, 'catalog-identity');
    }
    assert.equal(f.server.hits.length, 0);
  });
}

for (const path of ['.git/config', '..foo', 'ok/.hidden', '.env']) {
  test(`skills.sh package refuses dot-prefixed path ${path}`, async (t) => {
    const f = await fixture(t, {}, (req, res) => {
      const url = new URL(req.url, 'http://x');
      if (url.pathname === '/api/download/a/b/one')
        return json(res, {
          files: [
            { path: 'SKILL.md', contents: skillDoc('one', 'One') },
            { path, contents: 'x' },
          ],
        });
      json(res, {}, 404);
    });
    const r = await f.send({
      action: 'catalog-install',
      skill: { catalog: 'skillsh', source: 'a/b', skillId: 'one' },
      confirm: true,
    });
    assert.equal(r.body.code, 'repo-archive');
    assert.equal(await exists(join(f.root, 'skills', 'one')), false);
  });
}

test('a YAML alias bomb in the front matter is a catalog-response error, not a crash', async (t) => {
  const bomb = `---\nname: alpha\ndescription: x\na: &a [1,2,3,4,5,6,7,8,9,10]\n${Array.from(
    { length: 80 },
    (_, i) => `b${i}: *a`,
  ).join('\n')}\n---\nBody\n`;
  const f = await fixture(t, {}, (req, res) =>
    json(res, bomb, 200, 'text/markdown'),
  );
  const r = await f.send({ action: 'catalog-detail', skill: skillId });
  assert.equal(r.body.code, 'catalog-response');
});

test('reassociate is refused when another live record owns the same destination copy', async (t) => {
  const f = await fixture(t, {}, installServer());
  assert.equal(
    (await f.send({ action: 'catalog-install', skill: skillId, confirm: true }))
      .status,
    200,
  );
  // Same copy, different catalog identity, identical bytes: must not be adopted a second time.
  const r = await f.send({
    action: 'catalog-install',
    skill: { catalog: 'clawhub', owner: 'other', slug: 'alpha' },
    confirm: true,
    reassociate: true,
  });
  assert.equal(r.body.code, 'repo-conflict');
  const list = await f.send({ action: 'list' });
  assert.equal(list.body.catalogInstalls.length, 1);
});
