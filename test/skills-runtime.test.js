import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, realpath, rm, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, dirname, resolve, isAbsolute } from 'node:path';

// Agreed seam: real vendor core exports with real files, never the user's profile.
test('Skills real core preserves create, policy, categories, trash and restore in isolated homes', async () => {
  const workspace = await realpath(fileURLToPath(new URL('..', import.meta.url)));
  const temporary = await mkdtemp(join(workspace, '.skills-runtime-'));
  const originalEnvironment = { ...process.env };
  try {
    assert.equal(dirname(await realpath(temporary)), workspace);
    const home = join(temporary, 'home');
    const dshHome = join(temporary, 'dsh');
    await mkdir(home); await mkdir(dshHome);
    // Do not inherit any DSH path overrides, NODE_OPTIONS preload hooks, or home aliases.
    const env = Object.fromEntries(Object.entries(process.env).filter(([key]) =>
      !key.startsWith('DSH_') && !['HOME', 'USERPROFILE', 'HOMEDRIVE', 'HOMEPATH', 'NODE_OPTIONS'].includes(key)));
    Object.assign(env, { HOME: home, USERPROFILE: home, DSH_HOME: dshHome, DSH_AGENTS_HOME: join(home, '.agents') });
    const moduleUrl = new URL('../modules/skills/vendor/lib/core.js', import.meta.url).href;
    const source = `
      import assert from 'node:assert/strict';
      import { readFile, access } from 'node:fs/promises';
      import { join, relative, isAbsolute } from 'node:path';
      import { homedir } from 'node:os';
      const core = await import(${JSON.stringify(moduleUrl)});
      assert.equal(homedir(), process.env.HOME);
      assert.equal(core.resolveDshHome(), process.env.DSH_HOME);
      assert.equal(core.managerStatePath(), join(process.env.DSH_HOME, 'skills-manager', 'state.json'));
      for (const root of core.userRoots()) {
        const rel = relative(process.cwd(), root.path);
        assert.ok(rel && !rel.startsWith('..') && !isAbsolute(rel), root.path);
      }
      const dshRoot = core.userRoots().find(root => root.key === 'dsh');
      const options = { projectCwds: [] };
      const snapshot = () => core.state(options);
      const rootView = async () => (await snapshot()).roots.find(root => root.key === 'dsh');
      assert.equal((await snapshot()).summary.total, 0);
      const input = { name: 'Runtime Fixture', description: 'Isolated runtime fixture', body: '# Fixture\\nDo a local-only task.' };
      const created = await core.createSkill(input);
      assert.equal(created.name, 'runtime-fixture');
      assert.equal(created.root, 'dsh');
      assert.equal(created.path, join(process.env.DSH_HOME, 'skills', 'runtime-fixture', 'SKILL.md'));
      const original = await readFile(created.path, 'utf8');
      assert.match(original, /name: runtime-fixture/);
      assert.equal((await core.skillDetail('dsh', created.name, options)).body, input.body);
      assert.equal((await rootView()).skills[0].loadable, true);
      assert.equal((await rootView()).skills[0].enabled, true);
      assert.equal((await core.createSkill(input)).code, 'error.create.conflict');
      assert.equal((await core.createSkill({ name: 'invalid', body: 'body' })).code, 'error.create.descriptionRequired');
      await core.setSkillEnabled(dshRoot, created.name, false);
      assert.equal((await rootView()).skills[0].enabled, false);
      assert.equal((await rootView()).skills[0].managerOverride, false);
      assert.equal(await readFile(created.path, 'utf8'), original);
      await core.setSkillEnabled(dshRoot, created.name, true);
      assert.equal((await rootView()).skills[0].enabled, true);
      const { category } = await core.createCategory('dsh', 'Local fixtures');
      assert.equal((await core.createCategory('dsh', 'Local fixtures')).code, 'error.category.duplicate');
      await core.assignSkillCategory('dsh', created.name, category.id);
      assert.equal((await rootView()).skills[0].categoryId, category.id);
      await core.renameCategory('dsh', category.id, 'Renamed fixtures');
      assert.equal((await rootView()).categories[0].name, 'Renamed fixtures');
      const second = await core.createSkill({ ...input, name: 'second-fixture' });
      await core.assignSkillCategory('dsh', second.name, category.id);
      assert.deepEqual((await core.moveSkillInCategory('dsh', second.name, category.id, created.name, 'before')).order, ['second-fixture', 'runtime-fixture']);
      assert.equal((await core.setCategoryEnabled('dsh', category.id, false)).changed, 2);
      assert.ok((await rootView()).skills.every(skill => skill.enabled === false));
      assert.equal((await core.setCategoryEnabled('dsh', category.id, true)).changed, 2);
      assert.ok((await rootView()).skills.every(skill => skill.enabled === true));
      await core.setSourceEnabled('dsh', false);
      assert.ok((await rootView()).skills.every(skill => skill.enabled === false));
      await core.setSourceEnabled('dsh', true);
      assert.ok((await rootView()).skills.every(skill => skill.enabled === true));
      await core.deleteCategory('dsh', category.id);
      assert.deepEqual((await rootView()).categories, []);
      assert.ok((await rootView()).skills.every(skill => skill.categoryId === null));
      const trashed = await core.deleteSkill(dshRoot, created.name);
      assert.ok(trashed.id);
      await assert.rejects(access(created.path), { code: 'ENOENT' });
      assert.deepEqual((await core.listTrash()).map(item => item.name), ['runtime-fixture']);
      assert.deepEqual((await rootView()).skills.map(skill => skill.name), ['second-fixture']);
      assert.equal((await core.restoreTrash(trashed.id)).name, created.name);
      assert.equal(await readFile(created.path, 'utf8'), original);
      assert.deepEqual(await core.listTrash(), []);
      const again = await core.deleteSkill(dshRoot, created.name);
      await core.createSkill(input);
      assert.equal((await core.restoreTrash(again.id)).code, 'error.trash.conflict');
      assert.equal((await core.listTrash()).length, 1);
      await core.permanentlyDeleteTrash(again.id);
      assert.deepEqual(await core.listTrash(), []);
      assert.equal((await core.restoreTrash(again.id)).code, 'error.trash.notFound');
      const saved = JSON.parse(await readFile(core.managerStatePath(), 'utf8'));
      assert.ok(saved);
      console.log('PASS real core: create/list/detail/conflicts; skill/source/category enable; category create/rename/assign/order/delete; trash/restore/conflict/permanent delete; isolated state persistence');
    `;
    const child = spawnSync(process.execPath, ['--input-type=module', '--eval', source], {
      cwd: temporary, env, encoding: 'utf8', timeout: 30_000, maxBuffer: 2 ** 20,
    });
    assert.equal(child.error, undefined, child.error?.message);
    assert.equal(child.status, 0, `${child.stdout}\n${child.stderr}`);
    assert.match(child.stdout, /PASS real core/);
    console.log(child.stdout.trim());
  } finally {
    // Never delete a computed or symlink-redirected path without checking its exact parent.
    assert.ok(isAbsolute(temporary));
    assert.equal(resolve(temporary), temporary);
    assert.equal(dirname(await realpath(temporary)), workspace);
    assert.ok(temporary.startsWith(join(workspace, '.skills-runtime-')));
    await rm(temporary, { recursive: true, force: true });
    await assert.rejects(access(temporary), { code: 'ENOENT' });
    assert.deepEqual({ ...process.env }, originalEnvironment, 'parent environment must remain unchanged');
  }
});
