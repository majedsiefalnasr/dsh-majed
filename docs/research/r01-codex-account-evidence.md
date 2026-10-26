# R01 Codex account workflow evidence

Implemented for [R01 / #48](https://github.com/majedsiefalnasr/dsh-majed/issues/48). This is controlled fixture acceptance, not real account login, installed-state modification, desktop restart, browser visual acceptance or provider/model dispatch.

## Production path

`index.js` mounts `modules/subscriptions/codex/native.js` through the public native `connection.fetch` exact registration. It uses native BrowserAuth/Owner admission rather than trusting client labels or headers. The accepted browser bundle adds an independently enabled Codex account panel inside native Subscriptions Settings. The existing general readiness toggle remains inert; the separately labelled account-management toggle explicitly enables this workflow. Enabling is process-lifetime only; accounts are durable in Majed's exclusively owned `plugins/dsh-majed/codex-auth.json` beneath the selected DSH home. No reference account store is opened or migrated.

The service integrates pinned upstream PKCE, authorization URL, loopback callback and token exchange/refresh grant behavior. Manual completion requires a full matching state-bearing callback; there is no bare-code or synthetic-token fallback. Browser callbacks distinguish authorization receipt from completed exchange. Pending, failed, cancelled, connected and reauthentication-required states are translated into English/Arabic, with RTL inherited from the native section. Snapshots never return token values or the PKCE verifier. Login URLs contain only the protocol's public challenge/state.

Private atomic writes use a unique mode-0600 temporary file, fsync and rename; one process-wide queue owns each path. Interrupted/orphan temporary files are never selected as account state. Existing invalid/insecure store files fail closed without overwriting. Cancellation is checked again immediately before issuing rename. Coalesced refreshes use revision checks before committing either refreshed credentials or permanent-failure state; a newer login wins. Account IDs bind workspace and user. Refresh cannot switch that identity. Disposal cancels pending network work, callbacks and queued writes. A provider that ignores AbortSignal cannot prevent the public operation from settling.

Source identity and adaptations are documented in [Codex provenance](../../modules/subscriptions/codex/PROVENANCE.md), including the complete upstream MIT notice. The reviewed source checkout was reverified at `9930c5ee5e3fa239db9031f47a0f6f30f7ffc443`. No new external runtime dependency is added, and no upstream test-suite execution is claimed.

## Automated evidence

`npm test` includes the new accepted Codex account and Settings suites. They use actual account services, temporary storage, controlled provider transports and the production root plugin entry. Coverage includes restart reload, mode 0600, actual form/JSON grant formats, cryptographic verifier shape, state mismatch, bare-code denial, cancellation/expiry/replay, stale refresh versus new login, corruption preservation, cancellation while a real temporary write is pending, browser callback HTTP, permanent grant errors, redaction and English/Arabic Settings controls. Native Owner admission itself is proved separately below; the portable registry fixture deliberately does not simulate authentication.

The existing isolated product proof has an optional `--codex` scenario:

```sh
DSH_PROBE_NODE='/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness' \
DSH_PROBE_RUNTIME='/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh' \
DSH_MOUNTED_DEPS='/Users/majedsiefalnasr/Documents/Work/DeepSeek Harness/dsh-mounted-settings-deps/node_modules' \
DSH_PROBE_REMOTE='/Users/majedsiefalnasr/.dsh/profiles/desktop/node_modules/@linxin666/dsh-remote-web-ui/lib/types/remote-api.js' \
node scripts/test-settings-product.mjs --codex
```

The runner supplies a disposable HOME/DSH_HOME/cwd, synthetic memory browser credentials and pairing, bounded physical loopback HTTP and a controlled provider transport. It reads only installed runtime/plugin source code. It mounts the unmodified accepted browser bundle with actual native renderer, Settings, connection RPC and host exact Fetch registration; it does not replace native admission or synthesize the product's successful state.

The executed scenario selects native Subscriptions Settings, enables account management, starts PKCE, follows the full manual callback through actual remote-prefixed RPC/HTTP, persists an account in the temporary private store, disposes/remounts the service, reloads the retained account and refreshes its credentials through the controlled grant. Missing local browser cookie and missing remote pairing reject and display an account-operation error. All four owned WebServer/OAuth listeners close. The original readiness/scoped-management assertions still run. The positive run was green against installed DSH `0.2.1-rc.3`, embedded Node `v24.21.0`; the report emits runtime/native module hashes.

This mounted proof uses jsdom and explicitly adapted presentation primitives/locale with the existing reviewed test dependencies (including React 18). English is exercised in the mounted exact-host scenario; both English and Arabic/RTL are exercised in the portable rendered Settings suite. Neither establishes real browser geometry, theme/font variants or live desktop/remote acceptance. Those remain unverified. R02 still owns native model catalog and direct dispatch; this account workflow does not enroll Auto candidates or activate provider inference.
