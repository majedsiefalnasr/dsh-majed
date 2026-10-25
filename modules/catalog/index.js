// Account/model catalog and model preferences for direct (non-Auto) routing.
//
// Preserves discovered/static/manual catalogs, background/manual refresh,
// visibility, aliases/display names, direct pool participation, per-account
// allowlists and independent pinned entries. Account-specific capabilities
// (supported efforts, context budget) and reasoning defaults live here.
//
// Catalog/login changes never enroll candidates into Auto; account-only models
// remain bound to their advertised account. Auto membership is owned solely by
// the explicit Auto enrollment module (modules/auto) and is never touched here.

import { createSyntheticAccount, modelAllowedForPool } from '../subscriptions/account.js';
import { EFFORTS } from '../auto/index.js';
import { createEffortPolicy } from './effort.js';

const SOURCE_DISCOVERED = 'discovered';
const SOURCE_STATIC = 'static';
const SOURCE_MANUAL = 'manual';
const SOURCES = Object.freeze([SOURCE_DISCOVERED, SOURCE_STATIC, SOURCE_MANUAL]);

function requiredString(value, name) {
  if (typeof value !== 'string' || !value) throw new Error(`Invalid ${name}.`);
  return value;
}
function isSource(value) { return SOURCES.includes(value); }
function requiredEffort(value, name) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !EFFORTS.includes(value)) throw new Error(`Invalid ${name}: ${value}.`);
  return value;
}

export { EFFORTS };
export { createEffortPolicy };
export { modelAllowedForPool };

/** A catalog account entry: wire identity plus presentation/preference state. */
export function createCatalogEntry(id, opts = {}) {
  const provider = requiredString(opts.provider, 'provider');
  requiredString(id, 'account id');
  const base = createSyntheticAccount(id, { provider, ...opts });
  const source = opts.source === undefined ? SOURCE_MANUAL : (() => { if (!isSource(opts.source)) throw new Error(`Invalid catalog source: ${opts.source}.`); return opts.source; })();
  requiredEffort(opts.defaultEffort, 'defaultEffort');
  return Object.freeze({
    ...base,
    source,
    visible: opts.visible === undefined ? true : Boolean(opts.visible),
    capabilities: opts.capabilities === undefined ? undefined : Object.freeze({ ...opts.capabilities }),
  });
}

