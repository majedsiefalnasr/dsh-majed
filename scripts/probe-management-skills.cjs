// Opt-in synthetic filesystem/catalog characterization, not live Manager acceptance.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { realpathSync } = require('node:fs');
const { basename, join } = require('node:path');
const { syncBuiltinESMExports } = require('node:module');
const base = process.argv[2];
const flags = new Set(process.argv.slice(3));
assert.ok(base, 'Pass the installed runtime directory.');
assert.ok([...flags].every(flag => ['--red-watch'].includes(flag)), 'Unknown probe flag.');
assert.equal(process.env.DSH_MANAGEMENT_SKILLS_PROBE, '1', 'Use the isolated runner.');
const home = realpathSync(process.env.HOME);
assert.ok(basename(home).startsWith('dsh-management-skills-'));
assert.equal(realpathSync(process.env.DSH_HOME), home);
assert.equal(realpathSync(process.cwd()), home);
const forbidden = () => { throw new Error('Skills probe forbids network, listeners and child processes.'); };
for (const name of ['node:http', 'node:https']) {
  const module = require(name);
  module.request = module.get = forbidden;
}
require('node:net').Socket.prototype.connect = forbidden;
require('node:net').Server.prototype.listen = forbidden;
require('node:tls').connect = forbidden;
require('node:dgram').Socket.prototype.send = forbidden;
require('node:dgram').Socket.prototype.bind = forbidden;
for (const dns of [require('node:dns'), require('node:dns/promises')]) {
  for (const name of Object.keys(dns)) if (typeof dns[name] === 'function') dns[name] = forbidden;
}
for (const name of ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']) {
  require('node:child_process')[name] = forbidden;
}
globalThis.fetch = forbidden;
if (typeof globalThis.WebSocket === 'function') globalThis.WebSocket = forbidden;
syncBuiltinESMExports();
const load = name => require(join(base, 'node_modules', '@deepseek-ai', name, 'lib/index.js'));
const { Context } = load('cordis');
const skillsModule = load('dsh-skill');
const filesystem = load('dsh-skill-filesystem');
const a = join(home, 'project-a');
const b = join(home, 'project-b');
const dshHome = join(home, 'isolated-dsh');
const agentsHome = join(home, 'isolated-agents');
const checks = [];
let checkpoint = 'fixture-setup';
const definition = (description, policy = '', body = 'Synthetic instructions.') =>
  `---\nname: fixture-skill\ndescription: ${description}\n${policy}---\n${body}\n`;
