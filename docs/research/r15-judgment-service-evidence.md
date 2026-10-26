# R15 separate judgment service

2026-10-26. Ticket [#54](https://github.com/majedsiefalnasr/dsh-majed/issues/54). Production implementation with controlled fixture evidence; no live inference or existing credentials were used.

The production entry mounts `majed/judgment/manage` through native exact Fetch Owner admission. The Routing Settings section retains readiness and adds separate judgment controls. Status exposes protocol and configured booleans, never saved addresses/models/credentials. Credential editing has explicit keep/replace/remove operations; the password field clears after saving. A fixed connection test requires fresh disclosure consent and never includes conversation content. Saving and testing leave Smart disabled. Existing Jev tools and private state are untouched.

`modules/judgment/service.js` provides the shared independent bounded Choice contract through `majedJudgment`, without requiring main Smart, child routing or advisory consumers to activate one another. It sends one request per invocation, validates the transmitted closed choice set and model identity, preserves requested versus actual model and available documented usage/cost fields, and invents no confidence or explanation. Consumer-specific caps/circuit breakers and seven-day Shadow retention remain later Smart/advisory obligations; this ticket does not activate those consumers.

The implementation reuses the existing address validation/normalization helpers. Native System One roots receive `/v1/systemone` once; Decisions retains its full endpoint. HTTPS is required; userinfo, query credentials, fragments and redirects are refused. The transport has a three-second maximum deadline, a 64 KiB streamed-response bound, caller cancellation and an independent abort race for uncooperative transports. Rejected/oversized response streams are cancelled. Replacement/removal of settings invalidates an outstanding response. Disposal prevents a request from starting after asynchronous configuration lookup.

State lives only in `DSH_HOME/majed/judgment.json` (fallback `~/.dsh/majed/judgment.json`). Trusted composition overrides supply a temporary path/controlled transport for tests. Writers serialize in-process, stage an exclusive random mode-0600 file, sync, compare the observed state and atomically rename. Reads reject corrupt/unknown schemas, symlink files, excessive size and overly permissive POSIX file modes. Corrupt state is not silently replaced. This is private file protection, not encryption or protection against the same OS user.

## Protocol sources

The old `judgment-fixture.test.js` literal-only checks described a chat-shaped example and were removed in favor of the production service tests. The new client uses the actual named `state`/`questions` Choice and typed `answers` contracts from primary sources retrieved on 2026-10-25:

- [TypeSafe System One schema](https://docs.typesafe.ai/api/system-one.md), SHA256 `5e6261f6f6212c6cf75fd55cc2856184b355a6400673b18314e85505e6219820`.
- [OpenRouter Decisions schema](https://openrouter.ai/docs/api/api-reference/alphadecisions/submit-a-decisions-request.md), SHA256 `d2b2131e324d6165fa7412a424e166a2cf14c90af285df2af8ddcb32fad3f7d6`.

These identify the inspected documentation bytes, not a live service/version guarantee. No upstream implementation code or new dependency was copied.

## Verification

`node --test test/accepted/judgment-service.test.js test/accepted/judgment-ui.test.js` exercises protected temporary persistence/restart, native production registration/RPC envelopes, explicit consent, protocol/model/usage handling, deadline, non-string and caller-mutated Choice rejection, stale credential removal, no send after disposal, strict RPC identifier validation, explicit credential removal and owned response-stream cleanup. English and Arabic UI fixtures verify direction, per-test consent and empty credential fields. New defects were reproduced red before their corresponding fixes; these portable hook/slot fixtures are not native admission or browser geometry proof.

With the existing source/executable pointers:

```sh
npm test
node scripts/test-settings-product.mjs --judgment
```

The native product proof passes on installed DSH `0.2.1-rc.3` / Electron Node `v24.21.0`. It mounts the production host entry, actual installed native Settings/renderer/browser RPC and React 18 into jsdom. Actual native BrowserAuth and the installed paired proxy carry requests across two owned ephemeral HTTP listeners. The complete workflow configures a credential, tests System One, tears down/remounts the service, reloads protected state, tests Decisions remotely, rejects missing local authentication and missing pairing, removes/replaces the credential, and tests Arabic RTL. Only fixed test content reaches the controlled transport. Both listeners close.

The dependency versions and bundle hashes are printed by the runner. Presentation primitives, locale adapter, synthetic pairing/signing state and temporary HOME/DSH_HOME remain explicit fixtures. This proves the exercised native algorithms and workflow, not browser CSS/focus/theme/viewport behavior, installed desktop restart, real paired-device persistence or real judgment availability/quality. No operational state, provider consumption, reference replacement, deployment or release was performed.
