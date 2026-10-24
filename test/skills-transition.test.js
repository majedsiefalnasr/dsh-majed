import test from 'node:test';
import assert from 'node:assert/strict';
import { Context, Service } from '@deepseek-ai/cordis';
import { registerSkills, SKILLS_OWNERSHIP, SKILLS_GATE_ROUTE } from '../modules/skills/index.js';

const enabled = { skills: { enabled: true, standaloneDisabled: true } };
function capture(load) {
  let run;
  registerSkills({ inject(names, callback) { if (names.includes('skills')) run = callback; } }, enabled, load);
  return run;
}

test('Skills setup does not return arbitrary lifecycle effects and reports async failures', async () => {
  for (const load of [() => { throw new Error('load failed'); }, async () => ({ async apply() { throw new Error('apply failed'); } })]) {
    const errors = [];
    assert.equal(capture(load)({ effect(fn) { fn(); }, logger: { error(error) { errors.push(error); } } }), undefined);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(errors.length, 1);
    assert.match(errors[0].message, /failed/);
  }
});

test('gate exposes static source headers without changing existing response contract', async () => {
  let route;
  registerSkills({ inject(names, run) { run({ reflect: { get: () => ({ fetch: { register(value) { route = value; } } }) } }); } });
  const response = route.fetch(new Request('https://host' + SKILLS_GATE_ROUTE));
  const body = await response.text();
  assert.equal(response.headers.get('x-dsh-skills-owner'), 'dsh-majed');
  assert.equal(response.headers.get('x-dsh-skills-source'), 'Majed Skills');
  assert.equal(SKILLS_OWNERSHIP.replaces, '@michengai/dsh-skills-manager');
  assert.equal(Object.isFrozen(SKILLS_OWNERSHIP), true);
  assert.deepEqual(JSON.parse(body), { enabled: false });
  assert.equal(route.path, SKILLS_GATE_ROUTE);
});

test('gate fails shut when authenticated native Fetch registration is unavailable', () => {
  for (const connection of [undefined, {}, { admit: () => ({ rejection: 401 }) }]) {
    assert.throws(() => registerSkills({ inject(_names, run) { run({ reflect: { get: () => connection } }); } }));
  }
});

test('real Cordis disposes routes and ignores setup resolved after teardown', async () => {
  const ctx = new Context();
  const routes = new Set();
  let finish, applied = 0;
  ctx.provide('webServer', { register(route) { routes.add(route); return () => routes.delete(route); } });
  class Connection extends Service {
    constructor(ctx) { super(ctx, 'connection', true); }
    get fetch() { return { register: route => this.ctx.effect(() => { routes.add(route); return () => routes.delete(route); }) }; }
  }
  new Connection(ctx);
  for (const service of ['skills', 'tools', 'sessions']) ctx.provide(service, {});
  const fiber = ctx.plugin((pluginCtx) => {
    registerSkills(pluginCtx, enabled, () => new Promise(resolve => { finish = resolve; }));
  });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(routes.size, 1);
  const disposing = fiber.dispose();
  await new Promise(resolve => setImmediate(resolve));
  finish({ apply() { applied++; } });
  await disposing;
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(routes.size, 0);
  assert.equal(applied, 0);
});
