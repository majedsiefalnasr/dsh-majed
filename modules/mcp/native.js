import { realpath, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve, relative, isAbsolute } from 'node:path';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import { PROBE_TIMEOUT_MS, createMcpManager, loadMcpClient, validateServer, validateServers } from './index.js';
import { createMcpDefinitionStore } from './storage.js';
import { mergeSecrets, object, serial } from '../managers/validation.js';
import { discoverManagementContexts, resolveManagementScope } from '../../lib/management/scope.js';

export const MCP_METHOD = 'majed/mcp';
export const MCP_PATH = '/api/' + MCP_METHOD;
const deny = code => { throw Object.assign(new Error(code), { code }); };
const revisionKey = randomBytes(32);
// Opaque per-process token over the store revision, bound to the scope and store identity so a token never
// validates against another scope; it fences stale writes but is not a digest of stored secrets.
const token = (record, revision) => createHmac('sha256', revisionKey).update(JSON.stringify([record.root || 'global', record.file, revision])).digest('hex');
const identifier = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
const statusName = value => ({ configured: 'saved', mounted: 'active', 'activation-failed': 'failed', 'cleanup-failed': 'cleanup-failed', 'probe-passed': 'probe-passed', 'probe-failed': 'probe-failed', probing: 'probing' })[value] || 'saved';

const maskKeys = value => Object.fromEntries(Object.keys(value || {}).map(key => [key, '***']));

