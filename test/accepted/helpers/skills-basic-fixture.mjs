import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
const { registerSkills, SKILLS_GATE_ROUTE } = await import(pathToFileURL(join(process.argv[2], 'modules/skills/index.js')));

const routes = new Map();
const events = [];
let loaded;
const ready = new Promise(resolve => { loaded = resolve; });
const connection = { fetch: { register(route) {
  routes.set(route.path, route);
  if (route.path === '/api/dsh-majed/skills') loaded();
  return () => routes.delete(route.path);
} } };
const ctx = {
  reflect: { get: name => name === 'connection' ? connection : {} },
  inject(_names, run) { run(ctx); },
  effect(run) { run(); },
  emit(name) { events.push(name); },
  logger: { error(error) { console.error(error); process.exitCode = 1; loaded(); } },
};
registerSkills(ctx, {});
assert.equal((await routes.get(SKILLS_GATE_ROUTE).fetch(new Request('https://fixture' + SKILLS_GATE_ROUTE)).json()).enabled, false);
assert.deepEqual([...routes.keys()], [SKILLS_GATE_ROUTE]);
registerSkills(ctx, { skills: { enabled: true, standaloneDisabled: true } });
await ready;
assert.deepEqual([...routes.keys()].sort(), ['/api/dsh-majed/skills', SKILLS_GATE_ROUTE].sort());
const route = routes.get('/api/dsh-majed/skills');
async function request(action, input) {
  const response = await route.fetch(new Request('https://fixture/api/dsh-majed/skills', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-dsh-majed-skills': '1' },
    body: JSON.stringify({ action, input }),
  }));
  return { status: response.status, value: await response.json() };
}
async function action(action, input) {
  const { status, value } = await request(action, input);
  assert.equal(status, 200, JSON.stringify(value));
  return value.data;
}
if (process.argv[3] === 'read') {
  const snapshot = (await (await route.fetch(new Request('https://fixture/api/dsh-majed/skills'))).json()).data;
  const persisted = snapshot.roots.find(root => root.key === 'dsh').skills.find(skill => skill.name === 'persistent-fixture');
  assert.equal(persisted.managerEnabled, false);
  assert.equal(persisted.effectiveModelInvocable, false);
  assert.equal(persisted.effectiveUserInvocable, false);
  console.log('PASS cold Skills policy reload');
  process.exit(0);
}
const created = await action('create', { root: 'dsh', name: 'Basic Fixture', description: 'Temporary basic fixture', body: 'Keep this fixture isolated.' });
assert.equal(created.name, 'basic-fixture');
const snapshot = async () => (await (await route.fetch(new Request('https://fixture/api/dsh-majed/skills'))).json()).data;
const userRoot = async () => (await snapshot()).roots.find(root => root.key === 'dsh');
assert.equal((await userRoot()).skills[0].name, 'basic-fixture');
assert.equal((await action('detail', { root: 'dsh', name: created.name })).body, 'Keep this fixture isolated.');
await action('setEnabled', { root: 'dsh', name: created.name, enabled: false });
assert.equal((await userRoot()).skills[0].effectiveModelInvocable, false);
assert.equal((await userRoot()).skills[0].effectiveUserInvocable, false);
await action('setEnabled', { root: 'dsh', name: created.name, enabled: true });
assert.equal((await userRoot()).skills[0].effectiveModelInvocable, true);
const trashed = await action('trash', { root: 'dsh', name: created.name });
assert.equal((await userRoot()).skills.length, 0);
assert.equal((await action('listTrash', {}))[0].name, created.name);
await action('restore', { id: trashed.id });
assert.equal((await userRoot()).skills[0].name, created.name);
const again = await action('trash', { root: 'dsh', name: created.name });
assert.equal((await request('delete', { id: again.id })).status, 400);
await action('delete', { id: again.id, confirm: true });
assert.deepEqual(await action('listTrash', {}), []);
for (const deferred of ['repositories', 'catalog', 'install', 'import', 'upload', 'createCategory', 'updatePlugin']) {
  assert.equal((await request(deferred, {})).status, 400);
}
// Pinned v1.2.11 oracle: non-ASCII declared names never become truncated
// ASCII invocation aliases. Historical documents remain manageable unchanged.
for (const name of ['技能', 'مراجعة', 'review-技能', '../unsafe']) {
  const entryName = name === '../unsafe' ? 'historical-invalid' : name;
  const directory = join(process.env.DSH_HOME, 'skills', entryName);
  const source = `---\nname: ${name}\ndescription: Historical Unicode fixture\n---\n\nKeep original Unicode content.\n`;
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'SKILL.md'), '---\nname: historical-fixture\ndescription: Historical fixture\n---\n\nOriginal.\n');
  await action('setEnabled', { root: 'dsh', name: entryName, enabled: true });
  await writeFile(join(directory, 'SKILL.md'), source);
  const listed = (await userRoot()).skills.find(skill => skill.name === entryName);
  assert.equal(listed.declaredName, name);
  assert.equal(listed.loadable, false, `${name} must not acquire a truncated invocation alias`);
  assert.ok(listed.diagnostics.some(diagnostic => diagnostic.code === 'diagnostic.name.invalid'));
  const detail = await action('detail', { root: 'dsh', name: entryName });
  assert.equal(detail.declaredName, name);
  assert.equal((await request('setEnabled', { root: 'dsh', name: entryName, enabled: true })).status, 400);
  await action('setEnabled', { root: 'dsh', name: entryName, enabled: false });
  await action('setEnabled', { root: 'dsh', name: entryName, enabled: false });
  const removed = await action('trash', { root: 'dsh', name: entryName });
  await action('restore', { id: removed.id });
  assert.equal(await readFile(join(directory, 'SKILL.md'), 'utf8'), source);
}
const rejected = await request('create', { root: 'dsh', name: 'review-技能', description: 'No truncation', body: 'Keep name intact.' });
assert.equal(rejected.status, 400, 'creation must reject rather than silently truncate Unicode');
assert.ok(events.includes('commands/change'));
await action('create', { root: 'dsh', name: 'persistent-fixture', description: 'Cold restart fixture', body: 'Preserve source.' });
await action('setEnabled', { root: 'dsh', name: 'persistent-fixture', enabled: false });
console.log('PASS basic Skills create/list/detail/toggle/trash/restore/delete and deferred rejection');
