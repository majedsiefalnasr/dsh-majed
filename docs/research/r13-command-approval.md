# R13 Command Approval workflow evidence

Date: 2026-10-26 (initial service increment 2026-10-25). Ticket: #53. This is a production consent implementation with bounded fixture evidence, including actual native mounted Settings and admitted local/paired HTTP. Tracker resolution is left to integration review. This does not enable command execution or claim trusted original transport locality.

## Production path

The public host entry accepts the explicit `hooksApproval.enabled: true` configuration and mounts `/api/majed/hooks/approval` through the native exact Fetch registry. The public client Hooks Settings section sends the native RPC envelope to `majed/hooks/approval`. Native BrowserAuth and Owner checks precede exact delivery; client headers and loopback addresses supply no authority. Disabled configuration returns disabled metadata without opening the state file. Readiness toggles remain separate from operational configuration.

The private state is `DSH_HOME/majed/hooks/commands.json` (fallback `~/.dsh/majed/hooks/commands.json`). Trusted composition options `stateDirectory` and `userDirectory` support disposable tests. User definitions bind to canonical user home. Project requests require native `sessionId`/`workspaceId` membership and canonical project resolution before observation and again before mutation. Paths/cwd/watches must remain inside that canonical scope. Definitions and Approvals are Majed-owned; no reference store is read or imported.

The service validates full command definitions using the existing bounded Command hook validator. Review includes normalized command, event/source/environment-name metadata, canonical scope/cwd, watched file paths/content hashes, an aggregate content fingerprint, execution disclosure, `unknown` original origin, server nonce and two-minute deadline. Approval requires exactly `RUN AS DSH USER`, consumes the challenge once, checks its store revision and fingerprint after queue waits, and rechecks watches before commit. Edits/removal/revocation invalidate consent; a watched-file change invalidates its displayed validity. Restart reloads persisted consent but never reloads outstanding nonces. Old/reference Approvals have no import surface. The Settings project selector is populated through public `WorkspaceRegistry.list()`/Workspace membership and the existing canonical resolver, bounded to 64 projects and 32 live-session candidates per project. It never reaches into private client viewing state. Editing preserves other saved metadata, and script-file review fingerprints the script automatically.

Writes serialize by store path in this process, stage a random exclusive mode-0600 temporary file, sync it and rename atomically after checking the observed store revision. Unknown/corrupt schemas, symlink final state files and oversized state fail closed without replacement. This is private file protection, not encryption or protection from the same OS user. No shell/process runner or lifecycle event listener is registered; `run`, `test`, `event` and import actions reject.

## Verification

`npm test` after merging integration `a17419f`: **451 passed**. Six added accepted tests run through the public production entry/Fetch contract, including restart, public project context discovery, project resolver binding/substitution rejection, disabled isolation, nonce phrase/replay/expiry, changed watched bytes, edits, protected file mode, corruption preservation and public Settings registration review/approve/revoke. The portable renderer is an explicit hook/slot fixture, not browser visual proof.

The opt-in native probe uses the ASAR-aware installed executable, runtime `0.2.1-rc.3`, and installed remote plugin leaf `@linxin666/dsh-remote-web-ui/lib/types/remote-api.js`. It loads source only; no installed credentials, plugin configuration or operational state are read. Its sanitized process gets a fresh temporary HOME/DSH_HOME. DNS, sockets, listeners and subprocesses are denied; the remote proxy's Node HTTP request is intercepted by a checked in-memory carrier.

Run with `DSH_PROBE_NODE`, `DSH_PROBE_RUNTIME`, `DSH_PROBE_REMOTE` pointing to those source/executable locations:

```sh
node scripts/test-hooks-approval.mjs
```

The native probe passes actual BrowserAuth signed synthetic cookie admission, missing/non-Owner rejection, the installed paired-device gate/proxy, production entry/service local and paired consent, single-use replay denial, service restart/reload/revoke, truthful unknown origin despite client labels, watched-file changes and pairing revocation before inner proxy. It additionally connects the production client registration through an explicit portable hook/slot renderer and RPC envelope adapter to these actual native local English and paired Arabic operations. The memory credential provider and paired-device registry are explicit substitutes; native signing/admission/proxy algorithms remain real.

`--red-auth` replaces the missing-authentication fixture input with the valid synthetic cookie; its unchanged 401 assertion fails. `--red-watch` omits the fixture's watched-byte change; its unchanged rejection assertion fails. Both sensitivity controls fail at their intended checkpoints. Neither mutates production source.

## Actual native Settings and physical carrier join

`scripts/test-settings-product.mjs --approval` also passes on runtime `0.2.1-rc.3`. This extends the existing exact-host product proof (and preserves the R01 `--codex` extension) with production host entry/configuration, actual installed native renderer/Settings/general modules, actual native browser RPC implementation, and React 18 DOM rendering in jsdom. It uses the reviewed explicit native renderer dependencies in `dsh-mounted-settings-deps/node_modules`; the fixture asserts their versions rather than silently substituting repo React 19. Presentation primitives and locale adapters remain explicit substitutes.

The production Settings controls create project definitions using context choices supplied by the actual native WorkspaceRegistry and SessionStore, review full content and unknown origin, type the exact phrase, approve, reload persisted approval after service teardown/remount, revoke and remove. This runs through both actual local HTTP and the installed paired proxy's actual remote-prefixed HTTP with native BrowserAuth. The same mounted panel performs Arabic RTL user-scope create/review/approve/revoke and script-file review, including its script fingerprint. Missing local cookies and missing remote pairing are rejected and shown as refused operations. All state lives below the runner-created temporary HOME. Both real ephemeral HTTP listeners close; no process/listener or installed-state change remains.

Representative source identity from the passing output: native host Connection SHA-256 `0ebcca7583e082716f79b0b55bc1749d48269cc8db2989b043b321b57abd3684`; native Settings client `0555eec2df1ca392a1167e637f287ac9963dbd2b0a230089c2a41be079c490e3`; installed remote API leaf `fa714d1440fd4be083c9ecf993430235d7249711a737101189178db1ac786a32`. The probe prints hashes of all exercised bundles on each run. Its result establishes the fixture paths exercised, not live host deployment or browser geometry.

## Remaining acceptance

- Browser theme/font/viewport/focus/scroll proof remains unverified. The actual native React/DOM Settings/browser RPC fixture above supersedes the earlier portable-renderer-only limitation for this workflow.
- Real desktop restart, real paired-device persistence/HTTP/TLS and live installed-state acceptance remain separate gates. Temporary service restart and synthetic pairing are explicitly bounded results.
- No command dispatch, lifecycle execution, native guard bypass, cutover, reference removal, migration or operational store access is authorized or implemented by this increment. R14 must revalidate consent and native authority immediately before execution.
