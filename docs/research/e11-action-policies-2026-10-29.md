# E11 reviewed local Safe/Aggressive action policies (2026-10-29)

Ticket #91, spec stories 29-33. Scope: the deterministic local slice only. Contextual judgment (E12) is out of scope. This change is PARTIAL: the ticket stays open.

## What was built

- `modules/command-policy/index.js` (pure, Node built-ins only):
  - `decide({ mode, request, settings })` returns `{ decision: 'allow' | 'checkpoint' | 'deny' | 'defer', reasonCode, effects[], origin: 'local-policy', reason }`. `origin` and `reason` are fixed redacted strings; no command text, path or target is ever returned.
  - `createPolicyLedger({ getMode, getEpoch, isLive, settings, now })` keeps a bounded in-memory decision history (last 100 per session) and fences stale/cancelled results.
  - `normalizeSettings` is the only way Owner settings enter the policy.
- `modules/command-mode/index.js`: `createCommandModes(isLive, { settings, now })` now also exposes `evaluate(sessionId, request)` and `policy` (the ledger). `set` bumps a per-session epoch, `reset`/`resetAll`/closure drop the mode and bump it, so pending decisions made under a previous mode are fenced. `reset` can only reduce to Ask me. `applyCommandMode` is unchanged and returns the same object.
- No route was added. The existing Fetch route accepts exactly `snapshot` and `set`; an `evaluate` action is rejected as `invalid_request` (tested). Reason: a route would need a trusted source for `projectRoot`, `home`, `knownScripts` and the task context; the Owner-admitted browser must not supply those, because that is exactly the project/agent-content widening this ticket forbids. Evaluation stays host-side and module-level.

## Rules (all by effects/targets/paths/known contents, never by command or wrapper name)

- `ask` or any unknown mode: `defer` (`mode_ask`). Any `request.kind !== 'command'` (browser, MCP, tool, hook): `defer` (`not_command_request`).
- Safe allows: reads and edits inside the project (and the temp directory), git local operations (add/commit/branch/merge/switch/tag/stash), known-effect test/build/dependency commands, an ordinary push in an Owner-trusted project, `rm` of regenerable output (`node_modules`, `dist`, `build`, `coverage`, `.cache`, ...) and cleanup under a temp directory.
- Safe checkpoints (request-specific; stored mode untouched): `git branch -D`, database drops, force/delete pushes, `reset --hard`/`clean`/`checkout --`, deleting non-regenerable project paths, writing/removing outside the project, network, process signalling, privileged, publish, global/installer commands, unknown commands and unknown scripts.
- Aggressive = Safe plus task-authorized, known-target destructive project actions: the host-attached `request.task.authorizedTargets` (`path:`, `branch:`, `db:`, `push:<remote>/<ref>`, `rollback:worktree`) lift only the matching destructive checkpoint. Unmatched targets stay checkpoints.
- Denied in both modes (never lifted): credential/key/Keychain/`.env` paths and commands, `env`/`printenv`/bare `set`/`export`, `rm` of `/`, home, system directories, the project root or its ancestors, explicit task prohibitions (`task.prohibitions`: `path:`, `effect:`, `branch:`, ...; a malformed prohibition disables every task authorization), and Owner `denyEffects`/`denyPaths`.
- Compound/script handling: a bounded POSIX shell subset tokenizer splits `&&`, `||`, `;`, `|`, newlines and tracks `cd`. `$()`, backticks, `(...)`, process substitution, heredocs, unresolved variables, globs in destructive targets, brace expansion, unquoted-risk environment overrides, bare shells and `curl | sh` checkpoint. `sh -c "<text>"`, `env`, `nohup`, `time`, `nice`, `timeout`, `command`, `sudo` and absolute system-binary paths are unwrapped and the inner command is judged. Script files and `npm run`/`npm test`/`make` targets are judged by `request.knownScripts` contents (recursively, depth 4, cycle-safe) or checkpoint as `unknown_script`. The most restrictive finding wins.
- Trusted Settings (`settings`) can extend (`trustedProjects`, `knownEffects` limited to the safe classes read-project/write-project/vcs-local/build/test/dependency and still needing an in-project cwd) or tighten (`checkpointEffects`, `denyEffects`, `checkpointPaths`, `denyPaths`, `aggressiveDestructive: false`). Garbage, inherited or oversized settings are ignored. Request-supplied `settings`/`policy`/`approved`/`mode`/`trusted...` fields are never read (tested). Task authorizations are bounded (64 entries, strictly inside the project, no globs, no sensitive paths, not the project root).
- Ledger: per session, last 100 entries of `{ seq, requestId, at, mode, decision, reasonCode, effects, state }` plus counts; the request is held only as a per-process keyed HMAC for revalidation, never exposed. History is cleared by `closeSession`, `clear`, `resetAll` and by a liveness check on read. Fencing: `authorize` (one-time claim: second claim gives `already_claimed`; a replayed request id gives `request_id_reused`), `resolveCheckpoint` (strict boolean, resolves once, deny never overridden, approval is for that request only) and `cancel`; late results after cancel, supersession, mode event (including an ABA return to the same mode), Owner settings change, request/script/cwd change, session closure or eviction are rejected.

