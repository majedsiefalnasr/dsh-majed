import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { admitOwnerRequest, createManagerHandler, createManagerFetchHandler, registerLocalTransport, MANAGERS_ROUTE } from '../modules/managers/transport.js';
const owner = { admit: () => ({ peer: { principal: { kind: 'owner' } } }) };
const remote = { socket: { remoteAddress: '192.0.2.9' }, headers: { host: 'dsh-market.example', origin: 'https://dsh-market.example', 'content-type': 'application/json', 'x-dsh-majed-manager': '1' } };
test('authenticated remote owner is admitted; missing authentication fails closed', () => {
  assert.equal(admitOwnerRequest(remote, owner, true), undefined);
  assert.equal(admitOwnerRequest(remote), 401);
  assert.equal(admitOwnerRequest(remote, { admit: () => ({ rejection: 401 }) }), 401);
  assert.equal(admitOwnerRequest(remote, { admit: () => ({ rejection: 403 }) }), 403);
  assert.equal(admitOwnerRequest(remote, { admit: () => ({ peer: { principal: { kind: 'agent' } } }) }), 403);
  assert.equal(admitOwnerRequest({ ...remote, headers: {} }, owner, true), 403);
});
test('DSH admission denial wins even with spoofed proxy and loopback headers', () => {
  const request = { ...remote, socket: { remoteAddress: '127.0.0.1' }, headers: { ...remote.headers, 'x-forwarded-for': '127.0.0.1' } };
  let actual;
  assert.equal(admitOwnerRequest(request, { admit: req => { actual = req; return { rejection: 403 }; } }), 403);
  assert.equal(actual, request);
});
async function invoke(action, connection = owner) {
  const req = Object.assign(Readable.from([JSON.stringify({ action, input: { enabled: true } })]), remote, { method: 'POST' });
  let status, body;
  const service = Object.fromEntries(['setEnabled', 'upsertServer', 'removeServer', 'updateHooks'].map(name => [name, async () => ({ ok: true, action: name })]));
  await createManagerHandler(service, connection)(req, { writeHead: code => { status = code; }, end: text => { body = JSON.parse(text); } });
  return { status, body };
}
test('all explicit management actions dispatch; arbitrary methods never dispatch', async () => {
  for (const action of ['setEnabled', 'upsertServer', 'removeServer', 'updateHooks']) assert.equal((await invoke(action)).status, 200);
  for (const action of ['constructor', 'snapshot', 'update']) assert.equal((await invoke(action)).status, 400);
  assert.equal((await invoke('setEnabled', {})).status, 401);
});
test('native owner-admitted Fetch mutations survive remote proxy header filtering', async () => {
  let calls = 0;
  const handler = createManagerFetchHandler({ upsertServer: async input => { calls++; return { ok: true, state: input }; } });
  // Installed remote proxy deliberately forwards only these browser-safe fields
  // (plus an inner auth cookie consumed by Connection, never by this handler).
  const headers = { host: '127.0.0.1:57164', 'sec-fetch-site': 'same-origin', 'content-type': 'application/json' };
  const body = JSON.stringify({ action: 'upsertServer', input: { server: { serverName: 'majed_demo', transport: 'stdio', command: '/absolute/node', args: ['fixture', 'one', 'two'] } } });
  const response = await handler(new Request('http://dsh.internal/api/dsh-majed/managers', { method: 'POST', headers, body }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
  assert.equal(calls, 1);
  for (const contentType of ['text/plain', 'application/x-www-form-urlencoded']) {
    const rejected = await handler(new Request('http://dsh.internal/api/dsh-majed/managers', { method: 'POST', headers: { ...headers, 'content-type': contentType }, body }));
    assert.equal(rejected.status, 403);
    assert.equal((await rejected.json()).code, 'MANAGER_JSON_REQUIRED');
  }
  assert.equal(calls, 1);
  // The legacy raw HTTP handler still requires its original Origin/marker fence.
  assert.equal(admitOwnerRequest({ ...remote, headers }, owner, true), 403);
});
test('production route requires the owner-authenticated Connection Fetch registry', async () => {
  let registered, dependencies;
  const ctx = { inject: (deps, cb) => { dependencies = deps; cb({ reflect: { get: key => { assert.equal(key, 'connection'); return { fetch: { register: route => { registered = route; } } }; } } }); } };
  registerLocalTransport(ctx, {});
  assert.deepEqual(dependencies, ['connection']);
  assert.equal(registered.path, MANAGERS_ROUTE);
  assert.deepEqual(registered.methods, ['GET', 'POST']);
});
