/** MIT reference b802311: translate.spec.ts Responses/shared image subset. See src/PROVENANCE.md. */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { LlmError, MessageId } from '@deepseek-ai/dsh-llm'
import { ToolCallId } from '../../src/compat.js'
import type { CompatibleContentBlock as ContentBlock, CompatibleMessage as Message } from '../../src/compat.js'
import type { MessageSource, StreamChunk } from '@deepseek-ai/dsh-llm'
import {
  ResponsesStreamTranslator,
  toResponsesInput,
  toResponsesTools,
} from '../../src/translate/responses.js'
import type { ReasoningReplayItem, ResponsesStreamEvent } from '../../src/translate/responses.js'
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

test('toResponsesInput: text, tool call, and tool result round trip', () => {
  const { instructions, input } = toResponsesInput([
    message('user', [{ type: 'text', text: 'list files' }]),
    message('assistant', [
      { type: 'text', text: 'running ls' },
      toolCall('call-1', 'bash', '{"cmd":"ls"}'),
    ]),
    message('user', [toolResult('call-1', 'file-a\nfile-b')], { kind: 'tool', callId: ToolCallId('call-1') }),
  ], 'be helpful')

  assert.equal(instructions, 'be helpful')
  assert.deepEqual(input, [
    { type: 'message', role: 'user', content: [{ type: 'input_text', text: 'list files' }] },
    { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'running ls' }] },
    { type: 'function_call', call_id: 'call-1', name: 'bash', arguments: '{"cmd":"ls"}' },
    { type: 'function_call_output', call_id: 'call-1', output: 'file-a\nfile-b' },
  ])
})

test('toResponsesInput: first-class tool-role messages become function outputs', () => {
  const result: TranslatableMessage = {
    role: 'tool',
    toolCallId: 'call-current',
    content: [{ type: 'text', text: 'current result' }],
  }
  const messages: TranslatableMessage[] = [
    message('assistant', [toolCall('call-current', 'bash', '{}')]),
    result,
  ]
  const { input } = toResponsesInput(messages)
  assert.deepEqual(input, [
    { type: 'function_call', call_id: 'call-current', name: 'bash', arguments: '{}' },
    { type: 'function_call_output', call_id: 'call-current', output: 'current result' },
  ])

})
test('developer messages from DSH 0.1.7 are not attributed to the assistant', () => {
  const messages: TranslatableMessage[] = [
    { role: 'developer', content: [{ type: 'text', text: 'Tool inventory changed.' }] },
  ]
  assert.equal(toResponsesInput(messages).input[0].role, 'developer')
})

test('toResponsesInput: first-class tool images follow the function output', () => {
  const input = toResponsesInput([{
    role: 'tool',
    toolCallId: 'call-image',
    content: [
      { type: 'text', text: 'caption' },
      { type: 'image', mediaType: 'image/png', dataBase64: 'aGk=' },
    ],
  }]).input
  assert.deepEqual(input.map(item => item.type), ['function_call_output', 'message'])
  assert.equal(input[0].output, 'caption')
  assert.equal((input[1].content as Record<string, unknown>[])[1].type, 'input_image')
})

test('resolveImages preserves first-class tool call ids', async () => {
  const ref = { attachmentId: 'image-1', mediaType: 'image/png', bytes: 2, width: 1, height: 1 }
  const result = {
    role: 'tool',
    toolCallId: 'call-image',
    content: [{ type: 'image', attachment: ref }],
  } as unknown as Message
  const resolved = await resolveImages([result], {
    readImage: async () => ({ ref, data: new Uint8Array([104, 105]) }),
  } as never)
  assert.equal(resolved[0].toolCallId, 'call-image')
  assert.equal(toResponsesInput(resolved).input[0].call_id, 'call-image')
})

test('toResponsesInput: system-role messages become instructions unless options.system wins', () => {
  const systemMessage = message('system', [{ type: 'text', text: 'from history' }])
  const fromMessages = toResponsesInput([systemMessage])
  assert.equal(fromMessages.instructions, 'from history')
  assert.deepEqual(fromMessages.input, [])
  const explicit = toResponsesInput([systemMessage], 'explicit system')
  assert.equal(explicit.instructions, 'explicit system')
})

