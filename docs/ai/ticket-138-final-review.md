# Ticket 138 final delivery review — 2026-11-03

Status: findings resolved; affected verification passed; Owner accepted installed candidate and authorized merge/closure on 2026-11-03. Historical review findings below are retained for traceability.

## Final disposition

Owner authorized repair. Cancellation availability now uses an explicit cancellation flag rather than a translation key; grouped busy observation/polling is restored across all five providers; the modules icon has its third-party inventory entry. Test selectors follow the approved bottom Add topology and distinguish the footer from provider-local Cancel. Five reopening/pending-to-complete regressions preserve the actual registered component seam. Final affected suites passed 117/117; check:build byte equality and git diff --check passed. Full historical authentication matrices were not repeated. Corrected candidate SHA256c7d9f4c82ba668ca832aa88ef292ea6490561b145574e4f6abe8eaf0275cfd90 was installed and all99 files matched. Owner reported everything working and approved closure/merge. No exhaustive automated rendered claim is inferred.

## Scope and method

Owner authorized final reconciliation/publication and conditional merge/closure, then separately approved two limited independent code reviews. Standards and Spec reviewers used codex/gpt-6-astra, high reasoning, read-only, against integration baseline ee021a2bc3f06bbc53326362f4233bdf249d3bbb through HEAD ce3167ba3f13cc0f01453c11237ab060dca004e5 plus cumulative tracked working-tree changes. The approved disposition at the top of docs/specs/subscriptions.md supersedes historical mixed API/subscription layouts. Neither reviewer ran tests, used accounts, modified files, inspected private rollback/auth fixtures or claimed rendered acceptance.

## Required corrections

- **P2 — Inline Add cancellation:** independently confirmed by both reviewers. src/api-providers.ts:164 exempts only the apiCancel translation key from authentication-busy disabling, while the subscription footer at :202 uses cancel. During pending authorization the footer cannot call its cancellation-and-close handler. The provider-local cancellation still works, so this is not wholly uncancellable authentication. Keep cancellation availability independent of translated text and preserve guards around noncancelable operations. Regression proof must exercise pending cancellation, controller outcome and return focus.
- **P2 — Grouped authentication status:** Spec review identifies grouped busy suppression and polling suppression at src/codex-card.ts:251–255,303,317–321 and the sibling pattern. Reopening Settings during an existing authorization can present configured/ready rather than pending and fail to observe completion. Separate truthful status observation from hiding duplicated authentication controls. Validate the reopening/completion scenario without admitting new account/network calls.
- **P3 — Third-party inventory:** Standards review identifies the copied general modules icon in src/PROVENANCE.md:3–5 without its own inventory entry in THIRD_PARTY_NOTICES.md. Add source/version and reference the existing DeepSeek MIT notice; the license text itself is not reported missing.

## Verification disposition

Affected-suite command: node --test test/composer-surfaces.test.mjs test/zen-owned.test.mjs test/subscriptions-browser.test.mjs test/api-providers-136.test.mjs. Recorded output: /tmp/ui138-final-focused.log; 112 tests, 97 passed, 15 failed, exit1. This was not the full completed historical authentication matrix.

Static classification of those 15 failures: two obsolete Arabic API-heading assertions; two obsolete page-title assertions in coexistence tests; ten assembled authentication cases reaching removed header Add/stale text selectors before meaningful behavior; one Cordis admission case expecting API hint/directory rendering intentionally absent from the final subscription-only page. These failures are stale acceptance tests/evidence gaps, not proof of15 product defects. Reconcile entry selection/copy and retained API-controller coverage rather than deleting behavioral assertions. The footer source defect exists independently of these failures.

Prior applicable behavioral/build/package evidence remains credited. Current rendered mobile/RTL/keyboard and operational acceptance is not established by these reviews. Generated bundles were not rebuilt by the reviewers. No full-spec closure follows merely from children128–137 being closed.

## Next authorized boundary

Owner has been asked for a bounded repair slice covering the corrections, test reconciliation and affected-only verification. No repair consent had arrived when this report was written. Do not infer consent from automatic goal continuation. No product/test fixes, new installation, commit/push/PR, merge, issue closure or private-artifact deletion occurred during this review. Once repair is authorized, complete targeted proof and the remaining rendered acceptance before conditional delivery.
