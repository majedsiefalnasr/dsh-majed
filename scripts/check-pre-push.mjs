import { execFileSync, spawnSync } from 'node:child_process';
import {
  copyFileSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const env = { ...process.env };
// A hook may inherit Git's alternate index/worktree settings. Never reuse them.
for (const key of execFileSync('git', ['rev-parse', '--local-env-vars'], {
  cwd: root,
  encoding: 'utf8',
})
  .trim()
  .split('\n'))
  delete env[key];
const files = execFileSync('git', ['ls-files', '-z', '--cached'], {
  cwd: root,
  env,
  encoding: 'utf8',
})
  .split('\0')
  .filter(
    (name) =>
      /^(src|scripts|test|locale|subscriptions\/locale|dist|fonts|docs|\.github|\.githooks)\//.test(
        name,
      ) ||
      /^(package(-lock)?\.json|tsconfig[^/]*\.json|tsdown\.config\.ts|biome\.json|index\.js|client\.js|cordis\.patch\.yml|icon\.svg|[A-Z][A-Z_]*\.md|LICENSE|\.gitignore)$/.test(
        name,
      ),
  )
  .filter(
    (name) =>
      !/(^|\/)(\.private[^/]*|\.local[^/]*|\.env[^/]*|node_modules)(\/|$)/.test(
        name,
      ) &&
      ![
        'scripts/unified-138.bundle.css',
        'scripts/unified-138.bundle.js',
        'scripts/check-unified-dom-138.mjs',
        'scripts/serve-unified-dom-138.mjs',
        'scripts/unified-subscriptions-dom-138.tsx',
        'test/unified-host-flow-138.candidate.mjs',
      ].includes(name),
  );
const temp = mkdtempSync(join(tmpdir(), 'waycraft-pre-push-'));
try {
  for (const name of files) {
    const source = join(root, name);
    let stat;
    try {
      stat = lstatSync(source);
    } catch (error) {
      if (error.code === 'ENOENT') continue; // A tracked working-tree deletion.
      throw error;
    }
    for (
      let parent = dirname(source);
      parent !== dirname(root);
      parent = dirname(parent)
    ) {
      if (lstatSync(parent).isSymbolicLink())
        throw new Error(`Pre-push snapshot refuses a symlink parent: ${name}`);
      if (parent === root.replace(/\/$/, '')) break;
    }
    if (!stat.isFile())
      throw new Error(`Pre-push snapshot requires a regular file: ${name}`);
    mkdirSync(dirname(join(temp, name)), { recursive: true });
    copyFileSync(source, join(temp, name));
  }
  // Quality discovery needs a repository, but not the original Git metadata.
  execFileSync('git', ['init', '--quiet', temp], { env });
  execFileSync('git', ['add', '--all', '--force'], { cwd: temp, env });
  symlinkSync(join(root, 'node_modules'), join(temp, 'node_modules'), 'dir');
  const result = spawnSync('npm', ['run', 'ci'], {
    cwd: temp,
    env,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(temp, { recursive: true, force: true });
}
