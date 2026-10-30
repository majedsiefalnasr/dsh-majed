import z from '@deepseek-ai/schemastery';
import { OAuthFlowManager } from './auth/oauth-flow.js';
import { CodexAuthController } from './auth/controller.js';
import { AccountTokenManager } from './providers/accounts.js';
import { CodexAdapter, CODEX_PREEMPT_MS, CODEX_CLIENT_VERSION, refreshCodex, isCodexPermanentRefreshError, fetchCodexUsage, fetchCodexResetCredits, consumeCodexResetCredit } from './providers/codex.js';
import { CodexClientVersionCache } from './providers/codex-client-version.js';
import { catalogStore, accountCatalogStore } from './providers/catalog-store.js';
import { startCatalogRefresh } from './providers/catalog-refresh.js';
import { PoolAdapter } from './providers/pool.js';
import { PoolHealthRegistry } from './providers/pool-health.js';
import { PoolUsageTracker } from './providers/pool-usage.js';
import { buildAccountPools, poolKey } from './providers/pool-family.js';
import { ResetRedemption } from './providers/reset-redemption.js';
import { proxiedFetch, proxyGetConfig, proxySetConfig, proxyTestConnection, safeDiagnostic, disposeProxyTransport } from './http.js';
import { DISCOVERY_TIMEOUT_MS, OAuthEndpointError, deadlineSignal, withTimeout } from './providers/common.js';
import { ProviderSettingsStore, PROVIDER_TOOLS, validatePreferences } from './provider-settings.js';
import { defaultEffortOf, loadModelDefaults, setDefaultEffort } from './model-defaults.js';
import { ImageAccountPool } from './providers/image-pool.js';
import { CodexWebSearchProvider } from './providers/codex-search.js';
import { createImageGenerateTool } from './tools/image-generate.js';
import { registerWithAlias } from './tools/registration.js';
import { AccountPreferencesAdapter, accountAllowsPool, parseAccountModelId } from './providers/account-preferences.js';
export const name = 'dsh-majed/subscriptions';
export const inject = ['llm'];
/** Bound on one account's catalog read while assembling pools: a hung account sits out instead of failing the pool. */
export const POOL_USAGE_TIMEOUT_MS = DISCOVERY_TIMEOUT_MS;
// Same-named schemastery schema, as in the reference (index.ts `Config`). Only the Codex slice is owned here;
// `@deepseek-ai/schemastery` is the host's public schema package (peer in the reference), no host patch involved.
const modelEntrySchema = z.object({
    id: z.string().required(),
    name: z.string(),
    contextWindow: z.number().step(1).min(1),
    maxTokens: z.number().step(1).min(1),
    inputModalities: z.array(z.union(['text', 'image'])),
    wire: z.union(['chat-completions', 'responses']),
});
const poolMemberSchema = z.object({
    provider: z.union(['codex', 'claude', 'grok', 'copilot', 'antigravity']).required(),
    account: z.string(),
    model: z.string().required(),
});
export const Config = z.object({
    codexClientVersion: z.string(),
    models: z.object({ codex: z.array(modelEntrySchema) }),
    pool: z.object({
        enabled: z.boolean().default(true),
        strategy: z.union(['priority', 'quota_aware']).default('quota_aware'),
        switchMargin: z.number().min(1).default(2),
        autoAccounts: z.boolean().default(true),
        autoFamilies: z.boolean(),
        families: z.dict(z.array(poolMemberSchema)),
        tiers: z.dict(z.array(poolMemberSchema)),
    }),
});
/** Reference `readForce`: the optional `force` flag must be a boolean when present. */
function readForce(payload) {
    const force = payload.force;
    if (force === undefined)
        return false;
    if (typeof force !== 'boolean')
        throw new Error('payload.force must be a boolean when present');
    return force;
}
/** Reference `readProxyTestPayload`, plus the draft fields the owned dialog sends (`enabled`, `bypass`, `password: null`). */
function readProxyTestPayload(payload) {
    const { url, proxy } = payload;
    if (url === undefined && proxy === undefined)
        return {};
    if (url !== undefined && (typeof url !== 'string' || url.length === 0))
        throw new Error('payload.url must be a non-empty string when present');
    let draft;
    if (proxy !== undefined) {
        if (typeof proxy !== 'object' || proxy === null || Array.isArray(proxy))
            throw new Error('payload.proxy must be an object when present');
        const record = proxy;
        if (typeof record.url !== 'string' || record.url.length === 0)
            throw new Error('payload.proxy.url must be a non-empty string');
        if (record.username !== undefined && typeof record.username !== 'string')
            throw new Error('payload.proxy.username must be a string when present');
        if (record.password !== undefined && record.password !== null && typeof record.password !== 'string')
            throw new Error('payload.proxy.password must be a string or null when present');
        if (record.enabled !== undefined && typeof record.enabled !== 'boolean')
            throw new Error('payload.proxy.enabled must be a boolean when present');
        if (record.bypass !== undefined && (!Array.isArray(record.bypass) || record.bypass.some(item => typeof item !== 'string')))
            throw new Error('payload.proxy.bypass must be an array of strings when present');
        draft = { url: record.url, ...record.username === undefined ? {} : { username: record.username },
            ...record.password === undefined ? {} : { password: record.password },
            ...record.enabled === undefined ? {} : { enabled: record.enabled },
            ...record.bypass === undefined ? {} : { bypass: record.bypass } };
    }
    return { ...url === undefined ? {} : { url: url }, ...draft === undefined ? {} : { proxy: draft } };
}
/**
 * Text for an error that is shown in the browser. An upstream HTTP error body is untrusted free text whose
 * secrets cannot be recognised, so only its status survives; every other failure goes through the bounded
 * structural sanitizer (known proxy credentials plus recognisable secret shapes; see docs/ai/ticket-130-verification.md for limits).
 */
