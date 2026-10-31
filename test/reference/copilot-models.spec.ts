// Copilot-only slice of pinned reference models.spec.ts, MIT; see PROVENANCE.md.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CopilotAdapter, fetchCopilotModels } from '../../src/providers/copilot.js'
import { AccountTokenManager } from '../../src/providers/accounts.js'
import type { CopilotSession } from '../../src/auth/store.js'
import type { FetchFn } from '../../src/providers/common.js'
const copilotSession: CopilotSession = {
  accessToken: 'copilot-at',
  refreshToken: 'gh-token',
  expiresAt: Date.now() + 3_600_000,
}
/** An AccountTokenManager over an in-memory session; refresh never fires in these tests. */
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

/** A fetch implementation answering one JSON payload; records invocation count. */
function fakeFetch(payload: unknown, status = 200): { fetchFn: FetchFn; calls: () => number } {
  let calls = 0
  const fetchFn: FetchFn = (() => {
    calls += 1
    return Promise.resolve(new Response(JSON.stringify(payload), { status }))
  }) as FetchFn
  return { fetchFn, calls: () => calls }
}
const STATIC_COPILOT = [{
  id: 'gpt-4o',
  name: 'GPT-4o',
  inputModalities: ['text', 'image'] as ('text' | 'image')[],
}]

function copilotAdapter(overrides: {
  session?: CopilotSession
  discovery?: boolean
  fetchFn?: FetchFn
  warnings?: string[]
}): CopilotAdapter {
  return new CopilotAdapter({
    models: STATIC_COPILOT,
    streamIdleTimeoutMs: 1000,
    tokens: memoryTokens(overrides.session),
    discovery: overrides.discovery ?? true,
    ...overrides.fetchFn === undefined ? {} : { fetchFn: overrides.fetchFn },
    ...overrides.warnings === undefined
      ? {}
      : { onWarn: (message: string) => { overrides.warnings?.push(message) } },
  })
}

const COPILOT_MODELS_PAYLOAD = {
  data: [
    {
      id: 'gpt-4.1',
      name: 'GPT-4.1',
      model_picker_enabled: true,
      policy: { state: 'enabled' },
      supported_endpoints: ['/chat/completions'],
      capabilities: {
        supports: { vision: true, tool_calls: true },
        limits: { max_context_window_tokens: 1_000_000 },
      },
    },
    {
      id: 'o4-mini',
      name: 'o4 Mini',
      model_picker_enabled: true,
      policy: { state: 'enabled' },
      supported_endpoints: ['/chat/completions', '/responses'],
      capabilities: {
        supports: { vision: false, reasoning_effort: ['low', 'medium', 'high'] },
      },
    },
    {
      id: 'gpt-5.6-sol',
      name: 'GPT-5.6 Sol',
      model_picker_enabled: true,
      policy: { state: 'enabled' },
      // The newer GPT families only list the Responses endpoint.
      supported_endpoints: ['/responses', 'ws:/responses'],
      capabilities: {
        supports: { vision: true, reasoning_effort: ['low', 'medium', 'high', 'xhigh'] },
        limits: { max_context_window_tokens: 1_050_000 },
      },
    },
    { id: 'picker-hidden', model_picker_enabled: false, policy: { state: 'enabled' } },
    { id: 'policy-disabled', model_picker_enabled: true, policy: { state: 'disabled' } },
    {
      id: 'ws-only',
      model_picker_enabled: true,
      policy: { state: 'enabled' },
      supported_endpoints: ['ws:/responses'],
    },
  ],
}

test('copilot listModels returns [] when logged out', async () => {
  const adapter = copilotAdapter({})
  assert.deepEqual(await adapter.listModels('copilot'), [])
})

test('copilot listModels maps the discovered catalog and filters unusable entries', async () => {
  const { fetchFn } = fakeFetch(COPILOT_MODELS_PAYLOAD)
  const adapter = copilotAdapter({ session: copilotSession, fetchFn })
  const models = await adapter.listModels('copilot')
  assert.deepEqual(models.map(model => model.id), ['gpt-4.1', 'o4-mini', 'gpt-5.6-sol'])
  // Vision support from the catalog becomes the model's input modalities.
  assert.deepEqual(models[0].inputModalities, ['text', 'image'])
  assert.deepEqual(models[1].inputModalities, ['text'])
  assert.deepEqual(models[2].inputModalities, ['text', 'image'])
  assert.equal(models[0].name, 'GPT-4.1')
})

test('copilot discovery records the wire protocol per model', async () => {
  const { fetchFn } = fakeFetch(COPILOT_MODELS_PAYLOAD)
  const discovered = await fetchCopilotModels(copilotSession, fetchFn)
  assert.deepEqual(discovered.map(model => [model.id, model.copilotWire ?? 'chat-completions']), [
    ['gpt-4.1', 'chat-completions'],
    // Both endpoints listed → the chat wire (models listing both accept it),
    // with /responses availability recorded for the tools+effort reroute.
    ['o4-mini', 'chat-completions'],
    ['gpt-5.6-sol', 'responses'],
  ])
  // The dual-protocol flag rides only entries listing /responses.
  assert.equal(discovered[0]?.copilotResponses, undefined)
  assert.equal(discovered[1]?.copilotResponses, true)
  assert.equal(discovered[2]?.copilotResponses, true)
  assert.equal(discovered[2]?.contextWindow, 1_050_000)
})

