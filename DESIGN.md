---
name: DSH-aligned Waycraft interfaces
description: Source-backed design reference for all Waycraft features, with explicit external-plugin reuse boundaries.
---

# Design System: DSH-aligned Waycraft interfaces

## Overview

**North Star: belong to DeepSeek Harness, not a second application inside it.**

This is the shared reference for future Waycraft settings, tools, dialogs and other approved extension surfaces—not just Subscriptions. Use DSH's visual language, semantic theme and interaction conventions without patching the host or inventing a separate brand. A feature specification still decides what a surface does; this document decides how it should fit its host.

**Evidence baseline:** packaged DSH UI modules `0.2.1-rc.5`, inspected read-only on 2026-11-02. The separately inspected published primitives package is `0.2.1-rc.3`, not proof of installed rc.5 availability. Exact files, hashes, source regions, licensing and limitations are in the [source record](docs/research/dsh-design-source-2026-11-02.md). Source observations below are examples, not a claim that every native screen uses one universal size or component.

Authority order: the installed version's supported extension contract; its semantic theme and relevant native pattern; the approved feature brief; then this reference's implementation recommendations. Current upstream documentation is advisory where it is not version-matched. Do not promote an old implementation fallback or a screenshot's sampled color into a host contract.

### Reuse boundary

- **Supported public extension:** use a documented, version-compatible service, slot or primitive only when its availability to an external plugin is established. Test its loading, lifecycle and fallback at that seam.
- **DSH-internal shared component:** a source export or published package can be useful for DSH's own development without being a supported external-plugin runtime dependency. Current external-plugin guidance explicitly warns against requiring Harness client packages. `dsh.client.inject` ordering does not make a private module a public API.
- **Licensed adaptation:** if no supported reusable component is available, adapt the necessary markup, scoped CSS and behavior under Waycraft ownership after checking dependencies and license. Keep attribution and tests; Waycraft maintains that copy. Never reach into private closures, hashed class names or ASAR paths at runtime.

The rc.5 native Models bundle exports activation functions, not its section/editor components. That does **not** prohibit reading or MIT-permitted adaptation of its code. It does mean that direct import of those components is not established. Existing Waycraft primitive imports are not changed or certified by this documentation task; reassess them in an approved compatibility slice, not via a silent dependency rewrite.

The [unified Subscriptions brief](docs/ai/unified-subscriptions-ui-issue.md) owns that feature's mixed list, inline Add modes and placement decisions. Do not generalize its topology into a mandatory template for every future feature. The historical `.impeccable/design.json` sidecar is not the authority for this expanded source record and was not regenerated here.

## Colors

Use host **semantic variables**, resolved in the host's active theme. Do not freeze light/dark hex samples or duplicate the host palette.

| Purpose | Observed semantic roles |
| --- | --- |
| Text hierarchy | `--dsw-alias-label-primary`, `--dsw-alias-label-secondary`, `--dsw-alias-label-tertiary`, `--dsw-alias-label-caption` |
| Surfaces | `--dsw-alias-bg-base`, `--dsw-alias-bg-layer-1`, `--dsw-alias-bg-module-platform` |
| Settings cards | `--dsw-alias-settings-card-fill`, `--dsw-alias-settings-card-stroke` |
| Separation | `--dsw-alias-border-l1` through `--dsw-alias-border-l4`; choose the relevant native pattern, not the strongest border everywhere |
| Actions | `--dsw-alias-button-primary-fill`, `--dsw-alias-button-primary-hover`, `--dsw-alias-label-primary-foreground`, `--dsw-alias-interactive-bg-hover` |
| State | `--dsw-alias-state-success-primary`, `--dsw-alias-state-warn-label`, `--dsw-alias-state-error-primary`, `--dsw-alias-state-business-primary` |

Theme source maps settings-card fill to layer-2 and stroke to border-l4. The primary/contrast action is not necessarily blue: brand contrast and business/information accent are different semantic roles. Keep labels legible in both themes and give status text or an accessible label alongside color. A configured credential is not a healthy service; unknown metadata is not a missing credential; unavailable usage is not zero.

Scope styles to the feature. Do not set host theme attributes, replace `:root` tokens, force a theme or introduce a global reset. Use a locally scoped fallback only when necessary and justified; test missing-token behavior rather than assuming all hosts expose every alias.

## Typography

Inherit the host UI family (`--dsw-font-family` where needed) and code family (`--ds-font-family-code` for technical content). Respect user font preferences. The packaged theme has system-stack defaults and user overrides; Montserrat is a brand role, not a mandate to load it for feature text. Do not add a font dependency for visual imitation.

