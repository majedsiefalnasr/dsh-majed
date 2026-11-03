/**
 * The GitHub device-authorization flow engine: device-code request shape,
 * token polling (authorization_pending / slow_down / denial / expiry), busy
 * tracking, and cancellation. All fetches are injected; no network.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import './keep-alive.js'
import { DeviceFlowManager } from '../../src/auth/device-flow.js'
import type { DeviceFlowSpec } from '../../src/auth/device-flow.js'

const DEVICE_CODE_URL = 'https://github.com/login/device/code'
const TOKEN_URL = 'https://github.com/login/oauth/access_token'

/** A fetch implementation replaying queued responses per URL; records request bodies. */
function fakeFetch(script: Record<string, unknown[]>): {
  fetchFn: typeof fetch
  bodies: (url: string) => string[]
} {
  const queues = new Map(Object.entries(script).map(([url, responses]) => [url, [...responses]]))
  const bodies = new Map<string, string[]>()
  const fetchFn = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    const queue = queues.get(url)
    if (queue === undefined || queue.length === 0) {
      return Promise.reject(new Error(`unexpected fetch to ${url}`))
    }
    const list = bodies.get(url) ?? []
    list.push(typeof init?.body === 'string' ? init.body : '')
    bodies.set(url, list)
    const payload = queue.shift()
    if (payload instanceof Response) return Promise.resolve(payload)
    return Promise.resolve(new Response(JSON.stringify(payload), { status: 200 }))
  }) as typeof fetch
  return { fetchFn, bodies: url => bodies.get(url) ?? [] }
}

function spec(fetchFn: typeof fetch): DeviceFlowSpec {
  return {
    clientId: 'client-1',
    scope: 'read:user',
    deviceCodeUrl: DEVICE_CODE_URL,
    tokenUrl: TOKEN_URL,
    fetchFn,
  }
}

const DEVICE_CODE = {
  device_code: 'dc-1',
  user_code: 'ABCD-1234',
  verification_uri: 'https://github.com/login/device',
  // Fractional intervals keep the tests fast; GitHub sends integers ≥ 5.
  interval: 0.01,
  expires_in: 60,
}

test('device flow: pending polls resolve to the access token', async () => {
  const { fetchFn, bodies } = fakeFetch({
    [DEVICE_CODE_URL]: [DEVICE_CODE],
    [TOKEN_URL]: [
      { error: 'authorization_pending' },
      { error: 'authorization_pending' },
      { access_token: 'gh-token' },
    ],
  })
  const manager = new DeviceFlowManager()
  const attempt = await manager.start('copilot', spec(fetchFn))
  assert.equal(attempt.userCode, 'ABCD-1234')
  assert.equal(attempt.verificationUrl, 'https://github.com/login/device')
  assert.equal(manager.isBusy('copilot'), true)

  // The device-code request carries the client id and scope, form-encoded.
  const [deviceBody] = bodies(DEVICE_CODE_URL)
  assert.equal(new URLSearchParams(deviceBody).get('client_id'), 'client-1')
  assert.equal(new URLSearchParams(deviceBody).get('scope'), 'read:user')

  assert.equal(await attempt.waitToken(), 'gh-token')
  assert.equal(manager.isBusy('copilot'), false)

  // Every poll presents the device code with the device-code grant type.
  for (const body of bodies(TOKEN_URL)) {
    const params = new URLSearchParams(body)
    assert.equal(params.get('device_code'), 'dc-1')
    assert.equal(params.get('grant_type'), 'urn:ietf:params:oauth:grant-type:device_code')
  }
})

test('device flow: slow_down keeps polling and still resolves', async () => {
  const { fetchFn } = fakeFetch({
    [DEVICE_CODE_URL]: [DEVICE_CODE],
    [TOKEN_URL]: [
      { error: 'slow_down' },
      { access_token: 'gh-token' },
    ],
  })
  const manager = new DeviceFlowManager()
  const attempt = await manager.start('copilot', spec(fetchFn))
  assert.equal(await attempt.waitToken(), 'gh-token')
})

test('device flow: access_denied rejects the login', async () => {
  const { fetchFn } = fakeFetch({
    [DEVICE_CODE_URL]: [DEVICE_CODE],
    [TOKEN_URL]: [{ error: 'access_denied' }],
  })
  const manager = new DeviceFlowManager()
  const attempt = await manager.start('copilot', spec(fetchFn))
  await assert.rejects(attempt.waitToken(), /declined/)
  assert.equal(manager.isBusy('copilot'), false)
})

