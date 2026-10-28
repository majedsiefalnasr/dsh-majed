# Changelog

All notable changes to `dsh-majed` are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/). Supported host: DeepSeek Harness `>=0.2.1-rc.2`
(the version this plugin is developed and tested against).

## [Unreleased]

### Bounded R14 candidate
- Review follow-up executes the revalidated, CRLF-normalized reviewed command rather than the stored raw command, and classifies loss on either bounded output stream as an error. Offline native regressions cover reviewed bytes, independent stdout/stderr overflow, timeout, cancellation, slot reuse and exact project canonical-scope rejection. No production activation or additional events are introduced.
- Dormant synthetic SessionStart seam reads production Command Approval authority and runs an approved inline Bash command through native subprocess, with immediate pre-spawn revocation, watched-byte and canonical-cwd checks. Activation remains off; no production event registration, native tool-guard, other-event, installed-state or full R14 acceptance is claimed.

### Fixed
- Standalone Tool Rules are disabled in project source, including legacy enabled definitions: manager activation no longer applies their patterns, direct rule mutations return `TOOL_RULES_DISABLED`, and both manager HTTP handlers reject rule actions. Snapshots explicitly report the disabled feature; existing definitions survive unrelated MCP/Hook changes without being enforced. Existing Hooks denial, MCP controls and native permissions remain independent. This is not an installed-state change or live acceptance claim.
- Source-only follow-up: connected passive Codex account snapshots no longer mount account settings without authoritative runtime preferences; manual full status restores those controls. Unmount cancellation settles owned work and clears its timer even when transport ignores abort, retaining controller-identity fencing. Added UNRUN source candidates for nondefault preferences, exact English/Arabic original errors, no-deadline unmount settlement and manual-status replacement before old transport release. No test, syntax, build, browser, host or live validation was performed.
- Source candidate: Codex Settings reconciles rejected credential refreshes through a strictly validated passive mode on the existing public status RPC, omitting runtime discovery/session acquisition. Mounted timeout metadata fails closed even if transport ignores abort, without an aborted requery or late-result publication; the original sanitized error is retained. Source regressions for rejected envelopes/transports, timeout/late/unmount and native passive-mode validation are UNRUN and need validation because the required OS sandbox is unavailable (`sandbox_apply: Operation not permitted`). No red/green, build, native browser/new-reauth or live acceptance is claimed.
- Manager typography now selects native Settings body typography and the defined native heading token instead of inheriting an unspecified slot parent and referencing the nonexistent `--dsw-font-s-18`. The corrected appearance contract and full accepted suite pass; real-browser 14/18 computed-style acceptance remains pending. Native rc.3's `--dsw-font-m-18` currently resolves to a 16px base size, not a promised 18px heading.
- Codex direct dispatch now fences account removal and independent-entry revocation synchronously at transport invocation, including authentication retries and revocation/re-enable cycles. Route-scoped epochs close stale final-snapshot races without invalidating unrelated accounts, no-op consent changes or legitimate refresh. Controlled prepared-call regressions and the isolated native Codex product probe pass; no installed-state or live-provider acceptance is claimed.
- Judgment cancellation now closes a response body returned after cancellation by an uncooperative transport, without waiting for that transport or replaying the request. A controlled late-response regression passes; no live service or Smart activation is claimed.
- Skills policy now owns a matching overlay in each active Agent context, including Agents already present at enablement. Exact-identity lifecycle registrations and invalidators are removed on Agent disposal, feature disable and service teardown; partial startup rolls back. An isolated actual-Agent scoped-duplicate regression passes, with lifecycle doubles covering identity reuse and rollback. Distinct preset-owned registries, cold standing presets and warmed native slash refresh remain outside this proof; no operational live claim is made.
- Skills management retains Chinese, Arabic and mixed Unicode declared names without silently shortening them into ASCII invocation aliases. Names unsupported by the native invocation grammar remain visible with diagnostics; previously explicitly enabled invalid documents can be disabled idempotently and safely trashed/restored unchanged. Creation rejects Unicode rather than truncating it, matching the pinned 1.2.11 oracle. Packaged temporary-storage regression coverage is not native Unicode invocation or live acceptance.
- MCP startup now isolates an unavailable saved stdio working directory to that server, reports it as failed, and keeps healthy peers and disable/remove/recovery available. Saved definitions are retained; corrupt stores and invalid schemas still reject without repair. Controlled service and native lifecycle fixtures pass; operational desktop/remote acceptance remains unverified.
- Codex cancellation now covers asynchronous callback-listener startup: a cancelled attempt closes before publication or code exchange and retains existing accounts. A real disposable-loopback regression and controlled native Codex Settings fixture pass; real provider login and live acceptance remain unverified.

