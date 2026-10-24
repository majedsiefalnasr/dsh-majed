# T02D: bounded native child approval ownership

## Status and boundary

**Actual native approval enforcement is proved for this isolated fixture; T02D remains open.**
This increment complements [child routing](child-routing-seams.md) without changing its
acceptance scope. It does not enable Smart Auto, alter operational policy, patch the host,
or prove filesystem confinement. A fixture-owned `tools/pre-execute` listener marks one
in-memory sentinel operation as requiring approval. Native ToolRuntime, ApprovalService,
and local child lifecycle remain actual installed implementations.

The [probe](../../scripts/probe-child-permission.cjs) imports public package exports from
the installed DSH ASAR runtime. It mounts actual Cordis, LLM, SystemPrompt, SessionProjection,
Session, Agent, Tools, AgentLoop, ApprovalService, SubagentRuntime and local spawn plugins.
A synthetic LLM adapter holds the real child stream open; the actual agent loop opens the
turn. No turn is manually appended. The working-directory service is a fixture boundary
double, not an authorization or directory-validity check. Sessions are in memory; no
persistence, preset, real inference provider, operational store, sandbox or credential service
is mounted. Route selection is explicit at the public caller-owned admission seam.

## Observed public contracts

Installed host: `0.2.1-rc.2`; source anchors are installed-build observations, not upstream
API guarantees or available TypeScript declarations.

- [ApprovalService exports and policy](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-user-approval/lib/index.js#L63-L90>): native `ApprovalService` / default export mounts with `{ policy: 'ask' }`; `setApprovalPolicy(session, policy)` is public.
- [Native request](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-user-approval/lib/index.js#L128-L176>): an actual open turn is required; `approval/asked` and `approval/decided` enclose the decision. Session override wins configured default, and `never` rejects before the `approval/request` answerer waterfall.
- [Delegation capture](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-subagent/lib/types/child-agent.js#L180-L205>): approval service presence at child creation captures `never` independently of the explicitly selected route. Native creation appends `{ policy: 'never', source: 'delegation' }` onto the child session.
- [Actual ToolRuntime enforcement](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-tools/lib/index.js#L3198-L3213>): `ctx.tools.execute({ name, arguments, callId, agent, signal })` runs the real pipeline, not `definition.execute` directly. The [pre-execute waterfall](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-tools/lib/index.js#L3319-L3352>) services `ask` via the [approval seam](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-tools/lib/index.js#L3535-L3569>) and denies before body dispatch on rejection.
- [Typed tool registration](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-tools/lib/index.js#L838-L869>): `defineTool` accepts an implicit parameter-property map, plus output schema and `render(args, value)`; the fixture registers this definition using public `ctx.tools.register`.

## Reproduction

From the repository root, with the actual host executable and runtime:

```sh
DSH_PROBE_NODE='/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness' \
DSH_PROBE_RUNTIME='/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh' \
node scripts/test-child-permission.mjs
```

The [runner](../../scripts/test-child-permission.mjs) generates a temporary directory, passes
only minimal PATH plus temporary HOME/DSH_HOME/TMPDIR and Electron node mode, caps output
at 2 MiB and process time at 30 seconds, and checks the resolved generated path before
cleanup. The probe adds a 20-second watchdog and blocks fetch, HTTP(S), TCP and TLS before
host imports. Missing pointers, unknown flags, timeout, signal and nonzero exit fail rather
than skip. These are fixture safeguards, not an OS sandbox guarantee.

Recorded 2026-10-24: **5/5 checks pass, exit 0, zero network attempts**:

1. An explicitly routed native child holds a real open turn while its synthetic stream waits.
2. Actual ToolRuntime dispatches the allowed sentinel once without asking.
3. The restricted operation returns an error, body state remains `['allowed']`, and the
   willing `allowed-once` answerer is never invoked. Parent effective policy remains `ask`;
   child effective policy is native delegated `never`. The child records one matching
   asked/decided pair with outcome `rejected` and the exact restricted call ID.
4. As a subsequent positive control only, public `setApprovalPolicy(child.session, 'ask')`
   makes that same restricted operation reach the willing answerer once and execute once.
   This deliberately authorized fixture switch does not mutate the parent's policy.
5. Releasing the synthetic stream completes and removes the native child normally.

The positive control prevents a vacuous claim based on a missing or broken answerer. The
permission assertion is made before that switch. No grant or parent setting is accidentally
inherited by the delegated child.

## Unchanged-assertion negative control

Use the same command with `--red-late-approval` appended. This changes **only the fixture's
ApprovalService mount timing**: it is absent during native delegation capture and mounted
with the same `ask` default after the child stream enters. No host method, result, assertion,
policy event, or tool implementation is patched. The first two checks still pass; the same
restricted tool now reaches the willing answerer and dispatches. The unchanged assertion
`Ask-gated sentinel must be denied before body dispatch` fails (`false !== true`), exit 1.

The negative was observed before the green run. An initial fixture authoring error exposed
that `defineTool` takes a property map rather than a full JSON object schema; that setup
failure is not counted as the behavioral red. This is a sensitivity red/green experiment
against unchanged native code, not a claim of production implementation TDD.

## Other verification and remaining limits

`npm test` was attempted in this isolated worktree: build and packaging succeeded, but the
suite failed with 52 passes and 6 failures because worktree development dependencies were
unavailable (`ERR_MODULE_NOT_FOUND` for `@deepseek-ai/cordis` and `jsdom`). No package install,
network access or dependency/config change was made to conceal that environment limitation.
The exact-host permission probe needs neither package installed in this worktree.

No filesystem operation is used as a restricted body and no sandbox service is required:
this proof is approval ownership, not sandbox confinement. It does not establish enforcement
for every native tool, physical filesystem/process/network containment, full model-generated
tool-call scheduling, fork inheritance, external backends, persistence/cold resume, native
positive preset composition, universal child interception, or live acceptance. T02D, T26 and
dependent gates remain unchanged pending integration review and the other acceptance criteria.
