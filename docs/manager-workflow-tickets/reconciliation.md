> Publication review: 2026-10-25T18:50:42.852772+00:00. The follow-ups are now verified as GitHub #48–#74 with 43 native blockers. The pre-publication snapshot below remains historical evidence. See [the published index](README.md) and [review](review.md).

# Historical reconciliation

Evidence: complete read-only Owner CLI export, 47 issues, zero errors, completed 2026-10-25T17:27:38.129320Z. This is a dated snapshot, not a claim of current tracker state. The raw export remains outside the repository; [baseline metadata and hashes](tracker-baseline.json) preserve its identity without copying full comments. Refresh before publication.

All implementation issues #3–#36 and #47 were CLOSED. That state does not establish end-to-end acceptance. Retain useful implementation and tests; follow-ups own outstanding production wiring and verification. No historical issue changes are proposed.

## Findings that change the plan

- Native Auto: #5 includes a substantive prompt-provider ordering concern. Later module-resolution failures in #5/#6 cannot establish that the native contract is unsupported. R10 must reproduce correctly loaded scenarios and negative controls, and preserve unresolved semantic concerns. R08 remains blocked until that contract is satisfied or explicitly revised.
- Child routing: #7 contains accepted bounded native feasibility evidence. #31's blanket unsupported characterization does not supersede it; R17 reuses that evidence while proving production integration.
- Hooks: #47 established loss of original locality. ADR 0009 changes only that requirement to truthful verified-or-unknown origin; authenticated exact-command consent remains mandatory. R13/R14 implement and prove the resulting workflow.
- Subscriptions: #17–#25 predominantly demonstrate synthetic/core seams. In particular #22 explicitly lacks persistence and live proxy proof. R01–R07 and R19–R23 complete production workflows. Pinned Copilot device-flow evidence takes precedence over an invented browser/manual mechanism.
- Smart: #29 supplies settings scaffolding; #30–#32 did not establish applied Smart, child integration or advice. R15–R18 retain these requirements with independent consent boundaries.
- #33/#34 prepare cutover; #35/#36 closure is not local/remote live verification. R24–R27 retain separate readiness, operational approval and acceptance evidence.

## Historical issue ownership

This maps follow-up ownership, not a declaration that every existing criterion failed. Shared baseline/admission/source requirements remain cross-cutting acceptance obligations.

