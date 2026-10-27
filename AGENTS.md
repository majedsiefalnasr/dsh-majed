## Language

- Chat communication with the user may be in any language (the user's language) and is independent of the project's language.
- All project content is written in **English**: code, identifiers, comments, commit messages, documentation, data, tests, fixtures, issues, PR text, and files of any kind.

## Project

`dsh-majed` is a plugin for **DeepSeek Harness (DSH)**: host half `index.js`, browser half `client.js`. It must never patch DSH itself; everything goes through public extension points.

- Current version and history: `package.json`, `CHANGELOG.md`. Release process: `docs/RELEASING.md`. Third-party code: `THIRD_PARTY_NOTICES.md`.
- Command: `npm test`.
- Host JavaScript changes require a full DSH desktop restart; client-only changes require a page reload.
- Do not delete or modify the user's installed DSH plugins, `~/.dsh` state or profile config without explicit approval. Never read or print secrets.
- Every user-visible change adds a `CHANGELOG.md` entry; never claim a live feature works without live verification.

## Mandatory scope and resume gate

Before any project work, session/goal continuation or delegation, read [scope control](docs/ai/rules/scope-control.md) and [current work](docs/ai/current-work.md). Follow the recorded phase and approved work contract; a historical goal or generic continuation does not lift a freeze. Include these gates in delegated tasks. Reference plugins are learning sources, not required runtime companions.

## Cost-aware delegation and model selection

Before resuming specification implementation, selecting a model or launching delegated work, read [the execution policy](docs/ai/rules/execution-policy.md) for the Owner's workflow, concurrency and model-fallback requirements.

- Before launching a subagent or an explicitly requested workflow, assess task complexity, risk and acceptance criteria; choose the lowest-cost available model likely to meet them reliably. Prefer direct execution when delegation adds no practical value.
- Use economical models for bounded source lookup, extraction and straightforward scoped changes; reserve stronger reasoning models for ambiguous cross-module work, architecture, security-sensitive changes and difficult diagnosis. Verify results against the task's acceptance criteria; escalate when evidence shows the initial model is insufficient.
- Inspect the available tool schema and authorized model catalog before selecting a route. When supported, pass the chosen provider/model explicitly and select an appropriate reasoning effort. Base cost comparisons on available evidence, not model names or assumed pricing; keep the selection rationale brief.
- When a delegation tool cannot select its model, state that limitation and use a suitable supported backend or its inherited/default route honestly. Never claim an explicit selection that the tool did not apply.
- Keep delegation bounded: avoid redundant agents, unnecessary parallelism and repeated full-context prompts. Optimize total completion cost, including retries and verification, rather than token price alone.
- This execution policy does not authorize changes to installed model settings, credential access, live provider consumption or product Smart/Auto activation; retain their existing approval boundaries.

## Agent skills

### Issue tracker

Issues live in GitHub Issues (`majedsiefalnasr/dsh-majed`, via the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context (`GLOSSARY.md` + `docs/adr/` at the repo root). See `docs/agents/domain.md`.
