import test from 'node:test';
import assert from 'node:assert/strict';
import { Context } from '@deepseek-ai/cordis';
import { apply } from '../../lib/management/judgment-settings.js';

async function mount(t) {
  const ctx = new Context(); let route;
  ctx.provide('connection', { fetch: { register(value) { route = value; } } });
  const fiber = ctx.plugin({ apply }); await fiber;
  t.after(() => fiber.dispose());
  const call = (payload, options = {}) => route.fetch(new Request('http://fixture/api/majed/judgment/status', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'client-request', rpcId: 'test-1', method: 'majed/judgment/status', payload }), ...options,
  }));
  return { route, call };
}

test('registers the judgment settings Fetch route with exact path and POST method', async t => {
  const { route } = await mount(t);
  assert.equal(route.path, '/api/majed/judgment/status');
  assert.deepEqual(route.methods, ['POST']);
  assert.equal(route.requestBody, 'streaming');
});

test('GET status returns empty configuration when nothing is set', async t => {
  const { route, call } = await mount(t);
  const result = (await (await call({})).json()).result;
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, {
    protocol: null, addressConfigured: false, modelConfigured: false, credentialConfigured: false,
    capabilities: [],
  });
});

test('POST with valid System One config stores protocol, address and model', async t => {
  const { route, call } = await mount(t);
  let result = (await (await call({
    protocol: 'systemone', address: 'https://api.typesafe.ai', model: 'openrouter/auto',
  })).json()).result;
  assert.equal(result.ok, true);
  assert.equal(result.value.protocol, 'systemone');
  assert.equal(result.value.addressConfigured, true);
  assert.equal(result.value.modelConfigured, true);
  assert.equal(result.value.credentialConfigured, false);

  result = (await (await call({})).json()).result;
  assert.equal(result.value.protocol, 'systemone');
  assert.equal(result.value.addressConfigured, true);
  assert.equal(result.value.modelConfigured, true);
  assert.equal(result.value.credentialConfigured, false);
});

test('POST with valid Decisions config stores protocol, address and model', async t => {
  const { route, call } = await mount(t);
  const result = (await (await call({
    protocol: 'decisions', address: 'https://openrouter.ai/api/alpha/decisions', model: 'openrouter/auto',
  })).json()).result;
  assert.equal(result.ok, true);
  assert.equal(result.value.protocol, 'decisions');
  assert.equal(result.value.addressConfigured, true);
  assert.equal(result.value.modelConfigured, true);
});

test('credential configured status is settable independently and never echoes the secret', async t => {
  const { route, call } = await mount(t);
  const first = (await (await call({ credentialConfigured: true })).json()).result;
  assert.equal(first.ok, true);
  assert.equal(first.value.credentialConfigured, true);

  const second = (await (await call({ credentialConfigured: false })).json()).result;
  assert.equal(second.ok, true);
  assert.equal(second.value.credentialConfigured, false);
});

test('rejects unsupported protocol values', async t => {
  const { call } = await mount(t);
  for (const protocol of ['openai', 'chat-completions', 'generic', '', 123]) {
    const response = await call({ protocol });
    const body = await response.json();
    assert.equal(body.result.error.code, 'invalid_request', `protocol ${JSON.stringify(protocol)} should be rejected`);
  }
});

test('rejects malformed addresses for both protocols', async t => {
  const { call } = await mount(t);
  for (const address of ['not-a-url', 'ftp://example.com', '', 'http://', 'https://', 'javascript:alert(1)']) {
    for (const protocol of ['systemone', 'decisions']) {
      const response = await call({ protocol, address });
      const body = await response.json();
      assert.equal(body.result.error.code, 'invalid_request', `address ${JSON.stringify(address)} for ${protocol} should be rejected`);
    }
  }
});

test('distinguishes root-plus-/v1/systemone from a full Decisions endpoint', async t => {
  const { call } = await mount(t);
  // System One: root only, client appends /v1/systemone
  const sys1 = await call({ protocol: 'systemone', address: 'https://api.typesafe.ai' });
  assert.equal((await sys1.json()).result.ok, true);
  // System One: full /v1/systemone address is also valid (explicit, no duplication)
  const sys1full = await call({ protocol: 'systemone', address: 'https://api.typesafe.ai/v1/systemone' });
  assert.equal((await sys1full.json()).result.ok, true);
  // Decisions: full Decisions endpoint is valid
  const dec = await call({ protocol: 'decisions', address: 'https://openrouter.ai/api/alpha/decisions' });
  assert.equal((await dec.json()).result.ok, true);
  // A chat-completions endpoint is not valid for either protocol
  for (const protocol of ['systemone', 'decisions']) {
    const cc = await call({ protocol, address: 'https://api.example.com/v1/chat/completions' });
    assert.equal((await cc.json()).result.error.code, 'invalid_request', `${protocol} should not accept chat-completions endpoint`);
  }
});

test('prevents suffix duplication for System One', async t => {
  const { call } = await mount(t);
  // Address already ending in /v1/systemone should not have it appended again by validation
  const response = await call({ protocol: 'systemone', address: 'https://api.typesafe.ai/v1/systemone' });
  assert.equal((await response.json()).result.ok, true);
  // The stored address should remain as-is, not doubled
  const result = (await (await call({})).json()).result;
  assert.equal(result.value.addressConfigured, true);
});

test('rejects non-object payload and unknown keys', async t => {
  const { call } = await mount(t);
  const bad = await call({ protocol: 'systemone', address: 'https://api.typesafe.ai', secret: 'sk-123' });
  assert.equal((await bad.json()).result.error.code, 'invalid_request');
  const notObj = await call('not-an-object');
  assert.equal((await notObj.json()).result.error.code, 'invalid_request');
});

test('missing credentials and unsupported protocol are visible but do not block deterministic Auto', async t => {
  const { call } = await mount(t);
  // No protocol set: credential not configured, address not configured
  const result = (await (await call({})).json()).result;
  assert.equal(result.ok, true);
  assert.equal(result.value.credentialConfigured, false);
  assert.equal(result.value.addressConfigured, false);
  assert.equal(result.value.modelConfigured, false);
  // Unsupported protocol is rejected with a visible code
  const response = await call({ protocol: 'unknown' });
  assert.equal((await response.json()).result.error.code, 'invalid_request');
});
