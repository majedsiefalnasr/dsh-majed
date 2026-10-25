// Reasoning effort policy for direct (non-Auto) model selection.
//
// Preserves reasoning defaults, supported effort IDs, Codex context budgets and
// Standard/Fast plus /fast behavior. Resolution never overrides an explicit
// manual choice and never creates Auto membership: this is pure picker/dispatch
// metadata, not enrollment.

import { EFFORTS } from '../auto/index.js';

const DEFAULT_SPEED = 'standard';

function requiredString(value, name) {
  if (typeof value !== 'string' || !value) throw new Error(`Invalid ${name}.`);
  return value;
}
function isSpeed(value) { return value === 'standard' || value === 'fast'; }
function isEffort(value) { return EFFORTS.includes(value); }

/** Pure effort/speed policy. Nothing here enrolls or touches Auto candidates. */
export function createEffortPolicy() {
  const modelDefaults = new Map(); // '${provider}/${model}' -> effort
  const supported = new Map(); // '${provider}/${account}/${model}' -> Set<effort>
  const contextBudget = new Map(); // '${provider}/${model}' -> context window
  const speedBySession = new Map(); // sessionId -> 'standard' | 'fast'

  return {
    /** Per-model explicit effort default (provider-settings modelDefaults). Reject unsupported efforts. */
    setModelDefault(provider, model, effort) {
      requiredString(provider, 'provider'); requiredString(model, 'model');
      requiredEffort(effort, 'effort');
      modelDefaults.set(`${provider}/${model}`, effort);
    },
    clearModelDefault(provider, model) {
      modelDefaults.delete(`${provider}/${model}`);
    },
    getModelDefault(provider, model) {
      return modelDefaults.get(`${provider}/${model}`);
    },
    /** Supported effort IDs for a concrete account/model candidate. */
    setSupportedEfforts(provider, account, model, efforts) {
      requiredString(provider, 'provider'); requiredString(account, 'account'); requiredString(model, 'model');
      const set = new Set();
      for (const effort of efforts) { if (!isEffort(effort)) throw new Error(`Unsupported effort: ${effort}.`); set.add(effort); }
      supported.set(`${provider}/${account}/${model}`, Object.freeze(set));
    },
    getSupportedEfforts(provider, account, model) {
      return supported.get(`${provider}/${account}/${model}`);
    },
    isEffortSupported(provider, account, model, effort) {
      const set = supported.get(`${provider}/${account}/${model}`);
      return set === undefined ? true : set.has(effort);
    },
    /** Codex context budget (context window) for a model. */
    setContextBudget(provider, model, contextWindow) {
      requiredString(provider, 'provider'); requiredString(model, 'model');
      if (typeof contextWindow !== 'number' || !Number.isFinite(contextWindow) || contextWindow < 0) throw new Error('Invalid context budget.');
      contextBudget.set(`${provider}/${model}`, contextWindow);
    },
    getContextBudget(provider, model) {
      return contextBudget.get(`${provider}/${model}`);
    },
    contextFits(provider, model, maxContext) {
      const budget = contextBudget.get(`${provider}/${model}`);
      if (budget === undefined) return true;
      if (maxContext === undefined) return true;
      return maxContext <= budget;
    },
    /** Session speed mode. '/fast' applies per session and is not durable. */
    setSpeed(sessionId, speed) {
      requiredString(sessionId, 'sessionId');
      if (!isSpeed(speed)) throw new Error(`Invalid speed: ${speed}.`);
      speedBySession.set(sessionId, speed);
    },
    getSpeed(sessionId) {
      return speedBySession.get(sessionId) ?? DEFAULT_SPEED;
    },
    clearSpeed(sessionId) {
      speedBySession.delete(sessionId);
    },
    /**
     * Resolve the effort to use for a request.
     * Order: explicit effort > manual choice > account default > model default >
     * speed (fast -> low, standard -> medium). Explicit/manual choices always win.
     */
    resolveEffort(input = {}) {
      const { explicitEffort, manualEffort, accountDefaultEffort, modelDefaultEffort, speed } = input;
      let effort;
      if (explicitEffort !== undefined) { requiredEffort(explicitEffort, 'explicitEffort'); effort = explicitEffort; }
      else if (manualEffort !== undefined) { requiredEffort(manualEffort, 'manualEffort'); effort = manualEffort; }
      else if (accountDefaultEffort !== undefined) effort = accountDefaultEffort;
      else if (modelDefaultEffort !== undefined) effort = modelDefaultEffort;
      else if (speed === 'fast') effort = 'low';
      else effort = 'medium';
      return effort;
    },
    snapshot() {
      return {
        modelDefaults: [...modelDefaults.entries()],
        supported: [...supported.entries()].map(([k, s]) => [k, [...s]]),
        contextBudget: [...contextBudget.entries()],
        speed: [...speedBySession.entries()],
      };
    },
  };
}

function requiredEffort(value, name) {
  if (typeof value !== 'string' || !EFFORTS.includes(value)) throw new Error(`Invalid ${name}: ${value}.`);
  return value;
}

export default { createEffortPolicy, EFFORTS, DEFAULT_SPEED };
