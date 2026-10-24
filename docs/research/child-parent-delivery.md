# T02D: native tool parent-delivery admission with public persistence

## Status

One concrete fixture gap closed on 2026-10-24 against DSH `0.2.1-rc.2`:
the actual registered native model-facing tool accepts a valid explicit route,
creates a parent-delivery child, returns its activation identity, and writes its
native descriptor through the actual public JSONL persistence backend.
**T02D / #7 remains open; this is not whole acceptance or enabled production routing.**
This agent's delegation model and effort were not pinned.

The historical [fifteen-check preflight fixture](<child-tool-preflight.md>) remains
unchanged, including its intentional no-persistence boundary. The separate
[probe](<../../scripts/probe-child-parent-delivery.cjs>) and
[runner](<../../scripts/test-child-parent-delivery.mjs>) add this one proof without
changing plugin code, installed settings, shared ledgers, changelog, or host code.

## Public boundary and exact fixture prerequisites

The approved seam remains exported native `apply(ctx, config, session)` under its
exported `inject` list, actual `ctx.tools.get('t02d_delegate')`, and registered
`definition.execute(args, exec)`. This is not the complete model agent-loop tool
validation/dispatch pipeline. Native execution itself supplies `delivery: 'parent'`;
the fixture never substitutes delivery or intercepts creation.

The runner needs the installed Electron executable and runtime paths below. It
mounts unchanged public Cordis, LLM, SystemPrompt, SessionProjection, Session,
Agent, Tools, AgentLoop, SubagentRuntime and local spawn exports, plus:

- `dsh-session-persistence-jsonl` public `apply(ctx, config)` with
  `{ root: <generated temporary HOME>/sessions, compression: 'none' }`.
- `ctx.sessionPersistence.flush()` followed by public
  `open(childId, 'read')`, handle `read()` and `close()` to verify stored events.
  `open` takes access as its second positional argument, not `{ access: 'read' }`;
  the latter accidentally attempts a write open and raises `SessionAlreadyOwnedError`.
- Synthetic route-policy and working-directory services as in the baseline.
  The adapter supplies synthetic metadata and one held synthetic finish-only
  stream; no accounts, credentials, real inference or external providers.

Source anchors: [backend exports/config/apply](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-session-persistence-jsonl/lib/index.js#L3610-L3642>),
[public read access](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-session-persistence-jsonl/lib/index.js#L2481-L2518>),
[flush](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-session-persistence-jsonl/lib/index.js#L2555-L2562>),
and [native tool parent delivery](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-tool-subagent/lib/index.js#L442-L481>).
These are exact installed-build observations, not a guarantee for other versions.

## Assertions and results

The new assertion proves a real activation result and live native child with
provider `t02d-fixture`, explicit model `explicit`, parent lineage and depth one.
Configured `high` effort is cleared on route change; the explicit synthetic model
advertises only `low`. The native lifecycle has one start and the adapter has one
stream. After the actual persistence durability barrier, a public read handle
returns the child's version-three continuable descriptor with spawn provider,
label, explicit LLM provider/model, and no retained configured effort. The native
parent catalog is established. The child remains held during assertions and is
released/disposed during cleanup.

Observed results:

- Existing baseline: **15/15 pass**, unchanged; zero network attempts.
- New persisted admission/descriptor check: **1/1 pass**; one synthetic stream;
  zero network attempts; runner exits zero and removes temporary HOME/DSH_HOME.
- TDD red before mounting the backend: existing fifteen pass, new admission fails
  with `PERSISTENCE_UNAVAILABLE` and message
  `continuable subagents require session persistence (load a dsh-session-persistence backend)`.
- Retained `--red-no-persistence` control fails with that same boundary and exit one.
  Existing `--red-drop-route` control fails with actual `parent` versus expected
  `explicit`, exit one. Neither control patches host code.
- `npm test` passes after linking the verified main workspace's ignored
  `node_modules`; no install or network was used.

Each probe installs fetch, HTTP(S), TCP and TLS tripwires before host imports.
The runner uses a fresh generated temporary working directory, HOME, DSH_HOME and
TMPDIR with minimal environment, bounded output, process timeout and a separate
probe watchdog. Cleanup verifies its generated absolute temporary path before
removal. This is fixture isolation, not OS sandbox certification.

## Reproduction

```sh
DSH_PROBE_NODE='/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness' \
DSH_PROBE_RUNTIME='/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh' \
node scripts/test-child-parent-delivery.mjs
```

Append `--red-no-persistence` for the purposeful failure control. The runner
executes all fifteen original checks before the new probe, in separate processes.
Use the original runner with `--red-drop-route` for its original control.

## Limits and remaining acceptance

Successful **parent-delivery admission** is proven, not eventual parent completion
notification or a model-authored return message. Reading persisted events is not
cold-resume proof. No permission-service enforcement, preset/composition restoration,
expanded resume matrix, provider replacement races, inventory policy matrix,
descendant disposal, external adapter qualification, operational account routing or
live acceptance is added. The [baseline remaining gates](<child-routing-seams.md#L95-L110>)
remain, except this specific successful native-tool creation/descriptor fixture gap.
T26 remains gated. No #7 closure is warranted.
