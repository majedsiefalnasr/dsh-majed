import { readMessage } from '../../lib/management/settings.js';

export const COMMAND_MODE_METHOD = 'majed/command-mode';
export const COMMAND_MODE_PATH = '/api/' + COMMAND_MODE_METHOD;
export const COMMAND_MODES = ['ask', 'safe', 'aggressive'];
const identifier = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
const record = value => value && typeof value === 'object' && !Array.isArray(value);
const keysOnly = (value, keys) => Object.keys(value).every(key => keys.includes(key));
const failure = (code, status) => Object.assign(new Error(code), { code, status });
const json = (value, status = 200) => Response.json(value, { status, headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });

/** Host-owned, in-memory only. Absent means Ask me, so a restart can only reduce authority. */
export function createCommandModes() {
  const modes = new Map();
  return {
    get: sessionId => modes.get(sessionId) ?? 'ask',
    set(sessionId, mode) {
      if (!COMMAND_MODES.includes(mode)) throw failure('invalid_request', 400);
      if (mode === 'ask') modes.delete(sessionId); else modes.set(sessionId, mode);
    },
    reset: sessionId => { modes.delete(sessionId); },
    resetAll: () => modes.clear(),
    entries: () => [...modes],
  };
}

/** Exact native Fetch registration: DSH supplies BrowserAuth + Owner admission before delivery. */
export function applyCommandMode(ctx) {
  const modes = createCommandModes();
  ctx.inject(['connection'], owner => {
    owner.effect(() => () => modes.resetAll(), 'dsh-majed: command mode reset');
    const live = id => !!owner.get('sessions')?.get(id);
    const snapshot = () => {
      // A closed or replaced session never keeps authority.
      for (const [id] of modes.entries()) if (!live(id)) modes.reset(id);
      return { modes: Object.fromEntries(modes.entries()) };
    };
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
