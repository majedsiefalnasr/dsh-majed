/** MIT reference b802311: translate.spec.ts Anthropic subset (toAnthropic*, cache marks, stream translator). See src/PROVENANCE.md (#132). */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { LlmError, MessageId } from '@deepseek-ai/dsh-llm'
import { ToolCallId } from '../../src/compat.js'
import type { CompatibleContentBlock as ContentBlock, CompatibleMessage as Message } from '../../src/compat.js'
import type { MessageSource, StreamChunk } from '@deepseek-ai/dsh-llm'
import {
  AnthropicStreamTranslator,
  CLAUDE_CODE_IDENTITY,
  cacheControl,
  markMessageCache,
  toAnthropicMessages,
  toAnthropicSystem,
  toAnthropicTools,
} from '../../src/translate/anthropic.js'
import type { AnthropicMessage, AnthropicStreamEvent } from '../../src/translate/anthropic.js'
import { resolveImages, type TranslatableMessage } from '../../src/translate/resolved.js'

let messageCounter = 0

/** Build a bare message without touching the frozen constructors. */
function message(
  role: Message['role'],
  content: ContentBlock[],
  source?: MessageSource,
): Message {
  const resolvedSource = source ?? (role === 'assistant'
    ? { kind: 'model' as const, provider: 'codex', model: 'gpt-5.1-codex' }
    : { kind: 'user' as const })
  return { id: MessageId(`m-${++messageCounter}`), role, content, source: resolvedSource }
}

function toolCall(id: string, name: string, args: string): ContentBlock {
  return { type: 'tool-call', id: ToolCallId(id), name, arguments: args }
}

function toolResult(callId: string, text: string, isError?: boolean): ContentBlock {
  return {
    type: 'tool-result',
    toolCallId: ToolCallId(callId),
    content: [{ type: 'text', text }],
    ...isError === undefined ? {} : { isError },
  }
}

/** Feed every event through a translator and flatten the chunks. */
function drain<T>(translator: { push(event: T): StreamChunk[] }, events: T[]): StreamChunk[] {
  return events.flatMap(event => translator.push(event))
}

test('toAnthropicMessages: merge, tool_use input parsing, tool_result', () => {
  const messages = toAnthropicMessages([
    message('system', [{ type: 'text', text: 'system text' }]),
    message('user', [{ type: 'text', text: 'first' }]),
    message('user', [
      { type: 'text', text: 'second' },
      toolResult('call-1', 'result text', true),
    ]),
    message('assistant', [
      { type: 'text', text: 'calling' },
      toolCall('call-1', 'bash', '{"cmd":"ls"}'),
    ]),
  ])
  assert.deepEqual(messages, [
    {
      // The merged user message leads with its tool result; the texts keep
      // their relative order behind it.
      role: 'user',
      content: [
        { type: 'tool_result', tool_use_id: 'call-1', content: 'result text', is_error: true },
        { type: 'text', text: 'first' },
        { type: 'text', text: 'second' },
      ],
    },
    {
      role: 'assistant',
      content: [
        { type: 'text', text: 'calling' },
        { type: 'tool_use', id: 'call-1', name: 'bash', input: { cmd: 'ls' } },
      ],
    },
  ])

  // Malformed tool-call JSON degrades to an empty object, never a crash.
  const malformed = toAnthropicMessages([
    message('assistant', [toolCall('c', 'n', '{bad')]),
  ])
  assert.deepEqual(malformed[0].content[0], { type: 'tool_use', id: 'c', name: 'n', input: {} })
})

test('toAnthropicMessages: a replayed tool call in a user message rides as text', () => {
  // A settled background subagent's closing message is spliced into the parent
  // conversation as a user-role notice, carrying the subagent's own blocks —
  // including tool calls that never got a result. Anthropic rejects `tool_use`
  // outside assistant messages, so those must not reach the wire as tool_use.
  const messages = toAnthropicMessages([
    message('user', [
      { type: 'text', text: 'Background subagent 7f21c45a failed before it finished.' },
      toolCall('toolu_01MG', 'bash', '{"command":"ls"}'),
    ], { kind: 'user' }),
  ])
  assert.deepEqual(messages, [{
    role: 'user',
    content: [
      { type: 'text', text: 'Background subagent 7f21c45a failed before it finished.' },
      { type: 'text', text: '[tool call bash: {"command":"ls"}]' },
    ],
  }])
  assert.ok(!JSON.stringify(messages).includes('tool_use'))
})

