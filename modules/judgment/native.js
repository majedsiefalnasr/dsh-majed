import { homedir } from 'node:os';
import { resolve, join } from 'node:path';
import { createJudgmentService } from './service.js';
import { readMessage } from '../../lib/management/judgment-settings.js';

export const JUDGMENT_METHOD = 'majed/judgment/manage';
export const JUDGMENT_PATH = '/api/' + JUDGMENT_METHOD;
const only = (value, keys) => value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).every(key => keys.includes(key));
const invalid = () => { throw Object.assign(new Error('invalid_request'), { code: 'invalid_request' }); };
const errors = new Set(['invalid_request', 'invalid_configuration', 'store_unavailable', 'state_changed', 'consent_required', 'credential_required', 'invalid_decision', 'protocol_failed', 'cancelled', 'unavailable']);

export function applyJudgment(ctx, options = {}) {
  ctx.inject(['connection'], owner => {
    const service = createJudgmentService({ path: options.path || join(resolve(process.env.DSH_HOME || join(homedir(), '.dsh')), 'majed', 'judgment.json'),
      ...(options.fetch ? { fetch: options.fetch } : {}), ...(options.deadlineMs ? { deadlineMs: options.deadlineMs } : {}) });
    // Consumers call this bounded contract independently; providing it never
    // enables Smart, child routing or advisory judgments.
    owner.provide('majedJudgment', service);
    owner.effect(() => () => service.dispose(), 'dsh-majed: judgment service disposal');
    // Native exact Fetch authenticates the Owner before callback delivery,
    // including native paired-remote requests. Headers grant no authority here.
    owner.connection.fetch.register({ path: JUDGMENT_PATH, methods: ['POST'], requestBody: 'streaming', async fetch(request) {
      let rpcId;
      const send = value => Response.json(value, { headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
      try {
        if (request.method !== 'POST' || new URL(request.url).pathname !== JUDGMENT_PATH) invalid();
        const message = await readMessage(request, 16384);
        if (!only(message, ['type', 'rpcId', 'method', 'payload']) || message.type !== 'client-request' || message.method !== JUDGMENT_METHOD || typeof message.rpcId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(message.rpcId)) invalid();
        rpcId = message.rpcId; const payload = message.payload;
        if (!only(payload, ['action', 'config', 'consent'])) invalid();
        request.signal.throwIfAborted();
        let value;
        if (payload.action === 'status' && only(payload, ['action'])) value = await service.snapshot();
        else if (payload.action === 'configure' && only(payload, ['action', 'config'])) value = await service.configure(payload.config, request.signal);
        else if (payload.action === 'validate' && only(payload, ['action', 'consent'])) value = await service.validate({ consent: payload.consent, signal: request.signal });
        else invalid();
        return send({ type: 'server-response', rpcId, result: { ok: true, value } });
      } catch (error) {
        const code = errors.has(error.code) ? error.code : 'unavailable';
        return send({ type: 'server-response', rpcId, result: { ok: false, error: { code, message: code, details: {} } } });
      }
    } });
  });
}
