# Subscriptions and Auto mode: proposed scope

Status: the Owner accepted design decisions Q1–Q19 and subsequently approved the expanded specification, testing seams, 34 execution slices, 10 deferred follow-ups and GitHub publication on 2026-10-22. This research document remains design rationale; the expanded specification and publication ledger are the execution-plan references. Publication approval is not authorization for implementation, live account access, Cutover or paid evaluation.

## Owner request

Extend the planned Majed plugin before implementation with subscription management and an Auto model mode. The existing subscription plugin is useful, but work sometimes stops on a rate limit even when another subscription may be available. The Owner proposes replacing that plugin only after Majed covers its capabilities and has been verified.

Requested behavior:

- Manage the capabilities currently provided by dsh-plugin-subscriptions within Majed.
- Offer Auto in the normal model selector.
- Let the Owner explicitly include subscriptions in the Auto account pool and order their priority.
- Continue through eligible subscriptions when a rate limit blocks the current one, respecting reset availability.
- Optionally use a judgment model such as Jev to choose a model and reasoning effort for Auto mode.
- Use the same decision capability for subagent model and effort selection.
- Explore selecting relevant Skills and MCP capabilities for a task.
- Expose judgment-provider settings similar to the supplied screenshot: configured credential status, service endpoint and model identifier. Credentials must be entered only in a secure application setting, never requested in chat.

## Accepted design decisions — round one

The Owner accepted all six recommendations in the design interview:

- **Q1 — Integrated subscription parity:** retain pinned, attributed source and tests in an isolated module instead of rewriting OAuth/provider protocols. Include non-chat capabilities in parity. Keep the standalone reference until verified parity and safe rollback.
- **Q2 — Priority Auto:** explicitly opt account/model candidates in and order them. Start with the highest eligible priority; retain a healthy selected route within the session. Recovery of a higher priority does not automatically move an active session back.
- **Q3 — Optional Smart Auto:** deterministic Auto works without Jev. Smart Auto can select only locally valid model/effort candidates, yields to explicit manual choices, and falls back to Owner priority on judgment failure. Sending a minimal task summary to the judgment service requires explicit consent; no secrets or full conversation history.
- **Q4 — Bounded exhaustion and partial failures:** use finite cancellable attempts, then stop with a reason and the earliest known retry time. No automatic hours-long waits, stitched partial answers or invisible replays. A retried partial failure is a separate, visible attempt.
- **Q5 — Supported child routing only:** independently opt local child routing in where public APIs support pre-start model/effort selection; respect explicit overrides. No universal external-backend promise or host patch.
- **Q6 — Advisory capabilities first:** recommend only available, authorized Skills and MCP tools. Do not install, enable servers, grant permissions or approve hooks automatically. Dynamic exposure reduction remains deferred pending verified public semantics.

## Accepted design decisions — round two

The Owner accepted Q7–Q12:

- **Q7 — One native Auto entry:** expose Auto in the normal model picker; configure priority-based or Smart Auto in its settings. Priority-based is the default. Smart requires opt-in and task-summary consent. Preserve manual models and do not automatically change the global default.
- **Q8 — Suitability with sticky decisions:** Smart chooses a suitable model/effort within the approved set; priority breaks ties between suitable alternatives. Retain the initial decision within the session; re-evaluate only on an explicit request or when the current route is unavailable, not each message/tool step. If judgment fails, use the first suitable priority candidate. Re-evaluation does not authorize repeated judgment calls for the same failed decision.
- **Q9 — Separate enrollment domains:** Auto membership applies to chat and independently enabled child routing. Preserve existing direct-route pooling and image/video/search scheduling. Not enrolled in Auto does not mean forbidden for all other uses.
- **Q10 — Advisory usage:** 95% usage is a warning, not an automatic exclusion. Actual provider rejection and known reset information govern cooldowns. Missing usage telemetry does not itself disqualify an otherwise authorized candidate; display its unknown status.
- **Q11 — Independent routing judgment settings:** Majed owns a narrowly scoped routing configuration with explicit System One/Decisions protocol, service address and model. Credentials are entered only in secure application settings and never exposed in chat/logs. Do not read the existing Jev plugin's private credentials or duplicate its skill suggestions; preserve its tools.
- **Q12 — Initial finite defaults:** one judgment request per selection decision, a 3-second deadline and immediate deterministic fallback, with no automatic retry for that decision. Auto attempts at most three distinct account/model candidates before content starts, without repeating a candidate in that failover cycle. Limits are configurable and provisional pending measurement; they must not be multiplied by nested pools or host retry.

## Accepted design decisions — round three

The Owner accepted Q13–Q19:

