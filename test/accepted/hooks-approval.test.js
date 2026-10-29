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
async function openSettings(t, service, { language = 'en', intercept } = {}) {
  const source = await readFile(new URL('../../dist/client.js', import.meta.url), 'utf8');
  const sent = [];
  const harness = createBaselineHarness(source, { language, connection: { rpc: { async call(channel, method, payload) {
    if (method === 'majed/settings/status') return { ok: true, value: { module: 'hooks', enabled: false, state: 'disabled' } };
    const { action, ...input } = payload; sent.push({ action, input });
    return intercept?.(action, input) ?? service.call(action, input);
  } } } });
  t.after(() => harness.dispose()); harness.apply(); const view = harness.render('majed-hooks');
  const buttons = label => view.nodes(node => node.type === 'button' && node.props.children.includes(label));
  const text = () => view.nodes(() => true).flatMap(node => node.props.children.filter(child => typeof child === 'string')).join('\n');
  // Bounded wait: re-render and re-check at most 500 times (about one second) instead of a fixed sleep.
  const waitFor = async (predicate, what) => { for (let i = 0; i < 500; i += 1) { view.render(); if (predicate()) return; await new Promise(resolve => setTimeout(resolve, 2)); } assert.fail('timed out waiting for ' + what); };
  const click = async (label, index = 0) => { await waitFor(() => buttons(label).length > index, 'button ' + label); await buttons(label)[index].props.onClick(); view.render(); };
  const type = (name, value) => { view.one(node => node.props.name === name).props.onChange({ target: { value } }); view.render(); };
  const submit = async name => { await view.one(node => node.type === 'form' && node.props['data-approval-form'] === name).props.onSubmit({ preventDefault() {} }); view.render(); };
  return { harness, view, sent, buttons, text, waitFor, click, type, submit };
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

// H01 correction round: truthful enabled state, import byte bound through the UI, Arabic/RTL, accessibility, stale previews.
const enableDirect = async (service, id = 'example') => assert.equal((await service.call('setEnabled', { scope: 'user', id, enabled: true, revision: (await hookState(service, id)).revision })).ok, true);

test('an enabled hook whose Approval became invalid is shown as enabled-but-unapproved, never as a disabled draft', async t => {
  const root = await fixture(t); const service = await mount(t, root);
  await writeFile(join(root, 'watched.txt'), 'reviewed bytes');
  await service.call('save', { scope: 'user', hook: { ...hook, watchedFiles: ['watched.txt'] } }); await approveDirect(service); await enableDirect(service);
  assert.equal((await hookState(service)).state, 'active');
  await writeFile(join(root, 'watched.txt'), 'changed after review');
  // Route semantics are unchanged: the entry is still enabled, its state is the generic draft and its Approval is not valid.
  const listed = await hookState(service);
  assert.equal(listed.hook.enabled, true); assert.equal(listed.state, 'draft'); assert.equal(listed.approval.valid, false);
  const ui = await openSettings(t, service);
  await ui.waitFor(() => ui.view.nodes(node => node.props['data-hook-state']).length === 1, 'hook state');
  assert.equal(ui.view.one(node => node.props['data-hook-state']).props['data-hook-state'], 'enabled_invalid');
  assert.match(ui.text(), /Enabled, but its Approval is no longer valid: review required/);
  assert.doesNotMatch(ui.text(), /saved draft, disabled/);
  assert.equal(ui.buttons('Disable').length, 1);
});

test('Import through the UI refuses an oversize multibyte bundle by bytes and shows invalid JSON and malformed bundles specifically', async t => {
  const root = await fixture(t); const service = await mount(t, root);
  const ui = await openSettings(t, service);
  await ui.waitFor(() => ui.buttons('Preview import').length === 1, 'import form');
  // Invalid JSON is refused locally with its own message and no request is sent.
  const before = ui.sent.length;
  ui.type('bundle', '{not json'); await ui.submit('import');
  await ui.waitFor(() => /not valid JSON/.test(ui.text()), 'invalid JSON message');
  assert.equal(ui.sent.length, before); assert.equal(ui.view.nodes(node => node.props['data-import-item']).length, 0);
  // Five hooks of 2500 two-byte characters: fewer than 24576 characters, more than 24576 bytes, still inside the request body limit.
  const wide = { version: 1, kind: 'dsh-majed-hooks', hooks: Array.from({ length: 5 }, (_, index) => ({ ...hook, id: 'wide' + index, command: 'é'.repeat(2500) })) };
  const text = JSON.stringify(wide);
  assert.ok(text.length < 24576 && Buffer.byteLength(text) > 24576 && Buffer.byteLength(text) < 30000);
  ui.type('bundle', text); await ui.submit('import');
  await ui.waitFor(() => /bundle is too large/.test(ui.text()), 'too large message');
  assert.equal(ui.sent.at(-1).action, 'previewImport'); assert.equal(ui.view.nodes(node => node.props['data-import-item']).length, 0);
  assert.doesNotMatch(ui.text(), /not valid JSON/); assert.deepEqual(await ids(service), []);
  // A well-formed JSON text that is not a bundle gets the generic refusal, not the JSON or size message.
  ui.type('bundle', '{"a":1}'); await ui.submit('import');
  await ui.waitFor(() => /request is not valid/.test(ui.text()), 'invalid request message');
  assert.doesNotMatch(ui.text(), /too large|not valid JSON/);
});

test('the import preview is cleared whenever the list changes: refresh, save, duplicate, restore, purge, import and a failed or successful scope change', async t => {
  const root = await fixture(t);
  const header = { id: 'session-a', cwd: root }, workspace = { id: 'workspace-a', path: root, sessionIds: ['session-a'] };
  const service = await mount(t, root, { services: {
    sessions: { get(id) { return id === 'session-a' ? { header } : undefined; } }, sessionPersistence: { async stat() {} },
    workspaceRegistry: { get(id) { return id === 'workspace-a' ? workspace : undefined; }, list() { return [workspace]; } } } });
  await service.call('save', { scope: 'user', hook }); await service.call('save', { scope: 'user', hook: { ...hook, id: 'gone' } });
  await service.call('remove', { scope: 'user', id: 'gone', revision: (await hookState(service, 'gone')).revision });
  let failProject = false;
  const ui = await openSettings(t, service, { intercept: (action, input) => failProject && input.scope === 'project' ? { ok: false, error: { code: 'unavailable', message: 'unavailable', details: {} } } : undefined });
  await ui.waitFor(() => ui.buttons('Preview import').length === 1, 'import form');
  const bundle = JSON.stringify({ version: 1, kind: 'dsh-majed-hooks', hooks: [{ ...hook, id: 'fresh' }] });
  const preview = async () => { ui.type('bundle', bundle); await ui.submit('import'); await ui.waitFor(() => ui.view.nodes(node => node['props']['data-approval-preview'] !== undefined).length === 1, 'preview'); };
  const cleared = async what => ui.waitFor(() => ui.view.nodes(node => node.props['data-approval-preview'] !== undefined).length === 0, 'preview cleared by ' + what);
  await preview(); await ui.click('Refresh saved commands'); await cleared('refresh');
  await preview(); await ui.click('Duplicate'); ui.type('newId', 'copy'); await ui.submit('duplicate'); await cleared('duplicate');
  await preview(); await ui.click('Restore'); await cleared('restore');
  await preview(); await ui.click('Remove command', 0); await ui.waitFor(() => ui.buttons('Purge').length > 0, 'trash'); await cleared('remove');
  await preview(); await ui.click('Purge'); await ui.click('Confirm permanent delete'); await cleared('purge');
  await preview(); ui.type('id', 'edited'); ui.type('command', 'printf edited'); await ui.submit('definition'); await cleared('save');
  // Scope change: the preview is cleared and, when the new list fails, the old scope's hooks and trash are not left on screen.
  const scope = value => ui.view.one(node => node.props.name === 'scope').props.onChange({ target: { value } });
  const project = JSON.stringify(['session-a', 'workspace-a']);
  await ui.waitFor(() => ui.view.one(node => node.props.name === 'scope').props.children.flat(Infinity).filter(node => node.type === 'option').length === 2, 'scope options');
  await preview(); failProject = true; scope(project);
  await ui.waitFor(() => /request was refused/.test(ui.text()), 'scope change failure');
  assert.equal(ui.view.nodes(node => node.props['data-approval-preview'] !== undefined).length, 0);
  assert.equal(ui.view.nodes(node => node.props['data-hook-state']).length, 0); assert.doesNotMatch(ui.text(), /printf hello|example/);
  assert.equal(ui.buttons('Duplicate').length, 0); assert.equal(ui.buttons('Remove command').length, 0);
  // A later successful scope change recovers.
  failProject = false; await ui.click('Refresh saved commands');
  await ui.waitFor(() => !/request was refused/.test(ui.text()), 'recovered');
});

const sectionOf = ui => ui.view.one(node => node.props['data-majed-approval'] !== undefined);
const labelled = (ui, label) => ui.view.nodes(node => node.type === 'button' && node.props['aria-label'] === label);

test('Arabic renders the translated state strings and buttons, with RTL on the panel and an explicitly LTR JSON text area', async t => {
  const root = await fixture(t); const service = await mount(t, root);
  await writeFile(join(root, 'watched.txt'), 'reviewed bytes');
  await service.call('save', { scope: 'user', hook: { ...hook, watchedFiles: ['watched.txt'] } });
  await service.call('save', { scope: 'user', hook: { ...hook, id: 'second' } });
  await service.call('save', { scope: 'user', hook: { ...hook, id: 'third' } });
  await service.call('remove', { scope: 'user', id: 'third', revision: (await hookState(service, 'third')).revision });
  await approveDirect(service, 'second');
  const ui = await openSettings(t, service, { language: 'ar' });
  await ui.waitFor(() => ui.buttons('تكرار').length === 2, 'Arabic row buttons');
  assert.equal(sectionOf(ui).props.dir, 'rtl'); assert.equal(sectionOf(ui).props['aria-label'], 'الموافقة على أوامر الخطافات');
  const statesNow = () => ui.view.nodes(node => node.props['data-hook-state']).map(node => node.props['data-hook-state'] + '=' + node.props.children.join(''));
  assert.deepEqual(statesNow().sort(), ['draft=يحتاج إلى مراجعة (مسودة محفوظة، معطلة)', 'approved=تمت الموافقة (معطل)', 'trashed=في المحذوفات (معطل، غير موافق عليه)'].sort());
  for (const label of ['تعديل الأمر', 'مراجعة الأمر', 'إلغاء الموافقة', 'إزالة الأمر', 'تفعيل', 'تكرار', 'استعادة', 'حذف نهائي', 'تصدير الخطافات', 'معاينة الاستيراد']) assert.ok(ui.buttons(label).length > 0, 'Arabic button ' + label);
  assert.match(ui.text(), /لا ينفّذ أي شيء بهذه الأدوات/);
  // Enabled state, enabled-but-invalid state and Disable in Arabic.
  await enableDirect(service, 'second'); await ui.click('تحديث الأوامر المحفوظة');
  await ui.waitFor(() => ui.text().includes('تمت الموافقة ومفعّل (التنفيذ ما زال غير متاح)'), 'Arabic active state'); assert.ok(ui.buttons('تعطيل').length > 0);
  // Export text area: JSON stays left-to-right inside the right-to-left panel.
  await ui.click('تصدير الخطافات'); await ui.waitFor(() => ui.view.nodes(node => node.props.name === 'exported').length === 1, 'Arabic export');
  assert.equal(ui.view.one(node => node.props.name === 'exported').props.dir, 'ltr'); assert.equal(ui.view.one(node => node.props.name === 'bundle').props.dir, 'ltr');
  assert.equal(ui.view.one(node => node.props.name === 'exported').props['aria-label'], 'التعريفات المصدّرة (دون موافقة أو مراجعة أو قيم بيئة)');
  // Specific Arabic refusal messages: invalid JSON, bundle too large, stale revision.
  ui.type('bundle', '{x'); await ui.submit('import'); await ui.waitFor(() => ui.text().includes('النص الملصق ليس JSON صالحًا.'), 'Arabic invalid JSON');
  ui.type('bundle', JSON.stringify({ version: 1, kind: 'dsh-majed-hooks', hooks: Array.from({ length: 5 }, (_, index) => ({ ...hook, id: 'w' + index, command: 'é'.repeat(2500) })) })); await ui.submit('import');
  await ui.waitFor(() => ui.text().includes('رُفض: الحزمة أكبر من أن تُصدَّر أو تُستورد.'), 'Arabic too large');
  // The enabled-but-invalid state in Arabic: change the watched file of the enabled hook after review.
  await service.call('save', { scope: 'user', hook: { ...hook, id: 'watched', watchedFiles: ['watched.txt'] } }); await approveDirect(service, 'watched'); await enableDirect(service, 'watched');
  await writeFile(join(root, 'watched.txt'), 'changed'); await ui.click('تحديث الأوامر المحفوظة');
  await ui.waitFor(() => ui.text().includes('مفعّل، لكن موافقته لم تعد صالحة: المراجعة مطلوبة (التنفيذ غير متاح)'), 'Arabic enabled_invalid');
});

test('every per-row button names its hook, the duplicate form submit differs from the row button, and the purge dialog is named and moves and returns focus', async t => {
  const root = await fixture(t); const service = await mount(t, root);
  await service.call('save', { scope: 'user', hook }); await service.call('save', { scope: 'user', hook: { ...hook, id: 'second' } });
  await service.call('save', { scope: 'user', hook: { ...hook, id: 'gone' } });
  await service.call('remove', { scope: 'user', id: 'gone', revision: (await hookState(service, 'gone')).revision });
  const ui = await openSettings(t, service);
  await ui.waitFor(() => ui.buttons('Duplicate').length === 2, 'rows');
  for (const id of ['example', 'second']) {
    for (const label of ['Edit command', 'Review command', 'Revoke Approval', 'Remove command', 'Enable', 'Duplicate']) assert.equal(labelled(ui, label + ': ' + id).length, 1, label + ' names ' + id);
  }
  for (const label of ['Restore', 'Purge']) assert.equal(labelled(ui, label + ': gone').length, 1, label + ' names gone');
  // Every visible per-row button in the hook rows and trash has an accessible subject; only the global buttons may be unnamed.
  const unnamed = ui.view.nodes(node => node.type === 'button' && !node.props['aria-label']).map(node => node.props.children.join(''));
  assert.deepEqual(unnamed.sort(), ['Export hooks', 'Preview import', 'Refresh saved commands', 'Refresh status', 'Save command']);
  // The duplicate form submit is a different control from the row button, with a distinct accessible name.
  await ui.click('Duplicate', 0);
  const submitButton = ui.view.one(node => node.type === 'button' && node.props.type === 'submit' && node.props['aria-label']?.startsWith('Create copy'));
  assert.equal(submitButton.props['aria-label'], 'Create copy: example'); assert.notEqual(submitButton.props['aria-label'], 'Duplicate: example');
  assert.equal(labelled(ui, 'Duplicate: example').length, 1);
  // The purge confirmation is an alertdialog with an accessible name and description; focus moves to its safe control and returns.
  const purge = labelled(ui, 'Purge: gone')[0]; const purgeElement = ui.view.elementOf(purge);
  assert.ok(purgeElement, 'Purge trigger has a ref');
  await ui.click('Purge');
  const dialog = ui.view.one(node => node.props.role === 'alertdialog');
  assert.equal(dialog.props['aria-label'], 'Confirm permanent delete: gone');
  assert.ok(ui.view.nodes(node => node.props.id === dialog.props['aria-describedby']).length === 1, 'description exists');
  const keep = labelled(ui, 'Keep in trash: gone')[0]; assert.ok(keep); assert.equal(labelled(ui, 'Confirm permanent delete: gone').filter(node => node.type === 'button').length, 1);
  assert.equal(ui.harness.document.activeElement, ui.view.elementOf(keep), 'focus moves into the dialog');
  await ui.click('Keep in trash');
  assert.equal(ui.view.nodes(node => node.props.role === 'alertdialog').length, 0);
  assert.equal(ui.harness.document.activeElement, ui.view.elementOf(labelled(ui, 'Purge: gone')[0]), 'focus returns to the Purge control');
});
