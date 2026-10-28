import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// K01 (#51) — real vendored core + disposable storage. Controlled fixture only:
// it exercises the exact functions the native provider overlay calls
// (modules/skills/overlay.js -> listProviderCandidates/getProviderSkill) but is NOT a
// native registry, slash, Agent or paired-client acceptance.
const KEYS = ['HOME', 'DSH_HOME', 'DSH_AGENTS_HOME'];

async function withHomes(run) {
  const base = await realpath(await mkdtemp(join(tmpdir(), 'dsh-k01-')));
  const saved = Object.fromEntries(KEYS.map(key => [key, process.env[key]]));
  Object.assign(process.env, { HOME: base, DSH_HOME: join(base, 'dsh'), DSH_AGENTS_HOME: join(base, 'agents') });
  try { return await run(base); }
  finally {
    for (const key of KEYS) saved[key] === undefined ? delete process.env[key] : (process.env[key] = saved[key]);
    await rm(base, { recursive: true, force: true });
  }
}

async function writeSkill(dir, entry, frontmatter = '') {
  await mkdir(join(dir, 'skills', entry), { recursive: true });
  await writeFile(join(dir, 'skills', entry, 'SKILL.md'),
    `---\nname: ${entry}\ndescription: ${entry} fixture\n${frontmatter}---\n\nBody of ${entry}.\n`);
}

const rootOf = (core, key) => core.userRoots().find(root => root.key === key);
const view = (snapshot, key, name) => snapshot.roots.find(root => root.key === key).skills.find(skill => skill.name === name);

test('K01 (real core): same-name copies — disabling the winner exposes an explicit fallback, disabling all is a name-wide exclusion', async () => {
  await withHomes(async base => {
    const core = await import('../../modules/skills/vendor/lib/core.js');
    await writeSkill(join(base, 'dsh'), 'shared');
    await writeSkill(join(base, 'agents'), 'shared');
    const names = async () => (await core.listProviderCandidates({})).filter(c => c.name === 'shared');

    let state = await core.state({ projectCwds: [] });
    assert.equal(view(state, 'dsh', 'shared').fallbackTo, undefined);
    assert.deepEqual(view(state, 'agents', 'shared').shadowedBy, { root: 'dsh', name: 'shared' });

    assert.notEqual((await core.setSkillEnabled(rootOf(core, 'dsh'), 'shared', false)).ok, false);
    state = await core.state({ projectCwds: [] });
    assert.deepEqual(view(state, 'dsh', 'shared').fallbackTo, { root: 'agents', name: 'shared', scope: 'user' });
    const afterOne = await names();
    assert.equal(afterOne.length, 1);
    assert.equal(afterOne[0].locator.rootKey, 'agents');
    assert.deepEqual(afterOne[0].invocation, { modelInvocable: true, userInvocable: true });

    assert.notEqual((await core.setSkillEnabled(rootOf(core, 'agents'), 'shared', false)).ok, false);
    state = await core.state({ projectCwds: [] });
    assert.equal(view(state, 'dsh', 'shared').fallbackTo, undefined, 'no fallback when every copy is denied');
    assert.equal(view(state, 'agents', 'shared').fallbackTo, undefined);
    const afterAll = await names();
    assert.equal(afterAll.length, 1, 'one explicit name-wide exclusion candidate');
    assert.deepEqual(afterAll[0].invocation, { modelInvocable: false, userInvocable: false });
  });
});

test('K01 (real core): Unicode declared names keep bytes and diagnostics but never gain a truncated invocation alias in provider candidates', async () => {
  await withHomes(async base => {
    const core = await import('../../modules/skills/vendor/lib/core.js');
    const source = '---\nname: review-\u6280\u80FD\ndescription: Unicode fixture \u4e2d\u6587\n---\n\nKeep \u6b63\u6587 bytes.\n';
    await mkdir(join(base, 'dsh', 'skills', 'unicode-entry'), { recursive: true });
    const file = join(base, 'dsh', 'skills', 'unicode-entry', 'SKILL.md');
    await writeFile(file, source);
    const { readFile } = await import('node:fs/promises');

    const listed = view(await core.state({ projectCwds: [] }), 'dsh', 'unicode-entry');
    assert.equal(listed.declaredName, 'review-\u6280\u80FD');
    assert.equal(listed.loadable, false);
    assert.ok(listed.diagnostics.some(diagnostic => diagnostic.code === 'diagnostic.name.invalid'), 'separate invocation diagnostic');
    const candidates = await core.listProviderCandidates({});
    assert.deepEqual(candidates.map(c => c.name), [], 'non-ASCII declared name is not exposed to native consumers, not even as a truncated alias');
    assert.equal(await readFile(file, 'utf8'), source, 'source bytes untouched by listing');
  });
});

test('K01 (real core): disable blocks future provider loads without touching source bytes or already-returned content', async () => {
  await withHomes(async base => {
    const core = await import('../../modules/skills/vendor/lib/core.js');
    await writeSkill(join(base, 'dsh'), 'retained');
    const file = join(base, 'dsh', 'skills', 'retained', 'SKILL.md');
    const { readFile } = await import('node:fs/promises');
    const before = await readFile(file, 'utf8');

    assert.deepEqual(await core.listProviderCandidates({}), [], 'enabled policy-only DSH skill needs no overlay: the native filesystem source serves it');
    const loaded = { content: before };
    const retained = structuredClone(loaded);

    assert.notEqual((await core.setSkillEnabled(rootOf(core, 'dsh'), 'retained', false)).ok, false);
    const [after] = await core.listProviderCandidates({});
    assert.deepEqual(after.invocation, { modelInvocable: false, userInvocable: false }, 'future loads denied through the overlay candidate');
    assert.equal(await core.getProviderSkill(after, {}).then(skill => skill.invocation.modelInvocable), false, 'future load returns a denied definition');
    assert.deepEqual(loaded, retained, 'previously returned content is not rewritten');
    assert.equal(await readFile(file, 'utf8'), before, 'disable is policy-only; source bytes unchanged');
  });
});
