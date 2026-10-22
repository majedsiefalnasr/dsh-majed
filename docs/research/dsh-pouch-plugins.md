# Research: `moon16u/dsh-pouch` plugins (dsh-hooks, dsh-mcp-console, dsh-restart)

Date: 2026-10-22. Primary sources only: clone of <https://github.com/moon16u/dsh-pouch> at `/tmp/dsh-pouch` (HEAD `e9c2aa153b4a`), and the installed copies in
`~/.dsh/profiles/desktop/node_modules/@moon16u/` (read-only). `diff -rq` of `lib/` between clone and installed copies is **identical** for all three packages
(hooks 2.1.0, mcp-console 0.3.10, restart 0.4.4). Paths below are relative to `packages/<pkg>/` in the repo unless stated. "(unverified)" marks claims not confirmed in code.

## 0. Cross-cutting facts

| Topic | Finding |
|---|---|
| Layout | pnpm workspace, root `package.json` is `private`, `engines.dsh >=0.2.1-rc.1`, `test: pnpm -r test`. One folder per plugin, each independently published to npm as `@moon16u/<name>`. Old all-in-one `@moon16u/dsh-pouch 0.7.3` is deprecated (root README). |
| Tags | Annotated tags `v<dir>@<version>` (e.g. `vdsh-hooks@2.1.0`, `vdsh-mcp-console@0.3.10`, `vdsh-restart@0.4.4`). |
| GitHub Releases | **None** (`gh api repos/moon16u/dsh-pouch/releases` returned 0). |
| CHANGELOG | **None anywhere** in the repo. History = git log + "upgrade note" prose in READMEs (e.g. `dsh-hooks/README.md:89-92`). |
| Release flow | `scripts/README.md:35-68`: bump version + commit → `node scripts/release-check.mjs <dir>` (not private, `publishConfig.access`+registry, `engines.node`, version not already on npm, tag unused, HEAD tree carries the version) → `node scripts/release-tag.mjs <dir>` → push main + tag. |
| Publish CI | `.github/workflows/publish.yml:13-137`: triggers on tags `v*`; `permissions: contents:read, id-token:write` (npm provenance, :18-21); parses tag and requires `packages/<dir>/package.json` version to match (:29-57); pnpm 11 + node 22, `--frozen-lockfile`; checks `NPM_TOKEN` via `npm whoami` (:71-87); runs `pnpm --filter @moon16u/<pkg> test` (:89-90); skips if version already on npm (:96-110); `npm publish ./packages/<pkg> --access public --provenance --tag latest` (:118); polls 10×15 s until the version resolves (:120-137). |
| Other CI | `ci.yml` (push/PR main, ubuntu, node 22, `pnpm test`); `hooks-platforms.yml`, `mcp-console-platforms.yml`, `restart-platforms.yml` (ubuntu/windows/macos matrices, path-filtered). |
| Docs hygiene | Root `CONTRIBUTING.md` is stale (still says `packages/dsh-plugin-<name>`). |
| Install on this machine | Profile `desktop` `package.json` lines 32-34 (plugin list) and 49-51 (deps `^2.1.0`, `^0.3.10`, `^0.4.4`). Profile `cordis.patch.yml` contains the mcp-console "automatic handoff" block (see §2.6). |

Common client pattern (all three): a single hand-written, un-bundled `lib/client.js` using `window.__ModuleLoader__.load({id, factory:(require)=>…})`, `React.createElement`, `require("@deepseek-ai/dsh-client-ui-primitives")`, and `exports.apply/inject`. Each ships a `cordis.patch.yml` containing only `- insert: [{id, name}]` (e.g. `dsh-hooks/cordis.patch.yml:1-3`) and declares it via `package.json` `dsh.bundle.patch`.

---

## 1. `@moon16u/dsh-hooks` 2.1.0

