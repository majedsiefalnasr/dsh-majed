# T03 live acceptance record

Status: **in progress; failure found, no acceptance claim**.

## Restarted candidate, first remote check — 2026-10-24

Owner confirmed restart and continuation. Verified BrowserSkill instance `cfe27991` connected; owned session `inzz` opened the current local origin. Native local page required authentication. Owner then opened their authenticated paired-remote DSH page in the Agent Window using request-help; no credential was requested or extracted. This is remote evidence, not a successful local-browser check.

Native Settings displayed the five candidate Manager/readiness sections. Existing reference Skills and Subscriptions entries remained present. General settings were English, System appearance selected, App UI size 14, chat size 18, DSH default font. No preference was changed in this first pass.

Selecting MCP Manager showed the explicit readiness-only description, a disabled unchecked readiness Switch, Refresh status, and an actionable `Status unavailable` alert. Debug capture `dd794186f7226` was started before reproducing Refresh. The captured window had ordinary remote RPC traffic but no request URL containing `majed`; this supports a pre-request failure and does not prove server admission failure. The capture was stopped without replay, mock rules, or security changes.

Source diagnosis: `client.js` declared `slots`, `locale`, `uiWorkspace` dependencies but its readiness component accessed `ctx.connection`. Native Cordis dependency enforcement throws on undeclared service access; optional chaining does not suppress the getter exception. The catch maps this to the observed generic alert before RPC dispatch. The native RPC signature itself matches the client call. A focused isolated-worktree fix and dependency-aware regression are in progress; source diagnosis is not yet a live-verified fix.

## Corrected client, remote functional check

Focused fix author `396e08e` merged as `6a4d8ad48cbfb6fcc9d6306c18923d7c2c077ed5`. Independent bounded Standards/Spec review found no concrete issue. Real Cordis sibling-service regression reproduced zero initial RPC calls before the declaration fix and initial/Refresh dispatch afterward. Integrated portable tests passed 57/57 plus classifier 166/166; build and whitespace checks passed.

Only installed `client.js` and `dist/client.js` were updated under approved deployment authority, with rollback copies at `deployment-backups/before-t03-client-6a4d8ad/`. Both deployed SHA-256 digests were `23d3576cc2be411f41eeaed5867436d8245dd86d2a60bf0e21559449cb97ba12`. A workspace-sandbox denial preceded the exact approved wider-access retry. No host file or configuration changed.

After page reload, the actual paired-remote Settings MCP Manager showed an enabled interactive Switch and `Readiness checks are disabled.` instead of the prior error. Turning readiness on returned `Service ready for readiness checks only. Feature operations are not implemented here.` Refresh preserved that ready response. Turning readiness off returned the original disabled status. This verifies the corrected remote readiness interaction only; no MCP server or other operational feature was activated.

A second local-authentication help request again resulted in an authenticated remote page, not a local-origin page. Local browser evidence therefore remains unavailable. Existing System appearance, English, App UI size 14 and chat size 18 were unchanged.

## Additional remote narrow-screen checks

At corrected candidate `6a4d8ad`, BrowserSkill session `lugk` exercised the paired-remote page. Observed initial viewport 1200×1223, then requested a narrower window; actual reported viewport was 500×677 (the browser imposed its own minimum), not the requested 440×820. Screenshots confirmed readable wrapped readiness copy and visible Switch/Refresh/status at this actual viewport in dark System appearance and explicit Light appearance. General showed English, App UI 14 and chat 18; these are distinct font settings, so this does **not** count as UI-size-18 evidence.

Skills, Hooks, Subscriptions and Auto routing sections each returned their disabled readiness status without raw translation keys. Skills readiness was activated with keyboard Space on its focused Switch and returned ready, then restored to disabled. Hooks remained independently disabled. Subscriptions Refresh accepted Enter after explicit focus and returned disabled. A Tab after the Skills async toggle moved focus to Account navigation rather than providing a proven sequential Switch-to-Refresh path; full keyboard/focus-return acceptance is therefore not claimed. Screenshots were observed in-session, not saved as a durable image artifact.

The native General Language menu offered only `中文` and `English`. Arabic could not be selected through the visible native language control despite the plugin's Arabic dictionary. No locale/config/storage workaround was used. This was a concrete usability/acceptance gap, not evidence that Arabic works live. Subsequent source inspection established the public `locale.addLanguage({ id, label, fallback })` catalog seam; namespace dictionary registration does not add a selectable language. Focused fix `f9f67fb` registers Arabic with English fallback, owns only its exact disposer, preserves foreign Arabic definitions and guards older unavailable APIs. Its strict public-boundary regressions pass; independent final Standards/Spec rereview found both initial review findings addressed. Deployment and actual Arabic selection remain pending.

Explicit Light was restored to the original System preference through General. Skills readiness was restored to disabled; other modules stayed disabled. English, fonts and other preferences were unchanged. Settings was closed after this pass. No command/account/provider operation occurred.

## Arabic client deployment, live continuation unavailable

After reviewed merge `84786a9` and documentation tip `42e05b9`, the build passed. Only installed `client.js` and `dist/client.js` were replaced under approved wider-access retry following the workspace sandbox denial. Prior files were retained in `deployment-backups/before-t03-arabic-84786a9/`. Both deployed files matched SHA-256 `3a5b8ca1e08d24f8e508079816c6ed83234689535f31fd7a21157b26403cb6c0`. No host/configuration file was changed. Targeted locale/readiness tests passed 6/6 after deployment.

Starting the next owned browser session explicitly on verified instance `cfe27991` failed: `requested browser is not connected`. No alternative profile/backend was used and no page or preference was changed. Deployment is verified at the file level only; page reload and live Arabic selection await reconnection of that same browser instance. While awaiting human reconnection, the complete integrated `npm test` passed 60/60 plus classifier 166/166, including real npm-pack/extracted lifecycle rebuild, followed by a successful package dry-run and whitespace check. The dry-run candidate SHA-1 was `a620236c1203f7d265be308c8525759100d04d26`; no package was published. These portable/package results do not substitute for browser acceptance. This does not establish an unsupported locale seam or complete T03.

## Reconnected remote Arabic check — 2026-10-24

Verified instance `cfe27991` reconnected; owned session `jalc` opened the existing authenticated paired-remote origin at viewport 1200×757. General initially showed English, System appearance, App UI size 14 and chat size 18. Arabic was now selectable through the native Language menu. Selecting it translated all five candidate navigation labels. MCP displayed Arabic readiness description, Switch, Refresh and disabled status without raw locale keys. Enabling its inert readiness returned the translated ready response; explicitly focused Refresh accepted Enter. Readiness was restored to disabled. This does not establish sequential keyboard focus or local-origin coverage.

Screenshots observed dark/System MCP and explicit-Light Skills at App UI size 14. Both showed readable right-aligned Arabic text, mixed Latin MCP navigation, wrapped copy and visible controls; screenshot attachment identities were `sha256:2862c029ba741737afe8389d3673ad7443afef49adb9ec418fc7eaa3b7d6e4c0` and `sha256:5c8241249aee156faa4f2e2713d0f15f784dd248886c0f8e4bf0f01bc073aa98`. They are in-session evidence, not saved image artifacts. Native shell labels remain English through the Arabic fallback; this does not imply a complete DSH shell translation. Restored System appearance and English through General; font sizes were unchanged, readiness disabled, and the owned session stopped.

Remaining: authenticated local page, UI-size-18 and complete theme/locale/font/keyboard/viewport matrix in [the acceptance procedure](t03-browser-acceptance.md). T03 remains open. No feature runtime, account operation, command hook, reference removal or profile modification was performed.
