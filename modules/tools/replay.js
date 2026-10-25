// Attachment history/replay isolation across account/model changes.
//
// Replay state is bound to [provider, account, model]. A reference captured
// under one account/model is never replayed as compatible private state under
// another. Normalized attachment data is kept; incompatible opaque state is
// discarded. Every attachment is bound to the current provider/account/model.

import { createHash } from 'node:crypto';

export const REPLAY_KIND = 'dsh-majed:attachment-replay';
export const REPLAY_VERSION = 1;

export function replayKey(provider, account, model) {
  return createHash('sha256').update(JSON.stringify([provider, account, model])).digest('hex');
}

/** Bind attachment replay state to the current account/model key. */
export function bindAttachmentReplay(options, account, model = options.model) {
  const key = replayKey(options.provider, account, model);
  const attachments = (options.attachments ?? []).map(attachment => {
    let next = attachment;
    if (next.replayState != null) {
      const replay = next.replayState;
      if (replay !== null && typeof replay === 'object' && 'response' in replay) {
        const response = replay.response;
        if (response !== null && typeof response === 'object' && response.kind === REPLAY_KIND) {
          if (response.version === REPLAY_VERSION && response.key === key && 'state' in response) {
            next = { ...next, replayState: { ...replay, response: response.state } };
          } else {
            // Bound to a different account/model or unknown version: discard opaque state.
            const { replayState: _discarded, ...rest } = next;
            next = rest;
          }
        } else if (next.provider === options.provider && next.account === account && next.model === model) {
          // Unwrapped older history for this same provider/account/model keeps direct behavior.
        } else {
          const { replayState: _discarded2, ...rest } = next;
          next = rest;
        }
      }
    }
    return Object.freeze({
      ...next,
      provider: options.provider,
      account,
      model,
    });
  });
  return { ...options, attachments };
}

export default { bindAttachmentReplay, REPLAY_KIND, REPLAY_VERSION, replayKey };
