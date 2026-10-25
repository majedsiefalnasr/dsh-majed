import test from 'node:test';
import assert from 'node:assert/strict';

// Fixture validation for each supported judgment protocol: body/response shape,
// model identifier, and returned usage/cost metadata. No probability/confidence
// fields are manufactured or claimed to measure accuracy.

const SYSTEM_ONE_REQUEST_BODY = {
  model: 'openrouter/auto',
  messages: [{ role: 'user', content: 'Choose a model and effort for this task.' }],
};
const SYSTEM_ONE_RESPONSE = {
  model: 'openrouter/auto',
  choices: [{ message: { role: 'assistant', content: 'Selected: anthropic/claude-3-sonnet, effort=medium' } }],
  usage: { prompt_tokens: 42, completion_tokens: 17, total_tokens: 59 },
  cost: { prompt: 0.0001, completion: 0.0003, total: 0.0004 },
};

const DECISIONS_REQUEST_BODY = {
  model: 'openrouter/auto',
  input: 'Choose a model and effort for this task.',
};
const DECISIONS_RESPONSE = {
  model: 'openrouter/auto',
  decision: { model: 'anthropic/claude-3-sonnet', effort: 'medium' },
  usage: { input_tokens: 42, output_tokens: 17 },
  cost_usd: 0.0004,
};

function assertProtocolResponse(response, expectedModel) {
  assert.equal(typeof response.model, 'string');
  assert.equal(response.model.length > 0, true);
  if (expectedModel) assert.equal(response.model, expectedModel);
  assert.ok(response.usage, 'response must include usage metadata');
  assert.ok(typeof response.usage.total_tokens === 'number' || typeof response.usage.input_tokens === 'number',
    'usage must include token counts');
  assert.ok(response.cost || response.cost_usd !== undefined, 'response must include cost metadata');
  // No probability/confidence fields that claim to measure accuracy.
  assert.equal(response.confidence, undefined);
  assert.equal(response.probability, undefined);
  assert.equal(response.accuracy, undefined);
}

test('System One protocol fixture: valid body, response, model ID, usage/cost', () => {
  const request = { ...SYSTEM_ONE_REQUEST_BODY };
  assert.equal(typeof request.model, 'string');
  assert.ok(Array.isArray(request.messages));
  assertProtocolResponse(SYSTEM_ONE_RESPONSE, 'openrouter/auto');
  assert.equal(SYSTEM_ONE_RESPONSE.model, SYSTEM_ONE_REQUEST_BODY.model, 'requested model echoed in response');
  assert.equal(SYSTEM_ONE_RESPONSE.usage.total_tokens, 59);
  assert.equal(SYSTEM_ONE_RESPONSE.cost.total, 0.0004);
});

test('System One protocol fixture: preserves requested vs actual model when provided', () => {
  const response = { ...SYSTEM_ONE_RESPONSE, model: 'anthropic/claude-3-sonnet' };
  assert.equal(response.model, 'anthropic/claude-3-sonnet', 'actual model may differ from requested');
  assert.equal(response.choices[0].message.content.includes('anthropic/claude-3-sonnet'), true,
    'response body names the actual model');
  assertProtocolResponse(response, undefined);
});

test('Decisions protocol fixture: valid body, response, model ID, usage/cost', () => {
  const request = { ...DECISIONS_REQUEST_BODY };
  assert.equal(typeof request.model, 'string');
  assert.equal(typeof request.input, 'string');
  assertProtocolResponse(DECISIONS_RESPONSE, 'openrouter/auto');
  assert.equal(DECISIONS_RESPONSE.decision.model, 'anthropic/claude-3-sonnet');
  assert.equal(DECISIONS_RESPONSE.usage.input_tokens, 42);
  assert.equal(DECISIONS_RESPONSE.cost_usd, 0.0004);
});

test('Decisions protocol fixture: preserves requested vs actual model when provided', () => {
  const response = { ...DECISIONS_RESPONSE, model: 'anthropic/claude-3-sonnet' };
  assert.equal(response.model, 'anthropic/claude-3-sonnet');
  assert.equal(response.decision.model, 'anthropic/claude-3-sonnet');
  assertProtocolResponse(response, undefined);
});

test('fixtures never expose real keys or credentials', () => {
  for (const fixture of [SYSTEM_ONE_REQUEST_BODY, SYSTEM_ONE_RESPONSE, DECISIONS_REQUEST_BODY, DECISIONS_RESPONSE]) {
    const text = JSON.stringify(fixture);
    assert.doesNotMatch(text, /sk-|sk_prod|sk-or|sk-ant|credential|secret|password|api_key|bearer/i,
      'fixture must not contain real-looking keys or credentials');
  }
});
