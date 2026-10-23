# T02A acceptance ledger

Parent: [T02A / #4](https://github.com/majedsiefalnasr/dsh-majed/issues/4), part of [expanded specification / #2](https://github.com/majedsiefalnasr/dsh-majed/issues/2). Integration branch: `feat/managers`. Last reconciled: 2026-10-24.

This is execution tracking against existing acceptance, not a new specification or a dependency waiver. The ticket is OPEN. A partial proof does not close the combined acceptance criterion.

| Existing requirement | Evidence and status | Outstanding acceptance |
| --- | --- | --- |
| Native Owner-authenticated Fetch | `3b192eb`: actual native plugin apply and BrowserAuth algorithm with synthetic memory credentials, in-memory HTTP streams and rejection/lifecycle controls. | Actual local/paired-remote supported carrier admission and resulting Manager operations; no operational login implied. |
| Settings registration and actual client | `d3c53aa`: [partial actual bundle evaluation](management-settings-proof.md), supplemented by `a187ecd` + observable initial-state correction `5ae1157`: [real jsdom-mounted Settings](management-mounted-settings-proof.md), unchanged installed renderer/Settings/general, public SlotRegistry/SlotCore, real ReactDOM/stores/Cordis lifecycle. Independent green and both intended selection/withdrawal negative controls reproduced. | jsdom is not browser/live or visual acceptance. Presentation primitives and external remote/locale/session services remain explicit adapters. Actual Manager operations and supported authenticated carrier composition remain open. |
| Authenticated session/project scope | Earlier `4848585` [service composition](management-scope-proof.md) now complemented by `54856b1` + `6c587d0` [native admission/resolver composition](management-composition-proof.md): actual signed synthetic Owner admission precedes public session/workspace scope observation. Nine groups pass, including live publication/disappearance during both filesystem awaits; membership-fact negative fails. Reviewed P2 authority race fixed and rereviewed. | Memory credentials/storage and in-memory HTTP are not operational login, browser or actual paired-remote acceptance. Resolver remains outside package/registration; no production write operation is enabled. Canonical path is an observation, not a filesystem lease; client identifiers remain selectors, not authentication. |
| Native Skills policy/catalog invalidation | `a1c372b`: actual filesystem provider/watch and registry over disposable roots; complete snapshots, independent invocation flags, external edit/rename/delete and awaited disposal/catalog removal. | Integrate with actual Manager operations and applicable client/transport proof; no installed Skill store or watcher-handle instrumentation claim. |
| Official MCP lifecycle | `1d2979e` with report correction `e28fe6a`: [bounded official client/ToolRuntime lifecycle](management-mcp-proof.md), real stdio handshake, call/error/deadline/cancellation and awaited tool removal/owned child closure. Green and result-corruption negative independently reproduced; model-selected Standards/Spec review completed. | Production Manager composition, authenticated carrier, per-agent namespace isolation, reconnect/HMR and actual remote acceptance remain unproved. Caller cancellation does not prove server-side work rollback. Merged as `19277ef`; exact-host green lifecycle and baseline regressions (45/45 plus classifier 166/166) pass after merge. Worktree-only regression failure was a missing local Cordis dependency, not reproduced in integration. |
| Paired-remote carrier composition | `1329bd1` + reviewed correction `0581062`: [actual remote gate/rewrite/proxy and native BrowserAuth/exact Fetch](management-remote-proof.md) pass six groups using an explicit in-memory HTTP carrier. Counts remain 6 proxy calls / 6 inner calls / 2 inert operations / 1 invalidation. Pairing-fact and forwarded-Content-Type negatives fail at intended checkpoints; outer-only header defaults no longer mask forwarding loss. | Actual mounted remote service, pairing persistence, operational inner-auth resolver, socket/TLS/browser path and production Manager operations remain unproved. No trustworthy original local/remote Command Approval provenance is inferred. |
| Exact host and negative evidence | Existing admission and Skills probes target installed 0.2.1-rc.2 via ASAR-aware Electron Node 24.21.0; opt-in missing runtime fails, never skips. | Collect remaining implementer outputs; review against the fixed integration baseline, rerun after merge, preserve regression suite. |
| Command Approval remains separate | ADR 0008; T02E / #47 remains unsupported at the inspected provenance seam. | Never issue Approval challenges, persist Approval or enable command run/test/event paths by passing ordinary management tests. |

## Repeatable bounded suite

`node scripts/test-management-suite.mjs` requires explicit `DSH_PROBE_NODE`, `DSH_PROBE_RUNTIME`
and `DSH_PROBE_REMOTE` pointers and runs the existing six admission/Skills/Settings/MCP/composition/remote
runners serially. Missing pointers, unknown flags and child failure are failures, never skips. The
orchestrator bounds child time/output and marks unstarted runners `NOT RUN`; six portable tests cover
its outcomes, including exact per-runner failure labels and launched prefixes. Integrated rerun passed
all six on installed DSH 0.2.1-rc.2 / Electron Node 24.21.0; portable regression passed 51/51 plus
classifier 166/166. The constituent reports above retain their limitations. This command does not add
production operations, mount the live service, waive the Settings obligation or close T02A.

## Integration rules

- Implementers use separate branches/worktrees and commit owned files before reporting. Shared specification, dependency map and CHANGELOG are integration-owned.
- Each implementer merges the current integration tip before reporting; integration happens through a merger, followed by applicable tests and Standards/Spec review.
- Use the approved model family only, selecting Terra for extraction, Luna for small isolated changes, Astra for medium implementation/Standards and Sol for architecture/security/sensitive Spec. Workflow currently exposes provider/model but no reasoning-effort override; do not claim custom effort. The recovered evidence received two static reviews via ordinary subagents, whose model was not explicitly selected; do not count those as compliance with the model-routing rule. Earlier limit-stalled workflows were stopped and their files preserved rather than automatically restarted.
- Preserve historical untracked prototype files. Never revive profile config-editor ownership persistence or import vendored reference runtimes into the accepted build.
- Unsupported contracts require a concrete Owner decision, not fabricated passing tests. Do not waive native dependency edges or close a ticket for dispatching agents, writing reports or passing an incomplete fixture.
- Installed-state changes, credentials, real provider/judgment consumption, restart, Cutover and reference removal remain separate execution-point permissions.
