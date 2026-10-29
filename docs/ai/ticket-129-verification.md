# Ticket #129 verification

## Candidate and boundaries

Worktree: `dsh-majed-t129`; branch: `impl/129-codex`; baseline: `e796366b16f989130ee0a3be3745898896c81d20`.

Owner override: #128 accepted/closed; #129 authorized. This candidate does not authorize #130 or later tickets. Optional component remains off by default; root/core version remains 0.2.0. No installation, profile mutation, credentials, real account authorization, provider inference, restart, push or merge was performed.

Pinned MIT source: V1ki/dsh-plugin-subscriptions v0.9.12, `b8023110864494acefc6f5963c2a197d85dda20c`. Inventory and changes: `src/PROVENANCE.md`; retained license: `THIRD_PARTY_NOTICES.md` and provenance record.

## Implemented seams

- Codex/shared reference account identity and credential store, PKCE/loopback/paste/cancel OAuth, refresh, translation/SSE, model catalogs with reference fallback, internal account-family pools, health/quota tracking and rate-limit waiting/retry. Later-provider implementation and management/proxy UI are absent.
- Owned authenticated `majed-subscriptions.*` Fetch RPC and `plugins/majed/subscriptions` storage. Credential directory 0700 and atomic credential file 0600. Review remediation removes all foreign-state fallback/import/deletion; the original candidate's no-import claim was incorrect. Provider id `codex` is the deliberate shared-id exception.
- Native LLM adapter registration and catalog invalidation, collision reporting without takeover; no catalog/network resolution for a provider never logged in.
- English/Arabic browser card using injected DSH primitives/tokens: account email/plan/expiry, default star, confirmed logout, authorization link/paste/cancel, usage windows at reference 80%/95% colors, refresh and reset-credit display/confirmation. Reset backend retains single-use 60-second tickets, fresh weekly >=80% guard, account binding, revalidation and ambiguous-outcome parking.

## Automated evidence (fixtures, not live acceptance)

- `npm run build`: pass. `npm run check:build`: pass; recursive dist comparison now covers nested emitted modules.
- Original candidate evidence: classifier 166/166 and Node tests 180/180. This historical run did not catch the foreign-store fallback and is superseded by the review-remediation evidence below.
- Reference suites: complete store/accounts/pool/pool-health/pool-usage/catalog-store/client-version/reset-redemption/SSE-lifecycle suites. Codex-only cases extracted from mixed-provider models/usage/request-body/rate-limit suites. No claim that unrelated provider suites ran.
- Assembled host fixture: fake token HTTP -> pasted state-bound callback -> identity persistence/default -> registered adapter model picker/chat stream -> logout/model disappearance. Separate no-network-before-login, 0700/0600/removal/isolation, registration collision, cancellation/disposal and route removal fixtures.
- Rendered-control fixtures in English and Arabic: identity/plan/default/version, logout confirmation, usage refresh/progress, reset acknowledgement and single consume call. These use React-compatible injected hook/element fixtures, not an installed Chromium DOM or visual review.
- Packaging: `npm_config_cache=/tmp/npm-cache-majed npm pack --pack-destination /tmp/majed-t129`; final package contains committed dist and notices; disabled component/artifact resolution test passes. First pack attempt omitted the cache override and failed writing npm logs; corrected command succeeded without escalation.

## Limitations and acceptance gaps

