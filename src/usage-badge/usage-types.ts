// Adapted from V1ki/dsh-plugin-subscriptions v0.9.12 (b802311) src/client/SubscriptionsSection.tsx, MIT;
// see src/PROVENANCE.md. Only the wire types and bar colour the composer badge shares are kept.

/** Subscription provider ids, shared with the reference (ADR-0002); this component serves only `codex` today. */
export type SubscriptionProvider = 'codex' | 'claude' | 'grok' | 'copilot' | 'antigravity'

/** One logged-in account as answered by the `status` endpoint. */
export interface AccountStatus {
  key: string
  account?: string
  expiresAt?: number
  plan?: string
  isDefault: boolean
}

/** One provider's login state as answered by the `status` endpoint. */
export interface ProviderStatus {
  displayName?: string
  busy: boolean
  accounts: AccountStatus[]
  detail?: string
}

/** One rate-limit window as answered by the `usage` endpoint. */
export interface UsageWindow {
  kind: 'session' | 'weekly' | 'other'
  scope?: string
  usedPercent: number
  resetsAt?: number
}

/** `usage` endpoint value: the node half owns this shape. */
export interface ProviderUsage {
  supported: boolean
  windows?: UsageWindow[]
  plan?: string
}

/** Bar fill color: success normally, warn from 80%, error from 95%. */
export function usageBarColor(usedPercent: number): string {
  if (usedPercent >= 95) return 'var(--dsw-alias-state-error-primary)'
  if (usedPercent >= 80) return 'var(--dsw-alias-state-warn-label)'
  return 'var(--dsw-alias-state-success-primary)'
}

/**
 * Minimal structural face of the host `modelDirectories` service (the sanctioned cross-plugin channel:
 * cordis services, not value imports).
 */
export interface ModelDirectoriesLike {
  /** Resolve one session's shared model directory (throws for unknown sessions). */
  directoryFor(sessionId: string): {
    /** Load the directory; `current` is the session's effective model selection. */
    load(): Promise<{ current: { provider: string; model: string } | null }>
  }
}

/** Locale seat delivered by the slot outlet; absent in standalone renders. */
export type Translate = (key: string, params?: Record<string, unknown>) => string
