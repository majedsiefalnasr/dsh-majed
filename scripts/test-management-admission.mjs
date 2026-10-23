// Opt-in synthetic native-admission probe. No runtime means failure, never a passing skip.
import assert from 'node:assert/strict';
import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const executable = process.env.DSH_PROBE_NODE;
const runtime = process.env.DSH_PROBE_RUNTIME;
assert.ok(executable && runtime, 'Set DSH_PROBE_NODE to the ASAR-aware executable and DSH_PROBE_RUNTIME to the installed runtime directory.');
const flags = process.argv.slice(2);
assert.ok(flags.every(flag => ['--red-auth', '--red-dispatch'].includes(flag)), 'Only named negative controls are accepted.');
const root = fileURLToPath(new URL('../', import.meta.url));
const temporaryParent = realpathSync(tmpdir());
const temporary = realpathSync(mkdtempSync(join(temporaryParent, 'dsh-management-admission-')));
try {
  const result = spawnSync(executable, [join(root, 'scripts/probe-management-admission.cjs'), runtime, ...flags], {
    cwd: temporary,
    // Deliberately do not inherit credentials, provider variables, service origins or profile settings.
    env: { PATH: process.env.PATH || '', HOME: temporary, DSH_HOME: temporary,
      TMPDIR: temporary, ELECTRON_RUN_AS_NODE: '1', DSH_MANAGEMENT_ADMISSION_PROBE: '1' },
    encoding: 'utf8', timeout: 30000, maxBuffer: 2 * 1024 * 1024,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  assert.equal(result.signal, null, 'Admission probe terminated by signal.');
  assert.equal(result.status, 0, 'Admission probe failed; no acceptance claim is permitted.');
} finally {
  // Check the resolved, directly-created disposable root before recursive removal.
  assert.equal(dirname(realpathSync(temporary)), temporaryParent);
  assert.ok(basename(temporary).startsWith('dsh-management-admission-'));
  rmSync(temporary, { recursive: true, force: true });
}
