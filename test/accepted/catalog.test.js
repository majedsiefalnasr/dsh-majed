import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createCatalog, createCatalogEntry,
  createEffortPolicy, EFFORTS,
} from '../../modules/catalog/index.js';
import { modelAllowedForPool } from '../../modules/subscriptions/account.js';
import { createSubscriptionsService } from '../../modules/subscriptions/index.js';
import { createWireAdapter } from '../../modules/subscriptions/index.js';
import { responsesTranslator } from '../../modules/subscriptions/wire.js';
import {
  createRegistry, createCandidate, candidateId,
} from '../../modules/auto/index.js';
import { collectAsync } from './_subscriptions-helpers.js';

function accountEntry(id, opts = {}) {
  return createCatalogEntry(id, {
    provider: 'codex', label: String(id), models: ['gpt-5', 'codex-1'], ...opts,
  });
}

async function* defaultStream() {
  yield { type: 'text', text: 'ok' };
  yield { type: 'finish', reason: { kind: 'stop' } };
}
async function defaultResolve() {
  return { context: { contextWindow: 128000 }, defaultMaxTokens: 4096 };
}

test('EFFORTS are the supported reasoning effort IDs', () => {
  assert.deepEqual([...EFFORTS], ['low', 'medium', 'high']);
});

test('createCatalogEntry preserves identity, preferences and catalog origin', () => {
  const entry = createCatalogEntry('acc-1', {
    provider: 'codex', label: 'ChatGPT', alias: 'c1', models: ['gpt-5', 'codex-1'],
    pinned: true, independentEntry: true, poolEnabled: false, poolModels: ['gpt-5'],
    defaultEffort: 'medium', source: 'discovered', visible: true,
    capabilities: { efforts: ['low', 'medium'], contextWindow: 128000 },
  });
  assert.equal(entry.id, 'acc-1');
  assert.equal(entry.provider, 'codex');
  assert.equal(entry.label, 'ChatGPT');
  assert.equal(entry.alias, 'c1');
  assert.deepEqual(entry.models, ['gpt-5', 'codex-1']);
  assert.equal(entry.pinned, true);
  assert.equal(entry.independentEntry, true);
  assert.equal(entry.poolEnabled, false);
  assert.deepEqual(entry.poolModels, ['gpt-5']);
  assert.equal(entry.defaultEffort, 'medium');
  assert.equal(entry.source, 'discovered');
  assert.equal(entry.visible, true);
  assert.deepEqual(entry.capabilities, { efforts: ['low', 'medium'], contextWindow: 128000 });
  // defaults
  const plain = createCatalogEntry('acc-2', { provider: 'codex', models: ['m1'] });
  assert.equal(plain.source, 'manual');
  assert.equal(plain.visible, true);
  assert.equal(plain.poolEnabled, true);
  assert.equal(plain.independentEntry, false);
  assert.equal(plain.pinned, false);
  assert.equal(plain.capabilities, undefined);
  assert.throws(() => createCatalogEntry('', { provider: 'codex' }));
  assert.throws(() => createCatalogEntry('acc-1', { provider: '' }));
  assert.throws(() => createCatalogEntry('acc-1', { provider: 'codex', source: 'bogus' }));
  assert.throws(() => createCatalogEntry('acc-1', { provider: 'codex', defaultEffort: 'bogus' }));
});

