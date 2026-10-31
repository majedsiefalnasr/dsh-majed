/** Grok subset of the reference SubscriptionsAuthController. See ../PROVENANCE.md. */
import { OAuthFlowManager, type OAuthAttempt } from './oauth-flow.js';
import { accountKeyOf, deleteAccountSession, listAccounts, saveAccountSession, setDefaultAccount } from './store.js';
import { grokFlow, exchangeGrokCode, grokTierName } from '../providers/grok.js';

export class GrokAuthController {
  private claim = 0;
  private finalizing = 0;
  private lastError?: string;
  private disposed = false;
  constructor(private flows: OAuthFlowManager, private changed: (account?: string) => void,
    private describe: (error: unknown) => string = error => error instanceof Error ? error.message : String(error)) {}
  async status() {
    const pending = this.flows.pending('grok');
    return { busy: this.flows.isBusy('grok') || this.finalizing > 0,
      pendingAuth: pending ? { authorizeUrl: pending.authorizeUrl } : undefined,
      accounts: (await listAccounts('grok')).map(({ key, session }, index) => ({ key, isDefault: index === 0,
        account: session.account,
        plan: grokTierName(session.accessToken), expiresAt: session.expiresAt })), detail: this.lastError };
  }
  async login() {
    if (this.disposed) throw new Error('Subscriptions component is disabled');
    if (this.finalizing) throw new Error('a grok login attempt is already in progress');
    const claim = ++this.claim;
    const attempt = await this.flows.start('grok', await grokFlow());
    if (this.disposed || claim !== this.claim) { attempt.cancel(); void attempt.waitCode().catch(() => {}); throw new Error('login cancelled'); }
    this.finalizing++;
    void this.complete(attempt, claim);
    return { authorizeUrl: attempt.authorizeUrl };
  }
  private async complete(attempt: OAuthAttempt, claim: number) {
    try {
      const code = await attempt.waitCode();
      const session = await exchangeGrokCode(code, attempt.pkce.verifier, attempt.redirectUri, attempt.pkce.challenge);
      if (this.claim !== claim) return;
      const account = accountKeyOf('grok', session);
      await saveAccountSession('grok', account, session);
      this.lastError = undefined;
      this.changed(account);
    } catch (error) {
      if (this.claim === claim && !(error instanceof Error && error.message === 'login cancelled')) {
        this.lastError = this.describe(error);
      }
    } finally { this.finalizing--; }
  }
  manual(input: string) {
    const attempt = this.flows.pending('grok');
    if (!attempt) throw new Error('no grok login attempt is in progress');
    attempt.manual(input);
  }
  cancel() { this.claim++; this.flows.pending('grok')?.cancel(); }
  async logout(account: string) {
    this.cancel();
    await deleteAccountSession('grok', account);
    this.lastError = undefined;
    this.changed(account);
  }
  async setDefault(account: string) { await setDefaultAccount('grok', account); this.changed(account); }
  dispose() { this.disposed = true; this.cancel(); }
}
