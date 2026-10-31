# Subscriptions provenance

- Source: https://github.com/V1ki/dsh-plugin-subscriptions
- Version: v0.9.12
- Commit: b802311
- License: MIT (copyright notice retained below).
- Scope carried over in #128: host exact Fetch RPC envelope/registration convention from src/auth/rpc.ts and browser closure-factory build recipe from tsdown.config.ts; no provider implementation.

## Every local change so far

- Reduced host behavior to one presence endpoint, majed-subscriptions.status; no accounts, storage, tools, adapters or credentials.
- Structural minimal host service types instead of reference dependencies.
- Presence response contains component identity and package version.
- Invalid envelopes receive HTTP 400; no provider dispatch/business errors.
- Host emitted by TypeScript to dist instead of lib.
- Browser closure factory is embedded inside the existing core factory in dist/client.js, the sole browser half; no second loader registration or runtime cross-package require.
- Browser settings and presence lifecycle implemented independently: one empty two-part section, polling/reconnect reconciliation, disposal and English/Arabic copy.
- Reference external module list retained; no provider wire imports, source maps, declaration emission or purity plugin needed in this presence-only slice.

## #129 owned Codex fork

Pinned source remains v0.9.12, full commit `b8023110864494acefc6f5963c2a197d85dda20c`.

- Copied reference `auth/{store,jwt,pkce,oauth-flow}.ts`, `compat.ts`, `providers/{accounts,common,codex,codex-client-version,npm-cli-version,catalog-store,catalog-refresh,pool,pool-family,pool-health,pool-usage,rate-limit,reset-redemption,replay}.ts`, and `translate/{responses,resolved,sse}.ts`. Compiled counterparts ship under `dist/`.
- Changed every reference storage root to `plugins/majed/subscriptions`; credential parent directory is explicitly 0700, atomic credential files remain 0600. Review remediation removed the inherited `plugins/router/auth.json` fallback/import/deletion entirely: missing owned credentials now mean an empty store. The original #129 candidate incorrectly retained that fallback; its earlier no-import assertion was false. Only in-place format migration of an explicitly owned file remains.
- Replaced reference composition/RPC controller with Codex-only `subscriptions.ts` and `auth/controller.ts`, retaining account ownership, OAuth completion cancellation, authenticated envelope conventions and reset-redemption guards. Reference static Codex fallback models retained. Shared internal account families/pool/retry are wired without later-ticket management UI.
- Replaced proxy transport with a lazy fetch facade in `http.ts`; no global dispatcher or proxy settings are installed in #129.
- Adapted reference account/login/usage interaction into `codex-card.ts`, injected into the #128 browser section using DSH Button/Input primitives and tokens, English/Arabic only. No Manage, speed, badge, media or later-provider registration.
- Adapted complete reference shared store/accounts/pool/health/usage/catalog/version/reset/SSE tests; selected Codex-only model, request-body, rate-limit and usage cases from mixed-provider suites. Imports and fixture storage paths changed; unrelated provider cases excluded. Additional assembled host and rendered browser fixtures cover owned behavior.
- Review remediation additionally ports the Responses/shared-image portion of reference `test/translate.spec.ts` and shared/Codex parsing, classification and wait policy portion of `test/rate-limit.spec.ts`. Mixed Anthropic/chat assertions were removed, while generic Retry-After cases use the Codex reader. Assembled auth fixtures adapt reference `test/login.spec.ts` RPC and finalizing-claim race semantics without Claude credential access. Full source/test dispositions are recorded in `docs/ai/ticket-129-verification.md`.
- Removed no reference license attribution. Generic shared-core provider type branches are retained for fidelity; they do not enable or register other providers.

The #128 descriptions above describe historical scope, not the current #129 implementation. Live authorization, provider responses and installed-host acceptance are not implied by fixture tests.

## #129 visual-parity correction

