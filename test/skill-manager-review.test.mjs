import assert from 'node:assert/strict';
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { apply } from '../dist/skills.js';

const doc = (name, extra = '', body = 'Body') =>
  `---\nname: ${name}\ndescription: Example\n${extra}---\n${body}`;

async function harness(t, sources, extra = {}) {
  const root = await mkdtemp(join(tmpdir(), 'waycraft-review-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const statePath = extra.statePath ?? join(root, 'manager-state.json');
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
    },
  };
  apply(ctx, { sources: sources(root), statePath });
  t.after(async () => {
    for (const stop of stops.splice(0)) await stop();
  });
  const post = (body, headers = {}) =>
    route.fetch(
      new Request('http://localhost/api/waycraft-skills.catalog', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-waycraft-skills': '1',
          ...headers,
        },
        body: JSON.stringify(body),
      }),
    );
  return {
    root,
    statePath,
    post,
    stop: async () => {
      for (const stop of stops.splice(0)) await stop();
    },
    get provider() {
      return provider;
    },
    get route() {
      return route;
    },
  };
}

async function skill(root, dir, text) {
  await mkdir(join(root, dir), { recursive: true });
  await writeFile(join(root, dir, 'SKILL.md'), text);
}

test('deny overlay never disappears while a toggle lands during scans', async (t) => {
  const h = await harness(t, (root) => [
    { id: 'fixture', path: join(root, 'skills') },
  ]);
  await skill(join(h.root, 'skills'), 'example', doc('example'));
  const results = [];
  const lists = [];
  for (let i = 0; i < 12; i++) {
    lists.push(h.provider.list().then((value) => results.push(value)));
    if (i % 3 === 0)
      lists.push(
        h.post({
          action: 'toggle',
          kind: 'source',
          id: 'fixture',
          enabled: i % 2 === 0,
        }),
      );
  }
  await Promise.all(lists);
  assert.equal(results.length, 12);
  for (const value of results) assert.equal(value.length, 1);
});

test('detail returns the original file text including frontmatter', async (t) => {
  const h = await harness(t, (root) => [
    { id: 'fixture', path: join(root, 'skills') },
  ]);
  const text = doc('example', 'user-invocable: false\n', 'Exact body\n');
  await skill(join(h.root, 'skills'), 'example', text);
  const list = await (await h.post({ action: 'list' })).json();
  assert.equal(list.copies[0].content, undefined);
  assert.equal(list.copies[0].original, undefined);
  const detail = await (
    await h.post({ action: 'detail', id: list.copies[0].path })
  ).json();
  assert.equal(detail.content, text);
});

test('ping proves the route without scanning any source', async (t) => {
  const h = await harness(t, (root) => [
    { id: 'missing', path: join(root, 'nope') },
  ]);
  const body = await (await h.post({ action: 'ping' })).json();
  assert.deepEqual(body, { ok: true });
});

test('oversized request declared by content-length is rejected before reading', async (t) => {
  const h = await harness(t, () => []);
  const response = await h.post(
    { action: 'list' },
    { 'content-length': '999999' },
  );
  assert.equal(response.status, 413);
});

test('failed state write leaves no temporary file', async (t) => {
  const h = await harness(t, (root) => [
    { id: 'fixture', path: join(root, 'skills') },
  ]);
  await skill(join(h.root, 'skills'), 'example', doc('example'));
  await h.post({ action: 'list' });
  await mkdir(join(h.statePath, 'blocker'), { recursive: true });
  const response = await h.post({
    action: 'toggle',
    kind: 'source',
    id: 'fixture',
    enabled: false,
  });
  assert.notEqual(response.status, 200);
  assert.deepEqual(
    (await readdir(h.root)).filter((name) => name.endsWith('.tmp')),
    [],
  );
});

test('diagnostics carry stable codes and unusable files stay denied, not silently skipped', async (t) => {
  const h = await harness(t, (root) => [
    { id: 'fixture', path: join(root, 'skills') },
  ]);
  const source = join(h.root, 'skills');
  await skill(source, 'bad', '---\nname: bad\ndescription: [\n---\nx');
  await skill(source, 'nofront', 'no frontmatter');
  await skill(source, 'big', doc('big', '', 'x'.repeat(1024 * 1024 + 5)));
  await skill(source, 'badpolicy', doc('badpolicy', 'user-invocable: maybe\n'));
  const list = await (await h.post({ action: 'list' })).json();
  const codes = list.diagnostics.map((x) => x.code).sort();
  assert.deepEqual(codes, [
    'invalid-frontmatter',
    'invalid-policy',
    'invalid-yaml',
    'oversized-skill',
  ]);
  for (const item of list.diagnostics) {
    assert.equal(typeof item.message, 'string');
    assert.equal(item.params.source, 'fixture');
  }
  const names = await h.provider.list();
  // Oversized files are loadable natively, so they must stay in the deny overlay.
  const big = names.find((x) => x.name === 'big');
  assert.ok(big);
  assert.deepEqual(big.invocation, {
    modelInvocable: false,
    userInvocable: false,
  });
  // Native excludes malformed metadata (verified in the native fixture), so no candidate is needed.
  assert.equal(
    names.some((x) => x.name === 'bad'),
    false,
  );
});

