import { readClaudeCodeCredentials } from './claude-code-creds.js';
import { accountKeyOf, deleteAccountSession, listAccounts, saveAccountSession, setDefaultAccount } from './store.js';
import { claudeFlow, exchangeClaudeCode } from '../providers/claude.js';
export class ClaudeAuthController {
    flows;
    changed;
    describe;
    readImported;
    claim = 0;
    finalizing = 0;
    lastError;
    disposed = false;
    constructor(flows, changed, describe = error => error instanceof Error ? error.message : String(error), readImported = () => readClaudeCodeCredentials()) {
        this.flows = flows;
        this.changed = changed;
        this.describe = describe;
        this.readImported = readImported;
    }
    async status() {
        const pending = this.flows.pending('claude');
        return { busy: this.flows.isBusy('claude') || this.finalizing > 0,
            pendingAuth: pending ? { authorizeUrl: pending.authorizeUrl } : undefined,
            accounts: (await listAccounts('claude')).map(({ key, session }, index) => ({ key, isDefault: index === 0,
                account: session.emailAddress ?? key, plan: session.subscriptionType, expiresAt: session.expiresAt })), detail: this.lastError };
    }
    /**
     * Start a login. `method` `'oauth'` skips the import; `'keychain'` requires it; omitted tries the import first and
     * falls back to the browser flow. The import resolves with an empty `authorizeUrl`.
     */
    async login(method) {
        if (this.disposed)
            throw new Error('Subscriptions component is disabled');
        if (method !== 'oauth') {
            const imported = this.readImported();
            if (imported !== undefined) {
                // An OAuth attempt may be in flight from an earlier click; claiming supersedes it whether it still waits for
                // its code or is already exchanging one. The cancel frees the listener so `busy` clears.
                this.claim++;
                this.flows.pending('claude')?.cancel();
                // Imported accounts are bound: only they sync refreshes back to Claude Code's credential store.
                const session = { ...imported, keychainBound: true };
                const account = accountKeyOf('claude', session);
                await saveAccountSession('claude', account, session);
                this.lastError = undefined;
                this.changed(account);
                return { authorizeUrl: '' };
            }
            if (method === 'keychain')
                throw new Error('no Claude Code credentials found; run `claude` and log in first, or choose the browser flow');
        }
        if (this.finalizing)
            throw new Error('a claude login attempt is already in progress');
        const claim = ++this.claim;
        const attempt = await this.flows.start('claude', claudeFlow);
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
            const session = await exchangeClaudeCode(code, attempt.pkce.verifier, attempt.redirectUri, attempt.state);
            // Whoever claimed the session while the exchange ran owns it now. The check and the store call sit in one
            // synchronous stretch, so a later claim is ordered after this write.
            if (this.claim !== claim)
                return;
            const account = accountKeyOf('claude', session);
            await saveAccountSession('claude', account, session);
            this.lastError = undefined;
            this.changed(account);
        }
        catch (error) {
            // A superseded attempt must not put an error on a provider that has since been imported or logged out.
            if (this.claim === claim && !(error instanceof Error && error.message === 'login cancelled')) {
                this.lastError = this.describe(error);
            }
        }
        finally {
            this.finalizing--;
        }
    }
    manual(input) {
        const attempt = this.flows.pending('claude');
        if (!attempt)
            throw new Error('no claude login attempt is in progress');
        attempt.manual(input);
    }
    cancel() { this.claim++; this.flows.pending('claude')?.cancel(); }
    async logout(account) {
        this.cancel();
        await deleteAccountSession('claude', account);
        this.lastError = undefined;
        this.changed(account);
    }
    async setDefault(account) { await setDefaultAccount('claude', account); this.changed(account); }
    dispose() { this.disposed = true; this.cancel(); }
}
