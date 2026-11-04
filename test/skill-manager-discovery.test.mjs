import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { apply } from '../dist/skills.js';

test('built component discovers nested linked bundles, ignores nested references and terminates cycles', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'waycraft-discovery-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const source = join(root, 'skills'),
    external = join(root, 'external');
  await mkdir(join(source, 'collection', 'nested'), { recursive: true });
  await mkdir(external);
  const document = (name) =>
    `---\nname: ${name}\ndescription: Example\n---\n${name} body`;
  await writeFile(
    join(source, 'collection', 'nested', 'SKILL.md'),
    document('nested'),
  );
  await writeFile(
    join(source, 'collection', 'README.md'),
    document('not-a-skill'),
  );
  await writeFile(join(external, 'SKILL.md'), document('linked'));
  await symlink(external, join(source, 'linked'));
  await symlink(source, join(source, 'cycle'));
  let provider;
  const stops = [];
  const control = new AbortController();
  apply(
    {
      skills: {
        registerProvider(create) {
          provider = create({ signal: control.signal, invalidate() {} });
          return () => control.abort();
        },
      },
      effect(start) {
        stops.push(start());
      },
    },
    {
      sources: [{ id: 'fixture', path: source }],
      statePath: join(root, 'state.json'),
    },
  );
  assert.deepEqual((await provider.list()).map((x) => x.name).sort(), [
    'linked',
    'nested',
  ]);
  for (const stop of stops) await stop();
});
