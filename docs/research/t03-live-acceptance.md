# T03 live acceptance record

Status: **in progress; failure found, no acceptance claim**.

## Restarted candidate, first remote check — 2026-10-24

Owner confirmed restart and continuation. Verified BrowserSkill instance `cfe27991` connected; owned session `inzz` opened the current local origin. Native local page required authentication. Owner then opened their authenticated paired-remote DSH page in the Agent Window using request-help; no credential was requested or extracted. This is remote evidence, not a successful local-browser check.

Native Settings displayed the five candidate Manager/readiness sections. Existing reference Skills and Subscriptions entries remained present. General settings were English, System appearance selected, App UI size 14, chat size 18, DSH default font. No preference was changed in this first pass.

Selecting MCP Manager showed the explicit readiness-only description, a disabled unchecked readiness Switch, Refresh status, and an actionable `Status unavailable` alert. Debug capture `dd794186f7226` was started before reproducing Refresh. The captured window had ordinary remote RPC traffic but no request URL containing `majed`; this supports a pre-request failure and does not prove server admission failure. The capture was stopped without replay, mock rules, or security changes.

Source diagnosis: `client.js` declared `slots`, `locale`, `uiWorkspace` dependencies but its readiness component accessed `ctx.connection`. Native Cordis dependency enforcement throws on undeclared service access; optional chaining does not suppress the getter exception. The catch maps this to the observed generic alert before RPC dispatch. The native RPC signature itself matches the client call. A focused isolated-worktree fix and dependency-aware regression are in progress; source diagnosis is not yet a live-verified fix.

Remaining: corrected client deployment/reload, remote request/status verification, authenticated local page, and the complete theme/locale/font/keyboard/viewport matrix in [the acceptance procedure](t03-browser-acceptance.md). T03 remains open. No feature runtime, account operation, command hook, reference removal or profile modification was performed.
