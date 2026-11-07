// Legacy-name storage migration: copy-verify-readFallback from the retired `majed` locations.
// Real temp-dir fixtures; the legacy tree is never modified or deleted.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  statSync,
  chmodSync,
  symlinkSync,
  existsSync,
  utimesSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  migrateFile,
  migrateTree,
  readableStorePath,
  legacyStorePath,
  legacySkillsRoot,
} from '../dist/storage-migration.js';
import { LEGACY_PLUGIN_DIR, LEGACY_SKILLS_DIR } from '../dist/legacy-names.js';

function fixture() {
  const home = mkdtempSync(join(tmpdir(), 'waycraft-t159-'));
  const plugins = join(home, 'plugins');
  const oldDir = join(plugins, LEGACY_PLUGIN_DIR, 'subscriptions');
  const newDir = join(plugins, 'waycraft', 'subscriptions');
  mkdirSync(oldDir, { recursive: true, mode: 0o700 });
  return {
    home,
    oldDir,
    newDir,
    oldFile: join(oldDir, 'auth.json'),
    newFile: join(newDir, 'auth.json'),
  };
}
const snapshot = (dir) =>
  readdirSync(dir)
    .sort()
    .map((n) => [n, readFileSync(join(dir, n), 'utf8')]);
const mode = (p) => statSync(p).mode & 0o777;

test('legacyStorePath maps only the new subscriptions directory', () => {
  const f = fixture();
  assert.equal(legacyStorePath(f.newFile), f.oldFile);
  assert.equal(
    legacyStorePath(join(f.home, 'elsewhere', 'auth.json')),
    undefined,
  );
});

test('old only: copied, mode 0600 preserved, directory 0700, old untouched', () => {
  const f = fixture();
  writeFileSync(f.oldFile, '{"a":1}', { mode: 0o600 });
  const before = snapshot(f.oldDir);
  const result = migrateFile(f.newFile, f.oldFile);
  assert.equal(result.status, 'copied');
  assert.equal(readFileSync(f.newFile, 'utf8'), '{"a":1}');
  assert.equal(mode(f.newFile), 0o600);
  assert.equal(mode(f.newDir) & 0o077, 0);
  assert.deepEqual(snapshot(f.oldDir), before);
  assert.equal(readableStorePath(f.newFile), f.newFile);
  // No stage leftovers.
  assert.deepEqual(readdirSync(f.newDir), ['auth.json']);
});

test('new only: nothing to migrate, new file used', () => {
  const f = fixture();
  mkdirSync(f.newDir, { recursive: true });
  writeFileSync(f.newFile, '{"n":1}', { mode: 0o600 });
  assert.equal(migrateFile(f.newFile, f.oldFile).status, 'exists');
  assert.equal(readableStorePath(f.newFile), f.newFile);
  assert.equal(readFileSync(f.newFile, 'utf8'), '{"n":1}');
});

test('both present: new is never overwritten', () => {
  const f = fixture();
  mkdirSync(f.newDir, { recursive: true });
  writeFileSync(f.oldFile, '{"o":1}', { mode: 0o600 });
  writeFileSync(f.newFile, '{"n":1}', { mode: 0o600 });
  assert.equal(migrateFile(f.newFile, f.oldFile).status, 'exists');
  assert.equal(readFileSync(f.newFile, 'utf8'), '{"n":1}');
  assert.equal(readFileSync(f.oldFile, 'utf8'), '{"o":1}');
});

test('corrupt old JSON: diagnostic, no crash, no partial new file, old untouched', () => {
  const f = fixture();
  writeFileSync(f.oldFile, '{not json', { mode: 0o600 });
  const warnings = [];
  const original = console.warn;
  console.warn = (...a) => warnings.push(a.join(' '));
  try {
    const result = migrateFile(f.newFile, f.oldFile);
    assert.equal(result.status, 'failed');
  } finally {
    console.warn = original;
  }
  assert.equal(existsSync(f.newFile), false);
  const leftovers = existsSync(f.newDir) ? readdirSync(f.newDir) : [];
  assert.deepEqual(leftovers, []);
  assert.equal(readFileSync(f.oldFile, 'utf8'), '{not json');
  assert.ok(
    warnings.every((w) => !w.includes('not json')),
    'never logs contents',
  );
});

test('copy failure (read-only target dir) falls back to reading the legacy file', () => {
  const f = fixture();
  writeFileSync(f.oldFile, '{"a":1}', { mode: 0o600 });
  mkdirSync(f.newDir, { recursive: true });
  chmodSync(f.newDir, 0o500);
  try {
    if (process.getuid?.() === 0) return; // root ignores directory modes
    const original = console.warn;
    console.warn = () => {};
    let path;
    try {
      path = readableStorePath(f.newFile);
    } finally {
      console.warn = original;
    }
    assert.equal(path, f.oldFile);
    assert.equal(existsSync(f.newFile), false);
    assert.equal(readFileSync(f.oldFile, 'utf8'), '{"a":1}');
  } finally {
    chmodSync(f.newDir, 0o700);
  }
});

