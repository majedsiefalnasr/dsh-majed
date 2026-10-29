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
  shipped. It was therefore not regenerated here. The scope view slice below and its correction round do change `client.js` (Scopes section, scope-change reload, truncation notice), so the generated bundle is still not regenerated.
- The Arabic strings in the `ManagedMcpSection` dictionary are the existing convention (every key has an
  English default and an Arabic value); the `lastResult` value follows it and was not changed.

## Still unmet

- No real browser, installed DSH, paired device or remote MCP endpoint was exercised. Mobile testing is
  deferred to the Owner.
- (a) A read-only combined view exists (see the scope view slice) and applies this plugin's own rule; native same-name resolution at server granularity remains an unproven contract (decision gate G-mcp-scope), so (a) is PARTIAL, not satisfied.
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
  `mcp__<serverName>__<rawName>`), README:78 (a duplicate inside one scope fails to load), README:127
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
  Per name it returns `entries` per scope with `enabled`, `shadowed`, `fallback`, masked `env`/`headers` key names,
  the same per-scope `revision` token as `list`, a `conflict` flag when both scopes define the name, and the
  `effective` scope selected by the plugin rule. Fallback, shadowed and effective apply only to ENABLED entries
  (project enabled wins; otherwise an enabled global is effective, and is `fallback` when a project definition of
  that name exists but is disabled); a disabled entry is shown as disabled and never as `fallback` or `shadowed`.
  Argument values and URL queries are not returned (`argCount` instead). `command` and `cwd` are no longer returned
  at all: only `executable`, the basename of the first command word, is returned, and `(redacted)` when that word
  looks like a URL or an assignment (contains `:`, `@`, `=`, `?` or `#`), so userinfo, query tokens and `VAR=value`
  prefixes cannot leak (the per-scope `list` action still returns the full command and cwd).
- Response bound (guarantee, replacing the earlier claim that two full scopes "fit one 65536-byte body"): the
  response never exceeds 60000 bytes of JSON (`VIEW_BYTES`, headroom under 65536). Each entry returns at most 8 env
  and 8 header key names, each at most 32 characters; URLs are clipped at 96 characters and executables at 64.
  When anything was clipped, any key omitted, or any server dropped to stay under the bound (whole servers are
  dropped from the end of the name-sorted list, never partial rows), the response carries `truncated: true` plus
  `omittedServers` and `omittedKeys` (both `0` and `truncated: false` otherwise) and entries carry `clipped: true`
  where they were shortened. The bound is enforced by the final drop loop (rows are measured as serialized), not inferred from the store cap.
- `client.js`: a collapsed "Scopes" toggle in the MCP panel (`aria-expanded`), a labelled region listing the view,
  conflicts as `role="group"` rows with an accessible name, a visible `role="status"` notice
  (`data-mcp-truncated`) with the omitted counts when `truncated` is true, and wording that states the rule is a
  plugin rule and native same-name resolution is not proven. English and Arabic labels; no new setting. Scope
  switching: the project select aborts the in-flight scope request, clears the displayed scope rows, and reloads
  the view when the section is open; a response that is no longer the current request (aborted or superseded) is
  ignored, and unmount aborts the pending request. `loadScopes` follows the `call()` abort/timeout pattern.
- Case-variant names (`Foo` versus `foo`): server names are case-sensitive in the native `serverName` namespace
  (`SERVER_NAME` allows both cases and `validateServers` compares exactly), so they are different servers. The view
  does not flag them as a conflict, shadow or fallback; this is a documented non-flag with a characterization test.
- The first correction reused the existing mask idea through one module-level `maskKeys` helper in
  `modules/mcp/native.js` shared with `snapshot`, instead of a second duplicate inside `scopeView`.
- `test/accepted/mcp-scope-view.test.js`: production route with native-shaped project services and local stdio
  fixtures; built `dist/client.js` through the baseline harness.

### RED / GREEN (scope view)

