# Managers scope revision — accepted decisions and source comparison

Date: 2026-10-25. Status: Owner-approved architecture and delivery amendments, reflected in the manager specification. The Owner approved the end-to-end-first subscription delivery approach after approving [ADR 0009](./adr/0009-allow-unknown-command-approval-origin.md) (interim Approval origin) and [ADR 0010](./adr/0010-allow-mcp-sdk-through-public-dsh-apis.md) (MCP runtime choice). This document records source comparison and the accepted changes; it does not authorize implementation, operational access or GitHub publication. Ticket reconciliation remains to be performed.

## Goal and boundaries

Deliver the accepted Skills, MCP, Hooks, subscriptions and Auto workflows inside Majed, without requiring separate external reference plugins. Use DSH built-ins and public extension contracts. The additional repositories are implementation examples, not an automatic expansion to the union of their features.

Retain existing first-release requirements and explicit Owner deferrals. D06–D10 / #42–#46 remain untouched. Existing Skills catalog code is assessed against the accepted exclusion; its existence does not amend scope. OpenCode Zen is currently an additional implementation reference, not a newly approved provider commitment. Operational state access, login, host restart, live consumption, Cutover and reference removal retain their execution-point approval requirements.

## Findings that change the plan

| Area | Evidence | Implication |
| --- | --- | --- |
| Subscriptions | Local subscription/auth services explicitly use synthetic credentials and an in-memory account store. `applySubscriptions` exposes a service factory rather than composing production provider adapters; the root plugin does not activate these services. Local Copilot auth rejects device authorization and manufactures a browser URL, while the pinned reference supplies GitHub device authorization. | Retain reusable observable contracts/tests, then integrate and compose real source-backed services. Replace the Copilot protocol deviation rather than deferring an available upstream mechanism. Synthetic fixtures do not deliver account login or provider parity. |
| Hooks | Existing parity targets Pouch `@moon16u/dsh-hooks`; PeterBon is a distinct implementation with a different event/configuration model. PeterBon implements `run`/`notify` dispatch and a shell runner. | Compare and adapt execution techniques rather than treating the two plugins as interchangeable. PeterBon notification events alone do not establish the accepted seven-event blocking/context semantics. |
| Approval origin | The source assessment supports Owner admission but lacks authenticated original locality at the inspected proxy seam. | ADR 0009 allows `unknown`; invalid authentication or exact-content Approval still rejects. The revised T02E needs evidence and remains a prerequisite for T10. |
| MCP | Majed already integrates the native client with serialized lifecycle replacement. Hyqhyq3 adds OAuth/custom transport/broker code; alone-tree adds SDK-based session instances/loading. | Preserve implemented native behavior and evaluate reusable protocol modules/public APIs. ADR 0010 approves an SDK alternative where needed; compatibility still requires exact-host proof. |
| Skills | Majed already contains a Micheng-derived core and native facade. The facade emits `commands/change` after mutations without wiring the reference overlay provider/invalidation controls. Alone-tree demonstrates recursive providers/watch invalidation, but hides Skills by editing frontmatter; its MCP startup can take over native configuration. | Complete end-to-end native model/slash visibility propagation. Preserve private policy and native precedence rather than copying source mutation or takeover. T02A already records bounded temporary feasibility; that is separate from live Manager parity. |
| Licenses | Local Skills provenance identifies Apache-2.0 source, contradicting the supplied blanket MIT summary. | Check each selected source pin, dependencies and notices before copying. Preserve existing Apache attribution and applicable notices. |

These are source-level findings, not live compatibility results. The existing Parity list is a baseline inventory, not a current implementation percentage; reconcile each row with actual code and evidence before calling it missing or complete.

## Integration approach

Reuse mature source behavior behind Majed's ownership, admission and persistence boundaries. Keep one owner for provider registration, account refresh and each MCP/Hook runtime. Select source commits and carry attribution/tests before integrating; repository HEAD or a README claim is not a final pin. Existing approved pins stay unchanged until deliberately reviewed.

For subscriptions, the Owner-approved delivery order replaces the proposed store → PKCE → adapters → pool → catalog → final wiring sequence. Those components belong inside complete workflows rather than disconnected milestones:

1. Complete one provider from the accepted provider set end to end: management Settings, real authentication/refresh protocol, protected durable storage, restart reload, native catalog and direct model dispatch. Include production service composition in this first workflow; controlled transports and temporary storage provide fixture evidence without live account access.
2. Add each remaining provider as an end-to-end workflow, preserving its actual authorization mechanism, refresh, catalog and direct dispatch. Copilot must preserve the reference's GitHub device authorization rather than simulate browser/manual success. Reuse the reviewed common store/auth foundations without making every provider a prerequisite for the first usable route.
3. Complete multi-account selection/pooling, health, quota and rate-limit behavior through those real services, preserving direct/pinned routes and isolation.
4. Integrate explicit deterministic Auto enrollment and bounded dispatch with the same account/catalog/runtime composition, retaining all accepted retry, partial-output and native authority contracts.

Preserve the full accepted provider/media/search parity obligations and separately opted-in Smart/child/advisory requirements. This order sets workflow milestones, not a final ticket count or revised blocking graph; split a workflow into bounded tracer bullets only when each demonstrates an observable result. Reordering work does not defer required behavior or permit implicit Auto enrollment. Keep Skills catalog cleanup independently reviewable.

