# Six-family vertical-ticket proposal and tracker reconciliation

Date: 2026-10-28. **Owner-approved review partition; Q138 tracker reconciliation complete with independent exact readback; not implementation authorization.** Q136 approves the [specification](current-scope-specification-2026-10-28.md); Q137 approves this refined local partition. Story numbers below refer to that specification. Behavioral boundaries and exact defaults remain authoritative there; this document partitions delivery, not redesign.

## Review contract

Q137: the Owner approved the breakdown as a basis and the recommendation to split the flagged broad outcomes locally. This revision separates E04 navigation/folding/composer, E07 motion/experimental rendering, O01 per-Manager rehearsals and O02 provider/service rehearsals. Original identifiers remain stable; suffixed IDs identify new independently verifiable slices, not GitHub numbers. Scope and priority are unchanged. Q138 subsequently authorizes tracker reconciliation; its execution/readback is recorded separately from this review partition. Git publication and implementation still need their own explicit permission; parents remain unchanged.

Each slice delivers an Owner-visible workflow through production Settings/transport, authoritative state and its actual native consumer, with regression proof at the Q135 boundary. Its acceptance includes local/paired admission, cancellation, disposal, English/Arabic accessibility and applicable browser scenarios, not merely a helper or saved form. Reuse working code and existing evidence; implement only missing behavior. Controlled native proof, rendered-browser proof and separately authorized operational proof stay distinct. An unresolved seam blocks the affected claim, not unrelated work. No wide prefactoring is justified by current evidence; any later necessary prefactor must remain bounded and preserve a working vertical path.

**Numbering is review order, not a linear dependency chain.** Follow Enhancements → Subscriptions → MCP → Skills → Hooks → Auto/Smart as Owner priority; dependency-ready work does not override that priority or the implementation freeze. No-blocker entries are only graph-ready after approvals and applicable gates.

## External gates, not invented implementation tickets

- **G0 — exact host matrix:** confirm supported host/release versions before implementation commitments. Existing rc.3 proofs do not establish all advertised rc.2+ hosts. Record exact-version evidence per slice; narrowing needs Owner disposition.
- **G1 — Appearance support/licensing:** verify public presentation seams and selected source/asset licenses per affected capability. Full desired scope remains included, including experimental Sodium. PolyForm Shield renderer and separately licensed fonts/art are not blanket MIT material. Obtain a supported implementation or an explicit Owner alternative; no silent omission or host patch.
- **G2 — session command authority:** actual synchronized session permission state and restart-to-Ask-me need public-contract evidence; browser-local imitation is insufficient.
- **G3 — provider/API/media/auth support:** independently characterize each provider/access method, native API reference, MCP authorization and operation-specific search/media formats. Catalog/image-input evidence is not inference/output proof. Return unsupported mechanisms for disposition rather than borrowing credentials, disguising requests or adding sidecars.
- **G4 — native Skills invalidation:** retain cold/warmed slash, same-Agent preset, source-policy and paired-consumer acceptance. Management/Unicode tests alone do not resolve it.
- **G5 — native Hook mappings:** independently prove each named lifecycle/effect, with native guards and cancellation. A manual subprocess or synthetic SessionStart does not prove other mappings or process containment.
- **G6 — Auto coherence/retries:** unresolved pre-provider model-sensitive preparation and genuinely shared retry accounting gate A01. Existing late redirects or fixture-owned ledgers do not resolve it.
- **G7 — operations:** installed edits/restart, account/store access, real pairing, live/paid consumption, reference removal and release require specific permission. A ticket is not consent to perform them. Record synthetic rollback proof before any operational Cutover.

Resolve each seam within the scope-control investigation budget (two failed checks or 20 minutes per factual blocker), record requirement/version/evidence and return the smallest supported alternatives to the Owner if unresolved. These gates have no implied passing status and do not count as approved deferrals.

## Proposed slices

### DSH Enhancements — first priority

#### 1. E01 — Retain preferences and independently restore typography/direction
- **Blocked by:** none.
- **Delivers:** existing profile-local preferences, font-family precedence/Arabic fallback, independent sizing and paragraph direction remain usable in native Appearance Settings.
- **Acceptance:** saved/native defaults survive reload and theme changes; one-setting reset shows its resulting value without touching other features. UI size 11–20/default 14 remains separate from native chat sizing; code/paths stay LTR. Settings work across authorized interfaces without sharing personal display state.
- **Stories:** 1–6, 20–21, 122–124. **Tracker proposal:** new; reuse baseline preferences, not a rewrite. **Gates:** G0/G1 for affected presentation seams.

#### 2. E02 — Personalize general branding and palettes
- **Blocked by:** E01 (preference ownership/reset/font precedence).
- **Delivers:** theme/brand, local display name/image, mark coloring, preset/custom palettes, whole-page zoom and accessible popovers.
- **Acceptance:** supported local images validate before display without external upload/account rename; brand changes preserve chosen typography, draft and reading position. Touch/keyboard alternatives and per-setting resets are demonstrated.
- **Stories:** 7, 9, 20–21. **Tracker proposal:** new. **Gates:** G1.

#### 3. E03 — Customize home layouts and mascots
- **Blocked by:** E01.
- **Delivers:** native/chat/code home layouts, ripple background and mascot choice/location without automatic activation of all effects.
- **Acceptance:** saved choices restore/reset independently and preserve essential controls/drafts; licensed supported assets and reduced-motion/platform alternatives are recorded. No task/account action follows a layout change.
- **Stories:** 10, 20–21. **Tracker proposal:** new. **Gates:** G1.

#### 4. E04 — Navigate long conversations and configure their frame
- **Blocked by:** E01.
- **Delivers:** message navigator, conversation width, Chat/Trajectory tabs and supported title-bar presentation over actual native conversations.
- **Acceptance:** navigating real messages/tabs retains draft/focus/reading position; touch/keyboard alternatives, saved preferences and independent resets work. Platform-only title-bar behavior is visibly bounded; display changes never mutate conversation data.
- **Stories:** 11, 20–21. **Tracker proposal:** new; retains E04 identity for navigation only. **Gates:** G1.

#### 5. E04a — Fold reasoning, processes and messages accessibly
- **Blocked by:** E01.
- **Delivers:** independent reasoning/process/message folding through native conversation controls and actual retained content.
- **Acceptance:** fold/unfold restores accessible full content, keyboard/touch focus and reading position; saved choices/reset work during updates without losing draft or dispatching actions. No prerequisite on navigation styling E04.
- **Stories:** 12, 20–21. **Tracker proposal:** new E04 split, not a horizontal rendering helper. **Gates:** G1.

#### 6. E04b — Style process rows and composer without losing work
- **Blocked by:** E01.
- **Delivers:** process-row style and composer styling/bottom gap applied to the actual working conversation/composer.
- **Acceptance:** draft, attachments, accessible native actions and reading position survive apply/reset/reload; keyboard/touch entry and narrow-view layouts remain usable without task dispatch or authority changes.
- **Stories:** 12, 20–21. **Tracker proposal:** new E04 split independent of navigation/folding. **Gates:** G1.

#### 7. E05 — Present native model, effort, context and estimate information
- **Blocked by:** E01.
- **Delivers:** native permission/model controls, descriptions/quick providers/effort accents, rate/context/statistics placement, currency and custom model-price display.
- **Acceptance:** actual native actions/permissions remain authoritative; changing presentation never switches account or enrolls Auto. Unknown data stays unknown; estimates are labeled separately from charges/quota and use the configured display inputs. Resets/keyboard access work.
- **Stories:** 13–15, 20–21. **Tracker proposal:** new; native usage display is independent of S10 quota integration. **Gates:** G1.

