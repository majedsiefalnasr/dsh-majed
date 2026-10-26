// Extracted pure/catalog helpers from reviewed compiled codex.js; see PROVENANCE.md.
import {createHash} from "node:crypto";
import {attributionHeaders,LlmError,ReasoningEffortId} from "../host-llm.js";
import {ToolCallId} from "../compat.js";
import {toResponsesTools} from "../translate/responses.js";
import {effortDisplayName,oauthEndpointError} from "./common.js";
const CODEX_FAST_SERVICE_TIER="priority", CODEX_FAST_SPEED_TIER="fast", DEFAULT_CODEX_INSTRUCTIONS="You are Codex, a coding agent based on GPT-5. Help the user with their software engineering tasks.";
export const CODEX_MODELS_URL = 'https://chatgpt.com/backend-api/codex/models';
/**
 * Client version sent on the /models catalog request. The backend gates the
 * visible model list by client version. Verified 2026-09-05: the same account
 * omitted GPT-6 Astra at 0.147.0 and listed it at stable CLI 0.153.4. This is
 * not an entitlement guarantee; the server remains authoritative.
 */
export const CODEX_CLIENT_VERSION = '0.153.4';
/** Validate an explicit catalog compatibility version before using it on the wire. */
export function codexClientVersion(value = CODEX_CLIENT_VERSION) {
    if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*)?$/.test(value)) {
        throw new Error('codexClientVersion must be a version such as 0.153.4');
    }
    return value;
}
/**
 * Whether a catalog entry advertises the fast tier. Mirrors codex-rs
 * `ModelPreset::supports_fast_mode`: a `service_tiers` id matching the fast
 * wire value, or the legacy `additional_speed_tiers` "fast" entry.
 */
function supportsFastTier(entry) {
    return (entry.service_tiers ?? []).some(tier => tier.id === CODEX_FAST_SERVICE_TIER)
        || (entry.additional_speed_tiers ?? []).includes(CODEX_FAST_SPEED_TIER);
}
/**
 * Fetch the live codex model catalog with the session's auth headers.
 * @param session - the stored session (used as-is; never refreshed here).
 * @param fetchFn - fetch implementation (injectable for tests).
 * @param signal - caller cancellation (pool-assembly timeout).
 * @param clientVersion - catalog compatibility version, not the plugin version.
 * @returns discovered models: hidden entries dropped, sorted by priority.
 */
