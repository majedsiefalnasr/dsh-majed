# Native Managers, subscriptions and Auto routing in dsh-majed

Approval/publication status (2026-10-22): the Owner approved this expanded specification, the 34 execution slices and 10 deferred tickets, their dependency graph, the first-release/deferred boundary and the expanded testing seams. This is the standalone expanded specification approved for publication as a NEW ready-for-agent GitHub issue. Existing issue #1 remains open and unchanged; it must not be edited or closed as part of publication. This approval is publication consent, not implementation or live-verification evidence, account-state access or operational consent.

## Problem Statement

The Owner currently needs separate Reference plugins for Skills, MCP servers, Hooks and subscription capabilities. They are references for replacement, not permanent companion dependencies. Earlier Majed Manager code passed offline tests but failed live saves. Appearance preferences must survive the integration, and administration must work in the desktop and remote GUIs.

The Owner also encounters work stopping on rate limits despite having other subscriptions. The reference subscription implementation already contains account pools and failover; no actual failure has been diagnosed. Rewriting it without preserving its substantial provider, authentication, tool and media behavior would risk regressions rather than establish a fix. The new requirement is explicit, prioritized account/model enrollment, a native Auto selection, clear bounded failure behavior and optional task-based model/effort judgment.

## Solution

Provide independently enabled Managers and integrated subscription capabilities inside one Majed plugin, using public DSH extension points, native Settings and existing design tokens. Replace Reference plugins only through an explicit, backed-up, reversible Cutover after the applicable Parity list is verified.

Expose one Auto entry in the native model picker. Its default strategy chooses an explicitly enrolled compatible account/model candidate by Owner priority, retains a healthy session route and fails over only within a finite safety envelope. Optional Smart Auto asks a separately configured judgment service for an eligible model/effort choice, falls back to deterministic priority on failure, and never owns permissions or provider health. Preserve manual selections and non-chat subscription behavior.

## User Stories

