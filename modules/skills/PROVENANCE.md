# Internal Skills basic core

The retained vendor/lib/core.js, vendor/lib/readonly-discovery.js and vendor/LICENSE originate from MichengAI @michengai/dsh-skills-manager **1.2.6**, under **Apache-2.0**. Majed MIT does not replace it. No NOTICE file is present in that artifact.

Upstream: https://github.com/MichengAI/dsh-skills-manager

Exact artifact identity, upstream hashes and the local adaptation are recorded in [vendor/UPSTREAM.json](vendor/UPSTREAM.json). Selected files were compared with the downloaded registry artifact on 2026-10-25. Both compiled files matched the previously ignored local prototype before adaptation. This is the existing 1.2.6 subset, not a claim of parity with the separately reviewed T04 1.2.11 oracle or a reproduced source build.

Local changes to core.js: export writable/private-store checks; isolate policy/trash under DSH_HOME/majed/skills; reject private-store/user-root symlinks; use mode-0700 private directories and exclusive mode-0600 atomic temporary files. Explicit Manager enable restores source flags rather than granting model/user invocation that frontmatter denies. Source rank/selection and basic operations remain upstream-derived. readonly-discovery.js and LICENSE remain unchanged. The static fflate import requires pinned MIT dependency fflate@0.8.3, although ZIP upload is not exposed.

The basic core compiles category, upload and directory-import helpers together with accepted behavior. Those helpers remain inside this shared file to avoid an unreviewed rewrite of filesystem safety and policy behavior; they have no mounted route, tool or UI in Majed. Later extraction needs separate behavior proof.

modules/skills/.npmignore excludes the safely separable standalone host/client, catalogs, repositories, updater, assets, locales and plugin manifest even when the old ignored distribution exists in a checkout. No ignored source or user file is deleted. The committed subset packages from a fresh checkout without those ignored files.

The production entry registers Owner-admitted native Settings at /api/majed/skills. Explicit enablement acknowledges single-owner operation and mounts a Majed-named native provider through a child plugin. It exposes only list/detail/toggle/create/trash/restore/delete. The standalone runtime/browser are never applied. Runtime enablement resets on service restart; private policy survives it.

The service resolves project scope through native sessions/workspaces; caller paths are rejected. Registry invalidators and a compatibility catalog-refresh notification update native model/slash consumers. Fixture evidence and remaining transport/live limits are recorded in docs/research/r11-native-skills-workflow.md. No installed/reference state was read or changed, no policy was imported, and no Cutover is authorized by this source reuse.
