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
- If a route is unavailable or rate-limited, try another suitable authorized model rather than repeatedly retrying it or increasing concurrency. Report a blocker if no suitable route works.

### Owner-listed model candidates

Availability and pricing must be checked at execution time. This list is not a cost ranking.

- ChatGPT (Codex): GPT-6.1-Sol, GPT-6-Astra, GPT-6-Luna, GPT-5.6-Terra.
- opencode2dsh: beam-free, big-pickle, deepseek-v4.1-flash-free, flint-40b-free, glm-5.3-flash-free, mimo-v2.6-flash-free, nemotron-3.5-lightning-free, nemotron-3.5-super-vl-free.
- openrouter: NVIDIA: Nemotron 3 Super (tree); NVIDIA: Nemotron 3 Ultra (free). The first label is preserved as supplied; resolve its exact catalog identity before use.

## Safety and acceptance

Preserve existing workspace edits and use isolated worktrees for implementation candidates. Merge only reviewed, verified changes. Fixture success does not establish desktop/paired-remote/live parity. Installed state, real accounts, host restart, Cutover, reference removal and live/paid evaluation retain their separate approval requirements. Model-routing permission does not authorize changing installed model configuration or product Smart/Auto activation.
