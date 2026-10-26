# R11 native Skills workflow candidate

2026-10-26. Authority: [R11 / #51](https://github.com/majedsiefalnasr/dsh-majed/issues/51), the revised Managers specification, and R09's retained Apache basic core. This record distinguishes implementation and controlled fixture evidence from live acceptance.

## Implemented

The production entry registers `/api/majed/skills` through native exact Fetch. Native Owner admission precedes delivery. Native Settings now presents actual Skills controls, with English/Arabic dictionaries, RTL direction and inherited host typography/tokens. Enablement explicitly acknowledges that the standalone Manager is disabled; it mounts a child plugin with a Majed-owned Skills provider. Runtime enablement resets on service restart and does not change installed configuration.

The serialized service rejects caller paths and resolves session/workspace selectors through `resolveManagementScope` after its queue. It rejects mismatched native membership and ancestor project roots outside the exact canonical workspace. Basic mutations reuse the retained core and native facade. The production entry no longer mounts the legacy direct facade/status route; the new scoped service is the production entry to those operations.

Policy and trash now live under `DSH_HOME/majed/skills`, without reading or writing the reference-owned `skills-manager` store. Private directory/file modes are 0700/0600; writes use exclusive temporary files and atomic rename. Private-store and writable user-root symlinks reject. Source files retain their original invocation frontmatter. Manager enable restores source policy rather than granting invocation that the source denies. The original 1.2.6 `override === true` branch granted both flags; the new native consumer test failed before that branch was removed.

Native registry controls invalidate after successful mutations. The unchanged rc.3 slash source caches by session and listens to `agent-preset/selected`, not `commands/change`; the compatibility notification refreshes each current session key without appending a preset-selection event or changing its composition. Default sessions without a legacy preset header also receive this refresh. Disabling the feature disposes its owned provider.

## Verification

`npm test` before integration merge: **446 passed, 0 failed**, plus the existing classification script's 166 assertions. Actual npm pack/extraction checks still exclude standalone catalogs/repositories/updater/assets and retain the selected runtime/license. The package basic fixture starts a second cold Node process to verify private disabled policy reload.

Run the opt-in exact-host fixture with the existing approved `DSH_PROBE_NODE`, `DSH_PROBE_RUNTIME`, `DSH_MOUNTED_DEPS` and `DSH_PROBE_REMOTE` pointers:

```sh
node scripts/test-skills-product.mjs
node scripts/test-skills-product.mjs --red-invalidation
node scripts/test-skills-product.mjs --red-membership
```

Positive fixture: DSH **0.2.1-rc.3**, Electron Node **24.21.0**. Actual production host/client entries, native Settings/renderer/Connection bundles, public ephemeral WebServers, BrowserAuth admission, actual paired proxy and controlled memory credentials/persistence are composed over real bounded localhost HTTP. No operational credential provider or network destination is allowed. The report includes hashes of the loaded native/client/proxy bytes.

The fixture exercises actual Settings enable/create/toggle/trash/restore, actual native filesystem/SkillRegistry discovery, native ToolRuntime plus `dsh-tool-skill` execution/denial, and the unchanged native browser slash source backed by the unchanged `SessionSkillCatalog`. It covers duplicate-source project priority and disabled fallback, independent source invocation flags, scope/path rejection, collision/traversal/symlink escape, private modes, unchanged source, service restart and disposal. All owned listeners and public watcher handles close. Watcher counts vary with native filesystem event timing; the runner checks every captured handle rather than asserting one incidental count.

Both sensitivity controls fail at the intended assertions: suppressing catalog-refresh delivery leaves the warmed slash menu visible after disable; detaching native workspace membership rejects the expected project request. Each failing run still closes all captured watchers/listeners. The original slash-cache assertion was red before the default-session invalidation fix.

## Remaining acceptance boundaries

- Native Settings mounting uses jsdom and explicit presentation/locale adapters. Browser layout, focus/theme/font14/18 and desktop/remote live acceptance are unverified.
- Native `SessionSkillCatalog` runs with explicit query/agent/working-directory adapters; no live Agent is resumed. The global provider's interaction with independently constructed preset/agent registries is not yet proved.
- The slash source's remote list and event callbacks are explicit same-process adapters. Settings mutations themselves cross actual local/paired HTTP, but paired event-stream delivery to an already-open slash menu is not proved here.
- Unicode descriptions/instructions retain upstream behavior; the host's invocation identifier grammar remains ASCII kebab-case. Unicode-only declared-name/native invocation compatibility is not established by this fixture.
- Runtime restart means service disposal/remount plus separately proved cold-process policy read, not an authorized installed desktop restart.

These limits keep R11 open. This increment does not grant Cutover, activate installed modules, modify reference files, implement deferred catalogs/imports/updater, or claim live parity. Source identity and every adaptation remain in `modules/skills/PROVENANCE.md` and `vendor/UPSTREAM.json`.
