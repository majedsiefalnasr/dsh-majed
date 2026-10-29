# Ticket #129: Codex UI parity correction

## Contract and authority

Owner rejected the installed simplified Codex card. This bounded correction ports presentation, not a redesign: V1ki/dsh-plugin-subscriptions v0.9.12, `b8023110864494acefc6f5963c2a197d85dda20c`, MIT, read-only `/tmp/upstream-0.9.12`. Candidate starts at `085692c` on `impl/129-codex`; Lead integration at assignment was `3796839`. Latest authoritative override was read from sibling `dsh-majed-subscriptions/docs/ai/current-work.md` without modifying it. #129 stays open; no #130+ implementation or installed changes.

Allowed writes: this worktree and `/tmp/majed-t129-ui`; npm cache `/tmp/npm-cache-majed`. No profile/credential access, real accounts, provider requests, authentication, restart, push or merge. Investigation cap: two failed diagnostics or 20 minutes per blocker. Direct bounded TDD/Karpathy fallback as recorded in current work; no nested agents. Independent Standards/Spec review remains a Lead gate.

## Source map

- Reference `src/client/SubscriptionsSection.tsx:186-275`: section/card/header/status/account/usage/manual/modal styles. Ported applicable geometry and token color/radius/elevation; dropped proxy/device-code-only styles.
- Reference `src/client/SubscriptionsSection.tsx:277-339`: dot/status/client-version/window-label/bar-color helpers, adapted to the existing injected closure and locale keys.
- Reference `src/client/SubscriptionsSection.tsx:853-1002`: Codex provider header, account identity with compact star/logout row, usage title/plan/refresh row, metadata over six-pixel bars, expandable reset credits with earliest usable credit action.
- Reference `src/client/SubscriptionsSection.tsx:1003-1073`: login/add/cancel after accounts, account-switch guidance, manual disclosure and input/submit grouping. Retained owned remount-safe authorization link.
- Reference `src/client/SubscriptionsSection.tsx:1078-1105`: native modal reset dialog, identity, weekly context, expiry, warning, acknowledgement and footer actions.
- Reference `src/client/provider-settings-styles.ts:70-185`: relevant scoped settings controls, hover/disabled/focus styling. Kept host Button/Input injection and native fallback.
- Reference `src/client/reset-action.ts:6-13`: guard conditions adapted inline; host independently revalidates. No backend edits.
- Reference `src/client/locales.ts:55-113`: scoped English labels/guidance; Arabic equivalent supplied locally.

## Changes and preserved behavior

Replaced the bare article with source-faithful bordered provider/account hierarchy. Header groups dot, provider and CLI provenance. Account row groups star, full isolated identity, plan/expiry and trailing logout. Usage groups header, plan and trailing Refresh, then window metadata/bars and reset disclosure. Actions follow accounts; empty state says Log in, connected says Add account. One full coexistence explanation remains at section level; card says unavailable and disables login without repeating it.

Kept the namespaced Settings section and both Subscription accounts/API providers parts; core 0.2.0 code and backend/security files untouched. Kept default switching, confirmed logout, popup reservation, pending-auth remount recovery, polling, paste/cancel, usage one-per-appearance/dedup/pruning, automatic force=false versus explicit force=true, reset prepared ticket/context/expiry and acknowledgement. Restored source weekly/reset availability affordance guard. No foreign-store migration reintroduced.

## Deliberate exclusions

Manage/provider settings/model editing and visible-model selection remain #130, including ProviderAccountManager. Proxy UI/transport remains #130. Badge/display setting, composer Speed and /fast remain #131. Media tools/gallery, Claude-specific OAuth/keychain, Grok, Copilot device-code, Antigravity and OpenCode Zen behavior are not part of this correction. Their source imports are stubbed only in the temporary visual comparison, never enabled in production.

## Necessary differences

- Source literal 12/13/14/16px typography maps to DSH `--dsw-font-s-*` tokens as mandated; geometry retains source pixel measures. Physical margins/alignment become logical RTL properties. Identities, versions and times use bdi. Arabic corrects trailing control placement relative to the source's physical marginLeft.
- Existing owned server and closure injection remain rather than porting unrelated reference controllers. Registration collision is owned behavior absent from reference; comparison adds the same explanatory section notice to both columns but only ours disables login.
- Reset available count excludes expired or missing-id credits, preserving remediation instead of source raw length. Expired/unknown expiry stays visible. Progressbar accessibility semantics are additive.
- Pending card retains authorization URL recovery link, so it is one line taller than reference. Empty Submit is disabled. Logout keeps owned confirmation in a native dialog rather than source window.confirm. Reset dialog keeps owned ticket expiry guard.
- Reference is English/Chinese only; Arabic comparison uses the same local dictionary for both sides, not invented upstream Arabic.

## Real DOM/render fixture and evidence

Generator: `scripts/codex-visual-fixture.mjs`. Temporary output: `/tmp/majed-t129-ui/{index.html,fixture.js,entry.jsx,reference-scoped.tsx}`. It reads the actual pinned component and styles, scopes PROVIDERS to Codex, removes intro/proxy/badge/Manage surfaces and stubs later-ticket imports. It bundles React/ReactDOM with temporary-only esbuild. Actual owned component uses its real effects and fake RPC. No host or account store is accessed. Fixed clock: 2030-01-01T00:00:00Z; fake identities alpha@example.test and beta@example.test; usage 38% session/87% weekly; fake reset ticket/credit. Both columns share 560px width, theme palette, font and browser viewport 1280×857 CSS px (requested window 1280×1000; browser chrome reduces content height).

