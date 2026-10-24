# Internal Skills module

Vendored from the installed `@michengai/dsh-skills-manager` package, version **1.2.6**, originally published by MichengAI under **Apache-2.0**.

Upstream: https://github.com/MichengAI/dsh-skills-manager

The complete installed distribution is preserved under `vendor/`, including its original manifest, LICENSE, locales, assets, documentation, all compiled host feature modules and the compiled browser module. The outer dsh-majed MIT license does not replace this Apache license. There was no NOTICE file in the installed distribution.

Local modifications to upstream compiled files:
- `vendor/lib/index.js`: removed standalone plugin updater import and registration; added native DSH Connection owner-admission before all management routes, replacing the initial loopback-only gate. Host and Origin validation are delegated to authenticated native admission; mutations additionally retain JSON, Origin and custom-header requirements. Kept all skill providers, tools, routes, repository/catalog/upload/category/trash/project/discovery features and state paths unchanged.
- `vendor/lib/client.js`: changed ModuleLoader ID to `dsh-majed/internal/skills`; removed standalone updater UI registration. Its bundled updater helpers remain unreachable, for minimal risk to the compiled feature bundle.

Integration lives outside the vendored distribution in `index.js`. It is disabled by default, requires explicit conflict acknowledgement, and loads the host implementation only when enabled. The root client source is composed with the internal factory using `scripts/build-client.mjs`; the package client export is the generated bundle. Existing toolkit typography scans handle vendor pixel font sizes once; no additional `--majed-ui-d` term is added here.

State compatibility: the upstream implementation still owns `${DSH_HOME}/skills-manager/state.json`, repository metadata, trash, discovery roots and `${DSH_HOME}/dsh-skills-manager.log`. No migration, rename, state copy, state inspection or uninstall was performed during integration. Enabling this module grants the same management operations as upstream, including mutating skills when explicitly invoked.

Conflict policy: automatic detection across arbitrary Cordis plugin aliases and browser loader order is not reliable. The operator MUST disable the old standalone package on BOTH host and client before setting `skills.standaloneDisabled: true`. This is an explicit safety assertion, not an automatic proof or uninstall. Keeping the same API/state/provider identities is deliberate for compatibility and makes concurrent use unsafe.