async function main() {
  for (const project of [a, b]) {
    await fs.mkdir(join(project, '.git'), { recursive: true });
    await fs.mkdir(join(project, '.dsh/skills'), { recursive: true });
  }
  await fs.mkdir(join(dshHome, 'skills'), { recursive: true });
  await fs.mkdir(agentsHome, { recursive: true });
  const userFile = join(dshHome, 'skills/fixture-skill.md');
  const projectFile = join(a, '.dsh/skills/fixture-skill.md');
  await fs.writeFile(userFile, definition('User fixture'));
  await fs.writeFile(projectFile, definition('Project fixture'));
  const ctx = new Context();
  const fibers = [];
  const mount = async (plugin, config) => {
    const fiber = ctx.plugin(plugin, config); fibers.push(fiber); await fiber; return fiber;
  };
  let changes = 0;
  let wake;
  let primaryFailure;
  try {
    await mount(skillsModule.SkillRegistry);
    await mount({ apply(owner) { owner.on('skills/change', () => { changes++; wake?.(); }); } });
    const provider = await mount(filesystem, { dshHome, agentsHome, watch: true,
      watchStabilityThresholdMs: 30, watchPollIntervalMs: 20 });
    const skills = ctx.get('skills');
    const list = async cwd => {
      const snapshot = await skills.snapshot({ cwd });
      assert.equal(snapshot.complete, true, 'Watcher-backed catalog must be complete before claiming cached invalidation.');
      return snapshot.skills;
    };
    // A change listener is installed before each snapshot, preventing lost-event races.
    async function eventually(cwd, predicate) {
      const deadline = Date.now() + 5000;
      while (Date.now() < deadline) {
        let timer;
        const notification = new Promise(resolve => {
          wake = resolve;
          timer = setTimeout(resolve, Math.max(1, deadline - Date.now()));
        });
        try {
          const rows = await list(cwd);
          if (predicate(rows)) return rows;
          await notification;
        } finally { clearTimeout(timer); wake = undefined; }
      }
      assert.fail('Native watcher did not publish the expected catalog before the bounded deadline.');
    }
    checkpoint = 'native-discovery-and-cwd-priority';
    assert.equal((await list(a)).find(row => row.name === 'fixture-skill').description, 'Project fixture');
    assert.equal((await list(b)).find(row => row.name === 'fixture-skill').description, 'User fixture');
    const initial = (await list(a)).find(row => row.name === 'fixture-skill');
    assert.equal(skillsModule.isModelInvocable(initial), true);
    assert.equal(skillsModule.isUserInvocable(initial), true);
    assert.equal((await skills.get('fixture-skill', { cwd: a })).content.trim(), 'Synthetic instructions.');
    checks.push('Real filesystem provider discovers project/user roots; project priority and cwd-isolated catalog resolve correctly.');
    // Cache is already warm. No manual invalidation or model-facing fs event is emitted.
    checkpoint = 'external-frontmatter-watch';
    const before = changes;
    await fs.writeFile(projectFile, definition('Project edited', 'disable-model-invocation: true\nuser-invocable: false\n'));
    const edited = await eventually(a, rows => rows.some(row => row.name === 'fixture-skill' && row.description === 'Project edited'));
    assert.equal(changes > before, flags.has('--red-watch') ? false : true, 'External change must invalidate the native catalog.');
    const selected = edited.find(row => row.name === 'fixture-skill');
    assert.equal(skillsModule.isModelInvocable(selected), false);
    assert.equal(skillsModule.isUserInvocable(selected), false);
    for (const [description, policy, model, user] of [
      ['Model disabled', 'disable-model-invocation: true\n', false, true],
      ['User disabled', 'user-invocable: false\n', true, false],
      ['Defaults restored', '', true, true],
    ]) {
      await list(a); // Require a complete pre-mutation snapshot, not an uncached incomplete observation.
      await fs.writeFile(projectFile, definition(description, policy));
      const rows = await eventually(a, rows => rows.some(row => row.description === description));
      const row = rows.find(row => row.name === 'fixture-skill');
      assert.equal(skillsModule.isModelInvocable(row), model);
      assert.equal(skillsModule.isUserInvocable(row), user);
    }
    await fs.writeFile(projectFile, definition('Project edited', 'disable-model-invocation: true\nuser-invocable: false\n'));
    await eventually(a, rows => rows.some(row => row.description === 'Project edited'));
    checks.push('External frontmatter edits refresh complete warm catalogs; independent invocation flags and restored defaults resolve correctly.');
    checkpoint = 'fresh-body-load';
    await fs.writeFile(projectFile, definition('Project edited', 'disable-model-invocation: true\nuser-invocable: false\n', 'Revised synthetic instructions.'));
    assert.equal((await skills.get('fixture-skill', { cwd: a })).content.trim(), 'Revised synthetic instructions.');
    checks.push('Native get re-reads current body; invocation policy remains consumer responsibility, not an invented registry denial.');
    checkpoint = 'rename-delete-fallback';
    const hidden = join(a, '.dsh/skills/fixture-skill.hidden');
    await fs.rename(projectFile, hidden);
    await eventually(a, rows => rows.some(row => row.name === 'fixture-skill' && row.description === 'User fixture'));
    await fs.rename(hidden, projectFile);
    await eventually(a, rows => rows.some(row => row.name === 'fixture-skill' && row.description === 'Project edited'));
    await fs.unlink(projectFile);
    await eventually(a, rows => rows.some(row => row.name === 'fixture-skill' && row.description === 'User fixture'));
    checks.push('External rename, restoration and deletion invalidate cached selection and restore the user-root fallback.');
    checkpoint = 'native-provider-disposal';
    await provider.dispose();
    assert.deepEqual(await list(a), []);
    assert.equal(await skills.get('fixture-skill', { cwd: a }), undefined);
    checks.push('Awaited provider disposal removes cached catalog/body access; watcher handle closure is not independently instrumented.');
    console.log(JSON.stringify({ runtime: require(join(base, 'package.json')).version,
      node: process.versions.node, checks, limitations: [
        'Actual registry/filesystem/watch services, but synthetic files in disposable roots, not installed skill stores.',
        'No Manager CRUD, tool-skill model catalog, Settings rendering, browser login or paired remote proof.',
        'No session/project authorization, canonical write safety or Command hook provenance proof; T02A/T02E remain open.',
      ] }, null, 2));
  } catch (error) {
    primaryFailure = error;
    throw error;
  } finally {
    const cleanupFailures = [];
    for (const fiber of fibers.reverse()) {
      try { await fiber.dispose(); } catch (error) { cleanupFailures.push(error); }
    }
    if (cleanupFailures.length) {
      if (primaryFailure) console.error(`Skills probe cleanup also failed for ${cleanupFailures.length} fibers.`);
      else throw new AggregateError(cleanupFailures, 'Skills probe cleanup failed.');
    }
  }
}
main().catch(error => {
  console.error(`Skills probe failed at ${checkpoint}: ${error?.code || error?.name || 'Error'}: ${error?.message || 'Unknown failure'}`);
  process.exitCode = 1;
});
