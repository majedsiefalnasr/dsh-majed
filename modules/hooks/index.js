import { object, text, flag, fail } from '../managers/validation.js';
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
