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

- Correction round (same ticket): the `record` helper in `modules/mcp/index.js` was shadowed by the loop
  variable in `replace`, so a disposal failure threw `TypeError: record is not a function` instead of
  `MCP cleanup failed. Replacement refused.` and never set `lastResult`; the helper is now `noteResult`.
  The revision token is now bound to scope root and store file (`token(record, revision)` in
  `modules/mcp/native.js`), so a token from one store is refused by another even with identical or empty
  content. A `replace` credential sent as an empty string for a stored key is refused with `invalid_request`
  (a blank form must not erase a secret; removal stays the explicit `null`). New keys may still be added.
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

## Correction-round RED / GREEN

| Fix | Test | RED | GREEN |
| --- | --- | --- | --- |
| Cleanup-failure path | `plugin cleanup failure refuses a replacement generation ...` (message and `lastResult` asserted) | exit 1, `record is not a function` instead of the intended message | exit 0 |
| Scoped revision token | `a revision token from one scope store is refused by another store with identical content` | exit 1, tokens equal for identical content | exit 0 |
| Blank replace credential | `a replace credential with an empty value is refused ...` | exit 1, `[true, undefined]` instead of `[false, 'invalid_request']` | exit 0 |
| Remove keeps unrelated server | `characterization: enable, disable and remove ...` now enables both servers | rewritten test, no production change (the original was vacuous: `two` was never enabled) | exit 0 |
| Concurrent same-revision saves | `characterization: two parallel saves ...` | characterization, already GREEN (store serialization) | exit 0 |

Tests named `characterization:` document existing behavior and had no RED. After this round: `npm test` exit 0, 612/612 (609 + 3 new), classifier 166/166, `git diff --check` exit 0.

## Known limitations and scope notes

- The `modules/managers` MCP `upsertServer` path (`modules/managers/index.js`, `modules/managers/client.js`) is
  unmounted: nothing in `index.js` or `lib/` creates that service, only its own tests call it. If it were
  ever wired it would bypass the stale-revision fence and the new-definitions-start-disabled clause (c),
  because it takes `enabled` from the caller and has no revision check. It is out of this ticket's seam.
- `snapshot` picks `lastResult` and `probe` from the first manager that has one (`views.find(...)` in
  `modules/mcp/native.js`). For a project scope with several agent managers the displayed result is
  therefore arbitrary (first attached agent), not an aggregate; failed or cleanup-failed status is the
  only field that is aggregated across managers.
- `client-bundle.js` is a generated file (`scripts/build-client.mjs`, not part of `npm run build`, which only
  copies `client.js` to the untracked `dist/`). It is tracked but was last committed in `c77ba26`; earlier
  `client.js` changes (e.g. `96fb5df`, `2c010dd`) did not regenerate it, and the package test asserts it is not
  shipped. It was therefore not regenerated here. This round makes no `client.js` change.
- The Arabic strings in the `ManagedMcpSection` dictionary are the existing convention (every key has an
  English default and an Arabic value); the `lastResult` value follows it and was not changed.

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

## Scope view slice

Goal: a read-only combined view of global and project MCP definitions with the plugin's own precedence rule
spelled out, without claiming native tool-name resolution. Ticket #97 stays PARTIAL.

### What is provable in this plugin

- Storage: `modules/mcp/native.js:24-31` keeps one private file per scope (`global.json`, or
  `project-<sha256(projectPath)>.json`) in the plugin state directory. Scopes never share a file.
- Mounting: the global manager mounts on the root context (`modules/mcp/native.js:28`); a project manager mounts per
  agent on `agent.ctx` (`modules/mcp/native.js:88`). Same-name definitions in the two scopes are therefore both
  allowed by this plugin: `validateServers` rejects duplicates only inside one list (`modules/mcp/index.js:38-43`).
- The plugin's documented rule (a rule of this plugin, not a native guarantee): a project definition with the same
  name overrides the global one in that project only; removing or disabling it shows the global one as a fallback.

### What the installed native layer states (read-only inspection, installed rc.3)

Sources were read from the installed app's asar (`dsh`, `dsh-mcp-client`, `dsh-tools`, `dsh-scope` all 0.2.1-rc.3);
the repository's `node_modules` copies are older (0.0.1-rc.1 / scope 0.0.1-rc.5), so tests here do not exercise
the installed package. Line numbers refer to each package's `lib/index.js` (README for README lines).

- `dsh-mcp-client` `lib/index.js:769-773`: server-name reservations are kept per registration scope; agent-scoped
  servers may reuse a namespace in another Agent. `lib/index.js:812-818`: `owner = scopeOf(ctx) ?? ctx.root`; a
  duplicate is rejected only inside the same owner. A same name in the root scope and in an agent scope is not
  rejected by this reservation.
