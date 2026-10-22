# Research: Jev-assisted Auto model routing

Date: 2026-10-22. Status: research and design input, **not an implementation or live compatibility claim**.

## Scope and conclusion

The proposal is technically plausible as a **plugin-owned decision layer over authorized DSH routes**, not a new model provider, subscription scheduler, or permission system. Jev can choose a stable identifier from a supplied set; deterministic code must resolve that identifier to an already available provider/model/reasoning-effort tuple and enforce policy. Main-agent model selection has an exported native seam. Local subagents support explicit route and effort overrides, but a universal, public pre-delegation interception contract for automatic selection across all backends was **not verified**. Skill recommendation already exists in the installed Jev plugin. Automatic MCP activation is a separate, higher-risk feature and should not be implied by “relevant tools.” [S1][S2][S3][S4][S5]

Only this research document was created. No model inference was called; no credential contents, credential files, or live account quotas were inspected; no installed plugin, profile, MCP configuration, or user state was edited. The supplied settings observation—service address `https://openrouter.ai/api/alpha/decisions`, model `typesafe/jev-1.14`, key configured status—is treated as user-provided context, not an independently verified connection test.

## 1. What the decision API actually does

### OpenRouter Decisions

The documented endpoint is **`POST https://openrouter.ai/api/alpha/decisions`**, authenticated with a bearer OpenRouter API key. Required request fields are `model`, `state`, and `questions`. `state` can be a string, object, or array. `questions` is a named map. [W1][W2]

A Choice question has `type: "choice"`, `instructions`, and a `criteria` object mapping option identifiers to descriptions. Its answer identifies the selected `choice`; Jev documentation also describes `probabilities` by option and `confidence`. The envelope reports the answering `model`, `answers`, and `usage`; OpenRouter examples include `id`, `provider`, and `usage.cost`. The API's generic answer schema is looser than the complete Jev examples, so missing probability/confidence metadata must have a defined client policy rather than crashing or treating it as certainty. [W1][W2]

The other relevant primitives are Noul (a yes probability) and Score (a probability-weighted position on an ordered rubric). TypeSafe documents up to **255 Choice options** and up to **10 Score levels**. Its current schema permits one Score level, whereas the installed plugin requires **2–10**; do not conflate the plugin's validation contract with every upstream schema revision. Box/image questions exist in current Jev 1.14 documentation but are irrelevant to this routing MVP. [W1][W3][S6]

A conceptual routing request should carry a compact task description and criteria keyed by **opaque route IDs**, such as `route_a`, `route_b`, and an explicit `keep_current`/abstention option. Those IDs are application-defined choice labels—not purported model names. The local registry holds the actual tuples, supported effort IDs, capabilities, constraints, and user-approved availability. Use one Choice over valid model/effort pairs rather than independent model and effort choices that could produce an invalid combination. This is a design recommendation grounded in the API's closed-choice shape, not a demonstrated production router. [W2][W3]

### Jev itself is not a chat model with adjustable reasoning

Official docs describe typed decisions, **not free-form explanations or reasoning traces**. The documented Decisions/System One request does not expose a Jev `reasoning_effort`/`reasoning.effort` setting. “Select model + effort” here means Jev selects a target chat route that contains a supported effort ID; it does not establish a configurable internal reasoning effort for Jev. A generic structured-output chat judge would be a different adapter and product contract. [W1][W2][W3]

### Compatibility is protocol-specific, not “any OpenAI-compatible endpoint”

OpenRouter documents two surfaces: Decisions above, and **`POST https://openrouter.ai/api/v1/systemone`**, compatible with TypeSafe SDKs. TypeSafe's own endpoint is **`POST https://api.typesafe.ai/v1/systemone`**. A server that only implements `/v1/chat/completions` is not thereby compatible with either structured-decision endpoint. An endpoint selector must name the protocol and validate the response contract, not simply accept an arbitrary OpenAI base URL. [W1][W3]

