import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const tests = [
  'test/appearance-contract.test.js',
  'test/classify.test.cjs',
  'test/read-page-native.test.js',
  'test/baseline-host.test.js',
];
// All accepted suites run automatically; historical prototype suites remain untouched.
async function discover(directory) {
  const entries = await readdir(new URL(directory, root), { withFileTypes: true });
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) await discover(path);
    else if (/\.test\.(js|cjs|mjs)$/.test(entry.name)) tests.push(path);
  }
}
await discover('test/accepted');
const result = spawnSync(process.execPath, ['--test', ...tests], {
  cwd: fileURLToPath(root), stdio: 'inherit',
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
