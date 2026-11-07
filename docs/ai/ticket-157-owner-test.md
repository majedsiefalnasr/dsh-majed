# Ticket #157 consolidated Owner acceptance kit: Skill manager (#146–#156)

## Candidate

- Package: built from branch `impl/157-parity-evidence` (base `4dfbf48` = #156) with `npm pack` after review; the archive path and SHA-256 are filled in by the lead at handoff: `__________` / `__________`.
- Preparation only: this kit does not install, restart, publish, contact a live catalog or change any profile. Evidence so far is fixture-based (see `docs/ai/ticket-157-verification.md` and `docs/ai/ticket-157-parity-matrix.md`).
- Separate Owner approvals, each given explicitly and not implied by this kit: (1) installing the archive, (2) a full DSH desktop restart, (3) live network use (ClawHub, skills.sh, GitHub or a public Git host), (4) publication (source push, npm publish, GitHub release).
- Excluded by the Owner and verified absent: GitHub, Issues and Check-for-updates header buttons. Confirm visually (Case 1).

## Safety and baseline

Work on a throwaway DSH profile or at least on test skills only. Back up the following before starting and record their paths; never paste secrets, tokens or account data into the report:

- State directory `stateDir` = `<DSH_HOME>/waycraft-skills/` (default `~/.dsh/waycraft-skills/`): `state.json` (toggles, sources, categories, notes), `repositories.json`, `catalogs.json`, `repository-snapshots/`, `repository-backups/`, `trash/`.
- User skill folders that the manager writes: `<DSH_HOME>/skills` (DSH skills) and the Shared Agents folder `~/.agents/skills`; project scope writes only `<project>/.dsh/skills`.
- Trash lives in `<stateDir>/trash/<id>/` for global and project copies alike (each id holds `metadata.json` plus the original bundle); a project copy's metadata names the project id.
- Keep the previous plugin package so that rollback is possible (see Rollback).

For every case record PASS / FAIL / NOT TESTED, what you saw and, if useful, a screenshot with personal paths obscured. Restore baseline after each group. Do not run the live-network cases without the separate approval above.

## Test data

| Field | Temporary value | Restore |
|---|---|---|
| Project A | A scratch folder, e.g. `~/qa-skills/app-one`, registered as a DSH project | Unregister and delete the folder |
| Project B | A second scratch folder with the same basename in another parent, e.g. `~/qa-skills/two/app-one` | Unregister and delete |
| Custom source folder | `~/qa-skills/extra/skills/alpha/SKILL.md` | Remove the source (files are never deleted) |
| Sample skill | `qa-sample` with front matter `name: qa-sample`, `description: QA sample` | Delete to Trash, then permanently delete |
| Local Git repository | A scratch folder with one `SKILL.md` bundle, then a second commit that edits it | Remove repository and scratch folder |
| ZIP upload | A ZIP containing `qa-zip/SKILL.md` | Delete the imported skill |
| Category / note | `QA Group`, note "QA note" | Delete the category; clear the note |

## Cases

### A. Interface, language and exclusions

1. **Open and layout (EN):** Settings → Skill manager. Expect the header controls, a scope selector (Global skills / Project skills / Discover Skills / Trash), search, source/status/category filters, source groups with a toggle per source, and **no** GitHub, Issues or Check-for-updates button anywhere (every scope, details dialog, panels). Record what is present.
2. **Arabic and RTL:** switch DSH to Arabic. Expect the whole manager to mirror (`dir=rtl`), labels in Arabic, paths and project names kept left-to-right inside their bidi islands, dialogs readable, no clipped or overlapping controls, keyboard focus visible and Escape closing dialogs. Real browser focus and RTL layout are NOT proven by automated tests, so this case is mandatory.
3. **Known gaps (do not mark as failures, record the decision):** there is no drag-and-drop upload zone, no "Open folder" action, and no "Bundle" badge. The stats strip and the global Refresh button are implemented: see cases 26 and 27. See the parity matrix GAP-1..GAP-17 for the recommended disposition.

### B. Discovery, toggles and policy (#146, #147)

4. **Discovery:** confirm skills from the standard folders appear grouped by source with correct counts and diagnostics for broken skills (invalid front matter, oversized, unreadable).
5. **Toggle really changes availability:** disable `qa-sample` (user scope), open a new chat and confirm the skill is not offered; re-enable and confirm it returns. Repeat with a whole source toggle. The state must survive a page reload.
6. **Project scope:** switch to Project skills, select Project A, confirm only its `.dsh/skills` copies show and that source toggles for "Project DSH skills" are read-only as labelled. Unavailable projects (folder removed) are disabled in the selector with the reason.
7. **Custom sources:** Source folders → preview a parent folder, add one or all candidates, edit label/group, then remove one. Expect that removing a source never deletes skill files.

### C. Categories, notes, placement (#148)

8. Create `QA Group`, assign skills, reorder, toggle the group, delete the category and confirm skills return to Uncategorized. Save a note, search for it, clear it.
9. Placement: choose sidebar only, settings only, both. Reload and confirm the entry follows the choice and persists. (Sidebar-only startup is host behaviour: restart is covered under Case 20.)

### D. Creation, import, upload (#149, #150)

10. **Create:** create `qa-sample` in the user folder and in Project A. Expect the files on disk, the skill listed immediately, and a model `create_skill` request (ask the assistant to create a skill) to go through DSH approval.
11. **Import local path:** preview a folder containing a good skill and a malformed one; import with skip then overwrite. Expect a result list with created/skipped/failed buckets and no partial files.
12. **Upload:** upload a ZIP, a single SKILL.md and a skill folder. Expect imports to match, no files outside the skills folder, and a clear error for a traversal-style or oversized ZIP (use only your own test archive).

### E. Trash (#151, #152)

13. Delete `qa-sample` to Trash, check origin/scope shown, restore it (policy and files return), delete again and permanently delete. Confirm the destination label for project copies shows "<project> — DSH".
14. Remove Project A from the registry while one of its copies is in Trash. Expect restore/delete to fail with a clear message until the project is registered again (documented limitation P5); register it again and complete the restore.

### F. Git repositories (#153, #154)

15. **Subscribe a local Git repository** (absolute folder path): add, refresh, filter, view detail, install into DSH, Shared Agents and Project A (picker shows "<project> — DSH", the same-name Project B is disambiguated).
16. **Update and rollback:** commit a change upstream, refresh, preview the added/removed/modified files, apply the update (modify the installed copy first to see the local-modification warning), then roll back. Expect backups to be kept and nothing replaced without confirmation.
17. **Uninstall and unsubscribe:** uninstall one scoped copy (it goes to Trash and does not touch the other scopes), unsubscribe the repository (installed skills stay).
18. **Live Git/GitHub (needs separate network approval):** subscribe `owner/name` of a small public repository you control. NOT PROVEN by automated tests. Record the result and any proxy/CA problems; do not use a private repository or credentials.

### G. ClawHub and skills.sh (#155, #156)

19. **Needs separate live-network approval.** Open Discover Skills → ClawHub: Top 100 loads, sort/filter/search/load-more, detail text, install into the user folder and into Project A, uninstall to Trash, forget, reassociate an identical copy. Repeat the search on skills.sh (search only; the hint tells you to enter a query). Endpoint shapes and ZIP layouts are unverified live (O1, O3, O7, O9); record anything the UI reports as an unexpected response. Offline, confirm the failure states (retry button, readable error) by disconnecting the network.

### H. Shutdown, in-flight and restart persistence

20. **Restart persistence:** after approval to restart, fully restart DSH. Confirm toggles, sources, categories, notes, placement, repositories, catalog records, installed copies, tracked update state and Trash items are unchanged.
21. **Close during an operation (use only test data):** start (a) an import of a larger ZIP, (b) a repository refresh, (c) a repository update, (d) a catalog install, and close the DSH window during each. After reopening expect no half-written skill folder (staged publish and restore are tested with fixtures only), no stuck "busy" repository, and the same state as before the operation or the completed result. Anything else is a FAIL to report with the folder listing (paths only).
22. **Disable the component during use:** switch the Skill manager component off while a dialog is open and after toggling several skills. Expect the provider to be released, skills made unavailable by the manager's policy to become available again and files untouched; switching it back on restores the policy.

### I. Rollback

23. **Disable without removing:** switch off the Skill manager component (Loader row `waycraft-skills`); Waycraft continues to work (AI Providers and the rest are independent).
24. **Restore the previous plugin package** through the plugin manager and fully restart (needs the restart approval). State stays on disk in `stateDir`; remove it only if you intend to forget all manager data: delete `<stateDir>/state.json`, `repositories.json`, `catalogs.json`, `repository-snapshots/`, `repository-backups/`; keep `trash/` if you may still want deleted skills back.
25. **What remains after rollback:** installed skill folders (user and project), Trash content under `<stateDir>/trash`, backups under `<stateDir>/repository-backups`, and project `.dsh/skills` copies that may be committed in your project. Nothing is removed automatically.

### J. Stats strip, Refresh and slash menu (#157)

26. **Stats strip and Refresh:** in Global skills expect a strip "N skills / N enabled / N disabled / N diagnostics" above the list (also in Project skills once a project is selected). Disable one skill and expect enabled −1 / disabled +1; break a `SKILL.md` on disk (remove its front matter) and press **Refresh**: the diagnostics count increases without a page reload and the strip is not changed by search or filters. In Arabic the numbers stay readable inside the RTL strip. Refresh is disabled with a busy label ("Refreshing…" / "جارٍ إعادة التحميل…") while it runs, is absent in Discover and Trash, and a forced failure (e.g. stop the host) shows the error in the notice line. Arabic labels: button "إعادة تحميل" (reload; not "تحديث"/update), accessible name "إعادة تحميل المهارات" unchanged while busy, strip group name "إحصاءات المهارات"; with a screen reader or the browser accessibility inspector check that the Refresh name stays the same while busy and the strip is announced as a labelled group. If the first load failed (host stopped at open), start the host and press **Refresh** or **Retry**: the "Unable to load skills" alert must disappear. NOT proven: real RTL layout and real screen-reader output.
27a. **Built-in folder override and Browse (rc.4, UNPROVEN on a real host):** open a provider source (e.g. Codex) and press Change folder; pick a folder with Browse (hidden if DSH has no folder picker) or type one; Save. Expect the source to list that folder, an overridden badge with the default path, and Reset to restore the default. Refusals: your home folder, `/`, `~/.ssh`, the DSH state folder, folders overlapping another source. Notes and categories of that source are cleared on change; no skill files are ever deleted.
27. **Slash menu after writes (UNPROVEN, parity matrix F37 / GAP-17):** the reference also emits `commands/change` after every write; Waycraft only invalidates its provider. After **install**, **toggle** and **delete** open a fresh `/` menu in a chat **without reloading the page** and record whether the new/removed skill is reflected immediately. If not, record it as a gap; no code emits the event today because the declared host context has no public `emit`.

## Not proven by automated tests (acceptance must cover or the Owner must accept the gap)

- Real browser focus management, Escape handling and RTL layout (react-test-renderer only).
- Live ClawHub, skills.sh and GitHub responses, redirects, rate limits and archive layouts (127.0.0.1 stubs and local git only).
- The installed DSH desktop app, the native skill registry and per-agent registrations in a running profile (harness only).
- A paired host or remote workspace.
- Crash and power-loss durability (only orderly shutdown and injected-failure tests exist).
- DNS rebinding after address validation (documented residual O8).
- Windows paths, HTTP(S) proxy and custom CA behaviour.
- External writers racing the manager in the skills folders.
- Slash-menu refresh after installs/toggles/deletes (case 27) and real RTL layout of the stats strip (case 26).
- Built-in source list and `DSH_*_HOME` overrides, `agent/created` registration and source/status filters are not asserted by dedicated tests (parity matrix D-T1..D-T3).

## Acceptance record template

Case: __ / Result: PASS | FAIL | NOT TESTED
Expected: __
Observed (no secrets): __
Baseline restored: YES | NO

Required decisions before closing #157: the Owner accepts or rejects each GAP / decision row in `docs/ai/ticket-157-parity-matrix.md` (section 4); installation, restart, live network and publication are approved separately. On failure stop using the manager, switch the component off and use the rollback in cases 23–25.
