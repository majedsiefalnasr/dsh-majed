# Bounded mounted Settings → native Connection → host admission proof

T02A fixture increment / #4, verified 2026-10-24 on base `7ecbc39`. This adds actual native browser Connection RPC to the earlier mounted Settings proof. It is not T03 production status, full T02A closure, or live GUI acceptance.

## Reproduce

Reuse the external staged dependencies described in [the mounted Settings proof](management-mounted-settings-proof.md). No install, production manifest, lockfile, shared runner, GitHub status or changelog change is part of this increment.

```sh
export DSH_PROBE_NODE='/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness'
export DSH_PROBE_RUNTIME='/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh'
export DSH_MOUNTED_DEPS="$(dirname "$PWD")/dsh-mounted-settings-deps/node_modules"
node scripts/test-management-mounted-transport.mjs
node scripts/test-management-mounted-transport.mjs --red-result
node scripts/test-management-mounted-transport.mjs --red-correlation
```

The runner requires all three pointers, creates its own disposable HOME/cwd/DSH_HOME, forwards no operational environment, bounds the child to 20 seconds, and removes only the verified temporary directory. Missing native code/dependencies fail concretely rather than skip or fall back to a synthetic client. It also validates the child's completed JSON report, operation/request counts, HTTP statuses and native client fingerprint; a premature clean exit is not acceptance.

## Agreed seams and actual composition

The requested seam is mounted Settings navigation/action → native browser `connection.rpc.call` → explicitly injected physical memory fetch → actual native BrowserAuth and exactFetch → inert fixture operation → correlated native response parsing → rendered DOM. The operation is an in-memory counter with literal synthetic session/workspace selectors. It does not resolve authenticated project scope: composing the existing resolver is optional and deliberately left outside this bounded increment.

The unchanged installed `dsh-client-connection/lib/client.browser.js` is evaluated through its `window.__ModuleLoader__.load` registration/factory. Its exported `installConnection(ctx, options)` installs the real client Connection on a real public Cordis Context. `options.transport.fetch` supplies only the physical memory carrier; `openStream` is a fail-loud adapter that is never invoked. **No `transport.rpc` replacement and no client-handwritten fetch or RPC request envelope is used.** The native bundle needs no module dependency adapters (its allowlist is empty); the VM supplies DOM, scheduling, URL, AbortController and WebCrypto globals. No source is rewritten or private function extracted.

The unchanged installed renderer, Settings and Settings/general bundles and real public SlotRegistry/SlotCore, React hooks/stores and ReactDOM createRoot/portal perform the mount and navigation. Presentation primitives (icons, Tooltip, Switch, ConnectionIndicator/modal-layer integration), locale, shortcuts, release status, empty session source, and remote Settings describe/event interface are explicit adapters reused in shape from the previous proof. The remote description only serves the fixture namespace; it is **not** the action's transport. The action calls `ctx.connection.rpc.call('/api', 'fixture/read', payload)` directly. Public test-runtime is version-checked/fingerprinted but not executed, because its published entry imports unavailable source files as recorded in the earlier report.

On the host, exported native `apply` creates the real HostConnectionService and internal BrowserAuth. An in-memory CredentialProvider supplies fresh synthetic signing state; a memory WebServer captures the actual `/api` registration without listening. Native `authenticatedUrl`/`authorizeIndex` exchanges a synthetic launch token for a signed cookie. Only the explicit carrier supplies this fixture cookie to in-memory IncomingMessage/ServerResponse adapters; there is no operational cookie store or browser-auth automation.

### ExactFetch fixture is not genericFetch

The fixture registers the exact POST path `/api/fixture/read` with `connection.fetch.register`. It explicitly validates the native request's four fields, `type: 'client-request'`, UUID-v4 `rpcId`, `method: 'fixture/read'`, JSON content type and exact synthetic selector payload before counting the operation. Its response is the native expected schema: `type: 'server-response'`, echoed `rpcId`, and `result: { ok: true, value: { count } }`.

