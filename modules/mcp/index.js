import { object, text, flag, maskedDictionary, fail, serial, scope, reconnect, timeout, instructionLimit, serverPath, MASKED_SECRET } from '../managers/validation.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js';
export const SERVER_NAME = /^[A-Za-z0-9_-]{1,32}$/;
export { MASKED_SECRET };
/** Probe a saved connection once, then dispose it: bounded, disposable, side-effect free. */
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
export async function loadMcpClient() { const mcpClient = await import('@deepseek-ai/dsh-mcp-client'); return mcpClient; }
export function createMcpManager(ctx, load = loadMcpClient) {
  const queue = serial(); const mounted = new Map(); let rows = []; let closed = false;
  async function unload() {
    for (const [name, child] of mounted) { await child.dispose(); mounted.delete(name); }
  }
  function buildStdioEnv(row) {
    const env = { ...process.env };
    for (const [key, value] of Object.entries(row.env || {})) {
      if (value === null || value === undefined) delete env[key];
      else if (value !== MASKED_SECRET) env[key] = value;
    }
    return env;
  }
  async function probeTransport(row, signal) {
    const transport = row.transport === 'stdio'
      ? new StdioClientTransport({ command: row.command, args: [...row.args], env: buildStdioEnv(row), cwd: row.cwd })
      : new StreamableHTTPClientTransport(new URL(row.url), { requestInit: { headers: row.headers || {}, signal, duplex: 'half' } });
    const client = new Client({ name: 'dsh-majed-mcp-probe', version: '0.0.1' }, { capabilities: {} });
    await client.connect(transport);
    await client.request({ method: 'tools/list' }, ListToolsResultSchema);
    return client;
  }
  async function probeServer(serverName) {
    return queue(async () => {
      if (closed) throw new Error('Manager disposed.');
      const row = rows.find(r => r.serverName === serverName);
      if (!row) throw new Error('Server not found.');
      const view = rows.find(r => r.serverName === serverName);
      view.status = 'probing';
      let client;
      try {
        const controller = new AbortController();
        const deadline = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
        try {
          client = await probeTransport(row, controller.signal);
          view.status = 'connected';
        } finally {
          clearTimeout(deadline);
        }
      } catch {
        view.status = 'error';
      } finally {
        if (client) { try { await client.close(); } catch {} }
      }
      return { ...view };
    });
  }
  return {
    replace: input => queue(async () => {
      if (closed) throw new Error('Manager disposed.');
      const next = validateServers(input);
      // Await each old child's disposal before mounting any replacement.
      await unload(); rows = next.map(row => ({ serverName: row.serverName, transport: row.transport, enabled: row.enabled, ...(row.transport === 'stdio' ? { command: row.command, args: [...row.args], ...(row.cwd ? { cwd: row.cwd } : {}) } : { url: row.url }), envCount: Object.keys(row.env || {}).length, headerCount: Object.keys(row.headers || {}).length, status: 'configured' }));
      for (const row of next) {
        if (!row.enabled) continue;
        const view = rows.find(item => item.serverName === row.serverName);
        let child;
        try {
          const namespace = await load();
          const { enabled, ...config } = row;
          child = ctx.plugin(namespace, { ...config, failOnStartupError: true, reconnect: { enabled: false } });
          await child;
          mounted.set(row.serverName, child); view.status = 'mounted';
        } catch {
          view.status = 'activation-failed';
          if (child?.dispose) {
            try { await child.dispose(); }
            catch { mounted.set(row.serverName, child); throw new Error('MCP child cleanup failed. Replacement refused.'); }
          }
        }
      }
      return rows.map(row => ({ ...row, ...(row.args ? { args: [...row.args] } : {}) }));
    }),
    probeServer,
    snapshot: () => rows.map(row => ({ ...row, ...(row.args ? { args: [...row.args] } : {}) })),
    dispose: () => queue(async () => { closed = true; await unload(); }),
  };
}
export const mcpConfigFields = { servers: { type: 'array', default: [], description: 'Managed MCP servers; each server is disabled unless enabled is explicitly true.' } };
