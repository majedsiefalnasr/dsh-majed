import { execFileSync, spawnSync } from 'node:child_process';
import { lstatSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Include new owned files in the configured quality scope; ignored and private paths stay excluded.
const root = fileURLToPath(new URL('../', import.meta.url));
const files = execFileSync(
  'git',
  [
    'ls-files',
    '-z',
    '--cached',
    '--others',
    '--exclude-standard',
    '--',
    'src',
    'scripts',
    'test',
    'locale',
    'subscriptions/locale',
    '.github/workflows',
    'cordis.patch.yml',
    'index.js',
    'client.js',
    'tsdown.config.ts',
    'package.json',
    'tsconfig*.json',
    'biome.json',
    ':!scripts/unified-138.bundle.css',
    ':!scripts/unified-138.bundle.js',
    ':!scripts/check-unified-dom-138.mjs',
    ':!scripts/serve-unified-dom-138.mjs',
    ':!scripts/unified-subscriptions-dom-138.tsx',
    ':!test/unified-host-flow-138.candidate.mjs',
  ],
  {
    cwd: root,
    encoding: 'utf8',
  },
)
  .split('\0')
  .filter(Boolean)
  .filter(
    (name) =>
      !name
        .split('/')
        .some(
          (part) =>
            /^(?:\.|private|vendor|fixtures?(?:[.-]|$)|__fixtures__|node_modules)/i.test(
              part,
            ) && !['.github', '.githooks', '.gitignore'].includes(part),
        ),
  )
  .filter((name) => {
    try {
      return lstatSync(join(root, name)).isFile();
    } catch (error) {
      if (error.code === 'ENOENT') return false;
      throw error;
    }
  });
const yamlFiles = files.filter((name) => /\.ya?ml$/.test(name));
const biomeFiles = files.filter((name) => !/\.ya?ml$/.test(name));
const mode = process.argv[2];
if (!['format', 'format:check', 'lint'].includes(mode))
  throw new Error('Unknown quality command');
const args =
  mode === 'lint'
    ? ['lint', '--error-on-warnings']
    : ['format', ...(mode === 'format' ? ['--write'] : [])];
if (biomeFiles.length)
  execFileSync(
    process.execPath,
    [
      fileURLToPath(
        new URL('../node_modules/@biomejs/biome/bin/biome', import.meta.url),
      ),
      ...args,
      '--files-ignore-unknown=true',
      ...biomeFiles,
    ],
    { cwd: root, stdio: 'inherit' },
  );
if (mode === 'lint') {
  const workflows = yamlFiles.filter((name) =>
    name.startsWith('.github/workflows/'),
  );
  if (workflows.length) {
    const result = spawnSync('actionlint', ['-color', ...workflows], {
      cwd: root,
      stdio: 'inherit',
    });
    if (result.error?.code === 'ENOENT' && !process.env.CI) {
      console.warn(
        'Workflow lint skipped: actionlint is not installed (required in CI).',
      );
    } else if (result.error) {
      throw result.error;
    } else if (result.status !== 0) {
      throw new Error(
        `Workflow lint failed (actionlint exit ${result.status}).`,
      );
    }
  }
}
if (mode !== 'lint' && yamlFiles.length) {
  execFileSync(
    process.execPath,
    [
      fileURLToPath(
        new URL('../node_modules/prettier/bin/prettier.cjs', import.meta.url),
      ),
      '--single-quote',
      mode === 'format' ? '--write' : '--check',
      ...yamlFiles,
    ],
    { cwd: root, stdio: 'inherit' },
  );
}
