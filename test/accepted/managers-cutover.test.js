import test from 'node:test';
import assert from 'node:assert/strict';
import { createCutoverPreparation, GAP_PROFILE_ONLY_HOOKS, GAP_MCP_IMPORT_EXPORT_INGEST, BACKUP_NEVER_DESTINATIONS, CUTOVER_PREPARATION } from '../../modules/managers/cutover.js';

test('cutover preparation service constant is exported', () => {
  assert.equal(CUTOVER_PREPARATION, 'dshMajedManagersCutover');
});

test('gap identifiers are stable planning references', () => {
  assert.equal(GAP_PROFILE_ONLY_HOOKS, 'profile-only-hook-definitions');
  assert.equal(GAP_MCP_IMPORT_EXPORT_INGEST, 'mcp-import-export-ingest');
});

test('backups never target the repository, browser, evidence bundle or plaintext logs', () => {
  assert.deepEqual(BACKUP_NEVER_DESTINATIONS, ['repository', 'browser', 'evidence-bundle', 'plaintext-logs']);
});

test('enumerateStatePaths reports all Manager state paths without reading secrets', () => {
  const preparation = createCutoverPreparation();
  const paths = preparation.enumerateStatePaths();
  assert.equal(paths.length, 5);
  const kinds = new Set(paths.map(p => p.kind));
  assert.ok(kinds.has('mcpServers'));
  assert.ok(kinds.has('hooks'));
  assert.ok(kinds.has('commandHooks'));
  assert.ok(kinds.has('rules'));
  assert.ok(kinds.has('skills'));
  for (const path of paths) {
    assert.ok(typeof path.kind === 'string' && path.kind);
    assert.ok(typeof path.location === 'string' && path.location);
    assert.ok(typeof path.backupDestination === 'string' && path.backupDestination);
    assert.ok(typeof path.permission === 'string' && path.permission);
    assert.ok(typeof path.schema === 'string' && path.schema);
    assert.ok(typeof path.compatibility === 'string' && path.compatibility);
    assert.ok(typeof path.secrets === 'string' && path.secrets);
    // Backups never go in the repository, browser, evidence bundle or plaintext logs.
    assert.equal(BACKUP_NEVER_DESTINATIONS.includes(path.backupDestination), false);
    assert.equal(BACKUP_NEVER_DESTINATIONS.includes(path.location), false);
    // No operational secret values are enumerated (describing masking policy is not a secret).
    assert.equal(JSON.stringify(path).includes('sk-'), false);
  }
});

test('backupPlan precedes any cutover step and restorePlan targets Reference-owned locations', () => {
  const preparation = createCutoverPreparation();
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
  assert.ok(/Reference/.test(restore[0].action));
});

test('cutover order disables Reference before activating the replacement', () => {
  const preparation = createCutoverPreparation();
  const order = preparation.cutoverOrder();
  const steps = order.map(s => s.step);
  assert.deepEqual(steps, ['backup', 'disableReference', 'activateReplacement', 'verify']);
  const referenceIndex = steps.indexOf('disableReference');
  const replacementIndex = steps.indexOf('activateReplacement');
  assert.ok(referenceIndex < replacementIndex, 'Reference must be disabled before replacement activation');
  // No automatic plugin deletion, no imported Approval, no generated handoff edits.
  for (const step of order) {
    assert.notEqual(step.action.toLowerCase(), 'deleteplugin');
    assert.notEqual(step.action.toLowerCase(), 'importapproval');
    assert.notEqual(step.action.toLowerCase(), 'generatedhandoffedit');
    assert.equal(step.action.toLowerCase().includes('delete reference plugin'), false);
    assert.equal(step.action.toLowerCase().includes('import approval'), false);
    assert.equal(step.action.toLowerCase().includes('generated handoff'), false);
  }
});

test('rollback order disables the replacement before restoring Reference ownership', () => {
  const preparation = createCutoverPreparation();
  const order = preparation.rollbackOrder();
  const steps = order.map(s => s.step);
  assert.deepEqual(steps, ['disableReplacement', 'restoreReference', 'verify']);
  const replacementIndex = steps.indexOf('disableReplacement');
  const referenceIndex = steps.indexOf('restoreReference');
  assert.ok(replacementIndex < referenceIndex, 'replacement must be disabled before Reference ownership is restored');
  for (const step of order) {
    assert.equal(step.action.toLowerCase().includes('delete reference plugin'), false);
    assert.equal(step.action.toLowerCase().includes('import approval'), false);
    assert.equal(step.action.toLowerCase().includes('generated handoff'), false);
  }
});

test('order plans are deterministic and re-entrant (interruption leaves a resumable plan)', () => {
  const preparation = createCutoverPreparation();
  const first = preparation.cutoverOrder();
  const second = preparation.cutoverOrder();
  assert.deepEqual(JSON.stringify(first), JSON.stringify(second));
  const rollbackFirst = preparation.rollbackOrder();
  const rollbackSecond = preparation.rollbackOrder();
  assert.deepEqual(JSON.stringify(rollbackFirst), JSON.stringify(rollbackSecond));
  // No step is destructive or partially applied: every order is a complete plan.
  assert.equal(first.length, 4);
  assert.equal(rollbackFirst.length, 3);
});

