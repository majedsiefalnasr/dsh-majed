# Current work

Updated 2026-10-29 (Africa/Cairo).

## Phase

**CURRENT OVERRIDE: #128 accepted and closed; #129 authorized.** This worktree is `dsh-majed-t129`, branch `impl/129-codex`, baseline `e796366`. The direct Owner instruction and Lead record supersede the historical #128 freeze below. Only #129 is active; no #130+ implementation is authorized.

## #129 bounded contract and source inventory

- Outcome: port the pinned reference shared accounts/auth/RPC/provider translation/pooling/retry and Codex end to end, retaining core 0.2.0 and the optional component default off.
- Source: `/tmp/upstream-0.9.12`, V1ki/dsh-plugin-subscriptions v0.9.12, commit `b802311`, MIT. Inventory: `src/auth/{store,jwt,pkce,oauth-flow,rpc}.ts`; `src/providers/{accounts,common,codex,codex-client-version,npm-cli-version,catalog-store,catalog-refresh,pool,pool-family,pool-health,pool-usage,rate-limit,reset-redemption}.ts`; `src/translate/{responses,resolved,sse}.ts`; reference `src/index.ts` composes these. Reference browser `SubscriptionsSection.tsx` contains account/login/usage controls; Manage, proxy, badge, Speed and later providers remain deferred.
- Route: `/implement` unavailable; Owner-authorized bounded TDD/Karpathy fallback. Use agreed spec seams: assembled host RPC/registered adapter with fake HTTP, rendered browser controls with fake RPC, and package/build parity. Adapt applicable reference shared-core/Codex tests, supplemented with lifecycle/isolation/no-network regression proof. No nested delegation; independent Standards/Spec review cannot run at this depth and remains a Lead gate.
- Allowed writes: this worktree and `/tmp/majed-t129`; npm cache `/tmp/npm-cache-majed`. No installed packages/profile/state, credentials, real accounts, login, live provider inference, host patches, restarts, push, merge or sibling edits.
- Invariants: own `majed-subscriptions.*` RPC and `plugins/majed/subscriptions` storage; owner-only credential files; no reference-state imports; no network/models before first login; report registration collisions without taking over the reference.
- Stop: #129 candidate only, with coherent conventional commits, committed `dist`, provenance/notices/changelog, verification document and tarball. Owner live acceptance is explicitly not fixture proof. Per-blocker investigation cap: two failed attempts or 20 minutes, then report concrete impact.
- Current state: independent review rejected initial #129 candidate e33d77f; all five remediation areas are addressed in this worktree: foreign-store fallback removed, usage appearance/dedup/pruning, safe host pending-auth remount recovery, reset expiry/prepared context, expanded applicable reference tests and explicit exclusions. Exact red/green evidence, final gate counts and packaged artifact/hash are recorded in `docs/ai/ticket-129-verification.md`. Owner installed/live acceptance and independent Lead re-review remain pending. No #130+ work started.

**Ticket #128 implemented in an isolated candidate; Owner live acceptance pending.** Spec #127 and tickets #128-#137 remain the approved plan. Only #128 is authorized in this worktree; no later ticket starts before its installed acceptance.

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

19. Restore `main` to `d6fe0e3` after the push incident (done 2026-10-29).
20. Ticket breakdown approved as proposed: ticket 2 (Codex with the shared core) stays one ticket; blocking edges as listed below.

21. Every owned DSH-global id carries the Majed plugin prefix (`majed` / `dsh-majed`): settings sections, slot entries, RPC names, storage directories, effects, locale namespaces and CSS/data attributes. Provider ids remain the deliberate ADR-0002 exception; no glossary or ADR expansion.
22. Keep our Settings section next to the enabled reference, not replacing it; distinguish its navigation title and show a conditional en/ar shared-provider warning.
23. Owner live verification: new component rows require a full restart after installation/update; in-place row discovery without restart is proven false.

## Tickets

| # | Ticket | Blocked by |
|---|---|---|
| #128 | Component row and empty Subscriptions section | none |
| #129 | Codex end to end with the shared core | #128 |
| #130 | Manage dialog, model list, account pool and proxy | #129 |
| #131 | Composer usage badge, Speed control and `/fast` | #129 |
| #132 | Claude | #129, #130 |
| #133 | Grok and agent media and search tools | #129, #130 |
| #134 | GitHub Copilot | #129 |
| #135 | Google Antigravity | #129, #130 |
| #136 | API providers part | #128 |
| #137 | OpenCode Zen | #129 |

