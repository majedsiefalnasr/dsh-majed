import test from 'node:test';
import assert from 'node:assert/strict';
import { registerNativeSkills, apply, NATIVE_SKILLS_ROUTE, createHandler } from '../../modules/skills/native.js';

const ROUTE = NATIVE_SKILLS_ROUTE;

function mockContext(core = {}) {
  const connection = {
    fetch: {
      register(value) {
        connection.registeredRoute = value;
        return () => { connection.registeredRoute = undefined; };
      },
    },
    admit: () => ({ peer: { principal: { kind: 'owner' } } }),
  };
  const emitted = [];
  const ctx = {
    inject(names, run) {
      if (names.includes('connection')) {
        run({ reflect: { get: () => connection }, emit: (e) => { emitted.push(e); }, effect(fn) { return fn(); } });
      }
    },
    effect(fn) { return fn(); },
  };
  return { ctx, connection, emitted };
}

const emptyState = { roots: [], projects: [], summary: { total: 0, enabled: 0, disabled: 0, issues: 0 } };

function kebabOf(name) {
  return String(name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function coreWith(overrides = {}) {
  const captured = { createInput: null, createOptions: null, trashArgs: null, restoreId: null, restoreOptions: null, deleteId: null };
  return {
    state: async () => structuredClone(emptyState),
    setSkillEnabled: async () => ({ ok: true }),
    skillDetail: async ({ root, name } = {}) => ({ ok: true, root, name }),
    userRoots: () => [{ key: 'dsh', path: '/home/dsh/skills', label: 'DSH', mutable: true, toggleable: true, native: true, scope: 'user' }],
    projectRoots: async () => [],
    createSkill: async (input, _log, options) => {
      captured.createInput = input; captured.createOptions = options;
      const name = kebabOf(input && input.name);
      if (!name || !KEBAB_RE.test(name)) return { ok: false, code: 'error.import.invalidName', error: 'invalid name', params: { name: input && input.name } };
      const description = String(input && input.description || '').trim();
      const body = String(input && input.body || '').trim();
      if (!description) return { ok: false, code: 'error.create.descriptionRequired', error: 'description required' };
      if (!body) return { ok: false, code: 'error.create.bodyRequired', error: 'body required' };
      if (description.length > 500 || body.length > (1 << 18)) return { ok: false, code: 'error.create.tooLarge', error: 'too large' };
      return { ok: true, name, path: `${options.root.path}/${name}/SKILL.md`, root: options.root.key };
    },
    deleteSkill: async (root, name, _log) => { captured.trashArgs = [root, name]; return { ok: true, id: '1700000000-00000000-0000-0000-0000-000000000000', name, deletedAt: '2023-11-04T12:00:00.000Z', root: { key: root.key, scope: 'user', label: root.label } }; },
    restoreTrash: async (id, _log, options) => { captured.restoreId = id; captured.restoreOptions = options; return { ok: true, id, name: 'restored-skill', root: { key: 'dsh', scope: 'user', label: 'DSH' } }; },
    permanentlyDeleteTrash: async (id, _log) => { captured.deleteId = id; return { ok: true, id, name: 'deleted-skill' }; },
    listTrash: async () => [],
    checkedWritableRootDefinition: async (root) => root,
    captured,
    ...overrides,
  };
}

async function handlerFor(core = {}, handlerCtx = {}) {
  const { ctx, connection, emitted } = mockContext(core);
  registerNativeSkills(ctx, core);
  const route = connection.registeredRoute;
  assert.ok(route, 'route handler registered');
  return { handler: route.fetch, connection, route, emitted, ctx, core };
}

test('native skills route uses its own path, not the copied standalone route id', () => {
  assert.equal(ROUTE, '/api/dsh-majed/skills');
  assert.notEqual(ROUTE, '/api/dsh-skills-manager');
});

test('native skills route is registered with GET/POST and is uncached', async () => {
  const { handler, connection } = await handlerFor(coreWith());
  const request = new Request('https://host' + ROUTE);
  const response = await handler(request);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(connection.registeredRoute.methods[0], 'GET');
  assert.equal(connection.registeredRoute.methods[1], 'POST');
});

test('native skills route does not expose the vendored client or updater', () => {
  assert.doesNotMatch(NATIVE_SKILLS_ROUTE, /dsh-skills-manager/);
});

test('GET list returns state snapshot with roots, projects and summary', async () => {
  const snapshot = { roots: [], projects: [], summary: { total: 3, enabled: 1, disabled: 2, issues: 0 } };
  const { handler } = await handlerFor(coreWith({ state: async () => snapshot }));
  const response = await handler(new Request('https://host' + ROUTE));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.deepEqual(body.data, snapshot);
});

test('GET list invokes state on every request so external edits refresh the catalog', async () => {
  let calls = 0;
  const { handler } = await handlerFor(coreWith({ state: async () => { calls++; return structuredClone(emptyState); } }));
  await handler(new Request('https://host' + ROUTE));
  await handler(new Request('https://host' + ROUTE));
  assert.equal(calls, 2, 'state must be re-read on every request (no cached catalog)');
});

test('GET list scopes project roots via projectCwds for agent-scoped inventories', async () => {
  let seenCwds;
  const { handler } = await handlerFor(coreWith({
    state: async (options) => { seenCwds = options.projectCwds; return structuredClone(emptyState); },
  }));
  await handler(new Request('https://host' + ROUTE + '?projectCwds=/a,/b'));
  assert.deepEqual(seenCwds, ['/a', '/b']);
});

test('GET list surfaces source and invocation policy per skill', async () => {
  const skills = [
    {
      name: 'unicode-skill-\u4e2d\u6587', declaredName: '\u4e2d\u6587\u6280\u80FD', description: 'Unicode skill',
      modelInvocable: true, userInvocable: true, invocationPolicyValid: true, hasFrontmatter: true,
      loadable: true, managerEnabled: true, managerOverride: null,
      effectiveModelInvocable: true, effectiveUserInvocable: true,
      diagnostics: [], path: '/home/dsh/skills/unicode-skill/SKILL.md', categoryId: null, linked: false,
      shadowedBy: null,
    },
    {
      name: 'disabled-skill', declaredName: 'disabled-skill', description: 'A disabled skill',
      modelInvocable: false, userInvocable: false, invocationPolicyValid: true, hasFrontmatter: true,
      loadable: true, managerEnabled: false, managerOverride: false,
      effectiveModelInvocable: false, effectiveUserInvocable: false,
      diagnostics: [], path: '/home/dsh/skills/disabled-skill/SKILL.md', categoryId: null, linked: false,
      shadowedBy: null,
    },
  ];
  const snapshot = {
    roots: [{ key: 'dsh', path: '/home/dsh/skills', label: 'DSH', mutable: true, toggleable: true, native: true, scope: 'user', skills, enabled: true }],
    projects: [], summary: { total: 2, enabled: 1, disabled: 1, issues: 0 },
  };
  const { handler } = await handlerFor(coreWith({ state: async () => snapshot }));
  const response = await handler(new Request('https://host' + ROUTE));
  const body = await response.json();
  const root = body.data.roots[0];
  assert.equal(root.skills.length, 2);
  const unicode = root.skills.find(s => s.name === 'unicode-skill-\u4e2d\u6587');
  assert.ok(unicode);
  assert.equal(unicode.declaredName, '\u4e2d\u6587\u6280\u80FD');
  assert.equal(unicode.effectiveModelInvocable, true);
  assert.equal(unicode.effectiveUserInvocable, true);
  const disabled = root.skills.find(s => s.name === 'disabled-skill');
  assert.ok(disabled);
  assert.equal(disabled.managerEnabled, false);
  assert.equal(disabled.effectiveModelInvocable, false);
  assert.equal(disabled.effectiveUserInvocable, false);
});

test('POST setEnabled calls setSkillEnabled and refreshes catalogs via public seam', async () => {
  let enabledArg;
  let setCalls = 0;
  const { handler, emitted } = await handlerFor(coreWith({
    setSkillEnabled: async (root, name, enabled) => { setCalls++; enabledArg = enabled; return { ok: true, root: root.key, name, enabled }; },
  }));
  const response = await handler(new Request('https://host' + ROUTE, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-dsh-majed-skills': '1' },
    body: JSON.stringify({ action: 'setEnabled', input: { root: 'dsh', name: 'fixture-skill', enabled: false } }),
  }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(setCalls, 1);
  assert.equal(enabledArg, false);
  assert.deepEqual(emitted, ['commands/change'], 'catalogs refreshed through public seam');
});

test('POST setEnabled enable does not grant source-denied privileges', async () => {
  let enabledArg;
  const { handler } = await handlerFor(coreWith({
    setSkillEnabled: async (root, name, enabled) => { enabledArg = enabled; return { ok: true, root: root.key, name, enabled }; },
    state: async () => ({
      roots: [{ key: 'dsh', path: '/home/dsh/skills', label: 'DSH', mutable: true, toggleable: true, native: true, scope: 'user', skills: [{
        name: 'frontmatter-off', declaredName: 'frontmatter-off', description: 'frontmatter disables model invocation',
        modelInvocable: false, userInvocable: true, invocationPolicyValid: true, hasFrontmatter: true,
        loadable: true, managerEnabled: true, managerOverride: null,
        effectiveModelInvocable: false, effectiveUserInvocable: true,
        diagnostics: [], path: '/home/dsh/skills/frontmatter-off/SKILL.md', categoryId: null, linked: false, shadowedBy: null,
      }] }],
      projects: [], summary: { total: 1, enabled: 1, disabled: 0, issues: 0 },
    }),
  }));
  const response = await handler(new Request('https://host' + ROUTE, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-dsh-majed-skills': '1' },
    body: JSON.stringify({ action: 'setEnabled', input: { root: 'dsh', name: 'frontmatter-off', enabled: true } }),
  }));
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(enabledArg, true);
  // Re-fetch confirms effective flags still reflect source (model invocation stays disabled by source)
  const list = await handler(new Request('https://host' + ROUTE));
  const listed = await list.json();
  const skill = listed.data.roots[0].skills[0];
  assert.equal(skill.managerEnabled, true);
  assert.equal(skill.effectiveModelInvocable, false, 'enable does not grant source-denied model invocation');
  assert.equal(skill.effectiveUserInvocable, true);
});

test('POST setEnabled protects read-only external sources', async () => {
  const { handler } = await handlerFor(coreWith({
    setSkillEnabled: async () => ({ ok: false, code: 'error.readonly.external', error: 'External source is read-only', statusCode: 403 }),
  }));
  const response = await handler(new Request('https://host' + ROUTE, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-dsh-majed-skills': '1' },
    body: JSON.stringify({ action: 'setEnabled', input: { root: 'dsh', name: 'external-skill', enabled: true } }),
  }));
  assert.equal(response.status, 403);
  const body = await response.json();
  assert.equal(body.ok, false);
  assert.equal(body.code, 'error.readonly.external');
});

test('POST detail inspects a skill via skillDetail', async () => {
  const { handler } = await handlerFor(coreWith({
    skillDetail: async (root, name) => ({ root, name, body: '# Skill\nBody text.', frontmatter: { 'disable-model-invocation': false } }),
  }));
  const response = await handler(new Request('https://host' + ROUTE, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-dsh-majed-skills': '1' },
    body: JSON.stringify({ action: 'detail', input: { root: 'dsh', name: 'fixture-skill' } }),
  }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.data.root, 'dsh');
  assert.equal(body.data.name, 'fixture-skill');
  assert.equal(body.data.body, '# Skill\nBody text.');
});

test('POST rejects missing marker, wrong content-type and invalid action', async () => {
  const { handler } = await handlerFor(coreWith());
  // no content-type
  let res = await handler(new Request('https://host' + ROUTE, { method: 'POST', body: JSON.stringify({ action: 'setEnabled', input: {} }) }));
  assert.equal(res.status, 415);
  // wrong content-type
  res = await handler(new Request('https://host' + ROUTE, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: 'x' }));
  assert.equal(res.status, 415);
  // missing marker
  res = await handler(new Request('https://host' + ROUTE, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'setEnabled', input: {} }) }));
  assert.equal(res.status, 403);
  // invalid action
  res = await handler(new Request('https://host' + ROUTE, { method: 'POST', headers: { 'content-type': 'application/json', 'x-dsh-majed-skills': '1' }, body: JSON.stringify({ action: 'nuke', input: {} }) }));
  assert.equal(res.status, 400);
});

