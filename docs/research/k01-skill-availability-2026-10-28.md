# K01 (#51) scoped Skill availability vs native consumers

2026-10-28. Branch `impl/k01-skill-availability`, base `9b72d4c`. Installed host DSH `0.2.1-rc.3` (read-only source inspection through `ELECTRON_RUN_AS_NODE=1`; nothing under `~/.dsh` or the app was modified). Evidence layer: controlled fixtures only. No real browser, installed-host UI or paired-device acceptance was run; mobile testing is deferred to the Owner.

**Outcome: ticket #51 stays PARTIAL/open.** No production code changed. The warmed-slash clause is blocked by a missing public native seam (decision gate below); the remaining reachable clauses were already satisfied, and this slice adds three labelled characterization tests.

## Gap analysis

Paths below are repo-relative unless prefixed `rc3:` (= `/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/`).

| Clause | Class | Evidence (file:line) |
| --- | --- | --- |
| (a) Cold-load availability after create/enable | SATISFIED | Actual Agent + native tool load the created Skill: `scripts/probe-skills-product.cjs:419-427` (`host.skills.snapshot`, `host.tools.execute` skill call isError=false). Handler emits on create/enable: `modules/skills/native.js:142-191`; overlay provider registered per context: `modules/skills/overlay.js:7-14`; cold-process policy reload: `test/accepted/helpers/skills-basic-fixture.mjs:35-41` run by `test/accepted/skills-package.test.js:34`. |
| (b) Warmed slash after create/disable/trash/restore | BLOCKED-BY-MISSING-PUBLIC-SEAM | Probe asserts the stale menu: `scripts/probe-skills-product.cjs:444`; re-run at base: `node scripts/test-skills-product.mjs --require-slash-refresh` exit 1 (`1 !== 0`, "warmed native slash source ignores catalog invalidation"). Server side is fresh: `SessionSkillCatalog.list` returns the filtered catalog (`rc3:dsh-api-session-controller/lib/index.js:2379-2393`, probe line 443 = 0 after disable). The stale layer is the browser slash source cache: `rc3:dsh-client-ui-skill/lib/client.js:367,376-407` (per-session `fetches`), whose only invalidators `invalidate`/`clearAll` (408-417) are private closures reachable solely from `ctx.remote.$on("agent-preset/selected")` (482), `$on("plugin-manager/changed")` (483) and `ctx.on("connection/reset")` (484). |
| (c) Same-Agent preset change reflects model/slash availability | PARTIAL | Exact Agent-context registry proved: `--require-active-policy` exit 0 (`scripts/probe-skills-product.cjs:432-438`); overlay attach/detach by exact Agent identity `modules/skills/overlay.js:21-47`, `test/accepted/skills-overlay.test.js:35`. NOT proved: a distinct preset-isolated `skills` registry (`rc3:dsh-api-session-controller/lib/index.js:2379` prefers `agentPresets.serviceFor(live,"skills")` over `ctx.get("skills")`; `rc3:dsh-agent-preset-registry/lib/index.js:136-145,725-728`) and cold standing presets (`scripts/probe-skills-product.cjs:536` limitation). `select` only works on a blank session and appends `agent-preset/selected` (`rc3:dsh-agent-preset-registry/lib/index.js:750-762`); that is the sole event that refreshes the slash cache and it is session-log state, so emitting it for a Skill change would be fabrication. |
| (d) Paired / second-client updates | BLOCKED-BY-MISSING-PUBLIC-SEAM | `rc3:dsh-api-remotes/lib/index.js:21-139` forwards `commands/change` (56) but not `skills/change` (emitted only inside the registry, `rc3:dsh-skill/lib/index.js:376-412`). `commands/change` is consumed by the commands UI only (`rc3:dsh-client-ui-commands/lib/client.js:1435`); the Skill slash source does not subscribe. Probe slash adapters are same-process (`scripts/probe-skills-product.cjs:530-538`), so no paired event stream is proved. |
| (e) Source denials / native precedence win; fallback exposure and name-wide exclusion explicit | SATISFIED (controlled) | Manager enable never grants a source denial: `test/accepted/skills-native.test.js:176`, probe `scripts/probe-skills-product.cjs:471-479`; project copy precedence and fallback to user copy: probe `:465-468`. Core marks `fallbackTo`/`shadowedBy` (`modules/skills/vendor/lib/core.js:2884-2895`) and emits one denied overlay candidate when every copy is denied (`:2751-2800`). NEW characterization: `test/accepted/skills-availability.test.js:33`. Not verified: how the vendored client bundle renders `fallbackTo`. |
| (f) Unicode bytes/names preserved; separate invocation diagnostics | SATISFIED for management / UNSUPPORTED for native invocation | Management preserves bytes and `diagnostic.name.invalid`: `test/accepted/helpers/skills-basic-fixture.mjs:74-98`, `test/accepted/skills-native.test.js:343`. NEW characterization: `test/accepted/skills-availability.test.js:62` (no overlay candidate, source bytes untouched). Native grammar is ASCII kebab-case (`rc3:dsh-skill/lib/index.js:25`; slash reference regex `/(?<!\S)\/([\w-]+)(?!\S)/gu`, `rc3:dsh-client-ui-skill/lib/client.js:292`), so native Unicode invocation is not provided and not simulated. |
| (g) Disable affects future loads only, never retained context/effects | SATISFIED (controlled) | Probe: model call denied after disable `scripts/probe-skills-product.cjs:441-447`. NEW characterization: `test/accepted/skills-availability.test.js:81` (future overlay load denied, previously returned content object unchanged, source bytes unchanged). Retained session context is native state this plugin never rewrites; the fixture does not exercise a live session transcript. |

