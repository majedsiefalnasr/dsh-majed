# Ticket 131 work contract and verification

## Contract

- Ticket: #131, Subscriptions: composer usage badge, Speed control and `/fast`. Stories 4 and 49–54 of `docs/specs/subscriptions.md`. Baseline `3f576ed` on `impl/131-badge-speed`, worktree `dsh-majed-t131`.
- Source: V1ki/dsh-plugin-subscriptions v0.9.12 (`b8023110864494acefc6f5963c2a197d85dda20c`, MIT), read-only at `/tmp/upstream-0.9.12`. File-level map and dispositions: `src/PROVENANCE.md` section "#131".
- Scope kept: Codex only (our `status` returns only Codex); no `~/.dsh`, installed plugin, account, network or secret access; nothing pushed or merged.

## What was ported, and from where

| Surface | Owned file | Reference |
| --- | --- | --- |
| Composer usage badge, panel of every account and window | `src/usage-badge/SubscriptionUsageBadge.tsx` | `src/client/SubscriptionUsageBadge.tsx` |
| Display setting (recent / hidden), preference store | `src/usage-badge/UsageBadgeDisplaySetting.tsx`, `usage-badge-preferences.ts` | `UsageBadgeDisplaySetting.tsx`, `usage-badge-preferences.ts` |
| Window filter, host icon, shared types | `src/usage-badge/usage-window-filter.ts`, `host-icons.ts`, `usage-types.ts`, `slot-types.ts`, `host-modules.ts` | `usage-window-filter.ts`, `host-icons.ts`, types from `SubscriptionsSection.tsx` |
| Speed control and `/fast` description | `src/speed/SpeedSelect.tsx`, `fast-command.ts` | `SpeedSelect.tsx`, `fast-command.ts` |
| Registration (slots, `/fast`) | `src/browser.ts` | `src/client/index.ts` |
| Host `speed` / `setSpeed` | `src/subscriptions.ts` | `src/auth/rpc.ts`, `src/index.ts` |
| Locale (19 keys, EN + AR) | `locale/en.json`, `locale/ar.json` | `src/client/locales.ts` (English); Arabic written here |

## Reused from #129/#130 (nothing duplicated)

`callSubscriptionsAuth` (`src/settings/subscriptions-rpc.ts`), `DISPLAY_NAME_CHANGED` (`src/settings/display-name-events.ts`), `subscriptionChromeCss` (already majed-prefixed in `src/settings/provider-settings-styles.ts`), the host `usage`/`status` endpoints and `force: false` default, `CodexAdapter.supportsFastTier`/`fastCapableModels`, `ProviderSettingsStore.subagentSpeed`, `accountModelId`/`parseAccountModelId`, the `isolate()` pattern and the presence/reference probes of `src/browser.ts`, the `mount()` host harness of `test/effective-settings.test.mjs`, the `manage-render` transpile-and-render harness.

## Behavior and decisions

- Surfaces (Speed slot `conversation.input.right` id `majed-subscription-speed`, badge slot `conversation.composer.dock` id `majed-subscription-usage`, `/fast`) are registered only while `present && !referenceEnabled && !disposed` and are withdrawn otherwise (component off or absent, reference serving, dispose). Each registration is isolated: a failing slot does not affect the Settings section, the other surface or core dsh-majed.
- Speed is visible only for provider `codex` and a model in the catalog's fast list; `/fast` refuses with `commandFastUnavailable` otherwise. The explicit choice is per session and resets on restart (reference behavior); a subagent without an explicit choice uses its saved model default; every request still re-checks catalog support.
- Automatic usage reads send `{provider, account, force: false}`; opening the panel does not force either (tested).
- Deviations: (1) browser access to `@deepseek-ai/dsh-client-ui-primitives` and `react-dom` is lazy (a missing module breaks only the render, never registration); (2) storage key/event, slot ids, CSS classes carry the `majed` prefix; (3) RTL via logical CSS properties; (4) the multi-provider pure helpers (Antigravity branches) are kept so reference tests stay faithful; (5) the media tool-view reference test (#133) and Antigravity copy test (#135) are not ported.

## Tests (all run in this worktree)

- New host test `test/speed-control.test.mjs` (8): prefixed routes, per-session tier, `service_tier: 'priority'` only for a fast-capable model, subagent default vs explicit override, per-account ids for independent-entry accounts, payload validation, no-login state, routes removed on dispose.
- Ported reference specs in `test/reference/` (client-speed, client-command, usage-badge-preferences, usage-window-filter, subscription-usage-badge).
- `test/composer-surfaces.test.mjs` (10, EN + AR rendering with react-test-renderer): Speed menu, failed set stays, hidden for unsupported model, load failure, poll cleanup on unmount; display setting persistence and storage error alert; badge auto-load without force, default account, expanded panel with every account/window, hidden mode (no traffic), RPC failure, last-known windows, missing rpc, model read failure.
- `test/subscriptions-browser.test.mjs` (+6): majed ids/orders, withdraw on absence/dispose, reference serving, slot failure isolation, `/fast` behavior and Arabic description.
- `test/locale-completeness.test.mjs` now scans `src/usage-badge`, `src/speed` and `src/browser.ts`; route counts raised 16 → 18 in `test/lifecycle-owned.test.mjs` and `test/subscriptions-host.test.mjs`.
- `npm test`: classifier 166/166; Node 450/450, 0 fail/cancel/skip. `npm run check:build`: "Committed output matches a fresh build."

## Honest limits (NOT live-verified)

- Nothing was run in a real DSH host: slot rendering position (`[data-composer-stats]` row), anchored panel placement, the real primitives (`useAnchoredPosition`, icons), `commandUi` popup behavior and the real model directory are exercised only through doubles.
- Real Codex catalog and `service_tier` upstream behavior is covered with fixture HTTP only.
- Arabic copy is mine and not reviewed by a native speaker; final visual polish is deferred by the Owner.
- Host changes (`speed`/`setSpeed`) need a full DSH restart; the browser half needs only a reload.

## Owner live test steps

1. Install the packed candidate, restart DSH fully, enable our component (reference off).
2. Open a Codex chat: the composer shows `Codex …%` badge; click it: every account and window appear; close with Escape/outside click.
3. Settings ▸ Subscriptions ▸ "Status-bar quota display": choose Hidden — badge disappears; Recent — returns.
4. With a fast-capable Codex model: Speed control shows "Speed · Standard"; switch to Fast and send a message; run `/fast` and confirm the same choice (active marker).
5. Switch to a model without a fast tier: Speed control disappears and `/fast` reports it is unavailable.
6. Switch language to Arabic: all of the above are translated and mirrored.
7. Turn the component off (or enable the reference): badge, Speed and `/fast` disappear; core dsh-majed keeps working.
