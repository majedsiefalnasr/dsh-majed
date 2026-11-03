# Execution policy

Owner-confirmed policy, 2026-10-26; phase precedence clarified 2026-10-27; model candidates updated by the Owner 2026-10-28. Read before resuming specification implementation or launching delegated work. [Scope control](scope-control.md) and [current work](../current-work.md) determine whether execution is authorized; the delivery instructions below apply only after their implementation gate opens.

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

- **Push after every ticket closure:** once the Owner accepts a ticket and it is closed, push the integration branch with `git push origin HEAD:refs/heads/feat/subscriptions` (explicit refspec; never plain `git push`, never `main`) and verify with `git fetch` that the remote branch equals the local HEAD and `origin/main` is unchanged. Owner instruction 2026-10-30. Other pushes still need Owner approval.
- **Announce before every `workflow` run** (the only way to set a subagent's provider/model): tell the Owner, in the conversation language and in one or two plain sentences, which provider/model will run and why (task difficulty/risk versus cost). Do this before launching, every time, including fallback switches (state which model stopped and which replaces it).
- **Free first for simple work:** for simple, bounded, low-risk tasks (lookup, extraction, summaries, mechanical edits, first-pass reviews) prefer an available free model over a paid one to avoid needless cost. Escalate to paid only when the task needs it or evidence shows the free model is insufficient.
- **Sensitive work uses the strongest paid route** even if a free model might be acceptable: security, authentication/credentials, permissions, data-loss risk, final independent review and acceptance gates.
- **Fallback order is efficiency per cost, never list order.** When a model/provider stops (free quota exhausted, 5-hour or weekly limit, outage), move to the next best route by efficiency-per-cost for that task, then the next, and so on. Free-tier limits are per provider: do not rotate to another model of the same exhausted provider quota.

### Owner-listed model candidates

Owner list updated 2026-10-30. Display names are not API identifiers: resolve exact provider/model ids from the live catalog before every use, and check availability and limits at execution time. This list is **not** a cost or quality ranking; rank by efficiency per cost at selection time, based on evidence from the catalog and prior results, not on names.

Free:

- Google: Gemini 3.5 Flash, 3.6 Flash, 3.7 Flash, 3.8 Flash.
- NVIDIA: DeepSeek V4.1 Flash, Muse Glimmer 30B, Kimi K3, Llama 3.1 Nemotron 70B Instruct, Llama 3.1 Nemotron Ultra 253B, Nemotron 3 Super, Nemotron 3 Ultra 550B A55B, Nemotron 3.5 Lightning 30B A3B, GLM-5.3, GLM-5.3-Flash.
- OpenRouter: Poolside: Laguna S 2.1 (free); NVIDIA: Nemotron 3 Super (free), Nemotron 3 Ultra (free), Nemotron 3.5 Lightning (free).
- Google Antigravity: gemini-3-flash, gemini-3.1-flash-lite, gemini-3.1-flash-image (image model), claude-sonnet-4-6, gemini-2.5-flash-thinking, gemini-2.5-pro, gemini-2.5-flash-lite, gemini-2.5-flash, gemini-3.5-flash-lite, gpt-oss-120b-medium, claude-opus-4-6-thinking. Internal-looking ids (`chat_20706`, `tab_flash_lite_preview`, `tab_jump_flash_lite_preview`, `gemini-3.8-flash-tiered`) are not selected unless the live catalog shows them as chat-capable.

Paid:

- ChatGPT (Codex): GPT-6.1-Sol, GPT-6-Astra, GPT-6.1 Terra, GPT-6-Luna.
- Claude (Subscription): Claude Haiku 5.5, Claude Sonnet 5.5, Claude Opus 5.5.

The earlier opencode2dsh candidates are no longer listed by the Owner; use them only if the live catalog still offers them and the Owner has not removed them.

## Consolidated live acceptance

Owner instruction, 2026-10-31: schedule one consolidated Owner live-acceptance session at the end of each ticket, after implementation, all known fixes, independent review, automated tests, fresh-build comparison and package verification are complete. Prepare one concise checklist covering the ticket's functional acceptance criteria and prerequisites before requesting installation/live testing. Bundle interface, authentication, settings and permitted provider checks into that session rather than requesting piecemeal Owner trials. Keep installed-state and live/paid-operation approvals separate and explicit. If a real defect requires another session, explain the defect and rerun only affected checks after fixing and verifying it; do not promise that a single session can always suffice. A visibility check alone is not full ticket acceptance.

## Safety and acceptance

Preserve existing workspace edits and use isolated worktrees for implementation candidates. Merge only reviewed, verified changes. Fixture success does not establish desktop/paired-remote/live parity. Installed state, real accounts, host restart, Cutover, reference removal and live/paid evaluation retain their separate approval requirements. Model-routing permission does not authorize changing installed model configuration or product Smart/Auto activation.
