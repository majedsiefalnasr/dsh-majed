# Managers integration review fixes

Date: 2026-10-26. Integration base: `53a0ff5d9daa9ee0543a40a941bda1d0e49d35fd`.

The integration review reproduced two correctness defects at approved public service seams. No operational accounts, MCP servers, Hooks, installed plugin files or host patches were used.

## MCP unavailable working directory

`createManagedMcpService.ready` originally rejected with `ENOENT` when a previously saved enabled stdio directory disappeared. This prevented the public list/remove operations and healthy peer activation. The regression first failed at startup with that exact error.

Filesystem eligibility failures are now isolated per definition after whole-store schema validation. Only the runtime copy is disabled; the public snapshot retains the saved enabled flag and reports `failed`. Healthy servers start normally. The regression exercises failed-server probe refusal, disable, re-enable, restored-directory recovery, removal and healthy-peer preservation through public operations, with a controlled native plugin transport boundary. Corrupt request-time and startup stores still reject and retain their exact bytes. Unexpected errors and global schema failures are not swallowed.

## Codex cancellation during listener startup

Overlapping `begin()` and `cancel()` originally left `loginState: pending`, because no current attempt existed while the real loopback listeners were binding. The regression first failed with pending instead of cancelled.

A cancellation generation now invalidates an opening attempt. Once bound, that attempt is closed before becoming current or exchanging a code. The regression uses actual disposable loopback listeners, confirms the closed port rejects callbacks and manual completion is unavailable, preserves the prior valid account file, makes no second grant request and permits a subsequent fresh login. Provider grants use a controlled transport and synthetic credentials only.

## Review advisory disposition

The exact bounded project-context discovery shared by MCP and Hooks now lives beside `resolveManagementScope`. It retains 64-workspace/32-session bounds, live session selection and native scope revalidation behind Owner admission.

A cross-domain atomic-store framework remains advisory for separate design: each domain has distinct corruption, permission and commit policies. The optional Codex RPC action table is also left advisory; replacing dispatch adds no necessary lifecycle safety to these narrow fixes. Neither change is a missing requirement or a newly declared deferred ticket.

## Verification

- Targeted account and native MCP suites: 16/16 pass, including both red-to-green regressions.
- `npm test`: 495/495 pass; no failures, skips or cancellations.
- `node scripts/test-managed-mcp.mjs`: pass against installed DSH 0.2.1-rc.3 modules under isolated temporary state; scoped native agents, CWD isolation, stdio tools, permissions, probe/reconnect/cancellation and cleanup remain covered.
- `node scripts/test-settings-product.mjs --codex-direct`: pass, including account/native direct runtime Settings and synthetic grant/stream/picker fixtures.
- `node scripts/test-settings-product.mjs --mcp`: pass, including controlled stdio/HTTP lifecycle and local/paired admitted native Settings.
- `node scripts/test-settings-product.mjs --approval`: pass, including native English/Arabic user/project context and consent fixtures after discovery extraction.
- Running all three product flags together failed at `controlled-http-mcp` because the fixture registers the root `loader` service twice. Each independent feature fixture passes. The runner now rejects multiple feature flags with a clear one-scenario-per-invocation diagnostic; the unsupported combined attempt is not reported as a product pass.
- `git diff --check`: pass.

Native runners used the approved DSH executable/runtime paths, mounted dependency path and remote API source path. They load installed modules into disposable carriers and do not establish real desktop/browser visual acceptance or real provider operation. Nonfatal Electron `task_name_for_pid` diagnostics were emitted by the installed executable.

R10 native Auto identity/pre-provider coherence/cancellation/manual-selection evidence remains open; R08 remains blocked. R11 warmed slash-menu invalidation, active-agent/preset, paired event delivery and Unicode invocation evidence remains open. This change closes neither acceptance group and makes no Cutover or live-verification claim.
