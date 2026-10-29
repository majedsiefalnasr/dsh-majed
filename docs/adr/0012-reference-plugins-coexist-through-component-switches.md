---
status: accepted
---
# Reference plugins stay installed and are swapped with component switches

An installed reference plugin stays installed as the Owner's fallback while its dsh-majed replacement is built and accepted. The replacement uses the same provider ids, so the Owner's model selections keep working, which means both cannot register at once (DSH rejects duplicate provider registrations). The replacement component therefore ships switched off; the Owner switches the reference off and ours on to test, and back again in seconds if something fails. Our component keeps its own storage directory, RPC prefix and tool names, so the two never share credentials or refresh the same tokens. The Owner removes the reference only after acceptance; dsh-majed never deletes or edits it.

## Considered Options
- Explicit cutover with deletion (ADR-0002, ADR-0006): rejected because it removes the fallback before the replacement is accepted.
- Different provider ids so both run together: rejected because the Owner's existing model selections would break and every model would appear twice.