#### 8. E06 — Organize sidebar and account navigation
- **Blocked by:** E01.
- **Delivers:** account/search redesign, search-box styling, entries/More, Active/Archived, hover reveal, density/right-panel cards, optional account-menu grouping and account-hold demo.
- **Acceptance:** actual native data/search/archive/delete semantics and permission guards survive; hidden entries remain reachable through More and keyboard/touch. Account-hold is clearly a joke/demo with no credentials/payment or real suspension claim; saved grouping baseline is retained.
- **Stories:** 16–18, 20–21, 26. **Tracker proposal:** new. **Gates:** G1.

#### 9. E07 — Control accessible motion and live conversation effects
- **Blocked by:** E01.
- **Delivers:** system/reduced/always policy, chat scrolling, waiting line, precise status, new-text fade, bubbles, caret and ongoing-conversation markers in actual conversations.
- **Acceptance:** preferences/reset/reload preserve reduced-motion policy, accessible controls, draft and reading position during streaming. Each listed effect is demonstrated without inventing execution status or introducing a native action; no dependency on experimental renderer availability.
- **Stories:** 19–21. **Tracker proposal:** new; retains E07 identity for motion. **Gates:** G1 for presentation paths only.

#### 10. E07a — Opt into experimental rendering and recover native styling
- **Blocked by:** E01.
- **Delivers:** desired experimental Sodium capability through a supported licensed implementation, explicitly off initially, with compatibility/conflict warning and an accessible native-style recovery path.
- **Acceptance:** prove supported path and path-specific licensing before adoption; toggling/recovery preserve conversation/draft/focus and never disable another plugin. Unresolved renderer support returns for Owner disposition, not an omitted feature or passed ticket. Motion E07 remains independently deliverable.
- **Stories:** 8, 20–21. **Tracker proposal:** new E07 split retaining full experimental scope. **Gates:** G1; no copied restricted engine/assets or host patch implied.

#### 11. E08 — Deliver private device-local notifications
- **Blocked by:** none.
- **Delivers:** completion/intervention controls, Off/background-only/Always, permission/test/fallback and actual session navigation.
- **Acceptance:** per-interface event deduplication and independent devices; foreground silence/OS-respecting background sound; private default text and opt-in title. Reset never requests OS permission; browser/OS proof distinguishes unsupported or closed-page mobile delivery.
- **Stories:** 22–24. **Tracker proposal:** new; reuse existing notifications. **Gates:** G7 only for installed/OS operations requiring permission.

#### 12. E09 — Copy selected text and read native pages honestly
- **Blocked by:** none.
- **Delivers:** retained opt-in copy-on-select and authorized native page reading without hidden cloud processing.
- **Acceptance:** inputs/composer/terminal/native mobile selection remain untouched; clipboard reports actual success/failure. Reading preserves cancellation/truncation/raw-content limits, no implicit summary/query processing, and untrusted-content handling. Browser evidence and existing read-page regressions remain distinct.
- **Stories:** 25, 27. **Tracker proposal:** new bounded baseline-hardening slice, separable at review if desired.

#### 13. E10 — Share authoritative session command mode safely
- **Blocked by:** none.
- **Delivers:** Ask me/Safe/Aggressive controls reflect one actual session setting on local/paired interfaces, with restart/reset-to-Ask-me.
- **Acceptance:** refresh/reconnect cannot revive stale local authority; new sessions/host restart use Ask me, command reset only reduces authority. A real native permission request observes the chosen mode under native guards; no extra tool/Hook authority follows.
- **Stories:** 28, 34. **Tracker proposal:** new. **Gates:** G2/G0; reuse existing classifier without declaring its historical policy the redesigned acceptance.

#### 14. E11 — Apply reviewed local Safe/Aggressive action policies
- **Blocked by:** E10 (actual mode ownership).
- **Delivers:** routine known-effect development proceeds in Safe; destructive Safe operations get request-specific checkpoints; Aggressive supports reviewed broader project risk without sensitive access.
- **Acceptance:** effects/targets/paths and known script contents determine decisions, not wrapper names. Trusted Settings customization cannot be expanded by project/agent input or one-off approvals. No three-handback shutdown; independent work may proceed; security/explicit constraints and stale/cancelled decision fencing remain intact.
- **Stories:** 29–33. **Tracker proposal:** new. **Gates:** G2.

#### 15. E12 — Add explicitly configured bounded command judgment
- **Blocked by:** E11.
- **Delivers:** optional contextual judgment, local-only operation and mode-specific fallback without hidden service/account failover.
- **Acceptance:** selected supported connection/model, minimal disclosure, one attempt/default 20-second deadline and optional session cap; refusal never becomes fallback approval. Redacted reason/origin/counts and last 100 in-memory decisions clear on close/restart; no raw command/history storage or late duplicate execution. Reuse judgment connection plumbing without requiring Smart activation.
- **Stories:** 32–33. **Tracker proposal:** new; reuse closed R15 #54 implementation, retain #77 verification separately. **Gates:** supported judgment protocol and G7 for real consumption.

### Subscriptions — second priority, search/media nested here

#### 16. S01 — Complete retained Codex login and direct chat
- **Blocked by:** none.
- **Delivers:** native Settings login/cancel/identity → private durable account → catalog/direct choice → prepared streamed response through the selected account.
- **Acceptance:** expiry/refresh/restart/late-settlement fencing and no secret snapshots; login neither selects/sends nor enrolls tools/Auto/judgment. Complete text/reasoning/tool/usage/error/attachment/replay behavior remains account-bound; missing model and partial/ambiguous failure never silently resend. Controlled full workflow first, live consumption separately authorized.
- **Stories:** 35–36, 39–40, 43–44, 49, 53, 62. **Tracker proposal:** retain #48 for account acceptance and #55 for dispatch, as two linked existing records rather than create duplicates; S01 is their grouped review outcome, not permission to merge their histories. **Gates:** G0/G3/G7.

#### 17. S02 — Complete Claude login and direct chat
- **Blocked by:** S01 (reusable proven account/dispatch foundation).
- **Delivers:** provider-specific Claude authentication, catalog, refresh, persistence and selected native chat with complete input/stream/replay semantics.
- **Acceptance:** independently characterize real protocol/options and actual selected identity, error/cancel/restart behavior; inherit S01 consent/privacy/no-uncertain-replay boundaries without substituting a generic login fixture.
- **Stories:** 35–36, 39–40, 43–44, 49, 53, 62. **Tracker proposal:** amend existing #57, preserve #18 history. **Gates:** G3/G7.

#### 18. S03 — Complete Grok login and direct chat
- **Blocked by:** S01.
- **Delivers:** Grok-specific login/catalog/prepared chat with retained histories/references and truthful operation availability.
- **Acceptance:** real protocol-specific controlled evidence, refresh/cancel/restart and selected identity; chat availability does not enable search/media or hide uncertain resubmission.
- **Stories:** 35–36, 39–40, 43–44, 49, 53, 62. **Tracker proposal:** amend #58, retain #19 history. **Gates:** G3/G7.

#### 19. S04 — Complete Copilot device authorization and chat
- **Blocked by:** S01.
- **Delivers:** dedicated device-code authorization → verified account/catalog → selected prepared chat.
- **Acceptance:** expiry/cancel/relink fencing and actual provider identity/capabilities; no borrowed credentials, synthetic catalog success or implicit route change/consumption. Complete stream/input boundaries are independently exercised.
- **Stories:** 35–36, 39–40, 43–44, 49, 53, 62. **Tracker proposal:** amend #59. **Gates:** G3/G7.

