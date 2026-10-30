# Ticket 132 work contract and verification

## Contract

- Ticket: #132, Subscriptions: Claude. Stories 43, 56 and the Claude-related stories of `docs/specs/subscriptions.md`. Baseline `be7c421` on `impl/132-claude`, worktree `dsh-majed-t132`.
- Source: V1ki/dsh-plugin-subscriptions v0.9.12 (`b8023110864494acefc6f5963c2a197d85dda20c`, MIT), read-only at `/tmp/upstream-0.9.12`. File-level map and dispositions: `src/PROVENANCE.md` section "#132".
- Scope kept: Claude only. No `~/.dsh`, `~/.claude`, macOS Keychain, installed plugin, real account, real OAuth or Anthropic network call was used; every test uses fixtures or fakes. Nothing pushed or merged.

## How the earlier draft was handled

An earlier cheaper run left uncommitted, untrusted files. All of them were reviewed against the reference line by line.

- `src/providers/claude.ts`, `claude-cli-version.ts`, `src/translate/anthropic.ts`: diffed against the reference (ignoring trailing semicolons): identical except one log prefix. Kept.
- `src/auth/claude-code-creds.ts`: reference logic preserved (same sources, same merge of only `accessToken`/`refreshToken`/`expiresAt`, same write-back condition, same file modes). Deviation: OS access moved behind an injectable `ClaudeCredsIo` (reference calls the OS directly). Verified equal behavior by the ported and new tests.
- Defects found and fixed in the draft: (1) no client card, Manage cache-lifetime option, locale keys, tests or docs; (2) the background sync timer kept the process alive (`unref()` added) and ran even when Claude registration had collided (guard added); (3) `login` ignored `payload.method` for Codex, so a stray method was silently accepted: it is now validated before any side effect for both providers; (4) no seam to test import and refresh without touching the real Keychain: `ApplyOptions.claudeCredsIo` added (host-only; the host calls `apply(ctx, config)` and the browser cannot reach it); (5) Claude catalog refresh was missing.

## What was ported, and from where

See `src/PROVENANCE.md` "#132". Summary: provider, CLI version, Anthropic translation and credential reader are verbatim or near-verbatim; the controller is a Claude sibling of `CodexAuthController`; the card, Manage cache-lifetime option and Arabic copy are our presentation of the reference UI.

## Reused from #129/#130/#131 (nothing duplicated)

`OAuthFlowManager` and the accepted callback pattern, the protected auth store and `AccountTokenManager`, `ProviderSettingsStore` and `mergeIntent`, `ProviderAccountManager` (extended, not forked), `callSubscriptionsAuth`, the card styles of `codex-card.ts` (now exported), the `guarded` error boundary, `browserSafeError`/diagnostic sanitizer for login errors, the provider-generic usage badge and its `usage` endpoint, the pool, health, usage and rate-limit machinery (Claude branches), and the RPC route and envelope checks.

## Behavior and decisions

