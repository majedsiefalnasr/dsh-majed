# DSH plugin "Components": how a bundle's features become separately toggleable

Date: 2026-10-29. Scope: read-only research against the installed DSH build
(`/Applications/DeepSeek Harness.app/Contents/Resources/app.asar`, extracted read-only to
`/tmp/dsh-asar`) and the desktop profile (`~/.dsh/profiles/desktop`). No files under `~/.dsh`
were modified and nothing was toggled.

Path abbreviation used below: `@dsa/` = `/tmp/dsh-asar/dsh/node_modules/@deepseek-ai/`
(the same packages ship inside `app.asar/dsh/node_modules/@deepseek-ai/`).

## TL;DR

- A "component" in the Plugins page is a **row**: one Loader entry (`{ id, name }`) that the
  bundle's own patch file declares inside an `insert:` block. Nothing in `package.json` `dsh`
  declares components; there is no `components` field.
- The page lists every `insert`ed row (and the children of `cordis:group` rows) of the
  bundle's `dsh.bundle.patch` file(s), in declaration order, under the heading **"Components"**.
- A row's switch calls `pluginManager.setPluginEnabled(entryId, enabled)`, which writes
  `- id: <rowId>\n  disabled: true|false` into the **profile's** `cordis.patch.yml`. With HMR
  (desktop profile: on via the base bundle) the Loader entry is disposed / re-created live;
  without HMR it applies on restart.
- Disabling a row disposes that entry's Cordis fiber (all its effects: routes, services,
  listeners). Other rows of the bundle keep running.
- The browser half is **one per package** (the `./client` export) and is mounted while at
  least one *enabled* row uses the exact package-root name. A row whose `name` is a subpath
  (`pkg/sub`) never contributes a client half. So per-component client UI must be gated by
  the client itself.

## 1. Where the UI lives (verified)

- Page: `@dsa/dsh-client-ui-plugin-manager/lib/client.js` (React, built). Host service:
  `@dsa/dsh-plugin-manager/lib/index.js` (+ `lib/types/patch.js`). Display metadata:
  `@dsa/dsh-app-boot/lib/index.js`. Live entry snapshot: `@dsa/dsh-host-plugin-inventory`.
- English labels, `@dsa/dsh-client-ui-plugin-manager/lib/client.js:339-352`:
  `partsLabel: "Components"`, `partsEmpty: "This plugin pack contains no components."`,
  `partsFilter: "Filter components"`, `partToggle: "Enable component {name}"`; reasons at
  `:507-508`: `reasonManagementRequired: "Plugin management needs it; it cannot be switched off
  or uninstalled."`, `reasonUnaddressable: "The profile patch cannot address this one uniquely."`
  (Chinese at `:115` `partsLabel: "包含的组件"`).
- Rendering: `RowsSection` at `client.js:2349-2467` renders each row (icon, title, optional
  description, the row id and module name as `<code>` when they differ from the title, a state
  dot + phase text, and a `RowSwitch`). A list with more than `ROW_FILTER_THRESHOLD = 10`
  (`:2267`) rows gets a filter.
- The switch only appears while the bundle itself is on (`client.js:2966-2974`):
  ```js
  pkg.availability === "missing" ? null : jsx(RowsSection, { rows: pkg.rows, …,
    toggle: pkg.enabled ? { busy: …, onSetEnabled: onSetRowEnabled } : void 0, configure })
  ```
- Locking (`client.js:2314-2322`):
  ```js
  const locked = row.readOnlyReason !== void 0 || row.entryId === void 0;
  ```
- Row view model (`client.js:860-872`, `packageView`): `{ rowId, moduleName, enabled:
  live?.enabled ?? false, phase: live?.fiberPhase ?? null, meta, entryId, readOnlyReason }`,
  where `live` is the matching Host plugin entry.
