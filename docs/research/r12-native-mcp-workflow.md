# R12 native MCP workflow implementation and fixture evidence

Date: 2026-10-26. Ticket: #52. Production composition is implemented; the evidence below uses disposable state and controlled servers, separately from browser visual and operational acceptance.

## Production composition and source choice

The public host entry mounts `/api/majed/mcp` through native exact Fetch. The native Connection service performs Owner authentication and local/paired admission before delivery. Runtime activation requires explicit `managedMcp.enabled: true` and `managedMcp.standaloneDisabled: true`; this is a single-owner configuration acknowledgement, not automatic reference detection or takeover. Disabled startup returns metadata without opening a store, loading a client or starting a server.

The existing MCP validator, private persistence, secret merge semantics and native-client manager are reused. The new production service selects DSH's native client through the public, declared `loader` dependency and `ctx.loader.import('@deepseek-ai/dsh-mcp-client')`. The exact-host fixture asserts namespace identity with the installed native export. Missing public loader/tool services fail closed; the old npm development client is not silently substituted. The fixture's public host `baseUrl` names the installed runtime's code directory for module resolution; it loads no profile configuration. This source-resolution assumption remains explicit in deployment acceptance.

The same native client performs disposable probes inside a new opaque public `createScope` registration scope, so a probe cannot advertise tools to real agents or the global inventory. It uses the saved full definition, including actual stored env/headers, rather than a redacted snapshot. Its handshake/list deadline is ten seconds followed by awaited native teardown. No standalone SDK alternative was needed or selected under ADR 0010; no extra SDK runtime dependency or broker/auth architecture was introduced. This work calls public native APIs rather than copying native source. Existing package notices and source attributions remain intact.

## Persistence, lifecycle and scope

Definitions live in Majed's own `DSH_HOME/majed/mcp` directory, with a `global.json` file and canonical-project-hashed private files. Fixture composition supplies temporary `stateDirectory` and `userDirectory` options. Exclusive randomized mode-0600 staging, file sync, atomic rename, request-time validation and serialized transforms protect valid state. Corrupt or oversized state, a final symlink state file and conflicting externally changed revisions reject without destructive repair. Store transforms serialize across store objects in this process; the design does not claim a distributed filesystem transaction or encryption against the same OS user.

Env/header values never appear in management snapshots or errors. The Settings panel uses password fields and explicit keep/replace/remove operations; the store retains values for keep, replaces only explicit entries and removes explicit nulls. Transport changes with stored credentials reject rather than silently erase them. Command, args and URL are Owner-visible launch configuration and must not be used as secret fields.

Global definitions register through the module's native context. Project operations resolve native session/workspace membership and canonical project paths on the admitted server. Project processes use a canonical CWD inside that root. Reloaded enabled definitions are checked again before runtime activation. Project runtime registrations belong to actual matching native Agent contexts, and native scoped ToolRuntime visibility and permission ownership remain intact. A project with no matching active native Agent reports that it is saved and awaiting a matching runtime. It does not register project tools globally or manufacture an Agent.

Each server reconciles independently. An unrelated edit or bad server preserves healthy native connection/tool identity. Replacement awaits old-child disposal; a rejected cleanup blocks replacement and retains a visible cleanup-failed state. A controlled plugin-boundary cleanup rejection test covers that refusal; real normal teardown is verified against native stdio/HTTP fixtures. Native reconnect settings, tool deadlines and instruction byte limits are mapped to their actual native configuration names. Established disconnects use native bounded reconnect; failed strict startup remains failed until explicit reconnect or a changed definition, rather than restarting on status refresh.

Saved, connecting/testing, active registration, failed and probe outcomes are distinguished. `active` describes a native registration whose initial handshake/discovery completed; DSH exposes no separate public live-connection status feed here, so the UI explicitly does not promise current network reachability. No completion claim is inferred solely from saving a definition. Connect and Test explicitly disclose that stdio starts a configured process on the host as the DSH OS user.

## Verification

The accepted package suite includes private atomic storage/concurrency/corruption, disabled module isolation, production-entry masked secret management and cleanup-failure refusal tests, alongside existing manager/appearance/read-page tests. The readiness focus fixture now supplies independent disabled MCP metadata while retaining its focused readiness single-flight assertions.

Two opt-in source-only native proofs use the ASAR-aware installed executable and runtime `0.2.1-rc.3`. Their sanitized temporary HOME/DSH_HOME contains all state; no real credentials, operational MCP processes, installed stores or profile configuration are read. Set the established `DSH_PROBE_NODE`, `DSH_PROBE_RUNTIME` and `DSH_PROBE_REMOTE` source locations; the mounted Settings proof also uses `DSH_MOUNTED_DEPS` for the version-checked renderer dependencies.

```sh
node scripts/test-managed-mcp.mjs
node scripts/test-settings-product.mjs --mcp
```

The dedicated native proof composes the actual public Loader, native client, ToolRuntime, AgentLoop, SessionStore, WorkspaceRegistry and temporary native JSONL persistence. It verifies real stdio initialize/list/call, text and raw image result normalization with native safe image fallback, error/deadline/cancellation, a native guard denial, tools/list_changed refresh, bad-server isolation, manual and automatic reconnect, disable/remove and service restart. Project tools appear only in the actual matching native agent scope, execute in the canonical project CWD and remain absent globally and from a foreign agent. Admitted project scope/CWD substitutions reject before spawning. A deliberately hung initialization verifies the native probe deadline and cleanup without leaked tools. All owned children must close naturally for the proof to pass; fallback termination on failed cleanup does not count as passing.

The mounted Settings proof uses the actual native React Settings/renderer modules and native browser RPC over actual ephemeral local HTTP and installed paired-proxy HTTP. Production controls save a streamable-HTTP definition, connect it to a real controlled HTTP MCP server, discover tools and invoke them through the actual ToolRuntime, reconnect, reload after service restart, disable and remove it. A password-entered HTTP authorization value reaches the controlled server while staying out of management display. The same UI saves/connects/probes/disconnects/removes a real controlled stdio fixture with protected env values; its private probe preserves the active runtime tool identity. Arabic RTL controls and missing local-cookie/remote-pairing refusals are exercised. The passing HTTP fixture has three owned listeners and four owned stdio negotiation children, all closed; the probe prints exact source hashes and counts on every run.

## Acceptance limits

- jsdom, presentation primitives, locale adapters, synthetic signing/pairing and temporary native storage remain explicit fixtures. Actual browser theme/font/viewport/focus/scroll geometry and operational desktop/paired-device deployment remain separate acceptance.
- Image results preserve the actual native bridge behavior, including safe text fallback when no image-capable route/attachment store is admitted. This fixture does not claim positive durable-image attachment admission on a live model.
- HTTP authorization headers are exercised. No new OAuth refresh, broker, per-tool restrictions, profile takeover or deferred MCP import/export feature is claimed.
- No Reference plugin was disabled/uninstalled, no operational server was started and no host file was patched. Tracker resolution is left to integration review.
