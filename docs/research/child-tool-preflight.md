# T02D: bounded native tool policy and preflight evidence

## Status

Partial characterization on 2026-10-24; **T02D / #7 remains open**. This increment
closes one fixture gap: execution of the actual exported native model-facing
delegation definition through actual Tools registration, rather than only direct
SubagentRuntime service calls. It does not establish successful tool-originated
child admission, enabled production routing, universal interception, or live
acceptance. The delegation tool used to run this investigation does not pin this
subagent's model or reasoning effort.

## Public seam and fixture

The approved seam is native `apply(ctx, config, session)` through its exported
`inject` requirements, `ctx.tools.get('t02d_delegate')`, then the registered
definition's `execute(args, exec)`. The Tools service and native tool module are
unchanged installed-host exports. This is definition execution, not the complete
agent-loop tool dispatch/validation pipeline. No private host method, service
replacement interceptor, host patch, operational account, or installed setting is
used.

The existing [probe](<../../scripts/probe-child-host.cjs>) now mounts a synthetic
`subagentModelSelection` service and supplies synthetic model metadata through the
already registered `LlmAdapter`. The actual LLM runtime still owns effort
validation. The synthetic settings service returns enabled exact routes for one
fresh in-memory Session; after registration it changes to disabled/empty. The
Session's captured policy remains authoritative. This proves capture in this
fixture, not actual settings persistence, disabled-definition composition, child
policy inheritance, cold resume, or inventory behavior.

The existing twelve checks remain. The added three checks establish:

- Actual registration exposes provider and reasoning-effort parameters and records
  one Session policy event. Denied routes and incomplete provider/model pairs
  reject without adapter metadata lookup, stream entry, or lifecycle admission.
- Configured defaults specify model `configured` and effort `high`. Explicit model
  `explicit` advertises only `low`. Explicit `high` rejects with
  `UNSUPPORTED_REASONING_EFFORT`; the same changed route with omitted effort passes
  metadata validation and reaches native `PERSISTENCE_UNAVAILABLE`. Retaining
  configured `high` would fail before that boundary. This proves route-change
  effort clearing and explicit effort validation, not successful child options or
  a dispatch-time effort binding.
- While asynchronous metadata lookup is held, the caller aborts. The synthetic
  adapter intentionally returns normally after release, so the observed rejection
  `Synthetic tool preflight abort` exercises the native tool's post-preflight
  abort check. No additional child lifecycle or synthetic stream appears.

## Exact unsupported fixture boundary

The native tool sends `delivery: 'parent'`; the unchanged local continuable runtime
requires session persistence for that delivery. This fixture has no persistence
backend, so valid preflight reaches `PERSISTENCE_UNAVAILABLE` with message
`continuable subagents require session persistence (load a dsh-session-persistence backend)`.
The earlier caller-delivery service checks can admit children without it. We did
not add a persistence service, change delivery, replace the provider, or intercept
admission to manufacture successful tool execution. This is a precise limit of
this bounded fixture, not a claim that the host cannot support native tool starts.

Exact installed source anchors:

- [Native apply and exported inject](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-tool-subagent/lib/index.js#L303-L309>)
- [Merge, allowance, metadata preflight, abort and parent delivery](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-tool-subagent/lib/index.js#L442-L481>)
- [Session policy capture](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-tool-subagent/lib/index.js#L538-L560>)
- [Actual LLM effort validation](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-llm/lib/index.js#L2174-L2200>)

## Reproduction and results

Use the unchanged [runner](<../../scripts/test-child-seams.mjs>):

```sh
DSH_PROBE_NODE='/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness' \
DSH_PROBE_RUNTIME='/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh' \
npm run test:host-child
```

Observed DSH `0.2.1-rc.2`: **15/15 checks pass, zero network attempts**. Temporary
HOME/DSH_HOME, minimal environment, fetch/HTTP(S)/TCP/TLS tripwires, output limits
and watchdog remain unchanged. No real inference runs; only two original synthetic
service streams run. Registration of the discovery tool is incidental; no
inventory execution claim is made.

TDD sensitivity: adding the registration assertion first failed after the original
twelve passes with `Actual exported native tool must be registered`. The fixture
then used public native registration. Two fixture corrections were needed:
Cordis requires the exported service injection list; normalized tool parameters
are JSON Schema `properties`, not raw parameter maps. A subsequent real admission
attempt exposed the persistence boundary above, so success claims were narrowed
instead of expanding the fixture. The retained `--red-drop-route` negative control
must still fail at the original explicit-versus-parent assertion; it is a
sensitivity control, not a production change.

The original [seam report](<child-routing-seams.md>) remains the baseline context.
All other acceptance gates remain open, including successful native tool delivery,
preset/composition restoration, actual permission-service enforcement, persisted
resume, provider replacement races, descendant disposal, and concrete external
adapter qualification. T26 remains gated. No shared ledger or changelog is changed
by this characterization-only increment.
