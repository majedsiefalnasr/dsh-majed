// Reset-credit operations for subscription providers.
//
// Codex manual reset-credit workflow: redemption requires explicit action
// (request → confirm). A cancelled or ambiguous result is never automatically
// replayed as though it were a read. No real credit redemption or
// usage-endpoint access is authorized here.

export const QUOTA_ACTION = Object.freeze({
  REQUEST_RESET: 'request_reset',
  CONFIRM_RESET: 'confirm_reset',
  CANCEL_RESET: 'cancel_reset',
});

export function createQuotaOperations(opts = {}) {
  const nowFn = opts.now || Date.now;
  const performReset = opts.performReset; // optional fixture hook; not a real endpoint
  const pending = new Map(); // key → { provider, account, model, requestedAt, status }
  const confirmed = new Map(); // key → { status, credits, reason, confirmedAt }
  let creditsRedeemed = 0;

  function keyOf(provider, account, model) {
    return `${provider}/${account}/${model}`;
  }

  function currentNow() { return nowFn(); }

  function getPending(provider, account, model) {
    return pending.get(keyOf(provider, account, model));
  }

  function requestReset(ident) {
    const key = keyOf(ident.provider, ident.account, ident.model);
    const entry = { provider: ident.provider, account: ident.account, model: ident.model,
      requestedAt: currentNow(), status: 'pending' };
    pending.set(key, entry);
    confirmed.delete(key);
    return Object.freeze({ ok: true, action: QUOTA_ACTION.REQUEST_RESET, status: 'pending' });
  }

  function cancelReset(ident) {
    const key = keyOf(ident.provider, ident.account, ident.model);
    const entry = getPending(ident.provider, ident.account, ident.model);
    if (!entry) {
      return Object.freeze({ ok: false, action: QUOTA_ACTION.CANCEL_RESET, status: 'not_found', reason: 'No pending reset to cancel.' });
    }
    entry.status = 'cancelled';
    entry.cancelledAt = currentNow();
    pending.delete(key);
    confirmed.delete(key);
    return Object.freeze({ ok: true, action: QUOTA_ACTION.CANCEL_RESET, status: 'cancelled' });
  }

  async function confirmReset(ident) {
    const key = keyOf(ident.provider, ident.account, ident.model);
    const entry = getPending(ident.provider, ident.account, ident.model);
    if (!entry || entry.status !== 'pending') {
      return Object.freeze({ ok: false, action: QUOTA_ACTION.CONFIRM_RESET, status: 'not_found', reason: 'No pending reset to confirm.' });
    }
    if (typeof performReset !== 'function') {
      entry.status = 'failed';
      entry.reason = 'not_supported';
      entry.confirmedAt = currentNow();
      pending.delete(key);
      confirmed.set(key, { status: 'failed', reason: 'not_supported', confirmedAt: entry.confirmedAt, credits: 0 });
      return Object.freeze({ ok: false, action: QUOTA_ACTION.CONFIRM_RESET, status: 'failed', reason: 'not_supported' });
    }
    let result;
    try {
      result = await performReset(ident.provider, ident.account, ident.model);
    } catch (error) {
      entry.status = 'failed';
      entry.reason = error && typeof error.code === 'string' ? error.code : 'RESET_FAILED';
      entry.confirmedAt = currentNow();
      pending.delete(key);
      confirmed.set(key, { status: 'failed', reason: entry.reason, confirmedAt: entry.confirmedAt, credits: 0 });
      return Object.freeze({ ok: false, action: QUOTA_ACTION.CONFIRM_RESET, status: 'failed', reason: entry.reason });
    }
    entry.status = result.ok === true ? 'redeemed' : 'failed';
    entry.confirmedAt = currentNow();
    const outcome = {
      status: entry.status,
      reason: result.reason,
      credits: typeof result.credits === 'number' ? result.credits : 0,
      confirmedAt: entry.confirmedAt,
    };
    pending.delete(key);
    confirmed.set(key, outcome);
    if (result.ok === true && typeof result.credits === 'number' && result.credits > 0) {
      creditsRedeemed += result.credits;
    }
    // A cancelled or ambiguous result is never automatically replayed as a read:
    // result.ok === undefined (ambiguous) or false (failed) means no redemption.
    return Object.freeze({
      ok: result.ok === true,
      action: QUOTA_ACTION.CONFIRM_RESET,
      status: entry.status,
      reason: result.reason,
      credits: outcome.credits,
    });
  }

  function snapshot() {
    return Object.freeze({
      creditsRedeemed,
      pending: [...pending.values()].map(e => Object.freeze({ ...e })),
      lastResetResult: (() => {
        let latest;
        for (const [, v] of confirmed) {
          if (!latest || v.confirmedAt > latest.confirmedAt) latest = v;
        }
        return latest === undefined ? undefined : Object.freeze({ ...latest });
      })(),
    });
  }

  return {
    requestReset,
    cancelReset,
    confirmReset,
    snapshot,
  };
}
