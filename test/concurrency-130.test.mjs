// Ticket #130 P2 concurrency proof: stale or concurrent writers must not erase each other's changes.
// Real stores on a temp DSH_HOME, no network. Two "clients" load the same baseline and save concurrently.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { ProviderSettingsStore } from '../dist/provider-settings.js';
import { proxySetConfig, proxyGetConfig, resetProxyForTests, proxyFilePath } from '../dist/http.js';
import { apply } from '../dist/subscriptions.js';

async function store() {
  const dir = await mkdtemp('/tmp/majed-t130/concurrency-');
  return new ProviderSettingsStore(`${dir}/provider-settings.json`);
}
const BASE = { displayName: 'Base', accounts: { a: { alias: 'Old' }, b: { poolEnabled: true } }, modelDisplayNames: { m1: 'One' }, tools: { web_search: true } };

test('four clients saving different fields of the same baseline concurrently keep every change (alias, pool, model name, tools)', async () => {
  const settings = await store();
  await settings.set('codex', BASE);
  const baseline = settings.get('codex');
  // Each client edits ONE thing in its draft and sends {original: baseline, draft}.
  const edits = [
    { ...baseline, accounts: { ...baseline.accounts, a: { alias: 'Renamed' } } },
    { ...baseline, accounts: { ...baseline.accounts, b: { poolEnabled: false, poolModels: ['m1'] } } },
    { ...baseline, modelDisplayNames: { m1: 'Uno', m2: 'Two' } },
    { ...baseline, tools: { web_search: false, image_generate: false } },
  ];
  await Promise.all(edits.map(draft => settings.update('codex', baseline, draft)));
  const final = settings.get('codex');
  assert.equal(final.accounts.a.alias, 'Renamed');
  assert.deepEqual(final.accounts.b, { poolEnabled: false, poolModels: ['m1'] });
  assert.deepEqual(final.modelDisplayNames, { m1: 'Uno', m2: 'Two' });
  assert.deepEqual(final.tools, { web_search: false, image_generate: false });
  assert.equal(final.displayName, 'Base', 'untouched field keeps the stored value');
  // The change reached disk, and the tool switch left a creation-time revision.
  const reread = new ProviderSettingsStore(settings.path);
  assert.deepEqual(reread.get('codex'), final);
  assert.equal(reread.toolEnabled('codex', 'web_search', Date.now() + 1), false);
});

test('the legacy full-document set replaces everything: exactly the lost-update the atomic patch avoids', async () => {
  const settings = await store();
  await settings.set('codex', BASE);
  const stale = settings.get('codex');
  await settings.update('codex', stale, { ...stale, accounts: { ...stale.accounts, a: { alias: 'Other client' } } });
  await settings.set('codex', { ...stale, modelDisplayNames: { m1: 'Mine' } });
  assert.equal(settings.get('codex').accounts.a.alias, 'Old', 'a stale full replace loses the other client change');
  // The same stale save as a patch keeps it.
  const fresh = await store();
  await fresh.set('codex', BASE);
  await fresh.update('codex', stale, { ...stale, accounts: { ...stale.accounts, a: { alias: 'Other client' } } });
  await fresh.update('codex', stale, { ...stale, modelDisplayNames: { m1: 'Mine' } });
  assert.equal(fresh.get('codex').accounts.a.alias, 'Other client');
  assert.equal(fresh.get('codex').modelDisplayNames.m1, 'Mine');
});

test('two clients editing the very same field resolve last-writer-wins in write order; a failed patch changes nothing', async () => {
  const settings = await store();
  await settings.set('codex', BASE);
  const baseline = settings.get('codex');
  const patch = alias => settings.update('codex', baseline, { ...baseline, accounts: { ...baseline.accounts, a: { alias } } });
  await Promise.all([patch('first'), patch('second')]);
  assert.equal(settings.get('codex').accounts.a.alias, 'second');
  await assert.rejects(() => settings.update('codex', baseline, { contextWindows: { m1: -1 } }));
  assert.equal(settings.get('codex').accounts.a.alias, 'second', 'a rejected patch leaves the document untouched');
  await settings.update('codex', baseline, { ...baseline, accounts: { ...baseline.accounts, a: { alias: 'third' } } });
  assert.equal(settings.get('codex').accounts.a.alias, 'third', 'the chain keeps working after a rejection');
});

