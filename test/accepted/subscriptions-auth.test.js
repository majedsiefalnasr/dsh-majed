import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAuthStore,
  createSyntheticAuthAccount,
  AUTH_PENDING, AUTH_SUCCESSFUL, AUTH_FAILED, AUTH_CANCELLED,
  AUTH_METHOD_OAUTH, AUTH_METHOD_MANUAL, AUTH_METHOD_CLAUDE_CODE_IMPORT,
  AUTH_STATES, AUTH_METHODS,
} from '../../modules/subscriptions/auth.js';
import { createHealthRegistry, accountKey } from '../../modules/subscriptions/health.js';

function invalidationCollector() {
  const calls = [];
  return {
    calls,
    catalog(provider, id) { calls.push(['catalog', provider, id]); },
    usage(provider, id) { calls.push(['usage', provider, id]); },
    health(provider, id, reason) { calls.push(['health', provider, id, reason]); },
  };
}

test('auth constants and account identity', () => {
  assert.deepEqual([...AUTH_STATES], [AUTH_PENDING, AUTH_SUCCESSFUL, AUTH_FAILED, AUTH_CANCELLED]);
  assert.deepEqual([...AUTH_METHODS], [AUTH_METHOD_OAUTH, AUTH_METHOD_MANUAL, AUTH_METHOD_CLAUDE_CODE_IMPORT]);
  const account = createSyntheticAuthAccount('acc-1', {
    provider: 'codex', label: 'ChatGPT', models: ['gpt-5'],
    authMethod: AUTH_METHOD_OAUTH, authState: AUTH_PENDING, default: true,
    credentials: { token: 'synthetic-token' },
  });
  assert.equal(account.id, 'acc-1');
  assert.equal(account.provider, 'codex');
  assert.equal(account.label, 'ChatGPT');
  assert.deepEqual(account.models, ['gpt-5']);
  assert.equal(account.authMethod, AUTH_METHOD_OAUTH);
  assert.equal(account.authState, AUTH_PENDING);
  assert.equal(account.default, true);
  assert.throws(() => createSyntheticAuthAccount('', { provider: 'codex' }));
  assert.throws(() => createSyntheticAuthAccount('a', { provider: '' }));
  assert.throws(() => createSyntheticAuthAccount('a', { provider: 'codex', authState: 'not-a-state' }));
  assert.throws(() => createSyntheticAuthAccount('a', { provider: 'codex', authMethod: 'not-a-method' }));
});

test('store add/get/list/has with per-provider identity', async () => {
  const store = createAuthStore([
    createSyntheticAuthAccount('a1', { provider: 'codex', models: ['gpt-5'] }),
    createSyntheticAuthAccount('a2', { provider: 'claude', models: ['claude-3'] }),
  ]);
  assert.equal(store.list('codex').length, 1);
  assert.equal(store.list('claude').length, 1);
  assert.equal(store.list('grok').length, 0);
  assert.equal(store.get('codex', 'a1').id, 'a1');
  assert.equal(store.has('codex', 'a1'), true);
  assert.equal(store.has('codex', 'missing'), false);
  await store.add(createSyntheticAuthAccount('a3', { provider: 'codex', models: ['codex-1'] }));
  assert.equal(store.list('codex').length, 2);
  await assert.rejects(store.add(createSyntheticAuthAccount('a1', { provider: 'codex' })), /already exists/);
  assert.equal(store.list('codex').length, 2); // unchanged after failed add
  const removed = await store.remove('codex', 'a3');
  assert.equal(removed, 'a3');
  assert.equal(store.has('codex', 'a3'), false);
});

test('snapshot redacts credentials and never exposes secrets', async () => {
  const store = createAuthStore([
    createSyntheticAuthAccount('a1', { provider: 'codex', credentials: { token: 'real-secret-token', refresh: 'real-refresh' } }),
  ]);
  const snap = store.snapshot();
  assert.equal(snap.accounts.length, 1);
  const entry = snap.accounts[0];
  assert.equal(entry.id, 'a1');
  assert.equal(entry.credentials, undefined); // redacted
  const text = JSON.stringify(snap);
  assert.equal(text.includes('real-secret-token'), false);
  assert.equal(text.includes('real-refresh'), false);
});

