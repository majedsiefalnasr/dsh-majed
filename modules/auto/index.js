// Deterministic Auto routing core.
//
// One native Auto entry selects the highest-priority explicitly enrolled candidate
// and retains a healthy selection within the session. Failover is bounded to at most
// DEFAULT_MAX_ATTEMPTS distinct candidates before content starts, never repeats a
// candidate in a cycle, and stops with a clear reason on exhaustion.
//
// Nothing is activated by default. The caller enables routing through explicit
// options; manual model selection exits Auto for the session. Smart judgment is a
// separate, opt-in contract and is not part of this module.
export const AUTO_ROUTE_ID = 'dsh-majed:auto';
export const DEFAULT_MAX_ATTEMPTS = 3;
export const EFFORTS = Object.freeze(['low', 'medium', 'high']);

export class AutoInputError extends Error {
  constructor(message) { super(message); this.name = 'AutoInputError'; }
}
export const fail = () => { throw new AutoInputError('Invalid Auto input.'); };
export function requiredString(value, name) {
  if (typeof value !== 'string' || !value) fail();
  return value;
}
export function priorityValue(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) fail();
  return value;
}
export function effortSet(value) {
  if (value === undefined) return new Set();
  let items;
  if (Array.isArray(value)) items = value;
  else if (value instanceof Set) items = [...value];
  else fail();
  const out = new Set();
  for (const effort of items) {
    if (!EFFORTS.includes(effort)) fail();
    out.add(effort);
  }
  return out;
}
export function booleanFlag(value, fallback = false) {
  if (value === undefined) return fallback;
  if (typeof value !== 'boolean') fail();
  return value;
}

/** Candidate identity is provider + account + model, never only a display name. */
export function candidateId({ provider, account, model }) {
  return `${requiredString(provider, 'provider')}/${requiredString(account, 'account')}/${requiredString(model, 'model')}`;
}

/** Build a validated enrolled candidate. */
export function createCandidate(input = {}) {
  const provider = requiredString(input.provider, 'provider');
  const account = requiredString(input.account, 'account');
  const model = requiredString(input.model, 'model');
  const priority = input.priority === undefined ? 0 : priorityValue(input.priority);
  const defaultEffort = input.defaultEffort === undefined ? undefined : (() => { if (!EFFORTS.includes(input.defaultEffort)) fail(); return input.defaultEffort; })();
  const smartPermittedEfforts = effortSet(input.smartPermittedEfforts);
  const capabilities = input.capabilities === undefined ? {} : input.capabilities;
  if (capabilities && typeof capabilities !== 'object') fail();
  const enabled = booleanFlag(input.enabled, false);
  const cooldownUntil = input.cooldownUntil === undefined ? undefined : (() => {
    if (typeof input.cooldownUntil !== 'number' || !Number.isFinite(input.cooldownUntil)) fail();
    return input.cooldownUntil;
  })();
  return Object.freeze({
    id: candidateId({ provider, account, model }),
    provider, account, model, priority, defaultEffort,
    smartPermittedEfforts: Object.freeze(smartPermittedEfforts),
    capabilities: Object.freeze({ ...capabilities }),
    enabled, cooldownUntil,
  });
}

/** Registry of explicitly enrolled Auto candidates. Membership is separate from login,
 * direct pooling, search/media scheduling and child-routing opt-in. */
