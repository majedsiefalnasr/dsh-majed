# Releasing Waycraft for DSH

The package name is `dsh-waycraft` (formerly `dsh-majed`). Repository URLs remain unchanged until a separately approved GitHub rename. Never install both names together: Loader row ids and durable compatibility namespaces intentionally remain `majed`-based. Replacement, restart, publication and data migration each retain their explicit approval boundaries. Recheck registry availability before publication; the source package version is not proof of a published release.

Versioning follows Semantic Versioning. Use `-rc.N` for release candidates; a release leaves `-rc` only after
live verification in the DSH desktop app (see checklist).

## Permanent release and documentation rules

- Build a feature inventory from the entire integration delta, not only the last UI ticket. Separate implemented, controlled-test verified, Owner-accepted, dormant and deferred behavior. Do not advertise roadmap capabilities as shipped.
- Write release notes in English with version/date, Added/Changed/Fixed compatibility facts, evidence and limitations, prerequisites, upgrade/restart and rollback. Reconcile superseded development entries in a final release summary without rewriting historical evidence or claiming new live coverage.
- Every visible change updates the changelog. Update README/product docs for current behavior; update glossary/ADRs only when terminology or decisions change. Preserve source/license attribution and historical names where they identify compatibility namespaces, authors or evidence.
- Verify the exact allowlisted archive: exclude credentials, account stores, private homes, rollback packages, test fixtures and caches. Record artifact hash and compare installed/published bytes with that archive. Never print secrets.
- Source commit/push, installation/restart, npm publication, GitHub release and real-account/paid operations have separate explicit approval boundaries. Never overwrite an existing registry version; tag only the exact public release commit after approved integration. User completes login/2FA personally; do not request credentials in chat.
- Record release status and remaining gates in current work before handoff. Installation, registry readback, source integration and desktop acceptance are distinct claims. Link the release summary from the changelog; keep release/docs rules linked from AGENTS.

## Checklist
1. Working tree contains only intended changes: `git status`.
2. `npm test` passes and `git diff --check` is clean.
3. Update `version` in `package.json`.
4. Move the `CHANGELOG.md` entries from the unreleased section into the new version heading with its date
   (Keep a Changelog format) and fix the compare links at the bottom.
5. If vendored or bundled third-party material changed, update `THIRD_PARTY_NOTICES.md`.
6. `npm pack --dry-run --cache .npm-pack-cache --logs-dir .npm-pack-cache/_logs`;
   confirm the tarball contains `index.js`, `client.js`, every component entry and its built output, `locale/`,
   `fonts/`, `LICENSE`, `CHANGELOG.md`, `THIRD_PARTY_NOTICES.md`.
7. Live check in the desktop app after a full restart: Settings ▸ General options render, the Approvals dropdown works, and each component's switch on the Plugins page turns its feature off and on.
8. Commit (`chore(release): vX.Y.Z`), tag (`git tag -a vX.Y.Z -m "vX.Y.Z"`), push the commit and tag.
9. Create the GitHub release from the tag using the changelog section as notes
   (`gh release create vX.Y.Z --notes-file <section> [--prerelease]`; use `--prerelease` for `-rc`).

## Automated npm publication

The GitHub Actions workflow `.github/workflows/npm-publish.yml` runs when a non-prerelease GitHub Release is published. It checks out the release tag, requires `v` plus the exact package version, installs locked dependencies, runs tests and the byte-exact fresh-build check, then publishes with OIDC provenance. Existing npm versions are skipped, never overwritten. Registry errors fail closed. Ordinary pushes do not publish. Release approval is still a human gate; do not publish a Release before its source, tests, notes and desktop acceptance are approved.

One-time Owner setup: in npm package **dsh-waycraft → Settings → Trusted publishing**, add GitHub Actions with organization/user `majedsiefalnasr`, repository `dsh-majed`, workflow filename `npm-publish.yml`, and no environment (this workflow declares none). Use GitHub-hosted runners and Node24's current npm with trusted publishing support. No npm token or OTP belongs in GitHub secrets or chat. Source: https://docs.npmjs.com/trusted-publishers/ . Workflow publication is not operationally verified until the first new approved release succeeds; configuring this file does not configure npm's trust.

Version0.2.1 was published manually before automation. Its GitHub Release must not republish it. Subsequent releases follow source integration → exact version tag → approved GitHub Release → automated validation/publication. Do not claim all historical desktop checks were repeated for the narrow0.2.1 identity fix; its boot acceptance is the Owner's explicit restart confirmation.

## Rollback
Preserve the exact previous approved package archive and its hash before replacing the installed bundle (`dsh-majed` for legacy installations, `dsh-waycraft` after cutover). Use the plugin manager for an explicitly approved replacement or rollback, not manual profile edits. Keep account/configuration directories intact, restore the previous archive if necessary and fully restart DSH. An archive rollback does not undo any separately authorized data migration.
