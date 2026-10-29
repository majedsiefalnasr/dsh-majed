# Subscriptions reference inventory — `dsh-plugin-subscriptions` 0.9.11 (2026-10-29)

Purpose: complete feature inventory of the reference plugin
[V1ki/dsh-plugin-subscriptions](https://github.com/V1ki/dsh-plugin-subscriptions) (MIT), so a port into
`dsh-majed` loses nothing. Read-only research; nothing was changed under `~/.dsh`.

- **Source studied:** v0.9.11, commit `7639ed9958a9a1c4159faa1f4e6e15e9ede60b7d`, extracted at
  `/tmp/upstream-0.9.11` (citations below are `src/...:line` relative to that tree unless noted).
- **Installed copy:** `~/.dsh/profiles/desktop/node_modules/dsh-plugin-subscriptions` is 0.9.11.
- **Existing dsh-majed port:** `modules/subscriptions/codex/upstream/UPSTREAM.json` pins a Codex-only
  subset from **v0.9.9** (commit `9930c5ee…`); see §9.

Legend: **Fact** = read in source/README. *Inference* = my interpretation, flagged as such.

---

## 0. Upstream version status

| Version | Date | Commit | Notes |
|---|---|---|---|
| **v0.9.12 (Latest)** | 2026-10-29 | `b80231108644` | Newer than the studied version |
| v0.9.11 | 2026-10-26 | `7639ed9958a9` | Studied version |
| v0.9.10 / 0.9.9 / 0.9.8 | 2026-10-19 … | — | dsh-majed Codex subset is from 0.9.9 |
| v0.9.7 | — | — | "DSH 0.2 compatibility" |

0.9.11 → 0.9.12 changes (from `gh` release/compare, facts):
1. `1eb254ba` "fix: filter Google usage windows by visible models" — new `src/client/usage-window-filter.ts`
   (14 lines, `visibleUsageWindows` drops Antigravity windows whose `scope` is not in the provider's
   `visibleModels`); `ProviderStatus.visibleModels` added to the `status` RPC; `index.ts` +1 line
   `visibleModels: provider => preferences.get(provider).visibleModels`; `SubscriptionsSection.tsx` +8
   lines; one new locale key `usageNoVisibleModels` ("No quota windows match the selected models.").
2. `b8023110` "fix: simplify DSH prerelease compatibility" — peer ranges become
   `>=0.2.0-rc.2 || >=0.2.1-0` (**drops DSH 0.1.x**); new `dsh-compatibility.spec.ts`. 648 tests total.

*Inference:* both are small; port from 0.9.12 directly (≈ +40 LOC) rather than 0.9.11.

---

## 1. Providers

Provider ids (route names): `codex`, `claude`, `grok`, `copilot`, `antigravity` — config default is all
five (`src/index.ts:228-260`). Display names for the picker group: `ChatGPT (Codex)`,
`Claude (Subscription)`, `Grok (Subscription)`, `GitHub Copilot`, `Google Antigravity`
(`src/index.ts:709-1433`, AccountTokenManager construction). Settings card names:
`Codex (ChatGPT)`, `Claude`, `Grok (X Premium)`, `GitHub Copilot`, `Google Antigravity`
(`src/client/SubscriptionsSection.tsx:146-152`).

### 1.1 Per-provider matrix (facts)

| | Codex (ChatGPT Plus/Pro) | Claude (Pro/Max) | Grok (X Premium) | GitHub Copilot | Google Antigravity |
|---|---|---|---|---|---|
| Login | Browser OAuth + PKCE, loopback `localhost` ports `[1455,1457]`, path `/auth/callback` (`providers/codex.ts:67,129-131`) | (a) **Import Claude Code** creds — macOS Keychain, else `$CLAUDE_CONFIG_DIR`/`~/.claude/.credentials.json` (`auth/claude-code-creds.ts:61-99`), account marked `keychainBound`; (b) browser OAuth, loopback `localhost` port `0` (ephemeral), path `/callback` (`providers/claude.ts:67,187-189`). Default `login` tries import first (`src/index.ts:489-541`) | Browser OAuth (OIDC discovery `auth.x.ai`), loopback `127.0.0.1:56121`, `/callback` (`providers/grok.ts:57,60,135-136`) | **Device code** (`github.com/login/device/code`, poll `login/oauth/access_token`), then Copilot token exchange `api.github.com/copilot_internal/v2/token` (`providers/copilot.ts:72-74`) | Google OAuth, loopback `localhost` `[51121,0]`, `/oauth-callback` (`providers/antigravity.ts:54-61,150-151`); bundled public client id from pi-antigravity (`providers/antigravity-oauth-client.ts:4`); override via config/env `ANTIGRAVITY_CLIENT_ID/SECRET` (README:234) |
| Manual paste fallback | yes — `manual(provider,input)` accepts callback URL or code (`src/index.ts:649`; `auth/rpc.ts` `manual`) | yes | yes | n/a (device code shown + Copy + open page, `client/SubscriptionsSection.tsx:1035`) | yes |
| OAuth flow timeout | 180 s (`auth/oauth-flow.ts:14`) | same | same | device flow (`auth/device-flow.ts:87`) | same |
| Token pre-emptive refresh | 5 min (`common.ts` PREEMPT) | 5 min; Keychain re-sync every 5 min for bound accounts (`src/index.ts:1351-1364`), write-back (`claude-code-creds.ts:136,183`) | 2 min (`grok.ts:56-64`) | 5 min | 5 min |
| Multi-account | yes, keyed by identity (`auth/store.ts:151-173`) | yes (email) | yes (login) | yes (login) | yes (login) |
| Default account | ★ — `setDefault`; direct routes use default; index-0 reported as default (`src/index.ts` status; `auth/store.ts:590`) | same | same | same | same |
| Pooling | yes (§1.3) | yes; model-scoped quota lanes cool per member (`pool-health.ts:80`) | yes | yes; no telemetry → scores 0, last-resort fallback (README:250) | yes |
| Usage/quota | `chatgpt.com/backend-api/wham/usage` → session(5h)/weekly windows + plan (`codex.ts:291,426-448`) | `api.anthropic.com/api/oauth/usage` → `limits[]` or legacy `five_hour`/`seven_day`/`seven_day_opus`/`seven_day_sonnet` (`claude.ts:325,366,382-417`) | `cli-chat-proxy.grok.com/v1/billing?format=credits` → weekly % or legacy cents (`grok.ts:304-369`) | **none** (`supported:false`) | per-model `quotaInfo`/`weeklyQuotaInfo` + plan + paid credits (`antigravity.ts:366-452`) |
| Reset credits | **yes** — list `wham/rate-limit-reset-credits` (`codex.ts:292,310`), consume `consumeCodexResetCredit` (`codex.ts:340`), prepare/consume RPC with 60 s confirm, ≥80 % weekly guard (locales `resetUse*`) | — | — | — | — |
| Model catalog | live `chatgpt.com/backend-api/codex/models` (`codex.ts:460`) | live `api.anthropic.com/v1/models?beta=true` (`claude.ts:65`) + static defaults | live `api.x.ai/v1/models` + efforts from `cli-chat-proxy.grok.com/v1/models` (`grok.ts:387,404,450`) | live `api.githubcopilot.com/models`, per-model wire `chat-completions`/`responses` (`copilot.ts:79,395`) | live `v1internal:fetchAvailableModels` (`antigravity.ts:376`) |
| Static fallback models (`src/index.ts:263-296`) | gpt-5.1-codex, gpt-5.1-codex-mini, gpt-5.1 | claude-opus-5-5, claude-opus-5, claude-sonnet-5, claude-fable-5 (1M/128K), claude-haiku-4-5-20251001 | grok-4, grok-4-fast-reasoning, grok-code-fast-1 | gpt-4.1, gpt-4o, claude-sonnet-4.5, gemini-2.5-pro | gemini-3-flash, gemini-3.1-pro-high, claude-sonnet-4-6, claude-opus-4-6-thinking |
| Wire / translator | Responses (`translate/responses.ts`) | Anthropic Messages (`translate/anthropic.ts`) | Responses (`api.x.ai/v1/responses`) | Chat Completions or Responses (`translate/chat-completions.ts`, `copilot.ts:528` item normalizer) | Gemini `generateContent`/`streamGenerateContent` + v1internal envelope (`translate/antigravity*.ts`), daily→prod endpoint fallback on transport/404/5xx (README:238) |
| Speed / fast | **Fast tier** = `service_tier: "priority"` when catalog advertises it (`codex.ts:122,498-499,751,974`); per-session, subagent default per model | — | — | — | — |
| Prompt-cache TTL | — | `5m` (default) / `1h` via config `claudePromptCacheTtl` and per-provider override in Manage dialog (`provider-settings.ts:28-41`, `translate/anthropic.ts:28-70`: Claude Code identity system prefix, cache stride 15, 3 message breakpoints) | — | — | — |
| Client version presented | Codex CLI version from npm `@openai/codex` (`codex-client-version.ts:6`), built-in `0.153.4` (`codex.ts:468`), config `codexClientVersion` | Claude Code CLI version from npm `@anthropic-ai/claude-code` (`claude-cli-version.ts:10`), fallback `2.1.283` (`claude.ts:109`) | — | VS Code version (fallback 1.107.0, `copilot.ts:92`) | `antigravity.userAgent` config |
| Provider tools (`provider-settings.ts:7-13`) | `image_generate`, `web_search` | — | `image_generate`, `video_generate`, `x_search` | — | — |
| Provider-specific settings | contextWindows, subagentSpeeds (codex only) | promptCacheTtl (claude only) | — | `wire` per configured model | clientId/clientSecret/baseURL/userAgent/onboard |

### 1.2 Model defaults & reasoning efforts (facts)
- Per-model default reasoning effort stored in `model-defaults.json` (`src/model-defaults.ts:31,152,169,197`);
  `setModelDefault` validates the effort is advertised (`src/index.ts:1158-1239`). Efforts merged from
  discovered capabilities (`providers/common.ts:596-622`), intersected across pool members (README:185).
- A non-empty `config.models.<provider>` list **overrides** discovery (`src/index.ts:734-736`).
- Catalog persisted in `models.json` (`providers/catalog-store.ts:27`), per-account catalogs
  (`accountCatalogStore` `:246`); refreshed hourly (`providers/catalog-refresh.ts:2`; `src/index.ts:1337-1344`),
  discovery TTL 5 min, timeout 10 s (`common.ts:452,648`).

### 1.3 Pooling & rate limits (facts)
- Union of account catalogs in the picker, no extra ids (`providers/accounts.ts:83`, README:242).
- Strategies `priority` | `quota_aware` (default), `switchMargin` 2 (`providers/pool.ts:34,68`).
- Gate: any window ≥95 % (`pool-usage.ts:20`); usage TTL 5 min (`:22`).
- Cooldowns: quota 5 min, auth 24 h, transient 60 s (`pool-health.ts:27-31`), reset times read from 429s
  (`providers/rate-limit.ts`, max wait 6 h `:51`, retry policy `:366`; README:272-300; requires
  `@deepseek-ai/dsh-llm-retry` in the composition to actually wait).
- `families` (explicit same-provider member lists) and `tiers` (extra heterogeneous picker rows)
  (`providers/pool-family.ts:64`, README:252-270).
- Per-account preferences: alias, `poolEnabled`, `independentEntry` (adds `~account:<key>/<model>`
  picker ids, `providers/account-preferences.ts:11-26`), `poolModels` allowlist (`provider-settings.ts:19-27`).
- Image generation has its own account scheduler (`providers/image-pool.ts:21`, README:85).

---

## 2. User-visible UI surfaces (client, `src/client/`)

Client entry `src/client/index.ts` injects `['slots','connection','locale']` (`:61`).

| Surface | Slot / registration | Component file | Notes |
|---|---|---|---|
| **Settings > Subscriptions** | `settings.section`, id `subscriptions`, order 90, label `t('nav')` (`index.ts:87-94`) | `SubscriptionsSection.tsx` (1202 LOC) | Polls `status` every 2 s while busy (`:28`) |
| ↳ Intro + usage-badge display setting | — | `UsageBadgeDisplaySetting.tsx` (`SubscriptionsSection.tsx:828-829`) | Mode `recent`/`hidden`, stored in browser `localStorage` key `dsh.subscriptions.usageBadgeMode` (`usage-badge-preferences.ts:5-40`) |
| ↳ Proxy row + **Proxy settings dialog** | — | `SubscriptionsSection.tsx:838, 1100-1190` | enable, URL (HTTP/HTTPS only), username, password (never returned; "clear saved"), bypass list, **Test** (HTTP status + ms), Save/Cancel (locales `proxy*`) |
| ↳ Provider cards (5) | — | `SubscriptionsSection.tsx:861-1060` | status (Not logged in / N accounts), `ClientVersionTag` (CLI version + source npm/local/built-in/configured, `:293`), account rows (identity, plan, expiry, ★ Default badge, Set default, Log out w/ confirm), **Usage** block per account (bars colored by `usageBarColor` `:332`, reset time, plan, Refresh), Codex **Usage limit resets** `<details>` (`:957`), **Add account** (Claude: Browser authorization / Import Claude Code `:1008`), **Manage** (`:1020`), Copilot device-code panel (`:1035`), manual paste `<details>` (`:1051`), login in progress + Cancel |
| ↳ **Reset confirm dialog** | — | `SubscriptionsSection.tsx:1072-1095` | acknowledge checkbox, "Consume 1 reset" |
| ↳ **Manage {provider} dialog** | — | `ProviderAccountManager.tsx` (229) | subscription display name (≤80 chars) `:144`, Claude **Prompt cache lifetime** select (Follow config / 5 min / 1 h) `:156`, per-account: alias, Include in pool `:183`, Independent picker entry `:185`, pool model allowlist (All / N selected / automatic) `:188`; embeds model editor; single Save/Cancel; emits display-name change event (`display-name-events.ts`) |
| ↳ **Edit model list** | — | `ProviderModelEditor.tsx` (240) | automatic visibility toggle, select all/none, filter (threshold 8 models, `SubscriptionsSection.tsx:34`), per-model display name `:179`, **Default reasoning effort** `:190`, Codex **Context (tokens)** with default/max bounds `:202`, Codex **Subagent default speed** `:211`, **Provider tools** checkboxes (Image/Video/X search/Web search) `:229`; helpers `model-filter.ts`, `account-preferences.ts` |
| **Composer usage badge** | `conversation.composer.dock`, id `subscription-usage`, order 10 (`index.ts:140-149`) | `SubscriptionUsageBadge.tsx` (683) | Collapsed pill (default account of current/most recent subscription), expanded anchored panel with all accounts/windows, preview limit 4, "More quota windows"; polls usage 15 min, current model 3 s via `ctx.get('modelDirectories')` (`:51-54,116-123`) |
| **Speed select** | `conversation.input.right`, id `codex-speed`, order 0 (`index.ts:124-133`) | `SpeedSelect.tsx` (286) | Standard / Fast ("1.5x speed, more usage"); visible only for Codex models in `fastModels` (`:94-95`); polls 3 s |
| **`/fast` command** | `commandUi.command.register({name:'fast', ui:{kind:'popupSelect'}})` (`index.ts:156-184`) | `fast-command.ts` | Description must be a function on dsh ≥0.1.5; throws `commandFastUnavailable` if not visible (`:173`) |
| **image_generate toolview** | `tool.call.toolview` key `image_generate` (`index.ts:100-105`) | `ImageGenerateToolview.tsx` (204) + `ImageGallery.tsx` (193, lightbox, `MessageImage`) | Loads bytes via `image` RPC |
| **video_generate toolview** | `tool.call.toolview` key `video_generate` (`index.ts:110-115`) | `VideoGenerateToolview.tsx` (235) | Inline `<video>` via `video` RPC |
| Global CSS | `<style>` injected (`index.ts:75-81`), `provider-settings-styles.ts` (206) | — | settings dialog padding, card chrome |

Other slash commands: **only `/fast`** (fact: single `command.register` in `src/client/index.ts`).
Notifications/toasts: none found; status is inline text (grep for toast/notification — fact).

---

## 3. Agent tools, search provider, translators, compat

### 3.1 Tools (registered via `ctx.inject(['tools'])`, `src/index.ts:1390-1432`)
Each registers under canonical name, falling back to an alias on collision (`tools/registration.ts:4-28`).

| Tool | Alias | Provider / model | Params |
|---|---|---|---|
| `image_generate` | `dsh_subscriptions_image_generate` | Codex `gpt-image-2` (`chatgpt.com/backend-api/codex/images/generations|edits`), Grok `grok-imagine-image-2.0` (`api.x.ai/v1/images/generations|edits`) (`tools/image-generate.ts:33-41`) | `prompt`*, `size` 1024x1024/1024x1536/1536x1024/auto, `quality` low/medium/high/auto, `provider` gpt/grok, `referenceImages` 1–5 attachment refs (edit) (`:323-380`); output saved to `…/images/` |
| `video_generate` | `dsh_subscriptions_video_generate` | Grok `grok-imagine-video-1.5`, submit + poll 3 s, max 10 min (`tools/video-generate.ts:24-35`) | `prompt`*, `duration` 1–15, `aspect_ratio` 16:9…2:3, `resolution` 480p/720p/1080p, `image_url` (`:198-225`); MP4 saved to `…/videos/` |
| `x_search` | `dsh_subscriptions_x_search` | Grok `grok-4` hosted x_search (`tools/x-search.ts:17-19`) | `query`*, `allowed_x_handles`, `excluded_x_handles` (≤10), `from_date`, `to_date`, image/video understanding (`:135-158`) |
| web search **provider** (not a tool) | — | `CodexWebSearchProvider` → `chatgpt.com/backend-api/codex/alpha/search`, model `gpt-5.6-terra` (`providers/codex-search.ts:9-31`) registered with `web.registerSearchProvider` (`src/index.ts:1375-1384`) | backs host `web_search` |

Tool policy is per-session creation time: on `agent/created` disabled tools are denied via
`agent.ctx.tools.restrict({deny})` using `toolHistory` (`src/index.ts:1390-1432`, `provider-settings.ts:208-215`).

### 3.2 Translators (`src/translate/`, 2472 LOC)
`anthropic.ts` (599; Claude Code identity prefix, cache control), `responses.ts` (521; Codex/Grok/Copilot
responses), `chat-completions.ts` (432; Copilot), `antigravity.ts` (449) + `antigravity-schema.ts` (138; tool
schema → `parametersJsonSchema`/`parameters`, ref resolution) + `antigravity-thinking.ts` (41; thinking
budgets), `resolved.ts` (227; image resolution/offload, `IMAGE_OFFLOAD_REQUIRED`), `sse.ts` (65).
Supporting provider code: `providers/replay.ts` (reasoning replay envelopes), `common.ts` `idleWatchdog`
(stream idle timeout default 300 s, `src/index.ts:154`), `deterministicSessionId`.

### 3.3 Compat (`src/compat.ts`, 56 LOC)
Namespace import of `@deepseek-ai/dsh-llm` to survive `CallId`→`ToolCallId` rename, local `RpcResult`
mirror, `LegacyToolResultBlock` (`compat.ts:1-54`). With 0.9.12 dropping DSH 0.1.x, *inference:* most of this
is removable in a port targeting DSH 0.2.x only.

---

## 4. Host RPC/HTTP endpoints, storage, config

### 4.1 RPC (`src/auth/rpc.ts`)
Exact POST routes `/api/subscriptions-auth.<endpoint>`, JSON only (415 otherwise), client-request /
server-response envelope (`rpc.ts:32,271-308`), registered with `connection.fetch.register` because
dedicated `rpc.handle` channels broke on dsh 0.1.5 (`rpc.ts:650-666`). Browser calls via
`connection.rpc.call('/api','subscriptions-auth.<ep>')` (`client/subscriptions-rpc.ts:10-14`).

| Endpoint | Purpose | Client caller |
|---|---|---|
| `status` | providers, busy, accounts {key,isDefault,expiresAt,account,plan}, detail, clientVersion (+`visibleModels` in 0.9.12) | `SubscriptionsSection.tsx:524`, `SubscriptionUsageBadge.tsx:292` |
| `login` | start OAuth/device/keychain (`method` oauth|keychain, claude only `rpc.ts:112`) | `SubscriptionsSection.tsx:650` |
| `manual` | paste callback URL/code | `:698` |
| `cancel` | cancel login / dialog | `:685`, `ProviderAccountManager.tsx:222` |
| `logout` | remove one account | `:711` |
| `setDefault` | set default account | `:722` |
| `usage` | usage windows (cached, `force`) | `:583`, badge `:319` |
| `prepareReset` / `consumeReset` | Codex reset credit two-step (20 s timeout) | `:607`, `:621` |
| `providerSettings` / `setProviderSettings` | preferences + model rows + tools + accounts | `ProviderAccountManager.tsx:70,115`, `ProviderModelEditor.tsx:91` |
| `modelDefaults` / `setModelDefault` | default reasoning efforts | `ProviderAccountManager.tsx:98` |
| `speed` / `setSpeed` | per-session Codex tier + fastModels | `SpeedSelect.tsx:91,104` |
| `image` | bytes of generated/attached image (png/jpeg/webp/gif) | `ImageGenerateToolview.tsx:80` |
| `video` | MP4 bytes, name `/^[\w.-]+\.mp4$/` (`rpc.ts:63`) | `VideoGenerateToolview.tsx:69` |
| `proxyGet` / `proxySet` / `proxyTest` | proxy config | `SubscriptionsSection.tsx:745,782,807` |

20 endpoints (`rpc.ts:38-45`).

### 4.2 Storage (all `dshHomePath('plugins','subscriptions',…)` = `~/.dsh/plugins/subscriptions/`)

| File | Content | Cite |
|---|---|---|
| `auth.json` | `{<provider>: {default?, accounts:{<key>: Session}, aliases?}}`, atomic tmp+rename, mode 0600; legacy migration from `plugins/router/auth.json` | `auth/store.ts:108-114,289,294` |
| `provider-settings.json` | `{providers:{<p>: ProviderPreferences}, toolHistory:[{at,provider,tools}]}`, 0600 | `provider-settings.ts:28-41,160` |
| `model-defaults.json` | model id → effort id, 0600 | `model-defaults.ts:31` |
| `models.json` | catalog snapshots (global + per-account) | `providers/catalog-store.ts:27,218,246` |
| `proxy.json` | proxy config incl. password (never returned to browser) | `http.ts:134`, README:306 |
| `images/`, `videos/` | generated media | `tools/image-generate.ts:206`, `tools/video-generate.ts:151` |
| external | Claude Code Keychain item / `~/.claude/.credentials.json` (read + write-back for bound accounts) | `auth/claude-code-creds.ts:61-183` |
| browser | `localStorage` `dsh.subscriptions.usageBadgeMode` | `client/usage-badge-preferences.ts:5` |

Session shapes per provider: `auth/store.ts:29-105` (Codex accessToken/refreshToken/idToken/accountId/
email/planType; Claude +scopes/subscriptionType/keychainBound; Grok tokenEndpoint/scopes; Copilot
accessToken=Copilot token, refreshToken=GitHub OAuth token; Antigravity projectId/plan/scopes).
Codex account key is a JSON tuple `[accountId,'user'|'email',id]` (`store.ts:151-173`).

### 4.3 Config
- `package.json` `dsh` field: `{bundle:{patch:"./cordis.patch.yml"}, client:{platform:"web", inject:[
  "@deepseek-ai/dsh-client-ui-renderer","@deepseek-ai/dsh-client-ui-settings","@deepseek-ai/dsh-client-locale"]}}`;
  `exports` `.` → `lib/index.js`, `./client` → `lib/client.js`.
- `cordis.patch.yml`: `- insert: - id: llm-subscriptions name: dsh-plugin-subscriptions` (self-activation).
- Cordis schema (`src/index.ts:161-260`): `providers[]`, `codexClientVersion`, `streamIdleTimeoutMs` (300000),
  `claudePromptCacheTtl` (`5m`|`1h`), `rateLimit{wait=true,maxWaitMs=21600000}`,
  `models{<provider>: ModelEntry[] {id,name,contextWindow,maxTokens,inputModalities,wire}}`,
  `antigravity{clientId,clientSecret(secret),baseURL,userAgent,onboard=true}`,
  `pool{enabled=true,strategy=quota_aware,switchMargin=2,autoAccounts=true,autoFamilies(deprecated),families,tiers}`.
- Proxy: plugin-level `proxiedFetch` via undici (`http.ts:401`), bypass matching (`:204`), test URL
  `api.x.ai/v1/models`, 15 s (`:88`); also raises connect-attempt timeout ≥1500 ms (`:99`, `src/index.ts:714`).

---

## 5. Locales
- Languages: **en, zh** (`client/locales.ts:4,194`); namespace `settings.subscriptions`
  registered via `ctx.locale.register` (`client/index.ts:70`).
- Keys: **185** in each (counted `^  key:` lines; `zh` typed `Record<keyof typeof en,string>` `:381`).
  0.9.12 adds 1 (`usageNoVisibleModels`) → 186.
- No Arabic or other locales (*relevant if dsh-majed ships more*). Server-side error strings are English.

---

## 6. Dependencies on DSH internals (seams)

### 6.1 Node side
| Dependency | Use | Cite |
|---|---|---|
| `ctx.llm` (`inject=['llm']`) | `registerAdapter([provider], route)` → handle with `replace([route])` to re-announce (fires `llm/adapters-updated`) on auth/catalog/settings change; `listProviders`/`listModels`/`resolveModelInfo` | `src/index.ts:150-151,816-823,1158-1239` |
| `@deepseek-ai/dsh-llm` | `LlmAdapter` base class, `LlmError` + codes (`EMPTY_RESPONSE_CODE`, `QUOTA_EXCEEDED_CODE`, `CONTEXT_WINDOW_EXCEEDED_CODE`), `ReasoningEffortId`, `errorChain`, `attributionHeaders`, `resolveRetryPolicy`, types `GenerateOptions`, `StreamChunk`, `ReplayEnvelope`, `LlmModelInfo`, `LlmResolvedModelInfo`, `PreparedAdapterCall` | e.g. `providers/codex.ts:8-15`, `providers/pool-health.ts:13`, `providers/rate-limit.ts:19`, `providers/replay.ts:2`, `providers/account-preferences.ts:1-2` |
| `@deepseek-ai/dsh-tools` | `defineTool`, `ToolDefinition`; `toolsCtx.tools.register` | `tools/*.ts`, `src/index.ts:1390` |
| `@deepseek-ai/dsh-web` | `WebSearchProvider`, `WebError`; `web.registerSearchProvider` | `providers/codex-search.ts:4-5`, `src/index.ts:1377` |
| `@deepseek-ai/dsh-attachment` | `ctx.get('attachments')` `AttachmentStore`, `AttachmentId`, `ImageAttachmentRef` | `src/index.ts:25,746`, `auth/rpc.ts:13` |
| `@deepseek-ai/dsh-agent` | `ctx.get('agents')?.get(sessionId)` (origin subagent), `agent/created` event + `agent.ctx.tools.restrict` | `src/index.ts:22,805,1390-1432` |
| `@deepseek-ai/dsh-home-paths` | `dshHomePath` | `auth/store.ts:20` etc. |
| `connection` service | `connection.fetch.register` for exact `/api/...` routes | `auth/rpc.ts:11,650-666` |
| `@deepseek-ai/schemastery`, `@deepseek-ai/cordis` | config schema, `Context`, `ctx.effect`, `ctx.inject` | `src/index.ts:10-11` |
| `undici` ^7 | proxy agent | `package.json`, `http.ts` |
| optional `@deepseek-ai/dsh-llm-retry` | actually performs disclosed-reset waits | README:282 |

### 6.2 Client side
| Dependency | Use | Cite |
|---|---|---|
| `slots` | `settings.section`, `tool.call.toolview`, `conversation.input.right`, `conversation.composer.dock` | `client/index.ts:87-149` |
| `locale` | `ctx.locale.register('settings.subscriptions', {zh,en})`; `LocaleNamespaceMap` augmentation of `@deepseek-ai/dsh-client-ui-slots` | `client/index.ts:46-51,70` |
| `connection` | `ConnectionHandle.rpc` (`@deepseek-ai/dsh-api-remotes/client`) | `client/subscriptions-rpc.ts:1` |
| `commandUi` | `/fast` popupSelect (`@deepseek-ai/dsh-client-ui-commands/client` `CommandUiContract`) | `client/index.ts:21,156-184` |
| `modelDirectories` (from ui-model-selection) | current session model for badge + speed | `client/SubscriptionUsageBadge.tsx:116-123`, `client/index.ts:124-133` |
| `@deepseek-ai/dsh-client-ui-primitives` | icons (`hostIcon(primitives,'Sparkle')`), `useAnchoredPosition`, `useDismissOnOutsidePointer`, `IconProps` | `SubscriptionUsageBadge.tsx:30-31`, `host-icons.ts:9-20` |
| `@deepseek-ai/dsh-client-ui-conversation` | `ToolCallBlock` type for toolviews | `ImageGenerateToolview.tsx:18` |
| type-only augmentations | ui-renderer, ui-settings, ui-conversation, locale | `client/index.ts:11-19` |
| React 18 | components | devDeps |

---

## 7. Size (LOC, `wc -l` on v0.9.11 `src/`, total **20 716**; tests **14 227** LOC in 59 files)

| Area | LOC | Largest files |
|---|---|---|
| `providers/` | 8 578 | codex 1114, copilot 1051, claude 903, grok 890, common 872, antigravity 719, pool 505, rate-limit 383 |
| `client/` | 4 351 | SubscriptionsSection 1202, SubscriptionUsageBadge 683, locales 384, SpeedSelect 286 |
| `translate/` | 2 472 | anthropic 599, responses 521, antigravity 449, chat-completions 432 |
| root (`index.ts` 1433, `http.ts` 479, `model-defaults.ts` 255, `provider-settings.ts` 239, `compat.ts` 56) | 2 462 | |
| `auth/` | 2 065 | rpc 667, store 605, oauth-flow 296, device-flow 233 |
| `tools/` | 1 092 | image-generate 531, video-generate 310, x-search 219 |

*Inference — effort:* a faithful port is ~21 K LOC of TS (+ ~14 K test LOC) on top of the ~4.9 K LOC
already in `modules/subscriptions` (Codex subset from 0.9.9) and `modules/image`/`modules/video`. Rough
split: Codex completion + pool/rate-limit/catalog ≈ 15 %, other four providers + translators ≈ 45 %,
client UI ≈ 25 %, auth/RPC/storage/proxy/tools ≈ 15 %. If vendored mostly verbatim (MIT, with
`UPSTREAM.json` provenance as already done for Codex) this is days, not weeks; a re-implementation is
several weeks.

---

## 8. The seam: how models/providers enter DSH (facts)

1. `cordis.patch.yml` inserts the node plugin; the client half is auto-discovered from `package.json` `dsh.client`.
2. `apply(ctx)` builds one adapter per enabled provider (`LlmAdapter` subclass), wraps it in
   `AccountPreferencesAdapter` (visibility, display names, `~account:` ids, `src/index.ts:816-823`), and calls
   `ctx.llm.registerAdapter([provider], route)`. The returned handle's `replace([route])` re-announces the
   provider whenever auth, catalogs, or preferences change, so the picker updates live.
3. `listModels` returns only logged-in, visible models (`src/index.ts:1125-1131`); not-logged-in providers stay
   out of the picker and fail with `MISSING_CREDENTIAL` (README:167).
4. Search: `web.registerSearchProvider` (candidate, not claim). Tools: `tools.register` with alias fallback.
5. UI: client slots listed in §6.2; RPC: `connection.fetch.register` exact routes.

All of these are public extension points of the host composition (llm, tools, web, connection, slots,
locale, commandUi). The existing dsh-majed code already uses the same seams
(`modules/subscriptions/index.js:74-76`, `modules/subscriptions/codex/runtime.js:217`,
`modules/image/client.js:124`, `modules/video/client.js:117`, `modules/managers/client.js:134`).

---

## 9. Porting risks & open uncertainties

Risks (*inference unless cited*):
- **Name collisions**: if the reference plugin stays installed alongside dsh-majed, both will register
  providers `codex/claude/…`, tools `image_generate`/`video_generate`/`x_search` (alias fallback exists,
  `tools/registration.ts:4-28`), RPC prefix `subscriptions-auth.`, and the same `~/.dsh/plugins/subscriptions/`
  files. dsh-majed already rejects duplicates (`modules/subscriptions/index.js:5-6,69`) and has its own
  `modules/image`/`modules/video` with toolview ids `majed-image-*`/`majed-video-generate` — decide one owner.
- **Shared credential store**: reusing `auth.json` path would let both plugins refresh the same tokens
  (refresh-token rotation can invalidate the other). Claude Keychain write-back has the same hazard.
- **Private/undocumented endpoints** (ChatGPT `backend-api`, Claude OAuth with Claude Code identity/system
  prefix, Grok CLI proxy, Copilot internal token, Antigravity v1internal with a borrowed OAuth client) may
  break or violate provider ToS; upstream tracks them actively (frequent releases).
- **DSH version coupling**: 0.9.12 requires DSH ≥0.2.0-rc.2; compat shims for 0.1.x can be dropped.
- **Client slot contracts** (`conversation.composer.dock`, `conversation.input.right`, `modelDirectories`,
  `commandUi` popupSelect) are host-internal shapes; verify they are stable public extension points in the
  target DSH version before porting.
- **Tests**: 648 upstream tests are the main safety net; porting without them risks silent regressions in
  translators and pool scoring.

Prior partial work (fact, `docs/ai/current-work.md`): branch `archive/s16-subscriptions-port-wip` holds an
untested partial port of the reference Subscriptions UI for Codex (ticket #126 S16, not accepted). It was not
inspected for this inventory; compare it against §2 before re-planning.

Status note: this document is research only. Per `docs/ai/current-work.md` the project is in a re-planning
gate; nothing here authorizes implementation.

Open uncertainties:
- I did not verify the host-side `registerAdapter` / slot contracts in the installed DSH (the app checkout
  path is inside `app.asar`, not a directory); facts here come from the plugin's own usage.
- Locale key count is a line count of `key:` entries; multi-line values could undercount slightly (en and zh
  both 185, consistent).
- Codex reset consume is `POST wham/rate-limit-reset-credits/consume` with body
  `{redeem_request_id, credit_id}` (`providers/codex.ts:344-353`, fact); its server-side idempotency was not verified.
- Antigravity window semantics in 0.9.12 filter depend on `scope` = model id; not cross-checked live.
