// repository subscriptions and tracked installation, through the registered host route.
// Security posture asserted below (explicit, not implied):
//  - bounded processing: archive bytes, expanded bytes, entry count, depth and wall-clock time;
//  - no shell: git runs through argv spawn, proven with a recording fake git and metacharacter paths;
//  - URL policy: only https/http Git, GitHub shorthand/URL and absolute local folders; no file:// or ssh,
//    no credentials in URLs, loopback/private hosts refused, redirects never followed (git and archive);
//  - scanned content: path traversal, links and special files never reach the snapshot;
//  - server-side validation only: every id, path, ref and snapshot is re-checked by the host;
//  - network tests use local fixtures only (local git repositories and 127.0.0.1 servers).
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rename,
  rm,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { Zip, ZipDeflate } from 'fflate';
import { privateAddress } from '../dist/skills-repos.js';
import { apply } from '../dist/skills.js';
import {
  archiveServer,
  git,
  gitCommit,
  gitHttpServer,
  gitRepo,
  githubZip,
  skillDoc,
  writeFiles,
} from './skill-manager-repos-fixtures.mjs';

/** `existing` = { root, skills } starts another host over the same state directory (a restart). */
async function fixture(t, repositories = {}, existing = undefined) {
  const root =
    existing?.root ??
    (await realpath(await mkdtemp(join(tmpdir(), 'waycraft-repo-'))));
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
        { id: 'user-dsh', path: join(root, existing?.skills ?? 'skills') },
        { id: 'user-agents', path: join(root, 'agents') },
      ],
      statePath: join(root, 'state', 'state.json'),
      repositories: { allowPrivateHosts: true, ...repositories },
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
  const add = (input, options) =>
    send({ action: 'repo-add', repository: input }, options);
  const repo = async (id) =>
    (await send({ action: 'list' })).body.repositories.find((r) => r.id === id);
  return { root, send, add, repo, stop };
}
const hex40 = /^[0-9a-f]{40}$/;
const sha = (value) => createHash('sha256').update(value).digest('hex');
const skills = (names) =>
  Object.fromEntries(
    names.map((name) => [`skills/${name}/SKILL.md`, skillDoc(name)]),
  );

test('local Git repository: ref and subdirectory select a Git commit snapshot, scanned with source attribution', async (t) => {
  const { root, add, send } = await fixture(t);
  const source = join(root, 'upstream');
  const first = await gitRepo(
    source,
    {
      ...skills(['alpha', 'beta']),
      'other/gamma/SKILL.md': skillDoc('gamma'),
      'skills/alpha/data.bin': Buffer.from([0, 255, 1]),
    },
    { tag: 'v1' },
  );
  const second = await gitCommit(source, skills(['delta']));
  const main = await add({ url: source, ref: 'main', subdirectory: 'skills' });
  assert.equal(main.status, 200, JSON.stringify(main.body));
  const [entry] = main.body.repositories;
  assert.equal(entry.kind, 'git');
  assert.equal(entry.fingerprint, second);
  assert.match(entry.fingerprint, hex40);
  assert.equal(entry.fingerprintKind, 'git-commit');
  assert.equal(entry.ref, 'main');
  assert.equal(entry.subdirectory, 'skills');
  assert.deepEqual(
    entry.skills.map((s) => s.name),
    ['alpha', 'beta', 'delta'],
  );
  assert.ok(entry.skills.every((s) => s.valid && s.status === 'available'));
  // A tag selects another snapshot of the same repository; gamma lives outside the subdirectory.
  const tagged = await add({ url: source, ref: 'v1', subdirectory: 'skills' });
  const v1 = tagged.body.repositories.find((r) => r.ref === 'v1');
  assert.equal(v1.fingerprint, first);
  assert.deepEqual(
    v1.skills.map((s) => s.name),
    ['alpha', 'beta'],
  );
  // The whole repository, no subdirectory, finds gamma too.
  const whole = await add({ url: source, ref: 'main' });
  assert.deepEqual(
    whole.body.repositories
      .find((r) => r.ref === 'main' && !r.subdirectory)
      .skills.map((s) => s.name),
    ['alpha', 'beta', 'delta', 'gamma'],
  );
  assert.equal(
    (await add({ url: source, ref: 'main', subdirectory: 'skills' })).body.code,
    'repo-duplicate',
  );
  // Unmarked list never exposes local repository paths.
  const plain = await send({ action: 'list' }, { marker: false });
  assert.deepEqual(plain.body.repositories ?? [], []);
});

test('plain local folder is scanned in place with a content fingerprint, never as a Git commit; links are not followed', async (t) => {
  const { root, add } = await fixture(t);
  const folder = join(root, 'plain');
  await writeFiles(folder, {
    'alpha/SKILL.md': skillDoc('alpha'),
    'alpha/notes/readme.txt': 'hello',
    'broken/SKILL.md': 'no front matter',
  });
  const outside = join(root, 'outside');
  await writeFiles(outside, { 'SKILL.md': skillDoc('stolen') });
  await symlink(outside, join(folder, 'linked-dir'));
  await symlink(join(outside, 'SKILL.md'), join(folder, 'linked-file.md'));
  await symlink(join(outside, 'SKILL.md'), join(folder, 'alpha', 'extra.md'));
  const result = await add({ url: folder });
  assert.equal(result.status, 200, JSON.stringify(result.body));
  const [entry] = result.body.repositories;
  assert.equal(entry.fingerprintKind, 'folder-sha256');
  assert.match(entry.fingerprint, /^[0-9a-f]{64}$/);
  assert.deepEqual(
    entry.skills.map((s) => [s.name, s.valid]),
    [
      ['alpha', true],
      ['broken', false],
    ],
  );
  assert.equal(entry.skills[0].files, 2, 'link payloads are not scanned');
  assert.equal(entry.skills[1].code, 'repo-skill-metadata');
});

test('hardened URL and path policy rejects unsupported schemes, credentials, option injection and unsafe refs before any process runs', async (t) => {
  const { root, add } = await fixture(t);
  const bad = [
    'file:///etc',
    'ssh://git@host/x/y',
    'git@github.com:owner/name.git',
    'ftp://example.test/x.git',
    'https://user:pass@example.test/x.git',
    'https://user@example.test/x.git',
    'http://github.com/owner/name',
    'https://github.com.evil.test/owner/name',
    '--upload-pack=touch /tmp/pwned',
    '-oProxyCommand=x',
    'ext::sh -c touch /tmp/pwned',
    'https://example.test/x.git?a=b',
    'https://example.test/x y.git',
    'relative/path/not/github/ok',
    'x'.repeat(2049),
    '',
  ];
  for (const url of bad)
    assert.equal((await add({ url })).body.code, 'repo-url', url);
  const url = 'https://example.test/x.git';
  for (const ref of [
    '--help',
    'a..b',
    '/abs',
    'trail/',
    'a b',
    'x'.repeat(201),
  ])
    assert.equal((await add({ url, ref })).body.code, 'repo-ref', ref);
  for (const subdirectory of [
    '../x',
    'a/../b',
    '/abs',
    'a\\b',
    'a//b',
    'a/.',
    'C:x',
    'nul',
    'x'.repeat(513),
  ])
    assert.equal(
      (await add({ url, subdirectory })).body.code,
      'repo-subdirectory',
      subdirectory,
    );
  assert.equal((await add({ url: 5 })).body.code, 'repo-url');
  assert.equal((await add(null)).body.code, 'repo-url');
  // A missing local folder or a file is a local-source error, not an unspecified failure.
  assert.equal(
    (await add({ url: join(root, 'missing') })).body.code,
    'repo-local',
  );
  await writeFile(join(root, 'file'), 'x');
  assert.equal(
    (await add({ url: join(root, 'file') })).body.code,
    'repo-local',
  );
});

test('git is spawned with argv only: shell metacharacters stay literal, hardened options are fixed and secrets are not forwarded', async (t) => {
  const marker = join(
    await realpath(tmpdir()),
    `waycraft-pwned-${process.pid}`,
  );
  t.after(() => rm(marker, { force: true }));
  const record = await mkdtemp(
    join(await realpath(tmpdir()), 'waycraft-fakegit-'),
  );
  t.after(() => rm(record, { recursive: true, force: true }));
  const fake = join(record, 'git');
  await writeFile(
    fake,
    `#!/bin/sh\nprintf '%s\\n' "$@" >> '${record}/argv'\nenv >> '${record}/env'\ncase \"$*\" in *fetch*) exit 3;; esac\nexit 0\n`,
  );
  await chmod(fake, 0o755);
  process.env.GITHUB_TOKEN = 'super-secret-token';
  t.after(() => delete process.env.GITHUB_TOKEN);
  const { root, add } = await fixture(t, { git: fake });
  const evil = join(root, `a;touch ${marker};$(touch ${marker})`);
  await writeFiles(evil, { 'x/SKILL.md': skillDoc('x') });
  git(evil, 'init', '-q', '-b', 'main');
  const result = await add({ url: evil });
  assert.equal(result.body.code, 'repo-git');
  await assert.rejects(lstat(marker), { code: 'ENOENT' });
  const argv = (await readFile(join(record, 'argv'), 'utf8')).split('\n');
  assert.ok(argv.includes('--'), 'user input follows the -- separator');
  assert.ok(argv.indexOf('--') < argv.indexOf(evil));
  assert.ok(argv.includes('protocol.ext.allow=never'));
  assert.ok(argv.includes('core.symlinks=false'));
  assert.ok(argv.includes('core.hooksPath=/dev/null'));
  const env = await readFile(join(record, 'env'), 'utf8');
  assert.doesNotMatch(env, /GITHUB_TOKEN|super-secret-token/);
  assert.match(env, /GIT_TERMINAL_PROMPT=0/);
  assert.doesNotMatch(
    JSON.stringify((await add({ url: evil })).body),
    /super-secret-token/,
  );
});

test('Git processing is time-bounded and a hung git process is killed', async (t) => {
  const record = await mkdtemp(
    join(await realpath(tmpdir()), 'waycraft-hanggit-'),
  );
  t.after(() => rm(record, { recursive: true, force: true }));
  const fake = join(record, 'git');
  await writeFile(
    fake,
    `#!/bin/sh\necho $$ > '${record}/pid'\nexec sleep 30\n`,
  );
  await chmod(fake, 0o755);
  // Budget leaves room for a loaded machine to start the shell before the deadline fires.
  const { root, add } = await fixture(t, { git: fake, timeoutMs: 1500 });
  const folder = join(root, 'repo');
  await writeFiles(folder, { 'a/SKILL.md': skillDoc('a') });
  git(folder, 'init', '-q', '-b', 'main');
  const started = Date.now();
  const result = await add({ url: folder });
  assert.equal(result.body.code, 'repo-timeout');
  assert.ok(Date.now() - started < 5000);
  // Under load the shell may write its pid file a moment after the timeout fired: wait for it.
  let pidText = '';
  for (let i = 0; i < 40 && !pidText; i++) {
    pidText = await readFile(join(record, 'pid'), 'utf8').catch(() => '');
    if (!pidText) await new Promise((resolve) => setTimeout(resolve, 50));
  }
  const pid = Number(pidText.trim());
  // The timed-out Git child is killed asynchronously: wait for the process to be gone (bounded) rather than sleeping.
  let gone = false;
  for (let i = 0; i < 100 && !gone; i++) {
    try {
      process.kill(pid, 0);
      await new Promise((resolve) => setTimeout(resolve, 20));
    } catch (error) {
      gone = error.code === 'ESRCH';
      if (!gone) throw error;
    }
  }
  assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' });
});

