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
- Inactive reference-source provenance, granular Parity list and upstream review process for the planned
  Manager/subscription integration. Reference runtimes are not included or enabled; parity and live acceptance
  remain pending, and source/artifact comparisons do not imply verified provenance signatures.

### Changed
- Owner-approved planning split: management admission remains T02A; trusted local/remote Command hook
  Approval provenance is independently gated by T02E and blocks T10 approval/execution, not ordinary
  Settings/Skills/MCP/inert Hook editing. Neither gate is complete and no runtime is enabled by this change.
- Owner-approved scope clarifications: no process-global subscription networking mutation; local-directory
  Skill import/browse explicitly deferred; legacy profile Hooks manually re-added with fresh Approval.
  These are planning decisions, not implemented or live-verified behavior.
- Development candidate `0.3.0-rc.1`: isolated the accepted host module and baseline-only client build from
  historical Manager prototypes. No Manager/provider runtime is enabled. Approved suites under `test/accepted/`
  run automatically alongside existing regressions; packaging excludes prototype runtimes.
- `package.json`: added `homepage`, `bugs`, `dsh.engines` and `icon`, and the missing `lib/read-page-native.js` and
  release documents in the published `files` list.

### Fixed
- Baseline disposal restores a previous account-menu extension and removes its own empty namespace and
  pending stylesheet load listeners instead of retaining callbacks or deleting another owner's API.
- Baseline disposal restores preexisting inline font values/priorities and invalidates pending notification
  delivery before permission/registration completes. Package lifecycle builds remain executable from the tarball.

### Known issues / unverified
- Recovered partial T02A Settings and session/workspace fixtures now run against the actual installed
  client bundles and exported services. Settings uses synthetic element trees, and scope uses a
  probe-local resolver with memory storage; neither establishes authenticated Manager operations,
  mounted browser behavior, paired-remote admission or complete T02A acceptance.
- T02A now also has an isolated real filesystem Skills watcher/registry characterization: external edits,
  renames and deletion refresh warm catalogs with native invocation policies and user-root fallback.
  Disposable synthetic roots are not installed Skills, Manager CRUD or local/remote live acceptance.
- T02A has an opt-in native signed-cookie admission characterization using actual native plugin apply,
  memory-only credentials and in-memory HTTP streams. Signature, authority, expiry, exact dispatch and
  disposal checks pass; this is not browser/paired-remote, Settings, scope, Skills watcher or MCP proof.
  Management and trusted Command hook provenance gates remain open; no runtime is activated.
- T02D has an opt-in exact-host synthetic local child characterization: explicit spawn route,
  inherited-option helpers, depth/preset rejection, native capacity and lifecycle settlement.
  Native tool policy/preflight, successful preset composition, real permission enforcement and
  external backends remain unproved; the issue stays open and child Auto routing is not enabled.
- T02C has an opt-in exact-host synthetic retry/budget characterization and public cancellation proof.
  Cooperative fixture sends share a ledger across retry and preparation; partial outputs stop without
  automatic replay. Actual provider refresh/endpoint/compaction accounting remains unproved, so the
  gate stays open and failover is not activated. The T02B upstream capability request is a local,
  unpublished draft only.
- T02B now has opt-in exact-host synthetic Auto seam probes (native picker bundle, LLM/Agent loop and
  browser catalog builder), not an enabled Auto feature. Scoped middleware now demonstrates concrete
  interpolated identity/header/assistant attribution, including concurrent manual intent, but evaluated
  prompt-provider coherence and mounted client/RPC acceptance remain unresolved; the gate stays open.
  A further ordering characterization confirms providers precede prepended assembly middleware and inbox
  notifications are not awaited. The explicit pre-provider requirement probe fails on the inspected host;
  this records an unsupported boundary, not a fix or an approved reduction of scope.
- The prefactored candidate and disposal fixes have automated fixture/Cordis coverage only. They have not
  been installed or verified after a desktop restart or through the remote GUI; no release is published.

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
