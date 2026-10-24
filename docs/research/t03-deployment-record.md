# T03 candidate deployment record

Status: candidate files deployed after explicit Owner approval on 2026-10-24; **restart and live verification pending**.

- Integration source: `525355e` on `feat/managers`; candidate `0.3.0-rc.1`.
- Owner approved backup, deployment into the installed Majed plugin, then an Owner-managed full DSH restart and BrowserSkill reconnection. No operational feature activation or reference removal was approved.
- Portable regression before deployment: `npm test`, 56/56 tests and 166/166 classifier cases passed.
- Packed candidate: 47 entries, npm SHA-1 `1d02bf4861c55861151b35293f20731fbd4c370c`.
- Rollback: `deployment-backups/before-t03-525355e.tar.gz` (local, ignored). Archive readability and expected package/host entries verified before deployment.
- Destination: `/Users/majedsiefalnasr/.dsh/profiles/desktop/node_modules/dsh-majed`; verified real directory, not symlink.
- Deployed 46 candidate files and compared SHA-256 contents to archive entries. The bundle patch matched exactly and was not rewritten. Historical prototype files were retained; the new public host/client entries do not import them.
- The first workspace-sandbox write attempt was denied at LICENSE after creating the backup; the exact escalated retry stopped at the existing-backup guard without overwriting it. The existing rollback archive was then verified and deployment completed with approved wider access.
- No profile configuration, reference plugin, MCP definitions, Hook approvals, Skills, account or credential store was changed. No new server was started. File verification does not establish runtime activation.

Post-deployment source revalidation on 2026-10-24: `scripts/test-settings-product.mjs` passed against installed DSH `0.2.1-rc.2` / embedded Node `v24.21.0`. The production client and route passed isolated local and paired-remote HTTP, admission/scope rejection and disposal; both disposable listeners closed. This uses synthetic credentials and jsdom/presentation adapters, not the running desktop instance or live browser acceptance. Rechecking BrowserSkill still found the verified instance `cfe27991` disconnected.

The verified BrowserSkill instance `cfe27991` was disconnected on the deployment round. Await the Owner's full desktop restart, reconnection of that same instance, and authorized local/remote pages before executing [the browser acceptance procedure](t03-browser-acceptance.md). T03 / #8 stays open and its dependent tickets remain gated.
