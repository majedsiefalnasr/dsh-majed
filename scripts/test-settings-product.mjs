// Exact installed-host evidence, opt-in only; never launches the installed app UI.
import assert from 'node:assert/strict';
import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const flags = process.argv.slice(2);
assert.ok(flags.every(flag => ['--codex', '--codex-direct', '--approval', '--mcp', '--judgment'].includes(flag)), 'Unknown product proof option.');
assert.ok(flags.length <= 1, 'Run one feature scenario per invocation: --codex, --codex-direct, --approval, --mcp or --judgment.');
const { DSH_PROBE_NODE: executable, DSH_PROBE_RUNTIME: runtime, DSH_MOUNTED_DEPS: dependencies, DSH_PROBE_REMOTE: remote } = process.env;
assert.ok(executable && runtime && dependencies && remote, 'Set the four DSH_PROBE_NODE/RUNTIME/REMOTE and DSH_MOUNTED_DEPS paths.');
const parent = realpathSync(tmpdir()), home = realpathSync(mkdtempSync(join(parent, 'dsh-physical-carrier-')));
try {
  const result = spawnSync(executable, [fileURLToPath(new URL('./probe-settings-product.cjs', import.meta.url)), runtime, resolve(dependencies), remote, ...flags], {
    cwd: home, env: { HOME: home, DSH_HOME: home, TMPDIR: home, ELECTRON_RUN_AS_NODE: '1', DSH_PHYSICAL_CARRIER_PROBE: '1' },
    encoding: 'utf8', timeout: flags.includes('--mcp') ? 45000 : 25000, maxBuffer: 1024 * 1024,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  assert.equal(result.signal, null); assert.equal(result.status, 0, 'Product Settings proof failed.');
} finally {
  assert.equal(dirname(realpathSync(home)), parent); assert.ok(basename(home).startsWith('dsh-physical-carrier-'));
  rmSync(home, { recursive: true, force: true });
}
