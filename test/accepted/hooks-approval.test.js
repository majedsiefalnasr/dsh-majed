import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, realpath, writeFile, readFile, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Context } from '@deepseek-ai/cordis';
import { apply } from '../../index.js';
import { createBaselineHarness } from './helpers/baseline-client-harness.js';

async function mount(t, root, options = {}) {
  const ctx = new Context(); let route;
  ctx.provide('connection', { fetch: { register(value) { if (value.path === '/api/majed/hooks/approval') route = value; } } });
  for (const [name, service] of Object.entries(options.services || {})) ctx.provide(name, service);
  const fiber = ctx.plugin({ apply(ctx) { apply(ctx, { hooksApproval: { enabled: true, stateDirectory: join(root, 'state'), userDirectory: root, ...options } }); } });
  await fiber; t.after(() => fiber.dispose());
  return { dispose: () => fiber.dispose(), async call(action, input = {}, headers = {}) {
    const response = await route.fetch(new Request('http://fixture/api/majed/hooks/approval', {
      method: 'POST', headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({ type: 'client-request', rpcId: 'test-1', method: 'majed/hooks/approval', payload: { action, ...input } }),
    }));
    return (await response.json()).result;
  } };
}
async function fixture(t) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'majed-approval-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}
const hook = { id: 'example', events: ['SessionStart'], command: 'printf hello', source: 'inline', enabled: false };

test('Owner-admitted Fetch contract reviews exact command and persists truthful unknown Approval across restart', async t => {
  const root = await fixture(t); let service = await mount(t, root);
  assert.equal((await service.call('save', { scope: 'user', hook })).ok, true);
  const review = await service.call('review', { scope: 'user', id: hook.id }, { origin: 'http://localhost', 'x-original-origin': 'local' });
  assert.equal(review.ok, true);
  assert.equal(review.value.review.command, 'printf hello');
  assert.equal(review.value.review.cwd, root);
  assert.equal(review.value.review.origin, 'unknown');
  assert.equal(review.value.review.phrase, 'RUN AS DSH USER');
  const approved = await service.call('approve', { scope: 'user', id: hook.id, nonce: review.value.nonce, phrase: 'RUN AS DSH USER' });
  assert.equal(approved.ok, true);
  await service.dispose(); service = await mount(t, root);
  const state = await service.call('list', { scope: 'user' });
  assert.equal(state.value.hooks[0].approval.origin, 'unknown');
  assert.equal(state.value.hooks[0].approval.valid, true);
  assert.equal(state.value.executionAvailable, false);
  assert.equal((await service.call('revoke', { scope: 'user', id: hook.id, revision: state.value.hooks[0].revision })).ok, true);
  assert.equal((await service.call('list', { scope: 'user' })).value.hooks[0].approval, null);
});

test('project Approval binds the admitted native session/workspace and rejects substitution', async t => {
  const root = await fixture(t);
  const header = { id: 'session-a', cwd: root };
  const workspace = { id: 'workspace-a', path: root, sessionIds: ['session-a'] };
  const service = await mount(t, root, { services: {
    sessions: { get(id) { return id === 'session-a' ? { header } : undefined; } },
    sessionPersistence: { async stat() {} },
    workspaceRegistry: { get(id) { return id === 'workspace-a' ? workspace : undefined; }, list() { return [workspace]; } },
  } });
  const scope = { scope: 'project', sessionId: 'session-a', workspaceId: 'workspace-a' };
  assert.deepEqual((await service.call('list', { scope: 'user' })).value.contexts, [{ sessionId: 'session-a', workspaceId: 'workspace-a', label: root }]);
  assert.equal((await service.call('save', { ...scope, hook })).ok, true);
  const challenge = (await service.call('review', { ...scope, id: hook.id })).value;
  assert.equal(challenge.review.scope, 'project');
  assert.equal((await service.call('approve', { ...scope, workspaceId: 'other-workspace', id: hook.id, nonce: challenge.nonce, phrase: 'RUN AS DSH USER' })).error.code, 'invalid_scope');
  workspace.sessionIds.length = 0;
  assert.equal((await service.call('approve', { ...scope, id: hook.id, nonce: challenge.nonce, phrase: 'RUN AS DSH USER' })).error.code, 'invalid_scope');
});

