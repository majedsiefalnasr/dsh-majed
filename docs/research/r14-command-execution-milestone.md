# R14 Command execution milestone (2026-10-26)

R14 / #56 is **unfinished**. This branch preserves a reviewable dormant candidate
and exact native runner evidence. It must not be treated as production lifecycle
acceptance or merged as a completed execution feature. The production entry does
not import/mount `applyCommandExecution`. Disabled candidate mounting returns
without reading Hook state. Root's R13 consent workflow remains execution-inert.

## Implemented candidate

- R13's read-only runtime authority resolves native attached session/project
  scope, selects the same private user/project definitions, and rechecks the
  exact generation, Approval, canonical cwd and watched file fingerprints.
- Optional async/onError/contextBytes/subagents/statusMessage fields survive
  save/review and participate in Approval. Existing definitions omit new defaults
  to preserve fingerprint compatibility. Async/PostCompact cannot block on error.
- The candidate engine revalidates after queueing and inside the runner immediately
  before synchronous native spawn, after async executable lookup. It has four
  slots, 64 waiters, a 2048-event dedup bound without in-flight eviction, 1 MiB
  event JSON, bounded context aggregation, lifetime cancellation and awaited
  cleanup. These bounds are implemented; saturation/concurrency proof remains.
- Selected Pouch runner/shell/parser/matcher/event adapters are attributed and
  pinned in `modules/hooks/PROVENANCE.md`, with the complete MIT license retained.
  Deferred SessionEnd/subagent observations are omitted. PeterBon's observational
  technique is compared, not copied as blocking semantics.
- Event JSON goes through stdin, never shell interpolation. Explicit environment
  names cannot restore BASH_ENV/ENV/NODE_OPTIONS or the recursion markers.
- A separate 0600 atomic metadata-only runs file retains at most 200 records;
  interrupted running records load as interrupted without replay. It contains
  hook ID, event, status, times and exit code, excluding raw tasks/commands/input/
  output/reasons/paths/session IDs. The existing private Approval RPC can expose
  history when the candidate is explicitly mounted by a fixture.

## Evidence

`node --test test/accepted/hooks-execution-authority.test.js` passes. The original
authority test failed before its exported implementation. The advanced-options
slice independently failed save before schema support, then passed review-field
preservation, incompatible-policy rejection, changed fingerprint and revocation.
Its route-registration adapter is not native management admission proof.

Exact installed-host command:

```sh
DSH_PROBE_NODE='/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness' \
DSH_PROBE_RUNTIME='/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh' \
node scripts/test-hooks-execution.mjs
```

The test initially failed because the execution service did not exist. It now
passes on DSH 0.2.1-rc.3. The wrapper creates and removes a temporary HOME/DSH_HOME;
the child forbids network and records zero attempts. It mounts actual installed
Cordis, AgentService, Session, agent-loop, ToolRuntime and LocalSubprocessRuntime.
Actual `agents.create` emits the awaited SessionStart contract; no fabricated host
event supplies this proof. Native subprocess runs a harmless temporary marker and
context, and the production private consent service supplies exact Approval.
History excludes context/path; revoke prevents the next native agent creation
from launching the marker command. Direct runner checks cover stdout overflow,
timeout, cancellation, stdin injection resistance and pre-spawn rejection.
The timeout fixture checks the OS PID is gone after awaited runner cleanup.

The runner's pre-spawn rejection control throws at the authority callback seam;
it does not independently prove a simultaneous external watched-file edit during
native executable resolution. The production service itself calls the real
authority there. Tests use harmless `printf`, `cat`, `touch` and bounded `sleep`
commands only. No installed operational definitions, accounts, credentials or
Hook histories were read; no operational execution or host restart occurred.

After merging reviewed integration `f2a3aaa` into the candidate as `2e33a5b`,
`npm test` passes **496/496**, and `git diff --check` passes. The exact native
execution command above passes again on the combined tree. These results include
the one new portable authority/advanced-options test; they do not close the
unproved runtime gates below. Original main working-tree documents were never
edited or stashed by this milestone.

## Open acceptance gates and next-session work

1. Prove UserPromptSubmit, PreToolUse, PostToolUse, PermissionRequest, Stop and
   successful PostCompact through actual native producers/loop/compaction, with
   context effects, blocking/steering and bounded Stop semantics. The adapters
   are source candidates; no unsupported-seam conclusion has been established.
2. Prove native Tool rules and permission denial win, including downstream
   composition/cancellation. Hook `allow` must never grant native authority.
3. Prove queue saturation, duplicate events, queued revoke/edit/watch/cwd changes,
   disposal, interruption/restart history and async cleanup through runtime seams.
4. Integrate explicit production enablement and accurate native English/Arabic
   Settings execution/history controls. Repeat review → approve → actual event →
   history → revoke over real Owner-admitted local and paired-remote transports.
5. Complete advanced field UI compatibility and shell handling. Current schema
   preserves historical arbitrary shell strings (including `/bin/bash`), whereas
   the copied wrapper supports only `auto`, `bash`, `pwsh`; unsupported strings
   currently fail at execution. This needs an explicit compatibility decision/
   validation before activation. File-script execution and Windows wrappers are
   source candidates, not native proof.
6. Review candidate lifecycle/error/privacy behavior before mounting from root.
   This milestone does not close #56 or authorize reference removal/Cutover.