test('toAnthropicMessages: merged user message keeps tool_result blocks in one leading run', () => {
  // A parallel tool batch arrives as one result message per call, so context
  // spliced mid-batch merges in between them. Anthropic answers each tool_use
  // against the blocks leading the next message, so the results must regroup
  // at the front or the request is rejected for an unanswered call.
  const messages = toAnthropicMessages([
    message('assistant', [toolCall('call-1', 'bash', '{}'), toolCall('call-2', 'bash', '{}')]),
    message('user', [toolResult('call-1', 'first')], { kind: 'tool', callId: ToolCallId('call-1') }),
    message('user', [{ type: 'text', text: 'spliced notice' }]),
    message('user', [toolResult('call-2', 'second')], { kind: 'tool', callId: ToolCallId('call-2') }),
  ])
  assert.deepEqual(messages[1], {
    role: 'user',
    content: [
      { type: 'tool_result', tool_use_id: 'call-1', content: 'first' },
      { type: 'tool_result', tool_use_id: 'call-2', content: 'second' },
      { type: 'text', text: 'spliced notice' },
    ],
  })

  // A user message with no tool results is left exactly as assembled.
  const plain = toAnthropicMessages([
    message('user', [{ type: 'text', text: 'a' }, { type: 'text', text: 'b' }]),
  ])
  assert.deepEqual(plain[0].content, [{ type: 'text', text: 'a' }, { type: 'text', text: 'b' }])
})

test('toAnthropicMessages: resolved image parts become base64 image blocks', () => {
  const messages = toAnthropicMessages([{
    role: 'user',
    content: [
      { type: 'image', mediaType: 'image/png', dataBase64: 'aGk=' },
      { type: 'text', text: 'what is this?' },
    ],
  }])
  assert.deepEqual(messages, [{
    role: 'user',
    content: [
      { type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'aGk=' } },
      { type: 'text', text: 'what is this?' },
    ],
  }])
})

test('toAnthropicSystem: Claude Code identity first, then explicit and history system text', () => {  const blocks = toAnthropicSystem('explicit', [message('system', [{ type: 'text', text: 'from history' }])])
  assert.deepEqual(blocks, [
    { type: 'text', text: CLAUDE_CODE_IDENTITY },
    { type: 'text', text: 'explicit' },
    { type: 'text', text: 'from history', cache_control: { type: 'ephemeral' } },
  ])
  assert.equal(toAnthropicSystem().length, 1, 'the identity block is always present')
})

test('toAnthropicSystem hoists only the system messages that precede the conversation', () => {
  const history = [
    message('system', [{ type: 'text', text: 'opening' }]),
    message('user', [{ type: 'text', text: 'hi' }]),
    message('system', [{ type: 'text', text: 'mid-conversation' }]),
  ]
  assert.deepEqual(toAnthropicSystem('explicit', history), [
    { type: 'text', text: CLAUDE_CODE_IDENTITY },
    { type: 'text', text: 'explicit' },
    { type: 'text', text: 'opening', cache_control: { type: 'ephemeral' } },
  ], 'a later system message must not move in front of the cached history')
})

test('toAnthropicMessages: a mid-conversation system message rides in place as a reminder', () => {
  const messages = toAnthropicMessages([
    message('system', [{ type: 'text', text: 'opening' }]),
    message('user', [{ type: 'text', text: 'hi' }]),
    message('assistant', [{ type: 'text', text: 'hello' }]),
    message('system', [{ type: 'text', text: 'terse mode' }]),
  ])
  assert.deepEqual(messages, [
    { role: 'user', content: [{ type: 'text', text: 'hi' }] },
    { role: 'assistant', content: [{ type: 'text', text: 'hello' }] },
    { role: 'user', content: [{ type: 'text', text: '<system-reminder>terse mode</system-reminder>' }] },
  ])
})

test('toAnthropicSystem marks its last block as the tools+system breakpoint', () => {
  const blocks = toAnthropicSystem('explicit')
  assert.deepEqual(blocks, [
    { type: 'text', text: CLAUDE_CODE_IDENTITY },
    { type: 'text', text: 'explicit', cache_control: { type: 'ephemeral' } },
  ])
})

test('markMessageCache marks the tail and one block every stride backwards', () => {
  const content: Record<string, unknown>[] = Array.from(
    { length: 40 },
    (_, index) => ({ type: 'text', text: `b${index}` }),
  )
  const messages: AnthropicMessage[] = [{ role: 'user', content }]
  markMessageCache(messages)
  const marked = content.flatMap((block, index) => ('cache_control' in block ? [index] : []))
  assert.deepEqual(marked, [9, 24, 39], 'three marks, 15 blocks apart, anchored at the tail')
})

