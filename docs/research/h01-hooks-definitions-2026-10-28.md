# H01 scoped hook definitions and exact-version Approval (#103)

Date: 2026-10-28. Base: `bacc766` on `impl/h01-hooks-definitions`. Evidence class: controlled local fixtures
only (fake Cordis context with a captured Owner Fetch route, the built `dist/client.js` in the existing jsdom
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
| P3 Settings edit that changed the hook id sent the old revision | client sends a revision only when the id is unchanged (jsdom-style harness test) | exit 1 | exit 0 |

Not changed: the `_activation` binding in `reviewEntry` is intentionally unused as a variable; it exists only to omit `enabled` from the fingerprinted content (rest destructuring). Remaining gaps are unchanged: no browser control for duplicate/import/export/trash/enable, origin `unknown`, revisions do not survive restart, no real browser/installed/paired acceptance.

Final after corrections: `node --test` on `hooks-approval`, `hooks-definitions`, `hooks-inert` = 33/33; full `npm test` = 623/623 (616 + 7 new: 6 in `hooks-definitions`, 1 in `hooks-approval`); classifier 166/166; `git diff --check` clean.
