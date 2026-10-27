# Public-composition Codex fixture

Testing only; no production code or endpoint configuration is changed. The approved seam is root `apply(ctx, {codexAccounts:{fetch,ports,path,catalogPath}})`. The transport never delegates to network fetch, permits exact token/catalog/Responses URLs with expected methods, and labels every synthetic account/model/reply. Counters remain closure-private until disposal writes counts (not bodies or credentials) to the owned log. This is not OS-level network confinement of stock DSH.

## Lead commands

From this candidate checkout, with existing dependencies only:

    node scripts/build-baseline.mjs
    node --test scripts/codex-fixture.test.mjs
    node scripts/codex-fixture/launch.mjs new

The launcher prints an owned temporary run path and stays foreground. Read that run's `host.log` locally to open the most recent stock startup URL in the lead-owned browser. Treat the URL as a private local authentication capability; never paste it into reports. No accounts or operational profile state are copied. Stock `web --patch` inserts an absolute temporary plugin entry. Its package metadata is copied verbatim from Majed; actual built client, modules, locale and assets are linked from the candidate, not replaced UI. The only composed host entry calls root `apply`. Disabled stock IDs match the prior approved isolated overlay.

## Browser actions (lead only)

1. Open Settings, General, Codex account; enable account management. Click Connect Codex. Do **not** open the sign-in link or visit the auth website.
2. Read the displayed authorize link's href locally through DOM inspection. Construct a URL from its `redirect_uri`, set `state` to the link's exact generated state and `code` to `SYNTHETIC-FIXTURE-CODE`. Do not change state or PKCE: the service owns both. Navigate a temporary browser tab to that local callback URL, or paste that full callback URL into the existing callback input and click Complete login. Both exercise the actual account service's pending-attempt validation and token exchange through the fixture fetch. Never manufacture operational credentials.
3. Verify the labelled `synthetic-codex@example.test` account. Enable Codex models, refresh model catalog, select `Synthetic Codex — fixture only` in native picker. Send a synthetic prompt; expect `SYNTHETIC CODEX FIXTURE: no provider inference occurred.` Check Standard/Fast and per-model preferences only against this synthetic model.
4. Stop the foreground launcher with Ctrl-C. Wait for `Fixture host exited`. Restart the exact same owned run (not an arbitrary profile):

       node scripts/codex-fixture/launch.mjs restart <owned-run>

5. Open the new startup URL, enable account management and models again (activation intentionally resets on restart). Verify the retained synthetic account/catalog/preferences and a new synthetic response. Account persistence is separate from runtime activation. Never interpret activation reset as account loss.
6. Stop with Ctrl-C and verify the recorded PID has no listening sockets. The launcher intentionally retains only its temporary profile for inspection/restart; it never deletes arbitrary paths. Do not share logs, auth store or startup URL. Do not leave this host running.

## Worker evidence and limits

Initial transport test failed with ERR_MODULE_NOT_FOUND before implementation. Four fixture tests subsequently pass: unexpected-host/endpoint-suffix/catalog-version denial; synthetic payloads; actual account-service callback/PKCE identity retention across service restart; and rejection of arbitrary restart paths/invalid CLI arguments. Existing `npm test` passes: 506 tests, zero failures (plus legacy runner 166/166). Existing dependencies were linked locally; no installation occurred.

Initial controlled stock-host smoke started on an ephemeral loopback port with fresh HOME/DSH_HOME; graceful stop exited zero. The same retained profile restarted successfully. Unauthenticated shell requests returned 401; no admission bypass was attempted. Stock startup alone is not evidence of mounted plugin success or no stock-host background traffic. No real auth website, provider inference, installed accounts/configuration, host source patch, global fetch override, fake admission, push or merge was used.

## Independent candidate review

Reviewed candidate `64bd0e884049915e44b7df88979ca5178b50726b` against parent and merge-base `734990375812c2d851e9d45d2f34d8f551c1fb5f`. The diff is confined to the fixture launcher, transport, focused tests and this README; production host/client/package files are unchanged. Standards: no blocking documented-standard violation identified; this is testing infrastructure, not a shipped user-visible change. Spec: no blocking deviation from the requested isolated public-composition fixture identified. Root `apply(ctx, config)` forwards the injected transport to Codex account management and runtime; fixture transport admits exact URL/method combinations and contains no network fallback. The temporary package retains the original metadata and native client discovery fields and links the candidate's built client. Launcher environment does not inherit operational HOME/DSH_HOME or credentials; startup output is redirected to an owned private log. Restart validates the owned temporary root and children and refuses an apparently running recorded PID. This is not OS-level confinement, an adversarial shared-profile security boundary, or production/live acceptance.

