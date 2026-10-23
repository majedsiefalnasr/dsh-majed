# Managers, integrated subscriptions and Auto — draft execution tickets

**Status: APPROVED FOR PUBLICATION — NOT AN IMPLEMENTATION OR OPERATIONAL AUTHORIZATION.**

On 2026-10-22, the Owner approved **34 execution slices**, **10 deferred follow-ups**, their blocking edges, the expanded first-release/deferred scope and testing seams, and publication of the expanded specification and tickets to GitHub. Independent feasibility and rollback-readiness slices avoid false dependencies. T/D IDs remain stable planning references, not GitHub issue numbers; the publication ledger maps them to actual issues. This approval authorizes documentation and issue publication only, not implementation, operational account access, installed-state changes or Cutover.

On 2026-10-23 the Owner approved the narrow ADR 0008 amendment: retain T02A as the management admission proof, add independent required T02E for trusted Command hook Approval provenance, and make T10 wait for T09 plus T02E. The amended plan has 35 execution slices and 10 deferred records. All other dependencies, operational consent and final acceptance requirements remain unchanged; no issue is complete merely because its scope was separated.

## Authority, evidence and release boundaries

Read together: [AGENTS.md](../AGENTS.md), [GLOSSARY.md](../GLOSSARY.md), [manager specification](./managers-spec.md), [ADRs 0001–0007](./adr/), and [accepted Auto decisions Q1–Q19](./research/auto-mode-proposal.md). Research inputs are [Pouch](./research/dsh-pouch-plugins.md), [Skills upstream](./research/dsh-skills-manager-upstream.md), [subscription parity and routing](./research/subscriptions-auto-routing.md), and [Jev feasibility](./research/jev-routing-feasibility.md). [Release instructions](./RELEASING.md) remain applicable, with the stronger local-and-remote evidence gate in ADR 0005.

Accepted ADRs/specification and Q1–Q19 take precedence over earlier research recommendations. In particular: private MCP persistence rather than config-editor ownership/profile YAML; native Owner admission rather than an origin-only gate; native basic Skills rather than shipping the stale vendored runtime; deterministic priority Auto rather than quota-driven exclusion or judge-owned retries. This draft does not silently amend the manager specification into an approved expanded implementation specification.

Research identifies source-level extension candidates, **not proven exact-host runtime/API feasibility**. Tickets T02A–T02E are independent stop-and-report gates. Unsupported native Auto capability/effort semantics, child admission, or bounded host retry must be surfaced to the Owner before changing the agreed behavior. No host patches, private-method interception or replacement GUI server are acceptable fallbacks.

### First-release scope versus permission to operate

The proposed release includes independently enabled Skills, MCP and Hooks Managers; integrated subscription parity; deterministic Auto; separately opted-in Smart Auto; independently opted-in supported local child routing; and advisory relevance over already authorized capabilities. Smart is optional at runtime: absent credentials, consent, service availability or evaluation approval must not prevent deterministic Auto or manual direct routes from working.

Operational account-store access, credential import/login, protected backups, host restarts, reference deactivation, live provider/judgment calls, paid or capacity-consuming Shadow evaluation, limited activation and plugin removal require explicit approval at their execution point. A design approval is not that operational approval. Every live ticket may remain waiting for Owner action; it must not invent passing evidence or spend limits. Reference removal is always the Owner's action.

### Slice discipline and common acceptance contract

Each ticket should fit one fresh agent context, loading only its cited authority, immediate blockers and scoped tests. T01 is the explicit behavior-preserving prefactor exception; T02A–T02E/T04 are bounded proof/provenance slices; T28M/T28S/T29/T30 are evidence/operational gates, not catch-all implementation tickets. Feature slices include their own UI, API/service, runtime and tests where applicable. Do not postpone basic error, permission, redaction or RTL work to a final horizontal cleanup ticket. If source pinning exposes a materially larger surface than the stated slice, stop and propose a split before publication/execution rather than hiding work inside parity.

For every implemented slice:

- Use public extension points, isolated feature enablement, native Owner-authenticated Fetch JSON interfaces in the Majed namespace, and request-time validation of scope/authority. Origin/custom headers are supplemental CSRF checks, never authentication. Test local and remote paths, including prefix/proxy base-URL resolution and unauthorized rejection; never weaken admission to make a tunnel work.
- Use isolated temporary DSH_HOME/project roots and synthetic credentials/provider fixtures by default. Do not import a module that can refresh/migrate operational auth merely to inspect it. Persistence is atomic, preserves unrelated data and rejects malformed writes without damage. Snapshots, logs, upstream error bodies and evidence must not expose secrets; use explicit unchanged/replace/remove secret semantics.
- Exercise the real client bundle and real services/Cordis seams, not only helper mocks or bundle import. Preserve existing appearance, classification and native read-page regressions. Expand the test entry point so newly added suites actually run; packaging includes the corresponding host/client modules and required notices.
- All new controls/copy support English and Arabic RTL, DSH primitives/design tokens, inherited typography, light/dark themes and font sizes 14/18. Avoid host DOM hacks, fixed typography, hard-coded colors and important overrides absent a documented host limitation. Include keyboard/focus, modal scroll and narrow remote viewport checks for affected flows.
- Add accurate CHANGELOG entries for user-visible work during implementation, using Known issues/unverified wording until local-after-restart and remote live evidence exists. Work on the agreed feature branch with 0.3.0-rc.N candidates; no stable/publication claim substitutes for verification.

## Parity allocation — no single parity mega-ticket

T04 produces the versioned, row-level Parity list. The following allocation is its minimum coverage, not a certification of current code or exhaustive upstream audit. Each row must acquire a test/evidence owner, reference version, automated result, local result, remote result and explicit disposition. Unknown upstream features are not silently marked covered. An unaccepted deferral blocks removal of a Reference plugin if it drops a capability the Owner still needs.

