import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const project = resolve(import.meta.dirname, '..');
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'waycraft-quality-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const name of ['scripts', '.githooks', 'src', 'test'])
    mkdirSync(join(dir, name));
  for (const name of [
    'biome.json',
    'package.json',
    'scripts/quality.mjs',
    'scripts/check-staged-quality.mjs',
    '.githooks/pre-commit',
  ])
    copyFileSync(join(project, name), join(dir, name));
  symlinkSync(join(project, 'node_modules'), join(dir, 'node_modules'), 'dir');
  execFileSync('git', ['init', '-q'], { cwd: dir });
  execFileSync(
    'git',
    [
      'add',
      'biome.json',
      'package.json',
      'scripts/quality.mjs',
      'scripts/check-staged-quality.mjs',
      '.githooks/pre-commit',
    ],
    { cwd: dir },
  );
  execFileSync(
    'git',
    [
      '-c',
      'user.name=Quality Fixture',
      '-c',
      'user.email=fixture@example.invalid',
      'commit',
      '-m',
      'init',
      '-q',
    ],
    { cwd: dir },
  );
  return dir;
}
function command(dir, args) {
  return spawnSync(args[0], args.slice(1), { cwd: dir, encoding: 'utf8' });
}

test('pre-commit rejects invalid staged content even when working copy is fixed', (t) => {
  const dir = fixture(t);
  writeFileSync(join(dir, 'src/example.ts'), 'const x=1\n');
  execFileSync('git', ['add', 'src/example.ts'], { cwd: dir });
  writeFileSync(join(dir, 'src/example.ts'), 'const x = 1;\n');
  const result = command(dir, ['sh', '.githooks/pre-commit']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Formatter would have printed/);
});

test('pre-commit accepts indexed single-quote configuration despite unstaged config changes', (t) => {
  const dir = fixture(t);
  writeFileSync(join(dir, 'src/example.ts'), "export const label = 'ready';\n");
  execFileSync('git', ['add', 'src/example.ts'], { cwd: dir });
  writeFileSync(join(dir, 'biome.json'), '{}');
  const result = command(dir, ['sh', '.githooks/pre-commit']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout + result.stderr, /Checked 1 file/);
});

test('pre-commit executes indexed helper rather than unstaged replacement', (t) => {
  const dir = fixture(t);
  writeFileSync(join(dir, 'src/example.ts'), "export const label = 'ready';\n");
  execFileSync('git', ['add', 'src/example.ts'], { cwd: dir });
  writeFileSync(
    join(dir, 'scripts/check-staged-quality.mjs'),
    'throw new Error("unstaged helper executed");',
  );
  const result = command(dir, ['sh', '.githooks/pre-commit']);
  assert.equal(result.status, 0, result.stderr);
});

test('format check covers a new untracked owned source file', (t) => {
  const dir = fixture(t);
  writeFileSync(join(dir, 'src/new-file.ts'), 'const x=1\n');
  assert.notEqual(command(dir, ['npm', 'run', 'format:check']).status, 0);
});

test('pre-commit does not check excluded fixture/bundle paths when staged', (t) => {
  const dir = fixture(t);
  writeFileSync(join(dir, 'scripts/unified-138.bundle.js'), 'const x=1\n');
  execFileSync('git', ['add', 'scripts/unified-138.bundle.js'], { cwd: dir });
  const res = command(dir, ['sh', '.githooks/pre-commit']);
  assert.equal(
    res.status,
    0,
    `pre-commit should pass for excluded path, got: ${res.stderr}`,
  );
});
