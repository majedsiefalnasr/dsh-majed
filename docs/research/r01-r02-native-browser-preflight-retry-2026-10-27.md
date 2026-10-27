# R01/R02 native browser acceptance retry — 2026-10-27

## Outcome

Browser acceptance remains unavailable, not passed. After loading the browser-skill and verify-and-stop instructions, the first connectivity preflight used the injected `bsk_session` tool with `action: start` and `url: about:blank`. It returned exactly:

> Error: the bsk CLI ("bsk") was not found. BrowserSkill must be installed and on PATH for browser tools to work — install it from https://github.com/Tencent/BrowserSkill (see the README install script or `cargo install`), then retry.

This is a tool-side executable availability failure. It does not establish whether the browser extension is connected. No session ID was returned. No alternate browser backend, installation, PATH change, or unsupported recovery was attempted.

## Repository identity and preservation

The main checkout HEAD was verified as `3148417c3fbd81e48870bf0c6f51833cd2dbee1c`, matching the previously reported evidence commit. Its existing tracked and untracked changes were left untouched. The repository AGENTS instructions, execution policy, and original native browser preflight report were read.

This report was written in a separate worktree on branch `proof/r01-r02-browser-preflight-retry`, based on that HEAD. No product code was changed, merged, pushed, or submitted to a tracker.

## Acceptance boundary

The required first browser connectivity gate failed, so no temporary native DSH web host was launched. Final startup composition safety review and built Majed client verification were not completed in this retry. This is not a finding that the stock host is unsafe or unsupported.

Actual native Settings rendering/navigation, English/Arabic RTL, keyboard behavior, theme, UI14/UI18 and narrow viewport acceptance remain unverified. Full R01/R02 acceptance remains open. No actual Codex login or provider traffic was initiated.

## Cleanup

No host process, managed background job, terminal, owned browser session/tab, listener, temporary HOME or temporary DSH_HOME was created by this attempt. No cleanup action was required. The existing GUI at `http://127.0.0.1:49184` was not navigated, reloaded, replaced or otherwise touched. No installed state/accounts/configuration was read or changed; no install, rebuild or restart occurred.

## Required next condition

The running harness's BrowserSkill tools must be able to resolve their `bsk` executable before the approved isolated native browser acceptance can proceed. Browser extension connectivity alone is not sufficient to resolve the observed error. The requested no-install boundary was retained.