test('single-writer semantics reject concurrent mutation', async () => {
  const store = createAuthStore([createSyntheticAuthAccount('a1', { provider: 'codex' })]);
  assert.equal(store.isWriting(), false);
  const p1 = store.add(createSyntheticAuthAccount('b', { provider: 'codex' }));
  // While the first write is in flight (no microtask has flushed yet), a concurrent mutation is rejected.
  await assert.rejects(store.add(createSyntheticAuthAccount('c', { provider: 'codex' })), /writer is already active/);
  await p1;
  assert.equal(store.isWriting(), false);
  assert.equal(store.list('codex').length, 2); // only the first concurrent add landed
});

test('setDefault keeps exactly one default per provider', async () => {
  const store = createAuthStore([
    createSyntheticAuthAccount('a1', { provider: 'codex', default: true }),
    createSyntheticAuthAccount('a2', { provider: 'codex', default: false }),
    createSyntheticAuthAccount('b1', { provider: 'claude', default: true }),
  ]);
  assert.equal(store.get('codex', 'a1').default, true);
  assert.equal(store.get('codex', 'a2').default, false);
  await store.setDefault('codex', 'a2');
  assert.equal(store.get('codex', 'a1').default, false); // previous default unset
  assert.equal(store.get('codex', 'a2').default, true);
  assert.equal(store.get('claude', 'b1').default, true); // other provider unaffected
  await assert.rejects(store.setDefault('codex', 'missing'), /Unknown account/);
});

test('browser/manual OAuth: pending -> successful', async () => {
  const store = createAuthStore([
    createSyntheticAuthAccount('a1', { provider: 'codex', authState: AUTH_PENDING }),
  ]);
  const oauth = await store.beginOAuth('codex', 'a1', { scope: 'chat' });
  assert.equal(oauth.provider, 'codex');
  assert.equal(typeof oauth.verifier, 'string');
  assert.equal(oauth.verifier.length > 0, true);
  assert.equal(typeof oauth.challenge, 'string');
  assert.equal(oauth.challenge.length > 0, true);
  assert.equal(store.get('codex', 'a1').authState, AUTH_PENDING);
  assert.equal(store.get('codex', 'a1').authMethod, AUTH_METHOD_OAUTH);

  await store.completeOAuth('codex', 'a1', { code: 'auth-code-1', state: oauth.verifier });
  const after = store.get('codex', 'a1');
  assert.equal(after.authState, AUTH_SUCCESSFUL);
  assert.equal(after.authMethod, AUTH_METHOD_OAUTH);
  assert.equal(after.failureReason, undefined);
});

test('browser/manual OAuth: pending -> failed', async () => {
  const store = createAuthStore([
    createSyntheticAuthAccount('a1', { provider: 'codex', authState: AUTH_PENDING }),
  ]);
  await store.beginOAuth('codex', 'a1');
  await assert.rejects(store.completeOAuth('codex', 'a1', { code: '', state: 'x' }), /invalid/i);
  const after = store.get('codex', 'a1');
  assert.equal(after.authState, AUTH_FAILED);
  assert.equal(after.failureReason, undefined);
});

test('completeOAuth rejects non-pending accounts', async () => {
  const store = createAuthStore([
    createSyntheticAuthAccount('a1', { provider: 'codex', authState: AUTH_SUCCESSFUL }),
  ]);
  await assert.rejects(store.completeOAuth('codex', 'a1', { code: 'x', state: 'y' }), /not pending/);
});

test('cancelOAuth: pending -> cancelled', async () => {
  const store = createAuthStore([
    createSyntheticAuthAccount('a1', { provider: 'codex', authState: AUTH_PENDING }),
  ]);
  await store.beginOAuth('codex', 'a1');
  await store.cancelOAuth('codex', 'a1');
  assert.equal(store.get('codex', 'a1').authState, AUTH_CANCELLED);
  await assert.rejects(store.cancelOAuth('codex', 'a1'), /not pending/);
});