Independently rerun by the reviewer: focused fixture tests passed 4/4; `npm test` passed 506/506 and legacy runner 166/166; both commands exited zero. `git diff --check 7349903...64bd0e8` passed. Candidate worktree was clean after the build/tests. No browser or host was relaunched by the reviewer and no operational stores were inspected. Review was performed directly without nested delegation. The implement-spec skill was not available in this worker's supplied skill catalog; the repository execution policy and supplied fixture acceptance scope were used instead.

## Lead observations (reported, not independently rerun)

The lead reports stock rc3 browser verification using the isolated fixture profile: enabled account management; Connect Codex; read the original authorize href through the DOM; submitted its unchanged state and redirect URI with a synthetic code through the existing callback input, without external sign-in. The labelled synthetic account appeared. Enabling models and refreshing the catalog exposed the synthetic model in the native picker. Selecting it and sending a synthetic acceptance prompt produced the exact labelled fixture response documented above.

The lead then closed the browser and gracefully stopped the launcher (host exit zero), restarted the same owned temporary profile, reopened the new private startup URL, enabled account management and observed the retained synthetic account. Refresh credentials completed; enabling models exposed the catalog again. No second response was sent after restart. Both host jobs were collected/stopped with graceful child exit zero; browser close exited zero. These are lead observations, not independent reviewer test results. No auth URL, state, token, auth-store content or log is reproduced here.

Subsequent lead report (2026-10-27): restarted the same owned temporary profile again, enabled management and models, and observed the retained synthetic account and catalog. The native picker was already `Synthetic Codex — fixture onlyLow`; waiting for an initial `Select model` locator timed out because that selection was restored, not because model loading failed. Sending a synthetic prompt using the restored selection produced exactly `SYNTHETIC CODEX FIXTURE: no provider inference occurred.` Browser `mna` closed with exit zero. Owned host job `bash-e98c3c76cc4345d9` reported `Fixture host exited: 0` and was collected/stopped. This is reported controlled stock-browser evidence only, not independently rerun here, no real provider or installed state, and not proof of socket absence.

## Deterministic native auth states

Candidate adds one synthetic control at the existing injected fetch seam: completing an authorization-code grant with code `SYNTHETIC-FIXTURE-FAIL` returns HTTP 400 `invalid_grant`. No endpoint, production hook, credential override or new admission path is added. Other synthetic login and refresh behavior is unchanged. The regression first failed (`connected` instead of `failed`), then passed through the actual account service. Pending and cancellation require no new control.

### Lead observations (reported, not independently rerun; 2026-10-27)

The lead used a fresh candidate-owned temporary profile in the stock browser. In English, the native pending state showed the exact expected `Waiting for sign-in. Open the link on the host, or paste the full callback URL here from a remote device.` message; cancelling showed `Login cancelled.`. On a fresh attempt, submitting `SYNTHETIC-FIXTURE-FAIL` with the original generated state produced `Login failed or expired. Try connecting again.` and no synthetic account.

The lead switched the native locale to Arabic and waited for the service's settled state; a transient disabled initial render was not treated as a defect. Repeated pending and cancellation showed `بانتظار تسجيل الدخول. افتح الرابط على المضيف أو ألصق رابط العودة الكامل هنا من جهاز بعيد.` and `تم إلغاء تسجيل الدخول.`. A failed token exchange with the original generated state showed `فشل تسجيل الدخول أو انتهت مهلته. حاول الربط مجددًا.`. The native Settings panel's computed direction was RTL.

A fresh English attempt using `SYNTHETIC-FIXTURE-CODE` then showed the connected synthetic account. The browser was closed with exit zero; the fixture host received SIGTERM and exited gracefully with status zero. The recorded host PID check, `lsof -nP -a -p PID -iTCP -sTCP:LISTEN`, returned exit 1 and no output, indicating no listening sockets for that PID at the time of the check. Aggregate disposal counters were token 3, catalog 0, responses 0, denied 0: two failed exchanges and one successful exchange; pending/cancelled attempts added no token exchange. These counters do not establish absence of stock-host outbound activity. No synthetic response was sent in this run; the earlier post-restart response evidence above remains separate. The reported native bilingual pending/cancel/failure/recovery sequence and recorded-PID socket check are controlled observations, not independent reviewer results. They do not establish retained Standard/Fast preferences, wider visual acceptance, remote/live parity, or full R01/R02 completion.

