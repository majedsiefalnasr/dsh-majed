# #136 API providers — candidate verification

## Owner acceptance disposition — 2026-11-01

Owner reported successful provider addition and cross-page synchronization, and subsequently confirmed `Key configured` appears for ordinary providers. Owner explicitly deferred the missing visual status indicator and DeepSeek Account status presentation to the final UI/UX improvement scope. No ordinary-provider lookup defect was established; no speculative repair was applied. Owner explicitly accepted the existing automated revision-conflict tests instead of a live conflict trial and authorized closing #136. This is Owner acceptance with a stated validation substitution, not evidence of a live conflict test or provider connectivity. Final integrated automated evidence remains Node837/837, fresh-build match and independent Standards/Spec PASS. The final UI/UX ticket is still to be proposed after functional tickets; preserve these deferred items there.

## Contract and scope

Ticket: https://github.com/majedsiefalnasr/dsh-majed/issues/136, “Subscriptions: API providers part”, stories 69–76. Isolated branch `impl/136-api-providers`, baseline `527d5f5cfcf2b6404ee5babddd617096bab4f7f2`. Existing partial edits were preserved. Owner approved a twenty-minute narrow finishing extension after the prior two-failure cap. No nested agents, installed/profile operations, real remotes, provider traffic, merge, push, closure or #137 work. Independent Lead Standards/Spec review is next, not performed by this implementer.

Approved seam 2: actual React component against injected native-shaped fake settings/credentials/llm remotes; assembled browser registration/rendering also retained. Native source authority is the read-only extracted `0.2.1-rc.3` artifact documented in `src/PROVENANCE.md`. React documentation was fetched in the previous implementation round; this continuation does not introduce a new framework API.

## Implemented behavior and controlled proof

- Directory joins native configurable providers and registered-only routes; catalog entries are editable, while registered-only entries without an owning settings namespace stay visible/read-only. Snapshot/draft state is ephemeral; no Majed API-provider persistence or backend was introduced.
- Catalog add and custom OpenAI Chat (`openai-completions`), Responses and Anthropic endpoints; display name/base URL, model discovery and editable model JSON including reasoning efforts, context/output bounds and modalities. Duplicate/invalid model drafts are refused. Empty optional names/endpoints remove overrides to retain native fallback.
- Key metadata is obtained only through `credentials.describe`; fake remotes provide no stored-key read method. Set uses a password draft, unset is explicit, and neither action is implicit in profile deletion. Successful save clears the draft. Transport/provider error text is never rendered.
- Settings mutations send the namespace revision for edits and deletion; conflict retains local intent. Only changed fields are patched, preserving unrelated provider settings. Built-ins and deployment-owned profiles cannot be deleted; a user-added declared profile can.
- Settings commit precedes separate credential mutation. A failed key operation after settings success reports partial completion and retains key intent; retry does not replay settings. A settings conflict never attempts the key operation. Read-only credential metadata blocks key changes. No native cross-service transaction or atomicity is claimed.
- Native settings/credential/adapter invalidations reload the joined surface. Effects remove event listeners on unmount, and obsolete loads cannot update state. The browser section injects the public remote SDK contribution and falls back to a localized unavailable state when absent.
- EN/AR controlled tests exercise list/catalog add/key set/unset, all custom protocols, discovery/model editing, edit/delete conflicts, protected deletion, invalid drafts, unrelated-provider preservation and partial retry. Actual React assembled-browser proof exercises native injection; the previous placeholder assertion was corrected rather than removing the lifecycle test.

## Regression history and gate evidence

Previous attempt: actual-component 10/10 and build passed; full suite classifier166/166, Node830 pass/1 fail because the assembled fixture expected the removed “No API providers yet” placeholder. The earlier VM cross-realm assertion was corrected without changing production behavior. This continuation updates that expectation and adds real React native-directory rendering.

Deliberate new regression red: custom creation wrote an empty `displayName`, which native pi-ai rejects. The new assertion failed in both locales, then the source was corrected to omit empty optional fields and unset cleared overrides. This is planned red/green, not a diagnostic-budget failure. A rejected credential transport is also classified as partial when settings have already committed.

