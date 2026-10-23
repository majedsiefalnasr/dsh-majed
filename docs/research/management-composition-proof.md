# Bounded native admission + scope composition

This closes only the previously separate fixture composition gap. T02A remains OPEN. Production packaging and Manager registration remain gated and unchanged.

## Implementation

`lib/management/scope.js` exports `resolveManagementScope(ctx, selectors, signal)`, a read-only policy using public SessionStore, SessionPersistence and WorkspaceRegistry interfaces plus filesystem canonicalization. It accepts session/workspace identifiers only; extra client path fields are ignored. Live session creation headers take priority over cold persistence snapshots, including publication during an awaited cold read. Registry membership and canonical project path must agree. Cancellation is checked before and after awaited work; registry identity/membership are rechecked after canonicalization. Missing paths reject; unexpected filesystem/storage faults propagate.

`scripts/probe-management-composition.cjs` mounts actual exported native `apply` (which constructs native BrowserAuth), actual SessionStore/WorkspaceRegistry/DomainFacility, synthetic memory CredentialProvider/persistence/KV, and an inert WebServer registration boundary. Signed synthetic cookie exchange and every tested scope request use actual native `/api` handling with in-memory Node HTTP streams and the exact Owner-authenticated Fetch route. No internal class imports, historical prototypes, runtime edits or installed state are used.

The operation is intentionally an in-memory scope observation, not a production write. Counters verify missing/malformed/tampered authentication never invokes resolver or operation; wrong/missing selectors and membership never invoke the operation or write KV. Successful requests also leave KV unchanged. Valid live/cold membership, ignored client paths, creation scope after directory events, cold/live races, response-close cancellation through the actual HTTP bridge, symlink substitution/removal, membership detachment and registry deletion are exercised. Services are disposed in reverse order and DomainFacility closure is awaited/asserted.

## Commands and actual outcomes

Run from the isolated `feat/t02a-scope` worktree with:

    DSH_PROBE_NODE='/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness' DSH_PROBE_RUNTIME='/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh' node scripts/test-management-composition.mjs

The runner does not inherit operational environment: disposable HOME/DSH_HOME/cwd/TMPDIR, ASAR-aware Electron Node mode, 30-second timeout and checked cleanup root. The probe blocks network, listeners, DNS and child processes before native module loading.

- Initial tracer RED: exit 1, `Composition probe failed at mount: ERR_MODULE_NOT_FOUND` before creating the resolver.
- Tracer GREEN: exit 0, `{"runtime":"0.2.1-rc.2","node":"24.21.0","checkpoint":"authenticated-live-scope"}`.
- Expanded final GREEN: exit 0, runtime `0.2.1-rc.2`, Node `24.21.0`, checkpoint `canonical-path-substitution`, seven check groups reported.
- Same command with `--red-membership`: intended exit 1, `Composition probe failed at selectors-and-cold-membership: ERR_ASSERTION`. This calls actual `workspace.detachSession('cold')` before the unchanged expected-200 assertion: fixture facts change, not assertions.
- Existing `test-management-admission.mjs`: exit 0, all seven existing admission groups reported.
- Existing `test-management-scope-recovered.mjs`: exit 0, checkpoint `fresh-path-and-stale-registration`.
- `git merge feat/managers`: initial merge succeeded; latest merge reported `Already up to date.` at integration `e801505`.
- `git diff --check`: exit 0.
- `npm test`: build succeeded; 43/44 top-level tests passed, classifier 166/166 passed. One failure: `Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@deepseek-ai/cordis' imported from .../test/baseline-host.test.js`. Existing packaging exclusion test passed. No full-suite-green claim.
- Attempted offline dependency restoration (`npm install --offline --ignore-scripts --no-package-lock --no-audit --no-fund`) failed exit 1, `ENOTCACHED`. No network fallback attempted.
- Separate package dry-run failed due to `EPERM` under the host npm cache. No permissions change, escalation or retry around that denial. The existing package allowlist is unchanged and excludes the new files; standalone dry-run verification is not claimed.

## Exact limits

Synthetic credentials are not operational Owner login. Memory persistence/KV are not actual user stores. In-memory HTTP streams are not listeners, browser mounting, TLS or actual local/paired-remote supported carrier acceptance. The project directories and symlinks are real but disposable.

Canonicalization is a fresh observation, not a lease or race-free filesystem capability. The substitution control changes a symlink between requests; it does not prove immunity to substitution during filesystem awaits or after resolution. Any later real mutation needs independent path/identity/cancellation protection at its use boundary. Cancellation does not establish rollback.

No production Manager operation, Settings/client rendering, Skills/MCP composed lifecycle, remote/live acceptance, command Approval provenance/challenge/persistence/execution, installed edits or T02A/T02E closure is claimed. No shared specification, acceptance ledger or changelog is edited by this branch. The pre-existing untracked inspection artifact is preserved and not imported.
