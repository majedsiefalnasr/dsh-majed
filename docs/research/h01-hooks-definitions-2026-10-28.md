# H01 scoped hook definitions and exact-version Approval (#103)

Date: 2026-10-28. Base: `bacc766` on `impl/h01-hooks-definitions`. Evidence class: controlled local fixtures
only (fake Cordis context with a captured Owner Fetch route, the built `dist/client.js` in the existing baseline client
harness). No real browser, no installed DSH, no paired device, no real native session. Real-mobile testing is
deferred to the Owner. H01 never executes a hook command; no event mapping, matcher, ordering, Stop
continuation or history was touched.

## Gap analysis

All line numbers refer to the base commit, before this change. Status: SATISFIED / PARTIAL / MISSING.

| Clause | Status at base | Evidence at base | Disposition |
| --- | --- | --- | --- |
| (a) Scoped (user/project) definition store with private atomic persistence | SATISFIED | `privateStore` `modules/hooks/approval.js:19-57` (lstat refusal of symlink/non-file/oversize `:24-25`, exclusive `wx` 0600 temp `:49`, sync `:50`, revision re-check `:51`, atomic rename `:53`); scope resolution `:131-140`; writers serialization `:217-221`; 0600 + corruption tests `hooks-approval.test.js:101-110` | Kept |
| (b) Create/edit/duplicate/disable/reversible remove | PARTIAL | `save` creates/edits `approval.js:158-164`; no duplicate; no disable that keeps consent (only a full save, which clears Approval `:161`); `remove` is a hard splice `:186` | Built duplicate, `setEnabled`, trash `remove`, `restore`, `purge` |
| (c) Import/export with preview; imports disabled and unapproved; export excludes consent and secrets | MISSING | `import` is rejected as an unknown action (`hooks-approval.test.js:109`); no export | Built `export`, `previewImport`, `import` |
| (d) Canonical binding of scope, command, cwd, environment, watched content into the Approval fingerprint | PARTIAL | `reviewEntry` `:68-80` binds scope, root, CRLF-normalized command, canonical cwd, env names, shell, limits, matcher, events, source and watched path + content hash; but also the `enabled` flag and a per-save random `generation`, so a disable would clear consent | `enabled` removed from the fingerprint; `generation` retained on purpose (any save, even identical, still requires renewed review: #53 proof `hooks-approval.test.js:97-98`) |
| (e) Server-verified short-lived single-use review nonce plus typed confirmation, bound to exact content | SATISFIED | `approval.js:168-185` (120 s TTL, consumed on every attempt, phrase `RUN AS DSH USER`, revision + fingerprint recheck); tests `hooks-approval.test.js:77-99` | Kept, unchanged |
| (f) Stale-edit fencing so a stale client cannot overwrite | MISSING | `save`/`revoke`/`remove` take no revision (`approval.js:130`, `:158-164`, `:185-186`); only `approve` is fenced via the nonce-bound store revision `:173,:183` | Built process-scoped HMAC revision per entry on save/overwrite, revoke, remove, setEnabled, duplicate, restore, purge |
| (g) Duplicates, imports, restores never carry consent | MISSING | No such actions existed; `save` clears Approval `:161` | Built; copies, imports and restores store `approval: null`, `enabled: false`, fresh generation |
| (h) Truthful known/unknown origin; loopback label not trusted | SATISFIED | Stored origin must equal `'unknown'` `approval.js:37`, written `:184`; request headers ignored; test `hooks-approval.test.js:31-49` | Kept |
| (i) Saved draft, Approval and activation are distinct | PARTIAL | `enabled` stored separately and `approval.valid` computed `:152-156`, but a client could store `enabled: true` on an unapproved draft and no state was reported | `state` field `draft` / `approved` / `active`; saves force `enabled: false`; activation only via fenced `setEnabled` and only with a valid Approval |
| (j) No execution; no takeover of the external hooks store (`@moon16u/dsh-hooks`) | SATISFIED | Approval path never spawns; `run/test/event` rejected `hooks-approval.test.js:109`; only the Majed private file `DSH_HOME/majed/hooks/commands.json` is read or written; `modules/hooks/bounded.js` is a dormant separate seam (untouched) | Kept; the execution authority ignores trashed entries |

## Concrete missing contracts (not built)

- No display-only definition field exists in the hook schema (`validateCommandHook`,
  `modules/hooks/index.js:52-67`), so "display-only metadata changes neither grant nor require renewed
  consent" has nothing to apply to yet. Adding one needs a schema change owned by a later ticket.
- No stdin or event-payload binding: stdin is the event JSON, which belongs to the event-mapping tickets.
- Origin stays `unknown`. No native contract that attests a request's local or remote origin was found, so a
  `known` origin cannot be shown truthfully.
- UI: only the existing Settings approval section was kept working (it now carries the revision). There is no
  duplicate, import, export, trash/restore or enable/disable control in the browser; those are reachable only
  through the Fetch route. This is a limitation, not a claim of a finished UI.
- Revision tokens use a process-scoped HMAC key, so tokens do not survive a host restart; a client must list
  again afterwards. Purge is the only irreversible removal.
- No real browser, installed-DSH or paired-device acceptance was performed.

## What changed

- `modules/hooks/approval.js`: per-entry HMAC `revision` returned by `list`, required for overwrite, `revoke`,
  `remove`, `setEnabled`, `duplicate`, `restore`, `purge` (`stale_revision`); `state` field; `save` always
  stores a disabled draft; `setEnabled` (needs a currently valid Approval to enable); `duplicate` (`exists` on
  id collision); `remove` moves to trash (`trashedAt`, consent dropped, disabled), `restore`, `purge`;
  `export` / `previewImport` / `import` of a `dsh-majed-hooks` v1 bundle (≤32 hooks; unknown keys such as
  approval fields make an item `invalid` and the import is refused; existing ids are skipped, never overwritten).
- `client.js`: the existing Settings section sends the listed revision on save, revoke and remove.
- `scripts/probe-hooks-bounded.cjs` (opt-in native probe, not run here): follows the new revision and
  activation flow.
- `test/accepted/hooks-approval.test.js`: #53 tests carry the revision on overwrite/revoke; every #53
  assertion is unchanged.

## RED / GREEN

| Slice | Test (`test/accepted/hooks-definitions.test.js`) | RED | GREEN |
| --- | --- | --- | --- |
| 1 Stale-edit fencing | stale-edit fencing: overwriting an existing definition needs its current revision | exit 1 (`list` entries had no `revision`) | exit 0 |
| 2 Draft / Approval / activation | draft, Approval and activation are distinct; disable keeps valid consent, edit or revoke does not | exit 1 (`enabled: true` stored as given) | exit 0 |
| 3 Duplicate and trash | duplicate and reversible removal never carry consent | exit 1 (`duplicate` → `invalid_request`) | exit 0 |
| 4 Export / import | export excludes consent and secrets; import previews first and lands unapproved disabled | exit 1 (`export` rejected) | exit 0 |

Slice 1 also changed the #53 callers (the production client, the opt-in probe, three call sites in
`hooks-approval.test.js`) to send the revision: after the change the #53 file failed on three assertions until
those callers were updated, then passed with all original assertions intact.

