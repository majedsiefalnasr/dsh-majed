import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createVideoService, VideoJobNotFoundError, VideoInputError,
  VIDEO_TOOL, VIDEO_MODEL, DEFAULT_POLL_INTERVAL_MS, DEFAULT_MAX_WAIT_MS,
  DURATION_RANGE, ASPECT_RATIOS, RESOLUTIONS, STATUSES,
  videoFileName, createVideoJobId,
} from '../../modules/video/index.js';

function makeClock(start = 0) {
  let t = start;
  return { now: () => t, advance: ms => { t += ms; } };
}

function serviceWithClock(options = {}) {
  const clock = options.clock || makeClock();
  return { service: createVideoService({ now: clock.now }), clock };
}

function submit(service, input = { prompt: 'A video of a cat' }) {
  return service.submitVideo(input);
}

test('video constants and helpers', () => {
  assert.equal(VIDEO_TOOL, 'video_generate');
  assert.equal(VIDEO_MODEL, 'grok-imagine-video-1.5');
  assert.equal(DEFAULT_POLL_INTERVAL_MS, 3_000);
  assert.equal(DEFAULT_MAX_WAIT_MS, 10 * 60_000);
  assert.deepEqual(DURATION_RANGE, { min: 1, max: 15 });
  assert.deepEqual(ASPECT_RATIOS, ['16:9', '9:16', '1:1', '4:3', '3:4', '3:2', '2:3']);
  assert.deepEqual(RESOLUTIONS, ['480p', '720p', '1080p']);
  assert.ok(STATUSES.includes('submitted')); assert.ok(STATUSES.includes('pending'));
  assert.ok(STATUSES.includes('done')); assert.ok(STATUSES.includes('failed'));
  assert.ok(STATUSES.includes('expired')); assert.ok(STATUSES.includes('cancelled'));
  assert.ok(STATUSES.includes('unknown'));
  assert.equal(typeof createVideoJobId, 'function');
  assert.match(createVideoJobId(), /^video-\d+-/);
  assert.equal(videoFileName('video-abc'), 'video-abc.mp4');
  assert.throws(() => videoFileName(''), VideoInputError);
  assert.throws(() => videoFileName(undefined), VideoInputError);
});

test('submitVideo creates exactly one job with validated inputs', () => {
  const { service } = serviceWithClock();
  const result = submit(service);
  assert.equal(typeof result.jobId, 'string');
  assert.equal(result.job.id, result.jobId);
  assert.equal(result.job.status, 'submitted');
  assert.equal(result.job.prompt, 'A video of a cat');
  assert.equal(result.job.result, undefined);
  assert.equal(result.job.error, undefined);
  assert.equal(typeof result.job.progressToken, 'string');
  assert.equal(result.job.errorToken, undefined);
  assert.equal(typeof result.job.createdAt, 'number');
  assert.equal(service.size(), 1);

  // A second submission creates a second, distinct job (no reuse).
  const result2 = submit(service);
  assert.notEqual(result2.jobId, result.jobId);
  assert.equal(service.size(), 2);
});

test('submitVideo validates duration, aspect_ratio, resolution and starting-image', () => {
  const { service } = serviceWithClock();
  assert.throws(() => submit(service, { prompt: 'x', duration: 0 }), VideoInputError);
  assert.throws(() => submit(service, { prompt: 'x', duration: 16 }), VideoInputError);
  assert.throws(() => submit(service, { prompt: 'x', duration: 1.5 }), VideoInputError);
  assert.throws(() => submit(service, { prompt: 'x', aspect_ratio: '1:0' }), VideoInputError);
  assert.throws(() => submit(service, { prompt: 'x', resolution: '4k' }), VideoInputError);
  assert.throws(() => submit(service, { prompt: 'x', startingImage: 'ftp://x.test' }), VideoInputError);
  assert.throws(() => submit(service, { prompt: 'x', startingImage: 'not-a-url' }), VideoInputError);
  assert.throws(() => submit(service, { prompt: 'x', startingImage: 'data:image/gif;base64,abc' }), VideoInputError);
  // valid starting images are accepted (image_url is canonical; startingImage alias also works)
  assert.equal(submit(service, { prompt: 'x', image_url: 'https://example.test/img.jpg' }).job.status, 'submitted');
  assert.equal(submit(service, { prompt: 'x', startingImage: 'data:image/png;base64,abc' }).job.status, 'submitted');
  assert.equal(submit(service, { prompt: 'x', starting_image: 'data:image/webp;base64,abc' }).job.status, 'submitted');
  assert.equal(submit(service, { prompt: 'x', duration: 1, aspectRatio: '9:16', resolution: '1080p' }).job.status, 'submitted');
  assert.throws(() => submit(service, {}), VideoInputError); // missing prompt
  assert.throws(() => submit(service, { prompt: '' }), VideoInputError); // empty prompt
  assert.throws(() => submit(service, { prompt: 'x', duration: -1 }), VideoInputError);
});