#### 20. S05 — Complete Antigravity account and chat
- **Blocked by:** S01.
- **Delivers:** supported provider-specific account/catalog/refresh and native direct route.
- **Acceptance:** verify supported auth/dispatch without implicit sidecars/disguise/credential imports; cancellation/restart/identity/capability/error behavior proves the actual workflow or returns an explicit unsupported-path decision.
- **Stories:** 35–36, 39–40, 43–44, 49, 53, 62. **Tracker proposal:** amend #60. **Gates:** G3/G7.

#### 21. S06 — Use an explicitly enabled OpenCode connection
- **Blocked by:** S01 (native account/connection presentation and dispatch foundation).
- **Delivers:** accountless anonymous connection/catalog and supported direct route, with authenticated methods distinct where actually supported.
- **Acceptance:** no invented subscription identity; source/freshness/capabilities/errors and complete request/stream behavior are proven. No implicit credential delegation, local process or paid fallback.
- **Stories:** 35–37, 39–40, 43–44, 49, 53, 62. **Tracker proposal:** new; sixth provider absent from R01–R27. **Gates:** G3/G7.

#### 22. S07 — Manage multiple accounts, defaults and revocation
- **Blocked by:** S01.
- **Delivers:** verified nonduplicate identities, masked cards/defaults, pause/sign-out/remove and durable host-owned settings across authorized clients.
- **Acceptance:** pause blocks all new Majed paths, sign-out retains settings, removal confirms scoped deletion without conversations/results loss. Cooperative cancellation and provider-session limits are honest; async dispatch revalidates revocation. Additional completed providers acquire the same behavior without waiting for all six.
- **Stories:** 38–43, 47, 62. **Tracker proposal:** narrow existing #61 to this outcome plus S09 follow-up; preserve multi-account evidence. **Gates:** G7 for operational account actions.

#### 23. S08 — Configure catalog entries and manual model defaults
- **Blocked by:** S01.
- **Delivers:** aliases/visibility/independent entries, capability/context/effort/Fast defaults, discovered/static/manual metadata and explicit session versus new-chat choices.
- **Acceptance:** saved missing models show errors instead of replacement; refresh has source/freshness and performs no generation. Controls affect actual prepared requests, preserve explicit effort and do not enroll Auto; apply per supported provider, with unknown options visible.
- **Stories:** 44–47, 51. **Tracker proposal:** focused follow-up retaining closed #20 and provider tickets; no reopening all legacy implementations. **Gates:** G3 per provider.

#### 24. S09 — Use explicit direct routes and bounded manual pools
- **Blocked by:** S07.
- **Delivers:** pinned direct choices remain account-bound; explicitly selected pools safely fail over without becoming Auto.
- **Acceptance:** complete attachments/history/tool pairing/opaque replay isolation and native offload semantics survive; ambiguity/partial reasoning/tool output/cancellation stops hidden transfer. Count owned retry layers and preserve one active route with truthful failure.
- **Stories:** 48–49, 53. **Tracker proposal:** split follow-up from #61; no Auto or G6 dependency for standalone direct/manual pools. **Gates:** G3.

#### 25. S10 — Observe usage and perform explicit quota operations
- **Blocked by:** S01.
- **Delivers:** provider quota/reset/windows, locally observed consumption and explicit eligible reset-credit preparation/confirmation.
- **Acceptance:** source/time/unknown figures remain separate from estimates; settings affect supported windows. Single-use uncertainty protection prevents duplicate redemption; warnings never automatically buy capacity or exclude working routes. Each provider's unsupported operations remain explicit.
- **Stories:** 50–52, 62. **Tracker proposal:** amend #67; remove blanket Claude prerequisite where a complete Codex usage path can stand alone, then verify other provider capabilities independently. **Gates:** G3/G7.

#### 26. S11 — Apply proxy/cache/provider options to actual traffic
- **Blocked by:** S01.
- **Delivers:** supported proxy/bypass, cache TTL and provider/client options visibly affect the selected module's real request path.
- **Acceptance:** controlled endpoint evidence and redacted failure; no process-global network timing mutation. Unsupported scoped timing returns a disposition; no hidden alternate provider on failure.
- **Stories:** 51, 62. **Tracker proposal:** amend #68, retain #22 history. **Gates:** G3.

#### 27. S12 — Search through independently configured authorized services
- **Blocked by:** S01.
- **Delivers:** independent search activation/account/model and native tool/history/attachment-policy integration with genuine retrieval.
- **Acceptance:** query/necessary context only, links/snippets versus summaries and missing citations distinguished; no recall-as-search or full-page conflation. Stable aliases/single tool owner, revocation/cancel and supported provider paths proven; Grok path additionally needs S03, but another eligible search path need not wait for it.
- **Stories:** 54–55, 62. **Tracker proposal:** amend #66, keep attachment dispatch obligations in S01/S09 rather than make all media depend on search. **Gates:** G3/G7.

#### 28. S13 — Generate and edit images without dropping references
- **Blocked by:** S01.
- **Delivers:** independent image generation/edit service selection, ordered complete references/options, durable results and native galleries locally/remotely.
- **Acceptance:** failed edit/reference never becomes text-to-image; exact supported provider path is independently proven (Grok requires S03). Count submissions; download/reconnect failure never regenerates. Cancellation/temporary links/cleanup and alias-compatible rendering are truthful.
- **Stories:** 54, 56–58, 62. **Tracker proposal:** amend #69; remove search-only #66 dependency unless a concrete shared production consumer actually requires it. **Gates:** G3/G7.

#### 29. S14 — Submit and recover video/media jobs once
- **Blocked by:** S01.
- **Delivers:** independently enabled supported video submission, persistent job identity/recovery, bounded status observation/download/native playback.
- **Acceptance:** actual states not invented progress; restart/reconnect queries same job without another generation; preserve selected inputs/options, temporary-link errors and local versus confirmed provider cancellation. Provider-specific Grok path additionally requires S03; no dependency on search/image completion by assumption.
- **Stories:** 54, 56–58, 62. **Tracker proposal:** amend #70. **Gates:** G3/G7.

#### 30. S15 — Reuse native API model references without credential copies
- **Blocked by:** none.
- **Delivers:** eligible native-managed models from any supported brand are usable manually, with native configuration authoritative and explicit potential usage-billing disclosure for enrollment.
- **Acceptance:** public native identity/preparation contract, no duplicate provider/secret store; changes/removal reflected without silently replacing choices. Chat support implies no media support; tools/context/effort/cancel remain native. Auto application stays with A01, not prerequisite for manual use.
- **Stories:** 59–61. **Tracker proposal:** new. **Gates:** G3/G0/G7.

### MCP Manager — third priority

#### 31. M01 — Manage scoped connections with conflict-safe lifecycle
- **Blocked by:** none.
- **Delivers:** retained scoped stdio/HTTP add/edit/connect/test/disable/remove, effective project override/global fallback, secrets keep/replace/remove and trustworthy observed status.
- **Acceptance:** new saves disabled, no installation; active validation/dispose-before-replacement, bounded reconnect and visible cleanup failures preserve healthy servers. Admission/path/scope, stale writes, transport credential handling and secret redaction tested through actual ToolRuntime invocation/denial, not snapshots alone.
- **Stories:** 63–67, 69, 71, 74. **Tracker proposal:** new delta linked to closed #52; keep its implementation accepted and #75 browser obligation open. **Gates:** G0/G3 where runtime-specific.