Initial final: `node --test` on `hooks-approval`, `hooks-definitions`, `hooks-inert` = 26/26; full `npm test` =
616/616 (baseline 612 + 4 new), classifier 166/166. Superseded by the corrections below.

## Corrections (review follow-up)

Ticket #103 acceptance remains PARTIAL and the ticket stays open.

| Finding | Fix | RED | GREEN |
| --- | --- | --- | --- |
| P1 a bundle repeating `[scope, root, id]` marked both items `new`; import wrote both and `store.read` then refused the duplicate key (`store_unavailable`) for every later operation | `previewImport` marks 2nd+ occurrences `duplicate`; import skips them | exit 1 (`[twin,new],[twin,new]`) | exit 0 |
| P2 `save` had no 128-entry cap (read caps at 128, trash counts) | `save` refuses with `store_full` before writing; one `MAX_ENTRIES` constant | exit 1 (129th save accepted) | exit 0 |
| P2 export could produce a bundle import cannot accept | export refuses with `bundle_too_large` above 32 hooks or 24576 bytes (import accepts at most 32 hooks and a 32768-byte request); roundtrip tested at the boundaries | exit 1 | exit 0 |
| P2 fences untested | tests for `stale_revision` on revoke, remove, restore, purge, duplicate, setEnabled, save, and for a revision from another scope/root; tautological assertion replaced by `list` -> `executionAvailable === false` | passing at write time; mutation: dropping each of revoke, remove, purge, restore, duplicate, setEnabled from the fence list fails a test (exit 1 each); a lookup that ignores scope/root fails the cross-scope test. A revision HMAC made scope-free alone does NOT fail it, because the lookup is already scope-bound | n/a |
| P3 `setEnabled(true)` checked the Approval before async work only | re-checked after the scope resolution (`state_changed`) | exit 1 | exit 0 |
| P3 Settings edit that changed the hook id sent the old revision | client sends a revision only when the id is unchanged (baseline client harness test) | exit 1 | exit 0 |