1. As an Owner, I want one plugin for Managers and subscriptions, so that installation and releases are unified.
2. As an Owner, I want independently enabled modules, so that a failed module does not stop existing preferences or unrelated Managers.
3. As an Owner, I want native Settings navigation, so that management follows familiar DSH patterns.
4. As an Owner, I want local and remote parity, so that paired-device administration remains complete.
5. As an Owner, I want existing theme, font and size preferences respected, so that integration does not undo my customizations.
6. As an Owner, I want English and Arabic RTL interfaces, so that either language remains usable.
7. As an Owner, I want project and user Skills listed with source and effective invocation state, so that I know what the agent can use.
8. As an Owner, I want Skill details before activation, so that I can review their instructions.
9. As an Owner, I want reversible enable/disable without lost invocation metadata, so that behavior stays predictable.
10. As an Owner, I want to create a Skill in an explicit writable scope, so that instructions reach the correct context.
11. As an Owner, I want trash and restore for managed Skills, so that removal is reversible.
12. As an Owner, I want read-only and external Skills protected, so that listing a source does not authorize modifying it.
13. As an Owner, I want MCP server add/edit/delete, so that profile configuration editing is unnecessary.
14. As an Owner, I want stdio and streamable HTTP support, so that local and hosted integrations work.
15. As an Owner, I want per-server enable/disable and isolated lifecycles, so that unrelated servers stay available.
16. As an Owner, I want connection testing and actual connection status, so that saving is not mistaken for successful execution.
17. As an Owner, I want masked credential editing with explicit keep/replace/remove semantics, so that edits neither expose nor erase secrets.
18. As an Owner, I want invalid or conflicting changes rejected safely, so that existing definitions remain recoverable.
19. As an Owner, I want to edit Command hooks in compatible project/user scopes, so that replacement preserves existing definitions.
20. As an Owner, I want required lifecycle event coverage and a bounded run log, so that automation is observable.
21. As an Owner, I want commands inert until exact-content Approval, so that file changes cannot silently authorize execution.
22. As an Owner, I want full command review and typed RUN AS DSH USER confirmation, so that approval is intentional.
23. As an Owner, I want single-use server-verified content-bound challenges, so that stale or replayed Approval cannot execute changed commands.
24. As an Owner, I want edits and changed watched content to invalidate Approval, so that only the reviewed version remains authorized.
25. As an Owner, I want remote Approval with trusted source and time recorded, so that remote administration is auditable.
26. As an Owner, I want event data delivered through stdin, so that payloads are not interpolated into commands.
27. As an Owner, I want Tool rules to deny tools without running code, so that simple restrictions need no shell commands.
28. As an Owner, I want Hooks unable to bypass native guards, so that automation never grants authority.
29. As an Owner, I want fresh Approvals at Cutover, so that another plugin's trust is not inherited.
30. As an Owner, I want existing subscription providers and authentication flows preserved, so that replacement does not remove accounts or access methods.
31. As an Owner, I want direct/pinned models, aliases, visibility, catalogs and effort defaults preserved, so that manual selection keeps working.
32. As an Owner, I want existing usage, proxy, refresh and operational controls preserved, so that subscription administration remains complete.
33. As an Owner, I want subscription search, image generation/editing, video and attachment handling preserved, so that integration is not chat-only parity.
34. As an Owner, I want existing replay isolation and media non-replay safeguards preserved, so that fallback cannot resend unsafe work.
35. As an Owner, I want compatible account state retained under one runtime owner, so that replacing the plugin need not require every account to sign in again.
36. As an Owner, I want Auto in the normal picker without changing my global default, so that automatic routing is an explicit choice.
37. As an Owner, I want explicit provider/account/model enrollment and ordering, so that only approved candidates can participate.
38. As an Owner, I want new logins and catalog updates excluded until enrolled, so that availability is not mistaken for consent.
39. As an Owner, I want permitted efforts and defaults per candidate, so that automatic effort selection stays within my choices.
40. As an Owner, I want request compatibility checked before priority or judgment, so that tools, images, effort and context requirements are preserved.
41. As an Owner, I want a healthy selection retained within a session, so that recovered higher priorities do not cause needless switching.
42. As an Owner, I want eligible pre-output failover with accurate cooldowns, so that a blocked account does not unnecessarily stop work.
43. As an Owner, I want finite attempts and a clear exhaustion reason, so that Auto never waits or rotates indefinitely.
44. As an Owner, I want the actual known retry time distinguished from an unknown reset, so that the UI does not invent provider availability.
45. As an Owner, I want no silent stitching or replay after partial output, so that model transitions cannot obscure failed work.
46. As an Owner, I want cancellation to stop selection and execution, so that cancel is not treated as a reason to try another account.
47. As an Owner, I want Auto shown alongside the concrete serving route and effort, so that I understand the applied decision.
48. As an Owner, I want usage warnings without automatic exclusion solely at 95%, so that estimates do not disable a valid account.
49. As an Owner, I want missing telemetry labeled rather than treated as account failure, so that unknown usage does not remove valid options.
50. As an Owner, I want setting changes applied to new sessions unless explicitly reapplied, so that active sessions remain stable.
51. As an Owner, I want candidate revocation to block new requests in all sessions, so that stickiness cannot retain withdrawn consent.
52. As an Owner, I want manual model or effort choices respected, so that automation cannot silently override me.
53. As an Owner, I want deterministic Auto without a judge, so that a judgment outage cannot stop authorized baseline routing.
54. As an Owner, I want opt-in Smart Auto to select task-suitable model/effort tuples, so that priority is not the only selection signal.
55. As an Owner, I want separate protocol-explicit judgment settings, so that service-address formats are not confused or another plugin's secrets accessed.
56. As an Owner, I want explicit consent before exporting a minimal task description, so that using Smart does not silently disclose conversation data.
57. As an Owner, I want per-session Smart disabling and short-lived metadata-only logs, so that I control disclosure and retention.
58. As an Owner, I want judgment deadlines, caps and failure fallback, so that latency and request counts remain bounded.
59. As an Owner, I want independently opted-in child routing only on supported public seams, so that explicit overrides and native child permissions remain intact.
60. As an Owner, I want advisory relevance over already authorized Skills and MCP tools, so that recommendations cannot install or activate capabilities.
61. As an Owner, I want no duplicate Skill judgment alongside the existing Jev plugin, so that integration does not repeat its work.
62. As an Owner, I want optional Shadow evaluation before applied Smart choices, so that proposed decisions can be compared without changing execution.
63. As an Owner, I want parity evidence, protected backup and tested rollback, so that reference replacement is reversible.
64. As an Owner, I want to approve account-state access, paid evaluation and actual Cutover separately, so that design consent is not operational consent.
65. As an Owner, I want reference removal under my control, so that no installed plugin is automatically deleted.
66. As an Owner, I want demo Skill, MCP, Command hook and Tool rule flows verified locally and remotely, so that completion is demonstrated rather than inferred.
67. As an Owner, I want explicit deferred tickets, so that release boundaries do not silently conceal missing capabilities.

