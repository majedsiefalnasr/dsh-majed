# Internal Skills basic core

The retained vendor/lib/core.js, vendor/lib/readonly-discovery.js and vendor/LICENSE originate from MichengAI @michengai/dsh-skills-manager **1.2.6**, under **Apache-2.0**. Majed MIT does not replace it. No NOTICE file is present in that artifact.

Upstream: https://github.com/MichengAI/dsh-skills-manager

Exact artifact identity, upstream hashes and the local adaptation are recorded in [vendor/UPSTREAM.json](vendor/UPSTREAM.json). Selected files were compared with the downloaded registry artifact on 2026-10-25. Both compiled files matched the previously ignored local prototype before adaptation. This is the existing 1.2.6 subset, not a claim of parity with the separately reviewed T04 1.2.11 oracle or a reproduced source build.

Local change to core.js: add an attribution/change comment and export the existing checkedWritableRootDefinition required by the native facade. No function body, precedence, policy storage or filesystem behavior is changed. readonly-discovery.js and LICENSE remain unchanged. Its static fflate import requires the pinned MIT dependency fflate@0.8.3, even though ZIP upload is not exposed by the facade.

The basic core compiles category, upload and directory-import helpers together with accepted behavior. Those helpers remain inside this shared file to avoid an unreviewed rewrite of filesystem safety and policy behavior; they have no mounted route, tool or UI in Majed. Later extraction needs separate behavior proof.

modules/skills/.npmignore excludes the safely separable standalone host/client, catalogs, repositories, updater, assets, locales and plugin manifest even when the old ignored distribution exists in a checkout. No ignored source or user file is deleted. The committed subset packages from a fresh checkout without those ignored files.

The production entry currently reports Skills disabled; its Settings toggle is inert readiness, not activation. The separately enabled native facade loads only the basic core and exposes list/detail/toggle/create/trash/restore/delete. It never applies the standalone runtime or browser module.

The retained core still uses historical skills-manager policy/trash paths under DSH_HOME. Packaging does not approve that persistence architecture, provide authenticated project resolution, propagate native visibility, or grant single-owner Cutover. Those existing integration gaps belong to R11 and later replacement acceptance. No installed/reference state was read or changed.
