// Adapted from V1ki/dsh-plugin-subscriptions v0.9.11 (MIT).
// Commit 7639ed9958a9a1c4159faa1f4e6e15e9ede60b7d; see PROVENANCE.md.
/** Explain client-side gating; the server independently revalidates before spending. */
export function resetActionBlock(usage: {
  windows?: { kind: string; scope?: string; usedPercent: number; resetsAt?: number }[]
  resetCredits?: { id?: string; expiresAt?: number }[]
  resetCreditsError?: string
}, now = Date.now()): 'resetUseGuard' | 'resetUseRefresh' | 'resetUseRestart' | undefined {
  const weekly = usage.windows?.find(w => w.kind === 'weekly' && w.scope === undefined)
  if (!weekly || !Number.isFinite(weekly.usedPercent)) return 'resetUseRefresh'
  if (weekly.usedPercent < 80) return 'resetUseGuard'
  if (weekly.resetsAt === undefined || weekly.resetsAt <= now || usage.resetCreditsError) return 'resetUseRefresh'
  if (!usage.resetCredits?.some(c => c.id)) return 'resetUseRestart'
  if (!usage.resetCredits.some(c => c.id && (c.expiresAt === undefined || c.expiresAt > now))) return 'resetUseRefresh'
  return undefined
}
