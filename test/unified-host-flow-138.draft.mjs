// registered UI -> actual host routes/controllers -> dummy HTTP/credential IO.
// No status revision is fabricated; the real controller must persist each admission.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { create, act } from 'react-test-renderer';
import { readFile, mkdtemp } from 'node:fs/promises';
import { apply } from '../dist/subscriptions.js';

const code = await readFile(
  new URL('../dist/subscriptions-client.js', import.meta.url),
  'utf8',
);
const dict = JSON.parse(
  await readFile(new URL('../locale/en.json', import.meta.url), 'utf8'),
).subscriptions;
const turn = () => new Promise((resolve) => setImmediate(resolve));
const jwt = (claims) =>
  `e30.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.dummy`;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

async function fixture(provider) {
  process.env.DSH_HOME = await mkdtemp('/tmp/waycraft-ui-host-138-');
  const routes = new Map(),
    cleanups = [],
    calls = [],
    timers = new Set(),
    live = new Map(),
    denied = [];
  let imported,
    identity = 'first',
    mode = 'success',
    release,
    focused = 0,
    renderer,
    dictionary;
  const originalFetch = globalThis.fetch;
  const tokenBody = () => ({
    access_token: 'dummy-access',
    refresh_token: 'dummy-refresh',
    expires_in: 3600,
    id_token: jwt({
      email: `${identity}@example.invalid`,
      'https://api.openai.com/auth': {
        chatgpt_account_id: identity,
        chatgpt_plan_type: 'plus',
      },
    }),
    account: { email_address: `${identity}@example.invalid` },
  });
  globalThis.fetch = async (url, init) => {
    url = String(url);
    if (url.includes('openid-configuration'))
      return Response.json({
        authorization_endpoint: 'https://accounts.x.ai/authorize',
        token_endpoint: 'https://accounts.x.ai/token',
      });
    if (url.endsWith('/login/device/code'))
      return Response.json({
        device_code: 'dummy-private',
        user_code: 'DUMMY-CODE',
        verification_uri: 'https://github.com/login/device',
        interval: 0.001,
      });
    if (
      url.endsWith('/login/oauth/access_token') ||
      url.endsWith('/oauth/token') ||
      url === 'https://accounts.x.ai/token' ||
      url.includes('oauth2.googleapis.com/token')
    ) {
      if (mode === 'hold' || provider === 'copilot')
        await new Promise((resolve) => {
          release = resolve;
        });
      if (mode === 'failure')
        return Response.json({ error: 'invalid_grant' }, { status: 400 });
      return Response.json(
        provider === 'copilot' ? { access_token: 'dummy-github' } : tokenBody(),
      );
    }
    if (url.includes('/api/oauth/profile'))
      return Response.json({
        account: { email: `${identity}@example.invalid` },
        organization: { organization_type: 'claude_pro' },
      });
    if (url.endsWith('loadCodeAssist'))
      return Response.json({
        cloudaicompanionProject: 'dummy-project',
        currentTier: { name: 'Dummy' },
      });
    if (url.includes('userinfo'))
      return Response.json({ email: `${identity}@example.invalid` });
    if (url.endsWith('/user')) return Response.json({ login: identity });
    if (url.endsWith('/copilot_internal/v2/token'))
      return Response.json({ token: 'dummy-copilot', expires_at: 4000000000 });
    if (url.includes('/api/releases/stable')) return Response.json(['1.107.0']);
    // Existing grouped cards request usage on membership change, never during auth alone.
    if (
      url.includes('/usage') ||
      url.includes('/billing') ||
      url.endsWith('fetchAvailableModels') ||
      url.includes('reset_credits')
    )
      return Response.json({});
    denied.push(url);
    throw Error('unexpected dummy HTTP request');
  };
  const host = {
    logger: { warn() {} },
    llm: {
      registerAdapter() {
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
    inject(names, fn) {
      if (names.includes('connection')) fn(host);
    },
    effect(fn) {
      const off = fn();
      if (off) cleanups.push(off);
    },
  };
  const io = {
    platform: 'linux',
    credentialsFilePath: () => '/dummy/claude.json',
    readFileRaw: () => imported,
    readKeychainRaw() {
      throw Error('Keychain forbidden');
    },
    getKeychainAccountName() {
      throw Error('Keychain forbidden');
    },
    writeFileRaw() {
      throw Error('credential write-back forbidden');
    },
    writeKeychainRaw() {
      throw Error('Keychain forbidden');
    },
  };
  apply(
    host,
    {
      antigravity: { clientId: 'dummy-authorized-client' },
      models: Object.fromEntries(
        ['codex', 'claude', 'grok', 'antigravity', 'copilot'].map((p) => [
          p,
          [{ id: 'dummy-model', name: 'Dummy' }],
        ]),
      ),
      pool: { enabled: false },
    },
    { claudeCredsIo: io },
  );
  async function rpc(_channel, method, payload = {}) {
    if (method === 'subscriptions-auth.proxyGet') throw Error('HTTP 404');
    calls.push({ method, payload });
    const route = routes.get(`/api/${method}`);
    assert.ok(route, `registered route ${method}`);
    const response = await route.fetch(
      new Request(`http://localhost/api/${method}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'client-request',
          rpcId: 'dummy',
          method,
          payload,
        }),
      }),
    );
    return (await response.json()).result;
  }
  const connection = {
    rpc: { call: rpc },
    state: { subscribe: () => () => {}, getSnapshot: () => 'connected' },
  };
  let api;
  vm.runInNewContext(code + '\nresult(waycraftSubscriptionsFactory);', {
    result: (factory) => {
      api = factory((id) =>
        id === 'react'
          ? React
          : id === 'react/jsx-runtime'
            ? jsxRuntime
            : {
                IconSettingsOutlineMedium: 'svg',
                SegmentedControl: ({ options, value, onChange, disabled }) =>
                  React.createElement(
                    'div',
                    { role: 'tablist' },
                    ...options.map((o) =>
                      React.createElement(
                        'button',
                        {
                          key: o.value,
                          disabled,
                          role: 'tab',
                          'aria-selected': value === o.value,
                          onClick: () => onChange(o.value),
                        },
                        o.label,
                      ),
                    ),
                  ),
              },
      );
    },
    window: {
      open() {},
      localStorage: { getItem: () => null },
      addEventListener() {},
      removeEventListener() {},
    },
    navigator: {
      clipboard: {
        writeText: async (value) => assert.equal(value, 'DUMMY-CODE'),
      },
    },
    setInterval: (fn) => {
      timers.add(fn);
      return fn;
    },
    clearInterval: (fn) => timers.delete(fn),
    Error,
  });
  const ctx = {
    get: () => connection,
    effect: (fn) => {
      const off = fn();
      if (off) cleanups.push(off);
    },
    locale: {
      register: (_, dictionaries) => {
        dictionary = dictionaries.en;
        return () => {};
      },
      bind: () => (key) => dictionary[key],
    },
    slots: {
      inject: (_, fn) => fn(),
      register: (options, component) => {
        live.set(options.id, component);
        return () => live.delete(options.id);
      },
    },
    inject(names, fn) {
      if (names.includes('remote.settings') || names.includes('commandUi'))
        return;
      return fn(ctx);
    },
  };
  api.applySubscriptions(ctx);
  const status = async () =>
    (await rpc('api', 'waycraft-subscriptions.status')).value.providers[
      provider
    ];
  async function until(predicate, label) {
    for (let i = 0; i < 150; i++) {
      if (await predicate()) return;
      await turn();
    }
    assert.fail(label);
  }
  await until(() => live.has('waycraft-subscriptions'), 'section registration');
  await act(async () => {
    renderer = create(React.createElement(live.get('waycraft-subscriptions')), {
      createNodeMock: (node) =>
        node.type === 'button'
          ? {
              focus() {
                focused++;
              },
            }
          : null,
    });
    await turn();
  });
  const buttons = (key) =>
    renderer.root.findAll(
      (n) => n.type === 'button' && n.children.join('') === dict[key],
    );
  const click = async (key) => {
    const button = buttons(key).at(-1);
    assert.ok(button, key);
    assert.equal(!!button.props.disabled, false, key);
    await act(async () => {
      button.props.onClick();
      await turn();
    });
  };
  const tick = async () => {
    await act(async () => {
      for (const fn of [...timers]) fn();
      await turn();
    });
  };
  const group = () =>
    renderer.root.findAll(
      (n) =>
        n.type === 'li' &&
        n.props['data-waycraft-subscription-row'] === provider,
    );
  return {
    calls,
    denied,
    status,
    until,
    tick,
    click,
    buttons,
    group,
    get renderer() {
      return renderer;
    },
    get focused() {
      return focused;
    },
    set identity(value) {
      identity = value;
    },
    set mode(value) {
      mode = value;
    },
    importCredentials() {
      imported = JSON.stringify({
        claudeAiOauth: {
          accessToken: 'dummy-import',
          refreshToken: 'dummy-refresh',
          expiresAt: 4000000000000,
          emailAddress: `${identity}@example.invalid`,
          scopes: ['user:inference'],
        },
      });
    },
    async open() {
      await click('apiAdd');
      await click('apiSubscription');
      const select = renderer.root
        .findAllByType('select')
        .find((n) => n.props['aria-label'] === dict.apiSubscription);
      await act(async () =>
        select.props.onChange({ target: { value: provider } }),
      );
    },
    async start(key) {
      await click(key ?? 'login');
      await until(
        async () => (await status()).busy || buttons('apiAdd').length === 1,
        'login reached controller',
      );
    },
    async submit(input) {
      const field = renderer.root
        .findAllByType('input')
        .find((n) => n.props['aria-label'] === dict.pasteCallback);
      assert.ok(field, 'manual callback reachable');
      await act(async () => field.props.onChange({ target: { value: input } }));
      await click('submitCallback');
    },
    async complete() {
      if (provider === 'copilot') {
        await until(() => !!release, 'device poll');
        release();
        release = undefined;
      } else {
        const url = new URL((await status()).pendingAuth.authorizeUrl);
        const callback = new URL(url.searchParams.get('redirect_uri'));
        callback.searchParams.set('state', url.searchParams.get('state'));
        callback.searchParams.set('code', 'dummy-code');
        await this.submit(callback.href);
      }
    },
    async releaseLate() {
      release?.();
      release = undefined;
      await turn();
    },
    async dispose() {
      if (renderer) await act(async () => renderer.unmount());
      renderer = undefined;
      cleanups.reverse().forEach((fn) => fn?.());
      release?.();
      globalThis.fetch = originalFetch;
      assert.equal(routes.size, 0);
      assert.equal(timers.size, 0);
    },
  };
}

for (const provider of ['codex', 'claude', 'grok', 'antigravity', 'copilot']) {
  test(`${provider}: registered UI admits new and same identities through real host controllers`, async () => {
    const f = await fixture(provider);
    try {
      for (const [identity, count] of [
        ['first', 1],
        ['first', 1],
        ['second', 2],
      ]) {
        f.identity = identity;
        await f.open();
        const prior = await f.status();
        await f.start(
          prior.accounts.length
            ? ['claude', 'grok'].includes(provider)
              ? 'addAccountOAuth'
              : 'addAccount'
            : 'login',
        );
        await f.complete();
        await f.until(
          async () => !(await f.status()).busy,
          'controller settles',
        );
        await f.tick();
        const status = await f.status();
        assert.equal(
          status.accounts.length,
          count,
          'real persisted admission, including same-identity replacement',
        );
        assert.equal(
          status.authRevision,
          prior.authRevision + 1,
          'controller supplies successful outcome',
        );
        assert.equal(f.buttons('apiAdd').length, 1, 'real status closes Add');
        assert.equal(f.group().length, 1, 'one configured group');
        assert.ok(
          f
            .group()[0]
            .findAllByType('button')
            .some((n) => n.children.join('') === `${count} ${dict.connected}`),
          'existing group refreshes without remount',
        );
        assert.equal(
          f.group()[0].findAllByType('input').length,
          0,
          'callback exists only in Add',
        );
      }
      assert.ok(
        f.focused >= 3,
        'completion invokes Add focus callback (not DOM focus proof)',
      );
      assert.ok(
        f.calls.some(
          (c) => c.method.endsWith('.login') && c.payload.provider === provider,
        ),
      );
      assert.deepEqual(f.denied, []);
    } finally {
      await f.dispose();
    }
  });
}
