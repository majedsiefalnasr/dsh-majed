# E08 public notification contract — bounded research stop

Date: 2026-10-28. **No supported host contract established in this run; absence of a contract is not proved. No implementation, scope reduction, acceptance, or merger is authorized by this report.**

## Work contract and execution record

- Approved outcome: investigate a supported public host contract for plugin-owned persistent/system notifications on a connected mobile browser, including reliable navigation to the actual target session. Preserve full E08 scope. Closed-page delivery is expressly not required.
- Allowed write: this report only. Product/candidate/installed source is read-only. No installed DSH/configuration/operational changes, account tests, login/pairing, provider/product probes, new servers, host patches, commits, pushes, tracker mutations, or delegation.
- Route: direct research on the supplied `codex/gpt-6.1-sol` route. Ambiguous native ownership warrants the Owner's known-working stronger route. OpenCode free routes remain excluded after the previously supplied shared-quota `429 FreeUsageLimitError`; no fresh availability/price ranking or route probe was performed. Loaded `research` and `find-docs`; the research skill's background-agent step was overridden by the explicit no-delegation instruction.
- Budget: renewed allowance of at most two failed diagnostic attempts or 20 minutes, whichever comes first. Previous failures are historical, not charged again: virtual ASAR traversal `Not a directory (os error 20)` and a guessed package file missing. Neither was repeated.
- Clock: research began **2026-10-28T17:35:09Z**, confirmed with `pwd` and UTC clock. Diagnostic stop recorded **2026-10-28T17:36:03Z**: **54 seconds elapsed; two failed checks**. Subsequent activity was limited to completing required context/specification reading and reporting, not renewed contract discovery. Report readback/completion clock: **2026-10-28T17:37:26Z**, **2 minutes 17 seconds total elapsed** through that check.
- The mandated entry reads were completed: [AGENTS.md](../../AGENTS.md), [scope control](../ai/rules/scope-control.md), [execution policy](../ai/rules/execution-policy.md), and the relevant current checkpoint in [current work](../ai/current-work.md#L13-L31). This report does not modify current work because the direct request permits only this file.

## Failed-check ledger and stop reason

1. Discovery of possible existing temporary extracts used `glob` at `/tmp` with pattern `*dsh*`. It failed with `glob search failed (exit 2)` because traversal encountered `/tmp/devio_semaphore_logi_hpp_OptionsPlus_A7D4B139-F9F9-44A6-9F5D-7BC0A9B8B80F`: `Permission denied (os error 13)`. This is an environmental discovery failure, not evidence that no extract exists. No retry or alternate temporary-directory traversal was performed.
2. Library-first documentation lookup used `npx ctx7@latest library "MDN Web Docs" "ServiceWorkerRegistration showNotification notificationclick secure context mobile Notification constructor"`. It exited **1** before retrieving documentation: npm reported `code EPERM`, `syscall open`, and `errno EPERM` under `/Users/majedsiefalnasr/.npm/_cacache/tmp/`, with the explanation `Your cache folder contains root-owned files`. This was **not a Context7 quota error**. No cache repair, ownership change, credential/configuration change, alternate cache, escalation, or CLI retry was attempted.

The second failure exhausted the renewed budget. No ASAR extraction, bundled host/service-worker source read, public declaration inspection, browser inspection, or alternative transport lookup followed. The failed Context7 fetch supplies no external API evidence. Existing documentation claims below are explicitly attributed as historical evidence, not independently revalidated browser-platform facts.

## Primary specification: what is and is not required

Read directly from [the approved current-scope specification](../current-scope-specification-2026-10-28.md):

- **User Stories 22–24**, physically at lines **53–55**, require per-device Off/background-only/Always with separate completion/intervention controls; explicit permission/test state, target-session navigation and in-app fallback; private content and OS-respecting sound. Lines 22–24 physically belong to the solution section, not these story numbers; neither location states universal mobile system delivery.
- Line **194** requires profile-local independent reset without requesting OS permission or disturbing unrelated state.
- Line **195** requires interface/event deduplication during continuous connection, independent devices, foreground silence, OS-governed background sound, private system content/title opt-in, actual-session navigation and honest permission/fallback reporting. It explicitly states **“No closed-page mobile-delivery promise.”**
- Lines **270–274** distinguish the production consumer from adapters and require real browser/OS evidence for notification delivery. Lines **281–282** retain relevant touch/platform/local/paired scenarios and exact artifact/environment evidence.
- Lines **24–26**, **182**, **185**, and **287** require public seams, explicit evidence/disposition for gaps, and prohibit host patching/reference runtime dependencies.

**Critical interpretation:** the specification explicitly permits in-app fallback and truthful platform limitations. A system notification failing on a genuinely unsupported/denied/insecure platform is not by itself an implementation defect. Conversely, constructor-plus-fallback tests do not prove that all relevant connected-mobile platforms lack a supported system path. The absence of a closed-page promise does not erase connected-mobile scope, but it also does not invent mandatory persistent delivery on every mobile browser. Whether a removed service-worker branch represents a real implementation gap depends on an admitted, owned, supported contract—not merely on the branch's previous existence.

## Existing candidate and review evidence (attributed, not retested)

Owner-supplied candidate pin: `74471eabe89739f73d04269f45cdeadf1568eb7b`; original integration pin: `f6a4159a79d52a5ac3bcd7e7dedc670366c2868b`. Neither Git object nor candidate client was independently inspected in this capped run; no exact-code claim is attributed to those pins here.

The read candidate [E08 development report](../../../dsh-majed-e08/docs/research/e08-notifications-2026-10-28.md#L19-L24) says constructor `onclick` and in-app navigation use injected `uiWorkspace.openSession(sessionId)` through controlled adapters. Its [public-seam section](../../../dsh-majed-e08/docs/research/e08-notifications-2026-10-28.md#L58-L73) says no supported persistent click contract was established and live native navigation is not independently proven. Its historical description names `navigator.serviceWorker.getRegistration()`/`showNotification`; the current task describes the original branch as `navigator.serviceWorker.ready`/`showNotification`. This discrepancy was not resolved by reading the pinned client and must not be smoothed into an exact original implementation claim.

The integration [review checkpoint](e08-review-2026-10-28.md#L19-L25) flags connected-mobile reduction and independent missing browser/OS/native acceptance. That is a review finding requiring reconciliation, not proof of a public host API or a blanket mandate for persistent mobile delivery. The candidate report's “UNAPPROVED capability reduction” wording records that review disposition; this research does not independently establish a universal platform obligation.

Historical MDN links recorded in the candidate report: [showNotification source](https://github.com/mdn/content/blob/main/files/en-us/web/api/serviceworkerregistration/shownotification/index.md) and [notificationclick source](https://github.com/mdn/content/blob/main/files/en-us/web/api/serviceworkerglobalscope/notificationclick_event/index.md). They were not fetched here, are unpinned `main` links, and do not establish host admission or plugin authority. No new external API claim rests on memory.

## Public-contract evidence and minimum missing proof

A successful real-path glob under `/Users/majedsiefalnasr/.dsh/profiles/desktop/node_modules` located source files, including `dsh-plugin/src/client/logic/ensure-plugin-css.ts` and `@linxin666/dsh-remote-web-ui/src/client/plugin-card-seat.ts`. A filename search under its `@deepseek-ai` directory returned no matching notification filename. These are discovery results only: no discovered file was read before the cap. They establish neither a usable notification API nor absence of one. A reference plugin is not a required runtime companion, and installed SDK artifacts are not automatically publicly admitted extension contracts.

The requested minimum contract remains **unestablished** at every critical ownership boundary:

| Boundary | Evidence needed before claiming a supported path | This run |
| --- | --- | --- |
| Public admission/API ownership | Public declaration/documentation and exact version proving third-party plugin access | Not established |
| Registration authority | Who registers/owns the worker; permitted URL, origin and scope; whether plugin usage is explicitly supported | Not established |
| Connected notification transport | Supported API/message shape and admission, permission/error semantics, lifecycle/disposal ownership | Not established |
| Worker click/message transport | Supported handler or host dispatch carrying an unambiguous target/session identity | Not established |
| Session navigation | Public session-opening capability and actual target resolution from the click context, not merely an injected test adapter | Not established |
| Remote/mobile restrictions | Applicable secure-context/origin/permission/browser constraints and truthful unsupported behavior | Not established |

These rows are proof obligations, **not proposed API names or a workaround design**. No authority to borrow any existing registration is inferred. No internal SDK artifact was promoted to public API. No true supported alternative was found within the budget; that is not a finding that none exists.

## Outcome, acceptance and smallest decision

**Outcome: no established public contract; investigation stopped at the renewed failure cap.** Full E08 scope remains unchanged. No candidate/product/host file was changed, no delivery tested, and no acceptance or merger recommended.

Unsolved acceptance remains: admitted public registration/show/click/navigation ownership; determining a genuine connected-mobile implementation gap versus specification-permitted unsupported-platform fallback; actual native lifecycle/navigation; real permission/delivery/silence/background sound/privacy behavior; and local/paired/mobile outcomes. Controlled fixture totals recorded elsewhere do not close these obligations.

Concrete question for Lead/Owner: **Can the host maintainer supply the versioned public registration + notification-click + session-navigation contract, or explicitly confirm that none is admitted for plugins on connected mobile clients?** Such evidence would distinguish implementation work from allowed platform fallback. Otherwise choose an explicit disposition of the unresolved requirement, or renew a tightly scoped source-only budget with a specific readable source location and a viable documentation route. Neither this stop nor a previous branch's existence authorizes borrowing a worker, host changes, silent reduced scope, or another lookup workaround.
