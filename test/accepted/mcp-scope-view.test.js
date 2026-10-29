// Combined read-only scope view for managed MCP definitions (#97, stays PARTIAL).
// Production Fetch route, native-shaped project services and local stdio fixtures only.
// The view applies this plugin's own documented rule; it never claims native tool-name resolution.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, realpath, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { Context } from '@deepseek-ai/cordis';
import { ToolRegistry } from '@deepseek-ai/dsh-tools';
import { apply } from '../../index.js';
import { createBaselineHarness } from './helpers/baseline-client-harness.js';

const fixture = fileURLToPath(new URL('../fixtures/mcp-stdio.cjs', import.meta.url));

async function mount(t, names = ['alpha', 'beta']) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'majed-mcp-scope-')));
  const dirs = {};
  for (const name of names) { dirs[name] = join(root, name); await mkdir(dirs[name]); dirs[name] = await realpath(dirs[name]); }
  const sessions = new Map(names.map(name => [name, { header: { id: 'session-' + name, cwd: dirs[name] } }]));
  const workspaces = new Map(names.map(name => [name, { id: 'workspace-' + name, path: dirs[name], sessionIds: ['session-' + name] }]));
  const ctx = new Context(); let route;
  ctx.provide('systemPrompt', { tools() {}, section() {} });
  new ToolRegistry(ctx, {});
  ctx.provide('sessions', { get: id => sessions.get(id.replace('session-', '')) });
  ctx.provide('sessionPersistence', { async stat() {} });
  ctx.provide('workspaceRegistry', { get: id => workspaces.get(id.replace('workspace-', '')), list: () => [...workspaces.values()] });
  ctx.provide('connection', { fetch: { register(value) { if (value.path === '/api/majed/mcp') route = value; } } });
  ctx.provide('loader', { import: name => import(name) });
  const fiber = ctx.plugin({ apply: context => apply(context, { managedMcp: { enabled: true, standaloneDisabled: true, stateDirectory: join(root, 'state'), userDirectory: root } }) });
  await fiber;
  t.after(async () => { await fiber.dispose(); await ctx.fiber.dispose(); await rm(root, { recursive: true, force: true }); });
  const post = async payload => {
    const response = await route.fetch(new Request('http://fixture/api/majed/mcp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'client-request', rpcId: 'view-1', method: 'majed/mcp', payload }) }));
    return (await response.json()).result;
  };
  const select = name => ({ scope: 'project', sessionId: 'session-' + name, workspaceId: 'workspace-' + name });
  const call = (action, input = {}) => post({ action, scope: 'global', ...input });
  const project = (name, action, input = {}) => post({ action, ...select(name), ...input });
  const stdio = (name, extra = {}) => ({ serverName: name, transport: 'stdio', command: process.execPath, args: [fixture, join(root, name + '.jsonl'), name], reconnect: { enabled: false }, ...extra });
  const stored = async () => JSON.parse(await readFile(join(root, 'state', 'global.json'), 'utf8'));
  return { root, dirs, ctx, call, project, post, select, stdio, stored };
}

test('same server name in both scopes is a conflict with both entries visible', async t => {
  const { call, project, stdio, dirs } = await mount(t);
  const first = await call('save', { server: stdio('shared') });
  assert.equal(first.ok, true, JSON.stringify(first));
  const second = await project('alpha', 'save', { server: { ...stdio('shared'), cwd: dirs.alpha } });
  assert.equal(second.ok, true, JSON.stringify(second));
  const view = await project('alpha', 'scopeView');
  assert.equal(view.ok, true, JSON.stringify(view));
  assert.equal(view.value.resolution, 'plugin-view-only');
  const row = view.value.names.find(value => value.serverName === 'shared');
  assert.equal(row.conflict, true);
  assert.deepEqual(row.entries.map(entry => entry.scope), ['global', 'project']);
});

test('shadow, fallback and disabled flags follow the documented plugin rule and disclaim native guarantees', async t => {
  const { call, project, stdio, dirs } = await mount(t);
  await call('save', { server: stdio('shared') });
  const saved = await project('alpha', 'save', { server: { ...stdio('shared'), cwd: dirs.alpha } });
  const entry = view => view.value.names.find(value => value.serverName === 'shared');
  let view = await project('alpha', 'scopeView');
  assert.equal(view.value.rule, 'project-overrides-global-within-project');
  assert.equal(view.value.nativeGuarantee, false);
  assert.deepEqual(entry(view).entries.map(value => [value.scope, value.enabled, value.shadowed]), [['global', false, false], ['project', false, false]]);
  assert.equal(entry(view).effective, null, 'disabled entries select nothing');
  const enabled = await project('alpha', 'setEnabled', { serverName: 'shared', enabled: true, revision: saved.value.revision });
  assert.equal(enabled.ok, true, JSON.stringify(enabled));
  view = await project('alpha', 'scopeView');
  assert.equal(entry(view).effective, 'project');
  assert.deepEqual(entry(view).entries.map(value => [value.scope, value.shadowed, value.fallback]), [['global', true, false], ['project', false, false]]);
  await project('alpha', 'setEnabled', { serverName: 'shared', enabled: false, revision: enabled.value.revision });
  view = await project('alpha', 'scopeView');
  assert.deepEqual(entry(view).entries.map(value => [value.scope, value.shadowed, value.fallback]), [['global', false, true], ['project', false, false]]);
});

test('credential values never appear in the view and entry revisions equal the per-scope list revisions', async t => {
  const { call, project, stdio, dirs } = await mount(t);
  const globalSaved = await call('save', { server: { ...stdio('secret'), env: { TOKEN: 'global-fixture-secret' } } });
  const projectSaved = await project('alpha', 'save', { server: { ...stdio('secret'), cwd: dirs.alpha, env: { TOKEN: 'project-fixture-secret' } } });
  const view = await project('alpha', 'scopeView');
  const text = JSON.stringify(view);
  assert.equal(text.includes('global-fixture-secret') || text.includes('project-fixture-secret'), false);
  const entries = view.value.names.find(value => value.serverName === 'secret').entries;
  assert.deepEqual(entries.map(value => value.env), [{ TOKEN: '***' }, { TOKEN: '***' }]);
  assert.deepEqual(entries.map(value => value.revision), [globalSaved.value.revision, projectSaved.value.revision]);
});

test('viewing never changes revisions, so a revision held before the view still fences edits', async t => {
  const { call, project, stdio, stored } = await mount(t);
  const saved = await call('save', { server: stdio('fenced') });
  const before = JSON.stringify(await stored());
  await call('scopeView'); await project('alpha', 'scopeView');
  assert.equal(JSON.stringify(await stored()), before, 'the view writes nothing');
  const enabled = await call('setEnabled', { serverName: 'fenced', enabled: true, revision: saved.value.revision });
  assert.equal(enabled.ok, true, JSON.stringify(enabled));
  const stale = await call('setEnabled', { serverName: 'fenced', enabled: false, revision: saved.value.revision });
  assert.deepEqual([stale.ok, stale.error?.code], [false, 'stale_revision']);
});

test('unknown, mixed or forged scopes are refused and another project is never exposed', async t => {
  const { call, project, post, select, stdio, dirs } = await mount(t);
  await project('alpha', 'save', { server: { ...stdio('only-alpha'), cwd: dirs.alpha } });
  await project('beta', 'save', { server: { ...stdio('only-beta'), cwd: dirs.beta } });
  const code = result => [result.ok, result.error?.code];
  assert.deepEqual(code(await post({ action: 'scopeView', scope: 'team' })), [false, 'invalid_scope']);
  assert.deepEqual(code(await post({ action: 'scopeView', scope: 'global', sessionId: 'session-alpha', workspaceId: 'workspace-alpha' })), [false, 'invalid_scope']);
  assert.deepEqual(code(await post({ action: 'scopeView', ...select('alpha'), workspaceId: 'workspace-beta' })), [false, 'invalid_scope']);
  assert.deepEqual(code(await post({ action: 'scopeView', scope: 'project', sessionId: 'session-ghost', workspaceId: 'workspace-ghost' })), [false, 'invalid_scope']);
  // Existing route contract: unknown payload keys are refused as the generic 'unavailable' code (InputError carries no code).
  assert.deepEqual(code(await post({ action: 'scopeView', scope: 'global', extra: true })), [false, 'unavailable']);
  const view = await project('alpha', 'scopeView');
  assert.deepEqual(view.value.names.map(value => value.serverName), ['only-alpha']);
  assert.equal(JSON.stringify(view).includes('only-beta'), false);
  assert.deepEqual((await call('scopeView')).value.names, [], 'global view lists no project entries');
});

test('the view is compact: no argument values or URL queries, and the response stays bounded at the store limits', async t => {
  const { root, call, stdio, post } = await mount(t);
  await call('save', { server: { ...stdio('leaky'), args: ['--token=arg-fixture-secret'] } });
  await call('save', { server: { serverName: 'remote', transport: 'streamable-http', url: 'http://127.0.0.1:9/mcp?key=query-fixture-secret', reconnect: { enabled: false } } });
  const compact = JSON.stringify(await call('scopeView'));
  assert.equal(compact.includes('arg-fixture-secret') || compact.includes('query-fixture-secret'), false);
  const names = (await call('scopeView')).value.names;
  assert.equal(names.find(value => value.serverName === 'leaky').entries[0].argCount, 1);
  assert.equal(names.find(value => value.serverName === 'remote').entries[0].url, 'http://127.0.0.1:9/mcp');
  // A near-cap store (262144-byte limit, 32 servers): the compact view must still fit one 65536-byte route body.
  const { writeFile, mkdir } = await import('node:fs/promises');
  await mkdir(join(root, 'state'), { recursive: true });
  const heavy = scope => Array.from({ length: 32 }, (_, index) => ({ serverName: scope + '-' + index, scope, enabled: false, transport: 'stdio', command: 'x'.repeat(1024), args: Array.from({ length: 3 }, () => 'a'.repeat(1900)), cwd: 'c'.repeat(200), reconnect: { enabled: false } }));
  await writeFile(join(root, 'state', 'global.json'), JSON.stringify({ servers: heavy('global') }));
  const view = await post({ action: 'scopeView', scope: 'global' });
  assert.equal(view.ok, true, JSON.stringify(view).slice(0, 200));
  assert.ok(JSON.stringify(view).length < 65536, 'compact view of a full store fits one route body: ' + JSON.stringify(view).length);
});

test('two full scopes with maximum-size definitions still fit one bounded response', async t => {
  const { root, dirs, post, select } = await mount(t);
  const { writeFile, mkdir } = await import('node:fs/promises');
  const { createHash } = await import('node:crypto');
  await mkdir(join(root, 'state'), { recursive: true });
  const heavy = scope => Array.from({ length: 32 }, (_, index) => ({ serverName: scope + '-' + index, scope, enabled: false, transport: 'stdio', command: 'x'.repeat(1024), args: ['a'], cwd: 'c'.repeat(200), reconnect: { enabled: false } }));
  await writeFile(join(root, 'state', 'global.json'), JSON.stringify({ servers: heavy('global') }));
  await writeFile(join(root, 'state', 'project-' + createHash('sha256').update(dirs.alpha).digest('hex') + '.json'), JSON.stringify({ servers: heavy('project') }));
  const view = await post({ action: 'scopeView', ...select('alpha') });
  assert.equal(view.ok, true, JSON.stringify(view).slice(0, 200));
  const size = Buffer.byteLength(JSON.stringify(view));
  assert.ok(size < 65536, 'two full scopes must fit one 65536-byte body, got ' + size);
  assert.equal(view.value.names.length, 64);
});

test('long remote URLs are clipped so the bounded response holds for http definitions too', async t => {
  const { root, post } = await mount(t);
  const { writeFile, mkdir } = await import('node:fs/promises');
  await mkdir(join(root, 'state'), { recursive: true });
  const rows = Array.from({ length: 32 }, (_, index) => ({ serverName: 'remote-' + index, scope: 'global', enabled: false, transport: 'streamable-http', url: 'http://127.0.0.1:9/' + 'p'.repeat(4000), reconnect: { enabled: false } }));
  await writeFile(join(root, 'state', 'global.json'), JSON.stringify({ servers: rows }));
  const view = await post({ action: 'scopeView', scope: 'global' });
  assert.equal(view.ok, true, JSON.stringify(view).slice(0, 200));
  const size = Buffer.byteLength(JSON.stringify(view));
  assert.ok(size < 65536 / 2, 'one full http scope must leave room for a second one, got ' + size);
});

// UI: the built client renders the combined view with exact guarantee wording (no browser; virtual tree fixtures).
const source = await readFile(new URL('../../dist/client.js', import.meta.url), 'utf8');
const listed = { ok: true, value: { enabled: true, runtime: 'native', scope: 'global', revision: 'rev', contexts: [{ sessionId: 'session-alpha', workspaceId: 'workspace-alpha', label: '/work/alpha' }], servers: [] } };
const viewed = { ok: true, value: { enabled: true, runtime: 'native', scope: 'project', resolution: 'plugin-view-only', rule: 'project-overrides-global-within-project', nativeGuarantee: false, names: [
  { serverName: 'shared', conflict: true, effective: 'project', entries: [{ scope: 'global', enabled: true, shadowed: true, fallback: false, transport: 'stdio', revision: 'a' }, { scope: 'project', enabled: true, shadowed: false, fallback: false, transport: 'stdio', revision: 'b' }] },
  { serverName: 'solo', conflict: false, effective: null, entries: [{ scope: 'global', enabled: false, shadowed: false, fallback: false, transport: 'stdio', revision: 'a' }] }] } };

function mountPanel(t, language, calls) {
  const harness = createBaselineHarness(source, { language, connection: { rpc: { async call(channel, method, payload) { calls.push(payload); return payload.action === 'scopeView' ? viewed : listed; } } } });
  t.after(() => harness.dispose()); harness.apply();
  const view = harness.render('majed-mcp');
  const waitFor = async (predicate, what) => { for (let i = 0; i < 500; i += 1) { view.render(); if (predicate()) return; await new Promise(resolve => setTimeout(resolve, 2)); } assert.fail('timed out waiting for ' + what); };
  const text = () => JSON.stringify(view.nodes(() => true).map(node => node.props.children).flat(Infinity).filter(child => typeof child === 'string'));
  return { view, waitFor, text };
}

test('UI shows a Scopes toggle that renders the conflict and states exactly what is not guaranteed', async t => {
  const calls = []; const { view, waitFor, text } = mountPanel(t, 'en', calls);
  const toggle = () => view.nodes(node => node.type === 'button' && node.props['aria-expanded'] !== undefined)[0];
  await waitFor(() => toggle(), 'Scopes toggle');
  assert.equal(toggle().props['aria-expanded'], false);
  await toggle().props.onClick(); await waitFor(() => view.nodes(node => node.props['data-mcp-scopes'] !== undefined).length === 1, 'scopes section');
  assert.equal(toggle().props['aria-expanded'], true);
  assert.deepEqual(calls.filter(payload => payload.action === 'scopeView').map(payload => [payload.scope, payload.revision]), [['global', undefined]], 'view call sends no revision');
  await waitFor(() => view.nodes(node => node.props['data-mcp-conflict'] === 'shared').length === 1, 'conflict row');
  const conflict = view.one(node => node.props['data-mcp-conflict'] === 'shared');
  assert.equal(conflict.props.role, 'group');
  assert.match(conflict.props['aria-label'], /shared.*conflict/i);
  assert.equal(view.nodes(node => node.props['data-mcp-conflict'] === 'solo').length, 0);
  assert.match(text(), /not a guarantee of which server or tool the agent uses/);
  assert.match(text(), /plugin rule/i);
});

test('UI renders the Arabic wording and accessible names for the same combined view', async t => {
  const calls = []; const { view, waitFor, text } = mountPanel(t, 'ar', calls);
  await waitFor(() => view.nodes(node => node.type === 'button' && node.props['aria-expanded'] !== undefined).length === 1, 'Scopes toggle');
  await view.nodes(node => node.type === 'button' && node.props['aria-expanded'] !== undefined)[0].props.onClick();
  await waitFor(() => view.nodes(node => node.props['data-mcp-conflict'] === 'shared').length === 1, 'conflict row');
  assert.match(view.one(node => node.props['data-mcp-conflict'] === 'shared').props['aria-label'], /shared: تعارض/);
  assert.match(text(), /ليست ضمانًا لأي خادم أو أداة/);
  assert.equal(view.one(node => node.props['data-mcp-scopes'] !== undefined).props['aria-label'], 'عرض النطاقات المجمّع');
});

test('UI shows the existing alert and no stale view when the scope view is refused', async t => {
  const refused = { ok: false, error: { code: 'invalid_scope' } };
  const harness = createBaselineHarness(source, { connection: { rpc: { async call(channel, method, payload) { return payload.action === 'scopeView' ? refused : listed; } } } });
  t.after(() => harness.dispose()); harness.apply();
  const view = harness.render('majed-mcp');
  const waitFor = async (predicate, what) => { for (let i = 0; i < 500; i += 1) { view.render(); if (predicate()) return; await new Promise(resolve => setTimeout(resolve, 2)); } assert.fail('timed out waiting for ' + what); };
  await waitFor(() => view.nodes(node => node.props['aria-expanded'] !== undefined).length === 1, 'toggle');
  await view.one(node => node.props['aria-expanded'] !== undefined).props.onClick();
  await waitFor(() => view.nodes(node => node.props.role === 'alert').length === 1, 'alert');
  assert.equal(view.nodes(node => node.props['data-mcp-conflict'] !== undefined).length, 0);
});
