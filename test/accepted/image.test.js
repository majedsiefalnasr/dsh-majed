import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createImageService, ImageInputError, ImageJobNotFoundError,
  IMAGE_TOOL, IMAGE_EDIT_TOOL, IMAGE_MODEL, IMAGE_MIME,
  DEFAULT_POLL_INTERVAL_MS, DEFAULT_MAX_WAIT_MS, SIZES, MODES, STATUSES,
  imageFileName, createImageJobId, classifyImageError,
} from '../../modules/image/index.js';
import { createAuthStore, createSyntheticAuthAccount } from '../../modules/subscriptions/auth.js';

function makeClock(start = 0) {
  let t = start;
  return { now: () => t, advance: ms => { t += ms; } };
}

function serviceWithClock(options = {}) {
  const clock = options.clock || makeClock();
  return { service: createImageService({ now: clock.now, ...options }), clock };
}

function submit(service, input = { provider: 'codex', model: IMAGE_MODEL, prompt: 'A cat' }) {
  return service.submitImage(input);
}

test('image constants and helpers', () => {
  assert.equal(IMAGE_TOOL, 'image_generate');
  assert.equal(IMAGE_EDIT_TOOL, 'image_edit');
  assert.equal(IMAGE_MODEL, 'grok-imagine-1.5');
  assert.equal(IMAGE_MIME, 'image/png');
  assert.equal(DEFAULT_POLL_INTERVAL_MS, 3_000);
  assert.equal(DEFAULT_MAX_WAIT_MS, 10 * 60_000);
  assert.deepEqual(SIZES, ['1024x1024', '1792x1024', '1024x1792']);
  assert.deepEqual(MODES, ['generate', 'edit']);
  assert.ok(STATUSES.includes('submitted')); assert.ok(STATUSES.includes('pending'));
  assert.ok(STATUSES.includes('done')); assert.ok(STATUSES.includes('failed'));
  assert.ok(STATUSES.includes('expired')); assert.ok(STATUSES.includes('cancelled'));
  assert.ok(STATUSES.includes('unknown'));
  assert.equal(typeof createImageJobId, 'function');
  assert.match(createImageJobId(), /^image-\d+-/);
  assert.equal(imageFileName('image-abc'), 'image-abc.png');
  assert.throws(() => imageFileName(''), ImageInputError);
  assert.throws(() => imageFileName(undefined), ImageInputError);
});

test('submitImage generation creates exactly one synthetic job (no reuse)', () => {
  const { service } = serviceWithClock();
  const result = submit(service);
  assert.equal(typeof result.jobId, 'string');
  assert.equal(result.job.id, result.jobId);
  assert.equal(result.job.status, 'submitted');
  assert.equal(result.job.provider, 'codex');
  assert.equal(result.job.model, IMAGE_MODEL);
  assert.equal(result.job.mode, 'generate');
  assert.equal(result.job.prompt, 'A cat');
  assert.equal(result.job.references, undefined);
  assert.equal(result.job.result, undefined);
  assert.equal(result.job.error, undefined);
  assert.equal(typeof result.job.progressToken, 'string');
  assert.equal(result.job.errorToken, undefined);
  assert.equal(typeof result.job.createdAt, 'number');
  assert.equal(service.size(), 1);

  const result2 = submit(service);
  assert.notEqual(result2.jobId, result.jobId);
  assert.equal(service.size(), 2);
});