test('interrupted-copy leftovers are ignored and only stale ones of ours are cleaned', () => {
  const f = fixture();
  writeFileSync(f.oldFile, '{"a":1}', { mode: 0o600 });
  mkdirSync(f.newDir, { recursive: true });
  const fresh = join(f.newDir, 'auth.json.migrating-1-aa.tmp');
  const stale = join(f.newDir, 'auth.json.migrating-2-bb.tmp');
  const foreign = join(f.newDir, 'auth.json.keep');
  writeFileSync(fresh, 'partial');
  writeFileSync(stale, 'partial');
  writeFileSync(foreign, 'mine');
  const old = new Date(Date.now() - 60 * 60 * 1000);
  utimesSync(stale, old, old);
  assert.equal(migrateFile(f.newFile, f.oldFile).status, 'copied');
  assert.equal(readFileSync(f.newFile, 'utf8'), '{"a":1}');
  assert.equal(existsSync(stale), false, 'stale own stage removed');
  assert.equal(
    existsSync(fresh),
    true,
    'fresh stage (possibly another process) kept',
  );
  assert.equal(
    readFileSync(foreign, 'utf8'),
    'mine',
    'unrelated files untouched',
  );
});

test('skills tree: copies nested files with modes, skips symlinks, never modifies old', () => {
  const home = mkdtempSync(join(tmpdir(), 'waycraft-t159-'));
  const oldRoot = legacySkillsRoot(home);
  assert.ok(oldRoot.endsWith(LEGACY_SKILLS_DIR));
  const outside = mkdtempSync(join(tmpdir(), 'waycraft-t159-outside-'));
  writeFileSync(join(outside, 'secret.txt'), 'outside');
  mkdirSync(join(oldRoot, 'trash'), { recursive: true, mode: 0o700 });
  writeFileSync(join(oldRoot, 'state.json'), '{"placement":"sidebar"}', {
    mode: 0o600,
  });
  writeFileSync(join(oldRoot, 'trash', 'x.txt'), 'x', { mode: 0o640 });
  symlinkSync(outside, join(oldRoot, 'link'));
  symlinkSync(join(outside, 'secret.txt'), join(oldRoot, 'file-link'));
  const newRoot = join(home, 'waycraft-skills');
  const result = migrateTree(newRoot, oldRoot);
  assert.equal(result.status, 'copied');
  assert.equal(
    readFileSync(join(newRoot, 'state.json'), 'utf8'),
    '{"placement":"sidebar"}',
  );
  assert.equal(mode(join(newRoot, 'state.json')), 0o600);
  assert.equal(mode(join(newRoot, 'trash', 'x.txt')), 0o640);
  assert.equal(mode(newRoot), mode(oldRoot));
  assert.equal(existsSync(join(newRoot, 'link')), false);
  assert.equal(existsSync(join(newRoot, 'file-link')), false);
  assert.equal(readFileSync(join(outside, 'secret.txt'), 'utf8'), 'outside');
  assert.equal(
    readFileSync(join(oldRoot, 'state.json'), 'utf8'),
    '{"placement":"sidebar"}',
  );
  assert.ok(existsSync(join(oldRoot, 'link')));
  // Second run does not overwrite.
  writeFileSync(join(newRoot, 'state.json'), '{"placement":"both"}');
  assert.equal(migrateTree(newRoot, oldRoot).status, 'exists');
  assert.equal(
    readFileSync(join(newRoot, 'state.json'), 'utf8'),
    '{"placement":"both"}',
  );
});

test('skills tree: corrupt top-level state.json leaves no partial new root', () => {
  const home = mkdtempSync(join(tmpdir(), 'waycraft-t159-'));
  const oldRoot = legacySkillsRoot(home);
  mkdirSync(oldRoot, { recursive: true });
  writeFileSync(join(oldRoot, 'state.json'), '{bad');
  const original = console.warn;
  console.warn = () => {};
  let result;
  try {
    result = migrateTree(join(home, 'waycraft-skills'), oldRoot);
  } finally {
    console.warn = original;
  }
  assert.equal(result.status, 'failed');
  assert.deepEqual(readdirSync(home).sort(), [LEGACY_SKILLS_DIR]);
});

test('skills tree: no legacy directory is a no-op', () => {
  const home = mkdtempSync(join(tmpdir(), 'waycraft-t159-'));
  assert.equal(
    migrateTree(join(home, 'waycraft-skills'), legacySkillsRoot(home)).status,
    'no-legacy',
  );
  assert.deepEqual(readdirSync(home), []);
});

test('credential files are published owner-only even when the legacy mode was wider', () => {
  const f = fixture();
  writeFileSync(f.oldFile, '{"a":1}', { mode: 0o644 });
  chmodSync(f.oldFile, 0o644);
  assert.equal(migrateFile(f.newFile, f.oldFile).status, 'copied');
  assert.equal(mode(f.newFile), 0o600);
  assert.equal(mode(f.oldFile), 0o644, 'legacy file untouched');
});

test('a large multi-chunk tree file is copied completely (full-write loop)', () => {
  const home = mkdtempSync(join(tmpdir(), 'waycraft-t159-'));
  const oldRoot = legacySkillsRoot(home);
  mkdirSync(oldRoot, { recursive: true });
  const big = Buffer.alloc(8 * 1024 * 1024, 'x');
  writeFileSync(join(oldRoot, 'big.bin'), big);
  const newRoot = join(home, 'waycraft-skills');
  assert.equal(migrateTree(newRoot, oldRoot).status, 'copied');
  assert.ok(readFileSync(join(newRoot, 'big.bin')).equals(big));
});
