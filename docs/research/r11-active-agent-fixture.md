# R11 actual-Agent fixture and scoped policy red

2026-10-26. Initial fixture repair from branch base `09ffbb4`, followed by the bounded active-Agent production overlay below. Cold standing-preset and warmed native slash acceptance remain incomplete.

## Verified active-Agent candidate

The initial `--require-active-policy` run reproduced the exact assertion below (exit 1), with 3/3 watchers and 2/2 listeners closed. Production now mounts the existing core policy provider through each exact Agent context. Feature-owned listeners are installed before enumeration, registrations deduplicate by object identity, every registration contributes its own invalidator, and disable/service disposal removes Agent fibers as well as the root provider. Startup failure rolls back. Core candidate source flags are unchanged.

Both native commands pass (exit 0): the scoped duplicate is disabled, the native tool executes with the actual Agent, and the actual SessionSkillCatalog lists that live Agent with policy filtering. Each green run closes 8/8 watchers, 2/2 listeners and every synthetic persistence handle. Full `npm test`: 497 passed, zero failed; classification 166/166. Controlled public-context lifecycle doubles separately cover pre-existing/new Agents, duplicate attach, reused ids, exact disposal, restart and partial registration rollback. They are not native isolated-preset proof.

The exact Agent-context registry is proved; a distinct registry selected by `agentPresets.serviceFor` is not. No standing preset is mutated and no claim is made for cold preset lookup, warmed slash refresh, browser layout, real provider inference, operational sessions or paired event-stream invalidation. The source-only pointers and disposable synthetic persistence/guard boundaries below remain unchanged.

## Distinct registry follow-up (2026-10-26)

The fixture now supplies an explicit public `agentPresets.serviceFor(agent, 'skills')` adapter returning a separately constructed native SkillRegistry in a public isolated context. It asserts this is not the Agent-context registry and warms the actual SessionSkillCatalog before the admitted disable. Before the production change, native `--require-active-policy` failed at `active-agent-scoped-policy`: `Actual live Agent native user catalog respects Manager policy`, `1 !== 0`; all 3/3 watchers closed. This was an actual catalog policy red, not the earlier missing-bundle/dependency setup failures.

Production retains the Agent-context overlay and adds the selected-registry overlay via public `owner.reflect.trace(selected)` in the same Agent-owned plugin fiber. Its separate provider name avoids duplicate registration if the selected implementation is the context registry. Every control contributes its exact invalidator and abort cleanup; the existing identity map, disposal, restart and startup rollback remain intact. Final native `--require-active-policy` exits 0 and closes 8/8 watchers and 2/2 listeners; source flag and model-tool proofs remain unchanged. Final `npm test` passes 498/498 tests and classification 166/166; `git diff --check` exits 0. Controlled lifecycle coverage additionally checks selected registration invalidation and exact Agent teardown.

This proves the distinct-registry selection seam using an explicit service adapter, not actual native preset composition/mounting, a provider turn, cold standing presets, or warmed native slash invalidation. No operational HOME, provider account or host implementation is modified. Existing reproduction pointers below are source-only, and every run uses the runner-owned temporary HOME. Context7 lookup was unavailable because the ordinary npm cache is not writable (`EPERM`); no cache ownership change or escalation was attempted. Public tracing semantics were inspected in the installed Cordis dependency and verified by the native fixture.

## Native same-Agent switch blocker (2026-10-26)

Candidate `1d077c8` remains unmerged and does not cover native preset changes. The new opt-in `node scripts/test-skills-product.mjs --require-native-preset-switch` uses the installed public Loader and AgentPresetRegistry, registers two genuine isolated compositions with separate native SkillRegistry instances and native filesystem providers, selects A on the actual blank Agent, disables the Skill through the existing Manager workflow, then selects B. It asserts unchanged Agent identity and changed selected registry before asking the actual current SessionSkillCatalog for disabled-policy enforcement. This is not the earlier serviceFor adapter: no serviceFor replacement or manufactured selection event is used.

The run exits 1 at `native-same-agent-preset-switch-policy`: `Same live Agent native A-to-B catalog must preserve disabled Manager policy`, `1 !== 0`. Cleanup closes 3/3 watchers. An initial invalid selectedDefault fixture configuration failed validation before composition; it was corrected by omitting the optional volatile field and is not policy evidence.

Read-only installed source establishes why an ordered asynchronous event reconciliation is not a truthful enforcement boundary:

- `dsh-agent-preset-registry/lib/index.js:654-665` rebinds the scope parent and changes the binding before awaiting old-generation collection. There is no public before-rebind hook or awaited observer here.
- `dsh-agent-preset-registry/lib/index.js:734-741` awaits mount and then synchronously emits `tools/change`, without awaiting listener promises. This path also exposes a newly bound registry before the notification.
- `dsh-agent-preset-registry/lib/index.js:750-768` serializes native selections per session, awaits recompose, then appends `agent-preset/selected`. It does not serialize plugin reconciliation or catalog reads.
- `dsh-agent-preset-registry/lib/index.js:458-460` forwards the logged selection from `session/event` through another synchronous emit, with `(session.id, event.data.agentPreset)` arguments. This is post-binding, not Agent publication.
- `cordis/lib/index.js:258-281` snapshots listeners in registration order and invokes them without waiting for returned promises. Prepending does not make an asynchronous Agent plugin mount an awaited barrier, and throwing does not roll back the native binding.
- `dsh-api-session-controller/lib/index.js:2377-2386` independently resolves the current live Agent's serviceFor registry and lists it; it joins no selection/reconciliation barrier.

