// All manager inputs are untrusted, including persisted configuration.
export class InputError extends Error { constructor() { super('Invalid manager configuration.'); this.name = 'InputError'; } }
export const fail = () => { throw new InputError(); };
export const MASKED_SECRET = '***';
export function object(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail();
  if (Object.keys(value).some(key => !keys.includes(key))) fail();
  return value;
}
export function text(value, max = 4096) {
  if (typeof value !== 'string' || value.length > max || value.includes('\0')) fail();
  return value;
}
export function serverPath(value) {
  if (value === undefined) return undefined;
  const p = text(value);
  if (!p.trim()) fail();
  if (p.split(/[/\\]+/).includes('..')) fail();
  return p;
}
export function flag(value, fallback = false) { if (value === undefined) return fallback; if (typeof value !== 'boolean') fail(); return value; }
export function dictionary(value, max = 64) {
  object(value, Object.keys(value || {}));
  if (Object.keys(value).length > max) fail();
  const result = Object.create(null);
  for (const [key, val] of Object.entries(value)) {
    if (!/^[A-Za-z_][A-Za-z0-9_.-]{0,127}$/.test(key) || ['__proto__', 'constructor', 'prototype'].includes(key)) fail();
    result[key] = text(val);
  }
  return result;
}
// Secret-aware dictionary: null/undefined removes the entry, MASKED_SECRET
// leaves it unchanged (never erased accidentally), any other string replaces it.
export function maskedDictionary(value, max = 64) {
  object(value, Object.keys(value || {}));
  if (Object.keys(value).length > max) fail();
  const result = Object.create(null);
  for (const [key, val] of Object.entries(value)) {
    if (!/^[A-Za-z_][A-Za-z0-9_.-]{0,127}$/.test(key) || ['__proto__', 'constructor', 'prototype'].includes(key)) fail();
    if (val === null) { result[key] = null; continue; } // remove intent
    if (val === MASKED_SECRET) { result[key] = MASKED_SECRET; continue; } // unchanged intent
    result[key] = text(val); // replace
  }
  return result;
}
// Resolve masked secret edits against the previously stored value:
// MASKED_SECRET keeps the existing secret (unchanged), null removes it,
// any other string replaces it. Resolved values are strings only.
export function mergeSecrets(previous, input) {
  if (input === undefined) return previous;
  const next = { ...(previous || {}) };
  for (const [key, val] of Object.entries(input)) {
    if (val === MASKED_SECRET) continue; // unchanged: keep existing secret
    if (val === null || val === undefined) { delete next[key]; continue; } // remove
    next[key] = val; // replace (validated string)
  }
  return next;
}
export function scope(value) {
  if (value === undefined) return 'global';
  if (value !== 'global' && value !== 'project') fail();
  return value;
}
export function reconnect(value) {
  if (value === undefined) return undefined;
  object(value, ['enabled', 'maxAttempts']);
  const enabled = flag(value.enabled);
  const maxAttempts = value.maxAttempts ?? 5;
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 100) fail();
  return { enabled, maxAttempts };
}
export function timeout(value) {
  if (value === undefined) return undefined;
  if (!Number.isInteger(value) || value < 1000 || value > 3600000) fail();
  return value;
}
export function instructionLimit(value) {
  if (value === undefined) return undefined;
  if (!Number.isInteger(value) || value < 1 || value > 100000) fail();
  return value;
}
export function serial() {
  let tail = Promise.resolve();
  return operation => { const next = tail.then(operation); tail = next.catch(() => {}); return next; };
}
// Codes are chosen by our operation stage, never copied from dependency errors.
export function safeFailure(error, stage = 'operation') {
  const codes = { validation: 'MANAGER_VALIDATION_FAILED', persistence: 'MANAGER_PERSISTENCE_FAILED', unavailable: 'MANAGER_UNAVAILABLE', activation: 'MANAGER_ACTIVATION_FAILED', operation: 'MANAGER_OPERATION_FAILED' };
  return { ok: false, code: codes[stage] || codes.operation, ...(stage === 'persistence' && PERSISTENCE_REASONS.includes(error?.reason) ? { reason: error.reason } : {}), error: stage === 'validation' && error instanceof InputError ? error.message : 'Manager operation failed. Configuration and credentials were not included in this error.' };
}
// Fixed diagnostic reasons for persistence failures; never copies dependency text or codes.
export const PERSISTENCE_REASONS = ['OWNED_UNAVAILABLE', 'OWNED_CHANGED', 'ENTRY_UNAVAILABLE', 'ENTRY_RELOADED', 'PLUGIN_INACTIVE', 'OVERRIDDEN', 'YAML_ERROR', 'FILE_IO', 'RELOAD_OR_UNKNOWN', 'OWNED_CHANGED_NO_FIBER', 'OWNED_CHANGED_CTX_FIBER', 'OWNED_CHANGED_ENTRY_NOT_FIBER_ENTRY', 'OWNED_CHANGED_ENTRY_FIBER_REPLACED', 'OWNED_CHANGED_FIBER_CTX', 'OWNED_CHANGED_FIBER_STATE', 'OWNED_CHANGED_NOT_INCLUDE_ROOT', 'OWNED_CHANGED_OK', 'OWNED_CHANGED_EDITOR', 'OWNED_CHANGED_ENTRIES'];
export function persistenceReason(error) {
  const message = typeof error?.message === 'string' ? error.message : '';
  if (message === 'Owned root configuration unavailable.') return 'OWNED_UNAVAILABLE';
  if (message === 'Owned root configuration changed.') return PERSISTENCE_REASONS.includes(error?.detail) ? error.detail : 'OWNED_CHANGED';
  if (message === 'Configuration entry is no longer available') return 'ENTRY_UNAVAILABLE';
  if (message === 'Configuration entry changed during reload') return 'ENTRY_RELOADED';
  if (message === 'Configuration plugin is no longer active') return 'PLUGIN_INACTIVE';
  if (/is overridden by a home patch or command-line overlay$/.test(message)) return 'OVERRIDDEN';
  if (message === 'Profile patch must be a YAML sequence' || /^YAML/.test(String(error?.name))) return 'YAML_ERROR';
  if (typeof error?.code === 'string' && /^E[A-Z]+$/.test(error.code)) return 'FILE_IO';
  return 'RELOAD_OR_UNKNOWN';
}
export const safeError = error => error instanceof InputError ? error.message : 'Manager operation failed. Configuration and credentials were not included in this error.';
