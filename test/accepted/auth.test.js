import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAuthService, PROVIDER_IDS, AUTH_ROUTE,
} from '../../modules/auth/index.js';
import { createSyntheticAccount } from '../../modules/subscriptions/account.js';

function makeClock(start = 0) {
  let t = start;
  return { now: () => t, advance: ms => { t += ms; } };
}

async function withService(options = {}) {
  const clock = options.clock || makeClock();
  const initial = {
    accounts: [
      createSyntheticAccount('g1', { provider: 'grok', models: ['grok-3'], label: 'Grok One' }),
      createSyntheticAccount('g2', { provider: 'grok', models: ['grok-3'], label: 'Grok Two' }),
      createSyntheticAccount('c1', { provider: 'copilot', models: ['gpt-5'], label: 'Copilot One' }),
      createSyntheticAccount('a1', { provider: 'antigravity', models: ['ag-1'], label: 'Antigravity One' }),
    ],
  };
  const service = createAuthService({}, initial, { clock, ...options });
  return { service, clock };
}

function collectInvalidation(calls) {
  return {
    onCatalogInvalidate: provider => calls.push({ kind: 'catalog', provider }),
    onAccountInvalidate: (provider, accountId) => calls.push({ kind: 'account', provider, accountId }),
  };
}

test('PROVIDER_IDS and AUTH_ROUTE', () => {
  assert.deepEqual([...PROVIDER_IDS], ['grok', 'copilot', 'antigravity']);
  assert.equal(AUTH_ROUTE, '/api/dsh-majed/auth');
});

test('Grok device login returns a pending device challenge', async () => {
  const { service } = await withService();
  const result = await service.login({ provider: 'grok', accountId: 'g1', mechanism: 'device' });
  assert.equal(result.provider, 'grok');
  assert.equal(result.accountId, 'g1');
  assert.equal(result.mechanism, 'device');
  assert.equal(result.status, 'pending');
  assert.equal(typeof result.challenge.deviceCode, 'string');
  assert.equal(typeof result.challenge.userCode, 'string');
  assert.equal(typeof result.challenge.verificationUri, 'string');
  assert.equal(result.challenge.intervalMs, 5_000);
  assert.equal(typeof result.expiresAt, 'number');
  // The account exists in the compatible store.
  assert.equal(service.store.get('grok', 'g1').id, 'g1');
});

test('Grok device poll returns authorization_pending by default', async () => {
  const { service } = await withService();
  const { challenge: { deviceCode } } = await service.login({ provider: 'grok', accountId: 'g1', mechanism: 'device' });
  const polled = await service.devicePoll({ provider: 'grok', accountId: 'g1', deviceCode });
  assert.equal(polled.status, 'authorization_pending');
  assert.equal(polled.intervalMs, 5_000);
});

test('Grok device poll succeeds when the device outcome is authorized', async () => {
  const deviceOutcomes = new Map();
  const { service, clock } = await withService({ deviceOutcomes });
  const { challenge: { deviceCode } } = await service.login({ provider: 'grok', accountId: 'g1', mechanism: 'device' });
  deviceOutcomes.set(deviceCode, 'authorized');
  const result = await service.devicePoll({ provider: 'grok', accountId: 'g1', deviceCode });
  assert.equal(result.status, 'authorized');
  assert.equal(result.authorized, true);
  const snap = service.snapshot();
  const entry = snap.accounts.find(a => a.accountId === 'g1' && a.provider === 'grok');
  assert.equal(entry.status, 'authorized');
  assert.equal(entry.hasTokens, true);
  // No credentials are exposed in the snapshot.
  assert.equal(entry.deviceCode, undefined);
  assert.equal(entry.state, undefined);
  clock.advance(1000);
  assert.equal(service.health.isMemberAvailable('grok', 'g1', '*', clock.now()), true);
});

test('Grok device cancel then poll reports access denied', async () => {
  const { service } = await withService();
  const { challenge: { deviceCode } } = await service.login({ provider: 'grok', accountId: 'g1', mechanism: 'device' });
  const cancelled = await service.deviceCancel({ provider: 'grok', accountId: 'g1', deviceCode });
  assert.equal(cancelled.status, 'cancelled');
  assert.equal(cancelled.cancelled, true);
  await assert.rejects(
    service.devicePoll({ provider: 'grok', accountId: 'g1', deviceCode }),
    { code: 'GROK_ACCESS_DENIED' },
  );
});