### Added
- R02 Codex direct runtime increment: connected private accounts can separately enable the native Codex catalog and direct chat adapter. Native Settings adds catalog refresh, model aliases/visibility, supported effort/context preferences, independent account entries and manual catalogs. A session-scoped composer control and `/fast` share supported Standard/Fast state. The runtime adapts pinned upstream Responses/tool/image/SSE behavior through an isolated transport and binds each prepared call to one account. Controlled native Settings/login/restart/picker/prepare/stream tests pass, including a default-account change after preparation. Missing host preparation/loader contracts fail closed while retained features stay available. Real provider use, browser visual acceptance and full subscription parity remain unverified.
- R12 MCP native composition: explicitly enabled, single-owner native Settings can save scoped private definitions, preserve/replace/remove masked credentials, connect, test, reconnect, disable and remove servers through admitted local/paired management. DSH's native client owns actual stdio/HTTP lifecycle, tool normalization, scoped registration and permissions; disposable probes use the same client without exposing tools. Private writes serialize, preserve corrupt state and use mode-0600 atomic replacement. Controlled native fixtures prove Settings/RPC/local and paired HTTP, real stdio/HTTP handshake/tool calls, project Agent/CWD isolation, cancellation, bounded reconnect/probe cleanup and restart; cleanup-failure replacement refusal has a separate boundary test. Active registration is distinguished from saved state and current reachability. Browser visual and operational desktop/remote acceptance remain unverified; no live or Cutover claim is made.
- R11 Skills native Settings workflow: explicit single-owner enablement, authenticated project selection, inventory/details, create, invocation toggle and deliberate trash/restore/delete use real services and private Majed policy. Native provider invalidation reaches the actual model tool and current user catalog in controlled fixtures; the warmed native slash menu remains stale at an identified public invalidation seam; enabling respects independent source invocation flags. Temporary local/paired-remote HTTP fixtures prove scope/admission and service restart; an extracted-package cold process reloads policy. Browser layout, live Agent composition and paired event-stream delivery remain unverified; no live or Cutover claim is made.
- R15 judgment settings: native Owner-admitted Settings can save separate protected credentials, keep/replace/remove them explicitly, reload them after service restart, and validate System One or Decisions with one consented, bounded protocol request. English/Arabic controls never refill the credential; returned requested/actual model and documented usage metadata remain distinct. Stale configuration, malformed choices, cancellation and disposal reject safely. Native mounted Settings/local and paired HTTP fixtures use controlled responses and temporary storage; browser visual and live service acceptance remain unverified. Saving/testing does not enable Smart or other judgment consumers.
- R01 Codex account workflow: native Owner-admitted Settings can enable isolated account management, start cryptographic PKCE sign-in, complete a state-bearing browser/manual callback, cancel, choose a default, remove and refresh accounts. Source-backed OAuth grants and protected atomic Majed storage replace synthetic login for this path; credentials survive service restart and are redacted from management responses. Controlled protocol, Settings and persistence fixtures cover failure/cancellation and stale refreshes. Model dispatch is delivered separately in R02. Real account login, desktop/remote live use and visual acceptance remain unverified.
- R13 Command hook consent: an explicitly enabled private store and Owner-admitted Settings RPC now save inert commands, review canonical content/cwd and watched fingerprints, enforce an expiring single-use nonce and exact typed phrase, persist Approval with truthful `unknown` origin, revoke and invalidate on edits. The production Hooks Settings panel supports English/Arabic user/project selection, inline/script-file review and consent. Portable tests and isolated installed-host rc.3 native React Settings/RPC over local/paired HTTP cover consent, persistence/restart, admission denial and Arabic RTL; separate negatives cover replay, expiry, edits and watched changes. Native browser/desktop visual and live acceptance remain unverified. Execution remains unavailable and disabled startup reads no Hook state.
- T08 MCP connection lifecycle: saved stdio and streamable HTTP servers become actual official-client connections with independently visible lifecycle. Real Cordis fixture tests prove startup, tools/list, tool invocation, hot reconcile, enable/disable, teardown and restart restoration, with one isolated lifecycle fiber per server and failure of one server never stopping another. A bounded disposable connection probe reports saved/probing/connected/error status per server, and status refresh works through the Owner-authenticated managers route locally and remotely. Duplicate server/tool ownership, stale fibers and leaked processes are prevented and tested across server failure, reconnect and disposal. Per-tool restrictions and config-ingest/handoff are deferred (D04/D05) and not included. Local/remote live evidence remains unverified pending desktop restart and remote verification; no live claim is made.
- T15 account/model catalogs and preferences: native picker/Settings catalog preserves discovered/static/manual catalogs, background/manual refresh, visibility, aliases/display names, direct pool participation, per-account allowlists and independent pinned entries, with account-specific capabilities (efforts, context budget) and absent/stale catalog behavior. Reasoning defaults, supported effort IDs, Codex context budgets and Standard/Fast plus /fast behavior are preserved as picker/dispatch metadata without overriding explicit manual choices or creating Auto membership. Real picker/Settings fixture tests show catalog invalidation and direct dispatch to the selected identity; login and catalog updates never enroll account/model candidates into Auto and account-only models stay bound to their advertised account. Local/remote live evidence remains unverified pending verification; no live claim is made.
- T16 usage and explicit quota operations: usage refresh/window scopes, unknown/stale telemetry and redacted failure handling are preserved, with fixture tests driving both Settings (`/api/majed/usage/status`) and status bar, including provider-specific missing telemetry. Claude prompt-cache TTL and Codex manual reset-credit workflow are preserved using fixtures; redemption requires explicit action and a cancelled/ambiguous result is never automatically replayed as though it were a read. Actual provider rejection/reset data remains distinct from telemetry warnings: Auto's 95% warning is advisory and unknown telemetry does not exclude a candidate. No real credit redemption or usage-endpoint access is authorized. Local/remote live evidence remains unverified pending verification; no live claim is made.
- T07 private MCP definition storage: stdio and streamable HTTP server definitions (with supported reconnect, timeout and instruction-limit fields) round-trip through Majed's own private store with atomic writes and request-time reads, preserving unrelated definitions and scope precedence. Masked credential edits use explicit unchanged/replace/remove semantics and secrets never reach snapshots, errors or logs. Scope/path/transport/name errors are rejected clearly. No profile YAML, generated handoff blocks or Reference plugin store writes are performed, and saving a definition does not claim connection success. MCP import/export disposition is left explicit (deferred to D05), not silently assumed covered. Local/remote live evidence remains unverified pending desktop and remote verification; no live claim is made.
- T05 native Skills list/inspect/enable/disable: Owner-controlled route `/api/dsh-majed/skills` (own route ID, never the copied standalone route) lists project/user skills with source and invocation policy visible, and enables/disables skills through the vendor core behavior oracle without rewriting skill source files. Source precedence, Unicode names, duplicate-name overlays, agent-scoped inventories and frontmatter invocation flags are preserved; disable blocks model/slash invocation and enable does not grant source-denied privileges. Read-only/external sources remain protected; catalogs are refreshed through the `commands/change` public seam. Portable and isolated tests pass; real browser, host-restart and live evidence remain unverified pending verification; no live claim is made.
- T06 native Skills create/trash/restore/delete: Owner-controlled route `/api/dsh-majed/skills` gains create, trash, restore, listTrash and deliberate-confirmation permanent delete actions. Creation validates kebab-case name, non-empty description and body (size bounded), resolves the authenticated active project's writable scope (user `dsh` or project-dsh) through the vendor core behavior oracle, preserves Unicode body/description verbatim and kebab-cases the filesystem name, enforces the single-owner collision gate, and refreshes agent/slash inventories through the `commands/change` public seam. Trash/restore preserve source metadata and content and handle restore collisions explicitly; permanent deletion requires `confirm: true`. Read-only/external sources are protected, path traversal and symlink escape are rejected by the vendor oracle, malformed trash metadata is skipped without destructive fallback, and trash writes are staged and published atomically. Portable and isolated tests pass; real browser, host-restart and live evidence remain unverified pending verification; no live claim is made.
- T03 authenticated Settings slice visual contract (Skills, MCP, Hooks, subscriptions, routing): 14/18
  typography, English/Arabic RTL direction, modal overflow guard and narrow viewport stacking added to the
  readiness section; service path/method limits and scoped session-to-project rejection proven at the seam.
  Controls remain inert readiness checks — no Manager operations, commands, accounts or routing activated;
  process-lifetime enablement resets on host restart. Visual and live evidence remains unverified pending
  browser-based and host-restart verification; no live claim is made.
