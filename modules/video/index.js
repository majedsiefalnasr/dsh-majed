// Video generation submission, polling and rendering support.
//
// Grok video / image-to-video is asynchronous: submission starts a job and
// returns a job id; polling reads the job's status until it settles.
// Submission and polling are deliberately separate operations so recovery or
// cancellation never causes a duplicate side-effecting submission. Chat retry
// rules are not generalized to async video.
//
// No real video generation or capacity consumption is performed: every job is
// a synthetic fixture driven by the caller. The service records job state and
// exposes token-based progress/error controls for local and remote UI. Media
// scheduling remains separate from Auto.

export const VIDEO_TOOL = 'video_generate';
export const VIDEO_MODEL = 'grok-imagine-video-1.5';
export const DEFAULT_POLL_INTERVAL_MS = 3_000;
export const DEFAULT_MAX_WAIT_MS = 10 * 60_000;
export const DURATION_RANGE = Object.freeze({ min: 1, max: 15 });
export const ASPECT_RATIOS = Object.freeze(['16:9', '9:16', '1:1', '4:3', '3:4', '3:2', '2:3']);
export const RESOLUTIONS = Object.freeze(['480p', '720p', '1080p']);

const STATUS_SUBMITTED = 'submitted';
const STATUS_PENDING = 'pending';
const STATUS_DONE = 'done';
const STATUS_FAILED = 'failed';
const STATUS_EXPIRED = 'expired';
const STATUS_CANCELLED = 'cancelled';
const STATUS_UNKNOWN = 'unknown';
const STATUSES = Object.freeze([STATUS_SUBMITTED, STATUS_PENDING, STATUS_DONE, STATUS_FAILED, STATUS_EXPIRED, STATUS_CANCELLED, STATUS_UNKNOWN]);

const URL_OR_DATA_URL = /^(?:https?:\/\/)|\/?data:image\/(?:jpeg|png|webp);base64,/;

export class VideoJobNotFoundError extends Error {
  constructor(jobId) {
    super(`video: unknown job ${jobId}`);
    this.name = 'VideoJobNotFoundError';
    this.jobId = jobId;
  }
}

export class VideoInputError extends Error {
  constructor(message) {
    super(message);
    this.name = 'VideoInputError';
  }
}

function requiredString(value, name) {
  if (typeof value !== 'string' || !value) throw new VideoInputError(`Invalid ${name}.`);
  return value;
}

function validateDuration(duration) {
  if (duration === undefined) return undefined;
  if (!Number.isInteger(duration) || duration < DURATION_RANGE.min || duration > DURATION_RANGE.max) {
    throw new VideoInputError(`duration must be an integer between ${DURATION_RANGE.min} and ${DURATION_RANGE.max} seconds`);
  }
  return duration;
}

function validateAspectRatio(aspectRatio) {
  if (aspectRatio === undefined) return undefined;
  if (!ASPECT_RATIOS.includes(aspectRatio)) throw new VideoInputError(`aspect_ratio must be one of ${ASPECT_RATIOS.join(', ')}`);
  return aspectRatio;
}

function validateResolution(resolution) {
  if (resolution === undefined) return undefined;
  if (!RESOLUTIONS.includes(resolution)) throw new VideoInputError(`resolution must be one of ${RESOLUTIONS.join(', ')}`);
  return resolution;
}

function validateStartingImage(startingImage) {
  if (startingImage === undefined) return undefined;
  requiredString(startingImage, 'startingImage');
  if (!URL_OR_DATA_URL.test(startingImage)) {
    throw new VideoInputError('startingImage must be a public URL or a JPEG/PNG/WebP data URL');
  }
  return startingImage;
}

