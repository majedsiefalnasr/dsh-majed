import { readFile, mkdir, writeFile } from 'node:fs/promises';
// The 0.2.0 test expects this adapter; exercise the unchanged embedded classifier.
const source = await readFile(new URL('../client.js', import.meta.url), 'utf8');
const start = source.indexOf('const CLASSIFY = (function () {');
const end = source.indexOf('    })();', start) + '    })();'.length;
if (start < 0 || end < start) throw new Error('Cannot locate baseline classifier');
await mkdir(new URL('../lib/', import.meta.url), { recursive: true });
await writeFile(new URL('../lib/classify.cjs', import.meta.url), source.slice(start, end) + '\nmodule.exports = CLASSIFY;\n');
