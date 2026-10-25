# R13 Command Approval workflow evidence

Date: 2026-10-25. Ticket: #53. This is a production consent implementation with bounded fixture evidence; the ticket remains open pending its remaining Settings/runtime acceptance. This does not enable command execution or claim trusted original transport locality.

## Production path

The public host entry accepts the explicit `hooksApproval.enabled: true` configuration and mounts `/api/majed/hooks/approval` through the native exact Fetch registry. The public client Hooks Settings section sends the native RPC envelope to `majed/hooks/approval`. Native BrowserAuth and Owner checks precede exact delivery; client headers and loopback addresses supply no authority. Disabled configuration returns disabled metadata without opening the state file. Readiness toggles remain separate from operational configuration.

The private state is `DSH_HOME/majed/hooks/commands.json` (fallback `~/.dsh/majed/hooks/commands.json`). Trusted composition options `stateDirectory` and `userDirectory` support disposable tests. User definitions bind to canonical user home. Project requests require native `sessionId`/`workspaceId` membership and canonical project resolution before observation and again before mutation. Paths/cwd/watches must remain inside that canonical scope. Definitions and Approvals are Majed-owned; no reference store is read or imported.

The service validates full command definitions using the existing bounded Command hook validator. Review includes normalized command, event/source/environment-name metadata, canonical scope/cwd, watched file paths/content hashes, an aggregate content fingerprint, execution disclosure, `unknown` original origin, server nonce and two-minute deadline. Approval requires exactly `RUN AS DSH USER`, consumes the challenge once, checks its store revision and fingerprint after queue waits, and rechecks watches before commit. Edits/removal/revocation invalidate consent; a watched-file change invalidates its displayed validity. Restart reloads persisted consent but never reloads outstanding nonces. Old/reference Approvals have no import surface.

Writes serialize by store path in this process, stage a random exclusive mode-0600 temporary file, sync it and rename atomically after checking the observed store revision. Unknown/corrupt schemas, symlink final state files and oversized state fail closed without replacement. This is private file protection, not encryption or protection from the same OS user. No shell/process runner or lifecycle event listener is registered; `run`, `test`, `event` and import actions reject.

## Verification

`npm test` on this candidate: **449 passed**. Six added accepted tests run through the public production entry/Fetch contract, including restart, project resolver binding/substitution rejection, disabled isolation, nonce phrase/replay/expiry, changed watched bytes, edits, protected file mode, corruption preservation and public Settings registration review/approve/revoke. The portable renderer is an explicit hook/slot fixture, not browser visual proof.

The opt-in native probe uses the ASAR-aware installed executable, runtime `0.2.1-rc.3`, and installed remote plugin leaf `@linxin666/dsh-remote-web-ui/lib/types/remote-api.js`. It loads source only; no installed credentials, plugin configuration or operational state are read. Its sanitized process gets a fresh temporary HOME/DSH_HOME. DNS, sockets, listeners and subprocesses are denied; the remote proxy's Node HTTP request is intercepted by a checked in-memory carrier.

Run with `DSH_PROBE_NODE`, `DSH_PROBE_RUNTIME`, `DSH_PROBE_REMOTE` pointing to those source/executable locations:

```sh
node scripts/test-hooks-approval.mjs
```

The native probe passes actual BrowserAuth signed synthetic cookie admission, missing/non-Owner rejection, the installed paired-device gate/proxy, production entry/service local and paired consent, single-use replay denial, service restart/reload/revoke, truthful unknown origin despite client labels, watched-file changes and pairing revocation before inner proxy. It additionally connects the production client registration through an explicit portable hook/slot renderer and RPC envelope adapter to these actual native local English and paired Arabic operations. The memory credential provider and paired-device registry are explicit substitutes; native signing/admission/proxy algorithms remain real.

`--red-auth` replaces the missing-authentication fixture input with the valid synthetic cookie; its unchanged 401 assertion fails. `--red-watch` omits the fixture's watched-byte change; its unchanged rejection assertion fails. Both sensitivity controls fail at their intended checkpoints. Neither mutates production source.

## Remaining acceptance

- The Settings panel currently manages user-scope inline definitions. The project API is canonical-scope bound, but an actual supported active-project selector must be integrated into Settings before full user/project UI completion; no private `mainReference` shortcut was added. File-source definitions are accepted/reviewed through the service; the panel currently creates inline definitions.
- The joined Settings proof uses a portable renderer and RPC boundary adapter. Actual native React/DOM Settings and browser RPC implementation, theme/font/viewport/focus/scroll proof remain unverified.
- Real desktop restart, real paired-device persistence/HTTP/TLS and live installed-state acceptance remain separate gates. Temporary service restart and synthetic pairing are explicitly bounded results.
- No command dispatch, lifecycle execution, native guard bypass, cutover, reference removal, migration or operational store access is authorized or implemented by this increment. R14 must revalidate consent and native authority immediately before execution.