test('HTTP Git over loopback is refused by default, followed only without redirects, and works against a controlled local smart-HTTP server', async (t) => {
  const bare = await mkdtemp(join(await realpath(tmpdir()), 'waycraft-http-'));
  t.after(() => rm(bare, { recursive: true, force: true }));
  const work = join(bare, 'work');
  const commit = await gitRepo(work, skills(['alpha']));
  git(bare, 'clone', '-q', '--bare', work, join(bare, 'srv.git'));
  const server = await gitHttpServer(bare);
  t.after(() => server.close());
  const url = `${server.url}/srv.git`;
  // SSRF policy: loopback is refused unless the test seam allows it; no request leaves the host.
  const closed = await fixture(t, { allowPrivateHosts: false });
  assert.equal((await closed.add({ url })).body.code, 'repo-host');
  assert.equal(
    (await closed.add({ url: 'http://[::1]:9/x.git' })).body.code,
    'repo-host',
  );
  assert.equal(
    (await closed.add({ url: 'http://10.0.0.5/x.git' })).body.code,
    'repo-host',
  );
  assert.equal(
    (await closed.add({ url: 'http://169.254.169.254/x.git' })).body.code,
    'repo-host',
  );
  assert.equal(
    (await closed.add({ url: 'http://localhost/x.git' })).body.code,
    'repo-host',
  );
  assert.equal(
    (await closed.add({ url: 'http://0x7f.1/x.git' })).body.code,
    'repo-host',
  );
  assert.deepEqual(server.hits, []);
  const open = await fixture(t);
  const ok = await open.add({ url, ref: 'main' });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  assert.equal(ok.body.repositories[0].fingerprint, commit);
  assert.equal(ok.body.repositories[0].kind, 'git');
  // A redirect (to another local server) is never followed: the target sees no request.
  const target = await archiveServer((_, response) => response.end('x'));
  t.after(() => target.close());
  const redirecting = await gitHttpServer(bare, { redirect: target.url });
  t.after(() => redirecting.close());
  const refused = await open.add({
    url: `${redirecting.url}/srv.git`,
    ref: 'main',
  });
  assert.equal(refused.body.code, 'repo-network');
  assert.deepEqual(target.hits, []);
});

test('GitHub archive: shorthand and URL resolve to a content fingerprint, not a commit; redirects, size, entry, traversal and time bounds hold', async (t) => {
  const good = githubZip({
    'skills/alpha/SKILL.md': skillDoc('alpha'),
    'skills/alpha/data.bin': Buffer.from([9, 8, 7]),
    'README.md': 'readme',
  });
  const server = await archiveServer((request, response) => {
    const url = request.url;
    if (url === '/owner/name/zip/refs/heads/main') {
      response.writeHead(200, { 'content-type': 'application/zip' });
      response.end(good);
    } else if (url === '/owner/big/zip/HEAD') {
      response.writeHead(200, { 'content-length': String(good.length) });
      response.end(good);
    } else if (url === '/owner/redir/zip/HEAD') {
      response.writeHead(302, { location: 'http://127.0.0.1:1/x' });
      response.end();
    } else if (url === '/owner/hang/zip/HEAD') {
      response.writeHead(200);
    } else if (url === '/owner/traverse/zip/HEAD') {
      response.end(
        githubZip({ '../evil/SKILL.md': skillDoc('evil') }, 'repo-main'),
      );
    } else if (url === '/owner/many/zip/HEAD') {
      response.end(
        githubZip(
          Object.fromEntries(
            Array.from({ length: 50 }, (_, i) => [`f${i}.txt`, 'x']),
          ),
        ),
      );
    } else {
      response.writeHead(404);
      response.end();
    }
  });
  t.after(() => server.close());
  const { add, send } = await fixture(t, {
    githubArchiveBase: server.url,
    timeoutMs: 600,
    maxArchiveBytes: good.length + 1,
    maxEntries: 20,
  });
  const byShorthand = await add({
    url: 'owner/name',
    ref: 'main',
    subdirectory: 'skills',
  });
  assert.equal(byShorthand.status, 200, JSON.stringify(byShorthand.body));
  const [entry] = byShorthand.body.repositories;
  assert.equal(entry.kind, 'github');
  assert.equal(entry.label, 'owner/name');
  assert.equal(entry.fingerprintKind, 'archive-sha256');
  assert.equal(entry.fingerprint, sha(good));
  assert.doesNotMatch(entry.fingerprint, /^[0-9a-f]{40}$/);
  assert.deepEqual(
    entry.skills.map((s) => s.name),
    ['alpha'],
  );
  // The GitHub URL form with /tree/<ref>/<subdirectory> is the same subscription identity.
  assert.equal(
    (await add({ url: 'https://github.com/owner/name/tree/main/skills' })).body
      .code,
    'repo-duplicate',
  );
  assert.equal(
    (await add({ url: 'owner/missing' })).body.code,
    'repo-notfound',
  );
  assert.equal((await add({ url: 'owner/redir' })).body.code, 'repo-network');
  assert.equal((await add({ url: 'owner/hang' })).body.code, 'repo-timeout');
  assert.equal(
    (await add({ url: 'owner/traverse' })).body.code,
    'repo-archive',
  );
  assert.equal((await add({ url: 'owner/many' })).body.code, 'repo-limit');
  // Not a zip at all.
  const junk = await archiveServer((_, response) => response.end('not a zip'));
  t.after(() => junk.close());
  const other = await fixture(t, { githubArchiveBase: junk.url });
  assert.equal(
    (await other.add({ url: 'owner/junk' })).body.code,
    'repo-archive',
  );
  // Too many bytes: second fixture with a tiny archive budget.
  const tiny = await fixture(t, {
    githubArchiveBase: server.url,
    maxArchiveBytes: 100,
  });
  assert.equal((await tiny.add({ url: 'owner/big' })).body.code, 'repo-limit');
  assert.ok(entry.id);
  assert.equal((await send({ action: 'list' })).body.repositories.length, 1);
});

test('scan bounds: entry count, depth, SKILL.md size and per-skill limits are enforced on local content', async (t) => {
  const { root, add } = await fixture(t, { maxEntries: 30 });
  const many = join(root, 'many');
  await writeFiles(
    many,
    Object.fromEntries(
      Array.from({ length: 40 }, (_, i) => [`f${i}.txt`, 'x']),
    ),
  );
  assert.equal((await add({ url: many })).body.code, 'repo-limit');
  const deep = join(root, 'deep');
  await writeFiles(deep, { [`${'d/'.repeat(20)}SKILL.md`]: skillDoc('deep') });
  assert.equal((await add({ url: deep })).body.code, 'repo-limit');
  const ok = join(root, 'ok');
  await writeFiles(ok, {
    'big/SKILL.md': skillDoc('big', 'Big', 'x'.repeat(300 * 1024)),
    'huge/SKILL.md': skillDoc('huge'),
    'huge/data.bin': Buffer.alloc(2 * 1024 * 1024, 1),
    'fine/SKILL.md': skillDoc('fine'),
  });
  const result = await add({ url: ok });
  assert.equal(result.status, 200, JSON.stringify(result.body));
  assert.deepEqual(
    result.body.repositories[0].skills.map((s) => [
      s.name ?? s.path,
      s.valid,
      s.code,
    ]),
    [
      ['big', false, 'repo-skill-limit'],
      ['fine', true, undefined],
      ['huge', false, 'repo-skill-limit'],
    ],
  );
});

test('tracked install copies exact snapshot bytes, refuses conflicts and stale snapshots and reports local modification', async (t) => {
  const { root, add, send, repo } = await fixture(t);
  const source = join(root, 'upstream');
  await gitRepo(source, {
    ...skills(['alpha', 'beta']),
    'skills/alpha/data.bin': Buffer.from([0, 255, 1, 2]),
    'skills/alpha/ref/guide.md': '# guide',
    'skills/broken/SKILL.md': 'broken',
  });
  const added = await add({ url: source, ref: 'main', subdirectory: 'skills' });
  const entry = added.body.repositories[0];
  const install = (path, extra = {}) =>
    send({
      action: 'repo-install',
      id: entry.id,
      path,
      snapshot: entry.fingerprint,
      ...extra,
    });
  const done = await install('alpha');
  assert.equal(done.status, 200, JSON.stringify(done.body));
  const target = join(root, 'skills', 'alpha');
  assert.deepEqual(
    [...(await readFile(join(target, 'data.bin')))],
    [0, 255, 1, 2],
  );
  assert.equal(
    await readFile(join(target, 'ref', 'guide.md'), 'utf8'),
    '# guide',
  );
  assert.equal(
    await readFile(join(target, 'SKILL.md'), 'utf8'),
    skillDoc('alpha'),
  );
  const [record] = done.body.repoInstalls;
  assert.equal(record.name, 'alpha');
  assert.equal(record.source, 'user-dsh');
  assert.equal(record.scope, 'user');
  assert.equal(record.fingerprint, entry.fingerprint);
  assert.equal(record.fingerprintKind, 'git-commit');
  assert.equal(record.origin.url, source);
  assert.equal(record.origin.ref, 'main');
  assert.equal(record.origin.subdirectory, 'skills');
  assert.equal(record.status, 'installed');
  assert.ok(record.files.every((f) => /^[0-9a-f]{64}$/.test(f.hash)));
  // The installed copy is a normal discovered skill.
  assert.ok(done.body.copies.some((c) => c.name === 'alpha'));
  assert.equal(
    (await repo(entry.id)).skills.find((s) => s.path === 'alpha').status,
    'installed',
  );
  // Second install: same name exists, nothing is overwritten.
  assert.equal((await install('alpha')).body.code, 'repo-conflict');
  // An untracked same-name directory is never overwritten either.
  await writeFiles(join(root, 'skills', 'beta'), {
    'SKILL.md': skillDoc('beta', 'Mine'),
  });
  assert.equal((await install('beta')).body.code, 'repo-conflict');
  assert.equal(
    await readFile(join(root, 'skills', 'beta', 'SKILL.md'), 'utf8'),
    skillDoc('beta', 'Mine'),
  );
  assert.equal(
    (await repo(entry.id)).skills.find((s) => s.path === 'beta').status,
    'conflict',
  );
  // Invalid skills and unknown paths cannot be installed.
  assert.equal((await install('broken')).body.code, 'repo-skill-invalid');
  assert.equal((await install('nope')).body.code, 'repo-skill-missing');
  assert.equal((await install('../escape')).body.code, 'repo-skill-missing');
  assert.equal(
    (await install('alpha', { source: 'external' })).body.code,
    'create-readonly',
  );
  // A stale preview (snapshot changed by a refresh) is rejected.
  assert.equal(
    (
      await send({
        action: 'repo-install',
        id: entry.id,
        path: 'beta',
        snapshot: 'f'.repeat(40),
      })
    ).body.code,
    'repo-stale',
  );
  // Local edit is detected by content hash.
  await writeFile(join(target, 'SKILL.md'), skillDoc('alpha', 'Edited'));
  assert.equal(
    (await send({ action: 'list' })).body.repoInstalls[0].status,
    'modified',
  );
  // Shared Agents is also a user-scope destination.
  const agents = await send({
    action: 'repo-install',
    id: entry.id,
    path: 'alpha',
    snapshot: entry.fingerprint,
    source: 'user-agents',
  });
  assert.equal(agents.status, 200, JSON.stringify(agents.body));
  assert.equal(
    await readFile(join(root, 'agents', 'alpha', 'SKILL.md'), 'utf8'),
    skillDoc('alpha'),
  );
  // Marker is mandatory for every repository mutation.
  for (const action of [
    'repo-add',
    'repo-install',
    'repo-remove',
    'repo-refresh',
    'repo-refresh-all',
    'repo-uninstall',
  ])
    assert.equal(
      (await send({ action }, { marker: false })).status,
      403,
      action,
    );
});

