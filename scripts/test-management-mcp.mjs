// Explicit exact-host proof: missing runtime is a failure, never a skip.
import assert from 'node:assert/strict';
import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const executable = process.env.DSH_PROBE_NODE;
const runtime = process.env.DSH_PROBE_RUNTIME;
assert.ok(executable && runtime, 'Set DSH_PROBE_NODE and DSH_PROBE_RUNTIME; ASAR-aware Electron is required.');
const flags = process.argv.slice(2);
assert.ok(flags.every(flag => flag === '--red-result'), 'Unknown sensitivity control.');
const root = fileURLToPath(new URL('../', import.meta.url));
const parent = realpathSync(tmpdir());
const home = realpathSync(mkdtempSync(join(parent, 'dsh-management-mcp-')));
try {
  const result = spawnSync(executable, [join(root, 'scripts/probe-management-mcp.cjs'), runtime, ...flags], {
    cwd: home, env: { HOME: home, DSH_HOME: home, TMPDIR: home,
      PATH: '/usr/bin:/bin', ELECTRON_RUN_AS_NODE: '1', DSH_MANAGEMENT_MCP_PROBE: '1' },
    encoding: 'utf8', timeout: 25000, maxBuffer: 1024 * 1024,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  assert.equal(result.signal, null);
  assert.equal(result.status, 0, 'MCP proof failed; no acceptance claim.');
} finally {
  assert.equal(realpathSync(home), home);
  assert.equal(dirname(home), parent);
  assert.ok(basename(home).startsWith('dsh-management-mcp-'));
  rmSync(home, { recursive: true, force: true });
}
