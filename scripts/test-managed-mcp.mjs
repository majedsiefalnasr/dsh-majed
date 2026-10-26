import assert from 'node:assert/strict';
import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const { DSH_PROBE_NODE: executable, DSH_PROBE_RUNTIME: runtime, DSH_PROBE_REMOTE: remote } = process.env;
assert.ok(executable && runtime && remote);
const home = realpathSync(mkdtempSync(join(tmpdir(), 'dsh-managed-mcp-')));
try {
  const result = spawnSync(executable, [fileURLToPath(new URL('probe-managed-mcp.cjs', import.meta.url)), runtime, remote], { cwd: home, env: { HOME: home, DSH_HOME: home, TMPDIR: home, ELECTRON_RUN_AS_NODE: '1', DSH_MANAGED_MCP_PROBE: '1' }, encoding: 'utf8', timeout: 45000, maxBuffer: 1024 * 1024 });
  if (result.stdout) process.stdout.write(result.stdout); if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error; assert.equal(result.status, 0, 'Native managed MCP proof failed.');
} finally { rmSync(home, { recursive: true, force: true }); }
