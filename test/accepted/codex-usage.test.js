// Controlled transport proof for the v0.9.11 Codex usage/reset port; no provider calls.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCodexUsage } from '../../modules/subscriptions/codex/usage.js';

test('Codex usage classifies reported durations and reset redemption is confirmed and single-use', async () => {
  const calls = [];
  const usage = createCodexUsage({ accounts: { session: async () => ({ accessToken: 'private-token', accountId: 'private-workspace' }) }, fetch: async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/consume')) return Response.json({ code: 'reset' });
    if (url.endsWith('reset-credits')) return Response.json({ credits: [{ id: 'credit-one', reset_type: 'codex_rate_limits', status: 'available', expires_at: '2030-01-01T00:00:00Z' }] });
    return Response.json({ plan_type: 'plus', rate_limit: { primary_window: { used_percent: 39, limit_window_seconds: 18000, reset_at: 1900000000 }, secondary_window: { used_percent: 53, limit_window_seconds: 604800, reset_at: 1900500000 } } });
  } });
  const value = await usage.read('account');
  assert.deepEqual(value.windows, [{ kind: 'session', usedPercent: 39, resetsAt: 1900000000000 }, { kind: 'weekly', usedPercent: 53, resetsAt: 1900500000000 }]);
  assert.equal(value.plan, 'plus'); assert.doesNotMatch(JSON.stringify(value), /private-token|private-workspace/);
  const prepared = await usage.prepare('account');
  assert.equal(calls.filter(c => c.url.endsWith('/consume')).length, 0);
  await assert.rejects(usage.consume('other-account', prepared.ticket), { code: 'invalid_reset_ticket' });
  await usage.consume('account', prepared.ticket);
  await assert.rejects(usage.consume('account', prepared.ticket), { code: 'invalid_reset_ticket' });
  assert.equal(calls.filter(c => c.url.endsWith('/consume')).length, 1);
  usage.dispose();
});

test('Codex usage failures are explicit and never disclose provider bodies or credentials', async () => {
  const usage = createCodexUsage({ accounts: { session: async () => ({ accessToken: 'private-token', accountId: 'private-workspace' }) }, fetch: async () => new Response('secret@example.test private-token', { status: 503 }) });
  await assert.rejects(usage.read('account'), error => error.code === 'usage_unavailable' && !/secret|private/.test(error.message));
  usage.dispose();
});