/** Catalog of accounts with per-model visibility, capabilities and refresh generation. */
export function createCatalog(initial = {}) {
  const byId = new Map(); // '${provider}/${id}' -> catalog entry
  const byProvider = new Map(); // provider -> entry[]
  const visible = new Map(); // '${provider}/${id}/${model}' -> boolean
  let generation = 0;
  let stale = false;

  function accountKey(provider, id) { return `${provider}/${id}`; }
  function modelKey(provider, id, model) { return `${provider}/${id}/${model}`; }
  function bump() { generation += 1; return generation; }

  function addUnsafe(entry) {
    const list = byProvider.get(entry.provider) || [];
    list.push(entry);
    byProvider.set(entry.provider, list);
    byId.set(accountKey(entry.provider, entry.id), entry);
    for (const model of entry.models) visible.set(modelKey(entry.provider, entry.id, model), true);
  }

  function entryView(account) {
    return {
      id: account.id,
      provider: account.provider,
      label: account.label,
      alias: account.alias,
      models: [...account.models],
      pinned: account.pinned,
      poolEnabled: account.poolEnabled,
      independentEntry: account.independentEntry,
      poolModels: account.poolModels === undefined ? undefined : [...account.poolModels],
      defaultEffort: account.defaultEffort,
      source: account.source,
      visible: true,
      capabilities: account.capabilities === undefined ? undefined : { ...account.capabilities },
    };
  }

  for (const account of initial.accounts || []) addUnsafe(account);

  return {
    /** True only while a mutating operation is in flight (single-writer). */
    isWriting() { return false; },
    listAccounts(provider) {
      const list = byProvider.get(provider);
      return list === undefined ? [] : list.map(entryView);
    },
    getAccount(provider, id) {
      const account = byId.get(accountKey(provider, id));
      return account === undefined ? undefined : entryView(account);
    },
    get(provider, id) { return this.getAccount(provider, id); },
    has(provider, id) { return this.hasAccount(provider, id); },
    hasAccount(provider, id) { return byId.has(accountKey(provider, id)); },
    addAccount(entry) {
      if (this.hasAccount(entry.provider, entry.id)) throw new Error(`Account ${entry.provider}/${entry.id} already exists.`);
      addUnsafe(entry);
      bump();
      return entry;
    },
    remove(provider, id) {
      const key = accountKey(provider, id);
      const account = byId.get(key);
      if (!account) throw new Error(`Unknown account ${key}.`);
      const list = byProvider.get(provider);
      if (list) {
        const index = list.findIndex(a => a.id === id && a.provider === provider);
        if (index >= 0) list.splice(index, 1);
        if (list.length === 0) byProvider.delete(provider);
      }
      byId.delete(key);
      for (const model of account.models) visible.delete(modelKey(provider, id, model));
      bump();
      return account;
    },
    replaceAccount(entry) {
      const key = accountKey(entry.provider, entry.id);
      if (!byId.has(key)) throw new Error(`Unknown account ${key}.`);
      const list = byProvider.get(entry.provider);
      if (list) {
        const index = list.findIndex(a => a.id === entry.id && a.provider === entry.provider);
        if (index >= 0) list[index] = entry;
      }
      byId.set(key, entry);
      bump();
      return entry;
    },
    setSource(provider, id, source) {
      const account = byId.get(accountKey(provider, id));
      if (!account) throw new Error(`Unknown account ${provider}/${id}.`);
      if (!isSource(source)) throw new Error(`Invalid catalog source: ${source}.`);
      const next = Object.freeze({ ...account, source });
      return this.replaceAccount(next);
    },
    setVisibility(provider, id, model, flag) {
      const account = byId.get(accountKey(provider, id));
      if (!account) throw new Error(`Unknown account ${provider}/${id}.`);
      visible.set(modelKey(provider, id, model), Boolean(flag));
      bump();
    },
    isVisible(provider, id, model) {
      const record = visible.get(modelKey(provider, id, model));
      return record === undefined ? true : record;
    },
    setAlias(provider, id, alias) {
      const account = byId.get(accountKey(provider, id));
      if (!account) throw new Error(`Unknown account ${provider}/${id}.`);
      return this.replaceAccount(Object.freeze({ ...account, alias: String(alias) }));
    },
    setPinned(provider, id, pinned) {
      const account = byId.get(accountKey(provider, id));
      if (!account) throw new Error(`Unknown account ${provider}/${id}.`);
      return this.replaceAccount(Object.freeze({ ...account, pinned: Boolean(pinned) }));
    },
    setPoolEnabled(provider, id, poolEnabled) {
      const account = byId.get(accountKey(provider, id));
      if (!account) throw new Error(`Unknown account ${provider}/${id}.`);
      return this.replaceAccount(Object.freeze({ ...account, poolEnabled: Boolean(poolEnabled) }));
    },
    setPoolModels(provider, id, poolModels) {
      const account = byId.get(accountKey(provider, id));
      if (!account) throw new Error(`Unknown account ${provider}/${id}.`);
      return this.replaceAccount(Object.freeze({ ...account, poolModels: poolModels === undefined ? undefined : Object.freeze([...poolModels]) }));
    },
    setDefaultEffort(provider, id, effort) {
      const account = byId.get(accountKey(provider, id));
      if (!account) throw new Error(`Unknown account ${provider}/${id}.`);
      requiredEffort(effort, 'defaultEffort');
      return this.replaceAccount(Object.freeze({ ...account, defaultEffort: effort }));
    },
    setCapability(provider, id, model, capability) {
      const account = byId.get(accountKey(provider, id));
      if (!account) throw new Error(`Unknown account ${provider}/${id}.`);
      if (!account.models.includes(model)) throw new Error(`Model ${model} not advertised by ${provider}/${id}.`);
      return this.replaceAccount(Object.freeze({ ...account, capabilities: Object.freeze({ ...capability }) }));
    },
    getCapability(provider, id, model) {
      const account = byId.get(accountKey(provider, id));
      if (account === undefined || !account.models.includes(model)) return undefined;
      return account.capabilities === undefined ? undefined : { ...account.capabilities };
    },
    /** Entries the picker may show: accounts with at least one visible model, visible models only. */
    listPickerEntries(provider) {
      const list = byProvider.get(provider);
      if (list === undefined) return [];
      const out = [];
      for (const account of list) {
        const visibleModels = account.models.filter(model => this.isVisible(provider, account.id, model));
        if (visibleModels.length === 0) continue;
        out.push({
          id: account.id,
          provider: account.provider,
          label: account.label,
          alias: account.alias,
          displayName: account.alias === undefined ? account.label : account.alias,
          models: visibleModels,
          pinned: account.pinned,
          poolEnabled: account.poolEnabled,
          independentEntry: account.independentEntry,
          poolModels: account.poolModels === undefined ? undefined : [...account.poolModels],
          defaultEffort: account.defaultEffort,
          source: account.source,
          capabilities: account.capabilities === undefined ? undefined : { ...account.capabilities },
        });
      }
      return out;
    },
    refresh() { stale = false; return bump(); },
    markStale() { stale = true; },
    isStale() { return stale; },
    generation() { return generation; },
    snapshot() {
      return {
        generation,
        stale,
        accounts: [...byId.values()].map(entryView),
        visible: [...visible.entries()].map(([key, value]) => ({ key, visible: value })),
      };
    },
  };
}

export default { createCatalog, createCatalogEntry, createEffortPolicy, EFFORTS, modelAllowedForPool };
