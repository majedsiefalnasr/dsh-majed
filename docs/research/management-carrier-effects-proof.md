# Bounded T02A physical carrier service-effects join

This temporary proof extends physical carrier base `bbc33da`. It is **pending parent acceptance audit**, not production Manager CRUD, T03 acceptance or automatic T02A closure. Only the new probe, runner and this report are owned here. The shared MCP fixture is unchanged.

## Pre-agreed seams

The requested public seams are mounted installed Settings/renderer, native browser `installConnection` RPC, two real host `WebServer` listeners, installed remote `makeRemoteApiRoutes` and its real loopback proxy, native BrowserAuth, repository `resolveManagementScope`, native `SkillRegistry` plus `dsh-skill-filesystem`, and official `dsh-mcp-client` plus actual `ToolRuntime`. No host/core patch, provider or inference is involved.

The physical carrier structure is copied into a separate bounded proof, as requested. The mounted fixture section supplies an actual select control and button. Changing the DOM select chooses the action sent in the native RPC payload; clicking the button sends the unmodified native envelope through real bounded HTTP. Local document base is the inner origin; remote base is the outer origin's `/remote/`. Explicit cookie attachment, jsdom presentation/locale/session adapters and synthetic credential/pairing/persistence/KV fixtures retain the physical proof's limitations. This remains an exactFetch correlated RPC fixture, not native genericFetch/host generic RPC dispatch or evidence of production remote boot-prefix installation.

## Actual effects

Disposable project roots include `.git` and `.dsh/skills`. Explicit disposable `dshHome` and `agentsHome` prevent operational skill discovery. The actual filesystem provider watches these roots. A complete warm native catalog is required before each mutation. The local action writes frontmatter disabling model and user invocation, waits for a native `skills/change` and refreshed complete catalog, then renders the native policy helper results as `Skill model=false user=false`. The remote action restores both flags and renders `Skill model=true user=true`. No manual catalog invalidation or synthetic filesystem event is injected.

Each local/remote MCP action mounts the official client via `ctx.plugin`, with the existing shared stdio fixture as the only permitted executable argument. Actual `ToolRuntime.execute` calls the registered echo tool. The handler awaits plugin disposal, verifies tool absence and awaits every owned child close **before** returning `MCP fixture hello; tool absent; children closed` to mounted DOM. The prompt sink alone is synthetic. Two lifecycles allow at most four children because official protocol negotiation can launch a probe and a transport per lifecycle.

## Admission and safety

Before any effect action, missing local signed cookie, missing/revoked outer pairing, invalid inner cookie and wrong workspace membership are clicked through mounted UI. Filesystem-effect count, MCP-effect count and child count remain zero. Missing/revoked pairing also leaves auth/proxy/delivery/scope/operation counters unchanged. The wrong membership request reaches the real scope resolver but not effects. Setup's initial skill seed is not counted as an admitted mutation. Exact suffix, disposed endpoint and disposed remote route additionally return 404 without new endpoint operations.

The physical network/listener guards remain: literal owned loopback ports only, two `127.0.0.1:0` listeners, no TLS/DNS/UDP/global fetch/WebSocket or alternate execution methods. Spawn is narrowed to an active admitted MCP effect, exact `process.execPath`, exact shared fixture plus optional red-only flag, temporary HOME/cwd and allowlisted environment keys with fixed required values; no ambient secrets or alternate commands. Electron's injected macOS locale metadata is removed before loading installed code. Direct forbidden network/spawn attempts execute before service setup.

HTTP bounds are 16 KiB request, 64 KiB response, 3-second socket and 5-second absolute deadlines. Watch convergence is bounded to 1.5 seconds. Each action uses the request signal combined with a 2-second deadline: startup abort initiates and awaits owned fiber disposal, and actual ToolRuntime execution receives that signal. Underlying startup/call/disposal are awaited rather than abandoned Promise.races. Disposal has a 1-second owned-child kill fallback. Active effect tasks are tracked and drained before any global cleanup. Remaining fiber cleanup has a 6-second check, with runner timeout 45 seconds and 1 MiB output cap. Shared fixture retains its independent 15-second orphan deadline. Finally cleanup independently attempts UI unmount, client/context disposal, DOM close, every host fiber and both hosts. Any remaining owned child is killed and awaited. Instrumented native `fs.watch` close events and listener close events must all be observed. A post-cleanup JSON record is emitted even for red controls; successful completion JSON is emitted only after cleanup assertions.

## Observed evidence

Installed DSH `0.2.1-rc.2`, Electron Node `v24.21.0`: green exits zero with four effects, two skill writes, two MCP lifecycles, four real remote proxy requests, four owned children created/closed, three native watchers created/closed, two real HTTP listeners created/closed, and zero cleanup errors. Click statuses are `[401,403,403,401,404,200,200,200,200]`. Native bundle/host/remote route/proxy hashes are included in successful JSON.

Tracer red initially failed `MODULE_NOT_FOUND` before implementation. `--red-result` passes only the existing fixture's supported corruption argument; unchanged DOM expectation fails on `MCP corrupted fixture value; tool absent; children closed`. Its post-cleanup record shows two children, three watchers and two listeners all closed. `--red-watch` disables actual native provider watching, leaving DOM expectation unchanged: the warmed catalog does not produce a native invalidation, server effect fails `Native watcher must invalidate warm catalog`, and DOM becomes `Operation failed` instead of the fixed policy result. Post-cleanup shows no children/watchers and both listeners closed. Both controls exit one without a completed report.

The first red-watch experiment used a 4-second convergence bound, longer than HTTP's 3-second socket deadline, allowing a handler to outlive UI failure. Reducing convergence to 1.5 seconds makes the actual watcher assertion settle before transport timeout and cleanup; that earlier experiment is not claimed as final evidence.

## Reproduction and limits

Set the same four environment pointers as the physical proof: `DSH_PROBE_NODE` (installed Electron executable), `DSH_PROBE_RUNTIME` (bundled dsh directory), `DSH_PROBE_REMOTE` (installed remote plugin `lib/types/remote-api.js`) and `DSH_MOUNTED_DEPS` (existing mounted test dependency directory). Run `node scripts/test-management-carrier-effects.mjs`; separately append `--red-result` and `--red-watch` and require nonzero exit with clean post-cleanup records. Missing pointers fail, never skip.

`npm test` was attempted in the fresh worktree: classification passed 166/166, but the full command initially failed because local `@deepseek-ai/cordis` was absent for baseline host tests. This is a dependency setup failure, not a passing full-suite claim. Parent integration baseline validation is separate from this opt-in proof.

This bounded join is synthetic/disposable and not production document CRUD or canonical write safety. It adds no operational stores, secrets, native browser/TLS evidence, trusted Command Approval provenance, outer-disconnect cancellation coverage or release acceptance. Parent owns independent review, shared ledger changes and any closing decision.
