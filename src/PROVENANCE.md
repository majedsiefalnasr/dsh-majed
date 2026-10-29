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
- Changed every reference storage root to `plugins/majed/subscriptions`; credential parent directory is explicitly 0700, atomic credential files remain 0600. No reference state is read or imported.
- Replaced reference composition/RPC controller with Codex-only `subscriptions.ts` and `auth/controller.ts`, retaining account ownership, OAuth completion cancellation, authenticated envelope conventions and reset-redemption guards. Reference static Codex fallback models retained. Shared internal account families/pool/retry are wired without later-ticket management UI.
- Replaced proxy transport with a lazy fetch facade in `http.ts`; no global dispatcher or proxy settings are installed in #129.
- Adapted reference account/login/usage interaction into `codex-card.ts`, injected into the #128 browser section using DSH Button/Input primitives and tokens, English/Arabic only. No Manage, speed, badge, media or later-provider registration.
- Adapted complete reference shared store/accounts/pool/health/usage/catalog/version/reset/SSE tests; selected Codex-only model, request-body, rate-limit and usage cases from mixed-provider suites. Imports and fixture storage paths changed; unrelated provider cases excluded. Additional assembled host and rendered browser fixtures cover owned behavior.
- Removed no reference license attribution. Generic shared-core provider type branches are retained for fidelity; they do not enable or register other providers.

The #128 descriptions above describe historical scope, not the current #129 implementation. Live authorization, provider responses and installed-host acceptance are not implied by fixture tests.

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
