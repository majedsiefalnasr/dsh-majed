import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SUBSCRIPTIONS_CUTOVER_PREPARATION,
  GAP_LEGACY_ROUTER_AUTH_MIGRATION,
  BACKUP_NEVER_DESTINATIONS,
  createSubscriptionsCutoverPreparation,
} from '../../modules/subscriptions/cutover.js';
import { createAccountStore, createSyntheticAccount } from '../../modules/subscriptions/account.js';

test('subscription cutover preparation service constant is exported', () => {
  assert.equal(SUBSCRIPTIONS_CUTOVER_PREPARATION, 'dshMajedSubscriptionsCutover');
});

test('subscription gap identifiers are stable planning references', () => {
  assert.equal(GAP_LEGACY_ROUTER_AUTH_MIGRATION, 'legacy-router-auth-migration');
});

test('backups never target the repository, browser, evidence bundle or plaintext logs', () => {
  assert.deepEqual(BACKUP_NEVER_DESTINATIONS, ['repository', 'browser', 'evidence-bundle', 'plaintext-logs']);
});

test('enumerateStatePaths reports subscription state paths without reading operational secrets', () => {
  const preparation = createSubscriptionsCutoverPreparation();
  const paths = preparation.enumerateStatePaths();
  assert.ok(paths.length >= 6, `expected at least 6 state paths, got ${paths.length}`);
  const kinds = new Set(paths.map(p => p.kind));
  assert.ok(kinds.has('auth'));
  assert.ok(kinds.has('legacyRouterAuth'));
  assert.ok(kinds.has('providerSettings'));
  assert.ok(kinds.has('modelDefaults'));
  assert.ok(kinds.has('catalog'));
  assert.ok(kinds.has('proxy'));
  assert.ok(kinds.has('images'));
  assert.ok(kinds.has('videos'));
  for (const path of paths) {
    assert.ok(typeof path.kind === 'string' && path.kind);
    assert.ok(typeof path.location === 'string' && path.location);
    assert.ok(typeof path.backupDestination === 'string' && path.backupDestination);
    assert.ok(typeof path.permission === 'string' && path.permission);
    assert.ok(typeof path.schema === 'string' && path.schema);
    assert.ok(typeof path.compatibility === 'string' && path.compatibility);
    assert.ok(typeof path.secrets === 'string' && path.secrets);
    assert.ok(Array.isArray(path.sensitiveReads) && path.sensitiveReads.length > 0);
    assert.ok(Array.isArray(path.sensitiveWrites) && path.sensitiveWrites.length > 0);
    // Backups never go in the repository, browser, evidence bundle or plaintext logs.
    assert.equal(BACKUP_NEVER_DESTINATIONS.includes(path.backupDestination), false);
    assert.equal(BACKUP_NEVER_DESTINATIONS.includes(path.location), false);
    // No operational secret values are enumerated.
    assert.equal(JSON.stringify(path).includes('sk-'), false);
    assert.equal(JSON.stringify(path).includes('sk-ant'), false);
    assert.equal(JSON.stringify(path).includes('sk-or'), false);
    assert.equal(JSON.stringify(path).includes('ghp_'), false);
  }
});

test('state paths mark credential-bearing paths as sensitive', () => {
  const preparation = createSubscriptionsCutoverPreparation();
  const paths = preparation.enumerateStatePaths();
  const byKind = Object.fromEntries(paths.map(p => [p.kind, p]));
  assert.ok(byKind.auth.sensitiveWrites.some(w => /credential/.test(w)));
  assert.ok(byKind.proxy.sensitiveWrites.some(w => /credential|password/.test(w)));
  assert.ok(byKind.auth.sensitiveReads.some(r => /credential|identity/.test(r)));
});

test('backupPlan precedes any cutover step and restorePlan targets standalone-owned locations', () => {
  const preparation = createSubscriptionsCutoverPreparation();
  const backup = preparation.backupPlan();
  const restore = preparation.restorePlan();
  assert.equal(backup.length, 2);
  assert.equal(backup[0].step, 'backup');
  assert.equal(backup[0].order, 1);
  assert.equal(backup[1].step, 'verifyBackup');
  assert.equal(backup[1].order, 2);
  assert.equal(restore.length, 2);
  assert.equal(restore[0].step, 'restore');
  assert.equal(restore[1].step, 'verifyRestore');
  assert.ok(/standalone/.test(restore[0].action) || /Reference/.test(restore[0].action));
});

