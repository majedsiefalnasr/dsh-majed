// Image generation and editing preservation.
//
// Image generation (text-to-image) and image editing (image-to-image with
// ordered, complete edit references) are asynchronous: submission starts exactly
// one synthetic job and returns a job id; polling reads the job's status until it
// settles. Submission and polling are deliberately separate so recovery or
// cancellation never causes a duplicate side-effecting submission. Chat retry
// rules are not generalized to async image.
//
// Jobs are bound to [provider, account, model]. Candidates are scheduled in
// order (same-provider accounts independently); a logged-out account yields to
// the next candidate (cross-provider fallback) only on a definitive
// auth/quota/entitlement rejection. Ambiguous timeout/transport/5xx errors never
// resubmit a potentially completed image. Edit references must be complete and
// ordered: an edit-reference failure cannot silently become text-to-image
// generation.
//
// No real image generation or capacity consumption is performed: every job is a
// synthetic fixture driven by the caller.

export const IMAGE_TOOL = 'image_generate';
export const IMAGE_EDIT_TOOL = 'image_edit';
export const IMAGE_MODEL = 'grok-imagine-1.5';
export const IMAGE_MIME = 'image/png';
export const DEFAULT_POLL_INTERVAL_MS = 3_000;
export const DEFAULT_MAX_WAIT_MS = 10 * 60_000;
export const SIZES = Object.freeze(['1024x1024', '1792x1024', '1024x1792']);
export const MODES = Object.freeze(['generate', 'edit']);

const STATUS_SUBMITTED = 'submitted';
const STATUS_PENDING = 'pending';
const STATUS_DONE = 'done';
const STATUS_FAILED = 'failed';
const STATUS_EXPIRED = 'expired';
const STATUS_CANCELLED = 'cancelled';
const STATUS_UNKNOWN = 'unknown';
const STATUSES = Object.freeze([STATUS_SUBMITTED, STATUS_PENDING, STATUS_DONE, STATUS_FAILED, STATUS_EXPIRED, STATUS_CANCELLED, STATUS_UNKNOWN]);

const IMAGE_URL_OR_DATA_URL = /^(?:https?:\/\/)|\/?data:image\/(?:jpeg|png|webp|gif);base64,/;
const SIZE_RE = /^\d+x\d+$/;

export class ImageInputError extends Error {
  constructor(message) { super(message); this.name = 'ImageInputError'; }
}

export class ImageJobNotFoundError extends Error {
  constructor(jobId) {
    super(`image: unknown job ${jobId}`);
    this.name = 'ImageJobNotFoundError';
    this.jobId = jobId;
  }
}

// ---------------------------------------------------------------------------
// Error classification for the preserved image fallback contract.
// ---------------------------------------------------------------------------

// Definitive rejections: may follow the fallback contract (try next candidate).
const DEFINITIVE_CODES = new Set(['AUTH', 'INVALID_CREDENTIAL', 'MISSING_CREDENTIAL', 'QUOTA_EXCEEDED', 'RATE_LIMIT', 'ENTITLEMENT']);
// Ambiguous transport/timeout/5xx: never resubmit a potentially completed image.
const AMBIGUOUS_CODES = new Set(['TIMEOUT', 'TRANSPORT', 'SERVER', 'EMPTY_RESPONSE', 'HTTP_402', 'HTTP_404']);
// Non-retryable: rethrow, no fallback.
const TERMINAL_CODES = new Set(['CONTEXT_WINDOW_EXCEEDED', 'ABORTED']);

export function classifyImageError(error) {
  if (error == null) return { action: 'noresubmit', reason: 'TRANSPORT', code: 'TRANSPORT' };
  const code = error && typeof error.code === 'string' ? error.code : undefined;
  if (code !== undefined) {
    if (TERMINAL_CODES.has(code)) return { action: 'throw', reason: code, code };
    if (DEFINITIVE_CODES.has(code)) return { action: 'fallback', reason: code, code };
    if (AMBIGUOUS_CODES.has(code)) return { action: 'noresubmit', reason: code, code };
    return { action: 'throw', reason: code, code };
  }
  if (error instanceof Error) {
    const message = String(error.message || '');
    if (/rate.?limit|quota/i.test(message)) return { action: 'fallback', reason: 'RATE_LIMIT', code: 'RATE_LIMIT' };
    if (/unauthorized|401|invalid.?credential|missing.?credential|entitlement/i.test(message))
      return { action: 'fallback', reason: 'AUTH', code: 'AUTH' };
    if (/timeout|server/i.test(message)) return { action: 'noresubmit', reason: 'SERVER', code: 'SERVER' };
    return { action: 'noresubmit', reason: 'TRANSPORT', code: 'TRANSPORT' };
  }
  return { action: 'noresubmit', reason: 'TRANSPORT', code: 'TRANSPORT' };
}