Use a **new candidate-owned run** because existing retained runs are intentionally bound to their original checkout. Lead only (worker did not launch host/browser):

    cd '/Users/majedsiefalnasr/Documents/Work/DeepSeek Harness/dsh-codex-retained-native'
    node scripts/build-baseline.mjs
    node --test scripts/codex-fixture.test.mjs
    node scripts/codex-fixture/launch.mjs new

Open the new private startup URL locally, then native Settings → General → Codex account → Enable account management. Perform this exact sequence before creating an account:

1. Click **Connect Codex**; assert `Waiting for sign-in. Open the link on the host, or paste the full callback URL here from a remote device.` is visible. Do not open the external sign-in link. Click **Cancel login**; assert `Login cancelled.` and no synthetic account. Refresh account status and verify cancellation remains.
2. Click **Connect Codex** again. Read the current authorize link href locally; construct the full callback URL from its unchanged `redirect_uri` and `state`, setting only `code=SYNTHETIC-FIXTURE-FAIL`. Fill `input[data-codex-callback]`, click **Complete login**; assert `Login failed or expired. Try connecting again.` and no account. This is token-exchange failure, not wrong-state rejection.
3. Switch the native locale to Arabic; repeat pending/cancel/failure. Assert `بانتظار تسجيل الدخول. افتح الرابط على المضيف أو ألصق رابط العودة الكامل هنا من جهاز بعيد.`, `تم إلغاء تسجيل الدخول.`, and `فشل تسجيل الدخول أو انتهت مهلته. حاول الربط مجددًا.` respectively; inspect the native Settings RTL direction. Use a fresh generated state each attempt. Do not report Arabic passing based on strings existing in source.
4. Return to English; complete a fresh attempt with `SYNTHETIC-FIXTURE-CODE`. Enable models; verify the synthetic account/catalog and response still succeed after failed/cancelled attempts. If the picker is already selected, reuse that selected button rather than wait for `Select model`. Record observed pending/failure/cancel/connected UI separately from service tests.
5. Close browser, Ctrl-C launcher and collect exit. Read only aggregate `Synthetic fixture counters:` locally from the owned log: failure plus success requires two token requests; pending/cancel must add none; denied should remain zero. Stock background activity is outside these counters. Finally run `lsof -nP -a -p "$(< '<owned-run>/host.pid')" -iTCP -sTCP:LISTEN`; exit 1 with no output means no listening sockets for that recorded PID. Do not reproduce private startup URLs, callback states, tokens or store/log bodies.

Worker validation: focused fixture tests 5/5; full `npm test` 506/506, legacy runner 166/166, exit zero after linking the existing main-checkout dependencies (no installation). Initial full-suite run failed due to absent candidate dependencies (`@deepseek-ai/cordis`, `fflate`); linking existing dependencies fixed it. No host/browser launch, operational access, tracker mutation, push or integration merge occurred. Changes are testing-only and do not add shipped user-visible behavior.

## Retained-preferences / wire-setting candidate

The transport's detached `observations()` and disposal-only `Synthetic fixture wire settings:` log retain fixed buckets only: speed `standard` (field omitted), `fast` (`priority`), `other`; reasoning `absent`, `low`, `high`, `other`; and malformed count. Parsing is transient, with no prompts, credentials, bodies, account identifiers, arbitrary values or per-request record retained by these observations. Stock logging is outside this guarantee. Counts reset per process; restart appends another summary, not cumulative counts.

Red-green: the new fixed-aggregate regression first failed with `TypeError: transport.observations is not a function`, then passed unchanged after implementation. Unknown values, malformed body and detached snapshots are covered. Another controlled test uses production accounts/runtime and real native `LlmRuntime.prepareCall` through this exact transport: configure independent alias/name/high default/64000 context; Standard default-high send; Fast explicit-low send; recreate runtime on the same store; verify retained metadata/context/default and Standard reset; default-high send. Observed standard 2 / fast 1, high 2 / low 1, malformed 0, denied 0. This proves service-runtime restart, not host/browser restart. No production bug was demonstrated or production code changed.