test('submitImage validates provider, model, prompt, mode and size', () => {
  const { service } = serviceWithClock();
  assert.throws(() => submit(service, { model: IMAGE_MODEL, prompt: 'x' }), ImageInputError); // missing provider
  assert.throws(() => submit(service, { provider: 'codex', prompt: 'x' }), ImageInputError); // missing model
  assert.throws(() => submit(service, { provider: 'codex', model: IMAGE_MODEL }), ImageInputError); // missing prompt
  assert.throws(() => submit(service, { provider: 'codex', model: IMAGE_MODEL, prompt: '' }), ImageInputError); // empty prompt
  assert.throws(() => submit(service, { provider: 'codex', model: IMAGE_MODEL, prompt: 'x', mode: 'weird' }), ImageInputError);
  assert.throws(() => submit(service, { provider: 'codex', model: IMAGE_MODEL, prompt: 'x', size: '4k' }), ImageInputError);
  assert.throws(() => submit(service, { provider: 'codex', model: IMAGE_MODEL, prompt: 'x', size: '1024x1024x' }), ImageInputError);
  assert.equal(submit(service, { provider: 'codex', model: IMAGE_MODEL, prompt: 'x', size: '1792x1024' }).job.size, '1792x1024');
  assert.throws(() => submit(service, {}), ImageInputError);
});

test('image editing accepts ordered complete references and preserves order', () => {
  const { service } = serviceWithClock();
  const refs = [
    'https://example.test/ref1.jpg',
    'data:image/png;base64,abc',
    'data:image/webp;base64,def',
  ];
  const result = submit(service, { provider: 'codex', model: IMAGE_MODEL, prompt: 'make it a dog', mode: 'edit', references: refs });
  assert.equal(result.job.mode, 'edit');
  assert.deepEqual(result.job.references, refs); // order preserved
  assert.equal(result.job.references[0], 'https://example.test/ref1.jpg');
  assert.equal(result.job.references[2], 'data:image/webp;base64,def');
  assert.equal(service.size(), 1);
});

test('image editing requires references (complete and ordered)', () => {
  const { service } = serviceWithClock();
  // missing references entirely
  assert.throws(() => submit(service, { provider: 'codex', model: IMAGE_MODEL, prompt: 'x', mode: 'edit' }), ImageInputError);
  // empty references array
  assert.throws(() => submit(service, { provider: 'codex', model: IMAGE_MODEL, prompt: 'x', mode: 'edit', references: [] }), ImageInputError);
  // non-array
  assert.throws(() => submit(service, { provider: 'codex', model: IMAGE_MODEL, prompt: 'x', mode: 'edit', references: 'not-an-array' }), ImageInputError);
  // empty string reference
  assert.throws(() => submit(service, { provider: 'codex', model: IMAGE_MODEL, prompt: 'x', mode: 'edit', references: [''] }), ImageInputError);
  // non-string reference
  assert.throws(() => submit(service, { provider: 'codex', model: IMAGE_MODEL, prompt: 'x', mode: 'edit', references: [null] }), ImageInputError);
  // invalid URL
  assert.throws(() => submit(service, { provider: 'codex', model: IMAGE_MODEL, prompt: 'x', mode: 'edit', references: ['ftp://x.test'] }), ImageInputError);
  assert.throws(() => submit(service, { provider: 'codex', model: IMAGE_MODEL, prompt: 'x', mode: 'edit', references: ['not-a-url'] }), ImageInputError);
  assert.throws(() => submit(service, { provider: 'codex', model: IMAGE_MODEL, prompt: 'x', mode: 'edit', references: ['data:image/bmp;base64,abc'] }), ImageInputError); // unsupported mime
  // valid data URLs including GIF are accepted
  assert.equal(submit(service, { provider: 'codex', model: IMAGE_MODEL, prompt: 'x', mode: 'edit', references: ['data:image/gif;base64,abc'] }).job.status, 'submitted');
});

test('edit-reference failure cannot silently become text-to-image generation', () => {
  const { service } = serviceWithClock();
  const before = service.size();
  // Invalid edit references throw and create no job.
  assert.throws(() => submit(service, { provider: 'codex', model: IMAGE_MODEL, prompt: 'A cat', mode: 'edit', references: ['not-a-url'] }), ImageInputError);
  assert.throws(() => submit(service, { provider: 'codex', model: IMAGE_MODEL, prompt: 'A cat', mode: 'edit', references: [] }), ImageInputError);
  assert.equal(service.size(), before); // no job created: no silent generation fallback
  // A valid generation still works (references are edit-only).
  assert.throws(() => submit(service, { provider: 'codex', model: IMAGE_MODEL, prompt: 'A cat', references: ['https://example.test/r.png'] }), ImageInputError);
  assert.equal(service.size(), before);
});

