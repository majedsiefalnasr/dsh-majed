import { createHash, randomUUID } from 'node:crypto';
import { OAuthFlowManager } from './oauth-flow.js';
import { codexFlow, grant } from './protocol.js';
import { createPrivateStore, createSettingsStore } from './storage.js';

const fail = code => Object.assign(new Error(code), { code });
// The stored label is the private verified identity; every public projection masks it.
const mask = label => { const at = label.lastIndexOf('@'); return at > 0 ? label[0] + '•••' + label.slice(at) : label; };
const publicAccount = (account, management) => ({ id: account.id, label: management ? account.session.label : mask(account.session.label), state: account.state, expiresAt: account.session.expiresAt });
export function createCodexAccounts({ path, settingsPath, fetch: fetchFn = globalThis.fetch, ports, timeoutMs, now = Date.now } = {}) {
  if (!path) throw fail('account_store_required');
  const store = createPrivateStore(path), settings = settingsPath ? createSettingsStore(settingsPath) : undefined, flow = new OAuthFlowManager(), refreshes = new Map();
  let current, lastFailure, state = 'disconnected', disposed = false, starting, disposing = false, loginGeneration = 0;
  const lifecycle = new AbortController();
  const controllers = new Set();
  const listeners = new Set();
  const changed = event => { for (const listener of listeners) listener(event); };
  function live() { if (disposed || disposing) throw fail('service_disposed'); }
  async function snapshot({ management = false } = {}) {
    live(); const data = await store.load();
    return { ...(current ? { authorizeUrl: current.attempt.authorizeUrl } : {}), loginState: state, ...(state === 'failed' && lastFailure ? { loginFailure: lastFailure } : {}), state: current ? state : data.accounts.some(a => a.state === 'connected' || a.state === 'paused') ? 'connected' : data.accounts.length ? 'reauthentication_required' : state,
      accounts: data.accounts.map(a => ({ ...publicAccount(a, management), default: data.default === a.id && a.state === 'connected' })) };
  }
  // Owner settings belong to the account card: forget them with it, so a re-added identity starts clean.
  async function purgeSettings(id) {
    if (!settings) return;
    const data = await settings.load();
    if (data.preferences.accounts?.[id] || data.catalogs[id]) await settings.transaction(data => { delete data.preferences.accounts?.[id]; delete data.catalogs[id]; });
  }
  // `reconnect` is an explicit account id: only then may a verified identity replace an existing record.
  async function begin(reconnect) {
    live(); if (current || starting) throw fail('login_pending');
    if (reconnect && !(await store.load()).accounts.some(a => a.id === reconnect)) throw fail('account_not_found');
    const generation = loginGeneration; lastFailure = undefined;
    starting = flow.start('codex', { ...codexFlow, ...(timeoutMs ? { timeoutMs } : {}), listen: { ...codexFlow.listen, ...(ports ? { ports } : {}) } });
    let attempt;
    try { attempt = await starting; } finally { starting = undefined; }
    if (generation !== loginGeneration || disposing || disposed) {
      // Cancellation can arrive before the asynchronous loopback listeners bind.
      // Observe rejection before closing; never publish this attempt or exchange.
      const closed = attempt.waitCode().catch(() => {});
      attempt.cancel(); await closed;
      return { state: 'cancelled' };
    }
    const controller = new AbortController(); controllers.add(controller);
    const entry = { attempt, controller, cancelled: false, reconnect }; current = entry; state = 'pending';
    entry.done = (async () => {
      try {
        const code = await attempt.waitCode();
        const session = await grant(fetchFn, { grant_type: 'authorization_code', code, code_verifier: attempt.pkce.verifier, redirect_uri: attempt.redirectUri }, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30_000)]), now: now() });
        if (entry.cancelled || disposed || current !== entry) return;
        let created;
        await store.transaction(data => {
          if (entry.cancelled || disposed || current !== entry) throw fail('cancelled');
          const id = createHash('sha256').update(JSON.stringify([session.accountId, session.user || session.accountId])).digest('hex');
          const record = { id, revision: randomUUID(), session, state: 'connected' };
          const index = data.accounts.findIndex(a => a.id === id);
          if (entry.reconnect) {
            if (!data.accounts.some(a => a.id === entry.reconnect)) throw fail('account_not_found');
            if (id !== entry.reconnect) throw fail('identity_mismatch');
            if (data.accounts[index].state === 'paused') record.state = 'paused';
            data.accounts[index] = record;
          } else if (index >= 0) throw fail('duplicate_account');
          else data.accounts.push(record);
          data.default ||= id;
          created = index < 0 ? id : undefined;
        }, { signal: controller.signal });
        if (created) await purgeSettings(created);
        if (!entry.cancelled && !disposing && !disposed) { state = 'connected'; changed(); }
      } catch (error) {
        if (['duplicate_account', 'identity_mismatch', 'account_not_found'].includes(error.code)) entry.failure = lastFailure = error.code;
        if (current === entry) state = entry.cancelled ? 'cancelled' : 'failed';
      }
      finally { controllers.delete(controller); if (current === entry) current = undefined; }
    })();
    return { state, authorizeUrl: attempt.authorizeUrl };
  }
  async function complete(callback) {
    live(); if (!current || state !== 'pending') throw fail('login_not_pending');
    // Require the state-bearing callback, including manual completion. The
    // upstream bare-code shortcut cannot meet Majed's state validation contract.
    let url; try { url = new URL(callback); } catch { throw fail('invalid_callback'); }
    if (url.origin + url.pathname !== current.attempt.redirectUri || url.searchParams.get('state') !== current.attempt.state || !url.searchParams.get('code')) throw fail('invalid_callback');
    const entry = current; state = 'pending';
    entry.attempt.manual(url.href); await entry.done;
    if (entry.failure) throw fail(entry.failure);
    return snapshot();
  }
  async function cancel() {
    live(); ++loginGeneration; const entry = current, opening = starting;
    // Only an actual login can be cancelled; cancelling nothing must not leave a stale 'cancelled' beside a connected account.
    if (entry || opening) state = 'cancelled';
    if (opening) await opening.catch(() => {});
    if (entry) { entry.cancelled = true; entry.controller.abort(); entry.attempt.cancel(); await entry.done; }
    return snapshot();
  }
  async function refresh(id) {
    live(); if (refreshes.has(id)) return refreshes.get(id);
    const controller = new AbortController(); controllers.add(controller);
    const work = (async () => {
      const old = (await store.load()).accounts.find(a => a.id === id); if (!old) throw fail('account_not_found');
      if (old.state === 'paused') throw fail('account_paused');
      if (old.state === 'signed_out') throw fail('reauthentication_required');
      try {
        const session = await grant(fetchFn, { grant_type: 'refresh_token', refresh_token: old.session.refreshToken }, { refresh: true, previous: old.session, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30_000)]), now: now() });
        if (disposed) throw fail('service_disposed');
        await store.transaction(data => {
          const record = data.accounts.find(a => a.id === id);
          if (!disposed && record?.revision === old.revision) Object.assign(record, { session, revision: randomUUID(), state: 'connected' });
        }, { signal: lifecycle.signal });
      } catch (error) {
        if (!disposed && !disposing && error.code === 'reauthentication_required') { let revoked = false; await store.transaction(data => {
          const record = data.accounts.find(a => a.id === id);
          if (record?.revision === old.revision) { revoked = true; changed({ revoked: id }); record.state = 'reauthentication_required'; record.revision = randomUUID(); }
        }, { signal: lifecycle.signal }); changed(revoked ? { revoked: id } : undefined); }
        throw fail(error.code === 'reauthentication_required' ? error.code : 'refresh_failed');
      }
      return snapshot();
    })();
    refreshes.set(id, work);
    try { return await work; } finally { controllers.delete(controller); refreshes.delete(id); }
  }
  // Local sign-out only: tokens are deleted from this host's store; the provider session is not revoked.
  async function signOut(id) {
    live(); await store.transaction(data => {
      const record = data.accounts.find(a => a.id === id);
      if (!record) throw fail('account_not_found');
      changed({ revoked: id });
      Object.assign(record, { state: 'signed_out', revision: randomUUID(), session: { accountId: record.session.accountId, ...(record.session.user ? { user: record.session.user } : {}), label: record.session.label } });
    }, { signal: lifecycle.signal }); changed({ revoked: id }); return snapshot();
  }
  // Pause only acts on a connected account and resume only on a paused one; setDefault only selects a connected one.
  // Anything else is refused with invalid_state before anything is written.
  async function mutate(id, remove, paused) {
    live(); await store.transaction(data => {
      const record = data.accounts.find(a => a.id === id);
      if (!record) throw fail('account_not_found');
      if (paused !== undefined) {
        // Pause is a host-owned state change: it revokes prepared routes, retains credentials and settings.
        if (record.state !== (paused ? 'connected' : 'paused')) throw fail('invalid_state');
        if (paused) changed({ revoked: id });
        record.state = paused ? 'paused' : 'connected'; record.revision = randomUUID();
        if (!paused) data.default ||= id;
      }
      else if (remove) {
        changed({ revoked: id }); data.accounts = data.accounts.filter(a => a.id !== id);
        // Never hand the default to an account that cannot be used.
        if (data.default === id) data.default = data.accounts.find(a => a.state === 'connected')?.id || null;
      }
      else if (record.state !== 'connected') throw fail('invalid_state');
      else data.default = id;
    }, { signal: lifecycle.signal });
    if (remove) await purgeSettings(id);
    changed(remove || paused ? { revoked: id } : undefined); return snapshot();
  }
  // Host-only runtime seam. These credentials never enter management snapshots.
  async function session(id, { force = false, signal } = {}) {
    live(); signal?.throwIfAborted();
    let data = await store.load(); const key = id || data.default;
    let account = data.accounts.find(a => a.id === key);
    if (!account || account.state !== 'connected') throw fail('reauthentication_required');
    if (force || account.session.expiresAt - now() < 300000) {
      await refresh(key); data = await store.load(); account = data.accounts.find(a => a.id === key);
    }
    live(); signal?.throwIfAborted();
    if (!account || account.state !== 'connected') throw fail('reauthentication_required');
    return structuredClone(account.session);
  }
  async function dispose() {
    if (disposed || disposing) return;
    disposing = true; lifecycle.abort();
    if (starting) await starting.catch(() => {});
    if (current) { current.cancelled = true; current.controller.abort(); current.attempt.cancel(); await current.done; }
    disposed = true;
    for (const controller of controllers) controller.abort();
    await Promise.allSettled([...refreshes.values()]);
    listeners.clear();
  }
  return { snapshot, begin, complete, cancel, refresh, session,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    remove: id => mutate(id, true), setDefault: id => mutate(id, false),
    signOut, pause: id => mutate(id, false, true), resume: id => mutate(id, false, false), dispose };
}