Contract review: `client.js` model/account forms use existing configure actions; Speed and `/fast` share `setSpeed`. Runtime binding uses discovered `fastTier` and per-session speed, clearing speed on disposal. The source-backed helper recognizes this fixture's existing `service_tiers:[{id:'priority'}]` and emits `service_tier:priority` only for Fast. Native LlmRuntime resolves `requested ?? reasoning.defaultEffort` and exposes context on its prepared handle. Durable preferences are separate from ephemeral speed: do not expect Fast to survive restart or claim fixture capability is absent.

### Next lead browser batch — worker did not execute

Use a NEW candidate-owned run from `dsh-codex-preferences-observations`: build, run focused tests, then `node scripts/codex-fixture/launch.mjs new`. Never reuse a profile bound to another checkout. Use the existing synthetic callback procedure once. Do not repeat already-proven bilingual authentication states.

1. English Settings → General → Codex account: enable management, connect synthetic account, enable models, wait for settled catalog. Stable action selectors are `button[data-codex-action="enable"]`, `button[data-codex-action="runtime"]`, `button[data-codex-action="catalog"]`. Verify their current accessible text before clicking; activation actions toggle.
2. Scope fields to `form[data-codex-model-settings]`. `getByLabel('Model',{exact:true})`: select `synthetic-codex`; `getByLabel('Display name',{exact:true})`: fill `Fixture retained`; `getByLabel('Default reasoning effort',{exact:true})`: select `high`; `getByLabel('Context budget (tokens)',{exact:true})`: fill `64000`; leave `Hide from picker` unchecked. Click `Save model settings`, await settled enabled controls and verify retained values.
3. Scope account form using `page.locator('form').filter({has:page.getByRole('button',{name:'Save account settings',exact:true})})`. Fill `Account alias` with `Fixture pinned`; check `Show an independent account entry`; click `Save account settings`. Verify independently from the synthetic email account label.
4. Close Settings. Open the CURRENT native model-picker button (do not wait for `Select model` if already selected). From a fresh native snapshot choose exact row `Fixture pinned · Fixture retained`. Use a fresh session/default effort High, clearing any explicit retained Low override. Wait for `select[data-codex-speed]` (poll up to 3 seconds); assert Standard/value `standard` and Fast/value `fast`. Select Standard, send exactly one controlled prompt, await exact synthetic reply. Select Fast, explicitly choose native Low effort, send exactly one more, await reply.
5. Close browser; stop/collect launcher. Read ONLY last aggregate lines locally: responses 2, denied 0; standard 1 / fast 1 / other 0; high 1 / low 1 / absent 0 / other 0; malformed 0. Token normally 1 without manual refresh; catalog count varies and is not an exact target. Record extra-turn deltas honestly if they occur.
6. Restart SAME owned run: `node scripts/codex-fixture/launch.mjs restart <owned-run>`. Open new private startup URL, re-enable management/models (activation resets). Verify retained account; model form name `Fixture retained`, high, 64000, hidden unchecked; account alias `Fixture pinned`, independent checked; picker includes independent named entry. Speed should reset Standard, not retain Fast. Choose native High explicitly if the session retained explicit Low; send one controlled Standard/High request. Stop/collect. NEW process aggregates: responses 1, denied 0; standard 1 / fast 0; high 1 / low 0; malformed 0. Token normally 0 unless synthetic expiry triggers refresh; no second login needed.
7. Perform recorded-PID socket check using the existing lead procedure; record actual result. Never reproduce private URLs, states, store/log bodies or credentials. Injected-fetch counters do not establish absence of stock-host background traffic.

Native picker/effort/composer refs must be obtained from the lead's actual DOM snapshot; worker has not inspected browser DOM and does not invent native IDs. Stable Majed selectors above are source-backed.

Validation: focused 7/7; full `npm test` 506/506 plus legacy 166/166, exit zero; existing dependencies linked, none installed. Direct two-axis source review (nested delegation prohibited): Standards has no blocking finding for this testing-only change; Spec has no blocking deviation within this bounded scope. No shipped behavior/CHANGELOG change is needed. Implement-spec skill is absent from this worker catalog. No worker browser/host launch, installed/operational access, real provider traffic, tracker mutation, push or integration merge occurred.

## Remaining acceptance

Retained model-preference/Standard/Fast checks and wider visual acceptance remain unverified. Native pending/cancelled/failed states in English and Arabic/RTL, connected recovery after those attempts, and the recorded-PID listening-socket absence check are reported controlled observations, not independently rerun. No real-provider authentication/inference, desktop installed-profile parity, paired-remote parity, operational cutover or full-spec completion is established. Keep the tracker open; integration remains the lead's separately reviewed decision.
