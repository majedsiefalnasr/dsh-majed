import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
const env = { ...process.env, npm_config_cache: '/tmp/npm-cache-majed' };
test('packed package declares disabled component and resolves every component artifact', async () => {
  const [pack] = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json'], { env, encoding: 'utf8' }));
  const paths = new Set(pack.files.map(file => file.path));
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));
  const patch = await readFile(new URL('../cordis.patch.yml', import.meta.url), 'utf8');
  assert.match(patch, /id: majed\s+name: 'dsh-majed'/);
  assert.match(patch, /id: majed-subscriptions\s+name: 'dsh-majed\/subscriptions'\s+disabled: true/);
  for (const key of ['./subscriptions', './subscriptions/icon', './client']) assert.ok(paths.has(pkg.exports[key].slice(2)), key);
  for (const lang of ['en', 'ar']) {
    const path = pkg.exports['./subscriptions/locale/*.json'].replace('*', lang).slice(2);
    assert.ok(paths.has(path));
    const { meta } = JSON.parse(await readFile(new URL('../' + path, import.meta.url)));
    assert.ok(meta.title); assert.ok(meta.description);
  }
  assert.ok(paths.has('dist/subscriptions.js')); assert.ok(paths.has('dist/client.js'));
  assert.equal(pkg.scripts.prepare, undefined);
});
test('committed build artifacts match a fresh build', () => {
  execFileSync('npm', ['run', 'check:build'], { env, stdio: 'pipe' });
});
