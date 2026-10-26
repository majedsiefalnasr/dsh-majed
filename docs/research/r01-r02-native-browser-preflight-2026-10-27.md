# R01/R02 native browser acceptance preflight — 2026-10-27

## Outcome

Browser acceptance is unavailable, not passed. The injected browser tool returned exactly:

`bsk session start failed: no browser is currently connected (hint: open the browser-skill extension in your browser and wait for the popup to show "connected")`

This occurred during an `about:blank` session-start preflight, before starting a temporary DSH host. No session ID or owned browser tab was created. No alternate browser backend was used to bypass this limitation.

## Scope and source identity

- Main checkout HEAD: `b0b2d787e5a084f734718d48ff4f0514e5698e69`.
- Installed stock CLI: `/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh/lib/bin.js`.
- Installed DSH and web-app manifest versions read: `0.2.1-rc.3`.
- Archive inspection used `/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness` with `ELECTRON_RUN_AS_NODE=1`; installed files were read, not modified.
- Existing R01 and R02 evidence reports were read. Their controlled OAuth, native Fetch/RPC, jsdom presentation adaptations and native ModelDirectory/session projections remain controlled-fixture evidence, not actual browser acceptance.

## Static findings and limits

The stock web composition supplies native Settings, renderer, locale, theme and connection modules. Its web-runtime prints an authenticated URL only after Loader settlement and startup audit. Any future launch must capture that handoff privately rather than exposing it in logs or evidence. The stock platform-account initialization reads the selected temporary credential store; without a stored grant it returns without requesting account details. Majed's production root separates account management and model-runtime opt-ins. No account/login or runtime control was exercised here.

Static inspection did not become a completed end-to-end launch safety proof. In particular, no final effective isolated composition was launched or browser-loaded. This report does not claim stock startup succeeded, nor that it is unsupported. The remaining blocker is browser connectivity, not an observed stock-host startup error.

## Reproduction boundary

Intended launch uses the installed Electron executable as Node, stock CLI `web`, repeatable public `--patch` overlays, loopback `--host 127.0.0.1`, ephemeral `--port 0`, and `--no-open`. It requires a sanitized environment, new temporary HOME and DSH_HOME, temporary working directory/profile and a public absolute-path Majed plugin entry. Final effective composition must be inspected for startup network effects before execution. No exact successful launch command, chosen port or authentication handoff exists from this attempt.

## Acceptance still pending

Actual native Settings production panel rendering and navigation; keyboard behavior; English and Arabic/RTL; light and dark themes; UI font sizes 14 and 18; narrow viewport; native account-disabled states. Real Codex login, retained real account/refresh, live inference, installed desktop/remote operational parity and exact rc.2 compatibility remain separately unverified and were not authorized by this browser-only attempt.

## Cleanup and preservation

No temporary host, background job, terminal, browser session or listener was started; none required stopping. No dependency installation, rebuild, provider request, synthetic owner admission, loader override, forged boot payload, installed-state edit, application restart, integration merge, push or tracker write occurred. The existing GUI was not navigated, reloaded or replaced. Existing dirty checkout files were preserved. Only this new evidence document is intended as a commit candidate; no product change or integration claim is made.
