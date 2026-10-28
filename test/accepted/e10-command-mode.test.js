import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Context } from '@deepseek-ai/cordis';
import { createBaselineHarness, SETTINGS_KEY } from './helpers/baseline-client-harness.js';
import { applyCommandMode, COMMAND_MODE_PATH } from '../../modules/command-mode/index.js';

// Exact Fetch registration seam. Native BrowserAuth + Owner admission happens in
// the host Connection BEFORE delivery and is not simulated here; this suite proves
// what the handler does with admitted requests and that it keeps state in memory.
async function mount(t, live = new Set(['s1', 's2'])) {
  const ctx = new Context();
  let route;
  ctx.provide('connection', { fetch: { register(value) { route = value; } } });
  ctx.provide('sessions', { get: id => live.has(id) ? { header: { id } } : undefined });
  const fiber = ctx.plugin({ apply: applyCommandMode }); await fiber;
  const call = async (payload, init = {}) => {
    const response = await route.fetch(new Request('http://fixture' + COMMAND_MODE_PATH, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'client-request', rpcId: 'r1', method: 'majed/command-mode', payload }), ...init,
    }));
    return { response, body: await response.json() };
  };
  t.after(() => fiber.dispose());
  return { ctx, route, live, call, fiber };
}

test('setting a session mode through the exact route changes host state visible to every reader', async t => {
  const { route, call } = await mount(t);
  assert.equal(route.path, COMMAND_MODE_PATH);
  assert.deepEqual(route.methods, ['POST']);
  assert.deepEqual((await call({ action: 'snapshot' })).body.result, { ok: true, value: { modes: {} } });
  const set = await call({ action: 'set', sessionId: 's1', mode: 'safe' });
  assert.deepEqual(set.body.result, { ok: true, value: { modes: { s1: 'safe' } } });
  assert.equal(set.response.headers.get('cache-control'), 'no-store');
  assert.deepEqual((await call({ action: 'snapshot' })).body.result.value, { modes: { s1: 'safe' } });
});

test('invalid mode, unknown session, extra fields, wrong content type and oversize body are rejected without mutation', async t => {
  const { call, route } = await mount(t);
  await call({ action: 'set', sessionId: 's1', mode: 'safe' });
  const code = result => result.body.result?.error?.code;
  assert.equal(code(await call({ action: 'set', sessionId: 's1', mode: 'root' })), 'invalid_request');
  assert.equal(code(await call({ action: 'set', sessionId: 'closed', mode: 'safe' })), 'session_not_found');
  assert.equal(code(await call({ action: 'set', sessionId: '../x', mode: 'safe' })), 'invalid_request');
  assert.equal(code(await call({ action: 'set', sessionId: 's2', mode: 'safe', extra: 1 })), 'invalid_request');
  assert.equal(code(await call({ action: 'wipe' })), 'invalid_request');
  const wrongType = await route.fetch(new Request('http://fixture' + COMMAND_MODE_PATH, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: '{}' }));
  assert.equal(wrongType.status, 415);
  const huge = await route.fetch(new Request('http://fixture' + COMMAND_MODE_PATH, { method: 'POST', headers: { 'content-type': 'application/json' }, body: 'x'.repeat(5000) }));
  assert.equal(huge.status, 413);
  const get = await route.fetch(new Request('http://fixture' + COMMAND_MODE_PATH, { method: 'GET' }));
  assert.equal(get.status, 405);
  assert.deepEqual((await call({ action: 'snapshot' })).body.result.value, { modes: { s1: 'safe' } }, 'rejections never changed host state');
});

test('Ask me deletes the entry, closed sessions lose authority, and error bodies carry no native detail', async t => {
  const { call, live } = await mount(t);
  await call({ action: 'set', sessionId: 's1', mode: 'aggressive' });
  await call({ action: 'set', sessionId: 's2', mode: 'safe' });
  assert.deepEqual((await call({ action: 'set', sessionId: 's1', mode: 'ask' })).body.result.value, { modes: { s2: 'safe' } });
  live.delete('s2');
  assert.deepEqual((await call({ action: 'snapshot' })).body.result.value, { modes: {} });
  live.add('s2');
  assert.deepEqual((await call({ action: 'snapshot' })).body.result.value, { modes: {} }, 'a reopened id does not revive authority');
  const failed = await call({ action: 'set', sessionId: 'closed', mode: 'safe' });
  assert.deepEqual(failed.body.result, { ok: false, error: { code: 'session_not_found', message: 'session_not_found', details: {} } });
});