test('GET/PUT/DELETE are method-limited', async () => {
  const { handler } = await handlerFor(coreWith());
  for (const method of ['PUT', 'DELETE', 'PATCH']) {
    const res = await handler(new Request('https://host' + ROUTE, { method }));
    assert.equal(res.status, 405, method + ' should be 405');
  }
});

test('malformed state fails closed without crashing the handler', async () => {
  const { handler } = await handlerFor(coreWith({
    state: async () => { throw Object.assign(new Error('state corrupt'), { statusCode: 500 }); },
  }));
  const response = await handler(new Request('https://host' + ROUTE));
  assert.equal(response.status, 500);
  const body = await response.json();
  assert.equal(body.ok, false);
  assert.equal(body.error, 'Skill operation failed.');
});

test('apply wires the route through registerSkills-style context', async () => {
  let route;
  const connection = { fetch: { register(value) { route = value; return () => {}; } } };
  const core = coreWith();
  const ctx = {
    reflect: { get: () => connection },
    inject(names, run) { run({ reflect: { get: () => connection }, emit: () => {}, effect(fn) { return fn(); } }); },
    effect(fn) { return fn(); },
  };
  await apply(ctx, core);
  assert.equal(route.path, ROUTE);
  assert.deepEqual(route.methods, ['GET', 'POST']);
});

