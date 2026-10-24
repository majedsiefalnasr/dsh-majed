// Opt-in carrier effects proof: isolated environment, bounded execution, no skip.
import assert from 'node:assert/strict';
import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const { DSH_PROBE_NODE: executable, DSH_PROBE_RUNTIME: runtime, DSH_PROBE_REMOTE: remote, DSH_MOUNTED_DEPS: dependencies } = process.env;
assert.ok(executable && runtime && remote && dependencies, 'Set DSH_PROBE_NODE, DSH_PROBE_RUNTIME, DSH_PROBE_REMOTE and DSH_MOUNTED_DEPS.');
const flags = process.argv.slice(2);
assert.ok(flags.every(x => ['--red-result', '--red-watch'].includes(x)));
const parent = realpathSync(tmpdir());
const home = realpathSync(mkdtempSync(join(parent, 'dsh-carrier-effects-')));
try {
  const result = spawnSync(executable, [fileURLToPath(new URL('./probe-management-carrier-effects.cjs', import.meta.url)), runtime, resolve(dependencies), remote, ...flags], {
    cwd: home, env: { HOME: home, DSH_HOME: home, TMPDIR: home, ELECTRON_RUN_AS_NODE: '1', DSH_CARRIER_EFFECTS_PROBE: '1' },
    encoding: 'utf8', timeout: 45000, maxBuffer: 1024 * 1024,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  assert.equal(result.signal, null);
  assert.equal(result.status, 0, 'Carrier effects proof failed; no acceptance claim.');
  const report = JSON.parse(result.stdout);
  assert.equal(report.checkpoint, 'complete');
  assert.equal(report.operations, 4);
  assert.equal(report.skillWrites, 2);
  assert.equal(report.mcpCalls, 2);
  assert.ok(report.children >= 2 && report.children <= 4);
  assert.equal(report.closedChildren, report.children);
  assert.equal(report.watchersClosed, report.watchers);
  assert.ok(report.watchers > 0);
  assert.equal(report.listeners, 2);
  assert.equal(report.closedListeners, 2);
  assert.deepEqual(report.statuses, [401, 403, 403, 401, 404, 200, 200, 200, 200]);
  assert.equal(report.proxyCalls, 4);
  
  assert.deepEqual(report.physical, ['/api/fixture/read', ...Array(4).fill('/remote/api/fixture/read'), '/api/fixture/read', '/api/fixture/read', '/remote/api/fixture/read', '/remote/api/fixture/read']);
  assert.match(report.hashes['dsh-client-connection'], /^[a-f0-9]{64}$/);
} finally {
  assert.equal(dirname(realpathSync(home)), parent);
  assert.ok(basename(home).startsWith('dsh-carrier-effects-'));
  rmSync(home, { recursive: true, force: true });
}