test('host disposal and a fresh mount start every session at Ask me and write nothing to disk', async t => {
  const home = mkdtempSync(join(tmpdir(), 'e10-home-'));
  const previous = process.env.DSH_HOME; process.env.DSH_HOME = home;
  t.after(() => { if (previous === undefined) delete process.env.DSH_HOME; else process.env.DSH_HOME = previous; rmSync(home, { recursive: true, force: true }); });
  const { call, fiber } = await mount(t);
  await call({ action: 'set', sessionId: 's1', mode: 'aggressive' });
  await fiber.dispose();
  const again = await mount(t);
  assert.deepEqual((await again.call({ action: 'snapshot' })).body.result.value, { modes: {} });
  assert.deepEqual(readdirSync(home), [], 'mode state is never persisted');
});

// ---- Browser half: mounted built client against a fake host that shares state. ----
const source = readFileSync(new URL('../../dist/client.js', import.meta.url), 'utf8');
const isMenu = node => node.type === 'fixture-menu';
const tick = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };

/** Two clients (devices) can share one fake host; `down` makes every call fail. */
function fakeHost(initial = {}) {
  const host = { modes: { ...initial }, down: false, calls: [] };
  host.connection = { rpc: { async call(base, method, payload) {
    host.calls.push([method, payload]);
    if (host.down) throw new Error('HTTP 503');
    assert.equal(method, 'majed/command-mode');
    if (payload.action === 'set') { if (payload.mode === 'ask') delete host.modes[payload.sessionId]; else host.modes[payload.sessionId] = payload.mode; }
    return { ok: true, value: { modes: { ...host.modes } } };
  } } };
  return host;
}
function device(t, host, options = {}) {
  const harness = createBaselineHarness(source, { connection: host.connection, ...options });
  t.after(() => harness.dispose());
  harness.apply();
  return harness;
}

test('a stale elevated localStorage value never restores authority; the host decides, and a refresh shows the actual host state', async t => {
  const host = fakeHost();
  const stale = { autoApprove: { s1: 'safe' }, bidi: false };
  const first = device(t, host, { stored: stale });
  const view = first.render('majed-auto-approve', { sessionId: 's1' });
  await tick();
  assert.equal(view.render().one(isMenu).props.selectedId, 'ask', 'host says ask, stale local safe is ignored');
  host.modes.s1 = 'safe';
  first.runTimers(5000); await tick();
  assert.equal(view.render().one(isMenu).props.selectedId, 'safe', 'a change made elsewhere is observed by the poll');
  assert.equal(JSON.parse(first.storage.get(SETTINGS_KEY)).autoApprove, undefined, 'stale authority is scrubbed and host state is never written to browser storage');
  assert.equal(JSON.parse(first.storage.get(SETTINGS_KEY)).bidi, false, 'other settings are kept');
  const refreshed = device(t, host, { stored: first.storage.get(SETTINGS_KEY) });
  const reloaded = refreshed.render('majed-auto-approve', { sessionId: 's1' });
  await tick();
  assert.equal(reloaded.render().one(isMenu).props.selectedId, 'safe');
});

const choose = (view, mode) => { view.one(isMenu).props.onSelect(mode); view.render(); };

test('choosing a mode writes through the host and a second device observes it; aggressive still needs confirmation', async t => {
  const host = fakeHost();
  let allow = false;
  const a = device(t, host, { confirm: () => allow });
  const b = device(t, host);
  const viewA = a.render('majed-auto-approve', { sessionId: 's1' });
  const viewB = b.render('majed-auto-approve', { sessionId: 's1' });
  await tick();
  choose(viewA, 'aggressive');
  await tick();
  assert.equal(a.confirms.length, 1);
  assert.equal(host.modes.s1, undefined, 'declined confirmation sends nothing to the host');
  allow = true;
  choose(viewA, 'aggressive'); await tick();
  assert.equal(host.modes.s1, 'aggressive');
  assert.equal(viewA.render().one(isMenu).props.selectedId, 'aggressive');
  assert.equal(viewB.render().one(isMenu).props.selectedId, 'ask', 'device B has not polled yet');
  b.runTimers(5000); await tick();
  assert.equal(viewB.render().one(isMenu).props.selectedId, 'aggressive', 'device B observes the actual host state');
  choose(viewA, 'ask'); await tick();
  assert.equal(host.modes.s1, undefined);
  b.runTimers(5000); await tick();
  assert.equal(viewB.render().one(isMenu).props.selectedId, 'ask');
});

