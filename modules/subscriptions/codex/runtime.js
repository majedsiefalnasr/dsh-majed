import { LlmAdapter, LlmError, attributionHeaders, bindHostLlm } from './upstream/host-llm.js';
import { createHash } from 'node:crypto';
import { createPrivateStore } from './storage.js';
import { fetchCodexModels, codexRequestBody, projectCodexMessages } from './upstream/providers/codex-helpers.js';
import { resolveImages } from './upstream/translate/resolved.js';
import { toResponsesInput, streamResponses } from './upstream/translate/responses.js';
import { idleWatchdog, httpLlmError } from './upstream/providers/common.js';
import { subscriptionRetryPolicy, DEFAULT_RETRY, DEFAULT_RATE_LIMIT_WAIT, jsonBody, resetFromFields } from './upstream/providers/rate-limit.js';
import { startCatalogRefresh } from './upstream/providers/catalog-refresh.js';

const endpoint = 'https://chatgpt.com/backend-api/codex/responses';
const prefix = '~account:';
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const only = (value, keys) => object(value) && Object.keys(value).every(key => keys.includes(key));
const identifier = value => typeof value === 'string' && value.length > 0 && value.length <= 512 && !value.startsWith(prefix) && !/[\u0000-\u001f]/.test(value);
const positive = value => Number.isSafeInteger(value) && value > 0 && value <= 10000000;
const failure = code => new LlmError('Codex operation unavailable.', code);
const staticModels = ['gpt-5.1-codex', 'gpt-5.1-codex-mini', 'gpt-5.1'].map(id => ({ id, name: id,
  contextWindow: 400000, maxTokens: 128000, inputModalities: ['text', 'image'],
  reasoning: { efforts: ['minimal', 'low', 'medium', 'high', 'xhigh'].map(id => ({ id, name: id })), defaultEffort: 'high' } }));
export const accountModelId = (account, model) => `${prefix}${encodeURIComponent(account)}:${encodeURIComponent(model)}`;
function parseModel(id) {
  if (!id.startsWith(prefix)) return { model: id };
  const parts = id.slice(prefix.length).split(':');
  try {
    const [account, model] = parts.map(decodeURIComponent);
    if (parts.length !== 2 || !account || !model || accountModelId(account, model) !== id) throw Error();
    return { account, model };
  } catch { throw failure('NO_ADAPTER'); }
}
async function bounded(work, signal) {
  signal?.throwIfAborted(); let abort;
  try { return await Promise.race([work, new Promise((_, reject) => { abort = () => reject(failure('ABORTED')); signal?.addEventListener('abort', abort, { once: true }); })]); }
  finally { signal?.removeEventListener('abort', abort); }
}
function guardedBody(stream, signal) {
  const reader = stream.getReader();
  let released = false;
  const close = () => { if (!released) { released = true; void reader.cancel().catch(() => {}); reader.releaseLock(); } };
  return new ReadableStream({ async pull(controller) {
    try { const next = await bounded(reader.read(), signal); if (next.done) { controller.close(); close(); } else controller.enqueue(next.value); }
    catch (error) { controller.error(error); close(); }
  }, cancel() { close(); } });
}

