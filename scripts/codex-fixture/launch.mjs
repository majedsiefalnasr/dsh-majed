// Run with `node scripts/codex-fixture/launch.mjs new` or `restart <owned-run>`.
import { mkdtemp, mkdir, readFile, writeFile, realpath, lstat, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, resolve, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
const root = await realpath(fileURLToPath(new URL('../../', import.meta.url)));
const temp = await realpath(tmpdir());
const electron = '/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness';
const cli = '/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh/lib/bin.js';
const [mode, supplied, ...extra] = process.argv.slice(2);
if (extra.length || !['new', 'restart'].includes(mode) || (mode === 'new' && supplied) || (mode === 'restart' && !supplied)) throw new Error('usage: launch.mjs new | restart <owned-run>');
let run;
if (mode === 'new') {
  run = await mkdtemp(join(temp, 'majed-codex-browser-'));
  for (const leaf of ['home', 'dsh', 'tmp', 'work', 'cache', 'plugin']) await mkdir(join(run, leaf), { mode: 0o700 });
  await writeFile(join(run, 'owner.json'), JSON.stringify({ version: 1, root, run }), { mode: 0o600 });
  const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  // Keep the actual Majed metadata, name, exports and browser payload. Only the
  // temporary host entry is composed; no replacement browser implementation.
  await writeFile(join(run, 'plugin', 'package.json'), JSON.stringify(pkg), { mode: 0o600 });
  for (const leaf of ['dist', 'locale', 'fonts', 'icon.svg', 'client.js', 'modules']) await symlink(join(root, leaf), join(run, 'plugin', leaf));
  await readFile(join(root, 'dist/client.js')); // Missing build is a hard failure.
  const entry = `import { apply as product } from ${JSON.stringify(pathToFileURL(join(root, 'index.js')).href)};\nimport { createFixtureFetch } from ${JSON.stringify(pathToFileURL(join(root, 'scripts/codex-fixture/transport.mjs')).href)};\nconst transport = createFixtureFetch();\nexport function apply(ctx) { product(ctx, { codexAccounts: { fetch: transport.fetch, ports: [0], path: ${JSON.stringify(join(run, 'dsh/fixture-auth.json'))}, catalogPath: ${JSON.stringify(join(run, 'dsh/fixture-catalog.json'))} } }); ctx.effect(() => () => { console.info('Synthetic fixture counters:', JSON.stringify(transport.counters())); console.info('Synthetic fixture wire settings:', JSON.stringify(transport.observations())); }, 'fixture counters'); }\n`;
  await writeFile(join(run, 'plugin/index.js'), entry, { mode: 0o600 });
  const disabled = ['session-telemetry-otel', 'desktop-product-telemetry', 'product-analytics', 'session-title-llm', 'llm-pi-ai', 'llm-deepseek', 'llm-deepseek-account'];
  await writeFile(join(run, 'fixture.patch.yml'), disabled.map(id => `- id: ${id}\n  disabled: true\n`).join('') + `- insert:\n    - id: majed\n      name: ${JSON.stringify(join(run, 'plugin/index.js'))}\n`, { mode: 0o600 });
} else {
  run = resolve(supplied);
  if (dirname(run) !== temp || !/^majed-codex-browser-[A-Za-z0-9]+$/.test(basename(run)) || await realpath(run) !== run || !(await lstat(run)).isDirectory()) throw new Error('unsafe fixture run');
  const owner = JSON.parse(await readFile(join(run, 'owner.json'), 'utf8'));
  if (owner.version !== 1 || owner.root !== root || owner.run !== run) throw new Error('foreign fixture run');
  for (const leaf of ['home', 'dsh', 'tmp', 'work', 'cache', 'plugin']) if (await realpath(join(run, leaf)) !== join(run, leaf)) throw new Error('unsafe fixture child');
  try { const pid = Number(await readFile(join(run, 'host.pid'), 'utf8')); process.kill(pid, 0); throw new Error('fixture host still running'); }
  catch (error) { if (error.code !== 'ESRCH') throw error; }
}
console.info('Owned fixture run:', run);
console.info('Startup URL is private authentication material: inspect host.log locally; never share it.');
const { open } = await import('node:fs/promises');
const log = await open(join(run, 'host.log'), 'a', 0o600);
const child = spawn(electron, [cli, 'web', '--patch', join(run, 'fixture.patch.yml'), '--no-open', '--host', '127.0.0.1', '--port', '0'], {
  cwd: join(run, 'work'), env: { HOME: join(run, 'home'), DSH_HOME: join(run, 'dsh'), TMPDIR: join(run, 'tmp'), XDG_CACHE_HOME: join(run, 'cache'), PATH: '/usr/bin:/bin', ELECTRON_RUN_AS_NODE: '1', DSH_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', log.fd, log.fd],
});
await writeFile(join(run, 'host.pid'), String(child.pid), { mode: 0o600 });
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => child.kill(signal));
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', (code, signal) => { console.info('Fixture host exited:', code ?? signal); process.exitCode = code ?? (signal === 'SIGTERM' || signal === 'SIGINT' ? 0 : 1); void log.close(); });
