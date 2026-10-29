# S15 native API model references (ticket #96, stories 59-61)

Date: 2026-10-28. Branch `impl/s15-native-api-refs`, base `08135c322201295a4172f1e3a6ac67297c9dd74b`. Status: controlled-test verified module; not user-visible, not accepted.

## What was built

- `modules/catalog/native-api.js`: `createNativeApiReferences(ctx, { llm?, timeoutMs?, excludeProviders?, preferences? })` returning `refresh`, `idle`, `snapshot`, `usable`, `setPreference`, `preferences`, `defaultReference`, `select`, `dispose`.
- `test/accepted/native-api-references.test.js`: 18 tests against a fake native LLM service (cordis `Context` with `llm` provided; `ctx.emit('llm/adapters-updated')`).
- Reuses the repo pattern `options.llm || ctx.llm` (`modules/subscriptions/index.js:57`) and `ctx.on(...)` returning a disposer (`modules/skills/overlay.js:44`). The existing catalog (`modules/catalog/index.js`) models subscription accounts and was not changed; its preference mechanism is in-memory, so native-reference preferences are likewise in memory and exposed through `preferences()` for a later persistence owner.

## Public versus internal seams

| Used | Source (installed DSH 0.2.1-rc.3, `@deepseek-ai/dsh-llm/lib/index.js`) | Status |
| --- | --- | --- |
| `llm.listProviders()` | line 1908, detached `{id, name}` | exposed on the installed service (source-read, rc.3); public contract unverified |
| `llm.listModels(provider)` | line 2086, detached `{provider,id,name,description?,inputModalities?}` | exposed on the installed service (source-read, rc.3); public contract unverified |
| `llm.resolveModelInfo(provider, model, signal)` | line 2111, exact identity or throws | exposed on the installed service (source-read, rc.3); public contract unverified |
| `llm/adapters-updated` | emitted at 1820, 1852; observers via `ctx.on` | emitted by the installed service (source-read, rc.3); public contract unverified |
| Not used | `registerAdapter`, `registerConfigurableProviders`, provider settings/config objects | deliberately avoided |

`listProviders()` returns only `{id, name}` (line 1879-1882), so no credential-bearing fields cross this seam by design; the module nevertheless copies named fields only. Real host behavior was read from source, not exercised: no installed host, provider call, or account was touched.

## RED / GREEN

| Slice | Command | RED | GREEN |
| --- | --- | --- | --- |
| A listing excludes subscription ids, modalities, no media claim | `node --test test/accepted/native-api-references.test.js` | exit 1, `ERR_MODULE_NOT_FOUND` for `modules/catalog/native-api.js` | exit 0, 1/1 |
| B removal -> unavailable, later provider, visibility, manual select | same | exit 1, 4 of 5 fail (`refs.setPreference is not a function`) | exit 0, 5/5 |
| C failure/slow isolation, secrets, one default, disposal | same | exit 1, 1 of 12 failed (test setup defect: in-flight refresh not started before release; fixed in the test, not the module) | exit 0, 12/12 |

Mutation checks against the module (tests then strengthened where a mutant survived): removing the unsubscribe, publishing after disposal, removing the timeout bound, leaking provider/preference fields, reporting a removed default as available, and dropping the subscription-id exclusion are each detected (first three initially survived; the unsubscribe and in-flight tests were tightened, the leak mutants were fixed to target actual output fields). The no-timeout mutant hangs the suite (exit 1 under `--test-timeout`).

Evidence logs (not committed) were kept in `/tmp/s15-evidence`.

## Verification

- `node --test test/accepted/native-api-references.test.js`: 18 tests, 18 pass.
- With the unchanged catalog tests: 34/34.
- `npm test`: 603 tests, 603 pass, 0 fail/cancelled/skipped/todo (baseline 585 + 18); classifier `166/166 passed`.
- `git diff --check`: clean.

## Acceptance mapping and limitations