/** Account-bound adapter. Only the external provider transport is injectable. */
export async function createCodexRuntime({ accounts, llm, llmModule, path, fetch: transport = globalThis.fetch, resolveAttachments = () => undefined, streamIdleTimeoutMs = 30000, clientVersion } = {}) {
  bindHostLlm(llmModule);
  if (!accounts || !llm?.registerAdapter || !path) throw failure('NO_ADAPTER');
  const store = createPrivateStore(path, { empty: () => ({ version: 1, preferences: {}, catalogs: {} }),
    validate: value => value?.version === 1 && object(value.preferences) && object(value.catalogs) });
  const cache = new Map(), speedBySession = new Map(), lifecycle = new AbortController();
  let disposed = false, generation = 0, registration;
  const live = () => { if (disposed) throw failure('NO_ADAPTER'); };
  const snapshotAccounts = async () => (await accounts.snapshot()).accounts.filter(a => a.state === 'connected');
  const notify = () => { generation++; cache.clear(); registration?.replace(['codex']); };
  // Revocation epochs are route-scoped and monotonic. Publish before mutation
  // persistence yields: a failed write may conservatively reject an old call,
  // but no committed revocation can race a held snapshot into a send.
  const accountEpochs = new Map(), consentEpochs = new Map();
  const bump = (epochs, key) => epochs.set(key, (epochs.get(key) || 0) + 1);
  // Streams already in flight are cancelled cooperatively when their account is revoked (pause, sign-out, removal, reauthentication).
  const inflight = new Map();
  const unsubscribe = accounts.subscribe(event => {
    if (event?.revoked) { bump(accountEpochs, event.revoked); for (const controller of inflight.get(event.revoked) || []) controller.abort(); }
    notify();
  });
  async function catalog(account, signal) {
    live(); signal?.throwIfAborted();
    const key = account.id;
    if (cache.has(key)) return bounded(cache.get(key), signal);
    const epoch = generation;
    const work = (async () => {
      const persisted = await store.load(), preferences = persisted.preferences;
      if (preferences.manualModels) return { models: preferences.manualModels, source: 'manual' };
      const combined = AbortSignal.any([lifecycle.signal, AbortSignal.timeout(10000)]);
      try {
        let session = await bounded(accounts.session(key, { signal: combined }), combined);
        let models;
        try { models = await bounded(fetchCodexModels(session, transport, combined, clientVersion), combined); }
        catch (error) {
          if (error.status !== 401) throw error;
          // Preserve upstream discovery's one forced-refresh retry. Rejected
          // credentials never turn into a synthetic successful catalog.
          session = await bounded(accounts.session(key, { force: true, signal: combined }), combined);
          models = await bounded(fetchCodexModels(session, transport, combined, clientVersion), combined);
        }
        live();
        if (epoch !== generation || !(await snapshotAccounts()).some(a => a.id === key)) throw failure('STATE_CHANGED');
        await store.transaction(data => { data.catalogs[key] = { models, savedAt: Date.now() }; }, { signal: lifecycle.signal });
        return { models, source: 'discovered' };
      } catch (error) {
        live(); combined.throwIfAborted();
        if (['reauthentication_required', 'STATE_CHANGED'].includes(error.code)) throw error;
        if (error.status === 401 || error.status === 403) return { models: [], source: 'unavailable', failed: true };
        // A durable account-specific catalog beats the reviewed static fallback.
        return { models: persisted.catalogs[key]?.models || staticModels, source: persisted.catalogs[key] ? 'cached' : 'static', failed: true };
      }
    })();
    cache.set(key, work);
    try { return await bounded(work, signal); } catch (error) { cache.delete(key); throw error; }
  }
  async function available(signal) {
    const entries = await snapshotAccounts();
    const result = [];
    for (const account of entries) result.push({ account, ...(await catalog(account, signal)) });
    return result;
  }
  async function binding(id, signal) {
    live(); const parsed = parseModel(id);
    const accountVersions = new Map(accountEpochs), consentVersion = consentEpochs.get(parsed.account) || 0;
    const data = await store.load(), entries = await available(signal);
    const prefs = data.preferences, accountPrefs = prefs.accounts || {};
    let entry;
    if (parsed.account) {
      entry = entries.find(e => e.account.id === parsed.account && accountPrefs[parsed.account]?.independentEntry === true && e.models.some(m => m.id === parsed.model));
    } else {
      entry = entries.find(e => e.account.default && e.models.some(m => m.id === parsed.model))
        || entries.find(e => e.models.some(m => m.id === parsed.model));
      // Unlisted exact IDs remain queryable, but an account-only model already
      // known to belong to a removed account must never migrate to the default.
      const knownAccountOnly = Object.values(data.catalogs).some(catalog => catalog.models.some(model => model.id === parsed.model));
      if (!entry && !knownAccountOnly) entry = entries.find(e => e.account.default);
    }
    if (!entry) throw failure('NO_ADAPTER');
    const model = entry.models.find(m => m.id === parsed.model);
    const modelPref = prefs.models?.[parsed.model] || {};
    const reasoning = model?.reasoning ? structuredClone(model.reasoning) : undefined;
    if (reasoning && modelPref.defaultEffort && reasoning.efforts.some(e => e.id === modelPref.defaultEffort)) reasoning.defaultEffort = modelPref.defaultEffort;
    const contextWindow = model?.contextWindow && Math.min(modelPref.contextWindow || model.contextWindow, model.maxContextWindow || model.contextWindow);
    const info = { provider: 'codex', id, name: modelPref.name || model?.name || parsed.model,
      ...(model?.inputModalities ? { inputModalities: model.inputModalities } : {}),
      ...(contextWindow ? { context: { contextWindow } } : {}), ...(model?.maxTokens ? { defaultMaxTokens: model.maxTokens } : {}), ...(reasoning ? { reasoning } : {}) };
    const accountAlias = accountPrefs[entry.account.id]?.alias || entry.account.label;
    if (parsed.account) info.name = `${accountAlias} · ${info.name}`;
    return { id, model: parsed.model, account: entry.account.id, info, fast: model?.fastTier === true,
      accountEpoch: accountVersions.get(entry.account.id) || 0, consentEpoch: consentVersion };
  }
  async function* streamBound(bound, options) {
    live(); options.signal?.throwIfAborted();
    const data = await store.load();
    if (!(await snapshotAccounts()).some(a => a.id === bound.account)
      || (bound.id.startsWith(prefix) && data.preferences.accounts?.[bound.account]?.independentEntry !== true)) throw failure('NO_ADAPTER');
    const revocation = new AbortController(), group = inflight.get(bound.account) || new Set();
    group.add(revocation); inflight.set(bound.account, group);
    const watchdog = idleWatchdog(AbortSignal.any([lifecycle.signal, revocation.signal, ...(options.signal ? [options.signal] : [])]), streamIdleTimeoutMs);
    try {
      const request = async force => {
        const session = await bounded(accounts.session(bound.account, { force, signal: watchdog.signal }), watchdog.signal);
        const messages = await bounded(resolveImages(projectCodexMessages(options.messages), resolveAttachments(), watchdog.signal), watchdog.signal);
        const key = createHash('sha256').update(JSON.stringify(['codex', bound.account, bound.model])).digest('hex');
        const reasoningFor = callId => {
          const message = messages.find(message => message.role === 'assistant' && message.content.some(block => block.type === 'tool-call' && String(block.id) === callId));
          const replay = message?.source?.replayState?.response;
          return replay?.kind === 'majed-codex-replay' && replay.version === 1 && replay.key === key ? replay.items : undefined;
        };
        const body = codexRequestBody({ ...options, model: bound.model }, toResponsesInput(messages, options.system, reasoningFor), bound.fast && speedBySession.get(options.sessionId) === 'fast');
        // Credential refresh and attachment reads can outlive Owner revocation.
        // Revalidate the bound route for every send, including a 401 retry.
        const latest = await bounded(store.load(), watchdog.signal);
        if (!(await bounded(snapshotAccounts(), watchdog.signal)).some(a => a.id === bound.account)
          || (bound.id.startsWith(prefix) && latest.preferences.accounts?.[bound.account]?.independentEntry !== true)) throw failure('NO_ADAPTER');
        watchdog.signal.throwIfAborted(); live();
        return bounded(Promise.resolve().then(() => {
          watchdog.signal.throwIfAborted(); live();
          if ((accountEpochs.get(bound.account) || 0) !== bound.accountEpoch
            || (bound.id.startsWith(prefix) && (consentEpochs.get(bound.account) || 0) !== bound.consentEpoch)) throw failure('NO_ADAPTER');
          return transport(endpoint, { method: 'POST', signal: watchdog.signal, redirect: 'error', headers: {
          authorization: `Bearer ${session.accessToken}`, 'chatgpt-account-id': session.accountId, originator: 'codex_cli_rs',
          'session-id': createHash('sha256').update(String(options.sessionId || '')).digest('hex'), accept: 'text/event-stream', 'content-type': 'application/json', ...attributionHeaders(),
        }, body: JSON.stringify(body) });
        }), watchdog.signal);
      };
      let response = await request(false);
      if (response.status === 401) { void response.body?.cancel().catch(() => {}); response = await request(true); }
      if (!response.ok) throw await bounded(httpLlmError(response, 'Codex', { rateLimitReset: (response, body, now) => resetFromFields(jsonBody(body), ['resets_in_seconds', 'reset_after_seconds', 'resets_at', 'reset_at'], now) }), watchdog.signal);
      if (!response.body) throw failure('EMPTY_RESPONSE');
      let reasoningItems = [];
      const chunks = streamResponses(guardedBody(response.body, watchdog.signal), () => watchdog.pulse(), event => {
        if (event.type === 'response.completed') reasoningItems = (event.response?.output || []).filter(item => item.type === 'reasoning' && typeof item.encrypted_content === 'string');
        return event;
      });
      for await (const chunk of chunks) {
        if (chunk.type === 'finish' && chunk.reason.kind !== 'error' && reasoningItems.length) yield { ...chunk, replayState: { response: {
          kind: 'majed-codex-replay', version: 1, key: createHash('sha256').update(JSON.stringify(['codex', bound.account, bound.model])).digest('hex'), items: reasoningItems,
        } } };
        else yield chunk;
      }
    } catch (error) {
      const allowed = ['AUTH', 'RATE_LIMIT', 'QUOTA', 'CONTEXT_WINDOW_EXCEEDED', 'EMPTY_RESPONSE', 'INVALID_REQUEST', 'NO_ADAPTER', 'UNSUPPORTED', 'TIMEOUT', 'SERVER', 'MALFORMED_RESPONSE', 'STREAM_CLOSED', 'INVALID_CREDENTIAL'];
      const code = watchdog.timedOut() ? 'TIMEOUT' : revocation.signal.aborted && !options.signal?.aborted ? 'NO_ADAPTER' : watchdog.signal.aborted ? 'ABORTED' : error.code === 'reauthentication_required' ? 'AUTH'
        : allowed.includes(error.code) || /^HTTP_[1-5][0-9]{2}$/.test(error.code) ? error.code : 'TRANSPORT';
      throw new LlmError('Codex request failed.', code,
        { ...(Number.isInteger(error.status) ? { status: error.status } : {}), ...(Number.isFinite(error.providerRetryAfterMs) ? { providerRetryAfterMs: error.providerRetryAfterMs } : {}) });
    } finally { watchdog.stop(); group.delete(revocation); if (!group.size) inflight.delete(bound.account); }
  }
  class CodexDirectAdapter extends LlmAdapter {
    providerInfo(provider) { return { id: provider, name: 'Codex (Subscription)' }; }
    providerRetryPolicy(provider) { return subscriptionRetryPolicy(DEFAULT_RETRY, DEFAULT_RATE_LIMIT_WAIT, `codex: ${provider}`); }
    async listModels(provider) {
      const data = await store.load(), result = new Map();
      for (const entry of await available()) for (const model of entry.models) {
        const pref = data.preferences.models?.[model.id] || {}, accountPref = data.preferences.accounts?.[entry.account.id] || {};
        if (pref.hidden) continue;
        if (!result.has(model.id)) result.set(model.id, { provider, id: model.id, name: pref.name || model.name });
        if (accountPref.independentEntry) { const id = accountModelId(entry.account.id, model.id); result.set(id, { provider, id, name: `${accountPref.alias || entry.account.label} · ${pref.name || model.name}` }); }
      }
      return [...result.values()];
    }
    async resolveModel(provider, id, signal) { return (await binding(id, signal)).info; }
    async prepareCall(provider, id, signal) {
      const bound = await binding(id, signal);
      return { model: bound.info, stream: options => streamBound(bound, options) };
    }
    async *stream(options) { yield* streamBound(await binding(options.model, options.signal), options); }
  }
  const adapter = new CodexDirectAdapter();
  try { registration = llm.registerAdapter(['codex'], adapter); }
  catch (error) { unsubscribe(); throw error; }
  const stopRefresh = startCatalogRefresh(async signal => {
    live(); generation++; cache.clear(); await available(signal); live(); registration.replace(['codex']);
  });
  return { adapter, async snapshot() {
      live(); const data = await store.load(), entries = await available();
      return { enabled: true, autoEnrolled: false, models: await adapter.listModels('codex'), preferences: data.preferences,
        catalogs: entries.map(entry => ({ account: entry.account.id, source: entry.source, failed: !!entry.failed, models: entry.models })) };
    },
    async configure(input) {
      live();
      if (!only(input, ['model', 'hidden', 'name', 'defaultEffort', 'contextWindow', 'account', 'independentEntry', 'alias', 'manualModels'])) throw failure('INVALID_REQUEST');
      if ('manualModels' in input) {
        if (Object.keys(input).length !== 1 || (input.manualModels !== null && (!Array.isArray(input.manualModels) || !input.manualModels.length || input.manualModels.length > 64))) throw failure('INVALID_REQUEST');
        const seen = new Set();
        for (const model of input.manualModels || []) {
          if (!only(model, ['id', 'name', 'contextWindow', 'maxContextWindow', 'maxTokens', 'inputModalities', 'reasoning', 'fastTier']) || !identifier(model.id) || seen.has(model.id)
            || ('name' in model && (typeof model.name !== 'string' || !model.name || model.name.length > 128))
            || ['contextWindow', 'maxContextWindow', 'maxTokens'].some(key => key in model && !positive(model[key]))
            || ('inputModalities' in model && (!Array.isArray(model.inputModalities) || !model.inputModalities.length || model.inputModalities.some(m => !['text', 'image'].includes(m))))
            || ('fastTier' in model && typeof model.fastTier !== 'boolean')) throw failure('INVALID_REQUEST');
          if (model.reasoning && (!only(model.reasoning, ['efforts', 'defaultEffort']) || !Array.isArray(model.reasoning.efforts) || !model.reasoning.efforts.length || model.reasoning.efforts.length > 16
            || model.reasoning.efforts.some(e => !only(e, ['id', 'name']) || !identifier(e.id) || typeof e.name !== 'string' || !e.name || e.name.length > 64)
            || new Set(model.reasoning.efforts.map(e => e.id)).size !== model.reasoning.efforts.length
            || (model.reasoning.defaultEffort && !model.reasoning.efforts.some(e => e.id === model.reasoning.defaultEffort)))) throw failure('INVALID_REQUEST');
          seen.add(model.id);
        }
        await store.transaction(data => { if (input.manualModels === null) delete data.preferences.manualModels; else data.preferences.manualModels = structuredClone(input.manualModels); }, { signal: lifecycle.signal });
      } else if ('account' in input) {
        if (!only(input, ['account', 'independentEntry', 'alias']) || !(await snapshotAccounts()).some(a => a.id === input.account)
          || ('independentEntry' in input && typeof input.independentEntry !== 'boolean') || ('alias' in input && (typeof input.alias !== 'string' || input.alias.length > 128))) throw failure('INVALID_REQUEST');
        let revoked = false;
        await store.transaction(data => {
          revoked = input.independentEntry === false && data.preferences.accounts?.[input.account]?.independentEntry === true;
          if (revoked) bump(consentEpochs, input.account);
          data.preferences.accounts ||= {}; data.preferences.accounts[input.account] = { ...data.preferences.accounts[input.account], ...input }; delete data.preferences.accounts[input.account].account; }, { signal: lifecycle.signal });
        // Also fence calls prepared against old durable state while the write
        // was pending; the early epoch alone cannot distinguish those calls.
        if (revoked) bump(consentEpochs, input.account);
      } else {
        if (!only(input, ['model', 'hidden', 'name', 'defaultEffort', 'contextWindow']) || !identifier(input.model) || ('hidden' in input && typeof input.hidden !== 'boolean') || ('name' in input && (typeof input.name !== 'string' || input.name.length > 128))
          || ('contextWindow' in input && input.contextWindow !== null && !positive(input.contextWindow))
          || ('defaultEffort' in input && input.defaultEffort !== null && !identifier(input.defaultEffort))) throw failure('INVALID_REQUEST');
        const catalogs = await available(), model = catalogs.flatMap(e => e.models).find(m => m.id === input.model);
        if (!model || (input.defaultEffort && !model.reasoning?.efforts.some(e => e.id === input.defaultEffort))
          || (input.contextWindow && input.contextWindow > (model.maxContextWindow || model.contextWindow || 0))) throw failure('INVALID_REQUEST');
        await store.transaction(data => { data.preferences.models ||= {}; data.preferences.models[input.model] = { ...data.preferences.models[input.model], ...input }; delete data.preferences.models[input.model].model; }, { signal: lifecycle.signal });
      }
      notify(); return this.snapshot();
    },
    async speed(sessionId) {
      live(); if (typeof sessionId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(sessionId)) throw failure('INVALID_REQUEST');
      const data = await store.load(), fastModels = new Set();
      for (const entry of await available()) for (const model of entry.models) if (model.fastTier) {
        fastModels.add(model.id);
        if (data.preferences.accounts?.[entry.account.id]?.independentEntry) fastModels.add(accountModelId(entry.account.id, model.id));
      }
      return { tier: speedBySession.get(sessionId) || 'standard', fastModels: [...fastModels], runtimeEnabled: true };
    },
    async setSpeed(sessionId, tier) {
      live(); if (!['standard', 'fast'].includes(tier) || typeof sessionId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(sessionId)) throw failure('INVALID_REQUEST');
      if (tier === 'standard') speedBySession.delete(sessionId); else speedBySession.set(sessionId, tier);
      return this.speed(sessionId);
    },
    async invalidate() { live(); notify(); return this.snapshot(); },
    async dispose() { if (disposed) return; disposed = true; stopRefresh(); lifecycle.abort(); unsubscribe(); registration(); cache.clear(); speedBySession.clear(); },
  };
}