**Important installed-backend mismatch:** installed `dsh-jev-tools` **0.1.13** config describes `baseUrl` as a bare root; its backend strips trailing slashes and always appends `/v1/systemone`. Therefore setting that field to the supplied full Decisions URL would construct `https://openrouter.ai/api/alpha/decisions/v1/systemone`, not the documented Decisions endpoint. A root of `https://openrouter.ai/api` would yield OpenRouter's documented System One path under this implementation; that is source-level compatibility reasoning, **not a recommendation to edit settings during this task or proof the current configured connection works**. The installed plugin's browser code itself labels this section **“Judgment endpoint”**, the input **“Service address”**, and explicitly says it appends `/v1/systemone`; its save handler writes that input to `baseUrl`. Thus those labels are not evidence of a separate host-native Decisions integration: they match this plugin's root-address setting. However, this research did not independently inspect the screenshot/live DOM or persisted setting, so it cannot establish that the supplied screenshot is this exact installed card/version or that the displayed draft was saved. Confirm the owning surface/version before changing anything. [S4][S6][S7][S16][W1]

## 2. Availability, versions, cost, privacy, and calibration

OpenRouter's current Jev page documents `typesafe/jev-1.14`, `~typesafe/jev-latest`, and continuing 1.13 availability. TypeSafe's native IDs differ: `jev-1.14.0`, `jev-1.13.0`, `jev-latest`, and `jev-preview`. Its current page says 1.14 is newest while its alias table still maps `jev-latest` to 1.13 and preview to 1.14. These are separate namespaces and moving aliases: preserve the requested identifier and actual response model, and do not guess names from display labels. Public documentation does not establish access, credits, regional availability, or successful inference for this user's account. [W1][W4]

TypeSafe currently publishes **$0.042 per million input tokens**, with output tokens free; OpenRouter says to consult the model page for its current price and reports response cost. At the TypeSafe published rate, 2,000 input tokens would be $0.000084 per decision, before any platform-specific billing differences. This is arithmetic, not measured billing. The installed plugin also hard-codes $0.042/Mtok for estimates; a new adapter should prefer actual returned cost and label estimates, particularly when the configured judgment model changes. Judgment cost is additional to the selected main/subagent model's cost. [W1][W4][S6]

Context documentation is surface-dependent: TypeSafe lists default **32k per-question / 64k per-request** limits and opt-in 262k long-context mode, described as slower and less accurate. OpenRouter advertises 262,144 context tokens but says text beyond about 32,000 bytes and images enter long-context mode. Do not substitute bytes for tokens or assume the installed plugin's conservative estimated-token checks represent the full OpenRouter service. Routing should remain deliberately small regardless. [W1][W4][S6]

TypeSafe says customer requests/responses are not used for training, and describes enterprise zero-data-retention separately. OpenRouter says prompt/response storage is opt-in, request metadata is retained, and anonymous input categorization may occur. These are **not a blanket guarantee of zero retention at every processing party**. Model/provider policy, any gateway, chosen region, logging settings, and plan-specific contracts still matter. A routing call exports some task material to the judgment service even if the work later runs on a local/subscription model. Send only the minimum needed: compact task intent, capability requirements, approved route metadata, and coarse availability—not credentials, headers, MCP env values, complete source files, private conversation history, or account identifiers. [W4][W5]

TypeSafe defines Choice confidence as `(p_max - 1/n) / (1 - 1/n)`. It is a summary of the distribution, not an empirically measured accuracy guarantee for this application's routing. Its example thresholds are not deployment-ready values. Changing judge model/version, option descriptions, candidate count, language, or workload calls for fresh evaluation. The installed tool guidance also warns against assuming raw probabilities are calibrated. Use them to rank/observe initially; automatic fallback should be governed by deterministic validation and evaluated policy, not an arbitrary universal confidence cutoff. [W6][S8]

## 3. Verified DSH seams and boundaries

### Main-agent route and effort

Installed `@deepseek-ai/dsh-agent` **0.2.1-rc.2** exports **`installModelSelection(agentCtx, selection)`** from the package entry. It snapshots `selection.current` during `system-prompt/assemble`, updates prompt provider/model variables, then applies that captured provider/model/optional `reasoningEffort` through the scoped `agent/request` waterfall. Absent selected effort clears inherited effort. Provider/model changes produce a durable model-switch notice through `agent/pre-step`; effort-only changes do not. This is the strongest verified plugin seam for coherent prompt + request selection. Merely rewriting a late LLM transport request could split model-specific prompt assembly from dispatch. [S1][S9]

`agentDefaultModel.currentSelection()` returns the configured provider/model/optional reasoning effort. `saveSelection(next)` persists a complete global default via the configuration editor. **Per-turn Auto decisions should not call `saveSelection`**, because choosing a transient route is not changing the user's default. How Auto mode ownership, scoped selection lifecycle, user-pinned overrides, UI display, and ordering with other route owners are exposed must be established before implementation; the existence of waterfalls does not resolve those product/precedence questions. [S2]