Continuation focused gate: 39/39 tests passed and build exit0. Final planned gates all exit0: `npm run build`; `npm test` (classifier166/166, reference TypeScript compile, Node834/834, zero failures/cancellations/skips); `npm run check:build` (fresh output matches); `git diff --check`. A protected-source comparison confirms no changes under `src/providers`, `src/auth` or `src/subscriptions.ts`. Existing react-test-renderer deprecation warnings remain. Documentation completion is followed by staged/range whitespace checks. Logs: `/tmp/majed136-extension-{red,focused,build,tests,check-build,diffcheck}.log`. No OAuth credential values or diffs were printed; existing OAuth/provider source is outside this patch.

## Root-injection repair (2026-11-01)

Isolated branch `fix/136-root-injection`, baseline `805d98af6904dcc3b1233a1540f9654bd3b40502`. Owner approved a further twenty-minute investigation extension after two fixture-diagnostic failures. Narrow production change: explicitly inject `remote` as well as `remote.settings`, `remote.credentials` and `remote.llm` before reading `scope.remote`. No provider/auth source changes or installed operations.

The corrected fixture registers methods on actual Cordis namespace Service instances rather than plain nested root objects shadowed by empty namespace services. Its minimal VM window supports the unrelated usage-display subscription. It renders the registered section with actual React and Cordis Context/Service, asserts zero native RPC before all services arrive, observes the directory, withdraws `remote.llm`, observes unavailable state, and remounts/reloads. Cleanup uses supported `root.fiber.dispose()`.

Attributable planned red: temporarily omit only `remote` from the fixture's forwarded injection list, leaving namespace services and production bundle unchanged. Node exits 1 with no calls and the unavailable directory; restoring the exact forwarded list passes. No deliberately incorrect bundle remains. Logs `/tmp/majed136-root-extension-red.log` and `/tmp/majed136-root-extension-green.log`. The earlier fixture errors do not demonstrate a deeper production defect. Full repair gate results are recorded in current work.

## Synthetic browser visual verification extension (2026-11-01)

Owner approved a further twenty-minute visual-only extension at candidate `44c8dd49b81264bcae05396e1792a3071b50b276`, branch `fix/136-native-ui`. Clean starting tree confirmed. No product edits were made. BrowserSkill was checked once and returned `no browser is currently connected`; no repeated connection probe. The explicitly approved Playwright tool route then rendered the actual React component successfully in an isolated browser, not installed DSH. BrowserSkill, browser-harness, playwright-cli, verify-and-stop and Impeccable context/audit guidance were loaded; this was verification, not a redesign.

Existing package/build configuration was inspected. No dependencies were installed. Successful bundle command (run from this worktree with `npm_config_cache=/tmp/npm-cache-majed`):

```js
// node --input-type=module; existing rolldown dependency from tsdown
import { rolldown } from 'rolldown';
const bundle = await rolldown({
  input: 'scripts/api-providers-dom-136.tsx', platform: 'browser',
  define: { 'process.env.NODE_ENV': JSON.stringify('development') },
});
await bundle.write({ file: '/tmp/majed136-dom-visual.js', format: 'iife', name: 'Majed136Fixture' });
await bundle.close();
```

Bundling succeeded with only the upstream top-level `define` deprecation warning. `node scripts/serve-api-providers-dom-136.mjs /tmp/majed136-dom-visual.js` served synthetic data only at `http://127.0.0.1:52678`. This was a temporary fixture transport, not a replacement DSH server. Fake remotes contain one configured long-name provider and a separate unconfigured catalog entry; no real accounts, keys, profiles, remote services or provider requests were used.

Observed matrix: EN/LTR and AR/RTL × light and dark × viewport widths 360, 768 and 1440 CSS pixels, height 1000. Each combination rendered configured list, inset edit form, catalog Add and Custom API tab: 48 full-page captures. Screenshot paths follow `/tmp/majed136-{en|ar}-{light|dark}-{360|768|1440}-{list|editor|catalog|custom}.png`. All 48 states had `document.documentElement.scrollWidth === innerWidth`; each retained exactly one configured row rather than exposing the unconfigured catalog as a row. Catalog/custom tab switching, labels, Apply/Cancel, model ID/name rows and long provider name wrapping were observed. EN and AR narrow dark model add/remove changed textbox counts 4 → 6 → 4; model text inputs remained LTR in both languages.

