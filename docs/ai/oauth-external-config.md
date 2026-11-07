# Antigravity OAuth configuration — restoration supersedes external-only mode

> Historical names: this evidence predates the #159 rename; `majed*` identifiers below are the retired names of the current `waycraft*` ones (see `rename-waycraft.md`).

## Approved bounded restoration

The Owner explicitly approved restoring the bundled identity and asserted redistribution permission. This is an Owner assertion, not independently verified documentary licensing or Google authorization. The exact constant module is restored from locally preserved reviewed candidate `0b8160bcc795bee99e8fac98194eb724af5a4c77`; generated output is rebuilt normally. No values or hashes of values belong in reports or diagnostics.

Implementation branch: `fix/restore-authorized-oauth`, isolated worktree `../dsh-majed-oauth-restored`, based on published `7b6ba6beaebd647755d4ecc8b0dfbcd27dd1ba99`. Original checkout and dirty current-work document remain untouched. Route: bounded surgical patch with controlled regression proof; independent Standards/Spec review remains the Lead's next gate. No nested agents, installed state, real provider calls, network credential validation, history rewrite, merge, push, security-setting, allowlist or issue changes. Investigation cap: two failed diagnostics or twenty minutes; ordinary planned gates excluded.

## Resolution and compatibility

Explicit `config.antigravity.clientId/clientSecret` takes precedence over `ANTIGRAVITY_CLIENT_ID/ANTIGRAVITY_CLIENT_SECRET`; when neither source is supplied, the exact bundled desktop pair is used. Sources are never mixed; a custom PKCE-only client does not inherit a bundled or environment secret. Empty config objects resolve defaults. A supplied malformed override (including unpaired secret, empty value, invalid type or invalid characters) retains provider-scoped setup-required behavior rather than silently authenticating with another identity. Stored accounts are retained and deliberate logout remains available. Other providers and cancellation fixes are unchanged.

Zero-config availability is restored; live Google login is not performed or independently verified here. Existing sessions still require their matching issuing client; arbitrary custom-client compatibility is unproven. Never extract identities from installed plugins or DSH state.

## Scanner and publication disposition

This intentionally and transparently reintroduces the known Google OAuth scanner flag in source and generated output. It is **not secret-scan clean** and is not publication clearance. No obfuscation, encoding, splitting, remote loading, bypass endpoint or security-setting change is used. Any official GitHub push-protection exception is a separate Owner action if publication is blocked. No push is authorized for this candidate.

## Controlled verification

Resolver tests inspect only default presence/equality through boolean assertions, so assertion diagnostics cannot serialize the bundled pair. Override assertions use dummy values only. Assembled host tests prove zero-config registration/status without HTTP, and malformed-override account retention/provider isolation. Existing dummy OAuth/login/chat, refresh, real-Response reader cancellation, late completion and all-provider suites remain active. Build, full-suite and fresh-build evidence are recorded in current work. These are controlled proofs, not installed/provider acceptance.
