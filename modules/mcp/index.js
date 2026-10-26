import { object, text, flag, maskedDictionary, fail, serial, scope, reconnect, timeout, instructionLimit, serverPath, MASKED_SECRET } from '../managers/validation.js';
import { isDeepStrictEqual } from 'node:util';
export const SERVER_NAME = /^[A-Za-z0-9_-]{1,32}$/;
export { MASKED_SECRET };
/** Bounded native handshake/list probe with isolated registrations and awaited disposal. Starts the configured process or HTTP connection. */
export const PROBE_TIMEOUT_MS = 10_000;
export function validateServer(value) {
  object(value, ['serverName', 'scope', 'enabled', 'transport', 'command', 'args', 'env', 'cwd', 'url', 'headers', 'reconnect', 'timeout', 'instructionLimit']);
  if (!SERVER_NAME.test(text(value.serverName, 32))) fail();
  const result = {
    serverName: value.serverName,
    scope: scope(value.scope),
    enabled: flag(value.enabled),
    transport: value.transport,
  };
  if (value.transport === 'stdio') {
    if (value.url !== undefined || value.headers !== undefined) fail();
    result.command = text(value.command, 1024); if (!result.command.trim()) fail();
    if (value.args !== undefined && (!Array.isArray(value.args) || value.args.length > 128)) fail();
    result.args = (value.args || []).map(arg => text(arg));
    if (value.env !== undefined) result.env = maskedDictionary(value.env);
    if (value.cwd !== undefined) { result.cwd = serverPath(value.cwd); if (!result.cwd.trim()) fail(); }
    result.reconnect = reconnect(value.reconnect);
    result.timeout = timeout(value.timeout);
    result.instructionLimit = instructionLimit(value.instructionLimit);
  } else if (value.transport === 'streamable-http') {
    if (['command', 'args', 'env', 'cwd'].some(key => value[key] !== undefined)) fail();
    let url; try { url = new URL(text(value.url)); } catch { fail(); }
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.hash) fail();
    result.url = url.href;
    if (value.headers !== undefined) result.headers = maskedDictionary(value.headers);
    result.reconnect = reconnect(value.reconnect);
    result.timeout = timeout(value.timeout);
    result.instructionLimit = instructionLimit(value.instructionLimit);
  } else fail();
  return result;
}
export function validateServers(value = []) {
  if (!Array.isArray(value) || value.length > 32) fail();
  const result = value.map(validateServer);
  if (new Set(result.map(row => row.serverName)).size !== result.length) fail();
  return result;
}
// Named exports are the plugin namespace. A default export is deliberately not used.
export async function loadMcpClient(ctx) {
  const loader = ctx?.get?.('loader');
  if (typeof loader?.import !== 'function') throw new Error('Native module loader unavailable.');
  return loader.import('@deepseek-ai/dsh-mcp-client');
}
function nativeConfig(row, reconnectOverride) {
  const { enabled, scope, timeout, instructionLimit, ...config } = row;
  return { ...config, ...(timeout === undefined ? {} : { toolCallTimeoutMs: timeout }), ...(instructionLimit === undefined ? {} : { maxInstructionBytes: instructionLimit }), failOnStartupError: true, reconnect: reconnectOverride || row.reconnect || { enabled: true, maxAttempts: 5 } };
}
export function createMcpManager(ctx, load = () => loadMcpClient(ctx), moduleContext = ctx) {
  const queue = serial(); const mounted = new Map(), forced = new Set(); let rows = []; let definitions = []; let closed = false;
  async function unload() {
    for (const [name, record] of mounted) { await record.child.dispose(); mounted.delete(name); }
  }
  async function probeServer(serverName) {
    return queue(async () => {
      if (closed) throw new Error('Manager disposed.');
      const row = definitions.find(r => r.serverName === serverName);
      if (!row) throw new Error('Server not found.');
      const view = rows.find(r => r.serverName === serverName);
      view.status = 'probing';
      let child, probeScope, deadline;
      try {
        const loader = moduleContext.get('loader');
        if (typeof loader?.import !== 'function') throw new Error('Native module loader unavailable.');
        const [{ createScope }, namespace] = await Promise.all([loader.import('@deepseek-ai/dsh-scope'), load()]);
        // The temporary native scope keeps probe registrations out of every
        // real agent/global inventory; no SDK/runtime alternative is selected.
        probeScope = createScope(ctx, {});
        child = probeScope.ctx.plugin(namespace, nativeConfig(row, { enabled: false }));
        const expired = new Promise((_, reject) => { deadline = setTimeout(() => reject(new Error('Probe deadline.')), PROBE_TIMEOUT_MS); });
        await Promise.race([Promise.resolve(child), expired]);
        view.probe = 'passed';
        view.status = mounted.has(serverName) ? 'mounted' : 'probe-passed';
      } catch {
        view.probe = 'failed';
        view.status = mounted.has(serverName) ? 'mounted' : 'probe-failed';
      } finally {
        clearTimeout(deadline);
        try { await child?.dispose(); await probeScope?.dispose(); }
        catch { view.status = 'cleanup-failed'; throw new Error('MCP probe cleanup failed.'); }
      }
      return { ...view };
    });
  }
  return {
    replace: input => queue(async () => {
      if (closed) throw new Error('Manager disposed.');
      const next = validateServers(input);
      // Reconcile each connection independently; unrelated native instances and
      // in-flight tool calls survive another definition's edit or failure.
      for (const [name, record] of mounted) {
        const replacement = next.find(row => row.serverName === name);
        if (replacement?.enabled && isDeepStrictEqual(replacement, record.row)) continue;
        try { await record.child.dispose(); mounted.delete(name); }
        catch { const view = rows.find(row => row.serverName === name); if (view) view.status = 'cleanup-failed'; throw new Error('MCP cleanup failed. Replacement refused.'); }
      }
      const previous = rows, previousDefinitions = definitions;
      definitions = next;
      rows = next.map(row => {
        const before = previous.find(value => value.serverName === row.serverName);
        const unchanged = isDeepStrictEqual(previousDefinitions.find(value => value.serverName === row.serverName), row);
        return { serverName: row.serverName, transport: row.transport, enabled: row.enabled, scope: row.scope, ...(row.transport === 'stdio' ? { command: row.command, args: [...row.args], ...(row.cwd ? { cwd: row.cwd } : {}) } : { url: row.url }), envKeys: Object.keys(row.env || {}), headerKeys: Object.keys(row.headers || {}), envCount: Object.keys(row.env || {}).length, headerCount: Object.keys(row.headers || {}).length, status: unchanged ? before?.status || 'configured' : 'configured', ...(unchanged && before?.probe ? { probe: before.probe } : {}) };
      });
      for (const row of next) {
        if (!row.enabled || mounted.has(row.serverName)) continue;
        const view = rows.find(item => item.serverName === row.serverName);
        if (view.status === 'activation-failed' && !forced.has(row.serverName)) continue;
        forced.delete(row.serverName);
        view.status = 'probing';
        let child;
        try {
          const namespace = await load();
          child = ctx.plugin(namespace, nativeConfig(row));
          await child;
          if (closed) { await child.dispose(); continue; }
          mounted.set(row.serverName, { child, row }); view.status = 'mounted';
        } catch {
          view.status = 'activation-failed';
          if (child?.dispose) {
            try { await child.dispose(); }
            catch { mounted.set(row.serverName, { child, row }); view.status = 'cleanup-failed'; throw new Error('MCP child cleanup failed. Replacement refused.'); }
          }
        }
      }
      return rows.map(row => ({ ...row, ...(row.args ? { args: [...row.args] } : {}) }));
    }),
    probeServer,
    reconnect: serverName => queue(async () => {
      if (closed) throw new Error('Manager disposed.');
      const record = mounted.get(serverName);
      if (record) { await record.child.dispose(); mounted.delete(serverName); }
      if (!definitions.some(row => row.serverName === serverName)) throw new Error('Server not found.');
      forced.add(serverName);
      const next = definitions.map(row => ({ ...row }));
      // The next request's ordinary replace mounts only the missing generation.
      return next;
    }),
    snapshot: () => rows.map(row => ({ ...row, ...(row.args ? { args: [...row.args] } : {}) })),
    dispose: () => { closed = true; return queue(unload); },
  };
}
export const mcpConfigFields = { servers: { type: 'array', default: [], description: 'Managed MCP servers; each server is disabled unless enabled is explicitly true.' } };
