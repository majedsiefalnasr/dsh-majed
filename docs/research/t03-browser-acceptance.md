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

Owner-approved amendment on 2026-10-24: use risk-based representative coverage,
not the previously written exhaustive Cartesian product. The Owner explicitly
retained authenticated local verification and all security boundaries. Issue #8's
required dimensions remain; only redundant multiplication of every dimension across
every section is removed. No operational or reference-removal gate changes.

Exercise the actual native Settings dialog in both authenticated local desktop and
paired remote contexts. Across the recorded cases cover all five sections, English
and Arabic RTL, light and dark appearance, UI font sizes 14 and 18, and a narrow
remote viewport. Record the exact dimensions and section(s) of each case; never
attribute one screenshot to unobserved combinations. Prior valid evidence remains
usable. Batch remaining cases in one session per context rather than repeatedly
checking the same working sequence.

Required representative batches:
- Authenticated local: visit all five sections; exercise readiness, Refresh and
  keyboard focus with initial states preserved; include close/reopen and opener
  focus return. This batch cannot be substituted by remote or jsdom evidence.
- Remote: preserve already recorded English/Arabic, light/dark and UI14/UI18 cases;
  complete Arabic UI18 at narrow width across all five section presentations,
  checking RTL, wrapping, control access and keyboard on a representative section.
- Lifecycle: exercise semantic modal close and focus return plus close/reopen;
  attempt section navigation during a pending check. If latency is too short to
  observe pending behavior safely, record that limit rather than claim a pass.
  Isolated lifecycle tests remain separate supporting evidence.

For each executed case, apply the relevant checks below and disclose any unexecuted
behavior. Not every behavior must be multiplied across every presentation case:

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
