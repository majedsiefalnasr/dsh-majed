# Owner-approved preservation checkpoint — 2026-10-27

## Purpose and acceptance boundary

Preserve existing work before the Owner's full feature inventory and redesign. Feature implementation remains frozen. Publication is backup, not feature acceptance, release, approval of historical planning documents or permission to merge candidates. No product tests, provider requests, host/browser launches, installed-state changes, tracker writes, candidate merges or cleanup are part of this checkpoint.

The reusable operating rules are committed separately as `89e32473b375b3246ad64984157f273aa0daf61e`. Product integration before that documentation commit is `c1762226dbf161983b4d540a524892f38cb09027`.

## Reviewed scope

The audit accounts for 29 worktrees and all 59 original local branches. Only five worktrees have tracked/untracked changes. There were 29 preservation files and 416 excluded local-only paths. Existing unpublished history contains 750 text blobs (13,684,861 bytes); targeted credential-pattern checks found no matches. The same checks found no matches in the 29 preservation files. These checks supplement reviewed content; they do not guarantee the absence of secrets.

The accompanying [ref ledger](checkpoint-refs-2026-10-27.json) records each original branch, its audited SHA, integration ancestry, intended remote destination and dirty-file disposition. Ancestry is not acceptance. Historical issue state assertions inside preserved WIP remain historical and must be reconciled with the authoritative live tracker before use.

## Separate WIP preservation

Snapshots use a temporary Git index and `commit-tree`, preserving the original checkout, index, tracked/untracked status and file bytes. Each snapshot blob was compared with the audit SHA-256. No original WIP was staged into integration or reset.

| Checkpoint branch | Commit | Content and status |
| --- | --- | --- |
| `checkpoint/20261027-original-planning-wip` | `bef6b9c3e767d77d50dbf0039fa727edb3ec05a5` | 19 original planning, ADR, tracker-evidence and export-script files; archival WIP, not a new approved specification. |
| `checkpoint/20261027-historical-browser-reports` | `6d5084dbca76e1e963067ae819ba0cb60d1078cf` | Two prior failed native-acceptance reports; no new browser or acceptance claim. |
| `checkpoint/20261027-r11-native-switch-red-wip` | `d3689192a632567ba29bb073177360bb3689d2f6` | Four original candidate changes, including the opt-in failing native same-Agent preset-switch regression; unaccepted and unmerged. |

All original local refs will be preserved at their own remote names except local `main`, which is backed up as `checkpoint/20261027-local-main` so the existing remote `main` is not advanced or replaced. Integration publishes as `feat/managers`. Original candidate names are retained without changing their acceptance status. Publication uses explicit non-forced refspecs and verifies remote SHAs; no worktree or branch is removed.

## Exclusions retained locally

- Browser preflight worktree: all `.native-static-review/` and `.startup-review/` files. These contain extracted installed proprietary sources, local launch setup, temporary profiles/sessions, generated state, credentials and native binaries. None are checkpoint deliverables. Credential files are excluded by path without opening or printing their contents.
- Typography worktree: `.browser-run.*/` temporary state and `browser-acceptance.patch.yml`, a machine-local launch overlay. No installed configuration is edited.
- Scope-proof worktree: `.scope-source-inspection.txt`, an extracted installed-source inspection artifact.
- Ignored dependencies, build output and local browser artifacts remain local; they are neither added nor removed.

Only the two project-owned historical reports from the preflight worktree are snapshotted. No temporary run directory, extracted host implementation, credential, auth URL or generated session is intentionally included in the preservation refs.

## Verification and next gate

Completed: 62 explicit non-forced refs were published in one atomic push and every remote SHA was read back and compared with its local source. Initial published integration tip: `c0d8b1ec9be91ff65b9c2c16a5ee91bcc83a3b79`. Remote `main` remains `d6fe0e33517003ec9837a72005788f2153d685bb`. All three snapshot commits and the rules commit are remotely reachable. The 25 original non-policy WIP files still match their audit SHA-256; no original WIP was reset, merged, deleted or removed from its checkout. Documentation/candidate whitespace checks pass. This verification record is a subsequent documentation-only update, not a new product revision claim.

After remote verification, the next allowed task is a source- and tracker-backed feature inventory: capability, entry point, activation, revision/environment/scenario, evidence level and remaining gaps. Owner design discussion follows that inventory; historical objectives do not reopen implementation.
