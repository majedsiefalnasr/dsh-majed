import assert from 'node:assert/strict';
import {
  mkdtemp,
  realpath,
  rm,
  mkdir,
  readFile,
  symlink,
  readdir,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { apply } from '../dist/skills.js';

for (const duplicate of [false, true])
  test(`creation tool approval, duplicate=${duplicate}, shutdown lifecycle`, async (t) => {
    const root = await realpath(
      await mkdtemp(join(tmpdir(), 'waycraft-create-tool-')),
    );
    t.after(() => rm(root, { recursive: true, force: true }));
    const stops = [];
    const listeners = new Map();
    let definition;
    let removed = 0;
    const tools = {
      get: () => (duplicate ? {} : undefined),
      register(value) {
        definition = value;
        return () => {
          removed++;
        };
      },
    };
    const ctx = {
      skills: { registerProvider: () => () => {} },
      effect(fn) {
        stops.push(fn());
      },
      on(event, fn) {
        listeners.set(event, fn);
        return () => listeners.delete(event);
      },
      get(name) {
        if (name === 'tools') return tools;
      },
    };
    apply(ctx, {
      sources: [{ id: 'user-dsh', path: join(root, 'skills') }],
      statePath: join(root, 'state.json'),
    });
    if (duplicate) {
      assert.equal(definition, undefined);
      assert.equal(listeners.has('tools/pre-execute'), false);
    } else {
      assert.match(definition.description, /only when the user explicitly/i);
      const gate = listeners.get('tools/pre-execute');
      assert.equal(
        (
          await gate({ name: 'dsh_waycraft_create_skill' }, () =>
            Promise.resolve({ kind: 'allow' }),
          )
        ).kind,
        'ask',
      );
      assert.equal(
        (
          await gate({ name: 'other' }, () =>
            Promise.resolve({ kind: 'allow' }),
          )
        ).kind,
        'allow',
      );
      const args = {
        name: 'Tool Skill',
        description: 'Use for tool work',
        body: '# Tool instructions',
      };
      const result = await definition.execute(args);
      assert.equal(result.name, 'tool-skill');
      assert.match(await readFile(result.path, 'utf8'), /Tool instructions/);
      const pending = definition.execute({ ...args, name: 'During shutdown' });
      for (const stop of [...stops].reverse()) await stop?.();
      const outcome = await pending.catch((error) => error);
      assert.ok(
        outcome.name === 'during-shutdown' ||
          /stopping/.test(String(outcome.message)),
      );
      assert.equal(removed, 1);
      assert.equal(listeners.has('tools/pre-execute'), false);
      await assert.rejects(
        definition.execute({ ...args, name: 'After shutdown' }),
        /stopping/,
      );
      assert.match(await readFile(result.path, 'utf8'), /Tool instructions/);
      return;
    }
    for (const stop of [...stops].reverse()) await stop?.();
  });

test('registered creation safely publishes user and absent project DSH skills', async (t) => {
  const root = await realpath(
    await mkdtemp(join(tmpdir(), 'waycraft-create-')),
  );
  t.after(() => rm(root, { recursive: true, force: true }));
  const app = join(root, 'app');
  await mkdir(join(app, '.git'), { recursive: true });
  let route;
  const stops = [];
  let provider;
  const ctx = {
    skills: {
      registerProvider(create) {
        provider = create({
          signal: new AbortController().signal,
          invalidate() {},
        });
        return () => {};
      },
    },
    effect(fn) {
      stops.push(fn());
    },
    get(name) {
      if (name === 'workspaceRegistry') return { list: () => [{ path: app }] };
    },
    inject(_, fn) {
      fn({
        effect: ctx.effect,
        get: () => ({
          fetch: {
            register(r) {
              route = r;
              return () => {};
            },
          },
        }),
      });
    },
  };
  apply(ctx, {
    sources: [
      { id: 'user-dsh', path: join(root, 'dsh', 'skills') },
      { id: 'user-agents', path: join(root, 'agents', 'skills') },
    ],
    statePath: join(root, 'state.json'),
  });
  t.after(async () => {
    for (const stop of stops) await stop?.();
  });
  const post = async (body, marked = true) => {
    const r = await route.fetch(
      new Request('http://localhost/api/waycraft-skills.catalog', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(marked ? { 'x-waycraft-skills': '1' } : {}),
        },
        body: JSON.stringify(body),
      }),
    );
    return { status: r.status, body: await r.json().catch(() => null) };
  };
  const input = {
    action: 'create',
    source: 'user-dsh',
    name: 'My New Skill',
    description: 'Use when "needed": yes',
    body: '# Instructions\nDo the work.',
  };
  assert.equal((await post(input, false)).status, 403);
  const created = await post(input);
  assert.equal(created.status, 200);
  assert.equal(created.body.created.name, 'my-new-skill');
  assert.match(
    await readFile(
      join(root, 'dsh', 'skills', 'my-new-skill', 'SKILL.md'),
      'utf8',
    ),
    /description: "Use when/,
  );
  assert.ok(created.body.copies.some((x) => x.name === 'my-new-skill'));
  // Untouched native user copies intentionally need no overlay, but the registered
  // provider must resolve their actual content after its discovery snapshot.
  await provider.list();
  const available = await provider.get({ path: created.body.created.path });
  assert.equal(available.name, 'my-new-skill');
  assert.match(available.content, /Do the work/);
  const oversized = await route.fetch(
    new Request('http://localhost/api/waycraft-skills.catalog', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': '20000',
      },
      body: JSON.stringify({ action: 'list' }),
    }),
  );
  assert.equal(oversized.status, 413);
  const original = await readFile(
    join(root, 'dsh', 'skills', 'my-new-skill', 'SKILL.md'),
    'utf8',
  );
  assert.equal((await post({ ...input, body: 'overwrite' })).status, 409);
  assert.equal(
    await readFile(
      join(root, 'dsh', 'skills', 'my-new-skill', 'SKILL.md'),
      'utf8',
    ),
    original,
  );
  const concurrent = await Promise.all([
    post({ ...input, name: 'Concurrent' }),
    post({ ...input, name: 'Concurrent' }),
  ]);
  assert.deepEqual(concurrent.map((x) => x.status).sort(), [200, 409]);
  await mkdir(join(root, 'dsh', 'skills', 'empty'));
  assert.equal((await post({ ...input, name: 'empty' })).status, 409);
  assert.deepEqual(await readdir(join(root, 'dsh', 'skills', 'empty')), []);
  assert.equal(
    (await post({ ...input, name: 'large', body: 'x'.repeat(262145) })).status,
    413,
  );
  assert.equal((await post({ ...input, project: 'unregistered' })).status, 404);
  assert.ok(
    !(await readdir(join(root, 'dsh', 'skills'))).some((x) =>
      x.startsWith('.create-'),
    ),
  );
  assert.equal((await post({ ...input, name: '../escape' })).status, 400);
  assert.equal((await post({ ...input, source: 'codex' })).status, 403);
  const listed = await post({ action: 'list' });
  const project = listed.body.projects[0].id;
  assert.ok(
    (await post({ action: 'list', project })).body.project.sources.some(
      (x) => x.kind === 'dsh',
    ),
  );
  assert.deepEqual(
    (await post({ action: 'list', project })).body.project.diagnostics,
    [],
  );
  const p = await post({
    ...input,
    project,
    source: `project-dsh:${project}`,
    name: 'Project Skill',
  });
  assert.equal(p.status, 200);
  assert.match(
    await readFile(
      join(app, '.dsh', 'skills', 'project-skill', 'SKILL.md'),
      'utf8',
    ),
    /Project|Instructions/,
  );
  await mkdir(join(root, 'outside'));
  await mkdir(join(root, 'agents'));
  await symlink(join(root, 'outside'), join(root, 'agents', 'skills'));
  assert.equal((await post({ ...input, source: 'user-agents' })).status, 409);
  assert.deepEqual(await readdir(join(root, 'outside')), []);
  await rm(join(app, '.dsh'), { recursive: true });
  await symlink(join(root, 'outside'), join(app, '.dsh'));
  assert.equal(
    (await post({ action: 'list', project })).body.project.sources.some(
      (x) => x.kind === 'dsh',
    ),
    false,
  );
  assert.equal(
    (
      await post({
        ...input,
        project,
        source: `project-dsh:${project}`,
        name: 'Linked Project',
      })
    ).status,
    409,
  );
  assert.deepEqual(await readdir(join(root, 'outside')), []);
});