- In-progress T03 authenticated readiness Settings slice for Skills, MCP, Hooks, subscriptions and
  routing. Controls are inert readiness checks with process-lifetime enablement, not feature activation.
  Portable and isolated exact-host local/remote product tests pass; real browser visual and live
  verification remain pending. This does not enable Manager operations.
- Controlled authenticated carrier/service-effects join: mounted native Settings actions perform
  native Skills watcher/policy updates and official MCP tool calls/disposal over local and remote HTTP.
  Admission negatives precede effects; owned tasks, children, watchers and listeners are cleaned up.
  This is temporary feasibility evidence, not production Manager CRUD or final live acceptance.
- Controlled physical local/remote carrier proof: real public ephemeral HTTP servers and installed
  remote proxy connect mounted native RPC, Owner admission and session/workspace resolution.
  Synthetic state and explicit remote document base remain; Skills/MCP effects and live acceptance
  are not inferred from this increment.
- Bounded mounted Settings/native Connection RPC proof: real clicks use unchanged native serialization,
  response correlation and BrowserAuth/exactFetch admission through an explicit memory carrier.
  Result/correlation controls reject; no actual paired carrier, production Manager or live claim is added.
- Bounded remote/native/scoped request proof: actual remote proxy and native admission now precede
  real session/workspace resolution in one inert request, with denied-authority and cancellation controls.
  Memory carriers and synthetic credentials remain explicit; no Manager CRUD or live acceptance is enabled.
