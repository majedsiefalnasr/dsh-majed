# Rejected Codex refresh snapshot candidate

Baseline: `37af216956967da8ea31b675b07dab8a62b9c6b9`. No installed state, account credentials, browser, host worker or live provider was used.

## Diagnosis

The account service persists `reauthentication_required` after a permanent grant rejection and publishes its host-only subscription before/after persistence (`modules/subscriptions/codex/accounts.js`). The direct runtime subscribes to invalidate native registration and fence dispatch (`modules/subscriptions/codex/runtime.js`). This is not a browser Settings snapshot notification. The native management route returns only a sanitized failed RPC envelope when refresh throws (`modules/subscriptions/codex/native.js`). The browser catch previously changed only the error message, retaining its prior connected account/runtime snapshot. No source contract requires that stale state to remain until a manual status action; it contradicts truthful UI state and the explicit bounded acceptance request.

## Approved seam and regression

The requested actual client integration seam is the built production browser bundle, mounted through the existing Settings harness and exercised by its rendered Refresh credentials button against the public RPC contract. Controlled responses represent both failed envelopes and rejected RPC promises. This is not a live/native browser or actual host-state notification proof.

Red on baseline: all four English/Arabic and envelope/transport cases failed because calls were `['status', 'refresh']`, not `['status', 'refresh', 'status']`. Green asserts retained identity, translated reauthentication state, absent stale catalog form, visible sanitized alert, RTL, disabled default action and no credential replay. Two further failed-requery cases assert stale connected metadata is absent and refresh/default actions are disabled.

## Change

Only a failed explicit credential refresh gets one public status requery, within the existing abort controller, busy guard and overall timeout. It does not resend refresh, clear the original sanitized error, add an API or change admission. Stale runtime metadata is cleared during reconciliation; if status fails, identity is retained with bounded unknown/error presentation, not a connected assertion. Non-connected account settings/default selection are not actionable. Removal and explicit status recovery remain available.

## Direct review

Standards: direct review against AGENTS.md, public-only plugin ownership, English project content, user-visible changelog and narrow-diff/Fowler smell baseline. No hard violations or material smell findings. No nested reviewer was launched, as explicitly prohibited.

Spec: direct review against the bounded request and managers-spec.md truthful state/admission requirements. Requery uses existing safe status action; the host snapshot does not call refresh or grant. Host admission, revocation fencing and storage are unchanged. Original mutation errors stay visible. Shared timeout/signal and mounted checks cover the requery. Native visual/operational evidence is not claimed. R01/R02 remain open.

## Browser confirmation still required

Under separately authorized fixture/native browser execution, use the existing `new-reauth` scenario in English and Arabic. Connect the synthetic account, enable models, verify connected identity/catalog, then click Refresh credentials once. Without clicking Refresh account status, verify the bounded operation error remains, retained account identity shows sign-in-again state and old catalog/account configuration is absent. Inspect fixture grant counters for exactly one invalid refresh and no additional credential grant. Confirm RTL, keyboard/status recovery and reconnect. Repeat with status RPC denied/unavailable: no stale connected/default/catalog action should remain; restore status access and explicitly refresh status. No browser worker was launched for this candidate.