test('toResponsesInput: reasoningFor replays completed reasoning items ahead of the tool call', () => {
  const messages = () => [
    message('user', [{ type: 'text', text: 'go' }]),
    message('assistant', [
      toolCall('call-1', 'bash', '{}'),
      toolCall('call-2', 'grep', '{}'),
    ]),
  ]
  // The replay shape is the COMPLETE reasoning item: the Responses input
  // schema does not treat a reasoning item's id or summary as optional.
  const item = (id: string, enc: string): ReasoningReplayItem => ({
    type: 'reasoning',
    id,
    summary: [{ type: 'summary_text', text: 'thought' }],
    status: 'completed',
    encrypted_content: enc,
  })
  // Parallel calls of one response share ONE array instance → replay once,
  // before the first call.
  const shared = [item('rs_1', 'ENC1'), item('rs_2', 'ENC2')]
  assert.deepEqual(toResponsesInput(messages(), undefined, () => shared).input, [
    { type: 'message', role: 'user', content: [{ type: 'input_text', text: 'go' }] },
    { type: 'reasoning', id: 'rs_1', summary: [{ type: 'summary_text', text: 'thought' }], status: 'completed', encrypted_content: 'ENC1' },
    { type: 'reasoning', id: 'rs_2', summary: [{ type: 'summary_text', text: 'thought' }], status: 'completed', encrypted_content: 'ENC2' },
    { type: 'function_call', call_id: 'call-1', name: 'bash', arguments: '{}' },
    { type: 'function_call', call_id: 'call-2', name: 'grep', arguments: '{}' },
  ])
  // Distinct arrays per call → each replays ahead of its own call.
  const byCall: Record<string, ReasoningReplayItem[]> = {
    'call-1': [item('rs_1', 'E1')],
    'call-2': [item('rs_2', 'E2')],
  }
  assert.deepEqual(toResponsesInput(messages(), undefined, callId => byCall[callId]).input, [
    { type: 'message', role: 'user', content: [{ type: 'input_text', text: 'go' }] },
    { type: 'reasoning', id: 'rs_1', summary: [{ type: 'summary_text', text: 'thought' }], status: 'completed', encrypted_content: 'E1' },
    { type: 'function_call', call_id: 'call-1', name: 'bash', arguments: '{}' },
    { type: 'reasoning', id: 'rs_2', summary: [{ type: 'summary_text', text: 'thought' }], status: 'completed', encrypted_content: 'E2' },
    { type: 'function_call', call_id: 'call-2', name: 'grep', arguments: '{}' },
  ])
  // Items captured without optional fields replay with just the required ones.
  const minimal: ReasoningReplayItem[] = [{ type: 'reasoning', id: 'rs_3', encrypted_content: 'E3' }]
  assert.deepEqual(
    toResponsesInput(
      [message('assistant', [toolCall('call-x', 'bash', '{}')])],
      undefined,
      () => minimal,
    ).input,
    [
      { type: 'reasoning', id: 'rs_3', encrypted_content: 'E3' },
      { type: 'function_call', call_id: 'call-x', name: 'bash', arguments: '{}' },
    ],
  )
  // An unknown call id injects nothing.
  const toolOnly = [{ type: 'function_call', call_id: 'call-x', name: 'bash', arguments: '{}' }]
  assert.deepEqual(
    toResponsesInput([message('assistant', [toolCall('call-x', 'bash', '{}')])], undefined, () => undefined).input,
    toolOnly,
  )
  // Omitting the callback keeps the pre-replay behavior.
  assert.deepEqual(toResponsesInput([message('assistant', [toolCall('call-x', 'bash', '{}')])]).input, toolOnly)
})

test('toResponsesTools maps to Responses function tools', () => {
  assert.deepEqual(toResponsesTools([{ name: 'bash', description: 'run', parameters: { type: 'object' } }], { strict: false }), [
    { type: 'function', name: 'bash', description: 'run', parameters: { type: 'object' }, strict: false },
  ])
})

test('toResponsesInput: resolved image parts become input_image data URLs', () => {
  const { input } = toResponsesInput([{
    role: 'user',
    content: [
      { type: 'text', text: 'what is this?' },
      { type: 'image', mediaType: 'image/png', dataBase64: 'aGk=' },
    ],
  }])
  assert.deepEqual(input, [{
    type: 'message',
    role: 'user',
    content: [
      { type: 'input_text', text: 'what is this?' },
      { type: 'input_image', image_url: 'data:image/png;base64,aGk=' },
    ],
  }])
  // An unresolved ImageBlock (attachment reference only) is skipped.
  const unresolved = toResponsesInput([{
    role: 'user',
    content: [{ type: 'image', attachment: { attachmentId: 'x' } } as never],
  }])
  assert.deepEqual(unresolved.input, [])
})

