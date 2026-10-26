import { resolveManagementScope } from '../../lib/management/scope.js';
import { createHandler } from './native.js';

const PATH = '/api/majed/skills';
const record = value => value && typeof value === 'object' && !Array.isArray(value);
const only = (value, keys) => Object.keys(value).every(key => keys.includes(key));
const failure = code => Object.assign(new Error(code), { code });
const ACTIONS = ['status', 'enable', 'list', 'detail', 'setEnabled', 'create', 'trash', 'restore', 'delete', 'listTrash'];
const INPUT_KEYS = ['root', 'name', 'enabled', 'description', 'body', 'id', 'confirm'];

/** Owner admission is supplied by native exact Fetch before this service runs. */
export function apply(ctx) {
  ctx.inject(['connection'], owner => {
    let queue = Promise.resolve();
    let core, runtime, disposed = false;
    const lifetime = new AbortController();
    const invalidators = new Set();
    owner.effect(() => () => { disposed = true; lifetime.abort(); }, 'Majed Skills request lifetime');
    const status = () => ({ enabled: !!runtime, projects: [...(owner.get('workspaceRegistry')?.list() ?? [])]
      .flatMap(workspace => {
        const sessionId = workspace.sessionIds.find(id => owner.get('sessions')?.get(id));
        return sessionId ? [{ workspaceId: workspace.id, sessionId, title: workspace.title || 'Project' }] : [];
      }) });
    async function execute(payload, signal) {
      signal.throwIfAborted();
      if (disposed) throw failure('disposed');
      const { action } = payload, input = payload.input ?? {};
      // Resolve again after the serialization queue, never before it.
      let projectCwds = [];
      if ('sessionId' in payload || 'workspaceId' in payload) {
        const services = Object.fromEntries(['sessions', 'sessionPersistence', 'workspaceRegistry'].map(key => [key, owner.get(key)]));
        if (Object.values(services).some(value => !value)) throw failure('scope_unavailable');
        const scope = await resolveManagementScope(services, payload, signal);
        if (!scope) throw failure('scope_not_found');
        projectCwds = [scope.projectPath];
      }
      if (action === 'status') return status();
      if (action === 'enable') {
        if (typeof input.enabled !== 'boolean' || input.enabled && input.confirm !== true) throw failure('conflict_acknowledgement_required');
        if (!input.enabled && runtime) { const previous = runtime; runtime = undefined; await previous.dispose(); }
        if (input.enabled && !runtime) {
          if (!owner.get('skills')?.registerProvider) throw failure('skills_unavailable');
          core ??= await import('./vendor/lib/core.js');
          signal.throwIfAborted();
          const fiber = owner.plugin({ inject: ['skills'], apply(providerCtx) {
            providerCtx.skills.registerProvider(control => {
              invalidators.add(control.invalidate);
              control.signal.addEventListener('abort', () => invalidators.delete(control.invalidate), { once: true });
              return { name: 'dsh-majed-skills', async list(options) {
                return (await core.listProviderCandidates(options)).map(candidate => ({ ...candidate, provider: 'dsh-majed-skills' }));
              }, get: (candidate, options) => core.getProviderSkill(candidate, options) };
            });
          } });
          try { await fiber; signal.throwIfAborted(); if (disposed) throw failure('disposed'); runtime = fiber; }
          catch (error) { await fiber.dispose(); throw error; }
        }
        return status();
      }
      if (!runtime) throw failure('module_disabled');
      signal.throwIfAborted();
      await core.checkManagerHome(!['list', 'detail', 'listTrash'].includes(action));
      const roots = [...core.userRoots(), ...await core.projectRoots(projectCwds)];
      if (projectCwds.length && roots.some(root => root.scope === 'project' && root.projectRoot !== projectCwds[0])) throw failure('scope_not_found');
      if (['detail', 'setEnabled', 'create', 'trash'].includes(action) && !roots.some(root => root.key === (input.root ?? 'dsh'))) throw failure('scope_not_found');
      const allowedTrash = async () => (await core.listTrash()).filter(item => item.root?.scope !== 'project' || roots.some(root => root.key === item.root.key));
      if (action === 'listTrash') return allowedTrash();
      if (['restore', 'delete'].includes(action) && !(await allowedTrash()).some(item => item.id === input.id)) throw failure('scope_not_found');
      const notify = () => {
        for (const invalidate of invalidators) invalidate();
        owner.emit('commands/change');
        // rc.3's native '/' source caches by session and listens to this event.
        // Refresh its session key without writing a preset event or changing
        // composition. Undefined preserves a session with no explicit selection.
        for (const session of owner.get('sessions')?.list() ?? []) {
          const preset = session.header?.agentPreset;
          owner.emit('agent-preset/selected', session.header.id, preset);
        }
      };
      const handler = createHandler({ emit: notify }, core);
      const result = await handler(new Request('http://localhost/api/dsh-majed/skills' + (action === 'list' ? '?projectCwds=' + encodeURIComponent(projectCwds.join(',')) : ''), {
        method: action === 'list' ? 'GET' : 'POST', signal,
        ...(action === 'list' ? {} : { headers: { 'content-type': 'application/json', 'x-dsh-majed-skills': '1' }, body: JSON.stringify({ action, input: { ...input, projectCwds } }) }),
      }));
      const value = await result.json();
      if (!result.ok || value.ok === false) throw failure(value.code || 'operation_failed');
      return value.data;
    }
    owner.connection.fetch.register({ path: PATH, methods: ['POST'], requestBody: 'buffered', async fetch(request) {
      let rpcId;
      try {
        if (request.method !== 'POST' || new URL(request.url).pathname !== PATH) throw failure('invalid_request');
        if (request.headers.get('content-type')?.split(';', 1)[0] !== 'application/json') throw failure('invalid_request');
        const raw = await request.text();
        if (Buffer.byteLength(raw) > 300000) throw failure('invalid_request');
        const message = JSON.parse(raw);
        if (!record(message) || !only(message, ['type', 'method', 'rpcId', 'payload']) || message.type !== 'client-request' || message.method !== 'majed/skills' || typeof message.rpcId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(message.rpcId)) throw failure('invalid_request');
        rpcId = message.rpcId;
        const payload = message.payload;
        if (!record(payload) || !only(payload, ['action', 'input', 'sessionId', 'workspaceId']) || !ACTIONS.includes(payload.action) || !record(payload.input ?? {}) || !only(payload.input ?? {}, INPUT_KEYS)) throw failure('invalid_request');
        const signal = AbortSignal.any([request.signal, lifetime.signal]);
        const task = queue.then(() => execute(payload, signal));
        queue = task.catch(() => {});
        const value = await task;
        return Response.json({ type: 'server-response', rpcId, result: { ok: true, value } });
      } catch (error) {
        return Response.json({ type: 'server-response', rpcId, result: { ok: false, error: { code: error.code || 'operation_failed', message: 'Skill operation failed.', details: {} } } });
      }
    } });
  });
}
