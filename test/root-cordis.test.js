import test from 'node:test';
import assert from 'node:assert/strict';
import { Context, Service } from '@deepseek-ai/cordis';
import * as root from '../index.js';
import { MANAGERS_ROUTE } from '../modules/managers/transport.js';
import { SKILLS_GATE_ROUTE } from '../modules/skills/index.js';

for (const withEditor of [false, true]) {
  test(`root keeps manager metadata mounted with real Cordis (editor ${withEditor ? 'present' : 'absent'})`, async t => {
    const ctx = new Context();
    const routes = new Map();
    ctx.provide('tools', {});
    class Connection extends Service {
      constructor(ctx) { super(ctx, 'connection', true); }
      get fetch() { return { register: route => this.ctx.effect(() => { routes.set(route.path, route); return () => routes.delete(route.path); }) }; }
    }
    new Connection(ctx);
    ctx.provide('webServer', { register(route) {
      routes.set(route.path, route);
      return () => routes.delete(route.path);
    } });
    if (withEditor) ctx.provide('configEditor', {
      entries: () => [],
      edit: () => { throw new Error('Read-only regression must not write configuration.'); },
    });
    const fiber = ctx.plugin(root, {});
    t.after(() => fiber.dispose());
    await fiber;
    // Nested inject fibers settle independently of the root callback.
    await new Promise(resolve => setImmediate(resolve));
    assert.ok(routes.has(SKILLS_GATE_ROUTE));
    assert.ok(routes.has('/plugins/dsh-majed/fonts'));
    assert.ok(routes.has(MANAGERS_ROUTE), 'manager route must survive injection initialization');
    const response = await routes.get(MANAGERS_ROUTE).fetch(new Request('http://127.0.0.1:50346' + MANAGERS_ROUTE));
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.writable, false);
    assert.deepEqual(payload.servers, []);
    assert.equal(payload.hooks.enabled, false);
    await fiber.dispose();
    assert.equal(routes.size, 0, 'root disposal must clean up every route');
  });
}