- Met in controlled form: no duplicate provider/secret store, no credential copy, live `{provider, model}` identity, changes/removal reflected without substitution, chat support does not imply media, no adapter ownership (tools/context/effort/cancel remain native), Auto application left to A01.
- Not met / not built: no management route, Settings UI or native picker integration (the repo has no catalog route to extend; adding one is a new transport and was out of scope); no persistence of preferences; no real native picker, browser, installed-host, paired or accessibility evidence; no mobile testing (deferred to the Owner); explicit enrollment and billing disclosure (story 61) are A01 and not included. `select()` proves the exact identity resolves live; it does not itself change a session's model, which requires a UI/session consumer. Ticket #96 acceptance criterion 2 (full Owner action -> consumer -> visible outcome) is therefore unmet and the ticket should stay open.
- The subscription id list (`SUBSCRIPTION_PROVIDER_IDS`) is a static exclusion of this plugin's own ids plus `opencode` and the Auto id; a brand-new subscription id added later must be added there.
- Exclusion-list collision risk: exclusion is by provider id only, so an API provider whose id equals a brand name in `SUBSCRIPTION_PROVIDER_IDS` (for example a native API route with id `claude`) would be hidden from this list. The list is pinned by test to `modules/subscriptions/wire.js` `PROVIDER_IDS` plus `opencode` and the Auto id.
- Preferences (alias, visibility, default) are in memory only and are lost on restart; a later persistence owner must save and restore them through `preferences()` and the constructor option.
- `chat: true` is derived from the model appearing in the listing; it is not independently proven by a capability check. `mediaGeneration: false` is likewise a constant, not a probe.
- `refresh()` is failure-safe: if `listProviders()` throws, the previous providers are kept and marked `list-failed`, and the next refresh recovers (covered by test).
- `llm/adapters-updated` listeners are invoked with no arguments (host line 1821), so the module re-reads the full provider list on every event; this was not exercised on a live host.

## Mount slice (2026-10-29)

Scope: closes the "module is not mounted, no route/UI/persistence" item in controlled form only. Fixtures are fakes (`ctx.llm` with credential-looking extras, a recording Connection, the baseline client harness over built `dist/client.js`); native BrowserAuth/Owner admission is host-owned and not simulated.

- `modules/catalog/native-api-mount.js`: `applyNativeApiReferences(ctx, {path, timeoutMs})`, wired in `index.js`; exact route `POST /api/majed/native-api`, actions `snapshot | setPreference | clearPreference`; a transient `createNativeApiReferences` is built per request and disposed.
- Persistence: Codex `createPrivateStore` (0600, atomic, per-path queue); `{version:1, preferences:[{provider, model, alias?, visible, default}]}`; corrupt/unsafe => `store: corrupt|unsafe`, empty list, writes refused with `store_corrupt|store_unsafe`, file untouched.
- UI: `NativeApiSection` inside the existing `routing` module section (no new settings slot, so `baseline-client.test.js` slot list is unchanged).

| Slice | Test(s) in `test/accepted/native-api-mount.test.js` | RED | GREEN |
| --- | --- | --- | --- |
| A route + bounds + degrade | exact seam/no secrets; bounded requests; llm unavailable | exit 1 (`Cannot read properties of undefined (reading 'path')`: nothing mounted) | exit 0 |
| B persistence/removal/corrupt/dispose | restart, removed model, corrupt/unsafe, dispose | not independently RED: written after A's implementation, which already covered them (characterization); one dispose assertion first failed on test timing (async dispose) and was corrected | exit 0 (7/7) |
| C Settings panel | list + click persists + visible outcome; unavailable/error/Arabic | exit 1 (`timed out waiting for reference list`) | exit 0 (9/9) |

A full-suite run after C showed 2 failures in `judgment-ui.test.js` (its fake RPC returned a non-snapshot value to the new panel, `TypeError ... reading 'map'`); fixed by validating the response shape in the panel, then `npm test`: 669 tests, 669 pass; classifier 166/166; `git diff --check` clean (baseline 660 + 9).

Remaining gaps: preferences are not consumed by the native model picker (no public consumer seam proven), so they do not change selection, routing or Auto; no live-host Owner admission or real-provider run; `llm/adapters-updated` is not subscribed (the panel refreshes on demand); the route lifetime is host-owned like the other routes (not unregistered by this module). The ticket stays PARTIAL/open.
