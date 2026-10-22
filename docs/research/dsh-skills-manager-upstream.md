# Upstream research: `MichengAI/dsh-skills-manager` (npm `@michengai/dsh-skills-manager`)

Researched 2026-10-22 against primary sources only.

**Sources and notation**

- Git clone of the upstream repo at `master` = tag `v1.2.11` (commit `b4d385b`), kept in `/tmp/dsm-up`. File/line references like `src/index.ts:431` refer to that tag. Repo: <https://github.com/MichengAI/dsh-skills-manager>.
- npm registry metadata and the `1.2.11` tarball (fetched with `curl` from <https://registry.npmjs.org/@michengai%2fdsh-skills-manager>; the `npm` CLI failed with `EPERM` on the root-owned `~/.npm` cache, so `npm view/pack` were not used).
- The locally installed copy `~/.dsh/profiles/desktop/node_modules/@michengai/dsh-skills-manager` (read-only, not modified).
- GitHub issues and releases via `gh`.
- "UNVERIFIED" marks claims I could not confirm from a primary source.

Local-copy identity: the installed copy is `1.2.6`, and all 10 `lib/*.js` files and `locale/` are byte-identical to git tag `v1.2.6`. Compared with `diff -q` against `git show v1.2.6:lib/<f>`.

---

## 1. Changes between 1.2.6 and the latest release (1.2.11)

Latest = **1.2.11**: GitHub release "Latest" at 2026-10-21T15:55Z, npm `dist-tags.latest = 1.2.11` published 2026-10-21T15:56Z. 1.2.6 was released 2026-10-18T03:30Z, so five releases landed in 3 days.

`git diff --stat v1.2.6 v1.2.11`: 27 files, +1689/−238. Changed runtime files are `lib/client.js`, `lib/core.js` and `lib/index.js`. `src/api-base.ts` and `src/sidebar-entry.ts` are new.

Changelog entries come from `CHANGELOG.md` (1.2.11 at line 3, 1.2.10 at line 8, 1.2.9 at line 17, 1.2.8 at line 23, 1.2.7 at line 29):

| Version | Date | Summary (changelog) |
|---|---|---|
| 1.2.7 | 10-19 | Settings nav icon is drawn as an independent CSS-mask `<span>` instead of rewriting the host SVG, because third-party skins (orca-link, dsh-deep-whale) hid the icon (#49). Scope-tab indicator aligned. Per-agent env-var docs. |
| 1.2.8 | 10-19 | Removed the 820px width cap (page fills the host column). Modal body scrolls with the footer kept visible. Nav icon only decorates buttons that contain a direct-child host `svg`. |
| 1.2.9 | 10-21 | **Policy semantics change** (#43, #51). Disable blocks both model and slash invocation globally. Enable no longer forces privileges: it respects the source frontmatter `disable-model-invocation` and `user-invocable`. Repo/catalog installs no longer override `disable-model-invocation: true`. |
| 1.2.10 | 10-21 | 760px resizable monospace detail modal with a "Copy body" button (#54). Non-ASCII skill names preserved (#53). Names the host cannot accept get diagnostics, and historical non-conforming skills can still be disabled/cleaned. Sidebar panel width 960px, native Switch. |
| 1.2.11 | 10-21 | All API URLs, including the self-update URL, are resolved against `document.baseURI` (`src/api-base.ts`). Fixes `non-JSON response (HTTP 404)` behind prefix-stripping reverse proxies (#56). |

Not in the changelog text but in the 1.2.8 to 1.2.10 commits: the **opt-in sidebar entry** (#52). Evidence: `git log` (`e8cfba0 feat(sidebar): support opt-in sidebar entry with bundle config switch`), `src/sidebar-entry.ts`, and `src/index.ts:479-481, 509, 546-553`.

**Security, API, state and host-compat deltas (verified by diffing `src/index.ts`, `src/types.ts` and `src/core.ts`)**

- **Auth model: unchanged.** The same `validateRequestOrigin` and `validateMutationRequest` apply, with no new mechanism and no new trust sources.
- **Routes: exactly one new route**, `/api/dsh-skills-manager/sidebar-entry` (GET/HEAD/POST). `GET`/`HEAD` go through `validateRequestOrigin` only; `POST` also goes through `validateMutationRequest` and the mutation queue.
- **State layout: only an additive optional field.** `state.json` gains `sidebarEntry?: boolean` (`src/types.ts`, `ManagerState`; default `false` in the `core.ts` default state; validator accepts `undefined` and rejects non-booleans). An older state file remains valid.
- **Host compatibility: unchanged.** Supported hosts are still `0.2.0-rc.1`, `0.2.0-rc.2`, `0.2.1-rc.1`, `0.2.1-rc.2` (`scripts/hosts.mjs:3`; peer ranges in `package.json:58-70`). History: 1.2.0 dropped hosts <0.2.0 (`CHANGELOG.md:63-69`; last 0.1.x-compatible release is 1.1.23), 1.2.2 dropped `0.2.1-alpha.*` and added `0.2.1-rc.1` (`CHANGELOG.md:51-55`), and 1.2.3 added `0.2.1-rc.2` (`CHANGELOG.md:47`).
- **Behavioural risk when upgrading 1.2.6 to 1.2.11:** the enable/disable policy rewrite (1.2.9) changes what "enabled" means for skills that declare `disable-model-invocation`/`user-invocable`. The old forced-true override was removed (`git diff` of `src/core.ts`: the `if (override === true) { ... modelInvocable: true, userInvocable: true ... }` block is deleted; `enabled: true` is now returned). Also, non-ASCII declared names are no longer silently "kebab-ified" to empty/truncated names (`toKebab` returns `""` for non-ASCII input; new `isValidDeclaredName` and `hostAcceptableSkillName` in `src/core.ts`).
- **Open security-adjacent issue:** the self-updater (see §2) is unchanged and issue #50 asking for an off-switch is still open.
- Runtime dependencies are unchanged (`fflate 0.8.3` only, `package.json:101-103`).

---

## 2. Architecture

### 2.1 Host half vs client half

- **Host half** (Node, ESM, unbundled, `lib/index.js`): `export { apply, inject, name, ... }` (`src/index.ts:655`). `name = "skills-manager"`, `inject = ["webServer","skills","tools","sessions"]` (`src/index.ts:47-48`).
- **Client half** (browser): `lib/client.js` is a minified CJS bundle wrapped as `window.__ModuleLoader__.load({ id: "@michengai/dsh-skills-manager", factory: (require) => ... })`, with externals `react`, `react-dom`, `react/jsx-runtime`, `react-dom/client` and `@deepseek-ai/dsh-client-ui-primitives` (`scripts/build.mjs`). Its `inject = ["slots","locale"]` (`src/client.ts:983`).
- Package wiring (`package.json`): `main: lib/index.js`, `exports["./client"] = ./lib/client.js`, `dsh.client.inject = [dsh-client-ui-slots, dsh-client-locale, dsh-client-ui-primitives]`, `platform: "web"`, `dsh.bundle.patch = ./cordis.patch.yml` (which inserts `{ id: skills-manager, name: '@michengai/dsh-skills-manager' }`).
- Services/events used by the host half:
  - `ctx.webServer.register`
  - `ctx.skills.registerProvider`
  - `ctx.tools.register`
  - `ctx.get("sessions")`
  - `ctx.get("agents")`
  - `ctx.get("workspaceRegistry")`
  - `ctx.on("agent/created" | "agent/disposed" | "tools/pre-execute")`
  - `ctx.emit("commands/change" | "agent-preset/selected")`
  - `ctx.effect(...)`
- Trusted hosts are read defensively from `root.webRuntime || root.webStartup` because the Cordis context proxy throws on non-injected properties (`src/index.ts:362-376`).

### 2.2 Routes and authentication

One prefix route is registered with `ctx.webServer.register({ kind: "prefix", path: "/api/dsh-skills-manager", handler })` inside `ctx.effect` (`src/index.ts:431-433, 652`). A second, exact route is the self-updater `/api/michengai/dsh-skills-manager/update` (`src/index.ts:355-359`, `src/plugin-updater.ts:445-`).

- GET: `/state`, `/sidebar-entry`, `/workspaces`, `/repositories`, `/clawhub/list`, `/clawhub/search`, `/skills-sh/search` (query-param whitelist, `src/index.ts:476-505`). HEAD is supported for `state`, `sidebar-entry`, `workspaces` and `repositories`.
- POST (all JSON, serialized through `enqueueMutation`, `src/index.ts:386-390, 544`):
  - Generic: `browse`, `workspace-skills`, `detail`, `create`, `import`, `upload`, `delete` (to Trash), `trash-restore`, `trash-delete`, `enable`, `disable`, `source-enable`, `source-disable`.
  - Categories: `category-{create,rename,delete,assign,move,enable,disable}`.
  - Repositories: `repositories/{refresh,add,remove,detail,install,uninstall,preview,update,rollback}`.
  - Catalog: `catalog/{detail,install}`.
  - Sidebar: `sidebar-entry`.
- Upload body limit is `88 << 20` bytes, other bodies 1 MiB (`src/index.ts:52, 74`).
- Response envelope is `{ ok: true, data }` or `{ ok:false, code:"error.*", params?, error }`. 405 is returned for other methods and 404 `error.proto.unknownAction` for unknown actions (`src/index.ts:213-236, 639-641`).

**Authentication is unchanged from 1.2.6 and is not token- or cookie-based.** It is a CSRF-style origin gate:

1. For every request, `validateRequestOrigin` (`src/index.ts:161-184`) requires:
   - the `Host` header to be canonical `host[:port]`;
   - the hostname to be loopback (`localhost`, `[::1]`, `127/8`) or in the host `trustedHosts` (LAN IPs plus `--trusted-host`);
   - `sec-fetch-site` ≠ `cross-site`;
   - `Origin`, if present, to have the same host as `Host`.
2. For POST, `validateMutationRequest` (`src/index.ts:187-194`) additionally requires the custom header `x-dsh-skills-manager: 1` and `content-type: application/json`. No CORS headers are returned, so a cross-site fetch is pre-flighted and fails.
3. Project scope comes from the optional header `x-dsh-skills-session` mapped to that session's `header.cwd` (`activeSessionCwds`, `src/index.ts:286-294`). A `workspace` field in a body must match the host `workspaceRegistry.list()` paths or the request is rejected (`src/index.ts:272-283, 440-443`).
4. The updater POST uses a separate gate, `isTrustedUpdateRequest` (`src/plugin-updater.ts:20-44`): header `x-michengai-plugin-update: 1`, loopback `remoteAddress`, `sec-fetch-site` same-origin, and loopback Host. The desktop app strips `Origin`, so a loopback Host without an Origin is accepted.

Implication: nothing here checks DSH's own session or auth. Security rests on the host binding to loopback/trusted hosts plus same-origin. This matches the reasoning in the code comment ("consistent with the DSH `/api` trust fence", `src/index.ts:138`), but whether DSH enforces more on its own `/api` is UNVERIFIED (I did not inspect the DSH host).

### 2.3 State under `DSH_HOME` (`resolveDshHome = process.env.DSH_HOME || ~/.dsh`, `src/core.ts:116-118`)

| Path | Purpose | Reference |
|---|---|---|
| `$DSH_HOME/skills-manager/state.json` | `{version:1, sources, disabledSkills, enabledSkills, sidebarEntry?, categories, categoryMembers, categoryOrder}` | `src/core.ts:561-563`; `src/types.ts` `ManagerState` |
| `$DSH_HOME/skills-manager/trash/<id>/metadata.json` | Trash with restore metadata | `src/core.ts:565-567, 2126` |
| `$DSH_HOME/skills-manager/repositories.json` | `{version:1, repositories (max 30), installs}` | `src/repositories.ts:147` |
| `$DSH_HOME/skills-manager/repository-cache/`, `.../uploads/` | Caches and staged uploads | `src/repositories.ts:202`; `src/core.ts:3136` |
| `$DSH_HOME/dsh-skills-manager.log` | JSON-lines log, rotated to `.1` at 1 MiB | `src/core.ts:569-571`; `src/index.ts:54-72` |

Skill files themselves are never rewritten for enable/disable. Only the manager state is written (header comment `src/index.ts:10`). Writable roots are `~/.dsh/skills`, project `.dsh/skills` and shared `~/.agents/skills`. About 20 other agents' skill directories are read-only, each with an override env var `DSH_<AGENT>_HOME` (`src/core.ts:131-341`; `README.md:109-133`).

### 2.4 How skills reach the model

- **Providers:** a global provider named `dsh-skills-manager-external`, registered via `ctx.skills.registerProvider(control => ...)` (`src/index.ts:296-308, 391`). It is registered again inside every live agent's own skill layer via the `agent/created`/`agent/disposed` events and `ctx.get("agents")`, so preset-scoped native providers cannot leak disabled skills (`registerAgentSkillProviders`, `src/index.ts:310-352, 392`).
- **Candidate shape** (`src/core.ts:~3305-3335`): `{ name (kebab), description, invocation:{modelInvocable,userInvocable}, provider, source ("user-dsh" | "agent-<key>" | project kind), rank, locator, resourceBase, path, metadata.dshSkillsManager }`.
- **Overlay semantics:** the manager does not republish every skill. It publishes overlays only when needed: duplicate names, an explicit policy override, an invalid invocation policy, a read-only state, or a disabled source (`needsOverlay`, `src/core.ts:~3295-3310`). Everything else is left to the host's native providers.
- **Ranks** (`src/core.ts:42-52, 83, 131-148, 3320-3325`):
  - Official filesystem-provider ranks are DSH = 400, Agents = 500 (`core.ts:127-130` comment).
  - The manager takes shared Agents at 450 and the other agents at +10 steps after that.
  - The user-DSH policy overlay is `USER_DSH_POLICY_RANK = 399`, i.e. just above native DSH.
  - Project sources: DSH = 100, Agents = 200, with overlay rank `root.rank − 1`.
  - When several copies of one name exist, the overlay rank is `min(group ranks) − 1`, so it shadows the copies it is disabling.
- **Slash commands:** after any write `notifyChatCatalog` (`src/index.ts:239-266`) calls the provider `invalidate`, `ctx.emit("commands/change")`, and re-emits `agent-preset/selected` for every session with a preset. The comment says this last step is a workaround: the web `/` menu only refreshes on that event, and `skills/change` is not on the host's forwarding whitelist (`src/index.ts:259-261`). This couples the plugin to unexposed host internals.
- **Create-skill tool:** `ctx.tools.register({ name: "create_skill", description: "Create a new local DSH skill in DSH_HOME/skills. Use only when the user explicitly asks to create or save a reusable skill.", parameters: { name, description, body } (all required, `additionalProperties:false`), execute -> createSkill (serialized), presentCall card "Create DSH skill" })` (`src/index.ts:394-422`). A `tools/pre-execute` hook returns `{ kind: "ask" }` so the user must approve every call (`src/index.ts:423-426`).

### 2.5 Self-updater (relevant to any vendoring/dependency decision)

- `GET` fetches `https://registry.npmjs.org/<pkg>/latest` (`src/plugin-updater.ts:~191`). `POST` installs `<pkg>@<latest>` by spawning the DSH CLI `plugin --profile <p> add --config.minimumReleaseAge=0 ... --registry=https://registry.npmjs.org/` (`:370`), or `desktopPnpm.runPlugin` (`:401`), or a passed-in package manager (`:411`), and rewrites the profile's `pnpm-workspace.yaml` `minimumReleaseAgeExclude` (`:267-366`). Only if none of these is available does it fall back to `pluginManager.installBundle`.
- Open issue **#50** (filed by the VibeDev curated plugin index, 2026-10-19) asks for an off-switch and for `pluginManager.installBundle`, because the current path bypasses DSH's compat check, mirror config and cooldown. It is still open at 1.2.11. A vendored copy inherits this code unless it is stripped.

---

## 3. UI approach

- **Settings section:** `ctx.slots.inject("settings.section", () => ctx.slots.register({ name: "settings.section", id: "skills-manager", order: 25, label: () => t("title"), icon: "skill", locale: NS }, SkillManagerSection))` (`src/client.ts:984`). The order was changed in 1.1.19 to avoid clashing with other plugins (`CHANGELOG.md:98-100`).
- **Nav icon patching:** because the host `icon: "skill"` was not rendering under some skins, `src/settings-nav-icon.ts` observes `[role="dialog"] nav button`, matches the row by its text label, and prepends a CSS-mask `<span class="dssm-nav-icon-skills">`, hiding the host `svg`. This is a DOM-observer hack keyed on the label text, so it is fragile to host markup changes. Icon paths were copied from `dsh-codex-ui` (`src/settings-nav-icon.ts` header comment).
- **Primitives:** imports `Button`, `Modal`, `SegmentedTabs` (`src/client.ts:16`), `Switch`, `Input` and `Menu` from `@deepseek-ai/dsh-client-ui-primitives` (typed by the hand-written ambient `src/primitives.d.ts`). Since 1.2.0 the UI no longer depends on Ant Design (`CHANGELOG.md:63-69`; no `antd` in `package.json`).
- **Tokens:** one large CSS string in `src/client.ts:119-122` plus the sidebar/destination fragments, with every class prefixed `.dssm-*`. It uses `--dsw-alias-label-{primary,secondary,tertiary}`, `--dsw-alias-border-l1..l4`, `--dsw-alias-bg-layer-1..3`, `--dsw-alias-brand-primary`, `--dsw-alias-state-{error,warn,success,business}-primary`, `--dsw-alias-interactive-bg-hover`, `--dsw-alias-link`, `--dsw-radius-{xs,sm,md,lg,xl}` and `--dsw-focus-ring-{width,color}`, always with hard-coded hex fallbacks. `grep -o 'var(--dsw-...' src/*.ts` shows the top uses: label-secondary 27, label-tertiary 21, label-primary 18, border-l2 18, interactive-bg-hover 16, radius-sm 15. Note the heavy use of `!important` and selectors on CSS-module class fragments (`span[class*="_root_"]`) to restyle primitives, which will break if the host renames classes.
- **i18n:** `ctx.locale.register("skills-manager", DICT)` with `zh` and `en` dictionaries inline in `src/client.ts` plus fragments from `repository-ui`, `destination-picker` and `sidebar-entry`. Strings are read with `ctx.locale.bind(NS)`. The active locale comes from `ctx.locale.getLocale().active` and not from the browser (`src/client.ts:148-150`). A separate `locale/{en,zh}.json` carries plugin metadata (issue #36). The UI has no Arabic and no RTL handling (zh/en only).
- **Optional extra surfaces:** a `main` panel plus `sidebar.panellist` row (off by default), and a `plugins.bundle.config` card to toggle it (`src/sidebar-entry.ts`).
- **Code shape:** `src/core.ts` is 3689 lines, `src/client.ts` 985 lines (very long lines, `var`/`any` style), `src/repository-ui.ts` 972 lines; about 10,000 lines of TS in total. It is a monolithic skills product (scopes, categories with drag-and-drop, repositories, ClawHub and skills.sh catalogs, trash/restore, uploads, workspace pages, self-update UI) and not a thin settings section.

**Issues** (`gh issue list --repo MichengAI/dsh-skills-manager --state all --limit 40`; the 40 most recent, #9 to #57, nearly all closed):

- **Open:** #57 (GitHub repo input rejects a proxy-prefixed URL; the maintainer says only standard GitHub URLs/`owner/repo` are accepted and archives always come from `codeload.github.com`) and #50 (updater off-switch).
- **UI-relevant closed:** #25 (duplicate prefix route `/api/dsh-skills-manager` on host 0.2.0-rc.2 produced a blank settings page), #31 (desktop 0.2.0 unusable), #37 (IME input in the composer scrambled after enabling the plugin), #41 (inconsistent transparency/radius), #42 (red/green on/off a11y), #49 (missing nav icon), #54 (detail window too small), #56 (404 behind prefix proxy).
- **Semantics bugs:** #43/#51 (switch overwrote `disable-model-invocation`), #35 (private `customSkillDirs` forced onto all modes), #21 (slash-menu not showing skills), #53 (non-ASCII names).
- **Packaging:** #12 (version-mismatch install failure), #19/#46 (plugin-hub distribution failures), #44 (self-update broke the pnpm cooldown whitelist for all later installs).

The pattern: most breakage came from the plugin's DOM/CSS patching of the host and from host-version coupling, which is exactly the surface dsh-majed would inherit.

---

## 4. Packaging and release conventions

- **CHANGELOG:** `CHANGELOG.md` (English) and `CHANGELOG.zh-CN.md` (Chinese, with an `[English](CHANGELOG.md)` link at the top). Section headers are `## X.Y.Z - YYYY-MM-DD` with flat bullets and `(#NN)` issue references, not Keep-a-Changelog categories. READMEs are also bilingual.
- **Bilingual enforcement:** `scripts/extract-release-notes.mjs` requires `tag === v${package.version}` and requires a section in both changelogs, otherwise it throws `Missing Chinese or English changelog section`. The GitHub release body is `## 中文说明 ... --- ## English ...`.
- **Tags/releases:** tags `vX.Y.Z` (for example `v1.2.6`, `v1.2.11`). Every tag has a GitHub release, and releases are notes only, with no assets. Release commits are titled `chore(release): vX.Y.Z` (`git log`).
- **Workflows** (`.github/workflows/`, Chinese display names):
  - `verify.yml`: on push to master, PRs and dispatch. Ubuntu with a Node `22.19.0` and `24` matrix, `pnpm install --frozen-lockfile`, `npm run verify`. Docs-only changes skip the tests.
  - `compatibility.yml`: Windows matrix over `supportedHosts` (`scripts/hosts.mjs`), running `npm run test:compat -- <host>`.
  - `publish.yml`: on tags `v*`, runs the full verify, checks the tag matches `package.json` and extracts bilingual notes, then `npm publish` with `id-token: write` (npm provenance), then calls `release.yml`.
  - `release.yml`: `gh release create/edit --notes-file`.
- **npm:** `publishConfig = { registry: "https://registry.npmjs.org/", access: "public" }`, `files = [locale, lib, assets, cordis.patch.yml, CHANGELOG.md, CHANGELOG.zh-CN.md]` (+ auto-included `LICENSE`, `README*`, `package.json`). The 1.2.11 tarball has 49 files / 1,483,774 bytes unpacked, and its `dist` has attestations (provenance; issue #50 also confirms provenance for 1.2.7). `engines.node = ^22.19.0 || >=24.0.0`; `packageManager = pnpm@11.22.0`.
- **Compiled `lib/` is committed to git** (`scripts/check-committed-lib.mjs` rebuilds with esbuild 0.25.0 and fails if `lib/` differs), because GitHub installs read the committed `lib/`. I diffed the npm tarball's `lib/` against git `lib/` at v1.2.11 and they are identical, so the tarball is a pure subset of the repo.
- **Supported host versions:** `dsh.engines` is not used. Compatibility is expressed as exact peer pins on eight `@deepseek-ai/dsh-*` packages plus `@deepseek-ai/cordis >=4.0.1 <5.0.0`: `0.2.0-rc.1 || 0.2.0-rc.2 || 0.2.1-rc.1 || 0.2.1-rc.2` (`package.json:58-70`; `README.md:78`). Every new DSH pre-release therefore requires a new plugin release, and a host outside that list cannot satisfy the peers (the exact install-time behaviour is UNVERIFIED).
- **Tests:** about 40 test files in `test/` (plain `node test/*.mjs` or `node --test`, no framework): `core-test.mjs`, `route-lifecycle`, `repositories`, `repository-routes`, `workspace-routes`, `catalog-*`, `clawhub-catalog`, `skills-sh-catalog`, `disabled-external-native`, `categories(-ui)`, `settings-nav-icon`, `sidebar-entry`, `api-base`, `plugin-updater`, `locale-test`, `host-fallback`, `pack-test`, `build-test` and more, plus `fixtures/` and `test/types/`. The test chain is `package.json:46`. **None of `src/` or `test/` ships in the npm tarball** (confirmed: the tarball has only `CHANGELOG*`, `LICENSE`, `README*`, `assets`, `cordis.patch.yml`, `lib`, `locale`, `package.json`), which matches the user's observation. The tests are only obtainable from the GitHub repo. I did not run them.
- `.gitignore` ignores `/docs/`, so upstream design docs are not published.

---

## 5. License / NOTICE implications for vendoring

- `package.json:5` `"license": "Apache-2.0"`. `LICENSE` is the unmodified Apache-2.0 text; the appendix boilerplate `Copyright [yyyy] [name of copyright owner]` is left unfilled. There is **no `NOTICE` file** in git or in the tarball, and no per-file copyright/SPDX headers in `src/` (grep found none). Upstream's copyright holder is therefore only identifiable through git authorship (`迷城`, i.e. MichengAI) and the npm scope.
- Apache-2.0 §4 (my reading of the standard text; not legal advice) requires, for redistributed copies or derivatives:
  - (a) give recipients a copy of the license;
  - (b) mark modified files as changed;
  - (c) keep existing copyright/patent/trademark/attribution notices in source form;
  - (d) carry over any `NOTICE` content, of which there is none here.
- dsh-majed is MIT (`LICENSE`). Its `THIRD_PARTY_NOTICES.md` currently lists fonts and `dsh-persian-rtl`. Including Apache-2.0 code in an MIT-licensed project is acceptable. The MIT grant just doesn't extend to the Apache-licensed files, which must keep their own license text and notices. So:
  - add a row for `@michengai/dsh-skills-manager` (Apache-2.0, pinned version/tag, location);
  - ship the upstream `LICENSE` text alongside the vendored files (for example `modules/skills/vendor/LICENSE`);
  - add a "modified by dsh-majed" note to the vendor `PROVENANCE.md` and to each changed file.
- Other third-party content: the compiled `lib/core.js` imports `fflate` (MIT, per npm — UNVERIFIED here) as a bare specifier. Vendoring `lib/` therefore needs `fflate@0.8.3` as a dependency of dsh-majed, and its license in the notices. `assets/brands/*` are third-party logos (Codex, Claude, Cursor and others). Their licensing/trademark status is UNVERIFIED, and they are not needed if dsh-majed does not vendor `assets/`.
- Minified `lib/client.js` is Apache-2.0 code in compiled form. Keeping it unmodified (no patching of the bundle) avoids the "mark modified" burden. Patching minified output is also impractical.

---

## 6. Options analysis

Facts that drive the comparison:

- Upstream is a complete standalone product, not a library. Its public surface is HTTP routes under `/api/dsh-skills-manager`, host services, and a `settings.section` slot. There is no documented programmatic API or exported module contract beyond `apply/inject/name`.
- The compiled `lib` has no `src`/tests in npm. The repo has both, plus CI and a host-compat matrix.
- Release cadence is high (5 releases in 3 days). Every DSH pre-release needs an upstream bump, and the supported host list is exact.
- It owns the global names `settings.section#skills-manager`, `/api/dsh-skills-manager`, the `skills-manager` plugin name, `create_skill`, the provider `dsh-skills-manager-external`, and the `dssm-` CSS classes. Running a vendored copy and the installed standalone plugin together would collide (issue #25 shows the duplicate-prefix-route failure mode).
- `~/.dsh/profiles/desktop` currently has the standalone 1.2.6 installed. The user's dsh-majed prototype also vendored 1.2.6.

| Option | Pros | Cons / risks |
|---|---|---|
| **(a) Vendor compiled `lib/`** (what the 1.2.6 prototype did) | Zero build step. Identical to what users of upstream run; lib is provenance-attested on npm (tarball `lib/` == git `lib/` at v1.2.11, verified). Smallest diff to carry. | `lib/client.js` is minified and unpatchable; any change (for example renaming route or slot ids, removing the updater, restyling) means patching minified or unbundled code. No tests (not in tarball), so regressions are unguarded. Must re-vendor on every upstream release. Self-updater and `settings-nav-icon` hacks come along. `fflate` must be added. Name collisions with the standalone plugin. |
| **(b) Vendor source at a pinned tag** (for example `v1.2.11`, commit `b4d385b`) | Real source plus tests plus the build script, so you can rename ids (`/api/...`, slot id, `dssm-`), delete the updater and sidebar features, reskin the CSS, and run upstream's ~40 tests as a regression baseline. Diffable against future tags. Clear provenance (tag, commit). Apache obligations are manageable (LICENSE, modified-file notes). | ~10k lines of TS (client in long-line `any`-style code) become a maintenance burden. Needs a TS/esbuild toolchain in dsh-majed, which is currently plain JS. Upstream is Chinese-first (comments/errors in Chinese, zh/en only, no Arabic/RTL). Still tightly coupled to the host's unexposed events (`agent-preset/selected` workaround). Merge pain on upstream churn. |
| **(c) Reimplement a smaller native Skills section** | Matches dsh-majed's scope (Settings sections for Skills, MCPs, Hooks) and its design language and vocabulary. Can pick the minimal feature set (list, enable/disable, scope, detail) and avoid the updater, catalogs, GitHub repos, uploads and the 20-agent matrix. Consistent with the existing `modules/managers` style. No licensing obligations. Full control of security and RTL/Arabic. | Must re-derive subtle skill semantics that upstream fixed over about 50 issues: provider ranks and overlay shadowing (399/450/500, `min−1`), frontmatter `disable-model-invocation`/`user-invocable` inheritance (#43/#51), non-ASCII names (#53), slash-menu refresh (`commands/change` plus the `agent-preset/selected` workaround), per-agent provider layers, trash/restore, path-safety and symlink handling. Highest initial effort and risk of regressions. Whether DSH itself exposes a native skill source/enable API that would make this simpler is UNVERIFIED (I did not read the DSH host). |
| **(d) Keep the standalone plugin; integrate via its public API** | No fork; users get upstream fixes by updating. No licence issue. dsh-majed can just point to or deep-link the existing "Skills" settings section. | The only "API" is internal HTTP routes with a custom-header gate (`x-dsh-skills-manager: 1`), not documented as stable; UI cannot be embedded in dsh-majed's own section (the plugin renders into its own `settings.section`). It cannot give a single unified look or ordering with MCP/Hooks sections (it sets `order: 25` itself). Two plugins would both patch the settings nav. The upstream updater runs inside the user's profile (#50). Host-version pins mean dsh-majed's supported hosts are bounded by upstream's list. The user wants one plugin, which this conflicts with. |

**Evidence-based ranking for dsh-majed's stated goal** (one plugin, own Settings sections, DSH look and `--dsw` tokens, offline/deterministic, supports Skills, MCPs and Hooks):

1. **(c) for the UI, using (b) as a reference/test oracle, not as shipped code.** Build a small native Skills section that reads and toggles DSH's own sources (the `skills` service plus `~/.dsh/skills`, project `.dsh/skills`, and `~/.agents/skills`). Keep upstream at tag `v1.2.11` as an external reference, and copy only the semantics that bugs forced upstream to learn. Port selected upstream tests (core semantics for ranks/overlays/frontmatter) rather than code.
2. **(b) if feature parity is wanted soon.** Vendor `v1.2.11` source (not 1.2.6), strip the updater, sidebar entry, ClawHub/skills.sh and GitHub repo features, and rename the ids. That gets the proven policy engine with tests.
3. **(a) only as a short-term bridge.** The vendored 1.2.6 `lib` is stale relative to 1.2.9 (policy semantics) and 1.2.10 (non-ASCII names) fixes.
4. **(d) is the weakest fit** for a single-plugin goal, but it is a valid fallback if dsh-majed chooses not to own Skills at all.

---

## Takeaways for dsh-majed

1. **Version:** the installed `~/.dsh` copy is 1.2.6. Upstream is **1.2.11** (tag `v1.2.11`, commit `b4d385b`). The delta contains no new auth, one additive route (`/sidebar-entry`), one additive state field (`sidebarEntry`), unchanged host support (`0.2.0-rc.1`–`0.2.1-rc.2`), but real behaviour fixes (1.2.9 invocation-policy semantics; 1.2.10 non-ASCII names; 1.2.11 `document.baseURI` API paths). A vendored 1.2.6 should not be treated as current.
2. **Do not run the vendored copy and the standalone plugin together.** Both claim `/api/dsh-skills-manager`, the `skills-manager` plugin name, the `settings.section#skills-manager` slot id, the `create_skill` tool, `dssm-*` CSS and `~/.dsh/skills-manager/state.json`. The duplicate-prefix-route failure blanked the settings page upstream (#25). If a copy is vendored, rename every id (route prefix, slot id, provider name, tool name, class prefix, CSS style ids) and disable the standalone plugin in the profile. Sharing `skills-manager/state.json` is possible but couples state layouts. Prefer a distinct dsh-majed state path or an explicit migration.
3. **Auth model to copy or at least match:** origin gate (loopback or `trustedHosts`, same-origin `Origin`, `sec-fetch-site`), plus for writes a custom header and `application/json`, and workspace paths restricted to the host registry (`src/index.ts:161-194, 272-283`). dsh-majed's own `modules/managers/transport.js` should implement an equivalent check for its routes.
4. **Strip these from anything vendored:** the self-updater (`src/plugin-updater.ts`, route `/api/michengai/dsh-skills-manager/update`; it shells out to pnpm with `minimumReleaseAge=0` and a forced registry, see issue #50), the sidebar entry, and the `settings-nav-icon` DOM observer, since dsh-majed controls its own nav item.
5. **Skills semantics worth porting verbatim in a native implementation:** rank bands (project DSH 100, project Agents 200, user DSH 400, user overlay 399, Agents 450/500), overlay-only-when-needed, `min(group)−1` shadowing, frontmatter-respecting enable (`disable-model-invocation`, `user-invocable`), kebab-name validation (`KEBAB_RE`) with non-ASCII rejection, per-agent provider re-registration on `agent/created`/`agent/disposed`, and slash-menu refresh through `commands/change` plus `agent-preset/selected`. State writes should go to a manager file and never touch `SKILL.md`.
6. **UI conventions to follow:** `settings.section` registered with `{ name, id, order, label, icon, locale }`; primitives `Button`/`Modal`/`SegmentedTabs`/`Switch`/`Input`/`Menu` from `@deepseek-ai/dsh-client-ui-primitives`; the `--dsw-alias-*` and `--dsw-radius-*` tokens listed in §3 (always with fallbacks); `ctx.locale.register(ns, dict)` plus `bind(ns)` with the locale taken from `ctx.locale.getLocale().active`. Avoid `!important` and `[class*="_root_"]` selectors where possible (upstream's churn: #41, #42, #49, #54). Upstream has no RTL/Arabic, so dsh-majed's Persian/Arabic work cannot be inherited.
7. **Packaging conventions worth adopting:** `## X.Y.Z - YYYY-MM-DD` changelog with an enforced bilingual or paired section check (`scripts/extract-release-notes.mjs`), tag equals `package.json` version, `npm publish` with provenance from CI, a `check-committed-lib` style guard if compiled output is committed, and an exact-host peer list verified by a compat matrix. Upstream's peer pins are exact pre-release versions, so every DSH pre-release needs an upstream bump. If dsh-majed wants to avoid that, use the range from its own `package.json` and test against the installed host (UNVERIFIED how DSH enforces peers at install time).
8. **Licensing:** vendoring Apache-2.0 code into the MIT repo is fine if you add the upstream `LICENSE`, mark modifications, keep attribution (there is no NOTICE and no per-file headers upstream), and add a row to `THIRD_PARTY_NOTICES.md` (component, version/tag/commit, Apache-2.0, location). Add `fflate@0.8.3` if `lib/core.js` is vendored. Do not copy `assets/brands/*` logos (licence/trademark status UNVERIFIED).
9. **Tests:** the npm package has no `src/` or `test/`. If upstream tests are wanted as an oracle, take them from the GitHub tag (`git clone --branch v1.2.11`), not from npm. I did not run them (they target `0.2.0-rc.2` dev dependencies).
10. **Recommended path:** build a smaller native Skills section (option c) that reuses DSH's own skill sources and the semantics in item 5, using tag `v1.2.11` source as a reference and test oracle. Choose option (b), stripped and renamed, only if feature parity (repositories, categories, trash) is needed quickly. Avoid re-shipping the 1.2.6 compiled lib.
11. **Unverified / follow-ups:**
    - how DSH itself exposes skill sources, so how much of option (c) the host already provides (DSH checkout `/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/` not inspected);
    - whether DSH enforces more than the origin gate on `/api`;
    - install-time handling of exact-pin peers outside the list;
    - fflate's licence from a primary source;
    - brand-asset licences;
    - upstream tests' pass/fail status on a current host (not run).
