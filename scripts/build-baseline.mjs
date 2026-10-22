import { mkdir, readFile, writeFile } from 'node:fs/promises';

// Explicitly include only the accepted client. Never scan prototype modules.
const root = new URL('../', import.meta.url);
const source = await readFile(new URL('client.js', root));
await mkdir(new URL('dist/', root), { recursive: true });
await writeFile(new URL('dist/client.js', root), source);
