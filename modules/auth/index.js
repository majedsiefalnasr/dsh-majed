// Account authentication for Grok, Copilot and Antigravity.
//
// Bounded source integration of three existing auth surfaces, not a protocol
// rewrite. Each provider keeps its own login/device/browser/manual mechanism,
// multi-account/default/removal behavior and provider-specific failure
// reporting. All credentials are synthetic and process-lifetime only: no real
// account store is opened and no operational login, account discovery or
// provider request is performed absent later approval.
//
// Built on the subscriptions account store (single-writer schema) and health
// registry so auth changes invalidate the affected account's health and the
// provider catalog through injected callbacks.

import { createAccountStore } from '../subscriptions/account.js';
import { createHealthRegistry, accountKey as healthAccountKey } from '../subscriptions/health.js';
import { createGrokAuth } from './providers/grok.js';
import { createCopilotAuth } from './providers/copilot.js';
import { createAntigravityAuth } from './providers/antigravity.js';
import { registerLocalTransport } from './transport.js';

export const PROVIDER_IDS = Object.freeze(['grok', 'copilot', 'antigravity']);
export const AUTH_ROUTE = '/api/dsh-majed/auth';

const DEFAULT_TOKEN_TTL_MS = 7 * 24 * 60 * 60_000;
const AUTH_COOLDOWN_MS = 24 * 60 * 60_000;

class AuthError extends Error {
  constructor(code, message, { status = 400, cause } = {}) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.status = status;
    this.cause = cause;
  }
}

function requiredProvider(provider) {
  if (!PROVIDER_IDS.includes(provider)) throw new AuthError('UNKNOWN_PROVIDER', `Unknown auth provider: ${provider}`);
  return provider;
}

function accountKey(provider, accountId) {
  return `${provider}/${String(accountId)}`;
}

function requiredString(value, name) {
  if (typeof value !== 'string' || !value) throw new AuthError('INVALID_INPUT', `Invalid ${name}.`);
  return value;
}

