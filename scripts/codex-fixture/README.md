# Public-composition Codex fixture

Testing only; no production code or endpoint configuration is changed. The approved seam is root `apply(ctx, {codexAccounts:{fetch,ports,path,catalogPath}})`. The transport never delegates to network fetch, permits exact token/catalog/Responses URLs with expected methods, and labels every synthetic account/model/reply. Counters remain closure-private until disposal writes counts (not bodies or credentials) to the owned log. This is not OS-level network confinement of stock DSH.

## Lead commands

From this candidate checkout, with existing dependencies only:

    node scripts/build-baseline.mjs
    node --test scripts/codex-fixture.test.mjs
    node scripts/codex-fixture/launch.mjs new

The launcher prints an owned temporary run path and stays foreground. Read that run's `host.log` locally to open the most recent stock startup URL in the lead-owned browser. Treat the URL as a private local authentication capability; never paste it into reports. No accounts or operational profile state are copied. Stock `web --patch` inserts an absolute temporary plugin entry. Its package metadata is copied verbatim from Majed; actual built client, modules, locale and assets are linked from the candidate, not replaced UI. The only composed host entry calls root `apply`. Disabled stock IDs match the prior approved isolated overlay.

## Browser actions (lead only)

1. Open Settings, General, Codex account; enable account management. Click Connect Codex. Do **not** open the sign-in link or visit the auth website.
2. Read the displayed authorize link's href locally through DOM inspection. Construct a URL from its `redirect_uri`, set `state` to the link's exact generated state and `code` to `SYNTHETIC-FIXTURE-CODE`. Do not change state or PKCE: the service owns both. Navigate a temporary browser tab to that local callback URL, or paste that full callback URL into the existing callback input and click Complete login. Both exercise the actual account service's pending-attempt validation and token exchange through the fixture fetch. Never manufacture operational credentials.
3. Verify the labelled `synthetic-codex@example.test` account. Enable Codex models, refresh model catalog, select `Synthetic Codex — fixture only` in native picker. Send a synthetic prompt; expect `SYNTHETIC CODEX FIXTURE: no provider inference occurred.` Check Standard/Fast and per-model preferences only against this synthetic model.
4. Stop the foreground launcher with Ctrl-C. Wait for `Fixture host exited`. Restart the exact same owned run (not an arbitrary profile):

       node scripts/codex-fixture/launch.mjs restart <owned-run>

5. Open the new startup URL, enable account management and models again (activation intentionally resets on restart). Verify the retained synthetic account/catalog/preferences and a new synthetic response. Account persistence is separate from runtime activation. Never interpret activation reset as account loss.
6. Stop with Ctrl-C and verify the recorded PID has no listening sockets. The launcher intentionally retains only its temporary profile for inspection/restart; it never deletes arbitrary paths. Do not share logs, auth store or startup URL. Do not leave this host running.

## Worker evidence and limits

Initial transport test failed with ERR_MODULE_NOT_FOUND before implementation. Four fixture tests subsequently pass: unexpected-host/endpoint-suffix/catalog-version denial; synthetic payloads; actual account-service callback/PKCE identity retention across service restart; and rejection of arbitrary restart paths/invalid CLI arguments. Existing `npm test` passes: 506 tests, zero failures (plus legacy runner 166/166). Existing dependencies were linked locally; no installation occurred.

Controlled stock host smoke started on an ephemeral loopback port with fresh HOME/DSH_HOME; graceful stop exited zero. Same retained profile restarted successfully. Unauthenticated shell requests returned 401; no admission bypass was attempted. Browser mounting/client discovery, OAuth callback, native picker/dispatch, settings persistence and retained-account restart are **not yet browser verified**. Lead must execute the actions above. Stock startup alone is not evidence of mounted plugin success or no stock-host background traffic. Actual GUI at port 50731 was untouched. No real auth website, provider inference, installed accounts/configuration, host source patch, global fetch override, fake admission, push or merge was used.