| Step | Test | RED (exit, assertion) | GREEN |
|---|---|---|---|
| 1 | same name in both scopes is a conflict, both entries visible | exit 1: `scopeView` refused as `invalid_request` (`ok` false) | exit 0 |
| 2 | shadow, fallback, disabled flags and the disclaimer fields | exit 1: `rule` undefined | exit 0 |
| 3 | compact entries (no argument values, no URL query) | exit 1: argument and URL query secrets present | exit 0 |
| 4 | two full scopes fit one 65536-byte body | exit 1: got 99188 bytes | exit 0 |
| 5 | long http URLs clipped | exit 1: got 138567 bytes | exit 0 |
| 6 | UI Scopes toggle, conflict row, wording | exit 1: timed out waiting for the Scopes toggle | exit 0 |

### Correction round: review findings (all reproduced RED first, exit 1 each; GREEN exit 0)

| Finding | Test | RED assertion |
|---|---|---|
| 1 disabled global marked `fallback` | `shadow, fallback and effective apply only to enabled entries ...` | `[global,false,false,true]` instead of `[global,false,false,false]` |
| 2 oversize response | `credential key lists are count- and length-bounded ...` (32 servers x 56 env keys x 128 chars, both scopes) | whole response 516457 bytes > 65536; also `http header key lists ...`: 256124 bytes |
| 2 truncation flag absent | `an unclipped small view reports truncated false ...`; `a long remote URL is clipped and flagged ...` | `truncated`, `omittedServers`, `omittedKeys` all `undefined` |
| 2 truncation not shown | `UI shows a visible truncated notice ...` | timed out waiting for the notice |
| 3 stale scope view | `switching scope clears the previous scope rows and ignores a late response ...` | timed out waiting for the project view request (no reload on select change) |
| 3 reopen shows stale rows | `a closed Scopes section still drops the previous scope rows ...` | 1 row instead of 0 |
| 3 unmount | `unmounting aborts an in-flight scope view request` | `aborted` false instead of true |
| 3 scope key | `UI shows effective line, shadowed and fallback labels, and the scope key ...` | `[['global', undefined, undefined]]` instead of the project selector |
| 4 command/cwd leak | `command and cwd never leak credentials ...` (`curl https://u:SECRETPW@h/?t=TOK`) | `SECRETPW leaked` |

Tests added in the correction round WITHOUT a RED (pass on first run; each was mutation-checked where noted):
- `headers are masked to key names only ...`: the mask already existed. Mutation: returning the raw headers makes
  it fail (2 failures in the file), so it is a real guard, but no RED against the original code exists.
- `a long remote URL is clipped and flagged` clipped assertions on the entry (the `truncated` part was RED);
  mutation dropping `visible.clipped = true` for URLs fails 1 test.
- `UI labels an enabled global fallback and never labels a disabled entry as fallback` was RED only for the
  label wording change I made at the same time (assertion on the text); the disabled-not-fallback server rule is
  covered by finding 1.
- `UI shows no truncated notice for a complete view`, `characterization: names differing only by case ...`.
- The shadowed-label and effective-line assertions in the scope-key UI test passed on the first run; only the
  scope-key assertion was RED.
Earlier slice (unchanged claim): masked credentials, per-entry revisions, no-write view, forged-scope refusal,
Arabic wording and the refused-view alert were characterization tests with no RED.

### Verification (this slice, after the correction round)

- `node --test test/accepted/mcp-*.test.js`: exit 0, 41/41.
- `npm test`: exit 0, 708/708 (694 + 14 new); classifier 166/166; `git diff --check` exit 0.
- Process note: a first full run failed 15 tests because a replace-all of the identical unmount effect also touched another client effect (`scopeRequest is not defined`); reverted, then the full run was green.

### Remaining gaps

- No runtime proof of native same-name resolution; the Owner decision G-mcp-scope is open.
- The view shows definitions, not what the agent can actually call. It does not list discovered tools.
- Revision tokens remain per-process. The unmounted `modules/managers/index.js` MCP upsert path is untouched.
- No real browser, installed DSH or remote endpoint was exercised; the UI tests use the baseline virtual-tree harness
  (no real focus, layout or screen reader).
- The 60000-byte bound drops whole trailing servers rather than shrinking them; a view of a store with many large
  names is therefore incomplete by design and says so with `truncated` and the counts.
