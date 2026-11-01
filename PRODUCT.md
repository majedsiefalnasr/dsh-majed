# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The Owner manages their own model access inside DeepSeek Harness (DSH), including API configurations and multiple subscription accounts. Product truth was confirmed in the Owner's completed discovery rounds; this record does not reopen those decisions.

## Product Purpose

`dsh-majed` is an existing DSH plugin. Its Subscriptions component makes the Owner's existing model access usable without losing native API-provider configuration or subscription-specific account capabilities.

## Operating Context

Existing React/TypeScript browser contribution and JavaScript host plugin, using public DSH extension points. English and Arabic are supported. Native Settings > Models remains a separate, untouched host surface. The owned page is Settings > Subscriptions (Majed), registered as `majed-subscriptions`.

## Capabilities and Constraints

- API providers use native public settings/credentials/LLM services as their sole durable store. Keys are write-only; presence metadata is not a connectivity test.
- Codex, Claude, Grok, Antigravity and Copilot retain their own account stores, identities, authentication/import flows, quotas and provider/account preferences. OpenCode Zen is loginless, not a synthetic account provider.
- Preserve existing shared provider IDs, share/coexistence behavior, account/default selection, pooling, model controls, speed, usage badge and image/video/search capabilities. Do not migrate stores or require reference plugins at runtime.
- No DSH host patches, native Models replacement/shadow/navigation interception, private runtime imports, credential disclosure or invented quotas.
- Installation, installed-state changes/restart, real accounts and live/paid provider operations require separate explicit permission. Synthetic evidence is not installed/live acceptance.

## Accessibility & Inclusion

English/LTR and Arabic/RTL; light/dark themes; narrow and wide viewports; keyboard operation, meaningful labels, visible focus and truthful non-color-only status. Technical identifiers and URLs remain readable in both directions.

## Evidence on Hand

Implementation: [browser composition](src/browser.ts), [API providers](src/api-providers.ts), provider cards and settings under `src/`. Version-qualified native primitive/layout evidence: [research](docs/research/reversible-models-replacement-2026-11-01.md). No current whole-page visual proof exists for the newly approved unified composition. The prior concept image is not a production specification or evidence of real quotas.
