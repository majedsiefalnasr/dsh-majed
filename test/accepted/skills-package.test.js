import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, symlink, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Approved management seam: production route + real core + disposable storage.
// This portable fixture does not substitute for native Owner/remote admission.
test('enabled Skills basic workflows load from the packaged runtime without standalone modules', async t => {
  const directory = await realpath(await mkdtemp(join(tmpdir(), 'dsh-skills-package-')));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const [pack] = JSON.parse(execFileSync('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', directory,
    '--cache', '.npm-pack-cache', '--logs-dir', '.npm-pack-cache/_logs'], { cwd: root, encoding: 'utf8' }));
  execFileSync('tar', ['-xzf', join(directory, pack.filename), '-C', directory]);
  // Use the installed locked dependencies while executing only extracted source.
  await symlink(join(root, 'node_modules'), join(directory, 'package/node_modules'), 'dir');
  const fixture = fileURLToPath(new URL('./helpers/skills-basic-fixture.mjs', import.meta.url));
  const child = spawnSync(process.execPath, [fixture, join(directory, 'package')], {
    cwd: directory, env: { PATH: process.env.PATH || '', HOME: directory, DSH_HOME: directory },
    encoding: 'utf8', timeout: 30000,
  });
  assert.equal(child.error, undefined);
  assert.equal(child.status, 0, `${child.stdout}\n${child.stderr}`);
  assert.match(child.stdout, /PASS basic Skills/);
  const cold = spawnSync(process.execPath, [fixture, join(directory, 'package'), 'read'], {
    cwd: directory, env: { PATH: process.env.PATH || '', HOME: directory, DSH_HOME: directory },
    encoding: 'utf8', timeout: 30000,
  });
  assert.equal(cold.error, undefined);
  assert.equal(cold.status, 0, `${cold.stdout}\n${cold.stderr}`);
  assert.match(cold.stdout, /PASS cold Skills policy reload/);
});