- Ported the Codex-only render hierarchy and relevant `styles`, `ClientVersionTag`, `statusText`, `usageWindowLabel`, `usageBarColor` semantics from `src/client/SubscriptionsSection.tsx:186-339,853-1073,1078-1105` at the same pinned commit. Ported applicable input/button/focus styles from `src/client/provider-settings-styles.ts:70-185`; no runtime dependency on the reference.
- Kept geometry, order, density, token colors, compact textual star controls and disclosure SVG. Replaced literal font sizes with DSH font tokens and physical layout properties with logical ones for Arabic. Added bdi isolation, progress semantics, remount-safe authorization link and disabled-empty-submit behavior. Existing owned RPC controller, usage dedup/pruning/cache force distinction and reset expiry remain unchanged.
- Retained Button/Input injection with native fallback. Added the source introduction to the owned accounts part, with only one section-level coexistence explanation and concise card collision state. Used the reference native modal dialog surface while preserving the existing owned confirmed logout flow rather than reverting to window.confirm.
- Reference reset-action guards were adapted inline, with the stronger existing usable-id/expiry filter. Retained reference warning and acknowledgement copy; expired credits remain identified and do not inflate the available count.
- Deliberately excluded Manage/provider settings/model selection, proxy, badge display, composer Speed, media and all non-Codex provider surfaces; these belong to later tickets. Exact source map, differences and controlled-render limitations are in `docs/ai/ticket-129-ui-parity.md`.
- `scripts/codex-visual-fixture.mjs` reads the pinned reference without modifying it, removes later-ticket surfaces only, and renders its real component beside the owned card with fake RPC. The temporary fixture dependencies are not shipped or added to package dependencies. Arabic comparison supplies our translation to the reference (it has English/Chinese only).

## #129 login-navigation correction

- Restored the pinned reference `src/client/SubscriptionsSection.tsx:649-678` post-RPC dispatch pattern (`window.open(response.authorizeUrl, '_blank', 'noopener')` at line 676). Local Codex card uses its existing `alive.current` guard before dispatch, login state and status refresh. Removed non-reference `about:blank` preallocation, returned-handle navigation and child cleanup; desktop denies child creation even when external dispatch succeeds, so a handle is not a success signal.
- Preserved owned action error/pending handling, authorization fallback link, paste, cancel and status behavior. Added regressions at the existing rendered-card boundary with fake delayed RPC and null-returning open, never a real auth endpoint. This is a minimal adaptation of the same MIT source, not a new runtime dependency or a DSH host patch.

## #130 settings port

