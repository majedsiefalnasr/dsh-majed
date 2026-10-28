import { resolveManagementScope } from './scope.js';

const PATH = '/api/majed/settings/status';
const METHOD = 'majed/settings/status';
const MODULES = ['skills', 'mcp', 'hooks', 'subscriptions', 'routing'];
const MAX_BYTES = 4096;
const json = (value, status = 200) => Response.json(value, { status, headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
const failure = (code, status) => Object.assign(new Error(code), { code, status });
const record = value => value && typeof value === 'object' && !Array.isArray(value);
const keysOnly = (value, keys) => Object.keys(value).every(key => keys.includes(key));
const identifier = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);

export async function readMessage(request) {
  if (request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase() !== 'application/json') throw failure('json_required', 415);
  if (Number(request.headers.get('content-length')) > MAX_BYTES) throw failure('body_too_large', 413);
  const reader = request.body?.getReader();
  if (!reader) throw failure('invalid_request', 400);
  const chunks = []; let size = 0, timer, onAbort;
  try {
    request.signal.throwIfAborted();
    const aborted = new Promise((_, reject) => {
      onAbort = () => reject(failure('cancelled', 408));
      request.signal.addEventListener('abort', onAbort, { once: true });
    });
    const deadline = new Promise((_, reject) => { timer = setTimeout(() => reject(failure('request_timeout', 408)), 5000); });
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline, aborted]);
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) throw failure('body_too_large', 413);
      chunks.push(value);
    }
    request.signal.throwIfAborted();
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { throw failure('invalid_request', 400); }
  } finally {
    clearTimeout(timer); request.signal.removeEventListener('abort', onAbort);
    // Cancellation may invoke an uncooperative underlying source. Do not await it.
    void reader.cancel().catch(() => {}); reader.releaseLock();
  }
}

/** Inert, process-lifetime readiness only. No reference runtime or config writer. */
export function apply(ctx) {
  ctx.inject(['connection'], owner => {
    const enabled = new Map(MODULES.map(module => [module, false]));
    // Native exact Fetch registration supplies BrowserAuth + Owner admission and
    // Host/Origin CSRF fences BEFORE delivery. Headers never grant authority here.
    owner.connection.fetch.register({ path: PATH, methods: ['POST'], requestBody: 'streaming', async fetch(request) {
      let rpcId;
      try {
        if (new URL(request.url).pathname !== PATH) throw failure('not_found', 404);
        if (request.method !== 'POST') throw failure('method_not_allowed', 405);
        const message = await readMessage(request);
        if (!record(message) || !keysOnly(message, ['type', 'rpcId', 'method', 'payload']) || message.type !== 'client-request' || message.method !== METHOD || !identifier(message.rpcId)) throw failure('invalid_request', 400);
        rpcId = message.rpcId;
        const payload = message.payload;
        if (!record(payload) || !keysOnly(payload, ['module', 'enabled', 'sessionId', 'workspaceId']) || !MODULES.includes(payload.module) || ('enabled' in payload && typeof payload.enabled !== 'boolean')) throw failure('invalid_request', 400);
        let scope = 'instance';
        if ('sessionId' in payload || 'workspaceId' in payload) {
          if (!identifier(payload.sessionId) || !identifier(payload.workspaceId)) throw failure('invalid_scope', 400);
          const sessions = owner.get('sessions'), sessionPersistence = owner.get('sessionPersistence'), workspaceRegistry = owner.get('workspaceRegistry');
          if (!sessions || !sessionPersistence || !workspaceRegistry) throw failure('scope_unavailable', 503);
          if (!await resolveManagementScope({ sessions, sessionPersistence, workspaceRegistry }, payload, request.signal)) throw failure('scope_not_found', 404);
          scope = 'project';
        }
        request.signal.throwIfAborted();
        if ('enabled' in payload) enabled.set(payload.module, payload.enabled);
        const on = enabled.get(payload.module);
        return json({ type: 'server-response', rpcId, result: { ok: true, value: { module: payload.module, enabled: on, state: on ? 'ready' : 'disabled', scope, capabilities: [] } } });
      } catch (error) {
        if (request.signal.aborted) return json({ error: 'cancelled' }, 408);
        // Never serialize native exception messages, paths, stack or credentials.
        const code = error.status ? error.code : 'service_unavailable';
        if (rpcId) return json({ type: 'server-response', rpcId, result: { ok: false, error: { code, message: code, details: {} } } });
        return json({ error: code }, error.status || 503);
      }
    } });
  });
}
