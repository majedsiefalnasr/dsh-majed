// Preparatory source-contract probe, not a Manager implementation or live acceptance test.
// Run with the installed Electron Node runtime so ASAR module resolution remains native.
const assert = require('node:assert/strict');
const { join } = require('node:path');
const base = process.argv[2];
if (!base) throw new Error('Pass the installed DSH runtime directory as the only argument.');
const load = name => require(join(base, 'node_modules', '@deepseek-ai', name, 'lib/index.js'));
const { Context } = load('cordis');
const { HostConnectionService } = load('dsh-client-connection');
const { SkillRegistry, isModelInvocable, isUserInvocable } = load('dsh-skill');
const { createScope } = load('dsh-scope');
const checks = [];

async function main() {
  const ctx = new Context();
  const fibers = [];
  const scopes = [];
  const mount = async plugin => {
    const fiber = ctx.plugin(plugin);
    fibers.push(fiber);
    await fiber;
    return fiber;
  };
  try {
    let connection;
    // This stub is intentionally NOT BrowserAuth: no credential service, login or network is used.
    await mount({ apply(owner) {
      connection = new HostConnectionService(owner, [], {
        isAuthenticated: request => request.headers.get('x-fixture-owner') === 'yes',
        authenticateApi: () => undefined,
      });
    } });
    let deliveries = 0;
    let argumentCount;
    const path = '/api/dsh-majed/research-probe';
    const routeFiber = await mount({ inject: ['connection'], apply(owner) {
      owner.connection.fetch.register({ path, methods: ['POST'], requestBody: 'buffered',
        fetch: function (request) {
          argumentCount = arguments.length;
          deliveries++;
          return Promise.resolve(Response.json({ ok: true, fixture: request.headers.get('x-fixture-source') }));
        },
      });
    } });
    const carrier = connection.createSharedFetchHandler('/api');
    const request = (extra = {}, route = path) => new Request('http://dsh.internal' + route, {
      method: 'POST', headers: { host: '127.0.0.1:1', 'content-type': 'application/json', ...extra }, body: '{}',
    });
    assert.equal(connection.admit(request()).rejection, 401);
    assert.equal(connection.admit(request({ host: 'attacker.invalid', 'x-fixture-owner': 'yes' })).rejection, 403);
    assert.equal(connection.admit(request({ origin: 'https://attacker.invalid', 'x-fixture-owner': 'yes' })).rejection, 403);
    assert.equal(connection.admit(request({ 'sec-fetch-site': 'cross-site', 'x-fixture-owner': 'yes' })).rejection, 403);
    assert.equal(deliveries, 0);
    checks.push('native Host/Origin fence and unauthenticated rejection with synthetic authenticator');
    const admitted = connection.admit(request({ 'x-fixture-owner': 'yes' }));
    assert.equal(admitted.peer.principal.kind, 'owner');
    const nonOwner = connection.createPeer({ principal: { kind: 'fixture-non-owner' } });
    assert.equal((await carrier.fetch(request(), nonOwner)).status, 403);
    for (const label of ['local', 'remote']) {
      const req = request({ 'x-fixture-owner': 'yes', 'x-fixture-source': label });
      const admission = connection.admit(req);
      assert.equal(admission.peer, admitted.peer, 'client labels cannot establish transport provenance');
      assert.equal((await carrier.fetch(req, admission.peer)).status, 200);
      assert.equal(argumentCount, 1, 'exact Fetch callback receives Request only');
    }
    assert.equal((await carrier.fetch(request({}, '/remote' + path), admitted.peer)).status, 404);
    checks.push('Owner-only exact Fetch dispatch; client source labels share a Peer; prefix is not native routing');
    await nonOwner.dispose();
    await routeFiber.dispose();
    assert.equal((await carrier.fetch(request(), admitted.peer)).status, 404);
    checks.push('caller-fiber disposal removes the exact route');

    await mount(SkillRegistry);
    let control;
    let lists = 0;
    let enabled = true;
    const candidate = () => ({ name: 'probe-skill', description: 'Synthetic catalog entry',
      invocation: { modelInvocable: enabled, userInvocable: true }, source: 'fixture',
      provider: 'majed-research', rank: 400, locator: 'fixture' });
    const providerFiber = await mount({ inject: ['skills'], apply(owner) {
      owner.skills.registerProvider(c => {
        control = c;
        return { name: 'majed-research',
          async list() { lists++; return [candidate()]; },
          async get() { return { ...candidate(), content: 'Synthetic instructions.' }; },
        };
      });
    } });
    await mount({ inject: ['skills'], async apply(owner) {
      const first = await owner.skills.list({ cwd: '/synthetic/workspace-a' });
      assert.equal(isModelInvocable(first[0]), true);
      await owner.skills.list({ cwd: '/synthetic/workspace-a' });
      assert.equal(lists, 1);
      enabled = false;
      control.invalidate();
      const next = await owner.skills.list({ cwd: '/synthetic/workspace-a' });
      assert.equal(isModelInvocable(next[0]), false);
      assert.equal(isUserInvocable(next[0]), true);
      assert.equal(lists, 2);
      await owner.skills.list({ cwd: '/synthetic/workspace-b' });
      assert.equal(lists, 3, 'workspace lookup has a separate cache key');
      const key = {};
      const scope = createScope(owner, key);
      scopes.push(scope);
      scope.ctx.skills.register({ name: 'scope-only', description: 'Synthetic scoped entry',
        source: 'fixture', content: 'Synthetic scoped instructions.',
        invocation: { modelInvocable: true, userInvocable: false } });
      assert.equal((await owner.skills.list()).some(x => x.name === 'scope-only'), false);
      assert.equal((await owner.skills.list({ scope: key })).some(x => x.name === 'scope-only'), true);
      await scope.dispose();
      assert.equal((await owner.skills.list({ scope: key })).some(x => x.name === 'scope-only'), false);
    } });
    checks.push('real SkillRegistry invocation flags, provider invalidation, cwd cache separation and scoped disposal');
    await providerFiber.dispose();
    assert.equal(control.signal.aborted, true);
    await mount({ inject: ['skills'], async apply(owner) {
      assert.deepEqual(await owner.skills.list(), [], 'disposed provider cannot remain in cached catalogs');
    } });
    checks.push('provider disposal aborts lifecycle signal and removes cached catalog entries');
    console.log(JSON.stringify({ runtime: require(join(base, 'package.json')).version,
      node: process.versions.node, checks, limitations: [
        'Synthetic authenticator and principals; not real BrowserAuth or HTTP/browser admission.',
        'No remote tunnel, Settings renderer, native filesystem watcher or MCP lifecycle executed.',
        'No session/project authorization proof: cwd and skill scope are lookup inputs, not admission.',
        'No trusted local/remote provenance: exact Fetch receives only Request.',
        'Preparation only: this probe does not complete T02A or its live acceptance requirements.',
      ] }, null, 2));
  } finally {
    for (const scope of scopes.reverse()) await scope.dispose();
    for (const fiber of fibers.reverse()) await fiber.dispose();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
