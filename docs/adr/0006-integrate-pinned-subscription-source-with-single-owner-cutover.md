---
status: superseded by ADR-0012 and ADR-0013
---
# Integrate pinned subscription source with a single-owner cutover

The Owner accepted integrating a pinned, attributed subscription implementation and its tests as an isolated Majed module rather than rewriting OAuth, provider wire formats and media scheduling. Preserve direct-route behavior and the full parity list before replacing the reference plugin: disable one owner before enabling the other, because duplicate provider registrations and concurrent credential refresh writers are unsafe. This accepts an ongoing upstream-maintenance obligation in exchange for preserving mature functionality; credential-transfer details and live cutover still require an approved plan.
