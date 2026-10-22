# T02B: native Auto seam evidence

Issue: [T02B / #5](https://github.com/majedsiefalnasr/dsh-majed/issues/5).
Inspected/tested host: DSH `0.2.1-rc.2`, installed Electron Node `24.21.0`.
Date: 2026-10-22. **Partial feasibility evidence; T02B remains open. No Auto runtime is enabled.**

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
- `scripts/probe-auto-host.cjs`: eleven checks passed with actual Cordis/LLM/Agent/Session/SystemPrompt/
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

1. **Alias identity is preserved, not rewritten to the concrete serving member.** Native
   `LlmRuntime.prepareCall` binds a requested provider/model pair; its configure callback may select
   controls but cannot redirect that pair. A custom adapter can capture a concrete candidate inside
   its stream closure, but the native prompt/header/source still describes Auto. The fixture proves
   alias coherence, not concrete model-specific prompt identity or durable served-by presentation.
   A supported Majed-owned serving record and concrete-target prompt metadata still need proof.
   Do not silently reinterpret the approved requirement: if only alias prompt identity is possible,
   request an Owner decision or supported upstream extension before narrowing behavior.
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
- `node_modules/@deepseek-ai/dsh-llm/lib/index.js:2182-2260`: call-control validation,
  `async prepareCall(config, signal, configure)`, immutable metadata, route identity preservation,
  one-shot registration-bound dispatch and config validation.

## Verification status

Exact-host suite: client 5/5 and host 11/11 checks passed. Negative controls: missing runner configuration
fails explicitly; host `--red-control` disables fixture generation capture and fails its expected-generation
assertion. These show the checks are sensitive to a broken fixture, not production TDD completion.
Portable `npm test` passed 45/45 baseline tests plus 166/166 classifier cases; `git diff --check`
and probe syntax checks passed. Independent fixed-diff Standards review found no findings. Spec review
confirmed the three acknowledged partial areas above and no false-completion or scope-creep finding.
The evidence commit and issue update record the review boundary; this is not an acceptance waiver.
There is no project TypeScript typecheck script; syntax/runtime execution and existing regressions are
used instead. No production implementation or claim of live Auto functionality accompanies this report.
