# Codex account integration

Source: V1ki/dsh-plugin-subscriptions, reviewed pin `9930c5ee5e3fa239db9031f47a0f6f30f7ffc443` (0.9.9). See `docs/reference-artifacts.json` for captured file hashes and license inspection.

- `pkce.js` and `oauth-flow.js` are type-erased adaptations of `src/auth/pkce.ts` and `src/auth/oauth-flow.ts`. Type erasure used Node's `stripTypeScriptTypes`; no runtime compiler dependency is shipped.
- `protocol.js` adapts `codexFlow`, code exchange, JSON refresh, permanent-error classification and token-to-session parsing from `src/providers/codex.ts`. It injects the external Fetch boundary, sanitizes error messages and preserves the upstream client ID, authorization flags, scope and grant formats.
- `storage.js`, `accounts.js` and `native.js` add Majed-owned storage, lifecycle, authentication boundary and Settings composition. The file is exclusively `plugins/dsh-majed/codex-auth.json`; no reference store, credential importer or installed credential reader is used. Stored sessions preserve the upstream Codex session fields, inside a versioned Majed account/revision envelope. Stable account identities include workspace and user (or workspace-only legacy fallback), encoded as SHA-256 IDs.
- The browser callback checks state before provider errors, redacts provider error text, and reports authorization receipt rather than successful token exchange. The Majed manual completion boundary requires the full matching state-bearing callback; upstream's unverified bare-code shortcut is intentionally unavailable.
- Majed keeps account credentials out of snapshots, and serializes atomic mode-0600 writes with cancellation checked immediately before rename. Refreshes coalesce; revision checks protect a newer login from an older refresh response. Transient refresh errors preserve the account; permanent grant errors mark reauthentication required without deleting credentials.

The upstream flow and grant behavior are characterized by Majed's accepted controlled-protocol tests (`test/accepted/codex-account.test.js` and `codex-settings.test.js`). No upstream test suite is claimed executed. Upstream uses additional provider/translation dependencies which are not imported by this bounded account integration. No new external runtime dependency is introduced.

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
