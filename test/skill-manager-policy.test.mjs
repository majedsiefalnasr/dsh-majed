import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { apply } from '../dist/skills.js';

test('persisted source toggle invalidates providers and survives re-entry', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'waycraft-policy-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const source = join(root, 'skills');
  await mkdir(join(source, 'example'), { recursive: true });
  await writeFile(
    join(source, 'example', 'SKILL.md'),
    '---\nname: example\ndescription: Example\n---\nExact body',
  );
  const statePath = join(root, 'state.json');
  let provider,
    route,
    invalidations = 0;
  const stops = [];
  const controller = new AbortController();
  const ctx = {
    skills: {
      registerProvider(create) {
        provider = create({
          signal: controller.signal,
          invalidate() {
            invalidations++;
          },
        });
        return () => controller.abort();
      },
    },
    effect(start) {
      stops.push(start());
    },
    inject(names, callback) {
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
  const config = { sources: [{ id: 'fixture', path: source }], statePath };
  apply(ctx, config);
  const listed = (await provider.list())[0];
  assert.equal(listed.invocation.modelInvocable, true);
  const response = await route.fetch(
    new Request('http://localhost/api/majed-skills.catalog', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-majed-skills': '1' },
      body: JSON.stringify({
        action: 'toggle',
        kind: 'source',
        id: 'fixture',
        enabled: false,
      }),
    }),
  );
  assert.equal(response.status, 200);
  const rejected = await route.fetch(
    new Request('http://localhost/api/majed-skills.catalog', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://evil.invalid',
        'x-majed-skills': '1',
      },
      body: JSON.stringify({
        action: 'toggle',
        kind: 'source',
        id: 'fixture',
        enabled: true,
      }),
    }),
  );
  assert.equal(rejected.status, 403);
  for (const [headers, body, status] of [
    [
      { 'content-type': 'application/json' },
      { action: 'toggle', kind: 'source', id: 'fixture', enabled: true },
      403,
    ],
    [
      { 'content-type': 'application/json', 'x-majed-skills': '1' },
      { action: 'unexpected' },
      400,
    ],
    [
      { 'content-type': 'application/json', 'x-majed-skills': '1' },
      { action: 'toggle', kind: 'source', id: 'unknown', enabled: true },
      400,
    ],
  ]) {
    const result = await route.fetch(
      new Request('http://localhost/api/majed-skills.catalog', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      }),
    );
    assert.equal(result.status, status);
  }
  assert.equal(invalidations, 1);
  assert.equal(await provider.get(listed), undefined);
  assert.equal((await provider.list())[0].invocation.modelInvocable, false);
  assert.equal(
    JSON.parse(await readFile(statePath, 'utf8')).sources.fixture,
    false,
  );
  for (const stop of stops.splice(0)) await stop();
  assert.equal(route, undefined);
  const next = new AbortController();
  ctx.skills.registerProvider = (create) => {
    provider = create({ signal: next.signal, invalidate() {} });
    return () => next.abort();
  };
  apply(ctx, config);
  assert.equal((await provider.list())[0].invocation.userInvocable, false);
  for (const stop of stops.splice(0)) await stop();
});
