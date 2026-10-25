// Account authentication lifecycle for Codex/ChatGPT and Claude.
//
// Browser/manual OAuth paths and Claude Code import are exercised as state
// transitions over synthetic credentials: no real protocol implementation and
// no real account store access. Accounts carry independent identities and an
// optional per-provider default. A single in-memory writer guards concurrent
// mutation; credentials are redacted from snapshots, errors and logs.

const AUTH_STATES_INTERNAL = Object.freeze(['pending', 'successful', 'failed', 'cancelled']);
const AUTH_METHODS_INTERNAL = Object.freeze(['oauth', 'manual', 'claude-code-import']);
const DEFAULT_REFRESH_COOLDOWN_MS = 60_000;

export const AUTH_PENDING = 'pending';
export const AUTH_SUCCESSFUL = 'successful';
export const AUTH_FAILED = 'failed';
export const AUTH_CANCELLED = 'cancelled';

export const AUTH_METHOD_OAUTH = 'oauth';
export const AUTH_METHOD_MANUAL = 'manual';
export const AUTH_METHOD_CLAUDE_CODE_IMPORT = 'claude-code-import';

export const AUTH_STATES = Object.freeze([AUTH_PENDING, AUTH_SUCCESSFUL, AUTH_FAILED, AUTH_CANCELLED]);
export const AUTH_METHODS = Object.freeze([AUTH_METHOD_OAUTH, AUTH_METHOD_MANUAL, AUTH_METHOD_CLAUDE_CODE_IMPORT]);

function requiredString(value, name) {
  if (typeof value !== 'string' || !value) throw new Error(`Invalid ${name}.`);
  return value;
}

function isAuthState(value) { return AUTH_STATES_INTERNAL.includes(value); }
function isAuthMethod(value) { return AUTH_METHODS_INTERNAL.includes(value); }

export function createSyntheticAuthAccount(id, opts = {}) {
  const authMethod = opts.authMethod === undefined ? AUTH_METHOD_OAUTH : opts.authMethod;
  const authState = opts.authState === undefined ? AUTH_PENDING : opts.authState;
  if (!isAuthMethod(authMethod)) throw new Error(`Invalid auth method: ${authMethod}`);
  if (!isAuthState(authState)) throw new Error(`Invalid auth state: ${authState}`);
  return Object.freeze({
    id: requiredString(id, 'account id'),
    provider: requiredString(opts.provider, 'provider'),
    label: opts.label === undefined ? String(id) : String(opts.label),
    models: Object.freeze([...(opts.models ?? [])]),
    authMethod,
    authState,
    default: Boolean(opts.default),
    credentials: opts.credentials === undefined ? undefined : Object.freeze({ ...opts.credentials }),
    createdAt: typeof opts.createdAt === 'number' && Number.isFinite(opts.createdAt) ? opts.createdAt : Date.now(),
    updatedAt: typeof opts.updatedAt === 'number' && Number.isFinite(opts.updatedAt) ? opts.updatedAt : Date.now(),
    refreshCount: typeof opts.refreshCount === 'number' ? opts.refreshCount : 0,
    lastRefreshAt: opts.lastRefreshAt === undefined ? undefined : Number(opts.lastRefreshAt),
    failureReason: opts.failureReason === undefined ? undefined : String(opts.failureReason),
  });
}

function redactedCredentials() {
  // Credentials never leave the store; snapshots, errors and logs are secret-free.
  return undefined;
}

function publicView(record) {
  return Object.freeze({
    id: record.account.id,
    provider: record.account.provider,
    label: record.account.label,
    models: [...record.account.models],
    authMethod: record.authMethod,
    authState: record.authState,
    default: record.isDefault,
    credentials: redactedCredentials(),
    createdAt: record.account.createdAt,
    updatedAt: record.updatedAt,
    refreshCount: record.refreshCount,
    lastRefreshAt: record.lastRefreshAt,
    failureReason: record.failureReason,
  });
}

function makeRecord(account) {
  return {
    account,
    authState: account.authState,
    authMethod: account.authMethod,
    credentials: account.credentials,
    isDefault: account.default,
    failureReason: account.failureReason,
    refreshCount: account.refreshCount,
    lastRefreshAt: account.lastRefreshAt,
    updatedAt: account.updatedAt,
    refreshPromise: undefined,
    refreshInFlight: false,
  };
}

