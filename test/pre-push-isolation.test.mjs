import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

for (const status of [0, 23])
  test(`pre-push isolates tracked working files and cleans up after CI exit ${status}`, () => {
    const root = mkdtempSync(join(tmpdir(), 'pre-push-test-'));
    try {
      for (const name of [
        'scripts',
        'src',
        'dist',
        'bin',
        'node_modules',
        '.private',
      ])
        mkdirSync(join(root, name));
      copyFileSync(
        fileURLToPath(
          new URL('../scripts/check-pre-push.mjs', import.meta.url),
        ),
        join(root, 'scripts/check-pre-push.mjs'),
      );
      writeFileSync(join(root, 'src/input.js'), 'staged');
      writeFileSync(join(root, 'dist/output.js'), 'original');
      writeFileSync(join(root, '.private/secret'), 'do not copy');
      const excluded = [
        'src/private',
        'src/vendor',
        'src/fixtures',
        'src/fixture-data',
        'src/__fixtures__',
        'src/.hidden',
        'src/PRIVATE',
      ];
      for (const name of [...excluded, '.github/workflows', '.githooks']) {
        mkdirSync(join(root, name), { recursive: true });
        writeFileSync(join(root, name, 'sentinel'), 'synthetic');
      }
      execFileSync('git', ['init', '--quiet', root]);
      execFileSync('git', ['add', '--force', '.'], { cwd: root });
      writeFileSync(join(root, 'src/input.js'), 'working');
      writeFileSync(join(root, 'src/untracked.js'), 'do not copy');
      const report = join(root, 'report');
      writeFileSync(
        join(root, 'bin/npm'),
        `#!${process.execPath}\nconst fs = require('node:fs');\nconst cp = require('node:child_process');\nrequire('node:assert/strict').deepEqual(process.argv.slice(2), ['run', 'ci']);\nrequire('node:assert/strict').equal(fs.readFileSync('src/input.js', 'utf8'), 'working');\nfor (const name of ${JSON.stringify(['src/untracked.js', '.private/secret', ...excluded])}) require('node:assert/strict').equal(fs.existsSync(name), false);\nrequire('node:assert/strict').match(cp.execFileSync('git', ['ls-files'], {encoding:'utf8'}), /src\\/input.js/);\nfor (const name of ['.github/workflows/sentinel', '.githooks/sentinel']) require('node:assert/strict').equal(fs.existsSync(name), true);\nfs.writeFileSync(${JSON.stringify(report)}, process.cwd());\nfs.writeFileSync('dist/output.js', 'mutated');\nfs.writeFileSync('src/input.js', 'mutated');\nprocess.exit(${status});\n`,
      );
      chmodSync(join(root, 'bin/npm'), 0o755);
      const index = readFileSync(join(root, '.git/index'));
      const result = spawnSync(
        process.execPath,
        [join(root, 'scripts/check-pre-push.mjs')],
        {
          cwd: root,
          env: {
            ...process.env,
            PATH: `${join(root, 'bin')}:${process.env.PATH}`,
          },
          encoding: 'utf8',
        },
      );
      assert.equal(result.status, status, result.stderr);
      assert.equal(
        readFileSync(join(root, 'dist/output.js'), 'utf8'),
        'original',
      );
      assert.equal(readFileSync(join(root, 'src/input.js'), 'utf8'), 'working');
      assert.deepEqual(readFileSync(join(root, '.git/index')), index);
      assert.equal(existsSync(readFileSync(report, 'utf8')), false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