export function createRegistry() {
  const byId = new Map();
  return {
    add(candidate) {
      const created = createCandidate(candidate);
      byId.set(created.id, created);
    },
    list() { return [...byId.values()]; },
    snapshot() { return this.list().map(c => ({ ...c, smartPermittedEfforts: new Set(c.smartPermittedEfforts) })); },
    get(id) { return byId.get(String(id)); },
    has(id) { return byId.has(String(id)); },
    enabled() { return this.list().filter(c => c.enabled); },
    setEnabled(id, enabled) {
      const c = this.get(id);
      if (!c) fail();
      const next = { ...c, enabled: booleanFlag(enabled) };
      byId.set(id, Object.freeze(next));
      return next;
    },
    setPriority(id, priority) {
      const c = this.get(id);
      if (!c) fail();
      const next = { ...c, priority: priorityValue(priority) };
      byId.set(id, Object.freeze(next));
      return next;
    },
    setDefaultEffort(id, effort) {
      const c = this.get(id);
      if (!c) fail();
      if (effort !== undefined && !EFFORTS.includes(effort)) fail();
      const next = { ...c, defaultEffort: effort };
      byId.set(id, Object.freeze(next));
      return next;
    },
    setSmartPermittedEfforts(id, efforts) {
      const c = this.get(id);
      if (!c) fail();
      const next = { ...c, smartPermittedEfforts: effortSet(efforts) };
      byId.set(id, Object.freeze(next));
      return next;
    },
    setCooldown(id, cooldownUntil) {
      const c = this.get(id);
      if (!c) fail();
      const next = { ...c, cooldownUntil: cooldownUntil === undefined ? undefined : (() => { if (typeof cooldownUntil !== 'number' || !Number.isFinite(cooldownUntil)) fail(); return cooldownUntil; })() };
      byId.set(id, Object.freeze(next));
      return next;
    },
    remove(id) { if (!byId.has(String(id))) fail(); byId.delete(String(id)); },
    clear() { byId.clear(); },
    size() { return byId.size; },
  };
}

/** Request requirements used to filter candidates before priority or judgment. */
export function createRequest(input = {}) {
  const images = booleanFlag(input.images, false);
  const tools = booleanFlag(input.tools, false);
  const explicitEffort = input.explicitEffort === undefined ? undefined : (() => { if (!EFFORTS.includes(input.explicitEffort)) fail(); return input.explicitEffort; })();
  const maxContext = input.maxContext === undefined ? undefined : (() => { if (typeof input.maxContext !== 'number' || !Number.isFinite(input.maxContext) || input.maxContext < 0) fail(); return input.maxContext; })();
  const maxOutput = input.maxOutput === undefined ? undefined : (() => { if (typeof input.maxOutput !== 'number' || !Number.isFinite(input.maxOutput) || input.maxOutput < 0) fail(); return input.maxOutput; })();
  return Object.freeze({ images, tools, explicitEffort, maxContext, maxOutput });
}

/** Filter candidates against request requirements, permissions and health. Never
 * silently reduces explicit effort, strips images/history, or broadens membership. */
export function filterEligible(candidates, request = {}, now = Date.now()) {
  const req = createRequest(request);
  const out = [];
  for (const c of candidates) {
    if (!c.enabled) continue;
    if (c.cooldownUntil !== undefined && now < c.cooldownUntil) continue;
    if (req.images && c.capabilities.images !== true) continue;
    if (req.tools && c.capabilities.tools !== true) continue;
    if (req.explicitEffort !== undefined) {
      if (!c.capabilities.efforts || !c.capabilities.efforts.has(req.explicitEffort)) continue;
      if (c.defaultEffort !== req.explicitEffort && !c.smartPermittedEfforts.has(req.explicitEffort)) continue;
    }
    if (req.maxContext !== undefined && (c.capabilities.maxContext === undefined || c.capabilities.maxContext < req.maxContext)) continue;
    if (req.maxOutput !== undefined && (c.capabilities.maxOutput === undefined || c.capabilities.maxOutput < req.maxOutput)) continue;
    out.push(c);
  }
  return out;
}

/** Select the highest-priority eligible candidate. Session stickiness keeps a healthy
 * current route; manual selection exits Auto. Returns { candidate, effort, reason }.
 * reason is 'selected' | 'sticky' | 'exhausted' | 'ineligible' | 'manual'. */
