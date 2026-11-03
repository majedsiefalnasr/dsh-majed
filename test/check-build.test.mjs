import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  chmod,
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const check = fileURLToPath(
  new URL('../scripts/check-build.mjs', import.meta.url),
);

function trackBuildInputs(root) {
  assert.equal(spawnSync('git', ['init', '-q'], { cwd: root }).status, 0);
  assert.equal(
    spawnSync(
      'git',
      [
        'add',
        'package.json',
        'tsconfig.json',
        'tsdown.config.ts',
        'client.js',
        'scripts',
        'src',
        'locale',
      ],
      { cwd: root },
    ).status,
    0,
  );
}

test('build mismatch fails without changing any working-tree output', async () => {
  const root = await mkdtemp(join(tmpdir(), 'check-build-test-'));
  try {
    for (const name of [
      'scripts',
      'src',
      'locale',
      'dist',
      'node_modules',
      'bin',
    ]) {
      await mkdir(join(root, name), { recursive: true });
    }
    await cp(check, join(root, 'scripts/check-build.mjs'));
    await writeFile(join(root, 'scripts/assemble-client.mjs'), '');
    for (const name of [
      'package.json',
      'tsconfig.json',
      'tsdown.config.ts',
      'client.js',
    ]) {
      await writeFile(join(root, name), '{}');
    }
    await writeFile(join(root, 'dist/output.js'), 'original output\n');
    await writeFile(
      join(root, 'bin/npm'),
      '#!/bin/sh\nprintf "rebuilt output\\n" > dist/output.js\n',
    );
    await mkdir(join(root, 'bin', 'dist'), { recursive: true });
    await chmod(join(root, 'bin', 'npm'), 0o755);
    const before = await Promise.all([
      readFile(join(root, 'dist/output.js')),
      readdir(join(root, 'dist')),
    ]);
    trackBuildInputs(root);
    const result = spawnSync(
      process.execPath,
      [join(root, 'scripts/check-build.mjs')],
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
    assert.match(result.stderr, /Committed output differs from a fresh build/);
    assert.deepEqual(
      await Promise.all([
        readFile(join(root, 'dist/output.js')),
        readdir(join(root, 'dist')),
      ]),
      before,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('orphan artifacts in committed dist are detected', async () => {
  const root = await mkdtemp(join(tmpdir(), 'check-build-orphan-'));
  try {
    for (const name of [
      'scripts',
      'src',
      'locale',
      'dist',
      'node_modules',
      'bin',
    ]) {
      await mkdir(join(root, name), { recursive: true });
    }
    await cp(check, join(root, 'scripts/check-build.mjs'));
    await writeFile(join(root, 'scripts/assemble-client.mjs'), '');
    for (const name of [
      'package.json',
      'tsconfig.json',
      'tsdown.config.ts',
      'client.js',
    ]) {
      await writeFile(join(root, name), '{}');
    }
    // Committed dist has an extra file that a fresh build would not produce
    await writeFile(join(root, 'dist/output.js'), 'original output\n');
    await writeFile(join(root, 'dist/orphan.js'), 'this should not exist\n');
    await mkdir(join(root, 'bin', 'dist'), { recursive: true });
    await writeFile(
      join(root, 'bin', 'npm'),
      '#!/bin/sh\nprintf "rebuilt output\\n" > dist/output.js\n',
    );
    await chmod(join(root, 'bin', 'npm'), 0o755);
    trackBuildInputs(root);
    const result = spawnSync(
      process.execPath,
      [join(root, 'scripts/check-build.mjs')],
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
    assert.match(result.stderr, /orphan artifacts/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('build passes when committed dist exactly matches fresh build', async () => {
  const root = await mkdtemp(join(tmpdir(), 'check-build-pass-'));
  try {
    for (const name of [
      'scripts',
      'src',
      'locale',
      'dist',
      'node_modules',
      'bin',
    ]) {
      await mkdir(join(root, name), { recursive: true });
    }
    await cp(check, join(root, 'scripts/check-build.mjs'));
    await writeFile(join(root, 'scripts/assemble-client.mjs'), '');
    for (const name of [
      'package.json',
      'tsconfig.json',
      'tsdown.config.ts',
      'client.js',
    ]) {
      await writeFile(join(root, name), '{}');
    }
    await writeFile(join(root, 'src/owned.ts'), 'owned');
    for (const directory of [
      'src/private',
      'src/vendor',
      'src/fixtures',
      'locale/private',
    ]) {
      await mkdir(join(root, directory), { recursive: true });
      await writeFile(join(root, directory, 'excluded.txt'), 'private fixture');
    }
    await writeFile(join(root, 'dist/output.js'), 'rebuilt output\n');
    await mkdir(join(root, 'bin', 'dist'), { recursive: true });
    await writeFile(
      join(root, 'bin', 'npm'),
      '#!/bin/sh\nset -eu\ntest -f src/owned.ts\ntest ! -e src/untracked.ts\ntest ! -e src/private\ntest ! -e src/vendor\ntest ! -e src/fixtures\ntest ! -e locale/private\nprintf "rebuilt output\\n" > dist/output.js\n',
    );
    await chmod(join(root, 'bin', 'npm'), 0o755);
    trackBuildInputs(root);
    await writeFile(join(root, 'src/untracked.ts'), 'must not be copied');
    const result = spawnSync(
      process.execPath,
      [join(root, 'scripts/check-build.mjs')],
      {
        cwd: root,
        env: {
          ...process.env,
          PATH: `${join(root, 'bin')}:${process.env.PATH}`,
        },
        encoding: 'utf8',
      },
    );
    assert.equal(result.status, 0);
    assert.match(result.stdout, /matches a fresh build with no orphans/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
