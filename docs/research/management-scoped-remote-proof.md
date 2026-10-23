# Bounded paired-remote authenticated scope composition

## Claim boundary and approved seams

This preparatory integration connects previously separate remote and scope proofs **in one request**. It does not implement Manager CRUD or close T02A / #4. No live, browser, socket, mounted remote service, operational credential, pairing persistence, Command hook Approval or execution claim is made.

The Owner preapproved synthetic credentials, memory persistence/storage, public native services, disposable project directories, and importing the actual installed remote leaf with an in-memory HTTP carrier. The new owned probe composes these seams without changing existing proofs or production wiring:

- Actual `makeRemoteApiRoutes` from `/Users/majedsiefalnasr/.dsh/profiles/desktop/node_modules/@linxin666/dsh-remote-web-ui/lib/types/remote-api.js` executes its pairing gate, prefix rewrite and actual `proxyLoopbackHttp` dependency. The top-level remote runtime and operational `InnerAuth` discovery are not imported. Pairing is an explicit `touchDevice`/memory-Set adapter, not the real pairing service.
- A validated no-fallback `node:http.request` double, installed before leaf import and synchronized to ESM, accepts only the fixture loopback port, POST and `/api/` path. Forwarded headers and streamed bytes are passed unchanged to the real native `/api` handler. Host/same-origin rewriting, omission of caller Origin/authorization/device/source labels and outer cookies, Content-Type preservation, encoded/repeated query and UTF-8 JSON are asserted; the inner incoming helper supplies no missing headers. Response bytes travel through the actual proxy response path.
- Actual exported `dsh-client-connection.apply` mounts native BrowserAuth and exact Fetch. Native `authenticatedUrl` plus `authorizeIndex` redeem a newly generated synthetic credential into a native signed cookie. Only a memory `CredentialProvider` and inert WebServer registration are installed. The remote factory's injected `auth.ready` returns that cookie; no operational credential discovery occurs.
- Actual public `SessionStore`, `WorkspaceRegistry` and `DomainFacility` operate with explicit memory persistence/KV boundaries. `resolveManagementScope` from `lib/management/scope.js` uses its real filesystem default over directories created under disposable HOME. A synthetic exact Fetch endpoint parses selectors, awaits that resolver and checks cancellation before incrementing the inert operation count and returning the resolved scope.

The fixture follows the controlled source patterns in `scripts/probe-management-remote.cjs` and `scripts/probe-management-composition.cjs`. Its owned carrier/service setup is intentionally self-contained; existing proofs are neither imported as executable fixtures nor refactored into shared helpers. No installed files, secrets, auth stores, profile configuration, provider state or operational session/project data are read or edited.

## Reproduction

Run from the repository worktree:

```sh
DSH_PROBE_NODE='/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness' \
DSH_PROBE_RUNTIME='/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh' \
DSH_PROBE_REMOTE='/Users/majedsiefalnasr/.dsh/profiles/desktop/node_modules/@linxin666/dsh-remote-web-ui/lib/types/remote-api.js' \
node scripts/test-management-scoped-remote.mjs
```

The runner creates disposable HOME/DSH_HOME/cwd/TMPDIR, passes only a minimal allowlisted environment, bounds the child to 30 seconds and 2 MiB output, and validates the completed JSON report and exact counts. It checks the resolved temporary parent and prefix before recursive cleanup. Missing runtime pointers, unknown flags, absent modules, child failures or premature clean exits fail rather than skip. Active guards reject HTTP/HTTPS, socket/listener, TLS, UDP bind, DNS callback/promise/Resolver, subprocess and global fetch attempts; UDP send/connect and WebSocket are blocked too. The only HTTP request exception is the validated memory carrier.

## Execution evidence — 2026-10-24

Installed runtime `0.2.1-rc.2`, ASAR-aware Electron Node `24.21.0`, runner Node `23.11.0`.

The positive command passes five assertion groups and reports `checkpoint: completed` with `proxyCalls: 11`, `innerCalls: 11`, `resolutions: 8`, `operations: 2`, `invalidations: 1`, `closes: 1`.

1. Guard validation fails closed, including a rejected non-loopback request-double target; ESM HTTP import identity is checked.
2. A live paired request reaches native BrowserAuth/exact Fetch, resolves an authorized live session/workspace and returns the literal expected canonical project scope. Client-supplied foreign `projectPath`/`cwd` cannot override it. Counts show exactly one admission/proxy/native/resolver/operation traversal for that initial request.
3. Missing and revoked pairing return 403 `unpaired` before inner credential resolution, proxy, native handler, resolver, persistence observation or operation. Missing and invalid synthetic inner cookies return native 401 before scope/operation; the actual proxy invalidates the stale cookie cache once.
4. Wrong session, wrong/unknown workspace, a live session not published in the workspace membership, and a canonical-path mismatch return 404 with no operation. A suffix on the exact endpoint returns 404 without resolver invocation. The public registry itself rejects mismatched cwd on attachment: the mismatch fixture therefore establishes cold membership with a matching synthetic header, then changes only that persisted header to the foreign directory before the request. The resolver rejects this fresh mismatch.
5. A persisted cold member resolves through actual public services without publishing or resuming a session. During a second cold request, synthetic persistence emits `close` on the **inner** memory response; the actual native bridge aborts the resolver's signal and returns 499 without operation. This proves inner-carrier cancellation only, not propagation of a real outer remote disconnect. Every request, including denials and cancellation, asserts no workspace storage writes. Reverse fiber disposal awaits one storage close.

Negative control: append `--red-membership` to the command. It detaches only the synthetic cold session's actual workspace membership before the positive cold request; the expected 200 assertion remains unchanged. The run fails at `authorized-cold-membership: ERR_ASSERTION`, with child and runner exit 1. This is sensitivity to a missing authority fact, not a changed expectation or patched production resolver.

TDD record: the new runner first failed with `MODULE_NOT_FOUND` for the not-yet-created integrated probe. The initial composed fixture then exposed the public registry's mismatched-cwd attachment rejection; the fixture was corrected to change the cold fact only after legitimate membership establishment. Positive composition and the membership-fact red control then produced the outcomes above. The unchanged neighboring remote and native-composition runners also passed on this exact host; staged whitespace validation passed. No production source was changed to obtain green.

## Remaining acceptance

This is a bounded in-memory carrier composition, not actual supported-carrier/live acceptance. Real pairing lifecycle/revocation persistence, operational inner-auth discovery, mounted remote plugin/service, socket/TLS/browser behavior, actual Settings-to-Manager CRUD, Skills/MCP integration with those operations, per-agent isolation and remaining T02A combined acceptance remain open. Canonical project paths are read-only observations, not filesystem capabilities or mutation leases. No trustworthy original local/remote provenance is inferred at Fetch; ADR 0008 / T02E remains separate and unavailable for Command hook Approval/execution. No package, GitHub, shared ledger, changelog, installed-state or production registration change belongs to this slice.
