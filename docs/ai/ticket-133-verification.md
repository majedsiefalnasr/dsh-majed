# Ticket #133 verification — isolated candidate

## Scope and source

Branch `impl/133-grok-media`, baseline `d56439ee5a895b8410efbacbd795a54e07a002d7`. Owned port from read-only `/tmp/upstream-0.9.12`, pinned `b8023110864494acefc6f5963c2a197d85dda20c`, MIT. No Copilot implementation. Existing #130 Codex image pool, image tool, alias helper and Codex web-search provider were reused, not duplicated.

Implemented Grok discovery/OAuth/refresh, chat adapter, billing usage, preference-aware registration/pooling, account card and management; Grok image generation/edit/fallback; video and X tools; durable image/video byte RPC; inline image gallery/lightbox and video views; public and Majed alias toolview keys; EN/AR labels. Storage remains owned `plugins/majed/subscriptions`. A decorative toolview icon is deliberately omitted to retain core isolation when host primitives fail.

## Executed fixture gates

- Grok reference red: missing module, TypeScript exit 2; green: 2 request-shape tests, exit 0.
- Media reference red: missing exports/tools/options, TypeScript exit 2; green: 30 tests, exit 0. Includes both providers' ordered one/five-reference editing, invalid/missing references, policy fallback, disabled providers, cancellation, X citations, video submit/poll/download/errors/timeouts and attachment persistence.
- Full `npm test`: final exit 0, classifier **166/166**, Node **607/607**, zero failures. Log `/tmp/majed-t133/npm-test-final2.log`.
- `npm run build`: exit 0. `npm run check:build`: exit 0, fresh build matches generated output.
- Earlier full-suite failures exposed expected old provider/tool/route counts, a real eager-primitives isolation regression (fixed), and missing TypeScript arguments (fixed). They are not represented as successful runs.
- First combined logging command failed because the temporary log directory was absent; created the allowed directory and reran. No bypass.

Existing assembled fixtures cover authenticated envelopes, route disposal/remount, shared-provider registration, preference enforcement, alias restriction and browser surface withdrawal; pinned tests cover media execution. These do **not** independently prove every new Grok assembled auth/billing path, actual browser gallery/lightbox interactions, or persistent video reopening across a real host restart. This remains candidate evidence, not live acceptance.

## Consolidated Owner checklist — only after independent review and separately approved install

1. Use one final consolidated session for this ticket. Owner controls the mutually exclusive reference-off / owned Subscriptions-on setup. Never share credentials, tokens, callbacks or screenshots containing account identity with an agent.
2. Connect an Owner-owned Grok account through browser authorization; confirm sanitized account/tier/billing display, refresh, default selection, cancel and logout. Confirm model picker/chat and model preferences without changing existing Codex/Claude functionality.
3. Generate an image with Codex, one with Grok, and edit an existing durable image reference with each available provider. Confirm invalid references fail instead of silently generating. Verify inline images, keyboard-accessible lightbox and English/Arabic/RTL layout.
4. Generate a short Grok video; verify progress, durable file, native playback, cancellation/error behavior and video reload. Run Grok X search and existing Codex web search; confirm citations and fallback aliases if names collide.
5. Owner performs the approved restart/reload once; reopen the saved conversation and confirm old image/video media still loads. Check component-off and reference coexistence withdraw owned surfaces and do not break core.
6. Report only pass/fail and non-sensitive symptoms. Independent reviewer and Owner decide acceptance; do not close or install automatically.

## Limits and integration risks

No installed changes, restart, real OAuth, provider inference, account/Keychain access, push or merge was intentionally performed. Library documentation was fetched through ctx7 for current xAI video polling (`POST /v1/videos/generations`, `GET /v1/videos/{request_id}`, temporary URLs); implementation remains pinned-reference compatible. No dependency added. Dependency install reported 15 high audit findings; no scope-expanding audit fix applied.

The inherited regression suite uses historical fixture roots under `/tmp/majed-t129`, `/tmp/majed-t130` and `/tmp/majed-t131-*`; executing that suite consequently wrote fixture-only data there. This deviates from the requested `/tmp/majed-t133`-only temporary write boundary and must be disclosed, not hidden. No sibling worktree or real credential store was used.

Lead must reconcile overlapping `src/subscriptions.ts` (provider/account/pool/RPC/tool composition), `src/browser.ts` (cards and slots), `locale/en.json`, `locale/ar.json`, generated `dist/subscriptions*`/`dist/client.js`, `src/PROVENANCE.md`, `THIRD_PARTY_NOTICES.md`, `CHANGELOG.md` and `docs/ai/current-work.md` against #134. Do not copy a sibling tree's generated output; integrate source serially then regenerate and rerun gates. Grok-specific assembled lifecycle/security/media authorization tests and rendered gallery/lightbox interaction proof remain review gaps; green inherited fixtures alone do not close them.