test('copilot discovery maps the supports.reasoning_effort array into efforts', async () => {
  const { fetchFn } = fakeFetch(COPILOT_MODELS_PAYLOAD)
  const discovered = await fetchCopilotModels(copilotSession, fetchFn)
  // A model without the array (or with null/empty) exposes no efforts.
  assert.equal(discovered[0]?.reasoning, undefined)
  const o4 = discovered[1]?.reasoning
  assert.deepEqual(o4?.efforts.map(effort => [effort.id, effort.name]), [
    ['low', 'Low'],
    ['medium', 'Medium'],
    ['high', 'High'],
  ])
  assert.equal(o4?.defaultEffort, undefined)
  const sol = discovered[2]?.reasoning
  assert.equal(sol?.efforts[3]?.name, 'Extra High')
})

test('copilot discovery tolerates duplicate, empty, and null effort entries', async () => {
  const models = await fetchCopilotModels(copilotSession, fakeFetch({
    data: [
      {
        id: 'gpt-5.1',
        name: 'GPT-5.1',
        model_picker_enabled: true,
        policy: { state: 'enabled' },
        supported_endpoints: ['/chat/completions'],
        capabilities: { supports: { reasoning_effort: ['high', 'high', '', 'max'] } },
      },
      {
        id: 'claude-opus-4-5',
        name: 'Claude Opus 4.5',
        model_picker_enabled: true,
        policy: { state: 'enabled' },
        supported_endpoints: ['/chat/completions'],
        capabilities: { supports: { reasoning_effort: null } },
      },
    ],
  }).fetchFn)
  // Duplicates collapse and empty strings drop (the harness rejects duplicate
  // effort ids); "max" survives with a display name.
  assert.deepEqual(models[0]?.reasoning?.efforts.map(effort => [effort.id, effort.name]), [
    ['high', 'High'],
    ['max', 'Max'],
  ])
  assert.equal(models[1]?.reasoning, undefined)
})

test('copilot resolveModel serves discovered reasoning efforts', async () => {
  const { fetchFn } = fakeFetch(COPILOT_MODELS_PAYLOAD)
  const adapter = copilotAdapter({ session: copilotSession, fetchFn })
  await adapter.listModels('copilot')
  const resolved = await adapter.resolveModel('copilot', 'o4-mini')
  assert.deepEqual(resolved.reasoning?.efforts.map(effort => effort.id), ['low', 'medium', 'high'])
  const sol = await adapter.resolveModel('copilot', 'gpt-5.6-sol')
  assert.deepEqual(sol.reasoning?.efforts.map(effort => effort.id), ['low', 'medium', 'high', 'xhigh'])
  // A model the catalog listed without efforts (and one it filtered out,
  // falling back to static metadata) claims no reasoning at all: the harness
  // then rejects explicit efforts before the API can 400.
  assert.equal((await adapter.resolveModel('copilot', 'gpt-4.1')).reasoning, undefined)
  assert.equal((await adapter.resolveModel('copilot', 'policy-disabled')).reasoning, undefined)
})

test('copilot resolveModel serves discovered context windows and modalities', async () => {
  const { fetchFn } = fakeFetch(COPILOT_MODELS_PAYLOAD)
  const adapter = copilotAdapter({ session: copilotSession, fetchFn })
  const resolved = await adapter.resolveModel('copilot', 'gpt-4.1')
  assert.equal(resolved.context?.contextWindow, 1_000_000)
  assert.deepEqual(resolved.inputModalities, ['text', 'image'])
  // A model the catalog filtered out falls back to static/defaults.
  const missing = await adapter.resolveModel('copilot', 'policy-disabled')
  assert.equal(missing.context?.contextWindow, 128_000)
  assert.deepEqual(missing.inputModalities, ['text'])
})

test('copilot listModels falls back to the static catalog on discovery failure', async () => {
  const { fetchFn } = fakeFetch({ message: 'boom' }, 500)
  const warnings: string[] = []
  const adapter = copilotAdapter({ session: copilotSession, fetchFn, warnings })
  const models = await adapter.listModels('copilot')
  assert.deepEqual(models.map(model => model.id), ['gpt-4o'])
  assert.deepEqual(models[0].inputModalities, ['text', 'image'])
  assert.equal(warnings.length, 1)
})

test('copilot listModels treats an empty discovered catalog as a failure', async () => {
  const { fetchFn } = fakeFetch({ data: [] })
  const warnings: string[] = []
  const adapter = copilotAdapter({ session: copilotSession, fetchFn, warnings })
  const models = await adapter.listModels('copilot')
  assert.deepEqual(models.map(model => model.id), ['gpt-4o'])
  assert.equal(warnings.length, 1)
  assert.match(warnings[0], /empty catalog/)
})

test('copilot listModels without discovery serves the static catalog', async () => {
  const adapter = copilotAdapter({ session: copilotSession, discovery: false })
  const models = await adapter.listModels('copilot')
  assert.deepEqual(models.map(model => model.id), ['gpt-4o'])
})
