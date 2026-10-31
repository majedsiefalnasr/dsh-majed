# Ticket #134 verification — GitHub Copilot

## Contract and state

Local candidate on `impl/134-copilot`, isolated `dsh-majed-t134`, baseline `d56439e`. Only #134 is implemented. Direct Owner authorization overrides historical one-at-a-time policy for parallel #133/#134 worktrees, not serial review/merge/install. No nested delegation or Claude agent model used. Independent review and Owner acceptance remain OPEN.

Bounded route: approved ticket story 58 at the already agreed assembled host RPC/registered adapter, rendered browser and packaging seams. Writes restricted to this worktree, `/tmp/majed-t134`, temporary npm cache `/tmp/npm-cache-majed`. Two failed diagnostics or 20 minutes per blocker; no scope expansion. No host, installed state, real credentials, Keychain, real OAuth/provider traffic, restart, push or merge.

## Final controlled-proof completion from 1d0af7d

Preserved the Lead's uncommitted actual React Manage test and useful missing-input diagnostic assertion. The resolved fixture problem was event-loop-only flushing finishing before asynchronous filesystem reads; bounded 20 ms timer yields now pass EN/AR, 2/2, with no runtime change. Do not reopen that diagnosis as a blocker.

Completed precise remaining proofs, without a redundant all-combinations suite:

| Gap | Controlled evidence |
| --- | --- |
| Actual Manage → real host RPC, two accounts, EN/AR | `test/copilot-manage-composed.test.mjs`: rendered account aliases/independent entries/pool exclusion save and forced reload; registered picker names and provider title consume the saved settings. |
| Account-specific incompatible metadata and actual protocol | `test/copilot-endpoint.test.mjs`: B/A/B same model id, context 32000/8000, reasoning high/low; actual global HTTP rejects the wrong endpoint, and both Responses and Chat Completions stream expected text. Checks serialized effort fields and selected authorization identity. |
| Abort during discovery | Same endpoint test hangs B discovery, aborts caller and asserts inference count unchanged; existing reference account test covers pre-abort. |
| Acquisition fetch/body timeout | `test/copilot-lifecycle.test.mjs`: both ignore abort, actual 30-second deadline releases slot; late rejection consumed without unhandled rejection. |
| Poll fetch/body expiry | Same lifecycle suite: both hang, deadline rejects, B starts and remains owner after stale A rejection. Existing reference device tests separately cover cancel A during acquisition/start B/stale A and late successful token body. |
| Transport/body errors, denial, unknown upstream error secrecy | Six lifecycle cases assert busy released and synthetic secret absent from surfaced errors. Existing device tests cover malformed acquisition and explicit expired_token. |
| slow_down | Measures next polling dispatch delayed at least 4900 ms (specified increment 5000 ms), then denial settles safely. |
| Dispose during acquisition/poll and restart refusal | Real DeviceFlowManager with controller, hung HTTP; dispose releases slot, saves no account and rejects subsequent login. |
| Cancel/dispose during late token exchange | Controller with deferred fake exchange, real temporary owned store: late completion saves no account, fires no changed notification, busy false, no unhandled rejection. |

These are regression proofs of existing runtime behavior, not failing-before claims or independent acceptance. No production source or generated output needed changes in this completion pass. Initial lifecycle fixture run exited 1 because unref'd production timers allowed the isolated test process to exit; added test-owned before/after keepalive. Next run exited 1 because B's fixture answered acquisition data to polling and legitimately settled; corrected only that fake response to authorization_pending. Neither was a production defect; no unresolved diagnostic blocker remains.