test('disabled host composition exposes metadata without touching state and cannot run commands', async t => {
  const root = await fixture(t); const service = await mount(t, root, { enabled: false });
  assert.deepEqual((await service.call('list', { scope: 'user' })).value, { enabled: false, executionAvailable: false, hooks: [] });
  assert.deepEqual((await service.call('save', { scope: 'user', hook })).value.hooks, []);
  await assert.rejects(readFile(join(root, 'state', 'commands.json')), { code: 'ENOENT' });
});

test('nonce attempts are exact, single use, expiring and cannot approve edited or changed watched content', async t => {
  const root = await fixture(t); let clock = 1000;
  const service = await mount(t, root, { now: () => clock });
  await writeFile(join(root, 'watched.txt'), 'reviewed bytes');
  // H01: overwriting an existing definition carries its current revision; assertions below are the unchanged #53 proof.
  const save = async value => service.call('save', { scope: 'user', hook: { ...hook, watchedFiles: ['watched.txt'], ...value }, revision: (await service.call('list', { scope: 'user' })).value.hooks[0]?.revision });
  const review = async () => (await service.call('review', { scope: 'user', id: hook.id })).value;
  const approve = async (challenge, phrase = 'RUN AS DSH USER') => service.call('approve', { scope: 'user', id: hook.id, nonce: challenge.nonce, phrase });
  await save(); let challenge = await review();
  assert.equal((await approve(challenge, 'RUN')).error.code, 'invalid_approval');
  assert.equal((await approve(challenge)).error.code, 'invalid_approval');
  challenge = await review(); clock += 120000;
  assert.equal((await approve(challenge)).error.code, 'invalid_approval');
  challenge = await review(); await writeFile(join(root, 'watched.txt'), 'changed bytes');
  assert.equal((await approve(challenge)).error.code, 'state_changed');
  challenge = await review(); await save({ command: 'printf changed' });
  assert.equal((await approve(challenge)).error.code, 'invalid_approval');
  challenge = await review(); assert.equal((await approve(challenge)).ok, true);
  assert.equal((await approve(challenge)).error.code, 'invalid_approval');
  await writeFile(join(root, 'watched.txt'), 'changed after approval');
  assert.equal((await service.call('list', { scope: 'user' })).value.hooks[0].approval.valid, false);
  await save();
  assert.equal((await service.call('list', { scope: 'user' })).value.hooks[0].approval, null);
});

test('private atomic state rejects corruption without overwriting it and never enables execution', async t => {
  const root = await fixture(t); const service = await mount(t, root);
  await service.call('save', { scope: 'user', hook });
  const file = join(root, 'state', 'commands.json');
  if (process.platform !== 'win32') assert.equal((await stat(file)).mode & 0o777, 0o600);
  await writeFile(file, '{bad state');
  assert.equal((await service.call('save', { scope: 'user', hook })).ok, false);
  assert.equal(await readFile(file, 'utf8'), '{bad state');
  for (const action of ['run', 'test', 'event', 'import']) assert.equal((await service.call(action, { scope: 'user' })).ok, false);
});

