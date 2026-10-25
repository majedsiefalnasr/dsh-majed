// Integrated subscription adapters.
//
// Serves existing direct/pinned/pool/tier route identities in an isolated
// composition using synthetic accounts, before any new Auto behavior. No real
// account store is opened. One owner registers each provider; duplicate
// provider/tool/RPC registration is rejected (single-owner boundary).

import { PROVIDER_IDS } from './wire.js';
import { createSyntheticAccount, modelAllowedForPool, createAccountStore } from './account.js';
import { createHealthRegistry, memberKey, accountKey } from './health.js';
import { streamAccountWithReplay } from './replay.js';
import { createDirectRoute, poolKey } from './routes.js';
import { createUsageTracker } from './usage.js';
import { createQuotaOperations } from './quota.js';
import { registerLocalTransport, SUBSCRIPTIONS_ROUTE } from './transport.js';

export { PROVIDER_IDS, SUBSCRIPTIONS_ROUTE };
export const DUPLICATE_ADAPTER = 'DUPLICATE_ADAPTER';

function requiredProvider(provider) {
  if (!PROVIDER_IDS.includes(provider)) throw new Error(`Unknown subscription provider: ${provider}`);
  return provider;
}

/** Wrap a wire translator into an account-aware adapter consumed by routes. */
export function createWireAdapter(provider, translator, operations = {}) {
  requiredProvider(provider);
  const { resolveModel, resolveOwnModel, streamAccount } = operations;
  return {
    provider,
    kind: 'wire',
    resolveModel(p, model, signal) {
      if (p !== provider) throw new Error(`wire adapter ${provider} cannot resolve ${p}`);
      return resolveModel(p, model, signal);
    },
    resolveOwnModel(p, model, account) {
      if (p !== provider) throw new Error(`wire adapter ${provider} cannot resolve ${p}`);
      return resolveOwnModel(p, model, account);
    },
    streamAccount(options, account) {
      return streamAccount(options, account);
    },
    classifyError(error) { return translator.classifyError(error); },
    translator,
  };
}