- Login: no `method` imports Claude Code's login when present, else starts browser authorization; `method: 'oauth'` always starts browser authorization and never reads Claude Code's store; `method: 'keychain'` requires the import. Anything else is rejected (`payload.method must be "oauth" or "keychain"`; Codex rejects any method). Credential reads happen only on these explicit actions and when an imported account refreshes.
- Imported accounts are `keychainBound`; only they sync. Sync = on refresh, prefer a fresher token already in Claude Code's store, otherwise refresh and write back only the three token fields, and only if the store still holds the token the refresh started from (this is exactly what the reference does and is the only write to Claude Code's files; OAuth accounts never write there). A single interval every 5 minutes re-reads bound accounts; it is cleared on dispose, `unref()`ed and idle when Claude registration collided. The binding (`keychainBound`) survives every sync and refresh, so later refreshes keep syncing.
- Account identity (remediation, deviation from the reference): a token found in Claude Code's store is adopted only when it belongs to the same account, i.e. the emails match, or neither side has an email and the refresh token is the same. A different login is never adopted and never overwritten: the stored account refreshes its own refresh token and, if Claude Code now holds another account, write-back is skipped because the store no longer holds the token the refresh started from. A different account needs an explicit new import (Import Claude Code on the card).
- Disposal (remediation): disposing the component aborts a lifecycle signal. Pending ticks stop, a refresh in flight is aborted (the request carries the signal), and nothing is read from or written to Claude Code's store, and no session is saved, after disposal.
- Tokens exist only in the protected store; status carries account label, plan and expiry only. Error text goes through `browserSafeError`. Tests assert no fixture token appears in any RPC response, error or listing.
- OAuth: authorize URL has PKCE S256, `code=true`, a 32-byte state; callback state is verified by the shared flow manager; the card opens the returned URL with `window.open(url, '_blank', 'noopener')` only after the RPC and only when the URL is non-empty.
- RPC validation: provider enum (`codex`, `claude`), method enum, `promptCacheTtl` enum (`5m`, `1h`), Codex-only endpoints (`speed`, `setSpeed`, `prepareReset`, `consumeReset`, image, proxy) reject Claude.
- Cache lifetime: Manage offers follow config / 5 minutes / 1 hour; choosing follow config removes the stored value; the effective value reaches the Anthropic request (reference tests).
- Isolation: the Claude card is wrapped in the owned error boundary; Claude registration collision leaves Codex and the Settings section working and disables only Claude login; the Claude card, like the Codex card, lives in the owned Settings section and disappears with the component. While the reference plugin is enabled the section stays and shows the coexistence message (spec story 6, "Coexistence"): both cards remain visible (accepted #128 side-by-side decision, unchanged since #129) and Claude login is disabled when registration collided. Only the composer surfaces (usage badge, Speed, `/fast`) are withdrawn while the reference serves.
- Registration (remediation): Claude registers the preference-aware adapter (`AccountPreferencesAdapter`) exactly as Codex does, so display name, model visibility and renaming, independent-account entries and pool routing reach the picker and chat. The account pool is assembled for both providers with the same bounded per-account discovery.

## Tests (all run in this worktree)

- Ported reference specs in `test/reference/`: anthropic-translation, claude-cache-ttl, claude-cli-version, claude-models, claude-rate-limit, claude-usage, detect-cli, image-request-limit.
- `test/claude-remediation-132.test.mjs` (8): registered Claude adapter (names, models, independent entry, pool failover), binding kept across two rotations and across timer ticks, account-switch safety (stored A never replaced by source B, no write-back), disposal with a pending list or in-flight refresh (signal aborted, no write-back, no save, no unhandled rejection), and the refusal of `writeFileRaw` through a symlink.
- `test/claude-owned.test.mjs` (19): OAuth literals, credential reader cases, write-back rules, synced refresh, import/OAuth/cancel/logout races, never-logged-in makes no network or credential access, assembled import and browser OAuth with fake exchange and a fake chat, safe error messages, payload validation, cache lifetime persistence, collision isolation, bounded sync timer.
- `test/claude-card.test.mjs` (11) and `test/claude-manage.test.mjs` (5): EN and AR (RTL) render and behavior of the card and the Manage cache-lifetime option.
- `test/composer-surfaces.test.mjs` (+1): Claude usage in the badge.
- Existing tests updated for the second provider (adapter capture by first id, provider lists, validation messages); `test/locale-completeness.test.mjs` scans the Claude card.
- `npm test`: classifier 166/166; Node 564/564, 0 fail/cancel/skip (556 before remediation + 8 new). `npm run check:build`: committed output matches a fresh build.

## Honest limits (NOT live-verified)

- No real Claude login, import, refresh, usage call, catalog call or chat was run. The real macOS Keychain and `~/.claude` path, the real OAuth redirect on `localhost`, Anthropic request acceptance (headers, beta flags, CLI version presentation) and real SSE streams are covered by fixtures only.
- Visual polish of the card was not checked in a real browser; render tests use fake React.
- Arabic copy is mine and not reviewed by a native speaker.
- `writeFileRaw` (credentials file fallback, reference behavior) refuses a symlink at the credentials path (hardening added in remediation), but the check, directory creation and write are not atomic: a link planted between the check and the write could still be followed. Accepted residual risk (single-user machine, own home directory). The macOS Keychain path does not use it.
- The Claude Code store has no stable account id in the blob we read other than the email; accounts without an email are matched by refresh-token continuity only, so a refresh token that Claude Code rotated before we saw it is treated as a different login (no adoption; the stored account then fails to refresh and the Owner re-imports).
- Some pre-existing Manage tests print React "key" warnings from their JSX mock; they are not failures.

## Owner live test steps

Use only your own Claude account. Host changes need a full DSH restart; the client half needs only a reload.

1. Install the candidate (the Lead prepares the archive and SHA-256 and backs up the installed package first). Restart DSH fully, enable the component, make sure the reference plugin is off.
2. Settings ▸ Subscriptions (Majed): a Claude card appears under Codex with "Not logged in". An empty card has exactly one login control, **Log in** (import first). The card stays visible while the reference plugin is enabled, as the Codex card does; only the composer surfaces are hidden then.
3. Click **Log in**. If Claude Code is signed in on this Mac (macOS may ask to allow reading its Keychain item) the account appears at once. If Claude Code holds no login, Log in starts Browser authorization instead: the card shows **Open authorization page** and, under the manual disclosure, a field to paste the callback; finish in the browser tab or paste it. Once one account exists, the card offers two buttons: **Browser authorization** and **Import Claude Code**. A different Claude account needs an explicit new import. Do not log out other accounts.
4. Open Manage: choose Prompt cache lifetime (5 minutes / 1 hour), save, reopen: it persists.
5. With the Owner's approval, send at most ONE short message to a Claude model and confirm a reply.
6. Switch to Arabic and check the card and Manage are translated and mirrored.
7. Turn the component off: the Claude card disappears and core dsh-majed and Codex keep working. Enabling the reference instead keeps the section and shows its coexistence message (Claude login is unavailable); composer surfaces are withdrawn.
8. Never share callback URLs, authorization codes, credential files or screenshots that contain them with anyone, including in bug reports.

## Remediation after the first independent review

Findings fixed, each with a regression test that failed before the fix (`test/claude-remediation-132.test.mjs`): P2-1 the registered adapter was the raw one and pools lacked Claude; P2-2 `keychainBound` was lost after the first sync/refresh; P2-3 any different Claude Code login was adopted into the stored account; P2-4 disposal did not stop in-flight sync work. P3: Owner steps corrected (empty-card controls, card visibility, secrets warning), temp directories in tests, symlink refusal in `writeFileRaw` (non-atomic residual risk documented above). Awaiting second independent review and Owner live acceptance.
