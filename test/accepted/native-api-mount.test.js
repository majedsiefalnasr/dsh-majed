import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, writeFile, stat } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Context } from '@deepseek-ai/cordis';
import { apply } from '../../index.js';
import { createBaselineHarness } from './helpers/baseline-client-harness.js';

// S15 mount slice. CONTROLLED FIXTURES ONLY: a fake native LLM service (listProviders/listModels/
// resolveModelInfo) that deliberately carries credential-looking extras, and a fake Connection whose
// fetch.register records the route. Native BrowserAuth + Owner admission is host-owned and is NOT
// simulated by the handler tests; the production service code is the real apply() from index.js.
const SECRET = 'sk-test-SECRET-0123456789';
const PATH = '/api/majed/native-api';
const METHOD = 'majed/native-api';

function fakeLlm(initial) {
  const state = new Map(Object.entries(initial));
  const calls = { listProviders: 0, registerAdapter: 0 };
  const llm = {
    registerAdapter() { calls.registerAdapter += 1; throw new Error('registerAdapter must not be called'); },
    listProviders() { calls.listProviders += 1; return [...state].map(([id, p]) => ({ id, name: p.name, apiKey: SECRET, baseUrl: `https://${SECRET}.example/v1` })); },
    async listModels(provider) {
      return state.get(provider).models.map(m => ({ provider, id: m.id, name: m.name ?? m.id, apiKey: SECRET, endpoint: 'https://internal.example/v1' }));
    },
    async resolveModelInfo(provider, model) {
      const found = state.get(provider)?.models.find(m => m.id === model);
      if (!found) throw new Error(`unknown ${provider}/${model} ${SECRET}`);
      return { provider, id: model, name: found.name ?? model, headers: { authorization: SECRET } };
    },
  };
  return { llm, state, calls };
}
const catalog = () => ({
  codex: { name: 'Codex', models: [{ id: 'gpt-5' }] },
  acme: { name: 'Acme API', models: [{ id: 'acme-text', name: 'Acme Text' }, { id: 'acme-mini' }] },
  visio: { name: 'Visio API', models: [{ id: 'visio-1' }] },
});

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'majed-native-api-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return { root, path: join(root, 'state', 'native-api-preferences.json') };
}

async function mount(t, { path, fake = fakeLlm(catalog()), llm = fake?.llm, root } = {}) {
  const ctx = new Context(); let route; const live = { registered: 0, unregistered: 0 };
  ctx.provide('connection', { fetch: { register(value) { if (value.path !== PATH) return; route = value; live.registered += 1; return () => { live.unregistered += 1; }; } } });
  if (llm) ctx.provide('llm', llm);
  const fiber = ctx.plugin({ apply(c) { apply(c, { nativeApi: { path } }); } }); await fiber;
  t.after(() => fiber.dispose());
  const send = (payload, init = {}) => route.fetch(new Request('http://fixture' + PATH, {
    method: 'POST', headers: { 'content-type': 'application/json', ...init.headers },
    body: JSON.stringify({ type: 'client-request', rpcId: 'r1', method: METHOD, payload }), ...init.request,
  }));
  const call = async (payload, init) => { const response = await send(payload, init); const text = await response.text(); return { response, text, body: JSON.parse(text) }; };
  return { ctx, route, fake, call, send, fiber, live, dispose: () => fiber.dispose() };
}

test('mounted route is the exact Owner-seam registration and a snapshot lists eligible native references with no credential material', async t => {
  const { path } = await fixture(t);
  const { route, call } = await mount(t, { path });
  assert.equal(route.path, PATH); assert.deepEqual(route.methods, ['POST']); assert.equal(route.requestBody, 'streaming');
  const { response, text, body } = await call({ action: 'snapshot' });
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  const value = body.result.value;
  assert.equal(value.state, 'ready'); assert.equal(value.store, 'ok');
  assert.deepEqual(value.references.map(r => [r.provider, r.model, r.name, r.visible, r.default, r.available]),
    [['acme', 'acme-text', 'Acme Text', true, false, true], ['acme', 'acme-mini', 'acme-mini', true, false, true], ['visio', 'visio-1', 'visio-1', true, false, true]]);
  assert.equal(value.references[0].providerName, 'Acme API');
  assert.deepEqual(value.unavailable, []);
  assert.ok(!value.references.some(r => r.provider === 'codex'), 'subscription ids are not native API references');
  for (const forbidden of [SECRET, 'apiKey', 'baseUrl', 'endpoint', 'https://', 'authorization', 'headers']) assert.ok(!text.includes(forbidden), 'response leaks ' + forbidden);
  assert.deepEqual(Object.keys(value.references[0]).sort(), ['available', 'default', 'model', 'name', 'provider', 'providerName', 'visible']);
});

