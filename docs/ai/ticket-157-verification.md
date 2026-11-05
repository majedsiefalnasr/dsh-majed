# #157 verification: Skill manager parity evidence

Branch `impl/157-parity-evidence`, base `4dfbf48` (#156). Run on 2026-11-05 (Africa/Cairo). Logs: `/tmp/w157/` (first pass) and `/tmp/w157/final/` (final pass after the new test). No commit, push, install, network or profile access. `node_modules` is a symlink to the sibling `156-project-installs` worktree (tooling only).

## Gates

Final pass after the Owner decisions (stats strip, Refresh, release fixes) and the L3/L4 small-finding fixes (below). Logs: `/tmp/w157b/` (before L3/L4) and `/tmp/w157c/` (after L3/L4; the figures in the table are the latest).

| Gate | Command | Exit | Result |
|---|---|---|---|
| Build | `npm run build` | 0 | "Build complete" |
| Quality | `npm run quality` (`format:check`, `lint`, `typecheck`) | 0 | clean (`npm run format` was run once for the new files) |
| Fresh build | `npm run check:build` (run after staging) | 0 | "Committed output matches a fresh build with no orphans." |
| Full tests | `npm test` | 0 | classifier `166/166`; `node --test`: tests 1182, pass 1182, fail 0, cancelled 0, skipped 0. Baseline 1172; +10 = `test/skill-manager-stats-refresh-browser.test.mjs` (stats EN/AR, pluralisation, Refresh EN/AR, stale-error clearing after Refresh EN/AR, after Retry EN/AR, failed Refresh keeps the alert). Before the L3/L4 fixes the run was 1177/1177 |
| Audit | `npm audit --offline` (first pass only) | 0 | 0 vulnerabilities against the local cache; the #150 note (16 after adding `fflate`) is neither confirmed nor refuted offline |

Earlier pass (docs + exclusions test only): 1170 -> 1172 tests.

### Small review findings fixed after the first pass (L3a-c, L4)

- L3a Refresh keeps a stable accessible name (`aria-label` "Refresh skills" / "إعادة تحميل المهارات") while busy, adds `aria-busy`, stays disabled while busy, and its visible text is "Refreshing…" / "جارٍ إعادة التحميل…" while busy.
- L3b The stats strip is `role="group"` with `aria-label` ("Skill statistics" / "إحصاءات المهارات").
- L3c Arabic Refresh label changed from "تحديث" (reads as "update") to "إعادة تحميل"; the exclusions test (`test/skill-manager-parity-exclusions.test.mjs`) still passes unchanged.
- L4 After a failed first load, a successful Refresh (any successful `mutate`) or Retry clears the stale error alert; a failed Refresh keeps it. Written first (8 of the 10 tests failed on the old build), then fixed.
- Dictionaries: +1 key per language (`statsAria`) -> 395 each; Refresh keys reworded in Arabic only.
- Mutation checks (source restored and rebuilt after each; all killed): removing the `setError(false)` in `mutate` (2 fail); removing it in the Retry handler (2 fail); removing `aria-busy` (2 fail); removing the strip `role: 'group'` (2 fail); strip `aria-label` set to the Refresh text (2 fail); Arabic label reverted to "تحديث" (1 fail); busy visible text removed (2 fail). Real screen-reader announcement and real RTL layout are NOT proven (react-test-renderer checks props only).

### Mutation checks of the new tests

Source copy restored and rebuilt after every mutant (`src/skills-browser.ts` identical to the final version). Killed: counting over filtered copies (2 fail); invalid counted as disabled (5 fail); reload without the project id (2 fail); plural label always used (1 fail); Refresh button also offered in Discover (test hangs, killed by `--test-timeout`, 1 cancelled). Survived (equivalent mutant): removing the `refreshing || switching || busy.current` guard inside `refresh()` still passes because the button is disabled while busy and `mutate()` has its own `busy` guard.

## Core and AI Providers regression

There is no separate core or AI Providers suite. The package script is `test` = `node scripts/prepare-test-dirs.mjs && node scripts/classifier-test-adapter.mjs && node test/classify.test.cjs && tsc -p tsconfig.reference.json && node --test lib-test/test/reference/*.spec.js test/*.test.mjs`. That one run includes the classifier (166), the reference specs under `lib-test/test/reference`, and every provider, account, pool, translate, auth and subscription test (`test/api-providers-136.test.mjs`, `test/unified-host-flow-138.test.mjs`, antigravity and provider-settings suites). All passed (1177/1177). No core or installed-app code is touched by #157.

## Reproducibility

`npm run check:build` rebuilds from tracked `src/`, `locale/` and fixed inputs into a temp dir and compares with committed `dist/` and `client.js`: identical, no orphans (first pass and final pass).

## Archive / package verification

Command: `npm pack --dry-run --json --cache /tmp/w157b/npm-cache --logs-dir /tmp/w157b/npm-cache/_logs` (exit 0). A `/tmp` cache was used on purpose; `.npm-pack-cache` is now also in `.gitignore`.

- `dsh-waycraft` 0.2.2, tarball 1,576,670 B, unpacked 3,374,465 B, 110 entries (was 109: the added entry is `CHANGELOG.md`, confirmed present in the file list).
- Present: `LICENSE` (MIT), `THIRD_PARTY_NOTICES.md`, `CHANGELOG.md`, `src/PROVENANCE.md`, `skills/LICENSE-APACHE-2.0`, `README.md`, `package.json`, `index.js`, `client.js`, `cordis.patch.yml`, `dist/**`, locale files, fonts with licences, `icon.svg`.
- Absent as required: no dotfiles, `.scratch`, `.agents`, cache directories, `test/`, `docs/`, credentials or fixtures (script-checked: no path starting with `.`, `test`, `docs` or `npm`).
- Closed in #157: GAP-11 (`CHANGELOG.md` added to `package.json` `files`) and GAP-12 (`.npm-pack-cache` added to `.gitignore`).
- **Notices coverage:** `THIRD_PARTY_NOTICES.md` and `src/PROVENANCE.md` cover #146–#151 and #153–#155. The stale line in `src/PROVENANCE.md` ("Project-scope installs are not offered (#156)") now says project installs are available through #156. Open Owner question N-1: whether the #156 destination picker is reference-derived and needs attribution (not decided here).

## New evidence test

`test/skill-manager-parity-exclusions.test.mjs` (2 tests, EN and AR): mounts the assembled `dist/client.js` section against the real host route, cycles the scope selector through global, project, discover and Trash, and asserts no button, option, `aria-label`, anchor or dictionary entry mentions GitHub, Issues, feedback, update checks or the Arabic equivalents, zero `<a>` elements exist, and host actions `check-update`, `online-update`, `issues` return HTTP 400. Also searched `src/skills*.ts`, `dist/client.js` and `client.js`: the only "feedback" hit is an unrelated DSH account-menu comment at `dist/client.js:10012`. Run alone: `node --test test/skill-manager-parity-exclusions.test.mjs` pass 2/2. Mutation proof was not run (the matcher is a plain regex over the rendered tree); the act-environment warnings are the existing harness noise in the other browser tests.

## New tests for the implemented items

`test/skill-manager-stats-refresh-browser.test.mjs` (10 tests): stats strip in Global and Project scopes (EN and AR, group role and label, `<bdi>` numbers, counts independent of search/filters), singular/plural labels and counts following a reload, Refresh label/stable aria/`aria-busy`/busy state/no second request/failure notice/project id/absent in Discover and Trash (EN and AR), stale load-error alert cleared by a successful Refresh and by Retry (EN and AR), alert kept by a failed Refresh. Written first and seen failing before the implementation.

## Not proven

Real browser focus and RTL layout; live ClawHub / skills.sh / GitHub; the installed DSH app and native skill registry; paired host; crash durability; DNS rebinding (O8); Windows, proxy and custom CA; external concurrent writers. The unproven claims D-T1..D-T3 (built-in source list/env overrides, `agent/created` registration, filter options) have no dedicated test; see `docs/ai/ticket-157-parity-matrix.md`.

## Changed files

`src/skills-browser.ts` (stats strip, Refresh, 10 dictionary keys per language -> 395 each), `dist/client.js`, `dist/subscriptions-client.js` (rebuilt), `test/skill-manager-stats-refresh-browser.test.mjs`, `test/skill-manager-parity-exclusions.test.mjs`, `package.json` (`files` + `CHANGELOG.md`), `.gitignore`, `src/PROVENANCE.md` (stale line), `CHANGELOG.md`, `README.md`, `docs/ai/ticket-157-parity-matrix.md`, `docs/ai/ticket-157-verification.md`, `docs/ai/ticket-157-owner-test.md`, `docs/ai/current-work.md`, `docs/ai/ui-ux-backlog.md` (new). Host JavaScript unchanged (page reload only). The slash-menu emit was not implemented: the declared host context has no `emit` (matrix F37 / GAP-17).
