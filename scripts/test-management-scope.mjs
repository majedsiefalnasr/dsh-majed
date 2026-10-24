// Opt-in isolated scope composition; absent runtime is a failure, never a passing skip.
import assert from 'node:assert/strict';
import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const executable = process.env.DSH_PROBE_NODE;
const runtime = process.env.DSH_PROBE_RUNTIME;
assert.ok(executable && runtime, 'Set DSH_PROBE_NODE and DSH_PROBE_RUNTIME to the ASAR-aware executable and installed runtime.');
const flags = process.argv.slice(2);
assert.ok(flags.every(flag => ['--red-membership', '--red-recheck'].includes(flag)), 'Unknown negative control.');
const root = fileURLToPath(new URL('../', import.meta.url));
const parent = realpathSync(tmpdir());
const temporary = realpathSync(mkdtempSync(join(parent, 'dsh-management-scope-')));
try {
  const result = spawnSync(executable, [join(root, 'scripts/probe-management-scope.cjs'), runtime, ...flags], {
    cwd: temporary,
    env: { PATH: process.env.PATH || '', HOME: temporary, DSH_HOME: temporary, TMPDIR: temporary,
      ELECTRON_RUN_AS_NODE: '1', DSH_MANAGEMENT_SCOPE_PROBE: '1' },
    encoding: 'utf8', timeout: 30000, maxBuffer: 2 * 1024 * 1024,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  assert.equal(result.signal, null, 'Scope probe terminated by signal.');
  assert.equal(result.status, 0, 'Scope probe failed; no acceptance claim is permitted.');
} finally {
  assert.equal(dirname(realpathSync(temporary)), parent);
  assert.ok(basename(temporary).startsWith('dsh-management-scope-'));
  rmSync(temporary, { recursive: true, force: true });
}
