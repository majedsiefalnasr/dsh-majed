# #138 partial candidate verification

## Scope and revision

Direct workspace-local continuation of `impl/138-unified-ui`, baseline `92072f805f44bd26a9addf2f13d7ce5caebf75b5`. Preserved all original uncommitted candidate changes. No nested delegation, network, installed/profile access, live provider operation, push, merge or closure. The renewed budget starts at zero unexpected failures; this slice consumed zero. A deliberate behavioral red is excluded.

## Completed slice

- Preserved the candidate API credential status corrections, DeepSeek Account fallback/editor exclusion, in-place API Add entry, focus return and safe visited drafts.
- `src/browser.ts` Section owns one top-level Settings disclosure containing the existing Proxy and usage-display components. The controls retain their existing persistence and dialogs; no new Pool editor or endpoint.
- `src/codex-card.ts` no longer imports or mounts ProxySettings. Authentication, usage, redemption and Manage code are unchanged.
- EN/AR Settings label and existing provenance/changelog updated.
- Actual assembled section regression asserts exactly one page Settings disclosure and exactly one Proxy instance inside it, while retaining all existing native directory assertions.

## Evidence

Workspace-local logs (synthetic only):

- `ui138-settings-red.log`: deliberate assembled regression fails `one page-level Settings disclosure`, `0 !== 1` before implementation.
- `ui138-build.log`: `npm run build` exit 0.
- `ui138-focused.log`: API and assembled browser tests 48/48, exit 0.
- `ui138-full.log`: `npm test` exit 0, Node 857/857; no failures, cancellations or skips.
- `ui138-checkbuild.log`: fresh build matches generated output, exit 0.
- `ui138-diffcheck.log`: whitespace check exit 0.
- `ui138-detector.json`: one finished-slice Impeccable detector invocation, exit 0, findings `[]`.

No rendered screenshots, geometry matrix or whole-page browser acceptance was performed. Detector success does not substitute for visual inspection. Existing React renderer warnings remain.

## Composition continuation (2026-11-01)

- Replaced the split with a single mixed list of configured subscription groups, login-less Zen and native API entries. Only configured group controllers and the selected inline authentication controller mount; no hidden legacy cards.
- Shared Add now has catalog/custom/subscription modes and provider-specific existing authentication. Add account preselects the same workflow. Account counts expand real existing account/quota/reset-credit content; Manage remains intact. No store, RPC or authentication algorithm added; native Models untouched.
- Authentication flow locks mode/provider changes while pending, waits for existing provider cancellation before closing, and refreshes configured groups after successful account-count change. Safe API drafts/key write-only/partial/conflict behaviors retained.
- Deliberate topology red: `ui138-topology-red.log`. Actual React shared-flow success/focus and pending/cancel regressions, plus assembled mixed-list/group expansion/unconfigured-controller absence/Add-account preselection coverage.
- Latest focused suite passes; full suite 859/859, build, check:build and diffcheck pass. `ui138-composition-detector.json`: final composition detector exit 0. Existing renderer deprecation warnings persist.
- Two diagnostic failures exposed stale split-topology fixture assumptions and Codex status nesting (`providers.codex`); corrected with assembled proof. A subsequent ambiguous select assertion was narrowed to its label. No investigation loop or unrelated repair.

## Missing gates and next work

Functional composition is implemented and controlled tests pass, but #138 acceptance is NOT complete. Still required: whole-section synthetic DOM fixture and EN/AR × light/dark × 360/768/1440 matrix with distinct auth/error/layout variants and honest screenshot-inspection records; additional assembled provider-specific success/cancellation race proof beyond the shared-flow tests. Existing provider tests preserve controllers but do not constitute complete end-to-end authentication proof.

After those changes: repeat focused/full/build/check:build/diffcheck and final whole-UI detector, independent Standards and Spec review, safe archive/byte-equality verification, and separately authorized consolidated Owner installation/live acceptance. No native Models changes, global Pool editor, credential readback or authentication algorithm changes are authorized. Package, independent review, installed and live acceptance remain unperformed.
