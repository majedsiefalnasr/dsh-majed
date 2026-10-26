import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerNativeReadPage, MAX_CONTENT_CHARS } from '../lib/read-page-native.js';
import { apply } from '../index.js';

const good = (kind = 'text', text = 'SAFE final text') => ({ isError: false,
  value: { url: 'https://example.com/', statusCode: 200, body: { kind, content: 'RAW DO NOT USE' }, truncated: false },
  content: [{ type: 'text', text }] });
function fixture(execute = async () => good()) {
  let hook; let calls = []; let fallback = 0;
  const ctx = { tools: { execute: async input => { calls.push(input); return execute(input); } },
    on(name, fn) { assert.equal(name, 'tools/execute'); hook = fn; return () => { hook = undefined; }; } };
  const dispose = registerNativeReadPage(ctx);
  const controller = new AbortController();
  const exec = { name: 'read_page', arguments: { url: 'https://example.com/' }, agent: {}, token: {},
    callId: 'outer', rootCallId: 'root', signal: controller.signal };
  return { ctx, exec, calls, controller, dispose, run: () => hook ? hook(exec, () => { fallback++; return 'original'; }) : 'unhooked', fallback: () => fallback };
}
test('nested registry dispatch retains parent, agent, root and signal with unique child ID', async () => {
  const f = fixture(); await f.run(); await f.run();
  const a = f.calls[0]; assert.equal(a.name, 'web_fetch'); assert.deepEqual(a.arguments, f.exec.arguments);
  assert.equal(a.parent, f.exec.token); assert.equal(a.agent, f.exec.agent); assert.equal(a.rootCallId, 'root');
  assert.equal(a.signal, f.exec.signal); assert.notEqual(a.callId, 'outer'); assert.notEqual(a.callId, f.calls[1].callId);
  assert.equal(f.fallback(), 0);
});
for (const kind of ['text', 'html']) test(`${kind} uses final native rendered content, never raw body`, async () => {
  const f = fixture(async () => good(kind)); const r = await f.run();
  assert.equal(r.isError, false); assert.equal(r.value.summary, ''); assert.deepEqual(r.value.links, []);
  assert.match(r.value.content, /untrusted data/); assert.match(r.value.content, /SAFE final text/);
  assert.doesNotMatch(r.value.content, /RAW DO NOT USE/);
  assert.ok(r.value.uncertainty.every(x => typeof x === 'string'));
});
for (const code of ['NETWORK_DENIED', 'UNKNOWN_TOOL', 'ABORTED', 'ABORTED_BEFORE_DISPATCH']) test(`${code} propagates exact native error without fallback`, async () => {
  const denied = { isError: true, error: { message: 'native denied', info: { name: 'NativeError', code } }, content: [{ type: 'text', text: 'denied' }] };
  const f = fixture(async () => denied); assert.equal(await f.run(), denied); assert.equal(f.fallback(), 0); assert.equal(f.calls.length, 1);
});
test('cancellation reaches nested dispatch unchanged', async () => {
  const f = fixture(async input => { assert.equal(input.signal.aborted, true); return { isError: true, content: [], error: { message: 'cancelled' } }; });
  f.controller.abort(); assert.equal((await f.run()).isError, true); assert.equal(f.fallback(), 0);
});
test('in-flight cancellation is forwarded', async () => {
  const f = fixture(input => new Promise(resolve => input.signal.addEventListener('abort', () => resolve({ isError: true, content: [], error: { message: 'cancelled' } }), { once: true })));
  const p = f.run(); f.controller.abort(); assert.equal((await p).error.message, 'cancelled');
});
test('missing native execute contract fails closed', async () => {
  const f = fixture(); f.ctx.tools.execute = undefined;
  assert.equal((await f.run()).error.info.code, 'NATIVE_FETCH_UNAVAILABLE'); assert.equal(f.fallback(), 0);
});
test('native thrown errors propagate, no fallback', async () => {
  const error = new Error('native gate failed'); const f = fixture(async () => { throw error; });
  await assert.rejects(f.run(), e => e === error); assert.equal(f.fallback(), 0);
});
for (const status of [301, 403, 500]) test(`HTTP ${status} is an explicit failure`, async () => {
  const f = fixture(async () => { const r = good(); r.value.statusCode = status; return r; });
  const r = await f.run(); assert.equal(r.error.info.code, 'HTTP_STATUS'); assert.match(r.error.message, new RegExp(String(status))); assert.equal(f.fallback(), 0);
});
test('query honest, truncation bounded and disclosed', async () => {
  const f = fixture(async () => good('text', 'x'.repeat(MAX_CONTENT_CHARS + 100)));
  f.exec.arguments.query = 'specific question'; const r = await f.run();
  assert.ok(r.value.content.length < MAX_CONTENT_CHARS + 100);
  assert.ok(r.value.warnings.some(x => x.includes('not processed'))); assert.ok(r.value.warnings.some(x => x.includes('truncated')));
  assert.deepEqual(f.calls[0].arguments, { url: f.exec.arguments.url });
});
test('malformed native output fails closed', async () => {
  const f = fixture(async () => ({ isError: false, content: [] }));
  assert.equal((await f.run()).error.info.code, 'INVALID_NATIVE_FETCH_OUTPUT');
});
test('unrelated tools delegate unchanged and disposal removes hook', async () => {
  const f = fixture(); f.exec.name = 'x_search'; assert.equal(await f.run(), 'original'); assert.equal(f.calls.length, 0);
  f.dispose(); assert.equal(await f.run(), 'unhooked');
});
for (const url of ['file:///tmp/x', 'https://user:pass@example.com', 'nonsense']) test(`invalid URL ${url} never dispatches`, async () => {
  const f = fixture(); f.exec.arguments.url = url;
  assert.equal((await f.run()).error.info.code, 'INVALID_ARGUMENT'); assert.equal(f.calls.length, 0);
});
test('mock registry gates outer and nested calls before around dispatch', async () => {
  let hook; const gated = []; let cli = 0; let native = 0; let deniedName = 'read_page';
  const denied = { isError: true, content: [{ type: 'text', text: 'policy denied' }], error: { message: 'policy denied' } };
  const ctx = { on(_name, fn) { hook = fn; }, tools: { async execute(exec) {
    gated.push(exec.name);
    // Models the installed registry prepareExecution pre-policy + guard stage.
    if (exec.name === deniedName) return denied;
    return hook(exec, async () => {
      if (exec.name === 'read_page') { cli++; throw new Error('CLI must not run'); }
      native++; return good();
    });
  } } };
  registerNativeReadPage(ctx);
  const exec = { name: 'read_page', arguments: { url: 'https://example.com' }, token: {}, agent: {}, signal: new AbortController().signal, callId: 'root' };
  assert.equal(await ctx.tools.execute(exec), denied); assert.deepEqual(gated, ['read_page']);
  deniedName = 'web_fetch'; gated.length = 0;
  assert.equal(await ctx.tools.execute(exec), denied); assert.deepEqual(gated, ['read_page', 'web_fetch']);
  deniedName = ''; gated.length = 0;
  assert.equal((await ctx.tools.execute(exec)).isError, false); assert.deepEqual(gated, ['read_page', 'web_fetch']);
  assert.equal(cli, 0); assert.equal(native, 1);
});

test('plugin apply mounts tools hook through service injection and preserves font injection', () => {
  const injections = []; let hooks = 0;
  apply({ inject(names, callback) { injections.push(names); if (names.length === 1 && names[0] === 'tools') callback({ on(name) { assert.equal(name, 'tools/execute'); hooks++; } }); } });
  assert.ok(injections.some(names => names.length === 1 && names[0] === 'tools'));
  assert.ok(injections.some(names => names.length === 1 && names[0] === 'webServer'));
  assert.ok(injections.every(names => names.length === 1 && ['tools', 'webServer', 'connection'].includes(names[0])));
  assert.equal(hooks, 1);
});