test('Grok device expiry reports device expired via the clock', async () => {
  const clock = makeClock(1000);
  const { service } = await withService({ clock });
  const { challenge: { deviceCode } } = await service.login({ provider: 'grok', accountId: 'g1', mechanism: 'device' });
  // TTL is 10 minutes; advance past it.
  clock.advance(10 * 60_000 + 1);
  await assert.rejects(
    service.devicePoll({ provider: 'grok', accountId: 'g1', deviceCode }),
    { code: 'GROK_DEVICE_EXPIRED' },
  );
  const snap = service.snapshot();
  const entry = snap.accounts.find(a => a.accountId === 'g1');
  assert.equal(entry.status, 'expired');
});

test('Grok device poll with wrong device code reports invalid code', async () => {
  const { service } = await withService();
  await service.login({ provider: 'grok', accountId: 'g1', mechanism: 'device' });
  await assert.rejects(
    service.devicePoll({ provider: 'grok', accountId: 'g1', deviceCode: 'wrong' }),
    { code: 'GROK_INVALID_CODE' },
  );
});

test('Copilot browser login returns a pending authorization URL and state', async () => {
  const { service } = await withService();
  const result = await service.login({ provider: 'copilot', accountId: 'c1', mechanism: 'browser' });
  assert.equal(result.mechanism, 'browser');
  assert.equal(result.status, 'pending');
  assert.equal(typeof result.challenge.authUrl, 'string');
  assert.equal(typeof result.challenge.state, 'string');
});

test('Copilot callback with matching state and code authorizes the account', async () => {
  const { service } = await withService();
  const { challenge: { state } } = await service.login({ provider: 'copilot', accountId: 'c1', mechanism: 'browser' });
  const result = await service.callback({ provider: 'copilot', accountId: 'c1', code: 'cp_code_1', state });
  assert.equal(result.status, 'authorized');
  assert.equal(result.authorized, true);
  const snap = service.snapshot();
  const entry = snap.accounts.find(a => a.accountId === 'c1');
  assert.equal(entry.status, 'authorized');
  assert.equal(entry.hasTokens, true);
  assert.equal(entry.state, undefined);
});

test('Copilot callback with wrong state reports invalid state', async () => {
  const { service } = await withService();
  await service.login({ provider: 'copilot', accountId: 'c1', mechanism: 'browser' });
  await assert.rejects(
    service.callback({ provider: 'copilot', accountId: 'c1', code: 'cp_code_1', state: 'wrong' }),
    { code: 'COPILOT_INVALID_STATE' },
  );
});

test('Copilot callback with missing code reports invalid code', async () => {
  const { service } = await withService();
  const { challenge: { state } } = await service.login({ provider: 'copilot', accountId: 'c1', mechanism: 'browser' });
  await assert.rejects(
    service.callback({ provider: 'copilot', accountId: 'c1', code: undefined, state }),
    { code: 'COPILOT_INVALID_CODE' },
  );
});

test('Copilot manual login authorizes immediately with tokens', async () => {
  const { service } = await withService();
  const result = await service.login({ provider: 'copilot', accountId: 'c1', mechanism: 'manual', tokens: { access_token: 'synthetic' } });
  assert.equal(result.status, 'authorized');
  assert.equal(result.authorized, true);
  const snap = service.snapshot();
  const entry = snap.accounts.find(a => a.accountId === 'c1');
  assert.equal(entry.hasTokens, true);
});

test('Copilot manual login without tokens is rejected', async () => {
  const { service } = await withService();
  await assert.rejects(
    service.login({ provider: 'copilot', accountId: 'c1', mechanism: 'manual' }),
    { code: 'COPILOT_MISSING_TOKENS' },
  );
});

test('Antigravity device login and poll behave like the device flow', async () => {
  const deviceOutcomes = new Map();
  const { service } = await withService({ deviceOutcomes });
  const { challenge: { deviceCode } } = await service.login({ provider: 'antigravity', accountId: 'a1', mechanism: 'device' });
  assert.equal(typeof deviceCode, 'string');
  const polled = await service.devicePoll({ provider: 'antigravity', accountId: 'a1', deviceCode });
  assert.equal(polled.status, 'authorization_pending');
  deviceOutcomes.set(deviceCode, 'authorized');
  const result = await service.devicePoll({ provider: 'antigravity', accountId: 'a1', deviceCode });
  assert.equal(result.status, 'authorized');
  const snap = service.snapshot();
  const entry = snap.accounts.find(a => a.accountId === 'a1');
  assert.equal(entry.status, 'authorized');
  assert.equal(entry.hasTokens, true);
});

