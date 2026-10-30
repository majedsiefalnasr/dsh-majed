# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

- Fix #129 automatic login navigation on desktop: open the returned authorization URL with `noopener` only after successful login RPC while the card is still mounted, without relying on a child-window handle. Preserve manual authorization fallback, cancel, status and errors; add delayed/null-handle, failure and unmount regressions. Installed runtime acceptance remains pending.

- Correct #129 Codex visual parity with the pinned reference provider header, compact account rows, usage header/windows/reset disclosure, login guidance and native reset dialog. Preserve owned security/actions and EN/AR RTL; keep the full coexistence warning only at section level. Add a deterministic real-DOM reference comparison fixture and hierarchy regressions. Installed acceptance remains pending.

- Correct #129 review findings: never import or remove foreign credential files, automatically load and reconcile account usage, recover pending authorization after card remount, and retain reset-credit expiry/confirmation context. Extend bounded Responses, retry-policy and assembled auth failure regression coverage.

- Port pinned reference v0.9.12 Codex and shared accounts, OAuth/PKCE, translation, catalog, internal pools and rate-limit retry into the optional, default-off Subscriptions component (#129).
- Add English/Arabic Codex account identity, expiry, default selection, confirmed logout, authorization/paste/cancel, usage windows and guarded reset-credit controls; use owned RPC/storage and report shared-provider registration collisions without takeover.
- Add adapted reference and assembled host/browser fixture coverage; retain compiled output and provenance. Installed/live Owner acceptance remains pending; no real account or inference was used.

- Avoid the reference plugin's Settings collision with the `majed-subscriptions` section, titled "Subscriptions (Majed)", and show an English/Arabic coexistence notice only when its read-only probe succeeds.
- Require a full DSH restart after installing or updating: the Owner verified that new component rows are not discovered in place without restart.

- Show the localized Subscriptions cannot-reach message on an initial non-404 probe failure, recover on success and remove the section on 404; isolate Subscriptions browser setup failures from core preferences and notifications.

- Add the disabled-by-default Subscriptions component row, authenticated presence probe and conditional empty Settings section in English and Arabic.
- Add committed TypeScript/tsdown output under `dist/`, reproducible-build checks, packaging and host/browser seam tests. Existing core preferences remain unchanged; live acceptance is pending.

## [0.2.0] - 2026-10-21

Baseline for the component-by-component plan. Features: Bidirectional text, App UI font size, App font with bundled fonts, System notifications, sidebar actions grouped in the account menu, Copy on select, and the composer Approvals dropdown with the deterministic command classifier. See `README.md`.

[Unreleased]: https://github.com/majedsiefalnasr/dsh-majed/compare/d6fe0e3...HEAD
[0.2.0]: https://github.com/majedsiefalnasr/dsh-majed/tree/d6fe0e3
