# R01/R02 native browser observations — candidate evidence

## Provenance and boundaries

Owner/lead-supplied observations from the isolated stock DSH rc.3 native UI launched through `.startup-review/launch-isolated.sh`, with temporary HOME and DSH_HOME and no accounts/providers. This worker did not independently repeat the browser run. The real GUI at http://127.0.0.1:50731 was untouched. No login, paired remote, provider request, installed-state access or cutover was performed. Build was explicitly approved to the lead; this report does not authorize another build or launch.

## Observations (not complete acceptance)

- Actual native Settings dialog contained Majed tabs. Subscriptions displayed the Codex panel with management disabled.
- Switching English to Arabic localized Majed tabs and the panel; computed region direction was `rtl`.
- Dark mode body background computed to `rgb(21,21,23)`; this alone does not establish panel contrast or all theme states.
- General App UI font control changed from 14 to 18; computed panel font was `16px`. This is insufficient evidence of either correct scaling or a defect: inheritance, intended typography and before/after panel measurements were not established.
- At viewport 420×800 the observed region had x=236 and width=136, and the document had no horizontal overflow. These geometry measurements do not prove readable controls, absence of clipping, wrapping, or complete narrow-screen visual acceptance.
- Tab after Subscriptions focused Auto routing. This is one focus transition, not full keyboard navigation, focus visibility, focus order, trapping, or activation acceptance.

## Remaining acceptance

Complete light/dark and host typography visual checks, both locale directions, narrow and desktop layouts, and full keyboard/focus checks remain open. Disabled no-account rendering is not proof of authenticated account lifecycle, native model-registry integration, paired-remote parity or live provider execution.

The lead closed the browser and killed owned host job `bash-9ebfa246ef2a4108`, collecting the killed result. This worker must not restart setup or browser under its narrower permission scope.