export function createSubscriptionsService(ctx, initial = {}, options = {}) {
  const providers = Object.freeze([...(options.providers || PROVIDER_IDS)]);
  const store = createAccountStore(initial.accounts || []);
  const health = createHealthRegistry();
  const usage = createUsageTracker({ now: options.now, health });
  const quota = createQuotaOperations({ now: options.now });
  const wireAdapters = new Map(); // provider → wire adapter (single owner)
  const routes = new Map(); // routeKey ('${provider}/${model}' or poolId) → route adapter
  let disposed = false;
  const llm = options.llm || (ctx && ctx.llm);

  function assertLive() {
    if (disposed) throw new Error('Subscriptions service is disposed.');
  }

  /** Single-owner registration boundary: one adapter per provider. */
  function register(provider, wireAdapter) {
    assertLive();
    provider = requiredProvider(provider);
    if (!wireAdapter || typeof wireAdapter.streamAccount !== 'function')
      throw new Error(`Wire adapter for ${provider} must implement streamAccount.`);
    if (wireAdapters.has(provider)) throw Object.assign(new Error(DUPLICATE_ADAPTER), { code: DUPLICATE_ADAPTER, provider });
    wireAdapters.set(provider, wireAdapter);

    // Direct routes for independent/pinned accounts are created lazily on
    // first resolve; pools/tiers are registered explicitly via registerPool.
    if (typeof llm?.registerAdapter === 'function') {
      const route = buildProviderRoute(provider);
      const disposer = llm.registerAdapter([provider], route);
      return { provider, adapter: wireAdapter, disposer };
    }
    return { provider, adapter: wireAdapter, disposer: undefined };
  }

  /** The single llm adapter route exposed per provider; dispatches to direct/pool routes. */
  function buildProviderRoute(provider) {
    return {
      provider,
      kind: 'provider-route',
      async providerInfo() {
        return { provider, models: store.list(provider).flatMap(a => [...a.models]) };
      },
      async providerRetryPolicy() {
        return { maxAttempts: 10, initialDelayMs: 1000, backoffCapMs: 60000, jitter: 0.2 };
      },
      async listModels() {
        return store.list(provider).flatMap(account =>
          account.models.map(model => ({ provider, id: model, account: account.id })));
      },
      async resolveModel(provider, model, signal) {
        assertLive();
        const route = findRoute(provider, model);
        if (!route) throw new Error(`No subscription route for ${provider}/${model}`);
        return route.resolveModel(provider, model, signal);
      },
      async stream(options) {
        assertLive();
        options.signal?.throwIfAborted();
        const route = findRoute(options.provider, options.model);
        if (!route) throw new Error(`No subscription route for ${options.provider}/${options.model}`);
        return route.stream(options);
      },
      dispose() {
        wireAdapters.delete(provider);
      },
    };
  }

  function findRoute(provider, model) {
    const key = `${provider}/${model}`;
    if (routes.has(key)) return routes.get(key);
    // Independent / pinned accounts serve their advertised models directly with
    // no fallback; pools serve same-model unions otherwise.
    const account = store.list(provider).find(a => a.models.includes(model) && (a.independentEntry || a.pinned));
    if (account) {
      const adapter = createDirectRoute(account, wireAdapters.get(provider));
      routes.set(key, adapter);
      return adapter;
    }
    return undefined;
  }

  /** Register a pool/tier route under its pool key (single owner per key). */
  function registerPool(poolId, poolAdapter) {
    assertLive();
    if (!poolAdapter || typeof poolAdapter.stream !== 'function')
      throw new Error(`Pool route ${poolId} must implement stream.`);
    if (routes.has(poolId)) throw Object.assign(new Error(DUPLICATE_ADAPTER), { code: DUPLICATE_ADAPTER, provider: poolId });
    routes.set(poolId, poolAdapter);
    return poolId;
  }

  async function resolveModel(provider, model, signal) {
    assertLive();
    const route = findRoute(provider, model);
    if (!route) throw new Error(`No subscription route for ${provider}/${model}`);
    return route.resolveModel(provider, model, signal);
  }

  async function stream(options) {
    assertLive();
    const route = findRoute(options.provider, options.model);
    if (!route) throw new Error(`No subscription route for ${options.provider}/${options.model}`);
    return route.stream(options);
  }

  function snapshot() {
    return {
      providers: [...providers],
      registered: [...wireAdapters.keys()],
      routes: [...routes.entries()].map(([key, entry]) => ({
        key, kind: entry.kind || 'direct', account: entry.account,
      })),
      store: store.snapshot(),
      health: health.snapshot(),
      usage: usage.snapshot(),
      quota: quota.snapshot(),
      disposed,
    };
  }

  async function dispose() {
    if (disposed) return;
    disposed = true;
    for (const adapter of routes.values()) {
      if (adapter.dispose && typeof adapter.dispose === 'function') adapter.dispose();
    }
    routes.clear();
    wireAdapters.clear();
  }

  return {
    PROVIDER_IDS: providers,
    store,
    health,
    register,
    registerPool,
    resolveModel,
    stream,
    snapshot,
    dispose,
    createWireAdapter,
    createDirectRoute,
    createHealthRegistry,
    createAccountStore,
    createSyntheticAccount,
    modelAllowedForPool,
    usage,
    quota,
    recordUsage: input => usage.recordUsage(input),
    recordQuotaFailure: input => usage.recordQuotaFailure(input),
    recordProviderReset: input => usage.recordProviderReset(input),
    viewUsage: input => usage.view(input),
    excludesCandidate: input => usage.excludesCandidate(input),
    requestReset: input => quota.requestReset(input),
    confirmReset: input => quota.confirmReset(input),
    cancelReset: input => quota.cancelReset(input),
  };
}

export function applySubscriptions(ctx, options = {}) {
  let service;
  const effectId = 'dsh-majed: subscriptions';
  if (typeof ctx.effect === 'function') {
    ctx.effect(() => () => {
      if (service) void service.dispose();
    }, effectId);
  }

  // Owner-admitted Fetch RPC under the Majed namespace. Connection admission
  // authenticates the owner; origin/headers are supplemental CSRF checks only.
  if (typeof ctx.inject === 'function') {
    registerLocalTransport(ctx, {
      snapshot: () => service ? service.snapshot() : { providers: [], registered: [], routes: [], disposed: false },
    });
  }

  return {
    createService: (initial, opts) => { service = createSubscriptionsService(ctx, initial, opts); return service; },
    get service() { return service; },
    SUBSCRIPTIONS_ROUTE,
  };
}
