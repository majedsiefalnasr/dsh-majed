// Assembled tool/session-creation policy proof (ticket #130, story 42). Fake DSH services only; no network.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { apply } from '../dist/subscriptions.js';

// The fake models cordis fiber ownership: registrations made through an inject callback are disposed with the component.
function host({ withTools = true, withWeb = true, tool = {}, web = {} } = {}) {
  const routes = new Map(), cleanups = [], listeners = [], registered = new Map(), providers = [];
  const ctx = {
    logger: { warn() {} },
    llm: { registerAdapter() { return { replace() {} }; } },
    get: name => name === 'connection' ? { fetch: { register(route) { routes.set(route.path, route); return () => routes.delete(route.path); } } } : undefined,
    effect(fn) { const off = fn(); if (off) cleanups.push(off); },
    inject(names, fn) {
      const wanted = [].concat(names);
      if (wanted.includes('tools') && !withTools) return;
      if (wanted.includes('web') && !withWeb) return;
      fn({ ...ctx,
        tools: { register(def) { if (registered.has(def.name) || tool.occupied?.includes(def.name)) throw new Error(`${def.name} already registered`); registered.set(def.name, def); const off = () => registered.delete(def.name); cleanups.push(off); return off; } },
        web: { registerSearchProvider(provider) { providers.push(provider); const off = () => { const i = providers.indexOf(provider); if (i >= 0) providers.splice(i, 1); }; cleanups.push(off); return off; } },
        on(event, listener) { if (event === 'agent/created') listeners.push(listener); return () => undefined; } });
    },
  };
  apply(ctx, { codexClientVersion: '1.2.3', models: { codex: [{ id: 'fixture-model', name: 'Fixture model' }] }, ...web });
  const agent = createdAt => { const denied = []; return { denied, agent: { session: { header: { createdAt } }, ctx: { tools: { restrict: filter => { denied.push(...(filter.deny ?? [])); return () => undefined; } } } } }; };
  return { registered, providers, routes, async call(endpoint, payload = {}) {
    const method = `majed-subscriptions.${endpoint}`;
    const response = await routes.get(`/api/${method}`).fetch(new Request(`http://localhost/api/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'client-request', rpcId: 'fixture', method, payload }) }));
    return (await response.json()).result;
  }, async create(createdAt) { const { denied, agent: fake } = agent(createdAt); for (const listener of listeners) await listener({ agent: fake }); return denied; }, dispose() { cleanups.reverse().forEach(off => off()); } };
}

test('image_generate and Codex web_search register publicly and obey creation-time switches', async () => {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t130/tools-');
  const { saveAccountSession } = await import('../dist/auth/store.js');
  await saveAccountSession('codex', 'fixture', { accountId: 'fixture', accessToken: 'fake-access', refreshToken: 'fake-refresh', expiresAt: 2000000000000 });
  const component = host();
  try {
    assert.deepEqual([...component.registered.keys()], ['image_generate', 'video_generate', 'x_search']);
    assert.equal(component.providers.length, 1);
    assert.equal(component.providers[0].id, 'codex');
    assert.equal(component.providers[0].available(), true);
    const before = Date.now();
    assert.deepEqual(await component.create(before), []);
    await new Promise(resolve => setTimeout(resolve, 5));
    assert.equal((await component.call('setProviderSettings', { provider: 'codex', settings: { tools: { image_generate: false, web_search: false } } })).ok, true);
    await component.call('setProviderSettings', { provider: 'grok', settings: { tools: { image_generate: false } } });
    // New sessions lose image_generate; an already-created session keeps the tool; web search follows the live switch.
    assert.deepEqual(await component.create(Date.now()), ['image_generate']);
    assert.deepEqual(await component.create(before), []);
    assert.equal(component.providers[0].available(), false);
    assert.equal((await component.call('setProviderSettings', { provider: 'codex', settings: { tools: {} } })).ok, true);
    assert.equal(component.providers[0].available(), true);
    assert.deepEqual(await component.create(Date.now()), []);
  } finally { component.dispose(); }
  assert.equal(component.registered.size, 0, 'disposal unregisters tools');
  assert.equal(component.providers.length, 0, 'disposal unregisters the search provider');
});

test('a colliding image_generate name falls back to the Majed alias and is the one restricted', async () => {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t130/tools-');
  const component = host({ tool: { occupied: ['image_generate'] } });
  try {
    assert.deepEqual([...component.registered.keys()], ['dsh_majed_image_generate', 'video_generate', 'x_search']);
    await component.call('setProviderSettings', { provider: 'codex', settings: { tools: { image_generate: false } } });
    await component.call('setProviderSettings', { provider: 'grok', settings: { tools: { image_generate: false } } });
    assert.deepEqual(await component.create(Date.now() + 1000), ['dsh_majed_image_generate']);
  } finally { component.dispose(); }
});

test('absent tools and web services leave the component functional', async () => {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t130/tools-');
  const component = host({ withTools: false, withWeb: false });
  try {
    assert.equal(component.registered.size, 0); assert.equal(component.providers.length, 0);
    assert.equal((await component.call('status')).ok, true);
  } finally { component.dispose(); }
});
