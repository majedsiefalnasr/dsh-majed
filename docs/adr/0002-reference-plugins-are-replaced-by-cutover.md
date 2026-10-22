---
status: accepted
---
# Reference plugins are replaced by an explicit cutover, never coexistence

`@michengai/dsh-skills-manager`, `dsh-mcp-console` and `dsh-hooks` are installed only for testing and are deleted once dsh-majed covers their features, because running both causes route, slot, tool and state-id collisions. Each replacement is enabled in a single reversible cutover with a backup, and dsh-majed never deletes an installed plugin; the owner does.

## Consequences
Features the owner still needs must reach parity before deletion; deferrals are recorded as GitHub tickets so none are silently lost.
