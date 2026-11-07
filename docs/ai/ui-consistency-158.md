# Skill manager UI consistency (#158 rc.19)

One rule per element, shared by every screen and dialog. All values are host tokens (`var(--dsw-*)`, fallbacks only as the second `var()` argument) and are checked by `test/skill-manager-redesign-browser.test.mjs` (token allow-list and "consistency guard").

| Element | Rule | Screens and dialogs using it |
| --- | --- | --- |
| Spacing | 4 / 8 / 12 / 16 / 24 px only (switch padding 2px is the host's own) | all |
| Panel / provider card | 0.5px `settings-card-stroke` (fallback `border-l2`), `radius-xl`, padding 12px 16px, `settings-card-fill` | provider cards, Discover panels (Git Repos, ClawHub, skills.sh), Trash, Import and Create panels |
| Inner card / group | 0.5px `border-l2`, `radius-md`/`radius-lg`, fill `bg-layer-1` | repo cards, catalog items, diagnostics region |
| Row | plain, 0.5px top divider, no fill; title 14px/600, description 13px two-line clamp, meta 12px muted | skill rows, ClawHub/skills.sh rows, repo skill rows |
| Buttons | 36px medium / 28px compact, `radius-md` / `radius-sm`; variants primary, secondary, ghost, danger; icon button 28x28 ghost; no accent colour | toolbars, dialogs footers, row actions |
| Inputs and selects | 32px, 0.5px `border-l4`, `radius-md`, one `.waycraft-skills select` rule | toolbar filters, Discover filters, all dialogs |
| Switch | host control: 36x20, thumb child, `border-l3` / `brand-primary` | source header, category rows, skill rows |
| Badges | 12px, 0.5px border, `radius-sm`; warning variant uses `state-warn-label` | source count, problems, status, custom |
| Disclosure rows | `summary` 32px, chevron last, mirrored in RTL | source cards, categories, diagnostics region, details |
| Dialogs | `CatalogDialog` sizes sm 400 / md 520 / lg 600 / xl 760; head, body, footer with 24px padding; primary last | note, new/rename/delete category, add skills, folders, create, import, install, subscribe, confirm, details |
| Focus | 2px `--dsw-focus-ring-width` outline, offset 2px | every control |
| States | empty, loading, error use the same `waycraft-skills-empty` / `-loading` / `-alert` classes | main list, trash, Discover |