function requiredString(value, name) {
  if (typeof value !== 'string' || !value) throw new ImageInputError(`Invalid ${name}.`);
  return value;
}

function validateSize(size) {
  if (typeof size !== 'string' || !SIZE_RE.test(size) || !SIZES.includes(size)) {
    throw new ImageInputError(`size must be one of ${SIZES.join(', ')}`);
  }
  return size;
}

/** Validate ordered, complete edit references. Failure throws: never silently
 * falls back to text-to-image generation. */
function validateEditReferences(references) {
  if (references === undefined) throw new ImageInputError('image editing requires at least one ordered edit reference.');
  if (!Array.isArray(references) || references.length === 0) {
    throw new ImageInputError('image editing requires a non-empty ordered list of edit references.');
  }
  const out = [];
  for (const ref of references) {
    if (typeof ref !== 'string' || !ref) throw new ImageInputError('each edit reference must be a non-empty string.');
    if (!IMAGE_URL_OR_DATA_URL.test(ref)) {
      throw new ImageInputError('each edit reference must be a public image URL or a JPEG/PNG/WebP/GIF data URL.');
    }
    out.push(ref);
  }
  return Object.freeze(out);
}

function nextId(now) { return `image-${now()}-${Math.random().toString(36).slice(2, 10)}`; }
function newToken(now) { return `${now()}-${Math.random().toString(36).slice(2, 10)}`; }

export function createImageJobId() {
  return `image-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function imageFileName(jobId) {
  requiredString(jobId, 'jobId');
  return `${jobId}.png`;
}

function isSettled(status) {
  return status === STATUS_DONE || status === STATUS_FAILED || status === STATUS_EXPIRED || status === STATUS_CANCELLED;
}

function buildJob({ id, provider, account, model, mode, prompt, references, size, now }) {
  const created = now();
  const progressToken = newToken(now);
  return Object.freeze({
    id, status: STATUS_SUBMITTED, requestId: id, provider, account, model, mode, prompt,
    ...(references !== undefined ? { references } : {}),
    ...(size !== undefined ? { size } : {}),
    result: undefined, error: undefined, progressToken, errorToken: undefined,
    createdAt: created, updatedAt: created, cancelled: false,
  });
}

function transition(job, outcome, now) {
  const updated = now();
  const base = { ...job, updatedAt: updated, cancelled: outcome.cancelled === true };
  if (outcome.status === STATUS_DONE) {
    const result = { url: `https://synthetic.test/images/${job.id}.png`, fileName: imageFileName(job.id), mime: IMAGE_MIME, size: Math.floor(Math.random() * 200_000) + 50_000 };
    if (typeof outcome.duration === 'number') result.duration = outcome.duration;
    return Object.freeze({ ...base, status: STATUS_DONE, result, progressToken: newToken(now), errorToken: undefined });
  }
  if (outcome.status === STATUS_FAILED || outcome.status === STATUS_EXPIRED) {
    return Object.freeze({ ...base, status: outcome.status, error: outcome.error || { message: `image ${outcome.status}`, code: outcome.status }, progressToken: newToken(now), errorToken: newToken(now) });
  }
  if (outcome.status === STATUS_CANCELLED) {
    return Object.freeze({ ...base, status: STATUS_CANCELLED, progressToken: newToken(now), errorToken: undefined });
  }
  return Object.freeze({ ...base, status: outcome.status, progressToken: newToken(now) });
}

// ---------------------------------------------------------------------------
// Image service: synthetic fixtures only.
// ---------------------------------------------------------------------------

