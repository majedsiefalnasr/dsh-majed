import test from 'node:test';
import assert from 'node:assert/strict';
import {
  responsesTranslator, chatCompletionsTranslator, anthropicTranslator,
  antigravityTranslator, copilotEndpoint, antigravityToolSchema,
  errorFinish, isTranslator,
} from '../../modules/subscriptions/wire.js';
import { collectAsync } from './_subscriptions-helpers.js';

test('responses translator maps text/reasoning/tool/usage/finish chunks', async () => {
  const t = responsesTranslator();
  assert.equal(isTranslator(t), true);
  const chunks = await collectAsync(t.parseLine({
    type: 'response.output_text.delta', delta: 'hello ',
  }));
  assert.deepEqual(chunks, [{ type: 'text', text: 'hello ' }]);
});

test('responses translator parses SSE data lines', async () => {
  const t = responsesTranslator();
  const chunks = await collectAsync(t.parseLine('data: {"type":"response.reasoning.delta","delta":"think"}'));
  assert.deepEqual(chunks, [{ type: 'reasoning', text: 'think' }]);
});

test('responses translator maps tool call deltas', async () => {
  const t = responsesTranslator();
  const chunks = await collectAsync(t.parseLine({
    type: 'response.tool_call.delta', call: { id: 'call_1', name: 'fs.read', args: {} },
  }));
  assert.deepEqual(chunks, [{ type: 'tool', call: { id: 'call_1', name: 'fs.read', args: {} } }]);
});

test('responses translator classifies error finish', async () => {
  const t = responsesTranslator();
  const chunks = await collectAsync(t.parseLine({ type: 'error', message: 'boom', code: 'RATE_LIMIT' }));
  assert.equal(chunks[0].type, 'finish');
  assert.equal(chunks[0].reason.kind, 'error');
  assert.equal(chunks[0].reason.failure.code, 'RATE_LIMIT');
});

test('responses translator ignores unknown frames', async () => {
  const t = responsesTranslator();
  const chunks = await collectAsync(t.parseLine({ type: 'response.created', id: 'x' }));
  assert.deepEqual(chunks, []);
});

test('chat-completions translator maps choices content and tool calls', async () => {
  const t = chatCompletionsTranslator();
  const chunks = await collectAsync(t.parseLine({
    choices: [{ delta: { content: 'hi' }, finish_reason: 'stop' }],
  }));
  assert.deepEqual(chunks, [
    { type: 'text', text: 'hi' },
    { type: 'finish', reason: { kind: 'stop' } },
  ]);
});

test('chat-completions translator parses SSE data lines and tool calls', async () => {
  const t = chatCompletionsTranslator();
  const chunks = await collectAsync(t.parseLine('data: {"choices":[{"delta":{"tool_calls":[{"id":"t1","function":{"name":"x","arguments":"{}"}}]}}]}'));
  assert.deepEqual(chunks, [{ type: 'tool', call: { id: 't1', name: 'x', args: '{}' } }]);
});

test('anthropic translator maps text/thinking/tool_use/message_stop', async () => {
  const t = anthropicTranslator();
  const chunks = await collectAsync(t.parseLine({
    type: 'content_block_delta', delta: { type: 'thinking_delta', thinking: 'reasoning' },
  }));
  assert.deepEqual(chunks, [{ type: 'reasoning', text: 'reasoning' }]);

  const chunks2 = await collectAsync(t.parseLine({
    type: 'content_block_start', content_block: { type: 'tool_use', id: 'tu1', name: 'search', input: { q: 1 } },
  }));
  assert.deepEqual(chunks2, [{ type: 'tool', call: { id: 'tu1', name: 'search', args: { q: 1 } } }]);

  const chunks3 = await collectAsync(t.parseLine({ type: 'message_stop' }));
  assert.deepEqual(chunks3, [{ type: 'finish', reason: { kind: 'stop' } }]);
});

test('antigravity translator maps text/thought/tool/finish', async () => {
  const t = antigravityTranslator();
  const chunks = await collectAsync(t.parseLine({ type: 'thought_delta', thought: 'thinking' }));
  assert.deepEqual(chunks, [{ type: 'reasoning', text: 'thinking' }]);
  const chunks2 = await collectAsync(t.parseLine({ type: 'finish', reason: { kind: 'length' } }));
  assert.deepEqual(chunks2, [{ type: 'finish', reason: { kind: 'length' } }]);
});

test('translators classify errors into switchable or terminal actions', () => {
  const responses = responsesTranslator();
  assert.deepEqual(responses.classifyError({ code: 'RATE_LIMIT', providerRetryAfterMs: 50 }),
    { action: 'switch', reason: 'RATE_LIMIT', code: 'RATE_LIMIT', cooldownMs: 50, scope: 'account' });
  assert.deepEqual(responses.classifyError({ code: 'CONTEXT_WINDOW_EXCEEDED' }),
    { action: 'throw', reason: 'CONTEXT_WINDOW_EXCEEDED', code: 'CONTEXT_WINDOW_EXCEEDED', cooldownMs: undefined, scope: undefined });
});

test('errorFinish produces a normalized terminal error finish chunk', () => {
  const f = errorFinish('boom', 'RATE_LIMIT', { status: 429, requestId: 'req-1' });
  assert.equal(f.type, 'finish');
  assert.equal(f.reason.kind, 'error');
  assert.equal(f.reason.failure.code, 'RATE_LIMIT');
  assert.equal(f.reason.failure.status, 429);
  assert.equal(f.reason.failure.requestId, 'req-1');
});

test('copilotEndpoint selects chat-completions or responses', () => {
  assert.equal(copilotEndpoint({ supportsResponses: true, tools: false }), 'responses');
  assert.equal(copilotEndpoint({ supportsResponses: true, tools: true, explicitEffort: undefined }), 'chat-completions');
  assert.equal(copilotEndpoint({ supportsResponses: false }), 'chat-completions');
  assert.equal(copilotEndpoint({ supportsResponses: true, tools: true, explicitEffort: 'high' }), 'responses');
});

test('antigravityToolSchema normalizes refs and unions', () => {
  const out = antigravityToolSchema({
    type: 'object',
    properties: { name: { type: 'string' }, pick: { enum: ['a', 'b'] }, union: { anyOf: [{ type: 'number' }, { type: 'string' }] } },
    required: ['name'],
  });
  assert.equal(out.type, 'object');
  assert.deepEqual(out.required, ['name']);
  assert.equal(out.properties.name.type, 'string');
  assert.deepEqual(out.properties.pick.enum, ['a', 'b']);
  assert.deepEqual(out.properties.union.anyOf, [{ type: 'number' }, { type: 'string' }]);
  assert.throws(() => antigravityToolSchema({ type: 'array' }));
  assert.throws(() => antigravityToolSchema(null));
});
