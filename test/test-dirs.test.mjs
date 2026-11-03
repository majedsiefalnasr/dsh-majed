import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareTestDirectories } from '../scripts/prepare-test-dirs.mjs';

test('legacy test parents are prepared in a clean root before workers start', async () => {
  const root = await mkdtemp(join(tmpdir(), 'waycraft-test-dirs-'));
  try {
    await assert.rejects(mkdtemp(join(root, 'majed-t130', 'fixture-')), {
      code: 'ENOENT',
    });
    await prepareTestDirectories(root);
    await prepareTestDirectories(root);
    for (const parent of ['majed-t129', 'majed-t130', 'majed-t134']) {
      const dir = await mkdtemp(join(root, parent, 'fixture-'));
      assert.equal(dir.startsWith(join(root, parent, 'fixture-')), true);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
