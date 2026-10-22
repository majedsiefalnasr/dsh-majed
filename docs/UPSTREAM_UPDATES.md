# Reference-source review and update process

Scope: [T04 / #9](https://github.com/majedsiefalnasr/dsh-majed/issues/9). This process governs inactive reference inputs, not installation, provider authorization, runtime activation or Cutover.

Current inputs: [artifact/source manifest](<reference-artifacts.json>),
[source and license review](<research/reference-source-provenance.md>),
[independent validation record](<research/reference-baseline-validation.md>),
[granular parity acceptance ledger](<PARITY.md>).

## Evidence boundaries

A Git commit identifies a source tree. A registry tarball digest identifies downloaded artifact bytes. Neither alone establishes that the installed package has identical bytes, that a provenance signature was verified, or that the provider permits a particular use. Record each comparison independently. Do not import upstream entry points to inspect them: imports can initialize account migrations, refresh credentials or register providers.

References remain outside the accepted host/client build and package allowlist. Source inspection must not read operational account stores, pairing files, profile configuration or credentials. A code literal naming a store is not evidence that the store was opened. Temporary downloads must not be executed as install scripts or dependency lifecycle hooks.

## Repeatable update review

1. Start from an explicit release/tag and full commit, not a moving branch or the installed package's current version. Obtain source and registry metadata from the owning repository/registry. Record URLs, commit, artifact digests, retrieval date and any unavailable evidence.
2. Compare the obtained archive's digest with registry metadata and compare source/package identifiers. Verify attestations separately if supported; otherwise state that signatures remain unverified. Installed-byte comparisons, if needed, are restricted to public code, manifest and license files and must identify exactly which files were compared.
3. Inspect license texts and transitive dependencies before copying any runtime, test, fixture, font or asset. Preserve applicable copyright, permission, NOTICE and modification text at the copied location and in the third-party inventory. An MIT or Apache license does not grant provider account, API, trademark or service authorization.
4. Diff old and proposed commits by public surfaces: host/client exports, provider registration and identity, RPC actions, tool names/aliases, state layouts, authentication/refresh, model catalog metadata, retries/stream replay, media references, hooks schema/events and lifecycle disposal. Review tests as well as implementation. Map every changed surface to its parity row and execution ticket; unresolved scope is not implicitly deferred.
5. Before a copy is adopted, label local changes and record the upstream baseline and patch/diff. Preserve protocol code where required rather than rewriting OAuth. Keep the module inactive and use isolated temporary state with synthetic credentials; a source import or baseline test must not contact an operational service.
6. Exercise accepted service/client tests, negative admission and cancellation cases, finite retry counters, secret redaction, persistence safety, package inventory and disposal. Tests of unintegrated upstream code are reference evidence, not proof of Majed behavior. Run the complete baseline regressions and review the implementation against its ticket.
7. Update provenance, parity status, notices and any user-visible changelog entry together. Keep desktop-after-restart and paired-remote evidence explicitly pending until separately authorized and performed. Opening a source-update PR never authorizes account reads, installation, a host restart, provider requests, Shadow evaluation, Reference removal, a push or a release.

## Exact-host compatibility risks

The inspected host baseline is DSH `0.2.1-rc.2`. Reference plugins may target a different prerelease cohort; matching a broad version string is not a service/API compatibility test. Public registration ownership, disposal, remote prefix resolution and catalog invalidation need independent proofs on the supported host.

In particular, the current [admission/provenance finding](<research/management-approval-provenance.md#L58-L66>) separates native Owner authorization from the unavailable original local/remote Approval label. Do not replace this gap with a client header, loopback inference, profile ownership heuristics, a host patch or interception of private methods.

The native Skills rewrite uses pinned upstream behavior/tests as an oracle, not the stale vendored runtime or its shared provider/route identifiers. Reference and integrated providers must not both own the same registrations. Subscription retries and host retries require a single proven budget and partial-output boundary before Auto failover activation. A catalog listing alone is not proof of coherent model preparation or supported child pre-start selection.

## Required review record

Each proposed update records: old/new source and artifact identities; exact license/NOTICE changes; which public files and tests were compared; changed parity rows and ticket links; local modifications; automated command/results; actual host version; unverified provenance and compatibility; and any Owner decision or operation-specific approval still required. Never mark live acceptance complete from source citations, a successful import or fixture-only tests.
