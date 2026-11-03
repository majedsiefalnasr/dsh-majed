# DSH design source record — 2026-11-02

Supports the shared [DESIGN.md](../../DESIGN.md). This is a bounded source/documentation inspection, not a rendered or installed acceptance report. No host files, profile state, credentials or provider services were changed/read for this task.

## Baseline and reproducibility

- Archive: `/Applications/DeepSeek Harness.app/Contents/Resources/app.asar`.
- Native source prefix inside the archive: `dsh/node_modules/@deepseek-ai/`.
- Inspected UI package manifests report **0.2.1-rc.5**. This identifies those packaged modules, not a claim about every dependency or the desktop wrapper's version.
- Read-only extraction used the installed Electron executable with `ELECTRON_RUN_AS_NODE=1` and `fs.readFileSync`, writing selected package source copies to `/tmp/majed-dsh-design-Zfc1ID`. Temporary copies are not a runtime dependency or durable evidence location; original archive-relative paths and SHA256 values below are the reproducibility anchors.
- For a future refresh, read the same archive paths through an ASAR-aware reader, compare manifests and SHA256 fingerprints, then inspect the listed source regions. Do not modify the archive or use private paths from product code.
- The separate published `@deepseek-ai/dsh-client-ui-primitives` inspection used **0.2.1-rc.3**, README and `index.d.ts` from `/tmp/majed-models-proof-XZ46eh/primitives/package`. The earlier [public-contract research](reversible-models-replacement-2026-11-01.md) provides its context. This is not proof of an rc.5 external-plugin runtime contract. A standalone primitives package was not found at the two checked archive package locations; bundled presence/loadability was not resolved.

## Packaged file fingerprints

All paths below are relative to the archive source prefix above. Hashes identify original bytes, not reformatted CSS excerpts. Each cited `lib/client.js` was inspected in its own package context.

| File | SHA256 |
| --- | --- |
| `dsh-client-ui-theme/lib/client.js` | `e94b6aad08ca1e9399341fdfcc7c5ff20d093fae4e86894bcf151bee6a832a07` |
| `dsh-client-ui-theme/package.json` | `688517fd0f32a17dc24f92e773274f16bd40ec4b9753ec9a56be4c1f7d3a0649` |
| `dsh-client-ui-theme/LICENSE` | `ebb4f09972aee8608be255debaf78451a68e95c290f55c240dec2ecfa16ea6be` |
| `dsh-client-ui-settings/lib/client.js` | `0555eec2df1ca392a1167e637f287ac9963dbd2b0a230089c2a41be079c490e3` |
| `dsh-client-ui-settings-models/lib/client.js` | `50a9da3d8070fdbec8b69e173a4a4789cc204a5c614f42bf6d6587a7138205cf` |
| `dsh-client-ui-settings-general/lib/client.js` | `bc0e89a1968ecd1a540e73a83c14e808f05a41ca0a4ad6e6ba2569aff1d0a398` |
| `dsh-client-ui-settings-plugins/lib/client.js` | `4a7b3575c5590f88500a75bd9c12ac4113dd479f7d73b0bd858c650f75ab2c79` |
| `dsh-client-ui-layout/lib/client.js` | `64366054aba2a9e4abfa0e064e20f5d752f94cfa831e20b0034c21a8031f9860` |
| `dsh-client-ui-tool/lib/client.js` | `1ae4daeaf42c2c54d3f58a152223ff2cdd14bc97e684c48f8a7bea787d2d2b27` |

## Evidence map

These are original bundle line numbers in the fingerprinted files, not public API promises. Generated CSS is embedded in long JavaScript string lines. For inspection it was decoded from the string and split after closing braces; no derived stylesheet was installed or copied into Majed runtime code.

### Theme

`dsh-client-ui-theme/lib/client.js:1407`:

- System UI/code stacks, `--dsw-font-family` / `--ds-font-family-code` and user font overrides; separate brand-family role.
- Radius roles xs/sm/md/lg/xl/panel are 4/8/12/16/20/28px.
- Duration roles fast/default/slow are .1/.2/.3s; easing `cubic-bezier(.4, 0, .2, 1)`.
- Settings card fill aliases layer-2; stroke aliases border-l4.

`dsh-client-ui-theme/lib/client.js:1410`: feature-detected `corner-shape:superellipse(1.5)`; not a reason to install a global rule from a plugin.

`dsh-client-ui-theme/lib/client.js:1413`: semantic palette assignments for normal/dark theme. Contrast/brand-primary differs from business/information accent. Use aliases rather than reprinting the static palette as Majed colors.

