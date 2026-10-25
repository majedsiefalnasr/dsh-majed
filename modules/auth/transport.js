// Owner-admitted Fetch RPC transport for the auth service.
// Connection's exact Fetch registration authenticates the owner; origin/custom
// headers are supplemental CSRF checks, never authentication. Credentials are
// never echoed in errors, snapshots or logs.

export const AUTH_ROUTE = '/api/dsh-majed/auth';

async function readBody(req) {
  const chunks = []; let bytes = 0;
  for await (const chunk of req) {
    bytes += Buffer.byteLength(chunk);
    if (bytes > 65536) throw new Error('Body limit.');
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export function createAuthFetchHandler(getService) {
  const failure = (code, status) => Object.assign(new Error(code), { code, status });
  const actions = new Set(['login', 'devicePoll', 'deviceCancel', 'callback', 'refresh', 'revoke', 'setDefault', 'remove', 'snapshot']);
  return async request => {
    const send = (status, body) => Response.json(body, { status, headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'content-type': 'application/json' } });
    if (!['GET', 'POST'].includes(request.method)) return send(405, { error: 'Method not allowed.' });
    if (request.method === 'GET') {
      const svc = getService();
      return send(200, svc ? svc.snapshot() : { providers: [], accounts: [], defaultByProvider: {}, writing: false, disposed: !svc });
    }
    if (request.headers.get('content-type') !== 'application/json') return send(403, { code: 'AUTH_JSON_REQUIRED', error: 'JSON request required.' });
    let rpcId;
    try {
      const message = await readBody({ [Symbol.asyncIterator]: async function* () { if (request.body) yield* request.body; } });
      if (!message || typeof message !== 'object' || Array.isArray(message) || message.type !== 'client-request' || message.method !== 'majed/auth/status' || typeof message.rpcId !== 'string') throw failure('invalid_request', 400);
      rpcId = message.rpcId;
      const payload = message.payload;
      if (!payload || typeof payload !== 'object' || Array.isArray(payload) || !['action', 'input'].every(k => k in payload) || Object.keys(payload).some(k => !['action', 'input'].includes(k))) throw failure('invalid_request', 400);
      const { action, input } = payload;
      if (!actions.has(action)) return send(400, { error: 'Invalid action.' });
      const svc = getService();
      if (!svc || typeof svc[action] !== 'function') return send(400, { error: 'Invalid action.' });
      const result = await svc[action](input || {});
      return send(200, { type: 'server-response', rpcId, result: { ok: true, ...result } });
    } catch (error) {
      const code = error.status ? error.code : 'service_unavailable';
      if (rpcId) return send(200, { type: 'server-response', rpcId, result: { ok: false, error: { code, message: code, details: {} } } });
      return send(error.status || 503, { error: code });
    }
  };
}

export function registerLocalTransport(ctx, getService) {
  ctx.inject(['connection'], webCtx => {
    const connection = webCtx.reflect?.get('connection');
    if (!connection || typeof connection.fetch?.register !== 'function') return;
    connection.fetch.register({ path: AUTH_ROUTE, methods: ['GET', 'POST'], requestBody: 'streaming', fetch: createAuthFetchHandler(getService) });
  });
}
