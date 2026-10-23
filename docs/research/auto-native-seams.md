# T02B: native Auto seam evidence

Issue: [T02B / #5](https://github.com/majedsiefalnasr/dsh-majed/issues/5).
Inspected/tested host: DSH `0.2.1-rc.2`, installed Electron Node `24.21.0`.
Date: 2026-10-22; scoped concrete-routing follow-up: 2026-10-23. **Partial feasibility evidence; T02B remains open. No Auto runtime is enabled.**

## Approved boundaries and reproduction

The approved T02B/runtime/client seams are exercised without accounts, provider calls, auth stores,
installed-state writes, host patches or global-default changes. The exact-host suite is separate from
portable `npm test`: missing configuration fails, never passes as a skipped proof.

```sh
DSH_PROBE_NODE='/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness' \
DSH_PROBE_RUNTIME='/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh' \
npm run test:host-auto
```

`scripts/test-auto-seams.mjs` uses a generated temporary HOME/DSH_HOME, a minimal child environment,
a bounded execution timeout and verified cleanup. The host probe forbids fetch/http(s) network calls.
It mounts only synthetic adapters and in-memory public services. The normal build/package remains
baseline-only; these research scripts are not shipped or activated.

## Observed results

- `scripts/probe-auto-client.cjs`: five behavior checks passed using the exact unmodified native
  model-selection bundle. Its real `/model` command lists/selects the synthetic catalog Auto identity;
  its composer component produces the checked Auto row itself. Unknown reasoning produces no effort
  menu. A manual composer selection replaces Auto through the session-selection boundary; stale old
  failure cannot overwrite the newer projection. Disposal and addressed-child rejection are checked.
- The client environment supplies explicit store, React, slots and remote-service boundary fixtures.
  The component function is evaluated, not mounted by a real React reconciler or browser. This is
  more than a bundle-import assertion but not browser, RPC or visual acceptance.
- `scripts/probe-auto-host.cjs`: fourteen checks passed with actual Cordis/LLM/Agent/Session/SystemPrompt/
  ToolRuntime/AgentLoop services and synthetic adapters. Exact metadata uses fixture-owned
  conservative intersections; unsupported explicit effort rejects before dispatch. A prepared stream
  retains its captured generation and old adapter after policy and registration replacement, is
  one-shot, and rejects changed route controls. ConfigureCall metadata is frozen and cannot redirect
  provider/model. Unknown context/effort/modalities remain unknown; empty intersections grant nothing.
- The real in-memory agent loop keeps its selected alias and effort consistent across prompt assembly,
  request header and dispatch while a concurrent manual selection takes effect on the next step.
  The next manual step bypasses Auto, clears inherited effort and does not inherit old context.
  Tools schemas and refreshed context reach the frozen request. Text-only image projection preserves
  original history; image-capable and unknown metadata retain the synthetic attachment identity.
- Host network guard recorded zero attempted calls. No persistence, credential or attachment service
  was mounted. Neither a real image file nor an operational service was accessed.

## Findings that prevent a completion claim

1. **Concrete interpolation and dispatch are feasible, but full prompt-provider coherence is not proven.**
   Native `LlmRuntime.prepareCall` cannot redirect provider/model, and a request-only redirect leaves
   the already rendered prompt naming Auto. A second fixture wraps the public scoped
   `system-prompt/assemble` and `agent/request` waterfalls: it captures a candidate before awaiting,
   replaces returned interpolation variables, and routes the matching request to that concrete model.
   Its rendered identity, effort, context, request header and settled assistant source agree on
   `t02b-concrete/alpha`. Concurrent policy replacement and manual selection leave that accepted step
   unchanged; manual intent survives and bypasses Auto on the next step. This uses a fixture selection
   holder, not the real Session-controller selection store, and is not a production routing module.
   Crucially, registered section/tool/variable providers run **before** the assembly waterfall. The
   fixture explicitly demonstrates that an already evaluated section still reads Auto even when later
   interpolation says alpha. This is not a solution for arbitrary model-sensitive contributors.
   Supported pre-provider selection, coexistence with native selection ownership, retries/resume and
   request-aware eligibility still require proof. Do not narrow the approved coherence requirement
   or patch/re-render host internals to conceal this gap; bring an unsupported seam to the Owner.
2. **Unknown is not compatible.** Native preparation passes images through when modalities are
   absent; known text-only models project them to text. That host behavior must not be mistaken for
   Auto eligibility. Future routing must reject an incompatible/unknown candidate before dispatch,
   without silently deleting or degrading the Owner's image/history/explicit effort requirements.
   The exercised metadata has no generic tools-supported flag; `toolUpdate` is not one. Tool support
   requires additional explicit eligibility evidence. Fixture intersections and first-member dispatch
   are characterization, not an implementation proof of request-aware candidate eligibility, context/
   output budgeting, or image/tools routing. Those approved requirements remain open.
3. **The client and host proofs are not end-to-end.** The picker receives a literal synthetic catalog
   and synthetic session projection; host `listModels`/exact metadata are exercised separately.
   The public `buildModelCatalog(ctx, explicitDefault)` is now exercised separately: it enriches the
   synthetic Auto row with exact reasoning, omits context/modalities from browser rows, and needs no
   default-model service when given an explicit default. Real client RPC selection/projection and a
   mounted picker against that synthetic host have not been proven. The full approved real-bundle gate is
   therefore only partially addressed.
4. **Later operation gates remain distinct.** No retry-budget proof (T02C), child pre-start proof
   (T02D), installed desktop restart, remote GUI, keyboard/focus/RTL/theme/font check, account Cutover,
   real provider consumption, membership revocation implementation or release acceptance is claimed.

## Primary installed source anchors

Paths below are relative to the inspected installed DSH runtime, not the development repository.
The installed distribution advertises TypeScript declarations but the inspected declaration files
are absent; signatures here are verified from executable JS, not invented declaration files.

- `node_modules/@deepseek-ai/dsh-client-ui-model-selection/lib/client.js:710-1042`: catalog and
  exported ModelDirectory lifecycle, Session projection and `sessions.selectModel`; catalog and
  selection operation generations are client state, not a routing-policy generation.
- `node_modules/@deepseek-ai/dsh-client-ui-model-selection/lib/client.js:1152-1214,1432-1472,1635-1678`:
  native composer derives model/effort rows from the catalog and submits complete selection identities.
- `node_modules/@deepseek-ai/dsh-client-ui-model-selection/lib/client.js:1796-1930`: native `/model`
  contribution, composer slot registration and exported `ModelDirectory`, `ModelDirectoryResolver`.
- `node_modules/@deepseek-ai/dsh-api-session-controller/lib/index.js:563-611`: exported
  `async buildModelCatalog(ctx, defaultSelection)` projects live adapter models and enriches reasoning;
  this proof supplies an explicit synthetic default and mounts no SessionController/settings service.
- `node_modules/@deepseek-ai/dsh-agent/lib/index.js:148-210`: public
  `installModelSelection(agentCtx, selection)` snapshots selection before downstream assembly and
  applies it to the request, including clearing inherited effort. It captures an object reference;
  this proof replaces `selection.current` values instead of mutating an already captured object.
- `node_modules/@deepseek-ai/dsh-system-prompt/lib/index.js:356-405`: registered variables,
  sections and tool providers resolve before the authoritative scoped assembly waterfall.
- `node_modules/@deepseek-ai/dsh-agent-loop/lib/index.js:902-927,1043-1088,1174-1210`: assembly
  precedes pre-step; prompt rendering precedes request preparation; concrete preparation then supplies
  request metadata and dispatch. A late request-only redirect does not reassemble prompt text.
- `node_modules/@deepseek-ai/dsh-llm/lib/index.js:964-1003`: synthetic chunks must use `blockType`
  at block start and a complete `block` at block end for successful assistant settlement.
- `node_modules/@deepseek-ai/dsh-llm/lib/index.js:2182-2260`: call-control validation,
  `async prepareCall(config, signal, configure)`, immutable metadata, route identity preservation,
  one-shot registration-bound dispatch and config validation.

## Pre-provider investigation follow-up

A further real-service characterization on 2026-10-23 records variable, tool, section and context
provider evaluation before even a prepended scoped assembly listener, followed by pre-step and request
middleware. A deliberately suspended `agent/inbox/claimed` listener remains pending while the native
request completes; notification dispatch is not an awaited admission barrier. The fixture drains that
listener explicitly during cleanup. This rules out those specific lifecycle workarounds, not every
possible future host extension. The source audit and Owner decision options are recorded in
[the pre-provider seam investigation](auto-pre-provider-seam.md). No requirement is reduced.

With the same isolated runner environment, `npm run test:host-auto -- --require-pre-provider` fails
intentionally with `required pre-provider assembly boundary is unavailable`. It asks for the missing
ordering guarantee and is not a passing acceptance test, a new routing implementation or a fix.

## Verification status

Exact-host suite after the ordering characterization: client 5/5 and host 14/14 checks passed. Negative controls: missing runner configuration
fails explicitly; host `--red-control` disables fixture generation capture and fails its expected-generation
assertion. The runner forwards only the named negative-control and required-order probe flags. `npm run test:host-auto --
--red-concrete-route` (with the same environment) bypasses concrete request routing and fails with
`native request must dispatch the concrete target` (`0 !== 1`). These show assertion sensitivity, not
production TDD completion. The follow-up also corrected malformed synthetic stream chunks to the real
`blockType`/terminal `block` contract and now checks successful assistant settlement, not dispatch alone.
Portable `npm test` passed 45/45 baseline tests plus 166/166 classifier cases; `git diff --check`
and probe syntax checks passed. Independent fixed-diff Standards review found no findings. Spec review
confirmed the three acknowledged partial areas in the earlier 11-check evidence and no false-completion
or scope-creep finding. Separate Standards and Spec reviews of the five-file 13-check follow-up against
`e28f0c7efa665f7a8f25af863c53f693f4b1d258` found no new actionable findings within this explicitly partial
slice; contributor coherence/native selection ownership, request-aware eligibility and end-to-end mounted
picker integration remain open. Reviewers inspected the diff without rerunning tests or accessing
operational state. The evidence commit/issue record the boundary, not an acceptance waiver.
Separate Standards and Spec reviews of the six-file pre-provider evidence slice against
`f5779f249c12e061042fdcab3f5677e961c67212` found no new actionable findings; neither review reran
probes or treated the existing acceptance gaps as resolved. The ordering fixture covers a claimed-input
step only; the source audit's proposed tool-driven continuation, retry and resume extensions are not
fresh runtime evidence.
There is no project TypeScript typecheck script; syntax/runtime execution and existing regressions are
used instead. No production implementation or claim of live Auto functionality accompanies this report.
