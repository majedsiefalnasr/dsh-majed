# Third-party notices

`dsh-majed` is released under the MIT License (see `LICENSE`). It includes the following third-party material.

| Component | Version | License | Location |
|---|---|---|---|
| Inter, Roboto, Open Sans, Noto Sans, Noto Sans Arabic, IBM Plex Sans, IBM Plex Sans Arabic (via Fontsource) | see `fonts/manifest.json` | SIL Open Font License 1.1 | `fonts/` (licenses in `fonts/LICENSE-*.txt`) |
| dsh-persian-rtl (chat direction CSS/logic, adapted) | n/a | MIT | `client.js` |
| V1ki/dsh-plugin-subscriptions (Subscriptions Settings/account/model UI, dictionaries, usage/reset mapping, adapted) | 0.9.11 / `7639ed9958a9a1c4159faa1f4e6e15e9ede60b7d` | MIT | `modules/subscriptions/ui/` and `modules/subscriptions/codex/{usage,provider-settings}.js`; adaptation records in module PROVENANCE files |
| V1ki/dsh-plugin-subscriptions (Codex PKCE, OAuth grants, catalog, Responses/SSE/image translation and rate-limit adaptations) | 0.9.9 / `9930c5ee5e3fa239db9031f47a0f6f30f7ffc443` | MIT | `modules/subscriptions/codex/`; full notice and adaptation record in `PROVENANCE.md` |
| MichengAI dsh-skills-manager basic compiled core (adapted) | 1.2.6 | Apache-2.0 | `modules/skills/vendor/`; license in `vendor/LICENSE`, identities and changes in `modules/skills/PROVENANCE.md` and `vendor/UPSTREAM.json` |
| fflate (dependency required by compiled Skills core) | 0.8.3 | MIT | Installed dependency; its package carries its own LICENSE |

## Inactive reference inputs

T04 records external source/artifact identities in [the reference manifest](<docs/reference-artifacts.json>)
and [the source/license review](<docs/research/reference-source-provenance.md>). These are inspection inputs,
not automatically additional bundled runtimes or production dependencies. The package retains only
the selected Skills basic-core and Codex account integration files identified above; standalone registration, catalog and updater payload is excluded.
The reference license texts and their limitations are recorded
in the review; any later copied source, tests or assets must carry their required text and local-change notices
before packaging. No provider account, trademark or service authorization follows from a code license.