export function createAuthStore(initial = [], options = {}) {
  const byProvider = new Map();
  const byId = new Map();
  let writing = false;
  let disposed = false;
  const performRefresh = options.performRefresh;
  const onCatalogInvalidate = options.onCatalogInvalidate;
  const onUsageInvalidate = options.onUsageInvalidate;
  const onHealthInvalidate = options.onHealthInvalidate;

  function assertLive() {
    if (disposed) throw new Error('Auth store is disposed.');
  }

  function providerMap(provider) {
    let map = byProvider.get(provider);
    if (!map) { map = new Map(); byProvider.set(provider, map); }
    return map;
  }

  function keyOf(provider, id) { return `${provider}/${String(id)}`; }

  function getRecord(provider, id) {
    const record = byId.get(keyOf(provider, id));
    if (!record) throw new Error(`Unknown account ${keyOf(provider, id)}.`);
    return record;
  }

  function addUnsafe(record) {
    providerMap(record.account.provider).set(record.account.id, record);
    byId.set(keyOf(record.account.provider, record.account.id), record);
  }

  async function withWriter(operation) {
    assertLive();
    if (writing) throw new Error('Account store: a writer is already active.');
    writing = true;
    try { return await operation(); }
    finally { writing = false; }
  }

  for (const account of initial) addUnsafe(makeRecord(account));

  async function setInvalidation(record, provider, id, reason) {
    onCatalogInvalidate?.(provider, id);
    onUsageInvalidate?.(provider, id);
    onHealthInvalidate?.(provider, id, reason);
  }

  return {
    isWriting() { return writing; },
    list(provider) {
      const map = byProvider.get(provider);
      return map === undefined ? [] : [...map.values()].map(publicView);
    },
    get(provider, id) { return publicView(getRecord(provider, id)); },
    has(provider, id) { return byId.has(keyOf(provider, id)); },
    snapshot() {
      return {
        writing,
        accounts: [...byId.values()].map(publicView),
      };
    },
    async add(account) {
      return withWriter(async () => {
        if (this.has(account.provider, account.id)) throw new Error(`Account ${account.provider}/${account.id} already exists.`);
        addUnsafe(makeRecord(account));
        return publicView(makeRecord(account));
      });
    },
    async remove(provider, id) {
      return withWriter(async () => {
        const record = getRecord(provider, id);
        const map = providerMap(provider);
        map.delete(record.account.id);
        if (map.size === 0) byProvider.delete(provider);
        byId.delete(keyOf(provider, id));
        return record.account.id;
      });
    },
    async replace(account) {
      return withWriter(async () => {
        const key = keyOf(account.provider, account.id);
        if (!byId.has(key)) throw new Error(`Unknown account ${key}.`);
        const map = providerMap(account.provider);
        const index = [...map.values()].findIndex(r => r.account.id === account.id);
        if (index >= 0) {
          const entries = [...map.entries()];
          entries[index] = [account.id, makeRecord(account)];
          map.clear();
          for (const [aid, rec] of entries) map.set(aid, rec);
        }
        byId.set(key, makeRecord(account));
        return publicView(makeRecord(account));
      });
    },
    async setDefault(provider, id) {
      return withWriter(async () => {
        const record = getRecord(provider, id);
        const now = Date.now();
        for (const rec of byId.values()) {
          if (rec.account.provider === provider && rec.isDefault) {
            rec.isDefault = false;
            rec.updatedAt = now;
          }
        }
        record.isDefault = true;
        record.updatedAt = now;
        return publicView(record);
      });
    },
    /** Browser/manual OAuth: begin an authorization request for a pending account. */
    async beginOAuth(provider, id, opts = {}) {
      return withWriter(async () => {
        const record = getRecord(provider, id);
        if (record.authState !== AUTH_PENDING) throw new Error(`OAuth is not pending for ${keyOf(provider, id)}.`);
        record.authMethod = AUTH_METHOD_OAUTH;
        record.authState = AUTH_PENDING;
        record.failureReason = undefined;
        record.updatedAt = Date.now();
        const verifier = `oauth_verifier_${provider}_${id}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const challenge = `oauth_challenge_${provider}_${id}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        return { provider, verifier, challenge };
      });
    },
    /** Complete a browser/manual OAuth attempt. Empty/invalid code fails the account. */
    async completeOAuth(provider, id, input = {}) {
      return withWriter(async () => {
        const record = getRecord(provider, id);
        if (record.authState !== AUTH_PENDING) throw new Error(`OAuth is not pending for ${keyOf(provider, id)}.`);
        const code = input && typeof input.code === 'string' ? input.code : '';
        const state = input && typeof input.state === 'string' ? input.state : undefined;
        if (!code || !state) {
          record.authState = AUTH_FAILED;
          record.updatedAt = Date.now();
          throw new Error('Invalid OAuth code or state.');
        }
        record.authMethod = AUTH_METHOD_OAUTH;
        record.authState = AUTH_SUCCESSFUL;
        record.credentials = Object.freeze({ token: `synthetic_${provider}_token`, ...(input.credentials || {}) });
        record.failureReason = undefined;
        record.updatedAt = Date.now();
        await setInvalidation(record, provider, id, 'login');
        return publicView(record);
      });
    },
    /** Cancel an in-flight browser/manual OAuth attempt. */
    async cancelOAuth(provider, id) {
      return withWriter(async () => {
        const record = getRecord(provider, id);
        if (record.authState !== AUTH_PENDING) throw new Error(`OAuth is not pending for ${keyOf(provider, id)}.`);
        record.authState = AUTH_CANCELLED;
        record.updatedAt = Date.now();
        return publicView(record);
      });
    },
    /** Claude Code import path: synthetic credentials, successful import. */
    async importClaudeCode(provider, id, opts = {}) {
      return withWriter(async () => {
        const record = getRecord(provider, id);
        record.authMethod = AUTH_METHOD_CLAUDE_CODE_IMPORT;
        record.authState = AUTH_SUCCESSFUL;
        record.credentials = Object.freeze({ token: `synthetic_${provider}_claudecode_token`, ...(opts.credentials || {}) });
        record.failureReason = undefined;
        record.updatedAt = Date.now();
        await setInvalidation(record, provider, id, 'login');
        return publicView(record);
      });
    },
    /** Refresh credentials with coalescing: concurrent callers share one refresh. */
    async refresh(provider, id, opts = {}) {
      assertLive();
      const record = getRecord(provider, id);
      if (record.refreshPromise) return record.refreshPromise;
      const perform = opts.perform === undefined ? performRefresh : opts.perform;
      if (typeof perform !== 'function') throw new Error('Refresh is not supported for this account.');
      const now = Date.now();
      if (record.lastRefreshAt !== undefined && now - record.lastRefreshAt < DEFAULT_REFRESH_COOLDOWN_MS) {
        return { ok: true, refreshed: false, reason: 'cooldown' };
      }
      const promise = (async () => {
        record.refreshInFlight = true;
        try {
          const result = await perform(provider, id, publicView(record));
          record.refreshPromise = undefined;
          record.refreshInFlight = false;
          record.refreshCount += 1;
          record.lastRefreshAt = Date.now();
          record.updatedAt = Date.now();
          if (result.ok === false) {
            record.authState = AUTH_FAILED;
            record.failureReason = result.reason || 'REFRESH_FAILED';
            onHealthInvalidate?.(provider, id, record.failureReason);
          }
          onUsageInvalidate?.(provider, id);
          return result;
        } catch (error) {
          record.refreshPromise = undefined;
          record.refreshInFlight = false;
          record.authState = AUTH_FAILED;
          record.failureReason = error && typeof error.code === 'string' ? error.code : 'REFRESH_FAILED';
          onHealthInvalidate?.(provider, id, record.failureReason);
          onUsageInvalidate?.(provider, id);
          return { ok: false, reason: record.failureReason };
        }
      })();
      record.refreshPromise = promise;
      return promise;
    },
    /** Forced-refresh path: bypasses the refresh cooldown where supported. */
    async forceRefresh(provider, id) {
      assertLive();
      const record = getRecord(provider, id);
      if (record.refreshPromise) return record.refreshPromise;
      const perform = performRefresh;
      if (typeof perform !== 'function') throw new Error('Refresh is not supported for this account.');
      const promise = (async () => {
        record.refreshInFlight = true;
        try {
          const result = await perform(provider, id, publicView(record));
          record.refreshPromise = undefined;
          record.refreshInFlight = false;
          record.refreshCount += 1;
          record.lastRefreshAt = Date.now();
          record.updatedAt = Date.now();
          if (result.ok === false) {
            record.authState = AUTH_FAILED;
            record.failureReason = result.reason || 'REFRESH_FAILED';
            onHealthInvalidate?.(provider, id, record.failureReason);
          }
          onUsageInvalidate?.(provider, id);
          return result;
        } catch (error) {
          record.refreshPromise = undefined;
          record.refreshInFlight = false;
          record.authState = AUTH_FAILED;
          record.failureReason = error && typeof error.code === 'string' ? error.code : 'REFRESH_FAILED';
          onHealthInvalidate?.(provider, id, record.failureReason);
          onUsageInvalidate?.(provider, id);
          return { ok: false, reason: record.failureReason };
        }
      })();
      record.refreshPromise = promise;
      return promise;
    },
    /** Revoke only a failed account; concurrent newer logins are untouched. */
    async revoke(provider, id) {
      return withWriter(async () => {
        const record = getRecord(provider, id);
        if (record.authState !== AUTH_FAILED) throw Object.assign(new Error('Account is not revokable: only failed accounts can be revoked.'), { code: 'NOT_REVOKABLE' });
        record.credentials = undefined;
        record.failureReason = 'revoked';
        record.updatedAt = Date.now();
        onHealthInvalidate?.(provider, id, 'revoked');
        return publicView(record);
      });
    },
    async dispose() {
      if (disposed) return;
      disposed = true;
      byProvider.clear();
      byId.clear();
    },
  };
}
