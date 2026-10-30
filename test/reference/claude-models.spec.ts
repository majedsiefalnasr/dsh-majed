/** MIT reference b802311: test/models.spec.ts Claude subset (static/discovered catalogs, output cap, cache breakpoints). See src/PROVENANCE.md (#132). */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import './keep-alive.js'
import { MessageId } from '@deepseek-ai/dsh-llm'
import type { Message } from '@deepseek-ai/dsh-llm'
import { ClaudeAdapter, claudeRequestBody, fetchClaudeModels } from '../../src/providers/claude.js'
import { AccountTokenManager } from '../../src/providers/accounts.js'
import type { FetchFn } from '../../src/providers/common.js'
import type { ClaudeSession } from '../../src/auth/store.js'

const STATIC_CLAUDE = [{ id: 'claude-opus-4-5', name: 'Claude Opus 4.5' }]

const claudeSession: ClaudeSession = {
  accessToken: 'at',
  refreshToken: 'rt',
  expiresAt: Date.now() + 3_600_000,
  scopes: 'scope',
}

function memoryTokens<S extends { accessToken: string; refreshToken: string; expiresAt: number }>(
  initial: S | undefined,
): AccountTokenManager<S> {
  let stored = initial
  return new AccountTokenManager<S>({
    provider: 'codex',
    displayName: 'Test',
    makeOptions: () => ({
      preemptMs: 0,
      refresh: session => Promise.resolve(session),
      isPermanent: () => false,
    }),
    io: {
      list: () => Promise.resolve(stored === undefined ? [] : [{ key: 'acct', session: stored }]),
      get: () => Promise.resolve(stored),
      save: (_account, session) => {
        stored = session
        return Promise.resolve()
      },
      remove: () => {
        stored = undefined
        return Promise.resolve()
      },
    },
  })
}

function fakeFetch(payload: unknown, status = 200): { fetchFn: FetchFn; calls: () => number } {
  let calls = 0
  const fetchFn: FetchFn = (() => {
    calls += 1
    return Promise.resolve(new Response(JSON.stringify(payload), { status }))
  }) as FetchFn
  return { fetchFn, calls: () => calls }
}

const CLAUDE_MODELS_PAYLOAD = {
  data: [
    { type: 'model', id: 'claude-opus-5-5', display_name: 'Claude Opus 5.5', max_input_tokens: 1_000_000, max_tokens: 128_000 },
    { type: 'model', id: 'claude-opus-4-5', display_name: 'Claude Opus 4.5', max_input_tokens: 200_000, max_tokens: 64_000 },
    { type: 'model', id: 'claude-bare', display_name: 'Bare' },
    { type: 'model', id: 'claude-odd', display_name: 'Odd', max_input_tokens: '1e6', max_tokens: -5 },
  ],
}

function claudeMessage(id: string, role: Exclude<Message['role'], 'tool'>, text: string): Message {
  const content = [{ type: 'text' as const, text }]
  if (role === 'assistant') return {
    id: MessageId(id), role, content,
    source: { kind: 'model', provider: 'claude', model: 'claude-opus-5' },
  }
  if (role === 'system') return { id: MessageId(id), role, content, source: { kind: 'system-prompt' } }
  return { id: MessageId(id), role, content, source: { kind: 'user' } }
}

function claudeHistory(turns: number): Message[] {
  const history: Message[] = [claudeMessage('s0', 'system', 'opening')]
  for (let turn = 0; turn < turns; turn++) {
    history.push(claudeMessage(`u${turn}`, 'user', `q${turn}`))
    history.push(claudeMessage(`a${turn}`, 'assistant', `r${turn}`))
  }
  return history
}

function cacheMarkers(body: Record<string, unknown>): unknown[] {
  const system = body.system as Record<string, unknown>[]
  const messages = body.messages as { content: Record<string, unknown>[] }[]
  return [...system, ...messages.flatMap(entry => entry.content)]
    .filter(block => block.cache_control !== undefined)
    .map(block => block.cache_control)
}

test('a configured default cannot invent a reasoning block for claude', async () => {
  // Claude advertises efforts only through its live catalog; a model it does
  // not cover exposes none, so the harness rejects an explicit effort before
  // provider I/O rather than letting the API 400. A configured default must
  // not manufacture the capability.
  const claude = new ClaudeAdapter({
    models: STATIC_CLAUDE,
    streamIdleTimeoutMs: 1000,
    tokens: memoryTokens(claudeSession),
    discovery: false,
    defaultEffortOf: () => 'high',
  })
  assert.equal((await claude.resolveModel('claude', 'claude-opus-4-5')).reasoning, undefined)
  // Same with no configured default at all: unchanged from before the feature.
  const plain = new ClaudeAdapter({
    models: STATIC_CLAUDE,
    streamIdleTimeoutMs: 1000,
    tokens: memoryTokens(claudeSession),
    discovery: false,
  })
  assert.equal((await plain.resolveModel('claude', 'claude-opus-4-5')).reasoning, undefined)
})