test('uninstall moves the tracked copy to Trash with provenance; restore returns exact bytes and relinks; permanent delete forgets', async (t) => {
  const { root, add, send } = await fixture(t);
  const source = join(root, 'upstream');
  await gitRepo(source, {
    ...skills(['alpha']),
    'skills/alpha/data.bin': Buffer.from([5, 6, 7]),
  });
  const entry = (
    await add({ url: source, ref: 'main', subdirectory: 'skills' })
  ).body.repositories[0];
  const installed = await send({
    action: 'repo-install',
    id: entry.id,
    path: 'alpha',
    snapshot: entry.fingerprint,
  });
  const recordId = installed.body.repoInstalls[0].id;
  const target = join(root, 'skills', 'alpha');
  await writeFile(join(target, 'local-note.txt'), 'edited locally');
  const bytes = await readFile(join(target, 'local-note.txt'));
  const removed = await send({ action: 'repo-uninstall', installId: recordId });
  assert.equal(removed.status, 200, JSON.stringify(removed.body));
  await assert.rejects(lstat(target), { code: 'ENOENT' });
  assert.equal(removed.body.trash.length, 1);
  const trashed = removed.body.repoInstalls[0];
  assert.equal(trashed.status, 'trashed');
  assert.equal(trashed.trashId, removed.body.trash[0].id);
  assert.equal(trashed.fingerprint, entry.fingerprint);
  // Restore through the ordinary #151 Trash action.
  const restored = await send({ action: 'trash-restore', id: trashed.trashId });
  assert.equal(restored.status, 200, JSON.stringify(restored.body));
  assert.deepEqual(await readFile(join(target, 'local-note.txt')), bytes);
  assert.deepEqual([...(await readFile(join(target, 'data.bin')))], [5, 6, 7]);
  const after = restored.body.repoInstalls[0];
  assert.equal(after.id, recordId);
  assert.equal(after.trashId, undefined);
  assert.equal(
    after.status,
    'modified',
    'the exact local edit is restored, still attributed',
  );
  // Trashing through the generic Trash button also keeps provenance, and permanent delete forgets it.
  const copy = restored.body.copies.find((c) => c.name === 'alpha');
  const generic = await send({
    action: 'trash',
    id: copy.path,
    source: 'user-dsh',
  });
  assert.equal(generic.body.repoInstalls[0].status, 'trashed');
  const id = generic.body.trash[0].id;
  const purged = await send({ action: 'trash-delete', id, confirm: true });
  assert.equal(purged.status, 200);
  assert.deepEqual(purged.body.repoInstalls, []);
  assert.equal(
    (await send({ action: 'repo-uninstall', installId: 'missing' })).body.code,
    'repo-not-installed',
  );
});

test('unsubscribe removes the subscription and snapshot but keeps installed files and their source attribution', async (t) => {
  const { root, add, send } = await fixture(t);
  const source = join(root, 'upstream');
  await gitRepo(source, skills(['alpha']));
  const entry = (
    await add({ url: source, ref: 'main', subdirectory: 'skills' })
  ).body.repositories[0];
  await send({
    action: 'repo-install',
    id: entry.id,
    path: 'alpha',
    snapshot: entry.fingerprint,
  });
  const removed = await send({ action: 'repo-remove', id: entry.id });
  assert.equal(removed.status, 200, JSON.stringify(removed.body));
  assert.deepEqual(removed.body.repositories, []);
  assert.equal(
    await readFile(join(root, 'skills', 'alpha', 'SKILL.md'), 'utf8'),
    skillDoc('alpha'),
  );
  const [record] = removed.body.repoInstalls;
  assert.equal(record.status, 'installed');
  assert.equal(record.repoId, undefined, 'no live subscription remains');
  assert.equal(record.origin.url, source);
  assert.equal(record.fingerprint, entry.fingerprint);
  assert.equal(
    (await send({ action: 'repo-remove', id: entry.id })).body.code,
    'repo-not-found',
  );
  // Uninstalling a tracked copy of a removed subscription still goes through Trash.
  const gone = await send({ action: 'repo-uninstall', installId: record.id });
  assert.equal(gone.body.trash.length, 1);
});

test('refresh: single and bulk, with per-repository errors, retained previous snapshot and bounded busy handling', async (t) => {
  const { root, add, send, repo } = await fixture(t);
  const a = join(root, 'a');
  const b = join(root, 'b');
  const first = await gitRepo(a, skills(['alpha']));
  await gitRepo(b, skills(['beta']));
  const ea = (
    await add({ url: a, ref: 'main', subdirectory: 'skills' })
  ).body.repositories.find((r) => r.url === a);
  const eb = (
    await add({ url: b, ref: 'main', subdirectory: 'skills' })
  ).body.repositories.find((r) => r.url === b);
  const second = await gitCommit(a, skills(['gamma']));
  const single = await send({ action: 'repo-refresh', id: ea.id });
  assert.equal(single.status, 200, JSON.stringify(single.body));
  const updated = single.body.repositories.find((r) => r.id === ea.id);
  assert.equal(updated.fingerprint, second);
  assert.notEqual(updated.fingerprint, first);
  assert.deepEqual(
    updated.skills.map((s) => s.name),
    ['alpha', 'gamma'],
  );
  // Repository b disappears; bulk refresh reports per-repo outcomes and keeps b's usable snapshot.
  await rm(b, { recursive: true, force: true });
  const third = await gitCommit(a, skills(['omega']));
  const bulk = await send({ action: 'repo-refresh-all' });
  assert.equal(bulk.status, 200, JSON.stringify(bulk.body));
  assert.deepEqual(
    bulk.body.result.refreshed.map((r) => r.id),
    [ea.id],
  );
  assert.deepEqual(
    bulk.body.result.failed.map((r) => [r.id, r.code]),
    [[eb.id, 'repo-local']],
  );
  assert.equal(bulk.body.result.total, 2);
  const kept = await repo(eb.id);
  assert.equal(kept.error.code, 'repo-local');
  assert.deepEqual(
    kept.skills.map((s) => s.name),
    ['beta'],
    'usable previous snapshot stays visible',
  );
  assert.equal(kept.fingerprint, eb.fingerprint);
  assert.equal((await repo(ea.id)).fingerprint, third);
  assert.equal((await repo(ea.id)).error, undefined);
  // A previous snapshot is still installable after a failed refresh.
  assert.equal(
    (
      await send({
        action: 'repo-install',
        id: eb.id,
        path: 'beta',
        snapshot: kept.fingerprint,
      })
    ).status,
    200,
  );
  assert.equal(
    (await send({ action: 'repo-refresh', id: 'unknown' })).body.code,
    'repo-not-found',
  );
  // Concurrent refreshes of one repository: one runs, the other is refused as busy.
  const [one, two] = await Promise.all([
    send({ action: 'repo-refresh', id: ea.id }),
    send({ action: 'repo-refresh', id: ea.id }),
  ]);
  assert.deepEqual([one.status, two.status].sort(), [200, 409]);
  assert.equal([one, two].find((r) => r.status === 409).body.code, 'repo-busy');
});

test('a refresh that finishes after the subscription was removed or replaced is discarded (stale result)', async (t) => {
  const gate = await archiveServer(() => {});
  t.after(() => gate.close());
  let release;
  const held = new Promise((resolve) => (release = resolve));
  const good = githubZip({ 'a/SKILL.md': skillDoc('a') });
  const server = await archiveServer(async (request, response) => {
    if (request.headers['x-hold'] || globalThis.__hold) await held;
    response.end(good);
  });
  t.after(() => server.close());
  const { add, send } = await fixture(t, { githubArchiveBase: server.url });
  const added = await add({ url: 'owner/name' });
  const id = added.body.repositories[0].id;
  globalThis.__hold = true;
  t.after(() => delete globalThis.__hold);
  const pending = send({ action: 'repo-refresh', id });
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal((await send({ action: 'repo-remove', id })).status, 200);
  release();
  const result = await pending;
  assert.equal(result.body.code, 'repo-not-found');
  assert.deepEqual((await send({ action: 'list' })).body.repositories, []);
});

test('repository state is separate Waycraft state: bad state is isolated with an explicit error and never read from the reference manager', async (t) => {
  const { root, send, add } = await fixture(t);
  const source = join(root, 'upstream');
  await gitRepo(source, skills(['alpha']));
  await add({ url: source, ref: 'main', subdirectory: 'skills' });
  const file = join(root, 'state', 'repositories.json');
  const saved = JSON.parse(await readFile(file, 'utf8'));
  assert.equal(saved.version, 1);
  assert.ok(!('trash' in saved));
  assert.doesNotMatch(JSON.stringify(saved), /password|token|secret/i);
  await writeFile(file, '{ not json');
  const listed = await send({ action: 'list' });
  assert.equal(listed.status, 200, 'ordinary catalog stays available');
  assert.equal(listed.body.repoError, 'repo-state-invalid');
  assert.equal(
    (await add({ url: source, ref: 'main' })).body.code,
    'repo-state-invalid',
  );
  assert.equal(
    await readFile(file, 'utf8'),
    '{ not json',
    'bad state is never overwritten',
  );
});

test('too many subscriptions are refused and shutdown cancels an in-flight refresh', async (t) => {
  let release;
  const held = new Promise((resolve) => (release = resolve));
  const server = await archiveServer(async (_, response) => {
    await held;
    response.end(githubZip({ 'a/SKILL.md': skillDoc('a') }));
  });
  t.after(() => {
    release();
    return server.close();
  });
  const { add, send } = await fixture(t, {
    githubArchiveBase: server.url,
    maxRepositories: 2,
  });
  release();
  assert.equal((await add({ url: 'o/a' })).status, 200);
  assert.equal((await add({ url: 'o/b' })).status, 200);
  assert.equal((await add({ url: 'o/c' })).body.code, 'repo-limit');
  assert.equal((await send({ action: 'list' })).body.repositories.length, 2);
  // Aborting the request cancels a stuck refresh without changing the stored snapshot.
  const hang = await archiveServer(() => {});
  t.after(() => hang.close());
  const open = await fixture(t, {
    githubArchiveBase: hang.url,
    timeoutMs: 20000,
  });
  const controller = new AbortController();
  const pending = open.add({ url: 'o/hang' }, { signal: controller.signal });
  await new Promise((resolve) => setTimeout(resolve, 100));
  controller.abort();
  const result = await Promise.race([
    pending,
    new Promise((resolve) => setTimeout(() => resolve('stuck'), 4000)),
  ]);
  assert.notEqual(result, 'stuck');
  assert.deepEqual((await open.send({ action: 'list' })).body.repositories, []);
});

