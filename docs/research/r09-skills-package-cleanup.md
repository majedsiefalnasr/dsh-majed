# R09 Skills exposure and package cleanup

2026-10-25; candidate on `feat/r09-skills`, based on `8693a80`.
Authority: revised specification and [R09 / #49](https://github.com/majedsiefalnasr/dsh-majed/issues/49).

## Observed exposure before cleanup

| Surface | Observation |
| --- | --- |
| Production `index.js` | Calls `registerSkills(ctx, {})`; only the disabled status route is registered. |
| Production `client.js` / `dist/client.js` | Native Skills readiness section only. Build copies this client; the historical `build-client.mjs` vendor composition is unused. No catalog/repository/updater UI is mounted. |
| Explicitly enabled `modules/skills/index.js` | Loads `native.js`, not standalone vendor `apply`. Requires explicit enabled/conflict acknowledgement. |
| Native facade | Own `/api/dsh-majed/skills` route; basic list/detail/toggle/create/trash/restore/delete/listTrash actions only. No deferred tools or routes are registered. |
| Actual main-checkout `npm pack` with intended `modules/**/*` | Included the ignored full vendor distribution: standalone registrations, catalogs, repository/updater modules, browser client, plugin metadata, assets and locales. Ignored files are still eligible under this explicit npm files pattern. |
| Fresh branch before this change | Vendor source absent from git; enabled facade could not import the core. Its required writable-root helper was also absent from the core export list. |

## Change and coupling

Keep the intended runtime-module package inclusion. Nested npm exclusions remove
separable deferred Skills payload and module tests, including from a checkout
containing the old ignored distribution. Track only the shared compiled core,
recursive read-only discovery helper, Apache license and exact source identities.
Export the already-existing writable-root check and declare its required static
`fflate@0.8.3` dependency. The basic core still contains unmounted category/upload/
directory-import helper bodies; deleting these would require a separate bounded
extraction of coupled filesystem and policy behavior. No core function body was
changed. See [provenance](../../modules/skills/PROVENANCE.md) and
[artifact hashes](../../modules/skills/vendor/UPSTREAM.json).

D01 repository/catalog installation, D02 uploads/categories/extended sources and
D03 self-update remain deferred. No issue or dependency was edited, including
#42–#46. No operational Skill file, installed plugin or reference-owned store was
read, moved or deleted.

## Verification

- Red: packaging tests rejected a module test in the tarball and then a staged
  standalone/catalog/updater distribution. Both pass after nested exclusions.
- Red: real native create returned HTTP 500 because the retained core did not
  export its writable-root check. It passes after the export-only adaptation.
- `npm test`: **445 passed, 0 failed** (plus the existing classification script's
  166 assertions). Includes the actual npm pack/extract/prepare lifecycle.
- Extracted-package basic fixture: disabled status only, then explicit enabled
  registration, real create/list/detail/toggle/trash/restore/delete against
  disposable HOME/DSH_HOME; missing permanent-delete confirmation and deferred
  actions reject. Uses the installed locked dependencies via a symlink, not an
  additional live dependency install. It executes extracted package source with
  no full vendor distribution present.
- Packaging fixture deliberately stages old deferred payload and verifies it is
  excluded while shared core/discovery/license/provenance remain. This prevents
  a fresh worktree's missing ignored files from producing a false pass.
- Selected 1.2.6 files matched the downloaded immutable registry artifact before
  the documented export/comment adaptation. Registry signature/attestation and
  source-build reproduction were not verified.

## Acceptance limits

This establishes the cleanup and reproducible basic-core package boundary.
Portable connection registration is a fixture adapter; it is not proof of native
Owner/paired-remote admission. No native visibility behavior was changed, and
actual model/slash propagation remains R11. The facade still accepts project
paths without native authenticated resolution and retains historical policy
paths; this change does not approve or fix those existing integration gaps.
Production Settings remains inert. Full R09 local/remote basic workflow acceptance
therefore remains partial until R11's production/native composition is verified.
Desktop/remote live evidence and Cutover remain separate gates.