test('proxySet: concurrent password-only and bypass-only saves never lose the credential or the list', async () => {
  for (const order of ['password-first', 'bypass-first']) {
    await resetProxyForTests();
    process.env.DSH_HOME = await mkdtemp(`/tmp/majed-t130/proxy-writes-${order}-`);
    await proxySetConfig({ enabled: true, url: 'http://127.0.0.1:9', username: 'u', password: 'initial-pw', bypass: ['keep.test'] });
    // Client A rotates only the password (bypass omitted = keep); client B edits only the list (password omitted = keep).
    const a = () => proxySetConfig({ enabled: true, url: 'http://127.0.0.1:9', username: 'u', password: 'rotated-pw' });
    const b = () => proxySetConfig({ enabled: true, url: 'http://127.0.0.1:9', username: 'u', bypass: ['one.test', 'two.test'] });
    await Promise.all(order === 'password-first' ? [a(), b()] : [b(), a()]);
    const view = await proxyGetConfig();
    assert.equal(view.passwordSet, true);
    assert.deepEqual(view.bypass, ['one.test', 'two.test']);
    const onDisk = JSON.parse(await readFile(proxyFilePath(), 'utf8'));
    assert.equal(onDisk.password, 'rotated-pw', 'the rotated credential survived the concurrent list save');
    assert.deepEqual(onDisk.bypass, ['one.test', 'two.test']);
  }
  await resetProxyForTests();
});

test('proxySet: a rejected write does not poison the queue and a clear is not resurrected by a later omitted-password save', async () => {
  await resetProxyForTests();
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t130/proxy-queue-');
  await proxySetConfig({ enabled: true, url: 'http://127.0.0.1:9', password: 'pw' });
  const results = await Promise.allSettled([
    proxySetConfig({ enabled: true, url: 'not a url', password: 'x' }),
    proxySetConfig({ enabled: true, url: 'http://127.0.0.1:9', password: null }),
    proxySetConfig({ enabled: true, url: 'http://127.0.0.1:9', bypass: ['after.test'] }),
  ]);
  assert.equal(results[0].status, 'rejected');
  assert.equal(results[1].status, 'fulfilled');
  assert.equal(results[2].status, 'fulfilled');
  const view = await proxyGetConfig();
  assert.equal(view.passwordSet, false, 'the clear survived the later omitted-password save');
  assert.deepEqual(view.bypass, ['after.test']);
  await resetProxyForTests();
});

test('setProviderSettings RPC with `original` patches atomically; without it the whole document is replaced', async () => {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t130/rpc-patch-');
  const routes = new Map(), cleanups = [];
  const ctx = { logger: { warn() {} }, llm: { registerAdapter: () => ({ replace() {} }) },
    get: name => name === 'connection' ? { fetch: { register(route) { routes.set(route.path, route); return () => routes.delete(route.path); } } } : undefined,
    inject(names, fn) { if ([].concat(names).includes('connection')) fn(ctx); }, effect(fn) { const off = fn(); if (off) cleanups.push(off); } };
  apply(ctx, { codexClientVersion: '1.2.3', models: { codex: [{ id: 'm1', name: 'M1' }] } });
  const call = async (endpoint, payload) => {
    const method = `majed-subscriptions.${endpoint}`;
    return (await (await routes.get(`/api/${method}`).fetch(new Request(`http://localhost/api/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'client-request', rpcId: 'r', method, payload }) }))).json()).result;
  };
  try {
    assert.equal((await call('setProviderSettings', { provider: 'codex', settings: { displayName: 'Base', tools: { web_search: true } } })).ok, true);
    const original = { displayName: 'Base', tools: { web_search: true } };
    const results = await Promise.all([
      call('setProviderSettings', { provider: 'codex', original, settings: { ...original, displayName: 'Client A' } }),
      call('setProviderSettings', { provider: 'codex', original, settings: { ...original, tools: { web_search: false } } }),
    ]);
    assert.deepEqual(results.map(r => r.ok), [true, true]);
    const read = (await call('providerSettings', { provider: 'codex' })).value.settings;
    assert.equal(read.displayName, 'Client A');
    assert.deepEqual(read.tools, { web_search: false });
    const bad = await call('setProviderSettings', { provider: 'codex', original, settings: { contextWindows: { m1: 1.5 } } });
    assert.equal(bad.ok, false);
    assert.match(bad.error.message, /context/i, 'validation message stays useful');
    assert.equal((await call('providerSettings', { provider: 'codex' })).value.settings.displayName, 'Client A');
  } finally { cleanups.reverse().forEach(off => off()); }
});
