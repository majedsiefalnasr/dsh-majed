// Explicit opt-in convenience runner, not a production feature or full T02A acceptance.
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const runners = ['admission', 'skills', 'settings', 'mcp', 'composition', 'remote'];
const outputLimit = 3 * 1024 * 1024;

function forward(output, write) {
  if (!output) return;
  const bytes = Buffer.from(output);
  write(bytes.subarray(0, outputLimit).toString('utf8'));
  if (bytes.length > outputLimit) write('\n[output truncated]\n');
}

// The spawn boundary is explicit so portable tests never need an installed host.
export function runManagementSuite({
  args = process.argv.slice(2), env = process.env, spawn = spawnSync,
  stdout = text => process.stdout.write(text), stderr = text => process.stderr.write(text),
} = {}) {
  if (args.length) {
    stderr('No arguments are accepted; invoke this opt-in suite without flags.\n');
    return 1;
  }
  const missing = ['DSH_PROBE_NODE', 'DSH_PROBE_RUNTIME', 'DSH_PROBE_REMOTE']
    .filter(name => typeof env[name] !== 'string' || !env[name].trim());
  if (missing.length) {
    stderr(`Missing required environment: ${missing.join(', ')}. No runners started.\n`);
    return 1;
  }
  const outcomes = new Map(runners.map(name => [name, 'NOT RUN']));
  let exitCode = 0;
  for (const name of runners) {
    let result;
    try {
      result = spawn(process.execPath, [fileURLToPath(new URL(`./test-management-${name}.mjs`, import.meta.url))], {
        env, shell: false, encoding: 'utf8', timeout: 45000,
        maxBuffer: outputLimit, killSignal: 'SIGKILL',
      });
    } catch (error) {
      result = { error };
    }
    forward(result.stdout, stdout);
    forward(result.stderr, stderr);
    if (result.error || result.signal || result.status !== 0) {
      outcomes.set(name, 'FAIL');
      // Codes/signals are bounded; avoid leaking arbitrary spawn-error details.
      const reason = result.error ? `spawn error ${String(result.error.code || 'UNKNOWN').slice(0, 64)}`
        : result.signal ? `signal ${String(result.signal).slice(0, 64)}` : `exit ${result.status}`;
      stderr(`${name}: ${reason}\n`);
      exitCode = 1;
      break;
    }
    outcomes.set(name, 'PASS');
  }
  stdout(`Management suite: ${exitCode ? 'FAIL' : 'PASS'}\n${runners.map(name => `${name}: ${outcomes.get(name)}`).join('\n')}\n`);
  stdout('Bounded runner evidence only; not full T02A acceptance.\n');
  return exitCode;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = runManagementSuite();
}
