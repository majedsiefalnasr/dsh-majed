// #134 missing lifecycle/error boundaries. Synthetic HTTP and temporary owned store only.
import { test, before, after } from 'node:test';
let keepAlive;
before(() => { keepAlive = setInterval(() => {}, 1000); });
after(() => clearInterval(keepAlive));
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { DeviceFlowManager } from '../dist/auth/device-flow.js';
import { CopilotAuthController } from '../dist/auth/copilot-controller.js';
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const code = { device_code: 'fixture-private', user_code: 'PUBLIC', verification_uri: 'https://github.com/login/device', interval: 0.001, expires_in: 0.03 };
const spec = fetchFn => ({ clientId: 'fixture', scope: '', deviceCodeUrl: 'https://fixture/device', tokenUrl: 'https://fixture/token', fetchFn });

test('acquisition fetch and body time out, release ownership and consume late rejection', async () => {
  const unhandled = []; const listener = error => unhandled.push(error);
  process.on('unhandledRejection', listener);
  try {
    await Promise.all(['fetch', 'body'].map(async phase => {
      let rejectLate;
      const hung = new Promise((_, reject) => { rejectLate = reject; });
      const manager = new DeviceFlowManager();
      const start = manager.start('copilot', spec(async () => phase === 'fetch' ? hung : { ok: true, json: () => hung }));
      await assert.rejects(start, /timed out/);
      assert.equal(manager.isBusy('copilot'), false);
      rejectLate(new Error('fixture-private-token'));
    }));
    await pause(10); assert.deepEqual(unhandled, []);
  } finally { process.off('unhandledRejection', listener); }
});

for (const phase of ['fetch', 'body']) test(`expiry bounds hung poll ${phase}; cancel A/start B ignores late A failure`, async () => {
  const manager = new DeviceFlowManager(); let rejectLate;
  const hung = new Promise((_, reject) => { rejectLate = reject; });
  const a = await manager.start('copilot', spec(async url => url.endsWith('/device') ? Response.json(code) : phase === 'fetch' ? hung : { json: () => hung }));
  await assert.rejects(a.waitToken(), /expired/);
  assert.equal(manager.isBusy('copilot'), false);
  const b = await manager.start('copilot', spec(async url => Response.json(url.endsWith('/device') ? { ...code, expires_in: 1 } : { error: 'authorization_pending' })));
  rejectLate(new Error('fixture-private-token')); await pause(5);
  assert.equal(manager.pending('copilot'), b);
  b.cancel(); await assert.rejects(b.waitToken(), /cancelled/);
});

for (const phase of ['acquisition-fetch', 'acquisition-body', 'poll-fetch', 'poll-body', 'denial', 'unknown']) test(`${phase} failure never surfaces upstream secret`, async () => {
  const manager = new DeviceFlowManager();
  const secret = 'fixture-upstream-private-token';
  const fetchFn = async url => {
    const acquisition = url.endsWith('/device');
    if (phase === `${acquisition ? 'acquisition' : 'poll'}-fetch`) throw new Error(secret);
    if (phase === `${acquisition ? 'acquisition' : 'poll'}-body`) return { ok: true, json: async () => { throw new Error(secret); } };
    if (acquisition) return Response.json({ ...code, expires_in: 1 });
    return Response.json({ error: phase === 'denial' ? 'access_denied' : secret, error_description: secret });
  };
  let caught;
  try { const a = await manager.start('copilot', spec(fetchFn)); await a.waitToken(); } catch (error) { caught = error; }
  assert.ok(caught); assert.equal(String(caught).includes(secret), false);
  assert.equal(manager.isBusy('copilot'), false);
});

test('slow_down delays subsequent polling by five seconds, then denial settles safely', async () => {
  const times = []; const manager = new DeviceFlowManager();
  const a = await manager.start('copilot', spec(async url => {
    if (url.endsWith('/device')) return Response.json({ ...code, expires_in: 10 });
    times.push(Date.now()); return Response.json({ error: times.length === 1 ? 'slow_down' : 'access_denied', error_description: 'fixture-secret' });
  }));
  await assert.rejects(a.waitToken(), /declined/);
  assert.equal(times.length, 2); assert.ok(times[1] - times[0] >= 4900);
  assert.equal(manager.isBusy('copilot'), false);
});

for (const phase of ['acquisition', 'poll']) test(`controller dispose during ${phase} cancels real engine and prevents restart`, async () => {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t134/dispose-');
  const original = globalThis.fetch; let entered;
  const atBoundary = new Promise(resolve => { entered = resolve; });
  globalThis.fetch = async url => {
    if (String(url).endsWith('/login/device/code') && phase === 'poll') return Response.json({ ...code, expires_in: 1 });
    entered(); return new Promise(() => {});
  };
  const flows = new DeviceFlowManager();
  const controller = new CopilotAuthController(flows, () => assert.fail('disposed login must not change accounts'), () => 'safe failure');
  try {
    const login = controller.login();
    const result = phase === 'acquisition' ? assert.rejects(login, /cancelled/) : login;
    await atBoundary; controller.dispose(); await result; await pause(5);
    assert.equal(flows.isBusy('copilot'), false);
    assert.deepEqual((await controller.status()).accounts, []);
    await assert.rejects(controller.login(), /disabled/);
  } finally { controller.dispose(); globalThis.fetch = original; }
});

for (const action of ['cancel', 'dispose']) test(`${action} during token completion prevents late account save and unhandled rejection`, async () => {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t134/late-');
  const original = globalThis.fetch; let release, entered;
  const blocked = new Promise(resolve => { release = resolve; });
  const atExchange = new Promise(resolve => { entered = resolve; });
  const errors = []; const listener = error => errors.push(error); process.on('unhandledRejection', listener);
  globalThis.fetch = async url => {
    if (String(url).includes('/api/releases/stable')) return Response.json(['1.107.0']);
    if (String(url).endsWith('/copilot_internal/v2/token')) { entered(); await blocked; return Response.json({ token: 'fixture-late-token', expires_at: 4000000000 }); }
    if (String(url).endsWith('/user')) return Response.json({ login: 'fixture-late-owner' });
    throw new Error('unexpected fixture endpoint');
  };
  let changed = 0;
  const attempt = { verificationUrl: 'https://github.com/login/device', userCode: 'PUBLIC', waitToken: async () => 'fixture-github-token', cancel() {} };
  const controller = new CopilotAuthController({ start: async () => attempt, pending: () => attempt }, () => { changed++; }, () => 'safe failure');
  try {
    await controller.login(); await atExchange; controller[action](); release();
    await pause(30);
    const status = await controller.status();
    assert.deepEqual(status.accounts, []); assert.equal(status.busy, false); assert.equal(changed, 0);
    assert.deepEqual(errors, []);
    if (action === 'dispose') await assert.rejects(controller.login(), /disabled/);
  } finally { release(); globalThis.fetch = original; process.off('unhandledRejection', listener); }
});
