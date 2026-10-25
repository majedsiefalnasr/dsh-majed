// Synthetic accounts and the in-memory account store used by the integrated
// subscription adapters. No real account store is opened; all state is synthetic
// and process-lifetime only. Single-writer semantics guard concurrent mutation.

export function requiredString(value, name) {
  if (typeof value !== 'string' || !value) throw new Error(`Invalid ${name}.`);
  return value;
}

export function createSyntheticAccount(id, opts = {}) {
  return Object.freeze({
    id: requiredString(id, 'account id'),
    provider: requiredString(opts.provider, 'provider'),
    label: opts.label === undefined ? String(id) : String(opts.label),
    models: Object.freeze([...(opts.models ?? [])]),
    pinned: Boolean(opts.pinned),
    poolEnabled: Boolean(opts.poolEnabled !== false),
    independentEntry: Boolean(opts.independentEntry),
    poolModels: opts.poolModels === undefined ? undefined : Object.freeze([...opts.poolModels]),
    alias: opts.alias === undefined ? undefined : String(opts.alias),
    defaultEffort: opts.defaultEffort === undefined ? undefined : String(opts.defaultEffort),
  });
}

export function modelAllowedForPool(account, model) {
  const allow = account.poolModels;
  if (allow === undefined || allow.length === 0) return true; // absent allowlist → every model
  return allow.includes(model);
}

export function createAccountStore(initial = []) {
  const byProvider = new Map();
  const byId = new Map();
  let writing = false;

  function addUnsafe(account) {
    const list = byProvider.get(account.provider) || [];
    list.push(account);
    byProvider.set(account.provider, list);
    byId.set(`${account.provider}/${account.id}`, account);
  }

  async function withWriter(operation) {
    if (writing) throw new Error('Account store: a writer is already active.');
    writing = true;
    try { return await operation(); }
    finally { writing = false; }
  }

  for (const account of initial) addUnsafe(account);

  return {
    /** True only while a mutating operation is in flight (single-writer). */
    isWriting() { return writing; },
    list(provider) {
      const list = byProvider.get(provider);
      return list === undefined ? [] : [...list];
    },
    get(provider, id) { return byId.get(`${provider}/${String(id)}`); },
    has(provider, id) { return byId.has(`${provider}/${String(id)}`); },
    add(account) {
      return withWriter(() => {
        if (this.has(account.provider, account.id)) throw new Error(`Account ${account.provider}/${account.id} already exists.`);
        addUnsafe(account);
        return account;
      });
    },
    remove(provider, id) {
      return withWriter(() => {
        const key = `${provider}/${String(id)}`;
        const account = byId.get(key);
        if (!account) throw new Error(`Unknown account ${key}.`);
        const list = byProvider.get(provider);
        if (list) {
          const index = list.indexOf(account);
          if (index >= 0) list.splice(index, 1);
          if (list.length === 0) byProvider.delete(provider);
        }
        byId.delete(key);
        return account;
      });
    },
    replace(account) {
      return withWriter(() => {
        const key = `${account.provider}/${account.id}`;
        if (!byId.has(key)) throw new Error(`Unknown account ${key}.`);
        const list = byProvider.get(account.provider);
        if (list) {
          const index = list.findIndex(a => a.id === account.id && a.provider === account.provider);
          if (index >= 0) list[index] = account;
        }
        byId.set(key, account);
        return account;
      });
    },
    snapshot() {
      return {
        writing,
        accounts: [...byId.values()].map(a => ({ ...a, models: [...a.models] })),
      };
    },
  };
}
