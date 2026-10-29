# R01 (#48) Codex account: controlled lifecycle audit and targeted fixes

2026-10-29. Branch `impl/r01-codex-account`, base `6d3e9d4`. Controlled fixtures only (injected transport, temp directories, loopback ephemeral callback ports, Node v23.11.0). No real account, credential, Keychain, `~/.dsh`, browser, network, installed-host or paired-device step was used. Installed rc.3 was not inspected in this slice.

**Outcome: ticket #48 stays PARTIAL/open.** The controlled OAuth/refresh/fencing/protected-store core was already proven. Five family-rule gaps reachable through the existing native Fetch route were MISSING and are now implemented test-first. Real-browser, installed-host, operational-account and paired-device acceptance remain open (gates G0, G3, G7); nothing here marks a gate passed.

## Gap analysis

Existing relevant tests were run first (baseline `npm test`: 628/628; per file: codex-account 9/9, codex-settings 5/5, codex-direct 23/23, codex-refresh-settings 11/11, subscriptions-auth 19/19, fixture 8/8). Production composition = `index.js:20-27` `applyCodexAccounts` -> `modules/subscriptions/codex/native.js` Fetch route -> `accounts.js` -> `storage.js` private store -> `runtime.js` adapter. `modules/auth/*` and `modules/subscriptions/{auth,account,index,routes,health}.js` serve other providers and are not the Codex path.

| Clause / family rule | Class (before) | Evidence (before) | After this slice |
| --- | --- | --- | --- |
| Expiry/refresh/restart/cancel/late-settlement fencing, verified identity, atomic 0600 store, no secrets in snapshots | SATISFIED (controlled) | `test/accepted/codex-account.test.js:33,50,67,85,92,110,122,135,146`; `storage.js` atomic rename + abort check; `sessionFrom` identity pinning `protocol.js:30` | unchanged (3 tests adjusted for explicit reconnection, see below) |
| Login does not select/send/enroll Auto or tools | SATISFIED | `runtime.js` snapshot `autoEnrolled:false`; `test/accepted/codex-direct.test.js:82-96`; Auto not mounted `index.js:27` | unchanged |
| Settings -> route -> store -> reload; en/ar controls | SATISFIED | `test/accepted/codex-settings.test.js:11,45` | extended UI actions |
| Owner action -> consumer -> outcome incl. removal fences | SATISFIED | `test/accepted/codex-direct.test.js:247,293,312,334,356` | now also covers pause/sign-out/in-flight |
| Pause blocks new requests, retains login/settings | MISSING | no action/state; `native.js` action allow-list had no pause | SATISFIED (controlled): `accounts.js` `mutate(...paused)`; test `codex-lifecycle.test.js:47` |
| Sign-out removes local credentials, keeps card/settings, no provider-revocation claim | MISSING | only `remove` existed | SATISFIED (controlled): `accounts.js` `signOut`, `storage.js` signed_out shape; test `:66` (no token-endpoint call; UI note) |
| Confirmed removal | PARTIAL | remove button acted immediately (`client.js` account row) | SATISFIED: confirm/keep dialog; test `:123` (en+ar). Conversations are not touched by this module |
| Reject verified duplicate identity; explicit reconnection | MISSING | `accounts.js` silently replaced a same-identity record | SATISFIED (controlled): `duplicate_account`, `identity_mismatch`; `begin(account)`; test `:90` |
| Mask identity by default | MISSING | raw email in snapshots, UI and independent picker entry | SATISFIED for the plugin's own projections: `mask()` in `accounts.js:8`; test `:112`; Owner alias still overrides |
| Cooperative cancellation of in-flight request on revocation | PARTIAL | epoch fence only checked before each send | SATISFIED (controlled): `runtime.js` `inflight` map aborts open streams; test `:161` (pause/signOut/remove, provider body closed) |
| Real browser / installed rc.3 / paired / mobile acceptance | OPERATIONAL-ONLY | `scripts/codex-fixture/launch.mjs`, `scripts/test-settings-product.mjs --codex` need lead/installed host | still open; not run |
| Real OpenAI authorization, provider revocation, provider-side identity | OPERATIONAL-ONLY | no real account permitted | still open |
| Host-owned pause/default as a shared host account concept | BLOCKED-BY-MISSING-PUBLIC-SEAM | pause/sign-out are stored in this plugin's private store, not a host account registry | recorded limitation |

## RED / GREEN record

All commands from the worktree root; `node --test` on `test/accepted/codex-lifecycle.test.js` unless stated.

| Step | Slice | Exit | Result |
| --- | --- | --- | --- |
| RED 1 | pause/resume | 1 | `{ok:false, invalid_request}`: action unknown (1 test, 0 pass) |
| GREEN 1 | pause/resume | 0 | 1/1 |
| RED 2 | sign-out | 1 | `invalid_request` (2 tests, 1 fail) |
| GREEN 2 | sign-out | 0 | 2/2 |
| RED 3 | duplicate + reconnect | 1 | duplicate login replaced record (3 tests, 1 fail) |
| GREEN 3 | duplicate + reconnect | 0 | 3/3 |
| RED 4 | identity mask | 1 | actual `fixture@example.test` (4 tests, 1 fail) |
| GREEN 4 | identity mask | 1 then 0 | masking broke 3 older `codex-account` tests that relied on silent same-identity replacement; they now log in with explicit reconnection (`login(service, id)`) and one label assertion is masked; 13/13 |
| RED 5 | Settings UI | 1 | pause/signOut/reconnect/confirm buttons absent (en, ar fail) |
| GREEN 5 | Settings UI | 0 | 6/6 (after rebuild `npm run build`) |
| RED 6 | in-flight cancel | 1 | stream never aborted: "Promise resolution is still pending" (3 fail) |
| GREEN 6 | in-flight cancel | 0 | 9/9; first full run 3 older codex-direct tests failed (`ABORTED` vs `NO_ADAPTER`), fixed by mapping revocation aborts to `NO_ADAPTER` |
| Full | `npm test` | 0 | 637 tests, 637 pass, 0 fail, 0 cancelled, 0 skipped (baseline 628 + 9 new) |
| Classifier | `node test/classify.test.cjs` | 0 | 166/166 |
| Hygiene | `git diff --check` | 0 | clean |

## Behavior decisions

- States: `connected`, `paused`, `signed_out`, `reauthentication_required`. Only `connected` accounts are listed to the runtime (`runtime.js` `snapshotAccounts`), so pause/sign-out remove routes and fence prepared calls with the existing revocation epochs.
- Pause keeps tokens and settings and refuses refresh (`account_paused`). Sign-out deletes access/refresh/id tokens from the private store, keeps id, label, default and settings, and never calls the provider; the UI says it does not revoke the provider session.
- Reconnection is explicit (`begin` with `account`); a different verified identity returns `identity_mismatch` and changes nothing.
- Masked label is a projection only; the verified identity stays in the private 0600 store.

## Limits and remaining gates

- Controlled fixtures only; not a real browser, installed rc.3, paired or mobile observation. G0 exact host matrix, G3 provider support and G7 operations are unresolved.
- Real provider revocation, real identity masking in host-owned surfaces (host account menu, logs outside this plugin) and a host-owned shared pause/default registry need public seams not available here.
- Existing lead-only browser steps in `scripts/codex-fixture/README.md` should be re-run to observe the new buttons; that was not done.