For each required capability, record the source behavior, Majed's additional requirements, the chosen public integration contract and an observable acceptance result. Distinguish:

- **Implemented:** production composition exists; list separate fixture and live evidence.
- **Missing:** required behavior is absent or only available through synthetic fixtures.
- **Unverified:** an implementation candidate exists but the exact host/runtime path lacks proof.
- **Unsupported at an identified seam:** cite the attempted public contract, host version and tested or inspected limitation; evaluate source alternatives.
- **Owner-deferred:** cite the explicit disposition; missing code alone is not a deferral.

## Approved MCP architectural amendment — 2026-10-25

Keep the native DSH MCP client as the default implementation. Allow a Majed-owned official MCP SDK client, integrated through public DSH tool/session APIs, for accepted capabilities that the native client cannot provide. Adapt protocol code from the references as needed while keeping Majed's private configuration, authenticated management and lifecycle ownership. Do not copy automatic profile takeover or require either reference plugin at runtime. On-demand exposure and per-tool controls retain their separate scope dispositions.

The Owner approved this relaxation of the native-client-only requirement in ADR 0010. It preserves the public-extensions-only boundary. Prove the alternative against the exact host before selecting it. An unavailable SDK/public-registry path remains an unresolved implementation question rather than a silent scope reduction. The subscription delivery order was separately approved; neither decision marks a runtime path implemented.

## Acceptance boundaries for the revision

Retain the existing high-level management/runtime seams and use real services with temporary home/project storage and controlled provider/MCP transports. Include durable restart behavior, account/token refresh races, native catalog/dispatch composition and native Skill visibility propagation. Synthetic account fixtures remain valid test inputs; production code must not manufacture login success.

For Hooks, verify actual admitted local and paired-remote requests, exact-content Approval and bounded event execution. Both paths may truthfully audit origin as `unknown`. Failed authentication, nonce expiry/replay, content changes and scope substitution still reject. Verify all accepted blocking/context behavior separately from observational notification examples.

For MCP, exercise stdio/HTTP handshake, tool calls, OAuth where selected, disconnect/reconnect, disposal, tool-list refresh and isolation through the selected public runtime. The SDK alternative must preserve native permission ownership, cancellation and normalized tool results.

Desktop-after-restart and paired-remote workflow evidence remain separate from fixture results, with separately authorized live provider calls. No reference removal or parity claim follows solely from passing unit tests or importing upstream source.

## Source entry points

- Local implementation: `modules/subscriptions/{index,auth,account}.js`, `modules/auth/`, `modules/catalog/`, `modules/skills/{index,native}.js`, `modules/mcp/index.js`.
- Existing source/test pins and notices: [source provenance](./research/reference-source-provenance.md), [artifact manifest](./reference-artifacts.json), [Skills provenance](../modules/skills/PROVENANCE.md), [notices](../THIRD_PARTY_NOTICES.md).
- [V1ki subscriptions source](https://github.com/V1ki/dsh-plugin-subscriptions/tree/9930c5ee5e3fa239db9031f47a0f6f30f7ffc443/src) and [OpenCode example](https://github.com/FishBottle7/opencode2dsh).
- Subscription integration targets: [protected store](https://github.com/V1ki/dsh-plugin-subscriptions/blob/9930c5ee5e3fa239db9031f47a0f6f30f7ffc443/src/auth/store.ts), [PKCE](https://github.com/V1ki/dsh-plugin-subscriptions/blob/9930c5ee5e3fa239db9031f47a0f6f30f7ffc443/src/auth/pkce.ts), [OAuth](https://github.com/V1ki/dsh-plugin-subscriptions/blob/9930c5ee5e3fa239db9031f47a0f6f30f7ffc443/src/auth/oauth-flow.ts), [device flow](https://github.com/V1ki/dsh-plugin-subscriptions/blob/9930c5ee5e3fa239db9031f47a0f6f30f7ffc443/src/auth/device-flow.ts).
- [PeterBon dispatch](https://github.com/PeterBon/dsh-hooks/blob/main/src/index.ts) and [runner](https://github.com/PeterBon/dsh-hooks/blob/main/src/runner.ts).
- [Hyqhyq3 runtime](https://github.com/hyqhyq3/dsh-mcp-manager/blob/main/lib/index.js) and [manifest](https://github.com/hyqhyq3/dsh-mcp-manager/blob/main/package.json).
- [Alone-tree runtime](https://github.com/alone-tree/dsh-skill-mcp-manager/blob/main/lib/index.js), [Skills implementation](https://github.com/alone-tree/dsh-skill-mcp-manager/blob/main/lib/skill.js) and [manifest](https://github.com/alone-tree/dsh-skill-mcp-manager/blob/main/package.json).
- [Micheng source](https://github.com/MichengAI/dsh-skills-manager) and [DSH built-ins](https://github.com/deepseek-ai/deepseek-harness/tree/master/packages).
- Existing [T02A acceptance ledger](./research/t02a-acceptance-ledger.md) distinguishes bounded native feasibility from installed-state/live acceptance.

Unpinned links above are discovery references only. Their source must be pinned and checked before implementation; public master does not establish compatibility with the installed host.