### 1.1 What it does for the user
- Runs **command hooks** (shell commands) on agent lifecycle events. Everything is **inert until the user approves it** (`README.md:5-35`).
- GUI is **approval-only**: Plugins → Installed → Built-in plugin configuration → *Hooks*. Source cards (project / user / profile) → modal → event groups → expandable hook rows (command, matcher, timeout, mode; read-only "Additional configuration": cwd, source, limits, pinned files, env *names*, fingerprint). Actions: approve, enable/disable, revoke, refresh, open source file. **No add/edit/delete/JSON editor** (`README.md:31-33`).
- Hooks are declared in files: project `<git-root>/.dsh/hooks.json`, user `$DSH_HOME/hooks.json`, profile `commandHooks` config string (`README.md:39-43`; discovery `lib/hooks/config.js:144-152`).
- Events (`lib/hooks/config.js:5-16`): SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, PermissionRequest, Stop, PostCompact, plus observe-only SessionEnd, SubagentStart, SubagentStop. Matchers are bounded globs (`* ? |`), not regex (`config.js:36-58`).
- No slash commands, no agent tools.

### 1.2 Architecture
- **Host half** (`lib/index.js`, `lib/hooks/*`): `Config = {commandHooksEnabled: bool, commandHooks: string}` (`lib/index.js:7-16`) — file-managed only (no `.volatile()`), so not editable in the GUI. `lib/hooks/index.js:11-35`: bails if `DSH_HOOK_ACTIVE==="1"` (recursion guard); `ctx.inject(["subprocess"], …)`; ledger at `$DSH_HOME/workspace-hooks/<sha256(profile)[:16]>.json`; `scope.inject(["connection"], web => registerRoutes(web, engine))`.
- **Cordis seams** (`lib/hooks/adapters.js:10-131`): `agent/created`, `agent/pre-step`, `session/event`, `agent/request`, `tools/pre-execute` (returns `deny|cancel|ask`, always calls `next()` so native guards still run — "hook allow never grants authority", :93-94), `tools/post-execute`, `approval/request` (:107-114), `agent/turn-stopping` (max 3 per turn), `agent/disposed`, `subagent/start|end`. Context injected as user message with `source:{kind:"dsh-command-hooks"}` via `createUserMessage` from `@deepseek-ai/dsh-llm`.
- **Client half** (`lib/client.js`, 360 lines): injects `["slots","locale","remote","remote.session"]` (:358).
- **HTTP routes** (`lib/hooks/routes.js:5-84`): `ctx.connection.fetch.register({path, methods, requestBody, async fetch(request)→Response})` (:15-21) under `/api/dsh-hooks`; disposed through `ctx.effect`. **Auth = connection.fetch owner authentication** (comment :11), therefore works for remote GUI. `request.url` authority is `dsh.internal`; real Host/Origin come from headers (:26-29). POST adds: Origin host must equal Host header, no credentials in origin, `sec-fetch-site != cross-site`, header `x-dsh-hook-ui: 1`, `content-type: application/json`, streamed body cap `CONFIG_LIMIT+16384` (:30-46). Routes: `GET /status`, `POST /review` (one-use 24-byte nonce, TTL 300 s, ≤64 pending, :63-71), `POST /action` (trust requires nonce + key + hash + realpath(cwd) + confirmation string `"RUN AS DSH USER"`, :72-82). Responses `cache-control: no-store`, `nosniff`.
- **Persistence**: own ledger, **not** configEditor. `lib/hooks/store.js:21-72` `{version:1, trust:{key:{hash,at}}, disabled:{key:true}, runs:[≤200]}`; atomic write via `openSync(temp,"wx",0o600)`, dir `0o700`, Windows rename retry 8× (:6-18); ≤4 MiB; "running" runs become "interrupted" on load. The UI never rewrites declaration files.
- **Applying changes**: no restart; the engine re-reads sources on every dispatch/inspect (`lib/hooks/engine.js:29-45, 97-100`).
- **Trust model**: fingerprint = sha256(normalized entry + pinned `watchFiles` contents ≤1 MiB) (`config.js:172-180`); key = hash([canonical cwd, source id, hook id]) (:158). Changed hash → "Hook changed; refresh and review it again" (`engine.js:42-56`), re-checked after queue wait (:140-146). Concurrency 4 / queue 64 (:57-77); dedup per [session,event,identity] (:79-95); infra error on a blocking event ⇒ block.

