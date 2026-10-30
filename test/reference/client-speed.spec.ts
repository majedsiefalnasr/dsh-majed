// Adapted from V1ki/dsh-plugin-subscriptions v0.9.12 (b802311) test/client-speed.spec.ts, MIT; see src/PROVENANCE.md.
// Dispositions: the connection double is structural (`ConnectionLike`) instead of the reference's
// `ConnectionHandle`; the RPC endpoint name is asserted with the owned `majed-subscriptions.` prefix.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createSpeedLoader } from '../../src/speed/SpeedSelect.js'
import type { ConnectionLike } from '../../src/usage-badge/slot-types.js'

test('Speed selector resolves a child default for the current model and rechecks model switches', async () => {
  const requests: unknown[] = []
  const endpoints: string[] = []
  const connection: ConnectionLike = { rpc: { call: async (_channel: string, endpoint: string, payload: { model?: string }) => {
    endpoints.push(endpoint)
    requests.push(payload)
    return { ok: true, value: { tier: payload.model === 'fast-model' ? 'fast' : 'standard', fastModels: ['fast-model'] } }
  } } }
  let current = { provider: 'codex', model: 'fast-model' }
  const load = createSpeedLoader(connection, () => ({ directoryFor: id => {
    assert.equal(id, 'child')
    return { load: async () => ({ current }) }
  } }), 'child')
  assert.deepEqual(await load(), { visible: true, tier: 'fast' })
  current = { provider: 'codex', model: 'plain-model' }
  assert.deepEqual(await load(), { visible: false, tier: 'standard' })
  current = { provider: 'claude', model: 'fast-model' }
  assert.deepEqual(await load(), { visible: false, tier: 'standard' })
  assert.deepEqual(requests, [
    { sessionId: 'child', model: 'fast-model' },
    { sessionId: 'child', model: 'plain-model' },
    { sessionId: 'child' },
  ])
  assert.deepEqual(endpoints, ['majed-subscriptions.speed', 'majed-subscriptions.speed', 'majed-subscriptions.speed'])
  assert.deepEqual(await createSpeedLoader(connection, () => undefined, 'unknown')(), { visible: false, tier: 'standard' })
})