function browserSafeError(error, label) {
    if (error instanceof OAuthEndpointError) {
        // The provider's error code is kept only when it looks like a code (never free text).
        const code = error.oauthCode !== undefined && /^[A-Za-z0-9_.:-]{1,64}$/.test(error.oauthCode) ? `: ${error.oauthCode}` : '';
        return `${label} endpoint error (HTTP ${String(error.status)})${code}`;
    }
    return safeDiagnostic(error);
}
export function apply(ctx, config = {}) {
    const preferences = new ProviderSettingsStore();
    void loadModelDefaults().catch(() => ctx.logger.warn('dsh-majed: model defaults unavailable'));
    const flows = new OAuthFlowManager();
    const version = new CodexClientVersionCache();
    const health = new PoolHealthRegistry();
    const imagePool = new ImageAccountPool({ enabled: config.pool?.enabled !== false && (config.pool?.autoAccounts ?? config.pool?.autoFamilies ?? true),
        onWarn: message => ctx.logger.warn(`dsh-majed: ${message}`) });
    let handle;
    // The raw registration error stays server-side; the browser gets `collisionText()`, built after the stored proxy
    // credential has loaded so safeDiagnostic can redact it. `collision` is only the presence flag.
    let collision;
    let collisionError;
    let disposed = false;
    const ownAlias = (key) => { const settings = preferences.get('codex').accounts; return settings && Object.hasOwn(settings, key) ? settings[key]?.alias : undefined; };
    const collisionText = async () => {
        await proxyGetConfig().catch(() => undefined); // loads the stored proxy credential so it can be redacted
        return browserSafeError(collisionError, 'codex registration');
    };
    let pool;
    let adapter;
    const changed = (account) => {
        if (disposed)
            return;
        adapter?.clearAccountCatalog(account);
        health.clear('codex', account);
        imagePool.clear('codex', account);
        usage.invalidate('codex', account);
        pool?.invalidate();
        handle?.replace(['codex']);
    };
    const tokens = new AccountTokenManager({ provider: 'codex', displayName: 'ChatGPT (Codex)',
        makeOptions: () => ({ preemptMs: CODEX_PREEMPT_MS, refresh: refreshCodex, isPermanent: isCodexPermanentRefreshError }),
        onAccountRemoved: changed });
    const readUsage = async (account, signal) => {
        const session = await tokens.session(account);
        const snapshot = await fetchCodexUsage(session, proxiedFetch, signal);
        try {
            return { ...snapshot, resetCredits: await fetchCodexResetCredits(session, proxiedFetch, signal) };
        }
        catch (error) {
            return { ...snapshot, resetCreditsError: browserSafeError(error, 'codex reset credits') };
        }
    };
    const usage = new PoolUsageTracker((provider, account) => provider === 'codex'
        ? () => readUsage(account, AbortSignal.timeout(20_000)) : undefined);
    const auth = new CodexAuthController(flows, changed, error => browserSafeError(error, 'codex login'));
    const resets = new ResetRedemption(readUsage, async (account, credit, request, signal) => consumeCodexResetCredit(await tokens.session(account), credit, request, proxiedFetch, signal), account => usage.invalidate('codex', account));
    adapter = new CodexAdapter({ tokens, models: config.models?.codex ?? [
            { id: 'gpt-5.1-codex', name: 'GPT-5.1 Codex' },
            { id: 'gpt-5.1-codex-mini', name: 'GPT-5.1 Codex Mini' },
            { id: 'gpt-5.1', name: 'GPT-5.1' },
        ], streamIdleTimeoutMs: 300_000,
        discovery: !config.models?.codex?.length,
        defaultEffortOf: model => defaultEffortOf('codex', model),
        contextWindowOf: model => preferences.contextWindow(model),
        speedFor: async (sessionId, model) => {
            const registry = ctx.get('agents');
            return sessionId !== undefined && registry?.get(sessionId)?.session.header.origin === 'subagent'
                && preferences.subagentSpeed(parseAccountModelId(model)?.model ?? model) === 'fast' && await adapter.supportsFastTier(model);
        },
        clientVersion: config.codexClientVersion,
        resolveClientVersion: () => version.resolve(),
        catalogStore: catalogStore('codex'), accountCatalogStore: account => accountCatalogStore('codex', account),
        onCatalogChanged: () => { if (!disposed) {
            pool?.invalidate();
            handle?.replace(['codex']);
        } },
        resolveAttachments: () => ctx.get('attachments'),
        pool: () => pool,
        onWarn: message => ctx.logger.warn(`dsh-majed: ${message}`), });
    const presented = new AccountPreferencesAdapter({ provider: 'codex', adapter, settings: preferences,
        accounts: async () => (await tokens.list()).map(({ key, session }) => ({ key, label: session.emailAddress ?? key })), pool: () => pool });
    pool = new PoolAdapter({ adapters: { codex: presented.poolMember() }, health, usage, strategy: config.pool?.strategy ?? 'quota_aware', switchMargin: config.pool?.switchMargin ?? 2,
        defaultAccount: () => tokens.defaultAccount(), resolveAccount: (_, account) => tokens.resolveAccount(account),
        families: async () => {
            if (config.pool?.enabled === false)
                return new Map();
            const families = new Map();
            if (config.pool?.autoAccounts ?? config.pool?.autoFamilies ?? true) {
                // Discover each account separately and bound each read: a hang or failure sits that account out
                // instead of failing the whole assembly (reference index.ts `families`).
                try {
                    const accounts = (await tokens.list()).map(entry => entry.key);
                    const catalogs = (await Promise.all(accounts.map(async (account) => {
                        const models = await withTimeout(signal => adapter.listOwnModels('codex', account, signal, true), POOL_USAGE_TIMEOUT_MS)
                            .catch(() => undefined);
                        const settings = preferences.get('codex').accounts;
                        const policy = settings && Object.hasOwn(settings, account) ? settings[account] : undefined;
                        return models === undefined ? undefined : { account, models: models.filter(model => accountAllowsPool(policy, model.id)) };
                    }))).filter(entry => entry !== undefined);
                    if (catalogs.length > 0)
                        for (const [key, definition] of buildAccountPools({ codex: { catalogs } }))
                            families.set(key, definition);
                }
                catch { /* Discovery failures are already reported by the owning adapter. */ }
            }
            for (const [id, members] of Object.entries(config.pool?.families ?? {})) {
                const owner = members[0]?.provider;
                if (!owner)
                    continue;
                const kept = members.filter(member => member.provider === owner);
                if (kept.length < members.length)
                    ctx.logger.warn(`dsh-majed: pool "${id}": cross-provider members are ignored; only ${owner} accounts are pooled`);
                families.set(poolKey(owner, id), { members: kept });
            }
            return families;
        }, tiers: config.pool?.enabled === false ? {} : config.pool?.tiers ?? {},
        onWarn: message => ctx.logger.warn(`dsh-majed: ${message}`) });
    try {
        handle = ctx.llm.registerAdapter(['codex'], presented);
    }
    catch (error) {
        collisionError = error;
        collision = 'Codex registration is unavailable';
    }
    ctx.effect(() => () => { disposed = true; auth.dispose(); void disposeProxyTransport(); }, 'dsh-majed: subscriptions auth disposal');
    if (handle)
        ctx.effect(() => startCatalogRefresh(async (signal) => {
            if ((await tokens.list()).length && !signal.aborted)
                await adapter.listOwnModels('codex', undefined, signal);
        }, () => ctx.logger.warn('dsh-majed: Codex catalog refresh failed')), 'dsh-majed: subscriptions catalog refresh');
    // `web` is optional on headless/minimal compositions. The Codex switch gates this provider's
    // `available()` rather than the host's web_search tool, so other providers keep working.
    ctx.inject(['web'], webCtx => {
        webCtx.web.registerSearchProvider(new CodexWebSearchProvider({ tokens,
            enabled: () => preferences.toolEnabled('codex', 'web_search'), fetchFn: proxiedFetch }));
    });
    // `tools` is optional too. Definitions stay registered globally so already-open sessions keep their
    // schema and execution path; each new agent is restricted from the switches in force at its creation.
    ctx.inject(['tools'], toolsCtx => {
        const registeredNames = new Map();
        const result = registerWithAlias(toolsCtx.tools, createImageGenerateTool({ imagePool, codexTokens: tokens,
            resolveAttachments: () => ctx.get('attachments'),
            resolveLlm: () => ctx.get('llm'),
            providerEnabled: (provider, createdAt) => preferences.toolEnabled(provider, 'image_generate', createdAt) }), message => ctx.logger.warn(message));
        if (result !== undefined)
            registeredNames.set('image_generate', result.name);
        toolsCtx.on('agent/created', ({ agent }) => {
            const at = agent.session.header.createdAt;
            const deny = [];
            const registered = registeredNames.get('image_generate');
            if (registered !== undefined && !preferences.toolEnabled('codex', 'image_generate', at))
                deny.push(registered);
            if (deny.length)
                agent.ctx.tools.restrict({ deny });
            return undefined;
        });
    });
    /**
     * Each account's own catalog, one bounded read per account: a hung or failing account is marked
     * `unavailable` after DISCOVERY_TIMEOUT_MS (or when the caller's signal aborts) instead of hanging the RPC.
     */
    const readAccountCatalogs = async (preferCached, signal) => {
        const accounts = await tokens.list();
        return Promise.all(accounts.map(async ({ key, session }) => {
            const models = await withTimeout(accountSignal => adapter.listOwnModels('codex', key, accountSignal, preferCached), DISCOVERY_TIMEOUT_MS, signal).catch(() => undefined);
            return { key, label: session.emailAddress ?? key, models: models ?? [], ...(models === undefined ? { unavailable: true } : {}) };
        }));
    };
    /**
     * The context bounds shown AND enforced for one model: the minimum default and the minimum maximum over every
     * account that lists it, so the UI limit is a value each account can honour. Undefined when no account lists it.
     */
    const boundsFor = async (model, catalogs, signal) => {
        const limits = (await Promise.all(catalogs.filter(account => account.models.some(entry => entry.id === model))
            .map(account => adapter.contextLimits(model, account.key, signal).catch(() => undefined)))).filter(entry => entry !== undefined);
        return limits.length ? { default: Math.min(...limits.map(entry => entry.default)), max: Math.min(...limits.map(entry => entry.max)) } : undefined;
    };
    ctx.inject(['connection'], ctx => {
        const connection = ctx.get('connection');
        const endpoints = ['status', 'login', 'manual', 'cancel', 'logout', 'setDefault', 'usage', 'prepareReset', 'consumeReset', 'providerSettings', 'setProviderSettings', 'modelDefaults', 'setModelDefault', 'proxyGet', 'proxySet', 'proxyTest'];
        for (const endpoint of endpoints) {
            const NS = 'majed-subscriptions.';
            const method = `${NS}${endpoint}`;
            ctx.effect(() => connection.fetch.register({ path: `/api/${method}`, methods: ['POST'], requestBody: 'buffered',
                async fetch(request) {
                    if (request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json')
                        return new Response('content type must be application/json', { status: 415 });
                    let body;
                    try {
                        body = await request.json();
                    }
                    catch {
                        return new Response('invalid JSON', { status: 400 });
                    }
                    if (body?.type !== 'client-request' || typeof body.rpcId !== 'string' || body.method !== method)
                        return new Response('invalid RPC envelope', { status: 400 });
                    const payload = body.payload ?? {};
                    const string = (key) => { const value = payload[key]; if (typeof value !== 'string' || !value)
                        throw new Error(`payload.${key} must be a non-empty string`); return value; };
                    let result;
                    const releases = [];
                    try {
                        if (disposed)
                            throw new Error('Subscriptions component is disabled');
                        if (endpoint !== 'status' && payload.provider !== undefined && payload.provider !== 'codex')
                            throw new Error('Only Codex is available');
                        let value = { ok: true };
                        switch (endpoint) {
                            case 'status': {
                                const state = await auth.status();
                                // Never resolve npm client metadata for a provider with no saved login.
                                if (state.accounts.length && !collision && !config.codexClientVersion)
                                    await version.resolve();
                                value = { ok: true, component: 'subscriptions', version: '0.2.0', registrationError: collision === undefined ? undefined : await collisionText(),
                                    providers: { codex: { ...state, displayName: preferences.get('codex').displayName,
                                            accounts: state.accounts.map(account => ({ ...account, alias: ownAlias(account.key) })), clientVersion: config.codexClientVersion ? { version: config.codexClientVersion, source: 'config' }
                                                : version.current() ?? { version: CODEX_CLIENT_VERSION, source: 'fallback' } } } };
                                break;
                            }
                            case 'proxyGet':
                                value = await proxyGetConfig();
                                break;
                            case 'proxySet': {
                                if (typeof payload.enabled !== 'boolean' || typeof payload.url !== 'string')
                                    throw new Error('Invalid proxy settings');
                                if (payload.username !== undefined && typeof payload.username !== 'string')
                                    throw new Error('Invalid proxy username');
                                if (payload.password !== undefined && payload.password !== null && typeof payload.password !== 'string')
                                    throw new Error('Invalid proxy password');
                                if (payload.bypass !== undefined && (!Array.isArray(payload.bypass) || payload.bypass.some(item => typeof item !== 'string')))
                                    throw new Error('Invalid bypass list');
                                value = await proxySetConfig(payload);
                                break;
                            }
                            case 'proxyTest': {
                                const input = readProxyTestPayload(payload);
                                value = await proxyTestConnection(input.url, input.proxy, request.signal);
                                break;
                            }
                            case 'setProviderSettings': {
                                // Schema first: contextWindows is checked as positive safe integers before anything iterates it.
                                const draft = validatePreferences('codex', payload.settings);
                                // `original` (the snapshot the editor loaded) turns the save into an atomic field-level patch;
                                // without it the whole provider document is replaced (legacy full save).
                                const original = payload.original === undefined ? undefined : validatePreferences('codex', payload.original);
                                const touched = Object.entries(draft.contextWindows ?? {}).filter(([model, window]) => original?.contextWindows?.[model] !== window);
                                if (touched.length) {
                                    const catalogs = await readAccountCatalogs(false, request.signal);
                                    for (const [model, window] of touched) {
                                        const bound = await boundsFor(model, catalogs, request.signal) ?? await adapter.contextLimits(model, undefined, request.signal);
                                        if (window > bound.max)
                                            throw new Error('Context window is outside the advertised bounds');
                                    }
                                }
                                request.signal.throwIfAborted();
                                if (original === undefined)
                                    await preferences.set('codex', draft);
                                else
                                    await preferences.update('codex', original, draft);
                                pool.invalidate();
                                handle?.replace(['codex']);
                                break;
                            }
                            case 'providerSettings': {
                                const force = readForce(payload);
                                // One overall budget for the whole read (sequential bounded steps would add up to several budgets).
                                const budget = deadlineSignal(DISCOVERY_TIMEOUT_MS, request.signal);
                                releases.push(budget.release);
                                const deadline = budget.signal;
                                await loadModelDefaults();
                                if (force) {
                                    adapter.clearAccountCatalog();
                                    pool.invalidate();
                                    handle?.replace(['codex']);
                                }
                                const catalogs = await readAccountCatalogs(!force, deadline);
                                const bounded = (work) => withTimeout(work, DISCOVERY_TIMEOUT_MS, deadline).catch(() => undefined);
                                const [listed, fastIds, tiers] = await Promise.all([
                                    bounded(() => adapter.listModels('codex')),
                                    bounded(signal => adapter.fastCapableModels(signal)),
                                    bounded(() => pool.modelsForProvider('codex')),
                                ]);
                                const models = listed ?? [];
                                const fast = new Set(fastIds ?? []);
                                // Configured tier rows resolve through the pool, which never consults the per-model override or
                                // speed for the tier id: offering controls on them would save cleanly and change nothing.
                                const tierIds = new Set((tiers ?? []).map(tier => tier.id));
                                const rows = await Promise.all(models.map(async (model) => {
                                    const info = await bounded(signal => adapter.resolveModel('codex', model.id, signal));
                                    const bound = await boundsFor(model.id, catalogs, deadline);
                                    return { ...model, efforts: tierIds.has(model.id) ? [] : info?.reasoning?.efforts ?? [], configured: defaultEffortOf('codex', model.id), fastTier: !tierIds.has(model.id) && fast.has(model.id),
                                        ...(bound ? { defaultContextWindow: bound.default, maxContextWindow: bound.max } : {}) };
                                }));
                                value = { provider: 'codex', settings: preferences.get('codex'), accounts: catalogs, models: rows, tools: PROVIDER_TOOLS.codex };
                                break;
                            }
                            case 'modelDefaults': {
                                // Reference `modelDefaults.catalog`: re-read from the live model info (the picker's own source), so the
                                // offered efforts match the picker exactly and the configured default merges in through the adapter.
                                const budget = deadlineSignal(DISCOVERY_TIMEOUT_MS, request.signal);
                                releases.push(budget.release);
                                const deadline = budget.signal;
                                if (readForce(payload)) {
                                    version.invalidate();
                                    adapter.clearAccountCatalog();
                                    pool.invalidate();
                                    handle?.replace(['codex']);
                                }
                                await loadModelDefaults();
                                const catalog = [];
                                if ((await ctx.llm.listProviders()).some(entry => entry.id === 'codex')) {
                                    const listed = await withTimeout(() => ctx.llm.listModels('codex'), DISCOVERY_TIMEOUT_MS, deadline).catch(() => undefined);
                                    if (listed !== undefined) {
                                        // Configured tier rows resolve through the pool and never consult the per-model default: leave them out.
                                        const tierIds = new Set((await withTimeout(() => pool.modelsForProvider('codex'), DISCOVERY_TIMEOUT_MS, deadline).catch(() => undefined) ?? []).map(tier => tier.id));
                                        const candidates = listed.filter(model => !tierIds.has(model.id) && !parseAccountModelId(model.id));
                                        const infos = await Promise.all(candidates.map(model => withTimeout(signal => ctx.llm.resolveModelInfo('codex', model.id, signal), DISCOVERY_TIMEOUT_MS, deadline).catch(() => undefined)));
                                        const models = [];
                                        for (const [index, model] of candidates.entries()) {
                                            const info = infos[index];
                                            if (info === undefined)
                                                continue;
                                            const override = defaultEffortOf('codex', model.id);
                                            models.push({ id: model.id, name: model.name, efforts: info.reasoning?.efforts.map(effort => ({ id: effort.id, name: effort.name })) ?? [],
                                                ...override === undefined ? {} : { configured: override } });
                                        }
                                        catalog.push({ provider: 'codex', models });
                                    }
                                }
                                value = catalog;
                                break;
                            }
                            case 'setModelDefault': {
                                const model = string('model');
                                const effort = payload.effort === undefined ? undefined : string('effort');
                                const info = await withTimeout(signal => adapter.resolveModel('codex', model, signal), DISCOVERY_TIMEOUT_MS, request.signal).catch(() => undefined);
                                if (effort && info?.reasoning?.efforts.length && !info.reasoning.efforts.some(entry => entry.id === effort))
                                    throw new Error(`model ${model} does not advertise a "${effort}" reasoning effort`);
                                await setDefaultEffort('codex', model, effort);
                                handle?.replace(['codex']);
                                break;
                            }
                            case 'login':
                                if (collision)
                                    throw new Error('Codex is already registered. Disable the reference component first.');
                                value = await auth.login();
                                break;
                            case 'manual':
                                auth.manual(string('input'));
                                break;
                            case 'cancel':
                                auth.cancel();
                                break;
                            case 'logout':
                                await auth.logout(string('account'));
                                break;
                            case 'setDefault':
                                await auth.setDefault(string('account'));
                                break;
                            case 'usage': {
                                if (collision)
                                    throw new Error('Codex registration is unavailable');
                                const account = string('account');
                                const force = readForce(payload);
                                if (force)
                                    health.clear('codex', account);
                                value = await usage.snapshotFor('codex', account, force);
                                break;
                            }
                            case 'prepareReset':
                                value = await resets.prepare(string('account'), AbortSignal.any([request.signal, AbortSignal.timeout(20_000)]));
                                break;
                            case 'consumeReset':
                                await resets.redeem(string('account'), string('ticket'), AbortSignal.any([request.signal, AbortSignal.timeout(20_000)]));
                                break;
                        }
                        result = { ok: true, value };
                    }
                    catch (error) {
                        result = { ok: false, error: { code: 'subscriptions/error', message: error instanceof OAuthEndpointError ? browserSafeError(error, 'upstream') : safeDiagnostic(error, [payload.password, payload.proxy?.password], [payload.username, payload.proxy?.username]), details: {} } };
                    }
                    finally {
                        for (const release of releases)
                            release();
                    }
                    return Response.json({ type: 'server-response', rpcId: body.rpcId, result });
                },
            }), `dsh-majed: ${method} route`);
        }
    });
}
