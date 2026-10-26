# Command hook execution sources

Pouch Hooks is the source of the required event semantics, bounded native runner,
shell wrappers, strict output parser and matcher. Selected immutable source:
`moon16u/dsh-pouch@e9c2aa153b4ac223eee187d730e4877ec5feb16d`,
`packages/dsh-hooks/lib/hooks/{adapters,engine,runner,shell,config}.js` (MIT).
The license is retained in `vendor/pouch/LICENSE`.

Original SHA-256 values:

| File | SHA-256 |
| --- | --- |
| adapters.js | f0673792e7f70afa23cd8ae27e87c59fac6a516fbd5dea3d509992d83f0d5b3f |
| engine.js | b6718d4ea4e85b647a7687c58534c5d72bc24799aaf20090838d29b4b73ee3e1 |
| runner.js | 9d5c2dfc6704052431b76928f1147b963a678c6a8cca2b05476005bdf97b52ac |
| shell.js | adf32c96dba3411be0aff56e7c5ea186e35fdd971d57f0295c8f17088f73c979 |
| config.js | 5453c7f638be9c96948cab91878fc950a687f01eb3b86ecc64ffcc26f743e764 |

Adaptations use R13's private Majed definitions and exact-content Approval rather
than Pouch discovery, profile config, trust declarations or shared stores.
Only the seven first-release execution events are retained; SessionEnd/subagent
observations remain D06. Agent disposal only cleans process-local adapter state.
The runner receives a second authority check immediately before spawn; a rejected
Approval skips execution and cannot preserve an old fail-closed policy.
Selected config matcher/event declarations are extracted as `protocol.js`.

`execution.js` adapts the source engine's four-slot/64-waiter scheduling and
result composition, replacing reference discovery/trust/state with R13's native
scope and read-only private Approval authority. Its dedup cache does not evict
in-flight events. `history.js` is Majed code and persists metadata only, omitting
raw task data, arguments, outputs, errors, decision text, paths and session IDs.
Adapters construct the public immutable native user-message shape without a
second DSH package dependency; deferred subscriptions are removed and pending
compaction events are capped at 64. The shell wrapper retains reference behavior.

This is a dormant execution candidate. Production `index.js` does not import or
mount it. Only SessionStart has actual native event-to-subprocess proof at this
milestone. The other six adapters remain unverified source candidates, and no
admitted local/paired Settings execution flow is claimed.

PeterBon comparison source:
`PeterBon/dsh-hooks@8ec74bada643cf5e23ed377c43bc01e4ce5c12da` (MIT),
`src/index.ts` SHA-256
`69755ea77f6d8aa7d4807d8f497994249ccc0fb128ff8fed1f6dd7b787e5aaf1`,
`src/runner.ts` SHA-256
`c764c9d8cd17f26d6907bd67f08c5b7d1582e1ef863bc323a0c351f4ae5e99fc`.
Its bounded capture, concurrency and cancellation techniques are comparison
inputs; fire-and-forget run/notify and retries do not supply awaited blocking
authority and are not copied as event semantics. No PeterBon source is bundled.

Retained/adapted SHA-256 at this milestone:

| Local file | SHA-256 |
| --- | --- |
| vendor/pouch/LICENSE | 6cabb6e4498c72c7b1bf2ff3984c894fe12ff1df4370260e949a417ee226dade |
| vendor/pouch/adapters.js | c56ed4507f7932b9a6a705e8e602d3b8b968d7ff835c748557e40df7c3035968 |
| vendor/pouch/protocol.js | cb7329c5c376a1147788a914aaed2fee2a93f0be508f8cd8f03475d412116224 |
| vendor/pouch/runner.js | 50801aea7d461439f9adfc2d4d4f1957b3d4fc47f0614d1fe6a14243317dc9d7 |
| vendor/pouch/shell.js | 96bc02e95e222b0404fa9be3c9d72b8bac33fe9bbddf4e1cf6b019bb3377582c |
| execution.js | f2ed5c72fc64697915e3742046d2f6844a63ade59b24581c7be5a7560c9e0f6c |
| history.js | b3bee4a2b04447253de8bf31bd42b0a2f2dac1a69eb849983192fc19259d5cb8 |