test('pollVideo is read-only and never resubmits: success fixture', () => {
  const { service, clock } = serviceWithClock();
  const { jobId } = submit(service);
  // Submitted state.
  let polled = service.pollVideo(jobId);
  assert.equal(polled.status, 'submitted');
  assert.equal(polled.result, undefined);
  assert.equal(polled.error, undefined);
  const firstToken = polled.progressToken;

  // Drive to pending then done (synthetic fixture; no real generation).
  service.driveJob(jobId, { status: 'pending' });
  polled = service.pollVideo(jobId);
  assert.equal(polled.status, 'pending');
  assert.notEqual(polled.progressToken, firstToken); // progress token advances

  service.driveJob(jobId, { status: 'done', duration: 7 });
  polled = service.pollVideo(jobId);
  assert.equal(polled.status, 'done');
  assert.equal(polled.result.url, `https://synthetic.test/videos/${jobId}.mp4`);
  assert.equal(polled.result.duration, 7);
  assert.equal(polled.result.fileName, `${jobId}.mp4`);
  assert.equal(polled.error, undefined);
  assert.equal(polled.errorToken, undefined);
  // Re-polling the same settled job returns the same state; no resubmission.
  const again = service.pollVideo(jobId);
  assert.deepEqual(again, polled);
  assert.equal(service.size(), 1); // still exactly one job
});

test('pollVideo failure fixture sets errorToken', () => {
  const { service } = serviceWithClock();
  const { jobId } = submit(service);
  service.driveJob(jobId, { status: 'pending' });
  service.driveJob(jobId, {
    status: 'failed',
    error: { message: 'The video could not be generated.', code: 'GENERATION_FAILED' },
  });
  const polled = service.pollVideo(jobId);
  assert.equal(polled.status, 'failed');
  assert.equal(polled.error.message, 'The video could not be generated.');
  assert.equal(polled.error.code, 'GENERATION_FAILED');
  assert.equal(polled.result, undefined);
  assert.equal(typeof polled.errorToken, 'string');
  assert.notEqual(polled.errorToken, undefined);
  // A failed job is not retried by polling; polling returns the same failure.
  const again = service.pollVideo(jobId);
  assert.deepEqual(again, polled);
  assert.equal(service.size(), 1);
});

test('pollVideo unknown job throws VideoJobNotFoundError', () => {
  const { service } = serviceWithClock();
  assert.throws(() => service.pollVideo('video-does-not-exist'), VideoJobNotFoundError);
  assert.throws(() => service.pollVideo('video-does-not-exist'), err => {
    assert.equal(err.name, 'VideoJobNotFoundError');
    assert.equal(err.jobId, 'video-does-not-exist');
    return true;
  });
  assert.equal(service.size(), 0); // no job created by a failed poll
});

test('cancelVideo marks cancelled without resubmission (interrupted polling)', () => {
  const { service } = serviceWithClock();
  const { jobId } = submit(service);
  service.driveJob(jobId, { status: 'pending' });

  // Interrupt / cancel while pending: job becomes cancelled, no new job.
  const cancelled = service.cancelVideo(jobId);
  assert.equal(cancelled.status, 'cancelled');
  assert.equal(cancelled.jobId, jobId);
  assert.equal(cancelled.progressToken !== undefined, true);
  const polled = service.pollVideo(jobId);
  assert.equal(polled.status, 'cancelled');
  assert.equal(polled.jobId, jobId);
  // Cancelling again is idempotent on a settled job.
  const again = service.cancelVideo(jobId);
  assert.equal(again.status, 'cancelled');

  // Recovery submits a brand-new job rather than reusing / resubmitting the cancelled one.
  const retry = submit(service, { prompt: 'A video of a cat' });
  assert.notEqual(retry.jobId, jobId);
  assert.equal(service.size(), 2);
  assert.equal(service.pollVideo(retry.jobId).status, 'submitted');
});

