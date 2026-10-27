# Bounded R14 review candidate

This is a dormant source candidate, not completion of R14. `implement-spec` is unavailable in the supplied skill catalog; that did not block the owner-confirmed seam.

## Scope and evidence

- Production `applyCommandApproval` saves/reviews/approves the exact private definition. A read-only authority in the same module rechecks generation, Approval, watched bytes, canonical cwd and scope against the store revision.
- `createBoundedSessionStart` accepts a synthetic SessionStart and uses actual staged native `dsh-subprocess-local`; subprocess is not replaced by a fake. The Approval Fetch registration is a fixture adapter, not authenticated native transport proof. Native lifecycle producers are not claimed.
- Tracer red: offline Node 24.15.0 returned `ERR_MODULE_NOT_FOUND` for the absent bounded module. Green: native marker execution, revocation and watched-byte mutation during native executable resolution reject before launch, store removal rejects, cwd symlink retarget rejects, concurrent dispatch is rejected while one dispatch is pending, default activation and six other events remain inert. Mutations use the actual approval route or disposable filesystem, not a throwing authority stub.
- All target execution occurred inside cached `node:24.15.0` Docker with network none, read-only root/source/native/dependencies, cap-drop ALL, no-new-privileges, PID/memory/CPU limits, disposable scratch/tmp and env-i. No host HOME, Docker socket, operational commands or definitions were mounted.
- Build and accepted suite pass: 519 tests, zero failures. Initial suite run failed dependency resolution because a symlink-only dependency mount omitted cosmokit/testing-library closure; rerun copied dereferenced staged dependencies into scratch and supplied native cosmokit, all read-only on the host. `git diff --check` passes.

## Review constraints and residuals

No production entry import/mount, Settings activation, native tool-guard, history or other-event behavior is added. Native guard path is UNPROVED. Source excludes file scripts, alternate shells, explicit environment restoration and matcher semantics (skipped, not silently executed). Output is collected with finite bounds and discarded, never interpreted as permission or tool authority. One slot per engine rejects concurrency; there is no queue/replay/dedup system. Timeout is capped at 30 seconds, stdout/stderr at 64 KiB each; native cleanup is awaited, with cleanup failure thrown. Native fallback process containment can be weaker than managed OS scope; escaped descendants are not proven contained. Timeout/output/cancellation and project scope need further independent seam proof before activation. External mutation in the remaining filesystem check-to-spawn interval is not an atomic OS transaction; do not claim that concurrent filesystem writers are locked out. Multiple engine instances are not globally serialized.

Only the smallest read-only authority idea from dormant d78b0c9 was reused; runner, adapters, history, advanced schema and vendor sources were not blindly merged. Existing fingerprints/schema and production consent disclosure remain unchanged. Original main, installed state, tracker and remote branches were untouched.
