import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { readMessage } from '../../lib/management/judgment-settings.js';
import { createPolicySettingsStore, POLICY_FIELDS, policyDefaults } from './settings.js';
const PATH = '/api/majed/command-policy';
const METHOD = 'majed/command-policy';
const record = value => value && typeof value === 'object' && !Array.isArray(value);
const keysOnly = (value, keys) => Object.keys(value).every(key => keys.includes(key));
const identifier = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
const failure = (code, status) => Object.assign(new Error(code), { code, status });
const json = (value, status = 200) => Response.json(value, { status, headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
/** Exact Fetch registration delegates BrowserAuth/Owner admission to DSH. Never exposes evaluate. */
export function applyPolicySettings(ctx, options = {}) {
  const store = createPolicySettingsStore(resolve(options.path || join(process.env.DSH_HOME || join(homedir(), '.dsh'), 'majed', 'command-policy.json')));
  let config = Object.freeze({ ...policyDefaults(), settingsInvalid: true });
  // Load only on Owner access: merely mounting the plugin performs no file I/O.
  let ready;
  const load = () => ready ??= store.read().then(value => { config = value; }).catch(() => {});
  ctx.inject(['connection'], owner => {
    owner.connection.fetch.register({ path: PATH, methods: ['POST'], requestBody: 'streaming', async fetch(request) {
      let rpcId;
      try {
        if (new URL(request.url).pathname !== PATH) throw failure('not_found', 404);
        if (request.method !== 'POST') throw failure('method_not_allowed', 405);
        const message = await readMessage(request, 65536);
        if (!record(message) || !keysOnly(message, ['type', 'rpcId', 'method', 'payload']) || message.type !== 'client-request' || message.method !== METHOD || !identifier(message.rpcId)) throw failure('invalid_request', 400);
        rpcId = message.rpcId;
        const payload = message.payload;
        const actions = { snapshot: [], set: ['field', 'value'], reset: ['field'], ledger: ['sessionId'] };
        if (!record(payload) || !Object.hasOwn(actions, payload.action) || !keysOnly(payload, ['action', ...actions[payload.action]])) throw failure('invalid_request', 400);
        await load();
        if (payload.action === 'ledger') {
          if (!identifier(payload.sessionId)) throw failure('invalid_request', 400);
          return json({ type: 'server-response', rpcId, result: { ok: true, value: { ledger: options.ledger?.redacted(payload.sessionId) ?? { counts: {}, entries: [] } } } });
        }
        if (payload.action !== 'snapshot') {
          if (!POLICY_FIELDS.includes(payload.field)) throw failure('invalid_request', 400);
          if (payload.action === 'set') await store.set(payload.field, payload.value, request.signal);
          else await store.reset(payload.field, request.signal);
        }
        config = await store.read();
        return json({ type: 'server-response', rpcId, result: { ok: true, value: { settings: config, nativeConsumption: false } } });
      } catch (error) {
        if (request.signal.aborted) return json({ error: 'cancelled' }, 408);
        const allowed = ['not_found', 'method_not_allowed', 'invalid_request', 'json_required', 'body_too_large', 'request_timeout', 'cancelled'];
        const code = allowed.includes(error.code) ? error.code : 'service_unavailable';
        if (rpcId) return json({ type: 'server-response', rpcId, result: { ok: false, error: { code, message: code, details: {} } } });
        return json({ error: code }, allowed.includes(error.code) ? error.status : 503);
      }
    } });
  });
  return { settings: () => config };
}