export async function fetchCodexModels(session, fetchFn = globalThis.fetch, signal, clientVersion = CODEX_CLIENT_VERSION) {
    const version = codexClientVersion(clientVersion);
    const url = `${CODEX_MODELS_URL}?client_version=${encodeURIComponent(version)}`;
    const response = await fetchFn(url, {
        headers: {
            'authorization': `Bearer ${session.accessToken}`,
            'chatgpt-account-id': session.accountId,
            'originator': 'codex_cli_rs',
            'accept': 'application/json',
            ...attributionHeaders(),
        },
        ...signal === undefined ? {} : { signal },
    });
    if (!response.ok)
        throw await oauthEndpointError(response, 'codex models');
    const payload = await response.json();
    if (!Array.isArray(payload.models))
        throw new Error('codex models endpoint returned no models array');
    const discovered = [];
    for (const entry of payload.models) {
        if (typeof entry.slug !== 'string' || entry.slug.length === 0)
            continue;
        // codex-rs ModelVisibility: only "list" is picker-visible; hide/none are
        // dropped, and an absent or unknown value is included (in doubt, include).
        if (entry.visibility === 'hide' || entry.visibility === 'none')
            continue;
        // "ultra" is a Codex-client mode (max reasoning + automatic sub-agent
        // delegation), not a wire value: the Responses API rejects it with HTTP 400.
        const efforts = (entry.supported_reasoning_levels ?? [])
            .filter(level => typeof level.effort === 'string' && level.effort.length > 0 && level.effort !== 'ultra')
            .map(level => ({
            id: ReasoningEffortId(level.effort),
            name: effortDisplayName(level.effort),
            ...level.description === undefined ? {} : { description: level.description },
        }));
        const defaultEffort = typeof entry.default_reasoning_level === 'string'
            && entry.default_reasoning_level.length > 0
            && efforts.some(effort => effort.id === ReasoningEffortId(entry.default_reasoning_level))
            ? ReasoningEffortId(entry.default_reasoning_level)
            : undefined;
        const model = {
            id: entry.slug,
            name: typeof entry.display_name === 'string' && entry.display_name.length > 0
                ? entry.display_name
                : entry.slug,
            ...typeof entry.description === 'string' && entry.description.length > 0
                ? { description: entry.description }
                : {},
            ...typeof entry.context_window === 'number' && entry.context_window > 0
                ? { contextWindow: entry.context_window }
                : {},
            ...Number.isSafeInteger(entry.max_context_window) && entry.max_context_window > 0
                ? { maxContextWindow: entry.max_context_window }
                : {},
            ...typeof entry.priority === 'number' ? { priority: entry.priority } : {},
            ...efforts.length > 0
                ? { reasoning: { efforts, ...defaultEffort === undefined ? {} : { defaultEffort } } }
                : {},
            ...supportsFastTier(entry) ? { fastTier: true } : {},
        };
        discovered.push(model);
    }
    discovered.sort((a, b) => (a.priority ?? Number.MAX_SAFE_INTEGER) - (b.priority ?? Number.MAX_SAFE_INTEGER));
    // An empty catalog from a 200 response means the backend gated us out (e.g.
    // client_version too old): surface it as a discovery failure so the adapter
    // falls back to the static catalog instead of vanishing from the picker.
    if (discovered.length === 0) {
        throw new Error(`codex models endpoint returned an empty catalog (client_version ${version})`);
    }
    return discovered;
}
const CODEX_CALL_ID_MAX_LENGTH = 64;
const CODEX_CALL_ID_PREFIX = 'call_';
/**
 * Bound tool-call ids at the Codex wire boundary without changing the shared
 * Responses translation used by Grok. Short ids stay verbatim. Oversized ids
 * become deterministic hashes, and every id already present in this request
 * is reserved first so a generated id cannot collide with a legitimate short
 * one (or another oversized id).
 */
function normalizeCodexCallIds(input) {
    const mapping = new Map();
    const used = new Set();
    const callId = (item) => (item.type === 'function_call' || item.type === 'function_call_output') && typeof item.call_id === 'string'
        ? item.call_id
        : undefined;
    for (const item of input) {
        const id = callId(item);
        if (id !== undefined && id.length <= CODEX_CALL_ID_MAX_LENGTH) {
            mapping.set(id, id);
            used.add(id);
        }
    }
    for (const item of input) {
        const id = callId(item);
        if (id === undefined || mapping.has(id))
            continue;
        let attempt = 0;
        let normalized;
        do {
            const hash = createHash('sha256');
            if (attempt > 0)
                hash.update(String(attempt)).update('\0');
            const digest = hash.update(id).digest('hex');
            normalized = `${CODEX_CALL_ID_PREFIX}${digest.slice(0, CODEX_CALL_ID_MAX_LENGTH - CODEX_CALL_ID_PREFIX.length)}`;
            attempt += 1;
        } while (used.has(normalized));
        mapping.set(id, normalized);
        used.add(normalized);
    }
    return input.map((item) => {
        const id = callId(item);
        if (id === undefined)
            return item;
        const normalized = mapping.get(id) ?? id;
        return normalized === id ? item : { ...item, call_id: normalized };
    });
}
/** Text marking a repaired tool output as an unknown outcome; the model must verify before retrying. */
export const CODEX_UNKNOWN_TOOL_OUTCOME = 'The tool call has no recorded result. Its outcome is unknown; verify external state before retrying any operation that may have side effects.';
/**
 * Reconcile one Responses input's tool-call pairing after id normalization:
 * every `function_call` gets an output and every `function_call_output`
 * matches a call. Missing outputs become error-style outputs whose text marks
 * the outcome unknown; orphan outputs are dropped. Duplicate calls of one id
 * receive exactly one repair output. The request is local repair only: the
 * durable history stays authoritative and unchanged.
 * @param input - normalized Responses input items.
 * @returns the same array when already balanced, otherwise a repaired array.
 */
