// Explicit opt-in exact-host gate. Missing runtime is an error, never a passing skip.
import assert from 'node:assert/strict';
import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const executable = process.env.DSH_PROBE_NODE;
const runtime = process.env.DSH_PROBE_RUNTIME;
assert.ok(executable && runtime, 'Set DSH_PROBE_NODE to an ASAR-aware Node executable and DSH_PROBE_RUNTIME to the installed DSH directory.');
const root = fileURLToPath(new URL('../', import.meta.url));
const temporary = realpathSync(mkdtempSync(join(tmpdir(), 'dsh-auto-seams-')));
const scripts = ['probe-auto-client.cjs', 'probe-auto-host.cjs'];
try {
  for (const script of scripts) {
    const flags = script === 'probe-auto-host.cjs' ? process.argv.slice(2) : [];
    assert.ok(flags.every(flag => ['--red-control', '--red-concrete-route'].includes(flag)), 'Only named negative controls are accepted');
    const result = spawnSync(executable, [join(root, 'scripts', script), runtime, ...flags], {
      cwd: temporary,
      // Do not pass operational provider tokens, auth stores or DSH service origins.
      env: { PATH: process.env.PATH || '', HOME: temporary, DSH_HOME: temporary,
        TMPDIR: temporary, ELECTRON_RUN_AS_NODE: '1' },
      encoding: 'utf8', timeout: 30000, maxBuffer: 2 * 1024 * 1024,
    });
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    if (result.error) throw result.error;
    assert.equal(result.signal, null, `${script} terminated by signal`);
    assert.equal(result.status, 0, `${script} failed; exact-host gate is not accepted`);
  }
} finally {
  // Verify the exact generated disposable root before recursive removal.
  assert.ok(temporary.startsWith(realpathSync(tmpdir()) + '/dsh-auto-seams-'));
  rmSync(temporary, { recursive: true, force: true });
}
