import { execFileSync } from 'node:child_process';
import { mkdtempSync, realpathSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root =
  process.env.WAYCRAFT_QUALITY_ROOT ||
  fileURLToPath(new URL('../', import.meta.url));
const snapshot = realpathSync(mkdtempSync(join(tmpdir(), 'waycraft-staged-')));
try {
  // Get staged files only, restricted to owned paths with exclusions matching quality.mjs
  const ownedPaths = [
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
  ];
  const excludedPaths = [
    ':!scripts/unified-138.bundle.css',
    ':!scripts/unified-138.bundle.js',
    ':!scripts/check-unified-dom-138.mjs',
    ':!scripts/serve-unified-dom-138.mjs',
    ':!scripts/unified-subscriptions-dom-138.tsx',
    ':!test/unified-host-flow-138.candidate.mjs',
  ];
  const staged = execFileSync(
    'git',
    [
      'diff',
      '--staged',
      '--name-only',
      '--diff-filter=ACMR',
      '-z',
      '--',
      ...ownedPaths,
      ...excludedPaths,
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
    );
  if (staged.length === 0) {
    console.log('No staged owned files to check.');
    process.exit(0);
  }
  execFileSync(
    'git',
    ['checkout-index', '-z', '--stdin', '--prefix', `${snapshot}/`],
    {
      cwd: root,
      stdio: ['pipe', 'inherit', 'inherit'],
      input: [...new Set([...staged, 'biome.json'])].join('\0') + '\0',
    },
  );
  symlinkSync(
    resolve(root, 'node_modules'),
    join(snapshot, 'node_modules'),
    'dir',
  );
  const yamlFiles = staged.filter(
    (name) =>
      name === 'cordis.patch.yml' ||
      /^\.github\/workflows\/.*\.ya?ml$/.test(name),
  );
  const biomeFiles = staged.filter((name) => !/\.ya?ml$/.test(name));
  const biome = join(root, 'node_modules/@biomejs/biome/bin/biome');
  const biomeConfig = join(snapshot, 'biome.json');
  if (biomeFiles.length) {
    for (const command of [
      ['format', '--config-path', biomeConfig],
      ['lint', '--config-path', biomeConfig, '--error-on-warnings'],
    ]) {
      execFileSync(process.execPath, [biome, ...command, ...biomeFiles], {
        cwd: snapshot,
        stdio: 'inherit',
      });
    }
  }
  if (yamlFiles.length) {
    execFileSync(
      process.execPath,
      [
        join(root, 'node_modules/prettier/bin/prettier.cjs'),
        '--single-quote',
        '--check',
        ...yamlFiles,
      ],
      { cwd: snapshot, stdio: 'inherit' },
    );
  }
} finally {
  rmSync(snapshot, { recursive: true, force: true });
}
