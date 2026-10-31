// #134 final lifecycle regressions: synthetic HTTP only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withAbortSignal } from '../dist/providers/common.js';
import { latestVsCodeVersion, FALLBACK_VSCODE_VERSION, exchangeCopilotToken, completeCopilotLogin } from '../dist/providers/copilot.js';

test('hung version fetch and body fall back, release shared inflight, and recover on retry', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  for (const body of [false, true]) {
    let calls = 0;
    const hung = () => new Promise(() => {});
    const fake = async () => { calls++; return body ? { ok: true, json: hung } : hung(); };
    let result = 'pending';
    const first = latestVsCodeVersion(fake, true);
    const shared = latestVsCodeVersion(fake, true);
    void Promise.all([first, shared]).then(value => { result = value; });
    for (let i = 0; i < 20; i++) await Promise.resolve();
    t.mock.timers.tick(30000);
    for (let i = 0; i < 20; i++) await Promise.resolve();
    assert.notEqual(result, 'pending', 'feed fetch AND body must settle at deadline');
    assert.deepEqual(result, [FALLBACK_VSCODE_VERSION, FALLBACK_VSCODE_VERSION]);
    assert.equal(calls, 1);
  }
  assert.equal(await latestVsCodeVersion(async () => Response.json(['1.200.0']), true), '1.200.0');
});

test('cancelling a version waiter preserves the shared consumer', async () => {
  let release;
  const feed = new Promise(resolve => { release = resolve; });
  let calls = 0;
  const fake = async () => { calls++; return feed; };
  const controller = new AbortController();
  const cancelled = withAbortSignal(() => latestVsCodeVersion(fake, true), controller.signal);
  const healthy = latestVsCodeVersion(fake, true);
  controller.abort(new Error('fixture abort'));
  await assert.rejects(cancelled, /fixture abort/);
  release(Response.json(['1.201.0']));
  assert.equal(await healthy, '1.201.0');
  assert.equal(calls, 1);
});

test('discovery-off streaming abort and idle deadline interrupt a hung version feed without inference', async () => {
  const { CopilotAdapter } = await import('../dist/providers/copilot.js?final-stream');
  const original = globalThis.fetch;
  let inference = 0;
  globalThis.fetch = async () => { inference++; throw new Error('unexpected inference'); };
  try {
    for (const cancel of [true, false]) {
      const controller = new AbortController();
      const adapter = new CopilotAdapter({ models: [{ id: 'fixture', wire: 'responses' }], discovery: false,
        streamIdleTimeoutMs: 20, tokens: { session: async () => ({ accessToken: 'synthetic', refreshToken: 'synthetic', expiresAt: 4000000000000 }) },
        fetchFn: async () => new Promise(() => {}) });
      const pending = (async () => { for await (const _ of adapter.stream({ provider: 'copilot', model: 'fixture', messages: [], signal: controller.signal })) {} })();
      if (cancel) setTimeout(() => controller.abort(new Error('fixture abort')), 5);
      await assert.rejects(pending);
    }
    assert.equal(inference, 0);
  } finally { globalThis.fetch = original; }
});

test('exchange and login profile fetch/body settle on cancellation and deadline', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  for (const profile of [false, true]) for (const body of [false, true]) {
    const controller = new AbortController();
    let entered = false;
    const fake = async url => {
      if (String(url).includes('/api/releases/')) return Response.json(['1.200.0']);
      if (profile && String(url).includes('/copilot_internal/')) return Response.json({ token: 'synthetic', expires_at: 4000000000 });
      entered = true;
      return body ? { ok: true, json: () => new Promise(() => {}) } : new Promise(() => {});
    };
    const operation = profile ? completeCopilotLogin : exchangeCopilotToken;
    let settled = false;
    const pending = operation('synthetic', fake, controller.signal).then(() => { settled = true; }, () => { settled = true; });
    for (let i = 0; i < 40; i++) await Promise.resolve();
    assert.equal(entered, true);
    if (body) controller.abort(new Error('fixture cancellation'));
    else t.mock.timers.tick(10000);
    for (let i = 0; i < 40; i++) await Promise.resolve();
    assert.equal(settled, true, `profile=${profile} body=${body}`);
    await pending;
  }
});
