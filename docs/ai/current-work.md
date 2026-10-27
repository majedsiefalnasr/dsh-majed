# Current work

Updated: 2026-10-27. This is the resume entry point, not a feature specification.

## Owner decisions

- The Owner replaced autonomous feature implementation with a checkpoint, inventory and replanning sequence; approved the revised order and evidence distinctions, then requested durable operating rules.
- External plugins supply implementation examples only. Majed must not require them at runtime.
- Preserve and push project work after content review, separating integration, candidate and WIP status. Backup is not acceptance or permission to merge.
- The historical Codex-first implementation objective and old ticket frontier do not authorize resuming implementation during this reset.
- The Owner requested reusable rules for future additions, improvements and removals, with skill routing adapted from `/ask-matt` and an explicit final `/implement` or `/implement-spec` stage. The current reset still follows the full six-stage route; shorter routes apply only when separately agreed for later bounded work.

## Current phase: Checkpoint

**Feature implementation is frozen.** The operating sequence is approved; the revised feature design, specification, test seams and ticket breakdown are not yet approved.

Last inspected integration: `feat/managers` at `c176222` in `dsh-majed`. The checkout has pre-existing modified and untracked project documents and an issue-context export script. Other local branches/worktrees include dormant or unmerged candidates. Re-inspect status before changing or publishing anything. No push was performed as part of creating these rules.

### Completed work contract: general operating rules

- Outcome: generalize the operating policy for future additions, improvements, removals and maintenance; ground skill routing in `/ask-matt` and the individual skill instructions, and explicitly distinguish `/implement` from `/implement-spec`.
- Acceptance: repository instructions point to both documents; existing execution instructions yield to the phase gate; original edits outside the targeted policy changes remain intact; diff and link checks pass.
- Write scope: `AGENTS.md`, `docs/ai/rules/execution-policy.md`, `docs/ai/rules/scope-control.md`, this file.
- Verification: targeted documentation diff, relative-link resolution, whitespace and required-gate checks. No product/runtime tests needed for documentation-only changes.
- Investigation budget: at most two failed checks or 20 minutes, whichever comes first.
- Stop condition: durable rules verified; continue only with checkpoint preservation, not feature implementation.

### Active work contract: checkpoint preservation

- Outcome: preserve reviewed project branches, original WIP and operating rules before inventory, as reaffirmed by the Owner on 2026-10-27.
- Acceptance: every local branch/worktree accounted for; tracked/untracked changes reviewed for private/transient material; rules committed distinctly; reviewed refs pushed non-destructively and remote SHAs verified; exclusions and remaining unpushed material recorded. Backup is not feature acceptance.
- Write scope: checkpoint documentation, policy commit, scoped WIP snapshot commits if content is safe, and non-destructive Git refs on the approved project remote. No product implementation, candidate merge, worktree deletion, installed-state change or issue mutation.
- Verification: Git status/diffs and ref inventories, content review, remote ref comparison and preservation fingerprints. No product execution required for checkpointing.
- Investigation budget: two failed checks or 20 minutes for any specific blocker; normal planned audit is not diagnostic retrying.
- Stop condition: checkpoint ledger reconciled and remote preservation verified; proceed to feature inventory only afterward.

### Next allowed action

Audit every project worktree's tracked/untracked changes and local refs; review checkpoint content for private and transient material; preserve approved work and push non-destructively; verify remote SHAs and record exclusions. Then produce the evidence-based feature inventory before design questions. No new feature, test infrastructure, candidate integration, tracker mutation or installed-state changes are authorized by this step.

## Following gates

Checkpoint preservation/push -> full feature inventory -> Owner design discussion (`/grill-with-docs`) -> specification with confirmed seams (`/to-spec`) -> Owner-approved vertical ticket breakdown and tracker reconciliation (`/to-tickets`) -> implementation with `/implement` per agreed task/ticket or `/implement-spec` for the approved specification graph, including TDD and Standards/Spec review. See [scope control](rules/scope-control.md). No future design, seam or ticket approval is implied by approval of this sequence.

## Deferred decisions

- Feature priorities, exact scope and changes to existing tickets: decide after the inventory.
- Dormant/unmerged candidate disposition: preserve first; evaluate against the revised scope later.
- Unmet environment/live/paired acceptance: retain its actual status; do not silently convert deferral into a pass.

## Resume snapshot

- Last completed action: audited all 29 worktrees and 59 local branches for checkpoint preservation. Identified 29 files to preserve (23 integration documents/policies/script, four R11 candidate changes, two historical browser reports) and 416 local-only paths to exclude. Existing unpublished history: 750 text blobs, no matches in the targeted credential-pattern scan. Pending files: no pattern matches; whitespace checks pass. Pattern scanning supplements content review and does not guarantee secret absence. No product tests were run.
- Active implementation: none; feature work remains frozen during Checkpoint.
- Remaining work, in order: reviewed checkpoint preservation/push; full feature inventory; design agreement; specification and confirmed seams; approved ticket reconciliation; implementation through the selected skill.
- Waiting decisions: revised feature scope, test seams and ticket breakdown at their later gates. No new permission is needed to start the already approved checkpoint audit.
- Repository/publication state: reusable rules committed on `feat/managers` as `89e3247`. Three separate WIP snapshot refs created and hash-verified without changing original WIP or its index: `bef6b9c` (planning), `6d5084d` (historical reports), `d368919` (R11 native-switch red). [Checkpoint evidence](../research/checkpoint-preservation-2026-10-27.md) and [ref ledger](../research/checkpoint-refs-2026-10-27.json) record all refs and exclusions. Remote currently has only `main` at `d6fe0e3`; publication/readback are pending. Remote `main` will remain untouched; local `main` is preserved under a checkpoint name.
- Next allowed action: the checkpoint audit described above, not feature implementation.

## Latest verification

Generalized policy reviewed against the actual `/ask-matt`, `/grill-with-docs`, `/to-spec`, `/to-tickets`, `/implement`, `/implement-spec`, `/tdd` and `/code-review` instructions. Required-text, link and whitespace checks passed. Commit `89e3247` contains the rules; snapshot blob hashes match the original audit. No product code was changed, no product tests were run and no feature acceptance is claimed. The R11 failing fixture is preserved separately, not merged. Remote preservation verification is the remaining checkpoint gate.
