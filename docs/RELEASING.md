# Releasing dsh-majed

Versioning follows Semantic Versioning. Use `-rc.N` for release candidates; a release leaves `-rc` only after
live verification in the DSH desktop app (see checklist).

## Checklist
1. Working tree contains only intended changes: `git status`.
2. `npm test` passes and `git diff --check` is clean.
3. Update `version` in `package.json`.
4. Move the `CHANGELOG.md` entries from the unreleased section into the new version heading with its date
   (Keep a Changelog format) and fix the compare links at the bottom.
5. If vendored or bundled third-party material changed, update `THIRD_PARTY_NOTICES.md`.
6. `npm pack --dry-run --cache .npm-pack-cache --logs-dir .npm-pack-cache/_logs`;
   confirm the tarball contains `index.js`, `client.js`, `lib/read-page-native.js`, `fonts/`, `LICENSE`,
   `CHANGELOG.md`, `THIRD_PARTY_NOTICES.md`.
7. Live check in the desktop app after a full restart: Settings ▸ General options render and the Approvals dropdown works.
8. Commit (`chore(release): vX.Y.Z`), tag (`git tag -a vX.Y.Z -m "vX.Y.Z"`), push the commit and tag.
9. Create the GitHub release from the tag using the changelog section as notes
   (`gh release create vX.Y.Z --notes-file <section> [--prerelease]`; use `--prerelease` for `-rc`).

## Rollback
Keep the previous installed copy of `node_modules/dsh-majed` before replacing it. Restore it and restart DSH.
