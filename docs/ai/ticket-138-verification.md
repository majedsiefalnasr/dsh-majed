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

## Missing gates and next work

This is NOT a completed #138 implementation. The Accounts/Providers split remains. Still required: actual mixed configured-provider list; one inline three-mode Add with supported subscription methods, pending/cancel/success/focus behavior; single-instance provider controller/presentation ownership and grouped expandable accounts/counts/quotas; Add-account reuse; assembled cancellation/success/grouping preservation regressions; full synthetic DOM fixture and EN/AR × light/dark × 360/768/1440 matrix with distinct auth/error/layout variants and honest screenshot-inspection records.

After those changes: repeat focused/full/build/check:build/diffcheck and final whole-UI detector, independent Standards and Spec review, safe archive/byte-equality verification, and separately authorized consolidated Owner installation/live acceptance. No native Models changes, global Pool editor, credential readback or authentication algorithm changes are authorized. Package, independent review, installed and live acceptance remain unperformed.