- Approved source remains v0.9.12 at the full commit above. Direct ports: `provider-settings.ts`, `model-defaults.ts`, `providers/account-preferences.ts`, `http.ts`, `providers/image-pool.ts`, `providers/codex-search.ts` (verbatim), `tools/registration.ts` (aliases renamed to `dsh_majed_*`, warning prefix `dsh-majed:`) and `tools/image-generate.ts` (Codex only: Grok session, rate-limit reset and body builders removed, provider enum reduced to `gpt`, images stored under `plugins/majed/subscriptions/images`). Storage paths are `plugins/majed/subscriptions` with private parent directories. No legacy import or global dispatcher replacement is performed.
- `src/subscriptions.ts` follows the reference registration (`src/index.ts:1368-1434`): the Codex search provider is registered through `ctx.inject(['web'])` with a per-call `enabled` switch, `image_generate` through `ctx.inject(['tools'])` with `registerWithAlias`, and an `agent/created` listener restricts the registered name from the switches in force at the session's `createdAt`. The image pool is built from the reference `pool` configuration and cleared on account change.
- Deliberately excluded: `x_search`, `video_generate`, Grok and every non-Codex provider (#131/#133).
- **Pulled forward from #133 by Owner decision (2026-10-30):** the Codex `image_generate` tool and the Codex web-search provider with its image account pool ship in #130. #133 acceptance must audit and reuse these files and their tests, not duplicate them. Source map (reference v0.9.12 → owned): `src/tools/image-generate.ts` → `src/tools/image-generate.ts` (Codex only); `src/tools/registration.ts` → `src/tools/registration.ts`; `src/providers/image-pool.ts` → `src/providers/image-pool.ts`; `src/providers/codex-search.ts` → `src/providers/codex-search.ts`; registration wiring `src/index.ts:1368-1434` → `src/subscriptions.ts`; tests `test/image-tools.spec.ts`, `tool-registration.spec.ts`, `image-pool.spec.ts`, `codex-search.spec.ts` → `test/reference/*.spec.ts`, assembled in `test/tools-owned.test.mjs` and `test/lifecycle-owned.test.mjs`. Still #133: Grok image/video/`x_search`, the `image`/`video` RPC endpoints, inline gallery/lightbox tool views. Delivered in #131 (see the next section): the `speed`/`setSpeed` endpoints and the composer Speed control.
- Diagnostic sanitizer `src/diagnostic.ts` (final #130 re-review fix) is independently designed: bounded input, linear scanners and structural JSON redaction. The reference was not consulted for it; no third-party code and no new license obligation.

## #130 final-review remediation (reference parity)

- `src/subscriptions.ts`: `families` follows reference `src/index.ts:1073-1110` (per-account `withTimeout(…, POOL_USAGE_TIMEOUT_MS)` with a per-account catch, `Object.hasOwn` policy lookup, outer catch). `readForce` and `readProxyTestPayload` follow reference `src/auth/rpc.ts:429-436` and `:478-520`; the owned dialog's extra draft fields (`enabled`, `bypass`, `password: null`) are validated beyond the reference. `modelDefaults` returns the reference `ModelDefaultsCatalog[]` with boolean `force` (invalidate version cache, account catalogs and pool, re-announce); the unadvertised-effort message names model and effort. The exported schemastery `Config` mirrors the reference `Config` (`strategy` union default `quota_aware`, `switchMargin` min 1 default 2, `autoAccounts` default true); the reference file exports no separate `validatedConfig`, so the same-named `Config` schema is the validation entry and the `Config` interface stays for typing.
- `src/http.ts`: secret redaction now matches quoted and nested JSON members (`SECRET_PAIR`); `disposeProxyTransport` aborts in-flight probes and releases the resident password and load error; `proxyTestConnection` takes an optional caller `AbortSignal` (the reference has no such parameter; added so a cancelled RPC stops its probe).
- `src/subscriptions.ts` (#130 boundary pass): `providerSettings`/`modelDefaults`/`setModelDefault` bound every read with `withTimeout`/`deadlineSignal` (reference `index.ts:1262-1330` bounds only the per-account list and per-model resolve); `browserSafeError` and the registration-collision text are owned additions (no reference counterpart); the cross-provider family warning follows reference `src/index.ts:1105`; `setProviderSettings` accepts `original` and calls `ProviderSettingsStore.update` (owned atomic patch, `src/preference-merge.ts`, extracted from the client `mergeIntent`).
- `src/providers/common.ts`: `withTimeout` gains an optional parent signal and uses an explicit controller/timer; `deadlineSignal` is owned. `src/providers/codex.ts`: `discovered`, `resolveModel`, `contextLimits`, `supportsFastTier` and `fastCapableModels` take an optional signal and are bounded by `discoveryTimeoutMs`; `context_window` requires a positive safe integer; `contextLimits` clamps the default to the maximum. `src/http.ts`: `proxySetConfig` serializes writes; the connect-attempt helpers the reference calls from `apply` were not used by this package and are removed.
- Dependency provenance (divergences from the reference, stated as facts only): the reference pins `react`/`react-dom` ^18.2.0 and `undici` ^7.0.0. This package's dev renderer is React 19 (`react`, `react-test-renderer` ^19.3.1, resolved 19.3.1) and its runtime dependency is `undici` ^7.30.1 (resolved 7.30.1); both were introduced in commit `ad0fd64`, and no earlier record states why those versions were chosen. Consequences: rendered proof in `test/manage-ui-matrix.test.mjs` and the adapted UI specs runs on React 19, not the reference's 18, and the owned client uses the host-injected React factory rather than bundling React, so no React version ships; `undici` is the only runtime dependency, used by `src/http.ts` (`ProxyAgent` and `fetch`) and a floor above the reference's. Re-verifying behaviour on React 18 and undici 7.0 was not done. `@deepseek-ai/schemastery` ^3.18.5 is a dev dependency (resolved 3.18.5, already present transitively) for the `Config` schema import; the reference declares it as a peer (`^3.18.1`), and the host provides it at runtime. `@deepseek-ai/dsh-agent` was removed from devDependencies: nothing in `src` or `test` imports it, and it still resolves as the required peer of `@deepseek-ai/dsh-tools` (`npm ls` confirms).
- Browser manager/model editor and proxy controls retain the reference hierarchy and option semantics, adapted to the injected React factory and English/Arabic logical layout. `ProviderModelEditor.tsx` differs from the reference only in imports, the `original` field, the maximum-context bound, logical CSS and the `majed-` class prefix.
- Reference tests ported with a provenance header: `tool-registration`, `image-pool`, `codex-search`, `tools` (Codex image subset), `account-manager-ui`, `model-filter`, plus the earlier provider-settings, model-defaults, account-preferences and proxy-host specs. Adapted as assembled tests with documented dispositions: `provider-settings-rpc`, `model-defaults-rpc`, `subagent-speed` (as `test/effective-settings.test.mjs`). Not ported: `model-defaults-view` (helpers unused by the pinned UI), the Playwright browser fixture, and the Grok/media/speed endpoints of `rpc.spec.ts`.

## #131 composer usage badge, Speed control and `/fast`

Source: V1ki/dsh-plugin-subscriptions v0.9.12 (`b8023110864494acefc6f5963c2a197d85dda20c`, MIT), read-only. Every global id is `majed`-prefixed (slot ids `majed-subscription-speed` / `majed-subscription-usage`, RPC `majed-subscriptions.*`, CSS classes `majed-subscription-*`, storage key `majed.subscriptions.usageBadgeMode`, event `majed:subscriptions:usage-badge-mode`); provider ids and the `speed`/`setSpeed` endpoint names stay shared (ADR-0002).

| Reference | Owned | Disposition |
| --- | --- | --- |
| `src/client/SubscriptionUsageBadge.tsx` | `src/usage-badge/SubscriptionUsageBadge.tsx` | Faithful port; host primitives and `react-dom` resolved lazily (`host-modules.ts`); automatic usage reads send `force: false`; logical CSS properties for RTL; default-account star label localized. Multi-provider pure helpers are kept unchanged (later provider tickets reuse them). |
| `src/client/UsageBadgeDisplaySetting.tsx`, `usage-badge-preferences.ts`, `usage-window-filter.ts`, `host-icons.ts` | `src/usage-badge/*` | Faithful port; majed storage key and event. |
| `src/client/SpeedSelect.tsx`, `fast-command.ts` | `src/speed/*` | Faithful port; calls the owned `majed-subscriptions.speed`/`setSpeed` through `callSubscriptionsAuth`. |
| shared types from `SubscriptionsSection.tsx` | `src/usage-badge/usage-types.ts`, `slot-types.ts` | Types and `usageBarColor` only; the card itself is the #129 fork. |
| `src/auth/rpc.ts` `speed`/`setSpeed`, `src/index.ts` `speedBySession`/`selectedSpeed`/speed controller | `src/subscriptions.ts` | Same semantics: explicit per-session choice, subagent default from saved settings, Fast gated on the discovered catalog capability per request, per-account ids for independent-entry accounts. |
| `src/client/index.ts` slot and `/fast` registration | `src/browser.ts` | Registered only while the component answers and the reference is not serving; withdrawn otherwise; each registration isolated. |
| tests `client-speed`, `client-command`, `usage-badge-preferences`, `usage-window-filter`, `subscription-usage-badge` | `test/reference/*.spec.ts` | Ported; the media tool-view test belongs to #133 and the Antigravity copy test to #135. |

## #132 Claude subscription

Source: V1ki/dsh-plugin-subscriptions v0.9.12 (`b8023110864494acefc6f5963c2a197d85dda20c`, MIT), read-only. The provider id `claude` stays shared (ADR-0002); every id we own is `majed`-prefixed (RPC `majed-subscriptions.*`, storage `plugins/majed/subscriptions`, locale namespace, `data-majed-claude-*`). The provider code is a verbatim port apart from the changes listed.

| Reference | Owned | Disposition |
| --- | --- | --- |
| `src/providers/claude.ts` | `src/providers/claude.ts` | Verbatim port apart from the debug log prefix `dsh-majed:`, an optional `AbortSignal` on `refreshClaude` that also keeps `keychainBound`, and exported `fetchClaudeProfile` taking an optional signal for bounded, cancellable identity lookup (remediation). |
| `src/providers/claude-cli-version.ts` | `src/providers/claude-cli-version.ts` | Verbatim port. |
| `src/translate/anthropic.ts` | `src/translate/anthropic.ts` | Verbatim port. |
| `src/auth/claude-code-creds.ts` | `src/auth/claude-code-creds.ts` | Same credential sources, three-field merge and low-level prior-access-token check; the caller adds an identity gate before adoption/write-back. Every OS touch point (macOS Keychain via `/usr/bin/security`, `$CLAUDE_CONFIG_DIR` or `~/.claude/.credentials.json`) sits behind an injectable `ClaudeCredsIo` so tests use fakes; the default is the real store and is reached only from an explicit import and from the refresh of an imported (`keychainBound`) account. Local changes beyond the reference (remediation): `refreshClaudeSynced` keeps `keychainBound`, takes a lifecycle `AbortSignal`, and uses `ClaudeIdentityOptions` / `ClaudeProfileLookup` to resolve missing emails through the profile endpoint with a 5 s bound. Emails compare after `trim().toLowerCase()`; import records a learned email. Refresh-token continuity is a fallback only when neither email is known after lookup. A different or unproven source is never adopted or written back; the stored account can still refresh its own token. `writeFileRaw` refuses a symlink (non-atomic residual window). |
| Claude branch of `src/auth/controller.ts` / `rpc.ts` / `index.ts` (login `method`, claim counter) | `src/auth/claude-controller.ts`, `src/subscriptions.ts` | Sibling of `CodexAuthController` so Codex is untouched; `method` validated by `readLoginMethod` before any side effect, for both providers. |
| `presentedVersion` (`src/index.ts`) | `src/providers/npm-cli-version.ts` | Ported; the Claude CLI version lookup runs only while a Claude account exists. |
| Claude registration, token manager, catalog, usage, pool/health branches, background sync timer, prompt cache lifetime (`src/index.ts`, `provider-settings.ts`) | `src/subscriptions.ts` | Ported; the timer is `unref()`ed, skips when registration collided and is cleared on dispose; `ApplyOptions.claudeCredsIo` is a host-only test seam (the host never passes it). Claude registers `AccountPreferencesAdapter` like Codex and joins the pool families; a lifecycle `AbortController` is aborted on disposal (remediation). |
| Claude part of `SubscriptionsSection.tsx`, `ProviderAccountManager.tsx`, `locales.ts` | `src/claude-card.ts`, `src/settings/ProviderAccountManager.tsx`, `locale/{en,ar}.json` | Presentation port on our `codex-card` styles; owned RPC and attributes; Arabic written here. |
| tests `claude-cache-ttl`, `claude-cli-version`, `claude-models`, `claude-rate-limit`, `claude-usage`, `anthropic-translation`, `detect-cli`, `image-request-limit` | `test/reference/*.spec.ts` | Ported and passing in our suite. |

## License

MIT License

Copyright (c) 2026 V1ki

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## #134 GitHub Copilot

Pinned source: https://github.com/V1ki/dsh-plugin-subscriptions v0.9.12,
`b8023110864494acefc6f5963c2a197d85dda20c`, MIT, Copyright (c) 2026 V1ki.

- Ported `providers/copilot.ts`, `auth/device-flow.ts`, `translate/chat-completions.ts` unchanged from the pin; reused the already owned store, token manager, Responses/image/SSE translation, retry, proxy, catalog and pool implementations.
- Ported all `test/copilot.spec.ts` and `test/device-flow.spec.ts`, plus the ten Copilot cases and fixture helpers from `test/models.spec.ts` with source import paths adjusted for the owned reference-test directory. No real provider is used by these tests.
- Added `auth/copilot-controller.ts` as the Copilot slice of reference auth composition, with claim/disposal checks and sanitized errors. Integrated into existing owned RPC, provider preferences, account presentation, Manage/model defaults and pools, without new RPC names or storage.
- Added `copilot-card.ts`, adapting the existing owned account card plus reference device-code controls; EN/AR labels, logical styles, isolated code, clipboard error reporting and safe external link. No manual callback, CLI import or usage endpoint is invented for Copilot.
- Shared provider id remains `copilot`; all new owned browser attributes and lifecycle labels use Majed prefixes. Built output lives in dist. This is a local candidate, not installed/live acceptance.
