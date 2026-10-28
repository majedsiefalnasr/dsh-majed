# Historical test-setup preservation

Owner-approved final cleanup, 2026-10-28. These four reviewed nonprivate documents are byte-identical historical copies, not supported launch instructions for current use. Referenced obsolete checkout paths are intentionally retained as historical text; those paths are removed. Do not execute the launch example without a separate operational approval and fresh validation.

[Manifest](manifest.json) records each historical source path and SHA-256 for [startup handoff](startup-handoff.md), [launch example](launch-isolated.sh.txt), [isolated overlay](isolated.patch.yml.txt) and [typography overlay](typography-browser.patch.yml.txt). Runtime credentials, session histories, cached projections, private logs and generated dependency/build artifacts are excluded from preservation and publication.

Useful remaining work was already preserved exactly on remotely verified branches:

- `checkpoint/20261027-historical-browser-reports` at `6d5084dbca76e1e963067ae819ba0cb60d1078cf`: both untracked browser preflight/worker research reports. Each local report was compared byte-for-byte with its checkpoint blob.
- `checkpoint/20261027-r11-native-switch-red-wip` at `d3689192a632567ba29bb073177360bb3689d2f6`: all four local modified R11 files (CHANGELOG, research, probe and test runner) matched checkpoint blobs byte-for-byte. This is explicitly failing-regression WIP, not a fix or accepted feature. No merge occurred.
- Original checkout tips `fd4e0f135048d0b6acb959aeb96f7ced587a9622`, `1d077c83c122a65d2d332318a1927064161e0c32`, `6c587d0e31a7ae4c6c76c50401418ca73d429dee` and `c2192fc51d9fa78727fd5db7da42d8fcb25ce5f0` were exact-matched to the respective remote proof/R11/scope/typography branches.

Discard disposition: `.scope-source-inspection.txt` is a 147,273-byte installed source extraction, not an authored analysis; its inspected opening identifies native session persistence code. It and `.native-static-review`, extracted `.startup-review` vendor modules/manifests and `.diagnosis` vendor assets are reproducible reference copies, not project WIP. Retain no extra vendor-source mirror here. Generated caches/builds and isolated test profiles are obsolete. Private contents were neither inspected nor copied; test-profile deletion does not revoke any hypothetical remote token. Installed state is outside the cleanup scope.

Preservation does not change earlier unavailable browser acceptance or the known native preset-switch failure. No host, provider call, product test, feature implementation or installed configuration change is part of this task.
