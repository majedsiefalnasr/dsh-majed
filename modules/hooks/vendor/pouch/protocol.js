// Adapted from moon16u/dsh-pouch e9c2aa153b4ac223eee187d730e4877ec5feb16d,
// packages/dsh-hooks/lib/hooks/config.js (MIT). Only the seven required events
// and bounded matcher remain; profile discovery and deferred events are omitted.
export const EVENTS = Object.freeze({
  SessionStart: { context: true, block: true },
  UserPromptSubmit: { context: true, block: true },
  PreToolUse: { context: false, block: true },
  PostToolUse: { context: true, block: true },
  PermissionRequest: { context: false, block: true },
  Stop: { context: true, block: true },
  PostCompact: { context: true, block: false },
});

export function matches(pattern, input) {
  const text = String(input ?? '').slice(0, 512);
  return pattern.split('|').some(part => {
    let row = Array(text.length + 1).fill(false); row[0] = true;
    for (const token of part) {
      const next = Array(text.length + 1).fill(false);
      next[0] = token === '*' && row[0];
      for (let j = 1; j <= text.length; j++) next[j] = token === '*' ? row[j] || next[j - 1] : row[j - 1] && (token === '?' || token === text[j - 1]);
      row = next;
    }
    return row[text.length];
  });
}