Request configuration includes provider, model, reasoning effort, and sampling values; native comments explicitly say changes can affect cache reuse and are logged as request-header state. Prefer sticky routing and intentional boundaries over model changes on every tool step. [S10]

### Subagent defaults and overrides

Native `parentAgentOptionsForDelegation(parent)` uses the **latest request header**, falling back to creation options before the first request. `resolveChildAgentOptions(parent, requested, childDepth)` inherits route/effort/maxTokens, merges explicit overrides, and clears inherited effort when the route changes without an explicit new effort. In-process spawn advertises `agentOptions`, preset, structured-output, and depth-limit capabilities. This proves local child targeting supports explicit provider/model/effort inputs; it does not prove every external subagent backend accepts the same controls. [S3][S11]

The manager snapshots resolved route/effort before asynchronous startup and persists them in the descriptor. Thus the clean proposed integration point is **before a child request is admitted**, through a supported caller/provider that supplies `agentOptions`. A generic public “rewrite all subagent starts” waterfall was not verified here. Do not promise automatic per-task child selection everywhere, override a parent's explicit choice, monkey-patch manager methods, or infer permission from the ability to set `agentOptions`. Existing native depth, lifecycle, presets, permissions, and concurrency ownership must stay intact. [S12]

### Skills and MCP exposure

Native skills are a scoped registry of provider catalogs; invocation controls distinguish model-invocable from user-invocable skills. Use the resolved agent-scoped inventory and honor those controls. Installed `dsh-jev-tools` already injects `skills`, performs at most one advisory skill judgment per turn, includes abstention, and appends a notice rather than loading/forcing a skill. A new router should coordinate with this rather than add a duplicate recommendation request. Recommended skills still have to be loaded through normal mechanisms, and existing mandatory skill instructions take precedence. [S4][S5][S13]

Installed MCP console **0.3.10** owns MCP connections by mounting the official `dsh-mcp-client`, one plugin fiber per server. Its management guidance distinguishes global/project configuration and `disabledTools` restrictions. **Selecting or ranking already authorized/exposed tool IDs is not permission to enable a server, start a process, install a plugin, change credentials, edit configuration, or bypass a disabled tool.** None of those actions follows from a Jev relevance decision. This research does not establish a safe public per-step MCP exposure filter; keep the first phase advisory over the current visible inventory. Never read raw MCP configuration to build the judgment prompt: it can contain secrets. [S14][S15]

### Existing Jev integration: avoid a parallel framework

Installed `dsh-jev-tools` registers `jev_ask` and `jev_gate`, a shared backend, budgets, memoization, degradation notices, and a judgment ledger. Automatic semantic pruning and skill suggestion are wired in its entry point. Its package description also advertises injection screening; entry-point imports/wiring inspected here did not establish that feature as active. Tool presence or “key configured” is not an end-to-end health check. [S4][S8]

`jev_ask` is a model-facing typed-question tool; `jev_gate` checks delivery claims against supplied evidence. Neither is a verified public, injectable routing service. Calling the agent's own tool from its pre-request router could create recursion/ownership issues. Prefer a separately exported or agreed shared decision-service contract if available in a supported version; otherwise a narrowly owned adapter may be necessary. Do not reach into another plugin's private credentials/backend closures or overwrite it. Existing `settings()` export alone is not a credential/backend service. [S4]

The subscription provider's existing pool/tier/cooldown behavior should remain the execution layer. Jev should choose from its supported, authorized target identities, not implement its own account pool or rotate credentials. Detailed subscription findings are intentionally outside this document's evidence scope.

## 4. Proposed deterministic safety envelope

These are design recommendations, not claims about existing behavior:

