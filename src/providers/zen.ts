/** OpenCode Zen minimal anonymous lane. Adapted from FishBottle7/opencode2dsh v0.3.14,
 * 1aa212063cf68b0ad6f3ed310bca4588cf06c008 (MIT, 2026 FishBottle7). See PROVENANCE.md.
 * No probes, account access, delegation, sidecar or network dispatcher changes. */
import { createHash } from 'node:crypto';
import { LlmAdapter, LlmError } from '@deepseek-ai/dsh-llm';
import type { GenerateOptions, StreamChunk } from '@deepseek-ai/dsh-llm';
import { proxiedFetch } from '../http.js';
import { deadlineSignal, withAbortSignal } from './common.js';
import {
  toChatMessages,
  toChatTools,
  streamChatCompletions,
} from '../translate/chat-completions.js';
import {
  toResponsesInput,
  toResponsesTools,
  streamResponses,
} from '../translate/responses.js';

const BASE = 'https://opencode.ai/inference/v1';
const STATIC = [
  'big-pickle',
  'mimo-v2.6-flash-free',
  'nemotron-3.5-lightning-free',
  'muse-spark-1.2-contributor-free',
  'muse-spark-1.3-contributor-free',
];
const sessions = new Map<string, string>();
function headers(
  messages: readonly { role: string; content: unknown }[] = [],
): Record<string, string> {
  const seed = JSON.stringify(
    messages.find((message) => message.role === 'user')?.content ??
      'majed-zen-catalog',
  );
  const digest = createHash('sha256')
    .update('ses\0' + seed)
    .digest('hex');
  let session = sessions.get(digest);
  if (!session) {
    let n = BigInt('0x' + digest.slice(12, 32)),
      tail = '';
    for (let i = 0; i < 14; i++) {
      tail =
        '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'[
          Number(n % 62n)
        ] + tail;
      n /= 62n;
    }
    session = `ses_${(~(BigInt(Date.now()) * 4096n + 1n) & 0xffffffffffffn).toString(16).padStart(12, '0')}${tail}`;
    if (sessions.size >= 1024) sessions.delete(sessions.keys().next().value!);
    sessions.set(digest, session);
  }
  return {
    authorization: 'Bearer public',
    'user-agent': `opencode/1.18.31 (${process.platform} ${process.arch}; node${process.versions.node})`,
    'x-opencode-client': 'cli',
    'x-opencode-session': session,
    'x-opencode-session-id': session,
    'x-session-affinity': session,
    'X-Session-Id': session,
    'x-opencode-project': 'global',
  };
}
/** Bounded bytes and deadline, including bodies; never expose upstream free text. */
async function text(response: Response, signal: AbortSignal): Promise<string> {
  if (!response.body) return '';
  const reader = response.body.getReader();
  let size = 0,
    result = '';
  const decoder = new TextDecoder();
  try {
    for (;;) {
      const next = await withAbortSignal(() => reader.read(), signal);
      if (next.done) return result + decoder.decode();
      size += next.value.byteLength;
      if (size > 2 * 1024 * 1024) throw new Error('Zen response too large');
      result += decoder.decode(next.value, { stream: true });
    }
  } finally {
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
export class ZenAdapter extends LlmAdapter {
  constructor(private readonly enabled: () => boolean = () => true) {
    super();
  }
  private models = [...STATIC];
  private metadata: Record<
    string,
    {
      cost?: { input?: number; output?: number };
      deprecated?: boolean;
      status?: string;
      lifecycle?: string;
      deprecated_at?: unknown;
      retirement_date?: unknown;
    }
  > = {};
  private checkedAt = 0;
  private reachable: boolean | null = null;
  private source = 'static';
  private lifecycle = new AbortController();
  dispose(): void {
    this.lifecycle.abort();
  }
  providerInfo(provider: string) {
    return { id: provider, name: 'OpenCode Zen' };
  }
  async listModels(provider: string, signal?: AbortSignal) {
    if (!this.enabled()) return [];
    if (Date.now() - this.checkedAt >= 5 * 60_000) {
      const budget = deadlineSignal(
        10_000,
        signal
          ? AbortSignal.any([signal, this.lifecycle.signal])
          : this.lifecycle.signal,
      );
      try {
        const response = await withAbortSignal(
          () =>
            proxiedFetch(`${BASE}/models`, {
              headers: headers(),
              signal: budget.signal,
            }),
          budget.signal,
        );
        const body = await text(response, budget.signal);
        if (!response.ok) throw new Error('Zen catalog unavailable');
        const data = JSON.parse(body) as { data?: { id?: unknown }[] };
        if (!Array.isArray(data.data)) throw new Error('Invalid Zen catalog');
        let metadata = this.metadata;
        try {
          const prices = await withAbortSignal(
            () =>
              proxiedFetch('https://models.dev/api.json', {
                signal: budget.signal,
              }),
            budget.signal,
          );
          const decoded = JSON.parse(await text(prices, budget.signal));
          if (prices.ok)
            this.metadata = metadata = {
              ...metadata,
              ...(decoded.opencode?.models ??
                decoded['opencode-zen']?.models ??
                {}),
            };
        } catch {
          budget.signal.throwIfAborted(); /* Reference name/static fallback when pricing cannot speak. */
        }
        // A metadata verdict (including paid/deprecated) outranks the reference name fallback.
        this.models = [
          ...new Set(
            data.data.flatMap((entry) => {
              if (
                typeof entry.id !== 'string' ||
                entry.id.length > 200 ||
                entry.id === 'jev-1.13-free'
              )
                return [];
              const price = Object.hasOwn(metadata, entry.id)
                ? metadata[entry.id]
                : undefined;
              const deprecated =
                price &&
                (price.deprecated === true ||
                  ['deprecated', 'retired', 'disabled'].includes(
                    String(price.status ?? price.lifecycle ?? '').toLowerCase(),
                  ) ||
                  price.deprecated_at != null ||
                  price.retirement_date != null);
              const free = price
                ? !deprecated &&
                  price.cost?.input === 0 &&
                  price.cost?.output === 0
                : entry.id.toLowerCase().includes('free') ||
                  STATIC.includes(entry.id);
              return free ? [entry.id] : [];
            }),
          ),
        ];
        this.reachable = true;
        this.source = 'gateway';
      } catch {
        signal?.throwIfAborted();
        this.lifecycle.signal.throwIfAborted();
        this.reachable = false;
        this.source = this.source === 'static' ? 'static' : 'cache';
      } finally {
        if (!signal?.aborted && !this.lifecycle.signal.aborted)
          this.checkedAt = Date.now();
        budget.release();
      }
    }
    signal?.throwIfAborted();
    this.lifecycle.signal.throwIfAborted();
    if (!this.enabled()) return [];
    return this.models.map((id) => ({
      provider,
      id,
      name: id,
      inputModalities: ['text'] as ['text'],
    }));
  }
  snapshot() {
    return {
      enabled: this.enabled(),
      reachable: this.reachable,
      modelCount: this.models.length,
      source: this.source,
    };
  }
  async status(signal?: AbortSignal) {
    await this.listModels('opencode-zen', signal);
    return this.snapshot();
  }
  async resolveModel(provider: string, model: string, signal?: AbortSignal) {
    if (
      !(await this.listModels(provider, signal)).some(
        (entry) => entry.id === model,
      )
    )
      throw new LlmError(
        'OpenCode Zen requires an available free model.',
        'INVALID_REQUEST',
      );
    return {
      provider,
      id: model,
      name: model,
      inputModalities: ['text'] as ['text'],
      context: { contextWindow: 262144 },
      defaultMaxTokens: 32768,
    };
  }
  async *stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    if (!this.enabled())
      throw new LlmError('OpenCode Zen is disabled.', 'INVALID_REQUEST');
    const budget = deadlineSignal(
      300_000,
      options.signal
        ? AbortSignal.any([options.signal, this.lifecycle.signal])
        : this.lifecycle.signal,
    );
    let response: Response | undefined;
    try {
      await this.resolveModel(options.provider, options.model, budget.signal);
      const responses = options.model.startsWith('muse-spark-');
      const gates = ['bash', 'read'].map((name) => ({
        type: 'function',
        function: {
          name,
          description:
            name === 'bash'
              ? 'Run a shell command in the project workspace.'
              : 'Read a file from the filesystem.',
          parameters: {
            type: 'object',
            properties:
              name === 'bash'
                ? {
                    command: { type: 'string' },
                    description: { type: 'string' },
                  }
                : {
                    filePath: { type: 'string' },
                    offset: { type: 'integer' },
                    limit: { type: 'integer' },
                  },
            required: [name === 'bash' ? 'command' : 'filePath'],
            additionalProperties: false,
          },
        },
      }));
      const supplied = responses
        ? toResponsesTools(options.tools ?? [])
        : toChatTools(options.tools ?? []);
      const tools = [
        ...supplied,
        ...gates
          .filter(
            (gate) =>
              !(options.tools ?? []).some(
                (tool) => tool.name === gate.function.name,
              ),
          )
          .map((gate) =>
            responses ? { type: 'function', ...gate.function } : gate,
          ),
      ];
      const body = responses
        ? {
            ...toResponsesInput(options.messages, options.system),
            tools,
            tool_choice: 'auto',
            max_output_tokens: options.maxTokens,
          }
        : {
            messages: toChatMessages(options.messages, options.system),
            tools,
            tool_choice: supplied.length ? 'auto' : 'none',
            max_tokens: options.maxTokens,
            stream_options: { include_usage: true },
          };
      response = await withAbortSignal(
        () =>
          proxiedFetch(
            `${BASE}/${responses ? 'responses' : 'chat/completions'}`,
            {
              method: 'POST',
              headers: {
                ...headers(options.messages),
                'content-type': 'application/json',
                accept: 'text/event-stream',
              },
              body: JSON.stringify({
                ...body,
                model: options.model,
                stream: true,
                temperature: options.temperature,
              }),
              signal: budget.signal,
            },
          ),
        budget.signal,
      );
      if (!response.ok) {
        const detail = await text(response, budget.signal);
        if (response.status === 429)
          throw new LlmError(
            'OpenCode Zen is rate limited. Please try again later.',
            'RATE_LIMIT',
          );
        if (
          /RegionError|region.*block|not available.*(country|region)/i.test(
            detail,
          )
        )
          throw new LlmError(
            'OpenCode Zen is blocked in your region.',
            'REGION_BLOCKED',
          );
        if (/FreeTierError|free tier/i.test(detail))
          throw new LlmError(
            'OpenCode Zen refused free-tier access from this client.',
            'FREE_TIER_RESTRICTED',
          );
        throw new LlmError(
          `OpenCode Zen request failed (HTTP ${response.status}).`,
          'SERVER',
        );
      }
      if (!response.body)
        throw new LlmError(
          'OpenCode Zen returned no response.',
          'EMPTY_RESPONSE',
        );
      // Translators hold the forwarding reader; cancel the owned upstream reader directly.
      const reader = response.body.getReader();
      const cancel = () => {
        void reader.cancel(budget.signal.reason).catch(() => {});
      };
      const stream = new ReadableStream<Uint8Array>({
        async pull(controller) {
          try {
            const next = await withAbortSignal(
              () => reader.read(),
              budget.signal,
            );
            if (next.done) controller.close();
            else controller.enqueue(next.value);
          } catch (error) {
            controller.error(error);
          }
        },
        cancel() {
          void reader.cancel().catch(() => {});
        },
      });
      budget.signal.addEventListener('abort', cancel, { once: true });
      try {
        yield* responses
          ? streamResponses(stream)
          : streamChatCompletions(stream);
      } finally {
        budget.signal.removeEventListener('abort', cancel);
        void reader.cancel().catch(() => {});
        reader.releaseLock();
      }
    } catch (error) {
      if (
        error instanceof LlmError &&
        [
          'RATE_LIMIT',
          'REGION_BLOCKED',
          'FREE_TIER_RESTRICTED',
          'INVALID_REQUEST',
        ].includes(error.code)
      )
        throw error;
      options.signal?.throwIfAborted();
      this.lifecycle.signal.throwIfAborted();
      throw new LlmError(
        'OpenCode Zen is unavailable or the request timed out. Please try again later.',
        'TRANSPORT',
      );
    } finally {
      budget.release();
      if (response?.body && !response.body.locked)
        void response.body.cancel().catch(() => {});
    }
  }
}
