# Ticket 130 work contract and verification

## Approved contract

- Ticket: #130, Subscriptions: Manage dialog, model list, account pool and proxy. Stories 33–42 and 44–48 of `docs/specs/subscriptions.md`; #129 accepted CLOSED, no #131+ implementation.
- Route: bounded `/implement`, loaded from the local skill instructions, with TDD, Karpathy and surgical changes. Explicit inherited coding route is codex/gpt-6.1-sol; no nested delegation is available. Independent Standards/Spec review remains a Lead gate.
- Baseline: `741967e342970cc0daa80779449b97add850408c`, clean `impl/130-manage`, worktree `/Users/majedsiefalnasr/Documents/Work/DeepSeek Harness/dsh-majed-t130`.
- Source: V1ki/dsh-plugin-subscriptions v0.9.12, `b8023110864494acefc6f5963c2a197d85dda20c`, MIT, read-only `/tmp/upstream-0.9.12`. Port provider-settings, model-defaults, account-preferences adapter, HTTP proxy and rendered manager/model/proxy hierarchy; preserve reference options and existing #129 security/cache/auth/navigation behavior. Cosmetic polish only is deferred.
- Writes: this worktree and `/tmp/majed-t130`; npm cache `/tmp/npm-cache-majed`. No installed/profile/state/secrets access, real account/provider/proxy network, restart, push or merge.
- Agreed verification seams: assembled authenticated RPC and registered provider adapter with intercepted fixture HTTP; rendered EN/AR controls with fake RPC; full tests, build-match, whitespace, packed artifact and SHA256. Reference tests are adapted with explicit dispositions.
- Investigation cap: two failed diagnostic attempts or 20 minutes per blocker, whichever occurs first; deliberate TDD red is not a failed diagnosis. Stop at local committed candidate or report concrete blocker. Fixture proof is not Owner installed/live acceptance.

## Review remediation checkpoint (2026-10-30)

- Started from requested clean `ad0fd647040600647240faf34dc12018ee22d2bc` on `impl/130-manage`; pinned reference readback `b8023110864494acefc6f5963c2a197d85dda20c`.
- Deliberate red: `node --test test/proxy-owned.test.mjs` failed 0/1, serialized nested error contained stored literal password, Bearer value and URL password. Green after bounded known-password/credential-pattern sanitization: 1/1. Draft replacement secrets are passed into diagnostic sanitization; RPC catch uses saved and payload password values.
- Deliberate red: assembled `node --test test/manage-owned.test.mjs` failed 0/1, actual modelDefaults was `{codex:{}}` after saving high. Green after snapshot return: 1/1, with save/read/clear assertions.
- Deliberate red: disabled proxy draft test failed 0/1 (forced enabled route). Green after enabled/bypass/current-password draft resolution: 1/1. The initial old implementation attempted fixture DNS before failing; no real proxy/account/provider endpoint was contacted.
- Additional changes: generation guards on proxy test/save/cancel/unmount, owned transport close hook; recursive model/account field-intent merge, maximum context validation, status display names/aliases, reference pool configuration forwarding. Added EN/AR rendered maximum-bound and concurrent-intent assertions. These changes do not have exhaustive requested acceptance coverage and must not be reported as all findings closed.
- Full `npm test`: classifier 166/166; Node 278/278, zero fail/cancel/skip on final rerun. First final run cancelled one existing discovery timeout case (`Promise resolution is still pending but the event loop has already resolved`); immediate permitted rerun passed. `npm run check:build`: `Committed output matches a fresh build.` `git diff --check` passed.
- Archive `/tmp/majed-t130/dsh-majed-0.2.0.tgz`, SHA256 `95077774ce4c7aeb4a0f495da0af1391df619e4a0280750ec73dc70b62fad9ed`; partial candidate only, not installation-ready acceptance.
- (Resolved later in this pass via authorized public npm; see Current state.) Former offline blocker: reference tools registration imports public `@deepseek-ai/dsh-tools`, absent from this worktree (`ERR_MODULE_NOT_FOUND: Cannot find package '@deepseek-ai/dsh-tools'`) and `npm cache ls '@deepseek-ai/dsh-tools'` returned no cached package. No network installation or installed-host package access is authorized. Two bounded availability checks consumed; no dependency download attempted. Completing a source-faithful public registration needs an approved offline dependency artifact or permission to fetch that package. No invented tool schemas/providers or fake no-op registrations added.
- Still open: actual tool/session registration/history and web-provider registration; exhaustive rendered proxy stale-operation tests, host fake-agent disposal, stored/replacement secret RPC matrices, public negative host authentication, model-default remount/failure, partial reasoning-prefix retry, assembled speed and pool-config acceptance, complete reference RPC/view adaptations, remaining token/provenance audit. Independent review and installed/live acceptance remain separate gates. Ticket remains incomplete.

