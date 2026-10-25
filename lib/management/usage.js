const PATH = '/api/majed/usage/status';
const METHOD = 'majed/usage/status';
const MAX_BYTES = 4096;
const json = (value, status = 200) => Response.json(value, { status, headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
const failure = (code, status) => Object.assign(new Error(code), { code, status });
const record = value => value && typeof value === 'object' && !Array.isArray(value);
const keysOnly = (value, keys) => Object.keys(value).every(key => keys.includes(key));
const identifier = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);

const USAGE_KEYS = Object.freeze(['cacheTtlMs', 'statusBarEnabled', 'warningThresholdPct', 'unknownTelemetryExclude']);

// Claude prompt-cache TTL bounds: 0 clears the setting; a positive ms value is accepted.
function cacheTtl(value) {
  if (value === undefined || value === null) return null;
  if (!Number.isInteger(value) || value < 0) throw failure('invalid_request', 400);
  return value;
}

function warningThreshold(value) {
  if (value === undefined || value === null) return 95;
  if (!Number.isInteger(value) || value < 0 || value > 100) throw failure('invalid_request', 400);
  return value;
}

// unknownTelemetryExclude is a fixed invariant: unknown telemetry never excludes a candidate.
function unknownTelemetryExclude(value) {
  if (value === undefined || value === null) return false;
  if (value !== false) throw failure('invalid_request', 400);
  return false;
}

async function readMessage(request) {
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
    void reader.cancel().catch(() => {}); reader.releaseLock();
  }
}

/** Inert, process-lifetime usage/quota readiness settings only. No real credit redemption or usage-endpoint access. */
export function apply(ctx) {
  let config = Object.freeze({
    cacheTtlMs: null,
    statusBarEnabled: true,
    warningThresholdPct: 95,
    unknownTelemetryExclude: false,
  });
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
        if (!record(payload) || !keysOnly(payload, USAGE_KEYS)) throw failure('invalid_request', 400);
        const next = { ...config };
        let changed = false;
        if ('cacheTtlMs' in payload) { next.cacheTtlMs = cacheTtl(payload.cacheTtlMs); changed = true; }
        if ('statusBarEnabled' in payload) {
          if (typeof payload.statusBarEnabled !== 'boolean') throw failure('invalid_request', 400);
          next.statusBarEnabled = payload.statusBarEnabled; changed = true;
        }
        if ('warningThresholdPct' in payload) { next.warningThresholdPct = warningThreshold(payload.warningThresholdPct); changed = true; }
        if ('unknownTelemetryExclude' in payload) { next.unknownTelemetryExclude = unknownTelemetryExclude(payload.unknownTelemetryExclude); changed = true; }
        if (changed) config = Object.freeze(next);
        return json({ type: 'server-response', rpcId, result: { ok: true, value: {
          cacheTtlMs: config.cacheTtlMs,
          statusBarEnabled: config.statusBarEnabled,
          warningThresholdPct: config.warningThresholdPct,
          unknownTelemetryExclude: config.unknownTelemetryExclude,
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