export function createAuthService(ctx, initial = {}, options = {}) {
  const providers = Object.freeze([...(options.providers || PROVIDER_IDS)]);
  for (const provider of providers) requiredProvider(provider);
  const store = options.store || createAccountStore(initial.accounts || []);
  const health = options.health || createHealthRegistry();
  const clock = options.clock || { now: () => Date.now() };
  const now = () => clock.now();
  const onCatalogInvalidate = typeof options.onCatalogInvalidate === 'function' ? options.onCatalogInvalidate : () => {};
  const onAccountInvalidate = typeof options.onAccountInvalidate === 'function' ? options.onAccountInvalidate : () => {};
  const deviceOutcomes = options.deviceOutcomes instanceof Map ? options.deviceOutcomes : new Map();
  const refreshFailures = options.refreshFailures instanceof Set ? options.refreshFailures : new Set();

  const strategies = new Map();
  for (const provider of providers) {
    if (provider === 'grok') strategies.set(provider, createGrokAuth({ clock }));
    else if (provider === 'copilot') strategies.set(provider, createCopilotAuth({ clock }));
    else if (provider === 'antigravity') strategies.set(provider, createAntigravityAuth({ clock }));
  }

  let disposed = false;
  let writing = false;
  // authState: accountKey → { status, mechanism, provider, accountId, default, createdAt, expiresAt,
  //   challenge, deviceCode, state, hasTokens, lastError }
  const authState = new Map();

  function assertLive() {
    if (disposed) throw new AuthError('DISPOSED', 'Auth service is disposed.', 503);
  }
  function assertWriting() {
    if (writing) throw new AuthError('STORE_WRITE_CONFLICT', 'An auth write is already in flight.', 409);
  }

  async function withWriter(operation) {
    assertWriting();
    writing = true;
    try { return await operation(); }
    finally { writing = false; }
  }

  function requireAccount(provider, accountId) {
    const account = store.get(provider, accountId);
    if (!account) throw new AuthError('UNKNOWN_ACCOUNT', `Unknown account ${provider}/${accountId}.`, 404);
    return account;
  }

  function getAuth(provider, accountId) {
    return authState.get(accountKey(provider, accountId));
  }

  function requireAuth(provider, accountId) {
    const st = getAuth(provider, accountId);
    if (!st) throw new AuthError('NOT_AUTHENTICATED', `Account ${provider}/${accountId} is not authenticated.`, 404);
    return st;
  }

  function invalidateAccount(provider, accountId) {
    health.clear(provider, accountId);
    onAccountInvalidate(provider, accountId);
  }

  function invalidateCatalog(provider) {
    onCatalogInvalidate(provider);
  }

  function strategyOf(provider) {
    const strategy = strategies.get(provider);
    if (!strategy) throw new AuthError('UNKNOWN_PROVIDER', `Unknown auth provider: ${provider}`);
    return strategy;
  }

  /** Mark an account authorized, issue synthetic tokens and invalidate health/catalog. */
  function authorize(st) {
    st.status = 'authorized';
    st.hasTokens = true;
    st.expiresAt = now() + DEFAULT_TOKEN_TTL_MS;
    st.lastError = undefined;
    invalidateAccount(st.provider, st.accountId);
    invalidateCatalog(st.provider);
  }

  async function setDefaultUnsafe(provider, accountId) {
    requireAccount(provider, accountId);
    const key = accountKey(provider, accountId);
    for (const [k, st] of authState) {
      if (st.provider === provider && st.default === true) st.default = false;
    }
    let st = getAuth(provider, accountId);
    if (!st) {
      st = { provider, accountId, default: true, status: 'none', createdAt: now(), hasTokens: false };
      authState.set(key, st);
    } else {
      st.default = true;
    }
  }

  // ------------------------------------------------------------------
  // Operations
  // ------------------------------------------------------------------

  async function login({ provider, accountId, mechanism, tokens } = {}) {
    requiredProvider(provider);
    assertLive();
    const strategy = strategyOf(provider);
    requiredString(accountId, 'account id');
    requireAccount(provider, accountId);
    if (!strategy.mechanisms.includes(mechanism)) {
      throw new AuthError(strategy.codes.MECHANISM_NOT_SUPPORTED, `${provider} does not support the "${mechanism}" mechanism.`);
    }
    return withWriter(async () => {
      const key = accountKey(provider, accountId);
      const existing = getAuth(provider, accountId);
      const st = existing || { provider, accountId, default: false, status: 'none', createdAt: now(), hasTokens: false };
      st.provider = provider;
      st.accountId = accountId;
      st.createdAt = now();
      st.lastError = undefined;
      st.status = 'pending';
      st.mechanism = mechanism;
      st.hasTokens = false;
      st.expiresAt = undefined;
      st.challenge = undefined;
      st.deviceCode = undefined;
      st.state = undefined;

      if (mechanism === 'device') {
        const challenge = strategy.createDeviceChallenge();
        st.deviceCode = challenge.deviceCode;
        st.challenge = { userCode: challenge.userCode, verificationUri: challenge.verificationUri, intervalMs: strategy.deviceIntervalMs };
        st.expiresAt = now() + strategy.deviceTtlMs;
        authState.set(key, st);
        return {
          provider, accountId, mechanism: 'device', status: 'pending',
          challenge: { deviceCode: challenge.deviceCode, userCode: challenge.userCode, verificationUri: challenge.verificationUri, intervalMs: strategy.deviceIntervalMs },
          expiresAt: st.expiresAt,
        };
      }
      if (mechanism === 'browser') {
        const challenge = strategy.createBrowserChallenge();
        st.state = challenge.state;
        st.challenge = { authUrl: challenge.authUrl };
        st.expiresAt = now() + strategy.deviceTtlMs;
        authState.set(key, st);
        return {
          provider, accountId, mechanism: 'browser', status: 'pending',
          challenge: { authUrl: challenge.authUrl, state: challenge.state },
          expiresAt: st.expiresAt,
        };
      }
      // manual: tokens required, authorized immediately
      if (!tokens || typeof tokens !== 'object' || Array.isArray(tokens) || Object.keys(tokens).length === 0) {
        throw new AuthError(strategy.codes.MISSING_TOKENS, 'Manual login requires tokens.');
      }
      st.status = 'authorized';
      st.hasTokens = true;
      st.expiresAt = now() + DEFAULT_TOKEN_TTL_MS;
      authState.set(key, st);
      authorize(st);
      return { provider, accountId, mechanism: 'manual', status: 'authorized', authorized: true };
    });
  }

  async function devicePoll({ provider, accountId, deviceCode } = {}) {
    requiredProvider(provider);
    assertLive();
    const strategy = strategyOf(provider);
    requiredString(accountId, 'account id');
    requiredString(deviceCode, 'device code');
    const st = getAuth(provider, accountId);
    if (!st || st.mechanism !== 'device') {
      throw new AuthError(strategy.codes.NOT_AUTHENTICATED, `No pending device flow for ${provider}/${accountId}.`, 404);
    }
    if (st.deviceCode !== deviceCode) {
      throw new AuthError(strategy.codes.INVALID_CODE, 'Device code does not match the pending flow.');
    }
    if (st.status === 'cancelled') throw new AuthError(strategy.codes.ACCESS_DENIED, 'The device flow was cancelled.');
    if (st.status === 'expired') throw new AuthError(strategy.codes.DEVICE_EXPIRED, 'The device code expired.');
    if (now() > st.expiresAt) {
      st.status = 'expired';
      st.lastError = { code: strategy.codes.DEVICE_EXPIRED, message: 'The device code expired.' };
      authState.set(accountKey(provider, accountId), st);
      invalidateAccount(provider, accountId);
      invalidateCatalog(provider);
      throw new AuthError(strategy.codes.DEVICE_EXPIRED, 'The device code expired.');
    }
    const outcome = deviceOutcomes.get(deviceCode);
    if (outcome === 'authorized') {
      deviceOutcomes.delete(deviceCode);
      st.status = 'authorized';
      st.hasTokens = true;
      st.expiresAt = now() + DEFAULT_TOKEN_TTL_MS;
      st.lastError = undefined;
      authState.set(accountKey(provider, accountId), st);
      authorize(st);
      return { provider, accountId, mechanism: 'device', status: 'authorized', authorized: true };
    }
    if (outcome === 'access_denied') {
      deviceOutcomes.delete(deviceCode);
      st.status = 'cancelled';
      st.lastError = { code: strategy.codes.ACCESS_DENIED, message: 'Access denied.' };
      authState.set(accountKey(provider, accountId), st);
      invalidateAccount(provider, accountId);
      invalidateCatalog(provider);
      throw new AuthError(strategy.codes.ACCESS_DENIED, 'Access denied.');
    }
    return {
      provider, accountId, mechanism: 'device', status: 'authorization_pending',
      intervalMs: strategy.deviceIntervalMs, expiresAt: st.expiresAt,
    };
  }

  async function deviceCancel({ provider, accountId, deviceCode } = {}) {
    requiredProvider(provider);
    assertLive();
    const strategy = strategyOf(provider);
    requiredString(accountId, 'account id');
    requiredString(deviceCode, 'device code');
    const st = getAuth(provider, accountId);
    if (!st || st.mechanism !== 'device') {
      throw new AuthError(strategy.codes.NOT_AUTHENTICATED, `No pending device flow for ${provider}/${accountId}.`, 404);
    }
    if (st.deviceCode !== deviceCode) {
      throw new AuthError(strategy.codes.INVALID_CODE, 'Device code does not match the pending flow.');
    }
    return withWriter(async () => {
      st.status = 'cancelled';
      st.lastError = { code: strategy.codes.ACCESS_DENIED, message: 'The device flow was cancelled.' };
      authState.set(accountKey(provider, accountId), st);
      invalidateAccount(provider, accountId);
      invalidateCatalog(provider);
      return { provider, accountId, mechanism: 'device', status: 'cancelled', cancelled: true };
    });
  }

  async function callback({ provider, accountId, code, state } = {}) {
    requiredProvider(provider);
    assertLive();
    const strategy = strategyOf(provider);
    requiredString(accountId, 'account id');
    const st = getAuth(provider, accountId);
    if (!st || st.mechanism !== 'browser') {
      throw new AuthError(strategy.codes.NOT_AUTHENTICATED, `No pending browser flow for ${provider}/${accountId}.`, 404);
    }
    if (st.status === 'cancelled' || st.status === 'expired') {
      throw new AuthError(strategy.codes.ACCESS_DENIED, 'The browser flow is no longer pending.');
    }
    if (typeof state !== 'string' || !state || st.state !== state) {
      throw new AuthError(strategy.codes.INVALID_STATE, 'OAuth state does not match the pending flow.');
    }
    if (typeof code !== 'string' || !code) {
      throw new AuthError(strategy.codes.INVALID_CODE, 'Missing authorization code.');
    }
    return withWriter(async () => {
      st.status = 'authorized';
      st.hasTokens = true;
      st.expiresAt = now() + DEFAULT_TOKEN_TTL_MS;
      st.lastError = undefined;
      st.state = undefined;
      authState.set(accountKey(provider, accountId), st);
      authorize(st);
      return { provider, accountId, mechanism: 'browser', status: 'authorized', authorized: true };
    });
  }

  async function refresh({ provider, accountId } = {}) {
    requiredProvider(provider);
    assertLive();
    const strategy = strategyOf(provider);
    requiredString(accountId, 'account id');
    const st = requireAuth(provider, accountId);
    if (st.status !== 'authorized') {
      throw new AuthError(strategy.codes.NOT_AUTHENTICATED, `Account ${provider}/${accountId} is not authorized.`);
    }
    return withWriter(async () => {
      if (refreshFailures.has(accountKey(provider, accountId))) {
        st.status = 'failed';
        st.lastError = { code: strategy.codes.REFRESH_FAILED, message: 'Token refresh failed.' };
        authState.set(accountKey(provider, accountId), st);
        health.markUnavailable(healthAccountKey(provider, accountId), AUTH_COOLDOWN_MS, strategy.codes.REFRESH_FAILED);
        onAccountInvalidate(provider, accountId);
        invalidateCatalog(provider);
        throw new AuthError(strategy.codes.REFRESH_FAILED, 'Token refresh failed.');
      }
      st.expiresAt = now() + DEFAULT_TOKEN_TTL_MS;
      st.lastError = undefined;
      authState.set(accountKey(provider, accountId), st);
      invalidateAccount(provider, accountId);
      invalidateCatalog(provider);
      return { provider, accountId, status: 'authorized', refreshed: true };
    });
  }

  async function revoke({ provider, accountId } = {}) {
    requiredProvider(provider);
    assertLive();
    const strategy = strategyOf(provider);
    requiredString(accountId, 'account id');
    const st = getAuth(provider, accountId);
    if (!st || st.status !== 'authorized') {
      throw new AuthError(strategy.codes.NOT_AUTHENTICATED, `Account ${provider}/${accountId} is not authorized.`, 404);
    }
    return withWriter(async () => {
      st.status = 'revoked';
      st.hasTokens = false;
      st.expiresAt = undefined;
      st.lastError = { code: strategy.codes.REVOKED, message: 'Tokens revoked.' };
      authState.set(accountKey(provider, accountId), st);
      health.markUnavailable(healthAccountKey(provider, accountId), AUTH_COOLDOWN_MS, strategy.codes.REVOKED);
      onAccountInvalidate(provider, accountId);
      invalidateCatalog(provider);
      return { provider, accountId, status: 'revoked', revoked: true };
    });
  }

  async function setDefault({ provider, accountId } = {}) {
    requiredProvider(provider);
    assertLive();
    requiredString(accountId, 'account id');
    requireAccount(provider, accountId);
    return withWriter(async () => {
      await setDefaultUnsafe(provider, accountId);
      return { provider, accountId, default: true };
    });
  }

  async function remove({ provider, accountId } = {}) {
    requiredProvider(provider);
    assertLive();
    requiredString(accountId, 'account id');
    requireAccount(provider, accountId);
    return withWriter(async () => {
      const st = getAuth(provider, accountId);
      const wasDefault = st && st.default === true;
      await store.remove(provider, accountId);
      authState.delete(accountKey(provider, accountId));
      invalidateAccount(provider, accountId);
      invalidateCatalog(provider);
      if (wasDefault) {
        // Promote the next remaining store account for the provider, even if it
        // has no auth state yet.
        const nextAccount = store.list(provider).find(a => a.id !== accountId);
        if (nextAccount) {
          let next = getAuth(provider, nextAccount.id);
          if (!next) {
            next = { provider, accountId: nextAccount.id, default: false, status: 'none', createdAt: now(), hasTokens: false };
            authState.set(accountKey(provider, nextAccount.id), next);
          }
          next.default = true;
        }
      }
      return { provider, accountId, removed: true, wasDefault };
    });
  }

  // ------------------------------------------------------------------
  // Query
  // ------------------------------------------------------------------

  function snapshot() {
    const accounts = [];
    const defaultByProvider = {};
    for (const provider of providers) {
      let defaultAccountId;
      for (const account of store.list(provider)) {
        const st = getAuth(provider, account.id);
        const entry = {
          accountId: account.id, id: account.id, label: account.label, provider,
          default: st ? st.default === true : false,
          status: st ? st.status : 'none',
          mechanism: st ? st.mechanism : undefined,
          createdAt: st ? st.createdAt : undefined,
          expiresAt: st ? st.expiresAt : undefined,
          hasTokens: st ? st.hasTokens : false,
          lastError: st && st.lastError ? { code: st.lastError.code } : undefined,
        };
        accounts.push(entry);
        if (entry.default) defaultAccountId = entry.accountId;
      }
      defaultByProvider[provider] = defaultAccountId;
    }
    return { providers: [...providers], accounts, defaultByProvider, writing, disposed };
  }

  function isWriting() {
    return writing;
  }

  async function dispose() {
    if (disposed) return;
    disposed = true;
    authState.clear();
    deviceOutcomes.clear();
    refreshFailures.clear();
  }

  return {
    providers,
    store,
    health,
    login,
    devicePoll,
    deviceCancel,
    callback,
    refresh,
    revoke,
    setDefault,
    remove,
    snapshot,
    isWriting,
    dispose,
  };
}

export function applyAuth(ctx, options = {}) {
  let service;
  if (typeof ctx.effect === 'function') {
    ctx.effect(() => () => {
      if (service) void service.dispose();
    }, 'dsh-majed: auth lifecycle');
  }
  if (typeof ctx.inject === 'function') {
    registerLocalTransport(ctx, () => service);
  }
  return {
    createService: (initial, opts) => { service = createAuthService(ctx, initial, opts); return service; },
    get service() { return service; },
    AUTH_ROUTE,
  };
}