export function createVideoJobId() {
  return `video-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Bare `.mp4` file name for one job, read only from the generated-video directory. */
export function videoFileName(jobId) {
  requiredString(jobId, 'jobId');
  return `${jobId}.mp4`;
}

function nextId(now) {
  return `video-${now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function newToken(now) {
  return `${now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isSettled(status) {
  return status === STATUS_DONE || status === STATUS_FAILED || status === STATUS_EXPIRED || status === STATUS_CANCELLED;
}

/** Build a frozen video job record. */
function buildJob({ id, prompt, duration, aspectRatio, resolution, startingImage, now }) {
  const created = now();
  const progressToken = newToken(now);
  return Object.freeze({
    id,
    status: STATUS_SUBMITTED,
    requestId: id,
    prompt,
    ...(duration !== undefined ? { duration } : {}),
    ...(aspectRatio !== undefined ? { aspectRatio } : {}),
    ...(resolution !== undefined ? { resolution } : {}),
    ...(startingImage !== undefined ? { startingImage } : {}),
    result: undefined,
    error: undefined,
    progressToken,
    errorToken: undefined,
    createdAt: created,
    updatedAt: created,
    cancelled: false,
  });
}

/** Transition a job to a synthetic outcome (fixture driver, never real generation). */
function transition(job, outcome, now) {
  const updated = now();
  const base = { ...job, updatedAt: updated, cancelled: outcome.cancelled === true };
  if (outcome.status === STATUS_DONE) {
    const result = { url: `https://synthetic.test/videos/${job.id}.mp4` };
    if (typeof outcome.duration === 'number') result.duration = outcome.duration;
    result.fileName = videoFileName(job.id);
    return Object.freeze({ ...base, status: STATUS_DONE, result,
      progressToken: newToken(now), errorToken: undefined });
  }
  if (outcome.status === STATUS_FAILED || outcome.status === STATUS_EXPIRED) {
    return Object.freeze({ ...base, status: outcome.status, error: outcome.error || { message: `video generation ${outcome.status}`, code: outcome.status },
      progressToken: newToken(now), errorToken: newToken(now) });
  }
  if (outcome.status === STATUS_CANCELLED) {
    return Object.freeze({ ...base, status: STATUS_CANCELLED, progressToken: newToken(now), errorToken: undefined });
  }
  // pending / submitted / unknown: no terminal mutation beyond status + token
  return Object.freeze({ ...base, status: outcome.status, progressToken: newToken(now) });
}

/** Create a synthetic video job service. All jobs are fixtures; no real generation occurs. */
export function createVideoService(options = {}) {
  if (options !== null && typeof options !== 'object') throw new VideoInputError('Invalid video service options.');
  const now = typeof options.now === 'function' ? options.now : () => Date.now();
  const jobs = new Map(); // jobId -> job

  /** Side-effecting submission: creates exactly one job and returns its id. */
  function submitVideo(input = {}) {
    if (input === null || typeof input !== 'object' || Array.isArray(input))
      throw new VideoInputError('Invalid video submission input.');
    const prompt = requiredString(input.prompt, 'prompt');
    const duration = validateDuration(input.duration);
    const aspectRatio = validateAspectRatio(input.aspect_ratio ?? input.aspectRatio);
    const resolution = validateResolution(input.resolution);
    const startingImage = validateStartingImage(input.image_url ?? input.startingImage ?? input.starting_image);
    const id = createVideoJobId();
    const job = buildJob({ id, prompt, duration, aspectRatio, resolution, startingImage, now });
    jobs.set(id, job);
    return { jobId: id, job, progressToken: job.progressToken };
  }

  /** Read-only polling: returns the current job state. Never resubmits. */
  function pollVideo(jobId, { signal } = {}) {
    if (signal && typeof signal.aborted !== 'undefined') {
      // AbortSignal surface: honour cancellation without any side effect.
      if (signal.aborted) throw new Error('video: polling aborted');
    }
    const job = jobs.get(String(jobId));
    if (job === undefined) throw new VideoJobNotFoundError(String(jobId));
    return {
      status: job.status,
      jobId: job.id,
      result: job.result,
      error: job.error,
      progressToken: job.progressToken,
      errorToken: job.errorToken,
      updatedAt: job.updatedAt,
    };
  }

  /** Mark a job cancelled. Does not resubmit; retrying requires a new submission. */
  function cancelVideo(jobId) {
    const job = jobs.get(String(jobId));
    if (job === undefined) throw new VideoJobNotFoundError(String(jobId));
    if (isSettled(job.status)) return { jobId: job.id, status: job.status, progressToken: job.progressToken };
    const next = Object.freeze({ ...job, status: STATUS_CANCELLED, cancelled: true,
      updatedAt: now(), progressToken: newToken(now) });
    jobs.set(jobId, next);
    return { jobId: next.id, status: next.status, progressToken: next.progressToken };
  }

  /** Read-only snapshot of one job (gallery row). */
  function getVideo(jobId) {
    const job = jobs.get(String(jobId));
    if (job === undefined) throw new VideoJobNotFoundError(String(jobId));
    return {
      jobId: job.id, status: job.status, result: job.result, error: job.error,
      progressToken: job.progressToken, errorToken: job.errorToken,
      createdAt: job.createdAt, updatedAt: job.updatedAt,
      prompt: job.prompt, duration: job.duration, aspectRatio: job.aspectRatio,
      resolution: job.resolution, startingImage: job.startingImage,
    };
  }

  /** Gallery: all video jobs, newest first. Read-only. */
  function listVideos() {
    return [...jobs.values()]
      .slice()
      .sort((a, b) => b.updatedAt - a.updatedAt || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
      .map(job => ({
        jobId: job.id, status: job.status, result: job.result, error: job.error,
        progressToken: job.progressToken, errorToken: job.errorToken,
        createdAt: job.createdAt, updatedAt: job.updatedAt,
        prompt: job.prompt, duration: job.duration, aspectRatio: job.aspectRatio,
        resolution: job.resolution, startingImage: job.startingImage,
      }));
  }

  /** Synthetic fixture seam: drive a submitted/pending job to an outcome.
   * Tests only; never real generation. Throws VideoJobNotFoundError for unknown jobs.
   */
  function driveJob(jobId, outcome = {}) {
    const job = jobs.get(String(jobId));
    if (job === undefined) throw new VideoJobNotFoundError(String(jobId));
    if (outcome.status === undefined) throw new VideoInputError('driveJob requires an outcome status.');
    if (!STATUSES.includes(outcome.status)) throw new VideoInputError(`Unknown video job status: ${outcome.status}`);
    if (isSettled(job.status)) return getVideo(jobId);
    const next = transition(job, outcome, now);
    jobs.set(jobId, next);
    return getVideo(jobId);
  }

  return {
    VIDEO_TOOL, VIDEO_MODEL,
    submitVideo, pollVideo, cancelVideo, getVideo, listVideos, videoFileName, driveJob,
    STATUSES,
    size() { return jobs.size; },
  };
}

export default { createVideoService, VideoJobNotFoundError, VideoInputError, VIDEO_TOOL, VIDEO_MODEL,
  DEFAULT_POLL_INTERVAL_MS, DEFAULT_MAX_WAIT_MS, DURATION_RANGE, ASPECT_RATIOS, RESOLUTIONS,
  STATUSES, videoFileName, createVideoJobId };
export { STATUSES };
