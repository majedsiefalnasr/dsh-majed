# dsh-majed

Majed's toolkit plugin for **DeepSeek Harness (DSH)**. It never patches DSH itself — everything is added through public client extension points when the plugin is enabled, and removed again when it is disabled.

## Features

| Where | Feature |
|---|---|
| Settings ▸ General ▸ **Bidirectional text** (toggle) | Per-paragraph RTL/LTR for Arabic, Persian and Hebrew in chat answers, reasoning, tool cells, question boxes and user bubbles; mirrors [`@changfenhuang/dsh-genui`](https://www.npmjs.com/package/@changfenhuang/dsh-genui) components (lists, steps, tables, timelines, switches, chevrons, progress markers…). Replaces `dsh-persian-rtl`. |
| Settings ▸ General ▸ **App UI font size** (stepper, 80–150 %) | Scales the app interface (sidebar, headers, composer, side panels). The built-in *chat* font size is untouched. |

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