#### 32. M02 — Select MCP tools without expanding authority
- **Blocked by:** M01 (actual owned connection/discovery/invocation).
- **Delivers:** selected-only default or all-except-denied, with policy applied to actual discovery and future calls.
- **Acceptance:** new tools excluded in selected-only, policy-correct in all-except-denied; descriptions untrusted/native denials win. Revocation blocks new async calls; no standalone Tool Rules engine dependency.
- **Stories:** 68–69. **Tracker proposal:** reactivate/re-scope #40 from deferred, remove obsolete #16 dependency only after graph approval.

#### 33. M03 — Preview and exchange MCP definitions losslessly
- **Blocked by:** M01.
- **Delivers:** supported-format import/export with scope/conflict preview and disabled imports.
- **Acceptance:** preserve supported semantics, reject/report unsupported fields rather than drop them; no implicit store takeover, installs or connections. Default exports omit secrets and mark re-entry; stale edits and replacement need review.
- **Stories:** 70–71. **Tracker proposal:** narrow #41 to approved import/export; retain implicit legacy ingest/handoff as not authorized, not silently adopted.

#### 34. M04 — Authorize and relink supported remote MCP connections
- **Blocked by:** M01.
- **Delivers:** needs-login versus failure and supported browser auth/relinking bound to the correct host-side connection, including paired/mobile initiation.
- **Acceptance:** expiry/cancel/late-callback/mismatched connection cases cannot link wrong authority; no client-localhost assumption, secret snapshots or hidden broker. Unsupported auth paths return Owner disposition.
- **Stories:** 72, 74. **Tracker proposal:** new delta. **Gates:** G3/G7.

#### 35. M05 — Restore reviewed MCP activation safely after restart
- **Blocked by:** M02.
- **Delivers:** explicit persistent activation/tool policy; global reconnect and matching-runtime-only project activation after validation.
- **Acceptance:** changed command/destination/tool authority needs renewed review, stale concurrent files cannot inherit consent; disabled/new/imported remain disabled. Bound cleanup/retry and visible timestamps; status refresh never starts failed servers.
- **Stories:** 73–74. **Tracker proposal:** new delta linked to #52. **Gates:** G7 for installed restart.

### Skills Manager — fourth priority

#### 36. K01 — Make scoped availability match actual native consumers
- **Blocked by:** none.
- **Delivers:** source/scope/writability, conflict/native winner and independent manual/model policy reflected in actual Agent/preset/session invocation.
- **Acceptance:** cold/warmed slash, same-Agent preset and paired changes; source denials/native precedence win, fallback exposure/name-wide exclusion explicit. Unicode bytes/names preserved with separate invocation diagnostics; disable affects future loads, not retained context/effects.
- **Stories:** 75–76, 78–80, 89. **Tracker proposal:** amend existing #51, retain closed #10/#11 and Unicode work. **Gates:** G4/G0.

#### 37. K02 — Edit and reversibly remove owned Skills
- **Blocked by:** K01 (actual availability/conflict effects).
- **Delivers:** chosen writable-source create/edit/trash/restore with intact resources/policy and protected external/read-only originals.
- **Acceptance:** traversal/symlink/outside deletion blocked; restore collisions reviewed, permanent removal confirmed. Native future loads reflect edits/restores without hidden restart or permission expansion; retained context disclosed.
- **Stories:** 77–81, 89. **Tracker proposal:** focused #51 follow-up, reuse existing management work.

#### 38. K03 — Import local Skill files and folders disabled
- **Blocked by:** K02.
- **Delivers:** upload/import preview → explicit owned destination → intact supported resources → disabled native availability.
- **Acceptance:** file/destination/conflict/unsupported semantics visible; no script execution/install/path escape. Browser-dependent mobile folder limits explicit; imported contents preserved and usable after separate enablement.
- **Stories:** 82. **Tracker proposal:** split #38 upload/import portion into this outcome. **Gates:** G4 and supported formats.

#### 39. K04 — Browse repositories and install selected Skills with provenance
- **Blocked by:** K03 (reviewed destination/import pipeline).
- **Delivers:** opt-in repository/catalog browsing with revision/license, selected-file preview and owned disabled installs.
- **Acceptance:** network/download disclosed, no trust endorsement/scripts/activation; removing repository stops tracking without deleting copies/provenance/policy; outage preserves originals. Supported source formats and read-only boundaries explicit.
- **Stories:** 83, 87. **Tracker proposal:** re-scope #37 into current scope. Supersede #49's obsolete blanket catalog-removal requirement only after approval; retain legitimate unused/unsafe surface cleanup without disabling desired catalog functionality.

#### 40. K05 — Organize Skills with durable local metadata
- **Blocked by:** K01.
- **Delivers:** local search/filter and Owner labels/categories with persisted scoped metadata and conflict review.
- **Acceptance:** instructions/identity/invocation/precedence untouched; no external semantic upload. Restart and concurrent changes preserve labels/policy without activating discoveries or bypassing Agent restrictions.
- **Stories:** 84, 88. **Tracker proposal:** split labels/categories from #38; do not force this to wait for upload/catalog implementation.

#### 41. K06 — Check and apply reviewed Skill updates recoverably
- **Blocked by:** K04.
- **Delivers:** manual/opt-in periodic checks separate from reviewed application, with source/revision diff, local-edit conflicts and previous-content recovery.
- **Acceptance:** no automatic activation, overwrite or permission broadening; resources/invocation changes reviewed, missing pin/comparison support visible. Repository outages/untracking preserve installed content; restart/concurrent edits handled.
- **Stories:** 85–88. **Tracker proposal:** new follow-up to #37; plugin self-update #39 is distinct and stays deferred.

### Hooks Manager — fifth priority

#### 42. H01 — Manage definitions and exact-version Approval
- **Blocked by:** none.
- **Delivers:** scoped draft/create/edit/duplicate/import/export/reversible removal → authenticated exact-content review → separate Approval/activation.
- **Acceptance:** canonical scope/command/cwd/environment/watch binding, server receipt/expiry/single-use typed confirmation; truthful known/unknown origin and stale-edit fencing. Copies/imports/restores unapproved/disabled, export excludes consent/secrets, no execution or external-store takeover. Preserve closed #53 proof rather than reuse historical consent.
- **Stories:** 90–92, 94–95. **Tracker proposal:** new management delta linked to #53; #76 UI verification remains separate.

#### 43. H02 — Run SessionStart and UserPromptSubmit through bounded lifecycle
- **Blocked by:** H01.
- **Delivers:** two independently mapped native events → approved commands → supported optional context/observation → visible result with deterministic scope/match/order.
- **Acceptance:** real event producer/stdin-minimized JSON/no shell interpolation; host-user execution warning, no sandbox claim. Establish four-active/64-queued/30-second queue/300-second chain, per-command 30/default–300/max and 1 MiB/256 KiB/64 KiB I/O bounds. Native guards, observational failure, revoke/cancel/queue revalidation/cleanup and nonrecursive delivery work; no dormant runner activated by assumption.
- **Stories:** 90, 93, 96–98, 101–102. **Tracker proposal:** narrow #56 to this first lifecycle workflow; subsequent H slices become linked follow-ups. **Gates:** G5.

#### 44. H03 — Enforce PreToolUse and PermissionRequest gates
- **Blocked by:** H02 (bounded approved runtime).
- **Delivers:** actual pre-action native mappings restrict associated actions with visible recovery.
- **Acceptance:** denial/invalid/missing result blocks action and ends chain; later hooks/Safe/Aggressive never override it. Actual native permission guard remains authoritative, queue invalidation cancels effects and no duplicate execution follows recovery. Both mappings independently proven.
- **Stories:** 93, 97–99, 102. **Tracker proposal:** split follow-up from #56. **Gates:** G5.

