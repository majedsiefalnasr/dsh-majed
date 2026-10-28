# E01 preference resets — controlled implementation evidence

Date: 2026-10-28. Ticket: [#78](https://github.com/majedsiefalnasr/dsh-majed/issues/78), still open. Candidate branch: `impl/e01-preferences`; baseline and incorporated integration tip: `d41d4e3df21ac1bb1fd716e13ebe67097fa43a56` (`integration/current-scope-20261028`). This is development evidence, not installed acceptance.

## Authority and boundary

The Owner's E01 implementation contract supersedes the historical development freeze only. The latest main-worktree current-work, scope-control and execution-policy records, candidate specification/glossary/instructions, and the actual ticket were read. Ticket read used `gh issue view 78 --repo majedsiefalnasr/dsh-majed --json number,title,body,state`; no tracker writes. The authorized worker route is `codex` / `gpt-6.1-sol`, following the Owner-supplied OpenCode `429 FreeUsageLimitError`; no nested delegation or provider-availability experiment.

Only the existing browser-local preference implementation was extended. No replacement store, dependency change, host modification, installed-state write, account/secret access, live product/provider probe, new server, push or rollout. Other enhancement families and command authority are unchanged.

## Behavior implemented

- Individually named Settings reset buttons restore UI size to 14, family to DSH default, and bidi to enabled. Each writes only its own field through the existing preference store and immediately updates the mounted control and production appearance consumer.
- Existing size range 11–20, family choices/system/native fallback, localStorage key `dsh-majed:settings:v1`, native chat sizing, and unrelated profile preferences remain intact. Buttons retain native keyboard interaction and localized English/Chinese labels.
- A reproduced theme-restoration defect is fixed: when an external theme replaces a font variable while a selected family is active, the latest external value/priority is retained before reasserting the selected family. Family reset/disposal restores that value rather than the original stale theme value. Switching between plugin-owned stacks does not replace the remembered native value.

## Confirmed seam and evidence limits

`test/accepted/e01-preferences.test.js` evaluates the actual built `dist/client.js`, mounts its real Settings slot contributions with ReactDOM, drives mouse/keyboard events through user-event, writes/rehydrates real jsdom localStorage, and observes the production appearance consumer's DOM/styles/MutationObserver behavior. It does not assert source text or call private preference helpers. Automatic accepted-suite discovery registers the file without a runner change.

The public primitive adapter renders the real family anchor/open state and menu choices, plus Switch events. A second path exercises the production fallback select/checkbox controls. These are adapters, **not installed native primitives**. jsdom 26 does not retain `!important` priority on custom properties; the fixture adapts priority bookkeeping on body.style only, while leaving actual values/declarations and mutation observers real. This limitation is explicit rather than a production workaround.

Controlled regressions cover reset isolation, immediate visible defaults, 11/20 bounds, repeated keyboard reset and focus, invalid saved data/localization, profile rehydration/isolation, bundled-family precedence and declared Arabic fallback, Arabic paragraph RTL versus English/plaintext and LTR inline paths/preformatted commands, retained draft/chat-size values, external theme writes and priority, and disposal without erasing saved preferences or reapplying overrides. The glyph assertion checks that Arabic meem U+0645 is outside selected bundled face ranges and that a native fallback is declared; it does not prove rendered Arabic glyphs. Native chat's 19px fixture rule/value remains unchanged; real browser layout/scaling is not inferred from jsdom.

## Vertical red/green record

Command during initial isolated cycles:

`npm run build && node --experimental-loader /tmp/majed-implementation/e01-shared-deps-loader.mjs --test test/accepted/e01-preferences.test.js`

The temporary loader resolved existing locked dependencies from the main checkout; no network install.

1. Size reset RED: 1 test, 0 pass, 1 fail; `AssertionError [ERR_ASSERTION]: size has an individually named reset action`. After the minimal button/dictionary change: 1 pass, 0 fail, exit 0.
2. Family reset RED: 3 tests, 1 pass, 2 fail; `AssertionError [ERR_ASSERTION]: font family has its own reset action`. After the family button and documented jsdom priority adapter: 3 pass, 0 fail, exit 0. The initial post-button run exposed jsdom's priority limitation (`Inter Majed` persisted instead of `InitialThemeFont`); no production restoration change was made for that fixture limitation.
3. Bidi reset RED: 5 tests, 3 pass, 2 fail; `AssertionError [ERR_ASSERTION]: paragraph direction has its own reset action`. After the bidi button: 5 pass, 0 fail, exit 0. An intermediate assertion incorrectly expected Arabic `plaintext`; the retained engine deliberately marks detected Arabic RTL/`isolate`, while English stays `plaintext`. The assertion was corrected to the existing contract, not the engine changed to match it.
4. Latest theme restoration RED: 6 tests, 5 pass, 1 fail; expected `UpdatedThemeFont`, actual `InitialThemeFont`. After updating the remembered external value: 6 pass, 0 fail, exit 0.

Supplementary preservation/lifecycle tests were green without further product changes. Strengthening the Menu adapter initially failed because the test targeted a nonexistent selector and did not flush open state; corrected the adapter/helper to exercise the actual `.majed-selector` anchor and separate event commits. This was fixture correction, not a product change.

Final direct focused command (after linking existing dependencies):

`npm run build && node --test test/accepted/e01-preferences.test.js`

Output: `tests 9`, `pass 9`, `fail 0`, `cancelled 0`, `skipped 0`, `todo 0`; exit 0.

## Full regression and integration checks

Initial `NODE_OPTIONS='--experimental-loader /tmp/majed-implementation/e01-shared-deps-loader.mjs' npm test` produced 522 tests / 521 pass / 1 fail: the packaged Skills fixture intentionally strips NODE_OPTIONS and its package/node_modules link targeted an absent candidate node_modules. Exact dependency error: `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'fflate' imported from .../package/modules/skills/vendor/lib/core.js`. This was one environment setup failure, not E01 behavior. Resolved with an ignored candidate `node_modules` symlink to the existing main-checkout node_modules; no install or lockfile edit. Plain `npm test` then passed 522/522 before the final localization regression was added.

Before final verification: `git merge --no-edit integration/current-scope-20261028` returned `Already up to date.`, exit 0; no reset, rebase or user-work replacement. Final plain `npm test` output:

```text
166/166 passed
ℹ tests 523
ℹ suites 0
ℹ pass 523
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 2978.706834
[exit code: 0]
```

`git diff --check` passed. Scoped diff review confirmed only E01 client behavior, focused test and evidence/changelog updates; generated dist/cache/dependency artifacts remain uncommitted.

## Unresolved acceptance and next action

The browser prerequisite was already unavailable (`bsk session start failed: no browser is currently connected`); it was not retried or bypassed. Actual installed native Settings, desktop/browser/mobile geometry, font loading/glyph rendering, competing real theme styles and paired-remote profile behavior remain unverified. The synthetic profile test is not real paired acceptance. No unsupported public seam was invented or host patched.

Keep #78 open. Next: independent Standards/Spec review and reviewed candidate merger by the Lead; separately obtain authorized browser/installed/paired evidence before claiming full E01 acceptance. Worker completion alone is not acceptance or permission for operations or another feature family.