/** Create a synthetic image service. All jobs are fixtures; no real generation
 * occurs. Options: { now, candidates: [{provider, account, model}],
 * performSubmit(candidate, input) }.
 *
 * `candidates` establish same-provider account scheduling: each account is an
 * independent member scheduled in order. Candidates may span providers so a
 * logged-out account yields to the next candidate (cross-provider fallback) on
 * a definitive rejection only. `performSubmit` is the synthetic provider call
 * seam: it returns a job or throws a classified error.
 */
export function createImageService(options = {}) {
  if (options !== null && typeof options !== 'object') throw new ImageInputError('Invalid image service options.');
  const now = typeof options.now === 'function' ? options.now : () => Date.now();
  const candidates = Array.isArray(options.candidates)
    ? options.candidates.map(c => ({
      provider: requiredString(c.provider, 'candidate provider'),
      account: requiredString(c.account, 'candidate account'),
      model: requiredString(c.model, 'candidate model'),
    }))
    : [];
  const perform = typeof options.performSubmit === 'function' ? options.performSubmit : undefined;
  const jobs = new Map(); // jobId -> job

  function applicableCandidates(provider, model, account) {
    // Match by model so same-provider accounts schedule independently and a
    // logged-out account can yield to a different provider (cross-provider
    // fallback) later in the ordered candidate list.
    return candidates.filter(c => c.model === model && (account === undefined || c.account === account));
  }

  function buildDefaultJob(candidate, input, mode) {
    const id = createImageJobId();
    return buildJob({ id, provider: candidate.provider, account: candidate.account, model: candidate.model, mode, prompt: input.prompt, references: input.references, size: input.size, now });
  }

  /** Side-effecting submission: creates exactly one job and returns its id. */
  function submitImage(input = {}) {
    if (input === null || typeof input !== 'object' || Array.isArray(input))
      throw new ImageInputError('Invalid image submission input.');
    const provider = requiredString(input.provider, 'provider');
    const model = requiredString(input.model, 'model');
    const mode = input.mode === undefined ? 'generate' : String(input.mode);
    if (!MODES.includes(mode)) throw new ImageInputError(`mode must be one of ${MODES.join(', ')}`);
    const prompt = requiredString(input.prompt, 'prompt');
    const size = input.size === undefined ? undefined : validateSize(input.size);
    const account = input.account === undefined ? undefined : requiredString(input.account, 'account');
    let references;
    if (mode === 'edit') {
      references = validateEditReferences(input.references);
    } else if (input.references !== undefined) {
      throw new ImageInputError('references are only valid for image editing.');
    }

    const applicable = applicableCandidates(provider, model, account);
    let candidatesToTry;
    if (applicable.length > 0) {
      candidatesToTry = applicable;
    } else if (candidates.length === 0) {
      // No candidates configured: derive a single candidate from the request.
      candidatesToTry = [{ provider, account: account === undefined ? undefined : account, model }];
    } else {
      throw new ImageInputError(`No image candidate for ${provider}/${model}${account !== undefined ? `/${account}` : ''}`);
    }

    let lastError;
    for (const candidate of candidatesToTry) {
      try {
        const job = perform === undefined ? buildDefaultJob(candidate, input, mode) : perform(candidate, input);
        if (!job || typeof job !== 'object' || typeof job.id !== 'string') throw new ImageInputError('submission did not return a job.');
        jobs.set(job.id, job);
        return { jobId: job.id, job, progressToken: job.progressToken };
      } catch (error) {
        const classification = classifyImageError(error);
        lastError = error;
        if (classification.action === 'throw') throw error;
        if (classification.action === 'noresubmit') throw error; // ambiguous: never resubmit a potentially completed image
        // definitive: fallback to the next candidate
      }
    }
    throw lastError;
  }

  /** Read-only polling: returns the current job state. Never resubmits. */
  function pollImage(jobId, { signal } = {}) {
    if (signal && typeof signal.aborted !== 'undefined') {
      if (signal.aborted) throw new Error('image: polling aborted');
    }
    const job = jobs.get(String(jobId));
    if (job === undefined) throw new ImageJobNotFoundError(String(jobId));
    return {
      status: job.status, jobId: job.id, result: job.result, error: job.error,
      progressToken: job.progressToken, errorToken: job.errorToken, updatedAt: job.updatedAt,
    };
  }

  /** Mark a job cancelled. Does not resubmit; retrying requires a new submission. */
  function cancelImage(jobId) {
    const job = jobs.get(String(jobId));
    if (job === undefined) throw new ImageJobNotFoundError(String(jobId));
    if (isSettled(job.status)) return { jobId: job.id, status: job.status, progressToken: job.progressToken };
    const next = Object.freeze({ ...job, status: STATUS_CANCELLED, cancelled: true, updatedAt: now(), progressToken: newToken(now) });
    jobs.set(jobId, next);
    return { jobId: next.id, status: next.status, progressToken: next.progressToken };
  }

  /** Read-only snapshot of one job (open). */
  function getImage(jobId) {
    const job = jobs.get(String(jobId));
    if (job === undefined) throw new ImageJobNotFoundError(String(jobId));
    return {
      jobId: job.id, status: job.status, result: job.result, error: job.error,
      progressToken: job.progressToken, errorToken: job.errorToken,
      createdAt: job.createdAt, updatedAt: job.updatedAt,
      provider: job.provider, account: job.account, model: job.model, mode: job.mode,
      prompt: job.prompt, references: job.references, size: job.size,
    };
  }

  /** Gallery: all image jobs, newest first. Read-only. */
  function listImages() {
    return [...jobs.values()]
      .slice()
      .sort((a, b) => b.updatedAt - a.updatedAt || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
      .map(job => ({
        jobId: job.id, status: job.status, result: job.result, error: job.error,
        progressToken: job.progressToken, errorToken: job.errorToken,
        createdAt: job.createdAt, updatedAt: job.updatedAt,
        provider: job.provider, account: job.account, model: job.model, mode: job.mode,
        prompt: job.prompt, references: job.references, size: job.size,
      }));
  }

  /** Synthetic fixture seam: drive a submitted/pending job to an outcome. */
  function driveImage(jobId, outcome = {}) {
    const job = jobs.get(String(jobId));
    if (job === undefined) throw new ImageJobNotFoundError(String(jobId));
    if (outcome.status === undefined) throw new ImageInputError('driveImage requires an outcome status.');
    if (!STATUSES.includes(outcome.status)) throw new ImageInputError(`Unknown image job status: ${outcome.status}`);
    if (isSettled(job.status)) return getImage(jobId);
    const next = transition(job, outcome, now);
    jobs.set(jobId, next);
    return getImage(jobId);
  }

  /** Convert a completed image result into an output attachment reference. */
  function imageAttachment(result, binding = {}) {
    if (!result || typeof result !== 'object' || result.fileName === undefined || result.url === undefined)
      throw new ImageInputError('Invalid image result.');
    const ref = {
      id: result.fileName, type: 'image',
      ...(result.url !== undefined ? { url: requiredString(result.url, 'image url') } : {}),
      ...(result.mime !== undefined ? { mime: requiredString(result.mime, 'image mime') } : {}),
      ...(result.size !== undefined ? { size: result.size } : {}),
    };
    if (binding.provider !== undefined) ref.provider = requiredString(binding.provider, 'attachment provider');
    if (binding.account !== undefined) ref.account = requiredString(binding.account, 'attachment account');
    if (binding.model !== undefined) ref.model = requiredString(binding.model, 'attachment model');
    ref.vision = true;
    ref.offloaded = true;
    return Object.freeze(ref);
  }

  return {
    IMAGE_TOOL, IMAGE_EDIT_TOOL, IMAGE_MODEL, IMAGE_MIME,
    DEFAULT_POLL_INTERVAL_MS, DEFAULT_MAX_WAIT_MS, SIZES, MODES, STATUSES,
    imageFileName, createImageJobId, ImageInputError, ImageJobNotFoundError,
    classifyImageError,
    submitImage, pollImage, cancelImage, getImage, listImages, driveImage, imageAttachment,
    size() { return jobs.size; },
  };
}

export default { createImageService, ImageInputError, ImageJobNotFoundError, IMAGE_TOOL, IMAGE_EDIT_TOOL, IMAGE_MODEL, IMAGE_MIME, DEFAULT_POLL_INTERVAL_MS, DEFAULT_MAX_WAIT_MS, SIZES, MODES, STATUSES, imageFileName, createImageJobId, classifyImageError };
export { STATUSES };
