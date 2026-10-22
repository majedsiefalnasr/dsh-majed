# Changelog

All notable changes to `dsh-majed` are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/). Supported host: DeepSeek Harness `>=0.2.1-rc.2`
(the version this plugin is developed and tested against).

## [Unreleased]

### Added
- **Deterministic command classifier** (`lib/classify.cjs`, 166 test cases) decides **Auto (safe)** and
  **Auto (aggressive)** approvals with allow/ask/deny tiers, chain-aware (committed after 0.2.0).
- **Native `read_page`**: authorized `read_page` calls are delegated to the registered `web_fetch` tool through
  the tool registry. No fallback routes; denial and cancellation fail closed.
- `CHANGELOG.md`, `THIRD_PARTY_NOTICES.md`, `AGENTS.md` and `docs/` project documentation.
- Owner-approved expanded specification and tracked execution/deferred plan for native Managers, integrated
  subscriptions and Auto routing. This is planning documentation only; implementation and local/remote
  verification remain pending, and account access or operational Cutover require separate approval.

### Changed
- `package.json`: added `homepage`, `bugs`, `dsh.engines` and `icon`, and the missing `lib/read-page-native.js` and
  release documents in the published `files` list.

## [0.2.0] - 2026-10-21

### Added
- **Bundled UI fonts** (Inter, Roboto, Open Sans, Noto Sans, IBM Plex Sans; SIL OFL 1.1) in the **App font**
  dropdown, served by a host route.
- **System notifications** when a session finishes or needs you (tool approval, question, plan review),
  with mobile-web fallbacks (service worker, gesture permission, in-app banner).
- **Group sidebar actions in account menu** and `window.__dshMajed.accountMenu.register(...)`.
- **Copy on select** with a "Copied to clipboard" toast.
- Composer **Approvals** dropdown: per-session Ask me / Auto (safe) / Auto (aggressive).

### Changed
- **App UI font size** is additive (`size + (N - 14)px`), covers every stylesheet and the `--dsw-font-*` tokens.
  The plugin's own UI uses DSH font design tokens instead of hard-coded px.

### Fixed
- The System font option uses the full OS UI stack, including emoji and symbol fonts, and overrides the
  DSH/skin typeface. Notification sound is muted while the app is focused.

## [0.1.0] - 2026-10-20

### Added
- Initial release: per-paragraph bidirectional text for Arabic, Persian and Hebrew in chat answers, reasoning,
  tool cells and user bubbles; **App UI font size** (px stepper, 11-20); **App font** (DSH default / System).

[Unreleased]: https://github.com/majedsiefalnasr/dsh-majed/compare/8a2343c...main
[0.2.0]: https://github.com/majedsiefalnasr/dsh-majed/commit/8a2343c
[0.1.0]: https://github.com/majedsiefalnasr/dsh-majed/commit/e7623a4
