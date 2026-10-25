# Manager cutover and rollback preparation (T28M)

**Status: preparation only.** This document records the Owner-reviewable cutover/rollback preparation for the Skills,
MCP and Hooks Managers. It performs no operational state changes, makes no Cutover, removes no Reference plugin, and
authorizes nothing on the Owner's behalf. Actual cutover and removal are T29/T10 decisions requiring separate Owner
approval.

## Scope

Independently enabled Managers: Skills, MCP servers, Hooks (Command hooks inert until T10). Blocked by T04, T06, T08,
T10, T11. D05 (MCP import/export/ingest) is a deferred gap, not a circular prerequisite of this preparation ticket.

## Manager Parity rows and explicit deferrals

State paths are enumerated below without reading operational secrets. No secret value is included in this report.

| State path | Location | Backup destination | Permission | Schema / compatibility | Restoration | Fresh Approval |
|---|---|---|---|---|---|---|
| MCP servers | Private Majed store under DSH_HOME; atomic write, request-time read | Owner-approved external destination only | Owner-authenticated read via managers route; secrets masked, never echoed | validateServers; scope/schema checked against Reference store before replacement activation; per-tool restrictions deferred (D04) | Restore from verified backup to Reference-owned locations | n/a (definitions only) |
| Hooks | Config-editor owned persistence (profile root Include entry) | Owner-approved external destination only | Owner-authenticated via owned persistence save; root-entry ownership revalidated | validateHooks; enabled/deny/audit/auditLimit | Restore from verified backup; Hooks reinstated | n/a |
| Command hooks | Config-editor owned persistence (profile root Include entry) | Owner-approved external destination only | Owner-authenticated via owned persistence save; user/project scopes | validateCommandHookConfig; user/project scopes, hook ids unique | Restore from verified backup | Fresh Command hook Approval required after any definition change; imported Approvals never carried |
| Tool rules | Config-editor owned persistence (profile root Include entry) | Owner-approved external destination only | Owner-authenticated via owned persistence save; global/project/agent scopes | validateRules; id/pattern/enabled/scope; rules never allow, only deny | Restore from verified backup | n/a |
| Skills | Vendor core disk state under user/project roots | Owner-approved external destination only; vendor state not touched by dsh-majed | Read-only preview; no create/trash/restore without separate approval | Vendor core behavior oracle; name/body/scope validation; read-only/external sources preserved | Restore from verified backup; sources not rewritten | n/a |

## Backup rules

Backups never go in the repository, browser, evidence bundle or plaintext logs. Backup destination must be an
Owner-approved external destination. Backup integrity and restorability are verified before any cutover step.

## Reversible ownership procedure

Cutover order:
1. backup — take a verified backup of all Manager state paths.
2. disableReference — disable the Reference plugin runtime (no route/tool/slot/state ownership).
3. activateReplacement — activate the dsh-majed replacement after collision and compatibility checks.
4. verify — verify replacement serves all accepted parity rows; fresh Command hook Approvals required.

Rollback order:
1. disableReplacement — disable the dsh-majed replacement before any Reference restoration.
2. restoreReference — restore Reference ownership and state from the verified backup.
3. verify — verify Reference serves its previous capabilities; no replacement residue.

Invariant: Reference is disabled before replacement activation; rollback disables the replacement before restoring
Reference ownership. No automatic plugin deletion, no imported Approval, no generated handoff edits.

## Collisions, interruption and source preservation

Tool/route/slot/state collisions are enumerated before activation; any collision blocks cutover until explicitly
resolved by the Owner (never automatically). An interrupted preparation leaves a complete, resumable plan — no
destructive or partially applied step. Source state is preserved: nothing is deleted, imported, or generated into the
Reference plugin's store.

## Explicit deferrals (gaps)

| Gap | Disposition | Gate |
|---|---|---|
| profile-only-hook-definitions | pending | Profile-only hook definitions are not managed by dsh-majed; requires explicit import/manual-conversion/deferral decision before Reference removal. |
| mcp-import-export-ingest | pending | Deferred to D05; gap must be resolved or explicitly accepted before affected parity/removal claims. D05 is not a circular prerequisite of this preparation ticket. |

An explicit Owner-accepted deferral satisfies the capability gate; silence does not. Preparation may finish with an
explicit pending disposition; actual required capability implementation blocks operational cutover, not preparation.

## T29 operation-specific approval checklists

The Owner may accept a documented deferral or retain the Reference plugin. This ticket cannot make that decision.

### Before changing anything (T29 preconditions)

- [ ] Obtain operation-specific approval for backup/state access (all five state paths above).
- [ ] Obtain approval for deactivation/activation (Reference disabled before replacement activated).
- [ ] Obtain approval for full desktop restart after cutover.
- [ ] Obtain approval for harmless demo fixtures (no operational secrets, no live provider/judgment calls).
- [ ] Confirm old and replacement runtimes remain mutually exclusive during verification.
- [ ] Confirm installed Reference packages remain available for rollback (never deleted automatically).
- [ ] Record explicit disposition for each gap: accept deferral or retain Reference.
- [ ] Missing approval is an explicit waiting state, never implied permission.

### T29 verification (after approved cutover and restart)

- [ ] Skill effective invocation / create / trash / restore (locally and remotely).
- [ ] MCP save / connect / tool call / isolated failure (locally and remotely).
- [ ] Command hook edit / review / fresh Approval / execution / revocation, including remote Approval/execution on the host.
- [ ] Tool rule denial (locally and remotely).
- [ ] Rollback drill outcome recorded.
- [ ] Redacted screenshots/logs with host/plugin versions, locality, steps, observed results.
- [ ] Repeat affected English/Arabic RTL, light/dark, 14/18 and narrow viewport flows using the actual bundle.
- [ ] Preserve existing preferences and regressions.

### Release evidence

- [ ] Update Parity list / known issues / release evidence truthfully.
- [ ] No stable working claim for failed or unperformed checks.
- [ ] Owner decides Reference removal only after needed parity and rollback are verified.
- [ ] No GitHub release/write performed merely because T29 passes.

## Decision rights

The Owner may accept a documented deferral (above) or retain the Reference plugin. T28M records the preparation and
checklists only; it neither makes the cutover decision nor authorizes any state change.
