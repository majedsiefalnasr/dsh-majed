// Failure classification and in-memory member/account health for direct routes
// and pools. Mirrors the pinned subscription pool-health contract so a failure
// on one member/account does not silently poison siblings, while non-retryable
// request faults (context overflow, abort) are rethrown rather than failed over.

export const DEFAULT_QUOTA_COOLDOWN_MS = 5 * 60_000;
export const AUTH_COOLDOWN_MS = 24 * 60 * 60_000;
export const TRANSIENT_COOLDOWN_MS = 60_000;

// Providers whose quota windows are model-scoped: a quota failure on one model
// parks only that member, not its siblings on the same account.
export const MODEL_SCOPED_QUOTA_PROVIDERS = Object.freeze(new Set(['claude', 'antigravity']));

export function memberKey(provider, account, model) {
  return `${provider}/${account}/${model}`;
}
export function accountKey(provider, account) {
  return `${provider}/${account}/*`;
}

const RETRYABLE = Object.freeze(new Set(['RATE_LIMIT', 'QUOTA_EXCEEDED', 'AUTH', 'INVALID_CREDENTIAL',
  'MISSING_CREDENTIAL', 'SERVER', 'TIMEOUT', 'EMPTY_RESPONSE', 'TRANSPORT', 'HTTP_402', 'HTTP_404']));
const THROW = Object.freeze(new Set(['CONTEXT_WINDOW_EXCEEDED', 'ABORTED']));

function retryAfterMs(error) {
  return error && typeof error.providerRetryAfterMs === 'number' ? error.providerRetryAfterMs : undefined;
}

export function classifyFailure(error, provider) {
  if (error == null) return { action: 'throw', reason: 'TRANSPORT', code: 'TRANSPORT', cooldownMs: undefined, scope: undefined };
  const code = error && typeof error.code === 'string' ? error.code : undefined;
  if (code !== undefined) {
    if (THROW.has(code)) return { action: 'throw', reason: code, code, cooldownMs: undefined, scope: undefined };
    if (RETRYABLE.has(code)) {
      const scope = code === 'TRANSPORT' ? undefined : ((code === 'RATE_LIMIT' || code === 'QUOTA_EXCEEDED')
        && MODEL_SCOPED_QUOTA_PROVIDERS.has(provider) ? 'member' : 'account');
      const cooldownMs = code === 'TRANSPORT' ? undefined : (code === 'AUTH' || code === 'INVALID_CREDENTIAL' || code === 'MISSING_CREDENTIAL'
        ? AUTH_COOLDOWN_MS
        : (retryAfterMs(error) ?? (code === 'RATE_LIMIT' || code === 'QUOTA_EXCEEDED' ? DEFAULT_QUOTA_COOLDOWN_MS : TRANSIENT_COOLDOWN_MS)));
      return { action: 'switch', reason: code, code, cooldownMs, scope };
    }
    return { action: 'throw', reason: code, code, cooldownMs: undefined, scope: undefined };
  }
  if (error instanceof Error) {
    const message = String(error.message);
    if (/rate.?limit|quota/i.test(message)) return { action: 'switch', reason: 'RATE_LIMIT', code: 'RATE_LIMIT', cooldownMs: undefined, scope: undefined };
    if (/unauthorized|401|invalid.?credential|missing.?credential/i.test(message))
      return { action: 'switch', reason: 'AUTH', code: 'AUTH', cooldownMs: AUTH_COOLDOWN_MS, scope: 'account' };
    if (/timeout|internal|server/i.test(message)) return { action: 'switch', reason: 'SERVER', code: 'SERVER', cooldownMs: TRANSIENT_COOLDOWN_MS, scope: 'member' };
    return { action: 'throw', reason: 'TRANSPORT', code: 'TRANSPORT', cooldownMs: undefined, scope: undefined };
  }
  return { action: 'throw', reason: 'TRANSPORT', code: 'TRANSPORT', cooldownMs: undefined, scope: undefined };
}

export function createHealthRegistry() {
  const records = new Map(); // key → { unavailableUntil, reason }
  return {
    markUnavailable(key, cooldownMs, reason) {
      if (cooldownMs === undefined) return;
      records.set(key, { unavailableUntil: Date.now() + cooldownMs, reason });
    },
    isAvailable(key, now = Date.now()) {
      const record = records.get(key);
      return record === undefined || now >= record.unavailableUntil;
    },
    isMemberAvailable(provider, account, model, now = Date.now()) {
      return this.isAvailable(memberKey(provider, account, model), now)
        && this.isAvailable(accountKey(provider, account), now);
    },
    earliestRecoveryRecord(keys, now = Date.now()) {
      let earliest;
      for (const key of keys) {
        const record = records.get(key);
        if (record === undefined || now >= record.unavailableUntil) continue;
        if (earliest === undefined || record.unavailableUntil < earliest.unavailableUntil)
          earliest = { key, ...record };
      }
      return earliest;
    },
    clear(provider, account) {
      records.delete(memberKey(provider, account, '*'));
      records.delete(accountKey(provider, account));
      // clear every model key for this account
      for (const key of [...records.keys()]) {
        if (key.startsWith(`${provider}/${account}/`)) records.delete(key);
      }
    },
    snapshot() {
      return [...records.entries()].map(([key, value]) => ({ key, ...value }));
    },
  };
}
