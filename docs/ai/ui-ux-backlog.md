# Skill manager UI/UX backlog

Status: **candidate for a UI/UX ticket, pending Owner testing feedback.** Nothing here is approved, scheduled or implemented. Every row is seeded only from existing evidence (the #157 parity matrix, the #155 review and the verification notes); no speculative features. Ordering is not a priority.

Sources: `docs/ai/ticket-157-parity-matrix.md` (matrix), `docs/ai/ticket-157-verification.md`, `docs/ai/ticket-157-owner-test.md` (Owner steps), `docs/ai/current-work.md` (#155 section).

| ID | Area | Observation | Source ref | Suggested approach | Risk |
|---|---|---|---|---|---|
| UX-1 | Row detail | A disabled copy does not say which copy is used instead (the reference shows a `fallbackTo` note); Waycraft only shows `shadowedBy` on the shadowed row. | Matrix F38, GAP-13 | Add a one-line note on the disabled row from existing payload data, if Owner testing shows confusion. | Low (cosmetic); needs the payload to expose the fallback copy. **Status: Open: data/behavior, not styling; needs Owner feedback.** |
| UX-2 | Row detail | No per-row note for a benign linked directory (reference: "External directory link, read-only"); only the `linked-outside-root` diagnostic exists for unsafe links. | Matrix F41, GAP-14 | Add a read-only note from the existing diagnostic/link data. | Low (cosmetic). **Status: Open: data/behavior, not styling; needs Owner feedback.** |
| UX-3 | Category headers | Per-category progress counter missing before rc.4 (reference: "{count} · {enabled}/{usable} enabled"). | Matrix F42, GAP-15 | Derive from the unfiltered copies per category, as the stats strip does. | Low; must follow the strip's counting rules and stay filter-independent. **Status: Done (rc.4): category sections in the main list show `N · enabled` (not the reference's usable-count rule; in-list rename/delete stay in the organizer).** |
| UX-4 | Detail dialog | Plain `role=dialog` with Escape to close; no 760px width contract and no resize handle (reference: `min(760px,100%)`, resizable, `@media(max-width:760px)`). | Matrix U24, GAP-16 | Define a width contract and optional resize after real-browser layout checks. | Medium: needs real browser/RTL layout verification that tests cannot give. **Status: Done (partial): dialog capped at 600px in CSS (DESIGN.md secondary dialog); no resize handle; real-browser layout unproven.** |
| UX-5 | Settings navigation | The reference decorates the settings-nav entry through DOM markers coupled to another plugin's markup; Waycraft ships its own `icon.svg` and placement entries instead. | Matrix U23 (non-goal) | Keep the own icon; revisit only if the Owner finds the entry hard to spot in the installed app. | Low if kept as is; DOM coupling to another plugin conflicts with ADR-0001 scope (see matrix). **Status: Deferred: kept own icon; no change.** |
| UX-6 | Row badges | No "Bundle" kind badge in skill rows; the information is available through path and details. | Matrix U12, GAP-10 | Add a badge if Owner testing shows it is needed to tell bundles apart. | Low (cosmetic); requires a reliable bundle indicator in the payload. **Status: Open: needs a reliable bundle indicator in the payload.** |
| UX-7 | Upload | No drag-and-drop upload zone or selected-file summary; file inputs cover the function. | Matrix U6, GAP-8 | Add a drop zone over the existing file-input flow with an EN/AR requirement text. | Medium: drag/drop behaviour and RTL layout are unverifiable with react-test-renderer. **Status: Deferred: drag/drop out of #158; file inputs now styled only.** |
| UX-8 | Source folders | Built-in provider folders had no override and folder fields had no native picker. | Matrix F14, F15, GAP-1, GAP-2 | Host `root-set` (validated, purge on change, reset) and the client `uiWorkspace.pickDirectory` Browse button. | Medium: real host picker and slot behaviour cannot be tested here. **Status: Done (rc.4) in code; real-host picker unproven; typed path still works when the service is absent.** |
| UX-9 | Stats strip | Status precedence differs from the reference: Waycraft checks invalid, then disabled, then shadowed (matching its row badges), so a shadowed copy that is also disabled or invalid is counted as disabled or invalid. The UI does not explain this. | Matrix U3 note | Add a help text or tooltip, or align precedence, after Owner feedback. | Low; changing precedence alters the counts the Owner tests against. **Status: Open: behavior/counts, not styling.** |
| UX-10 | Catalog dialog (Done) | `CatalogDialog` has no Tab focus trap (it moves focus in on open, restores it on close and closes on Escape only). Reported as a LOW finding in the #155 review. | `docs/ai/current-work.md` #155 section; `src/skills-browser.ts` `CatalogDialog` | Trap Tab inside the dialog and add a keyboard test; share it with other dialogs if they have the same gap. | Medium: focus behaviour needs a real browser to prove. **Status: Deferred: Tab focus trap is a behavior change needing a real browser.** |
| UX-11 | Verification gap | Real focus management, Escape handling, RTL layout and screen-reader output are unproven; component tests inspect props only. | Verification "Not proven"; Owner test "Not proven by automated tests" | Collect findings in the Owner desktop test (cases 26-27 and the RTL steps) before designing fixes. | Not a feature: it decides which of UX-1..UX-10 become real defects. **Status: Open: real-host focus/Escape/RTL/screen-reader verification still missing; #158 acceptance is not fully met.** |
| UX-12 | #158 status | Visual redesign (B1+B2) delivered in code; acceptance not fully met (no real-host captures, no side-by-side with native Models, no real focus/RTL). | #158 | Re-verify in the installed app, then close UX-4/UX-11. | Medium. **Status: Open** |

## Process

1. Owner runs the desktop acceptance (`docs/ai/ticket-157-owner-test.md`) and records which rows matter.
2. Only rows with Owner feedback become a UI/UX ticket (scope control: approved outcome, acceptance criteria and tests first).
3. Rows without feedback stay here as candidates; none is implied work.

rc.5 note: the Owner removed drag-and-drop arrangement of skills (grip, drop targets, Alt+Arrow, Move up/down); UX-3 category assignment now uses More > Assign category and the organizer buttons. UX-10 (dialog focus trap) is addressed by the shared popup dialog (real host rendering unproven).

rc.6 note: UX-10 resolved earlier (Tab trap); dialogs now share head/body/footer structure, the add-category and folder dialogs are real modals, and the source header chevron moved to the inline end.

rc.8 note: Scope/Location destination, import drop zone and the single merged Source-folders dialog are delivered (previously deferred); no remaining deferral from the rc.7 list.
rc.13 note: drag-and-drop arrangement is restored (original client.ts:856-965); verified in real Chromium (EN/AR), host webview unproven.

rc.14 note: UX-10 is Done (CatalogDialog traps Tab and closes on Escape since rc.5). UX-7 drop zone and UX-8 folder overrides delivered earlier. Keyboard/touch reorder is now covered by Move up/Move down in the More menu; the grip stays decorative. UX-11 stays open: real-host focus, RTL and screen-reader behavior is unproven.

rc.15 note: final drag behavior is category move only (no reorder anywhere, no Move up/Move down); Assign to category in the More menu is the keyboard/touch path. Skill rows show no status text or dot.

rc.17 note: switch = host control copy; Discover lists share one row component; diagnostics are per source.

rc.18 note: diagnostics are collapsed regions inside the source cards; the absent tool folders notice is removed; Discover rows are plain like the skill rows.

rc.19 note: consistency table in docs/ai/ui-consistency-158.md; Discover panels unified; accent icon buttons removed.
