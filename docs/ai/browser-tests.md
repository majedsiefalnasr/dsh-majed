# Opt-in real-browser tests

`npm run test:browser` (after `npm run build`) serves the built `dist/client.js` with the real skills route and drives it in Chromium. Playwright is resolved dynamically (`WAYCRAFT_PLAYWRIGHT` module directory, else `playwright`/`playwright-core`); without it, or without a launchable Chromium (`WAYCRAFT_CHROMIUM`), the suite prints a skip reason and exits 0. `npm test` never runs it. See `docs/RELEASING.md`.