test('claude logged in returns the static catalog', async () => {
  const claude = new ClaudeAdapter({
    models: STATIC_CLAUDE,
    streamIdleTimeoutMs: 1000,
    tokens: memoryTokens(claudeSession),
    discovery: false,
  })
  const models = await claude.listModels('claude')
  assert.deepEqual(models.map(model => model.id), ['claude-opus-4-5'])
})

test('fetchClaudeModels carries the advertised context window and output cap', async () => {
  const models = await fetchClaudeModels(claudeSession, fakeFetch(CLAUDE_MODELS_PAYLOAD).fetchFn)
  assert.deepEqual(models, [
    { id: 'claude-opus-5-5', name: 'Claude Opus 5.5', contextWindow: 1_000_000, maxOutputTokens: 128_000 },
    { id: 'claude-opus-4-5', name: 'Claude Opus 4.5', contextWindow: 200_000, maxOutputTokens: 64_000 },
    { id: 'claude-bare', name: 'Bare' },
    // Malformed limits are dropped rather than poisoning the catalog.
    { id: 'claude-odd', name: 'Odd' },
  ])
})

test('claude resolveModel serves discovered limits for models newer than the bundled catalog', async () => {
  const claude = new ClaudeAdapter({
    models: STATIC_CLAUDE,
    streamIdleTimeoutMs: 1000,
    tokens: memoryTokens(claudeSession),
    discovery: true,
    fetchFn: fakeFetch(CLAUDE_MODELS_PAYLOAD).fetchFn,
  })
  // Not in the configured catalog: the endpoint's numbers win over the 200k/32k fallbacks.
  const fresh = await claude.resolveModel('claude', 'claude-opus-5-5')
  assert.equal(fresh.context?.contextWindow, 1_000_000)
  assert.equal(fresh.defaultMaxTokens, 128_000)
  // Discovered but silent on limits: the fallbacks still apply.
  const bare = await claude.resolveModel('claude', 'claude-bare')
  assert.equal(bare.context?.contextWindow, 200_000)
  assert.equal(bare.defaultMaxTokens, 32_000)
  // Unknown to discovery and configuration alike: unchanged behaviour.
  const unknown = await claude.resolveModel('claude', 'claude-unknown')
  assert.equal(unknown.context?.contextWindow, 200_000)
  assert.equal(unknown.defaultMaxTokens, 32_000)
})

test('claude configured output cap may lower but never exceed the discovered ceiling', async () => {
  const configured = [
    { id: 'claude-opus-4-5', name: 'Claude Opus 4.5', maxTokens: 16_000 },
    { id: 'claude-opus-5-5', name: 'Claude Opus 5.5', maxTokens: 256_000, contextWindow: 400_000 },
  ]
  const claude = new ClaudeAdapter({
    models: configured,
    streamIdleTimeoutMs: 1000,
    tokens: memoryTokens(claudeSession),
    discovery: true,
    fetchFn: fakeFetch(CLAUDE_MODELS_PAYLOAD).fetchFn,
  })
  assert.equal((await claude.resolveModel('claude', 'claude-opus-4-5')).defaultMaxTokens, 16_000)
  const capped = await claude.resolveModel('claude', 'claude-opus-5-5')
  assert.equal(capped.defaultMaxTokens, 128_000)
  assert.equal(capped.context?.contextWindow, 1_000_000, 'discovery outranks a stale configured window')
})