### 1.3 UI approach
- **Not** a `settings.section`. Registers slot `plugins.item` (`id:"dsh-hooks", order:45`) with a page component plus `plugins.detail.actions` for the refresh icon (`lib/client.js:343-356`). Locale via `ctx.locale.register/bind` with zh+en dictionaries (:9-59, :340-341).
- Primitives used: `UI.Modal` (`open,title,description,closeLabel,className,contentClassName,onClose`, :326-327), `UI.Button` (primary/ghost), `UI.Switch`. Everything else is a custom `<style>` string (:60-117), class prefix `wh-`.
- Tokens: `--dsw-alias-label-primary/secondary`, `--dsw-alias-border-l3`, `--dsw-alias-bg-module-platform`, `--dsw-alias-interactive-bg-hover`, `--dsw-alias-state-business-primary`, `--dsw-alias-state-error-primary`, `--dsw-font-mono`, and host vars `--dsh-frame-top-clearance`, `--dsh-frame-overlay-top` — always with hex fallbacks.
- Fonts/sizes: root `font:inherit` (:61) but literal px sizes 11–23 px (modal h2 23 px) — **does not scale with the user's `ui-theme fontSize`** (user profile has fontSize 18). Hard-coded accent `#086edb`. Fragile host-DOM overrides `[data-plugin-item-detail="dsh-hooks"]` and `[data-platform=darwin]` (:68-75). Modal scroll fix: `contentClassName` + `max-height: calc(100dvh - 2*max(24px, var(--dsh-frame-overlay-top,24px)))` (:81-89; `docs/design.md:86-102`). Mobile `@media (max-width:560px)` (:116).
- Client fetch: `fetch(API+path,{credentials:"same-origin", headers:{"content-type":"application/json","x-dsh-hook-ui":"1"}})` (:118-128).

### 1.4 Security/safety
- `SECURITY.md:21-68`: commands run **as the DSH OS user, no sandbox, no per-command approval**. Trust hash covers normalized settings, source, canonical cwd, `watchFiles` contents; other dependencies are not pinned, hash is not atomic w.r.t. execution. Ledger `0600` is not tamper-proof against the same OS user. One DSH process per profile (concurrent ledger writers unsupported).
- Execution (`lib/hooks/runner.js:13-49, 51-96`): `ctx.subprocess`; event JSON on **stdin only** (no interpolation); stdout/stderr capped; 500 ms grace; exit 0 ok / 2 block / else error; output parsed through a strict field allow-list. Shell wrappers `bash --noprofile --norc -c`, `pwsh -NoProfile -NonInteractive` (`shell.js:31-48`); `BASH_ENV/ENV/NODE_OPTIONS` unset.
- Secrets: hook `env` values live plaintext in the declaration file; `/status` reduces them to names (`routes.js:58`); stderr tails redacted best-effort (env values and `Bearer …`, `engine.js:167-170`); stdout never persisted.
- Confirmation for dangerous action (trust): server-enforced nonce + exact confirmation string, UI click on *Approve* is the consent (since 2.1). Management routes can't tell a human from another same-origin plugin (documented limitation).
- Schema change (new `shell` field) reset all approvals with no migration (`README.md:89-92`).

### 1.5 Packaging / tests
- `package.json`: `type: module`, `exports {".", "./client", "./package.json", "./cordis.patch.yml"}`, `files [lib, cordis.patch.yml, SECURITY.md, docs]`, `engines node>=22, dsh>=0.2.1-rc.2`, peers `cordis ~4.0.5, dsh-llm >=0.2.1-rc.2, schemastery ~3.18.5`, `dsh.client.inject [client-locale, client-ui-settings, client-ui-plugin-manager, dsh-api-session-controller]`, `dsh.client.platform "web"`, `dsh.bundle.patch ./cordis.patch.yml`, `publishConfig` public/npmjs.
- Tests (`node --test test/*.test.mjs`): `hooks.test.mjs` (488 lines), `native`, `platforms`, `client`, `smoke`, plus `browser-scroll.mjs` (real wheel/PageDown at 1440×768, 1024×420, 390×640) and `official-runtime.mjs`; docs claim 72 offline tests (`docs/design.md:62`). 3-OS CI matrix. Docs: `docs/command-hooks.md`, `docs/platforms.md`, `SECURITY.md`.

