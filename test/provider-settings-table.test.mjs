import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { test } from 'node:test';
import { Context } from '@deepseek-ai/cordis';
import {
  HostConnectionService,
  Peer,
} from '@deepseek-ai/dsh-client-connection';
import { apply } from '../dist/subscriptions.js';

// The providers that share the own-catalog settings read; every one must answer the same shape.
const OWN_CATALOG = ['antigravity', 'copilot'];

test('own-catalog providers answer providerSettings through one implementation with the same shape', async () => {
  process.env.DSH_HOME = await mkdtemp('/tmp/waycraft-t160-ps-');
  const root = new Context();
  const service = new HostConnectionService(root, [], {
    isAuthenticated: () => true,
    authenticateApi: () => undefined,
  });
  const ctx = {
    logger: { warn() {} },
    llm: { registerAdapter: () => ({ replace() {} }) },
    get: (name) => (name === 'connection' ? service : undefined),
    effect: (fn) => fn(),
    inject: (names, fn) => {
      if ([].concat(names).every((name) => name === 'connection')) fn(ctx);
    },
  };
  apply(ctx, { codexClientVersion: '1.2.3', models: { codex: [] } });
  const handler = service.createSharedFetchHandler('/api');
  const owner = new Peer(root, { principal: { kind: 'owner' } });
  for (const provider of OWN_CATALOG) {
    const response = await handler.fetch(
      new Request(
        'http://127.0.0.1/api/waycraft-subscriptions.providerSettings',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            type: 'client-request',
            rpcId: provider,
            method: 'waycraft-subscriptions.providerSettings',
            payload: { provider },
          }),
        },
      ),
      owner,
    );
    const { result } = await response.json();
    assert.equal(result.ok, true, `${provider}: ${JSON.stringify(result)}`);
    assert.equal(result.value.provider, provider);
    assert.ok(Array.isArray(result.value.models), provider);
    assert.ok(Array.isArray(result.value.accounts), provider);
    assert.ok(Array.isArray(result.value.tools), provider);
  }
});
