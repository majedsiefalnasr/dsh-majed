import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createContext, runInContext } from 'node:vm';

const root = new URL('../../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));

test('built public client is baseline-only and preserves its ModuleLoader identity', async () => {
  assert.equal(manifest.exports['./client'], './dist/client.js');
  const built = await readFile(new URL(manifest.exports['./client'], root), 'utf8');
  assert.equal(built, await readFile(new URL('client.js', root), 'utf8'));
  const registrations = [];
  runInContext(built, createContext({ window: { __ModuleLoader__: { load: value => registrations.push(value) } } }));
  assert.deepEqual(registrations.map(value => value.id), ['dsh-majed']);
});

test('packaging includes executable baseline artifacts but not prototype runtimes or tests', () => {
  const [pack] = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts',
    '--cache', '.npm-pack-cache', '--logs-dir', '.npm-pack-cache/_logs'], { cwd: root, encoding: 'utf8' }));
  const files = pack.files.map(file => file.path);
  for (const file of ['index.js', 'lib/baseline/host.js', 'lib/read-page-native.js', 'dist/client.js',
    'CHANGELOG.md', 'THIRD_PARTY_NOTICES.md', 'LICENSE', 'fonts/inter-latin-wght-normal.woff2']) {
    assert.ok(files.includes(file), `Missing ${file}`);
  }
  assert.equal(files.some(file => /^(modules|test|deployment-backups)\//.test(file)), false);
  assert.equal(files.includes('client-bundle.js'), false);
  assert.equal(files.includes('package-lock.json'), false);
});
