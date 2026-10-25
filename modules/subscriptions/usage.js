// Usage windows and telemetry tracking for subscription providers.
//
// Tracks usage per provider/account/model with refresh/window scopes.
// Unknown/stale telemetry is labeled rather than treated as failure.
// Actual provider rejection/reset data remains distinct from telemetry warnings.
// Redacted failure handling: no secrets in snapshots or errors.
// Auto's 95% warning is advisory; unknown telemetry does not exclude a candidate.

export function createUsageTracker(opts = {}) {
  let nowFn = opts.now || Date.now;
  const staleAfterMs = opts.staleAfterMs;
  const warningThresholdPct = opts.warningThresholdPct === undefined ? 95 : opts.warningThresholdPct;
  const health = opts.health;
  const records = new Map();

  function keyOf(provider, account, model) {
    return `${provider}/${account}/${model}`;
  }

  function emptyRecord(provider, account, model) {
    return {
      provider, account, model,
      totalInputTokens: 0, totalOutputTokens: 0,
      window: undefined, lastUpdated: undefined,
      fresh: false, stale: false, unknown: true, missing: true,
      atWarningThreshold: false,
      quotaExceeded: false, cooldownMs: undefined,
      providerResetKnown: false, providerResetUnknown: false, providerResetRetryAfterMs: undefined,
    };
  }

  function getRecord(provider, account, model) {
    const key = keyOf(provider, account, model);
    let record = records.get(key);
    if (!record) {
      record = emptyRecord(provider, account, model);
      records.set(key, record);
    }
    return record;
  }

  function currentNow() { return nowFn(); }
function setNow(next) { nowFn = () => next; }

  function computeView(record) {
    const now = currentNow();
    const missing = record.lastUpdated === undefined;
    const unknown = missing;
    const stale = staleAfterMs !== undefined && !missing && now - record.lastUpdated > staleAfterMs;
    const fresh = !missing && !stale;
    let atWarningThreshold = false;
    if (fresh && record.totalInputTokens > 0 && warningThresholdPct > 0) {
      const limit = record.limitInputTokens;
      if (limit && limit > 0) {
        atWarningThreshold = (record.totalInputTokens / limit) * 100 >= warningThresholdPct;
      }
    }
    return Object.freeze({
      provider: record.provider, account: record.account, model: record.model,
      totalInputTokens: record.totalInputTokens, totalOutputTokens: record.totalOutputTokens,
      window: record.window, lastUpdated: record.lastUpdated,
      fresh, stale, unknown, missing, atWarningThreshold,
      quotaExceeded: record.quotaExceeded, cooldownMs: record.cooldownMs,
      providerResetKnown: record.providerResetKnown,
      providerResetUnknown: record.providerResetUnknown,
      providerResetRetryAfterMs: record.providerResetRetryAfterMs,
    });
  }

  function recordUsage(ident, payload = {}) {
    const record = getRecord(ident.provider, ident.account, ident.model);
    record.totalInputTokens += typeof payload.inputTokens === 'number' ? payload.inputTokens : 0;
    record.totalOutputTokens += typeof payload.outputTokens === 'number' ? payload.outputTokens : 0;
    if (payload.window !== undefined) record.window = String(payload.window);
    if (typeof payload.limitInputTokens === 'number') record.limitInputTokens = payload.limitInputTokens;
    record.lastUpdated = currentNow();
    record.fresh = true; record.stale = false; record.unknown = false; record.missing = false;
    record.quotaExceeded = false; record.cooldownMs = undefined;
    record.providerResetKnown = false; record.providerResetUnknown = false; record.providerResetRetryAfterMs = undefined;
    return computeView(record);
  }

  function recordQuotaFailure(ident, error = {}) {
    const record = getRecord(ident.provider, ident.account, ident.model);
    const code = typeof error.code === 'string' ? error.code : undefined;
    record.quotaExceeded = code === 'QUOTA_EXCEEDED' || code === 'RATE_LIMIT';
    record.cooldownMs = typeof error.providerRetryAfterMs === 'number' ? error.providerRetryAfterMs : undefined;
    // Redacted: never echo provider error detail into the record
    if (health && code) {
      const scope = code === 'QUOTA_EXCEEDED' || code === 'RATE_LIMIT' ? 'member' : 'account';
      const key = scope === 'member'
        ? keyOf(ident.provider, ident.account, ident.model)
        : `${ident.provider}/${ident.account}/*`;
      health.markUnavailable(key, record.cooldownMs, code);
    }
    return computeView(record);
  }

  function recordProviderReset(ident, reset = {}) {
    const record = getRecord(ident.provider, ident.account, ident.model);
    if (reset.known === true && typeof reset.retryAfterMs === 'number') {
      record.providerResetKnown = true;
      record.providerResetUnknown = false;
      record.providerResetRetryAfterMs = reset.retryAfterMs;
    } else {
      record.providerResetKnown = false;
      record.providerResetUnknown = true;
      record.providerResetRetryAfterMs = undefined;
    }
    return computeView(record);
  }

  function view(ident) {
    return computeView(getRecord(ident.provider, ident.account, ident.model));
  }

  // Excludes a candidate only on actual quota exhaustion with a cooldown, never
  // on unknown/stale telemetry or on an advisory warning.
  function excludesCandidate(ident) {
    const record = getRecord(ident.provider, ident.account, ident.model);
    return record.quotaExceeded && record.cooldownMs !== undefined
      ? currentNow() < record.lastUpdated + (record.cooldownMs || 0)
      : false;
  }

  function snapshot() {
    return [...records.entries()].map(([key, record]) => ({ key, ...computeView(record) }));
  }

  return {
    recordUsage,
    recordQuotaFailure,
    recordProviderReset,
    view,
    excludesCandidate,
    setNow,
    snapshot,
  };
}
