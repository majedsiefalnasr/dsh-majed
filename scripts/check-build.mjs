import { execFileSync } from 'node:child_process';
import {
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rm,
  symlink,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const dir = new URL('../dist/', import.meta.url);
async function snapshot(dir) {
  return Object.fromEntries(
    await Promise.all(
      (await readdir(dir, { recursive: true, withFileTypes: true }))
        .filter((entry) => entry.isFile())
        .map((entry) =>
          relative(fileURLToPath(dir), join(entry.parentPath, entry.name)),
        )
        .sort()
        .map(async (name) => [
          name,
          (await readFile(new URL(name, dir))).toString('base64'),
        ]),
    ),
  );
}
const root = fileURLToPath(new URL('../', import.meta.url));
const before = await snapshot(dir);
const temp = await mkdtemp(join(tmpdir(), 'waycraft-check-build-'));
try {
  // Select before copying: never traverse untracked/private trees or follow symlinks.
  const tracked = execFileSync('git', ['ls-files', '--stage', '-z'], {
    cwd: root,
    encoding: 'utf8',
  });
  const fixedInputs = new Set([
    'package.json',
    'tsconfig.json',
    'tsdown.config.ts',
    'client.js',
    'scripts/assemble-client.mjs',
  ]);
  for (const entry of tracked.split('\0').filter(Boolean)) {
    const [metadata, name] = entry.split('\t');
    if (!/^100(?:644|755) [a-f0-9]+ 0$/.test(metadata)) continue;
    if (!fixedInputs.has(name) && !/^(src|locale)\//.test(name)) continue;
    if (
      name
        .split('/')
        .some((part) =>
          /^(?:\.|private|vendor|fixtures?(?:[.-]|$)|__fixtures__|node_modules)/i.test(
            part,
          ),
        )
    )
      continue;
    const source = join(root, name);
    // A tracked regular file can have been replaced by a symlink in the worktree.
    if ((await realpath(source)) !== join(await realpath(root), name)) {
      throw new Error(`Build input must not be a symlink: ${name}`);
    }
    await mkdir(dirname(join(temp, name)), { recursive: true });
    await cp(source, join(temp, name));
  }
  await symlink(join(root, 'node_modules'), join(temp, 'node_modules'), 'dir');
  // Ensure dist directory exists (clean start)
  await mkdir(join(temp, 'dist'), { recursive: true });
  // Start from a CLEAN dist directory, not the existing one, to detect orphan artifacts
  await execFileSync('npm', ['run', 'build'], {
    cwd: temp,
    stdio: 'inherit',
    env: { ...process.env, npm_config_cache: '/tmp/npm-cache-waycraft' },
  });
  const after = await snapshot(pathToFileURL(`${join(temp, 'dist')}/`));
  // Check for orphan artifacts FIRST: files in committed dist but not produced by fresh build
  const orphans = Object.keys(before).filter((name) => !after[name]);
  if (orphans.length) {
    throw new Error(
      `Committed dist contains orphan artifacts not produced by fresh build: ${orphans.join(', ')}`,
    );
  }
  const changed = [
    ...new Set([...Object.keys(before), ...Object.keys(after)]),
  ].filter((name) => before[name] !== after[name]);
  if (changed.length) {
    throw new Error(
      `Committed output differs from a fresh build. Review and commit the rebuilt dist files: ${changed.join(', ')}`,
    );
  }
  console.log('Committed output matches a fresh build with no orphans.');
} finally {
  await rm(temp, { recursive: true, force: true });
}
