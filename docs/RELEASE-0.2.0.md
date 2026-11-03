# Waycraft for DSH 0.2.0

First npm release under `dsh-waycraft`. The Owner selected 0.2.0 to retain the source project's version sequence. Earlier changelog entries describe development checkpoints, including superseded UI designs; this release summary describes the final shipped scope.

## Included

- Core preferences: bidirectional Arabic/Persian/Hebrew text, UI font size and bundled fonts, system notifications, account-menu sidebar actions, copy on selection and the composer Approvals control with deterministic command classification.
- Optional AI Providers component: Codex, Claude, Grok, GitHub Copilot and Google Antigravity account/authentication flows, provider/account preferences, defaults, model controls and pooling. Shared provider ids detect conflicts instead of silently taking over another plugin.
- DSH-aligned English/Arabic AI Providers settings: always-visible Settings, grouped configured subscriptions, one inline Add flow, compact Manage dialogs and a separate Free providers group for OpenCode Zen. Native Models remains responsible for API-provider configuration; the retained API controller is not exposed as a duplicate page editor.
- Subscription quota/account information in settings and the composer, compact hover rings, expanded menu bars, reset metadata and Codex speed controls where advertised by the catalog.
- OpenCode Zen anonymous free-model access with a persisted availability switch. Disabling hides models and rejects new requests without cancelling already admitted streams.
- Provider-supported image generation/editing, video generation and search integrations, bounded transport/cancellation handling, local media presentation, proxy preferences and redacted diagnostics.

## Compatibility and upgrade

The product is Waycraft for DSH; the package is `dsh-waycraft`. Existing `majed` Loader ids, RPC/tool names, font URLs, browser settings and account storage namespaces intentionally remain unchanged. The GitHub repository and author attribution remain unchanged. Never install `dsh-majed` and `dsh-waycraft` together. Keep the previous approved package archive and replace the legacy bundle through the plugin manager with explicit approval. Preserve account/configuration directories and fully restart DSH after replacement. The optional AI Providers component is default-off for new installations.

## Evidence and limitations

The final subscription UI was accepted by the Owner before the identity rename. Its affected regression gate passed117/117 tests. The identity/package release gate passed15/15 host/final/packaging checks, including byte equality against a fresh build. The route-count assertion was reconciled with the existing persisted Zen switch endpoint; no route behavior was changed. These are scoped checks, not a newly repeated full historical test matrix or a fresh live test of every provider.

No paid inference or new real-account operation is part of release preparation. Upstream availability, subscription rights, quotas and provider policies apply. Bundled Antigravity OAuth identity redistribution relies on the Owner's assertion recorded in the development history, not independent documentary authorization. Automatic intelligent routing is future work, not a feature of this release. No DSH core patch or automatic data migration is performed.

## Rollback

Use the preserved previous package archive through the plugin manager, never both names simultaneously, keep durable account/configuration namespaces intact and fully restart DSH. Package rollback does not undo a separately authorized data migration.