export function reconcileResponsesToolCalls(input) {
    const calls = new Set();
    const outputs = new Set();
    for (const item of input) {
        if (item.type === 'function_call' && typeof item.call_id === 'string')
            calls.add(item.call_id);
        else if (item.type === 'function_call_output' && typeof item.call_id === 'string')
            outputs.add(item.call_id);
    }
    const missing = new Set([...calls].filter(callId => !outputs.has(callId)));
    if (missing.size === 0 && [...outputs].every(callId => calls.has(callId)))
        return input;
    const balanced = [];
    for (const item of input) {
        if (item.type === 'function_call_output' && (typeof item.call_id !== 'string' || !calls.has(item.call_id))) {
            continue;
        }
        balanced.push(item);
        if (item.type === 'function_call' && typeof item.call_id === 'string' && missing.delete(item.call_id)) {
            balanced.push({ type: 'function_call_output', call_id: item.call_id, output: CODEX_UNKNOWN_TOOL_OUTCOME });
        }
    }
    return balanced;
}
/**
 * The `reasoning.effort` wire value for a selected effort. Codex's "ultra" is
 * a client-side selection (max reasoning plus proactive sub-agent delegation)
 * that the Codex CLI itself lowers to `max` at the Responses API boundary;
 * the backend answers HTTP 400 to a literal `ultra`. Discovery no longer
 * lists it, but an effort saved before that change may still arrive here.
 */
export function codexWireEffort(effort) {
    return effort === 'ultra' ? 'max' : effort;
}
/**
 * The Responses request body for one generation. A fast-tier request (the
 * composer Speed toggle, the codex CLI's fast mode) carries
 * `service_tier: priority`; the tier field is omitted entirely otherwise,
 * matching the CLI (it never sends an explicit standard tier).
 */
export function codexRequestBody(options, resolved, fast) {
    return {
        model: options.model,
        instructions: resolved.instructions ?? DEFAULT_CODEX_INSTRUCTIONS,
        input: reconcileResponsesToolCalls(normalizeCodexCallIds(resolved.input)),
        // Omit tool controls for tool-less requests, matching the other adapters.
        // This is request-shape consistency, not a claim that Codex rejects the
        // controls when no tools are supplied.
        ...options.tools !== undefined && options.tools.length > 0
            ? { tools: toResponsesTools(options.tools, { strict: false }), tool_choice: 'auto', parallel_tool_calls: true }
            : {},
        ...options.reasoningEffort !== undefined
            ? { reasoning: { effort: codexWireEffort(String(options.reasoningEffort)), summary: 'auto' } }
            : {},
        store: false,
        stream: true,
        include: ['reasoning.encrypted_content'],
        ...options.sessionId !== undefined ? { prompt_cache_key: String(options.sessionId) } : {},
        ...fast ? { service_tier: CODEX_FAST_SERVICE_TIER } : {},
    };
}
/** Adapt the current harness's first-class tool messages at the Codex boundary. */
export function projectCodexMessages(messages) {
    return messages.map((message) => {
        if (String(message.role) !== 'tool')
            return message;
        const current = message;
        const callId = current.toolCallId
            ?? (current.source?.kind === 'tool' ? String(current.source.callId) : undefined);
        if (callId === undefined)
            throw new LlmError('Codex tool result has no call id', 'INVALID_REQUEST');
        return {
            ...message.id === undefined ? {} : { id: message.id },
            role: 'user',
            source: { kind: 'tool', callId: ToolCallId(callId) },
            content: [{
                    type: 'tool-result',
                    toolCallId: ToolCallId(callId),
                    content: [...message.content],
                    ...current.isError === undefined ? {} : { isError: current.isError },
                }],
        };
    });
}
