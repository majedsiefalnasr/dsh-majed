---
status: accepted
---
# Subscriptions is ported from the reference source as-is

The Subscriptions component is a port of V1ki/dsh-plugin-subscriptions v0.9.12 (MIT, commit b802311) rather than a rewrite: about 20.7K lines of OAuth, provider wire formats, pooling and media code with 648 tests, which a rewrite would take weeks to reach and would diverge from. Local changes are limited to names and paths (storage directory, RPC prefix, tool aliases, component row), English and Arabic locales replacing Chinese, the component-state check, and the two additions the reference lacks (API providers and OpenCode). Every ported file keeps a provenance record and a `THIRD_PARTY_NOTICES.md` entry; each later upstream release is adopted as its own ticket.

## Consequences
- An ongoing upstream-tracking obligation, accepted in exchange for mature, tested behavior.
- The reference's private provider endpoints and borrowed OAuth clients come with it; the Owner accepted their terms-of-service risk.