test('markMessageCache marks across messages and stops at the start of a short one', () => {
  const first: Record<string, unknown>[] = [{ type: 'text', text: 'hi' }]
  const second: Record<string, unknown>[] = [{ type: 'text', text: 'hello' }]
  const messages: AnthropicMessage[] = [
    { role: 'user', content: first },
    { role: 'assistant', content: second },
  ]
  markMessageCache(messages)
  assert.deepEqual(first, [{ type: 'text', text: 'hi' }], 'no mark within a stride of the tail')
  assert.deepEqual(second, [{ type: 'text', text: 'hello', cache_control: { type: 'ephemeral' } }])
})

test('markMessageCache leaves an empty conversation alone', () => {
  assert.doesNotThrow(() => { markMessageCache([]) })
})

test('toAnthropicMessages: a system reminder merged with tool results stays behind the leading run', () => {
  const messages = toAnthropicMessages([
    message('user', [{ type: 'text', text: 'go' }]),
    message('assistant', [toolCall('c1', 'bash', '{}')]),
    message('user', [toolResult('c1', 'ok')]),
    message('system', [{ type: 'text', text: 'terse mode' }]),
  ])
  assert.deepEqual(messages[2].content, [
    { type: 'tool_result', tool_use_id: 'c1', content: 'ok' },
    { type: 'text', text: '<system-reminder>terse mode</system-reminder>' },
  ], 'tool_result blocks must still lead the merged message')
})

test('an all-system history hoists everything and leaves no messages', () => {
  const history = [
    message('system', [{ type: 'text', text: 'first' }]),
    message('system', [{ type: 'text', text: 'second' }]),
  ]
  assert.deepEqual(toAnthropicSystem(undefined, history), [
    { type: 'text', text: CLAUDE_CODE_IDENTITY },
    { type: 'text', text: 'first' },
    { type: 'text', text: 'second', cache_control: { type: 'ephemeral' } },
  ])
  assert.deepEqual(toAnthropicMessages(history), [])
})

test('toAnthropicSystem marks the identity block when it is the only one', () => {
  assert.deepEqual(toAnthropicSystem(), [
    { type: 'text', text: CLAUDE_CODE_IDENTITY, cache_control: { type: 'ephemeral' } },
  ])
})

test('markMessageCache marks a tool_result block when the turn ends on one', () => {
  const content: Record<string, unknown>[] = [
    { type: 'tool_result', tool_use_id: 'c1', content: 'ok' },
    { type: 'tool_result', tool_use_id: 'c2', content: 'ok' },
  ]
  markMessageCache([{ role: 'user', content }])
  assert.equal(content[0].cache_control, undefined)
  assert.deepEqual(content[1].cache_control, { type: 'ephemeral' })
})

test('cacheControl spells five minutes by omitting ttl, and one hour explicitly', () => {
  assert.deepEqual(cacheControl(), { type: 'ephemeral' })
  assert.deepEqual(cacheControl('5m'), { type: 'ephemeral' })
  assert.deepEqual(cacheControl('1h'), { type: 'ephemeral', ttl: '1h' })
  assert.notEqual(cacheControl('1h'), cacheControl('1h'), 'every mark is its own object')
})

test('markMessageCache and toAnthropicSystem apply one TTL to every mark they place', () => {
  const content: Record<string, unknown>[] = Array.from(
    { length: 40 },
    (_, index) => ({ type: 'text', text: `b${index}` }),
  )
  markMessageCache([{ role: 'user', content }], '1h')
  const marked = content.filter(block => 'cache_control' in block)
  assert.equal(marked.length, 3)
  for (const block of marked) assert.deepEqual(block.cache_control, { type: 'ephemeral', ttl: '1h' })

  assert.deepEqual(toAnthropicSystem('explicit', undefined, '1h'), [
    { type: 'text', text: CLAUDE_CODE_IDENTITY },
    { type: 'text', text: 'explicit', cache_control: { type: 'ephemeral', ttl: '1h' } },
  ])
})

test('toAnthropicTools maps to input_schema tools', () => {
  assert.deepEqual(toAnthropicTools([{ name: 'bash', description: 'run', parameters: { type: 'object' } }]), [
    { name: 'bash', description: 'run', input_schema: { type: 'object' } },
  ])
})

test('toAnthropicTools sorts by name so the tools prefix survives registration order', () => {
  const schemas = [
    { name: 'write', description: 'write a file', parameters: { type: 'object' } },
    { name: 'bash', description: 'run', parameters: { type: 'object' } },
  ]
  assert.deepEqual(toAnthropicTools(schemas), [
    { name: 'bash', description: 'run', input_schema: { type: 'object' } },
    { name: 'write', description: 'write a file', input_schema: { type: 'object' } },
  ])
  assert.deepEqual(
    toAnthropicTools([...schemas].reverse()),
    toAnthropicTools(schemas),
    'the wire order does not depend on the input order',
  )
})