#### 45. H04 — Observe PostToolUse and PostCompact honestly
- **Blocked by:** H02.
- **Delivers:** actual post-event maps and supported output/context/history effects without pretending to reverse completed actions or restore discarded context.
- **Acceptance:** independent native event delivery, sequential matching and visible nonblocking observation failures; minimized data and supported cancellation/revocation fence late effects. No arbitrary stdout authority.
- **Stories:** 93, 96–99, 102. **Tracker proposal:** split follow-up from #56. **Gates:** G5.

#### 46. H05 — Bound Stop continuation to the real user turn
- **Blocked by:** H02.
- **Delivers:** actual Stop result can continue only through the supported native contract.
- **Acceptance:** at most three continuations per actual user-started turn; Hook continuation cannot reset budget, recurse indefinitely or bypass native limits. Invalid structured output/cancellation and chain expiry fail visibly without hidden retry.
- **Stories:** 93, 98, 100–102. **Tracker proposal:** split follow-up from #56. **Gates:** G5.

#### 47. H06 — Test approved Hooks and inspect metadata-first history
- **Blocked by:** H02.
- **Delivers:** passive validation, explicit approved synthetic manual tests and last-200-run history/opt-in diagnostics/redacted export/clear.
- **Acceptance:** validation executes/downloads nothing; manual test discloses real host execution, shares bounds/cancel and can test disabled approved definition without activation/live effects. No default raw payload retention, privacy warning for diagnostics; history clearing does not change Approval or prove lifecycle coverage.
- **Stories:** 104–105. **Tracker proposal:** new linked #56 follow-up.

#### 48. H07 — Restore or suspend Hooks safely across restart
- **Blocked by:** H02.
- **Delivers:** valid approved activation revalidated after restart, changed/missing definitions suspended and interrupted history preserved without replay.
- **Acceptance:** disable retains valid consent, revoke requires review, restored removals unapproved/disabled; new/queued work fenced and requested versus confirmed cancellation distinguished. Reconnect never replays events or retries interrupted commands. Validate behavior for each subsequently delivered event mapping.
- **Stories:** 102–103. **Tracker proposal:** new linked #56 follow-up. **Gates:** G7 for installed restart.

### Auto & Smart Routing — sixth priority

#### 49. A01 — Enroll and execute coherent deterministic native Auto
- **Blocked by:** S01.
- **Delivers:** genuine native Auto selection with explicit candidates/priority/effort, eligibility, coherent pre-provider preparation/dispatch and actual route display; healthy stickiness and manual exit.
- **Acceptance:** resolve G6, count maximum three distinct safe pre-output candidates across all owned layers/auth refresh; preserve images/history/tools/context/explicit effort. Partial reasoning/text/tool/effects/cancel stop hidden switching; scoped failures/reset/exhaustion and unknown telemetry honest. Policy safe reapply versus immediate revocation, async fences and no global-default mutation proven. Native API candidates can be added only after S15, without blocking subscription-only Auto.
- **Stories:** 106–114. **Tracker proposal:** retain #50 as native-contract blocker and #62 as product acceptance; S01 enables explicit candidates, #61 manual pooling is not a prerequisite unless actual composition proves it. Do not close #50 using closed #5/#6 characterization alone. **Gates:** G6/G0.

#### 50. A02 — Apply optional bounded task-suitability Smart
- **Blocked by:** A01.
- **Delivers:** explicitly configured judgment over eligible model/permitted effort with visible priority fallback and independent session disable.
- **Acceptance:** closed candidates, minimal disclosure, one attempt/default three seconds, configurable Majed-wide 20/day concurrent accounting; three service failures pause five minutes, abstention not failure. Revalidate late/stale/policy/cancel results, never reduce explicit effort or recurse through Auto. Reuse #54 connection but verify current protocol/privacy; no dependence on command judgment activation.
- **Stories:** 115–117. **Tracker proposal:** narrow #63 to applied Smart, separate Shadow A04. **Gates:** G7 for consumption.

#### 51. A03 — Explain and expire routing decisions privately
- **Blocked by:** A01.
- **Delivers:** minimal actual-route/reason/timing/available-cost diagnostics and seven-day local expiry/manual deletion.
- **Acceptance:** no raw task/history/judgment responses, invented explanations, calibrated confidence or monetary guarantees; failures and estimates labeled. Persistence/concurrency/deletion preserve routing behavior; S15 billing disclosure required for API candidates.
- **Stories:** 112, 114, 118. **Tracker proposal:** focused #62/#63 follow-up; not a prerequisite for selecting an otherwise valid route during development, but required for complete product acceptance.

#### 52. A04 — Compare opt-in Shadow without applying or duplicating work
- **Blocked by:** A02 (bounded judgment contract, not activation of applied Smart).
- **Delivers:** explicitly consented proposal-versus-actual comparison sharing declared judgment budget/disclosure, while actual Auto route stays unchanged.
- **Acceptance:** works with applied Smart off; no duplicate task/inference replay, automatic activation or quality claim. Cancellation/retention/privacy and cap accounting proven.
- **Stories:** 120. **Tracker proposal:** split Shadow from #63; no new evaluation platform.

#### 53. A05 — Route independently opted-in supported children
- **Blocked by:** A01.
- **Delivers:** explicit supported native child Auto before admission, preserving child presets/permissions/explicit models/effort and native limits.
- **Acceptance:** actual child consumers, cancellation/depth/concurrency/settlement; parent Auto grants no child consent and unsupported backends are not intercepted. Reuse existing bounded child proofs, verify current contract; no judgment/Smart dependency for deterministic child Auto.
- **Stories:** 119. **Tracker proposal:** amend #64, remove blanket #54 prerequisite for deterministic path. Additional backends #43 remain deferred. **Gates:** verified child seam/G0.

#### 54. A06 — Advise only on currently authorized capabilities
- **Blocked by:** K01, M02 (correct effective inventory and tool policy).
- **Delivers:** independent opt-in relevance advice over current agent-visible Skills/MCP, coordinated with Jev, with optional judgment configuration reused separately.
- **Acceptance:** actual authorized inventory consumer; stale/denied/unlisted resolution cannot broaden exposure. No install/activation/Approval/credentials/permission changes or capability hiding; manual/Auto use does not require advice, applied Smart or Shadow.
- **Stories:** 121. **Tracker proposal:** amend #65; closed #54 reused, #63 applied Smart not required. **Gates:** supported advisory/judgment seam and G7 for consumption.

#### 55. A07 — Admit explicit native API fallback and revalidate revocation
- **Blocked by:** A01, S15.
- **Delivers:** native-managed API candidates participate only after explicit enrollment with potential usage-billing disclosure, including supported opted-in children when A05 exists.
- **Acceptance:** native identity/effort/preparation/cancel coherent, no secrets copied, no subscription exhaustion silently authorizes billing. API removal/revocation prevents new async dispatch without replay; preserve complete inputs and cross-layer budget. Does not require Smart or all providers.
- **Stories:** 59–61, 107–114, 119. **Tracker proposal:** new follow-up to #62/#64. **Gates:** G3/G6/G7.

### Reversible operational delivery — permission-gated, not extra feature families

Rehearsal slices below use temporary synthetic state and actual production consumers. Each proves its own complete transfer → request/invocation → rollback path, including backup/drain, one runtime/tool/credential-refresh owner where applicable, restart/reload, preserved compatible data, cancellation and no duplicate effects. No operational store access, installed changes, reference deletion or live consumption is included. Incompatible state requires an explicit migration/reauthentication decision, not silent conversion. G7 remains required for actual Cutover. Aggregate tickets compare already captured evidence and test cross-module interference only; they do not repeat every feature test.