test('native module does not activate copied provider, tool, client or updater ids', () => {
  assert.doesNotMatch(ROUTE, /skills-manager/);
  assert.notEqual(ROUTE, '/api/dsh-skills-manager');
});

function postJson(handler, payload, headers = {}) {
  return handler(new Request('https://host' + ROUTE, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-dsh-majed-skills': '1', ...headers },
    body: JSON.stringify(payload),
  }));
}

test('POST create validates kebab name, description and body are required', async () => {
  const { handler } = await handlerFor(coreWith());
  const cases = [
    [{ action: 'create', input: { root: 'dsh', name: '  ', description: 'd', body: 'b' } }, 'error.import.invalidName'],
    [{ action: 'create', input: { root: 'dsh', name: 'skill', description: '', body: 'b' } }, 'error.create.descriptionRequired'],
    [{ action: 'create', input: { root: 'dsh', name: 'skill', description: 'd', body: '' } }, 'error.create.bodyRequired'],
  ];
  for (const [payload, code] of cases) {
    const res = await postJson(handler, payload);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.ok, false);
    assert.equal(body.code, code);
  }
});

const KEBAB_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

test('POST create rejects names that cannot become a legal kebab path', async () => {
  const { handler } = await handlerFor(coreWith());
  for (const name of ['', '   ', '..', '.', '___', ' . ']) {
    const res = await postJson(handler, { action: 'create', input: { root: 'dsh', name, description: 'd', body: 'b' } });
    assert.equal(res.status, 400, name);
    const body = await res.json();
    assert.equal(body.code, 'error.import.invalidName', name);
  }
});