test('cancelVideo unknown job throws', () => {
  const { service } = serviceWithClock();
  assert.throws(() => service.cancelVideo('video-missing'), VideoJobNotFoundError);
  assert.equal(service.size(), 0);
});

test('getVideo returns a read-only snapshot; listVideos is the gallery newest first', () => {
  const { service, clock } = serviceWithClock();
  const a = submit(service, { prompt: 'first' });
  clock.advance(10);
  const b = submit(service, { prompt: 'second', duration: 5, aspectRatio: '9:16', resolution: '720p' });
  service.driveJob(b.jobId, { status: 'done', duration: 5 });

  const snap = service.getVideo(b.jobId);
  assert.equal(snap.jobId, b.jobId);
  assert.equal(snap.status, 'done');
  assert.equal(snap.duration, 5);
  assert.equal(snap.aspectRatio, '9:16');
  assert.equal(snap.resolution, '720p');
  assert.equal(snap.startingImage, undefined);

  const gallery = service.listVideos();
  assert.deepEqual(gallery.map(g => g.jobId), [b.jobId, a.jobId]); // newest first
  assert.equal(gallery.length, 2);
  // Snapshots are read-only views; mutating the returned object does not affect the store.
  snap.status = 'tampered';
  assert.equal(service.getVideo(b.jobId).status, 'done');
});

test('token-based progress and error controls', () => {
  const { service } = serviceWithClock();
  const { jobId } = submit(service);
  const initial = service.pollVideo(jobId);
  const progressToken = initial.progressToken;

  // Progress token changes on every status transition.
  service.driveJob(jobId, { status: 'pending' });
  assert.notEqual(service.pollVideo(jobId).progressToken, progressToken);

  // Error token is absent until a failure, then present.
  assert.equal(initial.errorToken, undefined);
  service.driveJob(jobId, { status: 'failed', error: { message: 'boom', code: 'ERR' } });
  const failed = service.pollVideo(jobId);
  assert.notEqual(failed.errorToken, undefined);
  assert.notEqual(failed.errorToken, initial.errorToken);

  // A subsequent cancel on a failed (settled) job does not change state.
  service.cancelVideo(jobId);
  assert.equal(service.pollVideo(jobId).status, 'failed');
  assert.equal(service.pollVideo(jobId).errorToken, failed.errorToken);
});

test('driveJob fixture seam: rejects invalid statuses and drives expired', () => {
  const { service } = serviceWithClock();
  const { jobId } = submit(service);

  // unknown status is rejected.
  assert.throws(() => service.driveJob(jobId, { status: 'weird' }), VideoInputError);
  // missing status is rejected.
  assert.throws(() => service.driveJob(jobId, {}), VideoInputError);

  // expired fixture sets an error token.
  service.driveJob(jobId, { status: 'expired' });
  const expired = service.pollVideo(jobId);
  assert.equal(expired.status, 'expired');
  assert.equal(expired.error.code, 'expired');
  assert.equal(typeof expired.errorToken, 'string');
});

test('driveJob on settled job returns current state (idempotent)', () => {
  const { service } = serviceWithClock();
  const { jobId } = submit(service);
  service.driveJob(jobId, { status: 'done', duration: 3 });
  const current = service.driveJob(jobId, { status: 'failed' }); // settled: no-op, returns current
  assert.equal(current.status, 'done');
  assert.equal(current.result.duration, 3);
});

test('driveJob unknown job throws VideoJobNotFoundError', () => {
  const { service } = serviceWithClock();
  assert.throws(() => service.driveJob('video-missing', { status: 'done' }), VideoJobNotFoundError);
  assert.equal(service.size(), 0);
});
