# Current work

Updated 2026-10-29 (Africa/Cairo).

## Phase

**Specification for the Subscriptions component** (`/to-spec`), after `/grill-with-docs` rounds 1 and 2 were accepted by the Owner. No implementation is authorized until the spec, its test seams and the ticket breakdown are approved.

## Plan of record

- One feature at a time. The first feature is **Subscriptions**: every feature and UI of the reference plugin V1ki/dsh-plugin-subscriptions v0.9.12, plus an API providers part (DSH's own model settings, managed from our UI) and OpenCode Zen (method from FishBottle7/opencode2dsh). The next feature is discussed only after Subscriptions is specified and ticketed.
- Branch `feat/subscriptions`, worktree `dsh-majed-subscriptions`, started from `main` 0.2.0 (`d6fe0e3`, the installed version). The old `integration/current-scope-20261028` branch and the `archive/*` branches are reference only; nothing is taken from them unless a ticket says so explicitly.
- Execution: `/implement` one ticket at a time; the Owner's acceptance on the installed build gates the next ticket. No `/implement-spec` parallelism.

## Owner decisions (2026-10-29)

1. Start from `main`; port Subscriptions fresh from the reference source.
2. One spec for the whole Subscriptions feature; tickets are vertical slices.
3. `/implement` per ticket, Owner acceptance between tickets.
4. Image/video tools and gallery, `/fast` and speed select, composer usage badge and its display setting, and proxy settings are part of Subscriptions, after accounts and usage work.
5. Fresh logins; no credential import from the reference plugin.
6. English and Arabic (RTL) only.
7. Old ADRs reviewed: 0001, 0002 and 0006 superseded by 0011–0013; 0005 kept; 0003, 0004, 0007–0010 stay on the archived branch.
8. Components: core row `majed` (0.2.0 preferences, only browser half) plus row `majed-subscriptions`; later features get their own rows (ADR-0011).
9. Same provider ids as the reference; our component ships off; the Owner swaps with switches; own storage, RPC prefix and tool names (ADR-0012).
10. Port the reference as-is under MIT with provenance (ADR-0013).
11. OpenCode Zen: minimal adapter, catalog and status card under id `opencode-zen`; no sidecar, IP pool or binary download; ToS risk accepted; last ticket.
12. API providers through DSH's public `dsh-api-remotes` seam; DSH settings are the only store, shared with Settings > Models.
13. One Settings section "Subscriptions" with two parts (Subscription accounts, API providers), built from DSH primitives and design tokens; usage badge, Speed, `/fast` and media toolviews stay where the reference puts them.
14. All five reference providers are ported; Antigravity last among them.
15. Governance files carried to this branch; new CHANGELOG from 0.2.0; glossary limited to current terms.
16. Ticket order: component + empty section → Codex end to end → Manage/model list/pool/proxy → usage badge/Speed/`/fast` → Claude → Grok with image/video/x_search → Copilot → Antigravity → API providers → OpenCode Zen.

## Sources

- Research (2026-10-29): `docs/research/dsh-plugin-components-2026-10-29.md`, `docs/research/subscriptions-reference-inventory-2026-10-29.md`, `docs/research/opencode-and-native-api-providers-2026-10-29.md`.
- Reference source: https://github.com/V1ki/dsh-plugin-subscriptions tag `v0.9.12` (`b802311`), MIT. OpenCode method: https://github.com/FishBottle7/opencode2dsh v0.3.14, MIT.

## Next allowed action

Present the spec draft and its test seams to the Owner; publish it as a GitHub issue only after approval, then propose the ticket breakdown.