test('catalog add/get/remove/replace and listAccounts', () => {
  const a1 = accountEntry('a1', { pinned: true, independentEntry: true });
  const a2 = accountEntry('a2', { poolEnabled: true, poolModels: ['gpt-5'] });
  const catalog = createCatalog({ accounts: [a1, a2] });
  assert.equal(catalog.has('codex', 'a1'), true);
  assert.equal(catalog.has('codex', 'missing'), false);
  assert.equal(catalog.get('codex', 'a1').id, 'a1');
  assert.deepEqual(catalog.listAccounts('codex').map(e => e.id), ['a1', 'a2']);
  assert.deepEqual(catalog.listAccounts('claude').map(e => e.id), []);

  const added = catalog.addAccount(accountEntry('a3', { source: 'discovered' }));
  assert.equal(added.source, 'discovered');
  assert.equal(catalog.get('codex', 'a3').source, 'discovered');
  assert.deepEqual(catalog.listAccounts('codex').map(e => e.id), ['a1', 'a2', 'a3']);
  assert.throws(() => catalog.addAccount(accountEntry('a1')), /already exists/);

  const replaced = catalog.replaceAccount(accountEntry('a1', { alias: 'renamed' }));
  assert.equal(catalog.get('codex', 'a1').alias, 'renamed');

  const removed = catalog.remove('codex', 'a2');
  assert.equal(removed.id, 'a2');
  assert.equal(catalog.has('codex', 'a2'), false);
  assert.deepEqual(catalog.listAccounts('codex').map(e => e.id), ['a1', 'a3']);
  assert.throws(() => catalog.remove('codex', 'ghost'), /Unknown account/);
});

test('visibility hides models from the picker without removing the account', () => {
  const catalog = createCatalog({ accounts: [accountEntry('a1', { models: ['gpt-5', 'codex-1'] })] });
  const entries = catalog.listPickerEntries('codex');
  assert.equal(entries.length, 1);
  assert.deepEqual(entries[0].models, ['gpt-5', 'codex-1']);

  catalog.setVisibility('codex', 'a1', 'codex-1', false);
  assert.equal(catalog.isVisible('codex', 'a1', 'codex-1'), false);
  assert.equal(catalog.isVisible('codex', 'a1', 'gpt-5'), true);
  assert.equal(catalog.isVisible('claude', 'a1', 'gpt-5'), true); // unknown defaults visible
  const hidden = catalog.listPickerEntries('codex');
  assert.equal(hidden.length, 1);
  assert.deepEqual(hidden[0].models, ['gpt-5']); // codex-1 removed from picker

  catalog.setVisibility('codex', 'a1', 'codex-1', true);
  assert.deepEqual(catalog.listPickerEntries('codex')[0].models, ['gpt-5', 'codex-1']);
});

test('alias and display name resolution', () => {
  const catalog = createCatalog({ accounts: [
    accountEntry('a1', { alias: 'c1', label: 'ChatGPT' }),
    accountEntry('a2', { label: 'Codex' }),
    accountEntry('a3', {} ),
  ]});
  const entries = catalog.listPickerEntries('codex');
  assert.equal(entries[0].displayName, 'c1');
  assert.equal(entries[0].alias, 'c1');
  assert.equal(entries[1].displayName, 'Codex');
  assert.equal(entries[1].alias, undefined);
  assert.equal(entries[2].displayName, 'a3');

  catalog.setAlias('codex', 'a2', 'cx');
  assert.equal(catalog.get('codex', 'a2').alias, 'cx');
  assert.equal(catalog.listPickerEntries('codex')[1].displayName, 'cx');
});

test('pinned / independent entries and per-account pool allowlists', () => {
  const catalog = createCatalog({ accounts: [
    accountEntry('a1', { pinned: true, independentEntry: true, poolEnabled: false }),
    accountEntry('a2', { pinned: false, independentEntry: false, poolEnabled: true, poolModels: ['gpt-5'] }),
  ]});
  const e1 = catalog.get('codex', 'a1');
  assert.equal(e1.pinned, true);
  assert.equal(e1.independentEntry, true);
  assert.equal(e1.poolEnabled, false);
  const e2 = catalog.get('codex', 'a2');
  assert.equal(e2.poolEnabled, true);
  assert.deepEqual(e2.poolModels, ['gpt-5']);
  // absent allowlist permits every model; present allowlist restricts
  const storeAccount = catalog.get('codex', 'a1');
  assert.equal(modelAllowedForPool(storeAccount, 'codex-1'), true);
  assert.equal(modelAllowedForPool(catalog.get('codex', 'a2'), 'gpt-5'), true);
  assert.equal(modelAllowedForPool(catalog.get('codex', 'a2'), 'codex-1'), false);

  catalog.setPinned('codex', 'a2', true);
  assert.equal(catalog.get('codex', 'a2').pinned, true);
  catalog.setPoolEnabled('codex', 'a2', false);
  assert.equal(catalog.get('codex', 'a2').poolEnabled, false);
  catalog.setPoolModels('codex', 'a2', ['codex-1']);
  assert.deepEqual(catalog.get('codex', 'a2').poolModels, ['codex-1']);
});

