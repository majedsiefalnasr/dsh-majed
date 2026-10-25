# Third-party notices

`dsh-majed` is released under the MIT License (see `LICENSE`). It includes the following third-party material.

| Component | Version | License | Location |
|---|---|---|---|
| Inter, Roboto, Open Sans, Noto Sans, Noto Sans Arabic, IBM Plex Sans, IBM Plex Sans Arabic (via Fontsource) | see `fonts/manifest.json` | SIL Open Font License 1.1 | `fonts/` (licenses in `fonts/LICENSE-*.txt`) |
| dsh-persian-rtl (chat direction CSS/logic, adapted) | n/a | MIT | `client.js` |
| MichengAI dsh-skills-manager basic compiled core (adapted) | 1.2.6 | Apache-2.0 | `modules/skills/vendor/`; license in `vendor/LICENSE`, identities and changes in `modules/skills/PROVENANCE.md` and `vendor/UPSTREAM.json` |
| fflate (dependency required by compiled Skills core) | 0.8.3 | MIT | Installed dependency; its package carries its own LICENSE |

## Inactive reference inputs

T04 records external source/artifact identities in [the reference manifest](<docs/reference-artifacts.json>)
and [the source/license review](<docs/research/reference-source-provenance.md>). These are inspection inputs,
not automatically additional bundled runtimes or production dependencies. The package retains only
the selected Skills basic-core files identified above; standalone registration, catalog and updater payload is excluded.
The reference license texts and their limitations are recorded
in the review; any later copied source, tests or assets must carry their required text and local-change notices
before packaging. No provider account, trademark or service authorization follows from a code license.