## Implementation Decisions

- Respect the accepted ADRs and glossary. Build on the planned feature branch; keep the baseline release separate from uncommitted prototype work. Prototype ownership-based persistence and the vendored Skills runtime are not the accepted architecture; reuse only validated behavior/tests.
- Ship one versioned plugin with isolated, independently enabled modules, shared native admission/presentation and clear runtime disposal. Retain existing preferences and native read-page behavior. Use release-candidate versions, per-feature CHANGELOG entries, version tags and prereleases; never describe unverified features as working.
- Use public DSH APIs only. Do not patch the host, replace the running GUI server, edit generated handoff configuration or depend on unsupported private interception.
- Provide owner-admitted native Fetch JSON operations under the Majed API namespace. Exercise actual local and paired-remote admission; custom headers or origin checks alone are not authentication. Preserve authorization even where a proxy rewrites headers. Use no-store responses, bounded inputs and safe error codes.
- Keep MCP definitions and Majed runtime state in private storage with atomic writes, request-time reads, serialized/conflict-safe mutations and failure-safe recovery. Do not revive profile-configuration ownership edits or mutate another plugin's store. Per-server official-client fibers isolate connection lifecycle and probes. Distinguish saved configuration, activation failure and verified connectivity.
- Never return secret values in snapshots, logs or evidence. Preserve unrelated configuration and explicit unchanged/replace/remove credential semantics. Private on-disk permissions are not encryption or protection against the same OS user. Stdio servers execute as the DSH OS user; activating or testing one is code execution, not passive validation.
- Rewrite basic Skills management natively using upstream behavior as an oracle. Preserve Unicode names, source precedence, model/user invocation metadata, safe scope resolution and reversible removal. Reject traversal and unintended symlink/external-root mutations. Use separate identifiers from the standalone runtime.
- Keep compatible project/user Command hook definitions and separate Majed Approval state; import no old Approvals. Baseline command lifecycle coverage is SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, PermissionRequest, Stop and PostCompact. Verify exact host mappings; observe-only SessionEnd and subagent extensions remain deferred.
- Bind Approval to a server-issued single-use nonce, reviewed normalized content, canonical scope/cwd and watched-content fingerprint. Verify the typed phrase server-side, recheck after queue waits and before execution, and record trusted local/remote provenance and time. Do not infer provenance from an untrusted client field. If a public transport cannot establish provenance, expose that limitation before implementation rather than invent it.
- Deliver event JSON through stdin only; bound concurrency, queues, execution time and output, support cancellation/cleanup and prevent recursion. Commands run on the host as its OS user, not in a sandbox. Commands and Tool rules may restrict but never grant authority over native guards. Define blocking versus observational failures from the reference event contract.
- Integrate pinned, attributed subscription source and relevant upstream tests rather than rewrite provider protocols. Verify source/version provenance and transitive notices; preserve a reviewable upstream-difference/update process. Reference version 0.9.9 is the researched baseline, not an unchecked claim of current upstream compatibility.
- Preserve the subscription Parity list: ChatGPT/Codex, Claude, Grok, GitHub Copilot and Antigravity authentication/refresh; aliases, defaults, independent accounts and existing direct pooling; discovered/static/manual catalogs and visibility; account-specific capabilities, effort defaults, context budgets and fast modes; usage windows and status; proxy controls, cache TTL and manual credit-reset workflow; search tools, image generation/edit references, video/polling/image-to-video, galleries and tool-policy history; protocol translation, streaming and attachment/replay isolation. Track acceptance per capability rather than treat a successful chat as full parity.
- Target compatible account storage with a single credential-refresh writer, preserving public identities and history. Operational account-store reads, changes, backup/rollback and Cutover require separate approval. Use synthetic state before that gate; normal module startup may refresh credentials and is not a harmless metadata read. If compatibility fails, ask before migration or reauthentication.
- Advertise a genuine Auto catalog identity; never inject a fake picker option or persist transient route choices as global defaults. Verify coherent model-specific prompt assembly, prepared capabilities, effort and serving route through public seams before shipping.
- Each Auto candidate is an explicitly enrolled provider/account/model with priority, default effort and Smart-permitted efforts. Auto chat/opted-in child enrollment is separate from manual pooling and media/search scheduling; preserve those behaviors. Login or catalog updates never imply new membership.
- Filter locally against request requirements, permissions, explicit effort, context/output limits, tools and images before selecting. Advertise conservative truthful capabilities. Never delete history/images, silently reduce explicit effort or broaden membership to make a request fit. If no candidate qualifies, stop clearly.
- Default Auto uses priority with session stickiness. A recovered higher priority does not displace a healthy current route. Strategy/default-priority edits affect new sessions; an explicit reapply action updates an existing session. Removal/disabling forbids new dispatches through a candidate in every session, including revalidation after asynchronous selection. Do not secretly cancel/replay in-flight work. Manual model selection exits Auto.
- Actual provider failures and known reset information govern deterministic scoped cooldowns; cancellation and incompatible input are not account failures. The 95% usage level is advisory; unknown telemetry remains eligible if otherwise authorized. Preserve account-wide versus model-wide health scope, and distinguish actual provider reset from locally estimated cooldown.
- Default to at most three distinct candidate attempts before output in an Auto failover cycle. Share enforcement across owned dispatch, nested pools and outer host retry so layering cannot multiply that budget. Preserve bounded authentication-refresh behavior explicitly in attempt accounting/evidence. No hours-long automatic waiting; report exhaustion with the actual failure category and earliest known retry time, or unknown status.
- Failover stops at the first non-usage stream chunk, including reasoning or tool fragments. No response stitching, hidden partial replays or resend of side-effecting tools/media. Surface a failed partial attempt and require a visible recovery boundary; preserve native tool-commit rules, replay isolation, iterator closure and cancellation. Verify outer host-retry interactions rather than infer them from provider-pool tests.
- Smart Auto is optional and independent of deterministic execution. It chooses a locally eligible closed model/effort tuple by task suitability, using priority among suitable alternatives; validate membership, current policy generation and availability again before applying. Invalid, stale, unsupported, abstaining or unavailable judgments fall back to authorized priority, never broader permissions.
- Judge only at the initial session choice or explicit re-evaluation/current-route unavailability, not on every message/tool call. One request per selection decision, default three-second deadline, no automatic judgment retry for that decision; tie cancellation to the owning operation and never route the judge through Auto recursively.
- Majed owns separate System One/Decisions protocol-explicit settings and credentials entered through secure application settings, never chat/logs or another plugin's private state. Do not conflate a base root with a full Decisions endpoint. Preserve the existing Jev tools and avoid duplicate Skill suggestions.
- Require disclosure consent and allow per-session Smart disabling. Send only a bounded current-task description, opaque candidate identifiers and capability metadata, excluding account/file names, full history, secrets and MCP values. Explain residual sensitive-text risk; data minimization is not a promise of service-side zero retention.
- Default judgment cap is 20 requests per day across Majed, configurable. Three consecutive judgment failures suspend Smart for five minutes with visible priority fallback; exhausted daily cap uses priority for the rest of that day. Bound counters coherently across concurrent sessions. This is not a monetary cap. Preserve available actual cost/model metadata without invented free-text judge explanations or treating probabilities as calibrated accuracy.
- Keep local selection/fallback/latency/available-cost metadata for seven days with manual deletion; persist neither task description nor raw judgment response. Show final applied route/effort and fallback reason, including divergence from a Shadow proposal.
- Child Auto is independently opted in only through a verified public pre-start route/effort seam and supported backend capabilities. Explicit child overrides and native permission, preset, depth and concurrency ownership win. Do not promise universal external-backend interception; surface an unsupported seam as a decision gate.
- Capability recommendations are advisory over the current authorized agent-visible inventory. Never install Skills, start/enable MCP servers, change credentials, approve Hooks, bypass disabled tools or dynamically reduce exposure as a side effect of judgment. Coordinate rather than duplicate existing Jev Skill advice.
- Use native Settings primitives and design tokens, Arabic/English locales and RTL. No hard-coded typography/colors or important overrides without a documented host limitation. Match existing font customization rather than copying reference CSS.
- Keep integrated and reference registrations mutually exclusive: no duplicate provider/tool/route/slot identities, hook runners or refresh writers. Cutover is Owner-approved, backed up and reversible with in-flight work drained and rollback tested. The Owner decides reference deletion; never uninstall automatically.