test('requests are bounded and exact: spoofed identity headers grant nothing, malformed bodies and methods are refused', async t => {
  const { path } = await fixture(t);
  const { route, call, send } = await mount(t, { path });
  // Admission is performed by the host before delivery; headers can never widen what the handler does.
  const spoofed = await call({ action: 'snapshot' }, { headers: { origin: 'http://evil.example', 'x-original-origin': 'local', authorization: 'Bearer ' + SECRET, cookie: 'owner=1' } });
  assert.equal(spoofed.body.result.ok, true); assert.ok(!spoofed.text.includes(SECRET));
  const code = result => result.body.result?.error?.code;
  assert.equal(code(await call({ action: 'wipe' })), 'invalid_request');
  assert.equal(code(await call({ action: 'snapshot', extra: 1 })), 'invalid_request');
  assert.equal(code(await call('snapshot')), 'invalid_request');
  assert.equal((await route.fetch(new Request('http://fixture' + PATH, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: '{}' }))).status, 415);
  assert.equal((await route.fetch(new Request('http://fixture' + PATH, { method: 'POST', headers: { 'content-type': 'application/json' }, body: 'x'.repeat(5000) }))).status, 413);
  assert.equal((await route.fetch(new Request('http://fixture' + PATH, { method: 'GET' }))).status, 405);
  assert.equal((await route.fetch(new Request('http://fixture/api/majed/other', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }))).status, 404);
  const wrongMethod = await send({ action: 'snapshot' }, { request: { body: JSON.stringify({ type: 'client-request', rpcId: 'r1', method: 'majed/other', payload: { action: 'snapshot' } }) } });
  assert.equal(wrongMethod.status, 400);
});

test('an unavailable or incomplete native LLM service degrades honestly without throwing', async t => {
  const { path } = await fixture(t);
  const none = await mount(t, { path, fake: null, llm: null });
  const value = (await none.call({ action: 'snapshot' })).body.result.value;
  assert.deepEqual([value.state, value.references, value.unavailable], ['unavailable', [], []]);
  const partial = await mount(t, { path, fake: null, llm: { listProviders: () => [] } });
  assert.equal((await partial.call({ action: 'snapshot' })).body.result.value.state, 'unavailable');
  const refused = await none.call({ action: 'setPreference', provider: 'acme', model: 'acme-text', visible: false });
  assert.equal(refused.body.result.error.code, 'llm_unavailable');
});

test('a preference is persisted privately and survives a fresh service over the same store (restart)', async t => {
  const { path } = await fixture(t);
  const first = await mount(t, { path });
  const set = await first.call({ action: 'setPreference', provider: 'acme', model: 'acme-text', alias: '  Fast text  ', visible: true, default: true });
  assert.equal(set.body.result.ok, true);
  const row = set.body.result.value.references.find(r => r.model === 'acme-text');
  assert.deepEqual([row.alias, row.default, row.visible], ['Fast text', true, true]);
  assert.equal((await stat(path)).mode & 0o777, 0o600);
  const raw = await readFile(path, 'utf8');
  assert.deepEqual(JSON.parse(raw), { version: 1, preferences: [{ provider: 'acme', model: 'acme-text', alias: 'Fast text', visible: true, default: true }] });
  for (const forbidden of [SECRET, 'apiKey', 'baseUrl', 'endpoint', 'https://']) assert.ok(!raw.includes(forbidden));
  first.dispose();
  const second = await mount(t, { path });
  const again = (await second.call({ action: 'snapshot' })).body.result.value.references.find(r => r.model === 'acme-text');
  assert.deepEqual([again.alias, again.default], ['Fast text', true]);
  // a second default moves the default; clearing removes the entry; both persist
  const moved = await second.call({ action: 'setPreference', provider: 'visio', model: 'visio-1', default: true });
  assert.deepEqual(moved.body.result.value.references.filter(r => r.default).map(r => r.model), ['visio-1']);
  const cleared = await second.call({ action: 'clearPreference', provider: 'acme', model: 'acme-text' });
  assert.equal(cleared.body.result.value.references.find(r => r.model === 'acme-text').alias, undefined);
  assert.deepEqual(JSON.parse(await readFile(path, 'utf8')).preferences.map(p => p.model), ['visio-1']);
  const unknown = await second.call({ action: 'setPreference', provider: 'acme', model: 'ghost', visible: false });
  assert.equal(unknown.body.result.error.code, 'unknown_reference');
  const bad = await second.call({ action: 'setPreference', provider: 'acme', model: 'acme-text', alias: 'x'.repeat(65) });
  assert.equal(bad.body.result.error.code, 'invalid_request');
});