| Reference surface | Execution owner(s) | Boundary |
| --- | --- | --- |
| Basic Skills sources, invocation policy, Unicode, precedence, details, refresh | T05 | Native implementation; 1.2.11 is a behavior/test oracle, not a shipped standalone runtime |
| Skills create, explicit writable scope, trash/restore, read-only safety | T06 | Additional Skills product features are explicit deferrals |
| MCP global/project definitions, advanced supported fields, secret edits | T07 | No profile YAML or another plugin's store writes |
| MCP stdio/HTTP lifecycle, reconnect, probe, status and real tool invocation | T08 | Per-tool restrictions deferred; no implied dynamic exposure |
| Hooks compatible definitions, seven required events, fresh Approval, bounded execution/log | T09–T10 | Profile-only definitions need explicit disposition; no imported Approvals |
| Tool rules, native guard precedence and Manager isolation | T11 | Denial is not permission granting or necessarily hiding |
| Direct subscription providers, pinned accounts, pools/tiers, streaming/replay | T12 | Existing direct pool semantics remain distinct from Auto membership |
| Five provider auth/account lifecycles | T13–T14 | Retain pinned protocol code; do not rewrite OAuth or read actual stores |
| Catalogs, visibility, aliases, account allowlists, efforts, context and speed | T15 | Native model metadata and exact identities remain compatible |
| Usage windows, status bar, cache TTL, reset credits | T16 | Redemption requires explicit action; fixture tests are not live credits |
| Proxy/test/bypass and presented CLI versions | T17 | Secrets redacted; no live probe without permission |
| Search tools, attachment references and creation-time tool policy history | T18 | Preserve direct tool behavior independent of Auto enrollment |
| Image generation/editing, scheduler, fallback and image gallery | T19 | Ambiguous failures are not automatically replayed |
| Video generation/polling, image-to-video and rendering | T20 | Submission and polling are distinct; no duplicate submissions |
| New deterministic Auto, optional Smart, supported children and advisory | T21–T27 | Not a claim that upstream lacked same-model failover |
| Reversible ownership and actual local/remote acceptance | T28M, T28S, T29, T30 | Approval-gated, independently evidenced per subsystem |

## Proposed execution tickets

### T01 — Isolate the accepted baseline from the prototype

**What it delivers:** A behavior-preserving, separately reviewable baseline that can host new modules without carrying obsolete prototype architecture forward. No new Manager or provider is activated.

**Blocked by:** None.

**Acceptance criteria:**

- Characterize the existing 0.2.0 host/client entry points and regression seams before extraction; preserve appearance, preferences, notifications, command-approval behavior, classification and native read-page behavior.
- Record an explicit disposition for uncommitted prototype files/tests: retain useful behavior assertions selectively, not ownership-based config-editor persistence, stale vendored Skills runtime, or their automatic wiring. Do not delete/overwrite the Owner's untracked work without approval.
- Establish isolated module/client build/test loading without enabling replacement runtimes; prove plugin disposal restores registered effects. Existing regressions stay green and packaging changes are limited to the behavior-preserving extraction. Do not mix feature implementation into this prefactor.

### T02A — Prove authenticated management admission

**What it delivers:** An independently verifiable exact-host management seam proof in a temporary composition, without waiting for Auto or child routing.

**Blocked by:** T01.

**Acceptance criteria:**

- Prove Settings registration, native Owner-authenticated Fetch admission locally/remotely, authenticated project/session scoping, native Skills policy/catalog invalidation and official MCP-client lifecycle using the actual client bundle and controlled fixtures, without root ownership or host patches.
- Keep management admission distinct from Command hook Approval provenance (T02E). Passing this gate does not issue an Approval challenge, approve a hook or authorize execution; server-side command Approval/execution remain unavailable until T02E and T10 pass.
- Record public seams, exact host version, positive/negative tests and unsupported results. Failure pauses only the affected path for Owner review; no operational state or real service call is authorized.

### T02E — Prove trusted Command hook Approval provenance

**What it delivers:** An independently reproducible trusted server-side local/remote source contract for exact Command hook Approval, or an explicit unsupported result that keeps command Approval/execution unavailable. Owner-approved split on 2026-10-23; see ADR 0008. This is required first-release scope, not a deferral or a local-only policy.

**Blocked by:** T01.

**Acceptance criteria:**

- Prove original local/remote provenance through supported public admission/transport contracts for both paths, bound to the admitted Owner request and reviewed content/canonical scope. A client label, Origin, shared Owner Peer or loopback proxy hop is not evidence of original locality.
- Test forged labels, missing/invalid/stale attestation, replay, scope substitution and paired-proxy rewriting with actual supported services and controlled fixtures; distinguish isolated automated results from live evidence. Preserve server time, nonce, typed confirmation, content fingerprint and native guard requirements in T10.
- If unsupported, stop and report. Command Approval and execution must fail closed server-side (including challenge/approve/run/test/event paths); no imported Approval or fallback runner. Settings, basic Skills, MCP and inert Hook editing may proceed only after their own gates, with no implied approval or live shared-store edit authorization. No host patch, operational state access, command execution or service consumption is authorized by this proof ticket.

### T02B — Prove native Auto metadata and coherent preparation

**What it delivers:** A separately reproducible synthetic native Auto route/picker proof before implementation commits to capability/effort semantics.

**Blocked by:** T01.

**Acceptance criteria:**

- Prove native catalog identity, conservative capability/effort reporting, coherent preparation/prompt/dispatch metadata and manual selection precedence on the actual supported host (research baseline 0.2.1-rc.2).
- Test routing-generation capture, tools/images/context and unknown metadata with a real bundle and synthetic routes; source citations alone are insufficient. No fake DOM option, global-default write or host patch.
- Publish supported/unsupported evidence; a failed seam goes to the Owner before narrowing behavior. No real account/service call is authorized.

### T02C — Prove one cross-layer retry budget

**What it delivers:** An independent exact-host proof that finite attempts and partial-failure boundaries can be enforced through public seams.

**Blocked by:** T01.

**Acceptance criteria:**