test('default effort and account-specific capabilities', () => {
  const catalog = createCatalog({ accounts: [
    accountEntry('a1', { defaultEffort: 'medium', capabilities: { efforts: ['low', 'medium'], contextWindow: 128000 } }),
    accountEntry('a2', { defaultEffort: 'high' }),
  ]});
  assert.equal(catalog.get('codex', 'a1').defaultEffort, 'medium');
  assert.deepEqual(catalog.get('codex', 'a1').capabilities, { efforts: ['low', 'medium'], contextWindow: 128000 });
  assert.equal(catalog.get('codex', 'a2').capabilities, undefined);

  catalog.setDefaultEffort('codex', 'a2', 'low');
  assert.equal(catalog.get('codex', 'a2').defaultEffort, 'low');
  assert.throws(() => catalog.setDefaultEffort('codex', 'a2', 'bogus'));
  catalog.setCapability('codex', 'a1', 'gpt-5', { efforts: ['high'], contextWindow: 200000 });
  assert.deepEqual(catalog.getCapability('codex', 'a1', 'gpt-5'), { efforts: ['high'], contextWindow: 200000 });
  assert.equal(catalog.getCapability('codex', 'a1', 'missing'), undefined);
});

test('absent catalog behaves as empty, never errors', () => {
  const catalog = createCatalog();
  assert.deepEqual(catalog.listAccounts('codex'), []);
  assert.deepEqual(catalog.listPickerEntries('codex'), []);
  assert.equal(catalog.get('codex', 'a1'), undefined);
  assert.equal(catalog.has('codex', 'a1'), false);
  assert.equal(catalog.isVisible('codex', 'a1', 'gpt-5'), true);
  assert.equal(catalog.isStale(), false);
  assert.equal(catalog.generation(), 0);
});

test('stale catalog and refresh invalidation (generation bumps)', () => {
  const catalog = createCatalog({ accounts: [accountEntry('a1')] });
  assert.equal(catalog.isStale(), false);
  const g0 = catalog.generation();
  catalog.markStale();
  assert.equal(catalog.isStale(), true);
  // stale catalog still serves picker entries (no automatic network churn)
  assert.deepEqual(catalog.listPickerEntries('codex').map(e => e.id), ['a1']);
  const g1 = catalog.refresh();
  assert.equal(catalog.isStale(), false);
  assert.ok(g1 > g0, 'refresh must bump generation');
  const g2 = catalog.addAccount(accountEntry('a2', { source: 'discovered' }), 'discovered');
  assert.ok(catalog.generation() > g1, 'mutation must bump generation');
  catalog.markStale();
  assert.equal(catalog.isStale(), true);
  const g3 = catalog.refresh();
  assert.ok(g3 > catalog.generation() - 1 || g3 >= g2);
  assert.equal(catalog.isStale(), false);
});

test('picker entries expose display name, visibility, pool participation and effort', () => {
  const catalog = createCatalog({ accounts: [
    accountEntry('a1', { alias: 'c1', label: 'ChatGPT', pinned: true, independentEntry: true, poolEnabled: false, defaultEffort: 'medium', capabilities: { efforts: ['low', 'medium'], contextWindow: 128000 } }),
    accountEntry('a2', { label: 'Pool', poolEnabled: true, poolModels: ['gpt-5'], defaultEffort: 'high', capabilities: { efforts: ['low', 'high'] } }),
    accountEntry('a3', { label: 'Hidden', models: ['gpt-5'] }),
  ]});
  catalog.setVisibility('codex', 'a3', 'gpt-5', false);
  catalog.setVisibility('codex', 'a3', 'codex-1', false);
  const entries = catalog.listPickerEntries('codex');
  assert.equal(entries.length, 2);
  assert.deepEqual(entries.map(e => e.id), ['a1', 'a2']);
  assert.equal(entries[0].displayName, 'c1');
  assert.equal(entries[0].pinned, true);
  assert.equal(entries[0].poolEnabled, false);
  assert.equal(entries[0].defaultEffort, 'medium');
  assert.deepEqual(entries[0].capabilities, { efforts: ['low', 'medium'], contextWindow: 128000 });
  assert.equal(entries[1].poolEnabled, true);
  assert.deepEqual(entries[1].poolModels, ['gpt-5']);
  assert.equal(entries[1].defaultEffort, 'high');
});