## Current state (local candidate)

Local committed candidate on `impl/130-manage` after the commits below. Not independently reviewed and not live-accepted.

| Commit | Content |
| --- | --- |
| `8e1c9e9` | Public `image_generate` tool (Codex only, alias `dsh_majed_image_generate` on name collision), `CodexWebSearchProvider` registration, `ImageAccountPool`, `agent/created` creation-time restriction; dev dependencies `@deepseek-ai/dsh-tools|dsh-web|dsh-agent@0.2.1-rc.2`. |
| `22952bc` | Real `HostConnectionService`/`createSharedFetchHandler` gate: all 16 routes 403 for non-owner, envelope errors, proxy-secret absence from every serialized response. |
| `86a6df1` | Effective settings (context bounds, reasoning default, subagent speed, pool forwarding) and rendered Manage/Proxy matrices in EN and AR; fixed proxy dialog throwing when the saved config has no username. |
| `8b78f2e` | Adapted `provider-settings-rpc` proof on a real cordis `Context` and `LlmRuntime`. |
| `8371dab` | Account helper spec, owned-agent disposal on the real `ToolRuntime`/`WebRuntime`, status degradation. |
| `6f415e8` | Fixed English locale values equal to their key names and missing `modelsImage|modelsVideo|modelsSearch`; locale completeness test; model-filter spec. |
| `7550c82` | Tier rows carry no effort/fast controls; adapted `model-defaults-rpc` spec. |

### Completeness matrix

| Requirement | Evidence | Status |
| --- | --- | --- |
| Tools/session-creation policy runtime | `test/tools-owned.test.mjs`, `test/provider-settings-rpc.test.mjs`, `test/reference/{tool-registration,image-tools}.spec.ts` | Done (Codex scope) |
| Web provider public registration | `test/tools-owned.test.mjs`, `test/lifecycle-owned.test.mjs`, `test/reference/codex-search.spec.ts` | Done |
| New vs existing session switches | `test/tools-owned.test.mjs` (deny list only for sessions created after the switch; web search follows the live switch) | Done |
| Negative auth, serialized RPC | `test/security-owned.test.mjs` on the real host gate (owner 200, non-owner 403, untrusted host/origin, no store writes) | Done at gate level |
| Proxy-secret serialized/rendered matrices | `test/security-owned.test.mjs` (raw/URL-encoded/base64/Bearer), `test/manage-ui-matrix.test.mjs` | Done |
| Model/context/speed/pool effective settings | `test/effective-settings.test.mjs`, `test/model-defaults-rpc.test.mjs` | Done |
| Partial save, per-field and concurrent retries | `test/manage-ui-matrix.test.mjs`, `test/reference/account-manager-ui.spec.ts` | Done |
| Proxy reuse/replace/clear/disabled/bypass, stale save/test | `test/proxy-owned.test.mjs`, `test/manage-ui-matrix.test.mjs` | Done |
| Owned-agent disposal | `test/lifecycle-owned.test.mjs` (routes, tool, web provider, adapter, pending login, remount) | Done |
| Source RPC/view coverage | provider-settings-rpc, model-defaults-rpc, account-manager-ui, model-filter adapted; model-defaults-view not applicable (below) | Done with dispositions |
| ded9f33 remediations rechecked | display names/aliases: provider-settings-rpc + manage-owned; snapshot: model-defaults-rpc; pool config: effective-settings; context bounds: effective-settings + manage-ui-matrix; field-intent merge: account-manager-ui + manage-ui-matrix; safe diagnostics: security-owned + proxy-owned | Verified |

