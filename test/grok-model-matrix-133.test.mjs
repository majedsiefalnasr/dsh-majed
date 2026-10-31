// Independent #133 controlled model/request matrix; no provider calls.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchGrokModels, GROK_MODELS_URL, grokRequestBody, grokRateLimitReset } from '../dist/providers/grok.js';
const session = { accessToken: 'fixture', refreshToken: 'fixture', expiresAt: 4000000000000, tokenEndpoint: 'https://auth.x.ai/token' };
test('Grok catalog filters duplicates/non-chat and preserves prior metadata only on CLI failure', async () => {
  const warnings = [], signals = [], controller = new AbortController();
  const previous = [{ id: 'grok-4', name: 'Prior', contextWindow: 12345 }];
  const models = await fetchGrokModels(session, async (url, init) => {
    signals.push(init.signal);
    return String(url) === GROK_MODELS_URL ? Response.json({ data: [{ id: 'grok-4' }, { id: 'grok-4' }, { id: '' }, {}, { id: 'grok-imagine-image' }] }) : new Response('unavailable', { status: 503 });
  }, warning => warnings.push(warning), previous, controller.signal);
  assert.deepEqual(models.map(model => model.id), ['grok-4']);
  assert.ok(warnings.some(warning => warning.includes('last-known')));
  assert.ok(signals.every(signal => signal === controller.signal));
});
test('Grok malformed, empty and rejected primary catalogs fail rather than invent models', async () => {
  for (const value of [{}, { data: [] }, { data: [{ id: '' }] }, undefined]) {
    await assert.rejects(fetchGrokModels(session, async url => String(url) === GROK_MODELS_URL ? value === undefined ? new Response('unavailable', { status: 503 }) : Response.json(value) : Response.json({ models: [] })));
  }
});
test('Grok request option matrix preserves instructions and independently omits optional controls', () => {
  for (const tools of [undefined, []]) {
    const body = grokRequestBody({ provider: 'grok', model: 'grok-4', messages: [], tools }, { input: [], instructions: 'fixture-system' });
    assert.equal(body.instructions, 'fixture-system'); assert.equal(body.model, 'grok-4'); assert.equal(body.stream, true); assert.equal(body.store, false);
    for (const key of ['tools', 'tool_choice', 'parallel_tool_calls', 'reasoning', 'max_output_tokens', 'prompt_cache_key']) assert.ok(!(key in body), key);
  }
  const now = 1700000000000;
  assert.equal(grokRateLimitReset(new Response('', { status: 429 }), '{"retry_after":60}', now), now + 60000);
});