1. **Resolve candidates locally first.** Intersect user-approved routes, registered provider/model IDs, adapter-supported effort IDs, task-required tools/images/context, availability, cost/privacy rules, and explicit exclusions. If there is one eligible tuple, skip judgment.
2. **Ask a bounded Choice only.** Supply opaque stable route IDs and compact factual metadata. Treat task text and candidate descriptions as data, not as permission instructions. Include `keep_current`/abstain. Never let returned text create model names, effort names, tools, URLs, servers, or permissions.
3. **Validate again on return.** Require a known answer type and candidate membership; validate metadata as finite in-range values if used. Re-check availability and policy against the current inventory generation. Stale, malformed, unknown, unsupported, or forbidden decisions cannot execute.
4. **Apply only in opted-in Auto scope.** Explicit manual pins win; child explicit overrides win unless the user selected a distinct child-Auto policy. Keep main and child policies separately configurable. Never persist a transient decision as a profile default.
5. **Fail safely and visibly.** On timeout, missing credential, unsupported protocol/model, rate limit, credit/auth failure, malformed output, or judge outage, retain the current eligible route or use a preconfigured eligible fallback. If no eligible route exists, stop with an explanation; never silently broaden the allowed pool, switch paid/private providers, or enable tools.
6. **Bound latency and spend.** Start with at most one judgment per admitted user turn or child creation, no synchronous retry storm, cancellation tied to the owning operation, a circuit breaker after repeated service failures, and per-turn/session spend limits. A configurable short deadline should be evaluated against measured p50/p95 latency; the installed backend's 10-second default is not an Auto UX target. Cache only by sanitized task/candidate/policy/version fingerprint, invalidate on inventory or settings changes, and never store raw secrets.
7. **Expose provenance, not invented explanation.** Record requested/actual judge version, candidate/policy generation, chosen stable route, final applied route, effort, latency, returned cost or labeled estimate, abstention/fallback reason, and validation result. Jev cannot supply a free-form rationale; do not fabricate one. Avoid persisting raw prompts by default.

“Fail open” here means continue with a known authorized baseline when judgment is unavailable—not fail open on tool authorization, cost caps, privacy restrictions, or candidate validation.

## 5. Candidate phases and initial design questions

**Phase A — contract and shadow mode:** confirm exact installed settings surface/protocol; define the candidate registry and ownership precedence; share or explicitly isolate the existing Jev transport; collect sanitized offline/shadow evaluation for main-route choices without applying them. No account/model health calls in this research.

**Phase B — opt-in main Auto:** coherent scoped selection through the public native seam; closed candidate IDs; sticky per-turn decisions; deadline/budget/circuit-breaker fallback; visible final route/effort; tests for manual pins, cancellation, stale candidates, unsupported efforts, missing probability metadata, malformed answers, and plugin ordering.

**Phase C — opt-in local child Auto:** only after confirming a supported pre-admission call path that supplies route/effort; respect backend capability declarations and explicit overrides; retain native lifecycle/permission ownership. External backends without supported overrides remain manual/default.

**Phase D — advisory skill/tool relevance:** reuse existing skill recommendation; rank only the agent-visible authorized MCP/tool inventory. Any dynamic exposure reduction needs verified public API semantics, restoration behavior, mandatory-tool exceptions, and separate evaluation. Server enable/install/credential/configuration actions stay outside Auto.

Questions to settle before a specification: Is Auto a per-session mode or a global default? Which component owns selection and must yield to it? Is the optimization objective quality, latency, money, or subscription capacity? What candidate IDs and effort IDs are actually registered? What exact minimal task context may leave the machine? Which protocol does the displayed service-address setting promise? Should child Auto be opt-in independently? Which existing Jev/subscription capabilities should be reused rather than duplicated? What observed quality/latency/cost acceptance thresholds are required before applying decisions?

## Sources

### Official web documentation