- Prove budget persistence across provider pools, credential-refresh/endpoint retries, host request retry/recovery and re-preparation using synthetic streams and counters for distinct candidates and actual upstream sends.
- Demonstrate cancellation and no invisible automatic partial replay after reasoning/text/tool output. Name the public termination seam and test retry middleware both enabled and absent.
- If enforcement is unsupported, pause failover activation and consult the Owner rather than multiplying nested retry limits or patching the host. No live failures or quota exhaustion are induced.

### T02D — Prove supported child pre-start selection

**What it delivers:** A separate supported-backend matrix and reproducible local pre-admission routing proof, not a universal interception promise.

**Blocked by:** T01.

**Acceptance criteria:**

- Enumerate public local pre-start model/effort inputs and explicit-override ordering; test descriptor snapshot, inheritance, effort clearing and abort before admission with fixtures.
- Prove native depth, lifecycle, preset, permission and concurrency ownership remains intact. Mark unsupported backends explicitly and report advisory inventory semantics without changing exposure.
- No private manager-method interception or host patch. Failed proof returns to the Owner before narrowing supported child behavior; no real child model inference is authorized.

### T03 — Establish the authenticated Settings slice and visual contract

**What it delivers:** Independently enabled Manager/subscription/routing Settings sections showing a real harmless service status through the Majed API, with failure isolation and reusable native controls.

**Blocked by:** T02A.

**Acceptance criteria:**

- A real bundle renders the enable/status path, calls an Owner-admitted service and shows actionable failures; disabling/failing one module leaves the others and existing Majed preferences intact.
- Prove local/remote Owner admission, CSRF defenses, body/method limits, baseURI/prefix handling and authenticated session-to-project boundaries. Do not expose host paths or secrets unnecessarily.
- Verify token-based appearance, English/Arabic RTL, themes and 14/18 typography, keyboard focus, modal overflow and narrow viewport. These tests become an inherited contract for later controls, not permission to defer their own visual checks.

### T04 — Pin source, licenses and the granular Parity list

**What it delivers:** An auditable, inactive source integration baseline and acceptance ledger that make each later parity slice bounded and upstream changes reviewable.

**Blocked by:** T01.

**Acceptance criteria:**

- Pin subscription source/tests to 0.9.9 / commit 9930c5ee5e3fa239db9031f47a0f6f30f7ffc443; compare obtained source/artifact identifiers and record exactly what was verified. Research's tarball SHA-1 is 9d0902184c4886b5bfc37de07dc0e57cf0cf9147; it is not proof of installed-byte identity or cryptographic attestation verification.
- Preserve the MIT copyright/permission text, inspect transitive notices and mark local changes. Record a reviewable upstream update/diff process and exact-host compatibility risks; license reuse is not provider contractual authorization.
- Use Skills 1.2.11 / tag v1.2.11 / research commit b4d385b only as native behavior/test reference. Any copied Apache-2.0 source/tests retain license/attribution and modification notices; avoid unresolved brand assets. Pin Pouch reference versions/hooks schema/event behavior from research as well.
- Inventory all provider/RPC/tool/alias/client/state/history/preferences/media/catalog paths and map them to T05–T20 or an explicit Owner-reviewed deferral. Integrated modules remain inactive and cannot touch operational account state. Do not bundle a standalone plugin/apply function and call that full integration.

### T05 — Resolve and control native Skills effectively

**What it delivers:** The Owner can list, inspect and enable/disable effective project/user Skills with source and invocation policy visible; actual agent and slash catalogs reflect the setting.

**Blocked by:** T03, T04.

**Acceptance criteria:**

- Preserve source precedence, duplicate-name overlays, agent-scoped inventories, Unicode names and frontmatter invocation flags. Disable blocks applicable model/slash invocation; enable does not grant privileges the source denies.
- Refresh real native catalogs/active agents through proven public seams; diagnostics cover historical invalid names. No copied standalone route/provider/tool/state IDs, vendored client or updater is activated.
- Exercise effective invocation, details and state after an external edit, malformed state and restart in isolated storage; source Skill content is not rewritten merely to toggle it. Read-only/external sources remain protected.

### T06 — Create and reversibly remove managed Skills

**What it delivers:** The Owner creates a Skill in an explicitly chosen writable scope and trashes/restores it without altering external sources or escaping that scope.

**Blocked by:** T05.

**Acceptance criteria:**

- Creation validates name/body/scope, preserves Unicode semantics and updates agent/slash inventories. If create_skill parity is required, its public registration obeys normal explicit-request/approval semantics and the single-owner collision gate.
- Trash/restore preserves source metadata/content and handles collisions explicitly; permanent deletion needs deliberate confirmation. Test traversal, symlink escape, read-only sources, malformed metadata and interruption without destructive fallback.
- Local/remote controls select the authenticated active project's scope correctly. No hidden repository/catalog/upload support is implied.

### T07 — Save private MCP definitions safely

**What it delivers:** The Owner manages stdio and streamable HTTP definitions in explicit global/project scope with masked, lossless credential edits and safe validation.

**Blocked by:** T03, T04.

**Acceptance criteria:**

- CRUD/enable definitions and supported advanced reconnect/timeout/instruction-limit fields round-trip through private Majed storage with atomic writes/request-time reads; preserve unrelated definitions and approved scope precedence.
- Explicit unchanged/replace/remove secret operations cannot erase a masked value accidentally; secrets never reach snapshots, errors or logs. Malformed input, corrupt stores and concurrent/external edits do not clobber valid state.
- Reject scope/path/transport/name errors clearly. Do not write profile YAML, generated handoff blocks or the Reference plugin's live store. Connection success is not claimed at save time; import/export disposition is explicit in the Parity list, not silently assumed covered.

### T08 — Run and observe isolated MCP connections

**What it delivers:** A saved MCP server becomes an actual official-client connection with independently visible lifecycle, test/reconnect controls and invocable tools.

**Blocked by:** T02A, T07.

**Acceptance criteria:**

