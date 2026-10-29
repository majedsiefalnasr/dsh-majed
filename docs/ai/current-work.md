# Current work

Updated: 2026-10-29. This is the resume entry point, not a feature specification. Older long-form history: [archived working log](../archive/current-work-history-2026-10-29.md).

## Current phase: cleanup phase complete, awaiting Owner re-planning

The Owner paused feature implementation on 2026-10-29 to re-plan the whole project and run a cleanup phase (merge or keep what is needed, delete obsolete branches, simplify docs that could mislead work). **No feature implementation, installed-state change, live provider use, release or cutover is authorized** until the Owner approves a new plan at its own gate. Do not resume the historical `/implement-spec` goal on a generic "continue".

Next allowed action: discuss the new plan with the Owner (`/grill-with-docs` route per [scope control](rules/scope-control.md)). Record every approval at its own gate.

## Repository state (verified 2026-10-29)

- Authoritative integration branch: `integration/current-scope-20261028` (pushed). `feat/managers` fast-forwarded to it. `main` is an ancestor and unchanged (`d6fe0e3`); nothing was merged into `main`.
- Last integration verification before cleanup: full `npm test` 755/755 and classifier 166/166 at `ece4038`; later documentation-only commits followed. Re-run `npm test` before relying on this.
- Remote branches now: `main`, `feat/managers`, `integration/current-scope-20261028` and eight `archive/*` branches (unmerged or partial work kept, not accepted): `archive/r14-hooks-execution` (dormant Hooks execution runner), `archive/s16-subscriptions-port-wip` (untested partial port of the reference Subscriptions UI), `archive/r11-distinct-preset-registry`, `archive/r11-cold-preset-contract`, `archive/r11-native-switch-red-wip`, `archive/t02a-mounted-settings-probe`, `archive/historical-browser-reports`, `archive/original-planning-wip`. All other earlier branches were merged into integration and deleted (full local backup bundle: `../dsh-backups/dsh-majed-all-refs-20261029.bundle`, outside Git).
- No open pull requests. No tags.

## Authoritative sources

- Behavior and scope: [six-family specification](../current-scope-specification-2026-10-28.md) (includes the 2026-10-29 Subscriptions adoption amendment) and the [ticket proposal](../current-scope-ticket-proposal-2026-10-28.md). GitHub Issues (`majedsiefalnasr/dsh-majed`) are the tracker of record, currently with no open issues (reset); historical publication record: [verified publication status](../current-scope-tickets-publication-status-2026-10-28.md).
- Rules: [scope control](rules/scope-control.md), [execution policy](rules/execution-policy.md), [ADRs](../adr/), `GLOSSARY.md`.
- Evidence per ticket: `docs/research/*` (controlled evidence only unless it says otherwise). Older planning documents are in [docs/archive](../archive/README.md) and are historical, not authoritative.

## Product status (truthful, none accepted as complete)

**Tracker reset (2026-10-29): all 85 previously open issues (#1, #2 and the execution records) were closed as not planned with an explanatory comment; this is a planning reset, not acceptance or rejection.** Full bodies are in the closed issues and an offline snapshot (`dsh-backups/open-issues-snapshot-20261029.json`, outside Git). The new plan will be re-ticketed from a clean tracker. The ticket numbers below are historical references.

Every implemented ticket slice is PARTIAL: controlled jsdom/native-fixture evidence, not installed/paired/live acceptance. Closed: #88 E08, #89 E09. Open and partial: #48 R01 (Codex lifecycle; real-account observations posted), #50 A01a, #51 K01, #78 E01 (installed-build observation partial), #90 E10, #91 E11/E11b, #96 S15, #97 M01, #103 H01. New: #126 S16 (adopt the reference Subscriptions Settings experience for Codex; implementation not accepted). Remaining tickets are blocked behind these or deferred.

Owner gate dispositions: G2 (#90) accepted documented gap; G6 (#50) concrete-route-after-first-selection with disclosed limits; G4 (#51) accept stale warmed slash until reload, request first-party seam; G-mcp-scope (#97) option A then B. Mobile real-device testing is deferred to the Owner. Cross-provider model fallback on provider rate limits is authorized by the execution policy.

## Constraints that still apply

- English project content; public DSH extension points only; never patch DSH; never touch `~/.dsh`, installed plugins or secrets without explicit Owner consent; every user-visible change needs a `CHANGELOG.md` entry; `npm test` must pass.
- Installed `dsh-majed` may be an Owner-installed integration build (`0.3.0-rc.1` lineage, rollback scripts under `/tmp` are ephemeral). Verify the installed version before reasoning about it; backups of the original `0.2.0` exist at `node_modules/dsh-majed.orig-0.2.0` in the Owner profile.

## Deferred decisions

- Disposition of `archive/*` branches (merge, rework or delete) and of the dormant Hooks runner.
- How to continue S16 (the reference Subscriptions port): scope dispositions already made (Claude-only cache TTL omitted for Codex; pool/allowlist controls saved but labelled not-yet-applied until manual pools exist).
- Unmet environment, live and paired acceptance keep their real status; never convert a deferral into a pass.
