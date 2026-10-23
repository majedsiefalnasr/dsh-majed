# Partial native session/workspace scope proof

T02A / #4 evidence, not production authorization or complete acceptance.

## Reproduction and result

Set `DSH_PROBE_NODE` to the installed ASAR-capable Electron executable and `DSH_PROBE_RUNTIME` to its DSH runtime root; run `node scripts/test-management-scope.mjs`. Verified 2026-10-23: exit 0 on runtime 0.2.1-rc.2 / Electron Node 24.21.0. `--red-membership` exits 1 at `membership-and-cold-fallback`. Missing runtime is a failure rather than a skip.

The runner creates and verifies a disposable canonical HOME, clears operational environment variables, bounds execution time and verifies its cleanup target before recursive removal. The probe blocks HTTP/fetch, socket/listener, DNS including promise/Resolver APIs, datagrams and child processes.

## What executes

Actual exported Cordis, SessionStore, SessionPersistence base, WorkspaceRegistry and DomainFacility compose in a fresh context. Persistence headers and KV backend are explicit memory doubles. A probe-local resolver uses public live session headers, read-only cold `stat`, workspace membership and fresh canonical directory checks.

Assertions cover live resolution without cold reads; creation scope unaffected by later working-directory events; cold observation without session publication/resume; missing identity, wrong header identity, unknown workspace and foreign or unregistered membership rejection; no storage writes during resolution; live publication taking precedence over a cold snapshot; cancellation before/during lookup and propagation of unexpected storage faults; symlink retarget/deletion; workspace deletion; and awaited storage disposal.

## Limits

`resolveScope` is fixture policy, not a native authorization service or production Manager implementation. Memory persistence does not prove disk header validity, remote admission or user ownership. Workspace membership is not authentication. This proof is not composed with the native authenticated Fetch handler or paired remote transport and cannot close the authenticated Manager session/project acceptance criterion. It must not enable command Approval, execution, event hooks or bypass T02E. No operational state, real session history, provider requests, installed plugin edits or host patches are used.
