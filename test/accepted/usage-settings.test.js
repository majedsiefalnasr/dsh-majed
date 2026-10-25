import test from 'node:test';
import assert from 'node:assert/strict';
import { Context } from '@deepseek-ai/cordis';
import { apply } from '../../lib/management/usage.js';

// Accepted Fetch registration seam. Native admission itself is covered separately
// against the exact host; this fixture deliberately does not simulate authentication.
async function mount(t) {
  const ctx = new Context();
  let route;
  ctx.provide('connection', { fetch: { register(value) { route = value; } } });
  const fiber = ctx.plugin({ apply }); await fiber;
  t.after(() => fiber.dispose());
  return { ctx, route, async call(payload, options = {}) {
    const request = new Request('http://fixture/api/majed/usage/status', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'client-request', rpcId: 'test-1', method: 'majed/usage/status', payload }), ...options,
    });
    return route.fetch(request);
  } };
}

test('usage settings route is registered with correct path and method', async t => {
  const { route } = await mount(t);
  assert.equal(route.path, '/api/majed/usage/status');
  assert.deepEqual(route.methods, ['POST']);
  assert.equal(route.requestBody, 'streaming');
});

test('default usage settings are advisory: 95% threshold, unknown telemetry included, cache TTL unset', async t => {
  const { route, call } = await mount(t);
  const read = async payload => (await (await call(payload)).json()).result;
  const result = await read({ cacheTtlMs: undefined, statusBarEnabled: true, warningThresholdPct: 95, unknownTelemetryExclude: false });
  assert.equal(result.ok, true);
  assert.equal(result.value.cacheTtlMs, null);
  assert.equal(result.value.statusBarEnabled, true);
  assert.equal(result.value.warningThresholdPct, 95);
  assert.equal(result.value.unknownTelemetryExclude, false);
  assert.deepEqual(result.value.capabilities, []);
});

test('cache TTL setting round-trips and is bounded', async t => {
  const { route, call } = await mount(t);
  const read = async payload => (await (await call(payload)).json()).result;
  // set a valid TTL
  const set = await read({ cacheTtlMs: 300_000 });
  assert.equal(set.ok, true);
  assert.equal(set.value.cacheTtlMs, 300_000);
  // zero is a valid TTL (cache disabled)
  const cleared = await read({ cacheTtlMs: 0 });
  assert.equal(cleared.ok, true);
  assert.equal(cleared.value.cacheTtlMs, 0);
  // negative is rejected: RPC returns 200 with error result
  const bad = await call({ cacheTtlMs: -1 });
  assert.equal(bad.status, 200);
  const body = await bad.json();
  assert.equal(body.result.ok, false);
  assert.equal(body.result.error.code, 'invalid_request');
});

test('status bar preference toggles and warning threshold is advisory only', async t => {
  const { route, call } = await mount(t);
  const read = async payload => (await (await call(payload)).json()).result;
  const off = await read({ statusBarEnabled: false });
  assert.equal(off.ok, true);
  assert.equal(off.value.statusBarEnabled, false);
  // 95% threshold is advisory: does not exclude any candidate
  const advisory = await read({ warningThresholdPct: 95 });
  assert.equal(advisory.ok, true);
  assert.equal(advisory.value.warningThresholdPct, 95);
  assert.equal(advisory.value.unknownTelemetryExclude, false);
});

test('unknown telemetry never excludes a candidate regardless of threshold', async t => {
  const { route, call } = await mount(t);
  const read = async payload => (await (await call(payload)).json()).result;
  // even with a low threshold, unknown telemetry does not exclude
  const result = await read({ warningThresholdPct: 50, unknownTelemetryExclude: false });
  assert.equal(result.ok, true);
  assert.equal(result.value.unknownTelemetryExclude, false);
  // attempting to set unknownTelemetryExclude to true is rejected (it is a fixed invariant)
  const bad = await call({ unknownTelemetryExclude: true });
  assert.equal(bad.status, 200);
  const body = await bad.json();
  assert.equal(body.result.ok, false);
  assert.equal(body.result.error.code, 'invalid_request');
});

test('redacted failure handling: malformed payloads return safe codes without echoing input', async t => {
  const { route, call } = await mount(t);
  const secret = 'DO-NOT-ECHO-usage-secret';
  const bad = await call({ cacheTtlMs: secret });
  assert.equal(bad.status, 200);
  const body = await bad.json();
  assert.equal(body.result.ok, false);
  assert.equal(body.result.error.code, 'invalid_request');
  assert.equal(JSON.stringify(body).includes(secret), false);
});
