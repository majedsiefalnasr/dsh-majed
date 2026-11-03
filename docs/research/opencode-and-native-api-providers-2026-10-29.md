# OpenCode (opencode2dsh) and native API providers — research, 2026-10-29

Read-only research for the planned Subscriptions feature (accounts + API providers). No code, profile or `~/.dsh` state was changed; no secret value was read or printed. This document does not authorize implementation: the repository gate in [current work](../ai/current-work.md) still applies.

Path prefixes used below:

- `INST:` = `~/.dsh/profiles/desktop/node_modules/@opencode2dsh/dsh-plugin/` (installed v0.3.14)
- `SRC:` = `/tmp/opencode2dsh/packages/plugin/src/` (clone of https://github.com/FishBottle7/opencode2dsh at commit `89f7c420c9132efdfc6657c2bcea5dc4c6b69ad5`, 2026-10-20)
- `rc3:` = `/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/` (installed DSH runtime 0.2.1-rc.3)
- `UP:` = `/tmp/upstream-0.9.11/src/` (reference plugin V1ki/dsh-plugin-subscriptions 0.9.11)

Labels: **Fact** = read in a cited file; **Inference** = reasoning from facts, not verified live.

---

## A. OpenCode via opencode2dsh

### A1. What "OpenCode" provides here

- **Fact.** opencode2dsh exposes the *anonymous free lane of OpenCode Zen* (opencode.ai's hosted inference gateway) as a DSH provider named `opencode2dsh`. Its pitch: "No API key. No registration. No extra process." (`INST:README.md:5-7`, `:20-23`).
- **Fact.** There is no account, no login and no OAuth. The upstream "key" is the literal string `public` (`SRC:adapter/zen-adapter.ts:157` `ANONYMOUS_KEY='public'`; `INST:README.md:108-123`, `:172-177`).
- **Fact.** Only free models are exposed: a model is free when models.dev pricing says so, and the fallback rule is `id` contains `free` (`SRC:adapter/catalog.ts:79-80`). Live status file reports 82 upstream models, 8 exposed (`~/.opencode2dsh/adapter-status.json`, read 2026-10-29). The profile lists e.g. `opencode2dsh/deepseek-v4.1-flash-free`, `glm-5.3-flash-free`, `nemotron-3.5-super-vl-free` (`~/.dsh/profiles/desktop/cordis.patch.yml:353-364`).
- **Fact.** No quota/usage API: OpenCode Zen's free lane is rate-limited per IP (429 "quota-per-IP contention", 8 retries ~1 s→20 s) and can answer 403 `FreeTierError` "free tier can only be used from within OpenCode" or `REGION_BLOCKED` (`INST:README.md:159-170`). Per-request token usage is summed from stream chunks (`SRC:adapter/zen-adapter.ts:538`, `:550-600`); the only health surface is `~/.opencode2dsh/adapter-status.json` (`INST:README.md:141-157`).
- **Fact.** The reference subscriptions plugin has no OpenCode provider (only a comment "OpenCode-style cadence", `UP:index.ts:1335`).

### A2. How it works end to end (default "adapter" mode)

1. **Fact.** Host plugin `apply` with `inject = ['llm']` (`SRC:index.ts:82`) chooses adapter vs. sidecar mode (`SRC:index.ts:83-91`); default is adapter (`SRC:config.ts:188-250`).
2. **Fact.** Adapter mode registers an in-process `LlmAdapter`: `registration = ctx.llm.registerAdapter([PROVIDER_ID], adapter)` (`SRC:index.ts:180`), class `ZenAdapter` (`SRC:adapter/zen-adapter.ts:379`). It does **not** write into `llm-pi-ai` and spawns **no** process, binary or port (`INST:README.md:33`).
3. **Fact.** Requests go through pi-ai `openai-completions` (`openai-responses` for `muse-spark-*`) to `https://opencode.ai/zen/v1` with `Authorization: Bearer public` (`INST:README.md:108-123`) and CLI-mimicking headers: UA `opencode/1.18.31 (<platform> <arch>; node…)` and `x-opencode-client: cli`, `x-opencode-session(-id)`, `x-session-affinity`, `X-Session-Id`, `x-opencode-project: global` (`SRC:adapter/ids.ts:171-173`, `:184-194`). Session id = SHA-256 of the first user turn (`INST:README.md:125-130`).
4. **Fact.** Model listing (`ModelCatalog`, `SRC:adapter/catalog.ts:348`): S1 live `GET /v1/models` from `https://opencode.ai/inference` (`:19`), S2 pricing/metadata from `https://models.dev/api.json` (`:382`), S3 static list (`:64-69`), blocklist/probe set (`:43`, `:49`), disk cache ~7 days (`:776`). Refresh every `refreshSeconds` (default 300) calls `registration.replace([PROVIDER_ID])` or emits `llm/adapters-updated` (`SRC:index.ts:138-160`). `listModels` returns `{provider,id,name,inputModalities}` (`SRC:adapter/zen-adapter.ts:478`).
5. **Fact.** Data dir `~/.opencode2dsh` (`SRC:index.ts:122-123`). On start it also removes a stale legacy sidecar route via `settings.mutate('llm-pi-ai', [{op:'unset', path:['providers', id]}])` (`SRC:index.ts:210-224`, `SRC:provider.ts:45-54`).

**Legacy sidecar mode (not shipped).** `INST:cordis.patch.yml:1-9` still says the plugin "spawns the agent on a random loopback port, generates/persists the local token, and registers itself into llm-pi-ai". **Fact:** that describes `applySidecar` (`SRC:index.ts:306-457`): random 32-byte base64url token persisted to `agent-token.txt` chmod 0600 (`SRC:config.ts:296-299`, `:314-326`), Go agent `opencode2dsh-agent` listening `127.0.0.1:0` (`SRC:config.ts:333-356`, `SRC:index.ts:464-475`), then `credentials.set(apiKeyEnv, token)` + `settings.mutate('llm-pi-ai', [{op:'set', path:['providers', providerId], value:{displayName, apiKeyEnv, api:'openai-completions', baseURL, models}}])` (`SRC:provider.ts:152-175`). The README states the agent binary is **not** in the published package (`INST:README.md:135-139`). The comment is stale.

**Opt-in delegation (off by default).** `delegation.enabled=false` (`SRC:config.ts:188-250`). When enabled it runs a real `opencode serve`: finds or downloads `opencode-{darwin|linux|windows}-{arm64|x64}` from `https://registry.npmjs.org/<pkg>/latest` with sha512 check, extracted with `tar` (`SRC:adapter/delegate.ts:283-290`, `:309`, `:387-395`, `:430`); copies only the `opencode` entry of `~/.local/share/opencode/auth.json` into an isolated XDG dir 0600 (`:214-220`, `:234-245`); spawns `opencode serve --pure --hostname 127.0.0.1 --port <free>` with a random `OPENCODE_SERVER_PASSWORD` and autoupdate disabled (`:446`, `:478-535`); minimum opencode 1.18.0 (`:83`). Rationale: since 0.3.12 the Zen free-tier gate became credential based; an A/B showed no-credential direct requests 100% 403 while a real binary with an `oc_sk_` credential passed (`/tmp/opencode2dsh/docs/delegation.md:1-50`). Credential custody and account-ban risk are the user's.

### A3. Config, UI, requirements, licence, size

- **Config (Fact, `INST:README.md:71-91`, `SRC:config.ts:152-159`, `:188-250`):** `mode` adapter|sidecar, `providerId` `opencode2dsh`, `refreshSeconds` 300, `allowedModels`, watchdogs `firstEventMs`/`bodyIdleMs`/`responsesBodyIdleMs` 30000/120000/300000, sidecar-only `agentPath/agentArgs/restart*` and `apiKeyEnv` `OPENCODE2DSH_TOKEN`, volatile `ipPool` (manual proxies, free proxy sources, Clash subscriptions, sing-box path, `proxyHosts` default `opencode.ai`; `SRC:config.ts:112-150`), `delegation{…}`.
- **Settings UI (Fact):** only an "IP pool" card in the Plugins page slot `plugins.row.config` (`SRC:client/index.ts`, `SRC:client/IpPoolCard.tsx`), backed by host routes under `/api/opencode2dsh/ip-pool` (+`/status`, `/models`, `/probe`) (`SRC:ip-pool-settings/bridge.ts:19`, `:373-392`). The pool replaces undici's global dispatcher (`SRC:pool/installer.ts`). No account, login, key or quota UI. Because it uses `registerAdapter` without a configurable declaration, it does not appear on Settings > Models (`rc3:dsh-client-ui-settings-models/README.md:137-142`).
- **Runtime requirements (Fact, `INST:README.md:65-67`):** DSH ≥0.1.7, Node ≥20, outbound HTTPS to opencode.ai and models.dev. Adapter mode needs no bun/opencode binary. Delegation needs an opencode binary (or npm download) and a user OpenCode credential.
- **Licence / size (Fact):** MIT © 2026 FishBottle7 (`INST:LICENSE`); deps `@deepseek-ai/schemastery`, `@earendil-works/pi-ai ^0.82.1`, `undici ^8.10.1`, `yaml` (`INST:package.json`). Installed 548 KB (`lib/index.js` 112,805 B, `lib/client.js` 65,331 B); source ~23k lines including tests; repo clone 2.6 MB. Credits opencode2api (`INST:README.md:196-201`).

### A4. Minimal port into dsh-majed as an "OpenCode" subscription provider

**Inference.** Minimum viable scope, reusing the adapter path only:

1. A host module registering one `LlmAdapter` under a provider id via `ctx.llm.registerAdapter([id], adapter)` (same seam the Subscriptions providers already use; `rc3:dsh-llm/lib/index.js:1842`).
2. Port of `ZenAdapter.stream` (pi-ai `openai-completions` to `https://opencode.ai/zen/v1`, key `public`, the header set of `SRC:adapter/ids.ts`), watchdogs and 429/403 retry/classification.
3. Port of `ModelCatalog` (live `/v1/models` + models.dev free filter + static fallback + cache) and a periodic `registration.replace`.
4. Subscriptions UI: a status-only "account" card (no login; show ready/error, exposed model count, last refresh, last error). Optionally a toggle.
5. Licence: MIT attribution in `THIRD_PARTY_NOTICES.md`; dependency on `@earendil-works/pi-ai` (check whether dsh-majed already bundles it).
6. Coexistence: the Owner already has `@opencode2dsh/dsh-plugin` installed; a second adapter with id `opencode2dsh` would fail with `DUPLICATE_ADAPTER` (`rc3:dsh-llm/lib/index.js:1842-1903`). Use a different id (e.g. `opencode`) or require uninstalling one. `modules/catalog/native-api.js:9-13` excludes `opencode` (not `opencode2dsh`), so the installed plugin currently shows as a native API provider.

Skip sidecar mode, IP pool and delegation for a first port: they bring process spawning, binary downloads, proxy dispatcher replacement and credential custody.

### A5. Risks

- **ToS / stability (Inference, high):** the adapter impersonates the OpenCode CLI (UA + `x-opencode-*` headers) to use a lane meant for OpenCode clients; upstream already tightened the gate (403 `FreeTierError`, credential-based since 0.3.12). Breakage can happen at any time; there is no SLA or quota API.
- **Per-IP rate limits** (429) and region blocks; the IP-pool feature exists to work around them, which raises additional ToS concerns.
- **Process / binary (delegation only):** spawns `opencode serve`, downloads platform binaries from npm (`latest`, unpinned version though sha512-verified against the registry metadata), only darwin/linux/windows × arm64/x64; copies the user's OpenCode credential.
- **Global dispatcher swap** (IP pool) can interfere with other plugins' networking (`SRC:pool/installer.ts`).
- **Privacy:** prompts go to opencode.ai and whatever upstream model operators sit behind the free lane.

---

## B. DSH native API providers (Settings > Models)

### B1. What the page renders and does

Package `rc3:dsh-client-ui-settings-models` (0.2.1-rc.3, MIT). **Facts** from its README and client:

- Registers settings section `models` (order 10) (`lib/client.js:4485-4501`); joins the configurable-provider directory, the settings document and credential descriptions (`README.md:14`; `lib/client.js:1340-1344`, `:1376`, `:1383`).
- **Per provider card:** write-only API key field (`credentials.set` under the profile's `apiKeyEnv`, derives `<ROUTE>_API_KEY` if none; keys never read back; show/hide; printable ASCII `[\x21-\x7E]`, refuses `NAME=value`/quoted) (`README.md:42-48`, `:90`); green/red dot = credential configured/missing via batched `credentials.describe` ≤64 refs (`README.md:52`). Fold "custom settings": baseURL, model catalog (id, name, contextWindow, maxTokens, input Text/Image, "Restore default models"), display name + API protocol (hand-declared routes only), reasoning levels `reasoningEfforts` (`README.md:56-62`). DeepSeek card edits `llm-deepseek` (`README.md:58`) and has a DeepSeek Account row (`README.md:76`).
- **Add model provider:** "Third-party model provider" (dormant pi-ai catalog entry) or "Custom model API" (unique Provider ID, http(s) endpoint, protocol OpenAI Chat Completions / OpenAI Responses / Anthropic Messages, ≥1 model). "Fetch available models" → Remote `llm.discoverModels` → searchable picker → "Add selected" (`README.md:66`; `lib/client.js:888`, `:950`).
- Delete only rows present in the user layer, with confirmation; credential unset only when it is the derived `<ROUTE>_API_KEY` (`README.md:94`).
- **Not present:** connection test (explicitly none, `README.md:52`), enable/disable toggle, header editor (headers only via `cordis.patch.yml`), provider-scoped effort (`README.md:56`). Routes registered via `registerAdapter` without a directory entry (e.g. opencode2dsh, subscription adapters) render nowhere (`README.md:137-142`).
- **Extension slots:** `settings.models.provider-card` (keyed by `settingsNs`, receives `ConfigurableProviderView` + configured + credential state), `settings.models.footer`, `settings.models.sign-in` (`README.md:74`, `:119`).

### B2. Where the data lives

- **Fact.** Provider profiles are the volatile config of the `llm-pi-ai` entry: `const Config = z.object({ providers: z.dict(profile).default({}).volatile() })` (`rc3:dsh-llm-pi-ai/lib/index.js:1083`), namespace `llm-pi-ai` (`:2817`), persisted in the profile patch (`~/.dsh/profiles/desktop/cordis.patch.yml:69-330`; currently `openrouter`, `nvidia`, `omniroute`).
- **Fact.** Profile schema (`rc3:dsh-llm-pi-ai/lib/index.js:1035-1081`): `apiKeyEnv` (role `credential-ref`), `displayName`, `api` (protocol), `baseURL`, `models[{id, name, contextWindow, maxTokens, input[], reasoningEfforts, compat}]`, `modelOverrides{}`, `compat`, `defaultContextWindow`, `defaultMaxTokens`, `defaultInput`, `headers{}`, `reasoning`, `thinkingBudgets`, `cacheRetention`, `transport`, `timeoutMs`, `websocketConnectTimeoutMs`, `streamIdleTimeoutMs`, image limits, `retryPolicy`.
- **Fact.** Secrets are **not** in the patch: only `apiKeyEnv` names. Values live in the credentials store, `dsh-credentials-local`, file `<harness home>/.credentials.yaml` (owner-only, refuses world-readable), `refs` keyed by env-var name; precedence stored file > launch env > project `.env` > home `.env` (`rc3:dsh-credentials-local/README.md:39-46`, `:75-80`, `:109-119`; `lib/index.js:480-526`). pi-ai resolves keys at call time via `credentials.resolve(ref)` (`rc3:dsh-llm-pi-ai/lib/index.js:2892-2898`).
- **Fact.** pi-ai re-registers routes and directory on `loader/volatile-update` (`rc3:dsh-llm-pi-ai/lib/index.js:2957-2965`) and validates new/changed profiles before a write is accepted (`internal/config` + `assertServiceable`, `:2885-2891`). Provider ids must be credential-key segments (lowercase hyphenated) (`:2158`).

### B3. Public seams a third-party plugin can use

There **is** a public seam — the same one the native page uses. Nothing is private to the Models page.

**Browser half (Remote namespaces).** Generated by `dsh-api-settings-controller` and mounted by `dsh-api-remotes` (`rc3:dsh-api-remotes/README.md`, "Use this package"):

| Namespace / method | Effect | Citation |
|---|---|---|
| `ctx.remote.settings.describe()` | All volatile namespaces, **redacted**, with `revision`, `value`, `base`, `user`, `schema` | `rc3:dsh-api-settings-controller/lib/index.js:388-399`; `rc3:dsh-settings/lib/index.js:413-464` |
| `ctx.remote.settings.mutate(ns, ops, expectedRevision)` (+ `update`, `replace`) | Path ops `{op:'set'|'unset', path, value?}` on `llm-pi-ai`; stale → `settings/conflict`, refusal → `settings/rejected` | `rc3:dsh-api-settings-controller/lib/index.js:402-475`, `:497-508`; `rc3:dsh-settings/lib/index.js:470-537` |
| `ctx.remote.credentials.describe(refs≤64)` / `set(ref, value)` / `unset(ref)` | Write-only secrets; `describe` → `{configured, source?, writable}` | `rc3:dsh-api-settings-controller/lib/index.js:147-210`; `README.md:28` |
| `ctx.remote.llm.listProviders()` / `listConfigurableProviders()` / `discoverModels(settingsNs, request)` | Live routes, directory entries (`{provider, displayName, settingsNs, settingsPath, declared, defaults…}`), endpoint interrogation with a one-shot credential | `rc3:dsh-llm/lib/index.js:1769-1771`, `:1908`, `:1964-2030`; `rc3:dsh-llm-pi-ai/lib/index.js:2841-2858`, `:2937-2940` |
| `ctx.remote.session.modelCatalog()` | Model catalog | `rc3:dsh-client-ui-settings-models/lib/client.js:1376` |
| Events `settings/document-updated`, `credentials/reference-updated`, `llm/adapters-updated` | Forwarded to Client | `rc3:dsh-api-remotes/lib/index.js:68-128` |

A client plugin obtains `ctx.remote.*` by declaring `@deepseek-ai/dsh-api-remotes` in `dsh.client.inject` and injecting `remote`, `remote.settings`, `remote.credentials`, `remote.llm` — exactly what the native page does (`rc3:dsh-client-ui-settings-models/package.json` `dsh.client.inject`; `lib/client.js:4417-4427`). Owner principals are always allowed by remote-access policy (`rc3:dsh-api-remote-access/lib/index.js:224`).

**Host half.** `ctx.settings` (`SettingsForms`: `describe`, `update`, `replace`, `mutate`, `configure`; `rc3:dsh-settings/lib/index.js:322-541`) and `ctx.credentials` (`resolve`, `describe`, `set`, `unset`; `rc3:dsh-credentials/README.md:55-58`) plus `ctx.llm.listConfigurableProviders/discoverModels` (`rc3:dsh-llm/lib/index.js:1964-2017`). opencode2dsh's legacy code is a working example of a third-party host plugin writing a native provider: `credentials.set` then `settings.mutate('llm-pi-ai', [{op:'set', path:['providers', id], value:{…}}])` (`SRC:provider.ts:152-175`).

**Extension alternative.** Instead of a full own UI, dsh-majed can contribute into `settings.models.provider-card` / `settings.models.footer` slots of the native page (`rc3:dsh-client-ui-settings-models/README.md:74`).

**Recipe a dsh-majed "API providers" panel would follow (Inference, mirrors the native client):**

1. `describe()` → find `ns === 'llm-pi-ai'`, read `revision` and redacted `user.providers` / `value.providers`; join with `listConfigurableProviders()` and `credentials.describe(apiKeyEnv refs)`.
2. Add: validate id (lowercase hyphenated), optional `discoverModels('llm-pi-ai', {baseURL, api, apiKey})`, then `credentials.set('<ID>_API_KEY', key)` and `settings.mutate('llm-pi-ai', [{op:'set', path:['providers', id], value:{displayName, api, baseURL, apiKeyEnv, models}}], revision)`.
3. Edit fields with path ops (`['providers', id, 'baseURL']`, `['providers', id, 'models']`). Delete with `{op:'unset', path:['providers', id]}` and unset only a derived credential.
4. Handle `settings/conflict` by re-describing; refresh on `settings/document-updated`, `credentials/reference-updated`, `llm/adapters-updated`.

**Limits (Fact):** only volatile fields are writable (`providers` is volatile); home patches/CLI overlays win and a write they would override is refused (`rc3:dsh-settings/README.md:37`); unset restores inherited values rather than deleting lower-layer values (`README.md:74`); describe is redacted, so secrets cannot be read back (`rc3:dsh-settings/lib/index.js:440-451`). Built-in catalog providers (dormant directory entries) need only a key + optional overrides.

### B4. What dsh-majed already covers

- **Fact.** `modules/catalog/native-api.js` (161 lines) uses only read seams: `llm.listProviders`, bounded `listModels`, `resolveModelInfo`, `llm/adapters-updated` (`modules/catalog/native-api.js:39-43`, `:61-69`, `:96`, `:122-159`); it excludes subscription provider ids, `opencode` and the Auto route (`:9-13`).
- **Fact.** `modules/catalog/native-api-mount.js` exposes exact `POST /api/majed/native-api` with `snapshot | setPreference | clearPreference`, persisting Owner preferences `{version:1, preferences:[{provider, model, alias?, visible, default}]}` in a 0600 private store; UI `NativeApiSection` inside the routing section (`docs/research/s15-native-api-references-2026-10-28.md:53-69`). The research deliberately avoided `registerAdapter`, `registerConfigurableProviders` and provider settings writes (`s15…md:19`).
- **Gap (Fact/Inference).** No create/edit/delete of providers, no key write, no baseURL/model editing, no discovery, no use of `remote.settings`/`remote.credentials`/`listConfigurableProviders`. Preferences are not consumed by the native picker; no live-host proof yet (`s15…md`). dsh-majed's client manifest currently injects only `dsh-client-ui-settings-general`, `-conversation`, `-chat` (`package.json` `dsh.client.inject`), so `@deepseek-ai/dsh-api-remotes` would have to be added to reach `ctx.remote`.

---

## Open uncertainties

1. Not verified live: the sequence `credentials.set` → `settings.mutate('llm-pi-ai')` from a third-party *client* plugin, and the error shape when pi-ai's `assertServiceable` refuses a profile.
2. Resolved in source, not live: the native client sends `discoverModels(settingsNs, {provider?, baseURL?, api?, apiKey?})` and receives `{kind:'found', models}` or `{kind:'refused', message}` (`rc3:dsh-client-ui-settings-models/lib/client.js:888-894`, `:950-954`); the `kind` wrapper is added by the native client's operations layer (`:3169-3204`), while the raw Remote returns the model array or throws `llm/model-discovery-rejected` (`rc3:dsh-llm/lib/index.js:2018-2030`). With only `provider`, discovery uses the stored profile's headers and key (`rc3:dsh-llm-pi-ai/lib/index.js:2928-2940`).
3. Remote-access policy for non-Owner (remote/paired) browsers was not mapped for `settings`/`credentials` writes.
4. TypeScript declaration files for `./client` slots were not inspected (packaging uncertainty).
5. OpenCode Zen free-lane availability without a credential is trending down (403 since 0.3.12); a port may only work via delegation, which carries the binary/credential risks above.
6. Live GUI (http://127.0.0.1:59985 / :65257) was not browsed for this document; UI claims come from package README and client source.
