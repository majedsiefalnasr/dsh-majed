import test from 'node:test';
import assert from 'node:assert/strict';
import { Context } from '@deepseek-ai/cordis';
import { apply } from '../../lib/management/settings.js';

test('aborted and timed-out body readers return even when cancellation never settles', async t => {
  const ctx = new Context(); let route;
  ctx.provide('connection', { fetch: { register(value) { route = value; } } });
  const fiber = ctx.plugin({ apply }); await fiber; t.after(() => fiber.dispose());
  const make = controller => new Request('http://fixture/api/majed/settings/status', { method: 'POST', duplex: 'half',
    signal: controller.signal, headers: { 'content-type': 'application/json' },
    body: new ReadableStream({ pull() { return new Promise(() => {}); }, cancel() { return new Promise(() => {}); } }) });
  const controller = new AbortController(); const pending = route.fetch(make(controller)); controller.abort();
  assert.equal((await pending).status, 408);
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const timed = route.fetch(make(new AbortController()));
  t.mock.timers.tick(5001);
  assert.equal((await timed).status, 408);
});
