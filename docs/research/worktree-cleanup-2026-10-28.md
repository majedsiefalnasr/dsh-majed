# Documentation publication and obsolete worktree cleanup

## Authority and boundary

Owner request: commit/push project documents and inspect/remove obsolete project folders. No feature implementation, installed-state changes, credential access, live providers or issue mutations. Keep all branches and checkpoint refs. A preserved candidate is not accepted or merged merely because its checkout is removed.

## Publication

Published `e278e79447cd22a9ffc77111698321f4268fb2fc` (`docs: publish approved scope and verified tracker plan`) non-forced to `origin/feat/managers`; `git ls-remote --heads origin` returned the exact local SHA before removal and during post-cleanup verification. The commit contains 27 documentation files (4,131 insertions, 33 deletions), including historical planning dependencies. The already reviewed Tool Rules source-disable commit `421e484` is an ancestor and was published with this branch, not newly implemented by this task. Legacy documents remain historical evidence; the current specification and Q138 publication report take precedence. The original untracked [export helper](../../scripts/export-manager-issue-context.py) remains outside these documentation commits and unchanged.

`origin/main` remains `d6fe0e33517003ec9837a72005788f2153d685bb`. No force push, main update, branch/tag removal or candidate merge occurred. This outcome ledger and the current-work update are a separate documentation-only follow-up to the published planning commit; verify that follow-up's exact SHA from the branch and remote rather than embedding a self-referential commit identifier here.

## Cleanup rule and proof

Removed only registered obsolete worktrees whose tracked/untracked status was clean, whose commit was reachable from an exact verified remote branch, whose ignored contents were reviewed generated dependencies/build caches or OS metadata, and which had no process CWD in the target/subtree. Each resolved absolute target was checked before `git worktree remove --force`; force permitted deletion of reviewed ignored artifacts only. Dependency symlinks were not followed. Every local branch/tag ref was identical before and after execution. Branches remain available for reconstruction with `git worktree add <new-directory> <branch>`; generated dependencies/build output may need regeneration.

The guarded removal command exited zero: **25 removed; four dirty retained; all local branch/tag refs unchanged**. A separate postcheck confirmed all 25 paths absent, all four retained directories present, shared `node_modules` intact, removed tips still reachable from verified remote branches and `main` unchanged. `git worktree list --porcelain` now contains the active integration and the four protected auxiliary worktrees only.

## Removed checkouts

These are historical removed paths, not links to existing files. All paths are relative to `/Users/majedsiefalnasr/Documents/Work/DeepSeek Harness/`.

- `dsh-codex-fixture`
- `dsh-codex-preferences-observations`
- `dsh-codex-retained-native`
- `dsh-codex-revocation`
- `dsh-fixture-refresh-reauth`
- `dsh-majed-disable-tool-rules`
- `dsh-majed-r01`
- `dsh-majed-r02`
- `dsh-majed-r09`
- `dsh-majed-r10`
- `dsh-majed-r10-pending-cancel`
- `dsh-majed-r11`
- `dsh-majed-r11-unicode`
- `dsh-majed-r12`
- `dsh-majed-r13`
- `dsh-majed-r14`
- `dsh-majed-r14-native-guard`
- `dsh-majed-r15`
- `dsh-majed-r15-late-response`
- `dsh-majed-refresh-snapshot`
- `dsh-majed-review-fixes`
- `dsh-majed-t02a-mounted-settings`
- `dsh-majed/.agents/worktrees/feat/r11-active-agent-policy`
- `dsh-r11-cold-preset`
- `dsh-r14-bounded-runner`

Per-target pre-removal `du -sk` readings totalled 802,708 KiB. This is not a measured free-space increase and is not presented as one.

## Final disposition of the four initially protected checkouts

The Owner subsequently approved preserving useful unique work and removing these four obsolete directories. Removed historical paths (relative to the same workspace root):

- `dsh-majed-browser-preflight-retry`: two research reports matched remote checkpoint `6d5084dbca76e1e963067ae819ba0cb60d1078cf` byte-for-byte. Reviewed startup handoff/launch/overlay preserved separately; extracted vendor copies and isolated private test profiles discarded without inspecting private contents.
- `dsh-majed-r11-registry`: all four modified files matched remote WIP checkpoint `d3689192a632567ba29bb073177360bb3689d2f6` byte-for-byte. Known failing native-switch regression preserved, not merged or accepted.
- `dsh-majed-t02a-scope`: original branch remotely preserved; the untracked 147,273-byte note is a reproducible native session-persistence source extraction, not authored analysis, and was discarded.
- `dsh-majed-typography-diagnosis`: branch remotely preserved; reviewed browser overlay preserved separately, vendor diagnosis assets/builds and obsolete isolated private test state discarded.

[Preservation record and manifest](cleanup-preserved-2026-10-28/README.md) identify the exact remote checkpoints and four reviewed nonprivate setup copies. Preservation commit `497df0287dff997fd54346c339d8f86a9a11390f` was pushed non-forced and exact-matched to `origin/feat/managers` before removal. No credential values, session bodies or private logs were read or published; filesystem deletion is not remote token revocation.

Process inspection initially required wider permission, granted for the exact read-only check. Four remaining directory holders were Git fsmonitor daemons, not test hosts; they were stopped through `git fsmonitor--daemon stop`. A redundant stop safely aborted the first deletion guard because the daemon was already absent; no deletion occurred on that failed guard. The corrected guard verified no target files open, exact absolute targets, remote preservation and byte hashes, then `git -c core.fsmonitor=false worktree remove --force` succeeded for each. No symlink target was removed.

Postchecks passed: all four paths absent, exactly one registered worktree (active integration), all local branch/tag refs unchanged by removal, shared dependencies and original untracked export helper unchanged. Combined with the first pass, 29 auxiliary worktrees were removed. Remote main remains `d6fe0e33517003ec9837a72005788f2153d685bb`. Other unregistered fixture/dependency/reference/report directories remain outside this approval.

This completes housekeeping, not an implementation restart. Product tests were not rerun; historical counts remain historical. Installed desktop, paired remote and live-provider acceptance are unchanged.
