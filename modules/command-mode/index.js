import { readMessage } from '../../lib/management/settings.js';
import { createPolicyLedger } from '../command-policy/index.js';

export const COMMAND_MODE_METHOD = 'majed/command-mode';
export const COMMAND_MODE_PATH = '/api/' + COMMAND_MODE_METHOD;
export const COMMAND_MODES = ['ask', 'safe', 'aggressive'];
const identifier = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
const record = value => value && typeof value === 'object' && !Array.isArray(value);
const keysOnly = (value, keys) => Object.keys(value).every(key => keys.includes(key));
const failure = (code, status) => Object.assign(new Error(code), { code, status });
const json = (value, status = 200) => Response.json(value, { status, headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });

/**
 * Host-owned, in-memory only. Absent means Ask me, so a restart can only reduce authority.
 * `evaluate` is the host-side E11 entry: it reads the host-held mode and applies the deterministic
 * local policy. It does not intercept native approvals (gate G2) and is not exposed on the route.
 */
export function createCommandModes(isLive = () => true, { settings, now } = {}) {
  const modes = new Map();
  const epochs = new Map();
  const bump = sessionId => epochs.set(sessionId, (epochs.get(sessionId) ?? 0) + 1);
  // Every read of authority checks liveness itself: a closed session, even if its id reappears, is dropped and reads as Ask me.
  const drop = sessionId => { modes.delete(sessionId); bump(sessionId); };
  const closed = sessionId => { drop(sessionId); policy.closeSession(sessionId); }; // a closed session loses mode, epoch-fenced decisions and ledger
  const prune = () => { for (const id of [...modes.keys()]) if (!isLive(id)) closed(id); };
  const get = sessionId => {
    if (!modes.has(sessionId)) return 'ask';
    if (!isLive(sessionId)) { closed(sessionId); return 'ask'; }
    return modes.get(sessionId);
  };
  const policy = createPolicyLedger({ getMode: get, getEpoch: id => epochs.get(id) ?? 0, isLive, settings: () => (typeof settings === 'function' ? settings() : settings), ...(now ? { now } : {}) });
  return {
    get,
    set(sessionId, mode) {
      if (!COMMAND_MODES.includes(mode)) throw failure('invalid_request', 400);
      if (mode === 'ask') modes.delete(sessionId); else modes.set(sessionId, mode);
      bump(sessionId); // any mode event fences decisions made under the previous mode
    },
    reset: sessionId => { drop(sessionId); policy.reset(sessionId); }, // can only reduce authority to Ask me; clears that session's history and pending decisions, keeps the ids-only replay fence
    resetAll: () => { for (const id of [...modes.keys()]) bump(id); modes.clear(); policy.clear(); },
    entries: () => { prune(); return [...modes]; },
    evaluate: (sessionId, request) => policy.evaluate(sessionId, request),
    policy,
  };
}

/** Exact native Fetch registration: DSH supplies BrowserAuth + Owner admission before delivery. */
export function applyCommandMode(ctx, options = {}) {
  let live = () => false; // fail closed until the native sessions service is bound
  const modes = createCommandModes(id => live(id), options);
  ctx.inject(['connection'], owner => {
    owner.effect(() => () => modes.resetAll(), 'dsh-majed: command mode reset');
    live = id => !!owner.get('sessions')?.get(id);
    const snapshot = () => ({ modes: Object.fromEntries(modes.entries()) });
    owner.connection.fetch.register({ path: COMMAND_MODE_PATH, methods: ['POST'], requestBody: 'streaming', async fetch(request) {
      let rpcId;
      try {
        if (new URL(request.url).pathname !== COMMAND_MODE_PATH) throw failure('not_found', 404);
        if (request.method !== 'POST') throw failure('method_not_allowed', 405);
        const message = await readMessage(request);
        if (!record(message) || !keysOnly(message, ['type', 'rpcId', 'method', 'payload']) || message.type !== 'client-request' || message.method !== COMMAND_MODE_METHOD || !identifier(message.rpcId)) throw failure('invalid_request', 400);
        rpcId = message.rpcId;
        const payload = message.payload;
        if (!record(payload) || !['snapshot', 'set'].includes(payload.action)) throw failure('invalid_request', 400);
        if (!owner.get('sessions')) throw failure('scope_unavailable', 503);
        if (payload.action === 'snapshot') {
          if (!keysOnly(payload, ['action'])) throw failure('invalid_request', 400);
        } else {
          if (!keysOnly(payload, ['action', 'sessionId', 'mode']) || !identifier(payload.sessionId) || !COMMAND_MODES.includes(payload.mode)) throw failure('invalid_request', 400);
          if (!live(payload.sessionId)) throw failure('session_not_found', 404);
          request.signal.throwIfAborted();
          modes.set(payload.sessionId, payload.mode);
        }
        return json({ type: 'server-response', rpcId, result: { ok: true, value: snapshot() } });
      } catch (error) {
        if (request.signal.aborted) return json({ error: 'cancelled' }, 408);
        // Never serialize native exception messages, paths, stack or credentials.
        const code = error.status ? error.code : 'service_unavailable';
        if (rpcId) return json({ type: 'server-response', rpcId, result: { ok: false, error: { code, message: code, details: {} } } });
        return json({ error: code }, error.status || 503);
      }
    } });
  });
  return modes;
}
