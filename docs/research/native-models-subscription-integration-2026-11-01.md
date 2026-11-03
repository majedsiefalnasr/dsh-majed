# Native Models subscription integration feasibility

Research date: 2026-11-01. **Verdict: the complete requested integration is unsupported by the inspected installed public surface. Do not implement a replacement or host patch.** A genuine provider-card contribution exists, but no third-mode contribution contract exists in the native add form.

## Work contract and precedence

The latest Owner request supersedes proposed AutoRouting and prior imitation UI work: Majed itself must integrate subscriptions into existing Settings > Models, put Subscription beside the existing choices in the same inline Add model provider form, use native components/tokens, offer provider-specific login/import, and group accounts/counts/expandable quotas by subscription provider. Hide only Majed's duplicate API configuration; migrate neither settings nor keys. This investigation authorizes no implementation.

Allowed write scope is this report alone. Existing dirty `docs/ai/current-work.md` is preserved, not reconciled or rewritten; the lead can record this result separately under its own approval. Entry policies and current-work were read before source investigation. Verification is read-only static inspection; deliberately no tests, browser, provider traffic, credentials/accounts/config/profile access, installation changes, DOM manipulation, mocks, host patches, commits or pushes. No nested agents or Claude were used. Budget: 20 minutes or two unexpected failed diagnostics, whichever comes first. Investigation stopped at the second failure, leaving explicitly marked unknowns rather than retrying outside scope.

## Evidence basis and versions

Primary installed bundle source, already extracted before this task: `/tmp/majed136-installed-source-aUugEO` (tools resolve it as `/private/tmp/majed136-installed-source-aUugEO`). Narrow root discovery was used; the virtual installed ASAR checkout was not treated as a normal filesystem tree. No further extraction or installed writes were performed.

