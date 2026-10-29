# Ticket #128 verification

Date: 2026-10-29. Controlled fixture/static evidence only; no real DSH execution, installation, switch, restart or account access performed.

## Work contract

Approved bounded outcome: GitHub #128, Component row and empty Subscriptions section. Only this worktree may be written, plus the requested /tmp/majed-t128 tarball. Seams: host exact probe RPC, browser registered/rendered section, packed artifact and reproducible build. Investigation budget: two failed diagnostic attempts or 20 minutes per blocker. Stop at #128 delivery; #129-#137 require Owner acceptance first. The implementation skill is not available in this session's catalog; lean-build, karpathy-guidelines and TDD supply the bounded fallback. Review is direct because nested delegation is unavailable.

## Spec Further Notes

### GitHub-installed subpath resolution

**statically supported (evidence: package exports and DSH package-based row resolution); unproven, needs live check.**

- Installed third-party example read: /Users/majedsiefalnasr/.dsh/profiles/desktop/node_modules/billion-context/package.json:7-15 exports both the root and dsh-compaction-gate subpath. This supports the component pattern, not GitHub installation specifically.
- /tmp/dsh-asar/dsh/node_modules/@deepseek-ai/dsh-plugin-manager/lib/index.js:2166-2200 reads inserted rows and resolves metadata using their module names. Source provenance: existing read-only extraction of app.asar; the literal app.asar/dsh path is not a normal readable directory on this host.
- Package test checks exported host, icon and both metadata locale targets are included by npm pack. Built artifacts are committed, no prepare/install build is required.
- Owner check: install the supplied tarball in the intended profile only after approval; subsequently test the GitHub branch/commit installation method. Open Plugins > Majed and confirm both component rows and localized Subscriptions title/description/icon, then enable Subscriptions and inspect its probe. A local tarball does not prove GitHub transport.

### In-place update adds rows without restart

**statically supported (evidence: HMR reconcile path); unproven, needs live check.**

- /tmp/dsh-asar/dsh/node_modules/@deepseek-ai/dsh-plugin-manager/lib/index.js:2355-2371 calls hmr.reconcileProfile; 2398 emits plugin-manager/changed. declaredRows at 2166-2200 re-reads bundle patch files. Research doc sections 2 and 4 explain fiber disposal and metadata discovery.
- Owner check: on an existing 0.2.0 installation with core on, update in place to this artifact through the supported plugin update path. Without restarting, reopen Plugins > Majed and verify the new disabled row appears; enable/disable it, and confirm Settings appears/disappears within the presence poll interval, with core preferences/fonts still working. If DSH reports restart-required, record it rather than treating static support as proof.

### Third-party browser access to API-provider remotes

**statically supported (evidence: generated browser descriptors); unproven, needs live check before #136.**

- /tmp/dsh-asar/dsh/node_modules/@deepseek-ai/dsh-api-remotes/lib/types/client/index.js:7-40 includes settingsControllerRemote and llmRemote in the client remote composition.
- /tmp/dsh-asar/dsh/node_modules/@deepseek-ai/dsh-api-remotes/lib/client.js:3023-3244 defines credentials/describe,set,unset and settings/describe,mutate; 7439-7571 defines llm/discoverModels and listConfigurableProviders. Descriptors show a browser API, not proof of a third-party grant.
- This ticket deliberately does not inject these remotes or call account/key/settings APIs.
- Owner check for #136: from an authenticated Owner session with the third-party client dependency injected, call read-only settings.describe and llm.listConfigurableProviders. Confirm no extra grant failure. Do not expose credential contents or use writes as a permissions probe. Stop for a decision if access fails.

## Authentication and lifecycle evidence

- /tmp/dsh-asar/dsh/node_modules/@deepseek-ai/dsh-client-connection/lib/index.js:736-750 applies Host/Origin and authenticated Peer checks; 826-835 additionally rejects a non-Owner exact route with 403. The component uses connection.fetch.register, not a raw public web route.
- Reference /tmp/upstream-0.9.12/src/auth/rpc.ts:275-310 and 636-672 supplies the compatible envelope and exact route registration recipe.
- Client connection at /tmp/dsh-asar/dsh/node_modules/@deepseek-ai/dsh-client-connection/lib/client.node.js:329-339 exposes missing route as the exact HTTP 404 error string; 542-549 exposes state subscription.
- A generic failure before any successful presence confirmation leaves the section hidden: absence and an unreachable never-observed component cannot be distinguished safely. After confirmed presence, failures show a clear localized alert until recovery or a definitive route-absent response.
- Row switches need not reconnect. Presence is reconciled on load, connected state changes and every three seconds. All timers/listeners/section registrations are disposed with the browser half; stale responses are ignored.

## Build and design

TypeScript host output and tsdown browser closure output live in committed dist/. dist/client.js embeds the Subscriptions closure inside the unchanged core loader factory, so there is exactly one ModuleLoader registration and no second browser half, dynamic import or custom loader-table entry. client.js has one new apply call. Root host index.js remains unchanged.

Version remains 0.2.0: component exports do not require a version change. The tarball filename is therefore dsh-majed-0.2.0.tgz. The empty text section uses the native settings.section slot and DSH token-based typography/colors with logical alignment/borders/padding; no new controls or hard-coded colors/font sizes are introduced.

The baseline classifier suite referenced a missing lib/classify.cjs. A test-only adapter extracts the unchanged embedded classifier into that ignored path before running its existing 166 assertions. No classifier behavior or existing test was changed.

## Residual acceptance

Controlled tests cannot establish desktop HMR, remote authentication cookies, actual browser RTL rendering, actual UI module injection or installed 0.2.0 parity. Owner live acceptance remains required and issue #128 is left open. No push, installed plugin modification, profile write or secret access performed.
