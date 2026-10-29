import { test } from 'node:test';

import assert from 'node:assert/strict'

import './keep-alive.js'

import { MessageId, ReasoningEffortId } from '@deepseek-ai/dsh-llm';

import type { Message } from '@deepseek-ai/dsh-llm';

import { CodexAdapter, codexRequestBody, fetchCodexModels, projectCodexMessages } from '../../src/providers/codex.js';

import { toResponsesInput } from '../../src/translate/responses.js';

import { AccountTokenManager } from '../../src/providers/accounts.js';

import type { CatalogPersistence, CatalogSnapshot, FetchFn } from '../../src/providers/common.js';

import type { CodexSession } from '../../src/auth/store.js';

const STATIC_CODEX = [{ id: 'gpt-5.1-codex', name: 'GPT-5.1 Codex' }]

test('Codex projects current harness tool messages into correlated Responses outputs', () => {
  const messages = projectCodexMessages([{
    id: MessageId('tool-message'),
    role: 'tool',
    toolCallId: 'call-current',
    source: { kind: 'tool', callId: 'call-current' },
    content: [{ type: 'text', text: 'done' }],
    isError: false,
  } as unknown as Message])
  assert.deepEqual(toResponsesInput(messages).input, [
    { type: 'function_call_output', call_id: 'call-current', output: 'done' },
  ])
})

test('Codex context overrides clamp per account, restore defaults, and distrust missing maxima', async () => {
  let requested: number | undefined = 512_000
  const sessions = {
    pro: { accessToken: 'pro', refreshToken: 'r', accountId: 'pro', expiresAt: Date.now() + 3600000 },
    plus: { accessToken: 'plus', refreshToken: 'r', accountId: 'plus', expiresAt: Date.now() + 3600000 },
  }
  const adapter = new CodexAdapter({
    models: [], discovery: true, tokens: memoryAccounts(sessions), streamIdleTimeoutMs: 1000,
    contextWindowOf: () => requested,
    fetchFn: (async (_url, init) => new Response(JSON.stringify({ models: [
      { slug: 'm', context_window: 272000, max_context_window: new Headers(init?.headers).get('chatgpt-account-id') === 'pro' ? 872000 : 300000 },
      { slug: 'unknown-max', context_window: 272000 },
    ] }))) as FetchFn,
  })
  assert.equal((await adapter.resolveOwnModel('codex', 'm', 'pro')).context?.contextWindow, 512000)
  assert.equal((await adapter.resolveOwnModel('codex', 'm', 'plus')).context?.contextWindow, 300000)
  assert.equal((await adapter.resolveOwnModel('codex', 'unknown-max', 'pro')).context?.contextWindow, 272000)
  requested = undefined
  assert.equal((await adapter.resolveOwnModel('codex', 'm', 'pro')).context?.contextWindow, 272000)
  requested = 128000
  assert.equal((await adapter.resolveOwnModel('codex', 'm', 'pro')).context?.contextWindow, 128000)
})

const codexSession: CodexSession = {
  accessToken: 'at',
  refreshToken: 'rt',
  expiresAt: Date.now() + 3_600_000,
  accountId: 'acct-1',
}

