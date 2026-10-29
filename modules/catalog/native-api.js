// Native API model references: eligible models of providers whose configuration
// and credentials stay owned by DSH. Identity is {provider, model}, resolved live
// through the public native LLM service (listProviders, listModels,
// resolveModelInfo, 'llm/adapters-updated'). This module registers no adapter and
// stores no provider settings, endpoints or secrets: only Owner preferences
// (alias, visibility, default) keyed by reference, kept in memory like the rest
// of the catalog. Tools, context, effort and cancellation stay native because
// dispatch uses the untouched {provider, model} through the native route.
import { PROVIDER_IDS } from '../subscriptions/wire.js';
import { AUTO_ROUTE_ID } from '../auto/index.js';

// Subscription brands and the Auto identity are owned elsewhere in this plugin.
export const SUBSCRIPTION_PROVIDER_IDS = Object.freeze([...PROVIDER_IDS, 'opencode', AUTO_ROUTE_ID]);

const DEFAULT_TIMEOUT_MS = 5000;
const MAX_ID = 256, MAX_NAME = 128, MAX_ALIAS = 64, MAX_MODALITY = 64, MAX_MODALITIES = 16;
const key = (provider, model) => JSON.stringify([provider, model]);

// Credential guarantee on VALUES: every field this module surfaces or stores is a bounded plain string.
// A native object, array, number or oversized string never passes through, whatever key it arrives under.
const CONTROL = /[\u0000-\u001f\u007f-\u009f]/g;
const validId = value => typeof value === 'string' && value.length >= 1 && value.length <= MAX_ID && !/[\u0000-\u001f\u007f]/.test(value);
function label(value, max, fallback) {
  if (typeof value !== 'string') return fallback;
  const clean = value.replace(CONTROL, '');
  return clean.length >= 1 && clean.length <= max ? clean : fallback;
}

function bounded(promise, timeoutMs) {
  let timer;
  const deadline = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), timeoutMs); });
  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer));
}

/**
 * @param ctx plugin context providing `llm` and `on`
 * @param options { llm?, timeoutMs?, excludeProviders?, preferences? }
 */
