# M01 scoped MCP connection lifecycle (#97)

Date: 2026-10-28. Base: `0e68c8a` on `impl/m01-mcp-lifecycle`. Evidence class: controlled local fixtures
only (fake Cordis contexts, a real `ToolRegistry`, and the repository's stdio fixture). No real browser, no
installed DSH, no paired device, no remote MCP endpoint. Real-mobile testing is deferred to the Owner.

## Gap analysis

All line numbers refer to the base commit, before this change. Status: SATISFIED / PARTIAL / MISSING.

| Clause (story) | Status at base | Evidence at base | Disposition |
| --- | --- | --- | --- |
| (a) Global/project definitions, provenance, effective override or fallback visible (63) | PARTIAL | Separate stores per scope (`modules/mcp/native.js:20-27`), scope binding (`native.js:28-39`), each row carries `scope` (`modules/mcp/index.js:108`), client scope selector (`client.js:~680`). No combined view: a project list never shows which global definition it shadows or falls back to; precedence for a same-name global/project pair through the native registry is unverified. | Recorded as a concrete missing contract (below); not simulated. |
| (b) Add/edit/disable/remove for stdio and streamable HTTP; saved state distinct from connection success (64) | SATISFIED | `operation` save/remove/setEnabled (`native.js:119-142`); `statusName` maps `configured`→`saved`, `mounted`→`active` (`native.js:14`); stdio and HTTP validated by `validateServer` (`index.js:7-37`); tests `test/accepted/mcp-native.test.js:41-63`, `:96-143`. | Kept. |
| (c) New saves land disabled; Connect/Test effects disclosed; saving never launches software or touches a remote endpoint (65) | PARTIAL | `native.js:128` uses `payload.server?.enabled ?? previous?.enabled ?? false`, so a direct API caller could create a NEW definition with `enabled: true` and the save would start it. UI always sends `false` for new rows (`client.js` save()). Disclosure text exists (`client.js` `disclosure` label). | Fixed: new definitions are always stored disabled. |
| (d) Active edits validated before replacement; bounded isolated reconnect and teardown; bad server never disrupts healthy ones; cleanup failures visible (66) | SATISFIED | `validateServers` before any change (`index.js:94`), dispose old before new (`index.js:97-102`), `cleanup-failed` visible and replacement refused (`index.js:101`, `:128`), per-server reconcile (`index.js:97-131`), 10 s probe deadline (`index.js:6`, `:76`), unavailable-CWD isolation test (`mcp-native.test.js:96-143`), cleanup failure test (`:24-39`). | Kept. Real stdio/HTTP lifecycle runs only in the opt-in `scripts/test-managed-mcp.mjs` (needs `DSH_PROBE_*`, not available here). |
| (e) Disable retains config and secrets while blocking new calls; remove deletes only the managed definition (67) | PARTIAL | Logic exists (`native.js:134-136`), but no test proves secrets survive a disable/enable cycle, that a disabled tool cannot be invoked through the runtime, or that `remove` leaves other definitions untouched. | Tested through the mounted route and a real `ToolRegistry`. |
| (f) Tool descriptions untrusted; native permissions retained; MCP enablement does not authorize every call; proven via actual ToolRuntime invocation and denial (69) | PARTIAL | Guard denial only appears in the opt-in `scripts/probe-managed-mcp.cjs:70`; nothing in `npm test` invokes a registered MCP tool through `ToolRegistry.execute`. | Added to `npm test` with a real `ToolRegistry`. |
| (g) Secrets omitted from snapshot/export; keep/replace/remove edits; stale-write conflict detection so blank forms or stale clients cannot erase or expose credentials (71) | PARTIAL | Redaction and keep/replace/remove are tested (`mcp-native.test.js:41-63`, `test/accepted/managers-mcp-definitions.test.js:118+`). The store computes a content revision (`modules/mcp/storage.js:26`, `:38`) but never exposes it; `operation` has no revision check, so a client holding an old snapshot can overwrite a newer definition, including its credentials. Transport change with stored credentials is rejected (`native.js:127`) but untested. | Fixed: opaque revision in snapshot, required for edit/remove/setEnabled, `stale_revision` conflict. |
| (h) Deadlines, truthful last-result timestamps, cleanup failures visible; status refresh is not liveness; no implicit restart of failed servers (74) | PARTIAL | Probe deadline `index.js:6`, `:76-77`; `cleanup-failed` visible (`index.js:86`, `:101`); failed activation not retried by a refresh (`index.js:113`; probe-script assertion `scripts/probe-managed-mcp.cjs:78` is opt-in only); label states Active is not reachability. No timestamps anywhere; the deadline is not reported. | Fixed: `lastResult` (action, outcome, timestamp) and `probeDeadlineMs` in the snapshot; no-restart-on-refresh now in `npm test`. |

## Concrete missing contracts (not built)

- Effective override/fallback view (a): the native `ToolRegistry` scope semantics for the same tool name
  registered globally and in a project agent scope are not asserted anywhere in this repository. A UI that
  claims "project overrides global" needs that contract (a registry-level precedence test with a real agent
  scope) before it can be shown honestly.
- Real stdio/HTTP lifecycle, bounded reconnect against a hung server, and remote endpoint behavior stay in
  `scripts/test-managed-mcp.mjs`, which needs `DSH_PROBE_NODE`, `DSH_PROBE_RUNTIME`, `DSH_PROBE_REMOTE`; those
  were not available here, so it was not run.
- Per-tool policy, OAuth and import/export are other tickets.

## What changed

- `modules/mcp/native.js`: a NEW definition is always stored disabled (a save never starts software); the
  snapshot carries an opaque per-process HMAC `revision` over the store revision (not a digest of secrets);
  `save` with `originalName`, `remove` and `setEnabled` must send the last-seen `revision` or fail with
  `stale_revision` before anything is written; snapshot adds `probeDeadlineMs` and per-server `lastResult`.
- `modules/mcp/storage.js`: `update` hands the observed revision to the change callback; `observe` is exposed.
- `modules/mcp/index.js`: `lastResult { action, outcome, at }` is recorded only when a connect, probe or
  disconnect actually finishes; refresh and unchanged reconciles carry it forward untouched.
- `client.js`: sends the last-seen revision on every non-list call and shows the last attempt, labelled as not a
  liveness check. A stale-write refusal surfaces through the existing refusal message (Refresh and retry).
- `test/accepted/mcp-native.test.js`: the CWD-isolation test now carries the revision (intended contract change).

## RED / GREEN

Each slice was written test first; RED is the focused run before the production change.

| Slice | Test (`test/accepted/mcp-lifecycle.test.js`) | RED | GREEN |
| --- | --- | --- | --- |
| New save is disabled, launches nothing (c) | `a new definition is always saved disabled and never launches software` | exit 1, `true !== false` (enabled:true honored) | exit 0 |
| Stale-write fence, no credential loss (g) | `a stale or blank edit is refused with a conflict and never erases credentials` | exit 1, `revision` not a string | exit 0 |
| Disable/remove through real ToolRuntime (e) | `enable, disable and remove act through the real ToolRuntime ...` | characterization, already GREEN (no production change) | exit 0 |
| Guard denial at invocation (f) | `native permission guards still deny an enabled MCP tool at invocation` | characterization, already GREEN | exit 0 |
| Transport change keeps credentials; no restart on refresh (g, h) | `changing transport with stored credentials is refused ...` | characterization, already GREEN | exit 0 |
| Deadline and last-result timestamp (h) | `status reports the deadline and a truthful last-result timestamp ...` | exit 1, `probeDeadlineMs` undefined | exit 0 |

The three characterization tests close the "untested through ToolRuntime" gaps for (e), (f) and parts of (g)
and (h); they did not need production changes, so no RED exists for them and none is claimed.

The tests mount the production entry (`index.js` `apply`) with the owner-admitted Fetch route, a real
`ToolRegistry` from `@deepseek-ai/dsh-tools` (stubbed `systemPrompt` service only) and the repository stdio
fixture `test/fixtures/mcp-stdio.cjs`.

## Verification (exact worktree state, base `0e68c8a`)

| Command | Result |
| --- | --- |
| `node --test test/accepted/mcp-lifecycle.test.js` | exit 0, 6/6 |
| `node --test test/accepted/mcp-native.test.js test/accepted/managers-mcp-definitions.test.js test/accepted/mcp-lifecycle.test.js` | exit 0, 32/32 |
| `npm test` | exit 0, 609/609 (baseline 603 + 6 new), 0 fail |
| `node test/classify.test.cjs` | 166/166 |
| `git diff --check` | exit 0 |
| `node scripts/test-managed-mcp.mjs` | NOT run: `DSH_PROBE_NODE`, `DSH_PROBE_RUNTIME`, `DSH_PROBE_REMOTE` are not set and locating them would require reading installed state |

## Still unmet

- No real browser, installed DSH, paired device or remote MCP endpoint was exercised. Mobile testing is
  deferred to the Owner.
- (a) The combined effective view (global versus project override or fallback) is a missing contract, see above.
- The revision is a per-process token, so a host restart invalidates every open client's revision; the client
  then receives a refusal and must refresh. This fails safe but is not a persistent etag.
- Stale-write fencing covers the Settings/Fetch route; the older `modules/managers/index.js` MCP upsert
  path was not changed (outside this ticket's seam).
- `test/mcp-runtime.test.js` is outside `npm test`; its restore test already failed at the base commit and was
  left alone.
