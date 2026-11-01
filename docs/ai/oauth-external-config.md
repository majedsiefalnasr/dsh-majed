# Antigravity external OAuth configuration

## Contract and operational limits

Owner-approved bounded implementation from integration `aaafab5b711906e49d30afbfb4dab7a1256e2054`, isolated on `fix/oauth-external-config`. No integration ref changes, push, history rewrite, installed changes, real credentials or provider calls. Existing integration dirty state is preserved. Investigation cap: two failed diagnostic attempts or twenty minutes; ordinary planned test/build gates are not investigation extensions.

Configure an authorized client externally in the environment of the DSH host process using `ANTIGRAVITY_CLIENT_ID` and, if required by that client, `ANTIGRAVITY_CLIENT_SECRET`. Do not commit values. Host environment inheritance from GUI launch has not been proven. Existing ordinary string schema fields are not a secure secret-entry mechanism; no new GUI credential entry is provided or recommended.

Explicit `config.antigravity.clientId/clientSecret` takes precedence over environment configuration. A chosen source cannot borrow a secret from another source. A client secret is optional, but an unpaired secret, invalid type, empty value or invalid characters yields setup-required for Antigravity only. No bundled fallback exists. Stored account metadata/session bytes remain until deliberate removal. Login, refresh, discovery, usage, chat and pool/background participation are blocked while unconfigured.

An existing session's issuing client is unknown. Refresh requires its matching authorized client identity. Arbitrary new-client compatibility with Antigravity's private API is unproven. Do not automatically extract identities from installed plugins, reference plugins or DSH state. Historical flagged ancestors remain local in this candidate; independent review precedes a separately approved Lead clean-history reconstruction. This commit alone is not publishable-history clearance.

## Verification seams

Dummy-only resolver tests cover absent/malformed configuration and same-source precedence. Assembled host tests cover provider isolation, retained expired sessions, no HTTP, denied login/usage/chat, empty model list and deliberate logout. Existing configured mock OAuth/login/chat, refresh and cancellation suites remain applicable. Full suite, committed-output comparison and whitespace gates are recorded in current work. No installed/provider acceptance is claimed.
