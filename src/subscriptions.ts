/** Owned Codex component composition. Reference v0.9.12: see PROVENANCE.md. */
import type { Context } from '@deepseek-ai/cordis';
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
import { buildAccountPools } from './providers/pool-family.js';
import { ResetRedemption } from './providers/reset-redemption.js';
import { proxiedFetch } from './http.js';
import type { ModelEntry } from './providers/common.js';

export const name = 'dsh-majed/subscriptions';
export const inject = ['llm'];
export interface Config { codexClientVersion?: string; models?: { codex?: ModelEntry[] }; }
export function apply(ctx: Context, config: Config = {}): void {
  const flows = new OAuthFlowManager();
  const version = new CodexClientVersionCache();
  const health = new PoolHealthRegistry();
  let handle: ReturnType<Context['llm']['registerAdapter']> | undefined;
  let collision: string | undefined;
  let disposed = false;
  let pool: PoolAdapter;
  let adapter: CodexAdapter;
  const changed = (account?: string) => {
    if (disposed) return;
    adapter?.clearAccountCatalog(account); health.clear('codex', account); usage.invalidate('codex', account);
    pool?.invalidate(); handle?.replace(['codex']);
  };
  const tokens = new AccountTokenManager<CodexSession>({ provider: 'codex', displayName: 'ChatGPT (Codex)',
    makeOptions: () => ({ preemptMs: CODEX_PREEMPT_MS, refresh: refreshCodex, isPermanent: isCodexPermanentRefreshError }),
    onAccountRemoved: changed });
  const readUsage = async (account: string, signal: AbortSignal) => {
    const session = await tokens.session(account);
    const snapshot = await fetchCodexUsage(session, proxiedFetch, signal);
    try { return { ...snapshot, resetCredits: await fetchCodexResetCredits(session, proxiedFetch, signal) }; }
    catch (error) { return { ...snapshot, resetCreditsError: error instanceof Error ? error.message : String(error) }; }
  };
  const usage = new PoolUsageTracker((provider, account) => provider === 'codex'
    ? () => readUsage(account, AbortSignal.timeout(20_000)) : undefined);
  const auth = new CodexAuthController(flows, changed);
  const resets = new ResetRedemption(readUsage,
    async (account, credit, request, signal) => consumeCodexResetCredit(await tokens.session(account), credit, request, proxiedFetch, signal),
    account => usage.invalidate('codex', account));
  adapter = new CodexAdapter({ tokens, models: config.models?.codex ?? [
    { id: 'gpt-5.1-codex', name: 'GPT-5.1 Codex' },
    { id: 'gpt-5.1-codex-mini', name: 'GPT-5.1 Codex Mini' },
    { id: 'gpt-5.1', name: 'GPT-5.1' },
  ], streamIdleTimeoutMs: 300_000,
    discovery: !config.models?.codex?.length,
    clientVersion: config.codexClientVersion,
    resolveClientVersion: () => version.resolve(),
    catalogStore: catalogStore('codex'), accountCatalogStore: account => accountCatalogStore('codex', account),
    onCatalogChanged: () => { if (!disposed) { pool?.invalidate(); handle?.replace(['codex']); } },
    resolveAttachments: () => ctx.get('attachments') as never,
    pool: () => pool,
    onWarn: message => ctx.logger.warn(`dsh-majed: ${message}`),
  });
  pool = new PoolAdapter({ adapters: { codex: adapter }, health, usage, strategy: 'quota_aware', switchMargin: 2,
    defaultAccount: () => tokens.defaultAccount(), resolveAccount: (_, account) => tokens.resolveAccount(account),
    families: async () => buildAccountPools({ codex: { catalogs: (await Promise.all((await tokens.list()).map(async ({ key }) => {
      const models = await adapter.listOwnModels('codex', key, AbortSignal.timeout(20_000), true);
      return models ? { account: key, models } : undefined;
    }))).filter(entry => entry !== undefined) } }), tiers: {},
    onWarn: message => ctx.logger.warn(`dsh-majed: ${message}`) });
  try { handle = ctx.llm.registerAdapter(['codex'], adapter); }
  catch (error) { collision = error instanceof Error ? error.message : String(error); }
  ctx.effect(() => () => { disposed = true; auth.dispose(); }, 'dsh-majed: subscriptions auth disposal');
  if (handle) ctx.effect(() => startCatalogRefresh(async signal => {
    if ((await tokens.list()).length && !signal.aborted) await adapter.listOwnModels('codex', undefined, signal);
  }, () => ctx.logger.warn('dsh-majed: Codex catalog refresh failed')), 'dsh-majed: subscriptions catalog refresh');

  ctx.inject(['connection'], ctx => {
    const connection = ctx.get('connection') as unknown as { fetch: { register(route: object): () => unknown } };
    const endpoints = ['status', 'login', 'manual', 'cancel', 'logout', 'setDefault', 'usage', 'prepareReset', 'consumeReset'];
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
          try {
            if (disposed) throw new Error('Subscriptions component is disabled');
            if (endpoint !== 'status' && payload.provider !== undefined && payload.provider !== 'codex') throw new Error('Only Codex is available');
            let value: unknown = { ok: true };
            switch (endpoint) {
              case 'status': {
                const state = await auth.status();
                // Never resolve npm client metadata for a provider with no saved login.
                if (state.accounts.length && !collision && !config.codexClientVersion) await version.resolve();
                value = { ok: true, component: 'subscriptions', version: '0.2.0', registrationError: collision,
                  providers: { codex: { ...state, clientVersion: config.codexClientVersion ? { version: config.codexClientVersion, source: 'config' }
                    : version.current() ?? { version: CODEX_CLIENT_VERSION, source: 'fallback' } } } };
                break;
              }
              case 'login': if (collision) throw new Error('Codex is already registered. Disable the reference component first.'); value = await auth.login(); break;
              case 'manual': auth.manual(string('input')); break;
              case 'cancel': auth.cancel(); break;
              case 'logout': await auth.logout(string('account')); break;
              case 'setDefault': await auth.setDefault(string('account')); break;
              case 'usage': {
                if (collision) throw new Error('Codex registration is unavailable');
                const account = string('account'); if (payload.force === true) health.clear('codex', account);
                value = await usage.snapshotFor('codex', account, payload.force === true); break;
              }
              case 'prepareReset': value = await resets.prepare(string('account'), AbortSignal.any([request.signal, AbortSignal.timeout(20_000)])); break;
              case 'consumeReset': await resets.redeem(string('account'), string('ticket'), AbortSignal.any([request.signal, AbortSignal.timeout(20_000)])); break;
            }
            result = { ok: true, value };
          } catch (error) { result = { ok: false, error: { code: 'subscriptions/error', message: error instanceof Error ? error.message : String(error), details: {} } }; }
          return Response.json({ type: 'server-response', rpcId: body.rpcId, result });
        },
      }), `dsh-majed: ${method} route`);
    }
  });
}