test('collisionCheck reports tool/route/slot/state collisions and blocks cutover', () => {
  const preparation = createCutoverPreparation();
  const current = {
    tools: ['read_file', 'shell.exec'],
    routes: ['/api/dsh-majed/managers'],
    slots: ['majed-settings'],
    state: ['majed-config-root'],
  };
  const proposedNoCollision = {
    tools: ['read_file_v2'],
    routes: ['/api/dsh-majed/managers-v2'],
    slots: ['majed-settings-v2'],
    state: ['majed-config-root-v2'],
  };
  const clean = preparation.collisionCheck(current, proposedNoCollision);
  assert.deepEqual(clean.collisions, { tools: [], routes: [], slots: [], state: [] });
  assert.equal(clean.blocked, false);

  const proposedCollision = {
    tools: ['read_file', 'shell.exec'],
    routes: ['/api/dsh-majed/managers', '/api/dsh-majed/skills'],
    slots: ['majed-settings', 'skills-manager'],
    state: ['majed-config-root', 'skills-config-root'],
  };
  const colliding = preparation.collisionCheck(current, proposedCollision);
  assert.deepEqual(colliding.collisions.tools, ['read_file', 'shell.exec']);
  assert.deepEqual(colliding.collisions.routes, ['/api/dsh-majed/managers']);
  assert.deepEqual(colliding.collisions.slots, ['majed-settings']);
  assert.deepEqual(colliding.collisions.state, ['majed-config-root']);
  assert.equal(colliding.blocked, true);
});

test('collisionCheck validates shape and treats missing entries as empty', () => {
  const preparation = createCutoverPreparation();
  const result = preparation.collisionCheck({}, {});
  assert.deepEqual(result.collisions, { tools: [], routes: [], slots: [], state: [] });
  assert.equal(result.blocked, false);
});

test('previewGaps reports profile-only hooks and MCP import/export as pending', () => {
  const preparation = createCutoverPreparation();
  const gaps = preparation.previewGaps();
  const byId = Object.fromEntries(gaps.map(g => [g.gapId, g]));
  assert.equal(byId[GAP_PROFILE_ONLY_HOOKS].status, 'pending');
  assert.equal(byId[GAP_MCP_IMPORT_EXPORT_INGEST].status, 'pending');
  assert.ok(typeof byId[GAP_PROFILE_ONLY_HOOKS].reason === 'string' && byId[GAP_PROFILE_ONLY_HOOKS].reason);
  assert.ok(typeof byId[GAP_MCP_IMPORT_EXPORT_INGEST].reason === 'string' && byId[GAP_MCP_IMPORT_EXPORT_INGEST].reason);
  assert.equal(gaps.length, 2);
});

test('silence does not satisfy the capability gate; an explicit Owner-accepted deferral does', () => {
  const preparation = createCutoverPreparation();
  // Silence: no deferral accepted -> cutover remains blocked.
  assert.equal(preparation.isCutoverBlocked(), true);
  assert.equal(preparation.dispositions().length, 2);
  for (const disposition of preparation.dispositions()) {
    assert.equal(disposition.status, 'pending');
  }

  // Explicit Owner-accepted deferral for one gap satisfies that gate only.
  const accepted = preparation.acceptDeferral(GAP_PROFILE_ONLY_HOOKS, 'Owner');
  assert.equal(accepted.gapId, GAP_PROFILE_ONLY_HOOKS);
  assert.equal(accepted.status, 'accepted-deferral');
  assert.equal(accepted.acceptedBy, 'Owner');
  assert.equal(preparation.isCutoverBlocked(), true, 'the other gap is still pending');

  // Accepting the remaining gap unblocks preparation (operational cutover still requires T29 approval).
  preparation.acceptDeferral(GAP_MCP_IMPORT_EXPORT_INGEST, 'Owner');
  assert.equal(preparation.isCutoverBlocked(), false);
});

test('acceptDeferral rejects unknown gaps and missing Owner', () => {
  const preparation = createCutoverPreparation();
  assert.throws(() => preparation.acceptDeferral('unknown-gap', 'Owner'), /Unknown gap/);
  assert.throws(() => preparation.acceptDeferral(GAP_PROFILE_ONLY_HOOKS, ''), /acceptedBy is required/);
  assert.throws(() => preparation.acceptDeferral(GAP_PROFILE_ONLY_HOOKS, undefined), /acceptedBy is required/);
  // A failed acceptance leaves the disposition unchanged (silence prevails).
  assert.equal(preparation.isCutoverBlocked(), true);
  assert.equal(preparation.dispositions().find(d => d.gapId === GAP_PROFILE_ONLY_HOOKS).status, 'pending');
});

test('prohibitedOperations are never performed by this preparation ticket', () => {
  const preparation = createCutoverPreparation();
  const prohibited = preparation.prohibitedOperations();
  assert.ok(prohibited.includes('automatic plugin deletion'));
  assert.ok(prohibited.includes('imported Approval'));
  assert.ok(prohibited.includes('generated handoff edits'));
  for (const op of prohibited) {
    assert.ok(typeof op === 'string' && op);
  }
});

test('preparation performs no operational state changes and exposes only preparation methods', () => {
  const preparation = createCutoverPreparation();
  const methods = [
    'enumerateStatePaths',
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
    assert.equal(method.toLowerCase().includes('write'), false);
    assert.equal(method.toLowerCase().includes('delete'), false);
    assert.equal(method.toLowerCase().includes('activate'), false);
    assert.equal(method.toLowerCase().includes('save'), false);
    assert.equal(method.toLowerCase().includes('remove'), false);
  }
});
