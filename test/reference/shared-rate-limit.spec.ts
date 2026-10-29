/** MIT reference b802311: rate-limit.spec.ts shared/Codex subset. See src/PROVENANCE.md. */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { httpLlmError } from '../../src/providers/common.js'
import {
  DEFAULT_RATE_LIMIT_MAX_WAIT_MS,
  DEFAULT_RETRY,
  durationMs,
  earliestReset,
  jsonBody,
  resetFromFields,
  resetInstantFromNumber,
  resetInstantFromValue,
  resolveRateLimitWait,
  retryAfterInstant,
  subscriptionRetryPolicy,
  waitFromReset,
} from '../../src/providers/rate-limit.js'
import { codexRateLimitReset } from '../../src/providers/codex.js'
/** A fixed clock, so every expectation is an exact number rather than a window. */
const NOW = 1_800_000_000_000

/** Builds a failed response with the given headers and body. */
function failure(status: number, headers: Record<string, string>, body = ''): Response {
  return new Response(body, { status, headers })
}
test('a bare number is read as epoch ms, epoch seconds, or a delay by magnitude', () => {
  assert.equal(resetInstantFromNumber(NOW + 5_000, NOW), NOW + 5_000)
  assert.equal(resetInstantFromNumber(1_800_000_300, NOW), 1_800_000_300_000)
  assert.equal(resetInstantFromNumber(300, NOW), NOW + 300_000)
  // A full week as a delay still stays below the epoch-seconds floor.
  assert.equal(resetInstantFromNumber(604_800, NOW), NOW + 604_800_000)
  assert.equal(resetInstantFromNumber(0, NOW), undefined)
  assert.equal(resetInstantFromNumber(-5, NOW), undefined)
  assert.equal(resetInstantFromNumber(Number.NaN, NOW), undefined)
})

test('durations parse in the Go form the OpenAI-compatible headers use', () => {
  assert.equal(durationMs('6m0s'), 360_000)
  assert.equal(durationMs('1h2m3s'), 3_723_000)
  assert.equal(durationMs('1.5s'), 1_500)
  assert.equal(durationMs('150ms'), 150)
  assert.equal(durationMs(' 2m '), 120_000)
  assert.equal(durationMs('6m0s later'), undefined)
  assert.equal(durationMs('soon'), undefined)
  assert.equal(durationMs(''), undefined)
  // A rolled-over bucket, not a disclosed reset; the numeric path rejects 0 too.
  assert.equal(durationMs('0s'), undefined)
  assert.equal(durationMs('0h0m0s'), undefined)
  // Components run strictly coarse to fine; anything else is not a duration.
  assert.equal(durationMs('1s2h'), undefined)
  assert.equal(durationMs('1s1s'), undefined)
  assert.equal(durationMs('1m1h'), undefined)
})

test('a single value is read in every shape a provider might encode it in', () => {
  assert.equal(resetInstantFromValue(300, NOW), NOW + 300_000)
  assert.equal(resetInstantFromValue('300', NOW), NOW + 300_000)
  assert.equal(resetInstantFromValue('6m0s', NOW), NOW + 360_000)
  assert.equal(resetInstantFromValue('2027-01-15T10:30:00Z', NOW), Date.parse('2027-01-15T10:30:00Z'))
  assert.equal(resetInstantFromValue(null, NOW), undefined)
  assert.equal(resetInstantFromValue({ nested: 1 }, NOW), undefined)
  assert.equal(resetInstantFromValue('whenever', NOW), undefined)
  // Zero reads the same through both paths, so neither short-circuits a reader.
  assert.equal(resetInstantFromValue('0s', NOW), undefined)
  assert.equal(resetInstantFromValue('0', NOW), undefined)
})

test('retry-after reads a delay in seconds or an HTTP-date, never an epoch stamp', () => {
  assert.equal(retryAfterInstant(failure(429, { 'retry-after': '120' }), NOW), NOW + 120_000)
  // A large number stays a delay here, unlike a bare rate-limit field.
  assert.equal(retryAfterInstant(failure(429, { 'retry-after': '1800000000' }), NOW), NOW + 1_800_000_000_000)
  const date = 'Wed, 21 Oct 2026 07:28:00 GMT'
  assert.equal(retryAfterInstant(failure(429, { 'retry-after': date }), NOW), Date.parse(date))
  assert.equal(retryAfterInstant(failure(429, {}), NOW), undefined)
  assert.equal(retryAfterInstant(failure(429, { 'retry-after': '0' }), NOW), undefined)
})

