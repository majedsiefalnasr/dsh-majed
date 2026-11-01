# #136 API providers — candidate verification

## Contract and scope

Ticket: https://github.com/majedsiefalnasr/dsh-majed/issues/136, “Subscriptions: API providers part”, stories 69–76. Isolated branch `impl/136-api-providers`, baseline `527d5f5cfcf2b6404ee5babddd617096bab4f7f2`. Existing partial edits were preserved. Owner approved a twenty-minute narrow finishing extension after the prior two-failure cap. No nested agents, installed/profile operations, real remotes, provider traffic, merge, push, closure or #137 work. Independent Lead Standards/Spec review is next, not performed by this implementer.

Approved seam 2: actual React component against injected native-shaped fake settings/credentials/llm remotes; assembled browser registration/rendering also retained. Native source authority is the read-only extracted `0.2.1-rc.3` artifact documented in `src/PROVENANCE.md`. React documentation was fetched in the previous implementation round; this continuation does not introduce a new framework API.

## Implemented behavior and controlled proof

- Directory joins native configurable providers and registered-only routes; catalog entries are editable, while registered-only entries without an owning settings namespace stay visible/read-only. Snapshot/draft state is ephemeral; no Majed API-provider persistence or backend was introduced.
- Catalog add and custom OpenAI Chat (`openai-completions`), Responses and Anthropic endpoints; display name/base URL, model discovery and editable model JSON including reasoning efforts, context/output bounds and modalities. Duplicate/invalid model drafts are refused. Empty optional names/endpoints remove overrides to retain native fallback.
- Key metadata is obtained only through `credentials.describe`; fake remotes provide no stored-key read method. Set uses a password draft, unset is explicit, and neither action is implicit in profile deletion. Successful save clears the draft. Transport/provider error text is never rendered.
- Settings mutations send the namespace revision for edits and deletion; conflict retains local intent. Only changed fields are patched, preserving unrelated provider settings. Built-ins and deployment-owned profiles cannot be deleted; a user-added declared profile can.
- Settings commit precedes separate credential mutation. A failed key operation after settings success reports partial completion and retains key intent; retry does not replay settings. A settings conflict never attempts the key operation. Read-only credential metadata blocks key changes. No native cross-service transaction or atomicity is claimed.
- Native settings/credential/adapter invalidations reload the joined surface. Effects remove event listeners on unmount, and obsolete loads cannot update state. The browser section injects the public remote SDK contribution and falls back to a localized unavailable state when absent.
- EN/AR controlled tests exercise list/catalog add/key set/unset, all custom protocols, discovery/model editing, edit/delete conflicts, protected deletion, invalid drafts, unrelated-provider preservation and partial retry. Actual React assembled-browser proof exercises native injection; the previous placeholder assertion was corrected rather than removing the lifecycle test.

## Regression history and gate evidence

Previous attempt: actual-component 10/10 and build passed; full suite classifier166/166, Node830 pass/1 fail because the assembled fixture expected the removed “No API providers yet” placeholder. The earlier VM cross-realm assertion was corrected without changing production behavior. This continuation updates that expectation and adds real React native-directory rendering.

Deliberate new regression red: custom creation wrote an empty `displayName`, which native pi-ai rejects. The new assertion failed in both locales, then the source was corrected to omit empty optional fields and unset cleared overrides. This is planned red/green, not a diagnostic-budget failure. A rejected credential transport is also classified as partial when settings have already committed.

Continuation focused gate: 39/39 tests passed and build exit0. Final planned gates all exit0: `npm run build`; `npm test` (classifier166/166, reference TypeScript compile, Node834/834, zero failures/cancellations/skips); `npm run check:build` (fresh output matches); `git diff --check`. A protected-source comparison confirms no changes under `src/providers`, `src/auth` or `src/subscriptions.ts`. Existing react-test-renderer deprecation warnings remain. Documentation completion is followed by staged/range whitespace checks. Logs: `/tmp/majed136-extension-{red,focused,build,tests,check-build,diffcheck}.log`. No OAuth credential values or diffs were printed; existing OAuth/provider source is outside this patch.

## Residual gates — not live acceptance

Public SDK loadability, `remote.*` injection and principal/admission in the actual installed browser remain unverified. A harmless approved browser-admission check is a separate post-review action. Fake remotes do not establish installed parity, paired-remote access, actual discovery networking or provider inference. Model JSON validation intentionally delegates the owning namespace's full schema to native settings mutation; native validation errors become a generic localized failure rather than echoed provider diagnostics. Native saves and credential writes are not atomic; a key-only operation does not invent a settings revision transaction. In-flight transport cancellation is not claimed; unmount suppresses render updates and removes listeners, but cannot roll back a write already sent.

## Consolidated Owner checklist (after independent review and package verification)

One session only after separate installation approval; no installation or live action is requested by this candidate handoff. Keep installed-state permission separate from any account/provider/network operation. Never paste keys into the conversation, logs or screenshots.

1. Confirm the reviewed build, required public remote SDK availability/admission and Subscriptions component visibility. Preserve the existing fallback/reference arrangement; do not activate colliding subscription adapters together. Check English and Arabic usability, including error text and model editor direction.
2. With Owner-approved disposable provider settings, compare the directory with Settings > Models. Add a catalog provider and each custom protocol; edit display name/base URL/model metadata. Confirm each change appears on the native page without creating a Majed store. Actual Fetch models may contact the endpoint and needs explicit permission; no inference is required.
3. Owner enters a disposable key privately. Confirm presence, replace and unset without stored-value readback. Confirm an unrelated provider and existing subscription/OAuth defaults are unchanged. Do not expose existing credentials for this check.
4. Open an editor here, change the same namespace on Settings > Models, then Save here: expect a conflict with retained local draft rather than overwrite. Cancel/reopen, verify the external value appears; also verify a native-page edit refreshes the list here.
5. Delete only the disposable user-added profile; verify built-in/deployment providers have no delete action and shared credentials are not silently deleted. Clean up disposable credential references explicitly only with Owner authorization.
6. Record observed environment/revision and failures together. Installation/reload, actual discovery and paired-remote checks are distinct evidence. Ticket closure and push require Owner acceptance; visibility alone is insufficient.