- **W1:** [OpenRouter Jev guide](https://openrouter.ai/docs/guides/community/jev.md) — Jev identity, availability claims, two endpoints, typed primitives, input/context behavior, output billing, no reasoning traces.
- **W2:** [OpenRouter Decisions API reference](https://openrouter.ai/docs/api/api-reference/alphadecisions/submit-a-decisions-request.md) — exact HTTP path, bearer auth, request/response schema, usage, provider policy fields, errors.
- **W3:** [TypeSafe System One OpenAPI](https://docs.typesafe.ai/api/system-one.md) — native endpoint, named typed questions/answers, limits, request fields.
- **W4:** [TypeSafe models](https://docs.typesafe.ai/models.md) — native IDs/aliases, price, context limits, long-context caveats, language and data handling. Alias statements are recorded as published, not reconciled by a live call.
- **W5:** [OpenRouter data collection](https://openrouter.ai/docs/guides/privacy/data-collection.md) — content logging opt-ins, metadata, categorization. Provider-specific retention still requires separate checking.
- **W6:** [TypeSafe confidence](https://docs.typesafe.ai/confidence.md) — confidence formula and domain-specific evaluation guidance.
- **W7:** [OpenRouter Jev Router](https://openrouter.ai/docs/guides/routing/routers/jev-router.md) — a distinct OpenRouter-side router that chooses model/effort. Its `models`/`allowed_models` are **soft include preferences with fallback**, not hard allowlists; exclusions remain hard. It routes OpenRouter models, not arbitrary DSH subscription identities. It is not a substitute for the proposed closed local candidate registry, and was not invoked.

### Installed primary source (read-only)

- **S1:** [Native coherent model selection](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-agent/lib/types/model-selection.js#L27-L94>).
- **S2:** [Default-model service](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-agent-default-model/lib/index.js#L21-L65>).
- **S3:** [Child inheritance and override semantics](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-subagent/lib/types/child-agent.js#L41-L91>).
- **S4:** [Installed Jev wiring and service boundaries](</Users/majedsiefalnasr/.dsh/profiles/desktop/node_modules/dsh-jev-tools/lib/index.js#L58-L201>).
- **S5:** [Installed skill recommendation contract](</Users/majedsiefalnasr/.dsh/profiles/desktop/node_modules/dsh-jev-tools/lib/features/skill-suggest.js#L8-L44>).
- **S6:** [Installed request validation, body, endpoint suffix, price](</Users/majedsiefalnasr/.dsh/profiles/desktop/node_modules/dsh-jev-tools/lib/request.js#L9-L25>) and [request body/endpoint/estimate](</Users/majedsiefalnasr/.dsh/profiles/desktop/node_modules/dsh-jev-tools/lib/request.js#L121-L164>).
- **S7:** [Installed backend URL construction and response classification](</Users/majedsiefalnasr/.dsh/profiles/desktop/node_modules/dsh-jev-tools/lib/backends/jev.js#L68-L145>) and [base-root/model settings schema](</Users/majedsiefalnasr/.dsh/profiles/desktop/node_modules/dsh-jev-tools/lib/config.js#L96-L115>).
- **S8:** [Installed Jev package identity and advertised capabilities](</Users/majedsiefalnasr/.dsh/profiles/desktop/node_modules/dsh-jev-tools/package.json#L1-L8>). Model-facing `jev_ask`/`jev_gate` descriptions were also available in this research session's tool catalog; no inference was invoked.
- **S9:** [Public model-selection export](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-agent/lib/index.js#L702>) and [package exports/version](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-agent/package.json#L1-L27>).
- **S10:** [Native call-config semantics](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-llm/lib/types/call-config.js#L1-L27>).
- **S11:** [Spawn backend capability declaration](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-subagent-spawn-in-process/lib/index.js#L12-L36>).
- **S12:** [Subagent manager startup snapshot](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-subagent/lib/types/manager.js#L309-L387>).
- **S13:** [Native scoped skill registry and invocation policy](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-skill/lib/index.js#L25-L46>) and [registry scope contract](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-skill/lib/index.js#L108-L117>).
- **S14:** [MCP console ownership and management guidance](</Users/majedsiefalnasr/.dsh/profiles/desktop/node_modules/@moon16u/dsh-mcp-console/lib/index.js#L1-L14>) and [configuration/restrictions/refresh boundary](</Users/majedsiefalnasr/.dsh/profiles/desktop/node_modules/@moon16u/dsh-mcp-console/lib/index.js#L54-L68>).
- **S15:** [MCP console package identity](</Users/majedsiefalnasr/.dsh/profiles/desktop/node_modules/@moon16u/dsh-mcp-console/package.json#L1-L18>).
- **S16:** [Installed Jev browser settings contract](</Users/majedsiefalnasr/.dsh/profiles/desktop/node_modules/dsh-jev-tools/client/client.js#L17-L33>), [field labels and appended-path hint](</Users/majedsiefalnasr/.dsh/profiles/desktop/node_modules/dsh-jev-tools/client/client.js#L148-L156>), and [save handler writes baseUrl/model](</Users/majedsiefalnasr/.dsh/profiles/desktop/node_modules/dsh-jev-tools/client/client.js#L468-L476>).

Local citations are to this installed snapshot and may move after an update. Installed JavaScript was read directly at exact ASAR paths; failed directory glob/type-declaration discovery was not treated as evidence that the source/API did not exist. These findings establish source-level seams, not runtime load order, account access, endpoint health, or end-to-end Auto behavior.