test('a reset instant becomes a wait with clock-skew grace and a floor', () => {
  assert.equal(waitFromReset(NOW + 300_000, NOW), 302_000)
  // Already past: still scheduled, at the floor.
  assert.equal(waitFromReset(NOW - 60_000, NOW), 1_000)
  // Never capped here: an over-ceiling wait must reach the policy to be refused.
  assert.equal(waitFromReset(NOW + 7 * 24 * 3_600_000, NOW), 7 * 24 * 3_600_000 + 2_000)
})

test('a body field is found wherever the provider nests it', () => {
  const body = jsonBody('{"detail":{"type":"usage_limit_reached","resets_in_seconds":9000}}')
  assert.equal(resetFromFields(body, ['resets_in_seconds'], NOW), NOW + 9_000_000)
  assert.equal(resetFromFields(jsonBody('{"resets_in_seconds":60}'), ['resets_in_seconds'], NOW), NOW + 60_000)
  // The earliest of several matches wins.
  const many = jsonBody('{"a":{"resets_at":1800000600},"b":{"resets_at":1800000300}}')
  assert.equal(resetFromFields(many, ['resets_at'], NOW), 1_800_000_300_000)
  assert.equal(resetFromFields(jsonBody('{"other":5}'), ['resets_at'], NOW), undefined)
  assert.equal(jsonBody('<html>502</html>'), undefined)
})

test('earliestReset ignores absent candidates', () => {
  assert.equal(earliestReset(undefined, NOW + 10, undefined, NOW + 5), NOW + 5)
  assert.equal(earliestReset(undefined, undefined), undefined)
})

test('a 429 classifies as RATE_LIMIT even when the wording reads as terminal quota', async () => {
  const body = '{"detail":{"type":"usage_limit_reached","resets_in_seconds":9000,"plan_type":"plus"}}'
  const error = await httpLlmError(failure(429, {}, body), 'codex API', {
    rateLimitReset: codexRateLimitReset,
  })
  assert.equal(error.code, 'RATE_LIMIT')
  assert.ok(error.failure.providerRetryAfterMs !== undefined)
  assert.ok(error.failure.providerRetryAfterMs > 8_990_000)
})

test('quota wording still classifies as QUOTA on any other status', async () => {
  const error = await httpLlmError(failure(402, {}, 'Weekly usage limit exceeded'), 'codex API')
  assert.equal(error.code, 'QUOTA')
})

test('a rate-limit reset survives a body longer than the truncated message', async () => {
  const padding = 'x'.repeat(2_000)
  const body = JSON.stringify({ note: padding, detail: { resets_in_seconds: 600 } })
  const error = await httpLlmError(failure(429, {}, body), 'codex API', {
    rateLimitReset: codexRateLimitReset,
  })
  assert.equal(error.code, 'RATE_LIMIT')
  assert.ok(error.failure.providerRetryAfterMs !== undefined)
  assert.ok(error.failure.providerRetryAfterMs > 590_000)
  // The message itself stays truncated.
  assert.ok(error.message.length < 600)
})

test('a non-429 failure never emits the rate-limit diagnostic', async () => {
  const warnings: string[] = []
  await httpLlmError(failure(500, {}, 'boom'), 'grok API', { onWarn: message => warnings.push(message) })
  assert.deepEqual(warnings, [])
})
test('retry-after still serves a non-429 that asked for a backoff', async () => {
  // Unlike a window snapshot, retry-after on a 503 is a delay the provider
  // actually asked for, so it stays readable on any status.
  const error = await httpLlmError(failure(503, { 'retry-after': '30' }, 'shedding load'), 'grok API', {
    rateLimitReset: codexRateLimitReset,
  })
  assert.equal(error.code, 'SERVER')
  assert.ok(error.failure.providerRetryAfterMs !== undefined)
  assert.ok(error.failure.providerRetryAfterMs >= 30_000)
})

