import test from 'node:test';
import assert from 'node:assert/strict';
import { Context } from '@deepseek-ai/cordis';
import { apply } from '../../lib/management/settings.js';

// Accepted Fetch registration seam. Native admission itself is covered separately
// against the exact host; this fixture deliberately does not simulate authentication.
async function mount(t) {
  const ctx = new Context();
  let route;
  ctx.provide('connection', { fetch: { register(value) { route = value; } } });
  const fiber = ctx.plugin({ apply }); await fiber;
  t.after(() => fiber.dispose());
  return { ctx, route, async call(payload, options = {}) {
    const request = new Request('http://fixture/api/majed/settings/status', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'client-request', rpcId: 'test-1', method: 'majed/settings/status', payload }), ...options,
    });
    return route.fetch(request);
  } };
}

test('enabling an inert module returns actual service state and isolates other modules', async t => {
  const { route, call } = await mount(t);
  assert.equal(route.path, '/api/majed/settings/status');
  assert.deepEqual(route.methods, ['POST']);
  assert.equal(route.requestBody, 'streaming');
  const read = async payload => (await (await call(payload)).json()).result;
  assert.deepEqual(await read({ module: 'skills' }), { ok: true, value: { module: 'skills', enabled: false, state: 'disabled', scope: 'instance', capabilities: [] } });
  assert.equal((await read({ module: 'skills', enabled: true })).value.state, 'ready');
  assert.equal((await read({ module: 'mcp' })).value.enabled, false);
  assert.equal((await read({ module: 'skills', enabled: false })).value.state, 'disabled');
  const response = await call({ module: 'hooks', enabled: true });
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual((await response.json()).result.value.capabilities, []);
});
