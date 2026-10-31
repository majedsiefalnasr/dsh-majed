import { DeviceFlowManager } from './auth/device-flow.js';
import { CopilotAuthController } from './auth/copilot-controller.js';
import { CopilotAdapter, COPILOT_PREEMPT_MS, refreshCopilot, isCopilotPermanentRefreshError } from './providers/copilot.js';
import type { CopilotSession } from './auth/store.js';
/** Owned Codex component composition. Reference v0.9.12: see PROVENANCE.md. */
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
// Type-only: activates the `ctx.tools` / `ctx.web` Context merges for the optional inject blocks below.
import type {} from '@deepseek-ai/dsh-tools';
import type {} from '@deepseek-ai/dsh-web';
import type { AttachmentStore } from '@deepseek-ai/dsh-attachment';
import { OAuthFlowManager } from './auth/oauth-flow.js';
import { CodexAuthController } from './auth/controller.js';
import { AccountTokenManager } from './providers/accounts.js';
import type { CodexSession } from './auth/store.js';
import { CodexAdapter, CODEX_PREEMPT_MS, CODEX_CLIENT_VERSION, refreshCodex, isCodexPermanentRefreshError,
  fetchCodexUsage, fetchCodexResetCredits, consumeCodexResetCredit } from './providers/codex.js';
import { CodexClientVersionCache } from './providers/codex-client-version.js';
import { catalogStore, accountCatalogStore } from './providers/catalog-store.js';
import { startCatalogRefresh } from './providers/catalog-refresh.js';
import { PoolAdapter } from './providers/pool.js';
import { PoolHealthRegistry } from './providers/pool-health.js';
import { PoolUsageTracker } from './providers/pool-usage.js';
import { buildAccountPools, poolKey, type PoolDefinition, type PoolMemberRef } from './providers/pool-family.js';
import { ResetRedemption } from './providers/reset-redemption.js';
import { proxiedFetch, proxyGetConfig, proxySetConfig, proxyTestConnection, safeDiagnostic, disposeProxyTransport, type ProxyDraft } from './http.js';
import { DISCOVERY_TIMEOUT_MS, OAuthEndpointError, deadlineSignal, withTimeout, type ModelEntry } from './providers/common.js';
import { ProviderSettingsStore, PROVIDER_TOOLS, validatePreferences } from './provider-settings.js';
import { defaultEffortOf, loadModelDefaults, setDefaultEffort } from './model-defaults.js';
import { ImageAccountPool } from './providers/image-pool.js';
import { CodexWebSearchProvider } from './providers/codex-search.js';
import { createImageGenerateTool } from './tools/image-generate.js';
import { registerWithAlias } from './tools/registration.js';
import { AccountPreferencesAdapter, accountAllowsPool, accountModelId, parseAccountModelId } from './providers/account-preferences.js';
import type { ClaudeSession, ProviderId } from './auth/store.js';
import { ClaudeAuthController, type ClaudeLoginMethod } from './auth/claude-controller.js';
import { readClaudeCodeCredentials, recordClaudeEmail, refreshClaudeSynced, SYSTEM_CLAUDE_CREDS_IO, type ClaudeCredsIo, type ClaudeProfileLookup } from './auth/claude-code-creds.js';
import { ClaudeAdapter, CLAUDE_CLI_FALLBACK_VERSION, CLAUDE_PREEMPT_MS, fetchClaudeProfile, fetchClaudeUsage, isClaudePermanentRefreshError, refreshClaude } from './providers/claude.js';
import { ClaudeCliVersionCache } from './providers/claude-cli-version.js';
import { DEFAULT_PROMPT_CACHE_TTL, type PromptCacheTtl } from './translate/anthropic.js';
import { presentedVersion } from './providers/npm-cli-version.js';

export const name = 'dsh-majed/subscriptions';
export const inject = ['llm'];
/** Bound on one account's catalog read while assembling pools: a hung account sits out instead of failing the pool. */
export const POOL_USAGE_TIMEOUT_MS = DISCOVERY_TIMEOUT_MS;
/**
 * Reference index.ts `claude background sync timer`: keychain-bound Claude accounts re-read Claude Code's own store
 * every five minutes, so a token rotated by the `claude` CLI is picked up before the next turn needs it.
 */
