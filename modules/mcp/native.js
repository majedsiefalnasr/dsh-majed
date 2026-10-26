import { realpath, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve, relative, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { createMcpManager, loadMcpClient, validateServer, validateServers } from './index.js';
import { createMcpDefinitionStore } from './storage.js';
import { mergeSecrets, object, serial } from '../managers/validation.js';
import { resolveManagementScope } from '../../lib/management/scope.js';

export const MCP_METHOD = 'majed/mcp';
export const MCP_PATH = '/api/' + MCP_METHOD;
const deny = code => { throw Object.assign(new Error(code), { code }); };
const identifier = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
const statusName = value => ({ configured: 'saved', mounted: 'active', 'activation-failed': 'failed', 'cleanup-failed': 'cleanup-failed', 'probe-passed': 'probe-passed', 'probe-failed': 'probe-failed', probing: 'probing' })[value] || 'saved';

export function createManagedMcpService(ctx, options = {}) {
  const queue = serial(), scopes = new Map(), agents = new Map(); let disposed = false;
  const directory = resolve(options.stateDirectory || join(process.env.DSH_HOME || join(homedir(), '.dsh'), 'majed', 'mcp'));
  const nativeServices = () => ({ sessions: ctx.get('sessions'), sessionPersistence: ctx.get('sessionPersistence'), workspaceRegistry: ctx.get('workspaceRegistry') });
  function scopeRecord(root) {
    const key = root || 'global';
    if (!scopes.has(key)) {
      const file = root ? 'project-' + createHash('sha256').update(root).digest('hex') + '.json' : 'global.json';
      scopes.set(key, { root, store: createMcpDefinitionStore(join(directory, file)), manager: root ? null : createMcpManager(ctx) });
    }
    return scopes.get(key);
  }
  async function boundScope(payload, signal) {
    if (payload.scope === 'global') {
      if (payload.sessionId !== undefined || payload.workspaceId !== undefined) deny('invalid_scope');
      return scopeRecord();
    }
    if (payload.scope !== 'project' || !identifier(payload.sessionId) || !identifier(payload.workspaceId)) deny('invalid_scope');
    const services = nativeServices();
    if (Object.values(services).some(value => !value)) deny('scope_unavailable');
    const scope = await resolveManagementScope(services, payload, signal);
    if (!scope) deny('invalid_scope');
    return scopeRecord(scope.projectPath);
  }
  async function contexts(signal) {
    const services = nativeServices();
    if (Object.values(services).some(value => !value) || typeof services.workspaceRegistry.list !== 'function') return [];
    const values = [];
    for (const workspace of services.workspaceRegistry.list().slice(0, 64)) {
      for (const sessionId of workspace.sessionIds.slice(0, 32)) {
        if (!services.sessions.get(sessionId)) continue;
        const selectors = { sessionId, workspaceId: workspace.id };
        const resolved = await resolveManagementScope(services, selectors, signal);
        if (resolved) { values.push({ ...selectors, label: resolved.projectPath }); break; }
      }
    }
    return values;
  }
  async function validateCwd(server, root) {
    const row = validateServer(server);
    if (row.transport !== 'stdio') return row;
    const base = root || options.userDirectory || homedir();
    const canonicalBase = await realpath(base);
    const cwd = await realpath(resolve(canonicalBase, row.cwd || '.'));
    const remainder = relative(canonicalBase, cwd);
    if ((root && (remainder === '..' || remainder.startsWith('../') || isAbsolute(remainder))) || !(await stat(cwd)).isDirectory()) deny('invalid_scope');
    return { ...row, cwd };
  }
  async function reconcile(record, servers) {
    if (disposed) deny('unavailable');
    if (record.manager) await record.manager.replace(servers);
    for (const value of agents.values()) if (value.root === record.root) await value.manager.replace(servers);
  }
  async function attachAgent(agent) {
    if (disposed || agents.has(agent) || !agent.ctx) return;
    const services = nativeServices();
    if (Object.values(services).some(value => !value) || typeof services.workspaceRegistry.list !== 'function') return;
    const workspace = services.workspaceRegistry.list().find(value => value.sessionIds.includes(agent.id));
    if (!workspace) return;
    const scope = await resolveManagementScope(services, { sessionId: agent.id, workspaceId: workspace.id }, agent.signal);
    if (!scope || disposed) return;
    const manager = createMcpManager(agent.ctx, () => loadMcpClient(ctx), ctx), record = scopeRecord(scope.projectPath);
    agents.set(agent, { root: scope.projectPath, manager });
    await manager.replace(validateServers((await record.store.read()).servers));
  }
  // Public scoped agent contexts own project tool registrations; no global
  // project tool is hidden after registration or authorized by a UI label.
  ctx.on('agent/created', ({ agent }) => queue(() => attachAgent(agent)));
  ctx.on('agent/disposed', ({ agent }) => queue(async () => { const value = agents.get(agent); if (value) { await value.manager.dispose(); agents.delete(agent); } }));
  const ready = queue(async () => {
    const global = scopeRecord(); await reconcile(global, validateServers((await global.store.read()).servers));
    for (const agent of ctx.get('agents')?.list() || []) await attachAgent(agent);
  });
  ready.catch(() => {});
  async function snapshot(record, signal) {
    const servers = validateServers((await record.store.read()).servers);
    const managers = record.manager ? [record.manager] : [...agents.values()].filter(value => value.root === record.root).map(value => value.manager);
    return { enabled: true, runtime: 'native', scope: record.root ? 'project' : 'global', contexts: await contexts(signal),
      servers: servers.map(row => {
        const { env, headers, ...visible } = row;
        const views = managers.flatMap(manager => manager.snapshot().filter(value => value.serverName === row.serverName));
        const status = views.some(value => ['activation-failed', 'cleanup-failed'].includes(value.status)) ? views.find(value => ['activation-failed', 'cleanup-failed'].includes(value.status)).status : views[0]?.status;
        return { ...visible, env: Object.fromEntries(Object.keys(env || {}).map(key => [key, '***'])), headers: Object.fromEntries(Object.keys(headers || {}).map(key => [key, '***'])), status: statusName(status), probe: views.find(value => value.probe)?.probe || null, runtimeCount: views.filter(value => value.status === 'mounted').length };
      }) };
  }
  function operation(payload, signal) {
    return queue(async () => {
      await ready;
      if (disposed) deny('unavailable');
      object(payload, ['action', 'scope', 'sessionId', 'workspaceId', 'server', 'originalName', 'serverName', 'enabled']);
      if (!['list', 'save', 'remove', 'setEnabled', 'reconnect', 'probe'].includes(payload.action)) deny('invalid_request');
      const record = await boundScope(payload, signal);
      signal.throwIfAborted();
      if (['save', 'remove', 'setEnabled'].includes(payload.action)) {
        const saved = await record.store.update(async current => {
          const servers = validateServers(current.servers);
          const name = payload.action === 'save' ? payload.originalName : payload.serverName;
          const index = servers.findIndex(row => row.serverName === name);
          if (payload.action === 'save') {
            if (payload.originalName !== undefined && index < 0) deny('not_found');
            const previous = servers[index];
            if (previous && previous.transport !== payload.server?.transport && (Object.keys(previous.env || {}).length || Object.keys(previous.headers || {}).length)) deny('credential_transport_change');
            const row = await validateCwd({ ...payload.server, scope: record.root ? 'project' : 'global', enabled: payload.server?.enabled ?? previous?.enabled ?? false,
              env: payload.server?.transport === 'stdio' ? mergeSecrets(previous?.env, payload.server?.env) : undefined,
              headers: payload.server?.transport === 'streamable-http' ? mergeSecrets(previous?.headers, payload.server?.headers) : undefined }, record.root);
            if (servers.some((value, position) => position !== index && value.serverName === row.serverName)) deny('duplicate_name');
            if (index < 0) servers.push(row); else servers[index] = row;
          } else {
            if (index < 0) deny('not_found');
            if (payload.action === 'remove') servers.splice(index, 1);
            else { if (typeof payload.enabled !== 'boolean') deny('invalid_request'); servers[index].enabled = payload.enabled; }
          }
          if ((await boundScope(payload, signal)) !== record) deny('invalid_scope');
          signal.throwIfAborted(); if (disposed) deny('unavailable');
          return { servers };
        });
        await reconcile(record, saved.servers);
      } else if (payload.action === 'list') await reconcile(record, validateServers((await record.store.read()).servers));
      else {
        const managers = record.manager ? [record.manager] : [...agents.values()].filter(value => value.root === record.root).map(value => value.manager);
        if (!managers.length) deny('runtime_unavailable');
        for (const manager of managers) {
          if (payload.action === 'probe') await manager.probeServer(payload.serverName);
          else { await manager.reconnect(payload.serverName); await manager.replace(validateServers((await record.store.read()).servers)); }
        }
      }
      return snapshot(record, signal);
    });
  }
  return { ready, operation, dispose() {
    disposed = true;
    return queue(async () => { for (const value of agents.values()) await value.manager.dispose(); agents.clear(); for (const record of scopes.values()) { await record.manager?.dispose(); record.store.dispose(); } });
  } };
}

export function applyManagedMcp(ctx, config = {}) {
  const enabled = config.enabled === true;
  ctx.inject(['connection'], owner => {
    let service;
    if (enabled && config.standaloneDisabled === true) owner.inject(['tools', 'loader'], runtime => {
      service = createManagedMcpService(runtime, config);
      runtime.effect(() => () => { const current = service; service = undefined; return current.dispose(); }, 'dsh-majed: native MCP lifecycle');
    });
    owner.connection.fetch.register({ path: MCP_PATH, methods: ['POST'], requestBody: 'buffered', async fetch(request) {
      let rpcId;
      const respond = result => Response.json({ type: 'server-response', rpcId, result }, { headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
      try {
        if (request.method !== 'POST' || new URL(request.url).pathname !== MCP_PATH || request.headers.get('content-type') !== 'application/json') deny('invalid_request');
        if (Number(request.headers.get('content-length')) > 65536) deny('invalid_request');
        const raw = await request.text(); if (Buffer.byteLength(raw) > 65536) deny('invalid_request');
        const message = JSON.parse(raw); object(message, ['type', 'rpcId', 'method', 'payload']);
        if (message.type !== 'client-request' || message.method !== MCP_METHOD || !identifier(message.rpcId)) deny('invalid_request');
        rpcId = message.rpcId;
        if (!enabled) return respond({ ok: true, value: { enabled: false, runtime: 'native', servers: [], contexts: [] } });
        if (config.standaloneDisabled !== true) deny('ownership_acknowledgement_required');
        if (!service) deny('runtime_unavailable');
        return respond({ ok: true, value: await service.operation(message.payload, request.signal) });
      } catch (error) {
        const codes = ['invalid_request', 'invalid_scope', 'scope_unavailable', 'not_found', 'duplicate_name', 'credential_transport_change', 'runtime_unavailable', 'ownership_acknowledgement_required'];
        const code = codes.includes(error.code) ? error.code : 'unavailable';
        return respond({ ok: false, error: { code, message: code, details: {} } });
      }
    } });
  });
}
