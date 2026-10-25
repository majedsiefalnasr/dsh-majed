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

function coreWith(overrides = {}) {
  return {
    state: async () => structuredClone(emptyState),
    setSkillEnabled: async () => ({ ok: true }),
    skillDetail: async ({ root, name } = {}) => ({ ok: true, root, name }),
    userRoots: () => [{ key: 'dsh', path: '/home/dsh/skills', label: 'DSH', mutable: true, toggleable: true, native: true, scope: 'user' }],
    projectRoots: async () => [],
    ...overrides,
  };
}

async function handlerFor(core = {}, handlerCtx = {}) {
  const { ctx, connection, emitted } = mockContext(core);
  registerNativeSkills(ctx, core);
  const route = connection.registeredRoute;
  assert.ok(route, 'route handler registered');
  return { handler: route.fetch, connection, route, emitted, ctx };
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
