# R10 native Auto and retry reconciliation

Verified 2026-10-25 against the installed DSH **0.2.1-rc.3**. R10 / #50 remains **open**. These are isolated fixture results, not production Auto acceptance.

## Loading and reproducibility

The successful earlier probes used Electron's ASAR-aware Node runtime. The later historical #5/#6 closure comments reported module-resolution failures before scenario execution. Such failures do not establish an unavailable runtime capability. The historical comments concerned 0.2.1-rc.2; this run neither reconstructs their invocation nor claims the installed archive is unchanged.

Use the application executable as Node, rather than ordinary Node's real-filesystem loader, with the runtime **inside** the archive:

```sh
export DSH_PROBE_NODE='/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness'
export DSH_PROBE_RUNTIME='/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh'
npm run test:host-auto
npm run test:host-retry
```

The existing runners set `ELECTRON_RUN_AS_NODE=1` in each child, give it a generated temporary HOME/DSH_HOME, restrict the environment, bound execution to 30 seconds and remove the generated directory afterward. The fixture reads public package root exports through their installed executable entries. Cordis, LLM, Agent, SystemPrompt, Session, AgentLoop, ToolRuntime and retry services actually load; the native picker bundle also loads. Network tripwires execute before service loading. No operational persistence or credentials are mounted.

## Executed results

| Invocation | Exit/result | What it establishes |
| --- | --- | --- |
| `npm run test:host-auto` | 0; client 5 checks, host 14 checks; zero attempted network calls | Native catalog/preparation/loop and scoped route characterization executes on rc.3 |
| `npm run test:host-retry` | 0; 16 checks; zero attempted network calls | Fixture-owned cooperative ledger survives native retries and re-preparation; partial output cancellation matrix executes |
| `npm run test:host-auto -- --red-control` | 1 at generation assertion, `'B' !== 'A'` | Generation-capture assertion detects a deliberately stale generation |
| `npm run test:host-auto -- --red-concrete-route` | 1 at `native request must dispatch the concrete target`, `0 !== 1` | Concrete dispatch assertion detects disabled routing |
| `npm run test:host-auto -- --require-pre-provider` | 1 at `required pre-provider assembly boundary is unavailable` | The requirement probe reaches the semantic ordering assertion; it does not fail at module load |
| `npm run test:host-retry -- --red-reset-budget` | 1 at send-ledger assertion, `0 !== 3` | Resetting the ledger on preparation is detected |
| `npm run test:host-retry -- --red-disable-guard` | 1 at `budget must not reset in prepareCall`, `9 !== 3` | Removing the exhaustion guard allows excess admissions; the finite watchdog terminates |
| `npm run test:host-retry -- --red-replay-partial` | 1 at first partial-send assertion, `3 !== 1`, after two passing budget scenarios | Partial replay detection is exercised independently of exhaustion |

Each negative control exits at its intended scenario assertion. Electron also prints a nonfatal macOS `task_name_for_pid` diagnostic; it does not prevent scenario execution. These assertions are sensitivity controls, not newly implemented red/green production tests.

## Pending cooperative wait cancellation increment (2026-10-26)

Proof-only candidate based on `6c2b5a6`, branch `proof/r10-pending-cancel`, using gpt-6.1-sol. No production code or user-visible behavior changed, so no changelog entry is warranted. R11 candidate `1d077c8` remains unmerged; dormant R14 and the original checkout's dirty documentation are untouched.

Exact host: `/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness`, runtime `/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh`, reported version **0.2.1-rc.3**. Runner Node: **v23.11.0**. Reproduce from this candidate:

```sh
export DSH_PROBE_NODE='/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness'
export DSH_PROBE_RUNTIME='/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh'
npm ci --offline --ignore-scripts --no-audit --no-fund
npm test
npm run test:host-retry
npm run test:host-retry -- --red-late-send
npm run test:host-retry -- --red-late-endpoint
npm run test:host-retry -- --red-reset-budget
npm run test:host-retry -- --red-disable-guard
npm run test:host-retry -- --red-replay-partial
```

`npm test` passes **497/497**, no skips. The first run in the fresh worktree failed due to absent dependencies (`ERR_MODULE_NOT_FOUND` for Cordis/jsdom/fflate); installing from the offline lockfile cache resolved that environmental failure. No network installation was used.

