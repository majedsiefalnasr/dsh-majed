# Current work

Updated 2026-10-29 (Africa/Cairo).

## Phase

**Ticket breakdown for the Subscriptions component** (`/to-tickets`). The spec and its test seams were approved by the Owner and published as #127 (`ready-for-agent`). No implementation is authorized until the ticket breakdown is approved and published.

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
7. Old ADRs dropped from this branch (kept on the archived integration branch); ADRs rewritten from 0001 (decision 18).
8. Components: core row `majed` (0.2.0 preferences, only browser half) plus row `majed-subscriptions`; later features get their own rows (ADR-0001).
9. Same provider ids as the reference; our component ships off; the Owner swaps with switches; own storage, RPC prefix and tool names (ADR-0002).
10. Port the reference as an owned fork under MIT with provenance: first port close to the original, improvements as separate tickets after acceptance, later upstream releases optional (ADR-0003).
11. OpenCode Zen: minimal adapter, catalog and status card under id `opencode-zen`; no sidecar, IP pool or binary download; ToS risk accepted; last ticket.
12. API providers through DSH's public `dsh-api-remotes` seam; DSH settings are the only store, shared with Settings > Models.
13. One Settings section "Subscriptions" with two parts (Subscription accounts, API providers), built from DSH primitives and design tokens; usage badge, Speed, `/fast` and media toolviews stay where the reference puts them.
14. All five reference providers are ported; Antigravity last among them.
15. Governance files carried to this branch; new CHANGELOG from 0.2.0; glossary limited to current terms.
16. Ticket order: component + empty section → Codex end to end → Manage/model list/pool/proxy → usage badge/Speed/`/fast` → Claude → Grok with image/video/x_search → Copilot → Antigravity → API providers → OpenCode Zen.

17. Distribution: keep installing from GitHub; commit the built output in its own directory with a test that it matches the source (ADR-0004). npm publishing could be a later ticket.
18. ADRs only for hard-to-reverse, surprising decisions with real trade-offs: 0001 components, 0002 reference provider ids, 0003 owned fork, 0004 committed build. Live verification stays an `AGENTS.md` rule; API-provider storage and OpenCode Zen scope live in the spec.

## Sources

- Research (2026-10-29): `docs/research/dsh-plugin-components-2026-10-29.md`, `docs/research/subscriptions-reference-inventory-2026-10-29.md`, `docs/research/opencode-and-native-api-providers-2026-10-29.md`.
- Reference source: https://github.com/V1ki/dsh-plugin-subscriptions tag `v0.9.12` (`b802311`), MIT. OpenCode method: https://github.com/FishBottle7/opencode2dsh v0.3.14, MIT.

## Repository state

- `feat/subscriptions` pushed to origin at `c7f8598` (docs only, no code).
- Incident 2026-10-29: the first push went to `main` because the new branch tracked `origin/main` (`push.default=upstream`); `main` was fast-forwarded from `d6fe0e3` to `c7f8598` (19 docs files, no code). The installed plugin is pinned in the profile lockfile to `d6fe0e3` and is unaffected. Restoring `main` needs a force push and the Owner's decision. The branch now tracks `origin/feat/subscriptions`.

## Next allowed action

Present the ticket breakdown to the Owner; publish the tickets (sub-issues of #127, native blocking edges) only after approval. Obtain the Owner's decision on restoring `main`.
