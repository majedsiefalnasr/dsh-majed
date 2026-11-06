import assert from 'node:assert/strict';
import {
  mkdtemp,
  lstat,
  realpath,
  mkdir,
  writeFile,
  readFile,
  readdir,
  rm,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { apply } from '../dist/skills.js';
import {
  LEGACY_SKILLS_HEADER,
  LEGACY_SKILLS_ROUTE,
} from '../dist/legacy-names.js';
import { zipSync } from 'fflate';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { symlink } from 'node:fs/promises';

const doc = (name, body = 'Instructions') =>
  `---\nname: ${name}\ndescription: Use for ${name}\n---\n${body}`;
async function fixture(t) {
  const root = await realpath(
    await mkdtemp(join(tmpdir(), 'waycraft-import-')),
  );
  t.after(() => rm(root, { recursive: true, force: true }));
  let route;
  const stops = [];
  apply(
    {
      skills: { registerProvider: () => () => {} },
      effect(fn) {
        stops.push(fn());
      },
      inject(_, fn) {
        fn({
          effect(fn) {
            stops.push(fn());
          },
          get() {
            return {
              fetch: {
                register(value) {
                  route = value;
                  return () => {};
                },
              },
            };
          },
        });
      },
    },
    {
      sources: [{ id: 'user-dsh', path: join(root, 'skills') }],
      statePath: join(root, 'state.json'),
    },
  );
  t.after(async () => {
    for (const stop of stops.reverse()) await stop?.();
  });
  const post = async (body, signal) => {
    const response = await route.fetch(
      new Request('http://localhost/api/waycraft-skills.catalog', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-waycraft-skills': '1',
        },
        body: JSON.stringify({ source: 'user-dsh', ...body }),
        signal,
      }),
    );
    return { status: response.status, body: await response.json() };
  };
  const postLegacy = async (body) => {
    const response = await route.fetch(
      new Request(`http://localhost${LEGACY_SKILLS_ROUTE}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          [LEGACY_SKILLS_HEADER]: '1',
        },
        body: JSON.stringify({ source: 'user-dsh', ...body }),
      }),
    );
    return { status: response.status, body: await response.json() };
  };
  return {
    root,
    post,
    postLegacy,
    stop: async () => {
      for (const stop of [...stops].reverse()) await stop?.();
    },
  };
}

test('registered import rejects links, cancels without writes and restores original after controlled publication failure', async (t) => {
  const { root, post } = await fixture(t);
  const entry = (name, body) => ({
    path: `${name}/SKILL.md`,
    data: Buffer.from(doc(name, body)).toString('base64'),
  });
  await post({
    action: 'upload',
    entries: [entry('alpha', 'Original')],
    conflict: 'skip',
  });
  const original = await readFile(join(root, 'skills', 'alpha', 'SKILL.md'));
  const rename = fs.promises.rename;
  fs.promises.rename = async (source, target) => {
    if (
      String(source).includes('/.import-') &&
      target === join(root, 'skills', 'alpha')
    )
      throw Object.assign(new Error('injected publication failure'), {
        code: 'EIO',
      });
    return rename(source, target);
  };
  syncBuiltinESMExports();
  try {
    const result = await post({
      action: 'upload',
      entries: [entry('alpha', 'Replacement'), entry('beta', 'New')],
      conflict: 'overwrite',
    });
    assert.equal(result.body.result.failed[0].name, 'alpha');
    assert.equal(result.body.result.imported[0].name, 'beta');
    assert.deepEqual(
      await readFile(join(root, 'skills', 'alpha', 'SKILL.md')),
      original,
    );
  } finally {
    fs.promises.rename = rename;
    syncBuiltinESMExports();
  }
  const abort = new AbortController();
  abort.abort();
  assert.equal(
    (
      await post(
        {
          action: 'upload',
          entries: [entry('cancelled', 'No')],
          conflict: 'skip',
        },
        abort.signal,
      )
    ).body.code,
    'import-cancelled',
  );
  const incoming = join(root, 'incoming');
  await mkdir(incoming);
  await symlink(join(root, 'skills', 'alpha'), join(incoming, 'linked'));
  assert.equal(
    (
      await post({
        action: 'import',
        path: incoming,
        dryRun: true,
        conflict: 'overwrite',
      })
    ).body.code,
    'import-linked',
  );
  assert.deepEqual(
    await readFile(join(root, 'skills', 'alpha', 'SKILL.md')),
    original,
  );
  assert.ok(
    !(await readdir(join(root, 'skills'))).some(
      (name) => name.startsWith('.import-') || name.startsWith('.backup-'),
    ),
  );
});

test('registered multi-archive selection shares input, expanded and entry budgets before publication', async (t) => {
  const { root, post } = await fixture(t);
  const archive = (path, files, options) => ({
    path,
    data: Buffer.from(zipSync(files, options)).toString('base64'),
  });
  const first = archive(
    'one.zip',
    {
      'one/SKILL.md': Buffer.from(doc('one')),
      'one/data.bin': Buffer.alloc(550000),
    },
    { level: 0 },
  );
  const second = archive(
    'two.zip',
    {
      'two/SKILL.md': Buffer.from(doc('two')),
      'two/data.bin': Buffer.alloc(550000),
    },
    { level: 0 },
  );
  assert.equal(
    (
      await post({
        action: 'upload',
        archives: [first, second],
        entries: [],
        conflict: 'skip',
      })
    ).body.code,
    'import-limit',
  );
  assert.equal(
    (
      await post({
        action: 'upload',
        archives: [first],
        entries: [
          { path: 'loose.md', data: Buffer.alloc(550000).toString('base64') },
        ],
        conflict: 'skip',
      })
    ).body.code,
    'import-limit',
  );
  const sharedExpanded = Object.fromEntries([
    ['shared/SKILL.md', Buffer.from(doc('shared'))],
    ...Array.from({ length: 8 }, (_, i) => [
      `shared/${i}.bin`,
      Buffer.alloc(950000),
    ]),
  ]);
  assert.equal(
    (
      await post({
        action: 'upload',
        archives: [archive('shared.zip', sharedExpanded)],
        entries: [
          {
            path: 'loose.md',
            data: Buffer.concat([
              Buffer.from(doc('loose')),
              Buffer.alloc(900000),
            ]).toString('base64'),
          },
        ],
        conflict: 'skip',
      })
    ).body.code,
    'import-limit',
  );
  const expanded = (name) =>
    Object.fromEntries([
      [`${name}/SKILL.md`, Buffer.from(doc(name))],
      ...Array.from({ length: 5 }, (_, i) => [
        `${name}/${i}.bin`,
        Buffer.alloc(900000),
      ]),
    ]);
  assert.equal(
    (
      await post({
        action: 'upload',
        archives: [
          archive('large1.zip', expanded('large-one')),
          archive('large2.zip', expanded('large-two')),
        ],
        conflict: 'skip',
      })
    ).body.code,
    'import-limit',
  );
  const many = (name) =>
    Object.fromEntries([
      [`${name}/SKILL.md`, Buffer.from(doc(name))],
      ...Array.from({ length: 260 }, (_, i) => [
        `${name}/${i}.bin`,
        new Uint8Array(),
      ]),
    ]);
  assert.equal(
    (
      await post({
        action: 'upload',
        archives: [
          archive('many1.zip', many('many-one')),
          archive('many2.zip', many('many-two')),
        ],
        conflict: 'skip',
      })
    ).body.code,
    'import-limit',
  );
  const abort = new AbortController();
  abort.abort();
  assert.equal(
    (
      await post(
        {
          action: 'upload',
          archives: [
            archive('cancel.zip', { 'SKILL.md': Buffer.from(doc('cancel')) }),
          ],
          conflict: 'skip',
        },
        abort.signal,
      )
    ).body.code,
    'import-cancelled',
  );
  await assert.rejects(readFile(join(root, 'skills', 'one', 'SKILL.md')), {
    code: 'ENOENT',
  });
  const partial = await post({
    action: 'upload',
    archives: [
      archive('empty.zip', { 'notes.txt': Buffer.from('no skill') }),
      archive('good.zip', { 'SKILL.md': Buffer.from(doc('good')) }),
    ],
    conflict: 'skip',
  });
  assert.equal(partial.body.result.imported[0].name, 'good');
  assert.deepEqual(partial.body.result.failed, [
    { name: 'empty.zip', code: 'import-empty' },
  ]);
});

test('registered publication remains imported when backup cleanup fails and reports the remaining backup path', async (t) => {
  const { root, post } = await fixture(t);
  const upload = (body) =>
    post({
      action: 'upload',
      conflict: 'overwrite',
      entries: [
        {
          path: 'alpha/SKILL.md',
          data: Buffer.from(doc('alpha', body)).toString('base64'),
        },
      ],
    });
  await upload('Original');
  const remove = fs.promises.rm;
  fs.promises.rm = async (path, ...args) => {
    if (String(path).includes('/.backup-'))
      throw Error('controlled backup cleanup failure');
    return remove(path, ...args);
  };
  syncBuiltinESMExports();
  let result;
  try {
    result = await upload('Replacement');
  } finally {
    fs.promises.rm = remove;
    syncBuiltinESMExports();
  }
  assert.equal(result.body.result.imported.length, 1);
  assert.deepEqual(result.body.result.failed, []);
  const warning = result.body.result.warnings[0];
  assert.equal(warning.code, 'import-cleanup');
  assert.match(
    await readFile(warning.recovery[0] + '/SKILL.md', 'utf8'),
    /Original/,
  );
  assert.match(
    await readFile(join(root, 'skills', 'alpha', 'SKILL.md'), 'utf8'),
    /Replacement/,
  );
});

test('registered overwrite restores originals even when restoration rename fails', async (t) => {
  const { root, post } = await fixture(t);
  const entry = (body) => ({
    path: 'alpha/SKILL.md',
    data: Buffer.from(doc('alpha', body)).toString('base64'),
  });
  await post({
    action: 'upload',
    entries: [entry('Original')],
    conflict: 'skip',
  });
  const original = await readFile(join(root, 'skills', 'alpha', 'SKILL.md'));
  const rename = fs.promises.rename;
  fs.promises.rename = async (source, target) => {
    if (
      String(source).includes('/.import-') ||
      String(source).includes('/.backup-')
    )
      throw Object.assign(new Error('controlled rename unavailable'), {
        code: 'EIO',
      });
    return rename(source, target);
  };
  syncBuiltinESMExports();
  try {
    const result = await post({
      action: 'upload',
      entries: [entry('Replacement')],
      conflict: 'overwrite',
    });
    assert.equal(result.body.result.failed.length, 1);
    assert.deepEqual(
      await readFile(join(root, 'skills', 'alpha', 'SKILL.md')),
      original,
    );
  } finally {
    fs.promises.rename = rename;
    syncBuiltinESMExports();
  }
  assert.ok(
    !(await readdir(join(root, 'skills'))).some(
      (name) => name.startsWith('.import-') || name.startsWith('.backup-'),
    ),
  );
});

test('registered failed fallback retains last original backup and reports recovery failure', async (t) => {
  const { root, post } = await fixture(t);
  const entry = (body) => ({
    path: 'alpha/SKILL.md',
    data: Buffer.from(doc('alpha', body)).toString('base64'),
  });
  await post({
    action: 'upload',
    entries: [entry('Original')],
    conflict: 'skip',
  });
  const original = await readFile(join(root, 'skills', 'alpha', 'SKILL.md'));
  const { rename, cp } = fs.promises;
  fs.promises.rename = async (source, target) => {
    if (
      String(source).includes('/.import-') ||
      String(source).includes('/.backup-')
    )
      throw Error('controlled rename failure');
    return rename(source, target);
  };
  fs.promises.cp = async () => {
    throw Error('controlled copy failure');
  };
  syncBuiltinESMExports();
  try {
    const result = await post({
      action: 'upload',
      entries: [entry('Replacement')],
      conflict: 'overwrite',
    });
    assert.equal(result.body.result.failed[0].code, 'import-recovery');
    const backup = (await readdir(join(root, 'skills'))).filter((name) =>
      name.startsWith('.backup-'),
    );
    assert.equal(backup.length, 1);
    assert.deepEqual(result.body.result.failed[0].recovery, [
      join(root, 'skills', backup[0]),
    ]);
    assert.deepEqual(
      await readFile(join(root, 'skills', backup[0], 'SKILL.md')),
      original,
    );
    assert.ok(
      !(await readdir(join(root, 'skills'))).some((name) =>
        name.startsWith('.import-'),
      ),
    );
  } finally {
    fs.promises.rename = rename;
    fs.promises.cp = cp;
    syncBuiltinESMExports();
  }
});

for (const shutdown of [false, true])
  test(`registered ${shutdown ? 'shutdown' : 'mid-staging cancellation'} preserves original and drains`, async (t) => {
    const { root, post, stop } = await fixture(t);
    const entry = (body) => ({
      path: 'alpha/SKILL.md',
      data: Buffer.from(doc('alpha', body)).toString('base64'),
    });
    await post({
      action: 'upload',
      entries: [entry('Original')],
      conflict: 'skip',
    });
    const original = await readFile(join(root, 'skills', 'alpha', 'SKILL.md'));
    const write = fs.promises.writeFile;
    let reached;
    const staged = new Promise((resolve) => {
      reached = resolve;
    });
    let release;
    const hold = new Promise((resolve) => {
      release = resolve;
    });
    fs.promises.writeFile = async (path, ...args) => {
      const result = await write(path, ...args);
      if (String(path).includes('/.import-')) {
        reached();
        await hold;
      }
      return result;
    };
    syncBuiltinESMExports();
    const abort = new AbortController();
    try {
      const request = post(
        {
          action: 'upload',
          entries: [entry('Replacement')],
          conflict: 'overwrite',
        },
        abort.signal,
      );
      await staged;
      let drained = false;
      const stopping = shutdown
        ? stop().then(() => {
            drained = true;
          })
        : Promise.resolve();
      if (!shutdown) abort.abort();
      await new Promise(setImmediate);
      if (shutdown) assert.equal(drained, false);
      release();
      const response = await request;
      await stopping;
      assert.equal(response.body.result.failed[0].code, 'import-cancelled');
      assert.deepEqual(
        await readFile(join(root, 'skills', 'alpha', 'SKILL.md')),
        original,
      );
    } finally {
      release();
      fs.promises.writeFile = write;
      syncBuiltinESMExports();
    }
    assert.ok(
      !(await readdir(join(root, 'skills'))).some(
        (name) => name.startsWith('.import-') || name.startsWith('.backup-'),
      ),
    );
  });

test('registered batches report malformed candidates without discarding valid bundles', async (t) => {
  const { root, post } = await fixture(t);
  const entries = [
    {
      path: 'broken/SKILL.md',
      data: Buffer.from('not frontmatter').toString('base64'),
    },
    {
      path: 'valid/SKILL.md',
      data: Buffer.from(doc('valid')).toString('base64'),
    },
    { path: 'valid/data.bin', data: Buffer.from([0, 255]).toString('base64') },
  ];
  for (const mode of ['entries', 'zip', 'local']) {
    let body;
    if (mode === 'local') {
      const incoming = join(root, 'incoming');
      for (const entry of entries) {
        await mkdir(join(incoming, entry.path, '..'), { recursive: true });
        await writeFile(
          join(incoming, entry.path),
          Buffer.from(entry.data, 'base64'),
        );
      }
      body = { action: 'import', path: incoming };
    } else
      body = {
        action: 'upload',
        ...(mode === 'entries'
          ? { entries }
          : {
              zip: Buffer.from(
                zipSync(
                  Object.fromEntries(
                    entries.map((entry) => [
                      entry.path,
                      Buffer.from(entry.data, 'base64'),
                    ]),
                  ),
                ),
              ).toString('base64'),
            }),
      };
    const result = await post({ ...body, conflict: 'overwrite' });
    assert.equal(result.status, 200, mode);
    assert.equal(result.body.result.failed[0].name, 'broken');
    assert.equal(result.body.result.failed[0].code, 'import-metadata');
    assert.equal(result.body.result.imported[0].name, 'valid');
    assert.deepEqual(
      await readFile(join(root, 'skills', 'valid', 'data.bin')),
      Buffer.from([0, 255]),
    );
  }
});

test('registered ZIP upload neutralizes Unix symlink attributes without reading or changing the target', async (t) => {
  const { root, post } = await fixture(t);
  const outside = join(root, 'outside.txt');
  const original = Buffer.from(
    'External content must remain private and unchanged',
  );
  await writeFile(outside, original);
  const payload = Buffer.from(outside);
  // The existing pinned ZIP writer documents os=3 and attrs=Unix mode << 16.
  // 0120777 encodes a symbolic link. Only this test writes/inspects metadata;
  // production continues extracting entry bytes, never interpreting link targets.
  const archive = Buffer.from(
    zipSync({
      'alpha/SKILL.md': Buffer.from(doc('alpha')),
      'alpha/data.bin': new Uint8Array([0, 255]),
      'alpha/link.txt': [payload, { os: 3, attrs: 0o120777 << 16 }],
    }),
  );
  // Confirm the writer emitted actual Unix link external attributes in its last
  // Central Directory record, not merely a link-looking file name or payload.
  const central = archive.lastIndexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
  assert.ok(central >= 0);
  assert.equal(archive[central + 5], 3);
  assert.equal(archive.readUInt32LE(central + 38) >>> 16, 0o120777);
  const methods = ['open', 'readFile', 'readlink'];
  const originals = Object.fromEntries(
    methods.map((name) => [name, fs.promises[name]]),
  );
  const externalReads = [];
  for (const name of methods)
    fs.promises[name] = async (path, ...args) => {
      if (String(path) === outside) {
        externalReads.push(name);
        throw Error('ZIP payload must not be read as an external target');
      }
      return originals[name](path, ...args);
    };
  syncBuiltinESMExports();
  let result;
  try {
    result = await post({
      action: 'upload',
      conflict: 'skip',
      zip: archive.toString('base64'),
    });
  } finally {
    for (const name of methods) fs.promises[name] = originals[name];
    syncBuiltinESMExports();
  }
  assert.equal(result.status, 200);
  assert.equal(result.body.result.imported[0].name, 'alpha');
  assert.deepEqual(externalReads, []);
  const installed = join(root, 'skills', 'alpha', 'link.txt');
  const stat = await lstat(installed);
  assert.equal(stat.isFile(), true);
  assert.equal(stat.isSymbolicLink(), false);
  assert.deepEqual(await readFile(installed), payload);
  assert.deepEqual(await readFile(outside), original);
  assert.deepEqual(
    await readFile(join(root, 'skills', 'alpha', 'data.bin')),
    Buffer.from([0, 255]),
  );
  assert.equal(
    (
      await post({
        action: 'upload',
        conflict: 'overwrite',
        zip: Buffer.from(zipSync({ '../outside.txt': payload })).toString(
          'base64',
        ),
      })
    ).body.code,
    'import-path',
  );
  assert.deepEqual(await readFile(outside), original);
});

test('registered ZIP upload imports actual binary bundles and rejects traversal and expanded limits', async (t) => {
  const { root, post } = await fixture(t);
  const zip = (files) => Buffer.from(zipSync(files)).toString('base64');
  const uploaded = await post({
    action: 'upload',
    conflict: 'skip',
    zip: zip({
      'alpha/SKILL.md': Buffer.from(doc('alpha')),
      'alpha/data.bin': new Uint8Array([0, 255]),
    }),
  });
  assert.equal(uploaded.status, 200);
  assert.equal(uploaded.body.result.imported[0].name, 'alpha');
  assert.deepEqual(
    await readFile(join(root, 'skills', 'alpha', 'data.bin')),
    Buffer.from([0, 255]),
  );
  const bad = await post({
    action: 'upload',
    conflict: 'overwrite',
    zip: zip({ '../SKILL.md': Buffer.from(doc('alpha')) }),
  });
  assert.equal(bad.status, 400);
  const bomb = await post({
    action: 'upload',
    conflict: 'overwrite',
    zip: zip({
      'alpha/SKILL.md': Buffer.from(doc('alpha')),
      'alpha/huge': new Uint8Array(1048577),
    }),
  });
  assert.equal(bomb.status, 400);
  assert.deepEqual(
    await readFile(join(root, 'skills', 'alpha', 'data.bin')),
    Buffer.from([0, 255]),
  );
});

test('registered local import previews without writes, copies complete bundles and explicitly skips or overwrites', async (t) => {
  const { root, post } = await fixture(t);
  const source = join(root, 'incoming');
  await mkdir(join(source, 'alpha', 'scripts'), { recursive: true });
  await writeFile(join(source, 'alpha', 'SKILL.md'), doc('alpha'));
  await writeFile(
    join(source, 'alpha', 'scripts', 'run.bin'),
    Buffer.from([0, 255, 2]),
  );
  const preview = await post({
    action: 'import',
    path: source,
    dryRun: true,
    conflict: 'skip',
  });
  assert.equal(preview.status, 200);
  assert.equal(preview.body.result.pending[0].name, 'alpha');
  assert.equal(await readdir(join(root, 'skills')).catch(() => null), null);
  assert.equal(
    (await post({ action: 'import', path: source, conflict: 'skip' })).body
      .result.imported[0].name,
    'alpha',
  );
  assert.deepEqual(
    await readFile(join(root, 'skills', 'alpha', 'scripts', 'run.bin')),
    Buffer.from([0, 255, 2]),
  );
  await writeFile(
    join(source, 'alpha', 'SKILL.md'),
    doc('alpha', 'Replacement'),
  );
  assert.equal(
    (await post({ action: 'import', path: source, conflict: 'skip' })).body
      .result.skipped[0].name,
    'alpha',
  );
  assert.match(
    await readFile(join(root, 'skills', 'alpha', 'SKILL.md'), 'utf8'),
    /Instructions/,
  );
  assert.equal(
    (await post({ action: 'import', path: source, conflict: 'overwrite' })).body
      .result.imported[0].overwritten,
    true,
  );
  assert.match(
    await readFile(join(root, 'skills', 'alpha', 'SKILL.md'), 'utf8'),
    /Replacement/,
  );
  assert.match(
    await readFile(join(source, 'alpha', 'SKILL.md'), 'utf8'),
    /Replacement/,
  );
});

test('deprecated legacy skills route and header are still answered like the new ones (ticket #159)', async (t) => {
  const { post, postLegacy } = await fixture(t);
  const fresh = await post({ action: 'list' });
  const legacy = await postLegacy({ action: 'list' });
  assert.equal(legacy.status, fresh.status);
  assert.deepEqual(legacy.body, fresh.body);
});
