// Opt-in integrated remote/native/scope proof. Missing pointers fail, never skip.
import assert from 'node:assert/strict';
import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const { DSH_PROBE_NODE: executable, DSH_PROBE_RUNTIME: runtime, DSH_PROBE_REMOTE: remote } = process.env;
assert.ok(executable && runtime && remote, 'Set DSH_PROBE_NODE, DSH_PROBE_RUNTIME and DSH_PROBE_REMOTE.');
const flags = process.argv.slice(2);
assert.ok(flags.every(flag => flag === '--red-membership'), 'Only --red-membership is supported.');
const root = fileURLToPath(new URL('../', import.meta.url));
const parent = realpathSync(tmpdir());
const temporary = realpathSync(mkdtempSync(join(parent, 'dsh-management-scoped-remote-')));
try {
  const result = spawnSync(executable, [join(root, 'scripts/probe-management-scoped-remote.cjs'), runtime, remote, ...flags], {
    cwd: temporary, env: { PATH: process.env.PATH || '', HOME: temporary, DSH_HOME: temporary,
      TMPDIR: temporary, ELECTRON_RUN_AS_NODE: '1', DSH_MANAGEMENT_SCOPED_REMOTE_PROBE: '1' },
    encoding: 'utf8', timeout: 30000, maxBuffer: 2 * 1024 * 1024,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  assert.equal(result.signal, null, 'Scoped remote probe terminated by signal.');
  assert.equal(result.status, 0, 'Scoped remote probe failed; no acceptance claim is permitted.');
  const report = JSON.parse(result.stdout);
  assert.equal(report.checks.length, 5, 'Completed proof report required.');
  assert.equal(report.checkpoint, 'completed');
  assert.deepEqual(report.counts, { proxyCalls: 11, innerCalls: 11, resolutions: 8,
    operations: 2, invalidations: 1, closes: 1 });
} finally {
  assert.equal(dirname(realpathSync(temporary)), parent);
  assert.ok(basename(temporary).startsWith('dsh-management-scoped-remote-'));
  rmSync(temporary, { recursive: true, force: true });
}