test('native Settings registration drives review, phrase confirmation and revoke through production Fetch service', async t => {
  const root = await fixture(t); const service = await mount(t, root);
  await service.call('save', { scope: 'user', hook });
  const source = await readFile(new URL('../../dist/client.js', import.meta.url), 'utf8');
  const harness = createBaselineHarness(source, { connection: { rpc: { async call(channel, method, payload) {
    assert.equal(channel, '/api');
    if (method === 'majed/settings/status') return { ok: true, value: { module: 'hooks', enabled: false, state: 'disabled' } };
    assert.equal(method, 'majed/hooks/approval');
    const { action, ...input } = payload;
    return service.call(action, input);
  } } } });
  t.after(() => harness.dispose()); harness.apply(); const view = harness.render('majed-hooks');
  const settle = async () => { await new Promise(resolve => setTimeout(resolve, 25)); view.render(); };
  const button = label => view.one(node => node.type === 'button' && node.props.children.includes(label));
  const hasButton = label => view.nodes(node => node.type === 'button' && node.props.children.includes(label)).length > 0;
  // Bounded wait for the asynchronous Settings load instead of relying on a fixed delay under CPU load.
  const ready = async label => { for (let i = 0; i < 200 && !hasButton(label); i += 1) await settle(); };
  await settle(); await ready('Review command');
  await button('Review command').props.onClick(); await settle();
  const confirmation = view.one(node => node.type === 'input' && node.props.autoComplete === 'off');
  confirmation.props.onChange({ target: { value: 'RUN AS DSH USER' } }); view.render();
  const form = view.one(node => node.type === 'form' && node.props.children.some(child => child?.type === 'button' && child.props.children.includes('Approve exact command')));
  form.props.onSubmit({ preventDefault() {} }); await settle();
  const approvalNow = async () => (await service.call('list', { scope: 'user' })).value.hooks[0].approval;
  const until = async (predicate) => { for (let i = 0; i < 80; i += 1) { if (predicate(await approvalNow())) return; await settle(); } };
  await until(approval => approval?.valid === true);
  assert.equal((await approvalNow()).valid, true);
  // The Settings view reloads asynchronously after approval; a click made on a stale revision is refused (stale_revision), so retry until the view has refreshed.
  for (let i = 0; i < 40 && (await approvalNow()) !== null; i += 1) { await button('Revoke Approval').props.onClick(); await settle(); }
  assert.equal(await approvalNow(), null);
});

test('Settings edit that changes the hook id is a new entry: it never sends the old entry revision', async t => {
  const root = await fixture(t); const service = await mount(t, root);
  await service.call('save', { scope: 'user', hook });
  const source = await readFile(new URL('../../dist/client.js', import.meta.url), 'utf8');
  const saves = [];
  const harness = createBaselineHarness(source, { connection: { rpc: { async call(channel, method, payload) {
    if (method === 'majed/settings/status') return { ok: true, value: { module: 'hooks', enabled: false, state: 'disabled' } };
    const { action, ...input } = payload;
    if (action === 'save') saves.push(input);
    return service.call(action, input);
  } } } });
  t.after(() => harness.dispose()); harness.apply(); const view = harness.render('majed-hooks');
  const settle = async () => { await new Promise(resolve => setTimeout(resolve, 25)); view.render(); };
  const button = label => view.one(node => node.type === 'button' && node.props.children.includes(label));
  const hasButton = label => view.nodes(node => node.type === 'button' && node.props.children.includes(label)).length > 0;
  // Bounded wait for the asynchronous Settings load instead of relying on a fixed delay under CPU load.
  const ready = async label => { for (let i = 0; i < 200 && !hasButton(label); i += 1) await settle(); };
  await settle(); await ready('Edit command');
  await button('Edit command').props.onClick(); view.render();
  view.one(node => node.type === 'input' && node.props.name === 'id').props.onChange({ target: { value: 'renamed' } }); view.render();
  const form = () => view.one(node => node.type === 'form' && node.props['data-approval-form'] === 'definition');
  form().props.onSubmit({ preventDefault() {} }); await settle();
  assert.equal(saves.length, 1); assert.equal(saves[0].hook.id, 'renamed');
  assert.equal(saves[0].revision, undefined);
  assert.deepEqual((await service.call('list', { scope: 'user' })).value.hooks.map(item => item.hook.id).sort(), ['example', 'renamed']);
  // Renaming onto an id that exists is refused by the route, never overwritten with the old revision.
  // The list is ordered by save time: the original 'example' entry is first.
  for (let i = 0; i < 200 && view.nodes(node => node.type === 'button' && node.props.children.includes('Edit command')).length < 2; i += 1) await settle();
  await view.nodes(node => node.type === 'button' && node.props.children.includes('Edit command'))[0].props.onClick(); view.render();
  view.one(node => node.type === 'input' && node.props.name === 'id').props.onChange({ target: { value: 'renamed' } }); view.render();
  form().props.onSubmit({ preventDefault() {} }); await settle();
  assert.equal(saves.length, 2); assert.equal(saves[1].revision, undefined);
  assert.equal((await service.call('list', { scope: 'user' })).value.hooks.find(item => item.hook.id === 'renamed').hook.command, 'printf hello');
});