Final gates observed 2026-10-31: focused endpoint + preserved Manage exit 0, 3/3. Full `npm test --cache /tmp/npm-cache-majed` exit 0, classifier 166/166 and Node 670/670, no failures/cancellations/skips. `npm run build --cache /tmp/npm-cache-majed` and `npm run check:build --cache /tmp/npm-cache-majed` exit 0, fresh output matches; generated output unchanged. `git diff --check` exit 0. `npm pack --ignore-scripts --cache /tmp/npm-cache-majed --pack-destination /tmp/majed-t134` exit 0; archive `/tmp/majed-t134/dsh-majed-0.2.0.tgz`, SHA-256 `3c310d8b8eaa184a45c2bde868e06c0e76e925ac217b4ffdc85dea86cbb6f3cc` (contains final runtime/provenance; verification/state text subsequently clarified). All HTTP is injected fake traffic and storage is synthetic temporary owned state. Direct Standards/Spec self-review found no additional defect; independent Lead re-review is still mandatory and unavailable at this depth.

Residual limits: no installed desktop/clipboard/external-browser/paired-remote proof, real GitHub authorization/refresh/catalog or inference. Late-save proof cancels while exchange is pending, before persistence starts; it does not claim transactional cancellation of an already-started filesystem write. No installed files, credentials or reference source modified; no merge/push/closure. Review-ready worker candidate, not Owner acceptance.

## Review remediation from eb06561 (historical partial checkpoint)

Partial remediation candidate, not a claim that all independent-review findings are cleared. Reproduced red at assembled RPC seam: `providerSettings` returned `codex` instead of `copilot` (exit 1, 0/1). Reproduced red at device-flow seam: acquisition did not reserve busy ownership before I/O (exit 1, 0/1). Both now green. Added explicit Copilot settings/account/model reads and force invalidation; assembled save/reload proves provider display name, alias, independent entry and pool exclusion. Added account-specific capability metadata and pre-abort fixture; lookup and streaming protocol now accept selected account/cancellation. Added early ownership, 30-second acquisition timeout, signal-raced fetch/body and device expiry timer; stale A cannot replace B, hung acquisition body cancels and expired token body rejects. Dedicated pinned translator suite ported in full (17 tests, imports adapted).

Observed interim gates: focused assembled 1/1 exit 0; translator+device 25/25 exit 0 (before two additional device tests). Full test first compile exit 2 due new fixture typing, corrected; subsequent full run classifier166/166, Node652/653 exit 1 solely stale generated output; rebuild corrected it. Full rebuilt run exit 0 classifier166/166 and Node653/653, build/check:build/diffcheck exit 0. Later assembled preference assertions pass 1/1. Final gate record follows in handoff. All dependencies unchanged. Prior npm audit output is an untriaged report, not established exploitable vulnerabilities and not a basis for unsupported dismissal.

At that historical partial checkpoint, residual proof gaps remained (now addressed by the final controlled-proof matrix above): actual rendered Manage was not expanded here (existing card test stubs its dialog); assembled second-account save/model-config/default/force matrix and exact incompatible-endpoint streaming differential need further proof. Acquisition timeout, hung poll-fetch, dispose/new-attempt and slowdown/error-no-leak matrices are not fully demonstrated. Account and abort regression was added after its implementation, so no failing-before claim for it. No installed/provider/OAuth/secret access or live acceptance. Lead must not treat this partial candidate as an independent-review PASS.

## Source and delivered path

Reference read-only `/tmp/upstream-0.9.12`, verified full pin `b8023110864494acefc6f5963c2a197d85dda20c`, MIT. Exact provenance in `src/PROVENANCE.md` and notices. Provider and device engine remain source-faithful; all 37 Copilot, ten Copilot catalog and seven device-flow reference tests are included. Shared owned store/token manager/preferences/Manage/catalog/pool/proxy/usage paths are reused. Copilot has no usage API in the pin: usage returns unsupported rather than fabricated zero. The card shows the user code, copy button, safe verification link, status, account/default/logout and Manage in EN/AR; code/identity remain LTR-isolated. Both Chat Completions and Responses, reasoning replay, refresh and fallback catalog come from the pin.

