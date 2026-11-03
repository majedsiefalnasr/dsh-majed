# Scope control

Owner-approved operating agreement, generalized 2026-10-27. Applies to all future project additions, improvements, removals, bug fixes, refactors and maintenance, for Lead and delegated agents. Follow higher-priority instructions; this is repository policy, not a security sandbox. Current priorities, freezes and approvals belong in [current work](../current-work.md), not in these reusable rules.

## Entry gate

Before starting work, resuming a session or goal, or delegating: read this policy and current work. Match the action to the recorded phase and Owner-approved outcome. Missing, contradictory or stale state means reconcile evidence first; it does not authorize implementation. A generic continuation or an old automatic goal never overrides a newer freeze or phase gate.

For each task, record a short work contract: approved outcome/ticket, acceptance criterion, allowed write scope, verification method, investigation budget and stop condition. Keep one active implementation task by default. Delegates receive the contract and policy pointers, and return evidence and residual gaps rather than expanding their remit. Use [execution policy](execution-policy.md) for model selection, concurrency and implementation mechanics.

## Route by scope, using `/ask-matt`

Use `/ask-matt` as the flow router, not as a replacement for individual skill instructions. Read the selected skill's `SKILL.md` before describing it, using it or proposing to skip it. If unavailable, report that and agree a fallback rather than inventing its behavior. The sources below were read when establishing this policy; reload their current versions when applying them.

Choose and record the route before implementation:

- **New or changed behavior needing design:** `/grill-with-docs`, which invokes `/grilling` and `/domain-modeling`, resolves decisions and records settled domain vocabulary and qualifying ADRs. Obtain shared understanding before building. Additions, improvements and removals all need explicit intended behavior; a removal must address affected users, data and compatibility.
- **Multi-session scope:** `/to-spec` synthesizes the agreed conversation and repository evidence; it is not a second interview. Confirm the highest existing behavioral test seams before publishing the specification. Then `/to-tickets` proposes independently verifiable vertical slices and genuine blocking edges, asks for approval, and publishes the approved graph. Work only its ready frontier.
- **Bounded, agreed task or single ticket:** `/implement` can build it in the same session without manufacturing a large spec and ticket graph. If supplied a ticket, fetch it and state its title first. Record why the bounded route is sufficient and obtain approval if this would skip an already agreed phase; never silently skip a phase in an active plan.
- **Execution choice for an approved spec and tickets:** use `/implement` per ticket, or `/implement-spec` to orchestrate the whole dependency graph onto one integration branch. The latter requires associated tickets, not merely a document called a spec. Its implementers use isolated branches/worktrees based on integration and incorporate the integration tip before reporting; merge through its merger step, review the integration branch, and resolve work via the configured tracker. Apply the Owner's concurrency policy rather than automatically maximizing parallelism. Preserve original/dormant work during any skill-requested reset or cleanup.

`/implement` calls `/tdd` where possible at pre-agreed seams, performs regular focused tests and applicable typechecking, runs the full suite at the end, calls `/code-review`, and commits its scoped work to the current branch. `/implement-spec` has implementers drive `/tdd` and closes with `/code-review` over integration. Both review axes, Standards and Spec, remain distinct. Pin the review baseline and specification source; comply with the skill's independent review procedure. Fixture production is not user-visible delivery.

Keep design, specification and ticket decisions together where practicable. At a session/context boundary, preserve their authoritative sources, approved decisions and unresolved questions in current work; prefer a fresh context per independently worked ticket. This is continuity guidance, not permission to override harness context-management requirements.

## Reusable delivery gates

Use these gates for a full planning/replanning cycle. For a bounded task, explicitly record the approved shorter route above. Scale the inventory and preservation effort to the change; the current reset's full-repository audit is not mandatory for every small future fix.

1. **Checkpoint:** inspect the relevant branches/worktrees and original edits. Review tracked/untracked content for private or temporary material; preserve integration, candidate and WIP status distinctly. Push only with Owner authorization, non-destructively, and verify remote SHAs. Record exclusions and unpushed work. Backup neither merges nor accepts a candidate. Before destructive removals, agree preservation/rollback separately.
2. **Feature inventory:** establish the affected capability's actual state, usage, activation, tested revision/environment/scenario, evidence and known gaps. Distinguish implemented, controlled-test verified, installed-use verified, dormant, incomplete and verification-deferred. Use a full product inventory for broad replanning. Avoid absolute claims such as problem-free; test counts alone do not establish acceptance.
3. **Design:** run `/grill-with-docs` against that evidence to resolve behavior, priorities, boundaries, exclusions and acceptance. Record Owner agreement. Fact-finding is the agent's job; decisions are the Owner's.
4. **Specification:** for multi-session work, run `/to-spec` to capture the agreed problem, solution, user stories, implementation decisions, testing decisions and exclusions. Confirm test seams before publication. Document exact intended behavior and relevant reference sources, not speculative features or volatile code locations.
5. **Tickets:** run `/to-tickets` to propose complete vertical slices, deliverables and blockers. Obtain Owner approval before publishing or reconciling existing tickets. Preserve identifiers, history and explicit deferrals; avoid duplicates and unnecessary re-triage of generated ready tickets. Parent issue changes require specific Owner authorization; the skill's default is to leave parents unchanged.
6. **Implementation and acceptance:** after scope, seams and any required ticket breakdown are approved, execute `/implement` for the agreed task/ticket or `/implement-spec` for the approved specification graph. Apply TDD, review, relevant regression proof and tracker completion rules. Record demonstrated behavior, limitations and remaining operational approvals before claiming done.