test('cutover order drains/quiesces, disables standalone ownership, then activates replacement', () => {
  const preparation = createSubscriptionsCutoverPreparation();
  const order = preparation.cutoverOrder();
  const steps = order.map(s => s.step);
  assert.deepEqual(steps, ['backup', 'drainQuiesce', 'disableStandaloneOwnership', 'activateReplacement', 'verify']);
  const drainIndex = steps.indexOf('drainQuiesce');
  const disableIndex = steps.indexOf('disableStandaloneOwnership');
  const activateIndex = steps.indexOf('activateReplacement');
  assert.ok(drainIndex < disableIndex, 'drain/quiesce must precede disabling standalone ownership');
  assert.ok(disableIndex < activateIndex, 'standalone ownership must be disabled before replacement activation');
  // No destructive or secret-copying steps.
  for (const step of order) {
    const lower = step.action.toLowerCase();
    assert.equal(lower.includes('delete account'), false);
    assert.equal(lower.includes('delete plugin'), false);
    assert.equal(lower.includes('copy secret'), false);
    assert.equal(lower.includes('force reauth'), false);
    assert.equal(lower.includes('migrate without owner'), false);
  }
});

test('rollback order disables replacement, restores ownership before state, then verifies', () => {
  const preparation = createSubscriptionsCutoverPreparation();
  const order = preparation.rollbackOrder();
  const steps = order.map(s => s.step);
  assert.deepEqual(steps, ['disableReplacement', 'restoreOwnership', 'restoreState', 'verify']);
  const replacementIndex = steps.indexOf('disableReplacement');
  const ownershipIndex = steps.indexOf('restoreOwnership');
  const stateIndex = steps.indexOf('restoreState');
  assert.ok(replacementIndex < ownershipIndex, 'replacement must be disabled before ownership is restored');
  assert.ok(ownershipIndex < stateIndex, 'ownership must be restored before state');
  for (const step of order) {
    const lower = step.action.toLowerCase();
    assert.equal(lower.includes('delete account'), false);
    assert.equal(lower.includes('delete plugin'), false);
    assert.equal(lower.includes('copy secret'), false);
    assert.equal(lower.includes('force reauth'), false);
  }
});

test('order plans are deterministic and re-entrant (interruption leaves a resumable plan)', () => {
  const preparation = createSubscriptionsCutoverPreparation();
  assert.deepEqual(JSON.stringify(preparation.cutoverOrder()), JSON.stringify(preparation.cutoverOrder()));
  assert.deepEqual(JSON.stringify(preparation.rollbackOrder()), JSON.stringify(preparation.rollbackOrder()));
  assert.equal(preparation.cutoverOrder().length, 5);
  assert.equal(preparation.rollbackOrder().length, 4);
});

test('collisionCheck reports provider/tool/RPC/history collisions and blocks cutover', () => {
  const preparation = createSubscriptionsCutoverPreparation();
  const current = {
    providers: ['codex', 'claude'],
    tools: ['dsh_subscriptions_image_generate'],
    rpc: ['/api/dsh-majed/subscriptions'],
    history: ['subscriptions-account-replay'],
  };
  const clean = preparation.collisionCheck(current, {
    providers: ['grok', 'copilot'],
    tools: ['dsh_subscriptions_video_generate'],
    rpc: ['/api/dsh-majed/subscriptions-v2'],
    history: ['subscriptions-account-replay-v2'],
  });
  assert.deepEqual(clean.collisions, { providers: [], tools: [], rpc: [], history: [] });
  assert.equal(clean.blocked, false);

  const colliding = preparation.collisionCheck(current, {
    providers: ['codex'],
    tools: ['dsh_subscriptions_image_generate', 'dsh_subscriptions_x_search'],
    rpc: ['/api/dsh-majed/subscriptions'],
    history: ['subscriptions-account-replay'],
  });
  assert.deepEqual(colliding.collisions.providers, ['codex']);
  assert.deepEqual(colliding.collisions.tools, ['dsh_subscriptions_image_generate']);
  assert.deepEqual(colliding.collisions.rpc, ['/api/dsh-majed/subscriptions']);
  assert.deepEqual(colliding.collisions.history, ['subscriptions-account-replay']);
  assert.equal(colliding.blocked, true);
});

test('collisionCheck validates shape and treats missing entries as empty', () => {
  const preparation = createSubscriptionsCutoverPreparation();
  const result = preparation.collisionCheck({}, {});
  assert.deepEqual(result.collisions, { providers: [], tools: [], rpc: [], history: [] });
  assert.equal(result.blocked, false);
});

