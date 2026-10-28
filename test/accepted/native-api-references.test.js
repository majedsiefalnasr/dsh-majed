import test from 'node:test';
import assert from 'node:assert/strict';
import { Context } from '@deepseek-ai/cordis';
import { createNativeApiReferences } from '../../modules/catalog/native-api.js';

const SECRET = 'sk-test-SECRET-0123456789';

// Fake of the public native LLM service surface used by the module: listProviders(),
// listModels(provider), resolveModelInfo(provider, model, signal) and the
// 'llm/adapters-updated' event. Provider/model objects deliberately carry
// credential-looking extras that a correct consumer must never copy.
function fakeLlm(initial) {
  const state = new Map(Object.entries(initial));
  const calls = { registerAdapter: 0, listProviders: 0, listModels: [], resolve: [] };
  const llm = {
    registerAdapter() { calls.registerAdapter += 1; throw new Error('registerAdapter must not be called'); },
    listProviders() { calls.listProviders += 1; return [...state].map(([id, p]) => ({ id, name: p.name, apiKey: SECRET, baseUrl: `https://${SECRET}.example/v1` })); },
    async listModels(provider) {
      calls.listModels.push(provider);
      const p = state.get(provider);
      if (p.listModels) return p.listModels();
      return p.models.map(m => ({ provider, id: m.id, name: m.name ?? m.id, ...(m.inputModalities ? { inputModalities: m.inputModalities } : {}), apiKey: SECRET }));
    },
    async resolveModelInfo(provider, model, signal) {
      calls.resolve.push([provider, model]);
      const found = state.get(provider)?.models.find(m => m.id === model);
      if (!found) throw new Error(`unknown ${provider}/${model} ${SECRET}`);
      return { provider, id: model, name: found.name ?? model, context: { contextWindow: 200000 }, reasoning: { efforts: [{ id: 'low', name: 'Low' }], defaultEffort: 'low' }, inputModalities: found.inputModalities, headers: { authorization: SECRET } };
    },
  };
  return { llm, state, calls };
}

function mount(t, initial, options) {
  const fake = fakeLlm(initial);
  const ctx = new Context();
  ctx.provide('llm', fake.llm);
  const refs = createNativeApiReferences(ctx, options);
  t.after(() => refs.dispose());
  const update = () => ctx.emit('llm/adapters-updated');
  return { ...fake, ctx, refs, update };
}

const catalog = () => ({
  codex: { name: 'Codex', models: [{ id: 'gpt-5' }] },
  acme: { name: 'Acme API', models: [{ id: 'acme-text', name: 'Acme Text', inputModalities: ['text'] }] },
  visio: { name: 'Visio API', models: [{ id: 'visio-1', inputModalities: ['text', 'image'] }, { id: 'visio-plain' }] },
});

test('lists eligible native API models from any brand, excluding subscription ids and claiming no media generation', async t => {
  const { refs, calls } = mount(t, catalog());
  await refs.refresh();
  const snap = refs.snapshot();
  assert.deepEqual(snap.providers.map(p => p.id), ['acme', 'visio']);
  const acme = snap.providers[0];
  assert.equal(acme.name, 'Acme API');
  assert.deepEqual(acme.models, [{ provider: 'acme', model: 'acme-text', name: 'Acme Text', inputModalities: ['text'], chat: true, mediaGeneration: false, available: true, visible: true, default: false }]);
  const [vision, plain] = snap.providers[1].models;
  assert.deepEqual(vision.inputModalities, ['text', 'image']);
  assert.equal(vision.chat, true);
  assert.equal(vision.mediaGeneration, false);
  assert.equal('inputModalities' in plain, false);
  assert.equal(calls.registerAdapter, 0);
  assert.ok(!calls.listModels.includes('codex'));
  assert.ok(!JSON.stringify(snap).includes(SECRET));
});

const find = (snap, provider, model) => snap.providers.find(p => p.id === provider)?.models.find(m => m.model === model);

