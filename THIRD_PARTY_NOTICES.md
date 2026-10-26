# Third-party notices

`dsh-majed` is released under the MIT License (see `LICENSE`). It includes the following third-party material.

| Component | Version | License | Location |
|---|---|---|---|
| Inter, Roboto, Open Sans, Noto Sans, Noto Sans Arabic, IBM Plex Sans, IBM Plex Sans Arabic (via Fontsource) | see `fonts/manifest.json` | SIL Open Font License 1.1 | `fonts/` (licenses in `fonts/LICENSE-*.txt`) |
| dsh-persian-rtl (chat direction CSS/logic, adapted) | n/a | MIT | `client.js` |
| V1ki/dsh-plugin-subscriptions (Codex PKCE, OAuth flow and grant adaptations) | 0.9.9 / `9930c5ee5e3fa239db9031f47a0f6f30f7ffc443` | MIT | `modules/subscriptions/codex/`; full notice and adaptation record in `PROVENANCE.md` |

## Inactive reference inputs

T04 records external source/artifact identities in [the reference manifest](<docs/reference-artifacts.json>)
and [the source/license review](<docs/research/reference-source-provenance.md>). These are inspection inputs,
not additional bundled runtimes or production dependencies. The accepted build/package excludes historical
Manager prototypes and their vendored code. The reference license texts and their limitations are recorded
in the review; any later copied source, tests or assets must carry their required text and local-change notices
before packaging. No provider account, trademark or service authorization follows from a code license.