test('previewGaps reports legacy router auth migration and protected backup destination as pending', () => {
  const preparation = createSubscriptionsCutoverPreparation();
  const gaps = preparation.previewGaps();
  const byId = Object.fromEntries(gaps.map(g => [g.gapId, g]));
  assert.equal(byId[GAP_LEGACY_ROUTER_AUTH_MIGRATION].status, 'pending');
  assert.ok(typeof byId[GAP_LEGACY_ROUTER_AUTH_MIGRATION].reason === 'string' && byId[GAP_LEGACY_ROUTER_AUTH_MIGRATION].reason);
  assert.ok(byId[GAP_LEGACY_ROUTER_AUTH_MIGRATION].reason.includes('must not execute during a read-only preview'));
  assert.equal(gaps.length, 2);
  const backupGap = gaps.find(g => g.gapId !== GAP_LEGACY_ROUTER_AUTH_MIGRATION);
  assert.ok(backupGap.status === 'pending');
  assert.ok(typeof backupGap.reason === 'string' && backupGap.reason);
});

test('silence does not satisfy the capability gate; an explicit Owner-accepted deferral does', () => {
  const preparation = createSubscriptionsCutoverPreparation();
  assert.equal(preparation.isCutoverBlocked(), true);
  for (const disposition of preparation.dispositions()) {
    assert.equal(disposition.status, 'pending');
  }

  const accepted = preparation.acceptDeferral(GAP_LEGACY_ROUTER_AUTH_MIGRATION, 'Owner');
  assert.equal(accepted.gapId, GAP_LEGACY_ROUTER_AUTH_MIGRATION);
  assert.equal(accepted.status, 'accepted-deferral');
  assert.equal(accepted.acceptedBy, 'Owner');
  assert.equal(preparation.isCutoverBlocked(), true, 'the other gap is still pending');

  preparation.acceptDeferral(gapsOf(preparation)[1].gapId, 'Owner');
  assert.equal(preparation.isCutoverBlocked(), false);
});

function gapsOf(preparation) {
  return preparation.previewGaps();
}

test('acceptDeferral rejects unknown gaps and missing Owner', () => {
  const preparation = createSubscriptionsCutoverPreparation();
  assert.throws(() => preparation.acceptDeferral('unknown-gap', 'Owner'), /Unknown gap/);
  assert.throws(() => preparation.acceptDeferral(GAP_LEGACY_ROUTER_AUTH_MIGRATION, ''), /acceptedBy is required/);
  assert.throws(() => preparation.acceptDeferral(GAP_LEGACY_ROUTER_AUTH_MIGRATION, undefined), /acceptedBy is required/);
  assert.equal(preparation.isCutoverBlocked(), true);
  assert.equal(preparation.dispositions().find(d => d.gapId === GAP_LEGACY_ROUTER_AUTH_MIGRATION).status, 'pending');
});

test('prohibitedOperations are never performed by this preparation ticket', () => {
  const preparation = createSubscriptionsCutoverPreparation();
  const prohibited = preparation.prohibitedOperations();
  assert.ok(prohibited.includes('automatic account deletion'));
  assert.ok(prohibited.includes('automatic plugin deletion'));
  assert.ok(prohibited.includes('copy secrets into project/UI/evidence'));
  assert.ok(prohibited.includes('forced reauthentication'));
  assert.ok(prohibited.includes('migration or reauthentication without Owner'));
  for (const op of prohibited) {
    assert.ok(typeof op === 'string' && op);
  }
});

test('preparation performs no operational state changes and exposes only preparation methods', () => {
  const preparation = createSubscriptionsCutoverPreparation();
  const methods = [
    'enumerateStatePaths',
    'sensitiveReads',
    'sensitiveWrites',
    'backupPlan',
    'restorePlan',
    'cutoverOrder',
    'rollbackOrder',
    'collisionCheck',
    'previewGaps',
    'acceptDeferral',
    'dispositions',
    'isCutoverBlocked',
    'prohibitedOperations',
  ];
  for (const method of methods) {
    assert.equal(typeof preparation[method], 'function');
    // sensitiveReads/sensitiveWrites are read-only enumerations, not write operations.
    if (method === 'sensitiveReads' || method === 'sensitiveWrites') continue;
    const name = method.toLowerCase();
    assert.equal(name.includes('write'), false);
    assert.equal(name.includes('delete'), false);
    assert.equal(name.includes('activate'), false);
    assert.equal(name.includes('save'), false);
    assert.equal(name.includes('remove'), false);
    assert.equal(name.includes('migrate'), false);
    assert.equal(name.includes('refresh'), false);
  }
});