### Owner scope dispositions — 2026-10-22

- **OPS-03 / T17:** Do not copy the reference's process-global connection timing mutation. Use a module-scoped equivalent only if supported public APIs allow it; record any remaining timing deviation explicitly. This does not defer proxy support or account failover.
- **SK-17 / D02:** Local-directory Skill import and arbitrary-directory browsing are explicitly deferred from the first release. Basic project/user inventory, details, invocation toggles, creation and trash/restore remain required.
- **HK-04 / T09 and T28M:** Manual re-addition of legacy profile Hook definitions into supported project/user definitions is accepted. Do not automatically read/import profile definitions or transfer old Approvals. Commands still require review and fresh exact-content Approval before execution.

These decisions resolve scope mapping only; they grant no installed-state access, Cutover, command execution or live-verification permission.

## Testing Decisions

Expanded testing seams approved by the Owner on 2026-10-22. Test observable contracts at the highest practical seam, not helper structure. These are accepted planned tests, not successful results.

- **Primary management seam:** real native Fetch operations backed by actual services and isolated temporary home/project storage. Cover owner/non-owner admission, local/remote transport semantics, malicious input, conflict/corruption safety, restart persistence, redaction, secret round-trip, scope boundaries, Approval staleness/replay and Skill trash/restore. A fake callback route does not prove real authentication.
- **Runtime execution seam:** real public Cordis/plugin and LLM registration, native request/stream and supported child-admission boundaries, with synthetic account stores and controlled provider transports/clocks. Exercise prompt/capability/prepared-call coherence, serving-route identity, membership revocation, finite cross-layer attempts, replay isolation, reset scopes, partial reasoning/text/tool boundaries, cancellation and cleanup. Keep actual native guard/ToolRuntime coverage distinct from registry-only doubles.
- **Protocol fixtures:** real official-client MCP handshake/call/teardown against controlled stdio and HTTP fixtures; harmless approved hook commands; pinned upstream subscription characterization and mocked OAuth/catalog/refresh/wire/media responses. Fixtures never use real accounts or billable endpoints. Existing MCP/runtime tests are prior art, not proof of the revised architecture.
- **Judgment at the same runtime seam:** fake System One/Decisions responses, injected clock/cancellation and countable transport. Assert valid tuple selection, invalid/stale response fallback, privacy payload, three-second deadline, one request per decision, daily cap, circuit breaker, concurrent accounting, seven-day deletion, Shadow non-application and no recursive routing. Count actual dispatches rather than only inspecting settings.
- **UI and real remote admission:** actual client bundle/native picker and Settings flows; real or supported test-native owner/paired-remote admission, not only a proxy mock. Verify Arabic RTL/English, light/dark, font sizes 14/18, keyboard/scroll and truthful saved-versus-running states. Use the existing appearance and remote test patterns as regression seeds, not visual evidence by themselves.
- **Live gates:** with separate approval for installed-state/account access and consumption, verify module Cutover/rollback and demo Skill/MCP/Command hook/Tool rule after a full desktop restart, then via remote GUI including command Approval. Verify direct/pinned subscription capabilities and Auto against the Parity list; do not mark untested provider/media capabilities as passing. Use redacted evidence and record failures as Known issues.
- **Smart evaluation gate:** agree task set and success criteria before live optional Shadow comparison, then require Owner approval for limited applied Smart. No paid/subscription inference is authorized merely by this specification. Fixture success is not a claim of judgment quality or service availability.
- Preserve appearance, classification and native read-page regressions, and make the actual package test command include newly accepted suites. Old historical totals do not establish current baseline coverage. Each user-visible slice adds an accurate CHANGELOG entry; live claims require automated plus desktop plus remote evidence.

