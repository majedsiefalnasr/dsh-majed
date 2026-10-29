import { readdir, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const dir = new URL('../dist/', import.meta.url);
async function snapshot() {
  return Object.fromEntries(await Promise.all((await readdir(dir)).sort().map(async name => [name, (await readFile(new URL(name, dir))).toString('base64')])));
}
const before = await snapshot();
execFileSync('npm', ['run', 'build'], { stdio: 'inherit', env: { ...process.env, npm_config_cache: '/tmp/npm-cache-majed' } });
assert.deepEqual(await snapshot(), before, 'Committed output differs from a fresh build. Review and commit the rebuilt dist files.');
console.log('Committed output matches a fresh build.');
