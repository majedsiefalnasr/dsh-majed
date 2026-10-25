import test from 'node:test';
import assert from 'node:assert/strict';
import { createHealthRegistry, memberKey, accountKey } from '../../modules/subscriptions/health.js';
import { createUsageTracker } from '../../modules/subscriptions/usage.js';

function now() { return 1_700_000_000_000; }

test('usage tracker records usage windows per provider/account/model with refresh scope', () => {
  const tracker = createUsageTracker({ now });
  const key = { provider: 'claude', account: 'a1', model: 'claude-3-opus' };
  tracker.recordUsage(key, { inputTokens: 1000, outputTokens: 500, window: 'daily' });
  const view = tracker.view(key);
  assert.equal(view.fresh, true);
  assert.equal(view.stale, false);
  assert.equal(view.unknown, false);
  assert.equal(view.totalInputTokens, 1000);
  assert.equal(view.totalOutputTokens, 500);
  assert.equal(view.window, 'daily');
});

test('unknown telemetry is labeled unknown and does not exclude a candidate', () => {
  const tracker = createUsageTracker({ now });
  const key = { provider: 'codex', account: 'a1', model: 'gpt-5' };
  // No usage recorded: telemetry is unknown
  const view = tracker.view(key);
  assert.equal(view.unknown, true);
  assert.equal(view.fresh, false);
  // Unknown telemetry never excludes
  assert.equal(tracker.excludesCandidate(key), false);
});

test('stale telemetry is labeled stale and does not exclude a candidate', () => {
  const tracker = createUsageTracker({ now, staleAfterMs: 60_000 });
  const key = { provider: 'claude', account: 'a1', model: 'claude-3-opus' };
  tracker.recordUsage(key, { inputTokens: 100, window: 'daily' });
  // Advance past staleness
  tracker.setNow(now() + 120_000);
  const view = tracker.view(key);
  assert.equal(view.stale, true);
  assert.equal(view.fresh, false);
  // Stale telemetry does not exclude
  assert.equal(tracker.excludesCandidate(key), false);
});

test('95% usage warning is advisory and does not exclude a candidate', () => {
  const tracker = createUsageTracker({ now, warningThresholdPct: 95 });
  const key = { provider: 'claude', account: 'a1', model: 'claude-3-opus' };
  tracker.recordUsage(key, { inputTokens: 950, outputTokens: 50, window: 'daily', limitInputTokens: 1000 });
  const view = tracker.view(key);
  assert.equal(view.atWarningThreshold, true);
  // Warning is advisory: does not exclude
  assert.equal(tracker.excludesCandidate(key), false);
});

test('provider-specific missing telemetry: Claude missing, Codex present', () => {
  const tracker = createUsageTracker({ now });
  tracker.recordUsage({ provider: 'codex', account: 'a1', model: 'gpt-5' }, { inputTokens: 100, window: 'daily' });
  // Claude has no telemetry: missing, not unknown failure
  const claudeView = tracker.view({ provider: 'claude', account: 'a1', model: 'claude-3-opus' });
  assert.equal(claudeView.missing, true);
  assert.equal(claudeView.unknown, true);
  const codexView = tracker.view({ provider: 'codex', account: 'a1', model: 'gpt-5' });
  assert.equal(codexView.missing, false);
  assert.equal(codexView.fresh, true);
});

test('redacted failure handling: quota failures mark health but do not echo provider error detail', () => {
  const health = createHealthRegistry();
  const tracker = createUsageTracker({ now, health });
  const key = { provider: 'claude', account: 'a1', model: 'claude-3-opus' };
  tracker.recordQuotaFailure(key, { code: 'QUOTA_EXCEEDED', providerRetryAfterMs: 300_000, secretDetail: 'DO-NOT-ECHO' });
  const view = tracker.view(key);
  assert.equal(view.quotaExceeded, true);
  assert.equal(view.cooldownMs, 300_000);
  assert.equal(JSON.stringify(view).includes('DO-NOT-ECHO'), false);
  // Health is marked for the member (claude is model-scoped)
  assert.equal(health.isAvailable(memberKey('claude', 'a1', 'claude-3-opus'), now()), false);
});

test('unknown quota reset data remains distinct from telemetry warnings', () => {
  const tracker = createUsageTracker({ now });
  const key = { provider: 'claude', account: 'a1', model: 'claude-3-opus' };
  // Actual provider reset: known retry-after
  tracker.recordProviderReset(key, { retryAfterMs: 600_000, known: true });
  let view = tracker.view(key);
  assert.equal(view.providerResetKnown, true);
  assert.equal(view.providerResetRetryAfterMs, 600_000);
  // Unknown reset: no retry-after, labeled unknown
  tracker.recordProviderReset(key, { known: false });
  view = tracker.view(key);
  assert.equal(view.providerResetKnown, false);
  assert.equal(view.providerResetUnknown, true);
  // Unknown reset is unknown, not an invented time
  assert.equal(view.providerResetRetryAfterMs, undefined);
});