## Out of Scope

- Skills repositories, catalogs, uploads, local-directory import/arbitrary-directory browsing and self-updater in the first release; track each explicitly.
- MCP per-tool restrictions in the first release.
- Observe-only SessionEnd/subagent Hook event extensions in the first release.
- Unrestricted arbitrary-provider routing, implicit account enrollment, universal external-subagent interception and host patches.
- Dynamic Skill/MCP exposure reduction, automatic installation/activation/permission changes, Hook auto-approval and duplicated Jev Skill advice.
- Monetary spend guarantees from request caps, judgment confidence interpreted as calibrated accuracy, promises of zero service-side retention or claims that the user's rate-limit failure is already diagnosed/fixed.
- Automatic state migration, credential-store access, paid/live inference, reference deletion, imported Hook Approvals or simultaneous reference/replacement owners.
- Stable release publication or claims of completed local/remote parity before evidence exists.

## Further Notes

The Owner's 2026-10-22 approval covers the final 34 execution slices, 10 deferred tickets, dependency graph, release boundary and expanded testing seams. The execution plan uses T01, T02A–T02D, T03–T27, T28M, T28S, T29 and T30; deferred follow-ups use D01–D10. These are local plan identifiers, not GitHub issue numbers. Publish this standalone expanded specification as a NEW ready-for-agent issue referencing [the original Manager specification, issue #1](https://github.com/majedsiefalnasr/dsh-majed/issues/1), which remains an open historical scope baseline. Do not edit, replace or close #1. Execution and deferred tickets belong under the new expanded issue, with the approved native sub-issue/blocking graph where available; deferred tickets are not first-release implementation commitments. This document records publication consent and readiness only; preparing it does not itself perform any GitHub write.

