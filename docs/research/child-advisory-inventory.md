# T02D bounded evidence: child advisory model inventory

## Scope and public seam

This increment characterizes the installed native public discovery tool, not a production routing feature or an approved model pin. The fixture mounts the exported `dsh-tool-subagent` plugin and calls the actual `list_subagent_models` definition returned by the public tool registry. It never calls private discovery helpers.

Exact native source: `/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-tool-subagent/lib/index.js:145-196`. Provider-only discovery filters advertised models against the captured Session route policy at lines 154-159; exact provider/model discovery checks that policy and resolves model metadata independently at lines 161-165; lines 172-196 register the public definition. The description at line 175 explicitly calls catalog membership advisory.

The public adapter contract independently documents advisory listing and exact resolution at `/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-llm/lib/index.js:1713-1739`. The fixture supplies only a synthetic adapter through public registration, without changing these installed files.

## Fixture and assertions

`scripts/probe-child-parent-delivery.cjs` extends the existing parent-delivery fixture:

- The Session allows only `t02d-fixture/explicit`. The synthetic inventory omits that route and advertises `disallowed-decoy`, which is not allowed.
- The actual registered provider-only discovery returns `(no advertised models for t02d-fixture)`: neither the unlisted allowed route nor the disallowed advertised decoy appears. The adapter inventory is queried, but no exact metadata lookup or inference occurs.
- Exact discovery of `t02d-fixture/explicit` returns `t02d-fixture/explicit — explicit`, followed by `Reasoning efforts:` and `low (default) — Low`. The adapter receives that exact provider/model lookup, still without inference.
- The existing registered delegate then admits the same explicit route, clears the configured `high` effort on route change, and preserves the parent relation, depth, JSONL persistence, and version-3 native descriptor assertions. Exactly one synthetic stream runs, and cleanup pairs native start/end events.

The runner uses a generated temporary HOME and DSH_HOME, strips inherited credentials from the subprocess environment, and removes the temporary directory in `finally`. The probe denies fetch, HTTP(S), TCP, and TLS network entry points. No installed state, authentication, host patch, network call, or real inference is needed. This is offline exact-host evidence, not live feature acceptance.

## Reproduction and observed results

Host version observed: `0.2.1-rc.2`.

```sh
DSH_PROBE_NODE='/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness' \
DSH_PROBE_RUNTIME='/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh' \
node scripts/test-child-parent-delivery.mjs
```

Green result: exit 0; all fifteen existing host checks pass, the parent-delivery/descriptor and advisory discovery checks pass, lifecycle cleanup passes, `streams: 1`, and `networkAttempts: 0`. Temporary HOME/DSH_HOME removal is reported.

Red-before-green: with the new discovery assertions present but before implementing the synthetic adapter inventory, the run failed at `Public discovery must query adapter inventory` (actual `[]`, expected `['t02d-fixture']`). Adding only the synthetic `listModels` implementation made the run green.

Unchanged-assertion negative control:

```sh
DSH_PROBE_NODE='/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness' \
DSH_PROBE_RUNTIME='/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh' \
node scripts/test-child-parent-delivery.mjs --red-advertise-explicit
```

Expected result observed: exit 1 at `Public listing must omit unlisted explicit and filter the disallowed decoy`, with actual `t02d-fixture/explicit — Explicit` versus expected `(no advertised models for t02d-fixture)`. The flag changes only synthetic adapter inventory; assertions remain unchanged. All fifteen preceding checks still pass, and temporary HOME/DSH_HOME removal is reported. The runner change is restricted to accepting this additional flag; its isolation and cleanup semantics are unchanged.

The existing `--red-no-persistence` control was also rerun unchanged: expected exit 1 with `PERSISTENCE_UNAVAILABLE` and `continuable subagents require session persistence (load a dsh-session-persistence backend)`, after all fifteen preceding checks passed. Temporary HOME/DSH_HOME removal was reported.

## Still open

Positive independent-preset composition and actual permission-service enforcement remain open. Existing permission-capture characterization is not evidence that an actual permission service enforces the captured restriction. This increment does not close a ticket, enable production routing, prove completion notification or cold resume, claim an approved model pin, or satisfy whole #7 acceptance. Independent review and integration belong to the parent agent and merger.
