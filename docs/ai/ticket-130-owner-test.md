# Ticket #130 Owner acceptance kit

## Candidate

- Package: `/tmp/majed-t130/dsh-majed-0.2.0.tgz`.
- SHA-256: `35399653430949d30f863cedc7f4927d1023c9dec7b54ae0db6d8cd7bb27226a`.
- Reviewed integration: `3c2e988`; state documentation: `3a29811`.
- Preparation only: this kit does not install, restart, switch providers or change accounts.
- Controlled evidence: classifier 166/166, Node 406/406, reproducible build, independent final review without P1/P2 blockers. Live acceptance remains open.

## Safety and baseline

Record existing values locally before editing; do not send credentials, cookies, authorization callbacks or account identifiers to the agent. Use the existing Majed Codex account; do not log out or spend a reset credit. Keep reference and Majed subscriptions mutually exclusive during provider tests. Wait for running sessions to finish before toggling either component. Installation requires separate approval, a package backup and a full DSH restart (host changes). No manual profile edits or reset is required.

For every case record PASS / FAIL / NOT TESTED, the visible result and an optional screenshot with personal identifiers obscured. Restore baseline values after each group. Cosmetic differences can wait for the final spec pass; absent or ineffective controls cannot.

## Test data

| Field | Temporary value | Restore |
|---|---|---|
| Subscription display name | Majed Codex QA | Original value or default |
| Account alias | QA-Primary | Original alias or blank |
| Model display name | QA-Model-A | Original value or default |
| Model filter | codex | Clear filter |
| Reasoning effort | One value actually advertised in the dropdown | Original/default |
| Context window | Use the actual displayed default and maximum, never a fabricated model limit | Original/default |
| Subagent default speed | Standard, then Fast only if offered | Original/default |
| Fake proxy URL | http://127.0.0.1:1 | Never save enabled; cancel |
| Fake proxy username | qa-user | Cancel |
| Fake proxy password | QA_ONLY_NOT_A_REAL_SECRET_130 | Cancel |
| Proxy bypass | localhost, 127.0.0.1 | Cancel |

The fake proxy is deliberately not a working service. Its test should fail clearly; this proves failure handling only, NOT successful proxy routing. Do not use a public random proxy. A successful routing test requires your own trusted proxy, entered locally without sharing credentials.

## Cases

1. **Open/reopen:** Settings → Subscriptions (Majed) → Codex → Manage. Expect actual Manage controls, model editor and Proxy Configure; no crash or blank panel. Reopen after cancel.
2. **Names:** save `Majed Codex QA` and `QA-Primary`. Expect heading/account alias and picker presentation to update, with the same underlying account. Reload and confirm persistence; restore originals.
3. **Pool membership:** with one account, disable its pool membership, save and reopen; then restore. Verify independent picker entry separately. Do not claim failover from a single account. With two already-authorized accounts, test one independent entry and pool membership/allowlist without logging out either account.
4. **Pool model allowlist:** use an existing listed model. Test automatic/all/some, deselect one model in some mode, save/reopen and check intended pool inclusion. Restore baseline. Never hide every usable model without a recovery selection.
5. **Model editor:** filter `codex`; exercise select none/all in the draft then Cancel and verify no saved change. Rename one existing model `QA-Model-A`, select one advertised reasoning value, save/reopen and confirm. Restore. Any partial-save error must retain remaining draft and report what succeeded; do not manufacture a network outage in an active host.
6. **Context bounds:** enter displayed maximum + 1 in the draft; expect clear validation and draft retention, not a silently different effective limit. Cancel invalid draft. Save displayed default or a valid in-range value, reopen, then reset to original. If bounds are not advertised, record NOT TESTED rather than guessing.
7. **Subagent speed:** where offered for a fast-capable model, save Standard then Fast and verify persistence, then restore. Main-session speed must not change. A real subagent inference test is separate optional consumption; persistence alone is not runtime proof.
8. **Tool policy:** note original switches. Toggle a supported Codex tool off, save, create a new session and inspect tool availability without invoking it. An existing session keeps its creation-time image-tool policy; web-search live policy follows the documented reference behavior. Re-enable and inspect a new session. Do not generate an image or invoke search merely to test a switch.
9. **Proxy failure without saving:** Configure; enter the fake values above and enable only the DRAFT. Test should report a bounded failure while retaining the draft. Cancel; reopen and confirm saved config is unchanged. If the input appears in an error, fake password must not be visible. Disable/Cancel rather than saving a broken proxy.
10. **Proxy success (trusted proxy only):** if you already own a trusted HTTP/HTTPS proxy, enter it locally and Test before saving. Expect status and latency, accurate direct-vs-proxy result, and no password in messages. Save/reopen: password field remains empty while password-set status is preserved. Test without retyping uses saved credentials. Test Clear Password only if you can safely restore the password locally; restore baseline proxy afterward. Without a trusted proxy record NOT TESTED, not PASS.
11. **Cancel/reopen:** start a proxy test using fake unreachable settings, cancel then reopen and edit another draft. Late results must not close or alter the new dialog. Cancel the draft.
12. **Arabic/RTL:** switch UI language to Arabic, inspect all three dialogs and validation messages, keyboard focus and mixed model identifiers. Restore language. Do not treat translated key names or missing controls as cosmetics.
13. **Sanity and return:** after restoring all QA changes, send one small Codex prompt only with your approval and confirm response. In a safe idle window switch back to the reference and verify its accounts/settings remain intact. Switch to whichever component you want to keep active.

## Acceptance record template

Case: __ / Result: PASS | FAIL | NOT TESTED
Expected: __
Observed (no secrets): __
Baseline restored: YES | NO

Required decision before closing #130: distinguish verified cases from unavailable trusted-proxy/multi-account/runtime cases. An Owner can explicitly accept or defer a gap; the agent must not silently mark it passed.