Reproduce: install React 19, ReactDOM 19 and esbuild 0.25 only under `/tmp/majed-t129-ui`, run `node scripts/codex-visual-fixture.mjs`, then a loopback static server for that directory. URL parameters: locale=en|ar; state=logged-out|pending|accounts|collision|reset; theme=light|dark; dialog=reference|owned. Generator opens disclosures and drives reset through rendered controls; it does not inject React state. The served fixture was stopped after inspection.

Browser evidence was captured using available bsk tools only (session xefd, now stopped); no external automation process or unsupported backend. Screenshot tool returns attachments, not a writable export path. Consequently no PNG files are claimed under /tmp: the durable reproducible HTML/JS paths above are the render artifacts and these attachment hashes identify the captured images in the session:

- English/light accounts: sha256:98825b1139f111c2fc4b68f543e70fc1127cd3f7ec68a6dd085cee756d09bf52. Provider/account/usage/bar/disclosure geometry visually aligns; compact source density retained.
- Arabic/dark accounts: sha256:8ca6d11aff6382e3c5ef1ac29af760512c957cb6d1d46a286aafb6c0bd09eae0. Correct RTL trailing controls and isolated dates; known source physical-property differences visible.
- English/light pending: sha256:9019e3180f3df7a1dda653793f6c7cf219d43c28f4a78f9e8bdc311ebbf470d5. Added recovery link and disabled empty Submit documented.
- Arabic/dark pending: sha256:ba58056e64e69fbdbd39a75e58e87e3888bb741b441ca740d6210d0ab66c0f8e.
- English/light logged out: sha256:1a1e8dae135386faa781bb488c15d1ab40000bfd6624589db8c63e2aa078c790.
- Arabic/dark logged out: sha256:1867f53a2986c91cfafa32adf24cfdac8d77501964f3283656a26535815cd1e7.
- English/light collision: sha256:6f2e920e4dbc18b90b1d83d4143d462b6b058b1d73e681d8c70c104bed06a528.
- Arabic/dark collision: sha256:085997d257790d53847756bf6099f066ca49e69779324a0b1a84854047663dc8.
- Reset source English/light: sha256:2df4f118b75ac99d533fd7e99fc9e32cf3cfd9470f7ed149ee43f016e03a73ad.
- Reset owned Arabic/dark: sha256:aed4db7150944ff547d9fdcf9d26621c98191f63c8f501997b6dd2cf53aec687; source Arabic/dark: sha256:b0da15a722e7aa0a9c1ce69c2e192f6e11d06b12b93354c9b2c06051a6919925. Native modal structure, acknowledgement and disabled action inspected. Initial generator clicked both accounts in owned column; source locked first request while owned ended on beta; generator subsequently restricted to the first rendered reset control for deterministic account matching.

Limits: controlled palette tokens/native fallback controls, not installed DSH primitive rendering or exact installed theme values. No pixel-diff metric, computed contrast measurement, mobile acceptance or live-provider claim. Both languages cover all requested states, using EN/light and AR/dark (not a full language×theme matrix). Installed acceptance remains pending.

## Lead independent visual review

Lead independently rendered the reproducible fixture after correction: English/light accounts and Arabic/dark accounts at identical fake state. Provider/account boundaries, compact controls, usage bars, reset disclosure and footer density visibly align; logical RTL placement differs deliberately from upstream physical CSS. Evidence attachments: EN `sha256:9ec92a882d38b7c669d4c4d7ab5cd28cd26762aba46c3f2f808ba3e9d2e27c52`; AR `sha256:0ee7d6fcbb5ffe4ee17f4fd6d26777d2f46e233a86de25bcbb456e2bf099266a`. These are fixture observations, not installed DSH primitives or pixel-equality proof. Reviewer P3 fixed: generator now sets document language from selected locale as well as direction. Temporary browser session and server stopped.

## Regression and verification evidence

Red: `/tmp/majed-t129-ui/red.log` intentionally fails added hierarchy/collision expectations against the former article. Green after presentation port: `/tmp/majed-t129-ui/green.log`. Tests assert provider header identity/version grouping, compact account controls, usage refresh grouping, disclosure SVG, action group and no duplicate full warning, alongside all existing action/security/cache regressions.

Initial fixture build failed once because /tmp canonicalized to /private/tmp and exact importer comparison missed relative imports. Corrected to suffix matching; second build succeeded. This consumed one diagnostic attempt, not an outstanding blocker. Initial green attempt exposed expected old Add account labels and reset test without eligible weekly state; tests now use source Log in semantics and an eligible weekly fixture. No test coverage was removed.

Mechanical craft detector: `/tmp/majed-t129-ui/craft-detect.json` = `[]`. Final verification: classifier 166/166; Node 235/235, zero failures/skips; build passed; `Committed output matches a fresh build.`; `git diff --check` passed. Logs: `/tmp/majed-t129-ui/build-final.log`, `/tmp/majed-t129-ui/test-final.log`, `/tmp/majed-t129-ui/build-match.log`, `/tmp/majed-t129-ui/pack.log`. Tarball: `/tmp/majed-t129-ui/dsh-majed-0.2.0.tgz`, 70 files, SHA256 `f98a740cdc82c6a44ea506087470f0c41d99939d5ca0c8152cec0debd2dc829a`. Direct Standards review checks namespaces, token typography/colors, RTL, provenance and unchanged core/backend scope; direct Spec review checks requested groups, exclusions, warning dedup and retained actions. No remaining direct-review finding; this is not independent review. Independent review unavailable at this depth; Lead must review Standards and Spec before integration. #129 remains open for Owner installed/live acceptance.
