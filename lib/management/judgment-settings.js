const PATH = '/api/majed/judgment/status';
const METHOD = 'majed/judgment/status';
const PROTOCOLS = Object.freeze(['systemone', 'decisions']);
const MAX_BYTES = 4096;
const json = (value, status = 200) => Response.json(value, { status, headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
const failure = (code, status) => Object.assign(new Error(code), { code, status });
const record = value => value && typeof value === 'object' && !Array.isArray(value);
const keysOnly = (value, keys) => Object.keys(value).every(key => keys.includes(key));
const identifier = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
// Model identifiers like "openrouter/auto" or "anthropic/claude-3-opus" contain slashes.
const modelId = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._/-]{0,126}[A-Za-z0-9]$|^[A-Za-z0-9]$/.test(value) && !value.includes('..');

// A System One address is a root URL; the client appends /v1/systemone.
// A Decisions address is the full Decisions endpoint (e.g. .../alpha/decisions).
// A bare /v1/chat/completions endpoint is not valid for either protocol.
const CHAT_COMPLETIONS = /\/v1\/chat\/completions(\?|#|$)/i;
const SYSTEM_ONE_SUFFIX = '/v1/systemone';
const VALID_HOST = /^https:\/\/[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9](:\d+)?$/;

function parseAddress(value) {
  try { return new URL(value); } catch { return null; }
}

export function isValidAddress(protocol, address) {
  const url = parseAddress(address);
  if (!url || (url.protocol !== 'https:' && url.protocol !== 'http:')) return false;
  if (!VALID_HOST.test(url.origin)) return false;
  if (CHAT_COMPLETIONS.test(url.pathname)) return false;
  if (protocol === 'decisions') {
    // A Decisions address must be a full Decisions endpoint, not a bare root.
    return /\/decisions(\?|#|$)/i.test(url.pathname);
  }
  // System One: any valid https root is acceptable; the client appends /v1/systemone.
  return true;
}

export function normalizedAddress(protocol, address) {
  const url = parseAddress(address);
  if (!url) return address;
  if (protocol === 'systemone') {
    // System One: root only; client appends /v1/systemone. If the address already
    // ends in /v1/systemone, keep it as-is (no suffix duplication).
    if (url.pathname.endsWith(SYSTEM_ONE_SUFFIX)) return url.toString();
    return url.origin;
  }
  // Decisions: keep the full endpoint as-is.
  return url.toString();
}

export async function readMessage(request, maxBytes = MAX_BYTES) {
  if (request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase() !== 'application/json') throw failure('json_required', 415);
  if (Number(request.headers.get('content-length')) > maxBytes) throw failure('body_too_large', 413);
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
      if (size > maxBytes) throw failure('body_too_large', 413);
      chunks.push(value);
    }
    request.signal.throwIfAborted();
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { throw failure('invalid_request', 400); }
  } finally {
    clearTimeout(timer); request.signal.removeEventListener('abort', onAbort);
    void reader.cancel().catch(() => {}); reader.releaseLock();
  }
}

/** Inert, process-lifetime judgment service settings only. No credential storage, no live inference. */
export function apply(ctx) {
  let config = Object.freeze({ protocol: undefined, address: undefined, model: undefined, credentialConfigured: false });
  ctx.inject(['connection'], owner => {
    owner.connection.fetch.register({ path: PATH, methods: ['POST'], requestBody: 'streaming', async fetch(request) {
      let rpcId;
      try {
        if (new URL(request.url).pathname !== PATH) throw failure('not_found', 404);
        if (request.method !== 'POST') throw failure('method_not_allowed', 405);
        const message = await readMessage(request);
        if (!record(message) || !keysOnly(message, ['type', 'rpcId', 'method', 'payload']) || message.type !== 'client-request' || message.method !== METHOD || !identifier(message.rpcId)) throw failure('invalid_request', 400);
        rpcId = message.rpcId;
        const payload = message.payload;
        if (!record(payload) || !keysOnly(payload, ['protocol', 'address', 'model', 'credentialConfigured'])) throw failure('invalid_request', 400);
        const next = { ...config };
        let changed = false;
        if ('protocol' in payload) {
          if (payload.protocol !== undefined && !PROTOCOLS.includes(payload.protocol)) throw failure('invalid_request', 400);
          if (payload.protocol !== config.protocol) { next.protocol = payload.protocol; changed = true; }
        }
        if ('address' in payload) {
          if (payload.address !== undefined) {
            if (typeof payload.address !== 'string' || !payload.address) throw failure('invalid_request', 400);
            if (!isValidAddress(next.protocol, payload.address)) throw failure('invalid_request', 400);
            next.address = normalizedAddress(next.protocol, payload.address);
          } else { next.address = undefined; }
          changed = true;
        }
        if ('model' in payload) {
          if (payload.model !== undefined) {
            if (typeof payload.model !== 'string' || !modelId(payload.model)) throw failure('invalid_request', 400);
            next.model = payload.model;
          } else { next.model = undefined; }
          changed = true;
        }
        if ('credentialConfigured' in payload) {
          if (typeof payload.credentialConfigured !== 'boolean') throw failure('invalid_request', 400);
          next.credentialConfigured = payload.credentialConfigured;
          changed = true;
        }
        if (changed) config = Object.freeze(next);
        return json({ type: 'server-response', rpcId, result: { ok: true, value: {
          protocol: config.protocol ?? null,
          addressConfigured: config.address !== undefined,
          modelConfigured: config.model !== undefined,
          credentialConfigured: config.credentialConfigured,
          capabilities: [],
        } } });
      } catch (error) {
        if (request.signal.aborted) return json({ error: 'cancelled' }, 408);
        const code = error.status ? error.code : 'service_unavailable';
        if (rpcId) return json({ type: 'server-response', rpcId, result: { ok: false, error: { code, message: code, details: {} } } });
        return json({ error: code }, error.status || 503);
      }
    } });
  });
}