export function selectAuto({ registry, session, budget, request, now = Date.now() }) {
  if (!registry || typeof registry.enabled !== 'function') fail();
  if (!session || typeof session.current !== 'undefined' && typeof session !== 'object') fail();
  const candidates = registry.enabled();
  let eligible = filterEligible(candidates, request, now);

  // Revocation blocks new dispatches through a candidate in every session.
  eligible = eligible.filter(c => !session.isRevoked(c.id));

  // Manual model selection exits Auto for this session.
  if (session.manual === true) return { candidate: undefined, effort: undefined, reason: 'manual' };

  // Explicit apply-and-reselect updates this session: honor the reselected
  // route if eligible, then clear the flag. Later dispatches resume normal
  // priority selection and stickiness.
  if (session.reselected === true) {
    session.setReselected(false);
    const cur = session.current && session.current.route ? registry.get(session.current.route) : undefined;
    if (cur && eligible.some(c => c.id === cur.id) && !session.isRevoked(cur.id)) {
      return { candidate: cur, effort: session.current.effort || cur.defaultEffort, reason: 'selected' };
    }
    // Reselected route unavailable or revoked: fall through to normal selection.
  }

  // Session stickiness: retain a healthy current route even if a higher priority
  // candidate recovers, unless the route is unavailable.
  if (session.current && session.current.route && session.current.route !== 'auto') {
    const cur = registry.get(session.current.route);
    if (cur && eligible.some(c => c.id === cur.id) && !session.isRevoked(cur.id)) {
      return { candidate: cur, effort: session.current.effort || cur.defaultEffort, reason: 'sticky' };
    }
    // Current route no longer eligible or revoked: fall through to re-selection.
  }

  if (eligible.length === 0) return { candidate: undefined, effort: undefined, reason: 'ineligible' };

  // Highest priority wins; ties broken by stable insertion order.
  eligible.sort((a, b) => b.priority - a.priority || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  // Budget: distinct candidate attempts, no repeat within a failover cycle.
  // Skip already-attempted candidates; never repeat one in a cycle.
  if (budget && typeof budget.remaining === 'function' && typeof budget.attempted === 'function') {
    if (budget.remaining() <= 0) return { candidate: undefined, effort: undefined, reason: 'exhausted' };
    const next = eligible.find(c => !budget.attempted(c.id));
    if (!next) return { candidate: undefined, effort: undefined, reason: 'exhausted' };
    const effort = request.explicitEffort !== undefined ? request.explicitEffort : (next.defaultEffort || EFFORTS[1]);
    return { candidate: next, effort, reason: 'selected' };
  }

  const pick = eligible[0];
  const effort = request.explicitEffort !== undefined ? request.explicitEffort : (pick.defaultEffort || EFFORTS[1]);
  return { candidate: pick, effort, reason: 'selected' };
}

/** Finite failover attempt budget shared across owned dispatch, nested pools and any
 * outer host retry so layering cannot multiply it. */
export function createBudget(maxAttempts = DEFAULT_MAX_ATTEMPTS) {
  const limit = maxAttempts === undefined ? DEFAULT_MAX_ATTEMPTS : (() => { if (typeof maxAttempts !== 'number' || !Number.isFinite(maxAttempts) || maxAttempts < 1) fail(); return maxAttempts; })();
  const attempted = new Set();
  return {
    maxAttempts: limit,
    remaining() { return Math.max(0, limit - attempted.size); },
    attempted(id) { return attempted.has(String(id)); },
    record(id) {
      const key = String(id);
      if (attempted.has(key)) return false;
      if (attempted.size >= limit) return false;
      attempted.add(key);
      return true;
    },
    exhausted() { return attempted.size >= limit; },
    reset() { attempted.clear(); },
  };
}

/** Session-level Auto state: sticky route, explicit effort, manual override, revocation. */
export function createSession() {
  let current = undefined;   // { route: candidateId, effort } | undefined
  let manual = false;        // manual model selection exits Auto
  let reselected = false;    // explicit apply-and-reselect for this session
  const revoked = new Set(); // candidate IDs blocked from new dispatches
  return {
    get current() { return current; },
    setRoute(route, effort) { current = route === undefined ? undefined : { route: String(route), effort }; },
    clear() { current = undefined; manual = false; reselected = false; revoked.clear(); },
    exitManual() { manual = true; current = undefined; },
    get manual() { return manual; },
    setReselected(value) { reselected = booleanFlag(value); },
    get reselected() { return reselected; },
    /** Revocation blocks new dispatches through this candidate in every session. */
    revoke(route) { revoked.add(String(route)); },
    isRevoked(route) { return revoked.has(String(route)); },
  };
}
