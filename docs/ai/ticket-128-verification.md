# Ticket #128 verification

Date: 2026-10-29. Agent evidence is controlled fixture/static only; no real DSH execution, installation, switch, restart or account access performed by the agent. Owner live findings are attributed separately below.

## Work contract

Approved bounded outcome: GitHub #128, Component row and empty Subscriptions section. Only this worktree may be written, plus the requested /tmp/majed-t128b tarball. Seams: host exact probe RPC, browser registered/rendered section, packed artifact and reproducible build. Investigation budget: two failed diagnostic attempts or 20 minutes per blocker. Stop at #128 delivery; #129-#137 require Owner acceptance first. The implementation skill is not available in this session's catalog; lean-build, karpathy-guidelines and TDD supply the bounded fallback. Review is direct because nested delegation is unavailable.

## Spec Further Notes

### GitHub-installed subpath resolution

**UNPROVEN - Owner live check required for #128 acceptance**

Static package exports and DSH package-based row resolution support the pattern, not live GitHub installation.

- Installed third-party example read: /Users/majedsiefalnasr/.dsh/profiles/desktop/node_modules/billion-context/package.json:7-15 exports both the root and dsh-compaction-gate subpath. This supports the component pattern, not GitHub installation specifically.
- /tmp/dsh-asar/dsh/node_modules/@deepseek-ai/dsh-plugin-manager/lib/index.js:2166-2200 reads inserted rows and resolves metadata using their module names. Source provenance: existing read-only extraction of app.asar; the literal app.asar/dsh path is not a normal readable directory on this host.
- Package test checks exported host, icon and both metadata locale targets are included by npm pack. Built artifacts are committed, no prepare/install build is required.
- Owner check: install the supplied tarball in the intended profile only after approval; subsequently test the GitHub branch/commit installation method. Open Plugins > Majed and confirm both component rows and localized Subscriptions title/description/icon, then enable Subscriptions and inspect its probe. A local tarball does not prove GitHub transport.

### In-place update adds rows without restart

**OWNER-VERIFIED FALSE (2026-10-29): new component rows appear only after a full DSH restart.**

The Owner installed the candidate on real DSH and verified that in-place row discovery without restart does not work. Static HMR reconciliation evidence did not establish live discovery and is superseded by this result. Fully restart DSH after installing or updating. Subsequent component switches still use the browser presence poll; this is distinct from discovering a newly installed row.

### Third-party browser access to API-provider remotes

**UNPROVEN - deferred by the spec to #136, which must prove it or stop for a decision**

Generated browser descriptors are static evidence only, not proof of third-party access.

- /tmp/dsh-asar/dsh/node_modules/@deepseek-ai/dsh-api-remotes/lib/types/client/index.js:7-40 includes settingsControllerRemote and llmRemote in the client remote composition.
- /tmp/dsh-asar/dsh/node_modules/@deepseek-ai/dsh-api-remotes/lib/client.js:3023-3244 defines credentials/describe,set,unset and settings/describe,mutate; 7439-7571 defines llm/discoverModels and listConfigurableProviders. Descriptors show a browser API, not proof of a third-party grant.
- This ticket deliberately does not inject these remotes or call account/key/settings APIs.
- Owner check for #136: from an authenticated Owner session with the third-party client dependency injected, call read-only settings.describe and llm.listConfigurableProviders. Confirm no extra grant failure. Do not expose credential contents or use writes as a permissions probe. Stop for a decision if access fails.

## Authentication and lifecycle evidence

- /tmp/dsh-asar/dsh/node_modules/@deepseek-ai/dsh-client-connection/lib/index.js:736-750 applies Host/Origin and authenticated Peer checks; 826-835 additionally rejects a non-Owner exact route with 403. The component uses connection.fetch.register, not a raw public web route.
- Reference /tmp/upstream-0.9.12/src/auth/rpc.ts:275-310 and 636-672 supplies the compatible envelope and exact route registration recipe.
- Client connection at /tmp/dsh-asar/dsh/node_modules/@deepseek-ai/dsh-client-connection/lib/client.node.js:329-339 exposes missing route as the exact HTTP 404 error string; 542-549 exposes state subscription.
- Only the probe route's HTTP 404 means OFF: the section is absent/unregistered. Every other failure (transport error, timeout, 5xx or malformed body), including the first probe before any confirmed presence, registers the section and shows the localized cannot-reach alert. A later successful probe restores the two parts without the alert; a later 404 removes the section.
- Subscriptions setup runs last in the assembled core entry and catches synchronous and asynchronous errors with the `dsh-majed: Subscriptions` console.error prefix. Injection callbacks, primitive resolution, locale/effect registration and the apply call are isolated. The assembled-entry fixture forces these failures and checks that all 11 core slot registrations and core effects still register; it does not establish installed runtime parity.
- Row switches need not reconnect. Presence is reconciled on load, connected state changes and every three seconds. All timers/listeners/section registrations are disposed with the browser half; stale responses are ignored.

## Build and design

TypeScript host output and tsdown browser closure output live in committed dist/. dist/client.js embeds the Subscriptions closure inside the unchanged core loader factory, so there is exactly one ModuleLoader registration and no second browser half, dynamic import or custom loader-table entry. client.js has one new apply call. Root host index.js remains unchanged.

