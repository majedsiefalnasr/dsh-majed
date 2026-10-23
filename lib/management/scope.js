import { realpath, stat } from 'node:fs/promises';

/**
 * Read-only scope policy over public native services; does not authenticate.
 * Call only behind Owner admission. Selectors never provide trusted paths.
 * The returned path is an observation, not a filesystem capability or a lease:
 * a later mutating operation needs its own cancellation and path-race defenses.
 * This module remains outside the production package and registration graph.
 */
export async function resolveManagementScope(ctx, selectors, signal) {
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
  const workspace = ctx.workspaceRegistry.get(workspaceId);
  if (!workspace || !workspace.sessionIds.includes(sessionId)) return undefined;
  let canonical;
  try {
    canonical = await realpath(header.cwd);
    if (!(await stat(canonical)).isDirectory()) return undefined;
  } catch (error) {
    signal?.throwIfAborted();
    if (['ENOENT', 'ENOTDIR'].includes(error.code)) return undefined;
    throw error;
  }
  signal?.throwIfAborted();
  if (ctx.workspaceRegistry.get(workspaceId) !== workspace || !workspace.sessionIds.includes(sessionId)) return undefined;
  if (canonical !== workspace.path) return undefined;
  return { sessionId, workspaceId, projectPath: canonical };
}
