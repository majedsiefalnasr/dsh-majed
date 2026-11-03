import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

test('browser factory registers the public package identity before activation', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));
  for (const entry of ['client.js', pkg.exports['./client']]) {
    const registrations = [];
    vm.runInNewContext(await readFile(new URL('../' + entry, import.meta.url), 'utf8'), {
      window: { __ModuleLoader__: { load(module) { registrations.push(module); } } },
    });
    assert.equal(registrations.length, 1, entry);
    assert.equal(registrations[0].id, pkg.name, entry);
    assert.equal(typeof registrations[0].factory, 'function');
  }
});
const env = { ...process.env, npm_config_cache: '/tmp/npm-cache-majed' };
test('packed package declares disabled component and resolves every component artifact', async () => {
  const [pack] = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json'], { env, encoding: 'utf8' }));
  const paths = new Set(pack.files.map(file => file.path));
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));
  const patch = await readFile(new URL('../cordis.patch.yml', import.meta.url), 'utf8');
  assert.equal(pkg.name, 'dsh-waycraft');
  assert.match(patch, /id: majed\s+name: 'dsh-waycraft'/);
  assert.match(patch, /id: majed-subscriptions\s+name: 'dsh-waycraft\/subscriptions'\s+disabled: true/);
  for (const lang of ['en', 'ar']) {
    const { meta } = JSON.parse(await readFile(new URL(`../locale/${lang}.json`, import.meta.url)));
    assert.equal(meta.title, 'Waycraft for DSH');
    assert.doesNotMatch(meta.description, /Majed/);
  }
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
