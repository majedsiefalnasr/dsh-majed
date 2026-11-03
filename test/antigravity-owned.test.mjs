// #134 assembled host seam. All traffic, identities and credentials are fixtures.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { apply } from '../dist/subscriptions.js';

const settle = () => new Promise((resolve) => setImmediate(resolve));
function host(antigravity = { clientId: 'dummy-authorized-client' }) {
  const routes = new Map(),
    adapters = {},
    cleanups = [];
  const ctx = {
    logger: { warn() {} },
    llm: {
      registerAdapter(ids, adapter) {
        adapters[ids[0]] = adapter;
        return { replace() {} };
      },
    },
    get: () => ({
      fetch: {
        register(route) {
          routes.set(route.path, route);
          return () => routes.delete(route.path);
        },
      },
    }),
    effect(fn) {
      const cleanup = fn();
      if (cleanup) cleanups.push(cleanup);
    },
    inject(names, fn) {
      if (names.includes('connection')) fn(ctx);
    },
  };
  apply(ctx, {
    antigravity,
    models: { antigravity: [{ id: 'fixture-model', name: 'Fixture model' }] },
    pool: { enabled: false },
  });
  return {
    adapters,
    async call(endpoint, payload = {}) {
      const method = `majed-subscriptions.${endpoint}`;
      const response = await routes.get(`/api/${method}`).fetch(
        new Request(`http://localhost/api/${method}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            type: 'client-request',
            rpcId: 'fixture',
            method,
            payload: { provider: 'antigravity', ...payload },
          }),
        }),
      );
      return (await response.json()).result;
    },
    dispose() {
      cleanups.reverse().forEach((fn) => fn());
    },
  };
}

test('Antigravity assembled Google login, quotas, Manage, chat and logout use owned storage only', async () => {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed135-host-');
  const previous = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    url = String(url);
    calls.push({ url, init });
    if (url.includes('oauth2.googleapis.com/token'))
      return Response.json({
        access_token: 'fixture-access',
        refresh_token: 'fixture-refresh',
        expires_in: 3600,
      });
    if (url.endsWith('loadCodeAssist'))
      return Response.json({
        cloudaicompanionProject: 'fixture-project',
        currentTier: { name: 'Fixture plan' },
      });
    if (url.includes('userinfo'))
      return Response.json({ email: 'fixture@example.invalid' });
    if (url.endsWith('fetchAvailableModels'))
      return Response.json({
        models: { 'fixture-model': { quotaInfo: { remainingFraction: 0.75 } } },
      });
    if (url.includes('streamGenerateContent'))
      return new Response(
        'data: {"response":{"candidates":[{"content":{"parts":[{"text":"Fixture reply"}]},"finishReason":"STOP"}]}}\n\n',
      );
    throw new Error('unexpected fixture URL ' + url);
  };
  const mounted = host();
  try {
    assert.deepEqual(
      await mounted.adapters.antigravity.listModels('antigravity'),
      [],
    );
    assert.equal(calls.length, 0);
    const login = await mounted.call('login');
    assert.equal(login.ok, true);
    const url = new URL(login.value.authorizeUrl);
    assert.equal(url.hostname, 'accounts.google.com');
    const callback = new URL(url.searchParams.get('redirect_uri'));
    callback.searchParams.set('state', url.searchParams.get('state'));
    callback.searchParams.set('code', 'fixture-code');
    assert.equal(
      (await mounted.call('manual', { input: callback.href })).ok,
      true,
    );
    let status;
    for (let i = 0; i < 100; i++) {
      await new Promise((resolve) => setTimeout(resolve, 5));
      status = await mounted.call('status');
      if (!status.value.providers.antigravity.busy) break;
    }
    const account = status.value.providers.antigravity.accounts[0];
    assert.equal(account.account, 'fixture@example.invalid');
    assert.equal(JSON.stringify(status).includes('fixture-access'), false);
    assert.equal(
      (await mounted.call('usage', { account: account.key })).value.windows[0]
        .usedPercent,
      25,
    );
    const manage = await mounted.call('providerSettings');
    assert.equal(manage.value.provider, 'antigravity');
    assert.equal(manage.value.accounts[0].key, account.key);
    const chunks = [];
    for await (const chunk of mounted.adapters.antigravity.stream({
      provider: 'antigravity',
      model: 'fixture-model',
      messages: [],
      signal: new AbortController().signal,
    }))
      chunks.push(chunk);
    assert.match(JSON.stringify(chunks), /Fixture reply/);
    assert.equal(
      (await mounted.call('logout', { account: account.key })).ok,
      true,
    );
    assert.deepEqual(
      await mounted.adapters.antigravity.listModels('antigravity'),
      [],
    );
  } finally {
    mounted.dispose();
    globalThis.fetch = previous;
  }
});

test('zero-config Antigravity is available without HTTP or exposing its bundled identity', async () => {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-oauth-default-');
  const id = process.env.ANTIGRAVITY_CLIENT_ID,
    secret = process.env.ANTIGRAVITY_CLIENT_SECRET;
  delete process.env.ANTIGRAVITY_CLIENT_ID;
  delete process.env.ANTIGRAVITY_CLIENT_SECRET;
  const previous = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    throw new Error('HTTP forbidden');
  };
  let mounted;
  try {
    mounted = host({});
    const status = (await mounted.call('status')).value.providers.antigravity;
    assert.ok(status.setupRequired === false);
    assert.ok(
      ['antigravity', 'codex', 'claude', 'grok', 'copilot'].every(
        (provider) => mounted.adapters[provider],
      ),
    );
    assert.equal(requests, 0);
  } finally {
    mounted?.dispose();
    globalThis.fetch = previous;
    if (id === undefined) delete process.env.ANTIGRAVITY_CLIENT_ID;
    else process.env.ANTIGRAVITY_CLIENT_ID = id;
    if (secret === undefined) delete process.env.ANTIGRAVITY_CLIENT_SECRET;
    else process.env.ANTIGRAVITY_CLIENT_SECRET = secret;
  }
});

test('malformed Antigravity overrides retain expired sessions without HTTP or blocking other providers', async () => {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-oauth-setup-');
  const { saveAccountSession, getAccountSession } = await import(
    '../dist/auth/store.js'
  );
  const session = {
    accessToken: 'dummy-access',
    refreshToken: 'dummy-refresh',
    expiresAt: 1,
    projectId: 'dummy-project',
    account: 'dummy-account',
  };
  await saveAccountSession('antigravity', 'dummy', session);
  const previous = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    throw new Error('HTTP forbidden');
  };
  try {
    for (const config of [
      { clientSecret: 'dummy-unpaired' },
      { clientId: 42 },
      { clientId: 'bad id' },
    ]) {
      const mounted = host(config);
      try {
        assert.ok(
          ['codex', 'claude', 'grok', 'copilot'].every(
            (provider) => mounted.adapters[provider],
          ),
        );
        const status = (await mounted.call('status')).value.providers
          .antigravity;
        assert.equal(status.setupRequired, true);
        assert.equal(status.accounts.length, 1);
        assert.equal((await mounted.call('login')).ok, false);
        assert.equal(
          (await mounted.call('usage', { account: 'dummy' })).ok,
          false,
        );
        assert.deepEqual(
          await mounted.adapters.antigravity.listModels('antigravity'),
          [],
        );
        await mounted.call('providerSettings');
        await assert.rejects(async () => {
          for await (const chunk of mounted.adapters.antigravity.stream({
            provider: 'antigravity',
            model: 'fixture-model',
            messages: [],
            signal: new AbortController().signal,
          })) {
          }
        });
        assert.deepEqual(
          await getAccountSession('antigravity', 'dummy'),
          session,
        );
      } finally {
        mounted.dispose();
      }
    }
    assert.equal(requests, 0);
    const mounted = host({ clientSecret: 'dummy-unpaired' });
    try {
      assert.equal(
        (await mounted.call('logout', { account: 'dummy' })).ok,
        true,
      );
      assert.equal(await getAccountSession('antigravity', 'dummy'), undefined);
    } finally {
      mounted.dispose();
    }
  } finally {
    globalThis.fetch = previous;
  }
});

test('Antigravity token body cancellation releases its reader', async () => {
  const { exchangeAntigravityCode } = await import(
    '../dist/providers/antigravity.js'
  );
  let cancelled = false;
  const body = new ReadableStream({
    pull() {},
    cancel() {
      cancelled = true;
    },
  });
  const controller = new AbortController();
  const work = exchangeAntigravityCode(
    'fixture',
    'verifier',
    'http://localhost/callback',
    { clientId: 'fixture' },
    {},
    async () => new Response(body),
    controller.signal,
  );
  await settle();
  controller.abort(new Error('fixture cancellation'));
  await assert.rejects(work, /fixture cancellation/);
  assert.equal(cancelled, true);
  assert.equal(body.locked, false);
});

test('Antigravity explicit account entries isolate Google tokens and project envelopes', async () => {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed135-isolation-');
  const { saveAccountSession } = await import('../dist/auth/store.js');
  for (const key of ['a', 'b'])
    await saveAccountSession('antigravity', key, {
      accessToken: `fixture-${key}`,
      refreshToken: 'fixture-refresh',
      expiresAt: 4000000000000,
      projectId: `project-${key}`,
      account: `fixture-${key}`,
    });
  const previous = globalThis.fetch,
    wire = [];
  globalThis.fetch = async (url, init) => {
    wire.push({
      authorization: init.headers.authorization,
      body: JSON.parse(init.body),
    });
    return new Response(
      'data: {"response":{"candidates":[{"content":{"parts":[{"text":"ok"}]},"finishReason":"STOP"}]}}\n\n',
    );
  };
  const mounted = host();
  try {
    const settings = (await mounted.call('providerSettings')).value.settings;
    await mounted.call('setProviderSettings', {
      settings: {
        ...settings,
        accounts: {
          a: { independentEntry: true, poolEnabled: false },
          b: { independentEntry: true, poolEnabled: false },
        },
      },
    });
    const models = await mounted.adapters.antigravity.listModels('antigravity');
    const chosen = models.find((m) => m.name.includes('fixture-b'));
    assert.ok(chosen);
    for await (const chunk of mounted.adapters.antigravity.stream({
      provider: 'antigravity',
      model: chosen.id,
      messages: [],
      signal: new AbortController().signal,
    })) {
    }
    assert.equal(wire.length, 1);
    assert.equal(wire[0].authorization, 'Bearer fixture-b');
    assert.equal(wire[0].body.project, 'project-b');
  } finally {
    mounted.dispose();
    globalThis.fetch = previous;
  }
});