/** Streams a zip whose single entry inflates to `megabytes` MiB of zeros (~1000:1) without holding it. */
function bombZip(megabytes) {
  const chunks = [];
  const zip = new Zip((error, chunk) => {
    assert.ifError(error);
    chunks.push(Buffer.from(chunk));
  });
  const entry = new ZipDeflate('repo-main/skills/bomb/data.bin', { level: 1 });
  zip.add(entry);
  const block = new Uint8Array(1024 * 1024);
  for (let i = 0; i < megabytes; i += 1) entry.push(block, i === megabytes - 1);
  zip.end();
  return Buffer.concat(chunks);
}

test('expansion bomb: extraction stops at the limit with repo-limit and never inflates the whole entry', async (t) => {
  const bomb = bombZip(320);
  assert.ok(bomb.length < 4 * 1024 * 1024, `compressed ${bomb.length}`);
  const server = await archiveServer((_, response) => response.end(bomb));
  t.after(() => server.close());
  const { add, send } = await fixture(t, {
    githubArchiveBase: server.url,
    maxTotalBytes: 2 * 1024 * 1024,
  });
  const result = await add({ url: 'owner/bomb' });
  assert.equal(result.body.code, 'repo-limit', JSON.stringify(result.body));
  assert.deepEqual((await send({ action: 'list' })).body.repositories, []);
  // Peak memory is measured in a fresh process: this process's RSS high-water mark is already large
  // and would hide growth. Fully inflating the entry would need >300 MiB on top of the baseline.
  const child = await promisify(execFile)(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `import { apply } from ${JSON.stringify(new URL('../dist/skills.js', import.meta.url).href)};
      import { mkdtemp } from 'node:fs/promises';
      import { tmpdir } from 'node:os';
      import { join } from 'node:path';
      const root = await mkdtemp(join(tmpdir(), 'waycraft-bomb-'));
      let route;
      apply({ skills: { registerProvider: () => () => {} }, effect(fn) { fn(); },
        inject(_, fn) { fn({ effect(fn) { fn(); }, get() { return { fetch: { register(v) { route = v; return () => {}; } } }; } }); } },
        { sources: [{ id: 'user-dsh', path: join(root, 'skills') }], statePath: join(root, 'state', 'state.json'),
          repositories: { allowPrivateHosts: true, githubArchiveBase: process.argv[1], maxTotalBytes: 2 * 1024 * 1024 } });
      const before = process.resourceUsage().maxRSS;
      const r = await route.fetch(new Request('http://localhost/api/waycraft-skills.catalog', { method: 'POST',
        headers: { 'content-type': 'application/json', 'x-waycraft-skills': '1' },
        body: JSON.stringify({ source: 'user-dsh', action: 'repo-add', repository: { url: 'owner/bomb' } }) }));
      const body = await r.json();
      console.log(JSON.stringify({ code: body.code, grown: (process.resourceUsage().maxRSS - before) / 1024 }));
      process.exit(0);`,
      server.url,
    ],
    { encoding: 'utf8', timeout: 60_000 },
  );
  const measured = JSON.parse(child.stdout.trim().split('\n').pop());
  assert.equal(measured.code, 'repo-limit');
  assert.ok(
    measured.grown < 120,
    `peak RSS grew ${measured.grown.toFixed(0)} MiB`,
  );
});

test('an archive over the total limit reports repo-limit, not repo-archive', async (t) => {
  const zip = githubZip({
    'skills/a/SKILL.md': skillDoc('a'),
    'skills/a/data.bin': Buffer.alloc(300 * 1024, 7),
  });
  const server = await archiveServer((_, response) => response.end(zip));
  t.after(() => server.close());
  const { add } = await fixture(t, {
    githubArchiveBase: server.url,
    maxTotalBytes: 100 * 1024,
  });
  assert.equal((await add({ url: 'owner/over' })).body.code, 'repo-limit');
});

test('SSRF policy blocks reserved IPv4 and every IPv6 form that embeds or aliases a private address', async (t) => {
  const blocked = [
    '198.18.0.1',
    '198.19.255.254',
    '192.0.2.7',
    '198.51.100.7',
    '203.0.113.7',
    '127.0.0.1',
    '::7f00:1',
    '::127.0.0.1',
    '::a00:1',
    '::10.1.2.3',
    '::1',
    '::',
    '::ffff:7f00:1',
    '::ffff:198.18.0.1',
    '::ffff:c612:1',
    '64:ff9b::7f00:1',
    '64:ff9b::a00:1',
    '64:ff9b::192.168.1.1',
    '64:ff9b:1::1',
    '2002:7f00:1::1',
    '2002:c0a8:101::',
    '2002:a00:1:5::2',
    '2001::1',
    '2001:db8::1',
    'fec0::1',
    'feff::1',
    'fe80::1',
    'fc00::1',
    'fdff::1',
    'ff02::1',
  ];
  for (const address of blocked)
    assert.equal(privateAddress(address), true, address);
  for (const address of [
    '8.8.8.8',
    '1.1.1.1',
    '198.17.255.255',
    '198.20.0.1',
    '2606:4700:4700::1111',
    '64:ff9b::808:808',
    '::ffff:8.8.8.8',
  ])
    assert.equal(privateAddress(address), false, address);
  // The same policy applies to literals in a subscription URL when private hosts are not allowed.
  const strict = await fixture(t, { allowPrivateHosts: false });
  for (const host of [
    '[::7f00:1]',
    '[64:ff9b::7f00:1]',
    '[2002:7f00:1::1]',
    '[fec0::1]',
    '[2001:db8::1]',
    '[fc00::1]',
    '[::10.0.0.1]',
    '198.18.0.1',
    '192.0.2.1',
  ])
    assert.equal(
      (await strict.add({ url: `http://${host}/x.git` })).body.code,
      'repo-host',
      host,
    );
});

test('state size cap is enforced at write time: a hostile large repository is refused and existing subscriptions and provenance survive', async (t) => {
  const { root, add, send, repo } = await fixture(t, { maxStateBytes: 12_000 });
  const small = join(root, 'small');
  await gitRepo(small, skills(['alpha']));
  const first = await add({ url: small, ref: 'main', subdirectory: 'skills' });
  assert.equal(first.status, 200, JSON.stringify(first.body));
  const entry = first.body.repositories[0];
  const installed = await send({
    action: 'repo-install',
    id: entry.id,
    path: 'alpha',
    snapshot: entry.fingerprint,
  });
  assert.equal(installed.status, 200, JSON.stringify(installed.body));
  const file = join(root, 'state', 'repositories.json');
  const before = await readFile(file, 'utf8');
  assert.ok(before.length < 12_000);
  const hostile = join(root, 'hostile');
  await writeFiles(
    hostile,
    Object.fromEntries(
      Array.from({ length: 40 }, (_, i) => [
        `skill-${i}/SKILL.md`,
        skillDoc(`skill-${i}`, 'd'.repeat(900)),
      ]),
    ),
  );
  const refused = await add({ url: hostile });
  assert.equal(refused.body.code, 'repo-limit', JSON.stringify(refused.body));
  assert.equal(await readFile(file, 'utf8'), before, 'state is unchanged');
  const listed = await send({ action: 'list' });
  assert.equal(listed.body.repoError, undefined);
  assert.equal(listed.body.repositories.length, 1);
  assert.equal(listed.body.repoInstalls[0].status, 'installed');
  assert.equal(
    (await repo(entry.id)).skills.find((s) => s.path === 'alpha').status,
    'installed',
  );
  // The refused snapshot is not left behind and a later valid add still works.
  const leftovers = await readdir(join(root, 'state', 'repository-snapshots'));
  assert.deepEqual(
    leftovers.filter((name) => !name.startsWith(entry.id)),
    [],
  );
});

test('a repository that grows past the cap on refresh is refused and keeps the previous snapshot', async (t) => {
  const { root, add, send } = await fixture(t, { maxStateBytes: 12_000 });
  const source = join(root, 'grow');
  await gitRepo(source, skills(['alpha']));
  const added = await add({ url: source, ref: 'main', subdirectory: 'skills' });
  const entry = added.body.repositories[0];
  const file = join(root, 'state', 'repositories.json');
  const before = await readFile(file, 'utf8');
  await gitCommit(
    source,
    Object.fromEntries(
      Array.from({ length: 40 }, (_, i) => [
        `skills/skill-${i}/SKILL.md`,
        skillDoc(`skill-${i}`, 'd'.repeat(900)),
      ]),
    ),
  );
  const refreshed = await send({ action: 'repo-refresh', id: entry.id });
  assert.equal(
    refreshed.body.code,
    'repo-limit',
    JSON.stringify(refreshed.body),
  );
  assert.equal(await readFile(file, 'utf8'), before);
  const install = await send({
    action: 'repo-install',
    id: entry.id,
    path: 'alpha',
    snapshot: entry.fingerprint,
  });
  assert.equal(install.status, 200, JSON.stringify(install.body));
});

