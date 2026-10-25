// Provider wire translators for the integrated subscription adapters.
//
// Each translator converts a provider's raw stream/body shape into a shared
// normalized chunk stream so direct/pinned/pool/tier routes can be served by
// one account-aware adapter without duplicating providers, tools or RPCs.
// Normalized chunk:
//   { type: 'text', text }
//   { type: 'reasoning', text }
//   { type: 'tool', call: { id, name, args } }
//   { type: 'usage', ... }
//   { type: 'finish', reason: { kind: 'stop'|'error'|'length'|'abort', failure?, status?, requestId? } }

export const PROVIDER_IDS = Object.freeze(['codex', 'claude', 'grok', 'copilot', 'antigravity']);

const TEXT = 'text';
const REASONING = 'reasoning';
const TOOL = 'tool';
const USAGE = 'usage';
const FINISH = 'finish';

const finish = (reason) => ({ type: FINISH, reason });
const usage = (payload) => ({ type: USAGE, ...payload });

/** A normalized terminal error finish chunk. */
export const errorFinish = (message, code, { status, requestId, cause } = {}) => finish({
  kind: 'error',
  failure: { message, code, status, requestId, cause },
});

/** Common stream contract every translator must satisfy. */
export function isTranslator(t) {
  return t && typeof t.parseLine === 'function' && typeof t.classifyError === 'function';
}

// ---------------------------------------------------------------------------
// Responses wire (Codex / Grok)
// ---------------------------------------------------------------------------

export function responsesTranslator() {
  return {
    provider: 'responses',
    /** Parse one raw SSE `data:` line or parsed JSON object into normalized chunks. */
    *parseLine(line) {
      const raw = typeof line === 'string' ? parseSseData(line) : line;
      if (raw === undefined) return;
      if (raw.type === undefined && raw.choices !== undefined) {
        // Fall through to chat-completions shape handling below.
        yield* parseChatChoices(raw);
        return;
      }
      switch (raw.type) {
        case 'response.output_text.delta':
          yield { type: TEXT, text: raw.delta ?? '' };
          break;
        case 'response.output_text.done':
          yield { type: TEXT, text: raw.text ?? '' };
          break;
        case 'response.reasoning.delta':
          yield { type: REASONING, text: raw.delta ?? '' };
          break;
        case 'response.reasoning.done':
          yield { type: REASONING, text: raw.text ?? '' };
          break;
        case 'response.tool_call.delta':
          yield { type: TOOL, call: raw.call };
          break;
        case 'response.tool_call.done':
          yield { type: TOOL, call: raw.call };
          break;
        case 'usage':
          yield usage(raw);
          break;
        case 'finish':
          yield finish(normalizeFinishReason(raw.reason));
          break;
        case 'error':
          yield errorFinish(raw.message, raw.code || 'TRANSPORT', raw);
          break;
        default:
          // Unknown Responses frames are ignored, never synthesized.
          break;
      }
    },
    classifyError(error) {
      return classifyLlmError(error, 'responses');
    },
  };
}

// ---------------------------------------------------------------------------
// chat-completions wire (Copilot)
// ---------------------------------------------------------------------------

export function chatCompletionsTranslator() {
  return {
    provider: 'chat-completions',
    *parseLine(line) {
      const raw = typeof line === 'string' ? parseSseData(line) : line;
      if (raw === undefined) return;
      if (raw.choices !== undefined) {
        yield* parseChatChoices(raw);
        return;
      }
      switch (raw.type) {
        case 'usage':
          yield usage(raw);
          break;
        case 'finish':
          yield finish(normalizeFinishReason(raw.reason));
          break;
        case 'error':
          yield errorFinish(raw.message, raw.code || 'TRANSPORT', raw);
          break;
        default:
          break;
      }
    },
    classifyError(error) {
      return classifyLlmError(error, 'chat-completions');
    },
  };
}

function* parseChatChoices(raw) {
  const choices = Array.isArray(raw.choices) ? raw.choices : [];
  for (const choice of choices) {
    const delta = choice && choice.delta ? choice.delta : {};
    if (typeof delta.content === 'string' && delta.content.length > 0)
      yield { type: TEXT, text: delta.content };
    if (Array.isArray(delta.tool_calls)) {
      for (const call of delta.tool_calls) yield { type: TOOL, call: normalizeToolCall(call) };
    }
    if (choice.finish_reason !== undefined) yield finish(normalizeFinishReason(choice.finish_reason));
  }
  if (raw.usage !== undefined) yield usage(raw.usage);
}