test('Antigravity device expiry reports antigravity device expired', async () => {
  const clock = makeClock(1000);
  const { service } = await withService({ clock });
  const { challenge: { deviceCode } } = await service.login({ provider: 'antigravity', accountId: 'a1', mechanism: 'device' });
  clock.advance(10 * 60_000 + 1);
  await assert.rejects(
    service.devicePoll({ provider: 'antigravity', accountId: 'a1', deviceCode }),
    { code: 'ANTIGRAVITY_DEVICE_EXPIRED' },
  );
});

test('Provider-specific failure codes are distinct per provider', async () => {
  const { service } = await withService();
  // grok
  await service.login({ provider: 'grok', accountId: 'g1', mechanism: 'device' });
  await assert.rejects(service.deviceCancel({ provider: 'grok', accountId: 'g1', deviceCode: 'x' }), { code: 'GROK_INVALID_CODE' });
  // copilot
  await assert.rejects(service.login({ provider: 'copilot', accountId: 'c1', mechanism: 'device' }), { code: 'COPILOT_MECHANISM_NOT_SUPPORTED' });
  // antigravity
  await assert.rejects(service.login({ provider: 'antigravity', accountId: 'a1', mechanism: 'browser' }), { code: 'ANTIGRAVITY_MECHANISM_NOT_SUPPORTED' });
  // unknown provider
  await assert.rejects(service.login({ provider: 'not-a-provider', accountId: 'x', mechanism: 'device' }), { code: 'UNKNOWN_PROVIDER' });
});

test('Multi-account setDefault marks one default per provider', async () => {
  const { service } = await withService();
  await service.setDefault({ provider: 'grok', accountId: 'g2' });
  const snap = service.snapshot();
  assert.equal(snap.defaultByProvider.grok, 'g2');
  const g2 = snap.accounts.find(a => a.accountId === 'g2');
  assert.equal(g2.default, true);
  const g1 = snap.accounts.find(a => a.accountId === 'g1');
  assert.equal(g1.default, false);
  // Copilot has no default until set.
  assert.equal(snap.defaultByProvider.copilot, undefined);
});

test('Set default moves the default flag between accounts', async () => {
  const { service } = await withService();
  await service.setDefault({ provider: 'grok', accountId: 'g1' });
  await service.setDefault({ provider: 'grok', accountId: 'g2' });
  const snap = service.snapshot();
  assert.equal(snap.defaultByProvider.grok, 'g2');
  assert.equal(snap.accounts.find(a => a.accountId === 'g1').default, false);
  assert.equal(snap.accounts.find(a => a.accountId === 'g2').default, true);
});

test('Removing the default account promotes the next account', async () => {
  const { service } = await withService();
  await service.setDefault({ provider: 'grok', accountId: 'g1' });
  await service.remove({ provider: 'grok', accountId: 'g1' });
  const snap = service.snapshot();
  assert.equal(snap.accounts.find(a => a.accountId === 'g1'), undefined);
  // g2 becomes the default of the remaining grok accounts.
  assert.equal(snap.defaultByProvider.grok, 'g2');
  assert.equal(snap.accounts.find(a => a.accountId === 'g2').default, true);
});

test('Removing an account revokes its auth and invalidates health/catalog', async () => {
  const calls = [];
  const deviceOutcomes = new Map();
  const { service, clock } = await withService({ ...collectInvalidation(calls), deviceOutcomes });
  const { challenge: { deviceCode } } = await service.login({ provider: 'grok', accountId: 'g1', mechanism: 'device' });
  deviceOutcomes.set(deviceCode, 'authorized');
  await service.devicePoll({ provider: 'grok', accountId: 'g1', deviceCode });
  await service.remove({ provider: 'grok', accountId: 'g1' });
  const snap = service.snapshot();
  assert.equal(snap.accounts.find(a => a.accountId === 'g1'), undefined);
  assert.equal(service.store.has('grok', 'g1'), false);
  // Removal clears the account's health (no parked record remains).
  assert.equal(service.health.isMemberAvailable('grok', 'g1', '*', clock.now()), true);
  assert.ok(calls.some(c => c.kind === 'catalog' && c.provider === 'grok'));
  assert.ok(calls.some(c => c.kind === 'account' && c.provider === 'grok' && c.accountId === 'g1'));
});

