# T03 authenticated Settings product increment

Status: implemented product increment; **not complete T03 acceptance or live verification**.

## Product boundary

The accepted `index.js` now mounts a public `connection.fetch` exact route at
`/api/majed/settings/status`. Native BrowserAuth/Owner admission and Host/Origin
fences run before the handler. The accepted browser bundle registers five native
Settings sections: Skills, MCP, Hooks, Subscriptions and Auto routing. Each owns a
separate process-lifetime readiness toggle. These toggles do not activate feature
operations, command execution, accounts, providers or routing. They are shared by
clients of the same host, reset on host-service disposal/restart and are not
configuration persistence. The UI explicitly describes this boundary.

The browser uses native `connection.rpc.call('/api', 'majed/settings/status', ...)`
with relative/baseURI-aware transport; the exact Fetch handler intentionally speaks
the native correlated request/response envelope. Failure envelopes include the
required `error.details` object. No host patch, configEditor write or old prototype
is involved. Optional project selectors resolve a real session/workspace membership
through `lib/management/scope.js` after native admission; paths are never returned.
Ordinary Settings checks are instance-scoped and do not invent a session identity.

## Automated evidence

- `npm test` runs the accepted build and test entry, including product service,
  rendered client, validation and stream cancellation tests alongside baseline
  appearance/disposal, classification, read-page and package contracts.
- `scripts/test-settings-product.mjs` is an opt-in isolated exact-host integration
  test. It uses only supplied installed runtime/module files as read-only inputs,
  synthetic credentials and memory stores, two disposable loopback listeners,
  temporary HOME/DSH_HOME and bounded HTTP. All listeners/contexts are disposed.
- The exact-host test mounts actual `dist/client.js` in installed native Settings
  and renderer bundles using ReactDOM/jsdom. Native connection RPC calls traverse
  real local HTTP and the installed remote prefix/proxy implementation into the
  production host handler. It verifies readiness enablement, independent module
  status, missing local cookie and remote pairing rejection, actionable errors,
  valid/wrong session-to-workspace boundaries, CSRF fences, byte limits, exact
  path and disposal. The native route registry rejects method mismatches as 404
  before delivery (the handler also defensively rejects non-POST requests).
- It exercises a rejected scoped request through the actual native RPC response
  parser, not just a JSON helper. Never-settling reader cancellation, slow body
  timeout and abort are covered in the portable accepted suite.
- Exact-host run: DSH `0.2.1-rc.2`, embedded Node `v24.21.0`; both owned listeners
  closed. The runner emits module SHA-256 hashes for reproducibility.

Run the opt-in test with the approved `DSH_PROBE_NODE`, `DSH_PROBE_RUNTIME`,
`DSH_PROBE_REMOTE` and `DSH_MOUNTED_DEPS` file/directory paths, then
`node scripts/test-settings-product.mjs`. It fails rather than silently skips if
these inputs are missing. Prior feasibility scripts remain references, not
production dependencies.

## Missing acceptance

English/Arabic copy and explicit RTL section direction are tested at the rendered
fixture seam. Controls inherit typography, use native Switch and theme tokens,
wrap flex content and preserve default keyboard button semantics. **This does not
prove visual rendering.** The exact-host integration uses explicit presentation
primitive/locale adapters and jsdom; it cannot prove CSS layout, actual native
Switch appearance, light/dark themes, font sizes 14/18, keyboard focus behavior,
modal overflow or narrow remote viewport. Real browser visual/keyboard QA and
local-after-restart plus paired remote live evidence remain required. No installed
plugin changes, restart, operational authentication or live/provider claim was
made. The issue must remain open for these missing acceptance checks. The
[browser acceptance procedure](t03-browser-acceptance.md) records the pending matrix
and deployment/identity preconditions; it is not an executed result.
