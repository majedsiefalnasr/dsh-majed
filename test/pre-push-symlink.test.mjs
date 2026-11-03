import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

test('pre-push refuses tracked symlinks instead of copying private targets', () => {
  const root = mkdtempSync(join(tmpdir(), 'pre-push-symlink-'));
  try {
    for (const name of ['scripts', 'src']) mkdirSync(join(root, name));
    copyFileSync(
      fileURLToPath(new URL('../scripts/check-pre-push.mjs', import.meta.url)),
      join(root, 'scripts/check-pre-push.mjs'),
    );
    writeFileSync(join(root, 'src/input.js'), 'owned');
    writeFileSync(join(root, 'private'), 'private');
    execFileSync('git', ['init', '--quiet', root]);
    execFileSync('git', ['add', '--force', 'src/input.js'], { cwd: root });
    unlinkSync(join(root, 'src/input.js'));
    symlinkSync(join(root, 'private'), join(root, 'src/input.js'));
    const result = spawnSync(
      process.execPath,
      [join(root, 'scripts/check-pre-push.mjs')],
      { encoding: 'utf8' },
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /requires a regular file/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
