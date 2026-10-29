# Codex account integration

Source: V1ki/dsh-plugin-subscriptions, reviewed pin `9930c5ee5e3fa239db9031f47a0f6f30f7ffc443` (0.9.9). See `docs/reference-artifacts.json` for captured file hashes and license inspection.

- `pkce.js` and `oauth-flow.js` are type-erased adaptations of `src/auth/pkce.ts` and `src/auth/oauth-flow.ts`. Type erasure used Node's `stripTypeScriptTypes`; no runtime compiler dependency is shipped.
- `protocol.js` adapts `codexFlow`, code exchange, JSON refresh, permanent-error classification and token-to-session parsing from `src/providers/codex.ts`. It injects the external Fetch boundary, sanitizes error messages and preserves the upstream client ID, authorization flags, scope and grant formats.
- `storage.js`, `accounts.js` and `native.js` add Majed-owned storage, lifecycle, authentication boundary and Settings composition. The file is exclusively `plugins/dsh-majed/codex-auth.json`; no reference store, credential importer or installed credential reader is used. Stored sessions preserve the upstream Codex session fields, inside a versioned Majed account/revision envelope. Stable account identities include workspace and user (or workspace-only legacy fallback), encoded as SHA-256 IDs.
- The browser callback checks state before provider errors, redacts provider error text, and reports authorization receipt rather than successful token exchange. The Majed manual completion boundary requires the full matching state-bearing callback; upstream's unverified bare-code shortcut is intentionally unavailable.
- Majed keeps account credentials out of snapshots, and serializes atomic mode-0600 writes with cancellation checked immediately before rename. Refreshes coalesce; revision checks protect a newer login from an older refresh response. Transient refresh errors preserve the account; permanent grant errors mark reauthentication required without deleting credentials.

The upstream flow and grant behavior are characterized by Majed's accepted controlled-protocol tests (`test/accepted/codex-account.test.js` and `codex-settings.test.js`). No upstream test suite is claimed executed. Upstream uses additional provider/translation dependencies which are not imported by this bounded account integration. No new external runtime dependency is introduced.

## S16 partial candidate additions

The usage/reset mapping in `usage.js` and preference validation in `provider-settings.js` adapt v0.9.11 commit `7639ed9958a9a1c4159faa1f4e6e15e9ede60b7d` (https://github.com/V1ki/dsh-plugin-subscriptions), MIT. Majed adds injected transport, bounded JSON reads, sanitized errors and account-bound single-use redemption tickets. `native.js` exposes exact `majed/subscriptions.*` routes through the existing public Fetch registration and protected store. Authenticated reference status explicitly requests full emails; runtime snapshots retain masked identity. Reference settings map into existing direct model visibility, names, reasoning/context and independent-entry consumers; subagent speed uses public agents origin metadata. Pool membership/allowlists are persisted only and are not applied until S09. Codex cache TTL is rejected. See ../ui/PROVENANCE.md for incomplete UI status and generation.

## R02 direct runtime additions

`upstream/UPSTREAM.json` records eight compiled input hashes, verified against the reviewed 0.9.9 artifact in `docs/reference-artifacts.json`. `upstream/compat.js`, `translate/{responses,resolved,sse}.js` and `providers/{common,rate-limit,catalog-refresh}.js` retain the reviewed compiled behavior with attribution headers and explicit namespace adaptations. `providers/codex-helpers.js` extracts only catalog discovery and pure request/tool-pairing helpers from compiled `providers/codex.js`. No upstream credential store, global proxy module or source plugin entry is imported. Its default transport uses native Fetch, while production always passes Majed's selected isolated transport.

Host LLM imports are redirected through the late-bound `upstream/host-llm.js` bridge. Production obtains the namespace through declared public `loader.import('@deepseek-ai/dsh-llm')` injection and verifies the public adapter/runtime preparation methods before enabling dispatch. The compatibility tool-call brand lookup is delayed until use. Disabled startup requires no new native package dependency; package engine minimums are unchanged. The actual public loader namespace identity is checked by the exact-host fixture. The older dev library used in portable tests is not evidence about installed rc.2 compatibility.

`runtime.js` composes those helpers with Majed's real account/refresh service, private per-account catalog and model preferences, public native LLM registration and prepared-account dispatch. Error messages are replaced with bounded secret-free categories. Stream cancellation and idle deadlines wrap the source reader so an uncooperative controlled source cannot strand disposal; partial output is never replayed. Opaque encrypted reasoning replay is bound to concrete provider/account/model identity before reuse. Unknown manually entered/unlisted model capabilities remain absent rather than taking invented defaults.

The runtime preserves the pinned source's public `codex` provider and `~account:<encoded-account>:<encoded-model>` independent IDs. Plain direct routes are prepared against one account and do not silently fail over. The reviewed disposable startup/hourly catalog scheduler is retained. Standard/Fast remains session-scoped, exposed by the composer and an enabled-runtime-only `/fast` contribution, adapting the source's `client/index.ts`, `SpeedSelect.tsx` and `fast-command.ts` public RPC/slot/command behavior into Majed's existing bundle. Model catalog metadata never enrolls Auto. `test/accepted/codex-direct.test.js` characterizes the adapted source-backed runtime; the native product runner adds `--codex-direct`. No upstream test-suite execution or live provider compatibility is claimed. Updates require a deliberately reviewed pin/artifact, input-hash verification, retained attribution and rerunning the portable plus exact-host protocol/preparation fixtures.

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