Observed native roles—not a universal type scale:

| Context | Packaged observation |
| --- | --- |
| Models section title | 16px / 24px, weight 500 |
| Models row name / ordinary editor text | 14px / 22px; row name weight 500 |
| Models supporting field label / notice | 12px / 18px; label weight 500 |
| Models small tag | 11px / 16px |
| Plugins section heading / introduction | 18px weight 600 / 13px introduction |
| Models secondary-dialog title | 20px / 28px, weight 500 |
| Tool summary / expanded prose | Content preference roles with 13px / 14px defaults; line-height changes with content-font delta |

Use semantic font shorthand roles only after verifying their names and availability; do not invent a `--dsw-font-s-*` scale. Chat/tool content has user-adjustable content/code sizing and must not be flattened to fixed settings text sizes.

For English and Arabic, preserve shaping and inherited direction. Use logical alignment and spacing. Isolate URLs, model IDs, callback codes and other technical strings with appropriate LTR/bidi semantics without reversing the whole surrounding sentence. Wrap important identity, errors and instructions; ellipsis is acceptable only where the full value remains accessible.

## Layout

### Choose the nearest native pattern

- **Settings/form surface:** compact heading and supporting text, a vertical list of related rows, local actions and inset editing. Models uses a 720px maximum column, 12px section gap and 8px row gap. Plugins uses 760px and different heading/tab treatment. Neither establishes one mandatory width for all features.
- **Inline editor/addition:** preserve surrounding context and draft state. Models' editor uses 14px 16px inset, 14px internal gap and 6px field gap; its full-width Add affordance has a dashed border and 44px height. These are useful pattern observations, not permission to copy native Models functionality or change its slots.
- **Secondary dialog:** for a genuinely separate focused decision or existing Manage flow. The observed Models dialog caps at 600px, with 28px content inset reduced to 24px at a 560px breakpoint. Do not make every edit a modal or apply that breakpoint universally.
- **Tool/output surface:** keep the summary compact, reveal details on demand, and distinguish commands, output and errors. Native tool rows use a 24px base plus content-font delta; code output preserves whitespace and bounds scrolling. Do not turn every tool result into a settings card.

Host settings navigation, application grid, titlebar clearances and global stacking belong to DSH. The observed settings shell's dimensions are not a plugin template. Mount only through an approved extension seam and fit the space it gives you.

### Responsive and directional rules for Waycraft

Use `min-width: 0`, wrapping, flexible columns and logical properties (`padding-inline`, `margin-inline-start`, etc.) at the responsible container. Stack dense fields/actions when necessary; keep important actions reachable without page-level horizontal scrolling. Native source contains physical left/right properties: adapt those rather than copying RTL defects.

Choose breakpoints from actual content pressure and host constraints. Verify narrow, intermediate and wide views, zoom/large font, long labels and both directions. Do not claim a desktop-only screenshot proves responsive behavior. Preserve field labels, useful error details and unsaved drafts through loading, conflict and partial-save states.

## Elevation & Depth

Prefer tonal separation and subtle strokes for ordinary rows. Native settings cards use a 0.5px semantic stroke; nested editors use a distinct semantic surface rather than an added heavy shadow. Avoid card-inside-card decoration where spacing already communicates grouping.

Use host elevation roles such as `--dsw-elevation-stroke`, `--dsw-elevation-panel`, `--dsw-elevation-prominent` and `--dsw-elevation-soft` only in suitable overlay/panel contexts. The theme includes menu-specific backdrop blur, but its mask blur is `none`: this is not a frosted-glass design system for all surfaces. Do not copy global z-index values or overlay machinery into a plugin.

Maintain visible hover, active, disabled, busy and keyboard-focus states in both themes. The observed focus width is 2px and its color follows the focus/business role; host input-modality behavior is not a license to remove keyboard focus. Do not copy automatic-focus suppression onto interactive controls indiscriminately.

## Shapes

The packaged theme defines `--dsw-radius-xs: 4px`, `--dsw-radius-sm: 8px`, `--dsw-radius-md: 12px`, `--dsw-radius-lg: 16px`, `--dsw-radius-xl: 20px` and `--dsw-radius-panel: 28px`. Consume the variables, not a second independent radius scale.

Models' medium buttons are 36px high with the medium radius; compact row actions are 28px with the small radius. Its input is 32px high with the medium radius. These visual measurements do not by themselves establish adequate touch targets; validate the actual hit area for the approved device context. Native status dots deliberately remain circular.

