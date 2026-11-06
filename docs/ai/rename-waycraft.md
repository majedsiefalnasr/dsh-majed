# Rename `majed` -> `waycraft` (ticket #159)

The product is Waycraft for DSH. Every owned identifier now uses the `waycraft` prefix. The retired name survives only as documented deprecated aliases and migration constants, centralized in `src/legacy-names.ts` (names) and `src/storage-migration.ts` (copy logic). `test/legacy-name-guard.test.mjs` fails if the retired name appears elsewhere in owned sources.

## Old -> new

| Category | Old | New | Compatibility (one release) |
| --- | --- | --- | --- |
| CSS classes / variables / data attributes | `majed-*`, `--majed-*`, `data-majed-*` | `waycraft-*`, `--waycraft-*`, `data-waycraft-*` | none (internal) |
| Settings section / slot / panel ids | `majed-skills`, `majed-subscriptions` | `waycraft-skills`, `waycraft-subscriptions` | saved active panel id is mapped to the new id; skills placement lives in the skills state file (migrated) |
| Locale namespaces | `majed.*` | `waycraft.*` | none |
| Subscriptions RPC | `/api/majed-subscriptions.<endpoint>` | `/api/waycraft-subscriptions.<endpoint>` | host registers both; new client calls the new route only |
| Skills catalog route / header | `/api/majed-skills.catalog`, `x-majed-skills` | `/api/waycraft-skills.catalog`, `x-waycraft-skills` | host registers both routes and accepts either header |
| Font route | `/plugins/dsh-majed/fonts` | `/plugins/dsh-waycraft/fonts` | host serves both |
| localStorage | `majed.subscriptions.usageBadgeMode`, `dsh-majed:settings:v1` | `waycraft.subscriptions.usageBadgeMode`, `dsh-waycraft:settings:v1` | read new, then old; write new only; old keys never deleted |
| Browser global | `window.__dshMajed` | `window.__dshWaycraft` | old name is an alias of the same object |
| Subscriptions storage | `~/.dsh/plugins/majed/subscriptions/` | `~/.dsh/plugins/waycraft/subscriptions/` | copied on first use, old read as fallback |
| Skills state root | `~/.dsh/majed-skills/` | `~/.dsh/waycraft-skills/` | copied (tree) on first use, old read as fallback |
| Tool collision fallback | `dsh_majed_*` | `dsh_waycraft_*` | NOT aliased (see open items); toolview keys for old transcripts are kept |
| Toolview slot keys | `dsh_majed_image_generate`, `dsh_majed_video_generate` | `dsh_waycraft_*` | both registered so old transcripts render |
| User agent | `antigravity/1.104.0 dsh-majed` | `antigravity/1.104.0 dsh-waycraft` | none |
| Build symbol | `majedSubscriptionsFactory` | `waycraftSubscriptionsFactory` | none |
| Test temp dirs | `/tmp/majed-t129` ... | `/tmp/waycraft-t129` ... | none |
| Loader row ids (`cordis.patch.yml`) | `majed`, `majed-subscriptions`, `majed-skills` | **unchanged, pending** | see open items |

Unchanged on purpose: repository owner/URL `majedsiefalnasr`, author, LICENSE, `/Users/majedsiefalnasr` paths, CHANGELOG history, `docs/research`.

## Migration behavior

- Single files (`auth.json`, `proxy.json`, `provider-settings.json`, `models.json`, `model-defaults.json`): if the new file is absent and the old exists, the old file is copied to a stage file `<name>.migrating-<pid>-<random>.tmp` (mode of the source, `wx`), parsed (JSON), fsynced and published with a hard link, so an existing new file is never overwritten. The stage is removed afterwards; stale stage files (older than 10 minutes, same owner) of an earlier interrupted copy are cleaned, others are ignored.
- Skills root: copied as a tree into a stage directory (bounded to 20000 entries / 512 MiB, symlinks skipped, top-level `.json` parse-validated, modes kept) and renamed into place atomically; an existing new root is never touched.
- If the copy fails (corrupt old JSON, read-only target, too large) a one-time diagnostic with the file name only (never contents) is logged, no partial new file is left, and the old file is READ instead (no fail-closed). Writes go to the new path once it exists.
- `videos/` files are read lazily from the old directory when absent in the new one.
- The old `images/` directory is NOT copied and NOT read as a fallback. Generated images are written to `images/` for the user and also saved as attachments (`src/tools/image-generate.ts`); nothing reads that directory back, so previously generated image files simply stay in the old directory and new ones go to the new directory.
- Credential files (`auth.json`, `proxy.json`) are published with their mode masked to owner-only (`& 0700`), even if the old file was wider.
- Degraded modes: if a single-file copy fails, that file is read from the old path while writes go to the new path (the old file is then no longer updated). If the skills-root copy fails twice, the manager reads AND writes the legacy root consistently (no new root is created) and logs a diagnostic; a later start that migrates successfully copies the whole legacy tree including those writes.
- A differing old/new pair is never reconciled: once the new file exists it wins.
- The migration itself never modifies or deletes old files or directories. In skills degraded mode (see above) the manager keeps using the legacy root, so that root is updated by normal use.
- A legacy skills tree over 20000 entries / 512 MiB never migrates automatically and stays on the legacy root (degraded mode). Migration runs synchronously at start-up, so a very large tree delays that start.
- If the legacy skills path exists but is a file, not a directory, the manager logs a clear diagnostic and fails closed (state unavailable, writes refused).

## Alias removal plan

All aliases are marked deprecated and are removed in the next release: delete `src/legacy-names.ts`, the fallbacks that import it (`src/subscriptions.ts`, `src/skills.ts`, `src/browser.ts`, `src/skills-browser.ts`, `src/usage-badge/usage-badge-preferences.ts`, `client.js`, `index.js`), and the `test/legacy-*` / alias tests; keep `src/storage-migration.ts` only if a later release still supports upgrading from 0.2.x.

## Rollback

Old data is untouched, so reinstalling the previous archive (old name) works with the old files. Files created under the new paths can be deleted by the Owner; they are copies. Caveats: after the new version has been used, token refreshes were written only to the new `auth.json`, and rotated refresh tokens may invalidate the old copy, so a rollback may need a re-login; changes made after the upgrade (settings, skills state) do not flow back to the old files.

## Supported combinations

Host and browser halves must be restarted/reloaded together. A new client against an old host is not supported: the new client uses only the new route, header and font names, which an old host does not serve.

## Open items

1. **Loader row ids.** `cordis.patch.yml` rows `majed`, `majed-subscriptions`, `majed-skills` are host-visible registration ids; renaming them may reset the user's enabled state. Needed: an experiment on a real DSH profile (rename a row id in a scratch profile, restart, compare enabled flags). Manual step: do it by hand, then rename the rows and update `test/skill-manager-lifecycle.test.mjs`, `test/subscriptions-packaging.test.mjs`, the guard allow-list and GLOSSARY.md.
2. **Tool-name aliases.** The old collision-fallback tool names `dsh_majed_*` are not registered as aliases: the DSH tool registry seam offers no proven way to alias and keep restriction handling identical (`test/tools-owned.test.mjs` pins the exact alias set). Impact: only when `image_generate`/`video_generate`/`x_search` collide with another plugin, a stored reference to `dsh_majed_*` will not resolve.
3. Unproven: installed app behavior, real Loader rows, a real data upgrade, paired remote, crash durability of the copy.
