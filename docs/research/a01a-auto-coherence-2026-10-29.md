# A01a (#50) native Auto preparation coherence and shared retry ownership

2026-10-29. Branch `impl/a01a-auto-coherence`, base `690472c`. Installed host DSH `0.2.1-rc.3` (read-only source inspection through `ELECTRON_RUN_AS_NODE=1` from `/tmp`; nothing under `~/.dsh` or the app was modified; no network or provider call). Evidence layer: controlled fixtures only. No real browser, installed-host UI or paired-device acceptance was run; mobile testing is deferred to the Owner.

**Outcome: ticket #50 stays PARTIAL/open. Gate G6 is NOT resolved.** One reachable defect in the pure Auto core was fixed test-first (the distinct-candidate budget was bypassed by session stickiness and apply-and-reselect). Everything that needs pre-provider prompt/route preparation or a shared cross-layer retry owner is blocked by a missing public rc.3 seam and is written up as a decision gate; nothing in the host is patched or simulated.

## Gap analysis

`rc3:` = `/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/`. Paths without prefix are repo-relative. Line numbers re-read in this slice.

### What the installed rc.3 sources show about the seam

- `agent/request` waterfall proposes `{provider, model, ...}` per attempt (`rc3:dsh-agent-loop/lib/index.js:1191`), then `llm.prepareCall(proposedConfig, signal)` binds the adapter (`:1201`). This is an awaited, per-attempt, public route-selection point (`ctx.on('agent/request')`, used by `scripts/probe-auto-host.cjs:275,321,371,457`).
- BUT the system prompt is assembled once per step, before the attempt loop: `renderedPrompt = renderPrompt(assembly)` (`:1049`), the loop starts at `:1051`, and the retry path does `continue` (`:1146`) without re-running `agent/pre-step` or prompt/tool provider evaluation. `refreshContext` (`:1053`) only refreshes runtime-context sections. Prompt/tool providers run synchronously before the assemble waterfall (`rc3:dsh-system-prompt/lib/index.js:356-405`, see `docs/research/auto-pre-provider-seam.md`). So the route chosen in `agent/request` cannot reshape the already-rendered prompt/tools of a step; a hidden switch after a failure keeps the previous route's prompt contributors.
- Retry ownership is split: `llm-retry` owns the `agent/request-error` waterfall (`rc3:dsh-agent-loop/lib/index.js:1136`; `rc3:dsh-llm-retry/lib/index.js:151-178`), counts per `provider + policyKey` from session projection state (`:162-166`), `always` mode retries even when a downstream handler fails (`:153-159`), and `normal` mode stops at `maxRetries` (`:164`). Adapter-internal pool/credential-refresh/endpoint attempts happen inside one `stream()` and are invisible to it. No public API threads one total across plugin dispatch, native retry and adapter-internal attempts. A prepared call is single-dispatch (`rc3:dsh-llm/lib/index.js:2249-2252`) and `prepareCall` can be invoked again per attempt (`:2220-2224`), so a plugin ledger can see each preparation, but it cannot see or veto native/adapter attempts.
- Pre-provider requirement probe: `node scripts/test-auto-seams.mjs --require-pre-provider` exit 1, `required pre-provider assembly boundary is unavailable` (re-run in this slice).

### Clause map

