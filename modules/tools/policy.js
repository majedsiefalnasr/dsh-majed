// Session-creation-time tool-policy history.
//
// Captured once at session creation and preserved across reload,
// resumed sessions and reference ownership changes. Policy is immutable
// after capture; only a new session creation replaces it.

function requiredString(value, name) {
  if (typeof value !== 'string' || !value) throw new Error(`Invalid ${name}.`);
  return value;
}

/** Registry of session-creation-time tool policies. */
export function createToolPolicy(initial = {}) {
  const bySession = new Map(); // sessionId -> { createdAt, policy, generation }
  let generation = 0;

  function insert(sessionId, policy) {
    const entry = Object.freeze({
      createdAt: Date.now(),
      policy: Object.freeze({ ...policy }),
      generation: ++generation,
    });
    bySession.set(sessionId, entry);
    return entry;
  }

  for (const [sessionId, policy] of Object.entries(initial.policies || {})) {
    insert(sessionId, policy);
  }

  return {
    /** Capture tool policy at session creation. Immutable after capture. */
    capture(sessionId, policy) {
      requiredString(sessionId, 'session id');
      if (policy === undefined || policy === null || typeof policy !== 'object' || Array.isArray(policy))
        throw new Error('Invalid tool policy.');
      return insert(sessionId, policy);
    },
    /** Get the captured policy for a session (undefined if never captured). */
    get(sessionId) {
      const entry = bySession.get(String(sessionId));
      if (entry === undefined) return undefined;
      return {
        createdAt: entry.createdAt,
        policy: structuredClone(entry.policy),
        generation: entry.generation,
      };
    },
    has(sessionId) { return bySession.has(String(sessionId)); },
    /** Snapshot all captured policies for reload/restore across sessions. */
    snapshot() {
      return {
        generation,
        sessions: [...bySession.entries()].map(([id, entry]) => ({
          id,
          createdAt: entry.createdAt,
          policy: structuredClone(entry.policy),
          generation: entry.generation,
        })),
      };
    },
    /** Restore policies from a snapshot (e.g. after reload). Never overwrites a live capture. */
    restore(snapshot) {
      if (snapshot === undefined || snapshot === null || typeof snapshot !== 'object' || Array.isArray(snapshot))
        throw new Error('Invalid tool policy snapshot.');
      if (!Array.isArray(snapshot.sessions)) throw new Error('Invalid tool policy snapshot sessions.');
      for (const entry of snapshot.sessions) {
        if (typeof entry.id !== 'string' || !entry.id) continue;
        if (entry.policy === undefined || entry.policy === null || typeof entry.policy !== 'object' || Array.isArray(entry.policy))
          continue;
        if (bySession.has(entry.id)) continue;
        bySession.set(entry.id, Object.freeze({
          createdAt: entry.createdAt === undefined ? Date.now() : Number(entry.createdAt),
          policy: Object.freeze({ ...entry.policy }),
          generation: entry.generation === undefined ? ++generation : Number(entry.generation),
        }));
      }
      return this.snapshot();
    },
    /** Clear a single session's policy (session ended). */
    clear(sessionId) { bySession.delete(String(sessionId)); },
    /** Clear all policies (reference ownership change / logout). */
    clearAll() { bySession.clear(); generation = 0; },
    size() { return bySession.size; },
  };
}

export default { createToolPolicy };