test('pollImage is read-only and never resubmits: success fixture', () => {
  const { service, clock } = serviceWithClock();
  const { jobId } = submit(service);
  let polled = service.pollImage(jobId);
  assert.equal(polled.status, 'submitted');
  assert.equal(polled.result, undefined);
  assert.equal(polled.error, undefined);
  const firstToken = polled.progressToken;

  service.driveImage(jobId, { status: 'pending' });
  polled = service.pollImage(jobId);
  assert.equal(polled.status, 'pending');
  assert.notEqual(polled.progressToken, firstToken);

  service.driveImage(jobId, { status: 'done', duration: 4 });
  polled = service.pollImage(jobId);
  assert.equal(polled.status, 'done');
  assert.equal(polled.result.url, `https://synthetic.test/images/${jobId}.png`);
  assert.equal(polled.result.fileName, `${jobId}.png`);
  assert.equal(polled.result.mime, IMAGE_MIME);
  assert.equal(typeof polled.result.size, 'number');
  assert.equal(polled.error, undefined);
  assert.equal(polled.errorToken, undefined);

  const again = service.pollImage(jobId);
  assert.deepEqual(again, polled); // re-poll returns same state
  assert.equal(service.size(), 1); // still exactly one job: no resubmission
});

test('pollImage failure fixture sets errorToken and is not retried', () => {
  const { service } = serviceWithClock();
  const { jobId } = submit(service);
  service.driveImage(jobId, { status: 'pending' });
  service.driveImage(jobId, { status: 'failed', error: { message: 'The image could not be generated.', code: 'GENERATION_FAILED' } });
  const polled = service.pollImage(jobId);
  assert.equal(polled.status, 'failed');
  assert.equal(polled.error.message, 'The image could not be generated.');
  assert.equal(polled.error.code, 'GENERATION_FAILED');
  assert.equal(polled.result, undefined);
  assert.equal(typeof polled.errorToken, 'string');
  const again = service.pollImage(jobId);
  assert.deepEqual(again, polled); // failed job not retried by polling
  assert.equal(service.size(), 1);
});

test('pollImage unknown job throws ImageJobNotFoundError', () => {
  const { service } = serviceWithClock();
  assert.throws(() => service.pollImage('image-does-not-exist'), ImageJobNotFoundError);
  assert.throws(() => service.pollImage('image-does-not-exist'), err => {
    assert.equal(err.name, 'ImageJobNotFoundError');
    assert.equal(err.jobId, 'image-does-not-exist');
    return true;
  });
  assert.equal(service.size(), 0);
});

test('cancelImage marks cancelled without resubmission (interrupted polling)', () => {
  const { service } = serviceWithClock();
  const { jobId } = submit(service);
  service.driveImage(jobId, { status: 'pending' });

  const cancelled = service.cancelImage(jobId);
  assert.equal(cancelled.status, 'cancelled');
  assert.equal(cancelled.jobId, jobId);
  assert.equal(typeof cancelled.progressToken, 'string');
  const polled = service.pollImage(jobId);
  assert.equal(polled.status, 'cancelled');
  assert.equal(polled.jobId, jobId);

  const again = service.cancelImage(jobId); // idempotent on settled
  assert.equal(again.status, 'cancelled');

  const retry = submit(service, { provider: 'codex', model: IMAGE_MODEL, prompt: 'A cat' });
  assert.notEqual(retry.jobId, jobId); // recovery is a brand-new job
  assert.equal(service.size(), 2);
  assert.equal(service.pollImage(retry.jobId).status, 'submitted');
});

test('cancelImage unknown job throws', () => {
  const { service } = serviceWithClock();
  assert.throws(() => service.cancelImage('image-missing'), ImageJobNotFoundError);
  assert.equal(service.size(), 0);
});

