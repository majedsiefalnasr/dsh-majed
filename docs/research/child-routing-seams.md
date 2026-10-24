# T02D: partial local child pre-start evidence

## Status and authority

**Partial characterization only; T02D / #7 remains open.** This is an exact installed-host
proof of caller-supplied local routes, not global interception or enabled Smart Auto.
The approved [acceptance criteria](<../managers-tickets-draft.md#L120-L130>) are unchanged.
No private manager method is intercepted and DSH is not patched. No installed plugin,
operational account, permission setting or model-facing tool exposure is changed.

Observed DSH: `0.2.1-rc.2`. The [probe](<../../scripts/probe-child-host.cjs>) imports public
exports from actual Cordis, LLM, SystemPrompt, SessionProjection, Session, Agent, Tools,
AgentLoop, SubagentRuntime and native local spawn/fork plugins. It uses in-memory sessions,
a synthetic adapter, an explicit working-directory boundary double and caller delivery.
The directory double checks neither filesystem authorization nor directory validity; the
runner supplies an absolute generated temporary directory. No persistence, credential,
real provider or real inference service is mounted. Permission-helper event capture is
not proof of actual permission-service enforcement.

The [runner](<../../scripts/test-child-seams.mjs>) passes a minimal environment and generated
temporary HOME/DSH_HOME, limits output and execution time, and removes only its verified
generated directory. Fetch, HTTP(S), TCP and TLS tripwires are installed before imports.
A separate watchdog rejects an unresolved fixture instead of letting Node exit successfully.
These are fixture safeguards, not an OS-level sandbox certification.

## Supported-backend matrix

Source observations below are exact installed-build anchors, not verified TypeScript
interfaces or upstream source guarantees. Advertised declaration files were unavailable.

| Surface | Observed public contract | Evidence and limits |
| --- | --- | --- |
| Native local spawn | `request.agentOptions` before admission; independent preset, output schema and depth capabilities | Actual service route/depth/capacity/lifecycle checks pass; selected preset success and schema execution not tested |
| Native local fork | Route overrides, output schema, depth; inherits completed parent turns and composition | Actual empty-parent fork settles; independent preset rejects; populated history and route override on fork not exercised |
| Caller-owned service creation | `async startActivation(spec)` accepts caller-resolved route before native admission | Does not preflight model/effort metadata itself; own caller must validate selection |
| Native model-facing tool | Configured defaults and settings-opted-in explicit route/effort; exact route allowance and LLM preflight | Registered-tool preflight, persisted admission and advisory inventory checks now pass in the linked increments below; positive preset and actual permission enforcement remain open |
| External backends | Provider-declared capabilities are checked; exported subprocess helper declares none | Concrete Codex/Claude adapters are not inspected or proven here; do not infer all custom backends are incapable |
| Universal child rewrite | No qualifying public rewrite-all-start hook established | `prepareContinuable` receives no route and is too late to replace resolved options; not a supported interception claim |

Relevant public source:

- [Service creation](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-subagent/lib/index.js#L3030-L3048>) and [capability enforcement](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-subagent/lib/index.js#L3310-L3327>): observed spec fields are `provider`, `label`, `request`, `signal`, `delivery`, optional reserved `childId`. Local request fields include `parent`, `prompt`, `cwd`, `agentOptions`, `agentPreset`, `maxDepth`, `outputSchema`.
- [Local startup](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-subagent/lib/types/manager.js#L316-L400>) and [receipt](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-subagent/lib/types/manager.js#L1090-L1096>): local success returns `{ childId, messageId, result, dispose }`. Resolved route/effort and delegated policy values are captured before the first await. This does **not** deep-snapshot the entire request or preset composition, which is read later.
- [Spawn plugin](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-subagent-spawn-in-process/lib/index.js#L12-L39>) exports `apply(ctx, config)`; private provider `prepareContinuable()` returns `Promise.resolve({})`.
- [Fork plugin](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-subagent-fork-in-process/lib/index.js#L22-L54>) exports `apply(ctx, config)`; private provider `prepareContinuable(request)` returns the completed-turn seed.
- [Native helper exports](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-subagent/lib/index.js#L3332>) include `resolveChildAgentOptions(parent, requested, childDepth)`, `resolveChildDepth(parent, maxDepth)`, `snapshotSubagentDescriptor(input)`, `foldSubagentDescriptor(events)`, `captureDelegatedPolicyOverrides(parent)` and `appendDelegatedPolicyOverrides(childSession, overrides)`.

## Ordering, authority and inventory

[Option resolution](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-subagent/lib/types/child-agent.js#L31-L91>) uses the latest request header for inherited provider/model/effort, creation options as pre-request fallback, and creation-time token limit. Explicit child options override inherited values. A changed provider/model without explicit effort removes inherited effort, allowing the target model's default.

The native tool has a separate [merge and preflight layer](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-tool-subagent/lib/index.js#L62-L127>): configured defaults precede explicit request values; provider/model must be supplied together; route change clears configured effort. [Execution](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-tool-subagent/lib/index.js#L442-L481>) checks route metadata, provider replacement and abort before creation. These tool-specific guarantees are source findings, not established by direct service tests.

[Model-selection settings](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-tool-subagent/lib/model-selection-settings.js#L41-L64>) default disabled, with explicit allowed routes. [Session policy capture](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-tool-subagent/lib/index.js#L538-L557>) pins exposure and inherits policy into children; catalog presence does not enable it. [Inventory](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-tool-subagent/lib/index.js#L145-L175>) is advisory: advertised membership is not execution authorization and adapters may accept unlisted IDs. No exposure reduction or widening is performed here.

[Composition and delegated policy](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-subagent/lib/types/child-agent.js#L140-L206>) remain native. The helper fixture pins a synthetic explicit sandbox override and approval `never`, but does not mount permission services. Descriptor version 3 records route/effort, not preset, maxTokens, depth or output schema. First supported descriptor owns replay; this helper check does not demonstrate cold resume.

[Native capacity](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-subagent/lib/types/activation.js#L9-L24>) and [final admission cutoff](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-subagent/lib/types/manager.js#L1232-L1271>) remain untouched. Early cancellation produces no child lifecycle in the tested case; later pre-acceptance cancellation can legitimately produce rollback edges. After admission, caller abort does not own child execution: explicit receipt disposal or native settlement does.

## Reproduction and recorded results

From the repository root:

```sh
DSH_PROBE_NODE='/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness' \
DSH_PROBE_RUNTIME='/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh' \
npm run test:host-child
```

Recorded on 2026-10-23: **12/12 checks pass; zero attempted network calls**. Missing host
environment fails explicitly, never a passing skip. This opt-in suite is not included in
portable `npm test` and is not shipped as an enabled runtime.

| Fixture check | Observed result | Boundary |
| --- | --- | --- |
| Inherited/latest route and explicit override | Detached options preserve token limit; changed route clears effort | Public helper plus actual explicit spawn; no native tool policy/preflight fixture |
| Descriptor and delegated policy capture | Nested restrictions detached; first descriptor wins; synthetic permission values remain pinned | No persisted replay, preset snapshot or real permission execution claim |
| Preset/depth rejection | Fork independent preset rejected; spawn without preset service rejected; depth zero rejects | No successful preset mount or composition restoration proof |
| Pre-aborted caller | No child start/catalog event or synthetic stream | Not every possible asynchronous cancellation phase |
| Explicit local spawn | Correct immutable route, lineage and depth while synthetic stream is held | Mutation occurs after admission; no paused-preparation race coverage |
| Concurrent sibling | Native capacity rejection; no extra stream/start | One root and one held child; no cross-root/tree drain matrix |
| Post-admission caller abort | Child finishes, is removed before receipt result, start/end run IDs pair | No external provider or real provider teardown claim |
| Capacity release/local fork | A second local fork completes after spawn settlement | Empty parent history only |

Sensitivity control, with the same environment:

```sh
npm run test:host-child -- --red-drop-route
```

This intentionally omits the explicit route at the real admission call. It must fail the
`explicit` versus inherited `parent` assertion with exit 1. It tests fixture sensitivity,
not production red/green TDD or universal interception.

## Remaining acceptance gate

A later [bounded native tool increment](child-tool-preflight.md) adds actual registered
definition execution, captured-policy denial, route-change effort validation, and cancellation
after metadata without additional child lifecycle. The historical twelve-check results above
remain the baseline; see that report for the expanded results and persistence limitation.

A separate [public-persistence increment](child-parent-delivery.md) now proves registered-tool
parent-delivery admission and the stored native descriptor in an isolated temporary JSONL backend.
It does not prove eventual parent notification, cold resume or the full tool dispatch pipeline.

A subsequent [advisory discovery increment](child-advisory-inventory.md) executes the actual
registered discovery tool: advertised disallowed models are filtered, an allowed unlisted model
resolves exact metadata/effort without inference, and the same route still admits through the
registered delegate. Parent independently reproduced green and the unchanged-assertion inventory
negative on 2026-10-24; bounded independent Standards/Spec review found no actionable defect.

Two additional bounded increments now establish [positive native preset ownership](child-preset-ownership.md)
and [actual delegated approval enforcement](child-permission-ownership.md). The former uses the real
Loader, preset registry and persona plugin to preserve requested child composition, explicit route/effort,
parent composition, native depth and paired lifecycle. The latter dispatches through actual ToolRuntime
and ApprovalService: an allowed sentinel runs, delegated `never` denies an ask-gated operation before
its body or willing answerer, and the audit pair records rejection. A subsequent fixture-only public
policy switch proves the answerer can grant. It is not filesystem-confinement proof.

Parent reproduced all three preset checks and five approval checks, zero network attempts, and both
input-only sensitivity failures on 2026-10-24. Independent Standards and Spec reviewers found no hard
or specification defects; optional runner duplication advice is not an acceptance gate.
T02D remains open pending whole-ticket reconciliation, not because those two criteria are still absent.
Broader policy/inventory matrix coverage remains unproved but is not automatically a separate acceptance prerequisite;
persisted cold resume, mid-preparation abort or exact-parent replacement races, and
cross-root/descendant disposal coverage also remain unproved. Concrete external adapters
have not been qualified.
Some are characterization gaps, not findings that the host is incapable. The absence of a
universal rewrite hook is an inspected-scope limitation; caller-owned selection is distinct.
No supported-child scope is narrowed without Owner review. T26 and all dependent edges
remain gated, and no real child inference, operational Cutover or live acceptance is implied.
