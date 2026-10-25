import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm, cp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createContext, runInContext } from 'node:vm';

const root = new URL('../../', import.meta.url);

test('real npm pack emits parseable JSON and the extracted lifecycle rebuilds its client', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-majed-package-test-'));
  const target = resolve(directory);
  const expectedParent = resolve(tmpdir()) + sep;
  assert.ok(target.startsWith(expectedParent) && target.split(sep).at(-1).startsWith('dsh-majed-package-test-'));
  t.after(() => rm(target, { recursive: true, force: true }));
  const [pack] = JSON.parse(execFileSync('npm', ['pack', '--json', '--pack-destination', directory,
    '--cache', '.npm-pack-cache', '--logs-dir', '.npm-pack-cache/_logs'], { cwd: root, encoding: 'utf8' }));
  execFileSync('tar', ['-xzf', join(directory, pack.filename), '-C', directory]);
  execFileSync('npm', ['run', 'prepare'], { cwd: join(directory, 'package'), encoding: 'utf8' });
  assert.equal(await readFile(join(directory, 'package/dist/client.js'), 'utf8'),
    await readFile(new URL('client.js', root), 'utf8'));
});
const manifest = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));

test('built public client is baseline-only and preserves its ModuleLoader identity', async () => {
  assert.equal(manifest.exports['./client'], './dist/client.js');
  const built = await readFile(new URL(manifest.exports['./client'], root), 'utf8');
  assert.equal(built, await readFile(new URL('client.js', root), 'utf8'));
  const registrations = [];
  runInContext(built, createContext({ window: { __ModuleLoader__: { load: value => registrations.push(value) } } }));
  assert.deepEqual(registrations.map(value => value.id), ['dsh-majed']);
});

test('packaging includes baseline and selected runtime artifacts while excluding tests', () => {
  const [pack] = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts',
    '--cache', '.npm-pack-cache', '--logs-dir', '.npm-pack-cache/_logs'], { cwd: root, encoding: 'utf8' }));
  const files = pack.files.map(file => file.path);
  for (const file of ['index.js', 'lib/baseline/host.js', 'lib/read-page-native.js', 'dist/client.js',
    'scripts/build-baseline.mjs', 'CHANGELOG.md', 'THIRD_PARTY_NOTICES.md', 'LICENSE', 'fonts/inter-latin-wght-normal.woff2']) {
    assert.ok(files.includes(file), `Missing ${file}`);
  }
  assert.equal(files.some(file => /^(test|deployment-backups)\//.test(file)), false);
  assert.ok(files.includes('modules/skills/native.js'));
  assert.ok(files.includes('modules/skills/vendor/lib/core.js'));
  assert.ok(files.includes('modules/skills/vendor/lib/readonly-discovery.js'));
  assert.ok(files.includes('modules/skills/vendor/LICENSE'));
  assert.equal(files.some(file => /(?:^|\/)test(?:s)?\/|\.test\.[cm]?js$/.test(file)), false);
  assert.equal(files.includes('client-bundle.js'), false);
  assert.equal(files.includes('package-lock.json'), false);
});

test('packaging excludes deferred Skills payload even when the old distribution is present', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-majed-package-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await cp(new URL('modules/', root), join(directory, 'modules'), { recursive: true });
  await writeFile(join(directory, 'package.json'), JSON.stringify({ name: 'skills-package-fixture', version: '1.0.0', files: ['modules/**/*'] }));
  const excluded = [
    'modules/managers/managers.test.js',
    'modules/skills/vendor/lib/index.js', 'modules/skills/vendor/lib/client.js',
    'modules/skills/vendor/lib/repositories.js', 'modules/skills/vendor/lib/repository-updates.js',
    'modules/skills/vendor/lib/plugin-updater.js', 'modules/skills/vendor/lib/catalog-skill.js',
    'modules/skills/vendor/lib/clawhub-catalog.js', 'modules/skills/vendor/lib/skills-sh-catalog.js',
    'modules/skills/vendor/assets/branding/banner.webp', 'modules/skills/vendor/locale/zh.json',
    'modules/skills/vendor/package.json', 'modules/skills/vendor/cordis.patch.yml',
    'modules/skills/vendor/README.md', 'modules/skills/vendor/CHANGELOG.md',
  ];
  for (const path of excluded) {
    await mkdir(join(directory, path, '..'), { recursive: true });
    await writeFile(join(directory, path), 'deferred fixture payload');
  }
  const [pack] = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts',
    '--cache', join(directory, 'cache')], { cwd: directory, encoding: 'utf8' }));
  const files = pack.files.map(file => file.path);
  for (const path of excluded) assert.equal(files.includes(path), false, `Unexpected deferred payload: ${path}`);
  for (const path of ['modules/skills/native.js', 'modules/skills/vendor/lib/core.js',
    'modules/skills/vendor/lib/readonly-discovery.js', 'modules/skills/vendor/LICENSE', 'modules/skills/PROVENANCE.md']) {
    assert.ok(files.includes(path), `Missing retained basic runtime: ${path}`);
  }
});
