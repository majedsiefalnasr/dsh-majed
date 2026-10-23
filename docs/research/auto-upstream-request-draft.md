# UNPUBLISHED DRAFT — public pre-provider/native-selection capability for Auto

**Status:** local English capability-request draft only. The Owner authorized preparation, **not posting**. Nothing in this document authorizes a GitHub issue/comment, runtime activation, installation, operational cutover or service consumption.

**Suggested upstream title:** Supported awaited per-step selection before prompt providers, coherent with native Session selection

## Request

Does DSH expose a supported public contract, available in installed **DSH `0.2.1-rc.2`**, for an asynchronous, request-aware model-selection transaction **before every proposed step's prompt contributors evaluate**, while retaining native Session-controller ownership and manual-selection precedence?

If such a contract exists, could you identify its public entry point, supported version and ordering/ownership guarantees, preferably with a synthetic example? If it does not, please consider a public capability with the semantics below. We are asking for clarification or a supported capability, **not a prescribed host patch, private interception technique or guarantee that our proposed API shape must be adopted**.

## Use case and required distinction

A plugin wants to expose an Auto identity through the native model catalog/picker. The Owner's selection remains Auto, while each admitted execution uses an eligible concrete provider/model/effort selected from a captured routing-policy generation. The concrete route must be known before model-sensitive variable, section, tool-schema and context providers run—not only substituted into their eventual interpolation output.

The native manual picker must remain authoritative. A completed native manual selection bypasses Auto on the next applicable step; old asynchronous Auto work must never replace that newer intent or reselect Auto. An already accepted step may retain its captured route, as native selection already does, provided every contributor and request surface agrees and the acceptance/concurrency boundary is documented. Auto intent and the concrete route should be distinguishable in native projection, notices and request/assistant attribution without competing selection holders or saving each concrete route as a new default.

