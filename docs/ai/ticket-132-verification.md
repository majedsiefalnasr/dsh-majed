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
- Imported accounts are `keychainBound`; only they sync. Sync = on refresh, prefer a fresher token already in Claude Code's store, otherwise refresh and write back only the three token fields, and only if the store still holds the token the refresh started from (this is exactly what the reference does and is the only write to Claude Code's files; OAuth accounts never write there). A single interval every 5 minutes re-reads bound accounts; it is cleared on dispose, `unref()`ed and idle when Claude registration collided.
- Tokens exist only in the protected store; status carries account label, plan and expiry only. Error text goes through `browserSafeError`. Tests assert no fixture token appears in any RPC response, error or listing.
- OAuth: authorize URL has PKCE S256, `code=true`, a 32-byte state; callback state is verified by the shared flow manager; the card opens the returned URL with `window.open(url, '_blank', 'noopener')` only after the RPC and only when the URL is non-empty.
- RPC validation: provider enum (`codex`, `claude`), method enum, `promptCacheTtl` enum (`5m`, `1h`), Codex-only endpoints (`speed`, `setSpeed`, `prepareReset`, `consumeReset`, image, proxy) reject Claude.
- Cache lifetime: Manage offers follow config / 5 minutes / 1 hour; choosing follow config removes the stored value; the effective value reaches the Anthropic request (reference tests).
- Isolation: the Claude card is wrapped in the owned error boundary; Claude registration collision leaves Codex and the Settings section working and disables only Claude login; the card, badge entries and routes disappear with the component or while the reference serves (existing presence/reference probes plus `status`).

## Tests (all run in this worktree)

- Ported reference specs in `test/reference/`: anthropic-translation, claude-cache-ttl, claude-cli-version, claude-models, claude-rate-limit, claude-usage, detect-cli, image-request-limit.
- `test/claude-owned.test.mjs` (19): OAuth literals, credential reader cases, write-back rules, synced refresh, import/OAuth/cancel/logout races, never-logged-in makes no network or credential access, assembled import and browser OAuth with fake exchange and a fake chat, safe error messages, payload validation, cache lifetime persistence, collision isolation, bounded sync timer.
- `test/claude-card.test.mjs` (11) and `test/claude-manage.test.mjs` (5): EN and AR (RTL) render and behavior of the card and the Manage cache-lifetime option.
- `test/composer-surfaces.test.mjs` (+1): Claude usage in the badge.
- Existing tests updated for the second provider (adapter capture by first id, provider lists, validation messages); `test/locale-completeness.test.mjs` scans the Claude card.
- `npm test`: classifier 166/166; Node 556/556, 0 fail/cancel/skip. `npm run check:build`: see the final report.

## Honest limits (NOT live-verified)

- No real Claude login, import, refresh, usage call, catalog call or chat was run. The real macOS Keychain and `~/.claude` path, the real OAuth redirect on `localhost`, Anthropic request acceptance (headers, beta flags, CLI version presentation) and real SSE streams are covered by fixtures only.
- Visual polish of the card was not checked in a real browser; render tests use fake React.
- Arabic copy is mine and not reviewed by a native speaker.
- Some pre-existing Manage tests print React "key" warnings from their JSX mock; they are not failures.

## Owner live test steps

Use only your own Claude account. Host changes need a full DSH restart; the client half needs only a reload.

1. Install the candidate (the Lead prepares the archive and SHA-256 and backs up the installed package first). Restart DSH fully, enable the component, make sure the reference plugin is off.
2. Settings ▸ Subscriptions (Majed): a Claude card appears under Codex with "Not logged in".
3. Option A: click Log in while Claude Code is signed in on this Mac (macOS may ask to allow reading its Keychain item): the account appears at once. Option B: use Browser authorization, finish in the browser tab, or paste the callback. Do not log out other accounts.
4. Open Manage: choose Prompt cache lifetime (5 minutes / 1 hour), save, reopen: it persists.
5. With the Owner's approval, send at most ONE short message to a Claude model and confirm a reply.
6. Switch to Arabic and check the card and Manage are translated and mirrored.
7. Turn the component off (or enable the reference): the Claude card disappears and core dsh-majed and Codex keep working.