test('tampered repositories.json is rejected as a whole and never acted on', async (t) => {
  const { root, add, send } = await fixture(t);
  const source = join(root, 'upstream');
  await gitRepo(source, skills(['alpha']));
  const added = await add({ url: source, ref: 'main', subdirectory: 'skills' });
  const entry = added.body.repositories[0];
  await send({
    action: 'repo-install',
    id: entry.id,
    path: 'alpha',
    snapshot: entry.fingerprint,
  });
  const file = join(root, 'state', 'repositories.json');
  const good = JSON.parse(await readFile(file, 'utf8'));
  assert.equal(good.installs.length, 1);
  const outside = join(root, 'outside');
  await writeFiles(outside, { 'keep.txt': 'keep' });
  const tampers = {
    'install name traversal': (s) => (s.installs[0].name = '../outside'),
    'install name uppercase': (s) => (s.installs[0].name = 'Alpha'),
    'install root relative': (s) => (s.installs[0].root = 'skills'),
    'install source unknown': (s) => (s.installs[0].source = 'project'),
    'install id shape': (s) => (s.installs[0].id = '../x'),
    'install trashId traversal': (s) => (s.installs[0].trashId = '../../x'),
    'install fingerprint': (s) => (s.installs[0].fingerprint = 'zz'),
    'install file path': (s) => (s.installs[0].files[0].path = '../x'),
    'install file hash': (s) => (s.installs[0].files[0].hash = 'nothex'),
    'install skillPath': (s) => (s.installs[0].skillPath = '../x'),
    'install scope': (s) => (s.installs[0].scope = 'project'),
    'repo id traversal': (s) => (s.repositories[0].id = '../snap'),
    'repo fingerprint': (s) => (s.repositories[0].fingerprint = '../x'),
    'repo kind mismatch': (s) =>
      (s.repositories[0].fingerprintKind = 'archive-sha256'),
    'repo skill name': (s) => (s.repositories[0].skills[0].name = '../x'),
    'repo skill path': (s) => (s.repositories[0].skills[0].path = '/etc'),
    'repo skill treeHash': (s) => (s.repositories[0].skills[0].treeHash = 'x'),
    'repo subdirectory traversal': (s) =>
      (s.repositories[0].subdirectory = '../secret'),
    'repo subdirectory absolute': (s) =>
      (s.repositories[0].subdirectory = '/etc'),
    'repo ref option-like': (s) => (s.repositories[0].ref = '--upload-pack=x'),
    'repo ref traversal': (s) => (s.repositories[0].ref = 'a/../b'),
    'repo url scheme': (s) => (s.repositories[0].url = 'ftp://host/x.git'),
    'repo url credentials': (s) =>
      (s.repositories[0].url = 'https://user:pw@host/x.git'),
    'repo url relative': (s) => (s.repositories[0].url = 'relative/dir'),
    'repo url not normalized': (s) =>
      (s.repositories[0].url = `${s.repositories[0].url}/../x`),
    'repo label differs from url': (s) => (s.repositories[0].label = '/else'),
    'repo owner on non-github': (s) => (s.repositories[0].owner = 'o'),
    'install origin subdirectory': (s) =>
      (s.installs[0].origin.subdirectory = '../secret'),
    'install origin ref': (s) => (s.installs[0].origin.ref = '-x'),
    'install origin url': (s) => (s.installs[0].origin.url = 'file:///etc'),
  };
  for (const [label, mutate] of Object.entries(tampers)) {
    const state = structuredClone(good);
    mutate(state);
    const text = JSON.stringify(state);
    await writeFile(file, text);
    const listed = await send({ action: 'list' });
    assert.equal(listed.body.repoError, 'repo-state-invalid', label);
    assert.deepEqual(listed.body.repoInstalls, [], label);
    for (const body of [
      { action: 'repo-uninstall', id: good.installs[0].id },
      { action: 'repo-remove', id: good.repositories[0].id },
      { action: 'repo-refresh', id: good.repositories[0].id },
    ])
      assert.equal(
        (await send(body)).body.code,
        'repo-state-invalid',
        `${label} ${body.action}`,
      );
    assert.equal(await readFile(file, 'utf8'), text, label);
    assert.equal(await readFile(join(outside, 'keep.txt'), 'utf8'), 'keep');
    assert.ok(
      (await lstat(join(root, 'skills', 'alpha'))).isDirectory(),
      `${label}: installed copy untouched`,
    );
  }
  await writeFile(file, JSON.stringify(good));
  assert.equal((await send({ action: 'list' })).body.repoInstalls.length, 1);
  // A root or destination that does not match the configured one is not a bad shape: the install
  // is reported as invalid-root, nothing is read or removed there, and the subscriptions stay.
  for (const mutate of [
    (s) => (s.installs[0].root = outside),
    (s) => (s.installs[0].source = 'user-agents'),
  ]) {
    const state = structuredClone(good);
    mutate(state);
    await writeFile(file, JSON.stringify(state));
    const view = await send({ action: 'list' });
    assert.equal(view.body.repoError, undefined);
    assert.equal(view.body.repositories.length, 1);
    assert.equal(view.body.repoInstalls[0].status, 'invalid-root');
    assert.equal(
      (await send({ action: 'repo-uninstall', installId: good.installs[0].id }))
        .body.code,
      'repo-invalid-root',
    );
    assert.equal(await readFile(join(outside, 'keep.txt'), 'utf8'), 'keep');
    assert.ok((await lstat(join(root, 'skills', 'alpha'))).isDirectory());
  }
  await writeFile(file, JSON.stringify(good));
});

test('conflict status covers <name>.md and every destination', async (t) => {
  const { root, add, send } = await fixture(t);
  const source = join(root, 'upstream');
  await gitRepo(source, skills(['alpha', 'beta', 'gamma']));
  const added = await add({ url: source, ref: 'main', subdirectory: 'skills' });
  const id = added.body.repositories[0].id;
  const statuses = async () => {
    const found = (await send({ action: 'list' })).body.repositories.find(
      (r) => r.id === id,
    );
    return Object.fromEntries(
      found.skills.map((s) => [s.name, [s.status, s.conflicts]]),
    );
  };
  assert.deepEqual(await statuses(), {
    alpha: ['available', []],
    beta: ['available', []],
    gamma: ['available', []],
  });
  await mkdir(join(root, 'skills'), { recursive: true });
  await writeFile(join(root, 'skills', 'alpha.md'), 'x');
  await writeFiles(join(root, 'agents', 'beta'), {
    'SKILL.md': skillDoc('beta'),
  });
  await writeFile(join(root, 'skills', 'gamma.md'), 'x');
  await writeFiles(join(root, 'agents', 'gamma'), {
    'SKILL.md': skillDoc('gamma'),
  });
  assert.deepEqual(await statuses(), {
    alpha: ['conflict', ['user-dsh']],
    beta: ['available', ['user-agents']],
    gamma: ['conflict', ['user-dsh', 'user-agents']],
  });
  // The view agrees with what install does.
  const entry = (await send({ action: 'list' })).body.repositories[0];
  const install = (path, source) =>
    send({
      action: 'repo-install',
      id,
      path,
      snapshot: entry.fingerprint,
      source,
    });
  assert.equal((await install('alpha', 'user-dsh')).body.code, 'repo-conflict');
  assert.equal(
    (await install('beta', 'user-agents')).body.code,
    'repo-conflict',
  );
  assert.equal((await install('alpha', 'user-agents')).status, 200);
});

const listed = async (send) => (await send({ action: 'list' })).body;

test('restart round trip: everything the writers persist (520-file skill, boundary names and depths) passes validation on the next start', async (t) => {
  const { root, add, send, stop } = await fixture(t);
  const source = join(root, 'upstream');
  const longName = `${'a'.repeat(49)}-${'b'.repeat(50)}`;
  assert.equal(longName.length, 100);
  const deep = Array.from({ length: 11 }, () => 'd'.repeat(40)).join('/');
  await gitRepo(source, {
    ...skills(['a', '0', 'x-1-y', longName]),
    'skills/big/SKILL.md': skillDoc('big', 'x'.repeat(1500)),
    ...Object.fromEntries(
      Array.from({ length: 520 }, (_, i) => [`skills/big/f/${i}.txt`, `${i}`]),
    ),
    [`skills/${deep}/SKILL.md`]: skillDoc('deep'),
    'skills/Bad Name/SKILL.md': skillDoc('Not_Valid'),
  });
  const added = await add({ url: source, ref: 'main', subdirectory: 'skills' });
  assert.equal(added.status, 200, JSON.stringify(added.body));
  const entry = added.body.repositories[0];
  const big = entry.skills.find((s) => s.path === 'big');
  assert.equal(big.valid, false);
  assert.equal(big.code, 'repo-skill-limit');
  assert.ok(big.files > 512);
  for (const path of ['a', longName]) {
    const installed = await send({
      action: 'repo-install',
      id: entry.id,
      path,
      snapshot: entry.fingerprint,
    });
    assert.equal(installed.status, 200, JSON.stringify(installed.body));
  }
  const before = await listed(send);
  await stop();
  const restarted = await fixture(t, {}, { root });
  const after = await listed(restarted.send);
  assert.equal(after.repoError, undefined, 'state survives restart');
  assert.deepEqual(
    after.repositories.map((r) => [r.id, r.skills.length]),
    before.repositories.map((r) => [r.id, r.skills.length]),
  );
  assert.equal(after.repoInstalls.length, 2);
  assert.ok(after.repoInstalls.every((r) => r.status === 'installed'));
  assert.ok(
    after.repositories[0].skills.some((s) => s.path === deep),
    'deep skill kept',
  );
});

test('a normalized URL longer than the persisted cap is refused at add, never stored', async (t) => {
  const { add, send } = await fixture(t, { allowPrivateHosts: false });
  // 400 non-ASCII characters are accepted as input but percent-encode to well over 2048 characters.
  const refused = await add({
    url: `https://example.test/${'é'.repeat(400)}.git`,
  });
  assert.equal(refused.body.code, 'repo-url', JSON.stringify(refused.body));
  assert.deepEqual((await listed(send)).repositories, []);
});

test('a changed destination root keeps subscriptions and snapshots, marks the install invalid-root and never acts outside the roots', async (t) => {
  const { root, add, send, stop } = await fixture(t);
  const source = join(root, 'upstream');
  await gitRepo(source, skills(['alpha', 'beta']));
  const entry = (
    await add({ url: source, ref: 'main', subdirectory: 'skills' })
  ).body.repositories[0];
  const installed = await send({
    action: 'repo-install',
    id: entry.id,
    path: 'alpha',
    snapshot: entry.fingerprint,
  });
  assert.equal(installed.status, 200, JSON.stringify(installed.body));
  const recordId = installed.body.repoInstalls[0].id;
  await stop();
  const moved = await fixture(t, {}, { root, skills: 'moved' });
  const view = await listed(moved.send);
  assert.equal(view.repoError, undefined);
  assert.equal(view.repositories.length, 1);
  assert.equal(view.repoInstalls[0].status, 'invalid-root');
  const alpha = view.repositories[0].skills.find((s) => s.path === 'alpha');
  assert.equal(alpha.status, 'available', 'installable into the new root');
  const refused = await moved.send({
    action: 'repo-uninstall',
    installId: recordId,
  });
  assert.equal(refused.body.code, 'repo-invalid-root');
  assert.ok(
    (await lstat(join(root, 'skills', 'alpha'))).isDirectory(),
    'old copy untouched',
  );
  await assert.rejects(lstat(join(root, 'moved', 'alpha')), { code: 'ENOENT' });
  // The subscription still works: refresh and install into the new destination.
  const again = await moved.send({
    action: 'repo-install',
    id: entry.id,
    path: 'beta',
    snapshot: entry.fingerprint,
  });
  assert.equal(again.status, 200, JSON.stringify(again.body));
  assert.ok((await lstat(join(root, 'moved', 'beta'))).isDirectory());
});

test('SIIT ::ffff:0:a.b.c.d embeds an IPv4 address and follows the IPv4 policy', () => {
  for (const address of [
    '::ffff:0:7f00:1',
    '::ffff:0:127.0.0.1',
    '::ffff:0:a00:1',
    '::ffff:0:10.1.2.3',
    '::ffff:0:c0a8:101',
  ])
    assert.equal(privateAddress(address), true, address);
  for (const address of ['::ffff:0:808:808', '::ffff:0:8.8.8.8'])
    assert.equal(privateAddress(address), false, address);
});

test('a failed refresh at the state cap reports its error gracefully instead of throwing repo-limit', async (t) => {
  const { root, add, send, stop } = await fixture(t);
  const source = join(root, 'upstream');
  await gitRepo(source, skills(['alpha']));
  const entry = (
    await add({ url: source, ref: 'main', subdirectory: 'skills' })
  ).body.repositories[0];
  const file = join(root, 'state', 'repositories.json');
  const size = (await readFile(file)).length;
  await stop();
  // The error record (code + timestamp) does not fit under a cap equal to the current size.
  const tight = await fixture(t, { maxStateBytes: size }, { root });
  await rm(source, { recursive: true, force: true });
  const single = await tight.send({ action: 'repo-refresh', id: entry.id });
  assert.equal(single.status, 200, JSON.stringify(single.body));
  assert.equal(single.body.result.error, 'repo-local');
  const bulk = await tight.send({ action: 'repo-refresh-all' });
  assert.equal(bulk.status, 200, JSON.stringify(bulk.body));
  assert.deepEqual(bulk.body.result.failed, [
    { id: entry.id, code: 'repo-local' },
  ]);
  assert.equal((await readFile(file)).length, size, 'state unchanged');
});

