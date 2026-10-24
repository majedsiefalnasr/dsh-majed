# Published Managers, subscriptions and Auto ticket map

## Publication and authority

The Owner approved the expanded specification, testing seams, first-release/deferred scope,
34 execution slices, 10 deferred follow-ups, and their dependency graph on 2026-10-22.
Publication was completed and read back from GitHub on the same date.

- Expanded specification: [#2](https://github.com/majedsiefalnasr/dsh-majed/issues/2).
- Historical Manager-only specification: [#1](https://github.com/majedsiefalnasr/dsh-majed/issues/1), open and unchanged (title, body, state and update timestamp verified).
- All 44 records are native sub-issues of the expanded specification.
- All 90 approved blocker edges are native GitHub blocked-by relationships, not merely draft-ID prose.
- The specification and 34 execution records use `ready-for-agent`. The 10 deferred planning records use `needs-info` until their explicit scoping/Owner gates are resolved; they are not first-release execution promises.
- Exact issue titles, body hashes, labels, open state, parent membership and blocker sets were read back and verified against the publication payloads. This proves publication integrity, not implementation or live compatibility.

Publication approval is not an instruction to implement, access account stores, import credentials,
change installed plugins, restart the host, consume provider/judgment capacity, perform Cutover,
remove Reference plugins or publish releases. Those retain their separate approval gates.
No implementation, host/account operation or runtime/live test was performed during publication.

## Owner-approved admission/provenance amendment — 2026-10-23

The Owner approved [ADR 0008](./adr/0008-separate-management-admission-from-command-approval-provenance.md): narrow T02A / #4 to its original management proof obligations and move trusted Command hook Approval provenance to required T02E / [#47](https://github.com/majedsiefalnasr/dsh-majed/issues/47). Native publication was read back and verified: 45 sub-issues (35 execution, 10 deferred), 92 blocker edges. The only new edges are T02E blocked by T01 / #3 and T10 / #15 blocked by T02E / #47; its existing T09 / #14 blocker remains. All original 90 edges are unchanged. Parent #1/#2 bodies, titles and states are unchanged; no issue was closed by the amendment.

T03/T08/D03 retain their existing T02A dependencies. At amendment publication T02A remained open, requiring actual client/Settings, local/remote Owner admission, authenticated session/project scope, Skills invalidation and official MCP lifecycle. Combined temporary feasibility acceptance has since passed at `80b4a43`; see the [acceptance ledger](research/t02a-acceptance-ledger.md). Native #4 resolution is recorded after the evidence commit. T02E remains open with the unsupported provenance result; challenge issuance, Approval persistence and command run/test/event paths remain unavailable server-side. Editing compatible Hook stores still requires separate single-owner operational Cutover permission. T28M/T29 retain T10 and final local/remote command evidence. No runtime, live capability, authentication waiver or installed-state authorization is implied.

The original publication totals above are historical; the following table is the amended current graph.

## Published records

| Plan ID | GitHub issue | Triage label | Native blocked by |
| --- | --- | --- | --- |
| T01 | [#3](https://github.com/majedsiefalnasr/dsh-majed/issues/3) — Isolate the accepted baseline from the prototype | `ready-for-agent` | None |
| T02A | [#4](https://github.com/majedsiefalnasr/dsh-majed/issues/4) — Prove authenticated management admission | `ready-for-agent` | [#3](https://github.com/majedsiefalnasr/dsh-majed/issues/3) |
| T02B | [#5](https://github.com/majedsiefalnasr/dsh-majed/issues/5) — Prove native Auto metadata and coherent preparation | `ready-for-agent` | [#3](https://github.com/majedsiefalnasr/dsh-majed/issues/3) |
| T02C | [#6](https://github.com/majedsiefalnasr/dsh-majed/issues/6) — Prove one cross-layer retry budget | `ready-for-agent` | [#3](https://github.com/majedsiefalnasr/dsh-majed/issues/3) |
| T02D | [#7](https://github.com/majedsiefalnasr/dsh-majed/issues/7) — Prove supported child pre-start selection | `ready-for-agent` | [#3](https://github.com/majedsiefalnasr/dsh-majed/issues/3) |
| T02E | [#47](https://github.com/majedsiefalnasr/dsh-majed/issues/47) — Prove trusted Command hook Approval provenance | `ready-for-agent` | [#3](https://github.com/majedsiefalnasr/dsh-majed/issues/3) |
| T03 | [#8](https://github.com/majedsiefalnasr/dsh-majed/issues/8) — Establish the authenticated Settings slice and visual contract | `ready-for-agent` | [#4](https://github.com/majedsiefalnasr/dsh-majed/issues/4) |
| T04 | [#9](https://github.com/majedsiefalnasr/dsh-majed/issues/9) — Pin source, licenses and the granular Parity list | `ready-for-agent` | [#3](https://github.com/majedsiefalnasr/dsh-majed/issues/3) |
| T05 | [#10](https://github.com/majedsiefalnasr/dsh-majed/issues/10) — Resolve and control native Skills effectively | `ready-for-agent` | [#8](https://github.com/majedsiefalnasr/dsh-majed/issues/8), [#9](https://github.com/majedsiefalnasr/dsh-majed/issues/9) |
| T06 | [#11](https://github.com/majedsiefalnasr/dsh-majed/issues/11) — Create and reversibly remove managed Skills | `ready-for-agent` | [#10](https://github.com/majedsiefalnasr/dsh-majed/issues/10) |
| T07 | [#12](https://github.com/majedsiefalnasr/dsh-majed/issues/12) — Save private MCP definitions safely | `ready-for-agent` | [#8](https://github.com/majedsiefalnasr/dsh-majed/issues/8), [#9](https://github.com/majedsiefalnasr/dsh-majed/issues/9) |
| T08 | [#13](https://github.com/majedsiefalnasr/dsh-majed/issues/13) — Run and observe isolated MCP connections | `ready-for-agent` | [#4](https://github.com/majedsiefalnasr/dsh-majed/issues/4), [#12](https://github.com/majedsiefalnasr/dsh-majed/issues/12) |
| T09 | [#14](https://github.com/majedsiefalnasr/dsh-majed/issues/14) — Edit compatible Command hook definitions inertly | `ready-for-agent` | [#8](https://github.com/majedsiefalnasr/dsh-majed/issues/8), [#9](https://github.com/majedsiefalnasr/dsh-majed/issues/9) |
| T10 | [#15](https://github.com/majedsiefalnasr/dsh-majed/issues/15) — Approve and execute exact Command hooks locally and remotely | `ready-for-agent` | [#14](https://github.com/majedsiefalnasr/dsh-majed/issues/14), [#47](https://github.com/majedsiefalnasr/dsh-majed/issues/47) |
| T11 | [#16](https://github.com/majedsiefalnasr/dsh-majed/issues/16) — Apply Tool rules without bypassing native guards | `ready-for-agent` | [#8](https://github.com/majedsiefalnasr/dsh-majed/issues/8), [#9](https://github.com/majedsiefalnasr/dsh-majed/issues/9) |
| T12 | [#17](https://github.com/majedsiefalnasr/dsh-majed/issues/17) — Preserve direct subscription routing and stream behavior | `ready-for-agent` | [#8](https://github.com/majedsiefalnasr/dsh-majed/issues/8), [#9](https://github.com/majedsiefalnasr/dsh-majed/issues/9) |
| T13 | [#18](https://github.com/majedsiefalnasr/dsh-majed/issues/18) — Integrate Codex and Claude account authentication | `ready-for-agent` | [#17](https://github.com/majedsiefalnasr/dsh-majed/issues/17) |
| T14 | [#19](https://github.com/majedsiefalnasr/dsh-majed/issues/19) — Integrate Grok, Copilot and Antigravity authentication | `ready-for-agent` | [#17](https://github.com/majedsiefalnasr/dsh-majed/issues/17) |
| T15 | [#20](https://github.com/majedsiefalnasr/dsh-majed/issues/20) — Preserve account/model catalogs and preferences | `ready-for-agent` | [#17](https://github.com/majedsiefalnasr/dsh-majed/issues/17) |
| T16 | [#21](https://github.com/majedsiefalnasr/dsh-majed/issues/21) — Preserve usage and explicit quota operations | `ready-for-agent` | [#17](https://github.com/majedsiefalnasr/dsh-majed/issues/17), [#20](https://github.com/majedsiefalnasr/dsh-majed/issues/20) |
| T17 | [#22](https://github.com/majedsiefalnasr/dsh-majed/issues/22) — Preserve proxy and provider operational settings | `ready-for-agent` | [#17](https://github.com/majedsiefalnasr/dsh-majed/issues/17) |
| T18 | [#23](https://github.com/majedsiefalnasr/dsh-majed/issues/23) — Preserve search, attachments and tool-policy history | `ready-for-agent` | [#17](https://github.com/majedsiefalnasr/dsh-majed/issues/17), [#20](https://github.com/majedsiefalnasr/dsh-majed/issues/20) |
| T19 | [#24](https://github.com/majedsiefalnasr/dsh-majed/issues/24) — Preserve image generation and editing | `ready-for-agent` | [#17](https://github.com/majedsiefalnasr/dsh-majed/issues/17), [#23](https://github.com/majedsiefalnasr/dsh-majed/issues/23) |
| T20 | [#25](https://github.com/majedsiefalnasr/dsh-majed/issues/25) — Preserve video submission, polling and rendering | `ready-for-agent` | [#17](https://github.com/majedsiefalnasr/dsh-majed/issues/17), [#23](https://github.com/majedsiefalnasr/dsh-majed/issues/23) |
| T21 | [#26](https://github.com/majedsiefalnasr/dsh-majed/issues/26) — Enroll explicit Auto candidates and session policy | `ready-for-agent` | [#8](https://github.com/majedsiefalnasr/dsh-majed/issues/8), [#20](https://github.com/majedsiefalnasr/dsh-majed/issues/20) |
| T22 | [#27](https://github.com/majedsiefalnasr/dsh-majed/issues/27) — Route deterministic Auto through the native picker | `ready-for-agent` | [#5](https://github.com/majedsiefalnasr/dsh-majed/issues/5), [#17](https://github.com/majedsiefalnasr/dsh-majed/issues/17), [#26](https://github.com/majedsiefalnasr/dsh-majed/issues/26) |
| T23 | [#28](https://github.com/majedsiefalnasr/dsh-majed/issues/28) — Enforce one finite Auto budget across all retry layers | `ready-for-agent` | [#6](https://github.com/majedsiefalnasr/dsh-majed/issues/6), [#27](https://github.com/majedsiefalnasr/dsh-majed/issues/27) |
| T24 | [#29](https://github.com/majedsiefalnasr/dsh-majed/issues/29) — Configure a separate protocol-explicit judgment service | `ready-for-agent` | [#8](https://github.com/majedsiefalnasr/dsh-majed/issues/8) |
| T25 | [#30](https://github.com/majedsiefalnasr/dsh-majed/issues/30) — Bound Smart selection and record opt-in Shadow decisions | `ready-for-agent` | [#26](https://github.com/majedsiefalnasr/dsh-majed/issues/26), [#28](https://github.com/majedsiefalnasr/dsh-majed/issues/28), [#29](https://github.com/majedsiefalnasr/dsh-majed/issues/29) |
| T26 | [#31](https://github.com/majedsiefalnasr/dsh-majed/issues/31) — Route supported local children before admission | `ready-for-agent` | [#7](https://github.com/majedsiefalnasr/dsh-majed/issues/7), [#28](https://github.com/majedsiefalnasr/dsh-majed/issues/28), [#30](https://github.com/majedsiefalnasr/dsh-majed/issues/30) |
| T27 | [#32](https://github.com/majedsiefalnasr/dsh-majed/issues/32) — Advise on authorized Skills and MCP tools only | `ready-for-agent` | [#10](https://github.com/majedsiefalnasr/dsh-majed/issues/10), [#13](https://github.com/majedsiefalnasr/dsh-majed/issues/13), [#16](https://github.com/majedsiefalnasr/dsh-majed/issues/16), [#29](https://github.com/majedsiefalnasr/dsh-majed/issues/29), [#30](https://github.com/majedsiefalnasr/dsh-majed/issues/30) |
| T28M | [#33](https://github.com/majedsiefalnasr/dsh-majed/issues/33) — Prepare Manager cutover and rollback | `ready-for-agent` | [#9](https://github.com/majedsiefalnasr/dsh-majed/issues/9), [#11](https://github.com/majedsiefalnasr/dsh-majed/issues/11), [#13](https://github.com/majedsiefalnasr/dsh-majed/issues/13), [#15](https://github.com/majedsiefalnasr/dsh-majed/issues/15), [#16](https://github.com/majedsiefalnasr/dsh-majed/issues/16) |
| T28S | [#34](https://github.com/majedsiefalnasr/dsh-majed/issues/34) — Prepare subscription ownership and compatible rollback | `ready-for-agent` | [#9](https://github.com/majedsiefalnasr/dsh-majed/issues/9), [#18](https://github.com/majedsiefalnasr/dsh-majed/issues/18), [#19](https://github.com/majedsiefalnasr/dsh-majed/issues/19), [#20](https://github.com/majedsiefalnasr/dsh-majed/issues/20), [#21](https://github.com/majedsiefalnasr/dsh-majed/issues/21), [#22](https://github.com/majedsiefalnasr/dsh-majed/issues/22), [#23](https://github.com/majedsiefalnasr/dsh-majed/issues/23), [#24](https://github.com/majedsiefalnasr/dsh-majed/issues/24), [#25](https://github.com/majedsiefalnasr/dsh-majed/issues/25) |
| T29 | [#35](https://github.com/majedsiefalnasr/dsh-majed/issues/35) — Verify Managers after approved local and remote cutover | `ready-for-agent` | [#33](https://github.com/majedsiefalnasr/dsh-majed/issues/33) |
| T30 | [#36](https://github.com/majedsiefalnasr/dsh-majed/issues/36) — Verify subscriptions/Auto and separately gate Smart activation | `ready-for-agent` | [#28](https://github.com/majedsiefalnasr/dsh-majed/issues/28), [#30](https://github.com/majedsiefalnasr/dsh-majed/issues/30), [#31](https://github.com/majedsiefalnasr/dsh-majed/issues/31), [#32](https://github.com/majedsiefalnasr/dsh-majed/issues/32), [#34](https://github.com/majedsiefalnasr/dsh-majed/issues/34) |
| D01 | [#37](https://github.com/majedsiefalnasr/dsh-majed/issues/37) — Skills repository and catalog installation | `needs-info` | [#9](https://github.com/majedsiefalnasr/dsh-majed/issues/9), [#11](https://github.com/majedsiefalnasr/dsh-majed/issues/11) |
| D02 | [#38](https://github.com/majedsiefalnasr/dsh-majed/issues/38) — Skills uploads, categories and extended source surfaces | `needs-info` | [#9](https://github.com/majedsiefalnasr/dsh-majed/issues/9), [#11](https://github.com/majedsiefalnasr/dsh-majed/issues/11) |
| D03 | [#39](https://github.com/majedsiefalnasr/dsh-majed/issues/39) — Plugin self-update integration | `needs-info` | [#4](https://github.com/majedsiefalnasr/dsh-majed/issues/4), [#9](https://github.com/majedsiefalnasr/dsh-majed/issues/9) |
| D04 | [#40](https://github.com/majedsiefalnasr/dsh-majed/issues/40) — MCP per-tool restrictions | `needs-info` | [#13](https://github.com/majedsiefalnasr/dsh-majed/issues/13), [#16](https://github.com/majedsiefalnasr/dsh-majed/issues/16) |
| D05 | [#41](https://github.com/majedsiefalnasr/dsh-majed/issues/41) — MCP import/export and legacy ingest/handoff alternatives | `needs-info` | [#12](https://github.com/majedsiefalnasr/dsh-majed/issues/12), [#13](https://github.com/majedsiefalnasr/dsh-majed/issues/13) |
| D06 | [#42](https://github.com/majedsiefalnasr/dsh-majed/issues/42) — Observe-only lifecycle extensions | `needs-info` | [#15](https://github.com/majedsiefalnasr/dsh-majed/issues/15) |
| D07 | [#43](https://github.com/majedsiefalnasr/dsh-majed/issues/43) — Additional child backends | `needs-info` | [#7](https://github.com/majedsiefalnasr/dsh-majed/issues/7), [#31](https://github.com/majedsiefalnasr/dsh-majed/issues/31) |
| D08 | [#44](https://github.com/majedsiefalnasr/dsh-majed/issues/44) — Dynamic capability exposure reduction | `needs-info` | [#32](https://github.com/majedsiefalnasr/dsh-majed/issues/32) |
| D09 | [#45](https://github.com/majedsiefalnasr/dsh-majed/issues/45) — Advanced Auto scheduling and broader Smart rollout | `needs-info` | [#28](https://github.com/majedsiefalnasr/dsh-majed/issues/28), [#30](https://github.com/majedsiefalnasr/dsh-majed/issues/30), [#36](https://github.com/majedsiefalnasr/dsh-majed/issues/36) |
| D10 | [#46](https://github.com/majedsiefalnasr/dsh-majed/issues/46) — Reference removal and stable promotion | `needs-info` | [#35](https://github.com/majedsiefalnasr/dsh-majed/issues/35), [#36](https://github.com/majedsiefalnasr/dsh-majed/issues/36) |

## Execution frontier and gate interpretation

Status update, 2026-10-22: T01 / #3 is closed at its [local automated baseline boundary](<BASELINE.md#L43-L49>).
The preceding publication ledger remains a record of publication, not a claim that every issue is still open.
T02A / #4 has [partial native signed-cookie admission evidence](<research/management-approval-provenance.md#native-signed-cookie-admission-characterization--2026-10-23>), in addition to the older preparatory dispatch/registry probe, but is not complete. The actual native authentication algorithm passes isolated memory-credential/HTTP-stream fixtures. Commit `a1c372b` adds [native filesystem Skills watcher evidence](research/management-approval-provenance.md#native-filesystem-skills-watcher-characterization--2026-10-23), with complete snapshots and independent invocation-policy transitions. Recovered [Settings bundle behavior](research/management-settings-proof.md) and [session/workspace service composition](research/management-scope-proof.md) add bounded partial evidence with explicit doubles and negative controls. The [bounded official MCP lifecycle proof](research/management-mcp-proof.md) adds actual registered-tool execution, error/deadline/cancellation and awaited disposal against a controlled stdio fixture with a result-corruption control. The [native admission/scope composition](research/management-composition-proof.md) now connects actual Owner admission and read-only canonical project resolution, with a reviewed authority-race fix. That historical checkpoint is superseded by the [combined acceptance ledger](research/t02a-acceptance-ledger.md): mounted native client, physical local/remote HTTP, authenticated scope and native Skills/official MCP effects have since been joined in controlled temporary composition. Final integrated acceptance recording remains pending; production CRUD, per-agent isolation and live rollout are later non-claims, not added circular prerequisites for T03.
Under ADR 0008, trusted original local/remote Approval provenance now belongs to T02E / #47;
it remains unsupported at the inspected exact Fetch seam and pauses command Approval/execution only.
T03 still waits for completed T02A management proof. T02B–T02D and T04 retain their own gates.
No installation, live verification or release is implied by T01 closure.
T02B / #5 has [partial native Auto seam evidence](<research/auto-native-seams.md>): synthetic exact-host
LLM/Agent/catalog checks and the unmodified native picker bundle pass. Scoped middleware also proves
concrete interpolation/header/assistant attribution, but already evaluated prompt providers can retain
Auto; full contributor coherence and mounted client/RPC acceptance remain unresolved. It stays open;
no dependent gate is waived. A [pre-provider investigation](research/auto-pre-provider-seam.md) and
real-service ordering characterization rule out prepended assembly and awaited inbox notifications as
solutions on this host. The explicit required-order probe fails; the unsupported seam needs Owner review
before any scope change, and no operational or host-patching permission is implied.
T02C / #6 has [partial retry-budget evidence](<research/retry-budget-seams.md>): a cooperative
synthetic ledger survives native retry/re-preparation, and public cancellation prevents replay after
partial output. Actual provider-internal sends, refresh cancellation and real recovery accounting
remain unproved. The issue stays open and failover activation is paused; this does not waive its gate.
T02D / #7 has [partial local child evidence](<research/child-routing-seams.md>): actual native
spawn/fork services with a synthetic adapter preserve admission, depth, capacity and settlement.
Direct caller route inputs do not prove model-facing tool policy/preflight, preset composition,
real permission enforcement or universal interception. It stays open; no dependent gate is waived.
The T02B [upstream capability request](<research/auto-upstream-request-draft.md>) is prepared but
**unpublished**; Owner authorization is required before posting.
T04 / #9 now has an inactive [pinned reference baseline](<reference-artifacts.json>),
[source/license review](<research/reference-source-provenance.md>),
[granular Parity ledger](<PARITY.md>) and [validation record](<research/reference-baseline-validation.md>).
T04 / #9 is closed (live GitHub state rechecked on 2026-10-23); this is inactive source/mapping acceptance, not runtime parity. Owner dispositions accepted on 2026-10-22 resolve T04's mapping gap: OPS-03 excludes process-global
network timing changes (T17 owns a supported scoped alternative/deviation); SK-17 local-directory
import/browse is explicitly deferred to D02; HK-04 uses manual project/user re-addition with fresh
Approval under T09/T28M. T04's inactive evidence acceptance can now be finalized independently of
runtime/live parity. T02E's unsupported provenance gate and all other dependent gates remain intact.

### Integration execution snapshot — 2026-10-23

The `implement-spec` integration branch is `feat/managers`, baseline `a1c372b`. Remaining independent T02A acceptance slices run in separate worktrees/branches: `feat/t02a-scope` (read-only native session/workspace relationship), `feat/t02a-mcp` (official MCP client lifecycle), and `feat/t02a-settings` (actual Settings client contract). Each must return committed evidence and explicit gaps before merge/review; none is a completed ticket on dispatch. Implementers use the Owner-approved `codex/gpt-6-astra` model through workflow; that tool exposes no reasoning-effort override, so effort is the adapter/model default, not an asserted custom setting.

Direct dependency records for T02A–T02E each reference closed T01 / #3. The GitHub aggregate open-blocker count for #4–#7 still reported one on this read; readiness is verified from the actual dependency issue states rather than treating that stale aggregate as a new blocker or deleting approved edges. T03 / #8 still has the genuinely open T02A blocker. Unsupported T02B/T02E findings are not silently waived. Existing historical untracked prototypes remain untouched.

T01 is the only execution record with no blockers. After T01 completes, T02A–T02E and T04
can proceed independently; T03 depends only on T02A. A `ready-for-agent` label is not proof
that prerequisites are closed or a separate operational action is authorized.

Manager readiness/live acceptance (T28M/T29) and subscription readiness/live acceptance
(T28S/T30) are independent. T30's native edges gate final combined completion; separately
approved subscription/deterministic Auto evidence sessions may start after their own
prerequisites without waiting for T27 advisory implementation. T26 shares the completed
optional Smart contract but never requires Smart activation.

D10 also has a dynamic gate: any deferred capability still required by the Owner must be
implemented or explicitly accepted as deferred before affected Reference removal. Native
edges capture the fixed graph, not permission to waive this gate.

## Local authority

- [Expanded specification](./managers-spec.md).
- [Approved ticket plan and detailed acceptance criteria](./managers-tickets-draft.md).
- [Accepted Auto design rationale](./research/auto-mode-proposal.md).
- [Release process](./RELEASING.md).

No issue was closed, no execution was started, and no release/tag/commit/push was created
by the original publication step. Subsequent execution status is recorded above. Existing untracked prototype work and installed Reference packages
remain untouched.