Current API facts fetched via ctx7 (`library GitHub`, then `/github/docs` device-flow docs): GitHub requires device-code POST, minimum polling interval, five-second slow_down increment and expiry handling. Source: https://github.com/github/docs/blob/main/content/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app.md . This does not establish private Copilot endpoint stability.

## Automated evidence

- `npm ci --ignore-scripts --cache /tmp/npm-cache-majed`: exit 0; 85 packages. Audit reported 15 high vulnerabilities; no dependency changes or unrelated fixes attempted.
- TDD red: reference Copilot compile exit 2 because provider module absent; green compile plus reference Copilot suite exit 0, 37/37.
- Device engine plus rendered EN/AR copy/link/cancel fixtures: exit 0, 9/9.
- Assembled login → stored account → model list → streaming reply → unsupported usage → logout fixture: exit 0, 1/1. Fake HTTP only, secret-free status and unused-provider no-network asserted.
- Initial full suite exit 1: expected old two-provider registration assertions and model-ID audit needed extension; build parity stale after browser edits. These were corrected, not suppressed.
- Full `npm test`: exit 0, classifier 166/166 and Node 632/632; no failures, skips or cancellations. Existing React/version fallback warnings remain.
- `npm run build` and `npm run check:build`: exit 0; committed output matches fresh build.
- Final full rerun: `npm test` exit 0, classifier 166/166, Node 632/632; build/check:build exit 0. `npm pack --ignore-scripts --cache /tmp/npm-cache-majed --pack-destination /tmp/majed-t134` exit 0. Archive `/tmp/majed-t134/dsh-majed-0.2.0.tgz` SHA-256 `9628863f4938c89dd7d618f0070594f01ec4d03fbd6fd142493041351a95d5e3` (archive predates this evidence-only edit). `git diff --check` exit 0. No live acceptance claim follows from fixtures.

## One consolidated Owner live session — only after independent review

Prerequisites: Lead reviews Standards and Spec against baseline, reconciles #133 conflicts, reruns full tests/build/package checks, and obtains separate approval for reversible install. Owner disables the reference component before enabling ours (shared provider ids); keep reference installed and its storage untouched. Full desktop restart is required for host artifacts. Never send screenshots of tokens/device codes or account identities to the agent.

1. EN then AR: verify Copilot card, Manage, readable code/URL, copy button and verification link; check core preferences and existing Codex/Claude remain usable.
2. Start device login; verify automatic page opening or fallback link, copy the code locally, cancel, retry. Remount while pending and verify code/link recovery and eventual status updates.
3. With explicit real-account authorization, complete GitHub approval and verify connected account, default, alias, model visibility/name/effort, pool membership and independent entry. A second account is optional and requires its own permission.
4. With separate explicit live inference approval, choose a Copilot model and send one minimal chat; verify streaming, cancellation and (where available) tool/Responses behavior without consuming unnecessary quota.
5. Confirm usage clearly says unavailable, not zero; confirmed logout removes only the chosen owned account. Turn ours off and reference back on without credential sharing/data loss. Do not perform logout merely to demonstrate it if retaining the new login is preferred.

## Limits, deviations and integration conflicts

No installed UI, actual clipboard permissions, external browser dispatch, real OAuth/token refresh/private model catalog, paired-remote parity or live chat tested. Reference device engine retains its polling/timeout behavior (including initial request lifecycle limits); independent review must assess safety and completeness, not treat unit-test totals as acceptance. No independent review was possible at this delegation depth; this is a worker candidate only.

Likely serial integration conflict files with #133: `src/subscriptions.ts` (provider route union, status, registration, pool construction, model defaults), `src/browser.ts` (card registration), `locale/en.json`, `locale/ar.json`, generated `dist/{subscriptions.js,subscriptions-client.js,client.js}`, provenance/notices/changelog/current-work and provider registration expectation tests. Preserve both providers; rebuild generated outputs after resolution rather than manually merging bundles. No sibling worktree was written. Grok/media is not implemented here.