- Real Cordis fixture tests prove stdio and controlled streamable HTTP startup, tools/list, tool invocation, hot reconcile, enable/disable, teardown and restart restoration, one isolated lifecycle fiber per server.
- Connection probe uses a bounded disposable lifecycle; UI distinguishes saved/probing/connected/error state, and status refresh works remotely. Failure or cancellation of one server does not stop another Manager/server.
- Prevent duplicate server/tool ownership, stale fibers and leaked processes; test server failure/reconnect/disposal. Per-tool restrictions and config-ingest/handoff features are not smuggled into this ticket.

### T09 — Edit compatible Command hook definitions inertly

**What it delivers:** The Owner creates/edits/disables/deletes compatible project/user Command hooks and reviews the supported event contract; no saved command runs yet.

**Blocked by:** T03, T04.

**Acceptance criteria:**

- Enumerate and test first-release SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, PermissionRequest, Stop and PostCompact against the pinned reference schema and public host semantics. Unsupported events/fields receive explicit diagnostics, not silent dropping.
- Preserve compatible hooks.json scopes/schema, matcher semantics and supported command options, including source/cwd, limits, shell and watched-file fingerprints where part of the approved contract. Show env names without exposing values.
- New/changed/imported hooks are inert, even if another plugin previously approved them; definitions and private Approval state remain separate. Profile-only source behavior gets an explicit import/manual-conversion/deferral decision before removal, never a profile-config ownership workaround.

### T10 — Approve and execute exact Command hooks locally and remotely

**What it delivers:** The authenticated Owner reviews an exact hook, types RUN AS DSH USER and authorizes that version to run boundedly on the DSH host, with auditable results.

**Blocked by:** T09, T02E.

**Acceptance criteria:**

- Server-issued single-use, expiring nonce binds exact reviewed content hash, source and canonical scope; server checks the phrase. Test missing/stale/replayed nonce, edit/watch-file changes, scope substitution and change while queued. Trusted provenance/time distinguishes local versus remote Approval without trusting a client-supplied label.
- Real harmless fixtures prove approved-only dispatch for all seven required events, stdin-only event JSON, bounded timeout/output/concurrency, cancellation/process cleanup, recursion/duplicate-event protection and interrupted-run handling. No event data is shell-interpolated.
- Commands run as the host OS user, not in a claimed sandbox. Strict supported output handling cannot grant native permissions; native guards still run. Run log/errors redact secrets. Revocation/edit invalidation and remote approval/execution both have negative and positive automated coverage; actual live proof remains T29.

### T11 — Apply Tool rules without bypassing native guards

**What it delivers:** The Owner maintains wildcard Tool rules that deny matching calls without running code and sees why a tool is denied.

**Blocked by:** T03, T04.

**Acceptance criteria:**

- Validated CRUD/enable rules persist privately and affect actual tool calls in the intended global/project/agent scope. Matching, malformed patterns, overlapping rules and changes during active sessions have observable tests.
- Rules and Command hooks never allow a call denied by native permissions; guards compose rather than replace one another. Denial is reported honestly even if tools remain model-visible.
- Failure/isolation tests keep Skills, MCP, Hooks and existing preferences usable independently. No dynamic exposure reduction or MCP configuration mutation is introduced.

### T12 — Preserve direct subscription routing and stream behavior

**What it delivers:** Integrated subscription adapters serve existing direct/pinned/pool/tier route identities in an isolated composition using synthetic accounts, before any new Auto behavior.

**Blocked by:** T03, T04.

**Acceptance criteria:**

- Retain pinned provider wire/stream code, public provider/model IDs, direct pinned-account no-fallback behavior, existing same-model pools/optional tiers and direct-route strategies. Build a single-owner registration boundary; no standalone/integrated duplicate providers, tools or RPCs.
- Port representative fixture coverage for Responses, chat-completions, Anthropic and Antigravity text/reasoning/tool streams, Copilot endpoint selection, tool schemas and endpoint failover. Provider-specific exhaustive cases remain in their preserved upstream suites, with a tracked test map rather than one vague chat-success claim.
- Preserve leading-usage/pre-output failover, cancellation/iterator cleanup, account/model-bound opaque replay and normalized history; never stitch partial reasoning/text/tool deltas across routes. Direct-route retry behavior is characterized separately from the stricter new Auto budget. No real account store is opened.

### T13 — Integrate Codex and Claude account authentication

**What it delivers:** Native Settings/API flows retain the pinned Codex/ChatGPT and Claude account/auth lifecycle, demonstrated with fixture callbacks and an isolated compatible store.

**Blocked by:** T12.

**Acceptance criteria:**

- Preserve browser/manual OAuth paths, Claude Code import and independent account identities/defaults applicable to these providers, using existing source rather than new protocol implementations. Exercise pending/cancelled/failed/successful state in the real UI and service.
- Prove refresh coalescing, one forced-refresh path where supported, revoke only the failed account and protect a concurrent newer login; catalog/usage/health invalidation reaches the direct runtime.
- Compatible-store tests use synthetic credentials and verify single-writer semantics, file protection and redaction. Actual Claude credential import, login or operational-state compatibility reads remain separately approved under T28S/T30; missing permission is not a failed implementation test.

### T14 — Integrate Grok, Copilot and Antigravity authentication

**What it delivers:** The remaining three pinned provider/account flows are manageable in Settings and feed the same direct-route runtime, without widening T13 into a five-provider mega-ticket.

**Blocked by:** T12.

**Acceptance criteria:**

- Preserve each provider's existing login/device/browser/manual mechanisms as applicable, multi-account/default/removal behavior and provider-specific failure reporting; do not invent a common OAuth protocol where upstream differs.
- Fixture UI/API/runtime tests cover device authorization polling/cancel/expiry, callback validation, refresh/revocation and per-account isolation for the relevant provider; test fake credentials only.
- Preserve compatible store schema/single-writer behavior and invalidate catalogs/health appropriately. No operational login, account discovery or provider request is performed absent later approval. This is bounded source integration of three existing auth surfaces, not a protocol rewrite; split by provider if T04 exposes additional work.

### T15 — Preserve account/model catalogs and preferences

**What it delivers:** The Owner sees and controls the same direct model/account catalog, aliases and model preferences through native Settings and picker metadata.

**Blocked by:** T12.

**Acceptance criteria:**

