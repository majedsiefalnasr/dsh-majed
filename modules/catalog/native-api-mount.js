// Mount for native API model references (S15): an Owner-admitted exact Fetch route
// over createNativeApiReferences plus a private preference file. Preferences are
// keyed by native {provider, model} only; no provider settings, endpoint or
// credential is read, copied or stored. Nothing here activates, routes or enrolls a model.
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { lstat } from 'node:fs/promises';
import { readMessage } from '../../lib/management/settings.js';
import { createPrivateStore } from '../subscriptions/codex/storage.js';
import { createNativeApiReferences } from './native-api.js';

export const NATIVE_API_METHOD = 'majed/native-api';
export const NATIVE_API_PATH = '/api/' + NATIVE_API_METHOD;
const MAX_PREFERENCES = 256;
const MAX_STORE_BYTES = 262144;
const ID = /^[^\u0000-\u001f\u007f]{1,256}$/;
const ALIAS = /^[^\u0000-\u001f\u007f]{1,64}$/;
const ACTIONS = { snapshot: [], setPreference: ['provider', 'model', 'alias', 'visible', 'default'], clearPreference: ['provider', 'model'] };
const record = value => value && typeof value === 'object' && !Array.isArray(value);
const keysOnly = (value, keys) => Object.keys(value).every(key => keys.includes(key));
const failure = (code, status) => Object.assign(new Error(code), { code, status });
const json = (value, status = 200) => Response.json(value, { status, headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
const same = (a, b) => a.provider === b.provider && a.model === b.model;

function validPreferences(value) {
  if (!record(value) || value.version !== 1 || !Array.isArray(value.preferences) || value.preferences.length > MAX_PREFERENCES) return false;
  let defaults = 0; const seen = new Set();
  for (const p of value.preferences) {
    if (!record(p) || !keysOnly(p, ['provider', 'model', 'alias', 'visible', 'default']) || !ID.test(p.provider) || !ID.test(p.model)
      || (p.alias !== undefined && !(typeof p.alias === 'string' && ALIAS.test(p.alias))) || typeof p.visible !== 'boolean' || typeof p.default !== 'boolean') return false;
    const key = JSON.stringify([p.provider, p.model]);
    if (seen.has(key)) return false; seen.add(key);
    if (p.default) defaults += 1;
  }
  return defaults <= 1;
}

/** Reuses the Codex private-store helper (0600 atomic write, one writer queue per file, unsafe/corrupt refusal). */
export function createNativeApiPreferenceStore(path) {
  const store = createPrivateStore(path, { empty: () => ({ version: 1, preferences: [] }), validate: validPreferences });
  return {
    /** Never throws for a bad file: corruption reads as an explicit empty status. */
    async read() {
      try {
        const info = await lstat(path).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
        if (info && info.size > MAX_STORE_BYTES) return { status: 'corrupt', preferences: [] };
        return { status: 'ok', preferences: (await store.load()).preferences };
      } catch (error) { return { status: error.code === 'unsafe_account_store' ? 'unsafe' : 'corrupt', preferences: [] }; }
    },
    update: change => store.transaction(data => change(data)),
  };
}

export function applyNativeApiReferences(ctx, options = {}) {
  let disposed = false, llm, hold;
  const path = resolve(options.path || join(process.env.DSH_HOME || join(homedir(), '.dsh'), 'majed', 'native-api-preferences.json'));
  const store = createNativeApiPreferenceStore(path);
  const refsFor = (preferences, signal) => {
    signal?.throwIfAborted();
    try { return createNativeApiReferences({}, { llm, preferences, timeoutMs: options.timeoutMs }); } catch { throw failure('llm_unavailable', 200); }
  };

  async function snapshot(signal) {
    const stored = await store.read();
    let references = [], unavailable = [], state = 'unavailable';
    try {
      const refs = refsFor(stored.preferences, signal);
      try {
        await refs.refresh(); signal.throwIfAborted();
        const snap = refs.snapshot(); state = 'ready';
        references = snap.providers.flatMap(p => p.models.map(m => ({ provider: m.provider, providerName: p.name, model: m.model, name: m.name,
          ...(m.alias === undefined ? {} : { alias: m.alias }), visible: m.visible, default: m.default, available: true })));
        unavailable = snap.unavailable.map(m => ({ provider: m.provider, model: m.model, ...(m.alias === undefined ? {} : { alias: m.alias }), visible: m.visible, default: m.default, available: false, reason: m.reason }));
      } finally { refs.dispose(); }
    } catch (error) {
      if (error.code !== 'llm_unavailable') throw error;
      unavailable = stored.preferences.map(p => ({ ...p, available: false, reason: 'service-unavailable' }));
    }
    return { state, store: stored.status, references, unavailable };
  }

  async function mutate(payload, signal) {
    if (!llm) throw failure('llm_unavailable', 200);
    if (payload.action === 'setPreference') {
      // Only a reference the native service lists right now can be given a preference.
      const refs = refsFor([], signal);
      try { await refs.refresh(); signal.throwIfAborted(); if (!refs.snapshot().providers.some(p => p.id === payload.provider && p.models.some(m => m.model === payload.model))) throw failure('unknown_reference', 200); }
      finally { refs.dispose(); }
    }
    const stored = await store.read();
    if (stored.status !== 'ok') throw failure('store_' + stored.status, 200);
    signal.throwIfAborted();
    await store.update(data => {
      if (payload.action === 'clearPreference') { data.preferences = data.preferences.filter(p => !same(p, payload)); return; }
      const refs = refsFor(data.preferences);
      try {
        const change = {};
        if ('visible' in payload) change.visible = payload.visible;
        if ('default' in payload) change.default = payload.default;
        if ('alias' in payload) change.alias = payload.alias === null ? undefined : payload.alias;
        refs.setPreference(payload.provider, payload.model, change);
        data.preferences = refs.preferences();
      } finally { refs.dispose(); }
      if (data.preferences.length > MAX_PREFERENCES) throw failure('store_full', 200);
    }, { signal });
  }

  ctx.inject(['connection'], owner => {
    disposed = false;
    owner.inject(['llm'], llmOwner => {
      llm = llmOwner.llm;
      llmOwner.effect(() => () => { llm = undefined; }, 'dsh-majed: native API references LLM availability');
    });
    owner.effect(() => () => { disposed = true; llm = undefined; }, 'dsh-majed: native API references lifecycle');
    // Exact native Fetch registration: DSH supplies BrowserAuth + Owner admission and Host/Origin fences before delivery.
    owner.connection.fetch.register({ path: NATIVE_API_PATH, methods: ['POST'], requestBody: 'streaming', async fetch(request) {
      let rpcId;
      try {
        if (disposed) throw failure('unavailable', 503);
        if (new URL(request.url).pathname !== NATIVE_API_PATH) throw failure('not_found', 404);
        if (request.method !== 'POST') throw failure('method_not_allowed', 405);
        const message = await readMessage(request);
        if (!record(message) || !keysOnly(message, ['type', 'rpcId', 'method', 'payload']) || message.type !== 'client-request' || message.method !== NATIVE_API_METHOD || typeof message.rpcId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(message.rpcId)) throw failure('invalid_request', 400);
        rpcId = message.rpcId;
        const payload = message.payload;
        if (!record(payload) || !Object.hasOwn(ACTIONS, payload.action) || !keysOnly(payload, ['action', ...ACTIONS[payload.action]])) throw failure('invalid_request', 400);
        if (payload.action !== 'snapshot') {
          if (typeof payload.provider !== 'string' || typeof payload.model !== 'string' || !ID.test(payload.provider) || !ID.test(payload.model)
            || ('alias' in payload && payload.alias !== null && !(typeof payload.alias === 'string' && ALIAS.test(payload.alias.trim())))
            || ['visible', 'default'].some(name => name in payload && typeof payload[name] !== 'boolean')) throw failure('invalid_request', 400);
          if (typeof payload.alias === 'string') payload.alias = payload.alias.trim();
          const prior = hold ?? Promise.resolve();
          const task = prior.catch(() => {}).then(() => mutate(payload, request.signal)); hold = task;
          try { await task; } finally { if (hold === task) hold = undefined; }
        }
        return json({ type: 'server-response', rpcId, result: { ok: true, value: await snapshot(request.signal) } });
      } catch (error) {
        if (request.signal.aborted) return json({ error: 'cancelled' }, 408);
        // Never serialize native exception messages, paths, stack or credentials.
        const code = error.code && (error.status || error.code === 'llm_unavailable' || error.code.startsWith('store_') || error.code === 'unknown_reference') ? error.code : 'service_unavailable';
        if (rpcId) return json({ type: 'server-response', rpcId, result: { ok: false, error: { code, message: code, details: {} } } });
        return json({ error: code }, error.status || 503);
      }
    } });
  });
}