### 1.6 Reusable vs pitfalls
Reusable: file-declared config + approval ledger keyed by content hash; `connection.fetch.register` (owner-authenticated, remote-GUI-safe) with Host/Origin/`x-…-ui` header checks; two-step review/nonce for dangerous actions; never grant authority from a hook (`next()` chain); stdin-only event delivery; read-only "Additional configuration" panel; browser scroll tests. Pitfalls: custom CSS with literal px and hard-coded accent, host-DOM attribute selectors, schema change silently revokes approvals, no CHANGELOG.

---

## 2. `@moon16u/dsh-mcp-console` 0.3.10

### 2.1 What it does for the user (`README.md:33-47`)
- Add / edit / delete / enable-disable / reconnect MCP servers (stdio + streamable-http; advanced reconnect policy, `maxInstructionBytes`) **without restarting DSH**.
- "Test connection" probe (throwaway official-client fiber, `failOnStartupError`, 15 s timeout; live servers return live status).
- Per-tool toggle pills, enforced through `tools.guard` deny (tool stays visible to the model but is denied — documented limitation, `README.md:75-83`).
- Live status via SSE; `mcpServers` JSON import (existing names skipped); auto-ingest of MCP entries from the profile `cordis.patch.yml`; automatic handoff block so the official `mcp-client` resumes if the console is removed; project scope (`<root>/.dsh/mcp.json` via `?sessionId=`; global + project aggregated).
- Model awareness: a system-prompt section (`announceToAgent`, default true) telling the agent to edit `dsh-mcp.json` and `POST /api/dsh-mcp-console/refresh` and never edit `cordis.patch.yml` (`lib/index.js:55-69, 113-119`).
- **Single UI entry** (`plugins.item` `ui-mcp-console`); README explicitly says **no Settings section** (`README.md:46`). No slash commands/tools.