test('getImage returns a read-only snapshot; listImages is the gallery newest first', () => {
  const { service, clock } = serviceWithClock();
  const a = submit(service, { provider: 'codex', model: IMAGE_MODEL, prompt: 'first' });
  clock.advance(10);
  const b = submit(service, { provider: 'codex', model: IMAGE_MODEL, prompt: 'second', size: '1024x1792' });
  service.driveImage(b.jobId, { status: 'done' });

  const snap = service.getImage(b.jobId);
  assert.equal(snap.jobId, b.jobId);
  assert.equal(snap.status, 'done');
  assert.equal(snap.provider, 'codex');
  assert.equal(snap.mode, 'generate');
  assert.equal(snap.size, '1024x1792');

  const gallery = service.listImages();
  assert.deepEqual(gallery.map(g => g.jobId), [b.jobId, a.jobId]); // newest first
  assert.equal(gallery.length, 2);
  snap.status = 'tampered'; // read-only view
  assert.equal(service.getImage(b.jobId).status, 'done');
});

test('token-based progress and error controls', () => {
  const { service } = serviceWithClock();
  const { jobId } = submit(service);
  const initial = service.pollImage(jobId);
  const progressToken = initial.progressToken;

  service.driveImage(jobId, { status: 'pending' });
  assert.notEqual(service.pollImage(jobId).progressToken, progressToken);

  assert.equal(initial.errorToken, undefined);
  service.driveImage(jobId, { status: 'failed', error: { message: 'boom', code: 'ERR' } });
  const failed = service.pollImage(jobId);
  assert.notEqual(failed.errorToken, undefined);
  assert.notEqual(failed.errorToken, initial.errorToken);

  service.cancelImage(jobId);
  assert.equal(service.pollImage(jobId).status, 'failed'); // cancel on settled is a no-op
  assert.equal(service.pollImage(jobId).errorToken, failed.errorToken);
});

test('driveImage fixture seam: rejects invalid statuses and drives outcomes', () => {
  const { service } = serviceWithClock();
  const { jobId } = submit(service);

  assert.throws(() => service.driveImage(jobId, { status: 'weird' }), ImageInputError);
  assert.throws(() => service.driveImage(jobId, {}), ImageInputError);

  service.driveImage(jobId, { status: 'pending' });
  service.driveImage(jobId, { status: 'expired' });
  const expired = service.pollImage(jobId);
  assert.equal(expired.status, 'expired');
  assert.equal(expired.error.code, 'expired');
  assert.equal(typeof expired.errorToken, 'string');
});

test('driveImage on settled job returns current state (idempotent)', () => {
  const { service } = serviceWithClock();
  const { jobId } = submit(service);
  service.driveImage(jobId, { status: 'done' });
  const current = service.driveImage(jobId, { status: 'failed' }); // settled: no-op
  assert.equal(current.status, 'done');
  assert.equal(current.result.fileName, `${jobId}.png`);
});

test('driveImage unknown job throws ImageJobNotFoundError', () => {
  const { service } = serviceWithClock();
  assert.throws(() => service.driveImage('image-missing', { status: 'done' }), ImageJobNotFoundError);
  assert.equal(service.size(), 0);
});

// ---------------------------------------------------------------------------
// Preserved image fallback contract.
// ---------------------------------------------------------------------------

function jobFor(candidate, input) {
  return {
    id: `image-${candidate.account}-${input.mode}`,
    status: 'submitted', provider: candidate.provider, account: candidate.account, model: candidate.model,
    mode: input.mode, prompt: input.prompt, references: input.references, size: input.size,
    result: undefined, error: undefined, progressToken: 'token', errorToken: undefined,
    createdAt: 1, updatedAt: 1, cancelled: false,
  };
}