## Decision gate G4 (open): warmed-slash invalidation

Missing public contract: no supported, documented rc.3 API lets a plugin invalidate or refresh the browser Skill slash cache. Observed: `skills/change` is host-internal and unforwarded; `commands/change` (forwarded) is ignored by the slash source; the only listeners are `agent-preset/selected`, `plugin-manager/changed`, `connection/reset`, none of which this plugin may truthfully emit. Options for the Owner: (1) accept stale slash until the user reloads/reselects (current behaviour, documented); (2) request or wait for a first-party seam (e.g. forwarding `skills/change` and subscribing in `dsh-client-ui-skill`); (3) authorise emitting `plugin-manager/changed`, which would misreport another subsystem and is NOT recommended. Not implemented: `modules/skills/service.js:64-70` keeps its comment that no preset/plugin-lifecycle event is manufactured.

Remaining unproved (no seam attempted within the 20-minute budget): preset-isolated registry via `agentPresets.serviceFor`; second-client event delivery; Unicode native invocation.

## RED / GREEN record

| Step | Command | Exit | Result |
| --- | --- | --- | --- |
| RED (blocked, expected) | `node scripts/test-skills-product.mjs --require-slash-refresh` (after `npm run build`) | 1 | `Known gap: warmed native slash source ignores catalog invalidation  1 !== 0`; no fix reachable, so it stays RED by design |
| Baseline | `node scripts/test-skills-product.mjs` / `--require-active-policy` | 0 / 0 | watchers closed 3/3 and 8/8 |
| Characterization | `node --test test/accepted/skills-availability.test.js` | 0 | 3/3 pass. Not a RED-first slice: the behaviour already existed. One earlier failure was my own wrong assertion (`setSkillEnabled` returns no `ok:true`), corrected before commit |
| Targeted | `node --test test/accepted/skills-{availability,native,overlay,service,package}.test.js` | 0 | 38 tests, 38 pass |
| Full | `npm test` | 0 | 626 pass, 0 fail (baseline 623 + 3 new) |
| Classifier | `node test/classify.test.cjs` | 0 | 166/166 |
| Hygiene | `git diff --check` | 0 | clean |

Limits: the characterization tests call the vendored core directly (same functions the overlay provider calls); they are not native registry, Agent, slash or paired evidence.