The approved first release includes independently enabled Skills, MCP and Hooks Managers, integrated subscription parity, deterministic Auto, separately opted-in Smart Auto, independently opted-in supported local child routing and advisory relevance over already authorized capabilities. Smart credentials, consent, availability or evaluation approval are not prerequisites for deterministic Auto or manual routes. Deferred scope remains explicit: D01 Skills repository/catalog installation; D02 uploads, categories, extended source surfaces and Owner-deferred local-directory import/browse; D03 self-update integration; D04 MCP per-tool restrictions; D05 MCP import/export and legacy ingest/handoff alternatives; D06 observe-only lifecycle extensions; D07 additional child backends; D08 dynamic capability exposure reduction; D09 advanced Auto scheduling and broader Smart rollout; D10 Owner-controlled Reference removal and stable promotion. Any deferred capability the Owner still needs must be implemented or explicitly accepted as deferred before affected Reference removal; silence is not acceptance.

Source-level extension research establishes candidate seams, not proven exact-host runtime/API compatibility. T02A–T02D are independent stop-and-report feasibility gates after T01: T02A proves native management admission and trusted local/remote Command hook Approval provenance; T02B proves native Auto metadata, effort, prompt and prepared-call coherence; T02C proves one bounded host/provider retry contract and partial-output boundary; T02D proves supported public child pre-start selection with native authority intact. T04 source/parity work can proceed independently after T01; T03 waits only for T02A. A failed proof pauses the affected dependent path for an Owner scope decision, not unrelated gates. Neither approval nor source citations establish successful compatibility, and unsupported public seams must not be replaced with host patches or private interception.

Keep the approved graph's readiness and evidence gates distinct: Manager preparation/live acceptance (T28M/T29) and subscription preparation/live acceptance (T28S/T30) are independently prepared, not a single serial Cutover. T26 depends on the shared optional judgment contract, not Smart activation. T27 advisory coverage is needed to close combined T30 acceptance, not to begin separately approved subscription/deterministic Auto evidence sessions once their own prerequisites pass. Required missing parity blocks actual Cutover or removal; preparation may record an explicit pending disposition. Planned tests and fixture success are not desktop/remote evidence or judgment-quality results.

Compatible state reuse is a design target, not permission to read it now. Publication approval does not authorize implementation, operational account-store access, credential import/login, protected backup, host restart, Reference deactivation, Cutover, live provider/judgment calls, paid or capacity-consuming Shadow evaluation, limited Smart activation, Reference removal or stable promotion. Each operation retains its separate execution-point consent and evidence gate; the Owner alone removes Reference plugins. Agree task sets, provider coverage, budgets, privacy rules, success/rollback criteria and thresholds before live evaluation, not afterward to justify a result. No such operation or GitHub write is performed by this documentation update.