This preserves the local [T02B acceptance scope](<../managers-tickets-draft.md#L82-L92>); it is not a proposal to restrict coherence to specially cooperating contributors.

## What we found, and the limits of that finding

The [finite installed-source audit](<auto-pre-provider-seam.md>) found **no qualifying supported combined contract in the surveyed call path**. This is not a universal impossibility claim about JavaScript, all distribution packages, unpublished extension agreements, future DSH releases or an upstream contract we have not located. Advertised declarations were unavailable to the audit; executable JavaScript and inline contract comments were used instead.

The relevant installed package source locations below are relative to `/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/`. These are local installed-build anchors, not claims about an independently pinned upstream commit:

- [`dsh-agent-loop/lib/index.js:902–927`](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-agent-loop/lib/index.js#L902-L927>): `preStep` claims input, awaits prompt assembly, then dispatches the awaited `agent/pre-step` waterfall. No awaited selection dispatch appears between input claim and assembly in this method.
- [`dsh-system-prompt/lib/index.js:356–405`](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-system-prompt/lib/index.js#L356-L405>): variables, tool schemas, section text and context text are evaluated **before** the awaited `system-prompt/assemble` waterfall. `prepend: true` orders listeners inside that event; it does not move the event ahead of providers. Late variable replacement cannot retroactively change contributor text or schemas.
- [`dsh-agent/lib/index.js:148–210`](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-agent/lib/index.js#L148-L210>): public `installModelSelection` captures a caller-owned selection in assembly middleware and uses it for request routing and notices. Its capture is before delegation **within the waterfall**, not before contributor evaluation. This useful public helper alone does not supply the missing earlier transaction or sharing of the native controller's holder.
- [`dsh-api-session-controller/lib/index.js:788–820`](</Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-api-session-controller/lib/index.js#L788-L820>): public native `selectModel` validates selection, updates native intent and requests background default persistence. It is not a demonstrated transient concrete-route override. Persistence can be a no-op without a mounted editor; the finding is a persistence request, not an assertion that it always writes a profile.

The [ownership audit](<auto-pre-provider-seam.md#L80-L102>) also traces the native holder, durable `model/selection` projection and exact header matching. Reaching through `sessionController.agents.selectionFor(...)` is mechanically possible in ordinary JavaScript but is not established as a supported public extension contract; a second independent `installModelSelection` holder is not proof of native coexistence. A late concrete redirect must not simply be assumed to consume pending Auto intent correctly.

The [lifecycle audit](<auto-pre-provider-seam.md#L44-L78>) explains why creation/setup is not a per-step boundary and inbox/status/session notifications are not awaited admission gates. The fixture below demonstrates the inbox limitation for a claimed-input step. It does **not** provide fresh runtime coverage of every lifecycle alternative, tool-driven continuation, retry or resume.

## Reproduction with existing isolated fixtures

These commands are supplied for a separately authorized local reproduction from the repository root. **They were not executed while preparing this draft.** They import the installed runtime only inside the existing isolated fixture runner; they are not instructions to boot the app, install a plugin or call a provider.

```sh
DSH_PROBE_NODE='/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness' \
DSH_PROBE_RUNTIME='/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh' \
npm run test:host-auto
```

The runner uses a generated temporary HOME/DSH_HOME, a minimal child environment, a 30-second timeout per probe and verified temporary-root cleanup. The host fixture rejects fetch, HTTP(S), TCP and TLS network entry points; adapters and service state are synthetic/in-memory. It mounts no operational persistence, credential, attachment, account or configuration-editor service. See the existing [runner](<../../scripts/test-auto-seams.mjs#L9-L35>), [network guards](<../../scripts/probe-auto-host.cjs#L14-L25>) and [final isolation assertions](<../../scripts/probe-auto-host.cjs#L488-L501>). No real image bytes are read. This is not an OS-level sandbox/security certification.

To reproduce the explicit unmet ordering requirement, use the **same environment** with the named requirement flag:

```sh
DSH_PROBE_NODE='/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness' \
DSH_PROBE_RUNTIME='/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh' \
npm run test:host-auto -- --require-pre-provider
```

On the documented installed build this command is expected to exit nonzero with:

```text
required pre-provider assembly boundary is unavailable
```

That assertion intentionally asks a prepended assembly listener to precede the variable callback; the actual service evaluates all four provider categories first. A deferred `agent/inbox/claimed` listener remains pending while the native request completes, and is explicitly released/drained during cleanup. See the [ordering fixture](<../../scripts/probe-auto-host.cjs#L416-L486>). The failure characterizes the missing guarantee; it is neither a production feature nor a passing acceptance test. Missing runner configuration also fails explicitly rather than becoming a passing skip.

Optional assertion-sensitivity controls use the same environment and existing runner:

```sh
DSH_PROBE_NODE='/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness' \
DSH_PROBE_RUNTIME='/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh' \
npm run test:host-auto -- --red-control

DSH_PROBE_NODE='/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness' \
DSH_PROBE_RUNTIME='/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh' \
npm run test:host-auto -- --red-concrete-route
```

Both are expected to fail: the first deliberately removes fixture generation capture; the second bypasses concrete request routing and fails `native request must dispatch the concrete target`. They show sensitive assertions, not completed production TDD.

## Evidence we can honestly offer

The prior [native seam evidence record](<auto-native-seams.md#L24-L82>) reports **client 5/5 and host 14/14 checks passed**, with zero attempted host network calls, on DSH `0.2.1-rc.2` / installed Electron Node `24.21.0`. These are previously recorded results, not new executions or live-feature verification by this draft.

- The actual unmodified native picker bundle lists/selects a synthetic Auto catalog identity and generates its own composer row. Its React/store/service boundaries are fixtures; the component function is evaluated, not mounted in a browser or real reconciler. No end-to-end client RPC/native-controller proof follows.
- Real in-memory Cordis/LLM/Agent/Session/SystemPrompt/ToolRuntime/AgentLoop services establish useful metadata, captured preparation and dispatch behavior with synthetic adapters. Conservative capability intersections are fixture policy, not a host eligibility API. Unknown metadata, empty intersections and the lack of a generic tools-supported flag do not establish compatibility.
- Scoped assembly/request wrappers can align late interpolation, effort, context, request header and settled assistant attribution to `t02b-concrete/alpha` across a concurrent policy/manual change. However, an already evaluated section still says `Provider read before waterfall: auto`. The [fixture](<../../scripts/probe-auto-host.cjs#L335-L414>) uses a caller-owned selection holder, **not the real native Session-controller owner**. It demonstrates why late coherence is insufficient, not a production routing solution.

The source audit additionally shows that request-error retry stays inside the attempt loop and does not repeat full assembly; runtime-context refresh is not full contributor reevaluation. Those are [source findings](<auto-pre-provider-seam.md#L104-L110>), not freshly executed retry/resume tests. T02B remains open. Request-aware image/tools eligibility, context/output budgeting, native-owner coexistence, mounted picker/RPC acceptance, retry/revocation/resume safety and production operation are not claimed complete.

## Requested public contract, if one is needed

These are semantic requirements for discussion, **not invented APIs claimed to exist**:

1. **Awaited admission before every contributor.** Give a supported Agent-scoped, cancellable selection boundary for each proposed step, including input-free/tool-driven continuations. Supply enough authoritative input/history/requirements context to choose an eligible route without triggering or duplicating prompt providers. No variable, section, tool-schema or context provider should observe a half-resolved selection. Rejected/empty proposals must not dispatch or spuriously consume intent.
2. **One accepted execution snapshot and native ownership.** Bind concrete provider/model/effort, exact capability evidence and routing-policy generation to the step before contributor evaluation. Make that same accepted route visible through supported contributor context, prompt interpolation, preparation/context budgeting, request header, dispatch and assistant attribution. Define native pending/last-used intent, notices and projection semantics separately from concrete execution, without private holder access, duplicate competing helpers or default mutation.
3. **Explicit concurrency and manual precedence.** Document when a proposal is accepted and how native manual selection is serialized with asynchronous route choice. A stale/aborted decision cannot overwrite newer native intent. Once accepted, an in-flight step remains coherent; the newer manual choice applies at its documented next boundary, bypasses Auto, and clears inherited effort/context where appropriate. Define policy replacement, candidate revocation and adapter replacement handling without mixing generations.
4. **Defined retry, resume and effect lifecycle.** Specify whether a retry retains the accepted route or starts a new full selection/contributor transaction through public APIs. A different route must not silently reuse incompatible text/tools/metadata. Preserve finite attempt limits and cancellation; never automatically replay partial reasoning/text/tool output. Define resume reconstruction, disposal and unregister behavior, with no leaked callbacks or stale pending decisions.
5. **Fail-closed validation, not service probing.** Reject unsupported explicit effort, unknown/incompatible image or tool support and insufficient context/output budgets before dispatch. Do not silently delete images, degrade history or treat unknown as compatible. Eligibility evidence must not require real-provider calls, operational credentials or quota consumption for the compatibility fixture.

## Expected safety and acceptance tests

A positive proof should use the actual installed native SessionController and only supported public operations with synthetic dependencies—not an internal holder lookup or a stub replacing native ownership. Expected coverage includes:

- Trace global/scoped variable, tool, section and context providers and prove **all** see the accepted route after an intentionally suspended asynchronous choice; assert header/dispatch/assistant identity and effort agree. Repeat on first, continuing and input-free/tool-driven steps; include veto/empty proposals.
- Complete a public native manual selection while Auto resolution is suspended. Verify stale completion cannot overwrite it, the accepted step stays coherent under the documented rule, the next applicable step bypasses Auto, and native pending/last-used projection, notices and effort clearing are correct. Mount only a synthetic default-save sink to detect unintended persistence; no operational settings editor.
- Exercise policy/adapter replacement, revocation, abort/disposal, retry with and without retry middleware, resume and partial-output boundaries. Include unknown/empty metadata, tools/images, explicit effort and budget failures. Negative controls must fail at the relevant ordering/coherence assertion, not pass by skipping.
- Keep generated isolated storage, minimal environment, bounded execution/cleanup and network-attempt counters. Mount no real provider/account/credential/attachment/configuration service; perform no live inference, service consumption, global-default write or operational-state mutation. Separate mounted-client/RPC acceptance from function-level picker checks.

We do not request monkeypatching `assemble` or loop methods, manually rebuilding/rerendering internal prompt state, intercepting private collaborators, or changing the installed host to force a green test. If the capability is unavailable, the full Auto path can remain deferred pending an Owner decision; these findings do not waive its coherence gate.

## Draft provenance and publication boundary

Prepared from repository [instructions](<../../AGENTS.md>), [T02B local draft](<../managers-tickets-draft.md#L82-L92>), [local publication/status record](<../managers-tickets-published.md#L78-L85>), [native seam report](<auto-native-seams.md>), [pre-provider audit](<auto-pre-provider-seam.md>), existing fixture source and targeted read-only installed-source checks. No remote issue was fetched or changed. No runtime was imported, no fixture/provider command was executed and no service was consumed during preparation. No credentials, profiles, defaults, installed plugins or operational state were accessed or changed. Only this draft was created; the Owner must separately approve any eventual upstream publication.