// H01 Settings controls: built dist/client.js driven through the baseline harness against the production service.
async function openSettings(t, service) {
  const source = await readFile(new URL('../../dist/client.js', import.meta.url), 'utf8');
  const sent = [];
  const harness = createBaselineHarness(source, { connection: { rpc: { async call(channel, method, payload) {
    if (method === 'majed/settings/status') return { ok: true, value: { module: 'hooks', enabled: false, state: 'disabled' } };
    const { action, ...input } = payload; sent.push({ action, input });
    return service.call(action, input);
  } } } });
  t.after(() => harness.dispose()); harness.apply(); const view = harness.render('majed-hooks');
  const buttons = label => view.nodes(node => node.type === 'button' && node.props.children.includes(label));
  const text = () => view.nodes(() => true).flatMap(node => node.props.children.filter(child => typeof child === 'string')).join('\n');
  // Bounded wait: re-render and re-check at most 500 times (about one second) instead of a fixed sleep.
  const waitFor = async (predicate, what) => { for (let i = 0; i < 500; i += 1) { view.render(); if (predicate()) return; await new Promise(resolve => setTimeout(resolve, 2)); } assert.fail('timed out waiting for ' + what); };
  const click = async (label, index = 0) => { await waitFor(() => buttons(label).length > index, 'button ' + label); await buttons(label)[index].props.onClick(); view.render(); };
  const type = (name, value) => { view.one(node => node.props.name === name).props.onChange({ target: { value } }); view.render(); };
  const submit = async name => { await view.one(node => node.type === 'form' && node.props['data-approval-form'] === name).props.onSubmit({ preventDefault() {} }); view.render(); };
  return { view, sent, buttons, text, waitFor, click, type, submit };
}

const ids = async service => (await service.call('list', { scope: 'user' })).value.hooks.map(item => item.hook.id).sort();
test('Settings Duplicate creates a disabled unapproved draft, shows distinct states and refuses a taken id or a stale revision', async t => {
  const root = await fixture(t); const service = await mount(t, root);
  await service.call('save', { scope: 'user', hook });
  const ui = await openSettings(t, service);
  await ui.waitFor(() => ui.buttons('Duplicate').length === 1, 'Duplicate button');
  assert.match(ui.text(), /Needs review \(saved draft, disabled\)/);
  assert.match(ui.text(), /Nothing is executed/);
  await ui.click('Duplicate'); ui.type('newId', 'example-copy'); await ui.submit('duplicate');
  assert.deepEqual(await ids(service), ['example', 'example-copy']);
  const copy = (await service.call('list', { scope: 'user' })).value.hooks.find(item => item.hook.id === 'example-copy');
  assert.equal(copy.hook.enabled, false); assert.equal(copy.approval, null); assert.equal(copy.state, 'draft');
  assert.equal(copy.hook.command, 'printf hello');
  const original = (await service.call('list', { scope: 'user' })).value.hooks.find(item => item.hook.id === 'example');
  assert.equal(ui.sent.find(item => item.action === 'duplicate').input.revision, original.revision);
  // A taken id is refused and shown; nothing is written.
  await ui.click('Duplicate'); ui.type('newId', 'example-copy'); await ui.submit('duplicate');
  await ui.waitFor(() => /already exists/.test(ui.text()), 'taken-id refusal'); assert.deepEqual(await ids(service), ['example', 'example-copy']);
  // Another writer changes the source after the list was shown: the stale revision is refused.
  await service.call('save', { scope: 'user', hook: { ...hook, command: 'printf changed' }, revision: original.revision });
  await ui.click('Duplicate'); ui.type('newId', 'stale-copy'); await ui.submit('duplicate');
  assert.deepEqual(ui.sent.at(-1).input.revision, original.revision);
  await ui.waitFor(() => /changed since it was listed/.test(ui.text()), 'stale refusal'); assert.deepEqual(await ids(service), ['example', 'example-copy']);
});

