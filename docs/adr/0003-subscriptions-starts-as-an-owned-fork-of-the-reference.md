# Subscriptions starts as an owned fork of the reference

The Subscriptions component begins as a port of V1ki/dsh-plugin-subscriptions v0.9.12 (MIT, commit `b802311`) instead of a rewrite, so that about 20.7K lines of tested OAuth, provider wire-format, pooling and media code are reused rather than reinvented. After the port the code is ours to change and improve; it is not bound to the reference. The first port stays close to the original so that the reference's own 648 tests prove the port, and improvements spotted along the way are recorded and delivered as separate tickets after acceptance (a defect that blocks acceptance is fixed at once). Each later reference release is evaluated on its own and adopted only where useful.

## Consequences
- The more our copy diverges, the harder adopting a reference change becomes; each adoption is a separate, optional ticket.
- Ported files keep a provenance record (source, version, commit, license, local changes) and a `THIRD_PARTY_NOTICES.md` entry.
- The reference's private provider endpoints and borrowed OAuth clients come with it; the Owner accepted their terms-of-service risk.
