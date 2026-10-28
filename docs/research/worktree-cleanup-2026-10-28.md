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

## Protected directories and remaining work

- [Active integration](../../): original working files and shared dependencies retained.
- [Browser preflight](../../../dsh-majed-browser-preflight-retry/): untracked research and isolated runtime/private artifacts; retained without reading credentials.
- [R11 registry](../../../dsh-majed-r11-registry/): four modified source/research files; preserved checkpoint is not permission to discard them.
- [T02a scope](../../../dsh-majed-t02a-scope/): untracked source-inspection note retained.
- [Typography diagnosis](../../../dsh-majed-typography-diagnosis/): isolated runtime/private artifacts and untracked configuration; retained without reading credentials.
- Other unregistered fixture/dependency/reference/report directories: retained; names alone do not establish disposability.

Any later cleanup of protected directories requires content-safe disposition and explicit authority. This task is complete, not an implementation restart. No product tests were necessary or rerun for documentation and worktree housekeeping; historical test counts remain historical. Installed desktop, paired remote and live-provider acceptance are unchanged.