test('lowering a limit between restarts never bricks saved state: reads, uninstall and unsubscribe keep working, only growth is refused', async (t) => {
  const { root, add, send, stop } = await fixture(t, {
    maxEntries: 5000,
    maxRepositories: 250,
    maxInstalls: 250,
  });
  const source = join(root, 'upstream');
  await gitRepo(source, {
    ...skills(['alpha', 'beta']),
    'skills/huge/SKILL.md': skillDoc('huge'),
    ...Object.fromEntries(
      Array.from({ length: 1500 }, (_, i) => [`skills/huge/f/${i}.txt`, 'x']),
    ),
  });
  const entry = (
    await add({ url: source, ref: 'main', subdirectory: 'skills' })
  ).body.repositories[0];
  const huge = entry.skills.find((x) => x.path === 'huge');
  assert.ok(huge.files > 1000, `files ${huge.files}`);
  for (const path of ['alpha', 'beta'])
    assert.equal(
      (
        await send({
          action: 'repo-install',
          id: entry.id,
          path,
          snapshot: entry.fingerprint,
        })
      ).status,
      200,
    );
  // Many more subscriptions than the next start will allow to be added (state edited directly).
  const file = join(root, 'state', 'repositories.json');
  const saved = JSON.parse(await readFile(file, 'utf8'));
  for (let i = 0; i < 100; i += 1) {
    const copy = structuredClone(saved.repositories[0]);
    copy.id = sha(`extra-${i}`).slice(0, 24);
    copy.subdirectory = `skills/extra${i}`;
    saved.repositories.push(copy);
  }
  await stop();
  const text = JSON.stringify(saved);
  await writeFile(file, text);
  const size = Buffer.byteLength(text);
  // Every limit lowered below what is saved: maxEntries 1000 < 1501 files, 30 < 101 repositories,
  // 1 < 2 installs, state bytes below the file size.
  const low = await fixture(
    t,
    {
      maxEntries: 1000,
      maxRepositories: 30,
      maxInstalls: 1,
      maxStateBytes: size - 1,
    },
    { root },
  );
  const view = await listed(low.send);
  assert.equal(view.repoError, undefined, JSON.stringify(view.repoError));
  assert.equal(view.repositories.length, 101);
  assert.equal(view.repoInstalls.length, 2);
  // Growth is refused with the write-time caps.
  assert.equal(
    (await low.add({ url: 'o/n' })).body.code,
    'repo-limit',
    'add refused',
  );
  assert.equal(
    (
      await low.send({
        action: 'repo-install',
        id: entry.id,
        path: 'alpha',
        snapshot: entry.fingerprint,
      })
    ).body.code,
    'repo-limit',
  );
  // Shrinking still works.
  const record = view.repoInstalls.find((r) => r.name === 'alpha');
  const trashed = await low.send({
    action: 'repo-uninstall',
    installId: record.id,
  });
  assert.equal(trashed.status, 200, JSON.stringify(trashed.body));
  const removed = await low.send({
    action: 'repo-remove',
    id: saved.repositories[5].id,
  });
  assert.equal(removed.status, 200, JSON.stringify(removed.body));
  assert.equal((await listed(low.send)).repositories.length, 100);
});

test('configured limits are clamped to the fixed maxima so a writer can never exceed what the validator accepts', async (t) => {
  const { root, add, send, stop } = await fixture(t, {
    maxRepositories: 100000,
    maxInstalls: 100000,
    maxEntries: 100000,
  });
  const source = join(root, 'upstream');
  await gitRepo(source, skills(['alpha']));
  const entry = (
    await add({ url: source, ref: 'main', subdirectory: 'skills' })
  ).body.repositories[0];
  const file = join(root, 'state', 'repositories.json');
  const saved = JSON.parse(await readFile(file, 'utf8'));
  while (saved.repositories.length < 200) {
    const copy = structuredClone(saved.repositories[0]);
    copy.id = sha(`more-${saved.repositories.length}`).slice(0, 24);
    saved.repositories.push(copy);
  }
  await stop();
  await writeFile(file, JSON.stringify(saved));
  const full = await fixture(
    t,
    { maxRepositories: 100000, allowPrivateHosts: true },
    { root },
  );
  assert.equal((await listed(full.send)).repositories.length, 200);
  assert.equal((await full.add({ url: 'o/n' })).body.code, 'repo-limit');
  saved.repositories.push({ ...saved.repositories[0], id: 'f'.repeat(24) });
  await full.stop();
  await writeFile(file, JSON.stringify(saved));
  const over = await fixture(t, {}, { root });
  assert.equal((await listed(over.send)).repoError, 'repo-state-invalid');
  assert.ok(entry.id);
});

test('legitimate GitHub, HTTP Git and local sources all survive a restart through source revalidation', async (t) => {
  const archive = await archiveServer((_, response) =>
    response.end(githubZip({ 'skills/alpha/SKILL.md': skillDoc('alpha') })),
  );
  t.after(() => archive.close());
  const bare = await mkdtemp(join(tmpdir(), 'waycraft-repo-bare-'));
  t.after(() => rm(bare, { recursive: true, force: true }));
  const work = join(bare, 'work');
  await gitRepo(work, skills(['alpha']));
  git(bare, 'clone', '-q', '--bare', work, join(bare, 'srv.git'));
  const server = await gitHttpServer(bare);
  t.after(() => server.close());
  const { root, add, stop } = await fixture(t, {
    githubArchiveBase: archive.url,
  });
  const local = join(root, 'upstream');
  await gitRepo(local, skills(['alpha']));
  for (const input of [
    { url: 'Owner/Repo.git', ref: 'v1', subdirectory: 'skills' },
    { url: `${server.url}/srv.git`, ref: 'main', subdirectory: 'skills' },
    { url: local, ref: 'main', subdirectory: 'skills' },
    { url: local },
  ]) {
    const added = await add(input);
    assert.equal(added.status, 200, JSON.stringify(added.body));
  }
  await stop();
  const again = await fixture(t, {}, { root });
  const view = await listed(again.send);
  assert.equal(view.repoError, undefined);
  assert.equal(view.repositories.length, 4);
});

test('a tampered GitHub source (owner/name) rejects the whole state', async (t) => {
  const archive = await archiveServer((_, response) =>
    response.end(githubZip({ 'skills/alpha/SKILL.md': skillDoc('alpha') })),
  );
  t.after(() => archive.close());
  const { root, add, stop } = await fixture(t, {
    githubArchiveBase: archive.url,
  });
  assert.equal((await add({ url: 'owner/repo' })).status, 200);
  await stop();
  const file = join(root, 'state', 'repositories.json');
  const good = JSON.parse(await readFile(file, 'utf8'));
  assert.equal(good.repositories[0].kind, 'github');
  const tampers = {
    'owner traversal': (r) => {
      r.owner = '..';
      r.label = '../repo';
    },
    'name traversal': (r) => {
      r.name = '../x';
      r.label = 'owner/../x';
    },
    'owner uppercase': (r) => {
      r.owner = 'Owner';
      r.label = 'Owner/repo';
    },
    'github with url': (r) => (r.url = 'https://evil.test/x'),
    'label mismatch': (r) => (r.label = 'other/repo'),
  };
  for (const [label, mutate] of Object.entries(tampers)) {
    const state = structuredClone(good);
    mutate(state.repositories[0]);
    await writeFile(file, JSON.stringify(state));
    const restarted = await fixture(t, {}, { root });
    assert.equal(
      (await listed(restarted.send)).repoError,
      'repo-state-invalid',
      label,
    );
    await restarted.stop();
  }
});

test('an invalid-root install record can be forgotten without any disk access, and consumes no install slot afterwards', async (t) => {
  const { root, add, send, stop } = await fixture(t);
  const source = join(root, 'upstream');
  await gitRepo(source, skills(['alpha']));
  const entry = (
    await add({ url: source, ref: 'main', subdirectory: 'skills' })
  ).body.repositories[0];
  const installed = await send({
    action: 'repo-install',
    id: entry.id,
    path: 'alpha',
    snapshot: entry.fingerprint,
  });
  const recordId = installed.body.repoInstalls[0].id;
  // A valid-root record cannot be forgotten (use uninstall).
  const early = await send({ action: 'repo-forget', installId: recordId });
  assert.equal(early.body.code, 'repo-root-valid');
  await stop();
  const moved = await fixture(t, { maxInstalls: 1 }, { root, skills: 'moved' });
  assert.equal(
    (await listed(moved.send)).repoInstalls[0].status,
    'invalid-root',
  );
  assert.equal(
    (
      await moved.send({
        action: 'repo-install',
        id: entry.id,
        path: 'alpha',
        snapshot: entry.fingerprint,
      })
    ).body.code,
    'repo-limit',
    'stale record consumes the slot',
  );
  const missing = await moved.send({
    action: 'repo-forget',
    installId: '00000000-0000-4000-8000-000000000000',
  });
  assert.equal(missing.body.code, 'repo-not-installed');
  const forgot = await moved.send({
    action: 'repo-forget',
    installId: recordId,
  });
  assert.equal(forgot.status, 200, JSON.stringify(forgot.body));
  assert.deepEqual(forgot.body.repoInstalls, []);
  assert.ok(
    (await lstat(join(root, 'skills', 'alpha', 'SKILL.md'))).isFile(),
    'old copy untouched',
  );
  await assert.rejects(lstat(join(root, 'moved', 'alpha')), { code: 'ENOENT' });
  const again = await moved.send({
    action: 'repo-install',
    id: entry.id,
    path: 'alpha',
    snapshot: entry.fingerprint,
  });
  assert.equal(again.status, 200, JSON.stringify(again.body));
});

test('restart round trip: GitHub names the normalizer strips once (foo.git.git, x.GIT.git, URL form) survive revalidation', async (t) => {
  const archive = await archiveServer((_, response) =>
    response.end(githubZip({ 'skills/alpha/SKILL.md': skillDoc('alpha') })),
  );
  t.after(() => archive.close());
  const { root, add, stop } = await fixture(t, {
    githubArchiveBase: archive.url,
  });
  const names = [];
  for (const url of [
    'owner/foo.git.git',
    'owner/x.GIT.git',
    'https://github.com/o/bar.git.git',
    'Owner/.hidden',
    'o/a..b',
  ]) {
    const added = await add({ url });
    assert.equal(added.status, 200, `${url} ${JSON.stringify(added.body)}`);
    names.push(url);
  }
  await stop();
  const saved = JSON.parse(
    await readFile(join(root, 'state', 'repositories.json'), 'utf8'),
  );
  assert.deepEqual(
    saved.repositories.map((r) => r.label).sort(),
    [
      'o/a..b',
      'o/bar.git',
      'owner/.hidden',
      'owner/foo.git',
      'owner/x.git',
    ].sort(),
  );
  const again = await fixture(t, {}, { root });
  const view = await listed(again.send);
  assert.equal(view.repoError, undefined, 'state survives restart');
  assert.equal(view.repositories.length, names.length);
});

test('restart round trip: normalized HTTP Git URLs (case, port, percent-encoding, dot segments, trailing slash) and local paths stay valid', async (t) => {
  const bare = await mkdtemp(join(tmpdir(), 'waycraft-repo-bare-'));
  t.after(() => rm(bare, { recursive: true, force: true }));
  const work = join(bare, 'work');
  await gitRepo(work, skills(['alpha']));
  git(bare, 'clone', '-q', '--bare', work, join(bare, 'srv.git'));
  const server = await gitHttpServer(bare);
  t.after(() => server.close());
  const { root, send, stop } = await fixture(t);
  const local = join(root, 'upstream');
  await gitRepo(local, skills(['alpha']));
  const forms = [
    `${server.url}/srv.git`,
    `${server.url.replace('127.0.0.1', '127.0.0.1')}//./x/../srv.git/`,
    `${local}/`,
    `${local}/./`,
  ];
  let accepted = 0;
  for (const url of forms) {
    const added = await send({
      action: 'repo-add',
      repository: { url, ref: 'main', subdirectory: 'skills' },
    });
    if (added.status === 200) accepted += 1;
    else assert.notEqual(added.body.code, 'repo-state-invalid');
  }
  assert.ok(accepted >= 2, `accepted ${accepted}`);
  await stop();
  const again = await fixture(t, {}, { root });
  const view = await listed(again.send);
  assert.equal(view.repoError, undefined, 'state survives restart');
  assert.equal(view.repositories.length, accepted);
});