test('resolveImages: passthrough, loud failure without attachments, and resolution', async () => {
  const plain = [message('user', [{ type: 'text', text: 'hi' }])]
  assert.equal(await resolveImages(plain, undefined), plain, 'no images → same array, no service needed')

  const withImage = [message('user', [{
    type: 'image',
    attachment: { attachmentId: 'a1', mediaType: 'image/png', bytes: 3, width: 1, height: 1 },
  } as never])]
  await assert.rejects(
    () => resolveImages(withImage, undefined),
    (error: unknown) => error instanceof LlmError && error.code === 'UNSUPPORTED',
  )

  const attachments = {
    readImage: (ref: unknown) => Promise.resolve({ ref, data: new Uint8Array([104, 105]) }),
  } as never
  const resolved = await resolveImages(withImage, attachments)
  assert.deepEqual(resolved[0].content[0], { type: 'image', mediaType: 'image/png', dataBase64: 'aGk=' })
  assert.match((resolved[0].content[1] as { text: string }).text, /image_generate.referenceImages/)
  assert.match((resolved[0].content[1] as { text: string }).text, /"attachmentId":"a1"/)
})

test('tool-result images: resolve attachments and retain parallel results before image follow-up', async () => {
  const ref = { attachmentId: 'tool-image', mediaType: 'image/png', bytes: 2, width: 1, height: 1 }
  const messages = [
    message('assistant', ['a', 'b'].map(id => ({ type: 'tool-call', id: ToolCallId(id), name: 'read_image', arguments: '{}' }))),
    ...['a', 'b'].map(id => message('user', [{
      type: 'tool-result', toolCallId: ToolCallId(id), isError: false,
      content: [{ type: 'text', text: id }, { type: 'image', attachment: ref } as never],
    }])),
  ]
  const before = structuredClone(messages)
  const signal = new AbortController().signal
  let reads = 0
  const resolved = await resolveImages(messages, {
    readImage: async (attachment: unknown, actualSignal: unknown) => {
      assert.equal(attachment, ref)
      assert.equal(actualSignal, signal)
      reads++
      return { ref, data: new Uint8Array([104, 105]) }
    },
  } as never, signal)
  assert.equal(reads, 2)
  assert.deepEqual(messages, before, 'must not mutate stored history')
  const responses = toResponsesInput(resolved).input
  assert.deepEqual(responses.map(item => item.type), ['function_call', 'function_call', 'function_call_output', 'function_call_output', 'message'])
  const responseImages = (responses[4].content as Record<string, unknown>[]).filter(part => part.type === 'input_image')
  assert.equal(responseImages.length, 2)
  assert.equal(responseImages[0].image_url, 'data:image/png;base64,aGk=')
  await assert.rejects(() => resolveImages(messages, undefined), (error: unknown) => error instanceof LlmError && error.code === 'UNSUPPORTED')
  await assert.rejects(() => resolveImages(messages, { readImage: async () => { throw new Error('read failed') } } as never), /read failed/)
})

test('tool-result images: image-only errors, multiple images and separate turns retain their content', () => {
  const image = { type: 'image' as const, mediaType: 'image/jpeg', dataBase64: 'aGk=' }
  const messages: TranslatableMessage[] = [
    { role: 'user', content: [{ type: 'tool-result', toolCallId: ToolCallId('first'), isError: true, content: [image, image] }] },
    { role: 'assistant', content: [{ type: 'text', text: 'first image seen' }] },
    { role: 'user', content: [{ type: 'tool-result', toolCallId: ToolCallId('second'), content: [{ type: 'text', text: 'caption' }, image] }] },
  ]
  const responses = toResponsesInput(messages).input
  assert.equal(responses[0].output, '', 'image-only result still answers its tool call')
  assert.equal((responses[1].content as unknown[]).length, 3, 'label followed by two images')
  assert.equal(responses[2].role, 'assistant')
  assert.equal(responses[3].output, 'caption')
  assert.equal((responses[4].content as unknown[]).length, 2)

})

