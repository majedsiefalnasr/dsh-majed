// Opt-in physical carrier proof: isolated environment, bounded execution, no skip.
import assert from 'node:assert/strict';
import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const { DSH_PROBE_NODE: executable, DSH_PROBE_RUNTIME: runtime, DSH_PROBE_REMOTE: remote, DSH_MOUNTED_DEPS: dependencies } = process.env;
assert.ok(executable && runtime && remote && dependencies, 'Set DSH_PROBE_NODE, DSH_PROBE_RUNTIME, DSH_PROBE_REMOTE and DSH_MOUNTED_DEPS.');
const flags = process.argv.slice(2);
assert.ok(flags.every(x => ['--red-result', '--red-correlation', '--red-membership'].includes(x)));
const parent = realpathSync(tmpdir());
const home = realpathSync(mkdtempSync(join(parent, 'dsh-physical-carrier-')));
try {
  const result = spawnSync(executable, [fileURLToPath(new URL('./probe-management-physical-carrier.cjs', import.meta.url)), runtime, resolve(dependencies), remote, ...flags], {
    cwd: home, env: { HOME: home, DSH_HOME: home, TMPDIR: home, ELECTRON_RUN_AS_NODE: '1', DSH_PHYSICAL_CARRIER_PROBE: '1' },
    encoding: 'utf8', timeout: 30000, maxBuffer: 1024 * 1024,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  assert.equal(result.signal, null);
  assert.equal(result.status, 0, 'Physical carrier proof failed; no acceptance claim.');
  const report = JSON.parse(result.stdout);
  assert.equal(report.checkpoint, 'complete');
  assert.equal(report.operations, 2);
  assert.equal(report.listeners, 2);
  assert.equal(report.closedListeners, 2);
  assert.deepEqual(report.statuses, [200, 200, 401, 403, 403, 401, 404]);
  assert.equal(report.proxyCalls, 3);
  assert.equal(report.checks.length, 4);
  assert.deepEqual(report.physical, ['/api/fixture/read', '/remote/api/fixture/read', '/api/fixture/read', ...Array(4).fill('/remote/api/fixture/read')]);
  assert.match(report.hashes['dsh-client-connection'], /^[a-f0-9]{64}$/);
} finally {
  assert.equal(dirname(realpathSync(home)), parent);
  assert.ok(basename(home).startsWith('dsh-physical-carrier-'));
  rmSync(home, { recursive: true, force: true });
}
