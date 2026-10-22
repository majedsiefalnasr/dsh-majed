import test from 'node:test';
import assert from 'node:assert/strict';
import { Context } from '@deepseek-ai/cordis';
import * as plugin from '../index.js';

async function mount(t) {
  const ctx = new Context();
  const routes = new Map();
  ctx.provide('tools', { execute() { throw new Error('No tool execution during baseline loading.'); } });
  ctx.provide('webServer', { register(route) {
    assert.equal(routes.has(route.path), false);
    routes.set(route.path, route);
    return () => routes.delete(route.path);
  } });
  const fiber = ctx.plugin(plugin, {});
  t.after(() => fiber.dispose());
  await fiber;
  await new Promise(resolve => setImmediate(resolve));
  return { ctx, fiber, routes };
}

function response() {
  return { status: undefined, headers: {}, body: undefined,
    writeHead(status, headers = {}) { this.status = status; this.headers = headers; },
    end(body) { this.body = body; } };
}

test('baseline public host entry registers only fonts and releases them on disposal', async t => {
  const { ctx, fiber, routes } = await mount(t);
  assert.deepEqual([...routes.keys()], ['/plugins/dsh-majed/fonts']);
  let original = 0;
  const dispatch = () => ctx.serial('tools/execute', { name: 'unrelated' }, () => { original++; return 'original'; });
  assert.equal(await dispatch(), 'original');
  await fiber.dispose();
  assert.equal(routes.size, 0);
  await dispatch();
  assert.equal(original, 1, 'disposed tool listener cannot intercept a call');
});

test('font endpoint preserves GET, HEAD, content policy and invalid-path rejection', async t => {
  const { routes } = await mount(t);
  const handler = routes.get('/plugins/dsh-majed/fonts').handler;
  const url = '/plugins/dsh-majed/fonts/inter-latin-wght-normal.woff2';
  const get = response(); await handler({ method: 'GET', url }, get);
  assert.equal(get.status, 200);
  assert.ok(Buffer.isBuffer(get.body) && get.body.length > 0);
  assert.equal(get.headers['content-type'], 'font/woff2');
  assert.equal(get.headers['cache-control'], 'public, max-age=31536000, immutable');
  const head = response(); await handler({ method: 'HEAD', url }, head);
  assert.equal(head.status, 200); assert.equal(head.body, undefined);
  for (const [method, path, status] of [
    ['POST', url, 405], ['GET', '/plugins/dsh-majed/fonts/%ZZ', 400],
    ['GET', '/plugins/dsh-majed/fonts/%2e%2e%2fpackage.json', 404],
    ['GET', '/plugins/dsh-majed/fonts/missing.woff2', 404], ['GET', '/wrong/font.woff2', 404],
  ]) {
    const res = response(); await handler({ method, url: path }, res);
    assert.equal(res.status, status, path); assert.equal(res.body, undefined);
  }
});
