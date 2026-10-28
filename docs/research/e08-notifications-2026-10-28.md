# E08 — private device-local notifications: bounded candidate

2026-10-28. GitHub #88 remains OPEN. This document records controlled development evidence, not complete browser/OS/native/paired acceptance.

## Contract and scope

- Candidate branch: `impl/e08-notifications`; exact starting base: `c7e82a40c8b603a3431b5713fce564fd8a6ef5d2`.
- Integration tip `f6a4159a79d52a5ac3bcd7e7dedc670366c2868b` was incorporated by normal `git merge --no-edit integration/current-scope-20261028`, producing merge `f1cc3ff627d2550385186afbd8d7f7ad363f80a2`. No reset, rebase or force operation.
- Explicit selected route: `codex/gpt-6.1-sol`. This is the Owner-selected proven coding route after the supplied OpenCode shared-free-quota 429, not a pricing rank. No account/provider probes or route switching were performed.
- Reused [existing client](../../client.js), notification preference store, actual NotificationWatcher and E01 reset button markup conventions. No framework, dependency, server, operational pairing or installed-state change.
- Lead owns [current-work](../ai/current-work.md) reconciliation. Lead separately supplied and authorized retaining the narrow baseline expectation refresh; worker retained it, without editing that test. The Lead's untracked coordination note is not part of the scoped candidate commit. The only shared harness change supplies EventTarget behavior to its existing window fixture for production focus/visibility listeners.

## Behavior delivered by this candidate

- Default background-only, completion/action enabled. Off suppresses event alerts, not explicit Send test. Foreground Always alerts set `silent: true`; background alerts leave OS sound policy in control. No vibration, audio playback or DND bypass.
- System title is `DeepSeek Harness` unless the profile explicitly enables session-title disclosure. Bodies describe approval/question/plan/completion generically and never include command, tool, file or conversation content. Title reset immediately restores privacy.
- Mode, completion, action and title have isolated immediate keyboard-operable resets; no reset asks OS permission or alters unrelated preferences. Permission prompts originate only from explicit Settings gestures. Returning focus/visibility refreshes permission status without prompting.
- Native pending identity is kind plus key/callId; baseline and suppressed events are claimed before asynchronous delivery. Repeated/disappearing pending snapshots and overlay remounts do not replay a claimed event during a continuous connection. Distinct interventions and new running-to-finished transitions remain distinguishable. Ledger is interface-local, cleared on feature disposal, never persisted or externally transmitted.
- Actual completion/action preference changes fence and close only that event class; unrelated or semantically unchanged writes leave queued/delivered alerts intact. Mode/title changes retain the shared fence (including genuine Off and title-disclosure revocation). Resolution, permission revocation, Settings/watcher unmount and feature disposal continue fencing stale asynchronous work. Failed delivery does not retry an already claimed native event.
- Constructor notifications own an `onclick` calling the existing injected `uiWorkspace.openSession(sessionId)`. Unsupported/insecure/denied/constructor-failure cases show an explicitly in-app, private, dismissible status with an actual-session button through the same seam. No OS delivery is claimed for the fallback.

## Q135 observable regression evidence

Primary seam is [mounted E08 test](../../test/accepted/e08-notifications.test.js): real ReactDOM/jsdom native Settings contributions and user actions → production built `dist/client.js` preference store → actual NotificationWatcher with native-shaped lifecycle hook input → observable notification/fallback text and navigation. Native presentation primitives, hook inputs and browser/OS effects are controlled adapters. No private helper invocation or source-text assertion substitutes for this seam.

Vertical evidence recorded during implementation (every planned RED exited 1; GREEN exited 0):

| Slice | Observable RED | Subsequent GREEN |
| --- | --- | --- |
| Private default | Session title leaked instead of `DeepSeek Harness` | Generic title/body and actual-session constructor click passed |
| Title opt-in/reset | 2 tests: 1 pass / 1 fail, `native Settings exposes the optional title disclosure` | 2/2 passed |
| Off explicit test | 3 tests: 2 pass / 1 fail, `explicit test works even in Off` | 3/3 passed |
| Isolated resets | 4 tests: 3 pass / 1 fail, `Reset system notifications` | Mounted isolated resets passed after implementation; fixture expectation corrected to include existing defaults |
| Pending cancellation | Queued notification escaped multiple toggle/resolution/unmount fences | Claimed-event cancellation and no-replay assertions passed |
| Settings permission wait | 20 tests: 19 pass / 1 fail, late notification `1 !== 0` | 20/20 passed |
| Permission status refresh | 21 tests: 20 pass / 1 fail, expected `/Blocked/` but displayed Allowed after focus | 21/21 passed |

Final focused command: `npm run build && node --test test/accepted/e08-notifications.test.js`: exit 0, 21 tests, 21 pass, 0 fail/cancelled/skipped/todo. Covers generic approval/question/plan/completion, optional title persistence and profile isolation, mode/focus/switch independence, explicit permission/no-reset prompt, fallback navigation, native key/callId distinctions, remount dedup, new completions, deferred permission cancellation, failure no-replay, revocation and unrelated-setting preservation.

Final full `npm test`: exit 0; automatic accepted-test discovery includes E08 and retained E01. Node test summary: 553 tests, 553 pass, 0 fail/cancelled/skipped/todo. Embedded classify runner also reports 166/166 passed. Build and package lifecycle checks completed inside the command. `git diff --check` passed with exit 0; the scoped implementation, focused tests, shared harness compatibility adjustment and Lead-supplied baseline expectations were reviewed before committing. Both starting-base and integration-tip ancestry checks passed with exit 0. These counts are controlled automated evidence only.

