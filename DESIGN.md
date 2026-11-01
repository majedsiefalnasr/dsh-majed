---
name: DSH Majed native settings
description: Public DSH primitives and semantic theme tokens, not a replacement visual identity.
---

# Design System: DSH Majed native settings

## Overview

**Creative North Star: "Native DSH settings"**

The Owner pinned DSH's existing settings language. This minimal source-backed record preserves that authority; it is not a new brand, a pixel-parity claim or a certification of the current mixed layouts. Surface-specific composition belongs in the [unified Subscriptions brief](docs/ai/unified-subscriptions-ui-issue.md).

## Colors

Consume host semantic CSS variables rather than freezing sampled light/dark colors: `--dsw-alias-label-primary`, `--dsw-alias-label-secondary`, `--dsw-alias-label-tertiary`, `--dsw-alias-settings-card-fill`, `--dsw-alias-settings-card-stroke`, `--dsw-alias-border-l2`, and semantic success/warning/error/business roles. These references are observed in [card styles](src/codex-card.ts#L4-L60) and [API styles](src/api-providers.ts#L161-L175); their installed resolved values were not sampled in this planning slice. Color communicates state only alongside text.

## Typography

Inherit DSH's UI family and host `--dsw-font-s-*` roles. Existing code uses primary 14px and supporting 12/13px roles; provider headings remain compact rather than display typography. Preserve Arabic shaping, logical alignment and isolated technical strings. Do not introduce a font dependency.

## Layout

Use the native settings column and consistent row/editor rhythm. Existing API adaptation uses a 720px maximum column, 12px outer/8px row gaps, 12px 14px card inset, and an inset editor; subscription cards currently cap at 560px. This inconsistency is incumbent evidence to reconcile in the approved page, not two intentional design systems. Native source lineage and prior synthetic geometry are recorded in [verification](docs/ai/ticket-136-verification.md#L58-L64). Narrow layouts stack fields/actions without horizontal overflow; use logical spacing and wrapping, not truncation of critical identity/status.

## Elevation & Depth

Settings rows use tonal fill and subtle borders. Top-layer elevation is for existing secondary Manage/confirmation dialogs, not the unified Add flow. Host focus-ring and hover/active roles remain visible in both themes.

## Shapes

Use public primitive geometry and host `--dsw-radius-*` variables. Current source contains differing fallbacks; do not elevate those fallback numbers into a new token authority.

## Components

Use public `Button`, `Input`, `DisclosureRow`, `SegmentedControl`, `Checkbox`, `Switch` and settings-form primitives where their pinned public contract fits. Published 0.2.1-rc.3 exports are evidenced in [research](docs/research/reversible-models-replacement-2026-11-01.md#L56-L60); exact installed primitive bytes/loadability remain unverified. Private Models closures are not imports: substantial layout adaptation retains DeepSeek MIT copyright/permission notices and provenance. Existing source already records that adaptation in [provenance](src/PROVENANCE.md#L7-L11).

## Do's and Don'ts

Do inherit host theme, controls, keyboard behavior and layout discipline. Do retain explicit labels, disabled/busy/error states and focus restoration. Don't style or replace native Settings > Models. Don't treat API key presence as service health, missing metadata as a missing key, DeepSeek Account as an API-key row, or unavailable usage as zero. Don't create a second visual brand or fabricated quotas.
