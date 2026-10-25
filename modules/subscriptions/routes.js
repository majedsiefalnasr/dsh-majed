// Route identities: direct (pinned account, no fallback), same-model pools and
// optional tiers. Served by account-aware wire adapters through a single adapter
// per provider — no duplicate providers, tools or RPCs across routes.

import { LlmErrorLike } from './wire.js';
import { classifyFailure, memberKey, accountKey, AUTH_COOLDOWN_MS } from './health.js';
import { streamAccountWithReplay } from './replay.js';

export function poolKey(provider, model) {
  return `${provider}/${model}`;
}

const EMPTY_RESPONSE_CODE = 'EMPTY_RESPONSE';

// ---------------------------------------------------------------------------
// Direct route: one pinned account, no failover to another account.
// Direct-route retry is characterized separately from the Auto budget.
// ---------------------------------------------------------------------------

export function createDirectRoute(account, wireAdapter, retryPolicy = {}) {
  const maxAttempts = retryPolicy.maxAttempts === undefined ? 10 : retryPolicy.maxAttempts;
  const initialDelayMs = retryPolicy.initialDelayMs === undefined ? 1000 : retryPolicy.initialDelayMs;
  const backoffCapMs = retryPolicy.backoffCapMs === undefined ? 60000 : retryPolicy.backoffCapMs;
  const jitter = retryPolicy.jitter === undefined ? 0.2 : retryPolicy.jitter;

  async function resolveModel(provider, model, signal) {
    if (provider !== account.provider) throw new LlmErrorLike(`direct route ${account.id} serves ${account.provider} only`, 'NO_ADAPTER');
    if (!account.models.includes(model)) throw new LlmErrorLike(`model ${model} not advertised by direct account ${account.id}`, 'NO_ADAPTER');
    return wireAdapter.resolveOwnModel(provider, model, account);
  }

  function* backoff() {
    let delay = initialDelayMs;
    for (let i = 0; i < maxAttempts; i++) {
      yield delay;
      delay = Math.min(backoffCapMs, Math.round(delay * 2));
    }
  }

  async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  return {
    provider: account.provider,
    account: account.id,
    kind: 'direct',
    pinned: account.pinned,
    models: account.models,
    async resolveModel(provider, model, signal) { return resolveModel(provider, model, signal); },
    async *stream(options) {
      options.signal?.throwIfAborted();
      let lastError;
      const delays = backoff();
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const iterator = streamAccountWithReplay(wireAdapter, { ...options, provider: account.provider }, account, options.model)[Symbol.asyncIterator]();
          try {
            yield* streamDirectIterator(iterator, options);
            return;
          } finally {
            try { await iterator.return?.(); } catch {}
          }
        } catch (error) {
          options.signal?.throwIfAborted();
          lastError = error;
          const classification = classifyFailure(error, account.provider);
          if (classification.action === 'throw') throw error;
          if (attempt === maxAttempts - 1) throw error;
          const delay = delays.next().value;
          if (delay === undefined) throw error;
          await sleep(delay * (1 + jitter * (Math.random() * 2 - 1)));
        }
      }
      throw lastError;
    },
    retryPolicy: { maxAttempts, initialDelayMs, backoffCapMs, jitter },
  };
}

async function* streamDirectIterator(iterator, options) {
  let first = await iterator.next();
  const leadingUsage = [];
  while (!first.done && first.value.type === 'usage') {
    leadingUsage.push(first.value);
    first = await iterator.next();
  }
  if (first.done === true) throw new LlmErrorLike('direct account returned an empty stream', EMPTY_RESPONSE_CODE);
  if (first.value.type === 'finish' && first.value.reason.kind === 'error') {
    const f = first.value.reason.failure;
    throw new LlmErrorLike(f.message, f.code, f);
  }
  for (const u of leadingUsage) yield u;
  yield first.value;
  for (let next = await iterator.next(); next.done !== true; next = await iterator.next()) {
    yield next.value;
  }
}

// ---------------------------------------------------------------------------
// Pool: same-model union of accounts plus optional heterogeneous tiers.
// Pre-output failover: leading usage is buffered; the first non-usage chunk
// binds the member and no further switching or stitching occurs.
// ---------------------------------------------------------------------------