function normalizeToolCall(call) {
  return {
    id: typeof call.id === 'string' ? call.id : undefined,
    name: typeof call.function?.name === 'string' ? call.function.name : call.name,
    args: call.function?.arguments !== undefined ? call.function.arguments : call.args,
  };
}

// ---------------------------------------------------------------------------
// Anthropic wire (Claude)
// ---------------------------------------------------------------------------

export function anthropicTranslator() {
  return {
    provider: 'anthropic',
    *parseLine(line) {
      const raw = typeof line === 'string' ? parseSseData(line) : line;
      if (raw === undefined) return;
      switch (raw.type) {
        case 'content_block_delta': {
          const delta = raw.delta || {};
          if (delta.type === 'text_delta' && typeof delta.text === 'string')
            yield { type: TEXT, text: delta.text };
          else if (delta.type === 'thinking_delta' && typeof delta.thinking === 'string')
            yield { type: REASONING, text: delta.thinking };
          break;
        }
        case 'content_block_start': {
          const block = raw.content_block || {};
          if (block.type === 'tool_use')
            yield { type: TOOL, call: { id: block.id, name: block.name, args: block.input } };
          break;
        }
        case 'message_stop':
          yield finish({ kind: 'stop' });
          break;
        case 'usage':
          yield usage(raw);
          break;
        case 'error':
          yield errorFinish(raw.message, raw.code || 'SERVER', raw);
          break;
        default:
          break;
      }
    },
    classifyError(error) {
      return classifyLlmError(error, 'anthropic');
    },
  };
}

// ---------------------------------------------------------------------------
// Antigravity v1internal wire
// ---------------------------------------------------------------------------

export function antigravityTranslator() {
  return {
    provider: 'antigravity',
    *parseLine(line) {
      const raw = typeof line === 'string' ? parseSseData(line) : line;
      if (raw === undefined) return;
      switch (raw.type) {
        case 'text_delta':
          yield { type: TEXT, text: raw.text ?? '' };
          break;
        case 'thought_delta':
          yield { type: REASONING, text: raw.thought ?? '' };
          break;
        case 'tool_call_delta':
          yield { type: TOOL, call: raw.call };
          break;
        case 'usage':
          yield usage(raw);
          break;
        case 'finish':
          yield finish(normalizeFinishReason(raw.reason));
          break;
        case 'error':
          yield errorFinish(raw.message, raw.code || 'TRANSPORT', raw);
          break;
        default:
          break;
      }
    },
    classifyError(error) {
      return classifyLlmError(error, 'antigravity');
    },
  };
}

// ---------------------------------------------------------------------------
// Copilot endpoint selection
// ---------------------------------------------------------------------------

// Endpoint wire Copilot chooses between: 'chat-completions' | 'responses'.
// Selection depends on endpoint support, tool presence and explicit effort.
export function copilotEndpoint({ supportsResponses = true, tools = false, explicitEffort = undefined } = {}) {
  // Responses is preferred when supported; explicit effort or no tools can
  // force chat-completions where the Responses endpoint does not carry them.
  if (!supportsResponses) return 'chat-completions';
  if (tools && explicitEffort === undefined) return 'chat-completions';
  return 'responses';
}

// ---------------------------------------------------------------------------
// Antigravity tool schema conversion (ref / union normalization)
// ---------------------------------------------------------------------------

/** Normalize one input schema into Antigravity's ref/union form. */
export function antigravityToolSchema(schema) {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema))
    throw new Error('Antigravity tool schema must be an object.');
  const { type, properties, required = [], additionalProperties } = schema;
  if (type !== 'object') throw new Error('Antigravity tool schema type must be object.');
  const out = { type: 'object', properties: {}, required: [...required] };
  for (const [name, prop] of Object.entries(properties || {})) {
    out.properties[name] = normalizeJsonSchemaProp(prop);
  }
  if (additionalProperties !== undefined) out.additionalProperties = additionalProperties;
  return out;
}

