import test from 'node:test';
import assert from 'node:assert/strict';
import { Context } from '@deepseek-ai/cordis';
import { mkdtemp, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { apply } from '../../lib/management/settings.js';

test('invalid, oversized and scoped requests do not mutate readiness or leak paths', async t => {
  const ctx = new Context(); let route;
  ctx.provide('connection', { fetch: { register(value) { route = value; } } });
  const fiber = ctx.plugin({ apply }); await fiber; t.after(() => fiber.dispose());
  const request = (body, headers = { 'content-type': 'application/json' }) => route.fetch(new Request('http://fixture/api/majed/settings/status', { method: 'POST', headers, body }));
  const call = payload => request(JSON.stringify({ type: 'client-request', method: 'majed/settings/status', rpcId: 'safe-id', payload }));
  assert.equal((await request('x'.repeat(4097))).status, 413);
  assert.equal((await request('{}', { 'content-type': 'text/plain' })).status, 415);
  assert.equal((await request('{')).status, 400);
  for (const payload of [{ module: 'unknown' }, { module: 'skills', enabled: 'true' }, { module: 'skills', path: '/private/secret' }]) {
    const response = await call(payload); assert.equal((await response.json()).result.error.code, 'invalid_request');
  }
  const home = await mkdtemp(join(tmpdir(), 'majed-settings-')); t.after(() => rm(home, { recursive: true, force: true }));
  const projectPath = await realpath(home);
  const header = { id: 'session', cwd: projectPath };
  const workspace = { path: projectPath, sessionIds: ['session'] };
  ctx.provide('sessions', { get: id => id === 'session' ? { header } : undefined });
  ctx.provide('sessionPersistence', { stat: async () => undefined });
  ctx.provide('workspaceRegistry', { get: id => id === 'workspace' ? workspace : undefined });
  const scoped = await call({ module: 'skills', enabled: true, sessionId: 'session', workspaceId: 'workspace' });
  const text = await scoped.text(); assert.doesNotMatch(text, new RegExp(home));
  assert.equal(JSON.parse(text).result.value.scope, 'project');
  workspace.sessionIds = [];
  assert.equal((await (await call({ module: 'skills', enabled: false, sessionId: 'session', workspaceId: 'workspace' })).json()).result.error.code, 'scope_not_found');
  assert.equal((await (await call({ module: 'skills' })).json()).result.value.enabled, true, 'rejected scope cannot change enablement');
});

test('wrong method and wrong path are rejected without mutating readiness', async t => {
  const ctx = new Context(); let route;
  ctx.provide('connection', { fetch: { register(value) { route = value; } } });
  const fiber = ctx.plugin({ apply }); await fiber; t.after(() => fiber.dispose());
  const envelope = JSON.stringify({ type: 'client-request', method: 'majed/settings/status', rpcId: 'x', payload: { module: 'skills' } });
  // GET on the status path -> 405 method not allowed (method fence precedes body parsing)
  assert.equal((await route.fetch(new Request('http://fixture/api/majed/settings/status', { method: 'GET' }))).status, 405);
  // POST to a suffixed path -> 404 not found (exact route, no prefix repair)
  assert.equal((await route.fetch(new Request('http://fixture/api/majed/settings/status/extra', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: envelope }))).status, 404);
  // Readiness untouched by rejected requests
  const call = payload => route.fetch(new Request('http://fixture/api/majed/settings/status', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'client-request', method: 'majed/settings/status', rpcId: 'safe-id', payload }) }));
  assert.equal((await (await call({ module: 'skills' })).json()).result.value.enabled, false);
});
