# S15 native API model references (ticket #96, stories 59-61)

Date: 2026-10-28. Branch `impl/s15-native-api-refs`, base `08135c322201295a4172f1e3a6ac67297c9dd74b`. Status: controlled-test verified module; not user-visible, not accepted.

## What was built

- `modules/catalog/native-api.js`: `createNativeApiReferences(ctx, { llm?, timeoutMs?, excludeProviders?, preferences? })` returning `refresh`, `idle`, `snapshot`, `usable`, `setPreference`, `preferences`, `defaultReference`, `select`, `dispose`.
- `test/accepted/native-api-references.test.js`: 12 tests against a fake native LLM service (cordis `Context` with `llm` provided; `ctx.emit('llm/adapters-updated')`).
- Reuses the repo pattern `options.llm || ctx.llm` (`modules/subscriptions/index.js:57`) and `ctx.on(...)` returning a disposer (`modules/skills/overlay.js:44`). The existing catalog (`modules/catalog/index.js`) models subscription accounts and was not changed; its preference mechanism is in-memory, so native-reference preferences are likewise in memory and exposed through `preferences()` for a later persistence owner.

## Public versus internal seams

| Used | Source (installed DSH 0.2.1-rc.3, `@deepseek-ai/dsh-llm/lib/index.js`) | Status |
| --- | --- | --- |
| `llm.listProviders()` | line 1908, detached `{id, name}` | public service method |
| `llm.listModels(provider)` | line 2086, detached `{provider,id,name,description?,inputModalities?}` | public |
| `llm.resolveModelInfo(provider, model, signal)` | line 2111, exact identity or throws | public |
| `llm/adapters-updated` | emitted at 1820, 1852; observers via `ctx.on` | public event |
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

- `node --test test/accepted/native-api-references.test.js`: 12 tests, 12 pass.
- With the unchanged catalog tests: 28/28.
- `npm test`: 597 tests, 597 pass, 0 fail/cancelled/skipped/todo (baseline 585 + 12); classifier `166/166 passed`.
- `git diff --check`: clean.

## Acceptance mapping and limitations

- Met in controlled form: no duplicate provider/secret store, no credential copy, live `{provider, model}` identity, changes/removal reflected without substitution, chat support does not imply media, no adapter ownership (tools/context/effort/cancel remain native), Auto application left to A01.
- Not met / not built: no management route, Settings UI or native picker integration (the repo has no catalog route to extend; adding one is a new transport and was out of scope); no persistence of preferences; no real native picker, browser, installed-host, paired or accessibility evidence; no mobile testing (deferred to the Owner); explicit enrollment and billing disclosure (story 61) are A01 and not included. `select()` proves the exact identity resolves live; it does not itself change a session's model, which requires a UI/session consumer. Ticket #96 acceptance criterion 2 (full Owner action -> consumer -> visible outcome) is therefore unmet and the ticket should stay open.
- The subscription id list (`SUBSCRIPTION_PROVIDER_IDS`) is a static exclusion of this plugin's own ids plus `opencode` and the Auto id; a brand-new subscription id added later must be added there.
- `llm/adapters-updated` listeners are invoked with no arguments (host line 1821), so the module re-reads the full provider list on every event; this was not exercised on a live host.
