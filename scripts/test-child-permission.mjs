// Explicit opt-in exact-host permission probe: missing host is failure, never a skip.
import assert from 'node:assert/strict';
import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const executable = process.env.DSH_PROBE_NODE;
const runtime = process.env.DSH_PROBE_RUNTIME;
assert.ok(executable && runtime, 'Set DSH_PROBE_NODE and DSH_PROBE_RUNTIME for the exact-host probe');
const flags = process.argv.slice(2);
assert.ok(flags.every(flag => flag === '--red-late-approval'), 'Only the named negative control is supported');
const temporary = realpathSync(mkdtempSync(join(tmpdir(), 'dsh-child-permission-')));
try {
  const result = spawnSync(executable, [fileURLToPath(new URL('./probe-child-permission.cjs', import.meta.url)), runtime, ...flags], {
    cwd: temporary,
    env: { PATH: process.env.PATH || '', HOME: temporary, DSH_HOME: temporary, TMPDIR: temporary, ELECTRON_RUN_AS_NODE: '1' },
    encoding: 'utf8', timeout: 30000, maxBuffer: 2 * 1024 * 1024,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  assert.equal(result.signal, null, 'Permission probe must not terminate by signal');
  assert.equal(result.status, 0, 'T02D permission probe failed; gate is not accepted');
} finally {
  assert.ok(temporary.startsWith(realpathSync(tmpdir()) + '/dsh-child-permission-'));
  rmSync(temporary, { recursive: true, force: true });
}
