# #137 candidate evidence — controlled verification

Direct bounded implementation on `impl/137-opencode-zen`; stories 77–80 only. Existing owner-approved assembled adapter/RPC and actual rendered-card seams; no nested delegation or live operations.

## Reviewed-finding remediation — 2026-11-01

Direct Owner instruction supersedes the historical stop below: fix only the two reviewed P2 findings and missing proof, within the existing twenty-minute/two-unexpected-failure cap. No nested agents or operational actions. Lead supplied prior full/build/diffcheck success in `/tmp/majed137-lead-full.log` and `/tmp/majed137-lead-build.log`; those are historical prerequisites, not rerun claims.

- Cancellation regression RED `/tmp/majed137-review-abort-red.log` exit 1: aborted stalled discovery incorrectly returned five static models on an independent healthy retry. Minimal fix records `checkedAt` only if caller and disposal signals were not aborted; internal deadline/failure fallback still records its timestamp. GREEN `/tmp/majed137-review-abort-green.log` exit 0.
- Metadata regression RED `/tmp/majed137-review-metadata-red.log` exit 1: second refresh with failed models.dev offered known `paid-free` and `retired-free`. Adapter now retains last-known per-id metadata and merges successful updates; explicit new verdicts replace old ones, unavailable/missing verdicts do not erase them. GREEN `/tmp/majed137-review-metadata-green.log` exit 0; paid prepareCall remains denied.
- Actual registered Settings section in the assembled browser bundle now exercises EN/AR initial pending disable, Refresh click, transport error, retry recovery and rejection after pending unmount. No live browser was used. Existing direct factory smoke tests remain.
- Assembled host fixture pre-registers a usable `opencode2dsh` fake adapter before Majed apply, rejects duplicate ids, proves both catalogs usable and proves reference identity/catalog survive Majed disposal while owned Zen calls reject. This is fake-registry lifecycle proof, not real installed-reference parity.
- Focused five-file run `/tmp/majed137-review-focused.log`: 49/49, exit 0. Full `npm test` `/tmp/majed137-review-full.log`: classifier 166/166, Node 851/851, zero failures/cancellations/skips, exit 0. `npm run build` `/tmp/majed137-review-build.log`, `npm run check:build` `/tmp/majed137-review-checkbuild.log` (fresh output matches), and `git diff --check` `/tmp/majed137-review-diffcheck.log` all exit 0. Protected OAuth/auth source/generated paths unchanged (boolean-only check); no OAuth values or diffs printed.

One unexpected diagnostic failure consumed: read of guessed nonexistent `test/api-providers-browser.test.mjs`; no retry. Deliberate behavioral reds excluded. No deadline inflation. Source/generated/docs/tests are scoped #137 only. Local commit is the commit containing this record, on `impl/137-opencode-zen` from `bafa75761f9b3769ecf7665a6ffc90305e1ef23d`; unmerged/unpushed. Remaining gates: Lead independent focused Standards/Spec review of these fixes, package verification, separately approved installation/restart and consolidated Owner acceptance below. Historical latency root cause remains unestablished; no installed/live claims.

## Historical latest extension — 2026-11-01

Owner explicitly granted another twenty minutes/two unexpected diagnostic failures. Corrected the obsolete host route count to 21 and retained all authentication/probe/core-isolation assertions; added an explicit dedicated Zen route assertion. No production deadline was increased.

Observed the earlier 50867 ms delay did not reproduce: the unchanged bounded RPC completed in 10013.410167 ms in the focused run and 10011.463 ms in the full run. These observations do not establish the historical delay's root cause; event-loop contention remains an unverified hypothesis. No timing workaround was added.

Pinned reference `packages/plugin/src/adapter/catalog.ts:232-236` establishes deprecated metadata includes status/lifecycle values and deprecation dates, not just a boolean. Added a deliberate behavioral RED demonstrating retired/disabled/dated free-looking ids were incorrectly offered, then narrowed filtering to honor those reference shapes. Added assembled fake-HTTP proof for lazy registration/general status, dedicated status caller cancellation and body release, cached-roster refresh failure/recovery, and Responses-only wire translation. Existing EN/AR card smoke proof remains; interactive Refresh/error/unmount matrices and actual coexistence with a pre-existing reference adapter remain missing.

Exact extension evidence:

- `/tmp/majed137-extension-baseline.log`: focused 20/20 exit 0, bounded RPC 10013.410167 ms.
- `/tmp/majed137-extension-full.log`: `npm test` exit 0, Node 843/843, zero failed/cancelled/skipped; bounded RPC 10011.463 ms. This full run predates the metadata fix and four added tests.
- `/tmp/majed137-metadata-red.log`: deliberate test-first metadata rejection failure, exit 1, expected only `allowed` but also received retired/disabled/dated ids.
- `/tmp/majed137-extension-build.log`: latest `npm run build` exit 0.
- `/tmp/majed137-extension-focused.log`: latest focused 24/24 exit 0 after metadata fix; zero failed/cancelled/skipped.

STOP at the two unexpected diagnostic failure cap: guessed runtime dependency path `node_modules/@deepseek-ai/dsh-llm/lib/runtime.js` did not exist (grep exit 2); subsequent source-resolution command `node -p "import.meta.resolve('@deepseek-ai/dsh-llm')"` failed with `ERR_EVAL_ESM_CANNOT_PRINT` (exit 1). No retry after the second failure. This is diagnostic tooling failure, not a product regression. Latest full-suite rerun, `check:build`, whitespace/protected-source verification and local commit were not performed. No existing OAuth source/diffs/values were inspected. Candidate remains uncommitted, unreviewed, unmerged and unpushed. Lead/Owner budget disposition is required before further diagnostics or validation.

## Earlier evidence

- Lead-supplied behavioral RED: `assert.ok(adapter)`, `/tmp/majed137-behavior-red.log` (not independently rerun here).
- `npm run build`: exit 0, `/tmp/majed137-build.log`; generated host/browser outputs rebuilt.
- `node --test test/zen-owned.test.mjs`: six passed, zero failed, `/tmp/majed137-focused.log` before the last status-RPC isolation change. Covers free filtering/cache/paid rejection, Chat streaming and canonical headers, classified errors without body disclosure, static fallback, caller cancellation/body lock release and actual EN/AR card rendering.
- First `npm test`: classifier passed, Node 834 passed / 9 failed. Diagnosis: general status triggered Zen discovery, breaking unrelated providers' no-network guarantees; fixed by snapshot-only general status and dedicated `zenStatus` RPC. Updated provider-list/lifecycle expectations for the new registration without weakening disposal assertions.
- Second `npm test`: Node 841 passed / 2 failed. Exact failures: `test/bounded-130.test.mjs:109` reported `returned in 50867 ms` against existing ten-second expectation; `test/subscriptions-host.test.mjs:35` expected 20 routes but now receives 21. No further diagnosis or validation after two unexpected-failure cap. `check:build` did not run because the chained suite failed.

## Historical remaining implementation/proof (superseded by remediation evidence above)

Correct remaining route-count assertion after reading its file; diagnose the unrelated bounded-provider timing within renewed approved budget. Then test latest dedicated status RPC and card, metadata paid/deprecated overrides, cached fallback refresh, Responses routing, caller/disposal cancellation through all body phases and collision coexistence with a pre-existing reference registration. Current cache is in-memory only. Current status Refresh honors five-minute catalog caching. Reference static bootstrap does not prove current gateway availability. General status can report unknown reachability until the Zen card or model picker requests discovery.

TDD discipline limitation: only the first adapter-presence behavioral RED is established; later tests were added against an implementation already written. Do not claim strict red/green proof for every added behavior.

Run build/full npm test/check:build/diffcheck and inspect generated changes; independent Standards and Spec reviews required through Lead (nested agents forbidden here). No scoped delivery commit or package verification completed.

## Consolidated Owner acceptance checklist (only after all automated/review/package gates)

1. Separately approve reversible installation, then full DSH restart for host changes and page reload.
2. Open Subscription accounts in English and Arabic; confirm OpenCode Zen login-less card, reachability, source/count and Refresh behavior, including unavailable/fallback presentation.
3. With separately authorized gateway discovery, compare free-only picker to gateway/metadata; paid and protocol-unsupported ids absent. Confirm no accounts or credential delegation are requested.
4. Separately authorize any live inference; exercise one permitted free chat and applicable tools/Responses model, cancellation and natural rate/free-tier/region errors if encountered. Never infer these from catalog reachability.
5. With Owner-controlled reference plugin coexistence, verify `opencode-zen` and `opencode2dsh` remain separate and switching/disposal does not withdraw the other's provider.

No installation, profile/account/secret access, browser, live gateway/inference, push, merge or ticket closure performed. Operational acceptance is NOT claimed.