test('Claude Code import -> successful (claude-code-import method)', async () => {
  const collected = invalidationCollector();
  const store = createAuthStore([
    createSyntheticAuthAccount('a1', { provider: 'claude', authState: AUTH_PENDING }),
  ], {
    onCatalogInvalidate: collected.catalog,
    onUsageInvalidate: collected.usage,
    onHealthInvalidate: collected.health,
  });
  await store.importClaudeCode('claude', 'a1', { credentials: { token: 'cc-synthetic' } });
  const after = store.get('claude', 'a1');
  assert.equal(after.authState, AUTH_SUCCESSFUL);
  assert.equal(after.authMethod, AUTH_METHOD_CLAUDE_CODE_IMPORT);
  // invalidation reaches the runtime
  assert.deepEqual(collected.calls, [
    ['catalog', 'claude', 'a1'],
    ['usage', 'claude', 'a1'],
    ['health', 'claude', 'a1', 'login'],
  ]);
});

test('refresh coalescing: concurrent refreshes share one underlying refresh', async () => {
  let performCalls = 0;
  const store = createAuthStore([
    createSyntheticAuthAccount('a1', { provider: 'codex', authState: AUTH_SUCCESSFUL }),
  ], {
    performRefresh: async () => {
      performCalls += 1;
      await new Promise(r => setTimeout(r, 30));
      return { ok: true };
    },
  });
  const results = await Promise.all([
    store.refresh('codex', 'a1'),
    store.refresh('codex', 'a1'),
    store.refresh('codex', 'a1'),
  ]);
  assert.equal(performCalls, 1); // one underlying refresh despite three callers
  for (const result of results) assert.equal(result.ok, true);
  const after = store.get('codex', 'a1');
  assert.equal(after.refreshCount, 1); // one underlying refresh served all three callers
  assert.equal(after.lastRefreshAt !== undefined, true);
});

test('refresh failure marks the account failed and invalidates health', async () => {
  const collected = invalidationCollector();
  const store = createAuthStore([
    createSyntheticAuthAccount('a1', { provider: 'codex', authState: AUTH_SUCCESSFUL }),
  ], {
    performRefresh: async () => { throw Object.assign(new Error('refresh failed'), { code: 'AUTH' }); },
    onHealthInvalidate: collected.health,
  });
  const result = await store.refresh('codex', 'a1');
  assert.equal(result.ok, false);
  const after = store.get('codex', 'a1');
  assert.equal(after.authState, AUTH_FAILED);
  assert.equal(after.failureReason, 'AUTH');
  assert.deepEqual(collected.calls, [['health', 'codex', 'a1', 'AUTH']]);
});

test('forceRefresh performs a refresh even when recently refreshed', async () => {
  let performCalls = 0;
  const store = createAuthStore([
    createSyntheticAuthAccount('a1', { provider: 'codex', authState: AUTH_SUCCESSFUL, lastRefreshAt: Date.now() }),
  ], {
    performRefresh: async () => { performCalls += 1; return { ok: true }; },
  });
  // Ordinary refresh within cooldown is not performed
  await store.refresh('codex', 'a1');
  assert.equal(performCalls, 0);
  // Forced refresh path: performed regardless of recent refresh
  const forced = await store.forceRefresh('codex', 'a1');
  assert.equal(performCalls, 1);
  assert.equal(forced.ok, true);
});

test('revoke only the failed account; protects a concurrent newer login', async () => {
  const store = createAuthStore([
    createSyntheticAuthAccount('old', { provider: 'codex', authState: AUTH_FAILED, credentials: { token: 'old-failed' } }),
    createSyntheticAuthAccount('newer', { provider: 'codex', authState: AUTH_SUCCESSFUL, credentials: { token: 'newer-ok' }, default: true }),
  ]);
  // Revoking a successful account is rejected
  await assert.rejects(store.revoke('codex', 'newer'), /not revokable/);
  // Revoking the failed account clears only it
  await store.revoke('codex', 'old');
  const revoked = store.get('codex', 'old');
  assert.equal(revoked.authState, AUTH_FAILED);
  assert.equal(revoked.credentials, undefined); // credentials cleared
  // Concurrent newer login is protected: still successful with credentials intact
  const newer = store.get('codex', 'newer');
  assert.equal(newer.authState, AUTH_SUCCESSFUL);
  assert.equal(newer.default, true);
});