| Acceptance clause | Class | Evidence |
| --- | --- | --- |
| Resolve G6 (pre-provider model-sensitive preparation + shared retry accounting) | BLOCKED-BY-MISSING-PUBLIC-SEAM | Gate below. Prompt rendered once per step (`rc3:dsh-agent-loop/lib/index.js:1049,1146`); `--require-pre-provider` exit 1. |
| Max 3 distinct safe pre-output candidates across ALL owned layers incl. auth refresh | PARTIAL (plugin-owned dispatch only) / BLOCKED for native + adapter layers | Core budget: `modules/auto/index.js` `createBudget`, `test/auto-core.test.js:178,193,198,210,222`. NEW: budget now gates sticky/reselected paths. Native `llm-retry` count is separate (`rc3:dsh-llm-retry/lib/index.js:162-166`); fixture ledger `scripts/probe-retry-host.cjs:38,202` (`npm run test:host-retry`, 20 pass) is cooperative and not a native primitive. Auth refresh/endpoint fallback have no shared-budget parameter (`docs/research/retry-budget-seams.md`). |
| Preserve images/history/tools/context/explicit effort | PARTIAL | Eligibility never reduces: `test/auto-core.test.js:83,112`, `test/auto-enrollment.test.js:219`; unknown capability excluded (`modules/auto/index.js:147-157`). Concrete prompt/prepared request/serving route coherence is UNSATISFIED at the public assembly seam (`docs/research/r10-native-contract-reconciliation.md`). History/context preservation across a switch is not provable without the pre-provider seam. |
| Partial reasoning/text/tool/effects/cancel stop hidden switching | PARTIAL (host fixture) | `npm run test:host-retry`: 12 partial-output scenarios and 4 cancellation scenarios pass, but via the fixture-owned ledger and guard (`scripts/probe-retry-host.cjs`); `--red-replay-partial` shows 3 !== 1 without the guard. Not native proof, and the pure core has no output-started state (not added: would be an unmounted helper). |
| Scoped failures/reset/exhaustion and unknown telemetry honest | PARTIAL | Exhaustion reason `exhausted` (`test/auto-core.test.js:198,222` + 2 new); cooldown, revoke, unknown capability fail closed (`modules/auto/index.js:148-157`). Scoped failure classification (account vs model vs provider) and telemetry are not modelled and have no data source in the unmounted core. |
| Policy safe reapply vs immediate revocation; async fences; no global-default mutation | PARTIAL | Revoke blocks new dispatch in every session (`test/auto-core.test.js:235`, `test/auto-enrollment.test.js:133`); apply-and-reselect is explicit (`test/auto-enrollment.test.js:174`); manual exit preserves the default (`:149`). Host probe `scripts/probe-auto-host.cjs` ("manual native composer choice ... no global default write", late-failure fence) passes 14/14 against synthetic store. Async fences against a real Session-controller store and mounted picker are unproved. |
| Native API candidates only after S15, without blocking subscription-only Auto | SATISFIED (module level) | S15 `modules/catalog/native-api.js` excludes `AUTO_ROUTE_ID` and registers no adapter; catalog never enrolls (`test/accepted/native-api-references.test.js:223`, `test/accepted/catalog.test.js`); enrollment is explicit `modules/auto/enrollment.js`. Auto core works with subscription-only membership (`test/auto-enrollment.test.js:53`). Not mounted into any production path. |
| Owner action -> admitted transport -> consumer -> visible outcome | MISSING | `modules/auto` is imported only for constants (`modules/catalog/index.js`, `modules/catalog/native-api.js`); no route, no adapter registration, no picker consumer. |

## Decision gate G6 (open)

Missing public contract: no supported rc.3 API lets a plugin (a) run model-sensitive prompt/tool/section contribution after the per-attempt route is chosen, or (b) own one finite attempt total over native `llm-retry`, adapter-internal pool/refresh/endpoint attempts and plugin dispatch.

Observed: `agent/request` is awaited and public but runs after the step's prompt is rendered (`:1049` vs `:1191`), retry `continue`s without re-render (`:1146`); `llm-retry` counts by provider+policy key only (`rc3:dsh-llm-retry/lib/index.js:162`); `always` mode ignores downstream refusal (`:153-159`).

Options for the Owner: (1) request or wait for a first-party contract (draft `docs/research/auto-upstream-request-draft.md`, unpublished): an awaited per-attempt prepare hook ahead of prompt/tool rendering and a caller-visible attempt budget in `agent/request-error`; (2) accept Auto as concrete-route-after-first-selection only, with disclosed limits (late redirect, previous contributors retained), and drop the coherence claim; (3) revise the scope of #50. NOT recommended: patching or monkey-patching the host loop or counting only in a fixture ledger and calling it proof.

## Implemented slice (reachable clause: distinct-candidate budget)

Defect found while mapping the clause: `selectAuto` returned the sticky or reselected route before consulting the budget (`modules/auto/index.js`, sticky/reselected branches), so a candidate that already failed could be re-dispatched and an exhausted budget could still dispatch a 4th candidate. Fix: both branches now require `budget.remaining() > 0` and an unattempted candidate; otherwise normal selection continues, which reports `exhausted` or the next distinct candidate. The module is still pure and unmounted; this is core-contract evidence, not a composed-host test.

## RED / GREEN record

| Step | Command | Exit | Result |
| --- | --- | --- | --- |
| RED | `node --test test/auto-core.test.js` (2 new tests added) | 1 | `actual: 'sticky', expected: 'selected'` and `actual: 'sticky', expected: 'exhausted'` |
| GREEN | `node --test test/auto-core.test.js test/auto-enrollment.test.js` | 0 | 38 tests, 38 pass (36 prior + 2 new) |
| Exact-host Auto probe | `node scripts/test-auto-seams.mjs` | 0 | 14 checks pass (rc.3) |
| Pre-provider requirement | `node scripts/test-auto-seams.mjs --require-pre-provider` | 1 | `required pre-provider assembly boundary is unavailable`; stays RED by design (gate) |
| Exact-host retry probe | `node scripts/test-retry-seams.mjs` | 0 | 20 scenarios pass, 0 network attempts; fixture-owned cooperative ledger only |
| Full | `npm test` | 0 | 628 pass, 0 fail (baseline 626 + 2 new) |
| Classifier | `node test/classify.test.cjs` | 0 | 166/166 |
| Hygiene | `git diff --check` | 0 | clean |

Limits: controlled fixtures only; the probes use `DSH_PROBE_NODE`/`DSH_PROBE_RUNTIME` pointing at the installed rc.3 and synthetic adapters. No real provider, browser, installed-host UI or paired acceptance.
