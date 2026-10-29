import { readFile, writeFile } from 'node:fs/promises';
// One browser half and loader registration; embed the module closure, never a dynamic import.
await writeFile(new URL('../dist/client.js', import.meta.url),
  (await readFile(new URL('../client.js', import.meta.url), 'utf8')).replace(
    '    const React = require(\'react\');',
    (await readFile(new URL('../dist/subscriptions-client.js', import.meta.url), 'utf8')) +
    '\n    const subscriptions = majedSubscriptionsFactory(require);\n    const React = require(\'react\');'));
