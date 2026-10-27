# Bounded native typography diagnosis

## Scope and result

Based on integration candidate fd4e0f1 in a new isolated worktree. No browser or host was launched; the existing GUI, installed plugins, profiles, accounts and providers were not changed. No merge, push, issue creation or delegation occurred.

The lead reported identical computed region/heading/paragraph/button sizes `[16px,16px,16px,13.3333px]` at App UI sizes 14 and 18. Static diagnosis confirms a local typography defect, but does not prove that defect accounts for every measurement or that the complete client bundle was unstyled.

## Artifact evidence and causal chain

- Package `exports["./client"]` points to `dist/client.js`; `scripts/build-baseline.mjs` copies only `client.js` verbatim. The full accepted suite includes packaged-artifact contracts. No separate CSS artifact is expected for this plugin: its apply effect creates `style[data-majed-settings]` from `ROW_CSS`.
- The stock rc.3 public `@deepseek-ai/dsh-client-ui-theme/lib/client.js` inside the installed app archive defines `--dsw-font-s-14:14px/22px var(--dsw-font-family)` and `--dsw-font-m-18:500 16px/28px var(--dsw-font-family)`. It does **not** define `--dsw-font-s-18`. The latter token was incorrectly used for the Manager heading, and the existing appearance test incorrectly treated that spelling as proof of an 18px heading.
- Manager root previously used `font:inherit`. That assumes its native slot parent supplies a scalable font; it does not select a body font token. A raw inherited browser default has no explicit stylesheet px declaration for the existing scaler to rewrite. The missing heading token invalidates its font shorthand at computed-value time. This explains why root/body/heading can all remain at the same inherited default even when native token overrides work elsewhere.
- The font preference updates `--majed-ui-d` synchronously through the store subscription; token overrides are rebuilt immediately on preference changes. Lazy sheet insertion/load triggers a 120ms rescan. There is no source evidence here that an ordinary post-setting section switch requires a longer preference-application delay.
- The stock rc.3 client loader inventories factory-injected styles and preserves plugin-owned styles for lifetime/HMR cleanup. Inspection did not establish a missing-CSS packaging failure. The lead launch overlay loads the absolute host entry, and General/Subscriptions registration establishes that some candidate client code ran; it does not alone establish presence of every applied rule.
- A pure jsdom stylesheet parse of emitted `ROW_CSS` succeeded with 52 rules, including the Manager root, heading and refresh rule. This is parsing evidence only, not browser computed typography.
- The sampled button's 13.3333px remains unexplained: production `.majed-management-refresh` declares `font:inherit`. The lead must identify the exact sampled element and matched rule before claiming the minimal token fix explains it. No global CSS, native-host patch or hardcoded typography was added.

## Minimal change and tests

Manager root now selects `--dsw-font-s-14`; heading selects the real `--dsw-font-m-18`. Existing refresh/form inheritance then follows the section body where applied. Heading semantics follow native token values, not the number in its name.

Corrected the existing `test/appearance-contract.test.js` seam (already authorized client/package appearance seam). Red: the new body-token assertion failed on old source. Green: all four appearance contracts passed after the two declaration changes. Baseline client suite passed all 14 tests before the change. `npm test` initially failed because the fresh worktree had no dependencies; linking its ignored node_modules to the integration checkout's existing dependency directory resolved that harness setup omission. Full `npm test` then passed **506 tests, zero failures**, including build/package checks. No dependency installation or integration source modification occurred.

These are source-contract and fixture tests, not a CSS engine regression or live acceptance. No claim of reproduced/fixed complete browser symptom is made. Public extracted artifacts and logs are local ignored diagnosis material, not copied into the distributable.

## Exact next lead browser verification

1. Build this candidate with `npm run build`. Point only the separately owned isolated launch candidate's Majed insert path at this worktree's absolute `index.js`, retaining all existing telemetry/provider disablement and new private profile safeguards. The old launch script hardcodes the previous worktree; launching it unchanged would test old bytes. Do not alter the real GUI or installed state.
2. In the lead-authorized native browser at 1280×900, keep account management/readiness disabled. Verify delivered Majed client bytes contain `font:var(--dsw-font-s-14)` on `.majed-management` and `font:var(--dsw-font-m-18)` on `.majed-management__title`.
3. Before the 14/18 comparison, confirm `style[data-majed-settings]` is present and its sheet has the expected selectors; confirm theme token sheet and frontend stylesheet links loaded. Inspect the exact region's computed `--dsw-font-s-14`, `--dsw-font-m-18`, `--majed-ui-d`, font size/line height/family, and matched font declarations. Use `.majed-management-refresh` explicitly for the sampled Refresh button, not an arbitrary first button or native Switch.
4. Set General App UI 14, open disabled Subscriptions, capture computed styles on `.majed-management`, `.majed-management__title`, its direct paragraph and `.majed-management-refresh`. Repeat at verified App UI 18 after the lazy sheet rescan settles. With stock rc.3 token values and no other override, expected sizes are root/body/Refresh **14→18px**, heading **16→20px**; delta **0→4px**. If these differ, retain matched-rule/token evidence rather than changing font sizes speculatively.
5. Capture screenshots and width/scrollWidth plus keyboard/focus at each size; then Arabic RTL, light/dark and narrow cases as authorized. Restore App UI 14 and original locale/appearance, leave account management disabled, stop only owned browser/host and collect its job. Live provider/account use remains outside scope.
