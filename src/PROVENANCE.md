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
