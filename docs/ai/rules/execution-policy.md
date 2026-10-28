# Execution policy

Owner-confirmed policy, 2026-10-26; phase precedence clarified 2026-10-27. Read before resuming specification implementation or launching delegated work. [Scope control](scope-control.md) and [current work](../current-work.md) determine whether execution is authorized; the delivery instructions below apply only after their implementation gate opens.

## Delivery

- Select `/implement` for an approved bounded task or ticket; select `/implement-spec` when orchestrating an approved specification and its authoritative GitHub ticket graph. Follow the routing gates in scope control. Current feature priorities belong in current work, not in this general policy. Deliver approved end-to-end behavior rather than treating isolated fixtures as delivered workflows.
- Drive implementation slices with `/tdd`; review Standards and Spec with `/code-review` before integration. Load the relevant skill instructions before applying them.
- Preserve the full required scope and explicit deferrals. Record missing implementation, failed acceptance, unsupported public seams and operational approval gates separately.

## Delegation and cost

- Use the explicitly authorized `workflow` tool for delegated execution when its provider/model selection is needed. It is an execution mechanism, not a replacement for the selected `/implement` or `/implement-spec` process.
- Default to one active workflow with one delegated task. A second independent task requires a concrete benefit; keep concurrency minimal to avoid provider limits. Avoid nested delegation and duplicate work.
- Select the lowest-cost available model likely to meet the task's risk and acceptance criteria reliably. Use economical routes for bounded lookup or straightforward changes; reserve stronger routes for ambiguous native contracts, authentication, permissions, concurrency and difficult reviews. Verify output and escalate based on evidence.
- Pass provider/model explicitly when supported. Verify route identifiers against the actual available catalog; display names are not guaranteed API identifiers. Record selection and fallback honestly; infer neither price nor quality from a name.
- On an explicit provider rate/quota limit, continue via a suitable authorized model on a different provider, without asking again or increasing concurrency. A shared free-tier limit excludes that provider's other free models for this run; switch providers rather than rotating within the same quota. Preserve the failure reason even when supplied by the Owner because the workflow wrapper exposed only `null`. Model fallback does not authorize direct-subagent substitution, configuration changes or investigation beyond its budget. Report a blocker if no suitable authorized route works; do not treat provider limits as product acceptance failures.

### Owner-listed model candidates

Availability and pricing must be checked at execution time. This list is not a cost ranking.

- ChatGPT (Codex): GPT-6.1-Sol, GPT-6-Astra, GPT-6-Luna, GPT-5.6-Terra.
- Claude (Subscription): Claude Haiku 5.5, Claude Opus 5.5, Claude Sonnet 5.5.
- opencode2dsh: beam-free, big-pickle, deepseek-v4.1-flash-free, flint-40b-free, glm-5.3-flash-free, mimo-v2.6-flash-free, nemotron-3.5-lightning-free, nemotron-3.5-super-vl-free.
- OpenRouter: NVIDIA: Nemotron 3 Super (free); NVIDIA: Nemotron 3 Ultra (free). The Owner corrected the former `tree` transcription to `free`; resolve exact provider/model identifiers from the live catalog before use.

## Safety and acceptance

Preserve existing workspace edits and use isolated worktrees for implementation candidates. Merge only reviewed, verified changes. Fixture success does not establish desktop/paired-remote/live parity. Installed state, real accounts, host restart, Cutover, reference removal and live/paid evaluation retain their separate approval requirements. Model-routing permission does not authorize changing installed model configuration or product Smart/Auto activation.