test('POST create requires description and body and enforces size limits', async () => {
  const { handler } = await handlerFor(coreWith());
  let res = await postJson(handler, { action: 'create', input: { root: 'dsh', name: 'skill', description: '', body: 'b' } });
  assert.equal(res.status, 400);
  let body = await res.json(); assert.equal(body.code, 'error.create.descriptionRequired');
  res = await postJson(handler, { action: 'create', input: { root: 'dsh', name: 'skill', description: 'd', body: '' } });
  assert.equal(res.status, 400);
  body = await res.json(); assert.equal(body.code, 'error.create.bodyRequired');
  res = await postJson(handler, { action: 'create', input: { root: 'dsh', name: 'skill', description: 'x'.repeat(501), body: 'b' } });
  assert.equal(res.status, 413);
  body = await res.json(); assert.equal(body.code, 'error.create.tooLarge');
  res = await postJson(handler, { action: 'create', input: { root: 'dsh', name: 'skill', description: 'd', body: 'x'.repeat((1 << 18) + 1) } });
  assert.equal(res.status, 413);
  body = await res.json(); assert.equal(body.code, 'error.create.tooLarge');
});

test('POST create preserves Unicode body/description and kebab-cases the filesystem name', async () => {
  const unicodeName = 'unicode-skill-\u4e2d\u6587';
  const unicodeBody = '# \u4e2d\u6587\u6280\u80FD\n\u6b63\u6587\u5185\u5bb9\u3002';
  const unicodeDesc = '\u4e2d\u6587\u7b80\u4ecb';
  const { handler, core } = await handlerFor(coreWith());
  const res = await postJson(handler, { action: 'create', input: { root: 'dsh', name: unicodeName, description: unicodeDesc, body: unicodeBody } });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.data.name, 'unicode-skill', 'non-ASCII name kebab-cased to filesystem-safe identifier');
  assert.equal(core.captured.createInput.name, unicodeName, 'original name passed through');
  assert.equal(core.captured.createInput.description, unicodeDesc, 'Unicode description preserved verbatim');
  assert.equal(core.captured.createInput.body, unicodeBody, 'Unicode body preserved verbatim');
  assert.equal(core.captured.createOptions.root.key, 'dsh');
  assert.equal(body.data.root, 'dsh');
});

