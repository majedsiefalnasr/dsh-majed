# Bounded paired-remote carrier composition

## Scope and public seams

This is **not mounted/live paired service acceptance**, and does not complete T02A. It exercises unchanged installed remote HTTP algorithms joined to unchanged native admission/exact Fetch through an explicit **in-memory Node HTTP carrier double**. It does not claim sockets, browser behavior, TLS, real pairing persistence, production Manager operations or trusted original local/remote provenance. T02E Command hook Approval/execution remains unavailable.

The Owner specified and authorized these seams:

- Installed `makeRemoteApiRoutes` from `/Users/majedsiefalnasr/.dsh/profiles/desktop/node_modules/@linxin666/dsh-remote-web-ui/lib/types/remote-api.js`, inspected alongside `src/remote-api.ts`. This leaf graph executes its actual `pairedDeviceIdOf`, prefix safety, local-only controls and `proxyLoopbackHttp`; no source rewriting, copied gate implementation or top-level remote runtime import.
- The actual proxy imports `request` from `node:http`. A validated, no-fallback request double is installed and synchronized to ESM **before** importing that leaf. It accepts only the constructed `127.0.0.1:43123` POST `/api/` target, captures streamed bytes, builds an in-memory incoming request and calls the real registered native `/api` handler. The return leg uses readable/writable streams through the actual proxy response path. It does not open a listener or pretend a socket was used.
- Exported native `dsh-client-connection.apply` mounts actual internal BrowserAuth and exact Fetch with inert Cordis WebServer registration and a synthetic `CredentialProvider`. A synthetic launch token is redeemed through native `authorizeIndex`; only its native signed cookie is supplied to the remote factory's injected `auth.ready`. The real remote `InnerAuth` resolver is deliberately not imported: its operational credential discovery/redemption is outside this proof.
- The injected pairing service has only `config.cookieName` and a `touchDevice` implementation over a memory Set. This tests the actual remote gate's interpretation of a pairing fact, **not** the actual pairing service's storage, lifecycle or revocation implementation. The delivered Majed namespace operation is an inert exact Fetch registration, not a production Manager implementation.

No auth stores, profile configuration, pairing stores or installed runtime files were read/edited. Only specified installed source code and native module code were loaded. No providers, command approvals, operational requests or service endpoints were used. Disposable HOME/DSH_HOME/cwd, allowlisted environment, 30-second child timeout, bounded output and checked recursive cleanup mirror the existing admission runner. No runtime/module path means hard failure, never passing skip. The runner parses the completed report and checks its result counts to reject silent premature exit.

## Execution evidence (2026-10-23)

Installed runtime `0.2.1-rc.2`, ASAR-aware Electron Node `24.21.0`; runner Node `23.11.0`.

Command (run from the worktree):

```sh
DSH_PROBE_NODE='/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness' \
DSH_PROBE_RUNTIME='/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh' \
DSH_PROBE_REMOTE='/Users/majedsiefalnasr/.dsh/profiles/desktop/node_modules/@linxin666/dsh-remote-web-ui/lib/types/remote-api.js' \
node scripts/test-management-remote.mjs
```

Green output: six assertion groups; `proxyCalls: 6`, `innerCalls: 6`, `operations: 2`, `invalidations: 1`; exit 0.

1. Active fail-closed tests reject HTTP get, HTTPS request, socket connection, listener, TLS, DNS callback/promise/Resolver, subprocess and global fetch attempts. The in-memory request double rejects a non-loopback target. Actual ESM HTTP request identity is checked. UDP and global WebSocket are also blocked; no real network fallback exists.
2. Missing and revoked device credentials produce 403 `unpaired` before `auth.ready`, proxy invocation, native handler or operation. A missing credential does not call `touchDevice`.
3. A live paired cookie reaches the actual native handler using a native signed synthetic inner cookie. Host is rewritten, Origin/authorization/outer cookies/device/source labels are not forwarded, `sec-fetch-site` becomes `same-origin`. Exact `/api/dsh-majed/remote-probe`, encoded/repeated query `?scope=alpha%2Fbeta&tag=one&tag=two`, content type and UTF-8 JSON body are asserted at exact Fetch. Literal inert JSON result returns through the proxy.
4. Empty/wrong prefixes, empty segments, encoded slash/backslash/NUL, malformed escapes and unsupported TRACE reject before inner auth/proxy. All **three actual installed** local-only table entries (`/api/pair`, `/api/update`, `/api/plugin-manager`), exact and descendant paths, deny. The module comment mentions four planes but the actual table contains three: no fourth protection is inferred. An unbound port yields 503 without proxy/inner auth.
5. Live pairing without inner auth yields native 401 without operation. An altered synthetic signed cookie yields 401 and actual proxy `invalidate` call. Thus the carrier double does not substitute an admission decision for BrowserAuth.
6. Live cookieless device header admits. A revoked primary cookie cannot be rescued by a live header. Exact-route suffixes yield 404 without operation; removing the live device fact prevents subsequent inner auth/proxy/native calls.

Negative command: append `--red-pairing`. It adds `synthetic-revoked` to the **fixture's live-device Set**; no expected status/count/assertion is changed. Actual remote gate consequently forwards it, and the fixed revoked-device rejection assertion fails at `missing-and-revoked-pairing: ERR_ASSERTION`; child and runner exit 1. This is sensitivity to the input pairing fact, not a fabricated assertion reversal.

TDD record: initial runner failed `MODULE_NOT_FOUND` for the not-yet-created probe; first gate slice then passed; actual proxy/native positive slice passed; active guard validation caught a non-constructible arrow-function Resolver guard, corrected to a throwing ordinary function; full composition then passed. No installed source was patched to obtain green.

Existing `test-management-admission.mjs` independently passed all seven assertion groups on the same host. Direct baseline runner initially failed because the fresh worktree lacked built `dist/client.js` and local `@deepseek-ai/cordis`; its classifier still passed 166/166. This is not a passing baseline regression claim; no dependencies were fetched or linked and no shared files were changed to hide the limitation.

## Header-carrier review correction (2026-10-24)

A static review found that the common incoming-request helper supplied JSON Content-Type even on the inner leg, masking a missing forwarded header. The helper now copies only supplied headers; defaults belong solely to the outer fixture (and the launch request supplies its required Host explicitly). The inner carrier asserts the actual forwarded Content-Type before delivery and never synthesizes it. The unchanged exact Fetch assertion remains in place.

After correction, the explicit command above passes all six groups with unchanged counts. The unchanged `--red-pairing` control fails at `missing-and-revoked-pairing: ERR_ASSERTION`. New `--red-content-type` drops only the forwarded fixture header, without changing expected assertions, and fails at `paired-native-exact-fetch: ERR_ASSERTION`; both child and runner exit 1. These controls mutate only the explicit carrier/pairing doubles, not installed code. This corrects proof sensitivity, not production behavior or mounted acceptance.

## Remaining acceptance

Actual remote plugin mounting, real paired service and revocation persistence, operational inner credential resolver, HTTP socket/TLS/browser path, Settings rendering, production management operation composition and authenticated session/project resolution remain unproved. Native code does not preserve trustworthy original local/remote provenance at exact Fetch, so none of this grants Command hook Approval or execution authority. No shared ledger, changelog, GitHub or installed state is changed by this bounded probe.