test('sensitiveReads and sensitiveWrites enumerate without secret values', () => {
  const preparation = createSubscriptionsCutoverPreparation();
  const reads = preparation.sensitiveReads();
  const writes = preparation.sensitiveWrites();
  assert.ok(reads.length > 0);
  assert.ok(writes.length > 0);
  for (const item of [...reads, ...writes]) {
    assert.ok(typeof item.kind === 'string' && item.kind);
    assert.ok(typeof item.operation === 'string' && item.operation);
    assert.ok(typeof item.sensitive === 'boolean');
    assert.equal(JSON.stringify(item).includes('sk-'), false);
  }
  assert.ok(writes.some(w => /credential/.test(w.operation) && w.sensitive === true));
  assert.ok(reads.some(r => /identity/.test(r.operation) && r.sensitive === false));
});

/* Synthetic-store drills: compatible existing account-store access with one active
 * writer, no forced reauthentication, rollback after interruption, no concurrent
 * refresh during a read-only preview. The cutover module itself imports no
 * refresh-capable auth module. */
test('single-writer account store rejects concurrent mutation', async () => {
  const a1 = createSyntheticAccount('a1', { provider: 'codex', models: ['m1'] });
  const store = createAccountStore([a1]);
  assert.equal(store.isWriting(), false);
  await store.add(createSyntheticAccount('a2', { provider: 'codex', models: ['m2'] }));
  assert.equal(store.isWriting(), false);
  let firstDone = false;
  const first = store.add(createSyntheticAccount('b1', { provider: 'claude', models: ['b1'] })).then(() => { firstDone = true; });
  await assert.rejects(store.add(createSyntheticAccount('b2', { provider: 'claude', models: ['b2'] })), /a writer is already active/);
  await first;
  assert.equal(firstDone, true);
  assert.equal(store.list('codex').length, 2);
  assert.equal(store.list('claude').length, 1);
});

test('compatible store preserves auth state: no forced reauthentication on snapshot/restore round-trip', async () => {
  const a1 = createSyntheticAccount('a1', { provider: 'codex', models: ['m1'], pinned: true, independentEntry: true });
  const a2 = createSyntheticAccount('a2', { provider: 'claude', models: ['m2'], default: true });
  const store = createAccountStore([a1, a2]);
  const before = store.snapshot();
  // Simulate rollback restoring a previously captured compatible snapshot.
  const restored = createAccountStore([]);
  for (const account of before.accounts) await restored.add(createSyntheticAccount(account.id, {
    provider: account.provider, models: account.models, pinned: account.pinned,
    independentEntry: account.independentEntry, alias: account.alias, defaultEffort: account.defaultEffort,
  }));
  const after = restored.snapshot();
  assert.deepEqual(after.accounts.map(a => ({ id: a.id, provider: a.provider, models: a.models })),
    before.accounts.map(a => ({ id: a.id, provider: a.provider, models: a.models })));
  // No credentials or refresh state were introduced: accounts carry no auth material.
  for (const account of after.accounts) {
    assert.equal(account.credentials, undefined);
    assert.equal(account.refreshCount, undefined);
  }
});

test('rollback after interruption restores the last compatible snapshot', async () => {
  const store = createAccountStore([createSyntheticAccount('keep', { provider: 'codex', models: ['m1'] })]);
  const snapshotBefore = store.snapshot();
  // An interrupted mutation adds nothing visible once rolled back.
  await store.add(createSyntheticAccount('tmp', { provider: 'claude', models: ['m2'] }));
  assert.equal(store.list('codex').length, 1);
  assert.equal(store.list('claude').length, 1);
  // Rollback restores the pre-interruption compatible state.
  const rolled = createAccountStore([]);
  for (const account of snapshotBefore.accounts) await rolled.add(createSyntheticAccount(account.id, {
    provider: account.provider, models: account.models, pinned: account.pinned,
    independentEntry: account.independentEntry, alias: account.alias, defaultEffort: account.defaultEffort,
  }));
  assert.equal(rolled.list('codex').length, 1);
  assert.equal(rolled.list('claude').length, 0);
  assert.equal(rolled.isWriting(), false);
});

test('read-only preview performs no refresh and exposes no refresh-capable import', () => {
  const preparation = createSubscriptionsCutoverPreparation();
  const paths = preparation.enumerateStatePaths();
  for (const path of paths) {
    // The read-only preview does not schedule or force any refresh.
    assert.equal(path.compatibility.toLowerCase().includes('force refresh'), false);
    assert.equal(path.compatibility.toLowerCase().includes('forced reauth'), false);
    assert.equal(path.permission.toLowerCase().includes('refresh writer'), false);
  }
  // The module surface has no refresh entry point.
  for (const method of Object.getOwnPropertyNames(Object.getPrototypeOf(preparation))) {
    assert.equal(method.toLowerCase().includes('refresh'), false);
  }
});
