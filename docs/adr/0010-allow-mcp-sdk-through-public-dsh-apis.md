---
status: accepted
---
# Allow an official MCP SDK client through public DSH APIs

On 2026-10-25 the Owner approved keeping DSH's native MCP client as the default while permitting a Majed-owned official MCP SDK client for required capabilities the native client cannot provide. Integrate an alternative through public DSH tool/session APIs and verify it against the exact host before using it. This partially amends ADR 0003's per-server plugin-fiber implementation requirement; its private-storage and ownership decisions remain in force. The trade-off is an additional runtime integration to maintain in exchange for avoiding an unnecessary dependency on one particular client implementation.

Keep one runtime/tool-registration owner per managed server, isolated connection lifecycles, authenticated management, private Majed storage, scope isolation, native permission ownership, normalized tool results, bounded probes, cancellation, reconnect and complete teardown. Never run native and SDK clients for the same managed connection concurrently. Verify replacement and failure cleanup before reporting connection success.

Reference protocol/runtime code may be adapted with reviewed source pins, attribution and notices. External reference plugins are not runtime dependencies. Automatic profile takeover, another plugin's operational store, host patches and private-method interception remain outside the approved architecture. Existing scope dispositions for per-tool controls and dynamic exposure remain unchanged; permitting an SDK does not add every feature of the reference plugins.

T08 owns proof of any selected SDK alternative at the public runtime seam, using controlled stdio/HTTP fixtures and applicable authentication fixtures. Existing native-client feasibility evidence remains valid for the path it exercised; it does not prove the alternative. No ticket is completed, dependency removed, runtime enabled or GitHub issue changed by this decision. Live operations and Cutover retain their execution-point approval and acceptance gates.
