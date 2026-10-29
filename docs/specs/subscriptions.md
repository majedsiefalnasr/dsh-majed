# Spec: Subscriptions component

Status: draft for Owner review (2026-10-29). Published as a GitHub issue only after approval.

## Problem Statement

The Owner uses several model subscriptions (ChatGPT/Codex, Claude, Grok, GitHub Copilot, Google Antigravity) and several API providers inside DSH. Today this needs three separate pieces: the third-party dsh-plugin-subscriptions plugin for subscription logins, the opencode2dsh plugin for OpenCode's free models, and DSH's own Settings > Models page for API keys. Each has its own page, design and lifecycle, and none of them belongs to dsh-majed, so the Owner cannot manage model access in one place, cannot rely on it evolving with his own plugin, and cannot switch the feature off on its own.

An earlier attempt rebuilt part of the subscriptions feature by hand inside dsh-majed. It covered only Codex, lost most of the reference's behavior and design (account cards, usage bars, account management, model editing), and was built alongside many other features at once, so none of them reached acceptance.

## Solution

dsh-majed gains a **Subscriptions** component: a separate row on DSH's Plugins page with its own switch, so the Owner can turn the feature off without disabling the plugin. It is a faithful port of the reference plugin dsh-plugin-subscriptions v0.9.12, with every provider, screen, tool and setting it has, plus two parts it lacks:

- **API providers**, the same providers DSH's Settings > Models manages, editable from our section and stored in DSH's own settings, so both pages always show the same data.
- **OpenCode Zen**, the free, login-less OpenCode model lane, using the method of opencode2dsh in its minimal form.

