# R01/R02 next acceptance matrix — 2026-10-27

## Scope decision

Read authoritative GitHub R01 #48 and R02 #55 on 2026-10-27; both remain open. R02 is blocked by R01 and blocks eight follow-ups. Read the account/direct evidence at candidate base `3148417` (including merged revocation fence `e43fa5b`). Existing evidence covers production service composition with controlled transports, temporary protected stores, native admitted Fetch/RPC, restart/remount, refresh, ModelDirectory metadata and prepared direct dispatch. It explicitly does not cover complete native browser or operational parity.

No new production defect was established by the lead's browser observations. A fixed panel font measurement without before/after or typography intent is not a justified font bug; a narrow rectangle without visual clipping evidence is not a justified layout bug. Existing final-validation revocation regressions already address R02 removal/consent races. Do not invent another concurrency test or new seam simply to produce a code change.

This is an evidence-gap decision, not a claim that every implementation criterion or the full specification is complete. No product code changed; no implementation red/green cycle was appropriate. Other provider, search/media/quota/reset and release obligations remain unchanged.

## Exact next native-browser matrix (lead-only permission)

Use the existing reviewed stock rc.3 isolated launch procedure only after the lead confirms browser/cache and launch permission. Keep temp HOME/DSH_HOME, no accounts/providers and management disabled. Do not substitute the real GUI or rerun setup in this worker.

| Axis | Cases and actions | Required evidence and decision |
| --- | --- | --- |
| Locale and size | English and Arabic; desktop 1280×900 and narrow 420×800; open Settings → Subscriptions → Codex | Capture full dialog and panel screenshots per case; record dialog, nav and panel bounding boxes, document and panel scroll extents; inspect all visible labels/controls for clipping, overlap, wrapping and readability. RTL direction alone is insufficient. |
| Theme and typography | Both locale directions, light/dark, UI font 14/18; desktop and narrow sizes | Record host setting and panel heading/body/control before/after computed fonts plus screenshots. Compare intended host typography inheritance in existing client/native styles before labeling a defect. Check focus/disabled/control contrast in both themes, not only body background. |
| Keyboard | Each locale at desktop and narrow sizes | Open Settings without mouse; reach Subscriptions and Codex controls through forward/reverse Tab; record focus order and visible ring, activate applicable controls using Enter/Space, reach scroll-hidden controls, close with supported native key and verify focus return. Do not enable account/runtime paths or start OAuth in this no-account matrix. |
| Accurate state rendering | Current no-account disabled state in both locales | Capture labels, disabled controls and admission/error surfaces without fabricating authenticated state. This cannot satisfy pending/cancelled/failed/connected/reauthentication visual coverage. |

A defect reproduced here must be mapped to R01 localized native states or R02 native Settings/picker behavior, diagnosed at the existing public client seam, and fixed with a focused regression before the full suite. A new injection seam requires an explicit proposal first.

## Controlled native workflow still needed (separate scoped plan)

R01 requires native Settings pending/cancelled/failed/connected/reauthentication states, controlled OAuth completion, private temporary store, actual isolated host stop/start retention and controlled refresh. R02 requires actual browser picker selection, explicit settings, selected-account dispatch and native session persistence; account removal/catalog invalidation, expired credentials, catalog/partial-stream failure, disable and unload/reload should be observed without duplicate registration. Existing mounted/jsdom product evidence remains useful but cannot stand in for these browser/session checks.

Before execution, propose and get approval for a stock-host composition using existing public plugin/transport APIs and synthetic credentials. Name how OAuth and Responses/catalog endpoints are controlled without host patching, synthetic boot/auth, reading real accounts or creating production test hooks. If existing native public APIs cannot supply that controlled seam, document the unsupported contract and request a seam proposal; do not silently replace native admission or route traffic to a real provider. This worker is not authorized to launch it.

## Operational gates (not required for the safe visual matrix)

- Real login/refresh/provider dispatch, installed composition changes, actual desktop restart and paired-remote operational use require separate explicit approval and an account/traffic budget. Do not request secrets in chat.
- Exact rc.2 compatibility remains unverified; either authorize an isolated version-specific runtime proof or obtain an explicit supported-version decision. rc.3 success does not establish rc.2 compatibility.
- Push, tracker writes, integration merge, Cutover and reference removal remain forbidden in this candidate. Full R01/R02 closure is not claimed.

## Verification provenance

This worker read issue bodies through read-only GitHub tools and repository evidence. `git log -6 --oneline`, `git diff --quiet` and `git branch --show-current` confirmed the base and clean tracked candidate before documentation additions. Historical suite counts in the direct evidence are not fresh test execution. No tests were rerun because this increment changes documentation only; no native browser/host was launched. Commit only these two new reports, not untracked extracted runtimes, generated temp stores or credentials.