| Historical issue | Follow-up ownership |
| --- | --- |
| [#3](https://github.com/majedsiefalnasr/dsh-majed/issues/3) | Retain accepted baseline isolation; all implementation tickets preserve it |
| [#4](https://github.com/majedsiefalnasr/dsh-majed/issues/4) | Retain authenticated admission; every Settings workflow plus R25/R27 verifies it |
| [#5](https://github.com/majedsiefalnasr/dsh-majed/issues/5) | R08, R10 |
| [#6](https://github.com/majedsiefalnasr/dsh-majed/issues/6) | R08, R10 |
| [#7](https://github.com/majedsiefalnasr/dsh-majed/issues/7) | R17; retain accepted bounded feasibility evidence |
| [#8](https://github.com/majedsiefalnasr/dsh-majed/issues/8) | R01 |
| [#9](https://github.com/majedsiefalnasr/dsh-majed/issues/9) | R01 |
| [#10](https://github.com/majedsiefalnasr/dsh-majed/issues/10) | R09, R11 |
| [#11](https://github.com/majedsiefalnasr/dsh-majed/issues/11) | R09, R11 |
| [#12](https://github.com/majedsiefalnasr/dsh-majed/issues/12) | R12 |
| [#13](https://github.com/majedsiefalnasr/dsh-majed/issues/13) | R12 |
| [#14](https://github.com/majedsiefalnasr/dsh-majed/issues/14) | R13, R14 |
| [#15](https://github.com/majedsiefalnasr/dsh-majed/issues/15) | R13, R14 |
| [#16](https://github.com/majedsiefalnasr/dsh-majed/issues/16) | R14, R18, R24 |
| [#17](https://github.com/majedsiefalnasr/dsh-majed/issues/17) | R02, R07 |
| [#18](https://github.com/majedsiefalnasr/dsh-majed/issues/18) | R01, R03 |
| [#19](https://github.com/majedsiefalnasr/dsh-majed/issues/19) | R04, R05, R06 |
| [#20](https://github.com/majedsiefalnasr/dsh-majed/issues/20) | R02, R03, R04, R05, R06, R07 |
| [#21](https://github.com/majedsiefalnasr/dsh-majed/issues/21) | R03, R06, R07, R22 |
| [#22](https://github.com/majedsiefalnasr/dsh-majed/issues/22) | R02, R03, R04, R05, R06, R07, R23 |
| [#23](https://github.com/majedsiefalnasr/dsh-majed/issues/23) | R19 |
| [#24](https://github.com/majedsiefalnasr/dsh-majed/issues/24) | R20 |
| [#25](https://github.com/majedsiefalnasr/dsh-majed/issues/25) | R21 |
| [#26](https://github.com/majedsiefalnasr/dsh-majed/issues/26) | R08 |
| [#27](https://github.com/majedsiefalnasr/dsh-majed/issues/27) | R08, R10 |
| [#28](https://github.com/majedsiefalnasr/dsh-majed/issues/28) | R08, R10 |
| [#29](https://github.com/majedsiefalnasr/dsh-majed/issues/29) | R15 |
| [#30](https://github.com/majedsiefalnasr/dsh-majed/issues/30) | R16 |
| [#31](https://github.com/majedsiefalnasr/dsh-majed/issues/31) | R17 |
| [#32](https://github.com/majedsiefalnasr/dsh-majed/issues/32) | R18 |
| [#33](https://github.com/majedsiefalnasr/dsh-majed/issues/33) | R24 |
| [#34](https://github.com/majedsiefalnasr/dsh-majed/issues/34) | R26 |
| [#35](https://github.com/majedsiefalnasr/dsh-majed/issues/35) | R25 |
| [#36](https://github.com/majedsiefalnasr/dsh-majed/issues/36) | R27 |
| [#37](https://github.com/majedsiefalnasr/dsh-majed/issues/37) | Existing Owner deferral retained; no tracker changes; R09 removes excluded active surfaces only |
| [#38](https://github.com/majedsiefalnasr/dsh-majed/issues/38) | Existing Owner deferral retained; no tracker changes; R09 removes excluded active surfaces only |
| [#39](https://github.com/majedsiefalnasr/dsh-majed/issues/39) | Existing Owner deferral retained; no tracker changes; R09 removes excluded active surfaces only |
| [#40](https://github.com/majedsiefalnasr/dsh-majed/issues/40) | Existing Owner deferral retained; no tracker changes |
| [#41](https://github.com/majedsiefalnasr/dsh-majed/issues/41) | Existing Owner deferral retained; no tracker changes |
| [#42](https://github.com/majedsiefalnasr/dsh-majed/issues/42) | Existing Owner deferral retained; no tracker changes |
| [#43](https://github.com/majedsiefalnasr/dsh-majed/issues/43) | Existing Owner deferral retained; no tracker changes |
| [#44](https://github.com/majedsiefalnasr/dsh-majed/issues/44) | Existing Owner deferral retained; no tracker changes |
| [#45](https://github.com/majedsiefalnasr/dsh-majed/issues/45) | Existing Owner deferral retained; no tracker changes |
| [#46](https://github.com/majedsiefalnasr/dsh-majed/issues/46) | Existing Owner deferral retained; no tracker changes |
| [#47](https://github.com/majedsiefalnasr/dsh-majed/issues/47) | R13 |

## Specification story coverage

Story numbers refer to the revised 67-story manager specification. This is requirement ownership, not completion evidence. Detailed capability rows in PARITY remain mandatory; a story mapping cannot mark those rows done.

| Stories | Primary follow-ups / retained boundary |
| --- | --- |
| 1–6 | All implementation tickets preserve independent modules, native Settings, preferences and English/Arabic RTL; R25/R27 verify local/remote integration |
| 7–12 | R11; R09 removes only excluded catalog surfaces |
| 13–18 | R12 |
| 19, 21–25 | R13, then R14 runtime enforcement |
| 20, 26, 28 | R14; R24/R25 integrated guard verification |
| 27 | R24/R25 native Tool rule workflow; R18 respects existing authorization |
| 29 | R24/R25 fresh cutover Approval |
| 30–31 | R01–R07 |
| 32 | R01–R07 refresh/account health; R22 usage/reset; R23 operational settings |
| 33 | R19–R21 |
| 34 | R02–R08 and R19–R21 replay/stream isolation |
| 35 | R26/R27 compatible state and single owner |
| 36–53 | R08, gated by R10; R07 health/budget inputs |
| 54 | R16 |
| 55 | R15 |
| 56–58 | R15/R16; R17/R18 preserve independent consent and bounded judgment |
| 59 | R17 |
| 60–61 | R18 |
| 62 | R16/R27 |
| 63 | R24–R27 |
| 64 | R25/R27 separate execution-point approvals; all fixture work stays isolated |
| 65 | D10 (#46), unchanged; no automatic reference deletion |
| 66 | R25 |
| 67 | Existing D01–D10 (#37–#46), unchanged |

## Publication constraints

Attach only approved new follow-ups to #2 and create their native blocking edges. Preserve #1/#2 title/body/state and all existing issue content and relationships, particularly #42–#46. No blanket reopening or historical closure rewrites. Before writing, refresh the snapshot and identify intervening implementation or duplicate follow-ups; after writing, read back IDs, parent links, labels and dependencies. A partial publication must be resumed using recorded IDs rather than recreating issues blindly.