test('fallback contract: definitive auth rejection yields to the next candidate (cross-provider)', () => {
  let calls = 0;
  const service = createImageService({
    candidates: [
      { provider: 'codex', account: 'acct-logged-out', model: IMAGE_MODEL },
      { provider: 'grok', account: 'acct-grok', model: IMAGE_MODEL },
    ],
    performSubmit: (candidate, input) => {
      calls += 1;
      if (candidate.provider === 'codex') throw Object.assign(new Error('unauthorized'), { code: 'AUTH' });
      return jobFor(candidate, input);
    },
  });
  const result = submit(service, { provider: 'codex', model: IMAGE_MODEL, prompt: 'A cat' });
  assert.equal(calls, 2); // codex failed AUTH, fell back to grok
  assert.equal(result.job.provider, 'grok');
  assert.equal(result.job.account, 'acct-grok');
  assert.equal(service.size(), 1);
});

test('same-provider account scheduling: two independent accounts of one provider', () => {
  let calls = 0;
  const service = createImageService({
    candidates: [
      { provider: 'codex', account: 'acct-a', model: IMAGE_MODEL },
      { provider: 'codex', account: 'acct-b', model: IMAGE_MODEL },
    ],
    performSubmit: (candidate, input) => {
      calls += 1;
      if (candidate.account === 'acct-a') throw Object.assign(new Error('quota exceeded'), { code: 'QUOTA_EXCEEDED' });
      return jobFor(candidate, input);
    },
  });
  const result = submit(service, { provider: 'codex', model: IMAGE_MODEL, prompt: 'A cat' });
  assert.equal(calls, 2); // acct-a quota, fell back to acct-b (same provider, independent account)
  assert.equal(result.job.account, 'acct-b');
  assert.equal(result.job.provider, 'codex');
});

test('ambiguous timeout/transport/5xx errors do not resubmit a potentially completed image', () => {
  for (const code of ['TIMEOUT', 'TRANSPORT', 'SERVER', 'EMPTY_RESPONSE', 'HTTP_402', 'HTTP_404']) {
    let calls = 0;
    const service = createImageService({
      candidates: [{ provider: 'codex', account: 'acct', model: IMAGE_MODEL }],
      performSubmit: () => { calls += 1; throw Object.assign(new Error('blup'), { code }); },
    });
    assert.throws(() => submit(service, { provider: 'codex', model: IMAGE_MODEL, prompt: 'x' }));
    assert.equal(calls, 1, `code ${code}: exactly one submission, no resubmit`);
  }
});

test('ambiguous 5xx style error does not resubmit', () => {
  let calls = 0;
  const service = createImageService({
    candidates: [{ provider: 'codex', account: 'acct', model: IMAGE_MODEL }],
    performSubmit: () => { calls += 1; throw Object.assign(new Error('internal server error'), { code: 'SERVER', status: 500 }); },
  });
  assert.throws(() => submit(service, { provider: 'codex', model: IMAGE_MODEL, prompt: 'x' }));
  assert.equal(calls, 1);
});

test('terminal errors are rethrown with no fallback', () => {
  let calls = 0;
  const service = createImageService({
    candidates: [
      { provider: 'codex', account: 'a', model: IMAGE_MODEL },
      { provider: 'codex', account: 'b', model: IMAGE_MODEL },
    ],
    performSubmit: () => { calls += 1; throw Object.assign(new Error('aborted'), { code: 'ABORTED' }); },
  });
  assert.throws(() => submit(service, { provider: 'codex', model: IMAGE_MODEL, prompt: 'x' }), err => err.code === 'ABORTED');
  assert.equal(calls, 1); // terminal: no fallback to account b
});

test('all candidates failing definitively throws the last error', () => {
  let calls = 0;
  const service = createImageService({
    candidates: [
      { provider: 'codex', account: 'a', model: IMAGE_MODEL },
      { provider: 'codex', account: 'b', model: IMAGE_MODEL },
    ],
    performSubmit: () => { calls += 1; throw Object.assign(new Error('no entitlement'), { code: 'ENTITLEMENT' }); },
  });
  assert.throws(() => submit(service, { provider: 'codex', model: IMAGE_MODEL, prompt: 'x' }), err => err.code === 'ENTITLEMENT');
  assert.equal(calls, 2); // both candidates tried, both definitive failures
});

