# T02C: partial shared-budget and termination evidence

## Status and scope

**Partial characterization only; T02C / #6 remains open and failover activation is paused.**
The approved [acceptance criteria](<../managers-tickets-draft.md#L108-L118>) are unchanged.
This record demonstrates an owned cooperative synthetic ledger through real host recovery and
re-preparation, not a native shared-budget service or integrated provider wire enforcement.
It does not authorize host patches, account access, operational installation or service consumption.

Observed installed DSH: `0.2.1-rc.2`. The fixture imports the installed public Cordis, LLM,
SystemPrompt, SessionProjection, Session, Agent, ToolRuntime, AgentLoop and retry plugin exports.
Only a synthetic adapter is registered. The [runner](<../../scripts/test-retry-seams.mjs>) gives
it generated temporary HOME/DSH_HOME, a minimal environment, bounded output and a 30-second
timeout, then removes only the verified generated directory. Network tripwires reject fetch,
HTTP(S), TCP and TLS calls before runtime loading. This is not an OS sandbox certification.
No operational persistence, credential, attachment or provider service is mounted; no real
accounts, image bytes, quota failures or inference are exercised.

## Public seams and source findings

These are exact installed-build anchors, not an upstream source-version guarantee:

- [LlmAdapter and preparation](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-llm/lib/index.js#L1664-L1754>):
  `providerRetryPolicy(_provider)` and `async prepareCall(provider, model, signal)` allow a
  synthetic adapter to retain a ledger outside the one-shot prepared call. Undefined policy
  means resolved defaults, not absence of retries. The fixture explicitly selects a policy.
- [Agent request recovery](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-agent-loop/lib/index.js#L1128-L1171>):
  failed streams settle as `assistant/attempt` before awaited `agent/request-error`.
  `{ kind: 'retry' }` continues the attempt loop and prepares again; it does not repeat full
  prompt assembly. The loop checks the authoritative abort signal after recovery. Tools are
  dispatched only on the successful-message branch.
- [Native retry accounting and composition](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-llm-retry/lib/index.js#L50-L106>) and
  [recovery policy](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-llm-retry/lib/index.js#L151-L183>):
  native retry state is keyed by provider and policy, not a shared cross-layer total.
  `always` mode can ignore a downstream refusal or exception and request another retry;
  returning no action or throwing alone is not an unconditional termination guarantee.
- [Public cancellation](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-agent-loop/lib/index.js#L815-L821>):
  `agent.cancel({ kind: 'hook', reason })` aborts the current authoritative phase. The fixture
  uses a prepended scoped `agent/request-error` guard and does not delegate on exhaustion or
  partial output. Nonterminal failures must delegate with `next()` for middleware to run.
  Cancellation also terminates an outer native `always` wrapper. Default cancellation clears
  queued input; this fixture has no other queued input and does not prescribe production inbox policy.
- [Durable cancellation reason](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-agent-loop/lib/index.js#L731-L743>):
  the hook reason is retained in `turn/end`. Cancelling in recovery does not retroactively
  convert a failed prefix into a successful or interrupted `assistant/message`.

## Reproduction and recorded results

Run from the repository root, explicitly opting into installed-host inspection:

```sh
DSH_PROBE_NODE='/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness' \
DSH_PROBE_RUNTIME='/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh' \
npm run test:host-retry
```

Recorded on 2026-10-23: **16/16 checks passed; zero attempted network calls**.
Missing environment or a missing host fails the opt-in runner, never a passing skip.
These checks are not added to the portable `npm test` host-independent acceptance suite.

| Fixture coverage | Observed result | Boundary |
| --- | --- | --- |
| Native `always` retry and repeated preparation | Three sends/preparations, two retry events, then durable aborted end | One fixture-owned in-memory cycle, no restart replay |
| Synthetic pool + refresh + endpoint branches | Five ledger entries across two preparations and two distinct candidates | Labels model cooperative send boundaries; no provider/token code runs |
| Text, reasoning and tool-call partial failure | One failed attempt, one send, no retry event, durable sanitized stop reason | Repeated with retry absent, normal, always, and always mounted after guard creation |
| Iterator and signal lifecycle | Every admitted generator closes; turn signal identity survives preparation | Does not prove upstream token-refresh cancellation or plugin-disposal wait handling |
| Caller cancellation during stream | One send, iterator closes, no recovery, durable aborted end | No selection/backoff/refresh cancellation matrix yet |
| Nonretryable authentication failure | Normal middleware stops after one send with AUTH error | No cooldown/account classification implementation |

The partial-output checks inspect actual durable native attempt streams and assert no successful
assistant message or tool event is committed. They do not merely assert that the agent became idle.
They do not recover the prefix or implement a manual recovery UI. A separate explicit retry would
need a new, named recovery cycle; that lifecycle is not implemented here.

Sensitivity controls use the same environment:

```sh
npm run test:host-retry -- --red-reset-budget
npm run test:host-retry -- --red-disable-guard
npm run test:host-retry -- --red-replay-partial
```

The first two were observed to exit **1** at the budget/preparation assertions. Resetting the ledger at
preparation breaks persistence; disabling cancellation permits repeated empty dispatches after
send exhaustion. A fixture watchdog cancels after eight stream admissions so broken controls do
not run indefinitely. These failures show assertion sensitivity, not production red/green TDD.
The guard-disabled control fails before reaching the partial-output matrix. A separate
`--red-replay-partial` control bypasses only the partial flag, retains exhaustion cancellation,
passes both budget cases and exits **1** at the first partial-send assertion (`3 !== 1`). This
shows sensitivity for the absent-middleware text case, not every partial/middleware permutation.

During fixture construction, failures exposed three harness errors, now corrected: Cordis cleanup
uses `ctx.fiber.dispose()`, nonterminal guard paths delegate through `next()`, and tool deltas use
`argumentsDelta`. Durable text deltas are natively compressed into text-chunk records; prefix
assertions therefore inspect settled block-end evidence rather than assume raw delta storage.

## T02C bounded feasibility — accepted as limited characterization

## T02C bounded feasibility — accepted as limited characterization

The original criteria required a **native cross-layer shared budget** across provider pools,
credential refresh, endpoint retries, host retry/recovery and re-preparation. The installed
DSH runtime (0.2.1-rc.2) **does not provide a native shared budget primitive**. The inspected
subscription source confirms:
- Pool resets tried count per stream; no shared budget across pool streams.
- Provider credential refresh and endpoint fallback resend without a shared budget parameter.
- TokenManager refresh has no caller signal or shared-budget parameter.

**Accepted bounded characterization:** This probe establishes a **fixture-owned cooperative
synthetic ledger** that survives real host retry/re-preparation via `agent.cancel({kind:'hook'})`
public termination seam. It demonstrates:
- Budget persistence through real host retry/re-preparation (16/16 checks pass).
- Cancellation and no invisible partial replay after text/reasoning/tool output via
  `agent.cancel({kind:'hook'})` — the public termination seam — tested across absent/normal/always
  middleware and after-guard mounting.
- No invisible automatic partial replay; explicit `agent.cancel` required.
- Failover correctly paused; no host patches or nested retry multiplication.

**Explicit limitations (not acceptance criteria):**
- No native shared budget across provider pools, credential refresh, endpoint retries.
- No integrated provider wire send counting or refresh ownership/cancellation.
- No durable restart reconstruction, independent candidate limits, native compaction/summary,
  or full cancellation/recovery matrix.
- Failover remains paused; no architecture scope changed.

T02C bounded feasibility accepted as **limited exact-host characterization** — not a native
shared budget implementation. Failover remains paused pending Owner decision on native budget
primitive or separate provider integration.