Version remains 0.2.0: component exports do not require a version change. The tarball filename is therefore dsh-majed-0.2.0.tgz. The empty text section uses the native settings.section slot and DSH token-based typography/colors with logical alignment/borders/padding; no new controls or hard-coded colors/font sizes are introduced.

The baseline classifier suite referenced a missing lib/classify.cjs. A test-only adapter extracts the unchanged embedded classifier into that ignored path before running its existing 166 assertions. No classifier behavior or existing test was changed.

## Residual acceptance

Controlled tests cannot establish desktop HMR, remote authentication cookies, actual browser RTL rendering, actual UI module injection or installed 0.2.0 parity. #128 is acceptance-ready only after the Owner's live check of GitHub-installed subpath resolution using the exact steps above; in-place row discovery is now Owner-verified false, so installation/update requires restart, alongside the remaining installed acceptance scenario. Owner live acceptance remains required and issue #128 is left open. No push, installed plugin modification, profile write or secret access performed.

## Owner live correction pass (2026-10-29)

Bounded contract: fix only the Settings collision, conditional localized coexistence notice, restart documentation and owned-global-id rule/audit. Baseline ba9f02d, branch impl/128-component; writes only this worktree and /tmp/majed-t128b. Same investigation cap; no scope expansion or installed changes. The unavailable /implement route is replaced by direct surgical-patch and regression-first proof; nested review delegation is unavailable.

- Owner reported the reference registers `settings.section` id `subscriptions`, causing duplicate registration. Our id is now `majed-subscriptions`, order 90 unchanged. Settings navigation uses "Subscriptions (Majed)" / "الاشتراكات (Majed)". Component metadata remains "Subscriptions" / "الاشتراكات" because its row is already under Majed, not the colliding Settings navigation.
- Detection uses `connection.rpc.call('/api', 'subscriptions-auth.proxyGet', {})`. Reference v0.9.12: /tmp/upstream-0.9.12/src/auth/rpc.ts:603-605 delegates only to proxy.get; /tmp/upstream-0.9.12/src/index.ts:1264 wires proxyGetConfig; /tmp/upstream-0.9.12/src/http.ts:274-318,354-363 loads existing local config once and returns a sanitized view, without login, persistence or network testing. The getter may initialize its in-memory proxy agent, but performs no configuration write. It avoids the account/model work in status/speed. No payload value is retained, displayed or logged.
- Only `ok: true` shows the role=status notice above both parts. Missing-route 404 is absent; every other failure/malformed result is unknown, also hiding the notice without blocking our section. Both probes share the three-second cadence, reconnect, sequence and disposal guards. The notice inherits DSH typography/color tokens and logical alignment; no new CSS or physical properties.
- Audited all src files: browser.ts settings slot entry, locale namespace `majed.subscriptions`, effects `dsh-majed: subscriptions dictionaries` and `dsh-majed: subscriptions presence`; subscriptions.ts route/method `majed-subscriptions.status` and effect `dsh-majed: subscriptions presence route`. Only the section id needed correction. No storage directory, owned CSS/data attribute or provider registration exists in src. `settings.section`, `/api`, dependency names and the reference route are public/foreign namespaces consumed, not owned ids; `subscriptions` response marker and React part keys are local data, not global registrations. GLOSSARY.md and ADRs are unchanged; ADR-0002 remains solely the deliberate shared-provider-id exception.
- Regression-first run failed on the old section id and missing notice. Focused tests cover en/ar, default 404, success, later 404, transport/503/malformed/ok:false, duplicate registrations, reconnect and stale/disposed reference replies. Static namespace regression covers the current literal registration forms, not arbitrary future syntax.

### Final controlled gates

- `npm test`: `166/166 passed`; node test runner final lines: `tests 24`, `pass 24`, `fail 0` (19 browser/audit tests, 3 host tests, 2 package/build tests).
- `npm run check:build`: `Committed output matches a fresh build.` Built output is included in the fix commit; version remains 0.2.0.
- Initial npm pack hit EPERM on the existing npm cache; the Owner-provided `npm_config_cache=/tmp/npm-cache-majed` fallback succeeded. `npm pack --pack-destination /tmp/majed-t128b`: `/tmp/majed-t128b/dsh-majed-0.2.0.tgz`, 46 files (npm total and `tar -tzf | wc -l` agree), shasum `f7d86a636a2d1b1f021efc6916dfbbc5bc0e3538`.
- Direct review against ba9f02d plus the working diff (independent parallel review unavailable at this delegation depth): Standards — no remaining findings against AGENTS, scope control and existing token/logical-property style; Spec — no remaining findings against these four Owner corrections and story 6. Public slot/connection seams only; reference probe has no write/login/test call, original core source and host route unchanged. `git diff --check` passes. This is direct review, not independent acceptance.
- Agent cannot verify the corrected candidate on real DSH: simultaneous live Settings entries, actual localized navigation/RTL rendering, reference toggling and existing core parity still need Owner acceptance after restart. GitHub-installed subpath resolution remains unproven; third-party API remotes remain deferred to #136. No merge or push.
