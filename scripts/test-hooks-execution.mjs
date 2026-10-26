import assert from 'node:assert/strict';
import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
assert(process.env.DSH_PROBE_NODE && process.env.DSH_PROBE_RUNTIME, 'Set exact native DSH executable/runtime');
const temporary = realpathSync(mkdtempSync(join(tmpdir(), 'dsh-hook-execution-')));
try {
  const result = spawnSync(process.env.DSH_PROBE_NODE, [fileURLToPath(new URL('./probe-hooks-execution.cjs', import.meta.url)), process.env.DSH_PROBE_RUNTIME], {
    cwd: temporary, env: { PATH: process.env.PATH || '', HOME: temporary, DSH_HOME: temporary, TMPDIR: temporary, ELECTRON_RUN_AS_NODE: '1' }, encoding: 'utf8', timeout: 30000, maxBuffer: 2 * 1024 * 1024,
  });
  process.stdout.write(result.stdout || ''); process.stderr.write(result.stderr || '');
  if (result.error) throw result.error;
  assert.equal(result.signal, null); assert.equal(result.status, 0, 'Native execution criterion failed');
} finally { rmSync(temporary, { recursive: true, force: true }); }
