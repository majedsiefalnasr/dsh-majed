/** MIT reference b802311: test/usage.spec.ts fetchClaudeUsage subset (legacy buckets, modern limits, 429 retry-after). See src/PROVENANCE.md (#132). */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fetchClaudeUsage } from '../../src/providers/claude.js'
import { OAuthEndpointError } from '../../src/providers/common.js'
import type { FetchFn } from '../../src/providers/common.js'
import type { ClaudeSession } from '../../src/auth/store.js'

const claudeSession: ClaudeSession = {
  accessToken: 'at',
  refreshToken: 'rt',
  expiresAt: Date.now() + 3_600_000,
  scopes: 'scope',
}

/** A fetch implementation answering one JSON payload; records the request. */

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

test('fetchClaudeUsage maps legacy buckets and skips null ones', async () => {
  const { fetchFn, requests } = fakeFetch({
    five_hour: { utilization: 6, resets_at: '2026-04-08T18:59:59Z' },
    seven_day: { utilization: 35, resets_at: '2026-04-14T16:59:59Z' },
    seven_day_opus: null,
    seven_day_sonnet: { utilization: 21, resets_at: null },
  })
  const usage = await fetchClaudeUsage(claudeSession, fetchFn)
  assert.deepEqual(usage, {
    supported: true,
    windows: [
      { kind: 'session', usedPercent: 6, resetsAt: Date.parse('2026-04-08T18:59:59Z') },
      { kind: 'weekly', usedPercent: 35, resetsAt: Date.parse('2026-04-14T16:59:59Z') },
      { kind: 'weekly', scope: 'Sonnet', usedPercent: 21 },
    ],
  })
  assert.equal(requests[0].headers['anthropic-beta'], 'oauth-2025-04-20')
  assert.equal(requests[0].headers.authorization, 'Bearer at')
})

test('fetchClaudeUsage: a 429 carries the retry-after header as retryAfterMs (issue #46)', async () => {
  const fetchFn: FetchFn = ((_url: string | URL | Request, _init?: RequestInit) => Promise.resolve(
    new Response(JSON.stringify({}), { status: 429, headers: { 'retry-after': '462' } }),
  )) as FetchFn
  await assert.rejects(fetchClaudeUsage(claudeSession, fetchFn), (error: unknown) => {
    assert.ok(error instanceof OAuthEndpointError)
    assert.equal(error.status, 429)
    assert.equal(error.retryAfterMs, 462_000)
    return true
  })
})

test('fetchClaudeUsage prefers the modern limits array when present', async () => {
  const { fetchFn } = fakeFetch({
    five_hour: null,
    seven_day: null,
    limits: [
      { kind: 'session', percent: 12, resets_at: '2026-04-08T18:59:59Z' },
      { kind: 'weekly_all', percent: 40, resets_at: '2026-04-14T16:59:59Z' },
      { kind: 'weekly_scoped', percent: 7, resets_at: '2026-04-14T16:59:59Z', scope: { model: { display_name: 'Opus' } } },
      { kind: 'weekly_scoped' }, // no percent → skipped
    ],
  })
  const usage = await fetchClaudeUsage(claudeSession, fetchFn)
  assert.deepEqual(usage.windows, [
    { kind: 'session', usedPercent: 12, resetsAt: Date.parse('2026-04-08T18:59:59Z') },
    { kind: 'weekly', usedPercent: 40, resetsAt: Date.parse('2026-04-14T16:59:59Z') },
    { kind: 'weekly', scope: 'Opus', usedPercent: 7, resetsAt: Date.parse('2026-04-14T16:59:59Z') },
  ])
})