test('Responses translator: text + tool call stream yields usage before finish', () => {
  const events: ResponsesStreamEvent[] = [
    { type: 'response.output_item.added', item: { type: 'message', id: 'msg-1' } },
    { type: 'response.output_text.delta', item_id: 'msg-1', content_index: 0, delta: 'Hel' },
    { type: 'response.output_text.delta', item_id: 'msg-1', content_index: 0, delta: 'lo' },
    {
      type: 'response.output_item.added',
      item: { type: 'function_call', id: 'fc-1', call_id: 'call-1', name: 'bash' },
    },
    { type: 'response.function_call_arguments.delta', item_id: 'fc-1', delta: '{"cmd":' },
    { type: 'response.function_call_arguments.delta', item_id: 'fc-1', delta: '"ls"}' },
    {
      type: 'response.output_item.done',
      item: { type: 'function_call', id: 'fc-1', call_id: 'call-1', name: 'bash', arguments: '{"cmd":"ls"}' },
    },
    { type: 'response.output_item.done', item: { type: 'message', id: 'msg-1' } },
    {
      type: 'response.completed',
      response: {
        usage: {
          input_tokens: 100,
          output_tokens: 20,
          input_tokens_details: { cached_tokens: 30 },
          output_tokens_details: { reasoning_tokens: 5 },
        },
      },
    },
  ]
  const chunks = drain(new ResponsesStreamTranslator(), events)
  assert.deepEqual(chunks, [
    { type: 'block-start', index: 0, blockType: 'text' },
    { type: 'text-delta', index: 0, text: 'Hel' },
    { type: 'text-delta', index: 0, text: 'lo' },
    { type: 'block-start', index: 1, blockType: 'tool-call' },
    { type: 'tool-call-delta', index: 1, id: 'call-1', name: 'bash', argumentsDelta: '' },
    { type: 'tool-call-delta', index: 1, id: 'call-1', name: 'bash', argumentsDelta: '{"cmd":' },
    { type: 'tool-call-delta', index: 1, id: 'call-1', name: 'bash', argumentsDelta: '"ls"}' },
    { type: 'block-end', index: 1, block: { type: 'tool-call', id: 'call-1', name: 'bash', arguments: '{"cmd":"ls"}' } },
    { type: 'block-end', index: 0, block: { type: 'text', text: 'Hello' } },
    { type: 'usage', usage: { inputTokens: 70, outputTokens: 20, cacheReadTokens: 30, reasoningTokens: 5 } },
    { type: 'finish', reason: { kind: 'tool-calls' } },
  ])
})

test('Responses translator: plain text completion finishes with stop', () => {
  const chunks = drain(new ResponsesStreamTranslator(), [
    { type: 'response.output_text.delta', item_id: 'msg-1', content_index: 0, delta: 'hi' },
    { type: 'response.completed', response: { usage: { input_tokens: 10, output_tokens: 2 } } },
  ])
  assert.deepEqual(chunks.at(-2), { type: 'usage', usage: { inputTokens: 10, outputTokens: 2 } })
  assert.deepEqual(chunks.at(-1), { type: 'finish', reason: { kind: 'stop' } })
})

test('Responses translator: empty completion is an EMPTY_RESPONSE error finish', () => {
  const chunks = drain(new ResponsesStreamTranslator(), [
    { type: 'response.completed', response: { usage: { input_tokens: 1, output_tokens: 0 } } },
  ])
  assert.deepEqual(chunks.at(-1), {
    type: 'finish',
    reason: {
      kind: 'error',
      failure: { message: 'model returned a completed response with no content', code: 'EMPTY_RESPONSE' },
    },
  })
  const usageIndex = chunks.findIndex(chunk => chunk.type === 'usage')
  assert.ok(usageIndex >= 0 && usageIndex < chunks.length - 1, 'usage comes before finish')
})

test('Responses translator: response.failed maps context overflow and quota', () => {
  const overflow = new ResponsesStreamTranslator()
  assert.throws(
    () => overflow.push({ type: 'response.failed', response: { error: { code: 'context_window_exceeded', message: 'too long' } } }),
    (error: unknown) => error instanceof LlmError && error.code === 'CONTEXT_WINDOW_EXCEEDED',
  )
  const quota = new ResponsesStreamTranslator()
  assert.throws(
    () => quota.push({ type: 'response.failed', response: { error: { code: 'insufficient_quota', message: 'out of credits' } } }),
    (error: unknown) => error instanceof LlmError && error.code === 'QUOTA',
  )
  const generic = new ResponsesStreamTranslator()
  assert.throws(
    () => generic.push({ type: 'error', code: 'server_error', message: 'boom' }),
    (error: unknown) => error instanceof LlmError && error.code === 'SERVER',
  )
})
