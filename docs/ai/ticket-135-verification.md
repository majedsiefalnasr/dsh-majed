# #135 — Google Antigravity verification

## Contract and revision

Candidate on `impl/135-antigravity` in the exact `dsh-majed-t135` checkout, based on `9cb0b18a23081075d7bec77e17ba7ee401dbe57f`. Only #135; no #136+, installed state, credentials, real provider operations, installation, package, merge, push or closure. Independent final review belongs to Lead separately. The unavailable historical implement skill was not invented; Owner-authorized lean-build/TDD/Karpathy fallback used.

Source: https://github.com/V1ki/dsh-plugin-subscriptions v0.9.12 at `b8023110864494acefc6f5963c2a197d85dda20c`, MIT. Existing owned account, controller, settings, pool, storage and browser lifecycle reused. Provenance details and local safety deviations: `src/PROVENANCE.md`.

## Controlled evidence

- Reference 34-case Antigravity suite first failed compilation for missing provider/translator, then passed after the actual source port. Includes Google PKCE/offline scopes, token/account/project/catalog/quota wire behavior, translation, thinking, tool schema and replay/stream behavior. Reference visible-model filter assertions ported separately, replacing Chinese locale with Arabic only.
- Assembled owned RPC mock Google login drives login/manual callback with state, exchange, project discovery and profile, private account persistence, status, quota, Manage, registered-adapter chat and logout. All HTTP is synthetic; no real credentials or endpoints are consumed.
- Explicit independent account entries assert the chosen account's bearer and project on the generation wire; the default account is not substituted.
- Token JSON body cancellation asserts cancellation and unlocked response body. Signals propagate through project/onboarding/profile and reader bodies, and onboarding sleeps unregister abort listeners. Refresh/usage use owned overall timeout helpers.
- Card fixture executes the actual card function in English/Arabic, asserts visible quota and hidden quota exclusion, isolated identity and Manage provider routing. This is a lightweight hook fixture, not actual-browser visual proof.
- Actual React Manage component is composed with real owned RPC in EN/AR, edits two aliases and pool/independent-entry drafts, saves and checks registered model entries. Synthetic accounts only.
- Full suite after implementation: classifier166/166; Node808/808, zero failures/cancellations/skips. Final additional account-isolation focused suite3/3 passes; final full rerun exit0: classifier166/166 and Node809/809, zero failures/cancellations/skips.
- `npm run check:build` exit0: committed output matches fresh build. `git diff --check` exit0. Logs `/tmp/majed135-tests.log`, `/tmp/majed135-build.log`, `/tmp/majed135-checkbuild.log`, `/tmp/majed135-isolation.log`.

Planned red tests are excluded from investigation budget. One full regression run exposed provider-inventory assertions and namespace-test model-id allowance; expectations were expanded, not removed. One planned new filter test compile needed JSON import attributes and missing localized strings; fixed and rerun. No unresolved diagnostic blocker. npm ci used `--ignore-scripts --cache /tmp/majed-t135-npm-cache`; npm reported15 high-severity dependency vulnerabilities in the existing locked dependency set. No dependency upgrades or audit fixes were attempted.

## Scoped review correction from `e6fe9a715abd689193b341b7ab0603ce00cf3665`

Owner explicitly extended the exhausted compile investigation budget by 20 minutes, solely to complete this defect and its gates. Preserved the partial source/tests/generated/docs. The actual installed `LlmErrorOptions` accepts status/retry facts, while the constructor creates frozen `failure.message` from its first argument. The narrow correction reconstructs the error with the sanitized first argument and supported status/retry options; neither readonly metadata nor shared classification is mutated.

Prior observed red evidence: `/tmp/majed135-cancel-red.log` has two stalled SSE failures (`body did not settle`); `/tmp/majed135-errors-red.log` has three stalled exchange/refresh/internal error-body failures with the same symptom (SSE already green). Intermediate five-case green was historical, not final validation. Current real-Response regression matrix adds pending/rejecting cancellation for caller/idle SSE, all three error-body owners, sanitized permanent OAuth/HTTP rate-limit classification and controller no-account/no-change after a late token response. Focused result: nine passed, zero failures/cancellations/skips (`/tmp/majed135-extension-focused.log`). Controller runtime behavior is unchanged; its persistence proof is now explicit. P3 card/token test names no longer claim behavior their assertions do not cover; translator owner-signal adaptation is recorded in provenance.

The first extension build succeeded, then the expanded regression exposed a test expectation mismatch: shared retry classification intentionally adds a two-second reset grace, so `Retry-After: 2` remains 4000 ms, not 2000 ms. Corrected the test literal to preserve that existing behavior; production rate-limit code was not changed. One extension validation failure, resolved without a bypass. Build log: `/tmp/majed135-extension-build.log`.

Final correction gates: `npm run build` exit0; focused matrix9/9; `npm test` exit0 (classifier166/166, Node818/818, zero failures/cancellations/skips); `npm run check:build` exit0 (`Committed output matches a fresh build.`); `git diff --check` exit0. Full-suite and comparison logs: `/tmp/majed135-extension-tests.log` and `/tmp/majed135-extension-checkbuild.log`. This is controlled candidate evidence only; no independent Lead review, installed state or provider acceptance is claimed.

## Remaining gates and honest limitations

Candidate is not Owner live acceptance, independent review, installed desktop/restart proof or pixel-parity proof. Real provider endpoint availability, OAuth consent/eligibility/onboarding and subscription quota correctness remain live-only. No browser session or real account was accessed. No release archive is prepared before independent review, as requested. Existing React deprecation warnings and handled Claude CLI fallback remain. The public bundled OAuth application identity comes from pinned source, not a private Owner secret.

The runtime uses shared provider id `antigravity` deliberately (ADR-0002); owned RPC/storage/global identifiers remain Majed-prefixed. Reference and owned component must not be active simultaneously for the shared provider.

## One consolidated Owner checklist (after independent review/package verification)

1. Separately approve reversible installation; retain reference fallback and disable its shared provider registration before enabling owned Subscriptions. Full desktop restart is required for host changes.
2. Check Antigravity card and Manage in English/Arabic, including RTL identity, controls, warnings and login/manual/cancel states.
3. Using the Owner's own Google account, connect and confirm identity/plan, refresh per-model quotas, change shown models in Manage and confirm ordinary/weekly quota windows follow exact shown model IDs (automatic and empty selection included).
4. With separate permission for live generation, send a short chat using an Antigravity model and, if two accounts are available, a pinned independent account. Check saved aliases/default/pool/model settings and reconnect behavior.
5. Cancel a pending login and verify no late account appears; test component off/on and safe switch back to the untouched reference. Report only affected failures together. Do not share credentials or callback URLs in evidence.

Owner live acceptance remains pending; ticket stays open.