- Owner installed/live acceptance remains mandatory: actual browser authorization/popup behavior, provider account plan/expiry and credits, native picker/chat in core 0.2.0, reference fallback/coexistence and installed disable/re-enable behavior are not proven by mocks. No real provider request was made.
- Independent Standards and Spec code review could not be delegated at this session's maximum depth; Lead must run it separately before acceptance. Direct source review found and fixed missing static reference fallback models, original non-reference usage thresholds and an OAuth start/disposal race. This is not a substitute for independent review.
- In-flight chat transport remains owned by the host request signal/watchdog as in the reference; component disposal cancels pending authorization and scheduled catalog work, not an independently executing host chat turn. Fixture disposal proves route removal and pending authorization cleanup, not every installed-host lifecycle edge.
- Automated npm audit reports four high development-dependency findings through Zod (`GHSA-mrhx-c7xc-m3w5`), with no available direct package fix reported. No forced dependency upgrade or host patch was applied. These dependencies are build/test-only and externalized at runtime; host dependency security is not certified here.
- No Manage/models/pool/proxy controls (#130), badge/Speed/#131 behavior or other providers (#132+) were implemented. Generic reference shared-core types remain for owned-fork fidelity; they do not register those providers.

## Deferred improvements

Broader UI extraction/typing, focus-trapped modal polish, additional installed lifecycle stress coverage and shared-core modernization are deferred, not implemented. No scope expansion or next-ticket work is implied by this candidate.


## Independent-review remediation from e33d77f

Direct execution uses the explicit Codex/GPT-6.1-Sol runtime; no nested delegates. Only #129 is authorized. The Lead/Owner must independently review this remediation candidate; this report does not self-certify independent acceptance.

- **P1 foreign credentials:** regression seeded both reference `plugins/subscriptions/auth.json` and legacy `plugins/router/auth.json` with fake credentials while own store was absent. It failed meaningfully with imported account `foreign`. Removed the entire foreign fallback, write and deletion path. Assembled normal/collision status and catalog reads now yield no accounts/models/network and create no own auth file. Owned persistence/logout leaves both foreign files byte-identical. In-place owned-file format migration remains.
- **P2 usage:** regression initially showed zero automatic calls. Account-key appearance now triggers one load; promise identity deduplicates automatic/manual in-flight work and rejects stale completions. Removed accounts prune snapshots/errors and pending entries. Failure does not trigger render-loop retries; same-key reappearance requests fresh usage. VM tests explicitly target ES2022 so Set iteration matches the shipped target.
- **P2 remount auth:** regression had no link/paste controls on a busy remount. Authenticated status now exposes only pending `authorizeUrl`, never verifier/token/code. Busy state independently permits cancel/paste. Same controller test starts, unmounts, remounts, pastes a fake code then repeats with cancel; both clear host busy. Fake exchange failure is deliberately exercised, not real authorization.
- **P2 reset fidelity:** regression asserted missing unknown/expired labels, expiry context and prepared weekly percentage. Usable count excludes expired or unidentified credits; details sort known expiry first and preserve unknown expiry. Confirmation retains prepared weekly percentage and selected-credit expiry with explicit acknowledgement. Existing backend single-use 60-second/account/revalidation tests remain unchanged.
- **P2 shared-core tests:** newly ported translation tests cover request/result correlation, tools, developer/system roles, images and failures, shared/distinct reasoning replay, stream text/tool ordering, usage-before-finish, empty responses and errors. Retry tests cover number/duration/date parsing, Retry-After, reset preservation beyond display truncation, 429 versus quota, no snapshot waits, ceiling/default policy. Assembled auth tests cover invalid state/no pending/unknown provider, exchange failure, finalizing cancellation, one forced 401 refresh, repeat-401 AUTH, 429 reset metadata and abort. Shared pool-usage suite already proves 429 cooldown/manual-force backoff.

Regression execution notes: the first full run after source edits correctly failed committed-build comparison because dist had not yet been regenerated. Rebuilt dist and reran successfully. Test-port extraction had two compile diagnostics (dangling mixed-provider imports), corrected without adding those providers. Same-host remount fixture needed event-loop turns for filesystem-backed status; pool error fixture needed auth-change invalidation between distinct scenarios to avoid intentionally retained cooldown. These were fixture issues, not live calls or hidden skips.

### Exact pinned source and test dispositions

Source surface: `src/auth/{store,jwt,pkce,oauth-flow}.ts`, `src/compat.ts`, `src/providers/{accounts,common,codex,codex-client-version,npm-cli-version,catalog-store,catalog-refresh,pool,pool-family,pool-health,pool-usage,rate-limit,reset-redemption,replay}.ts`, `src/translate/{responses,resolved,sse}.ts`; composition/RPC/controller/browser adaptation is locally owned. Reference `src/auth/rpc.ts`, `src/index.ts`, `src/SubscriptionsSection.tsx` supply behavior/seam evidence, not a second runtime plugin.

Complete adapted suites: `store`, `accounts`, `pool`, `pool-health`, `pool-usage`, `catalog-store`, `codex-client-version`, `reset-redemption`, `sse-lifecycle` (all under local `test/reference/*.spec.ts`). Reference `keep-alive.ts` supports unref-timer tests. `catalog-refresh-schedule.spec.ts:1-114` shared cache/scheduler tests are also ported (no overlapping jobs, startup freshness, hourly backoff and disposal); its reference full-plugin wiring is replaced by owned composition/lifecycle fixtures, not imported. Selected Codex cases from `models`, `usage`, `request-body`, `rate-limit` reside in `codex-{models,usage,request-body,rate-limit}.spec.ts`. Added `responses-translation.spec.ts` ports every Responses-specific/shared-image case in reference `translate.spec.ts:64-433`, excluding the Claude-only parallel error-flag case and dropping non-Responses assertions. Added `shared-rate-limit.spec.ts` ports generic value/date/duration/reset/classification/wait-policy cases from `rate-limit.spec.ts:78-153,210-237,275-317,420-477` plus adapted provider-reset/Retry-After precedence and non-429 reset-reader guards. Later-provider implementations are not imported.

`login.spec.ts` applicable Codex RPC busy/login/cancel and generic finalizing-claim races are adapted in assembled fixtures; Claude import/Keychain probes are excluded (#132, fresh-login policy). `rpc.spec.ts` image endpoint belongs to later media/provider tickets; owned malformed-envelope/business failure/status behavior is covered by assembled host fixtures instead. `account-replay.spec.ts` is Antigravity signed-thought/account-preferences routing (#130/#135), excluded; Responses reasoning replay is covered directly, not claimed by that exclusion.

Remaining reference suite inventory and explicit ticket exclusions:

- #130 management/catalog preferences/proxy: `account-manager-ui`, `account-preferences`, `cache-affinity`, `model-defaults-rpc`, `model-defaults-view`, `model-defaults`, `model-filter`, `model-selection-latency`, `provider-settings-rpc`, `provider-settings`, `proxy-host`, `reset-action`, `usage-window-filter`. Internal catalog/reset behavior is covered above, not their later management UI.
- #131 speed/badge/commands: `client-command`, `client-speed`, `model-selection-latency` speed-specific cases, `settings-client-version` settings UI, `subagent-speed`, `subscription-usage-badge`, `usage-badge-preferences`.
- #132 Claude: `claude-cache-ttl`, `claude-cli-version`, Claude portions of `models`, `usage`, `request-body`, `translate`, `rate-limit` and `login`.
- #133 media/Grok and subsequent provider/tool scope: `grok`, `image-pool`, `image-request-limit`, `tools`, `tool-registration`, `host-icons`, `codex-search` search-tool registration; #134 `copilot`, `device-flow`; #135 `antigravity`, `translate/antigravity`, Antigravity `account-replay`; later shared provider compatibility `chat-completions`, `detect-cli`, `connect-attempt`, `dsh-compatibility` reference multi-provider composition. These are not silently counted as parity passes.

No single happy-path test is offered as parity proof. This is bounded #129 source/behavior coverage, not complete reference-plugin or installed-host acceptance.

### Final P2 cache-bypass correction

Independent re-review at `cd780c8` confirmed the five prior remediation areas, but reproduced automatic card mounting bypassing a fresh usage snapshot (`force: true`). The delegated one-fix attempt could not spawn its shell (`spawn sandbox-exec ENOENT`) and changed nothing; Lead applied the bounded correction with the functioning normal workspace executor, without widening sandbox access. Regression renders the actual card against a prewarmed real `PoolUsageTracker` with fake usage fetching: before correction automatic mount produced fetch count 2 instead of 1; after correction automatic requests use `force: false`, manual Refresh and post-reset refresh explicitly use `true`. Focused regression passes. Lead full suite: classifier 166/166, Node 230/230, zero failures; fresh build match and whitespace pass. No live provider or installed state access.

### Final remediation gate results

- `npm_config_cache=/tmp/npm-cache-majed npm run build`: passed; regenerated owned nested dist modules and both browser artifacts.
- `TMPDIR=/tmp/majed-t129 npm_config_cache=/tmp/npm-cache-majed npm test`: classifier **166/166**, Node **229/229**, zero failures, cancellations, skips or todos. Output: `/tmp/majed-t129/tests-final.log`.
- `npm_config_cache=/tmp/npm-cache-majed npm run check:build`: passed recursive fresh-build comparison. Output: `/tmp/majed-t129/build-match.log`.
- `git diff --check`: passed.
- `npm_config_cache=/tmp/npm-cache-majed npm pack --pack-destination /tmp/majed-t129`: passed, **70 files**, package/core version **0.2.0**, optional component still default off. Artifact: `/tmp/majed-t129/dsh-majed-0.2.0.tgz`.
- Artifact SHA-256: `9d070704201c30bd178d5d3743e0475b121a9ecf1958dea65c45930c1baa3a74`.

No installed state, real credentials/accounts, real provider calls, restart, push or merge. Test-only requests were intercepted fake HTTP; loopback listeners were limited to isolated OAuth fixtures. No runtime success beyond fixture evidence is claimed.