Consequently no production patch is made: a selected-event/tools-change listener plus queued fiber teardown/mount could eventually converge but cannot establish policy before every admitted catalog observation, nor atomically roll back native selection on registration failure. Public tracing remains validated; it does not supply this missing lifecycle barrier. A host-supported awaited pre-publication/rebind boundary or catalog policy interception would be needed before claiming the requested enforcement, concurrency, rollback and disposal contract. No host patch, standing-preset mutation, private interception, manufactured event or operational/provider access is authorized or performed. R11 cold standing presets, warmed slash and operational live acceptance remain open. No fix candidate is committed because the native regression is red. The unchanged production suite still passes 498/498 tests and classification 166/166. The existing static `--require-active-policy` adapter fixture exits 0 with 8/8 watchers and 2/2 listeners closed; `git diff --check` passes. These green gates do not supersede the genuine native switch red.

## Reproduction

From this worktree, use the existing source-only dependency pointers:

```sh
export DSH_PROBE_NODE='/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness'
export DSH_PROBE_RUNTIME='/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh'
export DSH_MOUNTED_DEPS='/Users/majedsiefalnasr/Documents/Work/DeepSeek Harness/dsh-mounted-settings-deps/node_modules'
export DSH_PROBE_REMOTE='/Users/majedsiefalnasr/.dsh/profiles/desktop/node_modules/@linxin666/dsh-remote-web-ui/lib/types/remote-api.js'
node scripts/test-skills-product.mjs
node scripts/test-skills-product.mjs --require-active-policy
npm test
```

Positive fixture exits 0 on installed DSH `0.2.1-rc.3`, Electron Node `v24.21.0`. The active-policy command exits 1 at `active-agent-scoped-policy`:

```text
AssertionError: Actual Agent scoped duplicate must not bypass disabled Manager policy
true !== false
```

This is a policy assertion failure, not an Agent construction/setup error. Both runs complete independent teardown assertions; positive closes both listeners and all eight watchers, red closes both listeners and all three watchers. Synthetic persistence handles close in both paths. Full repository suite: 495 tests passed; classification 166/166 passed. `git diff --check` passes.

## Fixture repair and boundaries

The fixture mounts the installed public `AgentRegistry`, `SessionProjectionRegistry`, and `AgentLoop`, and invokes `agents.create` with a new synthetic session ID. The returned actual Agent resolves the real SkillRegistry through `agent.ctx.get('skills')`. A filesystem provider plugin is mounted through that Agent's scoped context, creating a nearer layer with the same Skill name. Its enabled snapshot is warmed before the admitted production Manager toggle. The new opt-in assertion requires the scoped snapshot to respect the disabled policy and demonstrably fails.

The persistence adapter now accepts `create(header, options)` for exactly `fixture-active-agent`, preserving the existing `open()` refusal (`No event reads or Agent resume permitted`). Only a detached in-memory header and contiguous synthetic events are retained. Each batch is bounded to 65536 bytes and the handle to 32 events. Reads are restricted to that created handle; no persisted operational log is opened. Append, flush, and close implement the public handle shape required by the native factory. No real HOME, DSH_HOME, profile data or accounts are loaded. The remote pointer names executable plugin source only, not profile configuration. Provider identifiers are explicit synthetic literals; the inert LLM adapter refuses provider access and inference. Existing network, DNS, process, listener, and watcher guards remain intact. The runner still creates and removes only its canonical disposable temporary HOME and has a 25-second deadline.

## Source contracts inspected

Read-only Electron ASAR filesystem access copied installed source into `/tmp/majed-r11-oracle` for inspection. No installed source was patched.

- `dsh-agent-loop/lib/index.js:1544-1551`: required services; `:1861-1869`: `sessionPersistence.create(session.header, { inheritedEventCount, signal? })`; `:1881-1885`: append constructor seed before publication; `:1893-1934`: public factory lifecycle and rollback.
- `dsh-session-persistence-jsonl/lib/index.js:28-145`: public handle fields and `read`, `append`, `flush`, `close` behavior used to shape the in-memory test adapter.
- `dsh-agent/lib/index.js:453-457`: public registry create delegates to the installed factory; `:491-589`: owned registration and truthful created/disposed events.
- `dsh-skill/lib/index.js:109-145`: nearer scoped layer wins duplicate name regardless of global rank; `registerProvider` belongs to its calling context's scope.
- `dsh-agent-preset-registry/lib/index.js:720-727`: `serviceFor(agent, name)` may resolve a distinct registry. Merely registering against the global registry or assuming `agent.ctx.get` matches the catalog-selected registry is insufficient.

## Original next-step record (superseded by verified candidate above)

The actual-Agent prerequisite and one genuine scoped public-registry red are now established. Production code remains unchanged. Next implement the same policy provider under exact Agent ownership, subscribing before enumeration, retaining exact provider disposers and invalidators, and rolling back partial registration. Resolve and verify the isolated preset registry plus its authorized scoped caller context before claiming that case. Extend proof through actual scoped model tool and SessionSkillCatalog, then disable/re-enable, disposal, replacement identity, rollback, source flags and restart. Do not infer those unrun cases from the root positive fixture. The current fixture uses an actual registry but still supplies query/working-directory/system-prompt/LLM adapters; it proves no provider turn or operational session resume.
