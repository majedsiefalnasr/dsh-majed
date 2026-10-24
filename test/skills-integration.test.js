import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { isLoopbackPeer } from '../modules/skills/loopback.js';
import { registerSkills, skillsEnabled } from '../modules/skills/index.js';

test('Skills defaults off and requires explicit standalone conflict acknowledgement', () => {
  assert.equal(skillsEnabled(), false);
  assert.equal(skillsEnabled({ skills: { enabled: 'true' } }), false);
  assert.throws(() => skillsEnabled({ skills: { enabled: true } }), /conflict check/);
  assert.equal(skillsEnabled({ skills: { enabled: true, standaloneDisabled: true } }), true);
});
test('disabled integration never loads vendor or injects state services', () => {
  let loaded = false;
  const injected = [];
  registerSkills({ inject(names) { injected.push(names); } }, {}, () => { loaded = true; });
  assert.equal(loaded, false);
  assert.deepEqual(injected, [['connection']]);
});
test('gate route is uncached, method limited and does not expose state', async () => {
  let route;
  registerSkills({ inject(names, run) { run({ reflect: { get: () => ({ fetch: { register(value) { route = value; } } }) } }); } });
  const response = route.fetch(new Request('https://host/api/dsh-majed/skills/status'));
  assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { enabled: false });
  assert.deepEqual(route.methods, ['GET', 'HEAD']);
  assert.equal(await route.fetch(new Request('https://host' + route.path, { method: 'HEAD' })).text(), '');
});
test('enabled integration defers apply and ignores pending import after disposal', async () => {
  let callback, finish, applied = 0, dispose;
  registerSkills({ inject(names, run) { if (names.includes('skills')) callback = run; } }, { skills: { enabled: true, standaloneDisabled: true } }, () => new Promise(resolve => { finish = resolve; }));
  const pending = callback({ effect(fn) { dispose = fn(); } });
  dispose(); await Promise.resolve(); finish({ apply() { applied++; } }); await new Promise(resolve => setImmediate(resolve));
  assert.equal(applied, 0);
});
test('bundle registers distinct internal factory and preserves original factory', async () => {
  const source = await readFile(new URL('../client-bundle.js', import.meta.url), 'utf8');
  const modules = [];
  vm.runInNewContext(source, { window: { __ModuleLoader__: { load(value) { modules.push(value); } } } });
  assert.deepEqual(modules.map(x => x.id), ['dsh-majed/internal/skills', 'dsh-majed/internal/managers', 'dsh-majed']);
  assert.doesNotMatch(source, /a\.effect\(function\(\)\{return ur\(\{endpoint:/);
  const host = await readFile(new URL('../modules/skills/vendor/lib/index.js', import.meta.url), 'utf8');
  assert.doesNotMatch(host, /registerPluginUpdater/);
});
test('vendor retains original state paths and provider identity', async () => {
  // Offline fixture contract checks stable paths without reading actual user state.
  const source = await readFile(new URL('../modules/skills/vendor/lib/core.js', import.meta.url), 'utf8');
  assert.match(source, /join\(resolveDshHome\(\), "skills-manager"\)/);
  assert.match(source, /join\(managerHomePath\(\), "state.json"\)/);
  assert.match(source, /provider: "dsh-skills-manager-external"/);
});

test('Skills socket peer gate ignores spoofed Host and forwarding headers', async () => {
  for (const peer of ['127.0.0.1', '127.10.20.30', '::1', '::ffff:127.0.0.1']) assert.equal(isLoopbackPeer({ socket: { remoteAddress: peer } }), true);
  for (const peer of [undefined, '192.168.1.3', '8.8.8.8', '::ffff:192.168.1.3', '127.0.0.999', 'localhost']) {
    assert.equal(isLoopbackPeer({ socket: { remoteAddress: peer }, headers: { host: 'localhost', 'x-forwarded-for': '127.0.0.1' } }), false);
  }
  const host = await readFile(new URL('../modules/skills/vendor/lib/index.js', import.meta.url), 'utf8');
  const handler = host.slice(host.indexOf('handler: async (req, res) => {'));
  assert.ok(handler.indexOf('if (!isLoopbackPeer(req))') < handler.indexOf('const u = new URL'));
});
