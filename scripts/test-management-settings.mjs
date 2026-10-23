// Opt-in only: no missing-runtime skip and no inherited operational environment.
import assert from 'node:assert/strict';
import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const executable = process.env.DSH_PROBE_NODE;
const runtime = process.env.DSH_PROBE_RUNTIME;
assert.ok(executable && runtime, 'Set DSH_PROBE_NODE and DSH_PROBE_RUNTIME.');
const flags = process.argv.slice(2);
assert.ok(flags.every(flag => ['--red-selection', '--red-disposal'].includes(flag)), 'Unknown control.');
const parent = realpathSync(tmpdir());
const temporary = realpathSync(mkdtempSync(join(parent, 'dsh-management-settings-')));
try {
  const result = spawnSync(executable, [fileURLToPath(new URL('./probe-management-settings.cjs', import.meta.url)), runtime, ...flags], {
    cwd: temporary, env: { HOME: temporary, DSH_HOME: temporary, TMPDIR: temporary, ELECTRON_RUN_AS_NODE: '1', DSH_MANAGEMENT_SETTINGS_PROBE: '1' },
    encoding: 'utf8', timeout: 15000, maxBuffer: 1024 * 1024,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  assert.equal(result.signal, null);
  assert.equal(result.status, 0, 'Settings proof failed; no acceptance claim.');
} finally {
  assert.equal(dirname(realpathSync(temporary)), parent);
  assert.ok(basename(temporary).startsWith('dsh-management-settings-'));
  rmSync(temporary, { recursive: true, force: true });
}