Worked in this order, one at a time; each closes only after the Owner's live acceptance on the installed build.

## Sources

- Research (2026-10-29): `docs/research/dsh-plugin-components-2026-10-29.md`, `docs/research/subscriptions-reference-inventory-2026-10-29.md`, `docs/research/opencode-and-native-api-providers-2026-10-29.md`.
- Reference source: https://github.com/V1ki/dsh-plugin-subscriptions tag `v0.9.12` (`b802311`), MIT. OpenCode method: https://github.com/FishBottle7/opencode2dsh v0.3.14, MIT.

## Repository state

- #128 candidate: branch `impl/128-component`, worktree `dsh-majed-t128`, based on `feat/subscriptions` at `19331b6`. Local implementation only; unmerged and unpushed. Committed build output is `dist/`. Controlled tests and static findings are documented in `docs/ai/ticket-128-verification.md`; no live installation was performed.
- The baseline classifier import referenced a missing generated adapter; the test script now derives it from the unchanged core source. All 166 classifier assertions pass.
- Remaining priority: Owner installs the requested tarball, verifies row discovery/switching, English/Arabic rendering and core parity, then accepts or reports failures. No #129-#137 work is authorized.
- Incident 2026-10-29: the first push went to `main` because the new branch tracked `origin/main` (`push.default=upstream`); `main` was fast-forwarded from `d6fe0e3` to `c7f8598` (19 docs files, no code). With the Owner's approval `main` was restored to `d6fe0e3` by a force push with lease. The installed plugin was pinned to `d6fe0e3` throughout and was unaffected.

## #128 review corrections

The Owner authorized exactly three corrections on `impl/128-component` from `9c60521`: first-probe failure semantics, browser setup isolation and explicit Further Notes dispositions. The bounded surgical-patch route is sufficient because behavior and acceptance were already decided; no design or later-ticket scope is opened. Allowed writes are this worktree and the requested tarball only. Verification: assembled browser/host/package seams, full classifier suite and fresh build comparison. Investigation budget: two failed diagnostic attempts or 20 minutes per blocker; stop at the reviewed #128 candidate, with no push or installed changes.

Spec Further Notes status (exact Owner steps remain in [ticket verification](ticket-128-verification.md#spec-further-notes)):

- GitHub subpath resolution: **UNPROVEN - Owner live check required for #128 acceptance**.
- In-place row discovery: **OWNER-VERIFIED FALSE; full restart required after installation/update**.
- Third-party API remotes access: **UNPROVEN - deferred by the spec to #136, which must prove it or stop for a decision**.

#128 is acceptance-ready only after the Owner's live check of GitHub-installed subpath resolution, alongside the installed acceptance scenario. Static evidence and controlled fixtures are not live proof.

## #128 Owner live correction pass

The Owner authorized only four corrections from ba9f02d: namespaced/distinguishable Settings section, conditional reference coexistence warning, restart evidence and global-id rule/audit. Direct bounded surgical-patch route; no new design or later-ticket scope. Allowed writes: this worktree plus /tmp/majed-t128b. Tests: controlled browser/host/package seams, 166 classifier assertions, fresh committed-build match and packed content count. Investigation cap remains two failed diagnostics or 20 minutes per blocker; intentional regression-red proof is not a diagnostic blocker. No delegation available at this depth. Direct Standards/Spec review required before commit.

## Next allowed action

The four authorized corrections are complete. Fix/build/tests commit: `50a2941` (`fix(subscriptions): coexist with reference settings section`), followed by the accompanying documentation commit on impl/128-component. Controlled gates pass: classifier 166/166; seam/audit tests 24/24; `Committed output matches a fresh build.` Tarball: /tmp/majed-t128b/dsh-majed-0.2.0.tgz, 46 files. Direct Standards/Spec review found no remaining issues; independent review was unavailable at this delegation depth. Candidate stays local, unmerged and unpushed. Next: Owner live acceptance after full DSH restart, including both Settings entries, notice switching, en/ar rendering and core parity. No #129-#137, push, merge, installed changes, profile access or secrets. Detailed evidence and residual unknowns remain in docs/ai/ticket-128-verification.md.
