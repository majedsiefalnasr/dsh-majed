// Adapted from V1ki/dsh-plugin-subscriptions v0.9.12 (b802311) src/client/usage-window-filter.ts, MIT; see src/PROVENANCE.md.
import type { SubscriptionProvider, UsageWindow } from './usage-types.js'

/** Presentation only: never trim the raw snapshots used by quota/routing logic. */
export function visibleUsageWindows(
  provider: SubscriptionProvider,
  windows: UsageWindow[] | undefined,
  visibleModels: readonly string[] | undefined,
): UsageWindow[] {
  const all = windows ?? []
  // Other providers may scope quotas by family rather than exact model ID.
  if (provider !== 'antigravity' || visibleModels === undefined) return all
  const selected = new Set(visibleModels)
  return all.filter(window => !window.scope || selected.has(window.scope))
}
