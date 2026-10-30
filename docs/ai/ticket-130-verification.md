# Ticket 130 work contract and verification

## Approved contract

- Ticket: #130, Subscriptions: Manage dialog, model list, account pool and proxy. Stories 33–42 and 44–48 of `docs/specs/subscriptions.md`; #129 accepted CLOSED, no #131+ implementation.
- Route: bounded `/implement`, loaded from the local skill instructions, with TDD, Karpathy and surgical changes. Explicit inherited coding route is codex/gpt-6.1-sol; no nested delegation is available. Independent Standards/Spec review remains a Lead gate.
- Baseline: `741967e342970cc0daa80779449b97add850408c`, clean `impl/130-manage`, worktree `/Users/majedsiefalnasr/Documents/Work/DeepSeek Harness/dsh-majed-t130`.
- Source: V1ki/dsh-plugin-subscriptions v0.9.12, `b8023110864494acefc6f5963c2a197d85dda20c`, MIT, read-only `/tmp/upstream-0.9.12`. Port provider-settings, model-defaults, account-preferences adapter, HTTP proxy and rendered manager/model/proxy hierarchy; preserve reference options and existing #129 security/cache/auth/navigation behavior. Cosmetic polish only is deferred.
- Writes: this worktree and `/tmp/majed-t130`; npm cache `/tmp/npm-cache-majed`. No installed/profile/state/secrets access, real account/provider/proxy network, restart, push or merge.
- Agreed verification seams: assembled authenticated RPC and registered provider adapter with intercepted fixture HTTP; rendered EN/AR controls with fake RPC; full tests, build-match, whitespace, packed artifact and SHA256. Reference tests are adapted with explicit dispositions.
- Investigation cap: two failed diagnostic attempts or 20 minutes per blocker, whichever occurs first; deliberate TDD red is not a failed diagnosis. Stop at local committed candidate or report concrete blocker. Fixture proof is not Owner installed/live acceptance.

## Current state

Partial candidate, not ticket-complete or accepted. Direct ports of provider preferences, model defaults, account routing policy and proxy transport; embedded manager/model editor plus proxy form are wired into the existing Codex card. English/Arabic dictionaries and logical styles are present.

Verified: `npm test` passes (including prior #129 fixtures), `npm run build` passes, and `git diff --check` passes. Added reference provider-settings/model-defaults/account-preferences/proxy-host tests, registered adapter/RPC settings fixture, actual React EN/AR manager draft-failure fixture, and proxy password omission/private-storage fixture. Fixture React renderer warns about deprecation; no real browser or account acceptance claimed. `npm ci` reported three pre-existing/high dependency advisories; no forced dependency migration performed.

Remaining required before #130 completion: provider-tools creation-time policy must be integrated with actual public tool/session registration (settings currently persist policy only); full rendered option interaction coverage, proxy rendered failure/test coverage, partial reasoning retry coverage, assembled authenticated negative security coverage, and independent Standards/Spec review. Subagent speed is wired through public agent origin metadata but needs assembled request proof. Display-name event consumer/headings and proxy visual parity still need review. No #131+ behavior added. No installed GUI refreshed.

Reference tests ported: provider-settings, model-defaults, account-preferences and proxy-host. Reference provider-settings-rpc/model-defaults-rpc/view suites require adaptation to this smaller owned component; not claimed ported. Current custom RPC test verifies the exact mounted route and registered adapter but its missing-auth simulation is not independent host authentication proof. The candidate must not be called end-to-end complete.
