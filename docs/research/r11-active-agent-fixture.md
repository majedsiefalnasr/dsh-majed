# R11 actual-Agent fixture and scoped policy red

2026-10-26. Initial fixture repair from branch base `09ffbb4`, followed by the bounded active-Agent production overlay below. Cold standing-preset and warmed native slash acceptance remain incomplete.

## Verified active-Agent candidate

The initial `--require-active-policy` run reproduced the exact assertion below (exit 1), with 3/3 watchers and 2/2 listeners closed. Production now mounts the existing core policy provider through each exact Agent context. Feature-owned listeners are installed before enumeration, registrations deduplicate by object identity, every registration contributes its own invalidator, and disable/service disposal removes Agent fibers as well as the root provider. Startup failure rolls back. Core candidate source flags are unchanged.

Both native commands pass (exit 0): the scoped duplicate is disabled, the native tool executes with the actual Agent, and the actual SessionSkillCatalog lists that live Agent with policy filtering. Each green run closes 8/8 watchers, 2/2 listeners and every synthetic persistence handle. Full `npm test`: 497 passed, zero failed; classification 166/166. Controlled public-context lifecycle doubles separately cover pre-existing/new Agents, duplicate attach, reused ids, exact disposal, restart and partial registration rollback. They are not native isolated-preset proof.

The exact Agent-context registry is proved; a distinct registry selected by `agentPresets.serviceFor` is not. No standing preset is mutated and no claim is made for cold preset lookup, warmed slash refresh, browser layout, real provider inference, operational sessions or paired event-stream invalidation. The source-only pointers and disposable synthetic persistence/guard boundaries below remain unchanged.

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
