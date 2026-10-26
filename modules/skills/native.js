// Native Skills management: Owner-controlled list/inspect/enable/disable via a
// dsh-majed-owned route. Vendor core functions are used directly as the behavior
// oracle; the vendored apply/runtime (copied route, tools, provider, updater,
// client) is never activated. The vendor module is lazy-loaded only when apply()
// runs, so importing this module never pulls in the vendored dependency graph.
const STATUS_FOR = Object.freeze({
  'error.root.readonly': 403,
  'error.root.unsafe': 409,
  'error.create.conflict': 409,
  'error.create.tooLarge': 413,
  'error.create.descriptionRequired': 400,
  'error.create.bodyRequired': 400,
  'error.import.invalidName': 400,
  'error.skill.notFound': 404,
  'error.trash.notFound': 404,
  'error.trash.conflict': 409,
  'error.trash.invalid': 400,
  'error.trash.projectUnavailable': 409,
  'error.root.unknown': 404,
});

function statusFor(code, fallback = 400) {
  return STATUS_FOR[code] ?? fallback;
}

let loadedCore;
async function loadCore() {
  if (!loadedCore) {
    const mod = await import('./vendor/lib/core.js');
    loadedCore = {
      state: mod.state,
      setSkillEnabled: mod.setSkillEnabled,
      skillDetail: mod.skillDetail,
      userRoots: mod.userRoots,
      projectRoots: mod.projectRoots,
      createSkill: mod.createSkill,
      deleteSkill: mod.deleteSkill,
      restoreTrash: mod.restoreTrash,
      permanentlyDeleteTrash: mod.permanentlyDeleteTrash,
      listTrash: mod.listTrash,
      checkedWritableRootDefinition: mod.checkedWritableRootDefinition,
    };
  }
  return loadedCore;
}

export const NATIVE_SKILLS_ROUTE = '/api/dsh-majed/skills';
const MARKER_HEADER = 'x-dsh-majed-skills';

const json = (body, status = 200) => Response.json(body, {
  status,
  headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
});

async function readBody(request) {
  const text = await request.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch {
    const error = new Error('invalid JSON body');
    error.statusCode = 400;
    throw error;
  }
}

function mutationGate(request) {
  const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'application/json') {
    return { statusCode: 415, code: 'error.proto.contentType', error: 'content-type must be application/json' };
  }
  if (request.headers.get(MARKER_HEADER) !== '1') {
    return { statusCode: 403, code: 'error.proto.forbidden', error: 'forbidden mutation request' };
  }
  return null;
}

async function resolveRoot(userRoots, projectRoots, key, projectCwds) {
  const user = userRoots().find((root) => root.key === key);
  if (user) return user;
  const projects = await projectRoots(projectCwds || []);
  return projects.find((root) => root.key === key) || null;
}