test('a removed native model shows unavailable, keeps its preference and is never substituted', async t => {
  const { path } = await fixture(t);
  const fake = fakeLlm(catalog());
  const m = await mount(t, { path, fake });
  await m.call({ action: 'setPreference', provider: 'acme', model: 'acme-text', alias: 'Keep', default: true });
  fake.state.get('acme').models = fake.state.get('acme').models.filter(x => x.id !== 'acme-text');
  let value = (await m.call({ action: 'snapshot' })).body.result.value;
  assert.deepEqual(value.unavailable.map(u => [u.provider, u.model, u.alias, u.default, u.available, u.reason]), [['acme', 'acme-text', 'Keep', true, false, 'model-removed']]);
  assert.ok(!value.references.some(r => r.default), 'default is not handed to another model');
  fake.state.delete('acme');
  value = (await m.call({ action: 'snapshot' })).body.result.value;
  assert.equal(value.unavailable[0].reason, 'provider-removed');
  fake.state.set('acme', { name: 'Acme API', models: [{ id: 'acme-text', name: 'Acme Text' }] });
  value = (await m.call({ action: 'snapshot' })).body.result.value;
  assert.deepEqual([value.unavailable.length, value.references.find(r => r.model === 'acme-text').alias], [0, 'Keep']);
});

test('a corrupt or unsafe store reads as safe empty with an explicit status and is not overwritten', async t => {
  const { root, path } = await fixture(t);
  const { mkdir, chmod } = await import('node:fs/promises');
  await mkdir(join(root, 'state'), { recursive: true });
  await writeFile(path, '{not json', { mode: 0o600 });
  const m = await mount(t, { path });
  let value = (await m.call({ action: 'snapshot' })).body.result.value;
  assert.deepEqual([value.state, value.store, value.references.length], ['ready', 'corrupt', 3]);
  const refused = await m.call({ action: 'setPreference', provider: 'acme', model: 'acme-text', visible: false });
  assert.equal(refused.body.result.error.code, 'store_corrupt');
  assert.equal(await readFile(path, 'utf8'), '{not json');
  await writeFile(path, JSON.stringify({ version: 1, preferences: [{ provider: 'a', model: 'b', visible: true, default: false, apiKey: SECRET }] }), { mode: 0o600 });
  value = (await m.call({ action: 'snapshot' })).body.result.value;
  assert.equal(value.store, 'corrupt');
  await writeFile(path, JSON.stringify({ version: 1, preferences: [] }), { mode: 0o600 }); await chmod(path, 0o644);
  value = (await m.call({ action: 'snapshot' })).body.result.value;
  assert.equal(value.store, 'unsafe');
  assert.equal((await m.call({ action: 'clearPreference', provider: 'acme', model: 'acme-text' })).body.result.error.code, 'store_unsafe');
});

test('disposal refuses late calls and drops the llm reference (route lifetime itself is host-owned, as for the other routes)', async t => {
  const { path } = await fixture(t);
  const m = await mount(t, { path });
  assert.equal(m.live.registered, 1);
  const calls = m.fake.calls.listProviders;
  await m.dispose(); await new Promise(resolve => setImmediate(resolve));
  const late = await m.send({ action: 'snapshot' });
  assert.equal(late.status, 503);
  assert.equal(m.fake.calls.listProviders, calls);
  assert.equal(m.fake.calls.registerAdapter, 0);
});