function memoryAccounts<S extends { accessToken: string; refreshToken: string; expiresAt: number }>(
  accounts: Record<string, S>,
): AccountTokenManager<S> {
  const stored = new Map(Object.entries(accounts))
  return new AccountTokenManager<S>({
    provider: 'codex',
    displayName: 'Test',
    makeOptions: () => ({
      preemptMs: 0,
      refresh: session => Promise.resolve(session),
      isPermanent: () => false,
    }),
    io: {
      list: () => Promise.resolve([...stored.entries()].map(([key, session]) => ({ key, session }))),
      get: account => Promise.resolve(
        account === undefined ? stored.values().next().value : stored.get(account),
      ),
      save: (account, session) => {
        stored.set(account, session)
        return Promise.resolve()
      },
      remove: account => {
        stored.delete(account)
        return Promise.resolve()
      },
    },
  })
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

function codexAdapter(overrides: {
  session?: CodexSession
  discovery?: boolean
  fetchFn?: FetchFn
  warnings?: string[]
  defaultEffortOf?: (model: string) => string | undefined
}): CodexAdapter {
  return new CodexAdapter({
    models: STATIC_CODEX,
    streamIdleTimeoutMs: 1000,
    tokens: memoryTokens(overrides.session),
    discovery: overrides.discovery ?? true,
    ...overrides.fetchFn === undefined ? {} : { fetchFn: overrides.fetchFn },
    ...overrides.warnings === undefined
      ? {}
      : { onWarn: (message: string) => { overrides.warnings?.push(message) } },
    ...overrides.defaultEffortOf === undefined ? {} : { defaultEffortOf: overrides.defaultEffortOf },
  })
}

const CODEX_MODELS_PAYLOAD = {
  models: [
    {
      slug: 'gpt-5.2-codex',
      display_name: 'GPT-5.2 Codex',
      description: 'newest',
      context_window: 500_000,
      supported_reasoning_levels: [
        { effort: 'low', description: 'fast' },
        { effort: 'high', description: 'thorough' },
        { effort: 'ultra', description: 'client-side delegation mode' },
      ],
      default_reasoning_level: 'high',
      visibility: 'list',
      priority: 2,
    },
    {
      slug: 'gpt-5.1-codex',
      display_name: 'GPT-5.1 Codex',
      visibility: 'list',
      priority: 1,
    },
    { slug: 'gpt-hidden', display_name: 'Hidden', visibility: 'hide', priority: 0 },
    { slug: 'gpt-none', display_name: 'None', visibility: 'none', priority: 0 },
  ],
}

test('codex catalog version gates GPT-6 and supports an explicit compatibility override', async () => {
  const seen: string[] = []
  const fetchFn: FetchFn = async (input) => {
    const version = new URL(String(input)).searchParams.get('client_version') ?? ''
    seen.push(version)
    return new Response(JSON.stringify({ models: version === '0.147.0'
      ? [{ slug: 'gpt-5.6-sol' }]
      : [{ slug: 'gpt-6-astra', visibility: 'list', supported_reasoning_levels: [{ effort: 'max' }] }, { slug: 'hidden', visibility: 'hide' }],
    }))
  }
  assert.deepEqual((await fetchCodexModels(codexSession, fetchFn)).map(model => model.id), ['gpt-6-astra'])
  assert.deepEqual((await fetchCodexModels(codexSession, fetchFn, undefined, '0.147.0')).map(model => model.id), ['gpt-5.6-sol'])
  assert.deepEqual(seen, ['0.153.4', '0.147.0'])
  await assert.rejects(() => fetchCodexModels(codexSession, fetchFn, undefined, '0.153.4&bad=1'), /codexClientVersion/)
  assert.equal(seen.length, 2, 'invalid versions must not reach the network')
})

test('codex adapter uses the automatic compatibility version for catalog requests', async () => {
  let lookups = 0
  const adapter = new CodexAdapter({
    models: STATIC_CODEX, streamIdleTimeoutMs: 1000, discovery: true,
    tokens: memoryTokens(codexSession),
    resolveClientVersion: async () => { lookups++; return '0.155.0' },
    fetchFn: async (input) => {
      assert.equal(new URL(String(input)).searchParams.get('client_version'), '0.155.0')
      return Response.json({ models: [{ slug: 'gpt-6-astra' }] })
    },
  })
  assert.deepEqual((await adapter.listModels('codex')).map(model => model.id), ['gpt-6-astra'])
  await adapter.listModels('codex')
  assert.equal(lookups, 1, 'a cached model list needs no version lookup')
})

test('codex discovery maps, filters hidden entries, and sorts by priority', async () => {
  const { fetchFn, calls } = fakeFetch(CODEX_MODELS_PAYLOAD)
  const adapter = codexAdapter({ session: codexSession, fetchFn })
  const models = await adapter.listModels('codex')
  assert.deepEqual(models.map(model => model.id), ['gpt-5.1-codex', 'gpt-5.2-codex'])
  assert.equal(models[1].name, 'GPT-5.2 Codex')
  assert.equal(models[1].description, 'newest')
  // The TTL cache serves the second call without another fetch.
  await adapter.listModels('codex')
  assert.equal(calls(), 1)
})

test('codex discovery failure falls back to the static catalog with a warning', async () => {
  const warnings: string[] = []
  const { fetchFn } = fakeFetch({ error: 'boom' }, 500)
  const adapter = codexAdapter({ session: codexSession, fetchFn, warnings })
  const models = await adapter.listModels('codex')
  assert.deepEqual(models.map(model => model.id), ['gpt-5.1-codex'])
  assert.equal(warnings.length, 1)
  assert.match(warnings[0], /codex model discovery failed/)
})

test('fetchCodexModels tolerates entries without visibility or priority', async () => {
  const models = await fetchCodexModels(codexSession, fakeFetch({
    models: [{ slug: 'bare', display_name: 'Bare' }],
  }).fetchFn)
  assert.deepEqual(models, [{ id: 'bare', name: 'Bare' }])
})

test('codex discovery flags models whose catalog advertises a fast service tier', async () => {
  const models = await fetchCodexModels(codexSession, fakeFetch({
    models: [
      {
        slug: 'gpt-5.2-codex',
        display_name: 'GPT-5.2 Codex',
        service_tiers: [{ id: 'priority', name: 'Fast', description: 'Priority processing.' }],
        priority: 1,
      },
      // The legacy catalog spelling (codex-rs additional_speed_tiers).
      { slug: 'gpt-5.2-codex-spark', display_name: 'Spark', additional_speed_tiers: ['fast'], priority: 2 },
      // A model without a fast tier gets no flag.
      { slug: 'gpt-5.1-codex', display_name: 'GPT-5.1 Codex', priority: 3 },
    ],
  }).fetchFn)
  assert.deepEqual(models.map(model => model.id), ['gpt-5.2-codex', 'gpt-5.2-codex-spark', 'gpt-5.1-codex'])
  assert.deepEqual(models.map(model => model.fastTier ?? false), [true, true, false])

  const { fetchFn } = fakeFetch({
    models: [
      { slug: 'gpt-5.2-codex', service_tiers: [{ id: 'priority' }], priority: 1 },
      { slug: 'gpt-5.1-codex', priority: 2 },
    ],
  })
  const adapter = codexAdapter({ session: codexSession, fetchFn })
  assert.deepEqual(await adapter.fastCapableModels(), ['gpt-5.2-codex'])
  assert.equal(await adapter.supportsFastTier('gpt-5.2-codex'), true)
  assert.equal(await adapter.supportsFastTier('gpt-5.1-codex'), false)
  // Discovery off (config override): no fast capability is claimed.
  const staticAdapter = codexAdapter({ session: codexSession, discovery: false })
  assert.deepEqual(await staticAdapter.fastCapableModels(), [])
  assert.equal(await staticAdapter.supportsFastTier('gpt-5.1-codex'), false)
  // Logged out: no fast models, so the Speed toggle hides after logout.
  const loggedOut = codexAdapter({ fetchFn })
  assert.deepEqual(await loggedOut.fastCapableModels(), [])
})

test('codexRequestBody sends service_tier priority only on the fast tier', () => {
  const base = codexRequestBody(
    { provider: 'codex', model: 'gpt-5.1-codex', messages: [] },
    { input: [] },
    false,
  )
  assert.equal(base.model, 'gpt-5.1-codex')
  assert.equal('service_tier' in base, false)

  const fast = codexRequestBody(
    {
      provider: 'codex',
      model: 'gpt-5.1-codex',
      messages: [],
      reasoningEffort: ReasoningEffortId('high'),
    },
    { input: [] },
    true,
  )
  assert.equal(fast.model, 'gpt-5.1-codex')
  assert.equal(fast.service_tier, 'priority')
  assert.deepEqual(fast.reasoning, { effort: 'high', summary: 'auto' })
})

test('codexRequestBody lowers the client-only "ultra" effort to "max" on the wire', () => {
  // A preference saved before discovery stopped listing "ultra" must not
  // reach the Responses API verbatim (HTTP 400); Codex itself sends "max".
  const ultra = codexRequestBody(
    { provider: 'codex', model: 'gpt-6-sol', messages: [], reasoningEffort: ReasoningEffortId('ultra') },
    { input: [] },
    false,
  )
  assert.deepEqual(ultra.reasoning, { effort: 'max', summary: 'auto' })

  // Every other effort is forwarded unchanged.
  for (const effort of ['low', 'medium', 'high', 'xhigh', 'max']) {
    const body = codexRequestBody(
      { provider: 'codex', model: 'gpt-6-sol', messages: [], reasoningEffort: ReasoningEffortId(effort) },
      { input: [] },
      false,
    )
    assert.deepEqual(body.reasoning, { effort, summary: 'auto' })
  }
})

test('codexRequestBody reconciles orphaned tool calls before dispatch', () => {
  const missing = codexRequestBody(
    { provider: 'codex', model: 'gpt-5.6-sol', messages: [] },
    {
      input: [
        { type: 'function_call', call_id: 'call-missing', name: 'lookup', arguments: '{}' },
        { type: 'function_call_output', call_id: 'call-orphan', output: 'stale' },
        { type: 'function_call', call_id: 'call-ok', name: 'read', arguments: '{}' },
        { type: 'function_call_output', call_id: 'call-ok', output: 'done' },
      ],
    },
    false,
  )
  const input = missing.input as Record<string, unknown>[]
  assert.equal(input.length, 4)
  assert.equal(input[0].type, 'function_call')
  assert.equal(input[0].call_id, 'call-missing')
  assert.equal(input[1].type, 'function_call_output')
  assert.equal(input[1].call_id, 'call-missing')
  assert.match(String(input[1].output), /outcome is unknown/)
  assert.equal(input[2].call_id, 'call-ok')
  assert.equal(input[3].type, 'function_call_output')
  assert.equal(input[3].call_id, 'call-ok')

  const balanced = codexRequestBody(
    { provider: 'codex', model: 'gpt-5.6-sol', messages: [] },
    {
      input: [
        { type: 'function_call', call_id: 'call-1', name: 'lookup', arguments: '{}' },
        { type: 'function_call_output', call_id: 'call-1', output: 'done' },
      ],
    },
    false,
  )
  assert.equal((balanced.input as Record<string, unknown>[]).length, 2)
})

test('codexRequestBody bounds tool-call ids without losing their pairings', () => {
  const short = 'call-short'
  const sharedPrefix = `call_${'x'.repeat(60)}`
  const longA = `${sharedPrefix}-a`
  const longB = `${sharedPrefix}-b`
  const resolved = {
    input: [
      { type: 'function_call', call_id: short, name: 'short', arguments: '{}' },
      { type: 'function_call_output', call_id: short, output: 'short result' },
      { type: 'function_call', call_id: longA, name: 'long_a', arguments: '{}' },
      { type: 'function_call_output', call_id: longA, output: 'long A result' },
      { type: 'function_call', call_id: longB, name: 'long_b', arguments: '{}' },
      { type: 'function_call_output', call_id: longB, output: 'long B result' },
    ],
  }
  const options = { provider: 'codex', model: 'gpt-5.1-codex', messages: [] }
  const first = codexRequestBody(options, resolved, false)
  const second = codexRequestBody(options, resolved, false)
  const ids = (first.input as Record<string, unknown>[]).map(item => String(item.call_id))

  assert.equal(ids[0], short)
  assert.equal(ids[1], short)
  assert.ok(ids.every(id => id.length <= 64))
  assert.equal(ids[2], ids[3])
  assert.equal(ids[4], ids[5])
  assert.notEqual(ids[2], ids[4])
  assert.deepEqual(second.input, first.input)

  const reserved = ids[2]
  const collision = codexRequestBody(options, {
    input: [
      { type: 'function_call', call_id: reserved, name: 'reserved', arguments: '{}' },
      { type: 'function_call', call_id: longA, name: 'long_a', arguments: '{}' },
      { type: 'function_call_output', call_id: longA, output: 'long A result' },
    ],
  }, false)
  const collisionIds = (collision.input as Record<string, unknown>[]).map(item => String(item.call_id))
  // The orphaned reserved call now carries a repaired output of its own, so
  // the id pairs are [reserved, reserved] then [hash, hash] instead of the
  // pre-repair adjacency [reserved, hash, hash].
  assert.equal(collisionIds[0], reserved)
  assert.equal(collisionIds[1], reserved)
  assert.equal(collisionIds[2], collisionIds[3])
  assert.notEqual(collisionIds[0], collisionIds[2])
})

function memoryCatalogStore(initial?: CatalogSnapshot): CatalogPersistence & {
  saved: () => CatalogSnapshot | undefined
} {
  let stored = initial
  return {
    load: () => Promise.resolve(stored),
    save: (snapshot) => {
      stored = snapshot
      return Promise.resolve()
    },
    clear: () => {
      stored = undefined
      return Promise.resolve()
    },
    saved: () => stored,
  }
}

test('codex resolveModel on a cold cache fetches the catalog itself', async () => {
  const { fetchFn } = fakeFetch(CODEX_MODELS_PAYLOAD)
  const adapter = codexAdapter({ session: codexSession, fetchFn })
  const resolved = await adapter.resolveModel('codex', 'gpt-5.2-codex')
  assert.deepEqual(resolved.reasoning?.efforts.map(effort => effort.id), ['low', 'high'])
  assert.equal(resolved.context?.contextWindow, 500_000)
})

function abortableHang(): { fetchFn: FetchFn; signals: AbortSignal[] } {
  const signals: AbortSignal[] = []
  const fetchFn = ((_url: string, init?: RequestInit) => {
    const signal = init?.signal ?? undefined
    if (signal !== undefined) signals.push(signal)
    return new Promise<Response>((_resolve, reject) => {
      if (signal === undefined) return
      if (signal.aborted) {
        reject(signal.reason ?? new DOMException('Aborted', 'AbortError'))
        return
      }
      signal.addEventListener('abort', () => {
        reject(signal.reason ?? new DOMException('Aborted', 'AbortError'))
      }, { once: true })
    })
  }) as FetchFn
  return { fetchFn, signals }
}

test('fetchCodexModels forwards the abort signal and rejects when it fires', async () => {
  const { fetchFn, signals } = abortableHang()
  const controller = new AbortController()
  const pending = fetchCodexModels(codexSession, fetchFn, controller.signal)
  controller.abort()
  await assert.rejects(pending)
  assert.equal(signals.length, 1)
  assert.equal(signals[0].aborted, true)
})

const STALE_CODEX_SNAPSHOT: CatalogSnapshot = {
  at: 1,
  models: [{ id: 'gpt-6-astra', name: 'GPT-6 Astra', priority: 1 }, { id: 'gpt-5.5', name: 'GPT-5.5', priority: 12 }],
}

test('codex discovery failure serves the last discovered catalog instead of the built-in one', async () => {
  // The default account's persisted snapshot is stale (TTL lapsed), so the
  // list refetches; the network is down. The account listed gpt-6-astra
  // last time, and the built-in catalog does not know that model at all:
  // demoting to it would fail every request with "No eligible account".
  const warnings: string[] = []
  const { fetchFn } = fakeFetch({ error: 'boom' }, 500)
  const adapter = new CodexAdapter({
    models: STATIC_CODEX,
    streamIdleTimeoutMs: 1000,
    tokens: memoryTokens(codexSession),
    discovery: true,
    fetchFn,
    catalogStore: memoryCatalogStore(STALE_CODEX_SNAPSHOT),
    onWarn: message => { warnings.push(message) },
  })
  const models = await adapter.listOwnModels('codex', 'acct')
  assert.deepEqual(models.map(model => model.id), ['gpt-6-astra', 'gpt-5.5'])
  assert.equal(warnings.length, 1)
  assert.match(warnings[0], /using the last discovered catalog/)
  assert.deepEqual(await adapter.lastKnownOwnModels('codex', 'acct').then(known => known?.map(model => model.id)), ['gpt-6-astra', 'gpt-5.5'])
})

test('codex hides an account whose token is rejected again after a forced refresh', async () => {
  // A revoked login: the refresh grant still answers, but /models rejects
  // the new token too. Listing the built-in catalog would route requests to
  // the dead account and show phantom rows in the picker.
  const warnings: string[] = []
  const { fetchFn, calls } = fakeFetch({ error: { code: 'token_revoked' } }, 401)
  const store = memoryCatalogStore(STALE_CODEX_SNAPSHOT)
  const adapter = new CodexAdapter({
    models: STATIC_CODEX,
    streamIdleTimeoutMs: 1000,
    tokens: memoryTokens(codexSession),
    discovery: true,
    fetchFn,
    catalogStore: store,
    onWarn: message => { warnings.push(message) },
  })
  assert.deepEqual(await adapter.listOwnModels('codex', 'acct'), [])
  assert.equal(calls(), 2, 'one attempt, one retry after the forced refresh')
  assert.equal(warnings.length, 1)
  assert.match(warnings[0], /rejected the login/)
  assert.equal(store.saved(), undefined, 'the invalidated catalog is dropped from disk too')
  assert.equal(await adapter.lastKnownOwnModels('codex', 'acct'), undefined)
})

test('codex persists a non-default account catalog and reads it back when discovery fails', async () => {
  const stores = new Map<string, ReturnType<typeof memoryCatalogStore>>()
  const storeFor = (account: string): ReturnType<typeof memoryCatalogStore> => {
    const existing = stores.get(account)
    if (existing !== undefined) return existing
    const store = memoryCatalogStore()
    stores.set(account, store)
    return store
  }
  const live = new CodexAdapter({
    models: STATIC_CODEX,
    streamIdleTimeoutMs: 1000,
    tokens: memoryTokens(codexSession),
    discovery: true,
    fetchFn: fakeFetch(CODEX_MODELS_PAYLOAD).fetchFn,
    catalogStore: memoryCatalogStore(),
    accountCatalogStore: storeFor,
  })
  // 'other' is not the default ('acct'), so its snapshot lands in its own store.
  const discovered = await live.listOwnModels('codex', 'other')
  assert.ok(discovered.length > 0)
  assert.deepEqual(stores.get('other')?.saved()?.models.map(model => model.id), discovered.map(model => model.id))
  assert.equal(stores.has('acct'), false, 'the default account keeps using the provider entry')

  // A restart with the network down: the persisted snapshot is stale, the
  // refetch fails, and the account still lists what it listed before.
  const warnings: string[] = []
  stores.get('other')!.save({ ...stores.get('other')!.saved()!, at: 1 })
  const restarted = new CodexAdapter({
    models: STATIC_CODEX,
    streamIdleTimeoutMs: 1000,
    tokens: memoryTokens(codexSession),
    discovery: true,
    fetchFn: fakeFetch({ error: 'boom' }, 500).fetchFn,
    catalogStore: memoryCatalogStore(),
    accountCatalogStore: storeFor,
    onWarn: message => { warnings.push(message) },
  })
  assert.deepEqual((await restarted.listOwnModels('codex', 'other')).map(model => model.id), discovered.map(model => model.id))
  assert.match(warnings[0], /last discovered catalog/)

  // Logging the account out drops its snapshot from disk as well.
  restarted.clearAccountCatalog('other')
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(stores.get('other')?.saved(), undefined)
})

test('codex lastKnownOwnModels is empty before any discovery and after logout', async () => {
  const adapter = codexAdapter({ session: codexSession, fetchFn: fakeFetch(CODEX_MODELS_PAYLOAD).fetchFn })
  assert.equal(await adapter.lastKnownOwnModels('codex', 'acct'), undefined)
  await adapter.listOwnModels('codex', 'acct')
  assert.ok((await adapter.lastKnownOwnModels('codex', 'acct'))!.length > 0)
  const loggedOut = codexAdapter({ fetchFn: fakeFetch(CODEX_MODELS_PAYLOAD).fetchFn })
  assert.equal(await loggedOut.lastKnownOwnModels('codex', 'acct'), undefined)
})