const hookState = async (service, id = 'example') => (await service.call('list', { scope: 'user' })).value.hooks.find(item => item.hook.id === id);
async function approveDirect(service, id = 'example') {
  const challenge = (await service.call('review', { scope: 'user', id })).value;
  assert.equal((await service.call('approve', { scope: 'user', id, nonce: challenge.nonce, phrase: 'RUN AS DSH USER' })).ok, true);
}

test('Settings Enable is refused without a valid Approval; with one it activates and Disable keeps the consent', async t => {
  const root = await fixture(t); const service = await mount(t, root);
  await service.call('save', { scope: 'user', hook });
  const ui = await openSettings(t, service);
  await ui.click('Enable');
  await ui.waitFor(() => /no currently valid Approval/.test(ui.text()), 'enable refusal');
  assert.equal((await hookState(service)).hook.enabled, false); assert.equal((await hookState(service)).state, 'draft');
  await approveDirect(service); await ui.click('Refresh saved commands');
  await ui.waitFor(() => /Approved \(disabled\)/.test(ui.text()), 'approved state');
  await ui.click('Enable');
  await ui.waitFor(() => /Approved and enabled/.test(ui.text()), 'active state');
  assert.equal((await hookState(service)).state, 'active');
  await ui.click('Disable');
  await ui.waitFor(() => /Approved \(disabled\)/.test(ui.text()), 'disabled state');
  assert.equal((await hookState(service)).state, 'approved'); assert.equal((await hookState(service)).approval.valid, true);
  // A stale revision on Enable is refused and nothing changes.
  const stale = (await hookState(service)).revision;
  await service.call('revoke', { scope: 'user', id: 'example', revision: stale });
  await ui.click('Enable');
  await ui.waitFor(() => /changed since it was listed/.test(ui.text()), 'stale enable refusal');
  assert.equal((await hookState(service)).hook.enabled, false);
});

test('Settings Trash, Restore and Purge: trash drops consent, restore returns a draft, purge needs an explicit confirmation step', async t => {
  const root = await fixture(t); const service = await mount(t, root);
  await service.call('save', { scope: 'user', hook }); await approveDirect(service);
  const ui = await openSettings(t, service);
  await ui.click('Remove command');
  await ui.waitFor(() => /Trashed \(disabled, unapproved\)/.test(ui.text()), 'trashed state');
  const trashed = (await service.call('list', { scope: 'user' })).value;
  assert.deepEqual(trashed.hooks, []); assert.equal(trashed.trash.length, 1); assert.equal(trashed.trash[0].approval, null);
  // Purge is a two-step action: the first click only asks; keeping it leaves the entry.
  await ui.click('Purge');
  assert.match(ui.text(), /cannot be undone/); assert.equal((await service.call('list', { scope: 'user' })).value.trash.length, 1);
  await ui.click('Keep in trash');
  assert.doesNotMatch(ui.text(), /cannot be undone/); assert.equal((await service.call('list', { scope: 'user' })).value.trash.length, 1);
  // Restore returns an unapproved, disabled draft.
  await ui.click('Restore');
  await ui.waitFor(() => ui.buttons('Duplicate').length === 1, 'restored hook');
  const restored = await hookState(service);
  assert.equal(restored.state, 'draft'); assert.equal(restored.hook.enabled, false); assert.equal(restored.approval, null);
  // Stale revision on Purge is refused even after confirmation.
  await ui.click('Remove command');
  await ui.waitFor(() => ui.buttons('Purge').length === 1, 'trash again');
  await ui.click('Purge');
  const entry = (await service.call('list', { scope: 'user' })).value.trash[0];
  await service.call('restore', { scope: 'user', id: 'example', revision: entry.revision });
  await ui.click('Confirm permanent delete');
  await ui.waitFor(() => /changed since it was listed|no longer exists/.test(ui.text()), 'stale purge refusal');
  assert.equal((await hookState(service)).hook.id, 'example');
  // Confirmed purge removes the entry for good.
  await ui.click('Refresh saved commands'); await ui.click('Remove command');
  await ui.waitFor(() => ui.buttons('Purge').length === 1, 'trash third time');
  await ui.click('Purge'); await ui.click('Confirm permanent delete');
  await ui.waitFor(() => ui.buttons('Purge').length === 0, 'purged');
  const after = (await service.call('list', { scope: 'user' })).value;
  assert.deepEqual(after.hooks, []); assert.deepEqual(after.trash, []);
});