Approval of this operating sequence is not approval of future designs, test seams or ticket breakdowns. Record each later approval at its own gate. Ask only for an actual missing decision or permission, not repeated confirmation of an already authorized action.

## Scope fence

Every implementation, investigation, refactor and test must serve an approved acceptance criterion. Put unrelated improvements in a deferred list with their rationale, then continue the agreed task. A blocker permits diagnosis within the task budget, not a new infrastructure project or a substitute feature. Public API limitations require an explicit disposition: supported alternative, Owner-approved deferral, or stop for a decision; they do not authorize changing the host or inventing new product behavior.

Set the investigation budget in the work contract before starting. If the Owner has not supplied one, use a default cap of two failed diagnostic/validation attempts or 20 minutes of investigation, whichever comes first. This caps investigation, not normal planned test execution. Count equivalent retries across delegates and continuation rounds; changing models does not reset the budget. At the cap, report the concrete failure, acceptance impact and smallest options, and request a decision before extending scope or budget. Never bypass a safety control or claim acceptance to escape a blocked test.

## Reference sources

External plugins are implementation references, never required runtime companions for Majed. Use DSH public extension points and existing Majed capabilities before duplicating host behavior. Ordinary approved libraries/SDKs are distinct from requiring another DSH plugin; dependency and licensing decisions must still be explicit.

For each feature's prior art, record the URL, pinned version/commit, relevant behavior or algorithm, what is adapted versus implemented independently, license/attribution obligations and why the source is relevant. A link alone is not a design decision. Research supports the approved outcome; it is not an invitation to copy every source feature or redesign unrelated systems. For independently designed behavior with no borrowed implementation, record that instead of fabricating a reference.

## Evidence and handoff

Before marking a task done, verify its acceptance criterion at the declared seam and revision; report the environment, evidence, limitations and remaining approvals. Controlled fixtures, installed desktop use, paired-remote use and live-provider behavior are separate claims. Preserve separate permissions for operational accounts, installed changes/restart, live/paid inference and Cutover.

**State update is part of task completion.** Update current work after every executed task or implementation slice, including failed, interrupted and partially completed attempts; after each checkpoint, phase transition, blocker or Owner decision; and before a final progress report or session handoff. A task is not complete until its state is recorded. The Lead reconciles delegated results before recording them; a worker's completion message alone is not acceptance.

Each update records: last completed action and evidence; current phase and active/incomplete work; remaining work in priority/dependency order; blockers and required approvals; branch/worktree and commit where relevant, with uncommitted/unmerged/unpushed status; consumed investigation budget when applicable; and the exact next allowed action. Link detailed evidence at its source rather than copying logs. Keep this as current state, not an ever-growing session diary.

On any continuation request, read current work first, then reconcile it with actual repository status, relevant tracker state and outstanding jobs before acting. If an interruption left the record stale, repair it from evidence and explicitly retain unknowns; never infer completion or restart already completed work solely from conversation memory. A future session must be able to determine where work stopped, what remains and what it may do without reconstructing conversation history.

## Skill sources

Adapted from the locally installed skill instructions, read 2026-10-27. These are skill-document pointers, not runtime dependencies of the plugin; resolve the skill in the active environment if these installation paths differ.

- Router and main-flow branching: [ask-matt](</Users/majedsiefalnasr/.agents/skills/ask-matt/SKILL.md>).
- Design and publication: [grill-with-docs](</Users/majedsiefalnasr/.agents/skills/grill-with-docs/SKILL.md>), [to-spec](</Users/majedsiefalnasr/.agents/skills/to-spec/SKILL.md>), [to-tickets](</Users/majedsiefalnasr/.agents/skills/to-tickets/SKILL.md>).
- Execution choices: [implement](</Users/majedsiefalnasr/.agents/skills/implement/SKILL.md>), [implement-spec](</Users/majedsiefalnasr/.agents/skills/implement-spec/SKILL.md>).
- Behavioral testing and review: [tdd](</Users/majedsiefalnasr/.agents/skills/tdd/SKILL.md>), [code-review](</Users/majedsiefalnasr/.agents/skills/code-review/SKILL.md>).

The checkpoint/inventory gates, investigation cap, reference-plugin restriction and publication permissions are Owner project policy added around that skill flow, not requirements attributed to `/ask-matt` itself.