### Verification evidence

- Final run at `9db4259`: `npm test` 370/370 (zero fail/cancel/skip; includes the classifier suite), `npm run check:build` "Committed output matches a fresh build.", `git diff --check` clean.
- Archive `/tmp/majed-t130/dsh-majed-0.2.0.tgz` (77 files, 1,248,591 bytes) built from the clean worktree at `9db4259`; SHA256 `a54f9f4c8b6e5138f080d73f21cb5d96ca9e0085f96dd2eb7badf595ca4e71a8`. This supersedes the earlier `95077774...` archive. Candidate only; not installed.
- Deliberate red phases: `tools-owned` (tool not registered, no deny list), `locale-completeness` (missing/placeholder copy), `model-defaults-rpc` tier row (controls on tier). Tests for gate, envelope, secret, effective-settings and UI matrices passed on first run because the behaviour already existed; they add coverage, and the ProxySettings username defect surfaced from the UI matrix.

### Defects found and fixed during this pass

1. `ProxySettings` threw when opened with a saved config lacking `username`.
2. English locale had eight values equal to their key names and three missing tool-label keys (EN and AR).
3. Configured pool tier rows were offered effort and fast-tier controls that the pool never consults.

### Dispositions and gaps (stated, not hidden)

- Excluded by scope: Grok, `x_search`, `video_generate`, Claude/Antigravity and non-Codex providers (#131/#133); reference `rpc.spec.ts` image/video/speed endpoints likewise.
- (Superseded by the final-review section below.) Earlier dispositions that `modelDefaults` returned a stored snapshot, that the effort message was generic and that `force:'yes'` was accepted are no longer true; all three now match the reference. Provider validation message remains `Only Codex is available`.
- Reference `model-defaults-view` helpers are referenced only by their own tests in the pin, so there is no rendered counterpart to port. The reference Playwright/rolldown browser fixture is optional standalone tooling and was not ported; rendered behaviour is covered by `test/manage-ui-matrix.test.mjs` (fixture React renderer, EN and AR).
- Negative auth is proven against the real shared fetch handler with the real `Peer` principal, not an installed host. `providerSettings` fails (rather than degrading) when the credentials store is structurally invalid JSON; `status` degrades per entry.
- Subagent speed uses public agent origin metadata; proof is fixture HTTP only.
- Pending: independent Standards/Spec review, Owner installed/live acceptance, final cosmetic polish.

## Final review remediation (independent review of 13e8db7)

The independent review passed the 370 tests and build-match but found the items below. Each was fixed test-first; regressions live in `test/final-130.test.mjs` (10 tests) and the adapted `test/model-defaults-rpc.test.mjs`, `test/manage-owned.test.mjs`, `test/provider-settings-rpc.test.mjs`.

| Sev | Defect | Fix | Regression |
| --- | --- | --- | --- |
| P2 | Pool `families` used one `Promise.all` over every account with a 20 s abort; one hung or failing account failed assembly, so a healthy account was never tried | Reference port: per-account `withTimeout(…, POOL_USAGE_TIMEOUT_MS)` with per-account catch, outer catch, `Object.hasOwn` policy and alias lookup | healthy `a` + hung `b` serves from `a` in bounded time (timeout shortened by patching `AbortSignal.timeout`, so the test runs in ~0.1 s); account named `constructor` is not mistaken for an inherited policy |
| P2 | `proxyTest` validated nothing (`url: 5` hit an internal `TypeError`) | `readProxyTestPayload`: outer `url`, `proxy` object, `proxy.url`, `username`, `password` (string or null), `enabled` boolean, `bypass` string[]; no network on invalid input | 12-case matrix with exact messages, no `TypeError`/`trim` leakage, fetch count unchanged; valid shapes still run |
| P2 | `force:'yes'` accepted; `modelDefaults` returned an owned snapshot | `readForce` rejects non-boolean on `providerSettings`, `modelDefaults`, `usage`; `modelDefaults` returns reference `ModelDefaultsCatalog[]` and `force` invalidates version, account catalogs and pool | rejection matrix (`'yes'`, 1, null, `'true'`, `{}`) x 3 endpoints; catalog shape, tier rows omitted, `configured` only when stored, cached vs forced catalog fetch counts; reference effort message |
| P3 | `safeDiagnostic('bad {"password":"hunter2x"}')` unchanged | Quoted-key/quoted-value pattern for compound keys (`password`, `passwd`, `token`, `secret`, `api_key`), single quotes, escapes, nesting | 8 samples plus a non-secret JSON control; serialized RPC with saved and draft secrets in an unknown JSON error; early draft-validation path |
| P3 | `disposeProxyTransport` left `current` (resident password), `configError` and in-flight probes | Dispose bumps an epoch, aborts probes (`AbortController` set plus optional caller `AbortSignal`), clears agent, ready, config and error | probe aborts in well under the 15 s deadline; password and config error released |
| P3 | Pool config was an interface only | Exported schemastery `Config` (strategy union, `switchMargin` >= 1, defaults, member shape) | defaults, accepted and 7 rejected shapes, model entry shape, plugin `name`/`inject` |
| P3 | Unused `dsh-agent` devDependency; undocumented React 19 / undici divergence | Removed (still resolved as `dsh-tools` peer; `npm ls`, `tsc`, tests unchanged); `schemastery` declared; React 19 / undici ^7.30.1 divergence recorded as fact (introduced in `ad0fd64`, original rationale not recorded, not re-verified on React 18 / undici 7.0) and the #133 pulled-forward source map in `src/PROVENANCE.md` | `npm test`, `npm ls` |

Red evidence: against the pre-fix `src` (13e8db7) 8 of the 10 new tests fail (hung account, proxyTest matrix, force matrix, catalog shape, quoted-JSON redaction, serialized unknown-JSON secret, dispose, Config schema). Two pass before the fix: the inherited-key account lookup and the early draft-failure password path (the latter was already handled by the earlier uncommitted work in this pass, not by 13e8db7 behaviour proof); they remain as guards, not as red proofs. The Config test is red there only because the export does not exist.

Counts: `npm test` 380/380 (classifier suite included; 370 prior + 10 new; zero fail/cancel/skip), `npm run check:build` "Committed output matches a fresh build.", `git diff --check` clean.

### The "13 initial findings"

The original thirteen-item finding list is not enumerated in any repository document; only the ded9f33 section above records remediations, and it explicitly says coverage was partial. This pass cannot honestly mark all thirteen cleared. What is established: each remediation named in ded9f33 and each defect in this section has a named regression; the list itself must come from the Lead's review record to be reconciled item by item, and that reconciliation is still open.

### Source-fixture vs installed limits

All proof is fixture-level: fake `fetch`, intercepted HTTP, fake cordis context or the real `LlmRuntime`/`ToolRuntime`/`WebRuntime`/`HostConnectionService` classes from the pinned `0.2.1-rc.2` packages, and a fixture React 19 renderer. Nothing ran in an installed DSH, with a real account, provider endpoint or proxy. The abort/timeout behaviours were proven with shortened timers, not the real 10 s bound. Independent re-review and Owner installed acceptance remain open.

### Pulled forward from #133 (Owner decision)

Codex `image_generate`, Codex web search and the image account pool were introduced here instead of #133. #133 acceptance must audit and reuse them (source map in `src/PROVENANCE.md`). Grok, video, `x_search`, the `image`/`video` RPC endpoints and tool views stay #133; `speed`/`setSpeed` stay #131.
