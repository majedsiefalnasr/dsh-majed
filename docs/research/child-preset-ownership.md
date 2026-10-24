# T02D: positive native child preset/composition ownership

## Status and scope

On 2026-10-24, the exact installed DSH `0.2.1-rc.2` runtime (embedded Node
`24.21.0`) passed this bounded positive proof: an explicitly requested native
child preset supplies its actual persona composition while caller-selected child
model/effort, native depth and native lifecycle remain authoritative.
**T02D / #7 remains open.** This does not prove actual permission-service
execution, cold resume, every composition plugin, or enabled production routing.
The executing delegation's model/effort were not pinned by this agent.

Only the [probe](<../../scripts/probe-child-preset.cjs>),
[runner](<../../scripts/test-child-preset.mjs>) and this report are new owned files.
No plugin runtime or installed configuration changes; no changelog entry because
this is opt-in characterization, not a user-visible runtime feature.

## Actual public seam

The agreed seam is actual native registry composition plus native spawn admission,
not a replacement preset service or private manager interception. The fixture mounts
public native Cordis, LLM, SystemPrompt, SessionProjection, Session, Agent, Tools,
AgentLoop, Loader, AgentPresetRegistry, AgentPreset, SubagentRuntime and local spawn
exports. `dsh-agent-preset` registers two distinct definitions through the actual
registry; both load the native `dsh-persona` public `apply` using the actual Loader.
A parent's public creation `setup` awaits registry `mount`, without returning its
identity object as a creation transaction (the AgentLoop expects an optional
`commit()`-bearing transaction, not `{ id }`).

The parent joins `parent-preset` with `Parent composition`; native spawn receives
`agentPreset: 'child-preset'` alongside explicit synthetic provider/model/low effort.
The requested preset contains `Requested child composition`. Public
`systemPrompt.assemble({ scope: scopeOf(agent.ctx), agent })` observes actual scoped
persona text; `composedPreset`, `inspectCompositions` and the child header corroborate
identity, the active persona module, and absence of leaked preset services.
Assertions are not based merely on copying the request or descriptor.

Exact installed-build source anchors:

- [Registry dependencies and registration](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-agent-preset-registry/lib/index.js#L440-L493>),
  [public inspection](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-agent-preset-registry/lib/index.js#L555-L565>)
  and [mount/composition identity](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-agent-preset-registry/lib/index.js#L681-L719>).
- [Declarative preset registration](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-agent-preset/lib/index.js#L7-L26>)
  and [native persona apply](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-persona/lib/index.js#L29-L47>).
- [Native requested versus inherited composition](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-subagent/lib/types/child-agent.js#L140-L151>)
  and [spawn admission route/composition separation](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-subagent/lib/types/manager.js#L316-L400>).

## Isolation and limits

The only boundary double is working-directory resolution (not authorization),
and the only inference adapter is synthetic, with synthetic reasoning metadata
and a held finish-only stream. No accounts, credentials, persistence or real
provider plugins are mounted. Fetch, HTTP(S), TCP and TLS tripwires precede host
imports. The runner passes a minimal environment, fresh generated temporary HOME,
DSH_HOME, TMPDIR and working directory; output, subprocess time and probe settlement
are bounded. Cleanup verifies the generated absolute directory before removal.
These are fixture safeguards, not an OS sandbox certification.

Composition tested is one real persona plugin, not a universal tools/service
composition matrix. Explicit route and effort are observed on the live native child;
this is direct service admission, not registered model-facing tool policy preflight.
Caller delivery intentionally needs no persistence. No preset restoration from stored
events or later parent revision mutation is claimed. Existing broader evidence and
remaining gates remain in [child routing seams](<child-routing-seams.md>) and
[parent-delivery evidence](<child-parent-delivery.md>); T26 stays gated.

## Reproduction and validation

```sh
DSH_PROBE_NODE='/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness' \
DSH_PROBE_RUNTIME='/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh' \
node scripts/test-child-preset.mjs
```

Observed **3/3 checks pass**, **one synthetic stream**, **zero attempted network
calls**, exit zero, temporary HOME/DSH_HOME removed:

1. Requested preset's assembled persona and native identity survive explicit child
   model `explicit` / effort `low`; parent persona/identity remain unchanged.
2. A descendant at the native depth limit rejects with `SubagentDepthError`, without
   another stream or child lifecycle event.
3. Native completion removes the child before receipt settlement, pairs start/end
   run IDs and leaves the parent's persona intact.

The retained negative control appends `--red-inherit-preset`. It changes **fixture
request input only** (`agentPreset` becomes `undefined`); assertions are identical.
Red was observed before green: actual `Parent composition` versus expected
`Requested child composition`, exit one, temporary HOME removed. This demonstrates
sensitivity to native composition selection, not a production host bug or patch.
Initial fixture wiring also exposed the optional creation-transaction return
contract and missing synthetic reasoning metadata; neither was represented as a
qualifying red control. `node --check` passes for both scripts; `git diff --check`
passes. Existing inventory checks are deliberately not rerun by this separate runner.

## Exact-source SHA-256

Paths below are beneath the installed runtime's `node_modules/@deepseek-ai/`:

| Source | SHA-256 |
| --- | --- |
| `cordis-plugin-loader/lib/index.js` | `638b9ad360e01236120772323f80a65570c4f3f42f4cfc6243330241025b6d72` |
| `dsh-agent-preset-registry/lib/index.js` | `95edcc66175a87091ba90fe0809246821df470bf960e1cfd725b5ca6baaf4f07` |
| `dsh-agent-preset/lib/index.js` | `23cd2dd62ac3b27522a2d377e14b5a93f80c2189e733937dcdd02b73a6d3d1da` |
| `dsh-persona/lib/index.js` | `1e9dd7f0dfd87cbff6486b7ca043d2e1b863a2a56b99106a4bf74831591266d5` |
| `dsh-subagent/lib/types/manager.js` | `3f7dd4199579b2555acf59482d84dc567cf69ad32271435996fd370a2d1ecdba` |
| `dsh-subagent/lib/types/child-agent.js` | `6fa8e9926e0c7802376b79e4ef6a7ef5afc9f33f8e72e6757e63666f9467cbb4` |