Not changed: the `_activation` binding in `reviewEntry` is intentionally unused as a variable; it exists only to omit `enabled` from the fingerprinted content (rest destructuring). Remaining gaps are unchanged: origin `unknown`, revisions do not survive restart, no real browser/installed/paired acceptance. (At this point there was still no browser control for duplicate/import/export/trash/enable; the Settings controls section below adds them.)

Final after the first corrections: `node --test` on `hooks-approval`, `hooks-definitions`, `hooks-inert` = 33/33; full `npm test` = 623/623 (616 + 7 new: 6 in `hooks-definitions`, 1 in `hooks-approval`); classifier 166/166; `git diff --check` clean.

## Settings controls

Slice 2 (2026-10-29): the existing `CommandApprovalSection` in `client.js` now calls the existing route actions
`duplicate`, `setEnabled`, `remove`/`restore`/`purge`, `export`, `previewImport` and `import`. No new route,
setting or host change. Every mutation of an existing entry (edit, revoke, remove, setEnabled, duplicate, restore, purge)
sends the per-entry `revision` returned by the last `list`; save-new uses the absent-revision fence, approve uses the
nonce and phrase, and import is fenced by the preview and never overwrites; the route's refusal codes (`stale_revision`, `exists`, `invalid_approval`,
`state_changed`, `not_found`, `store_full`, `bundle_too_large`, `invalid_request`) are mapped to visible text. Purge is
two-step (Purge, then Confirm permanent delete; Keep in trash cancels). Import is two-step (paste, Preview import,
then Import; disabled unless at least one item is `new` and none is `invalid`). The panel states that nothing is
executed. Arabic labels were added beside the English ones in `approvalLabels`.

Tests: `test/accepted/hooks-approval.test.js` (built `dist/client.js` through `createBaselineHarness`, production
service through the Fetch route; bounded waits, no fixed sleeps). Assertions cover rendered text and the persisted
service state.

RED/GREEN as observed. First slice (each test written before the Settings controls existed; RED observed against the
commit before the controls, GREEN after):

| Control | Test | RED | GREEN |
| --- | --- | --- | --- |
| Duplicate + state labels | Settings Duplicate creates a disabled unapproved draft ... refuses a taken id or a stale revision | exit 1 (`timed out waiting for Duplicate button`) | exit 0 |
| Enable / Disable | Settings Enable is refused without a valid Approval ... Disable keeps the consent | exit 1 (`timed out waiting for button Enable`) | exit 0 |
| Trash / Restore / Purge | Settings Trash, Restore and Purge ... purge needs an explicit confirmation step | exit 1 (`timed out waiting for trashed state`) | exit 0 |
| Export / Import preview | Settings Export shows bounded JSON ...; Import previews new/exists/duplicate | exit 1 (`timed out waiting for button Export hooks`) | exit 0 |

The Duplicate GREEN needed two harness-level fixes in the test only (the submit handler must return the call so
the test can await it, and refusal text is awaited with the bounded `waitFor`).

## Settings controls: correction round (independent review)