#### 56. O01a — Rehearse MCP connection ownership and rollback
- **Blocked by:** M01–M05.
- **Delivers:** synthetic scoped MCP configuration/tool-policy transfer, actual authorized invocation, disable/drain and rollback to the original owner.
- **Acceptance:** preserve definitions/secrets/policy, override scopes and restart review; exactly one connection/tool owner, no leaked project tools or duplicate invocation; failed transfer restores usable prior state. Other Managers need not be complete.
- **Stories:** 122, 124–126. **Tracker proposal:** new child-sized follow-up to #71; preserve #75 verification. **Gates:** G7 only for operational execution.

#### 57. O01b — Rehearse Skills ownership and rollback
- **Blocked by:** K01–K06.
- **Delivers:** synthetic source/availability/repository/label/update-state transfer and rollback observed through actual native Skill consumers.
- **Acceptance:** preserve original contents/resources/policy/recovery metadata, source precedence and cold/warmed availability; one mutation/invalidation owner, no activation of imports or deletion of external originals. Undo transfer restores prior native selection without erasing retained context.
- **Stories:** 122, 124–126. **Tracker proposal:** new #71 follow-up; no obsolete #49 catalog-removal dependency. **Gates:** G4 and operational G7.

#### 58. O01c — Rehearse Hook runner ownership and rollback
- **Blocked by:** H01–H07.
- **Delivers:** synthetic Hook-definition transfer, fresh exact Approval, actual lifecycle execution/drain and rollback without two runners.
- **Acceptance:** historical consent is never imported; preserve compatible definitions/history, suspend changed content, fence queued results and prove one execution per event. Rollback restores prior definition ownership without replaying interrupted events or treating dormant candidates as accepted sources.
- **Stories:** 122, 124–126. **Tracker proposal:** new #71 follow-up; preserve #76 verification. **Gates:** G5 and operational G7.

#### 59. O01 — Verify cross-Manager transfer isolation and recovery
- **Blocked by:** O01a, O01b, O01c.
- **Delivers:** bounded combined rehearsal confirms an MCP/Skills/Hooks transfer failure and rollback leave the other two Managers usable.
- **Acceptance:** reference the three completed per-Manager proofs; inject one cross-module interruption, verify independent disposal/ownership and restore the checkpoint with no duplicate writer/runner. Full desired scope must be accounted for, not reimplemented here.
- **Stories:** 122, 124–126. **Tracker proposal:** retain #71 as aggregate isolation/recovery acceptance, linked to three narrower follow-ups; remove obsolete #49 edge only after publication permission. **Gates:** G7 for actual Cutover.

#### 60. O02a — Rehearse Codex account and dispatch rollback
- **Blocked by:** S01.
- **Delivers:** synthetic Codex account/history/configuration transfer, actual prepared controlled chat and rollback with one credential-refresh/dispatch owner.
- **Acceptance:** preserve compatible identity/history/replay/attachments; cancel/drain and restart cannot duplicate refresh or resend ambiguous work. Reauthentication incompatibility is explicit; no real credentials or provider calls.
- **Stories:** 122, 124–126. **Tracker proposal:** new #73 follow-up. **Gates:** operational G7.

#### 61. O02b — Rehearse Claude account and dispatch rollback
- **Blocked by:** S02.
- **Delivers:** Claude-specific synthetic transfer → controlled prepared chat → rollback through actual consumers.
- **Acceptance:** preserve compatible Claude account/options/history, refresh ownership and provider-bound replay; restart/cancel/failed transfer cannot duplicate requests or substitute another identity. Record provider-specific incompatibilities.
- **Stories:** 122, 124–126. **Tracker proposal:** new #73 follow-up independent of other provider rehearsals. **Gates:** operational G7.

#### 62. O02c — Rehearse Grok account and dispatch rollback
- **Blocked by:** S03.
- **Delivers:** Grok-specific synthetic account/catalog/chat transfer and rollback.
- **Acceptance:** preserve compatible state and complete inputs, prove one refresh/dispatch owner and no ambiguous resubmission on restart/cancel. Chat transfer does not enable or test media implicitly.
- **Stories:** 122, 124–126. **Tracker proposal:** new #73 follow-up. **Gates:** operational G7.

#### 63. O02d — Rehearse Copilot account and dispatch rollback
- **Blocked by:** S04.
- **Delivers:** synthetic Copilot authorization-state transfer, selected controlled chat and rollback.
- **Acceptance:** compatible identity/settings/history persist, expiry/relink remains bound to the right account; single owner and restart/cancel prevent duplicated refresh/dispatch. No borrowed credentials or live device authorization.
- **Stories:** 122, 124–126. **Tracker proposal:** new #73 follow-up. **Gates:** operational G7.

#### 64. O02e — Rehearse Antigravity account and dispatch rollback
- **Blocked by:** S05.
- **Delivers:** supported Antigravity synthetic state transfer, actual controlled dispatch and rollback.
- **Acceptance:** preserve compatible options/account/history, one refresh/dispatch owner and no hidden sidecar/fallback; restart/interruption recovery neither changes identity nor resends uncertain work.
- **Stories:** 122, 124–126. **Tracker proposal:** new #73 follow-up. **Gates:** operational G7.

#### 65. O02f — Rehearse OpenCode connection and rollback
- **Blocked by:** S06.
- **Delivers:** synthetic accountless connection/catalog/configuration transfer, controlled direct route and rollback, with supported authenticated methods kept distinct.
- **Acceptance:** no fabricated subscription account or implicit credential delegation; preserve connection activation/history and single native adapter owner through restart/drain. No automatic paid fallback.
- **Stories:** 122, 124–126. **Tracker proposal:** new #73 follow-up for the sixth provider. **Gates:** operational G7.

#### 66. O02g — Rehearse account policies, usage and network settings rollback
- **Blocked by:** S07–S11.
- **Delivers:** synthetic multi-account defaults/pause/pool, catalog preferences, usage/reset state and proxy/cache/provider settings survive transfer, real controlled requests and rollback.
- **Acceptance:** one mutation/refresh/quota-operation owner, no duplicate reset redemption or resurrection of revoked accounts; request-path settings, pinned route and cross-client state remain coherent. Other providers may reuse their own completed proof without all waiting for each other.
- **Stories:** 122, 124–126. **Tracker proposal:** new #73 follow-up scoped to shared account/traffic policy. **Gates:** operational G7.

#### 67. O02h — Rehearse search ownership and rollback
- **Blocked by:** S12.
- **Delivers:** synthetic search activation/service selection/history and tool-owner transfer, genuine controlled retrieval and rollback.
- **Acceptance:** exactly one tool registration/request owner, stable aliases/policy and citation semantics; revoke/cancel/restart never resubmit or change selected service implicitly. Search alone need not wait for image/video rehearsals.
- **Stories:** 122, 124–126. **Tracker proposal:** new #73 follow-up. **Gates:** operation-specific G3 and operational G7.

#### 68. O02i — Rehearse image edit/result ownership and rollback
- **Blocked by:** S13.
- **Delivers:** synthetic image service/references/result-gallery transfer, controlled generation/edit and rollback.
- **Acceptance:** ordered references/originals and compatible durable results preserved, one tool/submission owner; download/restart failure cannot generate again or replace edit with text-to-image. Verify local/paired result access at its approved evidence layer.
- **Stories:** 122, 124–126. **Tracker proposal:** new #73 follow-up independent of search/video. **Gates:** operation-specific G3 and operational G7.