test('device flow: an expired device code rejects the login', async () => {
  const { fetchFn } = fakeFetch({
    [DEVICE_CODE_URL]: [DEVICE_CODE],
    [TOKEN_URL]: [{ error: 'expired_token' }],
  })
  const manager = new DeviceFlowManager()
  const attempt = await manager.start('copilot', spec(fetchFn))
  await assert.rejects(attempt.waitToken(), /expired/)
})

test('device flow: cancel rejects waitToken and frees the provider slot', async () => {
  const { fetchFn } = fakeFetch({
    [DEVICE_CODE_URL]: [DEVICE_CODE, DEVICE_CODE],
    [TOKEN_URL]: [{ error: 'authorization_pending' }, { access_token: 'gh-token' }],
  })
  const manager = new DeviceFlowManager()
  const attempt = await manager.start('copilot', spec(fetchFn))
  attempt.cancel()
  await assert.rejects(attempt.waitToken(), /cancelled/)
  assert.equal(manager.isBusy('copilot'), false)
  assert.equal(manager.pending('copilot'), undefined)

  // A fresh attempt may start right away for the same provider.
  const again = await manager.start('copilot', spec(fetchFn))
  assert.equal(again.userCode, 'ABCD-1234')
  again.cancel()
})

test('device flow: a second concurrent attempt for one provider is refused', async () => {
  const { fetchFn } = fakeFetch({
    [DEVICE_CODE_URL]: [DEVICE_CODE, DEVICE_CODE],
    [TOKEN_URL]: [{ error: 'authorization_pending' }],
  })
  const manager = new DeviceFlowManager()
  const attempt = await manager.start('copilot', spec(fetchFn))
  await assert.rejects(manager.start('copilot', spec(fetchFn)), /already in progress/)
  attempt.cancel()
})

test('device flow: acquisition owns its slot before I/O and stale A cannot replace B', async () => {
  let releaseA!: (response: Response) => void
  const acquisitionA = new Promise<Response>(resolve => { releaseA = resolve })
  const manager = new DeviceFlowManager()
  const a = manager.start('copilot', spec((() => acquisitionA) as typeof fetch))
  const rejectedA = assert.rejects(a, /cancelled/)
  assert.equal(manager.isBusy('copilot'), true)
  manager.pending('copilot')?.cancel()
  const b = await manager.start('copilot', spec((async () => Response.json(DEVICE_CODE)) as typeof fetch))
  releaseA(Response.json(DEVICE_CODE))
  await rejectedA
  assert.equal(manager.pending('copilot'), b)
  b.cancel()
  await assert.rejects(b.waitToken(), /cancelled/)
  assert.equal(manager.isBusy('copilot'), false)
})

test('device flow: expiry bounds hung token bodies and rejects a late token', async () => {
  let late!: (value: unknown) => void
  const body = new Promise(resolve => { late = resolve })
  const manager = new DeviceFlowManager()
  const attempt = await manager.start('copilot', spec((async input => String(input) === DEVICE_CODE_URL
    ? Response.json({ ...DEVICE_CODE, interval: 0.001, expires_in: 0.02 })
    : { json: () => body }) as typeof fetch))
  await assert.rejects(attempt.waitToken(), /expired/)
  late({ access_token: 'fixture-late-secret' })
  assert.equal(manager.isBusy('copilot'), false)
  await assert.rejects(attempt.waitToken(), /expired/)
})

test('device flow: cancellation bounds acquisition body even if fetch ignores abort', async () => {
  const manager = new DeviceFlowManager()
  const pending = manager.start('copilot', spec((async () => new Response(new ReadableStream({ start() {} }))) as typeof fetch))
  await Promise.resolve()
  manager.pending('copilot')?.cancel()
  await assert.rejects(pending, /cancelled/)
  assert.equal(manager.isBusy('copilot'), false)
})

test('device flow: a malformed device-code response fails the start', async () => {
  const { fetchFn } = fakeFetch({
    [DEVICE_CODE_URL]: [{ device_code: 'dc-1' }],
  })
  const manager = new DeviceFlowManager()
  await assert.rejects(manager.start('copilot', spec(fetchFn)), /missing/)
  assert.equal(manager.isBusy('copilot'), false)
})