Settings gains one section, **Subscriptions**, with two parts: **Subscription accounts** (the reference's provider cards, unchanged in behavior and layout) and **API providers**. Everything is built from DSH's own UI components and design tokens, in English and Arabic with correct right-to-left layout. The composer usage badge, the Codex Speed control, the `/fast` command and the image/video tool views stay where the reference puts them.

The component uses the same provider ids as the reference so the Owner's model selections keep working. Because DSH refuses two registrations of the same provider, it ships switched off; the Owner switches the reference off and ours on to try it, and back in seconds if needed. The reference stays installed until the Owner accepts the replacement and removes it himself. The component keeps its own storage, RPC routes and tool names, so the two never share or refresh the same credentials.

The work is delivered one ticket at a time, each accepted by the Owner on the installed build before the next starts.

## User Stories

### Component and switching

1. As the Owner, I want Subscriptions listed as its own component of dsh-majed on the Plugins page, so that I can see it is a separate feature.
2. As the Owner, I want a switch on that component, so that I can turn Subscriptions off without disabling dsh-majed's other features.
3. As the Owner, I want the switch to take effect without restarting DSH, so that trying and reverting is fast.
4. As the Owner, I want the Subscriptions section, usage badge, Speed control, `/fast` command and tool views to disappear while the component is off, so that a switched-off feature leaves no broken UI behind.
5. As the Owner, I want the component to start switched off after install, so that it never collides with the reference plugin I still have enabled.
6. As the Owner, I want a clear message on the component or section when the reference plugin is also enabled, so that I know why providers failed to register.
7. As the Owner, I want to switch the reference off and ours on (and back) with no data loss on either side, so that the reference remains a working fallback until I accept ours.
8. As the Owner, I want the component's title, description and icon to appear on the Plugins page in my language, so that the component list reads properly.
9. As the Owner, I want dsh-majed's existing preferences (bidirectional text, fonts, notifications, approvals and the rest) to keep working exactly as in 0.2.0, so that the new component costs me nothing I already have.

### Section layout and design

10. As the Owner, I want one Settings section named Subscriptions, so that all model access is managed in one place.
11. As the Owner, I want the section split into Subscription accounts and API providers, so that subscription logins and API keys are never confused.
12. As the Owner, I want the section to look like part of DSH, built from DSH's own components, colors, type and spacing, so that it matches every other Settings page in light and dark themes.
13. As the Owner, I want every screen available in English and Arabic, so that I can use it in my language.
14. As the Owner, I want Arabic to lay out right-to-left correctly while emails, URLs, model ids and numbers stay readable, so that mixed text never scrambles.
15. As the Owner, I want the section to show a clear message when its host half cannot be reached, so that I am never left with an empty page.

### Subscription accounts: common behavior

16. As the Owner, I want a card per Subscription provider showing its status (not logged in, login in progress, or the number of connected accounts), so that I can see my state at a glance.
17. As the Owner, I want each card to show which client version requests present and where that version came from, so that I can diagnose model availability.
18. As the Owner, I want to add an account by browser authorization that opens the provider's page in a new tab and completes on its own, so that login takes no copying.
19. As the Owner, I want a fallback to paste the callback URL or code when the browser flow cannot complete (for example on a remote or headless setup), so that I can still log in.
20. As the Owner, I want to cancel a login in progress, so that a mistaken attempt does not linger.
21. As the Owner, I want to add several accounts to one provider, so that I can use all my subscriptions.
22. As the Owner, I want each account row to show the account's full identity (email), plan and expiry, so that I know exactly which account it is.
23. As the Owner, I want to mark one account per provider as default (★), so that requests use it unless another rule applies.
24. As the Owner, I want to log an account out after a confirmation, so that I do not remove one by accident.
25. As the Owner, I want login state to update by itself while a login is in progress, so that I do not have to reload.

### Usage

26. As the Owner, I want each account to show its usage windows (for example 5-hour and weekly) as bars with percentage and reset time, so that I know how much quota remains.
27. As the Owner, I want bar colors to warn me as usage approaches the limit, so that I notice before I hit it.
28. As the Owner, I want to refresh an account's usage on demand, so that I see current numbers.
29. As the Owner, I want a clear message when a provider reports no usage or the lookup fails, so that missing data is not mistaken for zero usage.
30. As the Owner, I want Codex reset credits shown with how many are available, so that I know my options when a window is exhausted.
31. As the Owner, I want to consume a Codex reset credit only after an explicit acknowledgement in a confirmation dialog, and only when the reference's guard allows it, so that I never spend one by mistake.
32. As the Owner, I want usage windows limited to the models I chose to show, where the provider reports per-model quotas, so that irrelevant windows do not clutter the card.

### Managing accounts and models

33. As the Owner, I want a Manage dialog per provider, so that account and model settings sit together.
34. As the Owner, I want to give a subscription a display name, so that quota bars and headings use my wording.
35. As the Owner, I want to give an account an alias, so that I can tell accounts apart.
36. As the Owner, I want to choose which accounts join the provider's account pool, so that requests spread only over the accounts I want.
37. As the Owner, I want an account to appear as its own entry in the model picker if I choose, so that I can pin a conversation to one account.
38. As the Owner, I want a per-account pool model allowlist (all, some, or automatic including future models), so that each account serves only the models I allow.
39. As the Owner, I want to edit a provider's model list: which models are shown (or automatically all), their display names and their default reasoning effort, so that the model picker contains what I use.
40. As the Owner, I want to filter and select all or none in long model lists, so that editing many models is quick.
41. As the Owner, I want to set a Codex model's context window within its advertised bounds and its subagent default speed, so that I control cost and speed.
42. As the Owner, I want to choose which provider tools (image generation, video generation, X search, web search) each provider offers to new sessions, so that the agent only gets the tools I want.
43. As the Owner, I want to choose Claude's prompt cache lifetime (follow config, 5 minutes, 1 hour), so that I control cache behavior.
44. As the Owner, I want partial saves and failures in these dialogs reported clearly with my draft preserved, so that I never lose edits silently.
45. As the Owner, I want account pooling to follow the reference's rules (priority or quota-aware choice, a quota gate, cooldowns), so that pooled requests behave as they do today.

### Proxy

46. As the Owner, I want to route the component's provider traffic through an HTTP/HTTPS proxy with optional credentials and a bypass list, so that it works on restricted networks.
47. As the Owner, I want to test the proxy from its dialog and see the status and latency, so that I know it works before saving.
48. As the Owner, I want a saved proxy password never shown back, only cleared or replaced, so that it stays secret.

### Composer and conversation surfaces

49. As the Owner, I want a usage badge in the composer showing the current subscription's default account quota, so that I see remaining quota while chatting.
50. As the Owner, I want to expand the badge into a panel listing every account and window, so that I can compare accounts.
51. As the Owner, I want to choose whether the badge shows recent usage or stays hidden, so that the composer stays as quiet as I like.
52. As the Owner, I want a Speed control (Standard / Fast) next to the composer for Codex models that support it, so that I can trade quota for speed per session.
53. As the Owner, I want a `/fast` command that opens the same choice, so that I can switch speed from the keyboard.
54. As the Owner, I want the Speed control and `/fast` hidden for models that do not support it, so that they never offer something that does nothing.

### Providers

55. As the Owner, I want Codex (ChatGPT) with browser authorization, its live model catalog, Fast mode, usage windows and reset credits, so that my ChatGPT subscription works fully.
56. As the Owner, I want Claude with browser authorization or an import of my existing Claude Code login, kept in sync, so that my Claude subscription works without logging in twice.
57. As the Owner, I want Grok with browser authorization and its billing usage, so that my X Premium subscription works.
58. As the Owner, I want GitHub Copilot with device-code login (code shown, copy button, link to the verification page), so that my Copilot subscription works.
59. As the Owner, I want Google Antigravity with Google login and per-model quotas, so that my Antigravity access works.
60. As the Owner, I want requests that hit a provider rate limit to wait and retry as the reference does, so that a busy moment does not fail the conversation.
61. As the Owner, I want a provider I never logged into to do nothing at all (no network traffic, no models), so that unused providers cost nothing.

### Agent tools

62. As the Owner, I want the agent to generate and edit images through my Codex or Grok subscription, so that image work uses quota I already pay for.
63. As the Owner, I want the agent to generate videos through Grok, so that video work uses my subscription.
64. As the Owner, I want the agent to search X through Grok, so that it can answer questions about current posts.
65. As the Owner, I want web search answered through Codex where enabled, so that searches use my subscription.
66. As the Owner, I want generated images shown inline with a gallery and lightbox, and videos played inline, so that I can see results in the conversation.
67. As the Owner, I want generated media stored with the component and kept after a restart, so that past results still open.
68. As the Owner, I want tools to fall back to a component-scoped name when another plugin already owns the name, so that a name clash never breaks the tool.

### API providers

69. As the Owner, I want the API providers part to list the same providers as Settings > Models, so that both pages show one truth.
70. As the Owner, I want to add an API provider from DSH's catalog or as a custom endpoint (OpenAI Chat, OpenAI Responses or Anthropic protocol), so that I can connect any service.
71. As the Owner, I want to set or replace a provider's API key without ever seeing the stored key, so that keys stay secret.
72. As the Owner, I want to see whether a key is set, so that I know which providers are ready.
73. As the Owner, I want to edit a provider's display name and base URL, so that I can point it at the right service.
74. As the Owner, I want to fetch a provider's available models and edit its model list (id, name, context window, max output, input types, reasoning efforts), so that the model picker shows what I use.
75. As the Owner, I want to delete providers I added, while built-in ones stay, so that I cannot break DSH's defaults.
76. As the Owner, I want a change made on either page to appear on the other without conflicts, and a clear message if the settings changed underneath me, so that two editors never overwrite each other silently.

### OpenCode Zen

77. As the Owner, I want OpenCode Zen's free models offered as a provider with no login, so that I can use them at no cost.
78. As the Owner, I want an OpenCode Zen card showing whether the lane is reachable and how many models are available, so that I know if it works today.
79. As the Owner, I want OpenCode Zen's errors (rate limit, free tier refused, region blocked) shown in plain words, so that I understand why a request failed.
80. As the Owner, I want OpenCode Zen to run alongside the opencode2dsh plugin without collisions, so that I can compare them.

### Safety and data

81. As the Owner, I want credentials stored only in the component's own private files with owner-only permissions, so that no other plugin reads them.
82. As the Owner, I want no credential copied from the reference plugin, so that the two never refresh the same tokens.
83. As the Owner, I want logout to remove that account's stored credentials, so that nothing stays behind.
84. As the Owner, I want the component's host routes reachable only by an authenticated Owner session, including through remote access, so that nobody else can drive my accounts.
85. As the Owner, I want a failure in the Subscriptions component to leave dsh-majed's other features running, so that one feature cannot take the plugin down.

## Implementation Decisions

- **Component row.** The bundle patch declares a second Loader row beside the core `majed` row: id `majed-subscriptions`, name `dsh-majed/subscriptions`, shipped with `disabled: true`. The package exports a `subscriptions` subpath entry with its own `apply`, locale `meta` (title, description) and icon. Disabling the row disposes the component's host fiber; DSH applies this live under HMR.
- **Browser half.** DSH loads one browser half per package, owned by the core row. The core browser half registers the Subscriptions surfaces only while the component reports itself present, by probing one of the component's own host routes (and re-probing on reconnect); when the route is absent it unregisters every Subscriptions surface. The core row stays on.
- **Port.** The component's host and browser code is the reference v0.9.12 (tag `v0.9.12`, commit `b802311`, MIT) carried over file by file. Local changes are limited to: the component entry and row check; storage directory `plugins/majed/subscriptions` under the DSH home instead of `plugins/subscriptions`; RPC prefix `majed-subscriptions.` instead of `subscriptions-auth.`; tool fallback aliases `dsh_majed_*` instead of `dsh_subscriptions_*`; locales English and Arabic instead of English and Chinese; layout fixes needed for right-to-left; and the API providers and OpenCode Zen additions. Provider ids (`codex`, `claude`, `grok`, `copilot`, `antigravity`), cordis configuration keys and RPC endpoint names stay as in the reference. A provenance record beside the ported code lists source, version, commit, license and every local change; `THIRD_PARTY_NOTICES.md` gains an entry.
- **Build.** The ported source stays TypeScript and is compiled by a build step (TypeScript for the host half, a bundler for the browser half following the reference's closure-factory recipe and externals list). The built output is committed so that installing from GitHub needs no build on the Owner's machine.
- **Host contract.** The reference's twenty RPC endpoints (`providerSettings`, `setProviderSettings`, `status`, `login`, `manual`, `cancel`, `logout`, `setDefault`, `usage`, `image`, `video`, `prepareReset`, `consumeReset`, `speed`, `setSpeed`, `proxyGet`, `proxySet`, `proxyTest`, `modelDefaults`, `setModelDefault`) are served as exact authenticated POST routes under the new prefix. Providers enter DSH through `llm.registerAdapter`; tools through the tools registry; Codex web search through the web search provider registry.
- **Browser surfaces.** Settings section (id `subscriptions`), tool views for image and video generation, `conversation.input.right` for Speed, `conversation.composer.dock` for the usage badge, and the `/fast` command through the command UI, all as in the reference.
- **Two parts in one section.** The section renders "Subscription accounts" (the reference's section content) followed by "API providers". OpenCode Zen appears as one more card in Subscription accounts.
- **API providers.** The browser half adds DSH's public `dsh-api-remotes` client package to its injected dependencies and uses its `settings`, `credentials` and `llm` remotes: read with `settings.describe`, write with `settings.mutate('llm-pi-ai', …, revision)` and surface `settings/conflict`, write keys with `credentials.set/unset` (never read back), list with `llm.listConfigurableProviders`, fetch models with `llm.discoverModels`, and refresh on `settings/document-updated`, `credentials/reference-updated` and `llm/adapters-updated`. DSH's settings are the only store; the component keeps no copy.
- **OpenCode Zen.** An in-process adapter registered under provider id `opencode-zen`, talking to the OpenCode Zen gateway with the client identification opencode2dsh uses, a model catalog from the gateway's model list filtered to free models with a cached static fallback, and a status card. Excluded: the legacy sidecar, the IP pool and its global network dispatcher swap, binary download and credential delegation. The Owner accepted the terms-of-service risk of presenting as the OpenCode client.
- **Design.** Components come from DSH's UI primitives; anything missing is built from DSH design tokens (`--dsw-*`) and the same structure. No hard-coded colors or font sizes. Arabic layout uses logical properties and isolates identities, URLs and numbers.
- **Coexistence.** While the reference plugin is enabled, our provider registrations fail; the component reports that state in its section instead of failing silently.
- **Unchanged.** The core row's 0.2.0 behavior is untouched.

## Testing Decisions

- A good test drives external behavior at the highest seam: an RPC call and its result, a provider request on the wire, a rendered control and what clicking it does. It never asserts on internal helpers or file layout.
- **Seam 1, host component.** Mount the component's `apply` against fake DSH services (connection routes, `llm`, `tools`, `web`) and drive it only through its RPC endpoints and the adapters it registers, with provider HTTP faked. This is the reference's own seam (its fake-connection harness and RPC specs); its 648 tests are ported with the code, renamed to the new prefix and storage directory, and run in our suite. New behavior (row presence, API providers, OpenCode Zen, renamed aliases) gets tests at the same seam.
- **Seam 2, browser surfaces.** Render the registered surfaces with a fake RPC caller and assert on what the Owner sees and can do, in English and Arabic. The reference's component and browser-fixture specs are the prior art. The API providers part is tested against fake `settings`/`credentials`/`llm` remotes, including the revision conflict.
- **Seam 3, packaging.** Assert that the packed tarball declares both rows, exports the component entry, locale and icon, contains the built output, and that the row ships switched off.
- The existing command-classifier suite keeps passing.
- **Live acceptance** (ADR-0005) per ticket on the installed build: the Owner switches components on the Plugins page, performs the ticket's scenario with his real accounts, and confirms. Controlled tests alone never close a ticket.

## Out of Scope

- Importing accounts or settings from the reference plugin or from opencode2dsh.
- Chinese locale.
- opencode2dsh's sidecar mode, IP pool, dispatcher swap, binary download and OpenCode credential delegation.
- Splitting the 0.2.0 preferences into their own components.
- Any other dsh-majed feature (Skills, MCP, Hooks, Auto, judgment); each is discussed after this spec is ticketed.
- Adopting reference releases after v0.9.12 (each becomes its own ticket).
- Removing or modifying the installed reference plugins (the Owner does that).
- Changes to DSH itself.

## Further Notes

- Reference: https://github.com/V1ki/dsh-plugin-subscriptions `v0.9.12` (`b802311`), MIT. OpenCode method: https://github.com/FishBottle7/opencode2dsh v0.3.14, MIT.
- Research behind this spec: DSH plugin components, the reference feature inventory, and OpenCode plus native API providers (all dated 2026-10-29 in `docs/research`).
- Decisions: ADR-0011 (components), ADR-0012 (coexistence by switches), ADR-0013 (port as-is).
- Unverified until the first ticket: whether a component subpath resolves when dsh-majed is installed from GitHub, whether new rows appear after an in-place update without restart, and whether a third-party browser half may call the API-provider remotes without extra grants. The first ticket that needs each one proves it or stops for a decision.
- Risks accepted by the Owner: private provider endpoints and borrowed OAuth clients (as in the reference), OpenCode Zen's client impersonation and shrinking free tier.
