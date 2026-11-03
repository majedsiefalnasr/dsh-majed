import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  chmod,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

const script = new URL('../scripts/quality.mjs', import.meta.url);

test('quality ignores deleted worktree files and invokes workflow actionlint', async () => {
  const root = await mkdtemp(join(tmpdir(), 'quality-command-'));
  try {
    for (const dir of [
      'scripts',
      'src',
      '.github/workflows',
      'bin',
      'node_modules/@biomejs/biome/bin',
    ]) {
      await mkdir(join(root, dir), { recursive: true });
    }
    await cp(script, join(root, 'scripts/quality.mjs'));
    await writeFile(join(root, 'src/deleted.ts'), '');
    await writeFile(join(root, '.github/workflows/test.yml'), 'name: fixture');
    await writeFile(
      join(root, 'node_modules/@biomejs/biome/bin/biome'),
      "require('node:fs').writeFileSync('biome-args.json', JSON.stringify(process.argv.slice(2)));\n",
    );
    await writeFile(
      join(root, 'bin/actionlint'),
      '#!/bin/sh\nprintf "%s\\n" "$@" > actionlint-args\nexit 3\n',
    );
    await chmod(join(root, 'bin/actionlint'), 0o755);
    assert.equal(spawnSync('git', ['init', '-q'], { cwd: root }).status, 0);
    assert.equal(
      spawnSync('git', ['add', 'scripts', 'src', '.github'], { cwd: root })
        .status,
      0,
    );
    await rm(join(root, 'src/deleted.ts'));
    const result = spawnSync(
      process.execPath,
      [join(root, 'scripts/quality.mjs'), 'lint'],
      {
        cwd: root,
        env: {
          ...process.env,
          PATH: `${join(root, 'bin')}:${process.env.PATH}`,
        },
        encoding: 'utf8',
      },
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Workflow lint failed \(actionlint exit 3\)/);
    assert.ok(
      !JSON.parse(
        await readFile(join(root, 'biome-args.json'), 'utf8'),
      ).includes('src/deleted.ts'),
    );
    assert.match(
      await readFile(join(root, 'actionlint-args'), 'utf8'),
      /\.github\/workflows\/test.yml/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
