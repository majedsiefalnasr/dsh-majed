# Account-bearing usage roster repair

## Approved bounded contract

Owner confirmed missing badge with reference Subscriptions off, current/most-recent preference, Codex selected and Speed visible. Latest explicit repair authorization supersedes the earlier diagnosis-only freeze. Baseline `0c8bab1`; isolated branch `fix/usage-badge-account-roster`, worktree `../dsh-majed-badge-repair`. Surgical patch / Karpathy / TDD route: known mechanism and Owner-approved actual rendered badge seam make a larger design/ticket cycle unnecessary. No new dependency, cosmetic redesign, fake Zen accounts, host/provider/auth changes or external reference retrieval.

Acceptance: actual React badge survives mixed Zen snapshot plus Codex accounts; only legitimate supported account-bearing providers reach usage RPC, all five supported providers remain available, empty/loginless/unknown entries do not poison refresh, popup preserves account windows. Test uses existing renderer/host primitive seam and fake RPC only; no browser or network.

## Mechanism and patch

`src/subscriptions.ts:564` places `opencode-zen` first in general status. `src/providers/zen.ts:89` returns `{ reachable, modelCount, source }`; initial values are null, five static models, and static source. General status adds registrationError but no accounts. Badge previously cast every provider key to SubscriptionProvider then dereferenced accounts.length; catch swallowed the error before Codex usage.

`src/usage-badge/SubscriptionUsageBadge.tsx` now checks own membership in its existing supported-provider display-name map at roster admission and skips missing/null/non-array account rosters. Existing order, default selection, cache semantics, usage arguments and popup rendering stay unchanged. Zen status producer remains unchanged.

## Test-first evidence

- Initial mixed-roster regression failed before implementation: rendered pill count 0 instead of 1 (`AssertionError [ERR_ASSERTION]: Codex badge remains visible after loginless Zen`).
- Final authentic initial snapshot fixture was rechecked against baseline source, restoring patched bytes in finally: deliberate red exit 1, same missing-pill assertion. Log `../badge-red-final.log`.
- Patched focused suite: 13/13, exit 0 (`../badge-focused-final.log`). New regression asserts Codex text/windows, no Zen usage, and both account identities in opened popup.
- Roster matrix asserts all codex/claude/grok/copilot/antigravity account providers reach usage and appear as five popup sections; unknown account-bearing and loginless providers are excluded. Refresh to empty known rosters plus missing/null/non-array known entries makes no usage calls and removes stale badge.
- `npm run build`: exit 0 (`../badge-build.log`).
- Final `npm test`: classifier 166/166, Node 853/853, no failures/cancellations/skips, exit 0 (`../badge-full-final.log`).
- Final `npm run check:build`: exit 0, committed output matches fresh build (`../badge-checkbuild-final.log`).
- `git diff --check`: exit 0. Locked offline setup `npm ci --ignore-scripts --offline` used approved cache without new dependencies.

One unexpected fixture failure consumed: this VM loader needs the existing explicit translator prop; omitted translator made fallback JSON default import undefined (`Cannot read properties of undefined (reading 'subscriptions')`). Corrected test prop, no product workaround. Deliberate baseline reds excluded; no second unexpected failure. Existing renderer deprecation warnings retained.

## Boundaries and remaining gates

Only source badge, composer tests, regenerated browser artifacts, changelog and worker evidence/state are scoped. Protected OAuth/auth source and generated host files unchanged, verified by changed-path inventory without printing values or diffs. Original checkout dirty current-work document preserved untouched.

Local candidate only, unmerged/unpushed. Self-inspection found no additional Standards or Spec defect; independent two-axis review not performed because nested agents are prohibited. Lead must independently review against baseline and this contract, verify package member safety/byte equality, and reconcile state before integration. No package created by worker. No installed/profile/account/credential/browser/network/live-provider operation, push, merge or issue closure. Actual installed disappearance/reappearance and real-provider behavior are not claimed. Separate installation permission and consolidated Owner acceptance remain required.
