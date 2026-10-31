# Third-party notices

`dsh-majed` is released under the MIT License (see `LICENSE`). It includes the following third-party material.

| Component | Version | License | Location |
|---|---|---|---|
| Inter, Roboto, Open Sans, Noto Sans, Noto Sans Arabic, IBM Plex Sans, IBM Plex Sans Arabic (via Fontsource) | see `fonts/manifest.json` | SIL Open Font License 1.1 | `fonts/` (licenses in `fonts/LICENSE-*.txt`) |
| dsh-persian-rtl (chat direction CSS/logic, adapted) | n/a | MIT | `client.js` |

Subscriptions #128 adapts the exact authenticated Fetch RPC registration/envelope convention and closure-factory build recipe from [V1ki/dsh-plugin-subscriptions](https://github.com/V1ki/dsh-plugin-subscriptions), v0.9.12, commit b802311, MIT. Local changes and the license notice are recorded in `src/PROVENANCE.md`. That historical #128 slice contained no provider implementation. #129 additionally ports the pinned Codex and shared accounts/auth/translation/catalog/pool/retry code, compiled output and adapted tests; the exact inventory and local changes are recorded in `src/PROVENANCE.md`, together with the retained Copyright (c) 2026 V1ki MIT notice.

#130 additionally ports the pinned provider-settings, model-defaults, account-preferences, HTTP proxy, image account pool, Codex web-search provider, tool alias registration and the Codex-only `image_generate` tool, with adapted tests; the file-level map, the Codex-only changes and the excluded Grok/x_search/video surfaces are in `src/PROVENANCE.md`. The same copyright and MIT license apply.

The #129 visual correction additionally adapts the Codex presentation and helper styles from `src/client/SubscriptionsSection.tsx` and `src/client/provider-settings-styles.ts` at that same pin. Its scoped source map and render limitations are in `docs/ai/ticket-129-ui-parity.md`; the copyright/license above and in the provenance record continue to apply.

#131 additionally ports the composer usage badge, its display setting and preference store, the usage-window filter, the Speed control and the `/fast` command description from `src/client/` at that same pin, the `speed`/`setSpeed` host behavior from `src/auth/rpc.ts` and `src/index.ts`, and the matching tests; the file-level map is in `src/PROVENANCE.md` and the copyright/licence text above applies unchanged.

#132 additionally ports the pinned Claude provider, Anthropic translation, Claude CLI version detection and Claude Code credential reader from `src/providers/`, `src/translate/` and `src/auth/` at that same pin, adapts the Claude card, cache-lifetime Manage option and locale strings from `src/client/`, and ports the matching reference tests; the file-level map is in `src/PROVENANCE.md` and the copyright and MIT license above apply unchanged.

#133 additionally ports the pinned Grok provider, video and X tools, Grok image/edit extension, image gallery/lightbox and image/video toolviews, with reference tests. Owned namespace/storage, RPC, lifecycle and English/Arabic adaptations are inventoried in `src/PROVENANCE.md`. The same V1ki copyright and MIT license apply.

Ported source added by later components is listed here with its version, commit and the location of its provenance record. No provider account, trademark or service authorization follows from a code license.