Fixes for the review findings. Each test below was written first and run against the previous `client.js` and
`modules/hooks/approval.js` (restored from `c3e8064`); that run exited 1 with exactly these six tests failing (21 other
tests of the two files passed). Only the first and second rows record an individually inspected assertion; for the
others the observed fact is that the test failed against the previous code (exit 1), without a recorded assertion text. GREEN: both files exit 0.

| Finding | Fix | Test | RED observed |
| --- | --- | --- | --- |
| P2 an enabled hook whose Approval became invalid (watched file changed) was rendered "Needs review (saved draft, disabled)" next to a Disable button | The route is unchanged (it still returns `state: 'draft'`, `enabled: true`, `approval.valid: false`). The client derives `enabled_invalid` from `hook.enabled && !approval.valid` and shows "Enabled, but its Approval is no longer valid: review required (execution is unavailable)" (English and Arabic) | `an enabled hook whose Approval became invalid is shown as enabled-but-unapproved ...` | exit 1, `'draft'` !== `'enabled_invalid'` |
| P2 preview and import accepted a bundle above the export byte bound | `bundleItems` measures `Buffer.byteLength(JSON.stringify(bundle))` against `MAX_BUNDLE_BYTES` and refuses with `bundle_too_large` (bytes, not characters) | `preview and import enforce the export byte bound by bytes, not characters` (route); `Import through the UI refuses an oversize multibyte bundle ...` (UI: also invalid JSON sends no request, malformed bundle shows the generic refusal) | exit 1 (route test: `actual: true, expected: false`; UI test failed, assertion not recorded) |
| P2 Arabic/RTL untested | `ar` strings rendered and asserted; panel `dir` follows `management.direction`; JSON text areas stay `dir="ltr"` | `Arabic renders the translated state strings and buttons ...` | exit 1 (failed; assertion not recorded) |
| P2 a11y: only Duplicate, Enable/Disable, Restore, Purge and the purge-dialog buttons named their hook | Edit, Review, Revoke, Remove, the confirmation Cancel and Approve now carry `Label: hook`; the duplicate form submit is "Create copy: hook" (distinct from the row "Duplicate: hook"); the purge `alertdialog` has `aria-label` and `aria-describedby`; focus moves to Keep in trash and returns to the Purge control | `every per-row button names its hook ...` | exit 1 (failed; assertion not recorded) |
| P3 import preview survived list changes | every successful response other than `review`/`export`/`previewImport` clears it; a failed `list` clears preview, duplicate form, purge confirmation and export | `the import preview is cleared whenever the list changes ...` | exit 1 (failed; assertion not recorded in the six-test run; an earlier partial run of the new client showed `timed out waiting for preview cleared by refresh`) |
| P3 failed scope change kept the previous scope's hooks | a failed `list` clears `hooks` and `trash` and shows the error | same test | same test |

Mutation checks after GREEN (each mutation applied to `client.js` alone, then reverted): removing the Arabic Purge string,
the Arabic draft-state string, the panel `dir`, the export text area `dir`, the alertdialog `aria-label`, the
focus-return assignment, the focus-move call (replaced with a no-op), the Create copy label, and the `enabled_invalid`
derivation each fail at least one test.

What the baseline client harness cannot assert: it has no DOM, layout, tab order, accessibility tree, screen reader or
real focus. Focus is checked through a ref stub that records `document.activeElement` when the client calls
`element.focus()`; refs are attached and detached in React commit order but no real focus change or focus trap exists.
The `dir` attributes and `aria-label` values are asserted as props, not as computed accessible names. Bidirectional
text rendering and Arabic shaping are not exercised.

Remaining gaps (unchanged): origin stays `unknown`; no stdin binding or display metadata; revisions are per-process
and not restart-durable; no real browser, installed-desktop or paired-device proof; mobile deferred to the Owner.
Route gaps: none found for these controls (no route was added; the byte bound closes a gap in preview/import).

Final after this correction round: `node --test test/accepted/hooks-*.test.js` = 43/43; full `npm test` = 660/660 (654 + 6 new tests: 1 route, 5 UI), classifier 166/166; `git diff --check` clean.
