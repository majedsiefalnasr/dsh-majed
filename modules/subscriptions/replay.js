// Account/model-bound opaque replay.
//
// Replay state is bound to a SHA-256 of [provider, account, model] so a
// concrete member's opaque continuation is never replayed through another
// account/model. Mismatched keys discard opaque state while normalized
// history remains; older unwrapped histories retain direct-route behavior.

import { createHash } from 'node:crypto';

const REPLAY_KIND = 'subscriptions-account-replay';
const REPLAY_VERSION = 1;

function replayKey(provider, account, model) {
  return createHash('sha256').update(JSON.stringify([provider, account, model])).digest('hex');
}

export { REPLAY_KIND, bindReplayMessages };

/** Wrap assistant messages whose source carries replay state bound to this account/model. */
function bindReplayMessages(options, account, model = options.model) {
  const key = replayKey(options.provider, account, model);
  const messages = (options.messages ?? []).map(message => {
    if (message.role !== 'assistant' || message.source == null || message.source.replayState == null)
      return message;
    const source = message.source;
    const replay = source.replayState;
    if (replay === null || typeof replay !== 'object' || !('response' in replay)) return message;
    const response = replay.response;
    if (response !== null && typeof response === 'object' && 'kind' in response && response.kind === REPLAY_KIND) {
      if (response.version === REPLAY_VERSION && 'key' in response && response.key === key && 'state' in response) {
        return { ...message, source: { ...source, provider: options.provider, model,
          replayState: { ...replay, response: response.state } } };
      }
      // Bound to a different account/model or unknown version: discard opaque
      // state, keep the normalized history.
      const { replayState: _discarded, ...withoutReplay } = source;
      return { ...message, source: withoutReplay };
    }
    // Unwrapped older history for this same provider/model keeps direct behavior.
    if (source.provider === options.provider && source.model === model) return message;
    const { replayState: _discarded2, ...withoutReplay2 } = source;
    return { ...message, source: withoutReplay2 };
  });
  return { ...options, messages };
}

/**
 * Stream an account through `adapter.streamAccount`, binding opaque replay to
 * [provider, account, model] and stamping the finish chunk with replay state
 * so the next turn can resume this exact member. Caller abort and iterator
 * return are honored.
 */
export async function* streamAccountWithReplay(adapter, options, account, model = options.model) {
  const bound = bindReplayMessages(options, account, model);
  const key = replayKey(options.provider, account, model);
  let emittedFirst = false;
  try {
    for await (const chunk of adapter.streamAccount({ ...bound, model }, account)) {
      emittedFirst = true;
      if (chunk.type === 'finish' && chunk.replayState !== undefined) {
        yield { ...chunk, replayState: { ...chunk.replayState, response: {
          kind: REPLAY_KIND, version: REPLAY_VERSION, key, state: chunk.replayState.response,
        } } };
      } else {
        yield chunk;
      }
    }
  } finally {
    // Close the underlying iterator if the caller walks away early.
    if (adapter.streamAccountReturn) await adapter.streamAccountReturn();
  }
}