test('adapters-updated removal marks a saved reference unavailable and never selects another model', async t => {
  const { refs, state, update } = mount(t, catalog());
  await refs.refresh();
  refs.setPreference('acme', 'acme-text', { alias: 'Fast text', default: true });
  assert.equal(find(refs.snapshot(), 'acme', 'acme-text').default, true);

  state.get('acme').models = [{ id: 'acme-other' }];
  update(); await refs.idle();
  let snap = refs.snapshot();
  assert.equal(find(snap, 'acme', 'acme-text'), undefined);
  assert.deepEqual(snap.unavailable, [{ provider: 'acme', model: 'acme-text', alias: 'Fast text', visible: true, default: true, available: false, reason: 'model-removed' }]);
  assert.deepEqual(refs.defaultReference(), { provider: 'acme', model: 'acme-text', available: false });
  assert.equal(find(snap, 'acme', 'acme-other').default, false, 'no substitute is chosen');

  state.delete('acme');
  update(); await refs.idle();
  snap = refs.snapshot();
  assert.equal(snap.unavailable[0].reason, 'provider-removed');
  assert.deepEqual(refs.defaultReference(), { provider: 'acme', model: 'acme-text', available: false });

  state.set('acme', { name: 'Acme API', models: [{ id: 'acme-text', name: 'Acme Text' }] });
  update(); await refs.idle();
  snap = refs.snapshot();
  assert.deepEqual(snap.unavailable, []);
  const back = find(snap, 'acme', 'acme-text');
  assert.equal(back.alias, 'Fast text');
  assert.equal(back.default, true);
  assert.deepEqual(refs.defaultReference(), { provider: 'acme', model: 'acme-text', available: true });
});

test('a provider that appears later is listed after adapters-updated', async t => {
  const { refs, state, update } = mount(t, { acme: catalog().acme });
  await refs.refresh();
  assert.deepEqual(refs.snapshot().providers.map(p => p.id), ['acme']);
  state.set('visio', catalog().visio);
  update(); await refs.idle();
  assert.deepEqual(refs.snapshot().providers.map(p => p.id), ['acme', 'visio']);
});

test('visibility preference hides a reference from the usable list without removing it', async t => {
  const { refs } = mount(t, catalog());
  await refs.refresh();
  refs.setPreference('visio', 'visio-1', { visible: false });
  assert.equal(find(refs.snapshot(), 'visio', 'visio-1').visible, false);
  assert.deepEqual(refs.usable().map(r => r.model), ['acme-text', 'visio-plain']);
});

test('manual selection resolves live and returns the exact native reference; unknown or subscription ids are refused', async t => {
  const { refs, calls, state } = mount(t, catalog());
  await refs.refresh();
  const picked = await refs.select('visio', 'visio-1');
  assert.deepEqual(picked, { ok: true, reference: { provider: 'visio', model: 'visio-1' } });
  assert.deepEqual(calls.resolve, [['visio', 'visio-1']]);
  state.get('visio').models = [];
  assert.deepEqual(await refs.select('visio', 'visio-1'), { ok: false, reason: 'unavailable' });
  assert.deepEqual(await refs.select('codex', 'gpt-5'), { ok: false, reason: 'not-eligible' });
  assert.equal(calls.registerAdapter, 0);
});

test('a failing or slow provider is isolated, bounded and never turns a saved reference into a substitute', async t => {
  const { refs, state } = mount(t, catalog(), { timeoutMs: 40 });
  await refs.refresh();
  refs.setPreference('acme', 'acme-text', { default: true });
  state.get('acme').listModels = async () => { throw new Error(`boom ${SECRET}`); };
  state.get('visio').listModels = () => new Promise(() => {}); // never settles
  const started = Date.now();
  await refs.refresh();
  assert.ok(Date.now() - started < 1000, 'slow provider is bounded');
  const snap = refs.snapshot();
  assert.deepEqual(snap.providers.map(p => [p.id, p.error, p.models.length]), [['acme', 'list-failed', 0], ['visio', 'list-failed', 0]]);
  assert.equal(snap.unavailable[0].reason, 'provider-unreadable');
  assert.deepEqual(refs.defaultReference(), { provider: 'acme', model: 'acme-text', available: false });
  assert.ok(!JSON.stringify(snap).includes(SECRET));

  state.get('visio').listModels = undefined;
  state.get('acme').listModels = undefined;
  await refs.refresh();
  assert.equal(refs.snapshot().providers.every(p => !p.error), true);
  assert.deepEqual(refs.defaultReference(), { provider: 'acme', model: 'acme-text', available: true });
});