test('POST create updates agent/slash inventories via public seam on success', async () => {
  const { handler, emitted } = await handlerFor(coreWith());
  const res = await postJson(handler, { action: 'create', input: { root: 'dsh', name: 'new-skill', description: 'd', body: 'b' } });
  assert.equal(res.status, 200);
  assert.deepEqual(emitted, ['commands/change'], 'catalogs refreshed through public seam');
});

test('POST create respects the single-owner collision gate', async () => {
  const { handler } = await handlerFor(coreWith({
    createSkill: async () => ({ ok: false, code: 'error.create.conflict', error: '同名技能已存在: skill', params: { name: 'skill' } }),
  }));
  const res = await postJson(handler, { action: 'create', input: { root: 'dsh', name: 'skill', description: 'd', body: 'b' } });
  assert.equal(res.status, 409);
  const body = await res.json();
  assert.equal(body.ok, false);
  assert.equal(body.code, 'error.create.conflict');
});

test('POST create protects read-only external sources', async () => {
  const { handler } = await handlerFor(coreWith({
    checkedWritableRootDefinition: async () => null,
  }));
  const res = await postJson(handler, { action: 'create', input: { root: 'dsh', name: 'skill', description: 'd', body: 'b' } });
  assert.equal(res.status, 403);
  const body = await res.json();
  assert.equal(body.ok, false);
  assert.equal(body.code, 'error.root.readonly');
});

test('POST create 404s for unknown root and rejects missing marker / wrong content-type', async () => {
  const { handler } = await handlerFor(coreWith({
    userRoots: () => [], projectRoots: async () => [],
  }));
  let res = await postJson(handler, { action: 'create', input: { root: 'nope', name: 'skill', description: 'd', body: 'b' } });
  assert.equal(res.status, 404);
  res = await handler(new Request('https://host' + ROUTE, { method: 'POST', body: JSON.stringify({ action: 'create', input: {} }) }));
  assert.equal(res.status, 415);
  res = await handler(new Request('https://host' + ROUTE, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'create', input: {} }) }));
  assert.equal(res.status, 403);
});

test('POST trash moves skill to trash and updates inventories', async () => {
  const { handler, emitted, core } = await handlerFor(coreWith());
  const res = await postJson(handler, { action: 'trash', input: { root: 'dsh', name: 'old-skill' } });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.data.id, '1700000000-00000000-0000-0000-0000-000000000000');
  assert.equal(body.data.name, 'old-skill');
  assert.deepEqual(core.captured.trashArgs[1], 'old-skill');
  assert.equal(core.captured.trashArgs[0].key, 'dsh');
  assert.deepEqual(emitted, ['commands/change']);
});

test('POST trash requires name, 404s unknown root, protects read-only and skill-not-found', async () => {
  const { handler } = await handlerFor(coreWith());
  let res = await postJson(handler, { action: 'trash', input: { root: 'dsh', name: '' } });
  assert.equal(res.status, 400);
  res = await postJson(handler, { action: 'trash', input: { root: 'nope', name: 'x' } });
  assert.equal(res.status, 404);
  const ro = await handlerFor(coreWith({ checkedWritableRootDefinition: async () => null }));
  res = await postJson(ro.handler, { action: 'trash', input: { root: 'dsh', name: 'x' } });
  assert.equal(res.status, 403);
  const nf = await handlerFor(coreWith({
    deleteSkill: async () => ({ ok: false, code: 'error.skill.notFound', error: '技能不存在: x', params: { name: 'x' } }),
  }));
  res = await postJson(nf.handler, { action: 'trash', input: { root: 'dsh', name: 'x' } });
  assert.equal(res.status, 404);
  const body = await res.json(); assert.equal(body.code, 'error.skill.notFound');
});