Installed Models package is **@deepseek-ai/dsh-client-ui-settings-models 0.2.1-rc.3**: [package metadata](/tmp/majed136-installed-source-aUugEO/dsh-client-ui-settings-models/package.json#L1-L27). Its public package provenance is [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness), repository directory `packages/client/ui-settings-models`; no installed artifact commit SHA was established. Conclusions are pinned to that installed package, not presumed current upstream HEAD.

Local public dependency contracts must not be silently version-matched: [local dsh-llm metadata](../../node_modules/@deepseek-ai/dsh-llm/package.json#L1-L24) identifies **0.2.1-rc.2**, not installed rc.3. Installed generated remote schemas and runtime registration therefore supply the version-specific evidence below. The extracted subset did not establish the complete published UI declaration set.

## Findings

### 1. Same native inline form: existing behavior supported, third choice unsupported

The native Models section owns `addOpen`, `addMode` initially `catalog`, visited panels and two busy flags in its private `Loaded` closure: [installed client source](/tmp/majed136-installed-source-aUugEO/dsh-client-ui-settings-models/lib/client.js#L2324-L2364). `closeAdd` resets editing/open/busy state, and `closeEditor` calls it on completion: [closure and close handlers](/tmp/majed136-installed-source-aUugEO/dsh-client-ui-settings-models/lib/client.js#L2375-L2391).

There are exactly two offered-mode computations, catalog and custom, with no registry input: [mode derivation](/tmp/majed136-installed-source-aUugEO/dsh-client-ui-settings-models/lib/client.js#L2458-L2477). The actual native SegmentedControl receives a literal options array with only `catalog` and `custom`: [control construction](/tmp/majed136-installed-source-aUugEO/dsh-client-ui-settings-models/lib/client.js#L2637-L2673). Their panels are directly constructed as ProviderEditor and CustomProviderCard: [panels](/tmp/majed136-installed-source-aUugEO/dsh-client-ui-settings-models/lib/client.js#L2675-L2754). The existing Add button opens that card inline: [button lifecycle](/tmp/majed136-installed-source-aUugEO/dsh-client-ui-settings-models/lib/client.js#L2756-L2774).

The registered native section declares only `settings.models.provider-card` (keyed, root scope) and `settings.models.footer` (list, root scope): [declaration](/tmp/majed136-installed-source-aUugEO/dsh-client-ui-settings-models/lib/client.js#L4485-L4501). No add-mode/options/panel/lifecycle registration is supplied here. The footer renders after the complete add block: [footer placement](/tmp/majed136-installed-source-aUugEO/dsh-client-ui-settings-models/lib/client.js#L2775-L2777). A footer or card contribution is not a third choice in the existing form; slot shadowing or replacing `settings.section` id `models` would not establish supported extension of that form.

### 2. Provider directory and native provider-card contribution: supported, narrower than requested

Installed LLM service has an explicit `registerConfigurableProviders(entries)` method with atomic validation, disposal and replacement; provider, displayName and settingsNs must be nonempty, duplicate provider declarations are rejected: [registration implementation](/tmp/majed136-installed-source-aUugEO/dsh-llm/lib/index.js#L1911-L1965). This is a real registration seam, not merely inferred from an internal import.

The installed public remote schema describes provider/displayName/settingsNs/settingsPath plus optional metadata; `nativeAuth` is only `{ env, oauth }`, describing existing authentication capability, not login UI registration: [generated remote contract](/tmp/majed136-installed-source-aUugEO/dsh-api-remotes/lib/client.js#L7409-L7427). There are no account-group/count/quota renderer fields in that contract.

Models joins registered routes with the configurable directory, resolves settings namespaces, and derives configured rows; an adapter route alone does not guarantee a visible configured card: [directory join](/tmp/majed136-installed-source-aUugEO/dsh-client-ui-settings-models/lib/client.js#L1191-L1221), [store load/configuration derivation](/tmp/majed136-installed-source-aUugEO/dsh-client-ui-settings-models/lib/client.js#L1340-L1396), [configured/addable split](/tmp/majed136-installed-source-aUugEO/dsh-client-ui-settings-models/lib/client.js#L2458-L2465).

The explicit provider-card child declaration above is rendered with `{ provider, configured, keyConfigured }`, selecting `entryKey: row.entry.settingsNs`, **not the provider route id**: [normal row contribution](/tmp/majed136-installed-source-aUugEO/dsh-client-ui-settings-models/lib/client.js#L2615-L2620). It is inside each native `li` after the native header; setup cards have the same contribution: [setup row](/tmp/majed136-installed-source-aUugEO/dsh-client-ui-settings-models/lib/client.js#L2513-L2545). It also appears below the catalog ProviderEditor: [catalog contribution](/tmp/majed136-installed-source-aUugEO/dsh-client-ui-settings-models/lib/client.js#L2706-L2729).

**Supported:** additive plugin content inside qualifying native provider rows, selected by settings namespace, and configurable-provider directory declarations. Such content could contain Majed-owned account counts/expandable quotas using its own data, subject to a later approved design. **Not established:** a native grouped-account renderer or replacing/reordering/grouping the native row list. The list maps configured rows directly and builds its own header/Edit/Remove actions: [row loop](/tmp/majed136-installed-source-aUugEO/dsh-client-ui-settings-models/lib/client.js#L2513-L2530), [header/actions](/tmp/majed136-installed-source-aUugEO/dsh-client-ui-settings-models/lib/client.js#L2551-L2614). Avoid synthesizing settings profiles merely to force subscription cards into this list; that would require a separate settings/data design approval and is not authorized here.

### 3. Native components versus tokens and private internals

The Models package exposes root and `./client` package entrypoints and declares a `./src/*` mapping, but its published files list includes locale, built JS and declarations, not an assurance that private source components are shipped: [package exports/files](/tmp/majed136-installed-source-aUugEO/dsh-client-ui-settings-models/package.json#L13-L27), [files list](/tmp/majed136-installed-source-aUugEO/dsh-client-ui-settings-models/package.json#L62-L67). A source-path wildcard alone is not an exported supported Models component contract.

The installed browser module actually exports only `apply`, `inject`, `refreshIfLoaded`: [complete export tail](/tmp/majed136-installed-source-aUugEO/dsh-client-ui-settings-models/lib/client.js#L4520-L4523). ModelsSection, Loaded, ProviderEditor and CustomProviderCard are closure-private functions. Normalizing package/client module resolution does not expose their closure state or functions: [module loader](/tmp/majed136-installed-source-aUugEO/dsh-client-modules/lib/client.js#L90-L100).

Native form code consumes `SegmentedControl` and `Modal`/`Button` from the primitives package, proving native use but not, by itself, a fully audited third-party component contract: [native SegmentedControl](/tmp/majed136-installed-source-aUugEO/dsh-client-ui-settings-models/lib/client.js#L2644-L2664), [Modal/Button usage](/tmp/majed136-installed-source-aUugEO/dsh-client-ui-settings-models/lib/client.js#L2777-L2789). The package's primitives development dependency is pinned rc.3: [dependency](/tmp/majed136-installed-source-aUugEO/dsh-client-ui-settings-models/package.json#L43-L51). **Unproven:** complete published rc.3 primitives exports/props and which reusable account-card/form components, if any, are public. The extracted subset lacks that package and the attempted public declaration retrieval failed (below). Do not call internal component imports public support.

Majed currently requires the primitives package, but creates its own Section and API surface: [Majed construction](/Users/majedsiefalnasr/Documents/Work/DeepSeek%20Harness/dsh-majed-oauth-clean/src/browser.ts#L36-L73). Its own provenance explicitly characterizes API providers as an adaptation, not a native-component import: [provenance](../../src/PROVENANCE.md#L9). Tokens can make owned UI visually related; they do not satisfy this Owner's native-component requirement or unlock missing form registration.

### 4. Hide duplicate Majed API UI only: independently feasible, not executed

The duplicate is localized: `createApiProviders` import, remote-dependent component creation and the `providers` branch alongside `accounts`: [Majed browser module](../../src/browser.ts#L7), [creation/rendering](../../src/browser.ts#L54-L73). Majed separately registers `majed-subscriptions` as its own settings section: [registration](../../src/browser.ts#L134-L140). Hiding that duplicate branch can be a presentation-only future change; it does not require migrating native settings or credentials. This is source-level feasibility, not authorization or a claim that any UI was hidden. Hiding the entire subscriptions section would remove more than the requested duplicate API configuration.

## Supported / unsupported / unproven summary

- **Supported:** existing inline native catalog/custom lifecycle; provider-directory registration; explicitly declared native provider-card child and footer contributions; a separately scoped presentation-only hiding of Majed's duplicate API UI.
- **Unsupported in inspected rc.3 surface:** registering Subscription as a third native form choice and owning its panel through that form's lifecycle; importing the private Models section/editor/card implementation as public components; using footer, shadowed section or imitation components as equivalent fulfillment.
- **Unproven, not claimed absent everywhere:** full published rc.3 primitives component API, ready-made native account grouping/quota components, end-to-end provider-specific login/import placement and account grouping using only public contracts. Existing Majed backend capability does not prove native form integration.

## Minimal missing public seam

At minimum, the native Models package needs a **public add-mode contribution contract**: registration id/label/order/availability, a panel renderer with injected dependencies, and native lifecycle coordination (busy/disabled, Apply/success refresh, Cancel/close, visited-panel state). The native options and panels must consume that registry. This is a proposed upstream API requirement, not an existing method name or permission to patch the installed host.

The existing keyed provider-card seam may be sufficient for additive account details when a legitimate directory/settings mapping yields one row per subscription provider. If the Owner requires full native row/header/group control or an exported native account-card component, a corresponding public row contribution/component export contract is also missing or must first be demonstrated. Shared colors, CSS tokens and copied DOM do not replace those contracts.

## Owner choices (no implementation selected)

1. Keep the exact requirement and defer implementation pending an upstream/public add-mode extension API; request a published version-matched registration and component contract. This preserves the intended native UX without host patches.
2. Explicitly approve a narrower experience using the existing provider-card/footer seams for additive subscription content, accepting that it is not the requested third choice and that public primitive exports still need confirmation. No replacement page is proposed.
3. Authorize a small follow-up read-only package-contract investigation after resolving tooling failures, confined to published rc.3 declarations and slot semantics. It may reduce unproven areas but cannot turn the inspected literal two-mode implementation into an existing third-mode seam.

AutoRouting, settings/key migration, replacing native Settings, copied imitation components and installed host changes are not fallbacks authorized by this research.

## Documentation lookup and bounded investigation failures

Context7 was attempted first as required: `npx ctx7@latest library "DeepSeek Harness" "public plugin extensions native Settings Models add model provider form choices and provider cards"`. It exited 1 with npm EPERM while opening a temporary cache file under `/Users/majedsiefalnasr/.npm/_cacache/tmp/`; output identified root-owned cache files. No library ID or docs were returned. No authentication, cache permission repair, denied-operation retry or alternate-cache workaround was attempted. This is not a Context7 quota error and no docs coverage is claimed.

The second unexpected failed diagnostic was a public declaration fetch of `https://unpkg.com/@deepseek-ai/dsh-client-ui-primitives@0.2.1-rc.3/lib/types/client/index.d.ts`, rejected by the tool with `Error: multiple usable web providers are registered (deepseek-fetch-api, http); configure one explicitly`. No content was returned; the URL is a failed lookup, not evidence of a declaration or its absence. The failure budget was exhausted and diagnostics stopped. Primary installed source supplies the verdict; public component-contract completeness remains explicitly unproven.

## Completion boundary

Only this research report was created. Existing dirty documentation was preserved. No product behavior, runtime/installed state, account data or provider configuration was modified. No tests were run because implementation and live validation are outside this task. Next allowed action is Owner/lead review of this evidence and an explicit disposition of the unsupported seam; do not proceed with a substitute implementation.