test('effort policy: explicit effort wins, never overrides manual or catalog defaults', () => {
  const policy = createEffortPolicy();
  assert.equal(policy.resolveEffort({ explicitEffort: 'high' }), 'high');
  assert.equal(policy.resolveEffort({ explicitEffort: 'high', speed: 'fast' }), 'high'); // speed does not override explicit
  assert.equal(policy.resolveEffort({ manualEffort: 'low', speed: 'fast' }), 'low'); // manual wins over fast
  assert.equal(policy.resolveEffort({ accountDefaultEffort: 'high', speed: 'fast' }), 'high'); // catalog default wins
  assert.equal(policy.resolveEffort({ modelDefaultEffort: 'low', speed: 'fast' }), 'low'); // model default wins
  assert.equal(policy.resolveEffort({ speed: 'fast' }), 'low'); // fast -> low
  assert.equal(policy.resolveEffort({ speed: 'standard' }), 'medium'); // standard -> medium default
  assert.equal(policy.resolveEffort({}), 'medium'); // no inputs -> medium default
  assert.equal(policy.resolveEffort({ manualEffort: 'medium', accountDefaultEffort: 'low' }), 'medium'); // manual over account default
  assert.throws(() => policy.resolveEffort({ explicitEffort: 'bogus' }));
  assert.throws(() => policy.resolveEffort({ manualEffort: 'bogus' }));
});

test('effort policy: Standard/Fast and /fast are per-session, never create Auto membership', () => {
  const policy = createEffortPolicy();
  const registry = createRegistry();
  const before = registry.size();
  policy.setSpeed('sess-1', 'fast');
  assert.equal(policy.getSpeed('sess-1'), 'fast');
  assert.equal(policy.resolveEffort({ speed: 'fast' }), 'low');
  assert.equal(policy.resolveEffort({ speed: policy.getSpeed('sess-1') }), 'low'); // /fast applies for the session
  policy.setSpeed('sess-1', 'standard');
  assert.equal(policy.getSpeed('sess-1'), 'standard');
  assert.equal(policy.resolveEffort({ speed: 'standard' }), 'medium');
  policy.clearSpeed('sess-1');
  assert.equal(policy.getSpeed('sess-1'), 'standard');
  assert.equal(registry.size(), before, 'effort policy never enrolls Auto candidates');
  assert.equal(registry.has(candidateId({ provider: 'codex', account: 'a', model: 'm' })), false);
});

test('effort policy: model defaults, supported efforts and Codex context budgets', () => {
  const policy = createEffortPolicy();
  policy.setModelDefault('codex', 'gpt-5', 'low');
  assert.equal(policy.getModelDefault('codex', 'gpt-5'), 'low');
  assert.equal(policy.getModelDefault('codex', 'missing'), undefined);
  assert.throws(() => policy.setModelDefault('codex', 'gpt-5', 'bogus'));
  policy.clearModelDefault('codex', 'gpt-5');
  assert.equal(policy.getModelDefault('codex', 'gpt-5'), undefined);

  policy.setSupportedEfforts('codex', 'a1', 'gpt-5', ['low', 'medium']);
  assert.equal(policy.isEffortSupported('codex', 'a1', 'gpt-5', 'medium'), true);
  assert.equal(policy.isEffortSupported('codex', 'a1', 'gpt-5', 'high'), false);
  assert.equal(policy.isEffortSupported('codex', 'a1', 'gpt-5', 'unsupported'), false);

  policy.setContextBudget('codex', 'gpt-5', 128000);
  assert.equal(policy.getContextBudget('codex', 'gpt-5'), 128000);
  assert.equal(policy.contextFits('codex', 'gpt-5', 128000), true);
  assert.equal(policy.contextFits('codex', 'gpt-5', 200000), false);
  assert.equal(policy.getContextBudget('codex', 'missing'), undefined);
});