`dsh-client-ui-theme/lib/client.js:1416`: 2px focus-ring width, business-role fallback and host-managed pointer-modality suppression. `dsh-client-ui-theme/lib/client.js:1422`: shared scrollbar styling; a plugin should not override all scrollbars.

`dsh-client-ui-theme/lib/client.js:1425`: semantic elevation stroke/panel/prominent/soft; menu-specific `blur(40px) saturate(150%)`; mask blur `none`; content/code font deltas and Markdown font roles. These are contextual roles, not universal card blur or a fixed settings font scale.

### Settings and forms

`dsh-client-ui-settings-models/lib/client.js:58`:

- Section maximum720px/gap12; title16/24 weight500; intro14/22; supporting labels/notices12/18; tag11/16.
- Row gap8; card inset12px14px/gap12/radius-xl/0.5px semantic border.
- Standard action36px/radius-md; compact row action28px/radius-sm; input32px/radius-md.
- Inset editor14px16px/gap14/radius-lg; field gap6; full-width dashed Add affordance44px high.
- Focus/disabled/hover styles, semantic credential/account status, disclosure and model editing patterns.
- Physical left/right properties and some literal SVG strokes also exist. Adapt them for RTL/theme rather than copying defects as normative guidance.

`dsh-client-ui-settings-models/lib/client.js:2807`: secondary dialog maximum600px, content inset28px,24px at width<=560px; title20/28 weight500. `dsh-client-ui-settings-models/lib/client.js:2869` and `dsh-client-ui-settings-models/lib/client.js:2977`: supporting dialog copy/action spacing and narrow full-width primary action.

`dsh-client-ui-settings-models/lib/client.js:4520-4522`: exports `apply`, `inject`, `refreshIfLoaded`; no exported Models section/editor component. `dsh-client-ui-settings/lib/client.js:1505-1506`: activation exports, not a public component inventory.

`dsh-client-ui-settings-plugins/lib/client.js:11`: maximum760px/gap12, heading18 weight600, intro13, underlined tabs and cards gap10. This is counter-evidence to declaring Models' width/type a universal native rule.

`dsh-client-ui-settings-general/lib/client.js:60`: host settings-shell width800/viewport margins, navigation188 and shell-owned scrolling/insets. Observed host chrome is not a plugin template.

### Layout and tool output

`dsh-client-ui-layout/lib/client.js:73`: native application layout/platform clearances and reduced-motion handling. Do not recreate application grid/titlebar/global stacking in a feature plugin.

`dsh-client-ui-tool/lib/client.js:1528`: compact summary uses secondary content-font sizing with13px default and content delta; ellipsis is contextual, not a prescription for critical form identity/errors.

`dsh-client-ui-tool/lib/client.js:2435`: tool summary base24px plus content-font delta, reduced-motion handling, code-output font roles, preserved whitespace and bounded output areas. Select an output pattern for tool results rather than reusing settings forms indiscriminately.

## Documentation and reuse interpretation

Context7 resolved `/deepseek-ai/deepseek-harness`; current indexed documentation was fetched for styling and external-plugin practices during this task. Sources:

- [Web styling](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/web-styling.md): internal DSH development shares primitives and semantic tokens.
- [External plugin practices](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset/skills/cordis-plugin-development/references/practices.md): external plain-JavaScript plugins must not require Harness client packages as modules; injection order does not turn their internals into stable component APIs.

Those links track `master`, not an immutable rc.5 source commit; they are explicitly current upstream guidance, **not** proof of a version-matched installed API. No broader claim that all native components are forbidden or all published exports are externally supported follows. Check each actual seam; otherwise use a licensed owned adaptation. The existing Majed imports remain unchanged and un-certified by this task.

## License and scope

The inspected native package LICENSE files carry MIT, Copyright (c) 2026 DeepSeek, with the copyright and permission notice required in copies or substantial portions. Their common LICENSE SHA256 is recorded above. This task documents small factual observations; it does not vendor the bundles or add a component implementation. Any subsequent substantial adaptation must keep the full notice and provenance, and independently inspect relevant asset/dependency licenses. Existing adaptation notices remain in [source provenance](../../src/PROVENANCE.md) and [third-party notices](../../THIRD_PARTY_NOTICES.md).

No new live browser inspection, measured contrast audit, full accessibility certification, screenshot-parity claim, installed primitive loading proof or provider/account test was performed for this reference. Existing #138 synthetic browser evidence remains partial and separate. The expanded reference cannot close #138 or authorize installation, host patches, settings changes or live inference.
