import { mkdir, readFile, writeFile } from 'node:fs/promises';

// Explicitly include only the accepted client. Never scan prototype modules.
const root = new URL('../', import.meta.url);
const ui = await readFile(new URL('modules/subscriptions/ui/bundle.js', root), 'utf8');
const source = (await readFile(new URL('client.js', root), 'utf8')).replace('/* SUBSCRIPTIONS_UI_BUNDLE */', ui.replace('const React = require("react");', '').replaceAll('__require("react")', 'React'));
await mkdir(new URL('dist/', root), { recursive: true });
await writeFile(new URL('dist/client.js', root), source);
