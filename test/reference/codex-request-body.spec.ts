import { test } from 'node:test';

import assert from 'node:assert/strict'

import type { GenerateOptions } from '@deepseek-ai/dsh-llm';

import { codexRequestBody } from '../../src/providers/codex.js';

import { toResponsesInput } from '../../src/translate/responses.js';

const TOOL = {
  name: 'echo',
  description: 'echo',
  parameters: { type: 'object', properties: {} },
}

function options(tools?: GenerateOptions['tools']): GenerateOptions {
  return {
    provider: 'grok',
    model: 'grok-4.20-0309-non-reasoning',
    messages: [],
    system: 'judge',
    maxTokens: 16,
    ...tools === undefined ? {} : { tools },
  }
}

const resolved = toResponsesInput([], 'judge')

test('codex: tool-less request carries no tool_choice / parallel_tool_calls', () => {
  const body = codexRequestBody(options(), resolved, false)
  assert.equal(body.tool_choice, undefined)
  assert.equal(body.parallel_tool_calls, undefined)
  assert.equal(body.tools, undefined)
})

test('codex: request with tools keeps the whole trio', () => {
  const body = codexRequestBody(options([TOOL]), resolved, false)
  assert.equal(body.tool_choice, 'auto')
  assert.equal(body.parallel_tool_calls, true)
  assert.equal((body.tools as unknown[]).length, 1)
})

test('codex: tool controls and orphan-call repair coexist for every tools shape', () => {
  for (const tools of [undefined, [], [TOOL]]) {
    const input = [{ type: 'function_call', call_id: 'call_missing', name: 'echo', arguments: '{}' }]
    const body = codexRequestBody(options(tools), { input }, false)
    const repaired = body.input as Record<string, unknown>[]
    assert.equal(repaired.length, 2)
    assert.equal(repaired[1].call_id, 'call_missing')
    assert.match(String(repaired[1].output), /outcome is unknown/)
    assert.equal(input.length, 1, 'request repair must not mutate history')
    assert.equal(body.tool_choice, tools?.length ? 'auto' : undefined)
    assert.equal(body.parallel_tool_calls, tools?.length ? true : undefined)
    assert.equal(body.tools === undefined, !tools?.length)
  }
})
