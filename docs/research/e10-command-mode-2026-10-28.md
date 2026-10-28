# E10 host-owned session command mode (2026-10-28)

Ticket #90, spec stories 28 and 34. Scope: where the Ask me / Auto (safe) / Auto (aggressive) mode lives and how every interface learns it. Out of scope: the approval decision rules (E11).

## Design

- `modules/command-mode/index.js` keeps a `Map<sessionId, 'safe' | 'aggressive'>` in host memory. Absent means Ask me. Nothing is written to disk, so a restart, host disposal, a new session or a reopened session id starts at Ask me.
- One exact Fetch route, `POST /api/majed/command-mode` (`snapshot`, `set`), registered through `owner.connection.fetch.register`. Native BrowserAuth + Owner admission happens in DSH before delivery; this repository does not use cookies, headers or loopback as authentication.
- Bounded streaming body (4096 bytes, 5 s deadline, `application/json` only, abort-aware) reuses `readMessage` from `lib/management/settings.js`. Errors expose only allow-listed codes; responses are `no-store`.
- `set` requires a live session (`owner.get('sessions').get(id)`). Every read of authority (`get`, `entries`, and therefore `snapshot`) checks liveness itself: a not-live session returns Ask me and its entry is dropped, so a closed session whose id reappears before any snapshot is still Ask me. Without the `sessions` service the route fails closed (`scope_unavailable`).
- `client.js`: the `autoApprove` mirror is memory-only, filled from the host. A bounded 5 s poll runs only while a command-mode control is mounted; every call failure replaces the mirror with Ask me. Lowering to Ask me applies locally at once, raising waits for host confirmation. The approver re-reads the host immediately before answering, so a revocation on another device wins; if a poll supersedes that re-read it is retried once, and nothing is answered unless a current host read says elevated. A failed host write leaves the displayed mode at the last host-confirmed mode and triggers a re-sync. The legacy `autoApprove` key is removed from saved settings on load; other settings are untouched.

## RED / GREEN

| Slice | RED (before code) | GREEN |
| --- | --- | --- |
| Host route | `node --test test/accepted/e10-command-mode.test.js`, exit 1, `ERR_MODULE_NOT_FOUND` for `modules/command-mode/index.js` | same command, 1/1 pass, exit 0 |
| Client reads host, ignores stale local value | 4 pass / 1 fail, exit 1: `host says ask, stale local safe is ignored` | e10 suite 10/10, exit 0 |
| Full suite after baseline-client updates | 568/579 pass with 11 failures (stale persistence assertions, fixtures with the old key, one new test ordering) | `npm test` 581/581, classifier tests included (6 `classif*` titles pass; classifier file count unchanged) |

Final: `npm run build` ok, `node --test test/accepted/e10-command-mode.test.js` 10/10, `npm test` 581 tests / 581 pass / 0 fail, `git diff --check` clean.

## Existing tests changed (narrowly)

- `test/accepted/baseline-client.test.js`: the two Auto approve tests asserted localStorage persistence of `safe`. They now use a fixture host and assert host-sourced modes, confirmation, and that the legacy key is scrubbed.
- `test/accepted/e01-preferences.test.js`, `test/accepted/e08-notifications.test.js`: removed `autoApprove: { fixture: 'safe' }` from retained-settings fixtures, because the key is now deliberately scrubbed on load.
- `lib/management/settings.js`: `readMessage` is exported for reuse; no behaviour change.

## Seams

- Repo-pattern, already used here: exact Fetch registration with native admission, `ctx.inject(['connection'])`, `owner.get('sessions')`, `owner.effect` disposal.
- First-party internals, not documented plugin APIs, and NOT used by this change: `ctx.permissionPresets`, `ctx.approval`, `approval/request`, `tools/pre-execute`, `session/disposed`. Liveness is therefore checked by lookup in `sessions`, not by a closure event.

## Limitations

- Ticket acceptance criterion 1 (a real native permission request observes the chosen mode under native guards) is UNMET and remains decision gate G2: the native approval/request and tools/pre-execute seams are first-party internals with no public contract used here. This change is partial, not a complete E10.

- The host stores the mode but does not itself answer native permission requests. The browser Auto approver still performs the answer, so a closed browser auto-approves nothing. Making a real native `approval/request` observe the host mode needs a supported server-side hook; no public contract was found and none was simulated. No accepted test mounts a native approval fixture, so that outcome is unproven (decision gate, G2).
- Aggressive confirmation is client-side `window.confirm` only, NOT server-enforced; the server accepts the mode from any admitted Owner request. This is a decision-gate item.
- Closed sessions are fenced by a liveness lookup on every read, not by a closure event; the proof is the fixture `sessions` service in `test/accepted/e10-command-mode.test.js`, not a real native session lifecycle.
- Evidence is controlled fixture evidence. Real browser, installed host and paired device are unverified; mobile testing is deferred to the Owner.

## Correction round (review fixes)

| Fix | RED | GREEN |
| --- | --- | --- |
| Reopened id fenced on read | `node --test test/accepted/e10-command-mode.test.js` exit 1: `a not-live session reads as Ask me` actual `'aggressive'` | exit 0 |
| Superseded pre-answer re-check | exit 1: `answered exactly once after the bounded re-read` actual `[]` | exit 0 (also guards that a no-longer-pending approval is not answered late) |
| Failed lowering write | exit 1: `the host still holds safe, so the control must not claim Ask me` actual `'ask'` | exit 0 |
