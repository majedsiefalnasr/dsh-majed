// Opt-in mounted proof: no inherited operational environment and no missing-runtime skip.
import assert from 'node:assert/strict';
import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const { DSH_PROBE_NODE: executable, DSH_PROBE_RUNTIME: runtime, DSH_MOUNTED_DEPS: dependencies } = process.env;
assert.ok(executable && runtime && dependencies, 'Set DSH_PROBE_NODE, DSH_PROBE_RUNTIME and DSH_MOUNTED_DEPS (node_modules directory).');
const flags = process.argv.slice(2);
assert.ok(flags.every(x => ['--red-selection', '--red-disposal'].includes(x)), 'Unknown control.');
const parent = realpathSync(tmpdir());
const home = realpathSync(mkdtempSync(join(parent, 'dsh-mounted-settings-')));
try {
  const result = spawnSync(executable, [fileURLToPath(new URL('./probe-management-mounted-settings.cjs', import.meta.url)), runtime, resolve(dependencies), ...flags], {
    cwd: home, env: { HOME: home, DSH_HOME: home, TMPDIR: home, ELECTRON_RUN_AS_NODE: '1', DSH_MOUNTED_SETTINGS_PROBE: '1' },
    encoding: 'utf8', timeout: 20000, maxBuffer: 1024 * 1024,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  assert.equal(result.signal, null);
  assert.equal(result.status, 0, 'Mounted Settings proof failed; no acceptance claim.');
} finally {
  assert.equal(dirname(realpathSync(home)), parent);
  assert.ok(basename(home).startsWith('dsh-mounted-settings-'));
  rmSync(home, { recursive: true, force: true });
}