- Preserve discovered/static/manual catalogs, background/manual refresh, visibility, aliases/display names, direct pool participation, per-account allowlists and independent pinned entries. Test account-specific capabilities and absent/stale catalog behavior.
- Preserve reasoning defaults, supported effort IDs, Codex context budgets and Standard/Fast plus /fast behavior without overriding explicit manual choices or creating new Auto membership.
- Real picker/Settings fixture tests show catalog invalidation and actual direct dispatch to the selected identity. Login and catalog updates never enroll account/model candidates into Auto; account-only models stay bound to their advertised account.

### T16 — Preserve usage and explicit quota operations

**What it delivers:** The Owner views provider/account/per-model usage windows and status-bar quota preferences, controls relevant cache TTL settings and can explicitly invoke supported reset-credit operations.

**Blocked by:** T12, T15.

**Acceptance criteria:**

- Preserve usage refresh/window scopes, unknown/stale telemetry and redacted failure handling; fixture tests drive both Settings and status bar, including provider-specific missing telemetry.
- Preserve Claude prompt-cache TTL and Codex manual reset-credit workflow using fixtures. Redemption requires explicit action; a cancelled/ambiguous result is never automatically replayed as though it were a read.
- Actual provider rejection/reset data remains distinct from telemetry warnings. Auto's 95% warning is advisory, and unknown telemetry does not exclude a candidate. No real credit redemption or usage-endpoint access is authorized here.

### T17 — Preserve proxy and provider operational settings

**What it delivers:** The Owner can configure supported proxy/bypass behavior and presented CLI versions, and see a truthful bounded connection-test result in Settings.

**Blocked by:** T12.

**Acceptance criteria:**

- Retain pinned proxy configuration, test and bypass behavior and provider-specific presented client/CLI version settings; fixture requests prove chat/auth/catalog/tools use the intended supported path.
- Mask proxy credentials, protect unchanged-secret edits and redact transport/upstream errors. Test bad proxy configuration, timeout, abort and bypass without weakening native Owner admission or exposing credentials to the browser.
- No actual proxy or provider probe occurs without explicit approval; saved settings and fixture success are not presented as live connectivity. Avoid changing host/network configuration outside the module.

### T18 — Preserve search, attachments and tool-policy history

**What it delivers:** Existing Codex web_search and Grok x_search capabilities, attachment handling and creation-time tool policy remain available and render correctly through the integrated subscription module.

**Blocked by:** T12, T15.

**Acceptance criteria:**

- Preserve public tool names/aliases, native search behavior and supported tool views using upstream fixtures. Preserve session-creation-time tool-policy history across reload, resumed sessions and reference ownership changes.
- Test vision/offloaded attachment normalization and complete attachment references, including history/replay across account/model changes without leaking incompatible private state.
- Direct search/attachment scheduling is not limited by new Auto membership. No unauthorized search call, tool installation or tool permission grant occurs. Image edits/video submission belong to separate slices.

### T19 — Preserve image generation and editing

**What it delivers:** GPT/Grok image generation and edits retain complete reference-image support, scheduling/fallback behavior and inline/gallery presentation.

**Blocked by:** T12, T18.

**Acceptance criteria:**

- Fixture UI/tool/runtime tests cover generation, ordered complete edit references, output attachments, inline image views and gallery/open behavior. An edit-reference failure cannot silently become text-to-image generation.
- Preserve independent same-provider account scheduling and logged-out cross-provider fallback; enrollment/allowlists for chat Auto are not repurposed as media policy.
- Definitive auth/quota/entitlement rejections may follow the preserved image fallback contract; ambiguous timeout/transport/5xx do not resubmit a potentially completed image. Test one supported auth-refresh path, cancellation and secret-safe diagnostics. No live image generation is authorized.

### T20 — Preserve video submission, polling and rendering

**What it delivers:** Grok video and image-to-video retain their native tool/API experience with recoverable progress and usable media presentation.

**Blocked by:** T12, T18.

**Acceptance criteria:**

- Preserve duration/aspect/resolution and supported starting-image inputs, job/result mapping, inline video/tool views and relevant gallery access; fixture tests cover success, failure, unknown job and interrupted polling.
- Distinguish submission from polling so recovery/cancellation cannot create duplicate side-effecting submissions. Do not generalize chat retry rules to async video.
- Local/remote UI remains usable with token-based progress/error controls. Existing media scheduling remains separate from Auto. No real video generation or capacity consumption is authorized.

### T21 — Enroll explicit Auto candidates and session policy

**What it delivers:** The Owner explicitly enrolls and orders provider/account/model candidates with default and Smart-permitted efforts, and controls when policy changes affect sessions.

**Blocked by:** T03, T15.

**Acceptance criteria:**

- Identity is provider + account + model, not only a display name; membership is separate from login, direct pooling, search/media scheduling and child-routing opt-in. Empty membership is valid and explained.
- Validate effort sets and priority edits locally/server-side. Login/import/catalog additions never enroll candidates. Preserve manual direct selection and global default; a manual model selection exits Auto for that session.
- Strategy/default-priority edits affect new sessions; explicit apply-and-reselect updates an existing session. Removal/disable blocks new requests through the candidate in all sessions, but does not invisibly cancel, replay or transfer an in-flight request. Exercise settings-version races and remote controls.

### T22 — Route deterministic Auto through the native picker

**What it delivers:** One native Auto entry selects the highest-priority eligible candidate and retains a healthy selection within the session, with truthful capability and serving-route display.

**Blocked by:** T02B, T12, T21.

**Acceptance criteria:**

- Filter before selection by images/tools, explicit effort, context/output limits and other proven request requirements; advertise a conservative Auto envelope. Unknown/incompatible requirements stop clearly instead of stripping history/images, reducing explicit effort or expanding membership.
- Preserve prepared-call generation, coherent prompt/model metadata, original cancellation/tools/attribution and public Auto identity while showing sanitized served-by/fallback reasons. No DOM-injected picker option or global-default write.
- Healthy selection remains sticky after higher-priority recovery. Explicit reselect or unavailability can choose again. Tests cover empty/incompatible pools, long history, images, tools, effort, catalog/settings races and manual overrides. Automatic multi-candidate failure execution remains disabled until T23 passes.

