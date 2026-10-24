import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createManagerHandler } from '../modules/managers/transport.js';

test('real local HTTP serves redacted metadata and enforces mutation boundary', async t => {
  let toggles = 0;
  const server = http.createServer(createManagerHandler({
    snapshot: async () => ({ writable: true, servers: [], hooks: { enabled: false } }),
    setEnabled: async input => { toggles++; return { ok: true, state: { enabled: input.enabled } }; },
  }, { admit: req => req.headers.origin && req.headers.origin !== `http://${req.headers.host}` ? { rejection: 403 } : { peer: { principal: { kind: 'owner' } } } }));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(base);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual((await response.json()).servers, []);
  const post = headers => fetch(base, { method: 'POST', headers, body: JSON.stringify({ action: 'setEnabled', input: { kind: 'hooks', enabled: true } }) });
  assert.equal((await post({ 'content-type': 'application/json' })).status, 403);
  assert.equal((await post({ origin: 'http://evil.test', 'content-type': 'application/json', 'x-dsh-majed-manager': '1' })).status, 403);
  assert.equal(toggles, 0);
  const accepted = await post({ origin: base, 'content-type': 'application/json', 'x-dsh-majed-manager': '1' });
  assert.equal(accepted.status, 200);
  assert.equal((await accepted.json()).ok, true);
  assert.equal(toggles, 1);
  const replacement = await fetch(base, { method: 'POST', headers: { origin: base, 'content-type': 'application/json', 'x-dsh-majed-manager': '1' }, body: JSON.stringify({ action: 'update', input: {} }) });
  assert.equal(replacement.status, 400);
  assert.equal(toggles, 1);
});