## Bounded review correction — 2026-10-28

Starting HEAD: `1434cce23cec3516d6eb937c4bfa15249b841a3a`. Sole approved correction: isolate completion/intervention invalidation and closure, and retract the unsupported authorization claim below. Explicit route remains `codex/gpt-6.1-sol` after the supplied OpenCode shared-free-quota 429; no price ranking, new delegation or provider probe. Lead owns integration checkpoint documents. Native investigation remains STOPPED at the same two failed checks; planned TDD RED is not investigation.

The existing mounted built-product seam above is unchanged. One failing test preceded each production change:

| Vertical slice | Focused RED (exit 1) | Minimal GREEN (exit 0) |
| --- | --- | --- |
| Unchanged completion reset preserves delivered/queued intervention | 22 tests: 21 pass / 1 fail; `unrelated unchanged reset leaves delivered intervention open` | 22/22; ignore unchanged notification writes |
| Changed completion toggle/reset preserves intervention | 23 tests: 22 pass / 1 fail; `completion toggle does not close intervention` | 23/23; event-control generation and delivered-alert ownership |
| Already-private title reset is unchanged | 25 tests: 24 pass / 1 fail; `already-private default reset is not a privacy revocation` | 25/25; absent/false title opt-in are semantically private |

Incremental reciprocal completion/action/reset proof passed 24/24 without another production change. Additional affected-completion disable/reset/no-replay/disposal proof passed 26/26; fallback isolation/navigation/own-disable proof passed 27/27. These are regression proofs for the same fix, not separate claimed RED cycles. Each focused run used `npm run build && node --test test/accepted/e08-notifications.test.js`; builds succeeded. No internal helper acceptance or shared baseline/helper changes.

Final focused build/tests: exit 0, 27 tests / 27 pass / 0 fail, cancelled, skipped or todo. Final `npm test`: exit 0, 559 tests / 559 pass / 0 fail, cancelled, skipped or todo (previous baseline 553; six added regressions); embedded classifier 166/166. Package lifecycle/build checks ran inside the full suite. `git diff --check`: exit 0. Mode/Off, genuine title privacy revocation, permission revocation, resolution, Settings/watcher unmount and disposal regressions remain green. The live native/browser/OS/paired and persistent-delivery acceptance gaps below are unchanged. Candidate remains unmerged/unpushed; #88 remains OPEN. Lead must collect this correction and independently re-review it; this repair does not authorize reduced capability or integration.

## Public seam investigation and unresolved acceptance

The pre-existing source called `navigator.serviceWorker.getRegistration()` and `showNotification` with `options.data = { sessionId }`, followed by constructor fallback. That data payload is not a persistent click-navigation handler. No supported host-owned persistent click/navigation contract was established within the bounded investigation. Native discovery stopped after two failed diagnostics: archive traversal returned `Not a directory (os error 20)` at `/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh`; the guessed `@deepseek-ai/dsh-client-ui-workspace/lib/client.browser.js` read returned `not found`. No host patch, archive extraction, private interception, operational-store inspection or further lookup workaround was attempted.

Current MDN evidence supplied by Lead: [showNotification](https://github.com/mdn/content/blob/main/files/en-us/web/api/serviceworkerregistration/shownotification/index.md), [notificationclick](https://github.com/mdn/content/blob/main/files/en-us/web/api/serviceworkerglobalscope/notificationclick_event/index.md). Persistent clicks fire in ServiceWorkerGlobalScope, not window Notification.onclick; cloned data alone cannot navigate. Silent delivery must not add vibration. Permission requires an explicit user gesture.

The candidate does not borrow an unowned remote-access/reference service worker. It delivers through the existing constructor path plus an explicitly in-app fallback, and does not claim persistent or closed-page mobile delivery. Whether a supported host-owned persistent click/navigation contract exists remains UNESTABLISHED: absence was not proved, and the specification permits honest in-app fallback on unsupported platforms. The constructor/fallback call to `uiWorkspace.openSession` is observable in controlled tests and follows the existing injected client seam; live native host navigation is NOT independently established by those adapters.

**Owner disposition (2026-10-28):** mobile and other real-device delivery is not proven and may be unavailable for now. The code is prepared as expected to work; the Owner will test on a real mobile after publication and report the outcome. Mobile verification is deferred and recorded as such, and does NOT block code merge or ticket closure once code review and available tests pass. No mobile delivery is claimed as working or as unsupported.

Missing acceptance is substantive, not merely a test label:

1. Persistent/mobile system delivery and click navigation: no established supported public service-worker contract. Constructor-forbidden platforms receive in-app fallback only while the interface remains connected; no universal mobile/installed/closed-page delivery claim.
2. Real desktop/browser OS permission prompts, constructor delivery, foreground silence, background OS/DND behavior, lock-screen privacy and actual-session click navigation.
3. Actual installed-native Settings primitives/lifecycle integration, narrow/mobile accessibility/layout, independently paired device/profile behavior, reconnect and suspension scenarios.
4. Real service-worker show/click/failure acceptance is absent; tests deliberately show the unowned worker is never invoked rather than pretending that synthetic worker data proves navigation.

Real-mobile validation is deferred to the Owner's post-publication device test. Desktop browser/OS, installed-native and paired validation remain unverified and need separate operational approval; #78 keeps its own independent browser acceptance. Nothing in this candidate authorizes a host edit, new server, restart, pairing, profile mutation or release. If a supported persistent click contract is later documented, it is a follow-up enhancement, not a hidden reduction.
