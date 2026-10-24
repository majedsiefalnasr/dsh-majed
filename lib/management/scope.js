import { realpath, stat } from 'node:fs/promises';

/**
 * Read-only scope policy over public native services; does not authenticate.
 * Call only behind Owner admission. Selectors never provide trusted paths.
 * The returned path is an observation, not a filesystem capability or a lease:
 * a later mutating operation needs its own cancellation and path-race defenses.
 * The inert Settings service uses this only after native Owner admission.
 */
// Explicit observation dependency for deterministic composition probes; default is real filesystem I/O.
export async function resolveManagementScope(ctx, selectors, signal, filesystem = { realpath, stat }) {
  signal?.throwIfAborted();
  if (!selectors || typeof selectors !== 'object' || Array.isArray(selectors)) return undefined;
  const { sessionId, workspaceId } = selectors;
  if (typeof sessionId !== 'string' || !sessionId || typeof workspaceId !== 'string' || !workspaceId) return undefined;
  let header = ctx.sessions.get(sessionId)?.header;
  if (!header) {
    const snapshot = await ctx.sessionPersistence.stat(sessionId, { signal });
    signal?.throwIfAborted();
    header = ctx.sessions.get(sessionId)?.header ?? snapshot?.header;
  }
  if (!header || header.id !== sessionId || typeof header.cwd !== 'string') return undefined;
  const liveHeader = ctx.sessions.get(sessionId)?.header;
  const observedId = header.id;
  const observedCwd = header.cwd;
  const workspace = ctx.workspaceRegistry.get(workspaceId);
  if (!workspace || !workspace.sessionIds.includes(sessionId)) return undefined;
  let canonical;
  try {
    canonical = await filesystem.realpath(header.cwd);
    if (!(await filesystem.stat(canonical)).isDirectory()) return undefined;
  } catch (error) {
    signal?.throwIfAborted();
    if (['ENOENT', 'ENOTDIR'].includes(error.code)) return undefined;
    throw error;
  }
  signal?.throwIfAborted();
  // No await after this authority check: reject replacement/publication conflicts or live disappearance.
  const currentHeader = ctx.sessions.get(sessionId)?.header;
  if (liveHeader && currentHeader !== liveHeader) return undefined;
  if (currentHeader && (currentHeader.id !== observedId || currentHeader.cwd !== observedCwd)) return undefined;
  if (ctx.workspaceRegistry.get(workspaceId) !== workspace || !workspace.sessionIds.includes(sessionId)) return undefined;
  if (canonical !== workspace.path) return undefined;
  return { sessionId, workspaceId, projectPath: canonical };
}
