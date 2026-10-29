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

async function mount(t, { path, fake = fakeLlm(catalog()), llm = fake?.llm, root, timeoutMs } = {}) {
  const ctx = new Context(); let route; const live = { registered: 0, unregistered: 0 };
  ctx.provide('connection', { fetch: { register(value) { if (value.path !== PATH) return; route = value; live.registered += 1; return () => { live.unregistered += 1; }; } } });
  if (llm) ctx.provide('llm', llm);
  const fiber = ctx.plugin({ apply(c) { apply(c, { nativeApi: { path, ...(timeoutMs === undefined ? {} : { timeoutMs }) } }); } }); await fiber;
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

// ───────────── review corrections (each written RED first) ─────────────
const hostileFake = () => {
  const fake = fakeLlm({ acme: { name: 'Acme API', models: [{ id: 'acme-text' }, { id: 'acme-obj' }] } });
  const hostile = { apiKey: SECRET, baseUrl: 'https://x' };
  const listProviders = fake.llm.listProviders, listModels = fake.llm.listModels;
  fake.llm.listProviders = () => listProviders().map(p => ({ ...p, name: hostile }));
  fake.llm.listModels = async provider => (await listModels(provider)).map(m => (m.id === 'acme-obj' ? { ...m, name: { apiKey: SECRET, nested: [hostile] } } : m));
  return fake;
};

test('an object-valued provider or model name never reaches the snapshot or the persisted store', async t => {
  const { path } = await fixture(t);
  const m = await mount(t, { path, fake: hostileFake() });
  const snap = await m.call({ action: 'snapshot' });
  const set = await m.call({ action: 'setPreference', provider: 'acme', model: 'acme-obj', alias: 'Obj', visible: false });
  for (const text of [snap.text, set.text, await readFile(path, 'utf8')]) for (const forbidden of [SECRET, 'apiKey', 'baseUrl', 'https://x', 'nested']) assert.ok(!text.includes(forbidden), 'leaked ' + forbidden);
  const rows = snap.body.result.value.references;
  assert.deepEqual(rows.map(r => [r.model, r.name, r.providerName]), [['acme-text', 'acme-text', 'acme'], ['acme-obj', 'acme-obj', 'acme']]);
});

const readJson = async path => JSON.parse(await readFile(path, 'utf8'));
const many = (count, id) => ({ acme: { name: 'Acme', models: Array.from({ length: count }, (_, i) => ({ id: id(i) })) } });

test('write-side entry cap: the 256th preference is stored, the 257th is refused with store_full and the store stays readable', async t => {
  const { path } = await fixture(t);
  const m = await mount(t, { path, fake: fakeLlm(many(257, i => 'm' + String(i).padStart(3, '0'))) });
  for (let i = 0; i < 256; i += 1) assert.equal((await m.call({ action: 'setPreference', provider: 'acme', model: 'm' + String(i).padStart(3, '0'), visible: false })).body.result.ok, true, 'entry ' + i);
  const over = await m.call({ action: 'setPreference', provider: 'acme', model: 'm256', visible: false });
  assert.equal(over.body.result.error.code, 'store_full');
  assert.equal((await readJson(path)).preferences.length, 256);
  const value = (await m.call({ action: 'snapshot' })).body.result.value;
  assert.equal(value.store, 'ok');
  assert.equal((await m.call({ action: 'clearPreference', provider: 'acme', model: 'm000' })).body.result.ok, true);
  assert.equal((await m.call({ action: 'setPreference', provider: 'acme', model: 'm256', visible: false })).body.result.ok, true, 'space freed by a clear is reusable');
});

test('write-side byte cap: multibyte ids can never produce a store above 256 KiB or one that reads back as corrupt', async t => {
  const { path } = await fixture(t);
  const provider = 'é'.repeat(250);
  const model = i => 'é'.repeat(247) + String(i).padStart(3, '0');
  const m = await mount(t, { path, fake: fakeLlm({ [provider]: { name: 'Big', models: Array.from({ length: 256 }, (_, i) => ({ id: model(i) })) } }) });
  let accepted = 0, refused;
  for (let i = 0; i < 256; i += 1) {
    const result = (await m.call({ action: 'setPreference', provider, model: model(i), visible: false })).body.result;
    if (result.ok) accepted += 1; else { refused = result.error.code; break; }
  }
  assert.equal(refused, 'store_full', 'a write that would exceed the byte cap is refused explicitly');
  assert.ok(accepted > 200 && accepted < 256, 'accepted ' + accepted);
  const size = (await stat(path)).size;
  assert.ok(size <= 262144, 'store size ' + size);
  assert.ok(size > 250000, 'cap is not lowered: ' + size);
  const value = (await m.call({ action: 'snapshot' })).body.result.value;
  assert.deepEqual([value.store, value.references.length], ['ok', 256]);
  assert.equal((await readJson(path)).preferences.length, accepted);
  assert.equal((await m.call({ action: 'clearPreference', provider, model: model(0) })).body.result.ok, true);
});

test('cancellation: an already aborted request and a request aborted mid-write answer 408 and persist nothing', async t => {
  const { path } = await fixture(t);
  const fake = fakeLlm(catalog());
  const m = await mount(t, { path, fake });
  const early = new AbortController(); early.abort();
  const refusedEarly = await m.send({ action: 'snapshot' }, { request: { signal: early.signal } });
  assert.equal(refusedEarly.status, 408); assert.deepEqual(await refusedEarly.json(), { error: 'cancelled' });
  const late = new AbortController(); let entered, release;
  const reached = new Promise(resolve => { entered = resolve; }), gate = new Promise(resolve => { release = resolve; });
  const listModels = fake.llm.listModels;
  fake.llm.listModels = async provider => { entered(); await gate; return listModels(provider); };
  const pending = m.send({ action: 'setPreference', provider: 'acme', model: 'acme-text', visible: false }, { request: { signal: late.signal } });
  await reached; late.abort(); release();
  const response = await pending;
  assert.equal(response.status, 408); assert.deepEqual(await response.json(), { error: 'cancelled' });
  await assert.rejects(stat(path), { code: 'ENOENT' });
});

test('error codes are an explicit whitelist: unknown or status-bearing native errors collapse to service_unavailable', async t => {
  const { root, path } = await fixture(t);
  const m = await mount(t, { path });
  // a status-bearing error from below the handler must not choose its own public code
  const native = Object.assign(new Error('boom ' + SECRET), { status: 500, code: 'sk-LEAK-' + SECRET });
  const request = { get url() { throw native; }, method: 'POST', signal: new AbortController().signal, headers: new Headers() };
  const raw = await m.route.fetch(request);
  assert.equal(raw.status, 503);
  const rawText = await raw.text();
  assert.deepEqual(JSON.parse(rawText), { error: 'service_unavailable' }); assert.ok(!rawText.includes(SECRET));
  // a filesystem write failure carries an errno code (EACCES) but must not leak it
  const { mkdir, chmod } = await import('node:fs/promises');
  const locked = join(root, 'locked'); await mkdir(locked); await chmod(locked, 0o500);
  t.after(() => chmod(locked, 0o700).catch(() => {}));
  const broken = await mount(t, { path: join(locked, 'prefs.json') });
  const failed = await broken.call({ action: 'setPreference', provider: 'acme', model: 'acme-text', visible: false });
  assert.deepEqual(failed.body.result.error, { code: 'service_unavailable', message: 'service_unavailable', details: {} });
  assert.ok(!failed.text.includes('EACCES') && !failed.text.includes(root));
  // every public code that this handler can emit is on the list and is returned verbatim
  const codes = new Set();
  for (const payload of [{ action: 'wipe' }, { action: 'setPreference', provider: 'acme', model: 'ghost', visible: false }]) codes.add((await m.call(payload)).body.result.error.code);
  assert.deepEqual([...codes].sort(), ['invalid_request', 'unknown_reference']);
  assert.equal((await m.send({ action: 'snapshot' }, { request: { headers: { 'content-type': 'text/plain' } } })).status, 415);
});

test('options.timeoutMs bounds a hanging native provider listing (pass-through proof)', async t => {
  const { path } = await fixture(t);
  const fake = fakeLlm(catalog());
  const m = await mount(t, { path, fake, timeoutMs: 25 });
  await m.call({ action: 'setPreference', provider: 'acme', model: 'acme-text', alias: 'Saved' });
  fake.llm.listModels = () => new Promise(() => {});
  let guard; const slow = new Promise(resolve => { guard = setTimeout(() => resolve('hung'), 1500); });
  const outcome = await Promise.race([m.call({ action: 'snapshot' }), slow]); clearTimeout(guard);
  assert.notEqual(outcome, 'hung', 'snapshot must finish within the configured bound, not the 5 s default');
  const value = outcome.body.result.value;
  assert.deepEqual(value.unavailable.map(u => [u.model, u.reason]), [['acme-text', 'provider-unreadable']]);
});

test('parallel writes through the private store queue lose no update and keep one default', async t => {
  const { path } = await fixture(t);
  const m = await mount(t, { path, fake: fakeLlm(many(24, i => 'p' + i)) });
  const results = await Promise.all(Array.from({ length: 24 }, (_, i) => m.call({ action: 'setPreference', provider: 'acme', model: 'p' + i, alias: 'A' + i, default: true })));
  assert.ok(results.every(r => r.body.result.ok === true));
  const stored = (await readJson(path)).preferences;
  assert.deepEqual(stored.map(p => p.model).sort(), Array.from({ length: 24 }, (_, i) => 'p' + i).sort(), 'no lost update');
  assert.equal(stored.filter(p => p.default).length, 1, 'exactly one default');
  assert.ok(stored.every(p => p.alias === 'A' + p.model.slice(1)));
});

test('transient references are disposed per request: later adapters-updated events cause no native reads', async t => {
  const { path } = await fixture(t);
  const m = await mount(t, { path });
  await m.call({ action: 'snapshot' }); await m.call({ action: 'setPreference', provider: 'acme', model: 'acme-text', visible: false });
  const before = m.fake.calls.listProviders;
  m.ctx.emit('llm/adapters-updated'); await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(m.fake.calls.listProviders, before);
});

test('the llm reference is dropped when the native LLM service goes away and after disposal', async t => {
  const { path } = await fixture(t);
  const fake = fakeLlm(catalog());
  const m = await mount(t, { path, fake: null, llm: null });
  const provider = m.ctx.plugin({ apply(c) { c.provide('llm', fake.llm); } }); await provider;
  assert.equal((await m.call({ action: 'snapshot' })).body.result.value.state, 'ready');
  await m.call({ action: 'setPreference', provider: 'acme', model: 'acme-text', alias: 'Kept' });
  const calls = fake.calls.listProviders;
  await provider.dispose(); await new Promise(resolve => setImmediate(resolve));
  const gone = (await m.call({ action: 'snapshot' })).body.result.value;
  assert.deepEqual([gone.state, gone.unavailable.map(u => [u.model, u.reason])], ['unavailable', [['acme-text', 'service-unavailable']]]);
  assert.equal(fake.calls.listProviders, calls, 'the removed service is not called again');
  assert.equal((await m.call({ action: 'setPreference', provider: 'acme', model: 'acme-text', visible: false })).body.result.error.code, 'llm_unavailable');
});

test('clearPreference works while the native LLM service is unavailable (removal never needs the service)', async t => {
  const { path } = await fixture(t);
  const first = await mount(t, { path });
  await first.call({ action: 'setPreference', provider: 'acme', model: 'acme-text', alias: 'Gone soon' });
  await first.dispose();
  const none = await mount(t, { path, fake: null, llm: null });
  const cleared = await none.call({ action: 'clearPreference', provider: 'acme', model: 'acme-text' });
  assert.equal(cleared.body.result.ok, true);
  assert.deepEqual([cleared.body.result.value.state, cleared.body.result.value.unavailable], ['unavailable', []]);
  assert.deepEqual((await readJson(path)).preferences, []);
  assert.equal((await none.call({ action: 'setPreference', provider: 'acme', model: 'acme-text', visible: false })).body.result.error.code, 'llm_unavailable');
});

test('persisted values must have the right types: provider 5 or model {} reads as corrupt', async t => {
  const { path } = await fixture(t);
  const { mkdir } = await import('node:fs/promises');
  await mkdir(join(path, '..'), { recursive: true });
  const m = await mount(t, { path });
  for (const entry of [{ provider: 5, model: 'ok' }, { provider: 'ok', model: {} }, { provider: ['a'], model: 'ok' }, { provider: 'ok', model: null }]) {
    await writeFile(path, JSON.stringify({ version: 1, preferences: [{ ...entry, visible: true, default: false }] }), { mode: 0o600 });
    const value = (await m.call({ action: 'snapshot' })).body.result.value;
    assert.deepEqual([value.store, JSON.stringify(entry)], ['corrupt', JSON.stringify(entry)]);
    assert.equal((await m.call({ action: 'clearPreference', provider: 'acme', model: 'acme-text' })).body.result.error.code, 'store_corrupt');
  }
});

test('prototype-pollution shaped ids and keys are inert', async t => {
  const { path } = await fixture(t);
  const initial = { acme: { name: 'Acme', models: [{ id: 'acme-text' }] } };
  Object.defineProperty(initial, '__proto__', { value: { name: 'Proto', models: [{ id: 'constructor' }, { id: '__proto__' }] }, enumerable: true, configurable: true, writable: true });
  const m = await mount(t, { path, fake: fakeLlm(initial) });
  for (const action of ['__proto__', 'constructor', 'toString', 'hasOwnProperty']) assert.equal((await m.call({ action })).body.result.error.code, 'invalid_request', action);
  const raw = body => m.send({ action: 'snapshot' }, { request: { body } });
  assert.equal((await (await raw('{"type":"client-request","rpcId":"r1","method":"majed/native-api","payload":{"action":"snapshot","__proto__":{"polluted":1}}}')).json()).result.error.code, 'invalid_request');
  assert.equal((await (await raw('{"type":"client-request","rpcId":"r1","method":"majed/native-api","payload":{"action":"snapshot","constructor":{"prototype":{"polluted":1}}}}')).json()).result.error.code, 'invalid_request');
  const ok = await m.call({ action: 'setPreference', provider: '__proto__', model: 'constructor', alias: '__proto__', visible: false });
  assert.equal(ok.body.result.ok, true);
  assert.deepEqual((await readJson(path)).preferences, [{ provider: '__proto__', model: 'constructor', alias: '__proto__', visible: false, default: false }]);
  const row = ok.body.result.value.references.find(r => r.provider === '__proto__' && r.model === 'constructor');
  assert.deepEqual([row.alias, row.visible], ['__proto__', false]);
  assert.equal({}.polluted, undefined); assert.equal({}.alias, undefined); assert.equal({}.visible, undefined); assert.equal(Object.getPrototypeOf({}), Object.prototype);
});

test('Arabic rows keep status text and buttons in the page direction; only ids and model names are forced LTR', async t => {
  const { path } = await fixture(t);
  const m = await mount(t, { path });
  const ar = await openPanel(t, m, { language: 'ar' });
  await ar.waitFor(() => /Acme Text/.test(ar.text()), 'Arabic list');
  await ar.press('إخفاء: acme-text');
  await ar.waitFor(() => ar.labelled('إظهار: acme-text').length === 1, 'hidden state');
  await ar.press('تعيين كافتراضي: acme-mini');
  await ar.waitFor(() => ar.labelled('إلغاء الافتراضي: acme-mini').length === 1, 'default state');
  m.fake.state.get('acme').models = m.fake.state.get('acme').models.filter(x => x.id !== 'acme-mini');
  await ar.press('تحديث المراجع الأصلية');
  await ar.waitFor(() => /غير متاح: أُزيل النموذج/.test(ar.text()), 'unavailable row');
  const strings = node => { const out = []; const walk = n => { if (typeof n === 'string') out.push(n); else if (Array.isArray(n)) n.forEach(walk); else if (n && n.props) { walk(n.props.children); } }; walk(node); return out.join(' '); };
  const hasButton = node => { let found = false; const walk = n => { if (Array.isArray(n)) n.forEach(walk); else if (n && n.props) { if (n.type === 'button' || n.type === 'input') found = true; walk(n.props.children); } }; walk(node); return found; };
  const inPanel = (function collect(n, out = []) { if (Array.isArray(n)) n.forEach(x => collect(x, out)); else if (n && n.props) { out.push(n); collect(n.props.children, out); } return out; })(ar.panel());
  const ltr = inPanel.filter(node => node.props.dir === 'ltr');
  assert.ok(ltr.length > 0, 'ids and model names are isolated as LTR');
  assert.deepEqual([...new Set(ltr.map(node => node.type))], ['bdi'], 'only inline bdi isolates are forced LTR');
  assert.ok(ltr.every(node => !hasButton(node)), 'no control is inside an LTR subtree');
  assert.ok(ltr.every(node => !/[\u0600-\u06ff]/.test(strings(node))), 'no Arabic status text is inside an LTR subtree');
  assert.ok(ltr.some(node => strings(node) === 'acme-text'));
  const rows = inPanel.filter(node => node.props['data-native-model'] !== undefined);
  assert.ok(rows.length >= 3 && rows.every(node => node.props.dir !== 'ltr'), 'rows inherit the rtl panel direction');
  assert.match(ar.text(), /مخفي/);
});