- `dsh-mcp-client` README:58 (`serverName` unique inside one registration scope), README:75 (tools are named
  `mcp__<serverName>__<rawName>`), README:80 (a duplicate inside one scope fails to load), README:127
  (independent Agent scopes may reuse a namespace). None of them states what happens for the same name in the
  global scope and an agent scope.
- `dsh-tools` `lib/index.js` (`register` doc, ~2969-2982): "Scoped tools shadow globals"; `get(name, scope)`
  (~3078-3084) resolves scoped before global. `dsh-scope` `ScopedLayers.merge` (~165-176) and README:12: the
  nearest scope wins a name.

### Finding

At the tool-registry level a tool registered through an agent context shadows an identically named global tool for
that agent. That is a per-full-tool-name rule. It is not proven at server granularity: if the project server exposes
a different tool set than the global one, the agent can see a mix of both (project tools plus the global tools the
project did not shadow). No runtime proof against the installed rc.3 registry through this plugin's mounted agents
was run in this slice. Therefore the route marks every response `resolution: 'plugin-view-only'` and
`nativeGuarantee: false`.

### Decision gate G-mcp-scope (Owner)

Native same-name resolution is not proven at server granularity. Options:

- A. Keep the plugin-view-only wording (this slice). No runtime change. Honest, but does not enforce override.
- B. Add a runtime test against the installed rc.3 `ToolRegistry` with an agent scope, then claim tool-name
  shadowing (still not server-level) in the UI.
- C. Enforce the plugin rule: do not mount a global server in a project agent when a project definition of the same
  name exists. Changes runtime behaviour; needs approval.
- D. Forbid the same name in both scopes at save time. Simple and unambiguous, but removes the spec's override use.

Recommended: A now, then B before any stronger wording.

### What changed

- `modules/mcp/native.js`: new `scopeView` action on the existing Owner-admitted route (no new route or setting). It
  reads the global store and, for a project selector, that project's store; it never reconciles, mounts or writes.
  Per name it returns `entries` per scope with `enabled`, `shadowed`, `fallback`, masked `env`/`headers` keys,
  the same per-scope `revision` token as `list`, a `conflict` flag when both scopes define the name, and the
  `effective` scope selected by the plugin rule. Argument values and URL queries are not returned (`argCount`
  instead) and long command, cwd and URL values are clipped so two full scopes fit one 65536-byte body.
- `client.js`: a collapsed "Scopes" toggle in the MCP panel (`aria-expanded`), a labelled region listing the view,
  conflicts as `role="group"` rows with an accessible name, and wording that states the rule is a plugin rule and
  native same-name resolution is not proven. English and Arabic labels; no new setting.
- `test/accepted/mcp-scope-view.test.js`: 11 tests (production route with native-shaped project services and local
  stdio fixtures; built `dist/client.js` through the baseline harness).

### RED / GREEN (scope view)

| Step | Test | RED (exit, assertion) | GREEN |
|---|---|---|---|
| 1 | same name in both scopes is a conflict, both entries visible | exit 1: `scopeView` refused as `invalid_request` (`ok` false) | exit 0 |
| 2 | shadow, fallback, disabled flags and the disclaimer fields | exit 1: `rule` undefined | exit 0 |
| 3 | compact entries (no argument values, no URL query) | exit 1: argument and URL query secrets present | exit 0 |
| 4 | two full scopes fit one 65536-byte body | exit 1: got 99188 bytes | exit 0 |
| 5 | long http URLs clipped | exit 1: got 138567 bytes | exit 0 |
| 6 | UI Scopes toggle, conflict row, wording | exit 1: timed out waiting for the Scopes toggle | exit 0 |

No RED was observed (characterization tests written after the behaviour, expected to pass): masked credentials and
per-entry revisions equal to the list revisions; viewing writes nothing and a stale revision still fences edits;
unknown, mixed and forged scopes refused and another project never exposed; Arabic wording and accessible names;
UI alert when the view is refused. Two first runs failed for test mistakes, not product defects: a fixture over the
262144-byte store cap, and an unknown payload key surfaces as the generic `unavailable` code on this route.

### Verification (this slice)

- `node --test test/accepted/mcp-*.test.js`: 27/27, exit 0.
- `npm test`: 694/694 (baseline 683 + 11), exit 0. `node test/classify.test.cjs`: 166/166.

### Remaining gaps

- No runtime proof of native same-name resolution; the Owner decision G-mcp-scope is open.
- The view shows definitions, not what the agent can actually call. It does not list discovered tools.
- Revision tokens remain per-process. The unmounted `modules/managers/index.js` MCP upsert path is untouched.
- No real browser, installed DSH or remote endpoint was exercised.