function normalizeJsonSchemaProp(prop) {
  if (!prop || typeof prop !== 'object') return { type: 'string' };
  if (Array.isArray(prop)) {
    // union → ref/union normalization
    return { anyOf: prop.map(normalizeJsonSchemaProp) };
  }
  const { type, enum: values, anyOf, oneOf, ...rest } = prop;
  const out = {};
  if (type !== undefined) out.type = type;
  if (values !== undefined) out.enum = [...values];
  if (anyOf !== undefined) out.anyOf = anyOf.map(normalizeJsonSchemaProp);
  if (oneOf !== undefined) out.oneOf = oneOf.map(normalizeJsonSchemaProp);
  for (const [key, value] of Object.entries(rest)) out[key] = value;
  return out;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function parseSseData(line) {
  if (line === undefined || line === null) return undefined;
  const text = String(line).trim();
  if (text === '' || text === ':') return undefined;
  if (text.startsWith('data:')) {
    const payload = text.slice(5).trimStart();
    if (payload === '' || payload === '[DONE]') return undefined;
    try { return JSON.parse(payload); } catch { return undefined; }
  }
  try { return JSON.parse(text); } catch { return undefined; }
}

const FINISH_KINDS = new Set(['stop', 'error', 'length', 'abort']);

function normalizeFinishReason(reason) {
  if (reason === undefined || reason === null) return { kind: 'stop' };
  if (typeof reason === 'string') return { kind: FINISH_KINDS.has(reason) ? reason : 'stop' };
  if (typeof reason === 'object') {
    const kind = FINISH_KINDS.has(reason.kind) ? reason.kind : 'stop';
    return { kind, ...(reason.failure !== undefined ? { failure: reason.failure } : {}),
      ...(reason.status !== undefined ? { status: reason.status } : {}),
      ...(reason.requestId !== undefined ? { requestId: reason.requestId } : {}) };
  }
  return { kind: 'stop' };
}

const RETRYABLE_CODES = new Set(['RATE_LIMIT', 'QUOTA_EXCEEDED', 'AUTH', 'INVALID_CREDENTIAL',
  'MISSING_CREDENTIAL', 'SERVER', 'TIMEOUT', 'EMPTY_RESPONSE', 'TRANSPORT', 'HTTP_402', 'HTTP_404']);
const THROW_CODES = new Set(['CONTEXT_WINDOW_EXCEEDED', 'ABORTED']);

function classifyLlmError(error, provider) {
  if (error == null) return { action: 'throw', reason: 'TRANSPORT', code: 'TRANSPORT' };
  // Duck-typed LlmError: any object with a string `code` is treated as one.
  const code = error && typeof error.code === 'string' ? error.code : undefined;
  if (code !== undefined) {
    const retryAfterMs = error.providerRetryAfterMs === undefined ? undefined : error.providerRetryAfterMs;
    if (THROW_CODES.has(code)) return { action: 'throw', reason: code, code, cooldownMs: undefined, scope: undefined };
    if (RETRYABLE_CODES.has(code)) {
      return { action: 'switch', reason: code, code,
        cooldownMs: retryAfterMs === undefined ? undefined : retryAfterMs,
        scope: (code === 'RATE_LIMIT' || code === 'QUOTA_EXCEEDED')
          ? (provider === 'claude' || provider === 'antigravity' ? 'member' : 'account')
          : 'member' };
    }
    return { action: 'throw', reason: code, code };
  }
  if (error instanceof Error) {
    const message = error.message || '';
    if (/rate.?limit|quota/i.test(message)) return { action: 'switch', reason: 'RATE_LIMIT', code: 'RATE_LIMIT' };
    if (/unauthorized|401|invalid.?credential|missing.?credential/i.test(message))
      return { action: 'switch', reason: 'AUTH', code: 'AUTH', scope: 'account' };
    if (/timeout|server/i.test(message)) return { action: 'switch', reason: 'SERVER', code: 'SERVER' };
    return { action: 'throw', reason: 'TRANSPORT', code: 'TRANSPORT' };
  }
  return { action: 'throw', reason: 'TRANSPORT', code: 'TRANSPORT' };
}

// Minimal error shape shared across this module (no @deepseek-ai/dsh-llm dependency).
export class LlmErrorLike extends Error {
  constructor(message, code, { cause, status, requestId, providerRetryAfterMs } = {}) {
    super(message);
    this.name = 'LlmError';
    this.code = code;
    this.cause = cause;
    this.status = status;
    this.requestId = requestId;
    this.providerRetryAfterMs = providerRetryAfterMs;
    if (Error.captureStackTrace) Error.captureStackTrace(this, LlmErrorLike);
  }
}