The exact-host positive passes **20 scenarios**, zero attempted network calls. Four new cases independently hold a deterministic deferred credential-refresh or endpoint-fallback wait and later resolve or reject it. The scenario waits for the adapter's reached-boundary handshake, verifies an open iterator and one owned abort callback, then calls public `handle.agent.cancel`. The original request signal aborts, `whenIdle()` settles and the iterator closes **before** the deferred wait is released/rejected. The abort callback is removed. After late completion and two event-loop turns, assertions require no resumed work, no additional synthetic sends, no unhandled rejection, no reinstalled callback, no session-event mutation, no recovery/retry, no successful assistant message/tool effect, and an aborted owning `turn/end`.

Red → green: the new assertion was first executed with `--red-late-send` omitting the post-wait signal check; it failed after 15 passing existing scenarios at `late wait completion must not resume candidate or endpoint send`, `1 !== 0`. The guarded implementation passes. The endpoint-selective `--red-late-endpoint` independently passes both refresh cases then fails that same assertion on endpoint release. Both controls exit **1** by assertion, not module load or timeout; the unchanged runner has a **30-second watchdog**. Prior controls still exit **1** at their intended assertions: reset budget `0 !== 3`, disabled guard `9 !== 3`, partial replay `3 !== 1`.

The wait's race, cancellation check, send ledger and callback ownership are **fixture-owned cooperative contracts**, not host-provided refresh cancellation enforcement. The rejection branch remains observed by `Promise.race` after cancellation. This does not prove production provider/refresh wire enforcement, a native cross-layer shared budget, pre-provider contributor coherence, selection/backoff/disposal/restart coverage, or Auto activation. Native services are unmodified; no fake lifecycle events, operational accounts/state, live providers, host patches, tracker writes, merge or push are involved. Only the runner-generated temporary HOME/DSH_HOME is mounted and removed by the existing runner.

## Acceptance disposition

| Required contract | Current evidence and gate |
| --- | --- |
| Correct host loading and controls | **Proven for this invocation on rc.3.** Earlier archive/load failures cannot be used as capability evidence. |
| Genuine Auto catalog identity | **Bounded fixture proof.** Actual catalog and unmodified picker bundle accept a synthetic Auto identity; mounted React/RPC/native-owner integration remains unverified. |
| Concrete prompt contributor, prepared request and serving-route coherence | **Unsatisfied at the exercised public assembly seam.** Registered variable/tool/section/context providers evaluate before the awaited `system-prompt/assemble` waterfall. Scoped middleware fixes late interpolation/request identity but cannot rerun previously evaluated contributors. The requirement probe still fails. |
| Explicit effort, manual precedence and generation capture | **Partial fixture proof.** Invalid effort rejects before dispatch; held generations and next-step manual precedence pass. Real Session-controller selection ownership, concurrent manual selection, resume and mounted picker remain unverified. |
| One finite cross-layer budget | **Partial characterization.** A fixture-owned ledger bounds cooperative synthetic pool/refresh/endpoint sends across actual host recovery. It is not integrated provider/refresh wire enforcement or a native shared-budget primitive. |
| First reasoning/text/tool fragment stops failover | **Bounded fixture proof.** One send, settled failed attempt and no committed successful assistant/tool effect across absent/normal/always/after-guard retry modes. Production provider composition remains unverified. |
| Cancellation and cleanup | **Partial fixture proof.** Caller cancellation closes the synthetic iterator without retry. The pending-wait increment below covers cooperative synthetic refresh and endpoint waits; production enforcement and full selection/backoff/disposal/restart matrices remain unverified. |

R08 / #62 stays blocked by R10. The existing [pre-provider investigation](auto-pre-provider-seam.md) and [retry evidence](retry-budget-seams.md) retain their semantic limitations. No reduced coherence contract, provider failover activation or native ownership workaround is accepted here.

The concrete decision is still whether to obtain a supported awaited pre-provider route/selection contract, or have the Owner explicitly revise the Auto acceptance scope. The existing [upstream request draft](auto-upstream-request-draft.md) remains unpublished. Independent account and Manager work can continue. No host patch, installed-state write, live provider/judgment call, restart, cutover or reference removal was performed.
