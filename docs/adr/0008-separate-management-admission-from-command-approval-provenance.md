---
status: accepted
---
# Management admission and Command hook Approval provenance have independent gates

**2026-10-25 amendment:** [ADR 0009](./0009-allow-unknown-command-approval-origin.md) supersedes the requirement below that verified original local/remote provenance must block Command Approval/execution. Authenticated Owner admission and exact-content Approval remain required; unverifiable origin is recorded as `unknown`. The account below records the original decision, not the current locality requirement.

On 2026-10-23 the Owner approved splitting T02A into management admission (T02A) and trusted Command hook Approval provenance (T02E). The inspected native Fetch contract preserves Owner admission but does not preserve trustworthy original local/remote provenance through the paired remote proxy. Keeping both requirements in the shared Settings prerequisite unnecessarily blocked Skills, MCP and inert Hook editing; weakening provenance or assuming loopback meant local would instead weaken the accepted command-execution contract.

T02A retains its actual Settings/client, local/remote Owner admission, authenticated session/project, native Skills invalidation and official MCP lifecycle proof requirements. T03 and its ordinary management descendants still wait for T02A to pass. T02E is independently blocked by T01; T10 now requires both T09 and T02E. All other native dependencies remain unchanged. No proof is completed by this split, and no parent specification issue is rewritten or closed.

Until T02E passes, Command hook Approval and execution remain unavailable, with server-side rejection and visible limitation diagnostics: no challenge issuance, approval persistence, event dispatch, test/run shortcut or imported Approval can bypass the gate. Local and remote Approval, trusted source/time, exact-content binding, nonce, typed confirmation and native guard precedence remain required. Inert editing does not approve or run a command. Because compatible definitions are shared with the reference runner, editing their operational stores still requires separately approved single-owner Cutover; the split does not authorize live edits that could trigger another runner.

This is a dependency/architecture decision, not permission to install, restart, access credentials, run host commands, alter user state, perform Cutover or waive final local/remote acceptance. T28M/T29 still depend on completed command approval/execution through T10; unrelated Auto, retry and child gates are unchanged.
