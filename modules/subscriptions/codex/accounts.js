import { createHash, randomUUID } from 'node:crypto';
import { OAuthFlowManager } from './oauth-flow.js';
import { codexFlow, grant } from './protocol.js';
import { createPrivateStore } from './storage.js';

const fail = code => Object.assign(new Error(code), { code });
const publicAccount = account => ({ id: account.id, label: account.session.label, state: account.state, expiresAt: account.session.expiresAt });
export function createCodexAccounts({ path, fetch: fetchFn = globalThis.fetch, ports, timeoutMs, now = Date.now } = {}) {
  if (!path) throw fail('account_store_required');
  const store = createPrivateStore(path), flow = new OAuthFlowManager(), refreshes = new Map();
  let current, state = 'disconnected', disposed = false, starting, disposing = false, loginGeneration = 0;
  const lifecycle = new AbortController();
  const controllers = new Set();
  const listeners = new Set();
  const changed = event => { for (const listener of listeners) listener(event); };
  function live() { if (disposed || disposing) throw fail('service_disposed'); }
  async function snapshot() {
    live(); const data = await store.load();
    return { ...(current ? { authorizeUrl: current.attempt.authorizeUrl } : {}), loginState: state, state: current ? state : data.accounts.some(a => a.state === 'connected') ? 'connected' : data.accounts.length ? 'reauthentication_required' : state,
      accounts: data.accounts.map(a => ({ ...publicAccount(a), default: data.default === a.id })) };
  }
  async function begin() {
    live(); if (current || starting) throw fail('login_pending');
    const generation = loginGeneration;
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
    const entry = { attempt, controller, cancelled: false }; current = entry; state = 'pending';
    entry.done = (async () => {
      try {
        const code = await attempt.waitCode();
        const session = await grant(fetchFn, { grant_type: 'authorization_code', code, code_verifier: attempt.pkce.verifier, redirect_uri: attempt.redirectUri }, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30_000)]), now: now() });
        if (entry.cancelled || disposed || current !== entry) return;
        await store.transaction(data => {
          if (entry.cancelled || disposed || current !== entry) throw fail('cancelled');
          const id = createHash('sha256').update(JSON.stringify([session.accountId, session.user || session.accountId])).digest('hex');
          const record = { id, revision: randomUUID(), session, state: 'connected' };
          const index = data.accounts.findIndex(a => a.id === id);
          if (index < 0) data.accounts.push(record); else data.accounts[index] = record;
          data.default ||= id;
        }, { signal: controller.signal });
        if (!entry.cancelled && !disposing && !disposed) { state = 'connected'; changed(); }
      } catch { if (current === entry) state = entry.cancelled ? 'cancelled' : 'failed'; }
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
    return snapshot();
  }
  async function cancel() {
    live(); ++loginGeneration; const entry = current, opening = starting;
    state = 'cancelled';
    if (opening) await opening.catch(() => {});
    if (entry) { entry.cancelled = true; entry.controller.abort(); entry.attempt.cancel(); await entry.done; }
    return snapshot();
  }
  async function refresh(id) {
    live(); if (refreshes.has(id)) return refreshes.get(id);
    const controller = new AbortController(); controllers.add(controller);
    const work = (async () => {
      const old = (await store.load()).accounts.find(a => a.id === id); if (!old) throw fail('account_not_found');
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
  async function mutate(id, remove) {
    live(); await store.transaction(data => {
      if (!data.accounts.some(a => a.id === id)) throw fail('account_not_found');
      if (remove) { changed({ revoked: id }); data.accounts = data.accounts.filter(a => a.id !== id); if (data.default === id) data.default = data.accounts[0]?.id || null; }
      else data.default = id;
    }, { signal: lifecycle.signal }); changed(remove ? { revoked: id } : undefined); return snapshot();
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
    remove: id => mutate(id, true), setDefault: id => mutate(id, false), dispose };
}
