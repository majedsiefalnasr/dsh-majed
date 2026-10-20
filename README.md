# dsh-majed

Majed's toolkit plugin for **DeepSeek Harness (DSH)**. It never patches DSH itself — everything is added through public client extension points when the plugin is enabled, and removed again when it is disabled.

## Features

| Where | Feature |
|---|---|
| Settings ▸ General ▸ **Bidirectional text** (toggle) | Per-paragraph RTL/LTR for Arabic, Persian and Hebrew in chat answers, reasoning, tool cells, question boxes and user bubbles; mirrors [`@changfenhuang/dsh-genui`](https://www.npmjs.com/package/@changfenhuang/dsh-genui) components (lists, steps, tables, timelines, switches, chevrons, progress markers…). Replaces `dsh-persian-rtl`. |
| Settings ▸ General ▸ **App UI font size** (px stepper, 11–20, default 14) | Font size of the app interface (sidebar, headers, composer, side panels). The built-in *chat* font size is untouched. |
| Settings ▸ General ▸ **App font** (dropdown) | `DSH default` or `System font` (`system-ui`) for the whole app interface and chat text. |
| Settings ▸ General ▸ **System notifications** (dropdown: Off / Only when app is in background / Always, + *Send test*) | Native desktop notification when a session **finishes** or **needs you** (tool approval, question, plan review). Two toggles choose which events notify. Clicking a notification focuses the app and opens that session. While the app is focused a notification (only possible in *Always* mode) is shown **silently**; in the background it is audible. |
| Settings ▸ General ▸ **Group sidebar actions in account menu** (toggle, on by default) | Sidebar footer buttons added by plugins (e.g. *Remote access*, Cordis) move **into the account menu** (Settings / Feedback / Sign out) instead of sitting beside it. |
| Settings ▸ General ▸ **Copy on select** (toggle, off by default) | Text you select in the app is copied to the clipboard automatically when you release the mouse or finish a keyboard selection. A "Copied to clipboard" toast confirms each copy. Selections inside input fields, the composer and the terminal are ignored. |

### For plugin authors
`window.__dshMajed.accountMenu.register({ id, label, icon /* svg markup */, order, onSelect })` adds an item to the account menu and returns an unregister function.

Settings are stored per-browser/desktop profile in `localStorage` (`dsh-majed:settings:v1`).

## Install

Via the Plugins page, or:

```sh
dsh plugin install github:majedsiefalnasr/dsh-majed
```

Then remove `dsh-persian-rtl` (this plugin supersedes it) and restart DSH.

## Roadmap
More Settings ▸ General options will be added here over time.

## Credits
Chat direction CSS/logic adapted from [dsh-persian-rtl](https://github.com/ireza7/dsh-persian-rtl) (MIT).

## License
MIT
