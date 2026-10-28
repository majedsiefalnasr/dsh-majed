# Documentation publication and obsolete worktree cleanup

## Authority and boundary

Owner request: commit/push project documents and inspect/remove obsolete project folders. No feature implementation, installed-state changes, credential access, live providers or issue mutations. Keep all branches and checkpoint refs. A preserved candidate is not accepted or merged merely because its checkout is removed.

## Publication

Pending: publish the reviewed current documentation plus its historical planning dependencies on `feat/managers`, non-forced, and verify the exact remote SHA. The already reviewed Tool Rules source-disable commit `421e484` is an ancestor of this integration branch and will be published with it, not newly implemented by this task. Legacy documents remain historical evidence; the current specification and Q138 publication report take precedence. Preserve the original untracked export script outside the documentation commit.

## Cleanup rule

Remove only registered obsolete worktrees whose tracked/untracked status is clean, whose commit is reachable from an exact verified remote branch, whose ignored contents are generated dependencies/build caches or OS metadata, and which are not in active use. Check each resolved absolute path before `git worktree remove --force`; force only permits deletion of those reviewed ignored artifacts. Do not follow dependency symlinks. Keep branches for reconstruction with `git worktree add <new-directory> <branch>`.

## Protected directories

- `dsh-majed`: active integration, original working files and shared dependencies.
- `dsh-majed-browser-preflight-retry`: untracked research and isolated runtime/private artifacts; retained without reading credentials.
- `dsh-majed-r11-registry`: four modified source/research files, preserved checkpoint but not silently discarded.
- `dsh-majed-t02a-scope`: untracked source-inspection note.
- `dsh-majed-typography-diagnosis`: isolated runtime/private artifacts and untracked configuration; retained without reading credentials.
- Other unregistered fixture/dependency/reference/report directories: retained; not assumed disposable from their names.

## Execution result

Pending. Initial inventory identified 25 clean obsolete worktrees and four dirty auxiliary worktrees. Final removal list, preserved refs and post-cleanup checks will be recorded only after execution. No product tests are necessary for documentation and worktree housekeeping; historical test counts remain historical.
