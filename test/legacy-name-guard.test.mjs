// Guard (ticket #159): the retired product name must not reappear in owned sources. The allow-list is deliberate
// and each entry is justified; everything else fails with file:line.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const SCAN = [
  'src',
  'test',
  'scripts',
  'README.md',
  'DESIGN.md',
  'PRODUCT.md',
  'AGENTS.md',
  'GLOSSARY.md',
  'package.json',
  'tsdown.config.ts',
  'client.js',
  'index.js',
  'cordis.patch.yml',
  'locale',
  'subscriptions',
  'skills',
  '.impeccable',
  '.github',
  '.githooks',
  'tsconfig.json',
  'tsconfig.browser.json',
  'tsconfig.reference.json',
  'biome.json',
  'THIRD_PARTY_NOTICES.md',
  'package-lock.json',
];
// Files that may name the retired identifiers entirely.
const FILE_ALLOW = new Map([
  [
    'src/legacy-names.ts',
    'single module holding every deprecated alias/migration constant',
  ],
  [
    'test/legacy-name-guard.test.mjs',
    'this guard names the pattern it forbids',
  ],
  [
    'test/legacy-storage-migration.test.mjs',
    'migration fixtures reference the legacy locations',
  ],
  [
    'test/subscriptions-browser.test.mjs',
    'alias tests: deprecated toolview ids',
  ],
  [
    'test/composer-surfaces.test.mjs',
    'alias test: legacy localStorage key fallback',
  ],
  [
    'test/skill-manager-lifecycle.test.mjs',
    'asserts Loader row ids that stay pending Owner verification',
  ],
  [
    'test/subscriptions-packaging.test.mjs',
    'asserts Loader row ids that stay pending Owner verification',
  ],
  ['GLOSSARY.md', 'names the pending Loader row id'],
  [
    'cordis.patch.yml',
    'Loader row ids pending Owner verification (docs/ai/rename-waycraft.md)',
  ],
  // Mixed-use files: only the lines matching the line allow-list below may contain the name.
]);
// Substrings removed before matching: author/repository identity and local paths are not branding.
const IDENTITY = [/majedsiefalnasr/gi, /Majed Sief Alnasr/g];
// Lines in other files that legitimately mention the retired name (checked per line).
const LINE_ALLOW = [
  {
    file: 'src/storage-migration.ts',
    // Pure comment lines only: nothing but comment text, and no code after a closing `*/`.
    pattern: /^\s*(\/\/.*|\/\*.*|\*(\s.*)?)$/,
    reject: /\*\/\s*\S/,
    why: 'comments describing the legacy source of migration',
  },
  {
    file: 'client.js',
    // Anchored: the whole line is the constant declaration, so extra code on it fails.
    pattern:
      /^\s*const (LEGACY_STORE_KEY = 'dsh-majed:settings:v1'|LEGACY_GLOBAL = '__dshMajed');\s*$/,
    why: 'deprecated localStorage key and global alias constants (browser entry cannot import src)',
  },
  {
    file: 'index.js',
    pattern: /^const LEGACY_FONT_ROUTE = '\/plugins\/dsh-majed\/fonts';\s*$/,
    why: 'deprecated font route constant (host entry cannot import TS source)',
  },
];
function* walk(path) {
  const stat = statSync(join(root, path));
  if (!stat.isDirectory()) return yield path;
  for (const name of readdirSync(join(root, path)).sort()) {
    if (name === 'node_modules' || name === 'vendor') continue;
    yield* walk(join(path, name));
  }
}

/** Offending `file:line` entries for one file's text (exported shape used by the mutant test). */
export function scanText(rel, text) {
  const offenders = [];
  const allow = LINE_ALLOW.find((a) => a.file === rel);
  text.split('\n').forEach((line, index) => {
    let clean = line;
    for (const pattern of IDENTITY) clean = clean.replace(pattern, '');
    if (!/majed/i.test(clean)) return;
    if (allow?.pattern.test(line) && !allow.reject?.test(line)) return;
    offenders.push(`${rel}:${index + 1}: ${line.trim().slice(0, 100)}`);
  });
  return offenders;
}

test('the retired product name appears only in justified places', () => {
  const offenders = [];
  for (const entry of SCAN.filter((e) => existsSync(join(root, e))))
    for (const file of walk(entry)) {
      const rel = relative(root, join(root, file));
      if (FILE_ALLOW.has(rel)) continue;
      if (/\.(png|jpg|woff2?|ttf|zip|gz)$/.test(rel)) continue;
      offenders.push(...scanText(rel, readFileSync(join(root, rel), 'utf8')));
    }
  assert.deepEqual(offenders, []);
});

test('mutant: an unrelated retired-name line in an entry file is flagged', () => {
  for (const file of ['client.js', 'index.js', 'src/storage-migration.ts']) {
    const text = readFileSync(join(root, file), 'utf8');
    assert.deepEqual(scanText(file, text), [], `${file} is clean as shipped`);
    const mutated = `${text}\nconst unrelated = 'majed-extra';\n`;
    assert.equal(scanText(file, mutated).length, 1, `${file} mutant flagged`);
  }
});

test('mutant: extra code on an allowed line, or code before a comment, is flagged', () => {
  const client = readFileSync(join(root, 'client.js'), 'utf8');
  const sameLine = client.replace(
    "const LEGACY_GLOBAL = '__dshMajed';",
    "const LEGACY_GLOBAL = '__dshMajed'; window.majedExtra = 1;",
  );
  assert.notEqual(sameLine, client);
  assert.equal(scanText('client.js', sameLine).length, 1);
  const index = readFileSync(join(root, 'index.js'), 'utf8');
  const sameLineIndex = index.replace(
    "fonts';",
    "fonts'; globalThis.majedExtra = 1;",
  );
  assert.notEqual(sameLineIndex, index);
  assert.equal(scanText('index.js', sameLineIndex).length, 1);
  const migration = readFileSync(
    join(root, 'src/storage-migration.ts'),
    'utf8',
  );
  for (const line of [
    '/** note */ const majedCode = 1;',
    'const majedCode = 1; // trailing comment',
  ])
    assert.equal(
      scanText('src/storage-migration.ts', `${migration}\n${line}\n`).length,
      1,
      line,
    );
});

test('every file-level allow-list entry still needs its exception and is justified', () => {
  for (const [file, why] of FILE_ALLOW) {
    assert.ok(why.length > 10, `${file} needs a justification`);
    if (file === 'test/legacy-name-guard.test.mjs') continue;
    let text = readFileSync(join(root, file), 'utf8');
    for (const pattern of IDENTITY) text = text.replace(pattern, '');
    assert.ok(
      /majed/i.test(text),
      `${file} no longer mentions the retired name; remove it from the allow-list`,
    );
  }
});
