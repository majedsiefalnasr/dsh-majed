# Bounded real-mounted Settings proof

T02A / #4 follow-up, verified 2026-10-24. This closes the earlier synthetic-tree mount gap only. It does not complete Manager acceptance or authorize production activation.

## Reproduce

Use a test-only directory outside the checkout (the verified directory was `../dsh-mounted-settings-deps`). No production package manifest, lock, npm configuration, installed plugin or operational state is changed. Install with lifecycle scripts disabled:

```sh
npm install --prefix ../dsh-mounted-settings-deps --cache ../dsh-mounted-settings-deps/npm-cache \
  --ignore-scripts --no-save --no-package-lock \
  @deepseek-ai/dsh-client-test-runtime@0.2.1-rc.2 \
  @deepseek-ai/dsh-client-ui-slots@0.2.1-rc.2 \
  @deepseek-ai/dsh-client-store@0.2.1-rc.2 @deepseek-ai/cordis@4.0.5 \
  react@18.3.1 react-dom@18.3.1 jsdom@26.1.0 zustand@4.5.7 immer@10.1.1
export DSH_PROBE_NODE='/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness'
export DSH_PROBE_RUNTIME='/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh'
export DSH_MOUNTED_DEPS="$(dirname "$PWD")/dsh-mounted-settings-deps/node_modules"
node scripts/test-management-mounted-settings.mjs
node scripts/test-management-mounted-settings.mjs --red-selection
node scripts/test-management-mounted-settings.mjs --red-disposal
```

The positive run exited 0 on installed runtime 0.2.1-rc.2, Electron Node v24.21.0. The controls exited 1 at `native-section-selection` and `withdrawn-section-disposal`. They respectively omit the fixture's navigation click and retain its served namespace: expected assertions never change. Initial red was the runner refusing a missing probe. Subsequent failures exposed missing published store-engine dependencies, the required empty-session adapter, and a missing presentation Switch; these were resolved without replacing native machinery. A DOM-object equality failure produced excessive diagnostic inspection; the final withdrawal assertion compares presence as a boolean instead.

The runner creates a canonical disposable HOME/cwd/DSH_HOME and passes only those paths, TMPDIR, ELECTRON_RUN_AS_NODE and the opt-in marker. Its child has a timeout; failures never skip. Network requests, socket connections/listeners, DNS and child processes are fail-loud guarded before product/dependency evaluation. jsdom has neither resource loading nor script execution enabled. Product bundles receive only an allowlisted module loader plus DOM/console/scheduling APIs, not Node require/process; timers are needed by mounted React. No host server, provider, listener or operational API is started. The runner removes only its verified temporary HOME.

## Public mount path and bounded adapters

The matching public test-runtime declarations were inspected first: `SlotTestRuntime.create`, `mount`, `renderRoot` and `renderSlot` describe the desired public helper. However its published `lib/index.js` imports renderer `src/client/bind.ts`, `src/client/scoped-slots.tsx` and other source paths absent from the published package, and imports Vitest. Rather than private extraction, source patching, or SSR, this proof uses the unchanged installed renderer bundle's exported `apply(ctx)`. It creates real `SlotRegistry` and public `SlotCore`, then exposes the actual `ctx.uiRenderer.mount(container)` path. No private minified shell seeds are extracted. Public test-runtime is inspected/fingerprinted, not executed.

The unchanged installed Settings and Settings/general bundles execute their exported `apply` against real Cordis Context. Matching public stores use real Zustand/Immer. Real React 18 hooks and ReactDOM createRoot/portals mount into jsdom. A test-owned root registration declares only `sidebar.settings` through the real registry. An empty current-session source is installed at the renderer's public scope boundary. Remote describe/events, locale, connection, shortcuts and release status are explicit adapters. The General developer-tools row mounts with a presentation Switch adapter but its mutation is not invoked.

