# Native Settings/Codex acceptance worker — 2026-10-27

## Outcome

Acceptance is unavailable, not passed. R01/R02 remain open. No host was launched and no GUI was touched.

The lead's prior successful short-session browser check is retained as historical evidence, not repeated as a claim about this worker's permissions. This worker executed exactly `playwright-cli -s=mna open about:blank` from the isolated proof worktree. It failed with exit code 1:

> Error: EPERM: operation not permitted, open '/Users/majedsiefalnasr/Library/Caches/ms-playwright/daemon/ebdd4d81bb7275cf/mna.err'

The result explicitly identified a workspace-write sandbox denial. The current worker runtime prohibits escalation and approval prompts; no retry or alternate cache path was attempted. The lead needs to run this exact command with its separately approved limited wider permission. A browser close command would be `playwright-cli -s=mna close` if that open succeeds. No session was successfully created by this worker.

## Static review progress and launch gates

Read main AGENTS.md, docs/ai/rules/execution-policy.md, both previous native browser preflight reports, and the playwright-cli and verify-and-stop skills. Preserved existing dirty main checkout files.

Read installed archive content through the packaged Electron executable with ELECTRON_RUN_AS_NODE=1, without executing the host CLI. Extracted entry sources, package manifests, bundle patches, and selected startup modules under `.native-static-review/` in this isolated proof worktree for local review only. These extracted installed sources are not intended deliverables or an integration candidate.

Confirmed stock `web` template composes `@deepseek-ai/dsh-base` and `@deepseek-ai/dsh-web-app`. Read the base patch and beginning of the web patch. Base startup agents are empty. Base telemetry documents feedback-only export and the `DSH_TELEMETRY_DISABLED` opt-out; desktop product telemetry rows are disabled outside the desktop profile. These partial findings are not a completed startup side-effect audit. Effective overlay composition, all startup modules, environment loading and outbound side effects still need final review before launch.

The isolated worktree package exports its browser client as `./dist/client.js`; glob found no `dist/client.js` in this worktree. Built-client review is therefore not complete. Do not launch this candidate with missing browser output, silently substitute client.js, or rebuild under the current no-rebuild constraint. A previously built appropriate candidate must be located and verified, or the lead must resolve this gate explicitly.

## Cleanup and scope

No host, background job, terminal, successful owned browser session, temporary HOME/DSH_HOME or listener was created. No stop command was necessary. Existing GUI http://127.0.0.1:49180 was untouched. No install, download, rebuild, restart, account/provider request, boot/auth substitution, installed config mutation, delegation, merge, push, or tracker write occurred.

Actual native Settings render/navigation, keyboard, locale/RTL, theme, UI14/UI18 and narrow viewport remain untested. No completion claim for full R01/R02 or live Codex parity is made.
