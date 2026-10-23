# Controlled physical carrier increment

This opt-in proof composes the existing mounted Settings transport and scoped remote fixtures. It advances the physical joins only; it does not close T02A or accept a production Manager. Base: `b62bff7`.

## Agreed seams and actual path

The requested seams are installed native Settings/renderer and `installConnection` RPC, public host `WebServer` registration/listeners, installed remote `makeRemoteApiRoutes`, native BrowserAuth/exactFetch registration, and the repository's `resolveManagementScope`. The mounted fixture button is not a shipped Manager.

The inner and outer servers are distinct public Cordis contexts. Each mounts the exported `WebServer` class as a plugin with `{ host: '127.0.0.1', port: 0, compression: 'none' }`, awaiting the plugin fiber before reading public `port`/`getOrigin()`. Instantiation inside an unrelated plugin's apply is insufficient: it does not initialize the public service listener.

A fixture root registered through public `register` calls native `authorizeIndex`. A real HTTP GET to native `authenticatedUrl` returns the 303 response and synthetic signed cookie. Neither launch URL nor cookie is printed. Only the synthetic MemoryCredentials provider is installed.

Actual native client RPC emits `api/fixture/read`. A bounded fetch adapter resolves that unmodified document-relative input against an explicit document base: inner `/` for local clicks, outer `/remote/` for remote clicks. The remote base is an explicit fixture choice, not evidence of production remote boot-prefix installation. Cookie attachment models browser transport. Payload, RPC identifier, method and native headers are not repaired. The installed outer route performs pairing admission and its actual installed HTTP proxy sends a real request to the inner listener; there is no memory handler invocation or HTTP response interception.

The exactFetch fixture validates the native client-request envelope, UUID correlation identifier and method, passes payload selectors into the real scope resolver, checks cancellation, increments an inert counter and returns a correlated server-response fixture. This is explicitly **not** the native genericFetch/host generic RPC dispatcher. Public actual SessionStore, WorkspaceRegistry and DomainFacility run over the scoped proof's synthetic persistence/KV fixtures and disposable directories.

## Safety boundary

Guards are installed before installed packages are imported and propagated with `syncBuiltinESMExports`. The Node HTTP request wrapper checks literal loopback and an assigned owned listener port, forbids socket paths/custom agents/custom connection callbacks, then delegates unchanged to actual Node HTTP. Only the two owned WebServer creations may listen, only on `127.0.0.1:0`. Net connection wrappers allow synchronous checked HTTP internals to assigned ports, not arbitrary direct connections. Literal bind lookup is answered locally while service initialization is active; other DNS APIs, external/TLS, UDP, child processes and global fetch/WebSocket are denied. Guard denial attempts execute before setup.

Adapter request bodies are capped at 16 KiB, responses at 64 KiB, with a three-second socket timeout and five-second absolute adapter deadline. The runner clears inherited environment, uses isolated HOME/DSH_HOME/cwd, caps output, enforces a thirty-second process timeout and validates JSON completion and exact path/status counts. Finally cleanup attempts each UI/context/fiber independently even after an earlier cleanup failure, then asserts every owned listener closed, including red-control failures.

## Observed evidence

Positive run on installed DSH `0.2.1-rc.2`, Electron Node `v24.21.0`: two operations from real mounted local and remote clicks; seven click statuses `[200, 200, 401, 403, 403, 401, 404]`; three actual remote proxy requests; two listeners created and closed. The JSON report includes hashes of loaded native browser bundles, host connection/WebServer entry files, remote route and proxy files.

Missing local cookie denies before endpoint delivery. Missing/revoked outer pairing leaves auth/proxy/delivery/scope/operation counters unchanged. Invalid inner signed cookie denies before delivery. Wrong workspace membership reaches the real resolver but cannot increment the counter. Exact suffix, disposed endpoint and disposed outer registration return 404 over real HTTP; endpoint counters remain unchanged. UI unmount removes DOM and subscriptions.

Initial tracer red: missing physical probe failed the runner (`MODULE_NOT_FOUND`). Subsequent bounded controls leave the test expectations and DOM code unchanged: `--red-result` produces `Count: 99` rather than expected `Count: 1`; `--red-correlation` changes only the fixture response identifier and the native client renders `Operation failed`; `--red-membership` detaches the actual native membership and likewise fails the expected first DOM result. All controls must exit nonzero, without a completed acceptance report.

## Reproduction

Set `DSH_PROBE_NODE` to the installed Electron executable; `DSH_PROBE_RUNTIME` to its bundled `dsh` directory; `DSH_PROBE_REMOTE` to the installed remote plugin's `lib/types/remote-api.js`; `DSH_MOUNTED_DEPS` to the existing mounted Settings dependency `node_modules` directory. Run `node scripts/test-management-physical-carrier.mjs`. Run separately with each supported red flag to verify sensitivity. Missing public seams fail concretely; there is no skip/fake fallback.

## Limits

This is jsdom with explicit presentation/locale/session/transport adapters, not browser/TLS evidence. Remote pairing/auth readiness, credentials, persistence and KV are synthetic; no operational stores, secrets, host patches or operational auth discovery are involved. There is no claim of production Manager CRUD, Skills/MCP composition, trusted Command Approval provenance, outer disconnect cancellation coverage, T03 acceptance, or T02A closure. Existing scoped remote cancellation/cold-membership coverage is not re-claimed as new physical coverage here.