test('an unreachable or failing host shows Ask me, never the last known elevated mode', async t => {
  const host = fakeHost({ s1: 'safe' });
  const d = device(t, host);
  const view = d.render('majed-auto-approve', { sessionId: 's1' });
  await tick();
  assert.equal(view.render().one(isMenu).props.selectedId, 'safe');
  host.down = true;
  d.runTimers(5000); await tick();
  assert.equal(view.render().one(isMenu).props.selectedId, 'ask');
  host.down = false;
  d.runTimers(5000); await tick();
  assert.equal(view.render().one(isMenu).props.selectedId, 'safe', 'recovery reflects the actual host state');
  const noRpc = device(t, { connection: undefined });
  const bare = noRpc.render('majed-auto-approve', { sessionId: 's1' });
  await tick();
  assert.equal(bare.render().one(isMenu).props.selectedId, 'ask');
});

test('the approver answers only while the host says safe/aggressive, and three hand-backs reset through the host', async t => {
  const host = fakeHost();
  const d = device(t, host);
  const answers = [];
  let pending;
  const useSessionStatus = selector => selector(new Map([['s1', { pendingInteraction: pending }]]));
  const useChat = selector => selector({ nodes: new Map() });
  const watcher = d.render('majed-auto-approver', { sessionId: 's1', useSessionStatus, useChat });
  await tick();
  const offer = (key, toolName) => { pending = { key, callId: key, kind: 'approval', toolName, answerable: true, answer: outcome => answers.push([key, outcome]) }; watcher.render(); };
  offer('while-ask', 'read'); await tick();
  assert.equal(answers.length, 0, 'Ask me never auto-answers');
  host.modes.s1 = 'safe';
  d.runTimers(5000); await tick(); watcher.render();
  offer('host-safe', 'read'); await tick();
  assert.deepEqual(answers.filter(([key]) => key === 'host-safe'), [['host-safe', 'allowed-once']]);
  host.modes.s1 = 'ask'; // elevated locally cached state must lose to the host re-check
  offer('revoked-elsewhere', 'read'); await tick();
  assert.equal(answers.length, 1, 'authority revoked on another device is honoured before answering');
  host.modes.s1 = 'safe';
  d.runTimers(5000); await tick();
  for (const key of ['u1', 'u2', 'u3']) { offer(key, 'unrecognized-tool'); await tick(); }
  assert.equal(host.modes.s1, undefined, 'hand-backs reduce authority on the host');
  assert.ok(host.calls.some(([, p]) => p.action === 'set' && p.mode === 'ask'));
});

test('without the native sessions service the route fails closed and mutates nothing', async t => {
  const ctx = new Context();
  let route;
  ctx.provide('connection', { fetch: { register(value) { route = value; } } });
  const fiber = ctx.plugin({ apply: applyCommandMode }); await fiber;
  t.after(() => fiber.dispose());
  const post = payload => route.fetch(new Request('http://fixture' + COMMAND_MODE_PATH, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'client-request', rpcId: 'r1', method: 'majed/command-mode', payload }) }));
  const denied = await (await post({ action: 'set', sessionId: 's1', mode: 'aggressive' })).json();
  assert.equal(denied.result.error.code, 'scope_unavailable');
  ctx.provide('sessions', { get: id => id === 's1' ? { header: { id } } : undefined });
  assert.deepEqual((await (await post({ action: 'snapshot' })).json()).result.value, { modes: {} });
});

test('host disposal resets the in-memory map itself, not only the route', async t => {
  const ctx = new Context();
  ctx.provide('connection', { fetch: { register() {} } });
  ctx.provide('sessions', { get: id => ({ header: { id } }) });
  let modes;
  const fiber = ctx.plugin({ apply: c => { modes = applyCommandMode(c); } }); await fiber;
  modes.set('s1', 'aggressive');
  assert.equal(modes.get('s1'), 'aggressive');
  assert.equal(modes.get('new-session'), 'ask', 'a new session starts at Ask me');
  await fiber.dispose();
  assert.equal(modes.get('s1'), 'ask');
});

