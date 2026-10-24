import test from 'node:test';
import assert from 'node:assert/strict';
import { admitOwnerRequest, createManagerFetchHandler } from '../../modules/managers/transport.js';

const ownerConnection = { admit: () => ({ peer: { principal: { kind: 'owner' } } }) };
const baseUrl = 'http://127.0.0.1:1/api/dsh-majed/managers';
const post = (body, extraHeaders = {}) => new Request(baseUrl, {
  method: 'POST',
  headers: { 'content-type': 'application/json', ...extraHeaders },
  body: JSON.stringify(body),
});
const json = async res => res.json();

test('Owner admission is granted for local and remote but binds no provenance object to the admitted request', () => {
  const local = { socket: { remoteAddress: '127.0.0.1' }, headers: { host: '127.0.0.1:61823', origin: 'http://127.0.0.1:61823', 'x-dsh-majed-manager': '1', 'content-type': 'application/json' } };
  const remote = { socket: { remoteAddress: '10.0.0.5' }, headers: { host: '127.0.0.1:61823', origin: 'http://127.0.0.1:61823', 'x-dsh-majed-manager': '1', 'content-type': 'application/json' } };
  assert.equal(admitOwnerRequest(local, ownerConnection, true), undefined);
  assert.equal(admitOwnerRequest(remote, ownerConnection, true), undefined);
});

test('admission rejects non-Owner and unauthenticated requests without yielding provenance', () => {
  const nonOwner = { admit: () => ({ peer: { principal: { kind: 'browser' } } }) };
  const unauth = { admit: () => undefined };
  assert.equal(admitOwnerRequest(post({ action: 'updateHooks', input: {} }), nonOwner, true), 403);
  assert.equal(admitOwnerRequest(post({ action: 'updateHooks', input: {} }), unauth, true), 401);
});

test('exact Fetch callback is invoked with only the Request, never a Peer or provenance context', async () => {
  let sawInput; let sawPeer; let sawProvenance;
  const service = {
    snapshot: async () => ({}),
    updateHooks: async (input, peer, provenance) => { sawInput = input; sawPeer = peer; sawProvenance = provenance; return { ok: true }; },
  };
  const handler = createManagerFetchHandler(service);
  const res = await handler(post({ action: 'updateHooks', input: { enabled: true, deny: ['bash.*'] } }));
  assert.equal(res.status, 200);
  assert.deepEqual(sawInput, { enabled: true, deny: ['bash.*'] });
  assert.equal(sawPeer, undefined);
  assert.equal(sawProvenance, undefined);
});

test('Request carries no provenance fields: local and remote-proxy-shaped requests are indistinguishable at the callback', async () => {
  const results = [];
  const service = {
    snapshot: async () => ({}),
    updateHooks: async (input) => { results.push(input); return { ok: true }; },
  };
  const handler = createManagerFetchHandler(service);
  const local = post({ action: 'updateHooks', input: { enabled: true } }, { origin: 'http://127.0.0.1:61823' });
  const remote = post({ action: 'updateHooks', input: { enabled: true } }, { 'sec-fetch-site': 'same-origin' });
  assert.equal((await handler(local)).status, 200);
  assert.equal((await handler(remote)).status, 200);
  assert.deepEqual(results[0], results[1]);
});

test('forged Origin, manager marker and custom provenance labels are not evidence and are not checked by the Fetch handler', async () => {
  const service = { snapshot: async () => ({}), updateHooks: async () => ({ ok: true }) };
  const handler = createManagerFetchHandler(service);
  const body = { action: 'updateHooks', input: { enabled: true } };
  const forged = post(body, { origin: 'https://evil.test', 'x-dsh-majed-manager': '1', 'x-dsh-majed-provenance': 'local', 'dsh-original-locality': 'local', 'x-device-id': 'paired-device-123' });
  const clean = post(body);
  assert.equal((await handler(forged)).status, 200);
  assert.equal((await handler(clean)).status, 200);
});

test('no attestation contract exists at the seam: missing, invalid and stale attestation cannot be detected or rejected', async () => {
  const service = { snapshot: async () => ({}), updateHooks: async () => ({ ok: true }) };
  const handler = createManagerFetchHandler(service);
  const body = { action: 'updateHooks', input: { enabled: true } };
  const none = post(body);
  const invalid = post(body, { 'x-dsh-majed-attestation': 'not-an-attestation' });
  const stale = post(body, { 'x-dsh-majed-nonce': 'expired-nonce', 'x-dsh-majed-attestation': 'stale-attestation' });
  assert.equal((await handler(none)).status, 200);
  assert.equal((await handler(invalid)).status, 200);
  assert.equal((await handler(stale)).status, 200);
});

test('no nonce or sequence exists at the seam: identical replay is accepted, not detected', async () => {
  let calls = 0;
  const service = { snapshot: async () => ({}), updateHooks: async () => { calls += 1; return { ok: true }; } };
  const handler = createManagerFetchHandler(service);
  const body = { action: 'updateHooks', input: { enabled: true } };
  assert.equal((await handler(post(body))).status, 200);
  assert.equal((await handler(post(body))).status, 200);
  assert.equal(calls, 2);
});

test('no canonical scope binding exists at the seam: scope substitution is invisible', async () => {
  const service = { snapshot: async () => ({}), updateHooks: async () => ({ ok: true }) };
  const handler = createManagerFetchHandler(service);
  const a = post({ action: 'updateHooks', input: { enabled: true, scope: 'project-a' } });
  const b = post({ action: 'updateHooks', input: { enabled: true, scope: 'project-b' } });
  assert.equal((await handler(a)).status, 200);
  assert.equal((await handler(b)).status, 200);
});

test('Command hook Approval and execution fail closed: challenge/approve/run/test/event are not supported actions', async () => {
  const service = { snapshot: async () => ({}) };
  const handler = createManagerFetchHandler(service);
  for (const action of ['challenge', 'approve', 'run', 'test', 'event']) {
    const res = await handler(post({ action, input: {} }));
    assert.equal(res.status, 400, `${action} must be rejected`);
    assert.equal((await json(res)).error, 'Invalid action.');
  }
});

test('supported transport actions contain no Command hook Approval or execution surface', async () => {
  const service = { snapshot: async () => ({}), setEnabled: async () => ({ ok: true }), upsertServer: async () => ({ ok: true }), removeServer: async () => ({ ok: true }), updateHooks: async () => ({ ok: true }) };
  const handler = createManagerFetchHandler(service);
  assert.equal((await handler(post({ action: 'setEnabled', input: { kind: 'hooks', enabled: false } }))).status, 200);
  assert.equal((await handler(post({ action: 'challenge', input: {} }))).status, 400);
  assert.equal((await handler(post({ action: 'approve', input: {} }))).status, 400);
  assert.equal((await handler(post({ action: 'run', input: {} }))).status, 400);
  assert.equal((await handler(post({ action: 'test', input: {} }))).status, 400);
  assert.equal((await handler(post({ action: 'event', input: {} }))).status, 400);
});

test('these are isolated automated results with synthetic fixtures, not live evidence', async () => {
  const service = { snapshot: async () => ({}) };
  const handler = createManagerFetchHandler(service);
  const res = await handler(new Request(baseUrl, { method: 'GET' }));
  assert.equal(res.status, 200);
  assert.deepEqual(await json(res), {});
});
