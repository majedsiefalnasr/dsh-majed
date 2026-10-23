// Opt-in bounded carrier composition. Missing runtime/module is failure, never skip.
import assert from 'node:assert/strict';
import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const executable = process.env.DSH_PROBE_NODE;
const runtime = process.env.DSH_PROBE_RUNTIME;
const remote = process.env.DSH_PROBE_REMOTE;
assert.ok(executable && runtime && remote, 'Set DSH_PROBE_NODE, DSH_PROBE_RUNTIME and DSH_PROBE_REMOTE (remote-api.js).');
const flags = process.argv.slice(2);
assert.ok(flags.every(flag => ['--red-pairing', '--red-content-type'].includes(flag)),
  'Only fixture pairing-fact and forwarded-header negative controls are accepted.');
const root = fileURLToPath(new URL('../', import.meta.url));
const temporaryParent = realpathSync(tmpdir());
const temporary = realpathSync(mkdtempSync(join(temporaryParent, 'dsh-management-remote-')));
try {
  const result = spawnSync(executable, [join(root, 'scripts/probe-management-remote.cjs'), runtime, remote, ...flags], {
    cwd: temporary,
    env: { PATH: process.env.PATH || '', HOME: temporary, DSH_HOME: temporary,
      TMPDIR: temporary, ELECTRON_RUN_AS_NODE: '1', DSH_MANAGEMENT_REMOTE_PROBE: '1' },
    encoding: 'utf8', timeout: 30000, maxBuffer: 2 * 1024 * 1024,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  assert.equal(result.signal, null, 'Remote probe terminated by signal.');
  assert.equal(result.status, 0, 'Remote probe failed; no acceptance claim is permitted.');
  const report = JSON.parse(result.stdout);
  assert.equal(report.checks.length, 6, 'A clean exit without the completed proof is not success.');
  assert.deepEqual(report.counts, { proxyCalls: 6, innerCalls: 6, operations: 2, invalidations: 1 });
} finally {
  assert.equal(dirname(realpathSync(temporary)), temporaryParent);
  assert.ok(basename(temporary).startsWith('dsh-management-remote-'));
  rmSync(temporary, { recursive: true, force: true });
}
