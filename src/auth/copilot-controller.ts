/** Copilot device-flow slice of reference v0.9.12 index.ts; see PROVENANCE.md. */
import { DeviceFlowManager } from './device-flow.js';
import { accountKeyOf, deleteAccountSession, listAccounts, saveAccountSession, setDefaultAccount } from './store.js';
import { completeCopilotLogin, copilotDeviceFlow } from '../providers/copilot.js';

export class CopilotAuthController {
  private claim = 0;
  private busy = false;
  private disposed = false;
  private completion?: AbortController;
  private detail?: string;
  constructor(private flows: DeviceFlowManager, private changed: (account?: string) => void,
    private describe: (error: unknown) => string) {}
  async status() {
    const pending = this.flows.pending('copilot');
    return { busy: this.busy, detail: this.detail,
      pendingAuth: pending ? { authorizeUrl: pending.verificationUrl, userCode: pending.userCode } : undefined,
      accounts: (await listAccounts('copilot')).map(({ key, session }, index) => ({ key, isDefault: index === 0,
        account: session.account ?? key, expiresAt: session.expiresAt })) };
  }
  async login() {
    if (this.disposed) throw new Error('Subscriptions component is disabled');
    if (this.busy) throw new Error('a copilot login attempt is already in progress');
    const claim = ++this.claim;
    const completion = new AbortController();
    this.completion = completion;
    this.busy = true; this.detail = undefined;
    try {
      const attempt = await this.flows.start('copilot', copilotDeviceFlow());
      if (this.disposed || claim !== this.claim) { attempt.cancel(); throw new Error('login cancelled'); }
      void (async () => {
        try {
          const token = await attempt.waitToken();
          if (this.claim !== claim) return;
          const session = await completeCopilotLogin(token, undefined, completion.signal);
          if (this.claim !== claim) return;
          const account = accountKeyOf('copilot', session);
          await saveAccountSession('copilot', account, session);
          this.changed(account);
        } catch (error) { if (this.claim === claim) this.detail = this.describe(error); }
        finally { if (this.claim === claim) this.busy = false; }
      })();
      return { authorizeUrl: attempt.verificationUrl, userCode: attempt.userCode };
    } catch (error) { if (this.claim === claim) this.busy = false; throw error; }
  }
  cancel() { this.claim++; this.completion?.abort(new Error('login cancelled')); this.completion = undefined; this.busy = false; this.flows.pending('copilot')?.cancel(); }
  async logout(account: string) { this.cancel(); await deleteAccountSession('copilot', account); this.changed(account); }
  async setDefault(account: string) { await setDefaultAccount('copilot', account); this.changed(); }
  dispose() { this.disposed = true; this.cancel(); }
}
