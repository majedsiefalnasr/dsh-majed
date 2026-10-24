/**
 * Contract verified against installed executable @deepseek-ai/dsh-config-editor
 * lib/index.js:30-34,69-83 and cordis-plugin-loader lib/index.js:463.
 * entries() is profile-root Include scoped. Entry.fiber is the exact loaded
 * plugin fiber (not an injected child, which can inherit fiber.entry).
 * Never call configuration(): it reads unrelated profile values.
 */
export function createContextOwnership(ctx) {
  const fiber = ctx.fiber;
  return {
    get id() { return fiber?.entry?.options?.id; },
    /** Fixed condition names only; never object contents. */
    diagnose(entry) {
      if (!fiber) return 'NO_FIBER';
      if (ctx.fiber !== fiber) return 'CTX_FIBER';
      if (entry !== fiber.entry) return 'ENTRY_NOT_FIBER_ENTRY';
      if (entry?.fiber !== fiber) return 'ENTRY_FIBER_REPLACED';
      if (fiber.ctx !== ctx) return 'FIBER_CTX';
      if (fiber.state !== 2) return 'FIBER_STATE';
      if (entry?.parent?.tree?.ctx?.fiber?.entry?.id !== 'include') return 'NOT_INCLUDE_ROOT';
      return 'OK';
    },
    isOwnedRoot(entry) {
      return !!fiber && ctx.fiber === fiber && entry === fiber.entry
        && entry.fiber === fiber && fiber.ctx === ctx && fiber.state === 2
        && entry.parent?.tree?.ctx?.fiber?.entry?.id === 'include'
        && typeof entry.options?.id === 'string' && entry.options.id.length > 0;
    },
  };
}
