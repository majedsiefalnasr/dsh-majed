import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Context } from '@deepseek-ai/cordis';
import { createBaselineHarness } from './helpers/baseline-client-harness.js';
const source = await readFile(new URL('../../dist/client.js', import.meta.url), 'utf8');
const tick = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };

test('Settings readiness and Refresh reach a sibling Cordis connection service', async t => {
  const calls = [];
  const root = new Context();
  // Services belong to sibling plugins in DSH, not the root context. Providing
  // on root would incorrectly permit undeclared access through ancestry.
  const provider = root.plugin({ apply(ctx) {
    ctx.provide('connection', { rpc: { async call(channel, endpoint, payload) {
      calls.push({ channel, endpoint, payload });
      return { ok: true, value: { module: payload.module, enabled: false, state: 'disabled' } };
    } } });
  } });
  await provider;
  const harness = createBaselineHarness(source);
  let consumer;
  t.after(async () => { harness.dispose(); await consumer?.dispose(); await provider.dispose(); });
  consumer = harness.apply((plugin, fixtures) => {
    // Keep presentation fixtures but resolve connection through actual Cordis.
    const { connection: unused, ...presentation } = fixtures;
    for (const name of ['slots', 'locale', 'uiWorkspace']) root.provide(name, presentation[name]);
    return root.plugin({ ...plugin, apply(ctx) {
      plugin.apply(new Proxy(presentation, {
        get(target, key) { return key === 'connection' ? ctx.connection : target[key]; },
      }));
    } });
  });
  await consumer;
  const view = harness.render('majed-skills');
  await tick(); view.render();
  assert.equal(calls.length, 1, 'initial readiness must send an RPC, not report unavailable');
  assert.equal(view.nodes(node => node.props.role === 'alert').length, 0);
  await view.one(node => node.type === 'button').props.onClick();
  await tick(); view.render();
  assert.equal(calls.length, 2, 'Refresh must send another RPC');
  for (const call of calls) {
    assert.equal(call.channel, '/api');
    assert.equal(call.endpoint, 'majed/settings/status');
    assert.equal(call.payload.module, 'skills');
  }
});

test('Settings readiness uses native carrier, isolates failures, translates RTL and cleans up', async t => {
  const calls = [], signals = [];
  const connection = { rpc: { async call(channel, endpoint, payload, signal) {
    calls.push({ channel, endpoint, payload }); signals.push(signal);
    if (payload.module === 'mcp') throw new Error('transport failure: HTTP 403');
    return { ok: true, value: { module: payload.module, enabled: payload.enabled ?? false, state: payload.enabled ? 'ready' : 'disabled' } };
  } } };
  const harness = createBaselineHarness(source, { connection, language: 'ar' });
  t.after(() => harness.dispose()); harness.apply();
  const skills = harness.render('majed-skills'), mcp = harness.render('majed-mcp');
  await tick(); skills.render(); mcp.render();
  assert.equal(skills.one(node => node.type === 'section').props.dir, 'rtl');
  assert.equal(skills.one(node => node.type === 'input').props.checked, false);
  assert.ok(mcp.one(node => node.props.role === 'alert'));
  await skills.one(node => node.type === 'input').props.onChange({ target: { checked: true } });
  await tick(); skills.render();
  assert.equal(skills.one(node => node.type === 'input').props.checked, true);
  assert.equal(calls.at(-1).channel, '/api'); assert.equal(calls.at(-1).endpoint, 'majed/settings/status');
  assert.equal(calls.at(-1).payload.module, 'skills');
  assert.equal(harness.storage.size, 0, 'readiness never persists as baseline preferences');
  assert.equal(harness.timers.size, 0);
  harness.dispose(); assert.equal(harness.registrations.size, 0);
});

test('unsupported carrier offers actionable error and unmount aborts pending request', async t => {
  const harness = createBaselineHarness(source); t.after(() => harness.dispose()); harness.apply();
  const view = harness.render('majed-routing'); await tick(); view.render();
  assert.ok(view.nodes(node => node.props.role === 'alert').some(node => /supported DSH version/.test(JSON.stringify(node))));
  let signal;
  const pending = createBaselineHarness(source, { connection: { rpc: { call(a, b, c, s) { signal = s; return new Promise(() => {}); } } } });
  t.after(() => pending.dispose()); pending.apply(); pending.render('majed-hooks');
  pending.dispose(); assert.equal(signal.aborted, true); assert.equal(pending.timers.size, 0);
});
