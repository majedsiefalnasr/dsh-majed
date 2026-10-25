import test from 'node:test';
import assert from 'node:assert/strict';
import { createQuotaOperations, QUOTA_ACTION } from '../../modules/subscriptions/quota.js';

function now() { return 1_700_000_000_000; }

test('Codex manual reset-credit requires explicit action', async () => {
  const ops = createQuotaOperations({ now });
  // No reset has been requested: no credit redeemed
  const snapshot = ops.snapshot();
  assert.equal(snapshot.creditsRedeemed, 0);
  assert.equal(snapshot.lastResetResult, undefined);

  // Request a reset: requires explicit action, returns pending
  const requested = await ops.requestReset({ provider: 'codex', account: 'a1', model: 'gpt-5' });
  assert.equal(requested.ok, true);
  assert.equal(requested.action, QUOTA_ACTION.REQUEST_RESET);
  assert.equal(requested.status, 'pending');

  // Until explicitly confirmed, no credits are redeemed
  assert.equal(ops.snapshot().creditsRedeemed, 0);
});

test('cancelled reset-credit is never automatically replayed as a read', async () => {
  const ops = createQuotaOperations({ now });
  await ops.requestReset({ provider: 'codex', account: 'a1', model: 'gpt-5' });

  // Cancel the reset
  const cancelled = await ops.cancelReset({ provider: 'codex', account: 'a1', model: 'gpt-5' });
  assert.equal(cancelled.ok, true);
  assert.equal(cancelled.action, QUOTA_ACTION.CANCEL_RESET);
  assert.equal(cancelled.status, 'cancelled');

  // No automatic replay: credits remain unredeemed
  assert.equal(ops.snapshot().creditsRedeemed, 0);
  assert.equal(ops.snapshot().lastResetResult, undefined);
});

test('ambiguous reset-credit result is never automatically replayed', async () => {
  const ops = createQuotaOperations({ now, performReset: async () => ({ ok: undefined, reason: 'ambiguous' }) });
  await ops.requestReset({ provider: 'codex', account: 'a1', model: 'gpt-5' });

  // Confirm with an ambiguous result
  const confirmed = await ops.confirmReset({ provider: 'codex', account: 'a1', model: 'gpt-5' });
  assert.equal(confirmed.ok, false);
  assert.equal(confirmed.reason, 'ambiguous');

  // Ambiguous result is not replayed as a read
  assert.equal(ops.snapshot().creditsRedeemed, 0);
  const snapshot = ops.snapshot();
  assert.equal(snapshot.lastResetResult.status, 'failed');
  assert.equal(snapshot.lastResetResult.reason, 'ambiguous');
});

test('reset-credit redemption requires explicit confirm action', async () => {
  const ops = createQuotaOperations({ now, performReset: async () => ({ ok: true, credits: 100 }) });
  await ops.requestReset({ provider: 'codex', account: 'a1', model: 'gpt-5' });

  // Without confirm, nothing is redeemed
  assert.equal(ops.snapshot().creditsRedeemed, 0);

  // Explicit confirm redeems credits
  const confirmed = await ops.confirmReset({ provider: 'codex', account: 'a1', model: 'gpt-5' });
  assert.equal(confirmed.ok, true);
  assert.equal(confirmed.credits, 100);
  assert.equal(ops.snapshot().creditsRedeemed, 100);
});

test('no real credit redemption or usage-endpoint access is authorized', () => {
  const ops = createQuotaOperations({ now });
  // The operations module exposes no endpoint accessor or redemption path without explicit confirm
  assert.equal(typeof ops.redeemCredits, 'undefined');
  assert.equal(typeof ops.accessUsageEndpoint, 'undefined');
  // Snapshot reveals no secrets or endpoint details
  const snapshot = ops.snapshot();
  assert.equal(JSON.stringify(snapshot).includes('http'), false);
  assert.equal(JSON.stringify(snapshot).includes('endpoint'), false);
});

test('quota operations are isolated per provider/account/model', async () => {
  const ops = createQuotaOperations({ now, performReset: async () => ({ ok: true, credits: 50 }) });
  await ops.requestReset({ provider: 'codex', account: 'a1', model: 'gpt-5' });
  await ops.requestReset({ provider: 'claude', account: 'a2', model: 'claude-3-opus' });

  const snapshot = ops.snapshot();
  assert.equal(snapshot.pending.length, 2);
  assert.equal(snapshot.pending[0].provider, 'codex');
  assert.equal(snapshot.pending[1].provider, 'claude');
});
