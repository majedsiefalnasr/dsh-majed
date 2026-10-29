import { test } from 'node:test';

import assert from 'node:assert/strict'

import { codexRateLimitReset } from '../../src/providers/codex.js';

const NOW = 1_800_000_000_000

function failure(status: number, headers: Record<string, string>, body = ''): Response {
  return new Response(body, { status, headers })
}

test('codex: the exhausted window in the body wins over the snapshot headers', () => {
  const response = failure(429, { 'x-codex-primary-reset-after-seconds': '30' })
  const body = '{"detail":{"type":"usage_limit_reached","resets_in_seconds":9000,"plan_type":"plus"}}'
  assert.equal(codexRateLimitReset(response, body, NOW), NOW + 9_000_000)
})

test('codex: the snapshot headers never park a turn', () => {
  // A burst 429 clearing in seconds still carries the primary window rollover
  // hours out; reading it would hold the turn for those hours.
  const response = failure(429, {
    'x-codex-primary-reset-after-seconds': '17000',
    'x-codex-secondary-reset-after-seconds': '90000',
  })
  assert.equal(codexRateLimitReset(response, '{"detail":"Too many requests"}', NOW), undefined)
})