// ---- #154 repository content update and previous-version rollback ----
async function updateFixture(t, repositories = {}) {
  const ctx = await fixture(t, repositories);
  const source = join(ctx.root, 'upstream');
  await gitRepo(source, {
    ...skills(['alpha']),
    'skills/alpha/data.bin': Buffer.from([1, 2, 3]),
    'skills/alpha/notes.md': 'v1 notes',
  });
  const added = await ctx.add({
    url: source,
    ref: 'main',
    subdirectory: 'skills',
  });
  const entry = added.body.repositories[0];
  const installed = await ctx.send({
    action: 'repo-install',
    id: entry.id,
    path: 'alpha',
    snapshot: entry.fingerprint,
  });
  assert.equal(installed.status, 200, JSON.stringify(installed.body));
  const target = join(ctx.root, 'skills', 'alpha');
  const upstream = async (files) => {
    await gitCommit(source, files);
    const refreshed = await ctx.send({ action: 'repo-refresh', id: entry.id });
    assert.equal(refreshed.status, 200, JSON.stringify(refreshed.body));
  };
  const install = async () =>
    (await ctx.send({ action: 'list' })).body.repoInstalls[0];
  const preview = (kind, extra = {}) =>
    ctx.send({
      action: `repo-${kind}-preview`,
      installId: installed.body.repoInstalls[0].id,
      ...extra,
    });
  const apply = (kind, p, extra = {}) =>
    ctx.send({
      action: `repo-${kind}`,
      installId: installed.body.repoInstalls[0].id,
      current: p.current,
      target: p.target.digest,
      snapshot: p.snapshot,
      ...extra,
    });
  const v2 = {
    'skills/alpha/SKILL.md': skillDoc('alpha', 'About alpha', 'Body v2'),
    'skills/alpha/extra.txt': 'new file',
  };
  return {
    ...ctx,
    source,
    entry,
    target,
    upstream,
    install,
    preview,
    apply,
    v2,
  };
}
const removeFile = (source, path) => rm(join(source, path), { force: true });

test('update: states, file previews, digest-bound apply, retained backup and rollback', async (t) => {
  const f = await updateFixture(t);
  assert.equal((await f.install()).updateAvailable, false);
  assert.equal((await f.install()).canRollback, false);
  await removeFile(f.source, 'skills/alpha/data.bin');
  await f.upstream(f.v2);
  const listed = (await f.send({ action: 'list' })).body;
  assert.equal(listed.repoInstalls[0].updateAvailable, true);
  assert.equal(listed.repoInstalls[0].status, 'installed');
  assert.equal(
    listed.repositories[0].skills.find((s) => s.path === 'alpha').status,
    'update',
  );
  const unmarked = await f.send(
    { action: 'repo-update-preview', installId: listed.repoInstalls[0].id },
    { marker: false },
  );
  assert.equal(unmarked.status, 403);
  const p = (await f.preview('update')).body.result;
  assert.equal(p.localModified, false);
  assert.deepEqual(p.changes, [
    { path: 'SKILL.md', kind: 'modified' },
    { path: 'data.bin', kind: 'removed' },
    { path: 'extra.txt', kind: 'added' },
  ]);
  assert.match(p.current, /^[0-9a-f]{64}$/);
  assert.match(p.target.digest, /^[0-9a-f]{64}$/);
  // Nothing changed by previewing.
  assert.equal(await readFile(join(f.target, 'notes.md'), 'utf8'), 'v1 notes');
  const done = await f.apply('update', p);
  assert.equal(done.status, 200, JSON.stringify(done.body));
  assert.equal(
    await readFile(join(f.target, 'SKILL.md'), 'utf8'),
    f.v2['skills/alpha/SKILL.md'],
  );
  assert.equal(await readFile(join(f.target, 'extra.txt'), 'utf8'), 'new file');
  await assert.rejects(lstat(join(f.target, 'data.bin')));
  const record = done.body.repoInstalls[0];
  assert.equal(record.status, 'installed');
  assert.equal(record.updateAvailable, false);
  assert.equal(record.canRollback, true);
  assert.notEqual(record.fingerprint, f.entry.fingerprint);
  // The previous version is retained and nothing is left staged.
  const backups = await readdir(join(f.root, 'state', 'repository-backups'));
  assert.equal(backups.length, 1);
  assert.deepEqual((await readdir(join(f.root, 'skills'))).sort(), ['alpha']);
  // Same preview cannot be replayed once applied.
  assert.equal((await f.apply('update', p)).status, 409);
  // Rollback restores the exact previous bytes and keeps the newer version as the new backup.
  const rp = (await f.preview('rollback')).body.result;
  assert.deepEqual(rp.changes, [
    { path: 'SKILL.md', kind: 'modified' },
    { path: 'data.bin', kind: 'added' },
    { path: 'extra.txt', kind: 'removed' },
  ]);
  const back = await f.apply('rollback', rp);
  assert.equal(back.status, 200, JSON.stringify(back.body));
  assert.deepEqual(
    [...(await readFile(join(f.target, 'data.bin')))],
    [1, 2, 3],
  );
  assert.equal(
    await readFile(join(f.target, 'SKILL.md'), 'utf8'),
    skillDoc('alpha'),
  );
  const rolled = back.body.repoInstalls[0];
  assert.equal(rolled.fingerprint, f.entry.fingerprint);
  assert.equal(rolled.status, 'installed');
  assert.equal(rolled.updateAvailable, true);
  assert.equal(rolled.canRollback, true);
  assert.equal(
    (await readdir(join(f.root, 'state', 'repository-backups'))).length,
    1,
  );
  // Rolling back again returns to the newer version (the backup was swapped, not lost).
  const again = (await f.preview('rollback')).body.result;
  assert.equal((await f.apply('rollback', again)).status, 200);
  assert.equal(await readFile(join(f.target, 'extra.txt'), 'utf8'), 'new file');
});

test('update state with a backup survives a restart and is rolled back after it', async (t) => {
  const f = await updateFixture(t);
  await f.upstream(f.v2);
  const p = (await f.preview('update')).body.result;
  assert.equal((await f.apply('update', p)).status, 200);
  await f.stop();
  const again = await fixture(t, {}, { root: f.root });
  const list = (await again.send({ action: 'list' })).body;
  assert.equal(list.repoError, undefined);
  assert.equal(list.repoInstalls[0].canRollback, true);
  const rp = (
    await again.send({
      action: 'repo-rollback-preview',
      installId: list.repoInstalls[0].id,
    })
  ).body.result;
  const done = await again.send({
    action: 'repo-rollback',
    installId: list.repoInstalls[0].id,
    current: rp.current,
    target: rp.target.digest,
    snapshot: rp.snapshot,
  });
  assert.equal(done.status, 200, JSON.stringify(done.body));
  assert.equal(await readFile(join(f.target, 'notes.md'), 'utf8'), 'v1 notes');
});

test('update refuses stale previews with a dedicated 409 and leaves the copy untouched', async (t) => {
  const f = await updateFixture(t);
  await f.upstream(f.v2);
  const p = (await f.preview('update')).body.result;
  const before = await readFile(join(f.target, 'SKILL.md'), 'utf8');
  // The repository moved on after the preview.
  await f.upstream({ 'skills/alpha/extra.txt': 'newer file' });
  const staleRepo = await f.apply('update', p);
  assert.equal(staleRepo.status, 409);
  assert.equal(staleRepo.body.code, 'repo-preview-stale');
  // The local copy changed after the preview.
  const fresh = (await f.preview('update')).body.result;
  await writeFile(join(f.target, 'notes.md'), 'edited after preview');
  const staleLocal = await f.apply('update', fresh);
  assert.equal(staleLocal.status, 409);
  assert.equal(staleLocal.body.code, 'repo-preview-stale');
  const tampered = await f.apply('update', fresh, { current: 'a'.repeat(64) });
  assert.equal(tampered.body.code, 'repo-preview-stale');
  assert.equal(await readFile(join(f.target, 'SKILL.md'), 'utf8'), before);
  assert.equal(
    await readFile(join(f.target, 'notes.md'), 'utf8'),
    'edited after preview',
  );
  await assert.rejects(lstat(join(f.root, 'state', 'repository-backups')));
});

test('update over a locally modified copy needs explicit overwrite consent and keeps the local bytes as the backup', async (t) => {
  const f = await updateFixture(t);
  await f.upstream(f.v2);
  await writeFile(join(f.target, 'notes.md'), 'my local notes');
  assert.equal((await f.install()).status, 'modified');
  const p = (await f.preview('update')).body.result;
  assert.equal(p.localModified, true);
  assert.ok(
    p.changes.some((c) => c.path === 'notes.md' && c.kind === 'modified'),
  );
  const refused = await f.apply('update', p);
  assert.equal(refused.status, 409);
  assert.equal(refused.body.code, 'repo-local-modified');
  assert.equal((await f.apply('update', p, { overwrite: 'yes' })).status, 409);
  assert.equal(
    await readFile(join(f.target, 'notes.md'), 'utf8'),
    'my local notes',
  );
  const done = await f.apply('update', p, { overwrite: true });
  assert.equal(done.status, 200, JSON.stringify(done.body));
  assert.equal(await readFile(join(f.target, 'notes.md'), 'utf8'), 'v1 notes');
  // The local edit is not lost: rollback brings it back (and reports it as modified again).
  const rp = (await f.preview('rollback')).body.result;
  assert.equal(
    (await f.apply('rollback', rp, { overwrite: true })).status,
    200,
  );
  assert.equal(
    await readFile(join(f.target, 'notes.md'), 'utf8'),
    'my local notes',
  );
  assert.equal((await f.install()).status, 'modified');
});

test('update and rollback guard: up to date, no backup, tampered backup, missing, trashed and unmarked', async (t) => {
  const f = await updateFixture(t);
  assert.equal((await f.preview('update')).body.code, 'repo-up-to-date');
  assert.equal((await f.preview('rollback')).body.code, 'repo-no-backup');
  await f.upstream(f.v2);
  const p = (await f.preview('update')).body.result;
  assert.equal(
    (
      await f.send(
        {
          action: 'repo-update',
          installId: p && (await f.install()).id,
          current: p.current,
          target: p.target.digest,
          snapshot: p.snapshot,
        },
        { marker: false },
      )
    ).status,
    403,
  );
  assert.equal((await f.apply('update', p)).status, 200);
  const [key] = await readdir(join(f.root, 'state', 'repository-backups'));
  await writeFile(
    join(f.root, 'state', 'repository-backups', key, 'notes.md'),
    'tampered',
  );
  assert.equal((await f.preview('rollback')).body.code, 'repo-backup-changed');
  assert.equal((await f.preview('update', { installId: 'nope' })).status, 404);
  await rm(f.target, { recursive: true });
  assert.equal((await f.preview('update')).body.code, 'repo-missing');
});

