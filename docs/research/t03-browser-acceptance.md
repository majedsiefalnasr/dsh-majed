# T03 browser acceptance procedure

Status: **partially executed; T03 acceptance remains open**. Observed cases and
limitations are recorded in [t03-live-acceptance.md](t03-live-acceptance.md).
Automated product evidence is recorded separately in
[t03-settings-product-evidence.md](t03-settings-product-evidence.md). The remaining
matrix below is an acceptance plan, not evidence that every combination passes.

## Preconditions and authority

- Use the already verified BrowserSkill instance `cfe27991`; if disconnected, wait
  for the Owner to reconnect it. Never substitute another profile or recover tokens.
- Workspace implementation on `feat/managers` is not automatically the installed
  plugin. Record the installed candidate/version and deployment approval before
  attributing any screenshot or interaction to this implementation.
- Deployment to installed plugins and a full desktop restart require separate
  explicit approval. Do not infer either from permission to implement the project.
- Use the existing authorized DSH desktop/local and paired remote pages. Do not
  start a replacement GUI server, change pairing/security settings, or inspect
  credentials. The Owner handles login/pairing when needed.
- Preserve prior language, appearance and readiness settings and restore them after
  testing. Do not activate operational Managers, providers, accounts or commands.

## Required matrix

Exercise the actual native Settings dialog in both local desktop and paired remote
contexts, with English and Arabic, light and dark appearance, and UI font sizes 14
and 18. Include a narrow remote viewport in addition to normal desktop width.
Record each combination explicitly; one screenshot does not cover the matrix.

For every combination:

1. Open Settings and select each of the five Majed readiness sections. Check that
   translated navigation labels and descriptions appear without raw locale keys.
2. Verify inherited typography and native control appearance. Check Arabic text
   direction and logical alignment visually, including mixed Latin `MCP` text.
3. Navigate with Tab and Shift+Tab. Verify visible focus, reachable refresh/toggle
   controls, keyboard activation, and correct focus return when the modal closes.
4. Check wrapping, horizontal overflow, modal scrolling and bottom-control access,
   especially at size 18 and narrow width. Do not infer geometry from jsdom tests.
5. Toggle one inert readiness module; verify returned status, independent status of
   another module and retained existing Majed preferences. Explain that readiness
   is host-shared and process-lifetime, not operational feature enablement.
6. Refresh, close and reopen Settings, then navigate between sections during a
   pending check. Look for stale results, stuck busy states or detached UI errors.

## Failure and lifecycle checks

Unauthorized/CSRF/scope/body/method rejection is covered by the isolated exact-host
product test. Do not log out, revoke a device, edit cookies, or modify installed
security policy merely to reproduce those controls in the live browser. Any live
negative test requiring an operational change needs its own approved setup.

Where safely reproducible without a security change, confirm transport failure
produces actionable text and allows retry. Do not claim coverage for unavailable
failure cases. A restart reset check is performed only during an approved restart,
not by restarting the host autonomously.

## Evidence and disposition

For each executed case, record candidate identity, local/remote context, locale,
theme, UI font size, viewport, observed result, screenshot reference when useful,
and any deviation. Avoid page content containing secrets or unrelated user data.
Record restoration of prior settings and close the owned Agent Window afterward.

T03 / #8 remains open until its required visual contract is evidenced. Final live
cutover acceptance remains governed by its own tickets and operational permissions;
passing this procedure does not authorize Reference removal or provider use.