### 2.2 Architecture
- "Zero MCP protocol code": `lib/clientAdapter.js:1-104` dynamically resolves `@deepseek-ai/dsh-mcp-client` from `<DSH_HOME>/profiles/node_modules` or each profile's `node_modules` (shares the loader's module instance so server-name namespace conflicts are detected natively). One cordis **fiber per server**: `this.ctx.plugin(this.mcpClient, this.clientConfig(config))` (`lib/orchestrator.js:692`, probe :579); `fiber.dispose()` / `swapFiber` (:725-729).
- Host composition (`lib/index.js:74-287`): `ctx.inject(["webServer","tools"], buildComposition)` (:125); `systemPrompt.section({name:"plugin:mcp-console", order:160})`; `scope.tools.guard(exec => orchestrator.toolGuard(exec))` (:230) and per-project `agent.ctx.tools.guard` (:208); status from `tools/change`, `internal/status`, `agent/disposed` + 5 s unref'd interval; `releaseHandoffFibers(scope).then(() => orchestrator.bootstrap())` (:262-274); serialized `syncChain`. Only official setting: `announceToAgent: z.boolean().default(true).volatile()` (:36-39), `ctx.on("settings/document-updated", sync)` (:284).
- **Routes use the LEGACY `ctx.webServer.register({kind:"prefix", path:"/api/dsh-mcp-console", handler:(req,res)=>…})`** (`lib/routes.js:89-102`) — raw Node req/res, **not** `connection.fetch`. Compare: dsh-restart's comment says "connection.fetch authenticates requests; a raw webServer route would not" (`dsh-restart/lib/index.js:167`).
- **Auth = custom loopback fence** `isLoopback(req)` (`routes.js:327-351`): socket remote ∈ {127.0.0.1, ::1, ::ffff:127.0.0.1}, Host hostname ∈ {127.0.0.1, localhost, [::1]}, no cross-site `sec-fetch-site`, Origin == Host if present, else 403 "loopback only" (:152-155). Consequences: **no owner authentication** (any local process can call it — README:73), and it is probably unusable from a non-loopback / remote GUI such as the `@linxin666/dsh-remote-web-ui` tunnel present in this profile (whether a tunnel preserves loopback is **unverified**). No CSRF custom header.
- Endpoints: `GET /health`, `POST /refresh`, `POST /export-yaml`, `GET/POST /servers`, `PATCH/DELETE /servers/:name`, `POST /servers/:name/{enable,disable,reconnect,probe}`, `POST /import`, `GET /events` (SSE: heartbeat 25 s, `status_changed` throttled 500 ms, de-duplicated), `GET /config` (PUT 405). Body limit 1 MiB (:35). Error shape `{error:{code,message}}`, `invalid 400 / conflict 409 / not_found 404 / internal 500`.
- **Persistence**: own JSON store, not configEditor. Global `~/.dsh/dsh-mcp.json` (`lib/store.js:21-23`) `{version:1, servers, ui?, config?}` (:38-59); project `<root>/.dsh/mcp.json` (:26-28). `Store.read()` re-reads disk every time (external edits not clobbered), a corrupt file is renamed `.corrupt.<ts>` (:78-98); `mutate()` atomic (:105-112); `lib/atomicFile.js:30-51` exclusive `wx` temp `0o600`, dir `0o700`, Windows retry.
- **Applying changes**: hot reconcile — add/remove/swap fibers (no restart).
- **Profile YAML** (the interesting bit): `lib/handoff.js` (214 lines) writes a marker-delimited block (`# ---- MCP console automatic handoff: begin/end ----`) into the profile `cordis.patch.yml` containing a native `cordis:group` with `disabled: !!js …` that evaluates true while the console entry is present and enabled, and per-server official `mcp-client` entries otherwise (`handoff.js:80-95`; installed copy visible in this profile's `cordis.patch.yml`, id `mcp-console-handoff`). Safety rails: `splitHandoff` throws on damaged markers (:41-72); `sameHandoff` compares YAML semantically (:107-120); `publish()` refuses on concurrent change ("Profile changed during MCP handoff update"), validates generated YAML, atomic write; `_persist` writes store first then mirror and rolls back on mirror failure (:176-200). `lib/yamlMigrator.js` ingests only "safe" `mcp-client` entries (rejects controls/overrides/unknown keys/inline/duplicates) and removes only matching ranges (`candidate()` :31-45). Profile path = `profile?.patchPath ?? default` (`lib/index.js:156`; default helper assumes profile "web", `yamlMigrator.js:13`).

### 2.3 UI approach (`lib/client.js`, 1513 lines)
- Same loader pattern; `inject = ["slots","locale"]` (:1318), plus `ctx.inject(["configForms"])` binding `configForms.get("ui-mcp-console")` and `ctx.inject(["sessions"])` to learn the focused session (via `ctx.get("uiSession").adapter.current.getSnapshot().key`, fallback "single retained main-view session") so project scope maps to the right workspace (:1432-1500).
- Primitives: **only icons** from `@deepseek-ai/dsh-client-ui-primitives` (`IconRefreshOutlineRegular`, `IconPlus…`, `IconClose…`, `IconTrash…`, `IconLink…`, `IconChevron…`, :11-18). All controls (buttons, switch, inputs, modal, segmented control, pills) are **custom CSS** (:208-339, `mcp-*` classes) rather than ui-primitives.
- Tokens: heavy use of `--dsw-font-family`, `--dsw-alias-label-primary/secondary/tertiary/dimmed`, `-border-l2/l3`, `-bg-base`, `-interactive-bg-hover`, `-brand-primary`, `-state-success-primary/error-primary/warn-label`, `-label-primary-foreground`, always with hex fallbacks; code font `--ds-font-family-code`.
- Fonts/sizes: root `font-family:var(--dsw-font-family)` and literal `font-size:13px/12px/11px/15px/17px` (:223-226, 301-311) — not relative to the theme font size. Form controls use many `!important` rules plus hard-coded colours (`#10b981` primary button, `#ef4444` danger, `#f9fafb` footer, `#d1d5db`) (:305-336) → look can drift from DSH themes (dark mode behaviour **unverified**). Own modal overlay (`mcp-modal`, Escape handled at :1053), not `UI.Modal`.
- Destructive action: UI-side confirm modal ("remove" → `confirmNo` / danger `confirmYes`) (:1264-1281); no server-side confirmation token.
- Fetch: `fetch("/api/dsh-mcp-console"+path, {headers:{"content-type":"application/json"}})` (:370) — no `x-…` CSRF header, no `credentials` option; SSE via `new EventSource(...)` (:1023).

### 2.4 Security/safety
- Secrets: `MASK = "••••"`; `maskRecord` masks env and header **values** (keys kept) in all API responses (`clientAdapter.js:35, 237-243`). PATCH round-trip rule: MASK keeps stored value, `""` removes the entry, anything else replaces (`orchestrator.js` ~784). Plaintext secrets persisted in `dsh-mcp.json` (0600 on POSIX).
- Validation (`clientAdapter.js:140-200`): server name `/^[A-Za-z0-9_-]{1,32}$/` (:29); transport stdio|streamable-http; http(s) URLs; allow-listed reconnect keys. Mapping to official client config at :210-231 (`toolCallTimeoutMs` default 60000, `failOnStartupError`, `maxInstructionBytes`).
- Stdio servers spawn arbitrary commands as the DSH user (same trust class as hooks) but the console has **no per-server approval ledger**; protection is the loopback fence only.
- Honest "Known limitations" list in README:75-83 (no structured connection events; `__` ambiguity in names; rc-version coupling isolated in `clientAdapter.js`/`routes.js`; native client lacks `disabledTools`).

### 2.5 Packaging / tests
- 0.3.10, `engines node>=20, dsh>=0.2.1-rc.1`; `dsh.client.inject [client-locale, client-ui-conversation, client-ui-slots]`; peers mostly optional (`peerDependenciesMeta`): `dsh-mcp-client, dsh-scope, dsh-host-webserver, dsh-settings, dsh-tools`; deps `dsh-home-paths 0.2.1-rc.1`, `yaml ^2.9.1`; types shipped (`lib/types/client/index.d.ts`); test script `node test/run.mjs`.
- 17 test files: aggregate, atomicFile, bind, composition, config, fence, handoff, lifecycle, platform, probe, regressions, render, settings, smoke, stdio, store, yamlMigrator + `fixtures/stdio-server.mjs` (a real stdio MCP server for tests).

### 2.6 Reusable vs pitfalls
Reusable: own JSON store (re-read each time, atomic, corrupt-file quarantine); one fiber per server and `fiber.dispose()` for hot reconcile; throwaway-fiber probe; value masking with MASK/""/replace round-trip; handoff block with semantic YAML comparison and rollback; focused-session lookup for project scope; honest limitations list; atomic-file tests. Pitfalls: legacy `webServer` route + loopback-only fence (no remote GUI, no owner auth); all-custom CSS with `!important` and literal px (does not follow theme font size); secrets plaintext on disk; writes the profile YAML itself (risky: profile path assumptions, concurrent edits); not a Settings section.

---

## 3. `@moon16u/dsh-restart` 0.4.4

### 3.1 What it does
- Slash commands `/restart` and `/dsh-restart` plus agent tool `dsh_restart` (no parameters, fixed 3 s delay) that schedule a **detached, graceful DSH restart** (`lib/index.js:294-323`; `README.md`). Failure visibility: Linux `scripts/dsh-restart.sh` serves a self-contained error page on the port if the new process fails; a persisted `restart-failed.json` marker feeds a system-prompt notice (`failureNoticeSection`, `lib/index.js:192-…`) and a one-time chat error notice in the originating session.
- **Web hosts only**; Desktop (Win/macOS) explicitly unsupported.

### 3.2 Architecture
- Host (`lib/index.js`): `export const inject = ["commands","tools"]` (:10); `ctx.commands.register({name, description, handler})` ×2 (:294-304); `ctx.tools.register(defineTool({…}))` (:306-); system prompt section registered via `ctx.inject(["systemPrompt"], …)` rather than `ctx.get` because "row order carries no load semantics" (:244-247) — a useful cordis lesson.
- HTTP: `GET /api/dsh-restart/status` via **`connection.fetch.register`** (`lib/index.js:163-190`), comment: "connection.fetch authenticates requests; a raw webServer route would not" (:167).
- Native (Windows/macOS Web): `lib/native-restart.js` requires the launcher's `appExit` service (`ctx.get("appExit")`, :25-26), rejects Electron/IPC hosts (:28), spawns a detached Node helper (`lib/native-worker.js`, :73-76) preserving execPath/flags/overlays/cwd/DSH home; Linux uses `scripts/dsh-restart.sh` + `dsh-restart-worker.mjs`.
- Desktop exclusion is **double-layered**: `package.json` `dsh.unsupportedProfiles:["desktop"]` (honoured only by a patched official installer — README says older installers cannot enforce) **and** a runtime guard `if (ctx.get("profileContext").name === "desktop") throw new Error("dsh-restart is Web-only…")` (`lib/index.js:230-232`), tested in `test/desktop-exclusion.test.mjs:5-21`. It is nevertheless physically installed in this user's `desktop` profile (`package.json:34/51`) so it will throw at load there (does not break others; the plugin-load failure behaviour is **unverified**).
- Client (`lib/client.js`, 195 lines): `inject=["commandUi","locale"]` (:11); polls `/api/dsh-restart/status` every second with `credentials:"same-origin"`, stops on 401/404 (:52-60), shows a `commandUi.noticeFor(sessionId,"error",…)`. **Monkey-patches** `commandUi.candidates` (guarded by `__dsh_restart_candidates_wrapped__`) to restyle the `/restart` row with label/description/icon (`IconRefresh`) and de-duplicate the alias (:~90-120) — brittle coupling to a host-internal API.
- Persistence: only `restart-failed.json` marker and logs under DSH home; no config.

### 3.3 UI approach
Minimal UI: only icon from ui-primitives and command-candidate rewriting; no CSS/tokens. Not relevant to Settings sections except as proof that candidate rows can be customised.

### 3.4 Security
Fixed argv/no shell construction on native path; no params on the tool (nothing for a model to inject); restart is an agent-callable tool without confirmation beyond DSH's normal tool approval (unverified how approval is applied). Error page is loopback-only HTTP (README). Error text returned to tool includes log paths only.

### 3.5 Packaging / tests
0.4.4, `engines node>=20, dsh>=0.2.1-rc.1`, `dsh.client.inject [client-locale, client-ui-commands]`, optional peers `dsh-client-ui-commands/primitives`, `dsh-commands`, `dsh-tools`; `files [lib, scripts, cordis.patch.yml]`. 12 test files + `run.mjs` (`client-cordis`, `client-failure`, `desktop-exclusion`, `failure-notice`, `failure-path`, `identity`, `native-integration`, `native-restart`, `native-worker`, `packaging`, `scheduling-failure`, `smoke`); smoke tests use `DSH_RESTART_DRY_RUN=1` + temp `DSH_HOME`; native suites run on a 3-OS matrix.

### 3.6 Relevance to dsh-majed
Mostly out of scope. Useful: (a) use `connection.fetch` for authenticated status endpoints; (b) register services via `ctx.inject([...])`, never `ctx.get` at apply time; (c) a restart helper could solve "changes need a restart" for hook/skill settings, but it is excluded on desktop; (d) dry-run env flag for destructive tests.

---

## 4. Takeaways for dsh-majed

Comparison with dsh-majed's current approach (MCP saved through a root-owned config-editor entry with fiber ownership proof — `modules/managers/ownership.js:9-30`; Hooks as tool-deny wildcard policies):

1. **Persistence simplicity.** Pouch never touches `configEditor`: hooks use a private ledger (`workspace-hooks/*.json`, 0600 atomic), MCP console uses `~/.dsh/dsh-mcp.json` re-read per request. That avoids every ownership/fiber-identity problem ownership.js has to prove, at the price of *not* using DSH's native config model. mcp-console then needs a hand-built YAML handoff block (handoff.js) to stay compatible with the official client — more fragile than dsh-majed's single owned entry. Verdict: pouch is **simpler** for state but **less native**; dsh-majed's ownership proof is heavier but safer for writing real config entries. A hybrid worth considering: keep MCP definitions in configEditor (native, visible to official tooling) but keep *approval/disabled flags/last-run* in a private atomic ledger like `HookStore`.
2. **HTTP auth.** Copy dsh-hooks/dsh-restart: `ctx.connection.fetch.register` (owner-authenticated, remote-GUI compatible) + Host/Origin/`sec-fetch-site` + custom header `x-…-ui:1` + JSON content-type + body cap. Avoid mcp-console's `webServer` + loopback fence (no owner auth, breaks the remote tunnel plugin in the user's profile). If dsh-majed has no HTTP routes and uses RPC/configEditor, this is moot.
3. **Hooks.** Pouch hooks execute commands (high power) and mitigate with: declared-in-file, hash-pinned trust, nonce + typed confirmation, stdin-only input, strict output allow-list, `next()` chain that never grants authority. dsh-majed's tool-deny wildcard policies run **no code**, which is strictly safer; there is no need for an approval ledger. If command hooks are ever added, reuse the review→nonce→confirm flow and the read-only "Additional configuration" panel. Reusable event seams: `tools/pre-execute` returning `deny|cancel|ask` and always calling `next()`.
4. **Reload/apply.** Hot reconcile is feasible: one fiber per MCP server and `fiber.dispose()`; probe via throwaway fiber; hooks re-read files on every dispatch. No restart required — copy the "re-read disk each time" store design to tolerate external edits.
5. **Secrets.** Copy MASK round-trip semantics (MASK = keep, `""` = remove, other = replace) and mask only values (keep keys). Pouch stores plaintext on disk (0600) and never confirms server-side; consider a server-side `confirm:true` for delete/overwrite, and redaction of `Bearer …`/env values in error tails (`engine.js:167-170`).
6. **UI/look-and-feel (where to do better than pouch).** Neither plugin registers a `settings.section`; both use `plugins.item`. dsh-majed's Settings sections are therefore novel; no pouch precedent for `settings.section` was found. Both use `--dsw-alias-*` tokens with hex fallbacks, which is the right idea, but both hardcode px font sizes (11–23 px), hex colours/accents and `!important`, so they will not follow the user's `ui-theme fontSize` (18 in this profile) or dark themes reliably. Prefer: inherit font (`font:inherit`), rem/em or `calc(var(--…))` sizing, `--dsw-*` colour tokens only (no hex literals beyond fallbacks), ui-primitives (`Modal`, `Button`, `Switch`) where they exist; avoid host-DOM selectors like `[data-plugin-item-detail=…]`. Reuse the modal-scroll fix (`--dsh-frame-overlay-top`) and add a real-browser scroll test (`hooks/test/browser-scroll.mjs`).
7. **Client pattern.** `window.__ModuleLoader__.load({id, factory})` single-file client with `ctx.slots.register`, `ctx.locale.register/bind` (zh+en) is proven on the installed host. Get focused session from `ctx.get("uiSession").adapter.current.getSnapshot().key` for per-project scope (mcp-console `client.js:1432-1500`).
8. **Service injection.** Always `ctx.inject([...])` for optional services; `ctx.get` at apply time can see `undefined` because load order has no meaning (`dsh-restart/lib/index.js:244-247`).
9. **Packaging/release (cheap wins).** Adopt `release-check.mjs`/`release-tag.mjs` + tag-driven publish with provenance. Pouch's gaps to improve: add a real CHANGELOG and GitHub Releases (none exist), note schema-breaking changes with a migration (hooks 2.1 reset approvals), keep CONTRIBUTING current. Tests worth copying: atomic-file, store corruption quarantine, stdio fixture server, fence/auth tests, packaging test, desktop-exclusion style "bypassed install fails before registering anything".
10. **Pitfalls to avoid.** Coupling to host internals (restart's `commandUi.candidates` monkey-patch; mcp-console's rc-version coupling and dynamic resolution of `@deepseek-ai/dsh-mcp-client`); writing profile YAML directly; unsupported-profile enforcement that depends on installer version; tool-deny "guard" leaves tools visible to the model (mcp-console limitation) — dsh-majed's wildcard deny policy has the same trait unless tools are hidden at registration.

### Unverified / not checked
- Whether remote tunnels (e.g. `@linxin666/dsh-remote-web-ui`) preserve loopback for mcp-console's fence.
- Dark-theme rendering of mcp-console's hard-coded button/footer colours.
- How the host reacts to `dsh-restart` throwing in the `desktop` profile where it is installed.
- How tool approval applies to the `dsh_restart` tool.
- Content of mcp-console `client.js` beyond sections cited (1513 lines; form logic not fully read) and of `orchestrator.js` beyond the cited lines.