test('a failed update recovers: original bytes, no partial copy, no staging leftovers, no orphan backup', async (t) => {
  const f = await updateFixture(t);
  await f.upstream(f.v2);
  const p = (await f.preview('update')).body.result;
  const stateFile = join(f.root, 'state', 'repositories.json');
  const size = (await readFile(stateFile)).length;
  await f.stop();
  // The state cap now refuses the extra backup record, so the swap must be undone.
  const capped = await fixture(
    t,
    { maxStateBytes: size + 50 },
    { root: f.root },
  );
  const list = (await capped.send({ action: 'list' })).body;
  const before = await readFile(join(f.target, 'SKILL.md'), 'utf8');
  const failed = await capped.send({
    action: 'repo-update',
    installId: list.repoInstalls[0].id,
    current: p.current,
    target: p.target.digest,
    snapshot: p.snapshot,
  });
  assert.equal(failed.status, 400, JSON.stringify(failed.body));
  assert.equal(failed.body.code, 'repo-limit');
  assert.equal(await readFile(join(f.target, 'SKILL.md'), 'utf8'), before);
  assert.equal(await readFile(join(f.target, 'notes.md'), 'utf8'), 'v1 notes');
  assert.deepEqual((await readdir(join(f.root, 'skills'))).sort(), ['alpha']);
  // Not even an empty repository-backups directory is left behind.
  await assert.rejects(lstat(join(f.root, 'state', 'repository-backups')), {
    code: 'ENOENT',
  });
  assert.equal(
    (await capped.send({ action: 'list' })).body.repoInstalls[0].canRollback,
    false,
  );
});

test('a tampered backup record rejects the whole state', async (t) => {
  const f = await updateFixture(t);
  await f.upstream(f.v2);
  const p = (await f.preview('update')).body.result;
  assert.equal((await f.apply('update', p)).status, 200);
  const stateFile = join(f.root, 'state', 'repositories.json');
  const good = await readFile(stateFile, 'utf8');
  await f.stop();
  const bad = JSON.parse(good);
  bad.installs[0].backup.key = '../escape';
  await writeFile(stateFile, JSON.stringify(bad));
  const broken = await fixture(t, {}, { root: f.root });
  assert.equal(
    (await broken.send({ action: 'list' })).body.repoError,
    'repo-state-invalid',
  );
  await broken.stop();
  const worse = JSON.parse(good);
  worse.installs[0].backup.digest = 'zz';
  await writeFile(stateFile, JSON.stringify(worse));
  const broken2 = await fixture(t, {}, { root: f.root });
  assert.equal(
    (await broken2.send({ action: 'list' })).body.repoError,
    'repo-state-invalid',
  );
});

const backupsLeft = (root) =>
  readdir(join(root, 'state', 'repository-backups')).catch(() => []);

test('file mode: chmod +x is a local edit that needs consent; the exec bit survives update and rollback; empty directories are not tracked', async (t) => {
  const f = await updateFixture(t);
  await f.upstream(f.v2);
  await mkdir(join(f.target, 'empty-dir'));
  assert.equal(
    (await f.install()).status,
    'installed',
    'documented limit: only file bytes and the executable bit are tracked',
  );
  await chmod(join(f.target, 'notes.md'), 0o755);
  assert.equal((await f.install()).status, 'modified');
  const p = (await f.preview('update')).body.result;
  assert.equal(p.localModified, true);
  assert.equal((await f.apply('update', p)).body.code, 'repo-local-modified');
  assert.equal((await f.apply('update', p, { overwrite: true })).status, 200);
  assert.equal(
    (await stat(join(f.target, 'notes.md'))).mode & 0o111,
    0,
    'update replaces the mode edit',
  );
  assert.equal((await f.install()).status, 'installed');
  // Rollback restores the exact previous copy including its executable bit.
  const rp = (await f.preview('rollback')).body.result;
  assert.equal(rp.localModified, false);
  assert.ok(rp.changes.some((c) => c.path === 'notes.md'));
  assert.equal(
    (await f.apply('rollback', rp, { overwrite: true })).status,
    200,
  );
  assert.notEqual((await stat(join(f.target, 'notes.md'))).mode & 0o111, 0);
  assert.equal((await f.install()).status, 'modified');
  // ...and the bit also survives the next update/rollback cycle through the backup.
  const again = (await f.preview('rollback')).body.result;
  assert.equal(
    again.localModified,
    true,
    'the restored mode edit is still a local edit',
  );
  assert.equal(
    (await f.apply('rollback', again)).body.code,
    'repo-local-modified',
  );
  assert.equal(
    (await f.apply('rollback', again, { overwrite: true })).status,
    200,
  );
  assert.equal((await stat(join(f.target, 'notes.md'))).mode & 0o111, 0);
});

test('apply binds current, target and snapshot for both update and rollback', async (t) => {
  const f = await updateFixture(t);
  await f.upstream(f.v2);
  const p = (await f.preview('update')).body.result;
  for (const wrong of [
    { target: 'b'.repeat(64) },
    { snapshot: 'c'.repeat(40) },
    { current: 'a'.repeat(64) },
  ]) {
    const refused = await f.apply('update', p, wrong);
    assert.equal(refused.status, 409);
    assert.equal(refused.body.code, 'repo-preview-stale');
  }
  assert.equal((await f.apply('update', p)).status, 200);
  const rp = (await f.preview('rollback')).body.result;
  for (const wrong of [
    { target: 'b'.repeat(64) },
    { snapshot: 'c'.repeat(40) },
    { current: 'a'.repeat(64) },
  ]) {
    const refused = await f.apply('rollback', rp, wrong);
    assert.equal(refused.status, 409);
    assert.equal(refused.body.code, 'repo-preview-stale');
  }
  assert.equal((await f.apply('rollback', rp)).status, 200);
});

test('a trashed install cannot be rolled back or updated, shows no rollback, and gets it back on restore', async (t) => {
  const f = await updateFixture(t);
  await f.upstream(f.v2);
  const p = (await f.preview('update')).body.result;
  assert.equal((await f.apply('update', p)).status, 200);
  const trashed = await f.send({
    action: 'repo-uninstall',
    installId: (await f.install()).id,
  });
  assert.equal(trashed.status, 200, JSON.stringify(trashed.body));
  const row = trashed.body.repoInstalls[0];
  assert.equal(row.status, 'trashed');
  assert.equal(row.canRollback, false);
  assert.equal((await f.preview('rollback')).body.code, 'repo-trashed');
  assert.equal((await f.preview('update')).body.code, 'repo-trashed');
  const restored = await f.send({ action: 'trash-restore', id: row.trashId });
  assert.equal(restored.status, 200, JSON.stringify(restored.body));
  assert.equal(restored.body.repoInstalls[0].canRollback, true);
});

test('apply refuses a destination root that became a link, without touching the copy or leaving a backup', async (t) => {
  const f = await updateFixture(t);
  await f.upstream(f.v2);
  const p = (await f.preview('update')).body.result;
  const before = await readFile(join(f.target, 'SKILL.md'), 'utf8');
  await rename(join(f.root, 'skills'), join(f.root, 'skills-real'));
  await symlink(join(f.root, 'skills-real'), join(f.root, 'skills'));
  const refused = await f.apply('update', p);
  assert.equal(refused.status, 409);
  assert.equal(refused.body.code, 'repo-invalid-root');
  assert.equal(
    await readFile(join(f.root, 'skills-real', 'alpha', 'SKILL.md'), 'utf8'),
    before,
  );
  assert.deepEqual(await backupsLeft(f.root), []);
});

test('forgetting a record and permanently deleting from Trash both remove the retained backup', async (t) => {
  const f = await updateFixture(t);
  await f.upstream(f.v2);
  const p = (await f.preview('update')).body.result;
  assert.equal((await f.apply('update', p)).status, 200);
  assert.equal((await backupsLeft(f.root)).length, 1);
  // Trash-delete.
  const trashed = await f.send({
    action: 'repo-uninstall',
    installId: (await f.install()).id,
  });
  const purged = await f.send({
    action: 'trash-delete',
    id: trashed.body.repoInstalls[0].trashId,
    confirm: true,
  });
  assert.equal(purged.status, 200, JSON.stringify(purged.body));
  assert.deepEqual(purged.body.repoInstalls, []);
  assert.deepEqual(await backupsLeft(f.root), []);
  // Forget (destination changed): a second fixture with its own backup.
  const g = await updateFixture(t);
  await g.upstream(g.v2);
  assert.equal(
    (await g.apply('update', (await g.preview('update')).body.result)).status,
    200,
  );
  assert.equal((await backupsLeft(g.root)).length, 1);
  await g.stop();
  const moved = await fixture(t, {}, { root: g.root, skills: 'moved' });
  const row = (await moved.send({ action: 'list' })).body.repoInstalls[0];
  assert.equal(row.status, 'invalid-root');
  const forgot = await moved.send({ action: 'repo-forget', installId: row.id });
  assert.equal(forgot.status, 200, JSON.stringify(forgot.body));
  assert.deepEqual(await backupsLeft(g.root), []);
});

test('rollback is a shrinking write: it still works after the state cap was lowered below the saved state', async (t) => {
  const f = await updateFixture(t);
  await f.upstream(f.v2);
  const p = (await f.preview('update')).body.result;
  assert.equal((await f.apply('update', p)).status, 200);
  await f.stop();
  const capped = await fixture(t, { maxStateBytes: 100 }, { root: f.root });
  const row = (await capped.send({ action: 'list' })).body.repoInstalls[0];
  const rp = (
    await capped.send({ action: 'repo-rollback-preview', installId: row.id })
  ).body.result;
  const done = await capped.send({
    action: 'repo-rollback',
    installId: row.id,
    current: rp.current,
    target: rp.target.digest,
    snapshot: rp.snapshot,
  });
  assert.equal(done.status, 200, JSON.stringify(done.body));
  assert.equal(await readFile(join(f.target, 'notes.md'), 'utf8'), 'v1 notes');
});

test('install rows expose a removed, renamed or invalid upstream skill and tracked update availability', async (t) => {
  const f = await updateFixture(t);
  assert.equal((await f.install()).upstream, undefined);
  await writeFile(join(f.target, 'notes.md'), 'local');
  await f.upstream({
    'skills/beta/SKILL.md': skillDoc('beta'),
    'skills/alpha/SKILL.md': skillDoc('alpha', 'About alpha', 'Body v2'),
  });
  const listed = (await f.send({ action: 'list' })).body;
  const skill = listed.repositories[0].skills.find((s) => s.path === 'alpha');
  assert.equal(listed.repoInstalls[0].status, 'modified');
  assert.equal(listed.repoInstalls[0].updateAvailable, true);
  assert.equal(skill.status, 'modified');
  assert.equal(skill.updateAvailable, true, 'modified+update stays filterable');
  // Renamed upstream (front-matter name changes at the same path).
  await f.upstream({
    'skills/alpha/SKILL.md': skillDoc('alpha-two', 'About alpha', 'Body v2'),
  });
  assert.equal((await f.install()).upstream, 'repo-skill-renamed');
  // Removed upstream.
  await removeFile(f.source, 'skills/alpha/SKILL.md');
  await rm(join(f.source, 'skills', 'alpha'), { recursive: true });
  await f.upstream({ 'skills/beta/SKILL.md': skillDoc('beta', 'About beta') });
  assert.equal((await f.install()).upstream, 'repo-skill-missing');
});