export function createManagedMcpService(ctx, options = {}) {
  const queue = serial(), scopes = new Map(), agents = new Map(); let disposed = false;
  const directory = resolve(options.stateDirectory || join(process.env.DSH_HOME || join(homedir(), '.dsh'), 'majed', 'mcp'));
  const nativeServices = () => ({ sessions: ctx.get('sessions'), sessionPersistence: ctx.get('sessionPersistence'), workspaceRegistry: ctx.get('workspaceRegistry') });
  function scopeRecord(root) {
    const key = root || 'global';
    if (!scopes.has(key)) {
      const name = root ? 'project-' + createHash('sha256').update(root).digest('hex') + '.json' : 'global.json', file = join(directory, name);
      scopes.set(key, { root, file, store: createMcpDefinitionStore(file), manager: root ? null : createMcpManager(ctx) });
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
  const contexts = signal => discoverManagementContexts(nativeServices(), signal);
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
  async function prepare(record, servers) {
    // Schema/store failures remain fatal. Only per-server filesystem eligibility
    // is isolated; never persist a disabled replacement for the Owner's row.
    const rows = validateServers(servers), failed = new Set();
    const prepared = await Promise.all(rows.map(async row => {
      if (!row.enabled) return row;
      try { return await validateCwd(row, record.root); }
      catch (error) {
        if (!['ENOENT', 'ENOTDIR', 'EACCES', 'EPERM', 'ELOOP', 'invalid_scope'].includes(error.code)) throw error;
        failed.add(row.serverName);
        return { ...row, enabled: false };
      }
    }));
    record.failed = failed;
    return prepared;
  }
  async function reconcile(record, servers) {
    if (disposed) deny('unavailable');
    // Re-read definitions are untrusted too. A private file is not authority to
    // start a project process outside its currently canonical project root.
    const prepared = await prepare(record, servers);
    if (disposed) deny('unavailable');
    if (record.manager) await record.manager.replace(prepared);
    for (const value of agents.values()) if (value.root === record.root) { if (disposed) deny('unavailable'); await value.manager.replace(prepared); }
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
    const rows = validateServers((await record.store.read()).servers);
    const prepared = await prepare(record, rows);
    if (disposed) deny('unavailable');
    await manager.replace(prepared);
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
    const observed = await record.store.observe(), servers = validateServers(observed.value.servers);
    const managers = record.manager ? [record.manager] : [...agents.values()].filter(value => value.root === record.root).map(value => value.manager);
    return { enabled: true, runtime: 'native', scope: record.root ? 'project' : 'global', revision: token(record, observed.revision), probeDeadlineMs: PROBE_TIMEOUT_MS, contexts: await contexts(signal),
      servers: servers.map(row => {
        const { env, headers, ...visible } = row;
        const views = managers.flatMap(manager => manager.snapshot().filter(value => value.serverName === row.serverName));
        const status = views.some(value => ['activation-failed', 'cleanup-failed'].includes(value.status)) ? views.find(value => ['activation-failed', 'cleanup-failed'].includes(value.status)).status : views[0]?.status;
        return { ...visible, env: maskKeys(env), headers: maskKeys(headers), status: status === 'cleanup-failed' ? status : record.failed?.has(row.serverName) ? 'failed' : record.root && row.enabled && managers.length === 0 ? 'awaiting-agent' : statusName(status), probe: views.find(value => value.probe)?.probe || null, lastResult: views.find(value => value.lastResult)?.lastResult || null, runtimeCount: views.filter(value => value.status === 'mounted').length };
      }) };
  }
  // Read-only combined view. The precedence below is this plugin's own documented rule, not a native
  // guarantee: nothing here mounts, unmounts or reconciles a server, and the native tool registry decides
  // what the model can actually call (see docs/research/m01-mcp-lifecycle-2026-10-28.md, G-mcp-scope).
  // Bounds: at most VIEW_KEYS credential key names per entry, each at most VIEW_KEY_CHARS long, and the
  // whole response at most VIEW_BYTES (60000, leaving headroom under 65536 bytes).
  // Anything clipped or omitted sets truncated:true and is counted; nothing is silently dropped.
  const VIEW_BYTES = 60000, VIEW_KEYS = 8, VIEW_KEY_CHARS = 32;
  function boundedMask(value, entry) {
    const keys = Object.keys(value || {}), shown = keys.slice(0, VIEW_KEYS);
    if (keys.length > shown.length || shown.some(key => key.length > VIEW_KEY_CHARS)) entry.clipped = true;
    return { result: maskKeys(Object.fromEntries(shown.map(key => [key.slice(0, VIEW_KEY_CHARS), 1]))), omitted: keys.length - shown.length };
  }
  // Display-only executable name. A command string can embed credentials (URL userinfo, VAR=value, query tokens),
  // so only a plain basename is shown; anything that looks like a URL or an assignment is replaced.
  function executableName(command) {
    const first = String(command).trim().split(/\s+/)[0] || '';
    if (!first || /[:@=?#]/.test(first)) return { executable: '(redacted)' };
    const base = first.split(/[/\\]+/).filter(Boolean).pop() || '(redacted)';
    return base.length > 64 ? { executable: base.slice(0, 64), clipped: true } : { executable: base };
  }
  async function scopeView(record) {
    const sources = [scopeRecord(), ...(record.root ? [record] : [])];
    const entries = new Map(); let omittedKeys = 0, truncated = false;
    for (const source of sources) {
      const observed = await source.store.observe(), revision = token(source, observed.revision);
      for (const row of validateServers(observed.value.servers)) {
        // Compact on purpose: argument values, URL queries, command lines and directories can carry credentials and are not needed to explain precedence.
        const { env, headers, args, url, command, cwd, reconnect, timeout, instructionLimit, ...visible } = row;
        if (url !== undefined) { const parsed = new URL(url), shown = parsed.origin + parsed.pathname; visible.url = shown.slice(0, 96); if (shown.length > 96) visible.clipped = true; }
        if (args !== undefined) visible.argCount = args.length;
        if (command !== undefined) { const { clipped, ...name } = executableName(command); Object.assign(visible, name); if (clipped) visible.clipped = true; }
        const envMask = boundedMask(env, visible), headerMask = boundedMask(headers, visible);
        omittedKeys += envMask.omitted + headerMask.omitted; truncated ||= visible.clipped === true;
        if (!entries.has(row.serverName)) entries.set(row.serverName, []);
        entries.get(row.serverName).push({ ...visible, scope: source.root ? 'project' : 'global', env: envMask.result, headers: headerMask.result, revision });
      }
    }
    const names = [...entries].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([serverName, list]) => {
      // Fallback and effective apply only to ENABLED entries; a disabled entry is shown as disabled, never as fallback.
      const override = list.find(entry => entry.scope === 'project' && entry.enabled);
      const effective = override || list.find(entry => entry.enabled);
      return { serverName, conflict: list.length > 1, effective: effective ? effective.scope : null,
        entries: list.map(entry => ({ ...entry, shadowed: entry.scope === 'global' && entry.enabled && !!override, fallback: entry.scope === 'global' && entry.enabled && list.length > 1 && !override })) };
    });
    const head = { enabled: true, runtime: 'native', scope: record.root ? 'project' : 'global', resolution: 'plugin-view-only', rule: 'project-overrides-global-within-project', nativeGuarantee: false };
    // Whole-response bound: drop trailing names (never partial rows) until the serialized view fits.
    let kept = names.length, size = Buffer.byteLength(JSON.stringify({ ...head, truncated: true, omittedServers: names.length, omittedKeys, names: [] }));
    const sizes = names.map(row => Buffer.byteLength(JSON.stringify(row)) + 1);
    kept = 0; while (kept < names.length && size + sizes[kept] <= VIEW_BYTES) { size += sizes[kept]; kept += 1; }
    const omittedServers = names.length - kept;
    return { ...head, truncated: truncated || omittedServers > 0 || omittedKeys > 0, omittedServers, omittedKeys, names: names.slice(0, kept) };
  }
  function operation(payload, signal) {
    return queue(async () => {
      await ready;
      if (disposed) deny('unavailable');
      object(payload, ['action', 'scope', 'sessionId', 'workspaceId', 'server', 'originalName', 'serverName', 'enabled', 'revision']);
      if (!['list', 'scopeView', 'save', 'remove', 'setEnabled', 'reconnect', 'probe'].includes(payload.action)) deny('invalid_request');
      const record = await boundScope(payload, signal);
      signal.throwIfAborted();
      if (payload.action === 'scopeView') return scopeView(record);
      if (['save', 'remove', 'setEnabled'].includes(payload.action)) {
        const saved = await record.store.update(async (current, revision) => {
          // Edits, removals and toggles must name the revision the client last saw; a stale
          // or missing one is refused before any definition or credential changes.
          if ((payload.action !== 'save' || payload.originalName !== undefined) && payload.revision !== token(record, revision)) deny('stale_revision');
          const servers = validateServers(current.servers);
          const name = payload.action === 'save' ? payload.originalName : payload.serverName;
          const index = servers.findIndex(row => row.serverName === name);
          if (payload.action === 'save') {
            if (payload.originalName !== undefined && index < 0) deny('not_found');
            const previous = servers[index];
            if (previous && previous.transport !== payload.server?.transport && (Object.keys(previous.env || {}).length || Object.keys(previous.headers || {}).length)) deny('credential_transport_change');
            // A blank "replace" value is a blank form, not intent: refuse instead of erasing a stored secret.
            for (const [stored, sent] of [[previous?.env, payload.server?.env], [previous?.headers, payload.server?.headers]]) {
              if (sent && typeof sent === 'object') for (const [key, val] of Object.entries(sent)) if (val === '' && stored && Object.hasOwn(stored, key)) deny('invalid_request');
            }
            const row = await validateCwd({ ...payload.server, scope: record.root ? 'project' : 'global', enabled: previous ? payload.server?.enabled ?? previous.enabled : false, // a NEW definition is never started by a save
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
        await reconcile(record, validateServers((await record.store.read()).servers));
        const managers = record.manager ? [record.manager] : [...agents.values()].filter(value => value.root === record.root).map(value => value.manager);
        if (!managers.length) deny('runtime_unavailable');
        const target = validateServers((await record.store.read()).servers).find(row => row.serverName === payload.serverName);
        if (!target) deny('not_found');
        await validateCwd(target, record.root);
        for (const manager of managers) {
          if (payload.action === 'probe') await manager.probeServer(payload.serverName);
          else { await manager.reconnect(payload.serverName); await reconcile(record, validateServers((await record.store.read()).servers)); }
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
        const codes = ['invalid_request', 'invalid_scope', 'scope_unavailable', 'not_found', 'duplicate_name', 'credential_transport_change', 'stale_revision', 'runtime_unavailable', 'ownership_acknowledgement_required'];
        const code = codes.includes(error.code) ? error.code : 'unavailable';
        return respond({ ok: false, error: { code, message: code, details: {} } });
      }
    } });
  });
}
