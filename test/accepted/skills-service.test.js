import test from 'node:test';
import assert from 'node:assert/strict';

test('production Skills service rejects client paths before any filesystem operation', async () => {
  const { apply } = await import('../../modules/skills/service.js');
  let route;
  const owner = { connection: { fetch: { register(value) { route = value; } } }, get() {}, effect(run) { run(); },
    inject(_names, run) { run(owner); } };
  apply(owner);
  const response = await route.fetch(new Request('https://fixture/api/majed/skills', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'client-request', rpcId: 'scope', method: 'majed/skills',
      payload: { action: 'list', input: { projectCwds: ['/foreign'] } } }),
  }));
  assert.equal((await response.json()).result.error.code, 'invalid_request');
});
