import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { registerLocalTransport, MANAGERS_ROUTE } from '../modules/managers/transport.js';

test('manager client uses canonical API so native remote boot rewrites and authenticates it', async () => {
  const source = await readFile(new URL('../modules/managers/client.js', import.meta.url), 'utf8');
  let module, service;
  const requests = [];
  const location = new URL('https://example.dsh-market.com/remote/');
  // Native remote-channel-boot rewrites same-origin /api/* only, and attaches
  // its device credential only when that rewrite branch matches.
  const fetch = async (raw, init) => {
    const url = new URL(raw, location);
    assert.equal(url.origin, location.origin);
    assert.ok(url.pathname.startsWith('/api/'), 'must enter native remote API/auth rewrite');
    url.pathname = '/remote' + url.pathname;
    requests.push({ path: url.pathname, init });
    return { ok: true, json: async () => ({}) };
  };
  vm.runInNewContext(source, { fetch, window: { __ModuleLoader__: { load: entry => { module = entry.factory(() => ({ createElement: (type, props) => ({ type, props }) })); } } } });
  module.apply({ slots: { inject: (_name, cb) => cb(), register: (_contract, render) => { service = render().props.service; } } });
  await service.snapshot();
  await service.setEnabled({ kind: 'hooks', enabled: true });
  assert.deepEqual(requests.map(r => r.path), ['/remote/api/dsh-majed/managers', '/remote/api/dsh-majed/managers']);
  assert.equal(requests[1].init.credentials, 'same-origin');
});

test('manager registers an owner-authenticated native Fetch route and preserves JSON mutation fence', async () => {
  let route;
  const service = { snapshot: async () => ({ writable: true }), setEnabled: async input => ({ ok: true, state: input }) };
  registerLocalTransport({ inject: (_deps, cb) => cb({ reflect: { get: name => {
    assert.equal(name, 'connection');
    return { fetch: { register: value => { route = value; } } };
  } } }) }, service);
  assert.equal(MANAGERS_ROUTE, '/api/dsh-majed/managers');
  assert.equal(route.path, MANAGERS_ROUTE);
  assert.equal((await route.fetch(new Request('https://host/api/dsh-majed/managers'))).status, 200);
  const mutation = headers => route.fetch(new Request('https://host/api/dsh-majed/managers', { method: 'POST', headers, body: JSON.stringify({ action: 'setEnabled', input: { enabled: true } }) }));
  assert.equal((await mutation({ 'content-type': 'text/plain' })).status, 403);
  assert.equal((await mutation({ 'content-type': 'application/json' })).status, 200);
  assert.equal((await mutation({ origin: 'https://host', 'content-type': 'application/json', 'x-dsh-majed-manager': '1' })).status, 200);
});