### T23 — Enforce one finite Auto budget across all retry layers

**What it delivers:** Auto can recover from eligible pre-output failures without nested retry multiplication, invisible partial replay or hours-long waiting, and stops with actionable exhaustion reasons.

**Blocked by:** T02C, T22.

**Acceptance criteria:**

- Default at most three distinct account/model candidates per failover cycle before content starts, no repeated candidate; finite configurable limits apply end-to-end across provider pools, forced auth refresh, endpoint retries, host retry and recovery middleware. Count/document actual upstream sends as well as distinct candidates so hidden internal retries cannot escape the bound. Prove the exact-host budget persistence/termination seam with outer retries enabled, disabled and re-preparation.
- Realistic fixtures cover RATE_LIMIT/QUOTA/AUTH/transient/nonretryable/context errors, body/header/date Retry-After, known/unknown reset, account versus model cooldown, concurrent sessions and all-exhausted state. Preserve actual failure classification and show earliest known retry only; unknown reset is unknown, not an invented provider time. No automatic hours-long wait or account-restriction circumvention.
- First non-usage reasoning/text/tool delta ends seamless failover. Partial failures stop at a visible boundary; any explicitly retried attempt is separate and consumes the applicable budget, never stitched or invisibly replayed. Prevent side-effecting tool replay; cancellation is not account failure and closes iterators/waits. If public host semantics cannot enforce this, return to the Owner before activation.

### T24 — Configure a separate protocol-explicit judgment service

**What it delivers:** Secure Majed routing settings name System One versus Decisions, service address/model and credential configured status without depending on the existing Jev plugin's private state.

**Blocked by:** T03.

**Acceptance criteria:**

- Secure application settings handle credential entry/replace/remove; chat, snapshots, logs and fixtures never expose real keys. Endpoint validation distinguishes root-plus-/v1/systemone from a full Decisions endpoint and prevents suffix duplication; generic chat-completions compatibility is not assumed.
- Fixture requests validate each supported protocol's body/response, model identifier and returned usage/cost metadata; preserve requested versus actual model when provided. Do not manufacture probability/confidence fields or claim they measure accuracy.
- Existing jev_ask/jev_gate and skill suggestion behavior remain untouched. Missing credentials, unsupported protocol and auth/credit failures are visible and allow deterministic Auto. A connection-test button cannot perform live inference without explicit consent; no current endpoint is certified working.

### T25 — Bound Smart selection and record opt-in Shadow decisions

**What it delivers:** An independently opted-in Smart strategy chooses only valid local candidate/effort tuples, falls back immediately to priority and can record non-applied Shadow proposals pending approved evaluation.

**Blocked by:** T21, T23, T24.

**Acceptance criteria:**

- Require explicit task-summary consent and offer per-session Smart disable. Send only bounded current-task description, capability metadata and opaque IDs, not account/file names, history, secrets or MCP values; disclose that remaining task text may still be sensitive. Treat it as untrusted data and revalidate answer/membership/effort/current generation before dispatch. Manual choices win; suitability precedes priority tie-breaks.
- Default one judgment request per selection decision, 3-second deadline and no automatic retry for that decision; sticky decisions re-evaluate only explicitly or on unavailability. Missing/malformed/unknown/stale answers, abstention, timeout, outage or exhausted budget immediately use eligible priority or stop if none. No recursive Auto selection of the judge.
- Enforce shared configurable 20-requests/day cap, three-consecutive-failure circuit break for five minutes and priority for the rest of the capped day. Show fallback/budget state. A request count is not a monetary ceiling; display returned cost only when available and label estimates.
- Keep only local reason, latency and available cost metadata for seven days with manual deletion; no task text/raw response retention. Synthetic clocks test concurrency, day boundary/time-zone policy, expiry and restart behavior. Shadow never applies its proposal. Real Shadow tasks, thresholds, costs and activation require the Owner-agreed protocol in T30, not an invented benchmark or an arbitrary confidence cutoff.

### T26 — Route supported local children before admission

**What it delivers:** Independently opted-in child Auto selects a supported route/effort before a local child starts, while preserving explicit overrides and native child lifecycle authority.

**Blocked by:** T02D, T23, T25.

**Acceptance criteria:**

- Use only the public pre-admission caller/provider path proven in T02D and declared backend capabilities. Persist the resolved route/effort consistently in the child descriptor; native depth, permission, preset, concurrency and cancellation controls remain authoritative.
- Explicit child model/effort overrides win; inheritance/effort-clearing semantics are preserved. Main-session Auto is not implicit consent to child routing. Priority children work without Smart; optional judgment uses the same budgets/privacy/fallback contract without duplicate calls for the same decision.
- Fixture tests cover admission races, unsupported backend, manual overrides, parent changes and abort before start. Unsupported external backends stay manual/default with clear UI/documentation, not monkey-patched interception or a universal routing promise. The T25 blocker is for sharing the completed optional judgment contract, not requiring Smart activation.

### T27 — Advise on authorized Skills and MCP tools only

**What it delivers:** The Owner/agent receives bounded, clearly advisory relevance suggestions drawn from the effective agent-visible Skills and authorized tool inventory.

**Blocked by:** T05, T08, T11, T24, T25.

**Acceptance criteria:**

- Honor invocation policy, disabled tools, scopes and native permissions; resolve current inventory locally and send only sanitized descriptions/opaque IDs if judgment is consented. A stale/unavailable recommendation is rejected or marked unavailable.
- Coordinate with existing Jev skill suggestions so there is no duplicate skill recommendation request; preserve its tools and mandatory skill-loading instructions. If a supported coordination seam is absent, suppress Majed's duplicate skill path and report the limitation rather than accessing private closures.
- Suggestions do not install/load/enable servers, spawn MCP processes, approve hooks, edit credentials/configuration or grant access. No dynamic exposure reduction is implemented; denial/hiding is not conflated. Timeout/budget failure leaves normal tools/Skills intact and surfaces a non-blocking notice.