- Toggle call (`client.js:1208`): `await this.ctx.remote.pluginManager.setPluginEnabled(entryId, enabled)`.
- README confirmation, `@dsa/dsh-client-ui-plugin-manager/README.md` ("Switching one row of a
  bundle"): *"A row's switch on the bundle's page calls `pluginManager.setPluginEnabled`, which
  records the row's enablement in the profile's `cordis.patch.yml` … The tree recomposes at once
  on a profile with HMR, so the row's host half unmounts or mounts while the rest of the bundle
  keeps running, and the page follows the client module graph without reloading. … The switch
  appears only on a bundle that is on; a row without a live entry, or one the Host will not
  address through the profile patch, is locked with the Host's reason."*

## 2. What a component is in data terms (verified)

### 2.1 Rows come from the bundle patch's `insert` blocks

`@dsa/dsh-plugin-manager/lib/index.js:2165-2202` (`declaredRows`) loads the files named by
`package.json` `dsh.bundle` (`patch` string or array) and keeps only `insert` items:

```js
for (const row of flatten(composeEntries([patches.filter((item) => item.insert !== void 0)]))) {
  if (typeof row.id !== "string" || typeof row.name !== "string" || row.group === true) continue;
  rows.push({ rowId: row.id, moduleName: row.name, entryId: …, meta: packages?.metaOf(row.name, base) });
}
```

Non-`insert` items of the same file (id-targeted overrides of other entries) are reported
separately as "overrides", not as components.

`flatten` (`@dsa/dsh-plugin-manager/lib/index.js:1020`, `lib/types/patch.js`):

```js
rows.flatMap((row) => [row, ...row.group && Array.isArray(row.config) ? flatten(row.config) : []])
```

So a `cordis:group` row is **not** a component itself, but each child in its `config` list is.

Schema of one row = an ordinary Cordis Loader entry: `id` (string, required for a component),
`name` (module specifier, required), optional `config`, `disabled` (boolean or `!!js` expr),
`inject`, `isolate`, `group`.

### 2.2 Which rows get a working switch

`@dsa/dsh-plugin-manager/lib/index.js:1656-1675` (`listPlugins`):

```js
const rows = flatten(composeEntries([readProfilePatches("dsh", this.profile)]));
…
if (protectedModules.has(entry.moduleName) || entry.entryId === this.ownerEntryId)
  return { ...entry, readOnlyReason: "management-required" };
if (candidate === void 0 || candidates.length > 1 || candidate.name !== entry.moduleName
    || actual?.parent.tree.ctx.fiber.entry?.id !== "include")
  return { ...entry, readOnlyReason: "unaddressable" };
return { ...entry, patchId: candidate.id };
```

Requirements: the row `id` is unique across the whole composed profile (all bundles + profile
patch), the composed `name` equals the live module name, and the entry sits in the profile's
root `include` tree (group children qualify, because `Group` reuses its parent's tree —
`@dsa/cordis-plugin-loader/lib/index.js:104-105` `super(ctx, ctx.fiber.entry.parent.tree)`;
the profile already overrides group child `optional-terminal-pwsh`, see 2.3). Rows inside agent
presets are read-only (`@dsa/dsh-plugin-manager/README.md:31`).

### 2.3 Persisted state: profile `cordis.patch.yml`, key `disabled`

`@dsa/dsh-plugin-manager/lib/index.js:1930-1943` (`setPluginEnabled`):
`await writePluginEnabled(this.profile, row.patchId, row.moduleName, enabled); Object.assign(result, await this.reload(enabled ? [row.patchId] : []));`

`@dsa/dsh-plugin-manager/lib/types/patch.js` (`writePluginEnabled`) edits the profile patch
YAML (comments kept), sets `disabled: !enabled` on the last non-`insert` item with the same
`id` (and equal or absent `name`), or appends `{ id, disabled: !enabled }`; it removes an
`{id, disabled}`-only override when the bundle layers already imply the requested state; atomic
write, mode `0o600`. README `@dsa/dsh-plugin-manager/README.md:40`: *"A plugin toggle updates
only `disabled` in the last matching override in the profile's `cordis.patch.yml`, or appends
an override when none matches."*

Real example in the profile, `~/.dsh/profiles/desktop/cordis.patch.yml:330-331`:

```yaml
- id: optional-terminal-pwsh
  disabled: false
```

### 2.4 Display metadata per row

`@dsa/dsh-app-boot/lib/index.js:2216-2247` (`readPluginMeta(specifier, parentURL)`):
- title/description from `${specifier}/locale/en.json` → `meta.title` / `meta.description`,
  plus sibling `locale/*.json` translations, which must share the English file's directory
  (`:2178`);
- only a **package-root** specifier falls back to `package.json` `name`/`description`/`icon`
  (`:2222`); a **subpath** specifier gets its icon only from an exported `${specifier}/icon`
  (`iconOf`, `:2085-2111`; SVG/PNG/JPEG/WebP ≤ 256 KiB);
- final title fallback is the full module specifier (row shows e.g. `billion-context/dsh-compaction-gate`).
- Client title choice `client.js:679`: `row.meta?.title === void 0 ? row.moduleName : resolveText(row.meta.title)`.

### 2.5 Optional per-row "Configure" page

`@dsa/dsh-client-ui-plugin-manager/README.md` (config slots): a client registers slot
`plugins.row.config` with key `<package name>#<row id>` (`client.js:27` `rowConfigKey` →
`` `${bundle}#${rowId}` ``); the row then shows a configure chevron (`client.js:2410-2421`).
*"The bundle's patch must declare the row under that id, and the registration exists while the
bundle is on."*

## 3. Working examples in the installed profile (verified)

Most third-party bundles declare one row (opencode2dsh, dsh-plugin-subscriptions
`id: llm-subscriptions`, dsh-better-sidebar, remote-web-ui, hooks, mcp-console, skills-manager,
browser-skill, dsh-majed …). Multi-row bundles:

**billion-context** (third-party, one package, two components, host subpath entry) —
`~/.dsh/profiles/desktop/node_modules/billion-context/dsh.bundle.patch.yml:21-25`:

```yaml
- insert:
    - id: bili-native
      name: billion-context
    - id: bili-compaction-gate
      name: billion-context/dsh-compaction-gate
```

with `package.json` `exports` `".": "./dist/agent/dsh-native.js"`,
`"./dsh-compaction-gate": "./dist/agent/dsh-compaction-gate.js"`,
`"./client": "./dist/agent/dsh-native-client.js"`, and
`dsh: { bundle: { patch: "./dsh.bundle.patch.yml" }, client: { platform: "web" } }`.
Lines 26-55 of the same file are plain overrides (`compaction-basic`, `preset-*`,
`llm-deepseek`) and are not components.

**@deepseek-ai/dsh-subagent-codex** — `~/.dsh/profiles/desktop/node_modules/@deepseek-ai/dsh-subagent-codex/cordis.patch.yml:1-9`: rows `subagent-codex` (`@deepseek-ai/dsh-subagent-codex`) and `tool-subagent-codex` (`@deepseek-ai/dsh-tool-subagent` with `config: { provider: codex, toolName: subagent_codex, maxDepth: provider-managed }`) — the same module can be a component twice with different ids/config.

**Shipped bundles** (`@dsa/…/cordis.patch.yml`): voice-input (4 rows), cot-translation
(`translator` + `cot-translation`), tool-worktree, inspector-profile, plugin-market
(`plugin-market` with `disabled: !!js "!ctx.get('profileContext')"` + `ui-plugin-market`).
Group form, `@dsa/dsh-experimental-terminal-bundle/cordis.patch.yml:1-19`:

```yaml
- insert:
    - id: optional-persistent-terminals
      name: cordis:group
      group: true
      isolate:
        terminals: true
      config:
        - id: optional-terminal-registry
          name: '@deepseek-ai/dsh-terminal'
        - id: optional-terminal-bash
          name: '@deepseek-ai/dsh-terminal-bash'
          disabled: !!js process.platform === 'win32'
        - id: optional-terminal-pwsh
          name: '@deepseek-ai/dsh-terminal-bash'
          disabled: !!js process.platform !== 'win32'
          config:
            shellDialect: pwsh
        - id: optional-tool-terminal
          name: '@deepseek-ai/dsh-tool-terminal'
```

## 4. What happens when a component is disabled

Verified:
- Host half: `@dsa/cordis-plugin-loader/lib/index.js:336-344` — `disabled` is true when the
  entry or any owning parent entry is disabled (`!!js` evaluated, `:349-350`); `update()`
  (`:373-376`): `if (this.disabled) { this.fiber?.dispose(); return; }`. Disposal withdraws
  everything the fiber registered (Cordis effects; e.g. Typert registrations are "withdrawn
  automatically when the registering component unloads", `@dsa/dsh-typert-registry/README.md:12`).
- Persistence: profile `cordis.patch.yml`, `- id: <rowId>` / `disabled: true` (2.3).
- Restart: not needed with HMR. `@dsa/dsh-plugin-manager/README.md:14`: *"With HMR enabled in
  YAML, configuration changes apply immediately; without HMR, the running composition remains
  until restart."* HMR is enabled by the base bundle when the launcher supplies `profileContext`
  (`@dsa/dsh-hmr/README.md:27`; entry `id: hmr` in `@dsa/dsh-base/cordis.patch.yml:28-29`), i.e.
  desktop/web profiles.
- Client half: `@dsa/dsh-client-modules/lib/index.js:852-858` (`processOne`) only counts entries
  with a fiber and `!entry.disabled`; `:762-766` (`locatePkgJson`) returns nothing for subpath
  loader names (`exactPackageSpecifier`, `:83-89`), so only rows whose `name` is the bare package
  name produce the browser bundle. When the last such row is disabled the package leaves the
  graph and the open page evicts its modules and styles (`@dsa/dsh-client-modules/README.md`,
  "Live plugin composition": *"disabling it removes the entry and waits for its asynchronous
  effects before evicting unused modules and styles"*).
- Collision rule, `@dsa/dsh-client-modules/lib/index.js:890-896`: two different active Loader
  sources resolving to the same package throw
  `client-modules: package ${packageName} resolves from multiple active Loader sources: …; remove one entry`.
  Two rows with the **same** `name` and base share one source key (`:810-812`), so that is fine;
  a bare-name row plus a `./relative` or `file:` row of the same package is not.

How the plugin's code learns it is disabled (verified mechanism + inference on use):
- Host: there is no "you are disabled" callback; the component's fiber is disposed (its
  `ctx.on('dispose')`/effect disposers run) and re-applied from scratch on re-enable. A
  component that stays enabled sees a disabled sibling only through absence of what the sibling
  provided (service via `ctx.get(...)`/`inject`, route, registry entry).
- Client: the single client half is not told which host rows are on. Options (inference):
  probe a host route/service owned by that component (404/absent ⇒ off), or read the
  `pluginInventory/list` Remote, which reports each entry id with effective enablement and phase
  (`@dsa/dsh-host-plugin-inventory/README.md`, "What a snapshot contains"; the Client assembly
  mounts the "read-only Host plugin inventory", `@dsa/dsh-api-remotes/README.md:32`). The
  inventory has no change subscription — poll or re-read on navigation; the manager emits
  `plugin-manager/changed` after its own operations (`@dsa/dsh-plugin-manager/README.md:60`).

## 5. Constraints for one npm package with several components

Verified constraints:
1. Declare each component as its own `insert` row in the bundle patch with a **profile-unique
   `id`** (prefix it, e.g. `majed-…`), else the switch locks as `unaddressable`.
2. Each row needs its own host entry module (`name`). Use the package root for one row and
   exported subpaths for the others (billion-context pattern), or the same module twice with
   different `config` (subagent-codex pattern).
3. Exactly one browser half per package, loaded while ≥1 enabled bare-name row exists. Subpath
   rows have no client half. Disabling the bare-name row therefore removes **all** client UI of
   the package, including UI of components that are still on.
4. Per-row title/description need `<specifier>/locale/en.json` (+ translations in the same
   directory) reachable through `exports`; subpath rows never read `package.json`. Today
   dsh-majed exports only `"./locale/*.json"` (package root) and `"./icon"`.
5. `disabled: true` in the bundle patch makes a component ship off; the user's switch then
   writes `{id, disabled: false}` to the profile patch.
6. (Inference, not tested.) Hard dependencies between rows: if component B needs component
   A's service, B should `inject` it, so B presumably pends while A is off (the page has a
   "Waiting for dependencies" label for the `pending` phase, `client.js:353`
   `rowPhasePending`). Do not let the core row depend on optional rows.

## 6. What dsh-majed would need (inference, derived from the verified rules)

Planning input only: per `docs/ai/current-work.md` (2026-10-29) no feature implementation is
authorized until the Owner approves a new plan.

Current state: `dsh-majed-integration/package.json` `exports` = `"."`, `"./client"`,
`"./locale/*.json"`, `"./icon"`; `cordis.patch.yml` = one row `id: majed, name: 'dsh-majed'`;
`index.js:16-34` applies every feature (baseline, settings, managed MCP, skills, judgment,
`applyCodexAccounts`, hooks approval, command policy/mode, native API references) in one fiber.

Sketch:

```yaml
# cordis.patch.yml
- insert:
    - id: majed                     # core: baseline, Settings, and the only client half
      name: 'dsh-majed'
    - id: majed-subscriptions       # Subscriptions component (host half only)
      name: 'dsh-majed/subscriptions'
```

```json
"exports": {
  ".": "./index.js",
  "./subscriptions": "./modules/subscriptions/entry.js",
  "./subscriptions/locale/*.json": "./modules/subscriptions/locale/*.json",
  "./subscriptions/icon": "./modules/subscriptions/icon.svg",
  "./client": "./dist/client.js",
  "./locale/*.json": "./locale/*.json",
  "./icon": "./icon.svg"
}
```

- `modules/subscriptions/entry.js` exports `apply(ctx, config)` calling what `index.js:22`
  (`applyCodexAccounts`) does today, and `index.js` stops calling it.
- `modules/subscriptions/locale/en.json` / `ar.json`: `{ "meta": { "title": "Subscriptions", "description": "…" } }`.
- Row config: move `config.codexAccounts` to the new row's `config` (profile overrides then
  target `id: majed-subscriptions`).
- The client half must hide the Subscriptions UI when the host row is off (probe its route or
  read `pluginInventory/list` for entry id `majed-subscriptions`).
- Repeat per later feature (`majed-judgment`, `majed-mcp`, …). Shared state between components
  should go through a Cordis service provided by the core row and `inject`ed by the others.

## 7. Open uncertainties

- Not visually confirmed in the live GUI (no browsing performed); labels come from the bundled
  `en` strings.
- `entryId` exact format for nested/group children (Loader `Entry.id` prefixes the tree's fiber
  entry id, `@dsa/cordis-plugin-loader/lib/index.js:330-333`) — irrelevant for flat rows.
- Whether `ctx.remote.pluginInventory.list` (name/shape) is callable from a third-party client
  half without extra grants was not tested.
- Whether the Plugins page refreshes the dsh-majed bundle's row list after an in-place package
  update with new rows without restart (HMR recomposition re-reads bundle patches per
  `@dsa/dsh-plugin-manager/README.md:98`, but not tested).
- An exported subpath must be importable by the profile resolver; billion-context proves the
  pattern works for a published package, not yet for a `github:` dependency like dsh-majed.