#### 69. O02j — Rehearse video job recovery and rollback
- **Blocked by:** S14.
- **Delivers:** synthetic video configuration/job/result transfer, actual controlled same-job polling/playback and rollback.
- **Acceptance:** retained job identity and one submission/polling owner, interrupted/unknown state remains honest; restart/download failure cannot regenerate, provider versus local cancellation remains distinguished. Preserve compatible durable playback/results.
- **Stories:** 122, 124–126. **Tracker proposal:** new #73 follow-up independent of search/image. **Gates:** operation-specific G3 and operational G7.

#### 70. O02k — Rehearse native API reference recovery without secret migration
- **Blocked by:** S15.
- **Delivers:** transfer/rollback of Majed's native model references and presentation policy while native API configuration/credentials stay native.
- **Acceptance:** actual controlled manual dispatch resolves native identity and explicit billing boundary, removal invalidates saved choices honestly; no second credential/refresh owner or copied secret. Auto-specific behavior remains A07, not prerequisite to this manual recovery proof.
- **Stories:** 122, 124–126. **Tracker proposal:** new #73 follow-up. **Gates:** G3 and operational G7.

#### 71. O02 — Verify cross-subscription ownership and recovery
- **Blocked by:** O02a, O02b, O02c, O02d, O02e, O02f, O02g, O02h, O02i, O02j, O02k.
- **Delivers:** bounded combined rehearsal verifies one provider/service failure and rollback leave unrelated routes and retained jobs/results usable.
- **Acceptance:** reconcile completed six-provider/shared-policy/search/image/video/API-reference proofs; inject a cross-module interruption, prove one runtime/tool/refresh owner and coherent checkpoint recovery without resubmission. This is cross-feature isolation verification, not another complete implementation ticket or permission to inspect real accounts.
- **Stories:** 122, 124–126. **Tracker proposal:** retain #73 as aggregate acceptance with narrower linked follow-ups and full current scope. **Gates:** G7 for actual stores/Cutover.

#### 72. O03 — Verify Managers after explicitly approved operational replacement
- **Blocked by:** O01.
- **Delivers:** actual local/paired workflows and browser matrix on approved exact host, after reversible authorized Manager Cutover.
- **Acceptance:** management/invocation/Hook event outcomes, cancellation/restart/recovery, English/Arabic and accessibility recorded by scenario/revision; functional failures reopen implementation work. Retain dedicated #75/#76 obligations, no simulated boot authentication or test-total acceptance. No reference removal/release inferred.
- **Stories:** 123, 125–126. **Tracker proposal:** amend #72 with #75/#76 preserved as dedicated verification records, no duplicate claims. **Gates:** G0/G7.

#### 73. O04 — Verify subscriptions/routing after authorized replacement
- **Blocked by:** O02, A01–A07.
- **Delivers:** separately approved real account/local/paired/provider route/search/media/native API demonstrations and rollback on exact host; optional Smart quality evaluation remains separately consented.
- **Acceptance:** actual identities/results/attempts/partial failure/revocation and independent activations observed with redacted evidence. #77 judgment UI obligation preserved; task-set/criteria/consumption needed for quality claims, disagreement alone insufficient. No account inspection/spending/reference deletion/stable release implied by this proposal.
- **Stories:** 123, 125–126. **Tracker proposal:** amend #74, preserve #77. **Gates:** G0/G7.

## Story coverage and completion interpretation

Every slice also inherits stories 122–124 where applicable: module isolation/disposal, authenticated local/paired management, native styling/English–Arabic support and pinned-source/license/evidence records. These are acceptance conditions on each delivered workflow, not horizontal framework tickets blocking all features. Story 125 is O01–O04 including O01a–O01c and O02a–O02k; story 126 is a permission boundary on every slice, including those rehearsals. No new standalone Tool Rules ticket exists; inert legacy preservation remains a regression guard.

| Story range | Primary proposed owners |
| --- | --- |
| 1–6 | E01 |
| 7–10 | E02, E03, E07a (experimental renderer) |
| 11–12 | E04 navigation, E04a folding, E04b process/composer |
| 13–15 | E05 |
| 16–18 | E06 |
| 19–21 | E01–E07, E04a, E04b, E07a; E07 owns motion |
| 22–24 | E08 |
| 25–27 | E09, E06 |
| 28–34 | E10–E12 |
| 35–37 | S01–S06 independently |
| 38–43 | S07; provider end-to-end slices retain 39–40/43 |
| 44–47 | S08 plus each provider |
| 48–49 | S09 plus each provider |
| 50–53 | S10, S11, S09 |
| 54–58 | S12–S14 independently |
| 59–61 | S15, A07 |
| 62 | all subscription slices |
| 63–67 | M01 |
| 68–69 | M02; M01 native permission |
| 70–71 | M03; M01 secrets |
| 72–74 | M04, M05; M01 status |
| 75–80 | K01, K02 |
| 81–82 | K02, K03 |
| 83–84 | K04, K05 |
| 85–89 | K06, K05; K01/K02 retained context |
| 90–95 | H01–H05; H01 exact Approval |
| 96–102 | H02–H05 independently by event |
| 103–105 | H07, H06 |
| 106–114 | A01, A03, A07 |
| 115–118 | A02, A03 |
| 119–121 | A05, A04, A06 |
| 122–124 | inherited per slice; operational cross-feature evidence O01–O04 |
| 125–126 | O01–O04 and explicit permission boundaries throughout |

## Existing-issue reconciliation — approved review baseline

The pre-publication read-only issue inventory on 2026-10-28 contains 77 records. #1/#2 are open parents; #3–#36 and #47 are closed historical implementation/characterization records; #37–#46 are open deferred records. Of R01–R27, #52/#53/#54 are closed implementation records with open dedicated verification #75/#76/#77; the other 24 remain open. State alone is not redesigned behavioral acceptance. Detailed earlier source/acceptance limits remain in the [inventory](research/feature-inventory-2026-10-27.md) and [workflow ledger](archive/manager-workflow-tickets/README.md). No issue body/state/label/dependency/assignee/parent was changed during local drafting. The table below preserves the approved disposition baseline; Q138 authorizes its later tracker reconciliation, whose exact mapping/readback is separate.

