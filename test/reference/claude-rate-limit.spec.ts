/** MIT reference b802311: test/rate-limit.spec.ts Claude subset (reset reader, Claude provider-field precedence, non-429 backoff). See src/PROVENANCE.md (#132). */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { httpLlmError } from '../../src/providers/common.js'
import { claudeRateLimitReset } from '../../src/providers/claude.js'

/** A fixed clock, so every expectation is an exact number rather than a window. */

const NOW = 1_800_000_000_000

/** Builds a failed response with the given headers and body. */

function failure(status: number, headers: Record<string, string>, body = ''): Response {
  return new Response(body, { status, headers })
}

test('claude: the unified subscription window wins over the per-bucket headers', () => {
  const response = failure(429, {
    'anthropic-ratelimit-unified-reset': '1800009000',
    'anthropic-ratelimit-requests-reset': '2027-01-15T10:30:00Z',
  })
  assert.equal(claudeRateLimitReset(response, '', NOW), 1_800_009_000_000)
})

test('claude: the per-bucket snapshot headers never park a turn', () => {
  // Rollover stamps present on every response: the earliest is the bucket that
  // still had room, so waiting for it lands straight back in the closed window.
  const response = failure(429, {
    'anthropic-ratelimit-requests-reset': '2026-09-01T00:00:00Z',
    'anthropic-ratelimit-input-tokens-reset': '2027-01-15T10:30:00Z',
  })
  assert.equal(claudeRateLimitReset(response, '', NOW), undefined)
})

test('claude: a header-less rejection falls back to a reset named in the body', () => {
  const body = '{"type":"error","error":{"type":"rate_limit_error","resets_at":1800003600}}'
  assert.equal(claudeRateLimitReset(failure(429, {}), body, NOW), 1_800_003_600_000)
  assert.equal(claudeRateLimitReset(failure(429, {}), '{"type":"error"}', NOW), undefined)
})

test("the provider's own field beats a short retry-after on the same response", async () => {
  const response = failure(429, {
    'retry-after': '60',
    'anthropic-ratelimit-unified-reset': String(Math.floor(NOW / 1_000) + 9_000),
  }, '')
  const error = await httpLlmError(response, 'claude API', { rateLimitReset: claudeRateLimitReset })
  assert.ok(error.failure.providerRetryAfterMs !== undefined)
  assert.ok(error.failure.providerRetryAfterMs > 8_000_000, 'the window reset, not the 60s backoff')
})

test('a non-429 failure never inherits the current window as its retry delay', async () => {
  // The rate-limit headers ride every response, so a transient overload would
  // otherwise report the window rollover — hours out — as its backoff, and the
  // retry plugin honours providerRetryAfterMs for every retryable code.
  const response = failure(529, {
    'anthropic-ratelimit-unified-reset': String(Math.floor(NOW / 1_000) + 14_400),
  }, '{"type":"error","error":{"type":"overloaded_error"}}')
  const error = await httpLlmError(response, 'claude API', { rateLimitReset: claudeRateLimitReset })
  assert.equal(error.code, 'SERVER')
  assert.equal(error.failure.providerRetryAfterMs, undefined)
})
