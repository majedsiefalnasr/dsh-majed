import { accountKeyOf, deleteAccountSession, listAccounts, saveAccountSession, setDefaultAccount } from './store.js';
import { grokFlow, exchangeGrokCode, grokTierName } from '../providers/grok.js';
import { DISCOVERY_TIMEOUT_MS, withTimeout } from '../providers/common.js';
export class GrokAuthController {
    flows;
    changed;
    describe;
    claim = 0;
    active;
    lastError;
    disposed = false;
    constructor(flows, changed, describe = error => error instanceof Error ? error.message : String(error)) {
        this.flows = flows;
        this.changed = changed;
        this.describe = describe;
    }
    async status() {
        const pending = this.flows.pending('grok');
        return { busy: this.flows.isBusy('grok') || this.active !== undefined,
            pendingAuth: pending ? { authorizeUrl: pending.authorizeUrl } : undefined,
            accounts: (await listAccounts('grok')).map(({ key, session }, index) => ({ key, isDefault: index === 0,
                account: session.account,
                plan: grokTierName(session.accessToken), expiresAt: session.expiresAt })), detail: this.lastError };
    }
    async login() {
        if (this.disposed)
            throw new Error('Subscriptions component is disabled');
        if (this.active)
            throw new Error('a grok login attempt is already in progress');
        const claim = ++this.claim;
        const active = this.active = new AbortController();
        try {
            const flow = await withTimeout(signal => grokFlow(signal), DISCOVERY_TIMEOUT_MS, active.signal);
            active.signal.throwIfAborted();
            if (!flow)
                throw new Error('grok discovery timed out');
            const attempt = await this.flows.start('grok', flow);
            if (this.disposed || claim !== this.claim) {
                attempt.cancel();
                void attempt.waitCode().catch(() => { });
                throw new Error('login cancelled');
            }
            void this.complete(attempt, claim, active);
            return { authorizeUrl: attempt.authorizeUrl };
        }
        catch (error) {
            if (this.active === active)
                this.active = undefined;
            throw error;
        }
    }
    async complete(attempt, claim, active) {
        try {
            const code = await attempt.waitCode();
            const session = await withTimeout(signal => exchangeGrokCode(code, attempt.pkce.verifier, attempt.redirectUri, attempt.pkce.challenge, signal), DISCOVERY_TIMEOUT_MS, active.signal);
            if (this.claim !== claim)
                return;
            if (!session)
                throw new Error('grok token exchange timed out');
            const account = accountKeyOf('grok', session);
            await saveAccountSession('grok', account, session);
            this.lastError = undefined;
            this.changed(account);
        }
        catch (error) {
            if (this.claim === claim && !(error instanceof Error && error.message === 'login cancelled')) {
                this.lastError = this.describe(error);
            }
        }
        finally {
            if (this.active === active)
                this.active = undefined;
        }
    }
    manual(input) {
        const attempt = this.flows.pending('grok');
        if (!attempt)
            throw new Error('no grok login attempt is in progress');
        attempt.manual(input);
    }
    cancel() { this.claim++; this.active?.abort(new Error('login cancelled')); this.active = undefined; this.flows.pending('grok')?.cancel(); }
    async logout(account) {
        this.cancel();
        await deleteAccountSession('grok', account);
        this.lastError = undefined;
        this.changed(account);
    }
    async setDefault(account) { await setDefaultAccount('grok', account); this.changed(account); }
    dispose() { this.disposed = true; this.cancel(); }
}
