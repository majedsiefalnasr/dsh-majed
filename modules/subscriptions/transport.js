// Owner-admitted Fetch RPC transport for the integrated subscription adapters.
// Connection's exact Fetch registration authenticates the owner; origin/custom
// headers are supplemental CSRF checks, never authentication.

import { safeError } from '../managers/validation.js';

export const SUBSCRIPTIONS_ROUTE = '/api/dsh-majed/subscriptions';

async function readBody(req) {
  const chunks = []; let bytes = 0;
  for await (const chunk of req) {
    bytes += Buffer.byteLength(chunk);
    if (bytes > 65536) throw new Error('Body limit.');
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export function createSubscriptionsFetchHandler(service) {
  return async request => {
    const send = (status, body) => Response.json(body, { status, headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'content-type': 'application/json' } });
    if (!['GET', 'POST'].includes(request.method)) return send(405, { error: 'Method not allowed.' });
    if (request.method === 'GET') return send(200, service.snapshot());
    // Connection has already applied Owner admission.
    if (request.headers.get('content-type') !== 'application/json') return send(403, { code: 'SUBSCRIPTIONS_JSON_REQUIRED', error: 'JSON request required.' });
    try {
      const body = await readBody({ [Symbol.asyncIterator]: async function* () { if (request.body) yield* request.body; } });
      if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !['action', 'input'].includes(key)))
        return send(400, { error: 'Invalid request.' });
      if (!['snapshot'].includes(body.action) || typeof service[body.action] !== 'function')
        return send(400, { error: 'Invalid action.' });
      const result = await service[body.action](body.input);
      return send(200, { ok: true, ...result });
    } catch (error) { return send(400, { error: safeError(error) }); }
  };
}

export function registerLocalTransport(ctx, service) {
  ctx.inject(['connection'], webCtx => {
    const connection = webCtx.reflect?.get('connection');
    if (!connection || typeof connection.fetch?.register !== 'function') return;
    connection.fetch.register({ path: SUBSCRIPTIONS_ROUTE, methods: ['GET', 'POST'], requestBody: 'streaming', fetch: createSubscriptionsFetchHandler(service) });
  });
}
