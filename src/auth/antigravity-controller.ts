/** Antigravity OAuth composition adapted from reference v0.9.12 index.ts; see PROVENANCE.md. */
import { OAuthFlowManager, type OAuthAttempt } from './oauth-flow.js';
import {
  accountKeyOf,
  deleteAccountSession,
  listAccounts,
  saveAccountSession,
  setDefaultAccount,
} from './store.js';
import {
  ANTIGRAVITY_SETUP_REQUIRED,
  antigravityFlow,
  exchangeAntigravityCode,
  type AntigravityOAuthConfig,
  type AntigravityRuntimeConfig,
} from '../providers/antigravity.js';
import { DISCOVERY_TIMEOUT_MS, withTimeout } from '../providers/common.js';
export class AntigravityAuthController {
  private claim = 0;
  private authRevision = 0;
  private active?: AbortController;
  private detail?: string;
  private disposed = false;
  constructor(
    private flows: OAuthFlowManager,
    private oauth: AntigravityOAuthConfig | undefined,
    private runtime: AntigravityRuntimeConfig,
    private changed: (account?: string) => void,
    private describe: (error: unknown) => string,
  ) {}
  async status() {
    const pending = this.flows.pending('antigravity');
    return {
      authRevision: this.authRevision,
      setupRequired: this.oauth === undefined,
      busy: this.active !== undefined,
      detail: this.oauth ? this.detail : ANTIGRAVITY_SETUP_REQUIRED,
      pendingAuth: pending ? { authorizeUrl: pending.authorizeUrl } : undefined,
      accounts: (await listAccounts('antigravity')).map(
        ({ key, session }, index) => ({
          key,
          isDefault: index === 0,
          account: session.account ?? key,
          plan: session.plan,
          expiresAt: session.expiresAt,
        }),
      ),
    };
  }
  async login() {
    if (!this.oauth) throw new Error(ANTIGRAVITY_SETUP_REQUIRED);
    if (this.disposed) throw new Error('Subscriptions component is disabled');
    if (this.active)
      throw new Error('an antigravity login attempt is already in progress');
    const claim = ++this.claim;
    const active = (this.active = new AbortController());
    this.detail = undefined;
    try {
      const attempt = await this.flows.start(
        'antigravity',
        antigravityFlow(this.oauth),
      );
      if (claim !== this.claim || this.disposed) {
        attempt.cancel();
        void attempt.waitCode().catch(() => {});
        throw new Error('login cancelled');
      }
      void this.complete(attempt, claim, active);
      return { authorizeUrl: attempt.authorizeUrl };
    } catch (error) {
      if (this.active === active) this.active = undefined;
      throw error;
    }
  }
  private async complete(
    attempt: OAuthAttempt,
    claim: number,
    active: AbortController,
  ) {
    try {
      if (!this.oauth) throw new Error(ANTIGRAVITY_SETUP_REQUIRED);
      const oauth = this.oauth;
      const code = await attempt.waitCode();
      const session = await withTimeout(
        (signal) =>
          exchangeAntigravityCode(
            code,
            attempt.pkce.verifier,
            attempt.redirectUri,
            oauth,
            this.runtime,
            undefined,
            signal,
          ),
        DISCOVERY_TIMEOUT_MS,
        active.signal,
      );
      if (claim !== this.claim || this.disposed) return;
      if (!session) throw new Error('Antigravity token exchange timed out');
      const account = accountKeyOf('antigravity', session);
      await saveAccountSession('antigravity', account, session);
      this.authRevision++;
      if (claim === this.claim && !this.disposed) this.changed(account);
    } catch (error) {
      if (claim === this.claim) this.detail = this.describe(error);
    } finally {
      if (this.active === active) this.active = undefined;
    }
  }
  manual(input: string) {
    const attempt = this.flows.pending('antigravity');
    if (!attempt)
      throw new Error('no antigravity login attempt is in progress');
    attempt.manual(input);
  }
  cancel() {
    this.claim++;
    this.active?.abort(new Error('login cancelled'));
    this.active = undefined;
    this.flows.pending('antigravity')?.cancel();
  }
  async logout(account: string) {
    this.cancel();
    await deleteAccountSession('antigravity', account);
    this.changed(account);
  }
  async setDefault(account: string) {
    await setDefaultAccount('antigravity', account);
    this.changed();
  }
  dispose() {
    this.disposed = true;
    this.cancel();
  }
}
