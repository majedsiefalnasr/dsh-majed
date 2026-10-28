# Isolated native startup handoff

Static preparation only; no host or browser was launched. Existing GUI http://127.0.0.1:49999 was not touched.

## Invocation

Run explicitly:

    /bin/bash '/Users/majedsiefalnasr/Documents/Work/DeepSeek Harness/dsh-majed-browser-preflight-retry/.startup-review/launch-isolated.sh'

Keep this command in an owned managed foreground/background job. It prints a newly created private run directory, then execs the stock packaged CLI. The PID written in that directory is the exec-preserved host PID. All host output, including the launch-token URL, goes to mode-600 host.log under a mode-700 run directory. Do not print, attach, or copy this log into shared evidence. Lead may read the URL privately for the separately authorized browser handoff. Port is OS-selected, not 49999.

## Static controls and evidence

- dist/client.js exists and is 198350 bytes; this review did not rebuild it.
- launch-isolated.sh passes bash -n. No runtime success is claimed.
- Stock launcher documents repeatable --patch and web profile flags (bin.js:26-30,105); app-boot README documents absolute plugin insert paths (line 65).
- Stock web README documents --no-open, loopback --host, port 0 via host-server README, tokenized readiness URL, and Host/Origin plus cookie authentication. No fabricated boot payload, replacement UI, private Loader hooks, or public URL/trusted-host override is used.
- Empty environment plus fresh HOME, DSH_HOME, TMPDIR, cache, and invoking directory exclude inherited credentials and both documented .env layers. Installed state is neither copied nor read by the script.
- Public row-disabled overlay removes session-title inference and all stock LLM adapters. DSH_TELEMETRY_DISABLED=1 plus explicit disabled telemetry rows prevents feedback and desktop analytics export. Web desktop analytics rows are already profile-disabled by stock composition.
- Stock deepseek-account stays mounted for native signed-out UI; its Service.init reads the selected temporary credential store and returns immediately with no record (extracted source lines 606-608). It is not a startup provider request. No account action is authorized.
- Stock agent-loop has agents: [] (base patch lines 509-514); no startup inference task is declared. Plugin Manager constructor configures only local service state and operation cancellation; package registry operations are user-triggered. On-demand market bundles are not included in default composition.
- Majed root registers inert Settings and account controls. Codex enablement starts false, runtime remains absent until explicit actions; managed MCP is explicitly disabled. Auto is not activated by the root.

## Safe stop

Cancel only the owned launch job with its tracked job id (normal SIGTERM), or send SIGTERM only to the exact recorded, identity-verified exec host PID. Do not use pkill, killall, process-name matching, an inferred listener PID, or the main GUI PID. Stock CLI disposes its root on SIGINT/SIGTERM. Collect the job result and verify that its chosen loopback listener has gone away before cleanup. Keep the private run directory until process exit is confirmed; do not recursively delete a computed path without independently resolving and checking it. Never reuse the temporary profile.

## Limits / lead's gate

This is a statically supported launch candidate, not verified live readiness or browser acceptance. The lead must observe successful stock readiness, the actual chosen loopback bind, and Majed's actual native client inclusion before claiming acceptance. Do not chat, sign in, enable runtime/MCP, install plugins, send feedback, or use network tools during presentation checks. There is no OS-enforced egress sandbox in this script: listener loopback is inbound protection, not an outbound firewall. If the acceptance requires an absolute egress guarantee rather than these documented configuration controls, stop and use a separately approved OS sandbox or separately approved controlled acceptance in the existing UI. Do not add interception or research indefinitely.

Extracted adjacent files are public packaged code/docs only, retained as line-addressable static evidence. No credentials were extracted. No source production files were modified; no commit made.