| Existing records | Proposed disposition after approval |
| --- | --- |
| Parents #1/#2 | Preserve title/body/state/history by default. Ask specific permission for any new specification parent or parent update; no silent reparenting. |
| Closed #3–#36, #47 | Keep closed/history/evidence. Link missing redesigned acceptance to retained R issues/new delta slices; no mass reopen or claim closures prove present scope. #16 Tool Rules stays historical, not delivery authorization. |
| #48, #55 | Retain both identifiers and their account→dispatch edge under grouped S01; do not duplicate or close partial Codex work. |
| #57–#60 | Retain and amend to S02–S05 provider-specific full workflows; S01 foundation remains real prerequisite. |
| #61 | Retain multi-account outcome S07; split bounded manual pool S09 with native dependency. Direct pinning remains distinct. |
| #49 | Propose superseding obsolete blanket catalog removal in favor of K04; preserve history and any independently justified safety cleanup. Requires explicit approved tracker disposition, not silent closure. |
| #50, #62 | Keep #50 unresolved contract gate for A01; retain #62 deterministic product acceptance. Closed native-characterization #5/#6 do not waive this gate. |
| #51 | Retain K01 real native availability acceptance; add K02–K06 delta links, preserving Unicode/cold/warmed obligations. |
| Closed #52 + open #75 | Reuse MCP implementation, add M01–M05 deltas only; preserve dedicated browser acceptance #75 and O03 relationship. |
| Closed #53 + open #76 | Reuse exact Approval, add H01 delta and H02–H07 actual workflows; keep #76 UI obligation. |
| #56 | Narrow to H02 first complete lifecycle workflow; publish linked H03–H07 only after approval. Preserve dormant/unaccepted candidate distinction. |
| Closed #54 + open #77 | Reuse separate judgment configuration in E12/A02/A04/A06; independently verify consumers and retain #77 browser acceptance. |
| #63 | Retain A02 bounded applied Smart; split A03 diagnostics and A04 optional Shadow without requiring applied Smart activation. |
| #64 | Retain A05; deterministic child Auto needs A01, not compulsory judgment #54/Smart. New API child path uses A07 and supported child seam. |
| #65 | Retain A06; actual effective inventories K01/M02 and explicit advice configuration gate it, not applied Smart. |
| #66 | Retain S12 search; complete attachments remain provider/S09 obligations. Search is not blanket prerequisite for media. |
| #67/#68 | Retain S10/S11 respectively, broaden per-provider acceptance only as each route exists. Remove arbitrary all-provider waits. |
| #69/#70 | Retain S13/S14, independent operation activation; replace search-only blocker with actual provider/dispatch requirements. |
| #71/#72 | Retain O01 aggregate/O03 operational verification; add O01a–O01c per-Manager rehearsal follow-ups. Remove obsolete catalog-removal edge only when authorized; preserve #75/#76 obligations. |
| #73/#74 | Retain O02 aggregate/O04 operational verification; add O02a–O02k independent provider/shared-policy/service/API rehearsals, covering full desired scope. Preserve #77 and independent live/quality permissions. |
| #37 D01 | Desired repository/catalog installation now included: re-scope to K04, link reviewed updates K06; historical deferral is not current exclusion. |
| #38 D02 | Desired upload/import and categories now included: split K03/K05 without forcing local labels to wait for import. Other extended surfaces need explicit format evidence. |
| #40 D04 | Desired MCP tool policy now included: re-scope M02; standalone Tool Rules #16 is not a prerequisite. |
| #41 D05 | Desired import/export now included: re-scope M03; implicit legacy ingest/takeover remains unauthorized. Preserve distinction in body/history. |
| #39 D03 | Plugin self-update remains deferred, not conflated with Skill updates K06. |
| #42 D06 | SessionEnd/subagent observe-only extensions stay deferred; seven approved core events remain H02–H05. |
| #43 D07 | Additional child backends remain deferred; verified opted-in native support is A05. |
| #44 D08 | Dynamic capability reduction stays excluded/deferred; advice A06 never hides capabilities. |
| #45 D09 | Broader scheduling/rollout stays deferred; agreed bounded Smart/Shadow are A02/A04. |
| #46 D10 | Reference removal/stable promotion remain separately gated; operational proof does not automatically authorize them. |
| No existing issue | E01–E12, S06 OpenCode, S15 native API, new Manager deltas, A07 and split follow-ups need approved publication mapping, not fabricated issue IDs. |

## Amendment 2026-10-29 — adopt the reference Subscriptions experience (proposal only, not published)

Owner decisions (2026-10-29): port the reference plugin's complete Subscriptions behavior into Majed's `modules/subscriptions` (adapt, do not rewrite), show full account emails on authenticated Settings/usage surfaces, add Arabic/RTL, keep Majed's protected 0600 store, and the Owner disables the installed reference plugin when Majed's build is installed. Source: V1ki/dsh-plugin-subscriptions v0.9.11 (`7639ed9958a9a1c4159faa1f4e6e15e9ede60b7d`, MIT). The specification now records this under "Subscriptions, API references, search and media". Parents #1/#2 and all closed history stay unchanged; nothing here is published. Publication needs the same Q138-style Owner approval.

| Record | Proposed change |
| --- | --- |
| #48 S01a | Amend acceptance: login opens the provider page and completes automatically through the host loopback callback with the page polling status; manual paste only as fallback; provider card and account card parity with the reference (full email, default star, plan, expiry, sign-out); removing masked-identity wording. Keep partial status and existing evidence. |
| #61 S07 | Replace "masked cards" with full identity on authenticated surfaces; add Manage dialog parity (alias, include in pool, independent entry, per-account allowlist) while bounded manual pools stay with S09. |
| #67 S10 | Pull the Codex usage path forward as a standalone slice (plan, 5-hour/weekly windows, reset time, refresh, reset credits with confirmed single-use use); add the composer usage badge. Blocked only by S01. Other providers follow independently. |
| #68 S11 / #94 S08 | Retain; the Manage dialog's cache TTL and model-list editing are delivered through S08/S11 acceptance using the ported controls. |
| #57–#60 | Reuse the ported card/manage/usage shell; only the provider protocol differs. |
| New S16 (proposed) | Adopt the reference Subscriptions Settings shell for Codex: provider/account cards, Add account with automatic completion, Manage dialog, Arabic/RTL, provenance and notices. Blocked by S01 (#48 partial, existing). Blocks S07/S10 UI acceptance. |
| #96 S15, #73–#74, #115–#125 | No change. O02a rehearsal (#115) gains the ported UI in its Codex account rollback scope. |

## Dependency interpretation and publication sequence

The per-slice **Blocked by** fields are the proposed product edges. Ranges mean every slice in that range. Additional provider-specific paths (for example Grok media after S03) acquire only their actual required provider edge at publication; they must not hold a separately supported provider path hostage. G0–G7 are explicit external evidence/permission gates, never assumed completed issues.

A01 groups two retained records: #50 remains a prerequisite of #62; S01 groups #48 → #55. Preserve those internal edges. O01a–O01c and O02a–O02k are independently verifiable per-Manager/provider/service rehearsals, each blocked only by its own feature workflow. O01/O02 retain aggregate cross-feature isolation/recovery acceptance after those narrower slices; they neither block ordinary earlier feature delivery nor repeat all completed proofs. O03/O04 cannot substitute for missing per-feature controlled/native/browser proof. Suffixed IDs must be expanded explicitly in tooling; a range such as E01–E07 denotes original unsuffixed IDs only, not an implicit list of new children.

After approval: read full live bodies/comments/edges again; resolve exact reused-versus-new issue identities; publish only the authorized changes in blocker-first order; use native blocking links and ready-for-agent only for actually scoped execution records, retain unresolved evidence/permission gates visibly. Read back exact bodies/states/labels/parents/edges and verify unrelated history/parents unchanged. No blanket relabel/close/reopen or obsolete edge deletion is authorized by this local draft. Obtain implementation approval only after the published graph is reconciled; operate its ready frontier under priority and operational boundaries.

## Approval boundary and next decision

Q137 approves the basis and local splitting recommendation; it does not authorize publication. This revision completes that local action. Full desired scope, independent media/children/advice and the proposed treatment of existing records remain intact. Remaining feasibility and operational gates are unchanged, not passed.

Q138 was subsequently approved and completed. After the Owner-authorized extra attempt, independent full readback verified 75 exact execution records, 109 acyclic native edges, only #49 superseded/not_planned closure, preserved parents/history/deferrals/verification obligations, and unique publication markers. The [verified publication report](current-scope-tickets-publication-status-2026-10-28.md) and [durable mapping](current-scope-tickets-publication-status-2026-10-28.json) record all issue URLs and evidence hashes. Tracker delivery is complete; stop for the next Owner decision. Git commits/pushes, product implementation, installed changes and provider consumption remain separate permissions.