Tooltip, icons, ConnectionIndicator, Switch and modal-layer integration are explicitly presentation-only adapters; they are not the real primitives package. They do not replace React hooks, store subscriptions, portals, renderer, SlotCore or Cordis effects. This was necessary because the public primitives entry imports raw CSS and dev-only dependencies. The installed general CSS injection executes into jsdom but layout/focus/modal behavior is NOT proven.

## Observed behavior

- Native Settings trigger opens the dialog before serving the fixture namespace. General navigation is visibly present while Fixture Manager is absent, making the initial unserved check observable rather than vacuously checking a closed dialog. Serving the namespace then adds its navigation entry to that same open dialog.
- Native Settings trigger DOM `.click()` opens its actual portal dialog; native navigation DOM `.click()` selects contributed fixture content, with one real component effect mount and `aria-current` selection.
- Remote namespace withdrawal removes navigation/content and runs the component effect cleanup; native fallback marks General current.
- Restoring served facts restores the entry; explicitly stopping the native watcher then reloading description does not re-register it.
- Actual React root unmount empties its container; actual Cordis root fiber disposal removes remote event registrations and the shortcut registration.

## Exact identities

All values below are SHA256 of executable entry bytes; the probe also prints package-manifest SHA256 and enforces the listed versions. React/ReactDOM entry hashes identify their public entrypoints, not every transitive implementation file. There is no committed dependency lock: npm's transitive dependency ranges remain a reproduction limitation. Test-runtime's transitive Vitest resolved 4.1.12; npm under Node v23.11.0 emitted an engine warning, but execution uses installed Electron Node v24.21.0 and does not import Vitest.

```text
INSTALLED CLIENT BUNDLES (lib/client.js)
dsh-client-ui-renderer 0.2.1-rc.2 dbdb3f26bfbc1d143bc8a0eed5982a2507c4f0cf8027e7c170f3bed3604be356
dsh-client-ui-settings 0.2.1-rc.2 0555eec2df1ca392a1167e637f287ac9963dbd2b0a230089c2a41be079c490e3
dsh-client-ui-settings-general 0.2.1-rc.2 8c99a9d9f91b606a6454d09c6c7496b2c252e0c6bed035ce1a33647c0b1f43b8
PUBLIC PACKAGE ENTRIES
@deepseek-ai/dsh-client-test-runtime 0.2.1-rc.2 6bbd8c5f4724e8c786279753a2f18852e43e3772e0103a047c5e782e996fceb0
@deepseek-ai/dsh-client-ui-slots 0.2.1-rc.2 57e1314e31a2015f30231e1e7596da658f1bb5cb64c103c4cf13381647412c99
@deepseek-ai/dsh-client-store 0.2.1-rc.2 7272e501f184fdee890b7a04646a6d8b38a09e3d5c6599687c79eb9d87063e3f
@deepseek-ai/cordis 4.0.5 6a9394c0877ff45218818c6e815edd038f8057e1a1deb390a8d43ec81c57691e
react 18.3.1 a216c390bf956cbb906c66d29fdb2e2ad6999464a5ca83e476533a6f25ad0ef3
react-dom 18.3.1 f26fcb81b5d1dc32c6edea34645c75b60d259916293d3208c8be48ac33e882e4
jsdom 26.1.0 0653e655065e93d44d885b04a975c0bac3221513bfc7be0be0afd2a4cc99ff2e
zustand 4.5.7 d4e46b7dfac60ee8ecda1eb1619020b4052d1a1f5366505d867eba1ee2ef4875
immer 10.1.1 7f637a5b444a27f4c6d66bd5be1bb0582691a449f0d3f15223d2463f9ceccf3a
```

## Non-claims

This is a real **jsdom-mounted** Settings/renderer lifecycle proof, not a browser/live GUI or SSR proof. It does not prove native presentation primitives, focus/accessibility completeness, CSS layout, hydration, production Manager actions, host admission/persistence, authenticated project scope, paired remote carrier, MCP or end-to-end operational parity. Installed ASAR files and all production state remain unchanged. It supplements rather than silently relabeling the earlier partial Settings evidence.