test('Per-account isolation: refreshing one account does not affect another', async () => {
  const refreshFailures = new Set(['copilot/c1']);
  const { service, clock } = await withService({ refreshFailures });
  await service.store.add(createSyntheticAccount('c2', { provider: 'copilot', models: ['gpt-5'], label: 'Copilot Two' }));
  await service.login({ provider: 'copilot', accountId: 'c1', mechanism: 'manual', tokens: { access_token: 'synthetic' } });
  await service.login({ provider: 'copilot', accountId: 'c2', mechanism: 'manual', tokens: { access_token: 'synthetic' } });
  // c1's refresh fails; c2's refresh succeeds.
  await assert.rejects(service.refresh({ provider: 'copilot', accountId: 'c1' }), { code: 'COPILOT_REFRESH_FAILED' });
  const refreshed = await service.refresh({ provider: 'copilot', accountId: 'c2' });
  assert.equal(refreshed.refreshed, true);
  assert.equal(service.snapshot().accounts.find(a => a.accountId === 'c2').status, 'authorized');
  // c1 is parked on its account health, c2 is available.
  assert.equal(service.health.isMemberAvailable('copilot', 'c1', '*', clock.now()), false);
  assert.equal(service.health.isMemberAvailable('copilot', 'c2', '*', clock.now()), true);
});

test('Refresh success clears errors and invalidates health/catalog', async () => {
  const calls = [];
  const { service } = await withService({ ...collectInvalidation(calls) });
  await service.login({ provider: 'copilot', accountId: 'c1', mechanism: 'manual', tokens: { access_token: 'synthetic' } });
  const result = await service.refresh({ provider: 'copilot', accountId: 'c1' });
  assert.equal(result.refreshed, true);
  assert.ok(calls.some(c => c.kind === 'catalog' && c.provider === 'copilot'));
  assert.ok(calls.some(c => c.kind === 'account' && c.provider === 'copilot' && c.accountId === 'c1'));
});

test('Refresh after revoke is rejected', async () => {
  const { service } = await withService();
  await service.login({ provider: 'copilot', accountId: 'c1', mechanism: 'manual', tokens: { access_token: 'synthetic' } });
  const revoked = await service.revoke({ provider: 'copilot', accountId: 'c1' });
  assert.equal(revoked.status, 'revoked');
  assert.equal(revoked.revoked, true);
  await assert.rejects(
    service.refresh({ provider: 'copilot', accountId: 'c1' }),
    { code: 'COPILOT_NOT_AUTHENTICATED' },
  );
});

test('Refresh failure parks the account with a provider-specific auth cooldown', async () => {
  const refreshFailures = new Set(['copilot/c1']);
  const { service, clock } = await withService({ refreshFailures });
  await service.login({ provider: 'copilot', accountId: 'c1', mechanism: 'manual', tokens: { access_token: 'synthetic' } });
  await assert.rejects(service.refresh({ provider: 'copilot', accountId: 'c1' }), { code: 'COPILOT_REFRESH_FAILED' });
  assert.equal(service.health.isMemberAvailable('copilot', 'c1', '*', clock.now()), false);
  // Still parked well before the 24h cooldown elapses.
  clock.advance(60_000);
  assert.equal(service.health.isMemberAvailable('copilot', 'c1', '*', clock.now()), false);
});

test('Snapshot exposes no credentials, only hasTokens', async () => {
  const { service } = await withService();
  await service.login({ provider: 'copilot', accountId: 'c1', mechanism: 'manual', tokens: { access_token: 'secret', refresh_token: 'secret2' } });
  const snap = service.snapshot();
  const entry = snap.accounts.find(a => a.accountId === 'c1');
  assert.equal(entry.hasTokens, true);
  assert.equal(entry.access_token, undefined);
  assert.equal(entry.refresh_token, undefined);
  assert.equal(entry.tokens, undefined);
  assert.equal(entry.state, undefined);
  assert.equal(entry.deviceCode, undefined);
});

test('Single-writer: concurrent mutations are rejected', async () => {
  const { service } = await withService();
  let firstDone = false;
  const p1 = (async () => {
    await service.login({ provider: 'grok', accountId: 'g1', mechanism: 'device' });
    firstDone = true;
  })();
  assert.equal(service.isWriting(), true);
  await assert.rejects(service.login({ provider: 'grok', accountId: 'g2', mechanism: 'device' }), /An auth write is already in flight/);
  await p1;
  assert.equal(firstDone, true);
  assert.equal(service.isWriting(), false);
});

test('Dispose clears auth state and further writes fail', async () => {
  const { service } = await withService();
  await service.dispose();
  assert.equal(service.snapshot().disposed, true);
  await assert.rejects(service.login({ provider: 'grok', accountId: 'g1', mechanism: 'device' }), { code: 'DISPOSED' });
});