## RED / GREEN

| Step | Command | Result |
| --- | --- | --- |
| RED | `node --test test/accepted/e11-action-policies.test.js` | exit 1, `ERR_MODULE_NOT_FOUND` for `modules/command-policy/index.js` |
| Module first run | same | 16 pass / 5 fail: `npm test` wrapper with unknown script contents is correctly a checkpoint (test fixture needed `knownScripts`); `env FOO=1` correctly checkpoints (`unsafe_environment`, FOO is not an allow-listed variable; test used `CI`); an unresolved `cd` returned the old cwd (`actual 'allow', expected 'checkpoint'`, real bug fixed: `dispatch` returning `null` means unknown cwd); the route test read `evaluate` from the wrong return value (harness fix). A second run had 1 failure: the `rollback:worktree` authorization name in the fixture |
| GREEN | same | exit 0, 21/21 |
| Full | `npm test` | exit 0, 729 tests / 729 pass / 0 fail; classifier 166/166 |

Baseline before changes on this worktree: `npm test` 708 tests; one run showed a single failure in `test/accepted/codex-lifecycle.test.js:320` (`a loopback automatic callback ...`, `Cannot read properties of undefined (reading 'loginState')`) that did not reproduce in 3 isolated runs or 2 further full runs (708/708). It is an existing intermittent test, unrelated to this change; no repair was attempted. The 21 new tests account for the 708 -> 729 difference.

## Limitations (exact)

- Controlled-fixture evidence only: pure functions and an in-memory ledger. No real browser, installed host, paired device or real native session was used; mobile testing is deferred to the Owner.
- Native consumption is UNPROVEN (gate G2): nothing here calls `decide` from a real native `approval/request`, and nothing answers a native permission request. The Owner action -> native consumer -> visible outcome acceptance criterion is not met. This must be recorded as an open gap on #90 and #91.
- No judgment (E12): unknown effects only checkpoint; no model, network or provider is used. No call counts for judgment exist yet (the ledger counts local decisions).
- The analysis is lexical and is a subset of POSIX shell: no symlink or filesystem resolution (`request.projectRoot`, `cwd`, `home` must be host-supplied absolute paths), no Windows paths, no other shells' syntax, no alias/function/PATH resolution beyond system-binary directories. Anything outside the subset checkpoints; correctness for hostile input is bounded by that fail-closed design, not proven exhaustive.
- `request.knownScripts` and `request.task` are host-attached inputs. This repository does not yet have a host source for them (task boundaries, script contents); a caller that passes model/project-controlled values there would widen authority. Wiring them is part of the missing native seam.
- Trusted Settings are a function/object passed to `createCommandModes`; there is no Settings UI or persisted Owner store for them yet.
- The visible redacted origin/reason/call-count presentation is not built (only `history`/`counts` data exist).
- No route exposes `evaluate`; no client change was made; no `~/.dsh`, installed package, network or provider access occurred.
