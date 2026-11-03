import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Only tracked paths: never inspect or rewrite private local fixtures.
const root = fileURLToPath(new URL('../', import.meta.url));
const files = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
  .split('\0')
  .filter(Boolean);
const mode = process.argv[2];
if (!['format', 'format:check', 'lint'].includes(mode)) throw new Error('Unknown quality command');
const args = mode === 'lint' ? ['lint', '--error-on-warnings'] : ['format', ...(mode === 'format' ? ['--write'] : [])];
execFileSync(process.execPath, [fileURLToPath(new URL('../node_modules/@biomejs/biome/bin/biome', import.meta.url)), ...args, '--files-ignore-unknown=true', ...files], { cwd: root, stdio: 'inherit' });
