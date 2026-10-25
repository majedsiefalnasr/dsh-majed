import { object, text, flag, fail, serverPath, scope as validateScope, reconnect, timeout, instructionLimit } from '../managers/validation.js';
export const HOOK_EVENTS = Object.freeze(['SessionStart', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'PermissionRequest', 'Stop', 'PostCompact']);
export const HOOK_SCOPES = Object.freeze(['user', 'project']);
export const SOURCE_KINDS = Object.freeze(['inline', 'file']);
export function validateHooks(value = {}) {
  object(value, ['enabled', 'deny', 'audit', 'auditLimit']);
  const enabled = flag(value.enabled); const audit = flag(value.audit);
  const deny = value.deny ?? [];
  if (!Array.isArray(deny) || deny.length > 64) fail();
  for (const pattern of deny) if (!/^[A-Za-z0-9_./*-]{1,128}$/.test(text(pattern, 128))) fail();
  const auditLimit = value.auditLimit ?? 100;
  if (!Number.isInteger(auditLimit) || auditLimit < 1 || auditLimit > 200) fail();
  return { enabled, deny: [...deny], audit, auditLimit };
}
export function validateEnv(value) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 64) fail();
  for (const entry of value) {
    if (typeof entry !== 'string' || !entry || entry.length > 128) fail();
    if (/[=]/.test(entry)) fail(); // names only, never values
    if (!/^[A-Za-z_][A-Za-z0-9_.-]*$/.test(entry)) fail();
  }
  return [...value];
}
export function validateLimits(value) {
  if (value === undefined) return undefined;
  object(value, ['timeout', 'output']);
  const timeout = Number.isInteger(value.timeout) && value.timeout >= 1000 && value.timeout <= 3600000 ? value.timeout : fail();
  const output = Number.isInteger(value.output) && value.output >= 1 && value.output <= 1000000 ? value.output : fail();
  return { timeout, output };
}
export function validateMatcher(value) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !value || value.length > 256) fail();
  return value;
}
export function validateCwd(value) {
  if (value === undefined) return undefined;
  return serverPath(value);
}
export function validateShell(value) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !value || value.length > 256) fail();
  return value;
}
export function validateWatchedFiles(value) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > 32) fail();
  for (const p of value) if (!serverPath(p)) fail();
  return [...value];
}
export function validateCommandHook(input = {}) {
  object(input, ['id', 'events', 'command', 'source', 'enabled', 'env', 'matcher', 'cwd', 'shell', 'limits', 'watchedFiles']);
  const id = text(input.id, 128);
  if (!Array.isArray(input.events) || input.events.length === 0 || input.events.length > 16) fail();
  for (const event of input.events) if (!HOOK_EVENTS.includes(event)) fail();
  const command = text(input.command, 4096);
  if (!SOURCE_KINDS.includes(input.source)) fail();
  const enabled = flag(input.enabled);
  const env = validateEnv(input.env);
  const matcher = validateMatcher(input.matcher);
  const cwd = validateCwd(input.cwd);
  const shell = validateShell(input.shell);
  const limits = validateLimits(input.limits);
  const watchedFiles = validateWatchedFiles(input.watchedFiles);
  return Object.freeze({ id, events: [...input.events], command, source: input.source, enabled, env, matcher, cwd, shell, limits, watchedFiles });
}
export function validateCommandHooks(input) {
  if (!Array.isArray(input)) fail();
  const ids = new Set();
  const hooks = [];
  for (const item of input) {
    const hook = validateCommandHook(item);
    if (ids.has(hook.id)) fail();
    ids.add(hook.id);
    hooks.push(hook);
  }
  return Object.freeze(hooks);
}
export function validateCommandHookConfig(value = {}) {
  object(value, ['user', 'project']);
  const user = value.user === undefined ? { enabled: false, hooks: [] } : value.user;
  const project = value.project === undefined ? { enabled: false, hooks: [] } : value.project;
  object(user, ['enabled', 'hooks']);
  object(project, ['enabled', 'hooks']);
  return {
    user: { enabled: flag(user.enabled), hooks: validateCommandHooks(user.hooks) },
    project: { enabled: flag(project.enabled), hooks: validateCommandHooks(project.hooks) },
  };
}
/** Inert Command hooks store: create/replace/delete/disable only, no execution. */
export function createCommandHooksManager() {
  let config = { user: { enabled: false, hooks: [] }, project: { enabled: false, hooks: [] } };
  return {
    replace(scope, hooks) {
      if (!HOOK_SCOPES.includes(scope)) fail();
      config = { ...config, [scope]: { ...config[scope], hooks: validateCommandHooks(hooks) } };
    },
    upsert(scope, hook) {
      if (!HOOK_SCOPES.includes(scope)) fail();
      const next = validateCommandHook(hook);
      const current = config[scope];
      const index = current.hooks.findIndex(h => h.id === next.id);
      const nextHooks = index < 0 ? [...current.hooks, next] : [...current.hooks.slice(0, index), next, ...current.hooks.slice(index + 1)];
      config = { ...config, [scope]: { ...current, hooks: nextHooks } };
      return next;
    },
    remove(scope, id) {
      if (!HOOK_SCOPES.includes(scope)) fail();
      text(id, 128);
      const current = config[scope];
      const index = current.hooks.findIndex(h => h.id === id);
      if (index < 0) return false;
      config = { ...config, [scope]: { ...current, hooks: [...current.hooks.slice(0, index), ...current.hooks.slice(index + 1)] } };
      return true;
    },
    setEnabled(scope, id, enabled) {
      if (!HOOK_SCOPES.includes(scope)) fail();
      text(id, 128);
      const flagEnabled = flag(enabled);
      const current = config[scope];
      const index = current.hooks.findIndex(h => h.id === id);
      if (index < 0) return false;
      const next = { ...current.hooks[index], enabled: flagEnabled };
      config = { ...config, [scope]: { ...current, hooks: [...current.hooks.slice(0, index), next, ...current.hooks.slice(index + 1)] } };
      return true;
    },
    snapshot() {
      return {
        user: { enabled: config.user.enabled, hooks: config.user.hooks.map(h => ({ ...h, env: [...h.env] })) },
        project: { enabled: config.project.enabled, hooks: config.project.hooks.map(h => ({ ...h, env: [...h.env] })) },
      };
    },
  };
}
export const commandHooksConfigFields = { commandHooks: { type: 'object', default: { user: { enabled: false, hooks: [] }, project: { enabled: false, hooks: [] } }, description: 'Inert Command hook definitions: create/edit/disable in user and project scopes. No execution — Approval and execution are separate (T10).' } };
export function matchesTool(pattern, name) {
  // Simple bounded wildcard matching, not user-provided regular expressions.
  let p = 0, n = 0, star = -1, mark = 0;
  while (n < name.length) {
    if (p < pattern.length && pattern[p] === name[n]) { p++; n++; }
    else if (pattern[p] === '*') { star = p++; mark = n; }
    else if (star !== -1) { p = star + 1; n = ++mark; }
    else return false;
  }
  while (pattern[p] === '*') p++;
  return p === pattern.length;
}
export function createHooksManager(ctx) {
  let config = validateHooks(); let cleanup = []; const events = [];
  function dispose() { for (const stop of cleanup.splice(0)) stop(); }
  return {
    replace(input) {
      const next = validateHooks(input); dispose(); config = next; events.length = 0;
      if (!next.enabled) return;
      if (!ctx.tools?.guard) throw new Error('Tool guard service unavailable.');
      const release = ctx.tools.guard(exec => {
        const name = typeof exec?.name === 'string' ? exec.name : '';
        return next.deny.some(pattern => matchesTool(pattern, name)) ? 'Denied by managed tool policy.' : undefined;
      });
      if (typeof release === 'function') cleanup.push(release);
      if (next.audit) {
        const stop = ctx.on('tools/result', (exec, _result) => {
          // Do not retain arguments, results, tokens, agent identity, or arbitrary tool names.
          const candidate = typeof exec?.name === 'string' ? exec.name : '';
          const tool = /^[A-Za-z0-9_.\/-]{1,128}$/.test(candidate) ? candidate : 'unknown';
          events.push({ time: Date.now(), tool, event: 'tool-result' });
          if (events.length > next.auditLimit) events.splice(0, events.length - next.auditLimit);
        });
        if (typeof stop === 'function') cleanup.push(stop);
      }
    },
    snapshot: () => ({ ...config, deny: [...config.deny], events: events.map(event => ({ ...event })) }),
    dispose,
  };
}
export const hooksConfigFields = { hooks: { type: 'object', default: { enabled: false, deny: [], audit: false, auditLimit: 100 }, description: 'Deterministic tool denies and bounded metadata-only result audit. No shell execution.' } };
