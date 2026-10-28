import { safeError } from './validation.js';
export const MANAGERS_ROUTE = '/api/dsh-majed/managers';
export function trustedLocalRequest(req, mutation = false) {
  const address = req.socket?.remoteAddress;
  if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address)) return false;
  const host = req.headers?.host;
  if (typeof host !== 'string' || !/^(?:127\.0\.0\.1|localhost|\[::1\])(?::[0-9]{1,5})?$/.test(host)) return false;
  const origin = req.headers?.origin;
  if (origin !== undefined && origin !== `http://${host}` && origin !== `https://${host}`) return false;
  if (mutation && (origin === undefined || req.headers['x-dsh-majed-manager'] !== '1' || req.headers['content-type'] !== 'application/json')) return false;
  return !req.headers['sec-fetch-site'] || ['same-origin', 'none'].includes(req.headers['sec-fetch-site']);
}
// Authentication belongs to DSH's Connection service, not proxy headers or
// loopback addresses. Its admission applies configured Host/Origin policy and
// resolves the live authenticated Peer. Missing support deliberately fails shut.
export function admitOwnerRequest(req, connection, mutation = false) {
  if (typeof connection?.admit !== 'function') return 401;
  const admission = connection.admit(req);
  if (!admission || 'rejection' in admission) return admission?.rejection === 403 ? 403 : 401;
  if (admission.peer?.principal?.kind !== 'owner') return 403;
  if (mutation && (typeof req.headers?.origin !== 'string' || req.headers['x-dsh-majed-manager'] !== '1' || req.headers['content-type'] !== 'application/json')) return 403;
  return undefined;
}
async function readBody(req) {
  const chunks = []; let bytes = 0;
  for await (const chunk of req) {
    bytes += Buffer.byteLength(chunk);
    if (bytes > 65536) throw new Error('Body limit.');
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export function createManagerHandler(service, connection) {
  return async (req, res) => {
    const send = (code, body) => { res.writeHead(code, { 'content-type': 'application/json', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }); res.end(JSON.stringify(body)); };
    if (!['GET', 'POST'].includes(req.method)) return send(405, { error: 'Method not allowed.' });
    try {
      const rejection = admitOwnerRequest(req, connection, req.method === 'POST');
      if (rejection !== undefined) return send(rejection, { error: rejection === 401 ? 'Authentication required.' : 'Owner access and same-origin request required.' });
      if (req.method === 'GET') return send(200, await service.snapshot());
      const body = await readBody(req);
      if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !['action', 'input'].includes(key))) return send(400, { error: 'Invalid request.' });
      if (!['setEnabled', 'upsertServer', 'removeServer', 'updateHooks', 'upsertCommandHook', 'removeCommandHook', 'setCommandHookEnabled', 'probeServer'].includes(body.action) || typeof service[body.action] !== 'function') return send(400, { error: 'Invalid action.' });
      const result = await service[body.action](body.input);
      return send(result.ok ? 200 : 400, result);
    } catch (error) { return send(400, { error: safeError(error) }); }
  };
}
// Called only by Connection's exact Fetch registry, which admits the request
// and requires principal.kind === 'owner' before invoking this callback.
export function createManagerFetchHandler(service) {
  return async request => {
    const send = (status, body) => Response.json(body, { status, headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
    if (!['GET', 'POST'].includes(request.method)) return send(405, { error: 'Method not allowed.' });
    if (request.method === 'GET') return send(200, await service.snapshot());
    // Connection has already applied Host/Origin admission and owner auth.
    // The paired remote carrier intentionally strips Origin and custom headers
    // before its authenticated loopback hop; requiring either here rejects all
    // remote writes. Keep the non-simple JSON media-type fence, not a second
    // browser-origin policy based on headers this transport cannot preserve.
    if (request.headers.get('content-type') !== 'application/json') return send(403, { code: 'MANAGER_JSON_REQUIRED', error: 'JSON request required.' });
    try {
      const body = await readBody({ [Symbol.asyncIterator]: async function* () { if (request.body) yield* request.body; } });
      if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !['action', 'input'].includes(key))) return send(400, { error: 'Invalid request.' });
      if (!['setEnabled', 'upsertServer', 'removeServer', 'updateHooks', 'upsertCommandHook', 'removeCommandHook', 'setCommandHookEnabled', 'probeServer'].includes(body.action) || typeof service[body.action] !== 'function') return send(400, { error: 'Invalid action.' });
      const result = await service[body.action](body.input);
      return send(result.ok ? 200 : 400, result);
    } catch (error) { return send(400, { error: safeError(error) }); }
  };
}
export function registerLocalTransport(ctx, service) {
  ctx.inject(['connection'], webCtx => {
    const connection = webCtx.reflect.get('connection');
    connection.fetch.register({ path: MANAGERS_ROUTE, methods: ['GET', 'POST'], requestBody: 'buffered', fetch: createManagerFetchHandler(service) });
  });
}