### T28M — Prepare Manager cutover and rollback

**What it delivers:** An Owner-reviewable Manager preview and fixture-proven rollback procedure independent of subscription or Auto readiness.

**Blocked by:** T04, T06, T08, T10, T11.

**Acceptance criteria:**

- Report Manager Parity rows and explicit deferrals without reading operational secrets. Enumerate state paths, approved backup access/destinations/permissions, scope/schema compatibility, restoration steps and fresh Command hook Approvals. Backups never go in the repository, browser, evidence bundle or plaintext logs.
- Fixture drills prove reversible Skills/MCP/Hooks ownership with Reference runtime disabled before replacement activation; rollback disables replacement before restoring Reference ownership. Cover tool/route/slot/state collisions, interruption and source preservation. No automatic plugin deletion, imported Approval or generated handoff edits.
- Preview profile-only hook definitions and MCP import/export/ingest gaps. Preparation may finish with an explicit pending disposition; actual required capability implementation blocks operational cutover, not preparation. An explicit Owner-accepted deferral satisfies that capability gate; silence does not. D05 is not a circular prerequisite of this preparation ticket.
- Produce operation-specific approval checklists for T29. The Owner may accept a documented deferral or retain the Reference plugin; this ticket cannot make that decision or authorize state changes on their behalf.

### T28S — Prepare subscription ownership and compatible rollback

**What it delivers:** A separate subscription-state preview and synthetic compatible-store/single-writer rollback proof, without waiting for unrelated Managers.

**Blocked by:** T04, T13, T14, T15, T16, T17, T18, T19, T20.

**Acceptance criteria:**

- Report subscription Parity rows, exact store/schema compatibility and explicit deferrals without reading operational secrets. Enumerate sensitive reads/writes, protected backup destination/permissions, restoration and approval points. No refresh-capable module import during a supposedly read-only preview.
- Synthetic-store drills prove compatible existing account-store access with one active writer, no forced reauthentication, rollback after interruption and no concurrent refresh. If compatibility fails, ask the Owner before migration or reauthentication. Backups never go in the repository, browser, evidence bundle or plaintext logs.
- Sequence drain/quiesce, disable standalone ownership, then activate replacement; rollback reverses ownership before restoring state. Cover provider/tool/RPC/history collisions and preserve Reference packages. Do not delete accounts/plugins or copy secrets into project/UI/evidence.
- Produce separate approval checklists for T30. Required missing parity blocks operational cutover; preparation can record a pending disposition, and only explicit Owner acceptance can waive a deferred capability. This ticket neither needs Manager readiness nor authorizes account-state access/live evaluation.

### T29 — Verify Managers after approved local and remote cutover

**What it delivers:** A recorded, reversible acceptance session for Skills, MCP and Hooks after an explicitly approved backed-up cutover and full desktop restart.

**Blocked by:** T28M.

**Acceptance criteria:**

- Before changing anything, obtain operation-specific approval for backup/state access, deactivation/activation, restart and harmless demo fixtures. Keep old and replacement runtimes mutually exclusive; leave installed Reference packages available for rollback. Missing approval is an explicit waiting state, not implied permission.
- Verify actual Skill effective invocation/create/trash/restore, MCP save/connect/tool call and isolated failure, Command hook edit/review/fresh Approval/execution/revocation and Tool rule denial locally and remotely. Include remote Command hook Approval and execution on the host. A save or test suite alone does not pass.
- Capture redacted screenshots/logs with host/plugin versions, locality, steps, observed results and rollback drill outcome. Repeat affected English/Arabic RTL, light/dark, 14/18 and narrow viewport flows using the actual bundle; preserve existing preferences/regressions.
- Update Parity list/known issues/release evidence truthfully; no stable working claim for failed/unperformed checks. Owner decides removal only after needed parity and rollback are verified. No GitHub release/write is performed merely because this ticket passes.

### T30 — Verify subscriptions/Auto and separately gate Smart activation

**What it delivers:** Owner-authorized local/remote acceptance evidence for the integrated subscriptions and deterministic Auto, plus a distinct approved Shadow/limited-Smart decision rather than silent rollout.

**Blocked by:** T23, T25, T26, T27, T28S.

**Acceptance criteria:**

- Subscription parity/cutover and deterministic Auto evidence sessions may proceed once their own implementation/readiness prerequisites pass; they need not await advisory Manager implementation. T27 is a blocker only for closing this combined final acceptance ticket with advisory coverage, not for beginning those separately approved sessions.
- Obtain separate operational approval for compatible account-store access, protected backup, one-writer cutover, restart and each agreed capacity-/money-consuming provider/media/judgment exercise. Agree provider coverage, task set, budgets, redaction and success/rollback criteria before evaluation. Neither this plan nor fixture tests authorize those calls; do not intentionally exhaust live quotas to demonstrate failover.
- Use the T04 row-level ledger to verify direct routes, approved authentication/refresh checks, catalogs, usage/proxy, search/attachments, image/edit and video behavior across the agreed provider matrix in manageable evidence sessions. Synthetic failure injection validates unsafe/expensive cases; it must be labeled synthetic, not live rate-limit diagnosis. Keep the Reference package/state until needed parity and rollback pass.
- Verify native Auto/manual exit, sticky selection, membership/revocation, serving-route reasons, finite budget and cancellation locally and remotely after restart. Supported child and advisory paths show their actual backend/scope limitations. No silent narrowing of capability compatibility or no-output/partial-output behavior is accepted.
- Shadow evaluation is separately opt-in, non-applied and bounded by agreed tasks/metrics/privacy/cost rules. Report observed suitability/error/latency/fallback/cost results without presenting probabilities as accuracy. Limited Smart application requires a subsequent explicit Owner go/no-go and local/remote verification; declining it leaves deterministic Auto functional. Preserve manual/per-session kill switches and a proven return to priority.
- Record unverified provider/surface combinations honestly; do not declare full replacement parity from one successful chat. Any unmet required row or failed rollback prevents Reference removal and associated working/stable claims. A large approved live matrix may span evidence sessions, not expand implementation inside this ticket.