- Isolated native Settings mount proof using unchanged installed client bundles, public SlotCore,
  real ReactDOM/stores/Cordis and jsdom, with selection/withdrawal controls. Presentation primitives
  remain adapters; this is not browser/visual, production Manager or live acceptance.
- Explicit opt-in serial management proof suite with upfront runtime pointers, bounded execution/output,
  fail-fast per-runner summaries and portable orchestration tests. This consolidates existing isolated
  evidence; it does not enable Managers or satisfy full T02A/live acceptance.
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
- **Deterministic Auto core** (`modules/auto/index.js`, unit-tested in `test/auto-core.test.js`): explicitly enrolled
  provider/account/model candidates with priority, default effort and Smart-permitted efforts; filter-before-selection
  by images, tools, explicit effort and context/output limits; priority-based selection with session stickiness;
  manual selection exits Auto; a bounded failover budget of at most three distinct candidates per cycle with no
  repeats. Opt-in only — no automatic activation, no fake picker option, no global-default write. Local/remote live
  acceptance and native-picker wiring remain pending (T02B/T22 gates).
- T14 Grok, Copilot and Antigravity account authentication (issue #19): bounded source integration of the three
  remaining provider auth surfaces on top of the T12 subscription adapters, without widening T13 into a five-provider
  mega-ticket and without inventing a common OAuth protocol. Grok and Antigravity use device authorization
  (login/poll/cancel/expiry); Copilot uses browser OAuth callback validation and a manual token-entry path. Each
  provider keeps its own mechanism, multi-account/default/removal behavior and provider-specific failure codes.
  All credentials are synthetic and process-lifetime only: no real account store is opened and no operational login,
  account discovery or provider request is performed absent later approval. The compatible subscriptions account-store
  schema and single-writer behavior are preserved, and auth changes invalidate the affected account's health and the
  provider catalog. Fixture tests cover device polling/cancel/expiry, callback validation, refresh/revocation and
  per-account isolation using fake credentials only. Local/remote live evidence remains unverified pending desktop
  and remote verification; no live claim is made.
- T21 explicit Auto candidate enrollment and session policy (`modules/auto/enrollment.js`, unit-tested in
  `test/auto-enrollment.test.js`): explicitly enrolls provider/account/model candidates with priority, default effort
  and Smart-permitted efforts through an explicit enroll path only — login, catalog import, direct pooling,
  search/media scheduling and child-routing never enroll candidates, and empty membership is valid (Auto reports
  'ineligible' rather than falling back to an implicit model). Effort sets and priority edits are validated locally
  (exported validators usable server-side); a monotonic settings-version stamp surfaces concurrent / stale revisions.
  Manual model selection exits Auto for the session; strategy/default-priority edits affect new sessions read live
  from the registry, while explicit apply-and-reselect updates an existing session. Removal or disable blocks new
  requests through the candidate in all sessions without cancelling, replaying or transferring an in-flight request.
  Native-picker wiring, local/remote live acceptance and server-side exposure remain pending (T22/T23 gates); no live
  claim is made.
- T28S prepare subscription ownership and compatible rollback (`modules/subscriptions/cutover.js`, unit-tested in
  `test/accepted/subscriptions-cutover.test.js`): an Owner-reviewable subscription-state preview and synthetic
  compatible-store/single-writer rollback proof, without waiting for unrelated Managers and without any account-state
  access or live operation. Reports subscription Parity rows, exact store/schema compatibility and explicit deferrals
  without reading operational secrets, enumerating sensitive reads/writes, protected backup destination/permissions,
  restoration and approval points. The read-only preview imports no refresh-capable module. Synthetic-store drills prove
  compatible existing account-store access with one active writer, no forced reauthentication, rollback after
  interruption and no concurrent refresh; on compatibility failure it asks the Owner before migration or
  reauthentication. Backups never go in the repository, browser, evidence bundle or plaintext logs. The cutover order
  drains/quiesces, disables standalone ownership, then activates replacement; rollback disables the replacement,
  restores ownership before state, and preserves Reference packages. No accounts/plugins are deleted and no secrets are
  copied into project/UI/evidence. Produces separate approval checklists for T30; required missing parity blocks
  operational cutover, preparation can record a pending disposition, and only explicit Owner acceptance can waive a
  deferred capability. This ticket neither needs Manager readiness nor authorizes account-state access/live evaluation.
  Local/remote live evidence remains unverified pending verification; no live claim is made.
- T20 preserve video submission, polling and rendering (`modules/video/index.js`, unit-tested in
  `test/accepted/video.test.js`): Grok video / image-to-video submission starts exactly one synthetic job and returns
  a job id; polling reads the job's status (pending/done/failed/expired/unknown) without resubmitting, so recovery or
  cancellation cannot create duplicate side-effecting submissions and chat retry rules are not generalized to async
  video. Inputs preserve duration (1-15s), aspect ratio (seven ratios), resolution (480p/720p/1080p) and a
  starting-image URL or JPEG/PNG/WebP data URL. Job/result mapping returns `{ path, url, duration? }` with a bare
  `.mp4` fileName for the `video` RPC loader; inline video/tool view renders `<video controls>` with object-URL
  cleanup and usable loading/error states; gallery access lists all jobs newest first. Token-based progress
  (`progressToken`) and error (`errorToken`) controls keep local and remote UI usable without resubmission. Media
  scheduling remains separate from Auto. No real video generation or capacity consumption is performed; every job is
  a synthetic fixture. Fixture tests cover success, failure, unknown job and interrupted polling. Local/remote live
  evidence remains unverified pending verification; no live claim is made.
- T19 preserve image generation and editing (`modules/image/index.js`, unit-tested in
  `test/accepted/image.test.js`): image generation (text-to-image) and image editing
  (image-to-image with ordered, complete edit references) start exactly one synthetic
  job per submission and return a job id; polling reads the job's status without
  resubmitting, so recovery or cancellation cannot create duplicate side-effecting
  submissions. Edit references must be complete and ordered: an edit-reference failure
  throws and cannot silently become text-to-image generation. Completed images map to
  output attachments (fileName, url, mime) and inline image views render with
  loading/error states and object-URL cleanup; gallery access lists all jobs newest
  first and open returns a read-only snapshot. Token-based progress (`progressToken`)
  and error (`errorToken`) controls keep local and remote UI usable without resubmission.
  Jobs are bound to [provider, account, model]: same-provider accounts schedule
  independently and a logged-out account yields to the next candidate (cross-provider
  fallback) only on a definitive auth/quota/entitlement rejection; ambiguous
  timeout/transport/5xx errors never resubmit a potentially completed image.
  Enrollment/allowlists for chat Auto are not repurposed as media policy. Fixture tests
  cover generation, ordered complete edit references, output attachments, inline image
  views and gallery/open behavior, the fallback contract, one supported auth-refresh
  path, cancellation and secret-safe diagnostics. No real image generation or capacity
  consumption is performed; every job is a synthetic fixture. Local/remote live evidence
  remains unverified pending verification; no live claim is made.

### Changed
- R09 Skills package cleanup: omit standalone catalog/repository/updater runtimes, browser code and assets while retaining a reproducible Apache-2.0 basic-core subset and its pinned dependency. Extracted-package fixtures cover disabled/enabled registration, basic create/list/detail/toggle/trash/restore/delete and deferred-action rejection. This does not activate Skills in production Settings, complete native visibility integration, or establish desktop/remote live acceptance.
- Owner-approved planning split: management admission remains T02A; trusted local/remote Command hook
  Approval provenance is independently gated by T02E and blocks T10 approval/execution, not ordinary
  Settings/Skills/MCP/inert Hook editing. T02A temporary feasibility subsequently passed the joined
  exact-host client/carrier/service proof; T02E remains unavailable. No production runtime is enabled.
- Owner-approved scope clarifications: no process-global subscription networking mutation; local-directory
  Skill import/browse explicitly deferred; legacy profile Hooks manually re-added with fresh Approval.
  These are planning decisions, not implemented or live-verified behavior.
- Development candidate `0.3.0-rc.1`: isolated the accepted host module and baseline-only client build from
  historical Manager prototypes. No Manager/provider runtime is enabled. Approved suites under `test/accepted/`
  run automatically alongside existing regressions; packaging excludes prototype runtimes.
- `package.json`: added `homepage`, `bugs`, `dsh.engines` and `icon`, and the missing `lib/read-page-native.js` and
  release documents in the published `files` list.

### Fixed
- T03 readiness controls keep keyboard focus during asynchronous checks: known native Switches
  (and checkbox fallbacks) and Refresh remain focusable while busy, with an ARIA-disabled state
  and a synchronous single-flight guard. No deferred focus restoration can steal focus after
  the Owner moves, changes Settings sections or unmounts. Real ReactDOM/jsdom keyboard regressions
  cover focus, Tab order, repeat activation, failures and late responses. Installed desktop/remote
  verification remains pending; no installed files or operational Manager behavior changed.
- Register Arabic (`العربية`, English fallback) in the public native language catalog, separately
  from the existing dictionary, so supported hosts can offer it in General's Language menu.
  The client owns only its exact registration's cleanup, preserves another plugin's Arabic entry,
  and skips registration on older hosts without a usable catalog API or English fallback.
  No explicit locale selection or preference write is made. Strict public-boundary regressions pass;
  live desktop/remote verification of Arabic selection remains pending.
- Declared the native `connection` service required by the T03 Settings readiness client. A real
  Cordis sibling-service regression now covers initial readiness and Refresh RPC dispatch; the
  previous declaration produced no request. Corrected paired-remote readiness enable/Refresh/disable
  was verified live after client deployment and reload; authenticated local and full visual acceptance remain pending.
- Baseline disposal restores a previous account-menu extension and removes its own empty namespace and
  pending stylesheet load listeners instead of retaining callbacks or deleting another owner's API.
- Baseline disposal restores preexisting inline font values/priorities and invalidates pending notification
  delivery before permission/registration completes. Package lifecycle builds remain executable from the tarball.

### Known issues / unverified
- Bounded paired-remote carrier evidence composes the actual remote pairing gate/rewrite/proxy with native
  Owner admission through explicit in-memory HTTP. Reviewed header synthesis was removed; pairing and header-loss
  controls fail as intended. This is not mounted/live remote acceptance or production Manager activation.
- T02A now composes native signed Owner admission with read-only session/project scope resolution over
  disposable services and directories. A reviewed live-session publication race is fixed and tested during
  filesystem awaits. The resolver now ships with the inert authenticated Settings slice; real Manager
  writes and browser/live acceptance remain pending.
- T02A has a bounded official MCP client/ToolRuntime stdio lifecycle proof over a disposable fixture:
  handshake, actual call/error, deadline/cancellation and awaited tool/process teardown pass with a
  result-corruption negative control. This is not production Manager, namespace isolation or remote acceptance.
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