Computed style proof: configured card width 312px at 360 and 720px at wider sizes; card padding 12px narrow / 12px 14px wider; radius 12px. Controls were 40px high, 8px radius, 8px 12px padding. Light foreground/fill/stroke resolved to rgb(34,34,34)/rgb(250,250,250)/rgb(221,221,221); dark to rgb(238,238,238)/rgb(36,36,36)/rgb(72,72,72). Focusing Display name then pressing Tab reached localized Base URL with a computed solid 2px rgb(54,124,255) focus outline in all twelve combinations. This verifies this keyboard transition, not exhaustive keyboard accessibility or a WCAG contrast certification.

Directly inspected captures: `/tmp/majed136-en-light-360-editor.png`, `/tmp/majed136-ar-dark-360-editor.png`, `/tmp/majed136-en-dark-768-custom.png`, `/tmp/majed136-ar-light-1440-catalog.png`. They show readable spaced labels, inset divider, stacked narrow model fields, horizontal wider model layout, mirrored Arabic alignment and visible focus. Nonblocking visual limitation: the English missing-key status can wrap inside a word beside the deliberately long provider name (for example configure/d). No product patch was made during this evidence-only extension. Other captures were generated and geometry-checked, not individually visually reviewed.

Native authority comparison is source-based only: `/tmp/majed136-installed-source-aUugEO/dsh-client-ui-settings-models/lib/client.js:58` defines the native 720px section, 12px/8px gaps, semantic card tokens, 12px 14px row inset and native radii. The fixture is consistent with those broad primitives, not pixel-identical: native CSS has .5px card borders and 36px buttons, versus this component's 1px/40px. No incumbent screenshot files were present in the extracted source directory, so no pixel or side-by-side native screenshot parity is claimed. Theme values are synthetic stand-ins, not installed theme resolution. Browser console's initial failed resource was the fixture's unserved favicon, not a React render failure.

Cleanup completed: Playwright page closed; managed fixture job `bash-ea59c386428447b7` cancelled and collected with final status killed. No BrowserSkill session was created. Temporary bundle/screenshots remain only under `/tmp`, outside the commit. No installed changes, replacement app server, real traffic, merge, push or ticket closure. Previous automated gates remain applicable to unchanged product revision; this extension adds actual synthetic DOM proof, not installed acceptance. Independent Lead Standards/Spec review remains separate.

## Residual gates — not live acceptance

Public SDK loadability, `remote.*` injection and principal/admission in the actual installed browser remain unverified. A harmless approved browser-admission check is a separate post-review action. Fake remotes do not establish installed parity, paired-remote access, actual discovery networking or provider inference. Model JSON validation intentionally delegates the owning namespace's full schema to native settings mutation; native validation errors become a generic localized failure rather than echoed provider diagnostics. Native saves and credential writes are not atomic; a key-only operation does not invent a settings revision transaction. In-flight transport cancellation is not claimed; unmount suppresses render updates and removes listeners, but cannot roll back a write already sent.

## Consolidated Owner checklist (after independent review and package verification)

One session only after separate installation approval; no installation or live action is requested by this candidate handoff. Keep installed-state permission separate from any account/provider/network operation. Never paste keys into the conversation, logs or screenshots.

1. Confirm the reviewed build, required public remote SDK availability/admission and Subscriptions component visibility. Preserve the existing fallback/reference arrangement; do not activate colliding subscription adapters together. Check English and Arabic usability, including error text and model editor direction.
2. With Owner-approved disposable provider settings, compare the directory with Settings > Models. Add a catalog provider and each custom protocol; edit display name/base URL/model metadata. Confirm each change appears on the native page without creating a Majed store. Actual Fetch models may contact the endpoint and needs explicit permission; no inference is required.
3. Owner enters a disposable key privately. Confirm presence, replace and unset without stored-value readback. Confirm an unrelated provider and existing subscription/OAuth defaults are unchanged. Do not expose existing credentials for this check.
4. Open an editor here, change the same namespace on Settings > Models, then Save here: expect a conflict with retained local draft rather than overwrite. Cancel/reopen, verify the external value appears; also verify a native-page edit refreshes the list here.
5. Delete only the disposable user-added profile; verify built-in/deployment providers have no delete action and shared credentials are not silently deleted. Clean up disposable credential references explicitly only with Owner authorization.
6. Record observed environment/revision and failures together. Installation/reload, actual discovery and paired-remote checks are distinct evidence. Ticket closure and push require Owner acceptance; visibility alone is insufficient.
