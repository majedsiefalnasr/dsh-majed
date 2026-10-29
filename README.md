# dsh-majed

Majed's toolkit plugin for **DeepSeek Harness (DSH)**. It never patches DSH itself — everything is added through public client extension points when the plugin is enabled, and removed again when it is disabled.

## Features

| Where | Feature |
|---|---|
| Settings ▸ General ▸ **Bidirectional text** (toggle) | Per-paragraph RTL/LTR for Arabic, Persian and Hebrew in chat answers, reasoning, tool cells, question boxes and user bubbles; mirrors [`@changfenhuang/dsh-genui`](https://www.npmjs.com/package/@changfenhuang/dsh-genui) components (lists, steps, tables, timelines, switches, chevrons, progress markers…). Replaces `dsh-persian-rtl`. |
| Settings ▸ General ▸ **App UI font size** (px stepper, 11–20, default 14) | Font size of the app interface (sidebar, headers, composer, side panels, settings, other plugins' panels). Additive like the chat setting (`size + (N − 14)px`), so the UI's 14px body text becomes exactly N. Covers every stylesheet (plugin `<style>`, app `<link>` bundles, `font: var(--dsw-font-*)` design tokens) but not the *chat* text, which keeps following the built-in chat font size. |
| Settings ▸ General ▸ **App font** (dropdown) | `DSH default`, `System font` (the OS UI stack), or one of five bundled fonts: **Inter**, **Roboto**, **Open Sans**, **Noto Sans**, **IBM Plex Sans**. Applies to the whole app interface and chat text. Fonts load only when selected. |
| Settings ▸ General ▸ **System notifications** (dropdown: Off / Only when app is in background / Always, + *Send test*) | Native desktop notification when a session **finishes** or **needs you** (tool approval, question, plan review). Two toggles choose which events notify. Clicking a notification focuses the app and opens that session. While the app is focused a notification (only possible in *Always* mode) is shown **silently**; in the background it is audible. |
| Settings ▸ General ▸ **Group sidebar actions in account menu** (toggle, on by default) | Sidebar footer buttons added by plugins (e.g. *Remote access*, Cordis) move **into the account menu** (Settings / Feedback / Sign out) instead of sitting beside it. |
| Settings ▸ General ▸ **Copy on select** (toggle, off by default) | Text you select in the app is copied to the clipboard automatically when you release the mouse or finish a keyboard selection. A "Copied to clipboard" toast confirms each copy. Selections inside input fields, the composer and the terminal are ignored. |
| Composer bar ▸ **Approvals** dropdown (next to the permission control) | Per-session auto-approval: **Ask me** (default), **Auto (safe)**, **Auto (aggressive)**. Decisions come from a deterministic, offline command classifier (see below). A toast shows each auto-approval; after 3 requests in a row that were handed back to you, auto-approval pauses for the session. |

### Notifications on phones (remote web access)
Mobile browsers are stricter than desktop:
- **HTTPS is required.** Plain `http://192.168.x.x` links are not a secure context, so browsers expose no notification API at all. Use the tunnel (`https://…trycloudflare.com`) link from the Remote access panel.
- **Allow once, from a tap.** Open *Settings ▸ General ▸ System notifications* and tap **Send test**; browsers only show the permission prompt from a user gesture. The row shows the current state (allowed / blocked / unsupported).
- **Android Chrome** only accepts notifications through a service worker; the plugin uses the one Remote access registers and falls back to the classic API on desktop.
- **iPhone/iPad** needs the web app added to the Home Screen first (iOS 16.4+).
- If a system notification isn't possible, you still get an **in-app banner** (and a vibration when the page is in the background).
- Limits: a page that is closed or frozen in the background cannot be woken without a push server, so notifications are delivered while the page is open or recently backgrounded.

### How auto-approval decides
Modelled on Claude Code's auto mode, Codex's `is_known_safe_command` and anumati, but **deterministic** (no model call, no network, no cost on your subscription). The model's own justification text is *not* trusted — only the sandbox level it asks for and the command itself.

| Verdict | Meaning | Examples |
|---|---|---|
| **allow** | every part of the command is provably read-only or contained in the project | `ls`, `cat`, `rg`, `git status/log/diff/show/blame/fetch`, `gh run view … \| grep`, `git add/commit/switch`, `echo > file` (inside project), `npm test`, `npx tsc`, `cargo test`, `pytest`, public `curl https://… ` GET |
| **ask** | not recognised / has an effect we can't prove harmless — you decide | `git push`, `git pull`, `npm install`, `./script.sh`, `node x.js`, `$(…)`, here-docs, background jobs |
| **deny** | irreversible, shared-state, secret or system-level — always asks you, **even in Aggressive** | `rm -r/-f`, `git push --force` / to main, `git reset --hard`, `git clean`, `sudo`, `chmod -R`, anything touching `.env`/`.ssh`/keys, `curl -d`, `ssh`/`scp`, `eval`, `… \| sh`, `npm publish`, `terraform apply`, `kubectl delete`, `docker run`, cloud CLIs, `DROP TABLE` |

Rules: a chain (`&&`, `;`, `\|`) is judged by its **worst** part; command substitution/here-docs/process substitution can't be checked, so they ask; redirects may only write inside the project; asking the sandbox for *more* access (full access / network) is only accepted for pure reads (e.g. reading a CI log through the GitHub API).
- **Auto (safe)** approves `allow` only. **Auto (aggressive)** approves `allow` and `ask`, never `deny`. Aggressive is never persisted (resets on restart).
- Source: `lib/classify.cjs` (also inlined into `client.js`); tests: `node test/classify.test.cjs` (166 cases).

### Bundled fonts
The five fonts ship inside this package (`fonts/*.woff2`, ~1.1 MB, from [Fontsource](https://fontsource.org)) and are served by the plugin's host half at `/plugins/dsh-majed/fonts/`, so they work offline and on paired phones. Subsets: Latin + Latin-Ext for all, **Arabic** for Noto Sans and IBM Plex Sans, Hebrew for Open Sans. Inter, Roboto and Open Sans have no Arabic glyphs, so Arabic text falls back to the system font — pick **Noto Sans** or **IBM Plex Sans** for Arabic/Persian. All licensed under the SIL Open Font License 1.1 (licenses in `fonts/LICENSE-*.txt`). Needs an app restart after install (the plugin now has a host half).

### Styling note
All text in this plugin's own UI (settings rows, dropdowns, toast, Approvals control) uses DSH's design tokens (`font: var(--dsw-font-s-14)` etc.), never hard-coded px, so it follows the **App UI font size** exactly like built-in rows.

### For plugin authors
`window.__dshMajed.accountMenu.register({ id, label, icon /* svg markup */, order, onSelect })` adds an item to the account menu and returns an unregister function.

Settings are stored per-browser/desktop profile in `localStorage` (`dsh-majed:settings:v1`).

## Install

Via the Plugins page, or:

```sh
dsh plugin install github:majedsiefalnasr/dsh-majed
```

Then remove `dsh-persian-rtl` (this plugin supersedes it). After installing or updating, fully restart DSH: newly added component rows do not appear through in-place discovery without a restart (Owner-verified).

## Roadmap
More Settings ▸ General options will be added here over time.

## Credits
Chat direction CSS/logic adapted from [dsh-persian-rtl](https://github.com/ireza7/dsh-persian-rtl) (MIT).

## License
MIT