export const CLAUDE_KEYCHAIN_SYNC_MS = 5 * 60_000;
export interface Config { codexClientVersion?: string; claudePromptCacheTtl?: PromptCacheTtl; models?: { codex?: ModelEntry[]; claude?: ModelEntry[]; copilot?: ModelEntry[] };
  pool?: { enabled?: boolean; strategy?: 'priority' | 'quota_aware'; switchMargin?: number; autoAccounts?: boolean; autoFamilies?: boolean; families?: Record<string, PoolMemberRef[]>; tiers?: Record<string, PoolMemberRef[]> };
}
// Same-named schemastery schema, as in the reference (index.ts `Config`). Only the Codex slice is owned here;
// `@deepseek-ai/schemastery` is the host's public schema package (peer in the reference), no host patch involved.
const modelEntrySchema: z<ModelEntry> = z.object({
  id: z.string().required(),
  name: z.string(),
  contextWindow: z.number().step(1).min(1),
  maxTokens: z.number().step(1).min(1),
  inputModalities: z.array(z.union(['text', 'image'])),
  wire: z.union(['chat-completions', 'responses']),
});
const poolMemberSchema: z<PoolMemberRef> = z.object({
  provider: z.union(['codex', 'claude', 'grok', 'copilot', 'antigravity']).required(),
  account: z.string(),
  model: z.string().required(),
});
export const Config: z<Config> = z.object({
  codexClientVersion: z.string(),
  // Reference `claudePromptCacheTtl`: the plugin-wide default cache lifetime; the Settings choice overrides it per save.
  claudePromptCacheTtl: z.union(['5m', '1h']).default(DEFAULT_PROMPT_CACHE_TTL),
  models: z.object({ codex: z.array(modelEntrySchema), claude: z.array(modelEntrySchema), copilot: z.array(modelEntrySchema) }),
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

type SpeedTier = 'standard' | 'fast';

/** Reference `readSpeedTier`. */
function readSpeedTier(payload: Record<string, unknown>): SpeedTier {
  if (payload.tier !== 'standard' && payload.tier !== 'fast') throw new Error('payload.tier must be "standard" or "fast"');
  return payload.tier;
}

/** Reference `readForce`: the optional `force` flag must be a boolean when present. */
function readForce(payload: Record<string, unknown>): boolean {
  const force = payload.force;
  if (force === undefined) return false;
  if (typeof force !== 'boolean') throw new Error('payload.force must be a boolean when present');
  return force;
}

/** Reference `readProxyTestPayload`, plus the draft fields the owned dialog sends (`enabled`, `bypass`, `password: null`). */
function readProxyTestPayload(payload: Record<string, unknown>): { url?: string; proxy?: ProxyDraft } {
  const { url, proxy } = payload;
  if (url === undefined && proxy === undefined) return {};
  if (url !== undefined && (typeof url !== 'string' || url.length === 0)) throw new Error('payload.url must be a non-empty string when present');
  let draft: ProxyDraft | undefined;
  if (proxy !== undefined) {
    if (typeof proxy !== 'object' || proxy === null || Array.isArray(proxy)) throw new Error('payload.proxy must be an object when present');
    const record = proxy as Record<string, unknown>;
    if (typeof record.url !== 'string' || record.url.length === 0) throw new Error('payload.proxy.url must be a non-empty string');
    if (record.username !== undefined && typeof record.username !== 'string') throw new Error('payload.proxy.username must be a string when present');
    if (record.password !== undefined && record.password !== null && typeof record.password !== 'string') throw new Error('payload.proxy.password must be a string or null when present');
    if (record.enabled !== undefined && typeof record.enabled !== 'boolean') throw new Error('payload.proxy.enabled must be a boolean when present');
    if (record.bypass !== undefined && (!Array.isArray(record.bypass) || record.bypass.some(item => typeof item !== 'string'))) throw new Error('payload.proxy.bypass must be an array of strings when present');
    draft = { url: record.url, ...record.username === undefined ? {} : { username: record.username as string },
      ...record.password === undefined ? {} : { password: record.password as string | null },
      ...record.enabled === undefined ? {} : { enabled: record.enabled as boolean },
      ...record.bypass === undefined ? {} : { bypass: record.bypass as string[] } };
  }
  return { ...url === undefined ? {} : { url: url as string }, ...draft === undefined ? {} : { proxy: draft } };
}
/**
 * Text for an error that is shown in the browser. An upstream HTTP error body is untrusted free text whose
 * secrets cannot be recognised, so only its status survives; every other failure goes through the bounded
 * structural sanitizer (known proxy credentials plus recognisable secret shapes; see docs/ai/ticket-130-verification.md for limits).
 */
function browserSafeError(error: unknown, label: string): string {
  if (error instanceof OAuthEndpointError) {
    // The provider's error code is kept only when it looks like a code (never free text).
    const code = error.oauthCode !== undefined && /^[A-Za-z0-9_.:-]{1,64}$/.test(error.oauthCode) ? `: ${error.oauthCode}` : '';
    return `${label} endpoint error (HTTP ${String(error.status)})${code}`;
  }
  return safeDiagnostic(error);
}
/** The provider a route serves: Codex unless the payload names Claude. Any other value is rejected. */
function readRouteProvider(value: unknown): 'codex' | 'claude' | 'copilot' {
  if (value === undefined || value === 'codex') return 'codex';
  if (value === 'claude') return 'claude';
  if (value === 'copilot') return 'copilot';
  throw new Error('payload.provider must be one of codex, claude, copilot');
}

/** Reference `readLoginMethod`: `method` selects the Claude login route and is valid for Claude only. */
function readLoginMethod(payload: Record<string, unknown>, provider: 'codex' | 'claude' | 'copilot'): ClaudeLoginMethod | undefined {
  const method = payload.method;
  if (method === undefined) return undefined;
  if (provider !== 'claude') throw new Error('payload.method is only valid for claude');
  if (method !== 'oauth' && method !== 'keychain') throw new Error('payload.method must be "oauth" or "keychain"');
  return method;
}

/** Endpoints that serve Claude; every other endpoint (speed, reset, proxy, image, video) stays Codex-only. */
const CLAUDE_ENDPOINTS = new Set(['status', 'login', 'manual', 'cancel', 'logout', 'setDefault', 'usage', 'providerSettings', 'setProviderSettings', 'modelDefaults', 'setModelDefault']);

/**
 * Host-only injection points. The DSH host calls `apply(ctx, config)` and never passes this, and the browser cannot reach
 * it, so production always uses the real Claude Code credential store; tests pass a fake so they never touch the
 * Keychain or `~/.claude`.
 */
export interface ApplyOptions { claudeCredsIo?: ClaudeCredsIo; claudeProfile?: ClaudeProfileLookup }

export function apply(ctx: Context, config: Config = {}, options: ApplyOptions = {}): void {
  const claudeCredsIo = options.claudeCredsIo ?? SYSTEM_CLAUDE_CREDS_IO;
  const claudeIdentity = { profile: options.claudeProfile ?? fetchClaudeProfile };
  const preferences = new ProviderSettingsStore();
  void loadModelDefaults().catch(() => ctx.logger.warn('dsh-majed: model defaults unavailable'));
  const flows = new OAuthFlowManager();
  const version = new CodexClientVersionCache();
  const health = new PoolHealthRegistry();
  const imagePool = new ImageAccountPool({ enabled: config.pool?.enabled !== false && (config.pool?.autoAccounts ?? config.pool?.autoFamilies ?? true),
    onWarn: message => ctx.logger.warn(`dsh-majed: ${message}`) });
  let handle: ReturnType<Context['llm']['registerAdapter']> | undefined;
  // The raw registration error stays server-side; the browser gets `collisionText()`, built after the stored proxy
  // credential has loaded so safeDiagnostic can redact it. `collision` is only the presence flag.
  let collision: string | undefined;
  let collisionError: unknown;
  let claudeCollision: string | undefined;
  let claudeCollisionError: unknown;
  let disposed = false;
  const ownAlias = (provider: ProviderId, key: string) => { const settings = preferences.get(provider).accounts; return settings && Object.hasOwn(settings, key) ? settings[key]?.alias : undefined; };
  /** The registration handle serving one provider; Codex and Claude register separately (ADR-0002). */
  const handleFor = (provider: ProviderId) => provider === 'copilot' ? copilotHandle : provider === 'claude' ? claudeHandle : handle;
  // Composer Speed (ticket #131; reference src/index.ts speedBySession/selectedSpeed). Explicit choices are
  // per session and reset on restart. A subagent without an explicit choice uses its saved model default, and
  // every request still gates Fast on the model's discovered capability.
  const speedBySession = new Map<string, SpeedTier>();
  const selectedSpeed = (sessionId: string, model?: string): SpeedTier => {
    const explicit = speedBySession.get(sessionId);
    if (explicit !== undefined) return explicit;
    const registry = ctx.get('agents') as unknown as { get(id: string): { session: { header: { origin?: string } } } | undefined } | undefined;
    if (model !== undefined && registry?.get(sessionId)?.session.header.origin === 'subagent') return preferences.subagentSpeed(parseAccountModelId(model)?.model ?? model);
    return 'standard';
  };
  const collisionText = async () => {
    await proxyGetConfig().catch(() => undefined); // loads the stored proxy credential so it can be redacted
    return browserSafeError(collisionError, 'codex registration');
  };
  let pool: PoolAdapter;
  let adapter: CodexAdapter;
  let claudeHandle: ReturnType<Context['llm']['registerAdapter']> | undefined;
  const changed = (account?: string) => {
    if (disposed) return;
    adapter?.clearAccountCatalog(account); health.clear('codex', account); imagePool.clear('codex', account); usage.invalidate('codex', account);
    pool?.invalidate(); handle?.replace(['codex']);
  };
  const tokens = new AccountTokenManager<CodexSession>({ provider: 'codex', displayName: 'ChatGPT (Codex)',
    makeOptions: () => ({ preemptMs: CODEX_PREEMPT_MS, refresh: refreshCodex, isPermanent: isCodexPermanentRefreshError }),
    onAccountRemoved: changed });
  const readUsage = async (account: string, signal: AbortSignal) => {
    const session = await tokens.session(account);
    const snapshot = await fetchCodexUsage(session, proxiedFetch, signal);
    try { return { ...snapshot, resetCredits: await fetchCodexResetCredits(session, proxiedFetch, signal) }; }
    catch (error) { return { ...snapshot, resetCreditsError: browserSafeError(error, 'codex reset credits') }; }
  };
  // Claude (reference v0.9.12 `case 'claude'`): its own token manager, catalog, client version, and cache lifetime.
  const claudeLifecycle = new AbortController();
  const claudeVersion = new ClaudeCliVersionCache();
  const presentClaudeVersion = presentedVersion(claudeVersion);
  const claudeChanged = (account?: string) => { if (!disposed) { claudeAdapter.clearAccountCatalog(account); health.clear('claude', account); usage.invalidate('claude', account); pool?.invalidate(); claudeHandle?.replace(['claude']); } };
  const claudeTokens = new AccountTokenManager<ClaudeSession>({ provider: 'claude', displayName: 'Claude (Subscription)',
    makeOptions: () => ({ preemptMs: CLAUDE_PREEMPT_MS,
      // Only keychain-imported accounts sync with Claude Code's own store; OAuth accounts refresh standalone so
      // several accounts never fight over the Keychain entry (reference index.ts).
      // The lifecycle signal stops a refresh that outlives disposal: no token request, no store read or write-back,
      // and the final check below keeps a late result from reaching the TokenManager save.
      refresh: async session => {
        const lifecycle = claudeLifecycle.signal;
        lifecycle.throwIfAborted();
        const next = session.keychainBound === true
          ? await refreshClaudeSynced(session, bound => refreshClaude(bound, lifecycle), claudeCredsIo, lifecycle, claudeIdentity)
          : await refreshClaude(session, lifecycle);
        lifecycle.throwIfAborted();
        return next;
      },
      isPermanent: isClaudePermanentRefreshError }),
    onAccountRemoved: claudeChanged });
  const usage = new PoolUsageTracker((provider, account) => provider === 'codex'
    ? () => readUsage(account, AbortSignal.timeout(20_000))
    : provider === 'claude' ? async () => fetchClaudeUsage(await claudeTokens.session(account), proxiedFetch, AbortSignal.timeout(20_000), () => claudeVersion.resolve()) : undefined);
  const auth = new CodexAuthController(flows, changed, error => browserSafeError(error, 'codex login'));
  const claudeAuth = new ClaudeAuthController(flows, claudeChanged, error => browserSafeError(error, 'claude login'), () => readClaudeCodeCredentials(claudeCredsIo), session => recordClaudeEmail(session, claudeIdentity, claudeLifecycle.signal));
  const resets = new ResetRedemption(readUsage,
    async (account, credit, request, signal) => consumeCodexResetCredit(await tokens.session(account), credit, request, proxiedFetch, signal),
    account => usage.invalidate('codex', account));
  adapter = new CodexAdapter({ tokens, models: config.models?.codex ?? [
    { id: 'gpt-5.1-codex', name: 'GPT-5.1 Codex' },
    { id: 'gpt-5.1-codex-mini', name: 'GPT-5.1 Codex Mini' },
    { id: 'gpt-5.1', name: 'GPT-5.1' },
  ], streamIdleTimeoutMs: 300_000,
    discovery: !config.models?.codex?.length,
    defaultEffortOf: model => defaultEffortOf('codex', model),
    contextWindowOf: model => preferences.contextWindow(model),
    speedFor: async (sessionId, model) => sessionId !== undefined && selectedSpeed(sessionId, model) === 'fast' && await adapter.supportsFastTier(model),
    clientVersion: config.codexClientVersion,
    resolveClientVersion: () => version.resolve(),
    catalogStore: catalogStore('codex'), accountCatalogStore: account => accountCatalogStore('codex', account),
    onCatalogChanged: () => { if (!disposed) { pool?.invalidate(); handle?.replace(['codex']); } },
    resolveAttachments: () => ctx.get('attachments') as never,
    pool: () => pool,
    onWarn: message => ctx.logger.warn(`dsh-majed: ${message}`),
  });
  // Claude adapter (reference v0.9.12 `case 'claude'`). Registered under the shared provider id `claude` (ADR-0002);
  // a reference Claude registration already present makes this one fail, and the component reports it.
  const claudeModels = config.models?.claude?.length ? config.models.claude : [
    { id: 'claude-opus-5-5', name: 'Claude Opus 5.5', maxTokens: 128_000, contextWindow: 1_000_000 },
    { id: 'claude-opus-5', name: 'Claude Opus 5', maxTokens: 128_000, contextWindow: 1_000_000 },
    { id: 'claude-sonnet-5', name: 'Claude Sonnet 5', maxTokens: 128_000, contextWindow: 1_000_000 },
    { id: 'claude-fable-5', name: 'Claude Fable 5', maxTokens: 128_000, contextWindow: 1_000_000 },
    { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', maxTokens: 64_000 },
  ];
  const claudeAdapter = new ClaudeAdapter({ tokens: claudeTokens, models: claudeModels, streamIdleTimeoutMs: 300_000,
    discovery: !config.models?.claude?.length,
    defaultEffortOf: model => defaultEffortOf('claude', model),
    resolveCliVersion: () => claudeVersion.resolve(),
    catalogStore: catalogStore('claude'), accountCatalogStore: account => accountCatalogStore('claude', account),
    onCatalogChanged: () => { if (!disposed) { pool?.invalidate(); claudeHandle?.replace(['claude']); } },
    resolveAttachments: () => ctx.get('attachments') as never,
    pool: () => pool,
    promptCacheTtl: config.claudePromptCacheTtl ?? DEFAULT_PROMPT_CACHE_TTL,
    promptCacheTtlOverride: () => preferences.promptCacheTtl(),
    onWarn: message => ctx.logger.warn(`dsh-majed: ${message}`),
  });
  let copilotHandle: ReturnType<Context['llm']['registerAdapter']> | undefined;
  let copilotCollision = false;
  const copilotChanged = (account?: string) => { if (!disposed) { copilotAdapter.clearAccountCatalog(account); copilotAdapter.clearReplayState(); health.clear('copilot', account); usage.invalidate('copilot', account); pool?.invalidate(); copilotHandle?.replace(['copilot']); } };
  const copilotTokens = new AccountTokenManager<CopilotSession>({ provider: 'copilot', displayName: 'GitHub Copilot',
    makeOptions: () => ({ preemptMs: COPILOT_PREEMPT_MS, refresh: refreshCopilot, isPermanent: isCopilotPermanentRefreshError }), onAccountRemoved: copilotChanged });
  const copilotAuth = new CopilotAuthController(new DeviceFlowManager(), copilotChanged, error => browserSafeError(error, 'copilot login'));
  const copilotAdapter = new CopilotAdapter({ tokens: copilotTokens, models: config.models?.copilot ?? [
      { id: 'gpt-4.1', name: 'GPT-4.1', inputModalities: ['text', 'image'] },
      { id: 'gpt-4o', name: 'GPT-4o', inputModalities: ['text', 'image'] },
      { id: 'claude-sonnet-4.5', name: 'Claude Sonnet 4.5', inputModalities: ['text', 'image'] },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', inputModalities: ['text', 'image'] },
    ],
    discovery: !config.models?.copilot?.length, streamIdleTimeoutMs: 300_000, pool: () => pool,
    catalogStore: catalogStore('copilot'), accountCatalogStore: account => accountCatalogStore('copilot', account),
    defaultEffortOf: model => defaultEffortOf('copilot', model), resolveAttachments: () => ctx.get('attachments') as never,
    onCatalogChanged: () => { if (!disposed) { pool?.invalidate(); copilotHandle?.replace(['copilot']); } },
    onWarn: message => ctx.logger.warn(`dsh-majed: ${message}`) });
  const presentedCopilot = new AccountPreferencesAdapter({ provider: 'copilot', adapter: copilotAdapter, settings: preferences,
    accounts: async () => (await copilotTokens.list()).map(({ key, session }) => ({ key, label: session.account ?? key })), pool: () => pool });
  const presented = new AccountPreferencesAdapter({ provider: 'codex', adapter, settings: preferences,
    accounts: async () => (await tokens.list()).map(({ key, session }) => ({ key, label: session.emailAddress ?? key })), pool: () => pool });
  const presentedClaude = new AccountPreferencesAdapter({ provider: 'claude', adapter: claudeAdapter, settings: preferences,
    accounts: async () => (await claudeTokens.list()).map(({ key, session }) => ({ key, label: session.emailAddress ?? key })), pool: () => pool });
  pool = new PoolAdapter({ adapters: { copilot: presentedCopilot.poolMember(), codex: presented.poolMember(), claude: presentedClaude.poolMember() }, health, usage, strategy: config.pool?.strategy ?? 'quota_aware', switchMargin: config.pool?.switchMargin ?? 2,
    defaultAccount: provider => provider === 'copilot' ? copilotTokens.defaultAccount() : provider === 'claude' ? claudeTokens.defaultAccount() : tokens.defaultAccount(),
    resolveAccount: (provider, account) => provider === 'copilot' ? copilotTokens.resolveAccount(account) : provider === 'claude' ? claudeTokens.resolveAccount(account) : tokens.resolveAccount(account),
    families: async () => {
      if (config.pool?.enabled === false) return new Map();
      const families = new Map<string, PoolDefinition>();
      if (config.pool?.autoAccounts ?? config.pool?.autoFamilies ?? true) {
        // Discover each account separately and bound each read: a hang or failure sits that account out
        // instead of failing the whole assembly (reference index.ts `families`). Codex and Claude alike.
        const sources: Parameters<typeof buildAccountPools>[0] = {};
        await Promise.all(([['codex', tokens, adapter], ['claude', claudeTokens, claudeAdapter], ['copilot', copilotTokens, copilotAdapter]] as const).map(async ([provider, accountTokens, raw]) => {
          try {
            const accounts = (await accountTokens.list()).map(entry => entry.key);
            const catalogs = (await Promise.all(accounts.map(async account => {
              const models = await withTimeout(signal => raw.listOwnModels(provider, account, signal, true), POOL_USAGE_TIMEOUT_MS)
                .catch(() => undefined);
              const settings = preferences.get(provider).accounts;
              const policy = settings && Object.hasOwn(settings, account) ? settings[account] : undefined;
              return models === undefined ? undefined : { account, models: models.filter(model => accountAllowsPool(policy, model.id)) };
            }))).filter(entry => entry !== undefined);
            if (catalogs.length > 0) sources[provider] = { catalogs };
          } catch { /* Discovery failures are already reported by the owning adapter. */ }
        }));
        for (const [key, definition] of buildAccountPools(sources)) families.set(key, definition);
      }
      for (const [id, members] of Object.entries(config.pool?.families ?? {})) {
        const owner = members[0]?.provider;
        if (!owner) continue;
        const kept = members.filter(member => member.provider === owner);
        if (kept.length < members.length) ctx.logger.warn(`dsh-majed: pool "${id}": cross-provider members are ignored; only ${owner} accounts are pooled`);
        families.set(poolKey(owner, id), { members: kept });
      }
      return families;
    }, tiers: config.pool?.enabled === false ? {} : config.pool?.tiers ?? {},
    onWarn: message => ctx.logger.warn(`dsh-majed: ${message}`) });
  try { handle = ctx.llm.registerAdapter(['codex'], presented); }
  catch (error) { collisionError = error; collision = 'Codex registration is unavailable'; }

  try { claudeHandle = ctx.llm.registerAdapter(['claude'], presentedClaude); }
  catch (error) { claudeCollisionError = error; claudeCollision = 'Claude registration is unavailable'; }
  try { copilotHandle = ctx.llm.registerAdapter(['copilot'], presentedCopilot); } catch { copilotCollision = true; }
  ctx.effect(() => () => { disposed = true; copilotAuth.dispose(); copilotAdapter.clearReplayState(); claudeLifecycle.abort(); auth.dispose(); claudeAuth.dispose(); void disposeProxyTransport(); }, 'dsh-majed: subscriptions auth disposal');
  // Keep keychain-bound Claude accounts synced with Claude Code's own store (reference `claude background sync timer`).
  // One interval, bounded: each tick reads the account list and refreshes only bound sessions, errors are swallowed
  // (TokenManager already reports permanent failures), and dispose clears the timer.
  ctx.effect(() => {
    const syncTimer = setInterval(() => {
      if (disposed || !claudeHandle) return;
      void claudeTokens.list().then(accounts => {
        for (const { key, session } of accounts) {
          // The list read can outlive disposal: do nothing once the component is gone.
          if (disposed || claudeLifecycle.signal.aborted) return;
          if (session.keychainBound !== true) continue;
          claudeTokens.session(key).catch(() => { /* Best-effort: TokenManager surfaces failures via onRemoved. */ });
        }
      }, () => undefined);
    }, CLAUDE_KEYCHAIN_SYNC_MS);
    // Never keep the host process alive for a background sync.
    syncTimer.unref();
    return () => { clearInterval(syncTimer); };
  }, 'dsh-majed: claude background sync timer');
  if (handle) ctx.effect(() => startCatalogRefresh(async signal => {
    if ((await tokens.list()).length && !signal.aborted) await adapter.listOwnModels('codex', undefined, signal);
  }, () => ctx.logger.warn('dsh-majed: Codex catalog refresh failed')), 'dsh-majed: subscriptions catalog refresh');
  if (copilotHandle) ctx.effect(() => startCatalogRefresh(async signal => {
    if ((await copilotTokens.list()).length && !signal.aborted) await copilotAdapter.listOwnModels('copilot', undefined, signal);
  }, () => ctx.logger.warn('dsh-majed: Copilot catalog refresh failed')), 'dsh-majed: copilot catalog refresh');
  if (claudeHandle) ctx.effect(() => startCatalogRefresh(async signal => {
    if ((await claudeTokens.list()).length && !signal.aborted) await claudeAdapter.listOwnModels('claude', undefined, signal);
  }, () => ctx.logger.warn('dsh-majed: Claude catalog refresh failed')), 'dsh-majed: claude catalog refresh');

  // `web` is optional on headless/minimal compositions. The Codex switch gates this provider's
  // `available()` rather than the host's web_search tool, so other providers keep working.
  ctx.inject(['web'], webCtx => {
    webCtx.web.registerSearchProvider(new CodexWebSearchProvider({ tokens,
      enabled: () => preferences.toolEnabled('codex', 'web_search'), fetchFn: proxiedFetch }));
  });

  // `tools` is optional too. Definitions stay registered globally so already-open sessions keep their
  // schema and execution path; each new agent is restricted from the switches in force at its creation.
  ctx.inject(['tools'], toolsCtx => {
    const registeredNames = new Map<string, string>();
    const result = registerWithAlias(toolsCtx.tools, createImageGenerateTool({ imagePool, codexTokens: tokens,
      resolveAttachments: () => ctx.get('attachments') as AttachmentStore | undefined,
      resolveLlm: () => ctx.get('llm'),
      providerEnabled: (provider, createdAt) => preferences.toolEnabled(provider, 'image_generate', createdAt) }),
      message => ctx.logger.warn(message));
    if (result !== undefined) registeredNames.set('image_generate', result.name);
    toolsCtx.on('agent/created', ({ agent }) => {
      const at = agent.session.header.createdAt;
      const deny: string[] = [];
      const registered = registeredNames.get('image_generate');
      if (registered !== undefined && !preferences.toolEnabled('codex', 'image_generate', at)) deny.push(registered);
      if (deny.length) agent.ctx.tools.restrict({ deny });
      return undefined;
    });
  });

  /**
   * Each account's own catalog, one bounded read per account: a hung or failing account is marked
   * `unavailable` after DISCOVERY_TIMEOUT_MS (or when the caller's signal aborts) instead of hanging the RPC.
   */
  const readAccountCatalogs = async (preferCached: boolean, signal: AbortSignal) => readAccountCatalogsFor(adapter, tokens, preferCached, signal, 'codex');
  /** Per-account catalog read for one provider (Codex or Claude); the same bounded per-account contract. */
  async function readAccountCatalogsFor(route: { listOwnModels(provider: string, account?: string, signal?: AbortSignal, preferCached?: boolean): Promise<readonly { id: string; name: string }[]> },
    manager: { list(): Promise<{ key: string; session: { emailAddress?: string; account?: string } }[]> }, preferCached: boolean, signal: AbortSignal, provider: ProviderId = 'claude') {
    const accounts = await manager.list();
    return Promise.all(accounts.map(async ({ key, session }) => {
      const models = await withTimeout(accountSignal => route.listOwnModels(provider, key, accountSignal, preferCached), DISCOVERY_TIMEOUT_MS, signal).catch(() => undefined);
      return { key, label: session.emailAddress ?? session.account ?? key, models: models ?? [], ...(models === undefined ? { unavailable: true } : {}) };
    }));
  }
  /**
   * The context bounds shown AND enforced for one model: the minimum default and the minimum maximum over every
   * account that lists it, so the UI limit is a value each account can honour. Undefined when no account lists it.
   */
  const boundsFor = async (model: string, catalogs: { key: string; models: readonly { id: string }[] }[], signal: AbortSignal) => {
    const limits = (await Promise.all(catalogs.filter(account => account.models.some(entry => entry.id === model))
      .map(account => adapter.contextLimits(model, account.key, signal).catch(() => undefined)))).filter(entry => entry !== undefined);
    return limits.length ? { default: Math.min(...limits.map(entry => entry.default)), max: Math.min(...limits.map(entry => entry.max)) } : undefined;
  };

  ctx.inject(['connection'], ctx => {
    const connection = ctx.get('connection') as unknown as { fetch: { register(route: object): () => unknown } };
    const endpoints = ['status', 'login', 'manual', 'cancel', 'logout', 'setDefault', 'usage', 'prepareReset', 'consumeReset', 'providerSettings', 'setProviderSettings', 'modelDefaults', 'setModelDefault', 'proxyGet', 'proxySet', 'proxyTest', 'speed', 'setSpeed'];
    for (const endpoint of endpoints) {
      const NS = 'majed-subscriptions.';
      const method = `${NS}${endpoint}`;
      ctx.effect(() => connection.fetch.register({ path: `/api/${method}`, methods: ['POST'], requestBody: 'buffered',
        async fetch(request: Request) {
          if (request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json') return new Response('content type must be application/json', { status: 415 });
          let body;
          try { body = await request.json() as { type: string; rpcId: string; method: string; payload?: Record<string, unknown> }; }
          catch { return new Response('invalid JSON', { status: 400 }); }
          if (body?.type !== 'client-request' || typeof body.rpcId !== 'string' || body.method !== method) return new Response('invalid RPC envelope', { status: 400 });
          const payload = body.payload ?? {};
          const string = (key: string) => { const value = payload[key]; if (typeof value !== 'string' || !value) throw new Error(`payload.${key} must be a non-empty string`); return value; };
          let result;
          const releases: (() => void)[] = [];
          try {
            if (disposed) throw new Error('Subscriptions component is disabled');
            // Claude is served by the endpoints in CLAUDE_ENDPOINTS; every other provider stays unavailable.
            const provider = endpoint === 'status' ? 'codex' : readRouteProvider(payload.provider);
            if (provider !== 'codex' && !CLAUDE_ENDPOINTS.has(endpoint)) throw new Error('Only Codex is available');
            let value: unknown = { ok: true };
            switch (endpoint) {
              case 'status': {
                const state = await auth.status();
                // Never resolve npm client metadata for a provider with no saved login.
                if (state.accounts.length && !collision && !config.codexClientVersion) await version.resolve();
                // Claude presents its own CLI version (reference status `presentedVersion(claudeVersion)`), only when a
                // Claude account or the Claude route is in use; an unused provider does no network (spec story 61).
                const claudeState = await claudeAuth.status().catch(() => undefined);
                const claudeAccounts = await claudeTokens.list().catch(() => []);
                value = { ok: true, component: 'subscriptions', version: '0.2.0', registrationError: collision === undefined ? undefined : await collisionText(),
                  claudeRegistrationError: claudeCollision, copilotRegistrationError: copilotCollision,
                  providers: { copilot: { ...await copilotAuth.status(), accounts: (await copilotAuth.status()).accounts.map(account => ({ ...account, alias: ownAlias('copilot', account.key) })), displayName: preferences.get('copilot').displayName }, codex: { ...state, displayName: preferences.get('codex').displayName,
                    accounts: state.accounts.map(account => ({ ...account, alias: ownAlias('codex', account.key) })), clientVersion: config.codexClientVersion ? { version: config.codexClientVersion, source: 'config' }
                    : version.current() ?? { version: CODEX_CLIENT_VERSION, source: 'fallback' } },
                  ...claudeState === undefined ? {} : { claude: { ...claudeState, displayName: preferences.get('claude').displayName,
                    accounts: claudeState.accounts.map(account => ({ ...account, alias: ownAlias('claude', account.key) })),
                    clientVersion: claudeAccounts.length ? await presentClaudeVersion() : undefined } } } };
                break;
              }
              case 'proxyGet': value = await proxyGetConfig(); break;
              case 'proxySet': {
                if (typeof payload.enabled !== 'boolean' || typeof payload.url !== 'string') throw new Error('Invalid proxy settings');
                if (payload.username !== undefined && typeof payload.username !== 'string') throw new Error('Invalid proxy username');
                if (payload.password !== undefined && payload.password !== null && typeof payload.password !== 'string') throw new Error('Invalid proxy password');
                if (payload.bypass !== undefined && (!Array.isArray(payload.bypass) || payload.bypass.some(item => typeof item !== 'string'))) throw new Error('Invalid bypass list');
                value = await proxySetConfig(payload as unknown as Parameters<typeof proxySetConfig>[0]); break;
              }
              case 'proxyTest': { const input = readProxyTestPayload(payload); value = await proxyTestConnection(input.url, input.proxy, request.signal); break; }
              case 'setProviderSettings': {
                // Schema first: contextWindows is checked as positive safe integers before anything iterates it.
                const draft = validatePreferences(provider, payload.settings);
                // `original` (the snapshot the editor loaded) turns the save into an atomic field-level patch;
                // without it the whole provider document is replaced (legacy full save).
                const original = payload.original === undefined ? undefined : validatePreferences(provider, payload.original);
                const touched = Object.entries(draft.contextWindows ?? {}).filter(([model, window]) => original?.contextWindows?.[model] !== window);
                if (touched.length) {
                  const catalogs = await readAccountCatalogs(false, request.signal);
                  for (const [model, window] of touched) {
                    const bound = await boundsFor(model, catalogs, request.signal) ?? await adapter.contextLimits(model, undefined, request.signal);
                    if (window > bound.max) throw new Error('Context window is outside the advertised bounds');
                  }
                }
                request.signal.throwIfAborted();
                if (original === undefined) await preferences.set(provider, draft);
                else await preferences.update(provider, original, draft);
                pool.invalidate(); handleFor(provider)?.replace([provider]); break;
              }
              case 'providerSettings': {
                const force = readForce(payload);
                // One overall budget for the whole read (sequential bounded steps would add up to several budgets).
                const budget = deadlineSignal(DISCOVERY_TIMEOUT_MS, request.signal); releases.push(budget.release); const deadline = budget.signal;
                await loadModelDefaults();
                if (provider === 'claude') {
                  // Reference `providerSettings` for Claude: same bounded reads, no context bounds or fast tier, and the
                  // config value "follow config" resolves to (`promptCacheTtlDefault`).
                  if (force) { version.invalidate(); claudeVersion.invalidate(); claudeAdapter.clearAccountCatalog(); pool.invalidate(); claudeHandle?.replace(['claude']); }
                  const accounts = await readAccountCatalogsFor(claudeAdapter, claudeTokens, !force, deadline);
                  const bounded = <T>(work: (signal: AbortSignal) => Promise<T>) => withTimeout(work, DISCOVERY_TIMEOUT_MS, deadline).catch(() => undefined);
                  const [listed, tiers] = await Promise.all([
                    bounded(() => claudeAdapter.listModels('claude')),
                    bounded(() => pool.modelsForProvider('claude')),
                  ]);
                  const tierIds = new Set((tiers ?? []).map(tier => tier.id));
                  const rows = await Promise.all((listed ?? []).map(async model => {
                    const info = await bounded(() => claudeAdapter.resolveModel('claude', model.id));
                    return { ...model, contextWindow: info?.context?.contextWindow, efforts: tierIds.has(model.id) ? [] : info?.reasoning?.efforts.map(({ id, name }) => ({ id, name })) ?? [],
                      configured: defaultEffortOf('claude', model.id) };
                  }));
                  value = { provider: 'claude', settings: preferences.get('claude'), accounts, models: rows, tools: PROVIDER_TOOLS.claude,
                    promptCacheTtlDefault: config.claudePromptCacheTtl ?? DEFAULT_PROMPT_CACHE_TTL }; break;
                }
                if (force) { adapter.clearAccountCatalog(); pool.invalidate(); handle?.replace(['codex']); }
                const catalogs = await readAccountCatalogs(!force, deadline);
                const bounded = <T>(work: (signal: AbortSignal) => Promise<T>) => withTimeout(work, DISCOVERY_TIMEOUT_MS, deadline).catch(() => undefined);
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
                const rows = await Promise.all(models.map(async model => {
                  const info = await bounded(signal => adapter.resolveModel('codex', model.id, signal));
                  const bound = await boundsFor(model.id, catalogs, deadline);
                  return { ...model, efforts: tierIds.has(model.id) ? [] : info?.reasoning?.efforts ?? [], configured: defaultEffortOf('codex', model.id), fastTier: !tierIds.has(model.id) && fast.has(model.id),
                    ...(bound ? { defaultContextWindow: bound.default, maxContextWindow: bound.max } : {}) };
                }));
                value = { provider: 'codex', settings: preferences.get('codex'), accounts: catalogs, models: rows, tools: PROVIDER_TOOLS.codex }; break;
              }
              case 'modelDefaults': {
                // Reference `modelDefaults.catalog`: re-read from the live model info (the picker's own source), so the
                // offered efforts match the picker exactly and the configured default merges in through the adapter.
                const budget = deadlineSignal(DISCOVERY_TIMEOUT_MS, request.signal); releases.push(budget.release); const deadline = budget.signal;
                if (readForce(payload)) { version.invalidate(); claudeVersion.invalidate(); adapter.clearAccountCatalog(); claudeAdapter.clearAccountCatalog(); pool.invalidate(); handle?.replace(['codex']); claudeHandle?.replace(['claude']); }
                await loadModelDefaults();
                const catalog: { provider: string; models: { id: string; name: string; efforts: { id: string; name: string }[]; configured?: string }[] }[] = [];
                // Both routes read the live picker source (`ctx.llm`) and merge the saved default per model.
                for (const route of ['codex', 'claude', 'copilot'] as const) {
                  if (!(await ctx.llm.listProviders()).some(entry => entry.id === route)) continue;
                  const listed = await withTimeout(() => ctx.llm.listModels(route), DISCOVERY_TIMEOUT_MS, deadline).catch(() => undefined);
                  if (listed === undefined) continue;
                  // Configured tier rows resolve through the pool and never consult the per-model default: leave them out.
                  const tierIds = new Set((await withTimeout(() => pool.modelsForProvider(route), DISCOVERY_TIMEOUT_MS, deadline).catch(() => undefined) ?? []).map(tier => tier.id));
                  const candidates = listed.filter(model => !tierIds.has(model.id) && !parseAccountModelId(model.id));
                  const infos = await Promise.all(candidates.map(model => withTimeout(signal => ctx.llm.resolveModelInfo(route, model.id, signal), DISCOVERY_TIMEOUT_MS, deadline).catch(() => undefined)));
                  const models = [];
                  for (const [index, model] of candidates.entries()) {
                    const info = infos[index];
                    if (info === undefined) continue;
                    const override = defaultEffortOf(route, model.id);
                    models.push({ id: model.id, name: model.name, efforts: info.reasoning?.efforts.map(effort => ({ id: effort.id, name: effort.name })) ?? [],
                      ...override === undefined ? {} : { configured: override } });
                  }
                  catalog.push({ provider: route, models });
                }
                value = catalog; break;
              }
              case 'setModelDefault': {
                const model = string('model');
                const effort = payload.effort === undefined ? undefined : string('effort');
                const info = provider === 'copilot' ? await withTimeout(() => copilotAdapter.resolveModel('copilot', model), DISCOVERY_TIMEOUT_MS, request.signal) : provider === 'claude'
                  ? await withTimeout(() => claudeAdapter.resolveModel('claude', model), DISCOVERY_TIMEOUT_MS, request.signal).catch(() => undefined)
                  : await withTimeout(signal => adapter.resolveModel('codex', model, signal), DISCOVERY_TIMEOUT_MS, request.signal).catch(() => undefined);
                if (effort && info?.reasoning?.efforts.length && !info.reasoning.efforts.some(entry => entry.id === effort)) throw new Error(`model ${model} does not advertise a "${effort}" reasoning effort`);
                await setDefaultEffort(provider, model, effort); handleFor(provider)?.replace([provider]); break;
              }
              case 'login': {
                // Claude route: the browser sends `method` ('oauth' or 'keychain'); absent means import-first.
                const method = readLoginMethod(payload, provider);
                 if (provider === 'copilot') { if (copilotCollision) throw new Error('Copilot is already registered. Disable the reference component first.'); value = await copilotAuth.login(); break; }
                if (provider === 'claude') {
                  if (claudeCollision) throw new Error('Claude is already registered. Disable the reference component first.');
                  value = await claudeAuth.login(method); break;
                }
                if (collision) throw new Error('Codex is already registered. Disable the reference component first.');
                value = await auth.login(); break;
              }
              case 'manual': if (provider === 'copilot') throw new Error('Enter the device code on the verification page'); else if (provider === 'claude') claudeAuth.manual(string('input')); else auth.manual(string('input')); break;
              case 'cancel': if (provider === 'copilot') copilotAuth.cancel(); else if (provider === 'claude') claudeAuth.cancel(); else auth.cancel(); break;
              case 'logout': if (provider === 'copilot') await copilotAuth.logout(string('account')); else if (provider === 'claude') await claudeAuth.logout(string('account')); else await auth.logout(string('account')); break;
              case 'setDefault': if (provider === 'copilot') await copilotAuth.setDefault(string('account')); else if (provider === 'claude') await claudeAuth.setDefault(string('account')); else await auth.setDefault(string('account')); break;
              case 'usage': {
                 if (provider === 'copilot') { value = await usage.snapshotFor('copilot', string('account'), readForce(payload)); break; }
                if (provider === 'claude') {
                  if (claudeCollision) throw new Error('Claude registration is unavailable');
                  const account = string('account'); const force = readForce(payload); if (force) health.clear('claude', account);
                  value = await usage.snapshotFor('claude', account, force); break;
                }
                if (collision) throw new Error('Codex registration is unavailable');
                const account = string('account'); const force = readForce(payload); if (force) health.clear('codex', account);
                value = await usage.snapshotFor('codex', account, force); break;
              }
              case 'speed': {
                const sessionId = string('sessionId');
                const model = payload.model === undefined ? undefined : string('model');
                const fastModels = await adapter.fastCapableModels(request.signal);
                const accountPreferences = preferences.get('codex').accounts;
                for (const { key } of await tokens.list()) {
                  if (!accountPreferences || !Object.hasOwn(accountPreferences, key) || accountPreferences[key]?.independentEntry !== true) continue;
                  for (const candidate of [...fastModels]) {
                    if (parseAccountModelId(candidate)) continue;
                    if (await adapter.supportsFastTier(candidate, key, request.signal)) fastModels.push(accountModelId(key, candidate));
                  }
                }
                value = { tier: selectedSpeed(sessionId, model), fastModels }; break;
              }
              case 'setSpeed': {
                // An explicit Standard is kept as well, so a child can override a saved Fast default.
                speedBySession.set(string('sessionId'), readSpeedTier(payload)); break;
              }
              case 'prepareReset': value = await resets.prepare(string('account'), AbortSignal.any([request.signal, AbortSignal.timeout(20_000)])); break;
              case 'consumeReset': await resets.redeem(string('account'), string('ticket'), AbortSignal.any([request.signal, AbortSignal.timeout(20_000)])); break;
            }
            result = { ok: true, value };
          } catch (error) { result = { ok: false, error: { code: 'subscriptions/error', message: error instanceof OAuthEndpointError ? browserSafeError(error, 'upstream') : safeDiagnostic(error, [payload.password, (payload.proxy as { password?: unknown } | undefined)?.password], [payload.username, (payload.proxy as { username?: unknown } | undefined)?.username]), details: {} } }; } finally { for (const release of releases) release(); }
          return Response.json({ type: 'server-response', rpcId: body.rpcId, result });
        },
      }), `dsh-majed: ${method} route`);
    }
  });
}
