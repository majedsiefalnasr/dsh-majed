import { createMcpManager, validateServers, mcpConfigFields } from '../mcp/index.js';
import { createHooksManager, validateHooks, hooksConfigFields } from '../hooks/index.js';
import { object, fail, serial, safeFailure, persistenceReason } from './validation.js';
import { registerLocalTransport } from './transport.js';
export const MANAGER_SERVICE = 'dshMajedManagers';
export const managerConfigFields = { ...mcpConfigFields, ...hooksConfigFields };
export function validateManagerConfig(value = {}) {
  object(value, ['servers', 'hooks']);
  return { servers: validateServers(value.servers), hooks: validateHooks(value.hooks) };
}
/** Parent must attest the active root Include id, not a nested or inherited entry. */
export function createOwnedPersistence(editor, ownership) {
  const resolveEditor = typeof editor === 'function' ? editor : () => editor;
  function locate() {
    const editor = resolveEditor();
    if (!editor || typeof editor.entries !== 'function' || typeof editor.edit !== 'function' || !ownership?.id || typeof ownership.isOwnedRoot !== 'function') return;
    const entries = editor.entries();
    if (!Array.isArray(entries)) return;
    const matches = entries.filter(entry => entry?.options?.id === ownership.id);
    if (matches.length !== 1 || ownership.isOwnedRoot(matches[0]) !== true) return;
    return { editor, entry: matches[0] };
  }
  return {
    available: () => { try { return !!locate(); } catch { return false; } },
    async save(config) {
      const next = validateManagerConfig(config);
      try {
        const owned = locate();
        if (!owned) throw new Error('Owned root configuration unavailable.');
        const { editor, entry } = owned;
        await editor.edit(entry, (current) => {
          const latest = locate();
          if (latest?.entry !== entry) {
            let detail = 'OWNED_CHANGED_EDITOR';
            try {
              const again = resolveEditor();
              if (again === editor) {
                const rows = again.entries().filter(row => row?.options?.id === ownership.id);
                detail = rows.length !== 1 ? 'OWNED_CHANGED_ENTRIES' : rows[0] !== entry ? 'OWNED_CHANGED_ENTRY_FIBER_REPLACED' : `OWNED_CHANGED_${ownership.diagnose?.(rows[0]) ?? 'OK'}`;
              }
            } catch {}
            throw Object.assign(new Error('Owned root configuration changed.'), { detail });
          }
          // Complete synchronous configuration; preserve sibling module settings.
          return { ...(current || {}), managers: next };
        });
      } catch (error) {
        throw Object.assign(new Error('Persistence failed.'), { reason: persistenceReason(error) });
      }
    },
  };
}
/** Shared service is transport-independent. No file store, credentials echo, or HTTP fallback. */
export function createManagerService(ctx, initial = {}, options = {}) {
  const mcp = createMcpManager(ctx, options.loadMcp); const hooks = createHooksManager(ctx);
  const queue = serial(); let config = validateManagerConfig(initial); let hookStatus = 'configured'; let disposed = false; let disposal;
  const snapshot = () => ({ writable: !disposed && options.persistence?.available() === true, servers: mcp.snapshot(), hooks: { ...hooks.snapshot(), status: hookStatus } });
  async function activate(next) {
    await mcp.replace(next.servers);
    if (disposed) return;
    try { hooks.replace(next.hooks); hookStatus = next.hooks.enabled ? 'mounted' : 'configured'; }
    catch { hookStatus = 'activation-failed'; }
  }
  const ready = queue(() => activate(config));
  const mutate = change => queue(async () => {
    let stage = 'unavailable';
    try {
      if (disposed || options.persistence?.available() !== true) throw new Error('Unavailable.');
      stage = 'validation';
      const next = validateManagerConfig(change(structuredClone(config)));
      stage = 'persistence';
      await options.persistence.save(next); config = next;
      stage = 'activation';
      if (!disposed) await activate(next);
      return { ok: true, state: snapshot() };
    } catch (error) { return safeFailure(error, stage); }
  });
  const service = {
    ready,
    upsertServer: input => mutate(next => {
      object(input, ['originalName', 'server']);
      object(input.server, ['serverName', 'enabled', 'transport', 'command', 'args', 'cwd', 'url']);
      const index = input.originalName === undefined ? -1 : next.servers.findIndex(row => row.serverName === input.originalName);
      if (input.originalName !== undefined && index < 0) fail();
      if (next.servers.some((row, i) => i !== index && row.serverName === input.server.serverName)) fail();
      const previous = next.servers[index];
      if (previous && previous.transport !== input.server.transport && (Object.keys(previous.env || {}).length || Object.keys(previous.headers || {}).length)) fail();
      const row = { ...input.server, enabled: input.server.enabled ?? previous?.enabled ?? false };
      if (previous?.transport === row.transport) {
        if (previous.env !== undefined) row.env = previous.env;
        if (previous.headers !== undefined) row.headers = previous.headers;
      }
      if (index < 0) next.servers.push(row); else next.servers[index] = row;
      return next;
    }),
    removeServer: input => mutate(next => {
      object(input, ['serverName']);
      const index = next.servers.findIndex(row => row.serverName === input.serverName);
      if (index < 0) fail(); next.servers.splice(index, 1); return next;
    }),
    updateHooks: input => mutate(next => { next.hooks = validateHooks(input); return next; }),
    snapshot: async () => { await ready; return snapshot(); },
    update: input => mutate(() => { object(input, ['servers', 'hooks']); return input; }),
    setEnabled: input => mutate(next => {
      object(input, ['kind', 'serverName', 'enabled']);
      if (typeof input.enabled !== 'boolean' || !['server', 'hooks'].includes(input.kind)) fail();
      if (input.kind === 'hooks') { if (input.serverName !== undefined) fail(); next.hooks.enabled = input.enabled; }
      else { const row = next.servers.find(server => server.serverName === input.serverName); if (!row) fail(); row.enabled = input.enabled; }
      return next;
    }),
    dispose: () => {
      if (disposal) return disposal;
      disposed = true;
      // ConfigEditor awaits root teardown while save is pending in `queue`.
      // Joining that queue here creates a save -> teardown -> save deadlock.
      // MCP has its own lifecycle queue; closing it waits for active mounts.
      disposal = Promise.resolve().then(async () => { hooks.dispose(); await mcp.dispose(); });
      return disposal;
    },
  };
  return service;
}
export function applyManagers(ctx, config = {}, options = {}) {
  const service = createManagerService(ctx, config.managers || {}, options);
  ctx.effect(() => () => service.dispose(), 'dsh-majed: manager lifecycle');
  // Native Connection admission authenticates owner access for local and remote
  // GUI requests; no address-based fallback is used.
  if (typeof options.registerRemote === 'function') options.registerRemote(ctx, service);
  else registerLocalTransport(ctx, service);
  return service;
}