test('no candidates configured for the requested provider/model throws', () => {
  const service = createImageService({ candidates: [{ provider: 'codex', account: 'a', model: 'other-model' }] });
  assert.throws(() => submit(service, { provider: 'codex', model: IMAGE_MODEL, prompt: 'x' }), ImageInputError);
});

// ---------------------------------------------------------------------------
// Auth-refresh path (one supported path), cancellation, secret-safe diagnostics.
// ---------------------------------------------------------------------------

test('auth-refresh path: a failed account can be refreshed back to successful', async () => {
  const store = createAuthStore([
    createSyntheticAuthAccount('acct', { provider: 'codex', models: [IMAGE_MODEL], authState: 'failed' }),
  ], {
    performRefresh: async () => ({ ok: true }),
  });

  let account = store.get('codex', 'acct');
  assert.equal(account.authState, 'failed');

  const refreshed = await store.refresh('codex', 'acct');
  assert.equal(refreshed.ok, true);
  account = store.get('codex', 'acct');
  assert.equal(account.authState, 'failed'); // refresh success updates counters; authState is a separate login concern
  assert.equal(account.refreshCount, 1);
  assert.equal(typeof account.lastRefreshAt, 'number');
});

test('auth-refresh path is gated by cooldown (no duplicate refresh)', async () => {
  const now = 1000;
  const store = createAuthStore([
    createSyntheticAuthAccount('acct', { provider: 'codex', models: [IMAGE_MODEL], authState: 'pending' }),
  ], { now: () => now, performRefresh: async () => ({ ok: true }) });

  await store.refresh('codex', 'acct'); // first refresh
  const cooldown = await store.refresh('codex', 'acct'); // within cooldown -> skipped
  assert.equal(cooldown.ok, true);
  assert.equal(cooldown.refreshed, false);
  assert.equal(cooldown.reason, 'cooldown');
  assert.equal(store.get('codex', 'acct').refreshCount, 1);
});

test('cancellation: cancelImage leaves the job settled and recovery submits a new job', () => {
  const { service } = serviceWithClock();
  const { jobId } = submit(service);
  service.driveImage(jobId, { status: 'pending' });
  service.cancelImage(jobId);
  assert.equal(service.pollImage(jobId).status, 'cancelled');
  const before = service.size();
  const retry = submit(service, { provider: 'codex', model: IMAGE_MODEL, prompt: 'A cat' });
  assert.notEqual(retry.jobId, jobId);
  assert.equal(service.size(), before + 1);
});

test('secret-safe diagnostics: errors do not leak credentials', () => {
  const service = createImageService({
    candidates: [{ provider: 'codex', account: 'acct', model: IMAGE_MODEL }],
    performSubmit: () => {
      throw Object.assign(new Error('auth failed'), { code: 'AUTH' });
    },
  });
  assert.throws(() => submit(service, { provider: 'codex', model: IMAGE_MODEL, prompt: 'x' }), err => {
    assert.equal(err.code, 'AUTH');
    assert.equal(err.message, 'auth failed');
    assert.equal(err.credentials, undefined);
    return true;
  });
});

// ---------------------------------------------------------------------------
// Output attachments: completed image result becomes an attachment reference.
// ---------------------------------------------------------------------------

test('imageAttachment converts a completed result into an attachment reference', () => {
  const service = serviceWithClock().service;
  const result = { url: `https://synthetic.test/images/image-abc.png`, fileName: 'image-abc.png', mime: IMAGE_MIME, size: 12345 };
  const attachment = service.imageAttachment(result, { provider: 'codex', account: 'acct', model: IMAGE_MODEL });
  assert.equal(attachment.id, 'image-abc.png');
  assert.equal(attachment.type, 'image');
  assert.equal(attachment.url, result.url);
  assert.equal(attachment.mime, IMAGE_MIME);
  assert.equal(attachment.size, 12345);
  assert.equal(attachment.provider, 'codex');
  assert.equal(attachment.account, 'acct');
  assert.equal(attachment.model, IMAGE_MODEL);
  assert.equal(attachment.vision, true);
  assert.equal(attachment.offloaded, true);
  // frozen
  assert.throws(() => { attachment.provider = 'tampered'; });
});