test('linked SKILL.md is discovered read-only and an escaping link is diagnosed', async (t) => {
  const h = await harness(t, (root) => [
    { id: 'fixture', path: join(root, 'skills') },
  ]);
  const outside = join(h.root, 'outside');
  await mkdir(outside);
  await writeFile(join(outside, 'real.md'), doc('linked'));
  await mkdir(join(h.root, 'skills', 'linked'), { recursive: true });
  await symlink(
    join(outside, 'real.md'),
    join(h.root, 'skills', 'linked', 'SKILL.md'),
  );
  const list = await (await h.post({ action: 'list' })).json();
  assert.deepEqual(
    list.copies.map((x) => x.name),
    ['linked'],
  );
  assert.deepEqual(
    list.diagnostics.map((x) => x.code),
    ['linked-outside-root'],
  );
});

test('equal-rank copies report exactly one winner and corrupt state can be reloaded', async (t) => {
  const h = await harness(t, (root) => [
    { id: 'a', path: join(root, 'a'), rank: 300 },
    { id: 'b', path: join(root, 'b'), rank: 300 },
  ]);
  await skill(join(h.root, 'a'), 'example', doc('example'));
  await skill(join(h.root, 'b'), 'example', doc('example'));
  const list = await (await h.post({ action: 'list' })).json();
  assert.equal(list.copies.filter((x) => !x.shadowedBy).length, 1);
  assert.equal(list.copies.filter((x) => x.shadowedBy).length, 1);
  await writeFile(h.statePath, '{not json');
  const locked = await (await h.post({ action: 'reload' })).json();
  assert.equal(locked.corrupt, true);
  await writeFile(h.statePath, '{"sources":{},"copies":{}}');
  const fixed = await (await h.post({ action: 'reload' })).json();
  assert.equal(fixed.corrupt, false);
  assert.ok(fixed.copies.every((x) => x.eligible));
});

test('reload and detail require the mutation marker', async (t) => {
  const h = await harness(t, (root) => [
    { id: 'fixture', path: join(root, 'skills') },
  ]);
  await skill(join(h.root, 'skills'), 'example', doc('example'));
  const list = await (await h.post({ action: 'list' })).json();
  const headers = { 'x-waycraft-skills': '' };
  assert.equal((await h.post({ action: 'reload' }, headers)).status, 403);
  assert.equal(
    (await h.post({ action: 'detail', id: list.copies[0].path }, headers))
      .status,
    403,
  );
});

test('a toggle racing a reload leaves memory equal to the file', async (t) => {
  const h = await harness(t, (root) => [
    { id: 'fixture', path: join(root, 'skills') },
  ]);
  await skill(join(h.root, 'skills'), 'example', doc('example'));
  await writeFile(h.statePath, '{"sources":{},"copies":{}}');
  for (let i = 0; i < 10; i++) {
    const enabled = i % 2 === 0;
    await Promise.all([
      h.post({ action: 'reload' }),
      h.post({ action: 'toggle', kind: 'source', id: 'fixture', enabled }),
      h.post({ action: 'reload' }),
    ]);
    const file = JSON.parse(await readFile(h.statePath, 'utf8'));
    const view = await (await h.post({ action: 'list' })).json();
    assert.equal(
      view.sources.find((x) => x.id === 'fixture').enabled,
      file.sources.fixture ?? true,
    );
    assert.equal(file.sources.fixture, enabled);
  }
});

test('oversized and unparseable files still report their own diagnostics', async (t) => {
  const h = await harness(t, (root) => [
    { id: 'fixture', path: join(root, 'skills') },
  ]);
  await skill(
    join(h.root, 'skills'),
    'big',
    `no frontmatter\n${'x'.repeat(2 * 1024 * 1024)}`,
  );
  const list = await (await h.post({ action: 'list' })).json();
  const codes = list.copies[0].diagnostics.map((x) => x.code);
  assert.ok(codes.includes('oversized-skill'), JSON.stringify(codes));
  assert.ok(codes.includes('invalid-frontmatter'));
});

test('two providers listing at one revision scan once; a toggle rescans', async (t) => {
  const h = await harness(t, (root) => [
    { id: 'fixture', path: join(root, 'skills') },
  ]);
  await skill(join(h.root, 'skills'), 'example', doc('example'));
  const file = join(h.root, 'skills', 'example', 'SKILL.md');
  const first = await h.provider.list();
  // A file change is invisible to a cached scan at the same revision, proving it is shared.
  await writeFile(file, doc('renamed'));
  const second = await h.provider.list();
  assert.equal(second[0].name, 'example');
  await h.post({
    action: 'toggle',
    kind: 'source',
    id: 'fixture',
    enabled: false,
  });
  const third = await h.provider.list();
  assert.equal(third[0].name, 'renamed');
  assert.equal(third[0].eligible, false);
});

test('streamed over-limit body is 413, wrong content-type 415, closing 503', async (t) => {
  const h = await harness(t, () => []);
  const chunk = new TextEncoder().encode('x'.repeat(40000));
  const stream = new ReadableStream({
    pull(controller) {
      controller.enqueue(chunk);
    },
  });
  const big = await h.route.fetch(
    new Request('http://localhost/api/waycraft-skills.catalog', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-waycraft-skills': '1' },
      body: stream,
      duplex: 'half',
    }),
  );
  assert.equal(big.status, 413);
  const wrong = await h.post(
    { action: 'list' },
    { 'content-type': 'text/plain' },
  );
  assert.equal(wrong.status, 415);
  const route = h.route;
  await h.stop();
  const closing = await route.fetch(
    new Request('http://localhost/api/waycraft-skills.catalog', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-waycraft-skills': '1' },
      body: '{"action":"list"}',
    }),
  );
  assert.equal(closing.status, 503);
});