test('a 429 whose only signal is a snapshot header warns instead of waiting', async () => {
  const warnings: string[] = []
  const response = failure(429, {
    'x-codex-primary-reset-after-seconds': '17000',
  }, '{"detail":"Too many requests"}')
  const error = await httpLlmError(response, 'codex API', {
    rateLimitReset: codexRateLimitReset,
    onWarn: message => warnings.push(message),
  })
  assert.equal(error.code, 'RATE_LIMIT')
  assert.equal(error.failure.providerRetryAfterMs, undefined)
  assert.equal(warnings.length, 1)
  assert.match(warnings[0], /x-codex-primary-reset-after-seconds: 17000/)
})
test('waiting widens the delay ceiling to the configured maximum', () => {
  const policy = subscriptionRetryPolicy(
    DEFAULT_RETRY,
    { wait: true, maxWaitMs: 6 * 3_600_000 },
    'test: retryPolicy',
  )
  assert.equal(policy.mode, 'normal')
  assert.equal(policy.maxDelayMs, 6 * 3_600_000)
  assert.equal(policy.initialDelayMs, DEFAULT_RETRY.initialDelayMs)
  assert.equal(policy.mode === 'normal' && policy.maxRetries, DEFAULT_RETRY.maxRetries)
  assert.ok(policy.mode === 'normal' && policy.retryableCodes.includes('RATE_LIMIT'))
})

test('opting out of waiting restores the route defaults exactly', () => {
  const policy = subscriptionRetryPolicy(
    DEFAULT_RETRY,
    { wait: false, maxWaitMs: 6 * 3_600_000 },
    'test: retryPolicy',
  )
  assert.equal(policy.maxDelayMs, DEFAULT_RETRY.maxDelayMs)
})

test('a wait ceiling below the local backoff ceiling never shortens local backoff', () => {
  const policy = subscriptionRetryPolicy(
    DEFAULT_RETRY,
    { wait: true, maxWaitMs: 5_000 },
    'test: retryPolicy',
  )
  assert.equal(policy.maxDelayMs, DEFAULT_RETRY.maxDelayMs)
})

test('the shared retry shape is Claude Code\'s, not the dsh-llm default', () => {
  assert.deepEqual(DEFAULT_RETRY, {
    maxRetries: 10,
    initialDelayMs: 1_000,
    maxDelayMs: 60_000,
    jitterRatio: 0.2,
  })
})

test('rate-limit waiting defaults to on with a six-hour ceiling', () => {
  assert.deepEqual(resolveRateLimitWait(undefined, 'config: rateLimit'), {
    wait: true,
    maxWaitMs: DEFAULT_RATE_LIMIT_MAX_WAIT_MS,
  })
  assert.deepEqual(resolveRateLimitWait({ wait: false }, 'config: rateLimit'), {
    wait: false,
    maxWaitMs: DEFAULT_RATE_LIMIT_MAX_WAIT_MS,
  })
  assert.throws(
    () => resolveRateLimitWait({ maxWaitMs: 0 }, 'config: rateLimit'),
    /rateLimit.maxWaitMs must be a positive finite number/,
  )
  assert.throws(
    () => resolveRateLimitWait({ maxWaitMs: 30 * 24 * 3_600_000 }, 'config: rateLimit'),
    /maximum schedulable delay/,
  )
})


// Shared reference rate-limit cases adapted from other route labels to Codex.
test('provider reset wins Retry-After; Retry-After serves when no reset; non-429 ignores reader', async () => {
  const own = await httpLlmError(failure(429, { 'retry-after': '1' }, '{"resets_in_seconds":600}'), 'codex API', { rateLimitReset: codexRateLimitReset });
  assert.ok(own.failure.providerRetryAfterMs! > 590000);
  const retry = await httpLlmError(failure(429, { 'retry-after': '30' }), 'codex API', { rateLimitReset: codexRateLimitReset });
  assert.ok(retry.failure.providerRetryAfterMs! >= 30000);
  let reads = 0;
  const server = await httpLlmError(failure(503, {}, 'overloaded'), 'codex API', { rateLimitReset: () => { reads++; return Date.now() + 900000; } });
  assert.equal(server.code, 'SERVER'); assert.equal(server.failure.providerRetryAfterMs, undefined); assert.equal(reads, 0);
});