This is **an exactFetch endpoint implementing a test-only RPC envelope**, not the native host genericFetch/RPC dispatch engine. The real native browser code serializes the client-request and its actual `parseConnectionResponse` validates the server-response/result; its own correlation check rejects mismatched IDs. HTTP admission failures reject in that same native RPC code before response-envelope parsing.

Native RPC emits the document-relative string `api/fixture/read`, verified before the carrier resolves it with ordinary URL semantics against `http://127.0.0.1:43123/`. The resolved path reaches the real registered host handler. This proves local relative URL composition only. There is no paired remote service/prefix, nor a manually rewritten `/remote` claim.

## Observations and red controls

Initial TDD red was the isolated runner's concrete `MODULE_NOT_FOUND` for the not-yet-created owned probe. After implementation, the exact installed runtime `0.2.1-rc.2` on Electron Node `v24.21.0` passed.

The positive run opens the actual mounted Settings dialog, selects Fixture Manager through its native button, then clicks its contributed action. The DOM begins `Not requested`, becomes `Count: 1`, becomes `Operation failed` for both missing and signature-tampered cookies, and returns to `Count: 2` after restoring the signed cookie. Four physical requests yield `[200, 401, 401, 200]`. Both denied clicks leave endpoint deliveries and operation count at one: native BrowserAuth denies before exactFetch. Actual React unmount/Cordis disposal removes DOM subscriptions and host services before the completed report is printed.

`--red-result` corrupts only the fixture's response value to 99. It exits 1 at the unchanged `native-rpc-clicked-result` assertion: actual `Count: 99`, expected `Count: 1`. `--red-correlation` corrupts only the echoed response ID; native client correlation rejection drives actual `Operation failed` versus unchanged expected `Count: 1`, also exit 1. The probe catches the error into DOM failure without printing correlation IDs or credentials. Neither control rewrites expected assertions or replaces native client code.

## Runtime identities

The probe enforces the same public dependency versions as the previous mounted proof and prints package-manifest and executable-entry SHA256 for each. No committed dependency lock is introduced; transitive npm ranges remain a reproduction limitation. Public versions: test-runtime/ui-slots/store `0.2.1-rc.2`, Cordis `4.0.5`, React/ReactDOM `18.3.1`, jsdom `26.1.0`, Zustand `4.5.7`, Immer `10.1.1`.

```text
Installed unchanged executable bundle SHA256:
dsh-client-connection/lib/client.browser.js dfc3544eb894c74b340a4c4c63a8c125fd2e983df9efed5885712574af994e62
dsh-client-connection/lib/index.js          0ebcca7583e082716f79b0b55bc1749d48269cc8db2989b043b321b57abd3684
dsh-client-ui-renderer/lib/client.js        dbdb3f26bfbc1d143bc8a0eed5982a2507c4f0cf8027e7c170f3bed3604be356
dsh-client-ui-settings/lib/client.js        0555eec2df1ca392a1167e637f287ac9963dbd2b0a230089c2a41be079c490e3
dsh-client-ui-settings-general/lib/client.js 8c99a9d9f91b606a6454d09c6c7496b2c252e0c6bed035ce1a33647c0b1f43b8
```

## Isolation and non-claims

Before product or public dependency evaluation, fail-loud guards deny global fetch/WebSocket, net connections/listeners, HTTP(S), TLS, datagrams, DNS callback/promise/Resolver APIs and child processes; builtin ESM exports are synchronized. jsdom also denies fetch/WebSocket/XMLHttpRequest and has no resource loading/script execution enabled. Only the explicitly injected memory carrier may move bytes between the native client and host handler. The supplied runtime/dependency directories are read as executable fixture inputs, never modified. No operational auth/config/state, provider, socket, listener or subprocess is opened by the child.

This is a controlled jsdom/physical-memory-carrier composition. It does not prove real browser networking, paired remote carrier/prefix, complete native presentation/focus/layout, authenticated project/session resolution, filesystem capability safety, real Manager CRUD, Skills/MCP lifecycle or production activation. Those are non-claims, not a requirement to deploy production before testing T02A: a later temporary actual carrier/service composition can test that frontier without operational stores. Only the three owned probe/runner/report files change here.
