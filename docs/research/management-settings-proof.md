# Partial native Settings client proof

T02A / #4 evidence only. This does not complete the ticket or authorize dependent runtime activation.

## Reproduction

Set `DSH_PROBE_NODE` to the installed ASAR-capable Electron executable and `DSH_PROBE_RUNTIME` to its DSH runtime root, then run `node scripts/test-management-settings.mjs`. The runner uses a disposable, canonical temporary HOME and a minimal environment; no operational API, browser or user state is accessed. Both `--red-selection` and `--red-disposal` must exit nonzero at their named assertions.

Verified 2026-10-23 on runtime 0.2.1-rc.2 / Electron Node v24.21.0: five assertion groups passed. Both negative controls exited 1 at `native-section-selection` and `withdrawn-section-disposal` respectively.

## Actual execution and boundaries

The fixture evaluates the unmodified public client bundles for `@deepseek-ai/dsh-client-ui-settings` and `@deepseek-ai/dsh-client-ui-settings-general` in VM contexts without Node, network, timers or dynamic imports. It invokes their exported `apply` functions. It checks served-namespace registration, native navigation selecting contributed content, withdrawal selecting the remaining General row, watcher disposal, and captured cleanup.

SHA256 bundle identities:

- Settings: `0555eec2df1ca392a1167e637f287ac9963dbd2b0a230089c2a41be079c490e3`.
- General shell: `8c99a9d9f91b606a6454d09c6c7496b2c252e0c6bed035ce1a33647c0b1f43b8`.

The preserved worker draft initially failed because the store double lacked `update`; the double was corrected against native `ConfigFormController.derive`. General form content is deliberately omitted from the element evaluator, because its separately injected editors are outside the contributed-section seam. General navigation and fallback selection remain asserted; General editors are not tested.

## Native mount follow-up (2026-10-24)

The installed runtime does not expose React, the client store or SlotCore as independently resolvable packages. They are singleton seeds compiled into the web shell; extracting its private minified seed factory is not an accepted extension seam. The installed renderer client does export `apply`, which installs the real SlotRegistry and exposes `ctx.uiRenderer.mount(container)` through its public service. Matching public test dependencies are therefore the next isolated mounting path, rather than expanding the existing doubles.

Public registry metadata confirms `@deepseek-ai/dsh-client-test-runtime@0.2.1-rc.2` and `@deepseek-ai/dsh-client-ui-slots@0.2.1-rc.2` exist. This is dependency availability, not mounted proof. Dependency retrieval is confined to workspace-owned test scratch with lifecycle scripts disabled; no installed DSH package or profile is changed. A separate [mounted fixture and report](management-mounted-settings-proof.md) now demonstrates the real ReactDOM/SlotCore lifecycle in jsdom. It supplements this earlier synthetic-tree proof; it does not establish browser, visual or production Manager acceptance.

SSR is not a supported shortcut for this unchanged renderer: its external-store hooks omit server snapshots. Replacing those hooks or extracting private shell locals would conceal the remaining mounting obligation rather than satisfy it.

## Explicit non-claims

This is synthetic element-tree evaluation, not mounted React, browser rendering, SSR, visual compatibility, focus behavior, CSS or real network admission. Slot ledger, stores, Cordis service binding, hooks, portals and primitives are explicit doubles. No native SlotCore lifecycle, host persistence, authenticated project scope, paired remote carrier or actual Manager implementation is established. Production Settings acceptance remains open and must be tested together with real Manager operations and the supported client carrier.
