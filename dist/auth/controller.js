import { accountKeyOf, deleteAccountSession, listAccounts, saveAccountSession, setDefaultAccount } from './store.js';
import { codexFlow, codexProfileClaims, exchangeCodexCode } from '../providers/codex.js';
export class CodexAuthController {
    flows;
    changed;
    claim = 0;
    finalizing = 0;
    lastError;
    disposed = false;
    constructor(flows, changed) {
        this.flows = flows;
        this.changed = changed;
    }
    async status() {
        return { busy: this.flows.isBusy('codex') || this.finalizing > 0,
            accounts: (await listAccounts('codex')).map(({ key, session }, index) => ({ key, isDefault: index === 0,
                account: session.emailAddress ?? codexProfileClaims(session.idToken).emailAddress ?? session.accountId,
                plan: session.planType, expiresAt: session.expiresAt })), detail: this.lastError };
    }
    async login() {
        if (this.disposed)
            throw new Error('Subscriptions component is disabled');
        if (this.finalizing)
            throw new Error('a codex login attempt is already in progress');
        const claim = ++this.claim;
        const attempt = await this.flows.start('codex', codexFlow);
        if (this.disposed || claim !== this.claim) {
            attempt.cancel();
            void attempt.waitCode().catch(() => { });
            throw new Error('login cancelled');
        }
        this.finalizing++;
        void this.complete(attempt, claim);
        return { authorizeUrl: attempt.authorizeUrl };
    }
    async complete(attempt, claim) {
        try {
            const code = await attempt.waitCode();
            const session = await exchangeCodexCode(code, attempt.pkce.verifier, attempt.redirectUri);
            if (this.claim !== claim)
                return;
            const account = accountKeyOf('codex', session);
            await saveAccountSession('codex', account, session);
            this.lastError = undefined;
            this.changed(account);
        }
        catch (error) {
            if (this.claim === claim && !(error instanceof Error && error.message === 'login cancelled')) {
                this.lastError = error instanceof Error ? error.message : String(error);
            }
        }
        finally {
            this.finalizing--;
        }
    }
    manual(input) {
        const attempt = this.flows.pending('codex');
        if (!attempt)
            throw new Error('no codex login attempt is in progress');
        attempt.manual(input);
    }
    cancel() { this.claim++; this.flows.pending('codex')?.cancel(); }
    async logout(account) {
        this.cancel();
        await deleteAccountSession('codex', account);
        this.lastError = undefined;
        this.changed(account);
    }
    async setDefault(account) { await setDefaultAccount('codex', account); this.changed(account); }
    dispose() { this.disposed = true; this.cancel(); }
}