test('Settings Export shows bounded JSON without consent, revision or env values; Import previews new/exists/duplicate before an explicit Import', async t => {
  const root = await fixture(t); const service = await mount(t, root);
  await service.call('save', { scope: 'user', hook: { ...hook, env: ['API_TOKEN'] } }); await approveDirect(service);
  const ui = await openSettings(t, service);
  await ui.click('Export hooks');
  await ui.waitFor(() => ui.view.nodes(node => node.props.name === 'exported').length === 1, 'export text');
  const exported = ui.view.one(node => node.props.name === 'exported');
  assert.equal(exported.props.readOnly, true);
  const bundle = JSON.parse(exported.props.value);
  assert.equal(bundle.kind, 'dsh-majed-hooks'); assert.deepEqual(bundle.hooks.map(item => item.id), ['example']);
  assert.deepEqual(bundle.hooks[0].env, ['API_TOKEN']);
  assert.doesNotMatch(exported.props.value, /approval|revision|fingerprint|generation|receivedAt/);
  assert.equal(bundle.hooks[0].enabled, false);
  // Import: invalid JSON is refused locally; a bundle with an existing id, a repeated id and a new id previews item by item, writing nothing.
  ui.type('bundle', '{not json'); await ui.submit('import');
  await ui.waitFor(() => /not valid JSON/.test(ui.text()), 'invalid json message');
  const other = { ...bundle.hooks[0], id: 'imported', command: 'printf imported' };
  ui.type('bundle', JSON.stringify({ ...bundle, hooks: [bundle.hooks[0], other, other] })); await ui.submit('import');
  await ui.waitFor(() => ui.view.nodes(node => node.props['data-import-item']).length === 3, 'preview items');
  assert.deepEqual(ui.view.nodes(node => node.props['data-import-item']).map(node => node.props['data-import-item']), ['exists', 'new', 'duplicate']);
  assert.match(ui.text(), /imported: new/); assert.match(ui.text(), /repeated in bundle/);
  assert.deepEqual(await ids(service), ['example']);
  await ui.click('Import');
  await ui.waitFor(() => ui.buttons('Duplicate').length === 2, 'imported entry listed');
  const imported = await hookState(service, 'imported');
  assert.equal(imported.state, 'draft'); assert.equal(imported.hook.enabled, false); assert.equal(imported.approval, null);
  assert.equal((await hookState(service)).state, 'approved');
  // A bundle that smuggles consent is refused and shown; the Import button stays disabled when nothing is new.
  ui.type('bundle', JSON.stringify({ ...bundle, hooks: [{ ...other, id: 'smuggled', approval: { fingerprint: 'x' } }] })); await ui.submit('import');
  await ui.waitFor(() => ui.view.nodes(node => node.props['data-import-item'] === 'invalid').length === 1, 'invalid item');
  assert.equal(ui.buttons('Import')[0].props.disabled, true);
  assert.deepEqual(await ids(service), ['example', 'imported']);
});
