# OmniRouter reference assessment — 2026-10-28

## Recommendation

**Useful as a limited design reference, not a Subscriptions implementation base or runtime dependency.** Learn from its separation of model identity/capability metadata, request observations and quality outcomes; consider its evidence-before-routing philosophy during the later Auto/Smart discussion. It does not supply demonstrated Majed subscription-account workflows. Its current v2 is pre-alpha metadata/CLI scaffolding, while its v1 is a legacy FastAPI gateway. The opening v2 product narrative must not be read as delivered functionality. [R1], [R2], [R3], [R10]

This is research advice, **not new approved scope**. Feature implementation remains frozen. The current Owner design discussion and supported public DSH extension points remain authoritative; external references must not become required companion plugins. [Local phase](../ai/current-work.md#L13-L44), [scope rules](../ai/rules/scope-control.md#L39-L53).

## Work contract and evidence boundary

- **Approved outcome:** answer whether OmniRouter practically helps the Subscriptions design, separating implemented source from roadmap and later Auto/Smart learning.
- **Write scope:** only this new assessment. No product, specification, tracker, installed-state or current-work edits; the Lead reconciles this delegated result into the state record.
- **Method:** static public GitHub MCP reads only. GitHub `list_commits(sha="dev", perPage=1)` returned exactly **`20674058fe4c9f00f48f245198aac95d653415d3`**, dated **2026-10-22**, merge PR #17, “db: core domain models and migrations.” All upstream links below pin that revision. [Commit], [R0]
- **Sample:** eleven files, including overview/license, v2 schemas/CLI and representative v1 registry/interfaces/auth/usage/bootstrap/Smart logic. Directory listings locate those files; this is not an exhaustive repository, security, provider-terms or compatibility audit.
- **Limits:** no clone, installation, imports, commands from upstream, inference, credentials, private account state, browser or live-provider tests. No claim of installed/live success, current provider availability, price superiority or equal capabilities across providers. The delegation tool has no model selector; this worker used its inherited/default route, with no explicit model or cost comparison claimed. No nested delegation.
- **Budget/stop:** two failed checks or twenty minutes per factual blocker; stop at an evidence-backed recommendation. Source checks succeeded. One local Git tracked-file lookup failed because the report was new; a path glob confirmed it did not exist before creation. No unresolved factual blocker was pursued beyond budget. The docs connector was unavailable; the expressly requested local Markdown artifact was used instead.

## What is actually present at the pinned revision

**v2 — implemented scaffolding, not a working swap-safety engine.** The overview marks only project/CLI groundwork and core models/migrations done. Catalog synchronization/pricing/cost calculation are next; ingestion/segmentation/sampling, shadow replay/scoring/recommendations, collectors/sidecar/policy compiler/receipts are later PRs. The actual CLI registers version and database upgrade/revision commands, not the advertised replay/recommend workflow. [R1], [R3]

The real schema contains `ModelCatalog`, `Workload`, `Request` and `Outcome`. Model metadata separates provider/revision, context window, maximum output, capability JSON (including effort levels), pricing and source URL. Requests distinguish requested/resolved model and record usage, cost, latency and fallback chain; outcomes attach signals such as tests or task completion. These are storage fields, **not proof of catalog freshness, enforced capability validation, a working cost calculator, quota retrieval, calibrated scoring or signed receipts**. Nested JSON shapes are explicitly still settling, and later replay/recommendation entities are named as future additions. [R2]

**v1 — real gateway source, different problem.** The legacy bootstrap constructs FastAPI and a provider map. The static registry combines chat, image and reasoning models, and the interfaces separate chat/streaming, reasoning/streaming and image generation. These are representative cross-provider seams, not evidence that every registered provider implements every interface or that current provider endpoints still work. The README explicitly retains v1 as reference while v2 is built. [R1], [R4], [R5], [R10]

Gateway authentication and usage are concrete but not subscription management: `verify_api_key` checks bearer keys against a Firestore-backed set, obtains the associated gateway user and rejects when that user's `total_tokens` reaches `MAX_TOKENS = 100000`; usage helpers update gateway totals/messages. This is gateway admission/accounting, not browser/device OAuth, subscription entitlement or a provider's remaining/resetting quota. Static import paths initialize Firebase and providers, reinforcing why this assessment did not execute them. [R6], [R7], [R10]

## Fit against the approved Subscriptions direction

The comparison uses the Owner-requested dimensions, the [current phase record](../ai/current-work.md#L89-L96) and retained [subscription requirements](../archive/managers-spec.md#L54-L88). Older detailed implementation defaults are background, not a way around the active redesign/freeze.

| Subscriptions need | Bounded source finding | Practical disposition |
|---|---|---|
| Multi-account browser/device login and refresh | Inspected v1 admission is a gateway bearer-key/Firestore mechanism; v2 core schemas contain no subscription-account/login workflow. [R2], [R6], [R7] | Not a substitute for provider-specific browser/device/manual protocols, protected durable accounts or refresh ownership. No such workflow demonstrated by this sample. |
| Account pause, logout and remove | Gateway-user token accounting is not a subscription-account lifecycle; no matching pause/logout/remove implementation appears in the inspected seams. [R2], [R6], [R7] | Design Majed's operations independently. Pausing scheduling, ending a local session and removing stored identity must not be conflated or inferred from an API-key registry. |
| Model catalogs, capabilities and effort | v2 stores structured identity/limits and flexible capability/effort JSON; v1 has static model/benchmark/cost tables and one extended-thinking configuration. Catalog sync remains future work. [R1], [R2], [R4] | Useful field-separation example, not verified dynamic discovery or account-specific entitlement. Preserve provider/account-specific support, evidence freshness and unknown values; do not copy old benchmark, price, limit or effort values as current facts. |
| True provider quota versus estimated/local usage | v1 enforces a gateway-local token ceiling. v2 has usage/cost fields but no quota/reset mechanism in these models; pricing calculation is not yet delivered. [R1], [R2], [R6], [R7] | Label provider-reported limits/reset times separately from local counters and monetary estimates. Missing quota is unknown, not an exhausted or broken account; no invented reset times. |
| Native DSH adapter, picker and stream semantics | Inspected execution is FastAPI/provider dispatch; the v2 CLI is database-oriented and describes plugging policies into other gateways. No DSH registration is demonstrated. [R1], [R3], [R5], [R10] | No drop-in native adapter or compatibility proof. Continue using supported DSH public registration and existing Majed/reference evidence; do not add a gateway/sidecar merely to reuse this repository. |
| Search, image generation/editing and video | v1 exposes an image-generation interface and DALL-E registry entries, plus chat/reasoning interfaces. This does not establish search tools, reference-image editing, video submission/polling, image-to-video or cancellation/non-replay safety. [R4], [R5] | Narrow image-generation prior art only. Do not infer edit/video support from image input, model descriptions or unified branding; retain per-provider/per-operation acceptance. None of these capabilities was exercised. |

## Auto/Smart: learning only, not adoption

**Useful v2 proposal:** measure quality on representative workloads before applying a model change; retain scorer/cost-model provenance, latency, cache effects and an explicit recommendation-to-policy boundary. The README describes offline evidence and compiled policies, not a live per-request classifier, and clearly lists replay/scoring/recommendation/receipts as future work. Its example savings and confidence intervals are illustrative, **not measurements reproduced here**. For later Majed discussion, this supports asking for bounded representative evidence and an explicit activation decision, not importing a new evidence platform. [R1], [R2]

**Useful v1 lesson and caution:** Smart source classifies recent message content, combines task-model metrics and emits staged metadata before returning a selected model. The ranking function filters static cost/latency and an optional model list, then maximizes aggregated `accuracy`; that number is not established as calibrated task accuracy. It can select the highest-accuracy listed model even when none meets the cost/latency filters. Its no-candidate branch returns a hard-coded `gpt-4o-mini` mapping with a different shape, while the caller expects `best_model['model']`. These source-level branches argue against copying fallback behavior or treating its limits as hard guarantees; they were not executed or expanded into a bug audit. [R8], [R9]

Keep three concepts distinct in any later design: **observe a proposed routing decision without applying it**, **replay prompts against additional models**, and **execute tools/media again**. The v2 shadow-replay concept entails additional provider calls and data handling; it is not free metadata-only observation. It authorizes neither raw transcript collection/export nor paid evaluation, new account/provider failover, changed Auto enrollment, or replay of side-effecting tools, image/video jobs and quota operations. Majed's existing consent, privacy, cancellation, partial-output and non-replay boundaries remain separate acceptance requirements. [R1], [retained boundaries](../archive/managers-spec.md#L110-L124), [evaluation gate](../archive/managers-spec.md#L140-L147).

## License and reuse boundary

The pinned root [license], [R11] is **Apache License 2.0**, matching the README. The complete pinned [root listing], [R0] contains `LICENSE` and **no root `NOTICE` entry**. This checks root existence only: nested/distribution-specific notices and dependency licenses were not exhaustively searched.

If code or other protected material is later adapted and distributed, Section 4 requires supplying the license, prominent notices in changed files, retention of applicable source copyright/patent/trademark/attribution notices, and readable relevant NOTICE attribution **if supplied by the work**. Section 3 includes the patent grant/termination conditions; Section 6 does not grant general trademark rights; Sections 7–8 disclaim warranty/liability. Recheck the exact files and distribution, including transitive notices, before reuse. Apache licensing does not grant provider account access, subscription entitlement, quota circumvention or permission under provider terms. [R11]

**Nothing from OmniRouter was integrated or made a dependency.** This report cites source and discusses design patterns; any future adaptation requires a separately approved scope and attribution decision. The smallest next action is to return to the Owner's Subscriptions design frontier, retaining OmniRouter as an optional catalog/evidence reference and deferring any Auto/Smart expansion to its own discussion.

## Pinned primary sources

[Commit]: https://github.com/omnilabs-ai/OmniRouter/commit/20674058fe4c9f00f48f245198aac95d653415d3
[R0]: https://github.com/omnilabs-ai/OmniRouter/tree/20674058fe4c9f00f48f245198aac95d653415d3
[R1]: https://github.com/omnilabs-ai/OmniRouter/blob/20674058fe4c9f00f48f245198aac95d653415d3/README.md
[R2]: https://github.com/omnilabs-ai/OmniRouter/blob/20674058fe4c9f00f48f245198aac95d653415d3/src/omni/models.py
[R3]: https://github.com/omnilabs-ai/OmniRouter/blob/20674058fe4c9f00f48f245198aac95d653415d3/src/omni/cli.py
[R4]: https://github.com/omnilabs-ai/OmniRouter/blob/20674058fe4c9f00f48f245198aac95d653415d3/serverRouter/core/models.py
[R5]: https://github.com/omnilabs-ai/OmniRouter/blob/20674058fe4c9f00f48f245198aac95d653415d3/serverRouter/core/interfaces.py
[R6]: https://github.com/omnilabs-ai/OmniRouter/blob/20674058fe4c9f00f48f245198aac95d653415d3/serverRouter/core/config.py
[R7]: https://github.com/omnilabs-ai/OmniRouter/blob/20674058fe4c9f00f48f245198aac95d653415d3/serverRouter/routes/utils.py
[R8]: https://github.com/omnilabs-ai/OmniRouter/blob/20674058fe4c9f00f48f245198aac95d653415d3/serverRouter/smartRouter/main.py
[R9]: https://github.com/omnilabs-ai/OmniRouter/blob/20674058fe4c9f00f48f245198aac95d653415d3/serverRouter/smartRouter/model_ranking.py
[R10]: https://github.com/omnilabs-ai/OmniRouter/blob/20674058fe4c9f00f48f245198aac95d653415d3/serverRouter/router.py
[R11]: https://github.com/omnilabs-ai/OmniRouter/blob/20674058fe4c9f00f48f245198aac95d653415d3/LICENSE
