import { test } from 'node:test';
import { fetchCodexUsage, fetchCodexResetCredits } from '../../src/providers/codex.js';

import assert from 'node:assert/strict'

import type { FetchFn } from '../../src/providers/common.js';

import type { CodexSession } from '../../src/auth/store.js';

const codexSession: CodexSession = {
  accessToken: 'at',
  refreshToken: 'rt',
  expiresAt: Date.now() + 3_600_000,
  accountId: 'acct-1',
}

function fakeFetch(payload: unknown, status = 200): {
  fetchFn: FetchFn
  requests: { url: string; headers: Record<string, string> }[]
} {
  const requests: { url: string; headers: Record<string, string> }[] = []
  const fetchFn: FetchFn = ((url: string | URL | Request, init?: RequestInit) => {
    const headers: Record<string, string> = {}
    new Headers(init?.headers).forEach((value, key) => { headers[key] = value })
    requests.push({ url: String(url), headers })
    return Promise.resolve(new Response(JSON.stringify(payload), { status }))
  }) as FetchFn
  return { fetchFn, requests }
}

test('fetchCodexUsage maps windows, plan, and reset timestamps', async () => {
  const { fetchFn, requests } = fakeFetch({
    plan_type: 'plus',
    rate_limit: {
      primary_window: { used_percent: 27, limit_window_seconds: 18000, reset_at: 1_782_770_922 },
      secondary_window: { used_percent: 4, limit_window_seconds: 604800, reset_at: 1_783_357_722 },
    },
  })
  const usage = await fetchCodexUsage(codexSession, fetchFn)
  assert.deepEqual(usage, {
    supported: true,
    plan: 'plus',
    windows: [
      { kind: 'session', usedPercent: 27, resetsAt: 1_782_770_922_000 },
      { kind: 'weekly', usedPercent: 4, resetsAt: 1_783_357_722_000 },
    ],
  })
  assert.equal(requests.length, 1)
  assert.match(requests[0].url, /backend-api\/wham\/usage/)
  assert.equal(requests[0].headers['chatgpt-account-id'], 'acct-1')
  assert.equal(requests[0].headers.authorization, 'Bearer at')
})

test('fetchCodexResetCredits maps only available Codex reset credits', async () => {
  const { fetchFn, requests } = fakeFetch({ credits: [
    { id: 'credit-1', reset_type: 'codex_rate_limits', status: 'available', granted_at: '2026-09-20T00:00:00Z', expires_at: '2026-10-20T00:00:00Z' },
    { id: 'credit-2', reset_type: 'codex_rate_limits', status: 'redeemed' },
    { id: 'credit-3', reset_type: 'other', status: 'available' },
    { id: 'credit-4', reset_type: 'codex_rate_limits', status: 'available', expires_at: null },
  ] })
  const credits = await fetchCodexResetCredits(codexSession, fetchFn)
  assert.deepEqual(credits, [
    { id: 'credit-1', grantedAt: Date.parse('2026-09-20T00:00:00Z'), expiresAt: Date.parse('2026-10-20T00:00:00Z') },
    { id: 'credit-4' },
  ])
  assert.equal(requests.length, 1)
  assert.ok(requests[0].url.includes('/rate-limit-reset-credits'))
  assert.equal(requests[0].headers.authorization, 'Bearer at')
  assert.equal(requests[0].headers['chatgpt-account-id'], 'acct-1')
})

test('fetchCodexResetCredits reports malformed payloads and endpoint errors', async () => {
  const { fetchFn } = fakeFetch({ available_count: 0 })
  await assert.rejects(fetchCodexResetCredits(codexSession, fetchFn), /missing credits array/)
  const { fetchFn: empty } = fakeFetch({ credits: [] })
  assert.deepEqual(await fetchCodexResetCredits(codexSession, empty), [])
  const { fetchFn: failing } = fakeFetch({ error: 'nope' }, 500)
  await assert.rejects(fetchCodexResetCredits(codexSession, failing), /codex reset credits/)
})

test('fetchCodexUsage classifies a weekly primary window by duration', async () => {
  const { fetchFn } = fakeFetch({
    plan_type: 'plus',
    rate_limit: {
      primary_window: { used_percent: 39, limit_window_seconds: 604800, reset_at: 1_783_357_722 },
    },
  })
  const usage = await fetchCodexUsage(codexSession, fetchFn)
  assert.deepEqual(usage.windows, [
    { kind: 'weekly', usedPercent: 39, resetsAt: 1_783_357_722_000 },
  ])
})

test('fetchCodexUsage maps unrecognized durations to other, not a fixed label', async () => {
  const { fetchFn } = fakeFetch({
    rate_limit: {
      primary_window: { used_percent: 10, limit_window_seconds: 18000 },
      secondary_window: { used_percent: 5, limit_window_seconds: 3600 },
    },
  })
  const usage = await fetchCodexUsage(codexSession, fetchFn)
  assert.deepEqual(usage.windows, [
    { kind: 'session', usedPercent: 10 },
    { kind: 'other', usedPercent: 5 },
  ])
})

test('fetchCodexUsage falls back to slot-based kind when duration is absent', async () => {
  const { fetchFn } = fakeFetch({
    rate_limit: {
      primary_window: { used_percent: 10 },
      secondary_window: { used_percent: 4 },
    },
  })
  const usage = await fetchCodexUsage(codexSession, fetchFn)
  assert.deepEqual(usage.windows, [
    { kind: 'session', usedPercent: 10 },
    { kind: 'weekly', usedPercent: 4 },
  ])
})

test('fetchCodexUsage falls back to reset_after_seconds and tolerates missing windows', async () => {
  const before = Date.now()
  const { fetchFn } = fakeFetch({
    rate_limit: { primary_window: { used_percent: 10, reset_after_seconds: 100 } },
  })
  const usage = await fetchCodexUsage(codexSession, fetchFn)
  assert.equal(usage.supported, true)
  assert.equal(usage.plan, undefined)
  assert.equal(usage.windows?.length, 1)
  const [window] = usage.windows ?? []
  assert.equal(window.kind, 'session')
  assert.equal(window.usedPercent, 10)
  assert.ok(window.resetsAt !== undefined && window.resetsAt >= before + 100_000)
})

test('fetchCodexUsage: non-2xx response throws', async () => {
  const { fetchFn } = fakeFetch({ error: 'nope' }, 500)
  await assert.rejects(fetchCodexUsage(codexSession, fetchFn), /codex usage/)
})