test('one failing provider does not hide the healthy provider', async t => {
  const { refs, state } = mount(t, catalog());
  state.get('acme').listModels = async () => { throw new Error('down'); };
  await refs.refresh();
  assert.deepEqual(refs.usable().map(r => r.model), ['visio-1', 'visio-plain']);
});

test('provider, model and config secrets never reach snapshots, preferences, selection or errors', async t => {
  const { refs, state } = mount(t, catalog());
  await refs.refresh();
  refs.setPreference('acme', 'acme-text', { alias: 'A', visible: true, default: true, apiKey: SECRET, baseUrl: SECRET });
  state.get('visio').listModels = async () => { throw new Error(SECRET); };
  await refs.refresh();
  const picked = await refs.select('acme', 'missing');
  const out = JSON.stringify([refs.snapshot(), refs.preferences(), refs.usable(), refs.defaultReference(), picked, await refs.select('acme', 'acme-text')]);
  assert.ok(!out.includes(SECRET));
  assert.deepEqual(Object.keys(refs.preferences()[0]).sort(), ['alias', 'default', 'model', 'provider', 'visible']);
});

test('saved preferences are restored without storing provider configuration', async t => {
  const { refs } = mount(t, catalog(), { preferences: [{ provider: 'acme', model: 'acme-text', alias: 'Saved', default: true, apiKey: SECRET }] });
  await refs.refresh();
  const row = find(refs.snapshot(), 'acme', 'acme-text');
  assert.equal(row.alias, 'Saved');
  assert.equal(row.default, true);
  assert.ok(!JSON.stringify(refs.preferences()).includes(SECRET));
});

test('only one default reference exists and native registration is never used', async t => {
  const { refs, calls } = mount(t, catalog());
  await refs.refresh();
  refs.setPreference('acme', 'acme-text', { default: true });
  refs.setPreference('visio', 'visio-1', { default: true });
  assert.deepEqual(refs.preferences().filter(p => p.default).map(p => p.model), ['visio-1']);
  assert.equal(calls.registerAdapter, 0);
});

test('disposal unsubscribes from adapters-updated and ignores late results', async t => {
  const fake = fakeLlm(catalog());
  const ctx = new Context();
  ctx.provide('llm', fake.llm);
  let subscribed = 0;
  let unsubscribed = 0;
  const on = ctx.on.bind(ctx);
  ctx.on = (name, listener) => { subscribed += 1; const stop = on(name, listener); return () => { unsubscribed += 1; stop(); }; };
  const refs = createNativeApiReferences(ctx);
  await refs.refresh();
  assert.equal(subscribed, 1);
  refs.dispose();
  assert.equal(unsubscribed, 1);
  const before = fake.calls.listProviders;
  fake.state.delete('acme');
  ctx.emit('llm/adapters-updated'); await refs.idle();
  assert.equal(fake.calls.listProviders, before);
  assert.ok(find(refs.snapshot(), 'acme', 'acme-text'));
});

test('a refresh in flight at disposal does not publish its result', async t => {
  const { refs, state } = mount(t, catalog());
  await refs.refresh();
  let release;
  state.get('visio').listModels = () => new Promise(resolve => { release = () => resolve([]); });
  const pendingRefresh = refs.refresh();
  await new Promise(resolve => setImmediate(resolve));
  refs.dispose();
  release();
  await pendingRefresh;
  assert.ok(find(refs.snapshot(), 'visio', 'visio-plain'), 'snapshot was not replaced after disposal');
});
