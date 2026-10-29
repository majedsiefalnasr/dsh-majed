// Adapted from V1ki/dsh-plugin-subscriptions v0.9.11 (MIT).
// Commit 7639ed9958a9a1c4159faa1f4e6e15e9ede60b7d; see PROVENANCE.md.
import type { SubscriptionProvider } from './SubscriptionsSection.js'

/** Notify mounted views after a successful save, without another quota request. */
export const DISPLAY_NAME_CHANGED = 'dsh-subscriptions-display-name-changed'
export interface DisplayNameChange { provider: SubscriptionProvider; displayName?: string }
export function notifyDisplayNameChange(provider: SubscriptionProvider, displayName?: string) {
  window.dispatchEvent(new CustomEvent<DisplayNameChange>(DISPLAY_NAME_CHANGED, {
    detail: { provider, ...(displayName?.trim() ? { displayName: displayName.trim() } : {}) },
  }))
}
