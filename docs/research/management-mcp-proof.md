# Bounded official MCP lifecycle proof

Date: 2026-10-23. Scope: partial T02A evidence only; not T02A closure, remote acceptance, authentication, or a production Manager.

## Reproduce

From this checkout, set `DSH_PROBE_NODE='/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness'` and `DSH_PROBE_RUNTIME='/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh'`, then run `node scripts/test-management-mcp.mjs`. Run the same command with `--red-result` for the expected nonzero sensitivity control. Missing runtime is an error, never a skip. The runner supplies `ELECTRON_RUN_AS_NODE=1` and a disposable HOME/DSH_HOME.

## Seam and implementation

The installed official `@deepseek-ai/dsh-mcp-client` 0.2.1-rc.2 exported plugin runs unchanged under Electron Node 24.21.0, with actual Cordis plugin fibers and actual exported ToolRuntime registration and execution. The installed MCP SDK handles stdio, negotiation, discovery, calls, deadlines and cancellation. No historical prototype imports or SDK replacements are used. Only the system-prompt sink is synthetic; there is no model or provider.

The controlled newline-JSON stdio fixture enforces initialization before discovery and raw `echo` wire naming. It returns a literal success, explicit MCP `isError`, or deliberately unanswered call. The negative control changes the server response, not the assertion. Public lookup verifies `mcp__proof__echo` exists before execution and disappears after awaited fiber disposal. Every child spawned through the narrowly allowlisted fixture command must emit `close` before success. The installed runtime launched two owned children with automatic protocol negotiation; the proof caps creation at two and checks both close, rather than assuming one process.

Native source inspected via the read tool: official client `lib/index.js` transport construction, tool synchronization/execution, connection disposal and exported apply; native tools `lib/index.js` constructor, lookup and execution. The public async Cordis fiber itself is awaited (there is no `ctx.start()` API in this runtime).

## Actual outputs

Initial red baseline: `MODULE_NOT_FOUND` for the previously absent probe, runner exit 1. No prior lifecycle evidence was counted.

Green (exit 0):

    PASS handshake and actual ToolRuntime registration
    PASS actual registered tool call: fixture hello
    PASS MCP isError propagation
    PASS bounded SDK tool deadline
    PASS caller cancellation
    PASS awaited disposal: tool absent and all 2 owned stdio children closed

Negative (exit 1): handshake passes; disposal still passes for both children; assertion `Registered tool result sensitivity` fails with actual `corrupted fixture value`, expected `fixture hello`. Thus successful discovery alone cannot satisfy the proof.

Regression attempt: `npm test` builds successfully; 43 tests pass and one suite fails because local `@deepseek-ai/cordis` cannot be resolved from `test/baseline-host.test.js` (`ERR_MODULE_NOT_FOUND`). No dependencies were installed and no regression-suite success is claimed. The MCP probe uses the explicitly selected installed runtime, independent of that missing local dependency.

## Bounds and limits

The launcher supplies a sanitized environment and removes only its verified owned temporary root. Network, DNS, listeners, fetch and non-fixture process creation are blocked inside the probe before importing the runtime. These are probe-local fail-closed guards, not host patches or OS confinement. Module reads necessarily access the explicitly selected installed runtime and checkout scripts; mutable fixture state is memory-only, and HOME, DSH_HOME and cwd are disposable. The fixture itself performs no file/network/subprocess operations. No operational config, credential, installed change or provider call is required.

Each probe observation has a four-second watchdog; individual MCP calls have a 180ms SDK deadline; the launcher has a 25-second timeout and the fixture an independent 15-second orphan bound. On ordinary failures disposal is awaited; abrupt parent termination may leave the owned fixture alive only until its independent bound. Cancellation proves a bounded caller error, not server-side work rollback. This does not prove hostile-server containment, per-agent namespace isolation, reconnect/HMR, resource/image handling, actual Settings composition, remote admission or production Manager operations. Command Approval remains separate and unavailable.

The incomplete runner was preserved in commit e444220 before merging `feat/managers`; integration tip 01bb091 was merged and checked again before completion. No shared ledger or CHANGELOG was edited by this proof.