// Settings panel: built dist/client.js through the baseline harness, wired to the production handler (controlled fixtures).
async function openPanel(t, m, { language = 'en', fail } = {}) {
  const source = await readFile(new URL('../../dist/client.js', import.meta.url), 'utf8');
  const sent = [];
  const harness = createBaselineHarness(source, { language, connection: { rpc: { async call(channel, method, payload) {
    if (method === 'majed/settings/status') return { ok: true, value: { module: 'routing', enabled: false, state: 'disabled' } };
    if (method !== METHOD) return { ok: false, error: { code: 'unexpected' } };
    sent.push(payload);
    if (fail?.()) throw new Error('HTTP 503');
    return (await m.call(payload)).body.result;
  } } } });
  t.after(() => harness.dispose()); harness.apply(); const view = harness.render('majed-routing');
  const text = () => view.nodes(() => true).flatMap(node => node.props.children.filter(child => typeof child === 'string')).join('\n');
  const waitFor = async (predicate, what) => { for (let i = 0; i < 500; i += 1) { view.render(); if (predicate()) return; await new Promise(resolve => setTimeout(resolve, 2)); } assert.fail('timed out waiting for ' + what); };
  const labelled = label => view.nodes(node => node.props['aria-label'] === label);
  const press = async label => { await waitFor(() => labelled(label).length === 1, 'control ' + label); await labelled(label)[0].props.onClick({ target: {} }); view.render(); };
  return { view, sent, text, waitFor, labelled, press, panel: () => view.one(node => node.props['data-majed-native-api'] !== undefined) };
}

test('Settings panel lists native references, a click persists the preference and the visible outcome changes', async t => {
  const { path } = await fixture(t);
  const m = await mount(t, { path });
  const ui = await openPanel(t, m);
  await ui.waitFor(() => /Acme Text/.test(ui.text()), 'reference list');
  assert.equal(ui.panel().props['aria-label'], 'Native API model references');
  assert.match(ui.text(), /does not copy credentials/i); assert.match(ui.text(), /not yet used by the model picker/i);
  assert.ok(!ui.text().includes(SECRET) && !/https:\/\//.test(ui.text()));
  await ui.press('Hide: acme-text');
  await ui.waitFor(() => ui.labelled('Show: acme-text').length === 1, 'hidden state');
  assert.deepEqual(JSON.parse(await readFile(path, 'utf8')).preferences, [{ provider: 'acme', model: 'acme-text', visible: false, default: false }]);
  assert.match(ui.text(), /Hidden/);
  await ui.press('Set as default: acme-mini');
  await ui.waitFor(() => ui.labelled('Clear default: acme-mini').length === 1, 'default state');
  assert.equal(JSON.parse(await readFile(path, 'utf8')).preferences.find(p => p.model === 'acme-mini').default, true);
  const alias = ui.view.one(node => node.props['aria-label'] === 'Alias: acme-mini');
  alias.props.onChange({ target: { value: 'Mini' } }); ui.view.render();
  await ui.press('Save alias: acme-mini');
  await ui.waitFor(() => JSON.parse(readFileSync(path, 'utf8')).preferences.find(p => p.model === 'acme-mini')?.alias === 'Mini', 'alias persisted');
  // a removed native model is shown as unavailable and its preference is retained, never substituted
  m.fake.state.get('acme').models = m.fake.state.get('acme').models.filter(x => x.id !== 'acme-mini');
  await ui.press('Refresh native references');
  await ui.waitFor(() => /Unavailable: the model was removed/.test(ui.text()), 'unavailable state');
  assert.equal(ui.labelled('Set as default: visio-1').length, 1);
  await ui.press('Clear preference: acme-mini');
  await ui.waitFor(() => !/Unavailable: the model was removed/.test(ui.text()), 'cleared');
  assert.ok(!JSON.parse(await readFile(path, 'utf8')).preferences.some(p => p.model === 'acme-mini'));
  assert.ok(ui.sent.every(payload => !JSON.stringify(payload).includes(SECRET)));
});

test('Settings panel shows honest unavailable and error states and Arabic labels with RTL', async t => {
  const { path } = await fixture(t);
  const none = await mount(t, { path, fake: null, llm: null });
  const ui = await openPanel(t, none);
  await ui.waitFor(() => /native model service is unavailable/i.test(ui.text()), 'service unavailable state');
  assert.equal(ui.labelled('Set as default: acme-text').length, 0);
  const m = await mount(t, { path });
  let down = false;
  const ar = await openPanel(t, m, { language: 'ar', fail: () => down });
  await ar.waitFor(() => /Acme Text/.test(ar.text()), 'Arabic list');
  assert.equal(ar.panel().props.dir, 'rtl'); assert.equal(ar.panel().props['aria-label'], 'مراجع نماذج API الأصلية');
  assert.match(ar.text(), /لا ينسخ أي بيانات اعتماد/);
  assert.equal(ar.labelled('إخفاء: acme-text').length, 1);
  down = true; await ar.press('تحديث المراجع الأصلية');
  await ar.waitFor(() => ar.view.nodes(node => node.props.role === 'alert' && node.props['data-majed-native-api-error'] !== undefined).length === 1, 'Arabic error');
});