export function createHandler(handlerCtx, core) {
  const { emit } = handlerCtx;
  const {
    state: stateFn,
    setSkillEnabled: setEnabledFn,
    skillDetail: detailFn,
    createSkill: createSkillFn,
    deleteSkill: deleteSkillFn,
    restoreTrash: restoreTrashFn,
    permanentlyDeleteTrash: permanentlyDeleteTrashFn,
    listTrash: listTrashFn,
  } = core;

  async function resolveWritableRoot(rootKey, projectCwds) {
    const root = await resolveRoot(core.userRoots, core.projectRoots, rootKey, projectCwds);
    if (!root) return { notFound: true };
    const checked = await core.checkedWritableRootDefinition(root);
    if (!checked) return { readonly: true };
    if (checked.ok === false) return { unsafe: true, checked };
    return { root: checked };
  }

  function mutationResult(result, fallback = 400) {
    if (!result || result.ok !== false) return null;
    const status = Number.isInteger(result.statusCode) ? result.statusCode : statusFor(result.code, fallback);
    return { ok: false, code: result.code, error: result.error, status };
  }

  return async (request) => {
    try {
      if (request.method === 'GET') {
        const url = new URL(request.url);
        const projectCwdsParam = url.searchParams.get('projectCwds') || '';
        const projectCwds = projectCwdsParam.split(',').filter(Boolean);
        // state() reads live from disk on every call: external edits are reflected on refresh.
        const snapshot = await stateFn({ projectCwds });
        return json({ ok: true, data: snapshot });
      }
      if (request.method === 'POST') {
        const gate = mutationGate(request);
        if (gate) return json({ ok: false, code: gate.code, error: gate.error }, gate.statusCode);
        const body = await readBody(request);
        if (!body || typeof body !== 'object' || Array.isArray(body) || !body.action || !body.input) {
          return json({ error: 'Invalid request.' }, 400);
        }
        const { action, input } = body;
        if (action === 'setEnabled') {
          const rootKey = String(input.root || 'dsh');
          const name = String(input.name || '');
          const enabled = typeof input.enabled === 'boolean' ? input.enabled : undefined;
          if (!name || enabled === undefined) {
            return json({ error: 'name and enabled are required.' }, 400);
          }
          const root = await resolveRoot(core.userRoots, core.projectRoots, rootKey, input.projectCwds);
          if (!root) return json({ error: 'root not found.' }, 404);
          const result = await setEnabledFn(root, name, enabled);
          const rejected = mutationResult(result);
          if (rejected) return json(rejected, rejected.status);
          // Refresh native catalogs/active agents through the proven public seam.
          if (typeof emit === 'function') emit('commands/change');
          return json({ ok: true, data: result });
        }
        if (action === 'detail') {
          const detail = await detailFn(String(input.root || 'dsh'), String(input.name || ''), { projectCwds: input.projectCwds });
          return json({ ok: true, data: detail });
        }
        if (action === 'create') {
          const rootKey = String(input.root || 'dsh');
          const resolution = await resolveWritableRoot(rootKey, input.projectCwds);
          if (resolution.notFound) return json({ error: 'root not found.' }, 404);
          if (resolution.readonly) return json({ ok: false, code: 'error.root.readonly', error: 'root is read-only or not writable' }, 403);
          if (resolution.unsafe) return json({ ok: false, code: resolution.checked.code, error: resolution.checked.error }, statusFor(resolution.checked.code, 409));
          const result = await createSkillFn(input, undefined, { root: resolution.root });
          const rejected = mutationResult(result, 400);
          if (rejected) return json(rejected, rejected.status);
          if (typeof emit === 'function') emit('commands/change');
          return json({ ok: true, data: result });
        }
        if (action === 'trash') {
          const rootKey = String(input.root || 'dsh');
          const name = String(input.name || '');
          if (!name) return json({ error: 'name is required.' }, 400);
          const resolution = await resolveWritableRoot(rootKey, input.projectCwds);
          if (resolution.notFound) return json({ error: 'root not found.' }, 404);
          if (resolution.readonly) return json({ ok: false, code: 'error.root.readonly', error: 'root is read-only or not writable' }, 403);
          if (resolution.unsafe) return json({ ok: false, code: resolution.checked.code, error: resolution.checked.error }, statusFor(resolution.checked.code, 409));
          const result = await deleteSkillFn(resolution.root, name, undefined);
          const rejected = mutationResult(result);
          if (rejected) return json(rejected, rejected.status);
          if (typeof emit === 'function') emit('commands/change');
          return json({ ok: true, data: result });
        }
        if (action === 'restore') {
          const id = String(input.id || '');
          if (!id) return json({ error: 'id is required.' }, 400);
          const result = await restoreTrashFn(id, undefined, { projectCwds: input.projectCwds });
          const rejected = mutationResult(result);
          if (rejected) return json(rejected, rejected.status);
          if (typeof emit === 'function') emit('commands/change');
          return json({ ok: true, data: result });
        }
        if (action === 'delete') {
          const id = String(input.id || '');
          if (!id || input.confirm !== true) return json({ error: 'id and confirm are required for permanent deletion.' }, 400);
          const result = await permanentlyDeleteTrashFn(id, undefined);
          const rejected = mutationResult(result);
          if (rejected) return json(rejected, rejected.status);
          if (typeof emit === 'function') emit('commands/change');
          return json({ ok: true, data: result });
        }
        if (action === 'listTrash') {
          const items = await listTrashFn();
          return json({ ok: true, data: items });
        }
        return json({ error: 'Invalid action.' }, 400);
      }
      return json({ error: 'Method not allowed.' }, 405);
    } catch (error) {
      const status = Number.isInteger(error && error.statusCode) ? error.statusCode : 500;
      return json({ ok: false, error: 'Skill operation failed.' }, status);
    }
  };
}

export function registerNativeSkills(ctx, core) {
  ctx.inject(['connection'], (webCtx) => {
    const connection = webCtx.reflect.get('connection');
    const emit = webCtx.emit;
    const dispose = connection.fetch.register({
      path: NATIVE_SKILLS_ROUTE,
      methods: ['GET', 'POST'],
      requestBody: 'buffered',
      fetch: createHandler({ emit }, core),
    });
    webCtx.effect(() => dispose, 'dsh-majed: native skills lifecycle');
  });
}

export async function apply(skillsCtx, core) {
  const resolved = core || await loadCore();
  const connection = skillsCtx.reflect.get('connection');
  const emit = skillsCtx.emit;
  const dispose = connection.fetch.register({
    path: NATIVE_SKILLS_ROUTE,
    methods: ['GET', 'POST'],
    requestBody: 'buffered',
    fetch: createHandler({ emit }, resolved),
  });
  skillsCtx.effect(() => dispose, 'dsh-majed: native skills lifecycle');
}