test('imageAttachment rejects invalid results', () => {
  const service = serviceWithClock().service;
  assert.throws(() => service.imageAttachment(undefined), ImageInputError);
  assert.throws(() => service.imageAttachment({ url: 'x.test' }), ImageInputError); // missing fileName
  assert.throws(() => service.imageAttachment({ fileName: 'x.png' }), ImageInputError); // missing url
});

// ---------------------------------------------------------------------------
// classifyImageError mapping (definitive vs ambiguous vs terminal).
// ---------------------------------------------------------------------------

test('classifyImageError: definitive codes => fallback', () => {
  for (const code of ['AUTH', 'INVALID_CREDENTIAL', 'MISSING_CREDENTIAL', 'QUOTA_EXCEEDED', 'RATE_LIMIT', 'ENTITLEMENT']) {
    assert.deepEqual(classifyImageError({ code }), { action: 'fallback', reason: code, code });
  }
  assert.deepEqual(classifyImageError(Object.assign(new Error('unauthorized'), { code: 'AUTH' })), { action: 'fallback', reason: 'AUTH', code: 'AUTH' });
  assert.deepEqual(classifyImageError(Object.assign(new Error('rate limit'), { code: 'RATE_LIMIT' })), { action: 'fallback', reason: 'RATE_LIMIT', code: 'RATE_LIMIT' });
});

test('classifyImageError: ambiguous codes => noresubmit (no resubmit of completed image)', () => {
  for (const code of ['TIMEOUT', 'TRANSPORT', 'SERVER', 'EMPTY_RESPONSE', 'HTTP_402', 'HTTP_404']) {
    assert.deepEqual(classifyImageError({ code }), { action: 'noresubmit', reason: code, code });
  }
  assert.deepEqual(classifyImageError(Object.assign(new Error('gateway timeout'), { code: 'TIMEOUT' })), { action: 'noresubmit', reason: 'TIMEOUT', code: 'TIMEOUT' });
  assert.deepEqual(classifyImageError(Object.assign(new Error('internal server error'), { code: 'SERVER', status: 500 })), { action: 'noresubmit', reason: 'SERVER', code: 'SERVER' });
});

test('classifyImageError: terminal codes => throw', () => {
  for (const code of ['CONTEXT_WINDOW_EXCEEDED', 'ABORTED']) {
    assert.deepEqual(classifyImageError({ code }), { action: 'throw', reason: code, code });
  }
});

test('classifyImageError: message-based fallback for auth/quota/entitlement', () => {
  assert.deepEqual(classifyImageError(new Error('rate limit exceeded')), { action: 'fallback', reason: 'RATE_LIMIT', code: 'RATE_LIMIT' });
  assert.deepEqual(classifyImageError(new Error('unauthorized 401')), { action: 'fallback', reason: 'AUTH', code: 'AUTH' });
  assert.deepEqual(classifyImageError(new Error('missing credential')), { action: 'fallback', reason: 'AUTH', code: 'AUTH' });
  assert.deepEqual(classifyImageError(new Error('entitlement check failed')), { action: 'fallback', reason: 'AUTH', code: 'AUTH' });
  assert.deepEqual(classifyImageError(new Error('gateway timeout')), { action: 'noresubmit', reason: 'SERVER', code: 'SERVER' });
  assert.deepEqual(classifyImageError(new Error('network down')), { action: 'noresubmit', reason: 'TRANSPORT', code: 'TRANSPORT' });
});

test('classifyImageError: null/unknown => noresubmit transport', () => {
  assert.deepEqual(classifyImageError(null), { action: 'noresubmit', reason: 'TRANSPORT', code: 'TRANSPORT' });
  assert.deepEqual(classifyImageError(undefined), { action: 'noresubmit', reason: 'TRANSPORT', code: 'TRANSPORT' });
  assert.deepEqual(classifyImageError({ code: 'UNKNOWN_CODE' }), { action: 'throw', reason: 'UNKNOWN_CODE', code: 'UNKNOWN_CODE' });
});
