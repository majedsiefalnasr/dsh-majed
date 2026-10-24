import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const skills = await readFile(new URL('modules/skills/vendor/lib/client.js', root), 'utf8');
const managers = await readFile(new URL('modules/managers/client.js', root), 'utf8');
const client = await readFile(new URL('client.js', root), 'utf8');
// Register the internal factory before the original toolkit factory. Neither registration applies it.
await writeFile(new URL('client-bundle.js', root), skills + '\n' + managers + '\n' + client);