export function createNativeApiReferences(ctx, options = {}) {
  const exclude = new Set(options.excludeProviders ?? SUBSCRIPTION_PROVIDER_IDS);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const service = options.llm || ctx?.llm;
  if (!service || typeof service.listProviders !== 'function' || typeof service.listModels !== 'function') throw new Error('Native LLM service is unavailable.');
  const prefs = new Map(); // key -> { provider, model, alias?, visible, default }
  for (const p of options.preferences ?? []) {
    if (!p || !validId(p.provider) || !validId(p.model)) continue;
    const next = normalize(p);
    if (next.default) for (const other of prefs.values()) other.default = false; // last default wins, as in setPreference
    prefs.set(key(p.provider, p.model), next);
  }
  let providers = [];
  let failed = new Set(); // provider ids whose listing could not be read
  let disposed = false;
  let running, pending;

  function normalize(p) {
    const alias = label(p.alias, MAX_ALIAS);
    return { provider: p.provider, model: p.model, ...(alias === undefined ? {} : { alias }), visible: p.visible !== false, default: p.default === true };
  }

  async function readProvider(provider) {
    try {
      const listed = await bounded(Promise.resolve().then(() => service.listModels(provider.id)), timeoutMs);
      return { id: provider.id, name: provider.name, models: listed.filter(m => m && validId(m.id)).map(m => ({ model: m.id, name: label(m.name, MAX_NAME, m.id),
        ...(Array.isArray(m.inputModalities) ? { inputModalities: m.inputModalities.filter(x => typeof x === 'string' && x.length >= 1 && x.length <= MAX_MODALITY).slice(0, MAX_MODALITIES) } : {}) })) };
    } catch {
      return { id: provider.id, name: provider.name, models: [], error: 'list-failed' };
    }
  }

  async function load() {
    let eligible;
    try {
      eligible = service.listProviders().filter(p => p && validId(p.id) && !exclude.has(p.id)).map(p => ({ id: p.id, name: label(p.name, MAX_NAME, p.id) }));
    } catch {
      // The provider list itself is unreadable: keep the previous providers, mark all unreadable.
      if (disposed) return;
      providers = providers.map(p => ({ id: p.id, name: p.name, models: [], error: 'list-failed' }));
      failed = new Set(providers.map(p => p.id));
      return;
    }
    const read = await Promise.all(eligible.map(readProvider));
    if (disposed) return;
    failed = new Set(read.filter(p => p.error).map(p => p.id));
    providers = read;
  }

  /** Serialized refresh: concurrent triggers coalesce into one rerun. */
  function refresh() {
    if (disposed) return Promise.resolve();
    if (running) return pending ??= running.catch(() => {}).then(() => { pending = undefined; return refresh(); });
    running = load().finally(() => { running = undefined; });
    return running;
  }

  const stop = typeof ctx?.on === 'function' ? ctx.on('llm/adapters-updated', () => { void refresh().catch(() => {}); }) : undefined;

  function view(provider, entry) {
    const pref = prefs.get(key(provider.id, entry.model));
    return {
      provider: provider.id,
      model: entry.model,
      name: entry.name,
      ...(pref?.alias === undefined ? {} : { alias: pref.alias }),
      ...(entry.inputModalities ? { inputModalities: entry.inputModalities } : {}),
      chat: true,
      mediaGeneration: false,
      available: true,
      visible: pref ? pref.visible : true,
      default: pref ? pref.default : false,
    };
  }

  function unavailable() {
    const live = new Set(providers.flatMap(p => p.models.map(m => key(p.id, m.model))));
    return [...prefs.values()].filter(p => !live.has(key(p.provider, p.model))).map(p => ({
      ...p, available: false,
      reason: failed.has(p.provider) ? 'provider-unreadable' : providers.some(x => x.id === p.provider) ? 'model-removed' : 'provider-removed',
    }));
  }

  const api = {
    refresh,
    /** Resolves when every refresh requested so far has settled. */
    async idle() { while (running || pending) await (pending ?? running).catch(() => {}); },
    snapshot() {
      return {
        providers: providers.map(p => ({ id: p.id, name: p.name, ...(p.error ? { error: p.error } : {}), models: p.models.map(m => view(p, m)) })),
        unavailable: unavailable(),
      };
    },
    usable() { return providers.flatMap(p => p.models.map(m => view(p, m))).filter(m => m.visible); },
    setPreference(provider, model, change) {
      if (!validId(provider) || !validId(model)) throw new TypeError('Invalid native reference.');
      const current = prefs.get(key(provider, model)) ?? { provider, model, visible: true, default: false };
      const next = normalize({ ...current, ...change });
      if (next.default) for (const other of prefs.values()) if (other !== current) other.default = false;
      prefs.set(key(provider, model), next);
      return { ...next };
    },
    /** Serializable Owner preferences only; never provider configuration. */
    preferences() { return [...prefs.values()].map(p => ({ ...p })); },
    defaultReference() {
      const chosen = [...prefs.values()].find(p => p.default);
      if (!chosen) return undefined;
      const live = providers.some(p => p.id === chosen.provider && p.models.some(m => m.model === chosen.model));
      return { provider: chosen.provider, model: chosen.model, available: live };
    },
    /** Live manual selection: the exact native identity, untouched. */
    async select(provider, model) {
      if (exclude.has(provider)) return { ok: false, reason: 'not-eligible' };
      try {
        const info = await bounded(Promise.resolve().then(() => service.resolveModelInfo(provider, model)), timeoutMs);
        if (info?.provider !== provider || info?.id !== model) return { ok: false, reason: 'unavailable' };
        return { ok: true, reference: { provider, model } };
      } catch { return { ok: false, reason: 'unavailable' }; }
    },
    dispose() { disposed = true; stop?.(); },
  };
  return api;
}
