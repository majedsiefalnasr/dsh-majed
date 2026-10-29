import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, stat, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPolicySettingsStore, policyDefaults } from '../../modules/command-policy/settings.js';
import { decide, createPolicyLedger } from '../../modules/command-policy/index.js';
import { applyPolicySettings } from '../../modules/command-policy/settings-mount.js';
import { Context } from '@deepseek-ai/cordis';
import { apply } from '../../index.js';

test('Owner policy settings persist privately across restart and reset only one field', async t => {
  const root = await mkdtemp(join(tmpdir(), 'e11b-')); t.after(() => rm(root, { recursive: true, force: true }));
  const path = join(root, 'policy.json');
  const store = createPolicySettingsStore(path);
  await store.set('trustedProjects', ['/project']);
  await store.set('denyEffects', ['publish']);
  await store.set('ownerContext', { task: { authorizedTargets: ['branch:old'], prohibitions: [] }, knownScripts: { test: 'node --test' }, sessionTempDirs: ['/tmp/session'] });
  const restarted = createPolicySettingsStore(path);
  assert.deepEqual((await restarted.read()).trustedProjects, ['/project']);
  assert.equal((await stat(path)).mode & 0o777, 0o600);
  await restarted.reset('trustedProjects');
  assert.deepEqual((await restarted.read()).trustedProjects, []);
  assert.deepEqual((await restarted.read()).denyEffects, ['publish']);
  await assert.rejects(store.set('denyEffects', ['invented']), { code: 'invalid_request' });
  await assert.rejects(store.set('ownerContext', { task: { prohibitions: ['path:*'] }, knownScripts: {}, sessionTempDirs: [] }), { code: 'invalid_request' });
  await assert.rejects(store.set('ownerContext', { task: {}, knownScripts: Object.fromEntries(Array.from({ length: 33 }, (_, i) => ['run:' + i, 'node --test'])), sessionTempDirs: [] }), { code: 'invalid_request' });
});

test('production mount places policy settings after judgment and before native references', async t => {
  const root = await mkdtemp(join(tmpdir(), 'e11b-order-')); t.after(() => rm(root, { recursive: true, force: true }));
  const routes = [], ctx = new Context();
  ctx.provide('connection', { fetch: { register(route) { routes.push(route.path); } } });
  const fiber = ctx.plugin({ apply }, { commandPolicy: { path: join(root, 'policy.json') } }); await fiber; t.after(() => fiber.dispose());
  assert.ok(routes.indexOf('/api/majed/judgment/manage') < routes.indexOf('/api/majed/command-policy'));
  assert.ok(routes.indexOf('/api/majed/command-policy') < routes.indexOf('/api/majed/native-api'));
});

test('corrupt policy settings are never overwritten', async t => {
  const root = await mkdtemp(join(tmpdir(), 'e11b-corrupt-')); t.after(() => rm(root, { recursive: true, force: true }));
  const path = join(root, 'policy.json'); await writeFile(path, '{invalid', { mode: 0o600 });
  const store = createPolicySettingsStore(path);
  await assert.rejects(store.read()); await assert.rejects(store.reset('trustedProjects'));
  assert.equal(await readFile(path, 'utf8'), '{invalid');
});

test('Owner context excludes request-supplied task and script authorization', () => {
  const request = { kind: 'command', projectRoot: '/project', cwd: '/project', home: '/home/owner', command: 'git branch -D old', task: { authorizedTargets: ['branch:old'] }, knownScripts: { test: 'node --test' } };
  const settings = { ownerContext: { task: {}, knownScripts: {}, sessionTempDirs: [] } };
  assert.equal(decide({ mode: 'aggressive', request, settings }).decision, 'checkpoint');
  assert.equal(decide({ mode: 'safe', request: { ...request, command: 'npm test' }, settings }).reasonCode, 'unknown_script');
  assert.equal(decide({ mode: 'aggressive', request, settings: { ownerContext: { ...settings.ownerContext, task: { authorizedTargets: ['branch:old'] } } } }).decision, 'allow');
});

test('Owner context changes fence pending claims and redacted history stays bounded and detached', () => {
  let settings = { ownerContext: { task: {}, knownScripts: {}, sessionTempDirs: [] } };
  const ledger = createPolicyLedger({ getMode: () => 'safe', settings: () => settings });
  const request = { id: 'r1', kind: 'command', command: 'cat source.txt', cwd: '/project', projectRoot: '/project' };
  ledger.evaluate('s1', request);
  settings = { ownerContext: { ...settings.ownerContext, knownScripts: { 'run:test': 'node --test' } } };
  assert.equal(ledger.authorize('s1', 'r1', { request }).reasonCode, 'stale_policy_changed');
  for (let i = 0; i < 110; i++) ledger.evaluate('s1', { ...request, id: 'n' + i });
  const view = ledger.redacted('s1'); assert.equal(view.entries.length, 100); assert.equal(view.counts.routine_known_effect, 111);
  view.entries[0].mode = 'hostile'; view.counts.routine_known_effect = 0;
  assert.equal(ledger.redacted('s1').entries[0].mode, 'safe'); assert.equal(ledger.redacted('s1').counts.routine_known_effect, 111);
  ledger.reset('s1'); assert.deepEqual(ledger.redacted('s1'), { counts: {}, entries: [] });
});

test('Owner route persists strict settings and returns only bounded redacted ledger entries', async t => {
  const root = await mkdtemp(join(tmpdir(), 'e11b-route-')); t.after(() => rm(root, { recursive: true, force: true }));
  const ledger = createPolicyLedger({ getMode: () => 'safe', now: () => 123, settings: () => policyDefaults() });
  ledger.evaluate('s1', { id: 'secret-request-id', kind: 'command', command: 'cat private-source.txt', cwd: '/private/project', projectRoot: '/private/project' });
  let route;
  applyPolicySettings({ inject(deps, callback) { assert.deepEqual(deps, ['connection']); callback({ connection: { fetch: { register(value) { route = value; } } } }); } }, { path: join(root, 'policy.json'), ledger });
  assert.equal(route.path, '/api/majed/command-policy'); assert.deepEqual(route.methods, ['POST']); assert.equal(route.requestBody, 'streaming');
  const call = async payload => {
    const response = await route.fetch(new Request('http://fixture' + route.path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'client-request', rpcId: 'r1', method: 'majed/command-policy', payload }) }));
    assert.equal(response.headers.get('cache-control'), 'no-store'); return (await response.json()).result;
  };
  assert.equal((await call({ action: 'set', field: 'denyEffects', value: ['publish'] })).ok, true);
  assert.equal((await call({ action: 'snapshot', request: { approved: true } })).error.code, 'invalid_request');
  const result = await call({ action: 'ledger', sessionId: 's1' });
  assert.equal(result.value.ledger.counts.routine_known_effect, 1);
  assert.deepEqual(Object.keys(result.value.ledger.entries[0]).sort(), ['at', 'decision', 'fingerprint', 'mode', 'reasonCode']);
  assert.match(result.value.ledger.entries[0].fingerprint, /^[a-f0-9]{32}$/);
  assert.doesNotMatch(JSON.stringify(result), /private|cat |secret-request-id/);
});