test('claudeRequestBody ships the cache breakpoints and never exceeds four', () => {
  const history: Message[] = [claudeMessage('s0', 'system', 'opening')]
  for (let turn = 0; turn < 16; turn++) {
    history.push(claudeMessage(`u${turn}`, 'user', `q${turn}`))
    history.push(claudeMessage(`a${turn}`, 'assistant', `r${turn}`))
  }
  const body = claudeRequestBody(
    {
      provider: 'claude',
      model: 'claude-opus-5',
      messages: history,
      system: 'explicit',
      tools: [
        { name: 'write', description: 'write a file', parameters: { type: 'object' } },
        { name: 'bash', description: 'run', parameters: { type: 'object' } },
      ],
    },
    history,
    32_000,
    { type: 'adaptive', display: 'summarized' },
    'high',
  )
  const system = body.system as Record<string, unknown>[]
  const messages = body.messages as { content: Record<string, unknown>[] }[]
  const marked = [...system, ...messages.flatMap(entry => entry.content)]
    .filter(block => block.cache_control !== undefined)
  assert.equal(marked.length, 4, 'one on system plus three across the history is Anthropic\'s maximum')
  assert.deepEqual(system[system.length - 1].cache_control, { type: 'ephemeral' }, 'the tools+system prefix is cached')
  assert.deepEqual(
    (body.tools as { name: string }[]).map(tool => tool.name),
    ['bash', 'write'],
    'tools ride in name order',
  )
  assert.deepEqual(body.thinking, { type: 'adaptive', display: 'summarized' })
  assert.deepEqual(body.output_config, { effort: 'high' })
  assert.equal(body.stream, true)
})

test('claudeRequestBody without a TTL is byte-identical to the five-minute request', () => {
  const history = claudeHistory(16)
  const options = { provider: 'claude', model: 'claude-opus-5', messages: history, system: 'explicit' }
  const implicit = claudeRequestBody(options, history, 32_000)
  const explicit = claudeRequestBody(options, history, 32_000, undefined, undefined, '5m')
  assert.equal(JSON.stringify(explicit), JSON.stringify(implicit), 'opting in to 5m changes nothing on the wire')
  assert.deepEqual(cacheMarkers(implicit), Array(4).fill({ type: 'ephemeral' }))
  assert.equal(JSON.stringify(implicit).includes('"ttl"'), false, 'no ttl field is sent by default')
})

test('claudeRequestBody marks every breakpoint one-hour when asked, and only the marker changes', () => {
  const history = claudeHistory(16)
  const options = { provider: 'claude', model: 'claude-opus-5', messages: history, system: 'explicit' }
  const short = claudeRequestBody(options, history, 32_000)
  const long = claudeRequestBody(options, history, 32_000, undefined, undefined, '1h')
  assert.deepEqual(cacheMarkers(long), Array(4).fill({ type: 'ephemeral', ttl: '1h' }))
  // Dropping the ttl field must give back exactly the five-minute request, so
  // nothing else about the body (tools, ordering, thinking, metadata) moved.
  assert.equal(JSON.stringify(long).replaceAll(',"ttl":"1h"', ''), JSON.stringify(short))
})

test('claudeRequestBody never puts a one-hour mark after a five-minute one', () => {
  // Anthropic answers 400 to that ordering, so one TTL per request is the invariant.
  for (const ttl of ['5m', '1h'] as const) {
    const history = claudeHistory(16)
    const body = claudeRequestBody(
      { provider: 'claude', model: 'claude-opus-5', messages: history, system: 'explicit' },
      history, 32_000, undefined, undefined, ttl,
    )
    const ttls = new Set(cacheMarkers(body).map(marker => (marker as { ttl?: string }).ttl ?? '5m'))
    assert.deepEqual([...ttls], [ttl])
  }
})

test('claudeRequestBody keeps auxiliary calls (compaction, session titles) on five minutes even when 1h is set', () => {
  // Preserve the existing auxiliary-request TTL rather than applying the 1h option.
  for (const purpose of ['compaction', 'session-title'] as const) {
    const history = claudeHistory(16)
    const body = claudeRequestBody(
      { provider: 'claude', model: 'claude-opus-5', messages: history, system: 'explicit', purpose },
      history, 32_000, undefined, undefined, '1h',
    )
    assert.deepEqual(cacheMarkers(body), Array(4).fill({ type: 'ephemeral' }), purpose)
  }
  const history = claudeHistory(16)
  const ordinary = claudeRequestBody(
    { provider: 'claude', model: 'claude-opus-5', messages: history, system: 'explicit' },
    history, 32_000, undefined, undefined, '1h',
  )
  assert.deepEqual(cacheMarkers(ordinary), Array(4).fill({ type: 'ephemeral', ttl: '1h' }), 'ordinary requests still get 1h')
})

test('claudeRequestBody omits tools, thinking and effort when the request carries none', () => {
  const history: Message[] = [claudeMessage('u0', 'user', 'hi')]
  const body = claudeRequestBody({ provider: 'claude', model: 'claude-opus-5', messages: history }, history, 32_000)
  assert.equal('tools' in body, false)
  assert.equal('thinking' in body, false)
  assert.equal('output_config' in body, false)
  assert.equal('metadata' in body, false)
  assert.equal(body.max_tokens, 32_000)
})

