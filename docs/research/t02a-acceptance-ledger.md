# T02A acceptance ledger

Parent: [T02A / #4](https://github.com/majedsiefalnasr/dsh-majed/issues/4), part of [expanded specification / #2](https://github.com/majedsiefalnasr/dsh-majed/issues/2). Integration branch: `feat/managers`. Last reconciled: 2026-10-24.

This is execution tracking against existing acceptance, not a new specification or a dependency waiver. Combined temporary feasibility acceptance was satisfied on 2026-10-24 at merge `80b4a43`, subject to the explicit fixture limitations below. This is not product/live acceptance or operational permission. [GitHub #4](https://github.com/majedsiefalnasr/dsh-majed/issues/4) was resolved as completed after evidence commit `9e4cfc3`; T03 / #8 is unblocked.

**Gate scope:** T02A is the temporary exact-host, actual-client/public-service feasibility composition in
[the approved ticket](../archive/managers-tickets-draft.md#t02a--prove-authenticated-management-admission)
and [ADR 0008](../adr/0008-separate-management-admission-from-command-approval-provenance.md).
It does not require production Manager CRUD, completed T03 product status/visual controls, operational
login/state, Cutover or final T29 live acceptance before T03 can start. Requiring those would create a
circular dependency. The table's outstanding column records both missing feasibility evidence and later
non-claims; it does not promote later work into prerequisite scope. The retained actual local/paired-remote
carrier and client joins must still be proved under controlled fixtures or reported unsupported; memory
adapters alone do not establish an unexercised supported carrier. No gate is waived by this clarification.

The following table preserves the incremental checkpoints and their then-outstanding gaps. The combined
acceptance section below supersedes carrier/effects gaps; later production/live non-claims remain intact.

| Existing requirement | Incremental evidence and status | Outstanding at that checkpoint |
| --- | --- | --- |
| Native Owner-authenticated Fetch | `3b192eb`: actual native plugin apply and BrowserAuth algorithm with synthetic memory credentials, in-memory HTTP streams and rejection/lifecycle controls. `5e4ce69` + `bbc33da` add actual local/remote HTTP admission through the mounted native client; see the physical increment below. | Controlled Skills/MCP effects still need the same authenticated carrier join. Operational login and final live acceptance remain later non-claims, not prerequisite operations. |
| Settings registration and actual client | `d3c53aa`: [partial actual bundle evaluation](management-settings-proof.md), supplemented by `a187ecd` + observable initial-state correction `5ae1157`: [real jsdom-mounted Settings](management-mounted-settings-proof.md), unchanged installed renderer/Settings/general, public SlotRegistry/SlotCore, real ReactDOM/stores/Cordis lifecycle. Independent green and both intended selection/withdrawal negative controls reproduced. | jsdom is not browser/live or visual acceptance. Presentation primitives and external remote/locale/session services remain explicit adapters. Actual Manager operations and supported authenticated carrier composition remain open. |
| Authenticated session/project scope | Earlier `4848585` [service composition](management-scope-proof.md) now complemented by `54856b1` + `6c587d0` [native admission/resolver composition](management-composition-proof.md): actual signed synthetic Owner admission precedes public session/workspace scope observation. Nine groups pass, including live publication/disappearance during both filesystem awaits; membership-fact negative fails. Reviewed P2 authority race fixed and rereviewed. | Memory credentials/storage and in-memory HTTP are not operational login, browser or actual paired-remote acceptance. Resolver remains outside package/registration; no production write operation is enabled. Canonical path is an observation, not a filesystem lease; client identifiers remain selectors, not authentication. |
| Native Skills policy/catalog invalidation | `a1c372b`: actual filesystem provider/watch and registry over disposable roots; complete snapshots, independent invocation flags, external edit/rename/delete and awaited disposal/catalog removal. | Integrate with actual Manager operations and applicable client/transport proof; no installed Skill store or watcher-handle instrumentation claim. |
| Official MCP lifecycle | `1d2979e` with report correction `e28fe6a`: [bounded official client/ToolRuntime lifecycle](management-mcp-proof.md), real stdio handshake, call/error/deadline/cancellation and awaited tool removal/owned child closure. Green and result-corruption negative independently reproduced; model-selected Standards/Spec review completed. | Production Manager composition, authenticated carrier, per-agent namespace isolation, reconnect/HMR and actual remote acceptance remain unproved. Caller cancellation does not prove server-side work rollback. Merged as `19277ef`; exact-host green lifecycle and baseline regressions (45/45 plus classifier 166/166) pass after merge. Worktree-only regression failure was a missing local Cordis dependency, not reproduced in integration. |
| Scoped paired-remote request | `0b058c3` merged as `260b52e`: [one remote/native/scoped request](management-scoped-remote-proof.md) composes the installed gate/rewrite/proxy, native BrowserAuth/exact Fetch and real resolver before an inert operation. Parent reproduced five groups and the missing-membership control; static Standards/Spec review found no actionable defects within this bounded slice. Missing/revoked pairing and invalid inner cookies deny before scope/operation; wrong membership/canonical paths deny without operation. | Explicit memory HTTP, synthetic credentials/pairing/storage and disposable projects are not mounted browser/service acceptance. Inner response-close cancellation is not outer disconnect propagation. No production Manager CRUD, operational InnerAuth or Approval provenance is enabled. |
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

## Native client composition increment and next boundary

`fc96830`: [mounted native Connection proof](management-mounted-transport-proof.md) now connects
actual Settings/ReactDOM clicks through unchanged public `installConnection(ctx, options)` and its
native RPC serializer/correlation parser to actual BrowserAuth/exactFetch admission. Only the physical
`options.transport.fetch` is a memory carrier; no `transport.rpc` replacement is supplied. The fixture
endpoint explicitly validates and returns RPC envelopes, rather than pretending ordinary Manager JSON
is the native protocol. It is not the native host genericFetch dispatcher.

Parent reproduced the positive five groups on installed 0.2.1-rc.2 / Electron Node 24.21.0: two inert
operations, four requests, statuses `[200, 401, 401, 200]`. Missing/tampered cookies render failure and
perform no extra operation. Both unchanged DOM expectations reject result corruption (`Count: 99`)
and wrong response correlation (`Operation failed`). The final runner also requires completed JSON,
counts, statuses and native client fingerprint after UI and host disposal.

The physical increment `5e4ce69` + DNS-control correction `bbc33da` now supplies
[real local/remote HTTP and scope composition](management-physical-carrier-proof.md): two exported
public WebServer plugins bind disposable loopback port-zero listeners; actual installed remote
routes/proxy forward real HTTP into native BrowserAuth/exactFetch and the real scope resolver.
The same actual mounted Settings/native RPC action renders both local and remote results. The
remote document base is an explicit fixture, not production remote boot installation. Pairing/auth
readiness, credentials and storage remain synthetic. No private handler invocation or response
interception supplies this physical path.

Parent reproduced two operations, seven click statuses `[200, 200, 401, 403, 403, 401, 404]`, and
both listener closures. Result/correlation/membership controls reject at unchanged DOM expectations.
Static review found a vacuous DNS negative (invalid call signature); the committed correction uses
a valid callback and guard-specific error. No actionable findings remained on the final static review.

The [carrier/service-effects join](management-carrier-effects-proof.md), reviewed at `94238ff`,
adds four actual mounted actions over the same local/remote physical path: disable/restore native
Skills invocation policy through watched complete warm catalogs, and two official MCP client/tool
lifecycles. Parent independently reproduced four effects, two skill writes, two tool calls, four owned
children closed, three native watchers closed, two listeners closed and zero cleanup errors.
The unchanged DOM result and watcher controls both fail as intended, with clean post-cleanup records.

Independent Standards and Spec/security rereads found no remaining actionable findings in the final
three-file artifact. An initial async-lifetime defect was corrected: request-linked action cancellation,
awaited startup/call/disposal, owned-child kill fallback and draining actual effect tasks precede global
teardown. The report distinguishes these from generic timeout checks. A separate acceptance audit
found no additional original substantive T02A feasibility prerequisite after this join. The whitespace-only
runner follow-up `211f6ca` merged as `80b4a43`; parent reran the joined proof and all six isolated
management runners successfully after merge. Portable/package regressions passed 51/51 plus classifier
166/166, with `git diff --check` clean. Combined temporary feasibility acceptance is therefore satisfied.

All joins retain explicit jsdom/presentation/locale/session/physical-fetch adapters, synthetic
pairing/credentials/storage and disposable files/stdio peers. ExactFetch uses the public owner-only
route contract and correlated RPC fixtures, not the native generic dispatcher. Real browser/TLS,
operational auth discovery, outer-disconnect cancellation, production CRUD, T03 product visuals and
final live rollout remain later non-claims. T03 may start after native #4 resolution is recorded;
Command Approval and all operational permission gates remain unchanged.

## Integration rules

- Implementers use separate branches/worktrees and commit owned files before reporting. Shared specification, dependency map and CHANGELOG are integration-owned.
- Each implementer merges the current integration tip before reporting; integration happens through a merger, followed by applicable tests and Standards/Spec review.
- Use the approved model family only, selecting Terra for extraction, Luna for small isolated changes, Astra for medium implementation/Standards and Sol for architecture/security/sensitive Spec. Workflow currently exposes provider/model but no reasoning-effort override; do not claim custom effort. The recovered evidence received two static reviews via ordinary subagents, whose model was not explicitly selected; do not count those as compliance with the model-routing rule. Earlier limit-stalled workflows were stopped and their files preserved rather than automatically restarted.
- Preserve historical untracked prototype files. Never revive profile config-editor ownership persistence or import vendored reference runtimes into the accepted build.
- Unsupported contracts require a concrete Owner decision, not fabricated passing tests. Do not waive native dependency edges or close a ticket for dispatching agents, writing reports or passing an incomplete fixture.
- Installed-state changes, credentials, real provider/judgment consumption, restart, Cutover and reference removal remain separate execution-point permissions.
