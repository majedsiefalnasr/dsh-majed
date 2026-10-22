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

## Agent skills

### Issue tracker

Issues live in GitHub Issues (`majedsiefalnasr/dsh-majed`, via the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context (`GLOSSARY.md` + `docs/adr/` at the repo root). See `docs/agents/domain.md`.
