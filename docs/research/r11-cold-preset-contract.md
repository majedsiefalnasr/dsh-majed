# R11 cold standing-preset contract gate

2026-10-27. Bounded source characterization at plugin base `a6cc2812e0ebf24c10d5de59b48c532530dcb815`. No production implementation is proposed: the inspected public contract does not provide the requested cold distinct-registry selection and authorized standing-owner attachment path. This is not a failing live product experiment or a claim that every possible host composition is unsupported.

## Exact source contract

Read-only staged native source: `dsh-mounted-settings-deps/node_modules/@deepseek-ai/` (the source referenced by `r11-active-agent-fixture.md:46-50`). The staged Linux fixture independently contains the same relevant catalog selection at `dsh-api-session-controller/lib/index.js:2379`.

- `dsh-agent-preset-registry/lib/types/index.d.ts:108-110`: `serviceFor<K extends string & keyof Context>(agent: { ctx: Context; }, name: K): Context[K] | undefined`. `lib/index.js:725-727` resolves `this.generationFor(agent.ctx)?.mount`, then calls `serviceForMount(this.owner, mount, name)`. The selector needs an already-bound context, not merely a preset id.
- `dsh-agent-preset-registry/lib/index.js:136-144`: `serviceForMount` searches service implementations owned by that mount's fiber subtree and returns `impl.value`. Thus the selected registry can differ from root or Agent-context resolution. This lookup does not return a registration context or lifecycle owner.
- `dsh-agent-preset-registry/lib/types/index.d.ts:129-131`: `acquireScope(id?: string): Promise<{ key: ScopeKey; } & AsyncDisposable>`. Implementation `lib/index.js:775-786` returns only `key` plus idempotent async disposal. Disposal decrements the retained generation's user count and collects a retired zero-user generation. It does not expose the standing context, isolated service resolver or a registration capability.
- `dsh-agent-preset-registry/lib/index.js:495-515` creates the standing context internally, retaining scope/key/mount in private generations. `inspectCompositions` and `compositionInventory` are diagnostic/module metadata, not authorized registration contexts. `mount(ctx, id)` binds an unpublished Agent setup context; it is not an API for acquiring the standing owner's context.
- `dsh-api-session-controller/lib/types/skill-catalog.js:152-162`: `const scoped = live === undefined ? undefined : presets?.serviceFor(live, 'skills'); const skillRegistry = scoped ?? this.ctx.get('skills');` precedes `const lease = ... live === undefined ? await this.scopeFor(agentPreset) : undefined` and `const scope = live ?? lease?.key`. Cold reads therefore always select the host registry, even when the preset owns a distinct isolated registry. A lease contributes a read scope, not a different registry.
- `dsh-skill/lib/index.js:109-145,147-178`: registrations belong to the calling context's scope. The nearest layer wins duplicate names regardless of rank across layers. `registerProvider(create)` returns the exact Cordis effect disposer; factory control supplies a lifecycle abort signal and an identity-fenced `invalidate`. Disposal removes that exact provider and aborts its signal. Root registration cannot defeat a nearer duplicate by increasing rank.

## Why this slice stops

The existing `modules/skills/overlay.js:6-13,22-28,42-47` mounts the existing policy provider at root and each exact active Agent context, with registration-specific invalidators and feature-owned disposal. It cannot truthfully cover a standing isolated registry before any Agent exists simply by enumerating active Agents.

The cold catalog itself does not ask `serviceFor` for the standing registry. Even discovering and registering against a distinct service through an invented context would not change which registry that catalog selects. Returning an opaque `ScopeKey` does not confer the standing plugin's dependency/isolation context. Creating a new scope with that key would inherit the minting plugin's dependency API, not recover the retained preset owner's context (`dsh-scope/lib/types/index.d.ts:70-78`).

No fake Agent, `ctx` reassignment, private generation/store traversal in production, synthetic lifecycle emission, preset-definition mutation, host patch, warmed-slash workaround or second Manager was added. No red/green is claimed: there is no supported production path here against which to write the requested before-live-Agent policy regression honestly.

A future host-supported contract would need to expose cold registry selection and authorized registration ownership together with retained-generation lifecycle semantics, or explicitly guarantee a shared registry for this case. This document requests no infrastructure implementation and does not propose its API shape. Until that contract exists, only the already verified shared-registry/active-Agent evidence applies.

## Verification and boundaries

All target execution used existing `node:24.15.0` offline Docker with no network, read-only root/source/dependencies, dropped capabilities, no-new-privileges, uid/gid 65534, bounded scratch tmpfs, 128 PIDs, 2 GiB memory and 2 CPUs. No custom seccomp, downloads or host Node execution.

The first full-suite invocation mounted dependency closure at `/deps`; Node's realpath ancestor resolution could not find sibling packages. It exited 1 (434 passed, 13 module-load failures; classification 166/166). This was a fixture mount mistake, not a product regression. The corrected invocation mounts the unchanged staged closure at `/node_modules`, an actual ancestor of package files, and runs from a disposable scratch copy. Corrected `npm test` exited 0: 519 tests passed, zero failed, skipped or cancelled; classification 166/166 passed. Existing Skills overlay identity/cleanup and startup-rollback cases passed. This is baseline regression verification, not cold distinct-registry red/green.

No browser, native Agent activation, real HOME/profile/account reads, installed-state changes, inference, tracker writes, push or merge were performed. Native browser permission remains a separate operational gate; it is not the cause of this source-contract stop. R11 remains open for cold/distinct registry composition, warmed slash invalidation, paired event delivery and local/remote acceptance. Independent lead review follows this direct review.

## Direct review

Standards: reviewed the documentation-only diff against the base, repository AGENTS rules, glossary and public-API/no-host-patch constraints. English project content, narrow scope and explicit evidence boundaries are retained; no actionable finding. No code complexity or new abstraction was introduced.

Spec: reviewed against live issues #51 and #2 and the bounded task. The unsupported-contract stop branch is satisfied with exact source evidence rather than speculative implementation. Before-live-Agent duplicate policy red/green is explicitly not achieved; broader R11 acceptance remains open. No actionable scope-creep finding. This is direct review only: nested delegation was prohibited, so it is not the skill's independent parallel review.