test('POST restore restores from trash preserving metadata and content', async () => {
  let restoreId, restoreOptions;
  const { handler, emitted } = await handlerFor(coreWith({
    restoreTrash: async (id, _log, options) => { restoreId = id; restoreOptions = options; return { ok: true, id, name: 'restored-skill', root: { key: 'dsh', scope: 'user', label: 'DSH' } }; },
  }));
  const res = await postJson(handler, { action: 'restore', input: { id: '1700000000-00000000-0000-0000-0000-000000000000', projectCwds: ['/proj'] } });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.data.id, '1700000000-00000000-0000-0000-0000-000000000000');
  assert.equal(body.data.name, 'restored-skill');
  assert.equal(restoreId, '1700000000-00000000-0000-0000-0000-000000000000');
  assert.deepEqual(restoreOptions.projectCwds, ['/proj']);
  assert.deepEqual(emitted, ['commands/change']);
});

test('POST restore handles not-found, conflict and project-unavailable explicitly', async () => {
  const { handler } = await handlerFor(coreWith());
  let res = await postJson(handler, { action: 'restore', input: { id: '' } });
  assert.equal(res.status, 400);
  const nf = await handlerFor(coreWith({
    restoreTrash: async () => ({ ok: false, code: 'error.trash.notFound', error: '回收站条目不存在: id', params: { id: 'id' } }),
  }));
  res = await postJson(nf.handler, { action: 'restore', input: { id: 'missing' } });
  assert.equal(res.status, 404);
  const body = await res.json(); assert.equal(body.code, 'error.trash.notFound');
  const cf = await handlerFor(coreWith({
    restoreTrash: async () => ({ ok: false, code: 'error.trash.conflict', error: '无法恢复，同名技能已存在: skill', params: { name: 'skill' } }),
  }));
  res = await postJson(cf.handler, { action: 'restore', input: { id: 'id' } });
  assert.equal(res.status, 409);
  const body2 = await res.json(); assert.equal(body2.code, 'error.trash.conflict');
  const pu = await handlerFor(coreWith({
    restoreTrash: async () => ({ ok: false, code: 'error.trash.projectUnavailable', error: '原项目目录当前不在活动工作区中，无法恢复', params: { path: '/proj' } }),
  }));
  res = await postJson(pu.handler, { action: 'restore', input: { id: 'id' } });
  assert.equal(res.status, 409);
});

test('POST delete permanently removes a trashed skill only with deliberate confirmation', async () => {
  const { handler, emitted, core } = await handlerFor(coreWith());
  // no confirm
  let res = await postJson(handler, { action: 'delete', input: { id: '1700000000-00000000-0000-0000-0000-000000000000' } });
  assert.equal(res.status, 400);
  // confirm false
  res = await postJson(handler, { action: 'delete', input: { id: 'id', confirm: false } });
  assert.equal(res.status, 400);
  // missing id
  res = await postJson(handler, { action: 'delete', input: { confirm: true } });
  assert.equal(res.status, 400);
  // deliberate confirmation
  res = await postJson(handler, { action: 'delete', input: { id: '1700000000-00000000-0000-0000-0000-000000000000', confirm: true } });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(core.captured.deleteId, '1700000000-00000000-0000-0000-0000-000000000000');
  assert.deepEqual(emitted, ['commands/change']);
  // not found
  const nf = await handlerFor(coreWith({
    permanentlyDeleteTrash: async () => ({ ok: false, code: 'error.trash.notFound', error: '回收站条目不存在: id', params: { id: 'id' } }),
  }));
  res = await postJson(nf.handler, { action: 'delete', input: { id: 'id', confirm: true } });
  assert.equal(res.status, 404);
});

test('POST listTrash returns trashed items sorted by deletion time', async () => {
  const trash = [
    { id: 'a', name: 'first', deletedAt: '2023-01-01T00:00:00.000Z', root: { key: 'dsh', scope: 'user', label: 'DSH' }, entries: ['SKILL.md'] },
    { id: 'b', name: 'second', deletedAt: '2023-02-01T00:00:00.000Z', root: { key: 'dsh', scope: 'user', label: 'DSH' }, entries: ['SKILL.md'] },
  ];
  const { handler } = await handlerFor(coreWith({ listTrash: async () => trash }));
  const res = await postJson(handler, { action: 'listTrash', input: {} });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.deepEqual(body.data, trash);
});

test('POST rejects unknown actions', async () => {
  const { handler } = await handlerFor(coreWith());
  const res = await postJson(handler, { action: 'nuke', input: {} });
  assert.equal(res.status, 400);
  const body = await res.json(); assert.equal(body.error, 'Invalid action.');
});
