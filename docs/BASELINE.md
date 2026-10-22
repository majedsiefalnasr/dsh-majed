# T01: accepted baseline boundary

Issue: [T01 / #3](https://github.com/majedsiefalnasr/dsh-majed/issues/3).
Baseline before this prefactor: `b530180`; approved planning recorded separately in `4970c38`.

## Active entry points

- `index.js` exports the accepted host `apply(ctx)` from `lib/baseline/host.js`: the existing font route
  and native read-page registration only. There is no Manager, provider, config-editor or credential-store import.
- `client.js` remains the accepted browser source. `scripts/build-baseline.mjs` copies only that source
  into `dist/client.js`, the public `./client` export. The explicit build input cannot accidentally pick up
  untracked prototype modules. `prepare` supports Git installs; `prepack` supports npm tarballs.
- `npm test` builds first, runs the original appearance/classifier/read-page regressions, the actual Cordis
  host entry suite, and recursively discovers all `*.test.js`, `*.test.cjs` and `*.test.mjs` in `test/accepted/`.
  Put new approved suites there. It intentionally does not auto-discover the historical prototype suites.
- The package allowlist ships the host module and built client, existing fonts/locales and notices. It does
  not ship `modules/`, the old client bundle, deployment backups or tests. No replacement runtime is enabled.

The development version is `0.3.0-rc.1`. It is not a published or live-verified release.
Use `npm install --package-lock=false` to install the exact declared Cordis dev dependency without changing
historical prototype lock data. No production dependency or provider SDK is added by T01.

## Explicit disposition of historical untracked work

These files predate T01. They remain in place and untracked, without deletion, overwrite, runtime imports,
package inclusion or automatic test inclusion. They are reference material, not an approved implementation.

| Historical paths | Disposition |
| --- | --- |
| `modules/managers/index.js`, `ownership.js`, `validation.js`, `transport.js`, `client.js`, `managers.test.js` | Do not carry forward config-editor identity/ownership persistence or automatic wiring. Retain secret preservation, validation, lifecycle and auth assertions as requirements to re-express through approved public interfaces in later tickets. |
| `modules/skills/index.js`, `loopback.js`, `PROVENANCE.md`, `vendor/` | Do not activate or package the stale vendored runtime. Native Skills work follows the approved rewrite and no-dual-owner Cutover policy. Keep provenance for historical inspection only. |
| `modules/mcp/index.js`, `modules/hooks/index.js` | Do not activate. Revisit per-server fiber cleanup and deny/audit behavior selectively in the later MCP and command-hook/tool-rule slices; tool rules are not a substitute for command hooks. |
| `client-bundle.js`, `scripts/build-client.mjs` | Never run this concatenation pipeline in the accepted build: it wires the obsolete prototype. New build input is explicitly baseline-only. |
| `test/managers-client.test.js`, `managers-http.test.js`, `managers-remote.test.js`, `managers-transport.test.js`, `root-cordis.test.js` | Excluded from the accepted runner. Later tickets must retain public admission, remote-prefix and disposal behaviors, but replace ownership-editor and prototype mounting expectations. |
| `test/mcp-runtime.test.js`, `test/fixtures/mcp-stdio.cjs` | Keep as reference for synthetic stdio/Cordis integration; re-adopt only with the approved per-server interface and isolated fixture state. |
| `test/skills-integration.test.js`, `skills-runtime.test.js`, `skills-transition.test.js` | Keep no-dual-owner and isolated-root safety requirements, not the vendored runtime assertions. |
| `package-lock.json` | Preserve untouched/untracked. It belongs to the prototype dependency graph (fflate/MCP client), not the accepted package manifest. Do not use `npm ci` with it. |
| `deployment-backups/` | Existing ignored rollback material; not changed, packaged or executed. |

No existing prototype assertion has silently become proof of the accepted design. New characterization
uses the unchanged public entry behavior as its oracle and tests loading/disposal rather than private helpers.

## Evidence and limitations

T01 is complete at its local automated baseline boundary. Independent Standards and Spec reviews of
`820accb` and `2b65f91` found no remaining substantive T01 requirement. Branch publication, installation
and live verification are not prerequisites of this prefactor; they remain separate later operations.
The earlier issue comment kept T01 open for those operations unnecessarily. This disposition does not
claim desktop/remote feature parity or approve a release, installation or Cutover.

Automated seams exercised:

- Public host module applied/disposed with real `@deepseek-ai/cordis@4.0.5`; font route method/path/content
  policy and registry-listener cleanup. Existing native read-page tests still cover dispatch, admission,
  cancellation and fail-closed behavior using the tool-registry contract fixture.
- Actual built client evaluated via its ModuleLoader registration/factory/apply boundary. Rendered public
  slot handlers exercise retained preferences, safe/aggressive approval decisions, notifications and disposal.
  Client fixtures model DOM/React/context behavior; they are not the host ModuleLoader, a React reconciler,
  a browser layout engine, notification permissions, mobile fallback or exact-host feasibility proof.
- npm package inventory checked against executable artifacts and exclusion of prototype runtimes.

Characterization exposed existing disposal leaks: a previous account-menu API was deleted rather than
restored, an empty global extension namespace remained, and pending stylesheet load listeners survived.
Review also exposed loss of preexisting inline font overrides and notification delivery resuming after teardown.
Minimal cleanup fixes restore owned values/priorities, invalidate pending deliveries and remove pending
callbacks; they do not change enabled behavior. Notifications already submitted to the service worker are
outside the pending-delivery cancellation guarantee.

Latest automated evidence: `npm test` passes 45 Node tests (including 166 classifier cases), zero skips;
syntax checks and `git diff --check` pass. Real `npm pack --json` is parsed, the extracted package's
`prepare` rebuilds byte-identical client output, and package inventory excludes all prototype runtimes.
An additional temporary tarball probe applied/disposed the extracted host with Cordis and served a bundled
font successfully (45 packaged files). No installed copy was used or changed.

Not performed: installation, DSH restart, desktop/remote live checks, provider requests, account reads,
Manager activation or reference-plugin Cutover. All require their own operation-specific authority and
verification. This issue's automated result cannot satisfy later exact-host or live acceptance gates.