Where supported, the host sets a superellipse corner shape. Allow host behavior to flow through; do not install a global corner-shape rule or emulate unsupported browser geometry. Use round geometry intentionally for dots and circular controls.

Motion should explain state, not decorate a settings page. Theme defaults are 0.1s / 0.2s / 0.3s with `cubic-bezier(.4, 0, .2, 1)`. Prefer host duration/easing variables where available, keep transitions local and honor reduced motion. Do not animate layout or delays that obstruct cancellation or focus.

## Components

### Selection and ownership

The published rc.3 primitives declarations expose Button, Input, Switch, Checkbox, DisclosureRow, SegmentedControl, Modal, Menu, Tooltip, SettingsForm and rendering helpers. That inventory is design/API research, **not an external-plugin runtime allowlist**. Apply the reuse boundary in Overview before choosing any dependency. For an allowed direct primitive, pin and test its real contract. For an adaptation, own its implementation and accessibility under the retained `majed`-prefixed compatibility styles/IDs.

Do not bind to native hashed CSS selectors, assume `apply` exports a React component, or mutate another plugin's registrations. Supported slots may permit composition without exposing their enclosing page's implementation. Verify each seam separately.

### Behavior to preserve

| Pattern | Required behavior in Waycraft |
| --- | --- |
| Button / icon action | Real button semantics, accessible name, keyboard activation, visible focus and honest disabled/busy state; destructive action is distinct |
| Input / secret field | Associated label/help/error; preserve drafts; secrets are write-only and never echoed as saved values; key metadata is separate from identity/service availability |
| Switch / checkbox | Accessible checked/disabled state and label; no color-only state; avoid silently committing unrelated fields |
| Disclosure / grouped row | Explicit toggle and expanded state; associated content; preserve content ownership and avoid duplicate controllers/polling |
| Segmented choices / tabs | Named group, selected state, associated panel and coherent keyboard/focus behavior; test RTL rather than assuming arrow semantics |
| Inline editor | Local save/cancel, loading/failure/retry, stale revision and partial-save treatment; do not discard drafts on unrelated refresh |
| Menu / dialog / tooltip | Appropriate focus entry/return, dismissal and overlay lifecycle; tooltip never contains the only essential instruction |
| Status / quota / progress | State label and units, known versus unknown, reset context when available; no fabricated zero or invented account identity |
| Tool / media output | Preserve meaningful whitespace, safe wrapping and bounded overflow; loading/failure/cancel and unavailable media have explicit presentation |

Use established DSH icons through a supported API, or a licensed owned adaptation; do not depend on brittle internal SVG selectors. Decorative icons are hidden from assistive technology; icon-only controls have localized accessible names. Prefer `currentColor` for adaptive icon strokes rather than copying fixed native SVG colors.

### Source adaptation and maintenance

For any copied substantial source, preserve the MIT copyright and permission notice in the distribution and record upstream URL/version, original path, relevant behavior and local changes in provenance/third-party notices. The inspected native packages carry Copyright (c) 2026 DeepSeek. Do not assume unrelated assets or dependencies share that license without checking them.

After a host upgrade, compare the version and relevant source fingerprints, recheck the extension/primitive contract and review the adapted pattern. Update this reference only for demonstrated changes; do not automatically churn every feature because an internal class name changed. Existing screenshots and rc.3 proofs are historical evidence, not certification of rc.5 integration.

## Do's and Don'ts

**Do:** start from the closest native surface; inherit theme/fonts; scope and prefix owned styles/IDs; preserve EN/AR and keyboard behavior; keep real states explicit; reuse supported seams or maintain licensed adaptations; record evidence and remaining gaps.

**Don't:** patch DSH, replace native Settings > Models, import private closures, equate package publication with supported external loadability, freeze sampled colors, add a new brand/font/global CSS reset, copy RTL defects, confuse credential presence with health, fabricate quotas, or present a design document as installed acceptance.

### Verification before calling a feature finished

Use the approved feature's behavioral tests and preservation checks, then inspect its real rendered composition in both themes/directions and representative widths. Cover normal/empty/loading/busy/error/cancel/retry/conflict/partial states that the feature actually has; check keyboard access, focus return, overflow, long content and enlarged text. Distinguish geometry assertions from visually inspected captures.

An adapted component fixture, installed DSH use, paired-remote use and live-provider behavior are different evidence seams. This document changes no product code, proves no installed UI parity and grants no installation/account/provider permissions. Source matching complements—not replaces—a proportionate rendered check. Keep the check bounded to the approved feature rather than turning it into an unrelated browser-infrastructure project.