test('reading authority itself fences a closed session, so a reopened id is Ask me without any snapshot', async t => {
  const live = new Set(['s1']);
  const ctx = new Context();
  ctx.provide('connection', { fetch: { register() {} } });
  ctx.provide('sessions', { get: id => live.has(id) ? { header: { id } } : undefined });
  let modes;
  const fiber = ctx.plugin({ apply: c => { modes = applyCommandMode(c); } }); await fiber;
  t.after(() => fiber.dispose());
  modes.set('s1', 'aggressive');
  assert.equal(modes.get('s1'), 'aggressive');
  live.delete('s1');
  assert.equal(modes.get('s1'), 'ask', 'a not-live session reads as Ask me');
  live.add('s1');
  assert.equal(modes.get('s1'), 'ask', 'the reopened id was dropped by the read, not revived');
  assert.deepEqual(modes.entries(), [], 'the dead entry is gone from host state');
});

/** Wraps a fake host so selected calls fail or are held until released. */
function controlled(host) {
  const inner = host.connection.rpc.call;
  const control = { held: [], hold: false, failSets: 0 };
  host.connection.rpc.call = async function (...args) {
    if (args[2].action === 'set' && control.failSets > 0) { control.failSets--; host.calls.push([args[1], args[2]]); throw new Error('HTTP 500'); }
    if (control.hold) await new Promise(resolve => control.held.push(resolve));
    return inner.apply(this, args);
  };
  control.release = () => control.held.splice(0).forEach(resolve => resolve());
  return control;
}
function approver(d, answers) {
  let pending;
  const useSessionStatus = selector => selector(new Map([['s1', { pendingInteraction: pending }]]));
  const useChat = selector => selector({ nodes: new Map() });
  const watcher = d.render('majed-auto-approver', { sessionId: 's1', useSessionStatus, useChat });
  return { watcher, offer(key) { pending = { key, callId: key, kind: 'approval', toolName: 'read', answerable: true, answer: outcome => answers.push([key, outcome]) }; watcher.render(); } };
}

test('a poll that supersedes the pre-answer re-check cannot stall the approval: it is re-read once and answered exactly once while the host stays elevated', async t => {
  const host = fakeHost({ s1: 'safe' });
  const control = controlled(host);
  const d = device(t, host);
  const answers = [];
  const { watcher, offer } = approver(d, answers);
  await tick();
  control.hold = true;
  offer('a1');
  await tick();
  d.runTimers(5000); await tick(); // the poll is now in flight and supersedes the held re-check
  control.hold = false;
  control.release(); await tick(); await tick();
  assert.deepEqual(answers, [['a1', 'allowed-once']], 'answered exactly once after the bounded re-read');
  watcher.render(); d.runTimers(5000); await tick();
  assert.equal(answers.length, 1, 'no second answer');
});

test('a superseded re-check never answers when the host lowered the mode meanwhile', async t => {
  const host = fakeHost({ s1: 'safe' });
  const control = controlled(host);
  const d = device(t, host);
  const answers = [];
  const { offer } = approver(d, answers);
  await tick();
  control.hold = true;
  offer('a1');
  await tick();
  d.runTimers(5000); await tick();
  host.modes.s1 = 'ask';
  control.hold = false;
  control.release(); await tick(); await tick();
  assert.deepEqual(answers, [], 'host lowered authority, so nothing is answered');
});

test('a failed lowering write keeps showing the host-confirmed elevated mode, then re-syncs; a failed raise never shows a more permissive mode', async t => {
  const host = fakeHost({ s1: 'safe' });
  const control = controlled(host);
  const d = device(t, host);
  const view = d.render('majed-auto-approve', { sessionId: 's1' });
  await tick();
  assert.equal(view.render().one(isMenu).props.selectedId, 'safe');
  control.failSets = 1;
  choose(view, 'ask'); await tick(); await tick();
  assert.equal(view.render().one(isMenu).props.selectedId, 'safe', 'the host still holds safe, so the control must not claim Ask me');
  assert.equal(host.modes.s1, 'safe');
  assert.ok(host.calls.slice(host.calls.findIndex(([, p]) => p.action === 'set') + 1).some(([, p]) => p.action === 'snapshot'), 'a re-sync follows the failed write');
  d.runTimers(5000); await tick();
  assert.equal(view.render().one(isMenu).props.selectedId, 'safe');
  const lowered = fakeHost();
  const control2 = controlled(lowered);
  const e = device(t, lowered, { confirm: () => true });
  const view2 = e.render('majed-auto-approve', { sessionId: 's1' });
  await tick();
  control2.failSets = 1;
  choose(view2, 'safe'); await tick(); await tick();
  assert.equal(view2.render().one(isMenu).props.selectedId, 'ask', 'a failed raise never shows safe');
  assert.equal(lowered.modes.s1, undefined);
});
