# Ticket #128 direct review

Baseline: 19331b60be01477f6cfef9441d9b135970127b89. Specification: GitHub #128 and docs/specs/subscriptions.md, restricted to the first ticket.

The code-review skill requests independent parallel reviewers. Nested delegation is unavailable in this delegated session, so this is an explicit direct two-axis review, not an independent review claim.

## Standards

- Checked scope-control, execution-policy, AGENTS, ADR-0001 through ADR-0004, changed sources and committed output.
- Only one new call in the existing core browser entry; root host, fonts and classifier behavior untouched.
- English project prose/code, localized Arabic copy; no secrets/state/install edits.
- Reference provenance and MIT notice retained. No provider code or other ticket surfaces added.
- Fixed global ignore of dist with repository negations; committed built output included.
- Fixed trailing blank line detected by git diff --check.
- No remaining documented-standard breach found in direct review. Structural service typing stays deliberately small; full DSH SDK type integration is not claimed.

## Spec

- Probe uses exact authenticated shared /api Fetch route; DSH's bridge supplies authentication and Owner authorization, not component-local invented cookies.
- Optional host fiber does not become a dependency of the core host.
- Single browser loader registration embeds a compiled closure; no unsupported internal module id lookup.
- Slot injection disposer verified against dsh-client-ui-renderer/lib/client.js:1353-1368 in the extracted DSH source.
- Presence reconciles even when a switch does not reconnect; absent route withdraws the section. Initial unknown failures remain hidden to avoid exposing a disabled component.
- Packed exports and disabled row covered. Fresh build comparison covered. Core classifier 166 assertions preserved.
- Residual: true installed/HMR, GitHub transport, API-remote grant behavior and visual RTL require Owner checks as recorded in ticket-128-verification.md. Lightweight browser fixtures test rendered element trees, not a browser engine. Host authentication fixtures model the statically verified host boundary rather than running DSH itself.

No additional scope authorized; #128 remains open pending Owner live acceptance.