- **Q13 — Explicit candidate identity:** each enrolled candidate identifies provider, account and model, its priority, default effort and Smart-permitted efforts. Login and catalog updates do not automatically enroll accounts or models.
- **Q14 — Compatibility before selection:** filter candidates by request requirements, including images, tools, explicit effort and context size, before priority or judgment. If none qualify, stop with a clear reason. Never silently remove history/images, reduce manually selected effort or expand membership. Initially advertise a conservative Auto capability envelope, accepting that some combinations will be unavailable.
- **Q15 — Session settings and revocation:** strategy/default-priority changes apply to new sessions; an explicit action applies them and reselects in an existing session. Removal or disabling blocks new requests through that candidate in all sessions. Do not invisibly replay or transfer an in-flight request; cancellation remains an explicit Owner action. Manual model selection exits Auto for that session.
- **Q16 — Minimized judgment and local metadata:** send a bounded task description from the current request, candidate capabilities and opaque identifiers, not account names, file names, full history or MCP tool values. Explain that the remaining task text may still be sensitive; allow per-session Smart disabling. Retain local selection/fallback reason, latency and available cost metadata for seven days, with manual deletion; retain neither task text nor raw judgment response.
- **Q17 — Additional judgment bounds:** default to 20 judgment requests per day across Majed, configurable. After three consecutive judgment failures, suspend Smart for five minutes and use priority with a visible notice. After the daily cap, use priority for the remainder of the day. A request-count limit is not a monetary guarantee; expose actual pricing/cost only when available.
- **Q18 — Compatible single-owner account state:** target the existing compatible account store instead of requiring every account to sign in again; require one active owner, a protected backup and tested rollback. Do not copy secrets into the project or expose them in the UI. This approves the design only: operational account-state access, changes and actual cutover require separate approval at that time. If compatibility fails, consult the Owner before migration or reauthentication.
- **Q19 — Evaluation before applying Smart:** automate failure, permission and compatibility tests, then offer opt-in Shadow evaluation over an agreed task set, recording but not applying judgment selections. Limited activation requires Owner approval and local/remote verification. Keep the standalone subscription plugin until parity and safe rollback are verified. Live service evaluation consumes subscription capacity or money and is not authorized automatically during research.

## Specification handoff boundaries

The interview's product decisions, expanded testing seams and ticket breakdown are approved for specification/ticket publication. Specification and tickets must make implementation details and evidence gates explicit rather than imply that public extension seams are already proven. In particular, verify native Auto capability/effort reporting, supported child pre-start routing, and a single bounded attempt budget across host/provider layers. Unsupported seams must be surfaced before narrowing the agreed behavior; never patch DSH or claim universal external-backend support.

Actual account-state access, cutover, live paid evaluation and reference-plugin removal remain separately gated. Shadow tasks and rollout success criteria must be agreed before that evaluation, not invented as evidence afterward.

## Research questions retained for traceability

- Existing account-pool failover versus a new cross-model routing feature: investigate before duplicating or replacing behavior.
- Retry eligibility before output, partial-stream handling, tool side effects, cancellation and bounded retries.
- Provider cooldown and Retry-After as deterministic runtime state, not model judgments or invented reset times.
- Manual model and effort overrides, per-account opt-in, cross-provider consent and routing transparency.
- A constrained judgment result over supported candidates, rather than arbitrary model names, efforts or permission changes.
- Judgment-service timeout, unavailable credentials, rate limit and malformed-response fallback without recursive routing.
- Data minimization for judgment requests and compatibility when changing model context limits or capabilities.
- Recommending or exposing already-authorized capabilities versus enabling servers, installing Skills, authorizing hooks or granting access. These must not be conflated.
- Replacement parity, licensing, rollback and preserving account state without running duplicate providers.

## Candidate acceptance scenarios

These scenarios translate the accepted decisions into candidate tests for the specification; they are not claims of current behavior or completed verification.

- Account A fails before output with a rate limit; an opted-in compatible account B succeeds, A respects the provider reset signal, and the UI explains the transition without exposing credentials.
- Account A fails after partial output or a tool-call fragment; do not silently concatenate B's response or replay side-effecting work. Surface a recoverable boundary instead.
- Every eligible account is unavailable; stop after bounded attempts, show the known earliest retry time, and never rotate indefinitely or circumvent an account restriction.
- The Owner selects a manual model or effort; an automatic judgment must not silently override that explicit selection.
- The judgment service is unavailable or returns an unsupported candidate; apply a documented deterministic fallback or stop, without recursively invoking Auto to choose the judge.
- Concurrent sessions see coherent cooldown state without treating a single request's cancellation as an account failure.
- Skills or MCP selection recommends an unavailable capability; do not install, enable, authenticate or grant permissions automatically.

## Research work

Completed research:

- [Subscription parity and Auto routing](./subscriptions-auto-routing.md): installed 0.9.9 already implements same-model account failover and optional heterogeneous tiers. Explicit Auto consent, native-picker identity, priority policy and observability are the new scope. Preserve all provider, account, media, attachment, tool-policy and proxy capabilities before replacement.
- [Jev routing feasibility](./jev-routing-feasibility.md): constrained choices over locally validated model/effort tuples are feasible. Main-route selection has public extension seams; universal subagent interception and dynamic MCP exposure remain unverified. The installed Jev backend appends `/v1/systemone`, so a full Decisions URL is not interchangeable with its base-root setting. No connection test or configuration change was performed.

These are source-level findings, not live feature verification. No actual rate-limit failure was diagnosed. All three rounds of design choices, including provisional numerical defaults, are accepted as recorded above. The original Manager specification issue is retained unchanged as historical scope; the separately approved expanded specification and published ticket map supersede the earlier draft handoff.