test('catalog and login updates never enroll candidates into Auto', () => {
  const catalog = createCatalog({ accounts: [accountEntry('a1', { source: 'discovered' })] });
  const registry = createRegistry();
  const before = registry.size();
  catalog.addAccount(accountEntry('a2', { source: 'manual', defaultEffort: 'high' }), 'manual');
  catalog.setDefaultEffort('codex', 'a1', 'medium');
  catalog.setVisibility('codex', 'a1', 'codex-1', false);
  catalog.markStale(); catalog.refresh();
  assert.equal(registry.size(), before, 'catalog mutations never enroll into Auto');
  assert.equal(registry.has(candidateId({ provider: 'codex', account: 'a1', model: 'gpt-5' })), false);
  assert.equal(registry.has(candidateId({ provider: 'codex', account: 'a2', model: 'gpt-5' })), false);
  // effort policy likewise never enrolls
  const policy = createEffortPolicy();
  policy.setModelDefault('codex', 'gpt-5', 'medium');
  policy.resolveEffort({ accountDefaultEffort: catalog.get('codex', 'a1').defaultEffort });
  assert.equal(registry.size(), before);
});

test('picker selection dispatches directly to the advertised account, not a pool', async () => {
  const accA = accountEntry('acc-a', { label: 'ChatGPT', alias: 'c1', pinned: true, independentEntry: true, poolEnabled: false, models: ['gpt-5', 'codex-1'] });
  const accB = accountEntry('acc-b', { label: 'Pool', poolEnabled: true, poolModels: ['gpt-5'], models: ['gpt-5'] });
  const catalog = createCatalog({ accounts: [accA, accB] });

  const dispatched = []; // { model, account }
  const adapter = createWireAdapter('codex', responsesTranslator(), {
    resolveOwnModel: async () => defaultResolve(),
    streamAccount: async function* (options, account) {
      dispatched.push({ model: options.model, account: account.id });
      yield* defaultStream();
    },
  });
  const service = createSubscriptionsService(
    { llm: { registerAdapter: () => () => {} } },
    { accounts: [accA, accB] },
  );
  service.register('codex', adapter);

  // Picker selects acc-a / gpt-5: direct route binds to the advertised account.
  await collectAsync(await service.stream({ provider: 'codex', model: 'gpt-5', messages: [] }));
  assert.equal(dispatched.length, 1);
  assert.equal(dispatched[0].model, 'gpt-5');
  assert.equal(dispatched[0].account, 'acc-a'); // dispatched to the advertised account

  // account-only model codex-1 stays bound to acc-a (its only advertiser).
  await collectAsync(await service.stream({ provider: 'codex', model: 'codex-1', messages: [] }));
  assert.equal(dispatched.length, 2);
  assert.equal(dispatched[1].model, 'codex-1');
  assert.equal(dispatched[1].account, 'acc-a');

  // acc-b (pooled only, not pinned/independent) is never chosen for these models.
  assert.equal(dispatched.filter(d => d.account === 'acc-b').length, 0);
});

test('catalog invalidation is observable through the service snapshot', () => {
  const catalog = createCatalog({ accounts: [accountEntry('a1')] });
  const service = createSubscriptionsService({}, { accounts: [accountEntry('a1')] });
  const genBefore = catalog.generation();
  catalog.markStale();
  assert.equal(catalog.isStale(), true);
  const genAfter = catalog.refresh();
  assert.ok(genAfter > genBefore);
  assert.equal(catalog.isStale(), false);
  const snap = service.snapshot();
  assert.equal(snap.store.accounts.length, 1);
  assert.equal(snap.disposed, false);
});
