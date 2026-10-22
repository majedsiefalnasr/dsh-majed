# Reference source, artifact and licensing evidence — T04

Captured 2026-10-22. Scope: the source/licensing evidence portion of [T04](https://github.com/majedsiefalnasr/dsh-majed/issues/9), **not completion of T04 or replacement parity**. The exact-byte inventory is [reference-artifacts.json](../reference-artifacts.json); behavior/test ownership and upstream maintenance remain separate acceptance work. See [upstream update process](../UPSTREAM_UPDATES.md), [subscription research](./subscriptions-auto-routing.md), [Skills research](./dsh-skills-manager-upstream.md) and [Pouch research](./dsh-pouch-plugins.md).

## Boundary and method

Only public GitHub source and npm registry metadata, tarballs and advertised attestation envelopes were obtained. Source was checked out detached with Git hooks disabled into a fresh temporary root. Tarballs were hashed, then extracted as data after rejecting absolute/traversal paths, links and nonregular members; each archive was limited to fewer than 2,000 members and 20 MB unpacked. No upstream module, build, installer, package lifecycle script, plugin `apply`, test or provider request was executed. No installed package, auth/account store, user configuration, profile, token or other operational state was read or changed. No runtime, tests, assets or dependency were copied into the project. These new documents are inert evidence only.

Evidence working root for this capture: `/tmp/dsh-t04-reference.brw2Iv` (`/private/tmp` is its macOS canonical alias). Checkouts: `sources/subscriptions`, `sources/skills`, `sources/pouch`; extracted artifacts: `artifacts/<id>/package`; downloaded archives: `artifacts/<id>.tgz`; public metadata: `metadata/<id>.json`. These are disposable reference locations, **not required project dependencies**, and may disappear after temporary-directory cleanup. There was no move or deletion. The project manifest retains URLs, immutable commits and hashes independently of that root.

The manifest inventories every tracked file of the subscriptions and Skills repositories at the pinned commits, and every tracked component file for the three Pouch packages, plus Pouch's root license, lockfile and publish workflow. Each `sourceFiles` entry has an exact repository-relative path, SHA-256 and role. `artifact.files` lists each regular npm package member relative to `package/`, with SHA-256. Artifact SHA-1, SHA-256 and SHA-512 are separate fields; SHA-1 is retained for comparison to the research/registry, not preferred as a modern trust primitive. A full commit and matching downloaded digest establish a reproducible **observation of bytes**, not author identity, uncompromised release infrastructure or an audited build.

## Immutable pins and source/artifact relationship

| Reference | Source commit used for research/tests | Tag resolution and published metadata | Observed byte relationship |
| --- | --- | --- | --- |
| `dsh-plugin-subscriptions` 0.9.9 | `9930c5ee5e3fa239db9031f47a0f6f30f7ffc443` | `v0.9.9` and npm `gitHead` both resolve to that commit | 5 published metadata/documentation files equal source; 134 compiled artifact files have no tracked same-path source file. No conflicting same-path bytes. **No source rebuild was performed.** |
| `@michengai/dsh-skills-manager` 1.2.11 | `b4d385b10ee49c6e09d244863a06c9d3a9b43a9d` (expands research `b4d385b`) | `v1.2.11` and npm `gitHead` match | All 49 artifact files equal their source counterparts, including all 10 committed `lib/` files. Source/tests are not included in npm. This is a native behavior/test oracle only, not a standalone runtime to mount. |
| `@moon16u/dsh-hooks` 2.1.0 | `e9c2aa153b4ac223eee187d730e4877ec5feb16d` (expands research `e9c2aa153b4a`) | `vdsh-hooks@2.1.0` and npm `gitHead` match | All 22 artifact files equal the research checkout. |
| `@moon16u/dsh-mcp-console` 0.3.10 | `e9c2aa153b4ac223eee187d730e4877ec5feb16d` | `vdsh-mcp-console@0.3.10` and npm `gitHead`: `ae8f625afc39453ad89db3faf8bcae587d1c21dc` | All 19 artifact files equal the research checkout; the entire package subtree has no Git diff between the tag and research commits. Do not mislabel the monorepo research commit as npm `gitHead`. |
| `@moon16u/dsh-restart` 0.4.4 | `e9c2aa153b4ac223eee187d730e4877ec5feb16d` | `vdsh-restart@0.4.4`: `6d53935f830b40bf290999ee3bf21e417dc38214`; npm `gitHead`: `67ae510858f91f4b1692d77f7a9c1ca3ca08ab6a` | All 13 artifact files equal the tag's bytes. Only 12/13 equal the research checkout: research adds `engines.node: >=20.0.0` to `package.json`. The tag-to-research subtree diff also changes `test/native-integration.test.mjs` (two fixture-line substitutions). The advertised npm `gitHead` could not be obtained from public GitHub (`upload-pack: not our ref` / `fatal: bad object`). **Its identity is unresolved; no claim that artifact equals that advertised commit.** |

Primary immutable sources: [subscriptions tree](https://github.com/V1ki/dsh-plugin-subscriptions/tree/9930c5ee5e3fa239db9031f47a0f6f30f7ffc443), [Skills tree](https://github.com/MichengAI/dsh-skills-manager/tree/b4d385b10ee49c6e09d244863a06c9d3a9b43a9d), [Pouch research tree](https://github.com/moon16u/dsh-pouch/tree/e9c2aa153b4ac223eee187d730e4877ec5feb16d), [MCP release tree](https://github.com/moon16u/dsh-pouch/tree/ae8f625afc39453ad89db3faf8bcae587d1c21dc/packages/dsh-mcp-console), [restart release tree](https://github.com/moon16u/dsh-pouch/tree/6d53935f830b40bf290999ee3bf21e417dc38214/packages/dsh-restart). Registry metadata links, exact tarball URLs and SHA-512 values are in the manifest.

### Downloaded artifact digests

All five SHA-1 values and SHA-512 SRI values **matched the fetched npm metadata**. SHA-256 was computed independently from downloaded archive bytes:

| Reference | SHA-1 | SHA-256 |
| --- | --- | --- |
| subscriptions 0.9.9 | `9d0902184c4886b5bfc37de07dc0e57cf0cf9147` | `3dc136bff0a5e42be6dcfd12afb3a2a87719cf4bd2c4a977bba0dc08e6bf9b6d` |
| Skills 1.2.11 | `437436c78ae4e89c612a9ea8811afb607bbdca7e` | `15095bab37aa1fc614047172405ebd15993976eda52c22c2153257f4f0e1c338` |
| hooks 2.1.0 | `20f18006e0ea863a5b0bd7a83823a5090d4665e8` | `00219bb3611fd4c4cdf212c294ee115e1d2021baf5c7f3fe9284bc1341c3c2ea` |
| MCP console 0.3.10 | `b25ad37effffb238ae1f507fc9b90a35c5795ca1` | `c9f121aa2ccf33a6cc30e9ab929e338970aceca653b5474c211bcbdad2389776` |
| restart 0.4.4 | `9e86af0e8e261b102f85ea889074ce3f7c53e554` | `73342e90a1c26f890eb39197f651e196211c334050837ddfb6ae26e8e67d574f` |

This verifies the research's subscription tarball SHA-1, **not the user's installed bytes**. No installed-byte comparison was needed or performed. Any later comparison must be separately scoped to public package/code/license files only, never operational auth, account, store or configuration files.

### Attestation: parsed claims are not cryptographic verification

npm advertises SLSA v1 envelopes for subscriptions, Skills, hooks and MCP console. Those public envelopes were downloaded and SHA-256-pinned. Their decoded statements name the corresponding tag commits above and subject SHA-512 digests equal the downloaded archives. The manifest records those **claims**, workflow paths and invocation URLs. Examples: [subscriptions envelope](https://registry.npmjs.org/-/npm/v1/attestations/dsh-plugin-subscriptions@0.9.9) names `.github/workflows/release.yml` and [run 37864709454](https://github.com/V1ki/dsh-plugin-subscriptions/actions/runs/37864709454/attempts/1); [Skills envelope](https://registry.npmjs.org/-/npm/v1/attestations/@michengai%2fdsh-skills-manager@1.2.11) names `.github/workflows/publish.yml` and [run 39629092178](https://github.com/MichengAI/dsh-skills-manager/actions/runs/39629092178/attempts/1).

No certificate chain, issuer/identity policy, transparency inclusion proof/checkpoint, registry signature, signed Git tag or attestation signature was cryptographically verified. Digest consistency with an unverified envelope does not authenticate its claims. Restart 0.4.4 metadata did not advertise an attestation endpoint; no absence-of-provenance claim beyond that metadata observation is made. Neither the unresolved restart `gitHead` nor missing package license files below should be silently “fixed” by changing the pin.

## Exact source and test references

The manifest is the complete per-file hash inventory. The following are entry points for later bounded slices, not passing test results:

| Reference | Source/contract examples (repository-relative) | Test/fixture examples | Inventory captured |
| --- | --- | --- | --- |
| subscriptions | `src/index.ts`, `src/auth/{rpc,store,oauth-flow,device-flow}.ts`, `src/providers/{accounts,pool,pool-health,pool-usage,replay,rate-limit}.ts`, `src/translate/*`, `src/tools/*`, `src/client/*` | `test/pool.spec.ts`, `test/account-replay.spec.ts`, `test/rate-limit.spec.ts`, `test/tool-registration.spec.ts`, `test/tools.spec.ts`, `test/rpc.spec.ts`, `test/store.spec.ts`, provider and translation tests | 155 tracked files, including 66 `src/` files and 56 `test/` files (49 `*.spec.ts`; other files are fixtures/helpers). |
| Skills | `src/core.ts`, `src/index.ts`, `src/api-base.ts`, `src/types.ts`; `scripts/hosts.mjs` | `test/core-test.mjs`, `test/disabled-external-native.test.mjs`, `test/readonly-discovery.test.mjs`, `test/project-sources.test.mjs`, `test/api-base.test.mjs` | 129 tracked files, including 25 `src/` and 38 `test/` files. No source or tests shipped in the npm archive. |
| hooks | `packages/dsh-hooks/lib/hooks/{config,adapters,engine,routes,runner,shell,store}.js`; `docs/command-hooks.md`, `SECURITY.md` within that package | `packages/dsh-hooks/test/{hooks,native,platforms,client,smoke}.test.mjs`, `browser-scroll.mjs`, `official-runtime.mjs` | 36 captured source/metadata files, including 8 `test/` files. |
| MCP console | `packages/dsh-mcp-console/lib/{clientAdapter,orchestrator,routes,store,atomicFile,handoff,yamlMigrator}.js` | `packages/dsh-mcp-console/test/{fence,lifecycle,probe,store,atomicFile,handoff,yamlMigrator}.test.mjs`; stdio fixtures | 42 captured source/metadata files, including 20 `test/` files (runner and fixtures included). |
| restart | `packages/dsh-restart/lib/{index,native-restart,native-worker}.js`, `scripts/*` | `packages/dsh-restart/test/{desktop-exclusion,native-restart,native-worker,packaging}.test.mjs` | 32 captured source/metadata files, including 13 `test/` files. Research-test hashes and release-tag artifact hashes are deliberately distinct. |

Source/test paths and SHA-256 values are pinned even when not shipped. **None of the upstream tests were executed**, because execution/import could load operationally capable code and is outside this read-only proof. There is no implied typecheck, fixture, local GUI or remote acceptance result here. Newly authored Majed implementation tests and selected ported oracle tests belong to their execution slices; copied tests remain licensed source, not license-free data.

### Pinned hooks schema and event contract

Primary source: [`packages/dsh-hooks/lib/hooks/config.js:5–120`](https://github.com/moon16u/dsh-pouch/blob/e9c2aa153b4ac223eee187d730e4877ec5feb16d/packages/dsh-hooks/lib/hooks/config.js#L5-L120); dispatch seams: [`adapters.js`](https://github.com/moon16u/dsh-pouch/blob/e9c2aa153b4ac223eee187d730e4877ec5feb16d/packages/dsh-hooks/lib/hooks/adapters.js). Both files and the upstream tests are individually SHA-256-pinned in the manifest.

The document permits `version`, `description`, `hooks`; groups permit `matcher`, `hooks`; handler fields are `id`, `type`, `command`, `shell`, `timeout`, `maxOutputBytes`, `contextBytes`, `async`, `enabled`, `subagents`, `onError`, `env`, `watchFiles`, `statusMessage`. Only `type: command` is supported. `shell` is `auto|bash|pwsh`; matchers are bounded glob alternatives (`*`, `?`, `|`), not arbitrary regex. Documents are capped at 256 KiB and 64 hooks; matchers at 256 characters and 16 alternatives. Unknown fields/events are rejected. Discovery adds canonical `cwd` and source identity rather than accepting a free-form handler `cwd` field. Later implementation must not silently invent an equivalent-looking schema.

| Event | Context output | Blocking allowed | Observe-only |
| --- | --- | --- | --- |
| SessionStart | yes | yes | no |
| UserPromptSubmit | yes | yes | no |
| PreToolUse | no | yes | no |
| PostToolUse | yes | yes | no |
| PermissionRequest | no | yes | no |
| Stop | yes | yes | no |
| PostCompact | yes | no | no |
| SessionEnd | no | no | yes |
| SubagentStart | no | no | yes |
| SubagentStop | no | no | yes |

The first seven events are the required T09/T10 reference contract; the remaining observe-only events need explicit parity disposition rather than an implicit promise. `onError: block` is invalid for async/nonblocking events. Default timeout is 30 seconds (3 for observe-only); accepted bounds are 1–600 seconds (1–10 observe-only). Default/max output is 65,536/1,048,576 bytes; default/max context is 16,384/262,144 bytes. Watch-file fingerprints, approvals and execution are distinct from declaration compatibility. Reading this schema neither imports reference approvals nor authorizes any command execution.

## Licenses and notice inspection

### Reference packages

- **Subscriptions:** MIT, copyright **2026 V1ki**, confirmed in the [pinned license](https://github.com/V1ki/dsh-plugin-subscriptions/blob/9930c5ee5e3fa239db9031f47a0f6f30f7ffc443/LICENSE), npm package license and matching artifact bytes. Keep its complete copyright/permission/warranty text with copied code/tests or substantial portions. No tracked `NOTICE` file or per-file copyright/SPDX match in inspected TypeScript was found; absence of those matches is not a clean-room authorship audit.
- **Skills:** Apache-2.0, confirmed from [package metadata](https://github.com/MichengAI/dsh-skills-manager/blob/b4d385b10ee49c6e09d244863a06c9d3a9b43a9d/package.json#L5) and the identical source/artifact [license](https://github.com/MichengAI/dsh-skills-manager/blob/b4d385b10ee49c6e09d244863a06c9d3a9b43a9d/LICENSE). The appendix leaves `Copyright [yyyy] [name of copyright owner]` unfilled; do not invent a completed copyright statement. No tracked or packaged `NOTICE` file was found. If source/tests are copied, include Apache-2.0, preserve existing attribution/patent/trademark notices, mark modified files and carry any subsequently discovered required notices. Project-level MIT does not relicense copied Apache source. No brand assets or navigation-icon vectors are copied; logo/trademark and `dsh-codex-ui` vector-origin permission remains unverified.
- **Pouch:** MIT, copyright **2026 moon16u**, confirmed by the [root license](https://github.com/moon16u/dsh-pouch/blob/e9c2aa153b4ac223eee187d730e4877ec5feb16d/LICENSE) and each package's `license: MIT` metadata. Hooks includes an identical package/artifact license. **MCP console and restart archives contain no `LICENSE` or `NOTICE` member**, and those package subdirectories have no license file; the repository-level MIT text is evidence, not a claim that npm shipped it. Any future copying must explicitly carry the root license rather than perpetuate the packaging omission. No runtime is redistributed here.

The two complete MIT reference notices are retained below. They are the only upstream text copied verbatim into this report. No modifications were made to upstream checkouts; all local work is original evidence documentation/manifest data. Any later code/test copy must record its source path/hash, destination, modification notice and license in the project's distribution notices before shipping.

### Bounded transitive runtime evidence

Exact non-peer runtime dependencies were identified from the pinned source package metadata and lockfile importer, then their public npm package metadata, tarball hashes and license/notice bytes were inspected without installation. These packages declare no additional non-peer `dependencies`, so this closes the **declared non-peer runtime dependency edge** for these selected versions, not the entire host/build ecosystem. All four tarballs matched their registry SHA-1 and SHA-512; the manifest records their SHA-256/SHA-512 and retained notice-file hashes.

| Parent / resolution | Dependency / license | Notices actually inspected |
| --- | --- | --- |
| subscriptions `undici: ^7.0.0`; pinned lock resolves `7.29.0` | [`undici@7.29.0`](https://registry.npmjs.org/undici/7.29.0), MIT | Root `LICENSE`: Matteo Collina and Undici contributors; nested `lib/web/fetch/LICENSE`: copyright 2020 Ethan Arrowood; `lib/web/websocket/receiver.js:21–23`: copyright 2011 Einar Otto Stangvik, 2013 Arnout Kazemier and contributors, 2016 Luigi Pinca and contributors. Preserve nested notices, not only package metadata. |
| Skills exact `fflate: 0.8.3` | [`fflate@0.8.3`](https://registry.npmjs.org/fflate/0.8.3), MIT | `LICENSE`: copyright 2026 Arjun Barrett. This resolves the earlier research's unverified fflate-license claim for these downloaded bytes. |
| MCP console `yaml: ^2.9.1`; pinned lock resolves `2.9.1` | [`yaml@2.9.1`](https://registry.npmjs.org/yaml/2.9.1), ISC | `LICENSE`: Copyright Eemeli Aro, with ISC permission/disclaimer. Do not relabel it MIT. |
| MCP console exact home-path dependency | [`@deepseek-ai/dsh-home-paths@0.2.1-rc.1`](https://registry.npmjs.org/@deepseek-ai%2fdsh-home-paths/0.2.1-rc.1), MIT | `LICENSE`: copyright 2026 DeepSeek. Has Cordis `~4.0.5` as peer, not another declared non-peer dependency. |

Hooks/restart declare no non-peer runtime dependencies. Host peer ranges, including Cordis/Schemastery, DSH services and React for Skills, are retained in the manifest but their full dependency/notice closure was **not fetched or audited**. Dev/build toolchains, all embedded third-party fragments, fonts/icons and user-profile resolution were not comprehensively audited. This is not a release SBOM, legal clearance or installation license audit. Before any later redistribution/build bundling, inspect the actual resolved dependency and bundled-content notice closure; semver ranges do not freeze future installations to this observation.

## Host compatibility and authority are separate gates

The research host baseline is DSH `0.2.1-rc.2`; this task did not inspect or run that host. Subscription development peers are pinned to `0.2.0-rc.2` and its published prerelease ranges do not explicitly enumerate `0.2.1-rc.2`. Skills enumerates `0.2.0-rc.1`, `0.2.0-rc.2`, `0.2.1-rc.1`, `0.2.1-rc.2`, and requires Node `^22.19.0 || >=24.0.0`. Hooks declares Node `>=22` and DSH `>=0.2.1-rc.2`; MCP research source declares Node `>=20.0.0` and DSH `>=0.2.1-rc.1`. Restart's published artifact omits `engines.node`, unlike research, and declares `unsupportedProfiles: [desktop]`; its runtime is Web-only. Those declarations are constraints/evidence, **not exact-host compatibility tests**.

Preserve public extension points and independently inactive modules. A source-pin report cannot validate native Owner admission, remote/prefix handling, model/effort metadata, retry-budget seams, child admission, SDK resolution or UI behavior. In particular, source references using raw `webServer`/origin gates do not establish native Owner authentication, and the standalone Skills apply/updater or MCP handoff machinery must not be imported as an integration shortcut. T02A–T02D and each feature slice retain their own exact-host/synthetic/live gates. No package/baseline wiring or operational activation was changed here.

**A reusable software license is not provider authorization.** MIT/Apache permission does not grant a subscription entitlement, account access, quota circumvention, permission to use private/consumer endpoints, or compliance with provider terms. No contractual/legal provider review or authorized live provider test occurred.

## Reproduce and review without executing reference code

Use the [update/diff process](../UPSTREAM_UPDATES.md) for a new candidate. For this fixed baseline:

1. Read the manifest and obtain each repository in a **new temporary directory**, not the project or an operational DSH home. Fetch with `git -c core.hooksPath=/dev/null clone --no-checkout <repository> <new-directory>` and check out the full `commit` detached; resolve `tag^{commit}` independently and compare to `tagCommit`. No hooks/submodules/package install/build/import/test are needed. For Pouch use the research commit for `sourceFiles` and independently inspect the different release tag commits; never collapse `registryGitHead`, `tagCommit` and `commit` into one claim.
2. Fetch only the exact public `artifact.url` and, optionally, `metadataURL`/advertised attestation URLs. Hash archive bytes with standard SHA implementations and compare SHA-1/SHA-256/SHA-512 and the Base64 SRI. HTTP success alone is not integrity proof. Never execute the tarball's package scripts. Validate every archive member before extraction: only relative paths under `package/`, no `..`, links/devices or unbounded member count/size. Alternatively read archive members as bytes without extracting.
3. Hash each source file relative to the clone root against `sourceFiles[].sha256`, and each artifact regular member relative to `package/` against `artifact.files[].sha256`. Include set equality, not only known-file hashes, so missing/new files are reviewed. Compare source and published files using `sourceRoot`, preserving explicit `artifactOnly`/different results. Read restart release-tag files with `git show <tagCommit>:packages/dsh-restart/<path>`; all 13 should match the artifact, while the unavailable npm `gitHead` remains unverified. No inferred reproducible-build claim is permitted for subscriptions' generated `lib/`.
4. Verify licenses/notices as content, not merely `license` metadata. Recheck actual dependency closure if copying/building. Record any new hash/source/notice mismatch, inspect before accepting an update, and never change pins automatically to make a check pass. Bound diagnostics to paths/counts/hashes; no state or secret values. Review a manifest diff together with parity changes and exact-host limitations before any separately approved activation.

A project checker was deliberately not added: the manifest is data, and this bounded acquisition/independent byte comparison needs no plugin execution, package-manager dependency or new runtime seam. Public metadata and attestation envelopes can evolve; their capture SHA-256 describes this observation, while immutable archive/file hashes are the reproduction target. A changed metadata-envelope hash alone is not a changed plugin-byte claim.

## Preserved MIT notice — subscriptions

Source: [V1ki LICENSE at pinned commit](https://github.com/V1ki/dsh-plugin-subscriptions/blob/9930c5ee5e3fa239db9031f47a0f6f30f7ffc443/LICENSE).

> MIT License
>
> Copyright (c) 2026 V1ki
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all
> copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE.

## Preserved MIT notice — Pouch

Source: [moon16u LICENSE at pinned research commit](https://github.com/moon16u/dsh-pouch/blob/e9c2aa153b4ac223eee187d730e4877ec5feb16d/LICENSE).

> MIT License
>
> Copyright (c) 2026 moon16u
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all
> copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE.