test('Anthropic translator: text + tool_use stream with usage before finish', () => {
  const events: AnthropicStreamEvent[] = [
    { type: 'message_start', message: { usage: { input_tokens: 50, cache_read_input_tokens: 10 } } },
    { type: 'content_block_start', index: 0, content_block: { type: 'text' } },
    { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Hel' } },
    { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'lo' } },
    { type: 'content_block_stop', index: 0 },
    { type: 'content_block_start', index: 1, content_block: { type: 'tool_use', id: 'toolu-1', name: 'bash' } },
    { type: 'content_block_delta', index: 1, delta: { type: 'input_json_delta', partial_json: '{"cmd":' } },
    { type: 'content_block_delta', index: 1, delta: { type: 'input_json_delta', partial_json: '"ls"}' } },
    { type: 'content_block_stop', index: 1 },
    { type: 'message_delta', delta: { stop_reason: 'tool_use' }, usage: { output_tokens: 7 } },
    { type: 'message_stop' },
  ]
  const chunks = drain(new AnthropicStreamTranslator(), events)
  assert.deepEqual(chunks, [
    { type: 'block-start', index: 0, blockType: 'text' },
    { type: 'text-delta', index: 0, text: 'Hel' },
    { type: 'text-delta', index: 0, text: 'lo' },
    { type: 'block-end', index: 0, block: { type: 'text', text: 'Hello' } },
    { type: 'block-start', index: 1, blockType: 'tool-call' },
    { type: 'tool-call-delta', index: 1, id: 'toolu-1', name: 'bash', argumentsDelta: '' },
    { type: 'tool-call-delta', index: 1, id: 'toolu-1', name: 'bash', argumentsDelta: '{"cmd":' },
    { type: 'tool-call-delta', index: 1, id: 'toolu-1', name: 'bash', argumentsDelta: '"ls"}' },
    { type: 'block-end', index: 1, block: { type: 'tool-call', id: 'toolu-1', name: 'bash', arguments: '{"cmd":"ls"}' } },
    { type: 'usage', usage: { inputTokens: 50, outputTokens: 7, cacheReadTokens: 10 } },
    { type: 'finish', reason: { kind: 'tool-calls' } },
  ])
})

test('Anthropic translator: stop reasons and empty completion', () => {
  const maxed = drain(new AnthropicStreamTranslator(), [
    { type: 'message_start', message: { usage: { input_tokens: 5 } } },
    { type: 'content_block_start', index: 0, content_block: { type: 'text' } },
    { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'x' } },
    { type: 'content_block_stop', index: 0 },
    { type: 'message_delta', delta: { stop_reason: 'max_tokens' }, usage: { output_tokens: 1 } },
    { type: 'message_stop' },
  ])
  assert.deepEqual(maxed.at(-1), { type: 'finish', reason: { kind: 'max-tokens' } })

  const empty = drain(new AnthropicStreamTranslator(), [
    { type: 'message_start', message: { usage: { input_tokens: 5 } } },
    { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 0 } },
    { type: 'message_stop' },
  ])
  assert.deepEqual(empty.at(-1), {
    type: 'finish',
    reason: {
      kind: 'error',
      failure: { message: 'model returned a completed response with no content', code: 'EMPTY_RESPONSE' },
    },
  })
  const usageIndex = empty.findIndex(chunk => chunk.type === 'usage')
  assert.ok(usageIndex >= 0 && usageIndex < empty.length - 1, 'usage comes before finish')
})

test('Anthropic translator: error event mapping', () => {
  const tooLong = new AnthropicStreamTranslator()
  assert.throws(
    () => tooLong.push({ type: 'error', error: { type: 'invalid_request_error', message: 'prompt is too long: 300000 tokens' } }),
    (error: unknown) => error instanceof LlmError && error.code === 'CONTEXT_WINDOW_EXCEEDED',
  )
  const rateLimited = new AnthropicStreamTranslator()
  assert.throws(
    () => rateLimited.push({ type: 'error', error: { type: 'rate_limit_error', message: 'slow down' } }),
    (error: unknown) => error instanceof LlmError && error.code === 'RATE_LIMIT',
  )
  const overloaded = new AnthropicStreamTranslator()
  assert.throws(
    () => overloaded.push({ type: 'error', error: { type: 'overloaded_error', message: 'busy' } }),
    (error: unknown) => error instanceof LlmError && error.code === 'SERVER',
  )
  const auth = new AnthropicStreamTranslator()
  assert.throws(
    () => auth.push({ type: 'error', error: { type: 'authentication_error', message: 'bad token' } }),
    (error: unknown) => error instanceof LlmError && error.code === 'AUTH',
  )
})