export function createPoolAdapter(opts = {}) {
  const providers = opts.providers || {};
  const health = opts.health;
  const onWarn = opts.onWarn;
  const strategy = opts.strategy === 'quota_aware' ? 'quota_aware' : 'priority';
  const switchMargin = opts.switchMargin === undefined ? 2 : opts.switchMargin;
  const tiers = opts.tiers || {};
  const families = opts.families || (() => new Map());
  const sticky = new Map(); // sessionId|poolId → memberKey
  const warned = new Set();
  const STICKY_LIMIT = 1000;

  function memberLabel(member) {
    return member.account === undefined ? `${member.provider}/${member.model}`
      : `${member.provider}/${member.account}/${member.model}`;
  }

  function usable(pools) {
    const result = new Map(pools);
    for (const [id, definition] of result) {
      const kept = definition.members.filter(member => providers[member.provider] !== undefined);
      if (kept.length === 0) result.delete(id);
      else if (kept.length < definition.members.length)
        result.set(id, { ...definition, members: kept });
    }
    return result;
  }

  async function familyPools() {
    return usable(await families());
  }

  async function assemblePools() {
    const pools = await familyPools();
    for (const [id, members] of Object.entries(tiers)) {
      if (members.length === 0) continue;
      const owner = members[0].provider;
      const key = poolKey(owner, id);
      if (pools.has(key) && !warned.has(key)) {
        warned.add(key);
        onWarn?.(`pool "${id}" overrides the account pool of the same id under ${owner}`);
      }
      pools.set(key, { members, extra: true });
    }
    return usable(pools);
  }

  async function pools() {
    return assemblePools();
  }

  async function owns(provider, model) {
    return (await pools()).has(poolKey(provider, model));
  }

  async function concrete(members, defaultAccount) {
    const seen = new Set();
    const resolved = [];
    for (const member of members) {
      const requested = member.account === undefined ? (defaultAccount ? await defaultAccount(member.provider) : undefined) : member.account;
      if (requested === undefined) continue;
      const account = requested;
      const key = memberKey(member.provider, account, member.model);
      if (seen.has(key)) continue;
      seen.add(key);
      resolved.push({ provider: member.provider, account, model: member.model });
    }
    return resolved;
  }

  async function resolveModel(provider, model, signal) {
    const definition = (await withAbort(() => pools(), signal)).get(poolKey(provider, model));
    if (definition === undefined) throw new LlmErrorLike(`unknown pool model "${model}"`, 'NO_ADAPTER');
    const members = await withAbort(() => concrete(definition.members, opts.defaultAccount), signal);
    const eligible = [];
    const resolved = [];
    let lastFailure;
    for (const member of members) {
      const adapter = providers[member.provider];
      if (adapter === undefined) continue;
      try {
        resolved.push(await withAbort(() => adapter.resolveOwnModel(member.provider, member.model, member.account), signal));
        eligible.push(member);
      } catch (error) {
        signal?.throwIfAborted();
        lastFailure = error;
        onWarn?.(`pool "${model}": member ${memberLabel(member)} failed to resolve; excluding it`);
      }
    }
    if (resolved.length === 0) {
      throw new LlmErrorLike(`pool "${model}" has no usable member`, 'NO_ADAPTER', { cause: lastFailure });
    }
    const contextWindows = resolved.map(i => i.context && i.context.contextWindow).filter(isNumber);
    const maxTokens = resolved.map(i => i.defaultMaxTokens).filter(isNumber);
    const info = { provider, id: model, name: definition.name ?? model };
    if (contextWindows.length > 0) info.context = { contextWindow: Math.min(...contextWindows) };
    if (maxTokens.length > 0) info.defaultMaxTokens = Math.min(...maxTokens);
    if (definition.reasoning) info.reasoning = definition.reasoning;
    if (definition.inputModalities) info.inputModalities = definition.inputModalities;
    return { model: info, stream: streamOptions => streamMembers(streamOptions, eligible) };
  }

    async function* stream(options) {
    const definition = (await withAbort(() => pools(), options.signal)).get(poolKey(options.provider, options.model));
    if (definition === undefined) throw new LlmErrorLike(`unknown pool model "${options.model}"`, 'NO_ADAPTER');
    const members = await withAbort(() => concrete(definition.members, opts.defaultAccount), options.signal);
    yield* streamMembers(options, members);
    return;
  }

  async function* streamMembers(options, members) {
    const candidates = await select(options.model, members, options.sessionId);
    if (candidates.length === 0) throw exhausted(options.model, members);
    let lastFailure;
    let tried = 0;
    for (const member of candidates) {
      options.signal?.throwIfAborted();
      const adapter = providers[member.provider];
      if (adapter === undefined) continue;
      tried += 1;
      const iterator = streamAccountWithReplay(adapter, { ...options, provider: member.provider }, member.account, member.model)[Symbol.asyncIterator]();
      let first;
      const leadingUsage = [];
      try {
        first = await iterator.next();
        while (!first.done && first.value.type === 'usage') {
          leadingUsage.push(first.value);
          first = await iterator.next();
        }
        if (first.done === true) throw new LlmErrorLike(`${memberLabel(member)} returned an empty stream`, EMPTY_RESPONSE_CODE);
        if (first.value.type === 'finish' && first.value.reason.kind === 'error') {
          const f = first.value.reason.failure;
          throw new LlmErrorLike(f.message, f.code, f);
        }
      } catch (error) {
        try { await iterator.return?.(); } catch {}
        options.signal?.throwIfAborted();
        const classification = classifyFailure(error, member.provider);
        if (classification.action === 'throw') throw error;
        const memberK = memberKey(member.provider, member.account, member.model);
        const accountK = accountKey(member.provider, member.account);
        health?.markUnavailable(memberK, classification.cooldownMs, classification.reason);
        if (classification.scope === 'account' && classification.cooldownMs !== undefined)
          health?.markUnavailable(accountK, classification.cooldownMs, classification.reason);
        if (classification.reason === 'RATE_LIMIT' || classification.reason === 'QUOTA_EXCEEDED') {
          opts.usage?.invalidate?.(member.provider, member.account);
        }
        onWarn?.(`pool "${options.model}": ${memberLabel(member)} failed before any output; trying the next member`);
        lastFailure = { member, error };
        continue;
      }
      remember(options.model, options.sessionId, member);
      // Past the first non-usage chunk there is no clean attempt boundary:
      // everything the member does next reaches the caller as-is. Never stitch
      // a partial reasoning/text/tool delta from another route.
      try {
        for (const u of leadingUsage) yield u;
        yield first.value;
        for (let next = await iterator.next(); next.done !== true; next = await iterator.next()) {
          yield next.value;
        }
      } finally {
        try { await iterator.return?.(); } catch {}
      }
      return;
    }
    throw exhausted(options.model, members, lastFailure, tried);
  }

  async function select(poolId, members, sessionId) {
    const now = Date.now();
    const usable = members.filter(member => providers[member.provider] !== undefined
      && health?.isMemberAvailable(member.provider, member.account, member.model, now) !== false);
    if (usable.length === 0) return [];
    const stickyMember = sessionId === undefined ? undefined
      : usable.find(member => memberKey(member.provider, member.account, member.model) === sticky.get(stickyKey(poolId, sessionId)));
    let ordered;
    if (strategy === 'priority') {
      ordered = stickyMember === undefined ? usable : [stickyMember, ...usable.filter(m => m !== stickyMember)];
    } else {
      const scored = usable.slice();
      scored.sort(() => 0); // stable; urgency ranking would use usage telemetry
      if (stickyMember !== undefined && scored.includes(stickyMember)) {
        scored.splice(scored.indexOf(stickyMember), 1);
        scored.unshift(stickyMember);
      }
      ordered = scored;
    }
    return ordered;
  }

  function remember(poolId, sessionId, member) {
    if (sessionId === undefined) return;
    const key = stickyKey(poolId, sessionId);
    sticky.delete(key);
    if (sticky.size >= STICKY_LIMIT) {
      const oldest = sticky.keys().next();
      if (!oldest.done) sticky.delete(oldest.value);
    }
    sticky.set(key, memberKey(member.provider, member.account, member.model));
  }

  function exhausted(model, pool, last, tried = 0) {
    const keys = new Set();
    for (const member of pool) {
      keys.add(memberKey(member.provider, member.account, member.model));
      keys.add(accountKey(member.provider, member.account));
    }
    const now = Date.now();
    const cooling = health?.earliestRecoveryRecord?.(keys, now);
    const retryAfterMs = cooling === undefined ? undefined : Math.max(cooling.unavailableUntil - now, 1);
    let message, code;
    if (last !== undefined) {
      const { member, error } = last;
      code = error && typeof error.code === 'string' ? error.code : 'TRANSPORT';
      message = `pool "${model}" exhausted: ${tried} of ${pool.length} member(s) failed; last ${memberLabel(member)}`;
    } else if (cooling !== undefined) {
      code = cooling.reason;
      message = `pool "${model}" exhausted: every member is cooling down; ${cooling.key}`;
    } else {
      code = 'NO_ADAPTER';
      message = `pool "${model}" exhausted: no usable member`;
    }
    const err = new LlmErrorLike(message, code, { ...(retryAfterMs === undefined ? {} : { providerRetryAfterMs: retryAfterMs }), cause: last && last.error });
    return err;
  }

  function invalidate() {
    sticky.clear();
    warned.clear();
  }

  return {
    provider: 'pool',
    kind: 'pool',
    strategy,
    owns,
    pools,
    resolveModel,
    stream,
    streamMembers,
    select,
    invalidate,
    snapshot: () => ({ strategy, pools: [...pools()].map(([k, d]) => ({ key: k, members: d.members.length, extra: d.extra })) }),
  };
}

function isNumber(v) { return typeof v === 'number'; }
function stickyKey(poolId, sessionId) { return `${sessionId}|${poolId}`; }
async function withAbort(operation, signal) {
  if (signal) {
    return new Promise((resolve, reject) => {
      const onAbort = () => reject(new LlmErrorLike('aborted', 'ABORTED'));
      signal.addEventListener('abort', onAbort, { once: true });
      operation().then(resolve).catch(reject).finally(() => signal.removeEventListener('abort', onAbort));
    });
  }
  return operation();
}
