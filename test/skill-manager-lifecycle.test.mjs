import assert from 'node:assert/strict';
import {
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

// Public Host contract harness, not the native skill registry/command implementation.
test('Skill manager is independently default-off and activation disposes its provider without touching files or other components', async (t) => {
  const patch = await readFile(
    new URL('../cordis.patch.yml', import.meta.url),
    'utf8',
  );
  assert.match(
    patch,
    /id: majed-skills\s+name: 'dsh-waycraft\/skills'\s+disabled: true/,
  );
  const { apply } = await import('../dist/skills.js');
  const root = await realpath(
    await mkdtemp(join(tmpdir(), 'waycraft-skills-lifecycle-')),
  );
  t.after(() => rm(root, { recursive: true, force: true }));
  const sourceDir = join(root, 'skills');
  await mkdir(join(sourceDir, 'example'), { recursive: true });
  const document = join(sourceDir, 'example', 'SKILL.md');
  const state = join(root, 'manager-state.json');
  await writeFile(
    document,
    '---\nname: example\ndescription: Example\n---\nRetained\n',
  );
  await writeFile(
    state,
    JSON.stringify({ sources: {}, copies: { [document]: false } }),
  );
  const config = {
    sources: [{ id: 'fixture', path: sourceDir }],
    statePath: state,
  };
  const before = await Promise.all([
    readFile(document, 'utf8'),
    readFile(state, 'utf8'),
  ]);
  const providers = new Map([['other-component', { name: 'other-component' }]]);
  const effects = [];
  let control;
  let invalidations = 0;
  const ctx = {
    skills: {
      registerProvider(create) {
        const controller = new AbortController();
        control = {
          signal: controller.signal,
          invalidate() {
            invalidations++;
          },
        };
        const provider = create(control);
        assert.equal(providers.has(provider.name), false);
        providers.set(provider.name, provider);
        control.invalidate();
        return () => {
          controller.abort();
          providers.delete(provider.name);
          control.invalidate();
        };
      },
    },
    effect(start) {
      const stop = start();
      effects.push(stop);
      return stop;
    },
  };
  assert.deepEqual([...providers.keys()], ['other-component']);
  apply(ctx, config);
  assert.equal(providers.has('waycraft-skills'), true);
  const provider = providers.get('waycraft-skills');
  const listed = await provider.list();
  assert.equal(listed.length, 1);
  assert.deepEqual(listed[0].invocation, {
    modelInvocable: false,
    userInvocable: false,
  });
  assert.equal((await provider.get(listed[0])).path, document);
  for (const stop of effects.reverse()) await stop();
  assert.equal(control.signal.aborted, true);
  assert.equal(invalidations, 2);
  assert.deepEqual([...providers.keys()], ['other-component']);
  assert.deepEqual(
    await Promise.all([readFile(document, 'utf8'), readFile(state, 'utf8')]),
    before,
  );
  // A second activation must not collide with a leaked registration.
  effects.length = 0;
  apply(ctx, config);
  assert.equal(providers.has('waycraft-skills'), true);
  // Re-applying restores the persisted denial policy.
  const again = await providers.get('waycraft-skills').list();
  assert.deepEqual(again[0].invocation, {
    modelInvocable: false,
    userInvocable: false,
  });
  for (const stop of effects.reverse()) await stop();
  assert.deepEqual([...providers.keys()], ['other-component']);
  assert.equal(await readFile(state, 'utf8'), before[1]);
});
