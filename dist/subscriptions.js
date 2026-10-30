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
import { ProviderSettingsStore, PROVIDER_TOOLS } from './provider-settings.js';
import { defaultEffortOf, loadModelDefaults, setDefaultEffort, modelDefaultsSnapshot } from './model-defaults.js';
import { ImageAccountPool } from './providers/image-pool.js';
import { CodexWebSearchProvider } from './providers/codex-search.js';
import { createImageGenerateTool } from './tools/image-generate.js';
import { registerWithAlias } from './tools/registration.js';
import { AccountPreferencesAdapter, accountAllowsPool, parseAccountModelId } from './providers/account-preferences.js';
export const name = 'dsh-majed/subscriptions';
export const inject = ['llm'];
export function apply(ctx, config = {}) {
    const preferences = new ProviderSettingsStore();
    void loadModelDefaults().catch(() => ctx.logger.warn('dsh-majed: model defaults unavailable'));
    const flows = new OAuthFlowManager();
    const version = new CodexClientVersionCache();
    const health = new PoolHealthRegistry();
    const imagePool = new ImageAccountPool({ enabled: config.pool?.enabled !== false && (config.pool?.autoAccounts ?? config.pool?.autoFamilies ?? true),
        onWarn: message => ctx.logger.warn(`dsh-majed: ${message}`) });
    let handle;
    let collision;
    let disposed = false;
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
            return { ...snapshot, resetCreditsError: error instanceof Error ? error.message : String(error) };
        }
    };
    const usage = new PoolUsageTracker((provider, account) => provider === 'codex'
        ? () => readUsage(account, AbortSignal.timeout(20_000)) : undefined);
    const auth = new CodexAuthController(flows, changed);
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
            const families = (config.pool?.autoAccounts ?? config.pool?.autoFamilies ?? true) ? buildAccountPools({ codex: { catalogs: (await Promise.all((await tokens.list()).map(async ({ key }) => {
                        const models = await adapter.listOwnModels('codex', key, AbortSignal.timeout(20_000), true);
                        const policy = preferences.get('codex').accounts?.[key];
                        return models ? { account: key, models: models.filter(model => accountAllowsPool(policy, model.id)) } : undefined;
                    }))).filter(entry => entry !== undefined) } }) : new Map();
            for (const [id, members] of Object.entries(config.pool?.families ?? {})) {
                const owner = members[0]?.provider;
                if (owner)
                    families.set(poolKey(owner, id), { members: members.filter(member => member.provider === owner) });
            }
            return families;
        }, tiers: config.pool?.enabled === false ? {} : config.pool?.tiers ?? {},
        onWarn: message => ctx.logger.warn(`dsh-majed: ${message}`) });
    try {
        handle = ctx.llm.registerAdapter(['codex'], presented);
    }
    catch (error) {
        collision = error instanceof Error ? error.message : String(error);
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
                                value = { ok: true, component: 'subscriptions', version: '0.2.0', registrationError: collision,
                                    providers: { codex: { ...state, displayName: preferences.get('codex').displayName,
                                            accounts: state.accounts.map(account => ({ ...account, alias: preferences.get('codex').accounts?.[account.key]?.alias })), clientVersion: config.codexClientVersion ? { version: config.codexClientVersion, source: 'config' }
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
                            case 'proxyTest':
                                value = await proxyTestConnection(payload.url, payload.proxy);
                                break;
                            case 'setProviderSettings': {
                                const windows = payload.settings?.contextWindows;
                                for (const [model, value] of Object.entries(windows ?? {})) {
                                    const limits = await adapter.contextLimits(model);
                                    if (!Number.isSafeInteger(value) || value < 1 || value > limits.max)
                                        throw new Error('Context window is outside the advertised bounds');
                                }
                                await preferences.set('codex', payload.settings);
                                pool.invalidate();
                                handle?.replace(['codex']);
                                break;
                            }
                            case 'providerSettings': {
                                await loadModelDefaults();
                                if (payload.force === true) {
                                    adapter.clearAccountCatalog();
                                    pool.invalidate();
                                    handle?.replace(['codex']);
                                }
                                const accounts = await tokens.list();
                                const catalogs = await Promise.all(accounts.map(async ({ key, session }) => {
                                    const models = await adapter.listOwnModels('codex', key, AbortSignal.timeout(20_000), payload.force !== true).catch(() => undefined);
                                    return { key, label: session.emailAddress ?? key, models: models ?? [], ...(models === undefined ? { unavailable: true } : {}) };
                                }));
                                const models = await adapter.listModels('codex');
                                const fast = new Set(await adapter.fastCapableModels());
                                const rows = await Promise.all(models.map(async (model) => {
                                    const info = await adapter.resolveModel('codex', model.id).catch(() => undefined);
                                    const limits = (await Promise.all(catalogs.filter(account => account.models.some(entry => entry.id === model.id))
                                        .map(account => adapter.contextLimits(model.id, account.key).catch(() => undefined)))).filter(entry => entry !== undefined);
                                    return { ...model, efforts: info?.reasoning?.efforts ?? [], configured: defaultEffortOf('codex', model.id), fastTier: fast.has(model.id),
                                        ...(limits.length ? { defaultContextWindow: Math.min(...limits.map(entry => entry.default)), maxContextWindow: Math.min(...limits.map(entry => entry.max)) } : {}) };
                                }));
                                value = { provider: 'codex', settings: preferences.get('codex'), accounts: catalogs, models: rows, tools: PROVIDER_TOOLS.codex };
                                break;
                            }
                            case 'modelDefaults': {
                                await loadModelDefaults();
                                const defaults = modelDefaultsSnapshot();
                                value = defaults.codex ? { codex: defaults.codex } : {};
                                break;
                            }
                            case 'setModelDefault': {
                                const model = string('model');
                                const effort = payload.effort === undefined ? undefined : string('effort');
                                const info = await adapter.resolveModel('codex', model).catch(() => undefined);
                                if (effort && info?.reasoning?.efforts.length && !info.reasoning.efforts.some(entry => entry.id === effort))
                                    throw new Error('Model does not advertise that reasoning effort');
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
                                if (payload.force === true)
                                    health.clear('codex', account);
                                value = await usage.snapshotFor('codex', account, payload.force === true);
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
                        result = { ok: false, error: { code: 'subscriptions/error', message: safeDiagnostic(error, [payload.password, payload.proxy?.password]), details: {} } };
                    }
                    return Response.json({ type: 'server-response', rpcId: body.rpcId, result });
                },
            }), `dsh-majed: ${method} route`);
        }
    });
}