## Explicit deferred tickets — not first-release promises

The Owner approved publishing these IDs as deferred follow-ups, not first-release implementation promises. An edge below means a prerequisite for a later proposal, not authorization to start it. They are published as needs-info planning records pending the stated scoping/approval gates, not ready-for-agent execution work. Necessary-but-deferred Reference parity must still be accepted explicitly or Reference removal remains blocked.

### D01 — Skills repository and catalog installation

**What it delivers:** A later, separately scoped plan for repository/ClawHub/skills.sh discovery/install/update/rollback, with source review, integrity and scope controls.

**Blocked by:** T04, T06.

**Acceptance criteria:** Split by source/workflow before execution; no install or network fetch without the normal permissions; keep invocation semantics and rollback intact. Do not imply these capabilities are included in the basic Manager.

### D02 — Skills uploads, categories and extended source surfaces

**What it delivers:** Later proposals for upload/archive validation, category management, extended agent/workspace sources and any optional sidebar entry, each separable from basic Skills. Owner scope clarification (2026-10-22): SK-17 local-directory import (skip/overwrite/dry-run) and arbitrary-directory browse are explicitly deferred here; basic project/user inventory and creation remain first-release requirements.

**Blocked by:** T04, T06.

**Acceptance criteria:** Reconcile needed upstream features row by row; split archives/path safety from categories/sidebar before execution. Never import the upstream self-updater or DOM nav hacks as a shortcut.

### D03 — Plugin self-update integration

**What it delivers:** A later Owner-reviewed update experience through a supported host installer contract, if desired.

**Blocked by:** T02A, T04.

**Acceptance criteria:** Preserve host compatibility/mirror/cooldown policy and provenance; no package-manager shell bypass or forced registry. This is not a first-release updater promise.

### D04 — MCP per-tool restrictions

**What it delivers:** A later native restriction policy and truthful UI for individual MCP tools.

**Blocked by:** T08, T11.

**Acceptance criteria:** Prove public semantics and scope/guard composition; distinguish visible-but-denied from hidden tools and preserve native authority. Owner explicitly accepts its absence before removing a needed Reference capability.

### D05 — MCP import/export and legacy ingest/handoff alternatives

**What it delivers:** Later explicit import/export/preview workflows and a supported replacement for any needed legacy ingestion/handoff behavior.

**Blocked by:** T07, T08.

**Acceptance criteria:** Split format import/export from legacy discovery before implementation; no profile YAML or generated native handoff edits, secret export by default or takeover of another plugin's store. This gap must be resolved or accepted before affected parity/removal claims.

### D06 — Observe-only lifecycle extensions

**What it delivers:** Later SessionEnd, SubagentStart and SubagentStop observation with independently specified lifecycle semantics.

**Blocked by:** T10.

**Acceptance criteria:** Enumerate data delivery, non-blocking behavior, ordering/disposal and supported public events. Do not relabel the seven first-release command events as deferred or add execution authority via observation.

### D07 — Additional child backends

**What it delivers:** Separately verified routing integrations for external child providers that expose supported pre-start route/effort controls.

**Blocked by:** T02D, T26.

**Acceptance criteria:** One backend/capability proof per execution slice; preserve overrides, permission/depth/lifecycle ownership. No universal external-backend interception, private-method patch or host patch.

### D08 — Dynamic capability exposure reduction

**What it delivers:** A later evaluated proposal to reduce already authorized tool/Skill exposure only if a public scoped contract is proven.

**Blocked by:** T27.

**Acceptance criteria:** Prove restoration, mandatory-capability exceptions, stale inventory handling and no permission expansion. Enabling/installing servers, granting access and approving hooks remain separate explicit Owner actions, never judge powers.

### D09 — Advanced Auto scheduling and broader Smart rollout

**What it delivers:** Later measured proposals for quota-aware/cost-aware policies, broader rollout or different judgment protocols, each separate from accepted sticky priority defaults.

**Blocked by:** T23, T25, T30.

**Acceptance criteria:** Keep 95% advisory/unknown telemetry eligibility unless the Owner explicitly revises policy; no automatic switchback, unbounded waiting or arbitrary confidence threshold. Any new provider/model/protocol or wider paid evaluation needs explicit consent, compatible candidates, agreed cost/quality/latency evidence and rollback.

### D10 — Reference removal and stable promotion

**What it delivers:** An Owner-controlled removal/stable-release decision after all needed Parity rows, deferral decisions and rollback/live evidence pass.

**Blocked by:** T29, T30, plus any deferred capability the Owner still requires.

**Acceptance criteria:** Owner explicitly approves each removal and publication/stable promotion separately; automation never deletes installed Reference plugins. Keep recovery artifacts for an agreed period and publish only claims supported by actual evidence. Publication approval authorizes issue creation only, not this removal/stable-promotion operation.

## Owner approval and publication record

On 2026-10-22, the Owner approved:

1. The 34-slice granularity, including independently verifiable feasibility/readiness gates, two retained-source authentication groups, the search/attachment boundary and evidence-only live sessions.
2. The original explicit blocking edges. T04 and T02A–T02D can proceed independently after T01; T03 waits only for T02A; auth groups, catalogs, proxy and media slices need not form a serial chain. T26 waits for the shared Smart contract, not Smart activation. T29 and T30 have independent prepared cutover gates and separate operational approvals.
3. The first-release/deferred boundary, expanded specification and testing seams, and publication of the specification and tickets on GitHub. Required missing Parity rows still prevent Reference removal unless explicitly waived.

Publication preserves the original Manager specification issue without closing or editing it. The expanded specification is a separate issue, with execution and deferred records linked beneath it. A separate publication ledger records real issue identifiers and verified native dependency edges.

**Warnings:** Public extension seams and account-store compatibility are not yet proven end to end. Provider endpoints/terms and transitive licensing need review. Paid/live tasks, Shadow criteria, state access, implementation and Cutover are not authorized by this publication approval. Offline tests cannot establish local/remote success.
