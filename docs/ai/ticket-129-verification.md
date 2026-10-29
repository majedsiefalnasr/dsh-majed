# Ticket #129 verification

## Candidate and boundaries

Worktree: `dsh-majed-t129`; branch: `impl/129-codex`; baseline: `e796366b16f989130ee0a3be3745898896c81d20`.

Owner override: #128 accepted/closed; #129 authorized. This candidate does not authorize #130 or later tickets. Optional component remains off by default; root/core version remains 0.2.0. No installation, profile mutation, credentials, real account authorization, provider inference, restart, push or merge was performed.

Pinned MIT source: V1ki/dsh-plugin-subscriptions v0.9.12, `b8023110864494acefc6f5963c2a197d85dda20c`. Inventory and changes: `src/PROVENANCE.md`; retained license: `THIRD_PARTY_NOTICES.md` and provenance record.

## Implemented seams

- Codex/shared reference account identity and credential store, PKCE/loopback/paste/cancel OAuth, refresh, translation/SSE, model catalogs with reference fallback, internal account-family pools, health/quota tracking and rate-limit waiting/retry. Later-provider implementation and management/proxy UI are absent.
- Owned authenticated `majed-subscriptions.*` Fetch RPC and `plugins/majed/subscriptions` storage. Credential directory 0700 and atomic credential file 0600. No reference-state import. Provider id `codex` is the deliberate shared-id exception.
- Native LLM adapter registration and catalog invalidation, collision reporting without takeover; no catalog/network resolution for a provider never logged in.
- English/Arabic browser card using injected DSH primitives/tokens: account email/plan/expiry, default star, confirmed logout, authorization link/paste/cancel, usage windows at reference 80%/95% colors, refresh and reset-credit display/confirmation. Reset backend retains single-use 60-second tickets, fresh weekly >=80% guard, account binding, revalidation and ambiguous-outcome parking.

## Automated evidence (fixtures, not live acceptance)

- `npm run build`: pass. `npm run check:build`: pass; recursive dist comparison now covers nested emitted modules.
- `npm test`: full classifier suite plus Node tests, including adapted reference suites. Final run: classifier 166/166 and Node tests 180/180, zero failed/skipped/cancelled. `git diff --check` also passed.
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
