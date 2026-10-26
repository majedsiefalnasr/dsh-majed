import assert from 'node:assert/strict';
import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const { DSH_PROBE_NODE: executable, DSH_PROBE_RUNTIME: runtime, DSH_PROBE_REMOTE: remote } = process.env;
assert.ok(executable && runtime && remote, 'Set DSH_PROBE_NODE, DSH_PROBE_RUNTIME and DSH_PROBE_REMOTE source paths.');
const flags = process.argv.slice(2);
assert.ok(flags.every(flag => ['--red-auth', '--red-watch'].includes(flag)));
const home = realpathSync(mkdtempSync(join(tmpdir(), 'dsh-hook-approval-')));
try {
  const result = spawnSync(executable, [fileURLToPath(new URL('probe-hooks-approval.cjs', import.meta.url)), runtime, remote, ...flags], {
    cwd: home, env: { HOME: home, DSH_HOME: home, TMPDIR: home, ELECTRON_RUN_AS_NODE: '1', DSH_HOOK_APPROVAL_PROBE: '1' },
    encoding: 'utf8', timeout: 30000, maxBuffer: 1024 * 1024,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  assert.equal(result.status, 0, 'Command Approval proof failed.');
} finally { rmSync(home, { recursive: true, force: true }); }