test('revoke failure invalidates health for the revoked account only', async () => {
  const collected = invalidationCollector();
  const store = createAuthStore([
    createSyntheticAuthAccount('old', { provider: 'claude', authState: AUTH_FAILED }),
    createSyntheticAuthAccount('newer', { provider: 'claude', authState: AUTH_SUCCESSFUL }),
  ], { onHealthInvalidate: collected.health });
  await store.revoke('claude', 'old');
  assert.deepEqual(collected.calls, [['health', 'claude', 'old', 'revoked']]);
});

test('unknown account operations are rejected', async () => {
  const store = createAuthStore([]);
  await assert.rejects(store.beginOAuth('codex', 'missing'), /Unknown account/);
  await assert.rejects(store.completeOAuth('codex', 'missing', { code: 'x', state: 'y' }), /Unknown account/);
  await assert.rejects(store.refresh('codex', 'missing'), /Unknown account/);
  await assert.rejects(store.forceRefresh('codex', 'missing'), /Unknown account/);
  await assert.rejects(store.revoke('codex', 'missing'), /Unknown account/);
  await assert.rejects(store.importClaudeCode('codex', 'missing'), /Unknown account/);
  await assert.rejects(store.setDefault('codex', 'missing'), /Unknown account/);
});

test('invalidation callbacks fire on login, refresh and revoke', async () => {
  const collected = invalidationCollector();
  const store = createAuthStore([
    createSyntheticAuthAccount('a1', { provider: 'claude', authState: AUTH_PENDING }),
  ], {
    onCatalogInvalidate: collected.catalog,
    onUsageInvalidate: collected.usage,
    onHealthInvalidate: collected.health,
  });
  await store.beginOAuth('claude', 'a1');
  await store.completeOAuth('claude', 'a1', { code: 'c', state: 's' });
  assert.ok(collected.calls.some(c => c[0] === 'catalog' && c[1] === 'claude' && c[2] === 'a1'));
  assert.ok(collected.calls.some(c => c[0] === 'usage' && c[1] === 'claude' && c[2] === 'a1'));
  assert.ok(collected.calls.some(c => c[0] === 'health' && c[1] === 'claude' && c[2] === 'a1'));
});

test('auth failure invalidates health in the direct runtime (account scope)', async () => {
  const health = createHealthRegistry();
  const store = createAuthStore([
    createSyntheticAuthAccount('a1', { provider: 'codex', authState: AUTH_SUCCESSFUL }),
  ], {
    performRefresh: async () => { throw Object.assign(new Error('auth failed'), { code: 'AUTH' }); },
    onHealthInvalidate: (provider, id, reason) => health.markUnavailable(accountKey(provider, id), 60_000, reason),
  });
  assert.equal(health.isMemberAvailable('codex', 'a1', 'gpt-5', Date.now()), true);
  await store.refresh('codex', 'a1');
  assert.equal(store.get('codex', 'a1').authState, AUTH_FAILED);
  // The direct runtime (health consulted by direct/pool routes) parks the account.
  assert.equal(health.isMemberAvailable('codex', 'a1', 'gpt-5', Date.now()), false);
});

test('catalog and usage invalidation fire on successful Claude Code import', async () => {
  let catalog; let usage; let healthReason;
  const store = createAuthStore([
    createSyntheticAuthAccount('a1', { provider: 'claude', authState: AUTH_PENDING }),
  ], {
    onCatalogInvalidate: (p, i) => { catalog = [p, i]; },
    onUsageInvalidate: (p, i) => { usage = [p, i]; },
    onHealthInvalidate: (p, i, r) => { healthReason = r; },
  });
  await store.importClaudeCode('claude', 'a1', { credentials: { token: 'cc-synthetic' } });
  assert.deepEqual(catalog, ['claude', 'a1']);
  assert.deepEqual(usage, ['claude', 'a1']);
  assert.equal(healthReason, 'login');
});

