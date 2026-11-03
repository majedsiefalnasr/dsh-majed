import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveAntigravityOAuthConfig } from '../dist/providers/antigravity.js';

test('bundled OAuth defaults resolve without setup; overrides are validated and never combine sources', () => {
  const id = process.env.ANTIGRAVITY_CLIENT_ID,
    secret = process.env.ANTIGRAVITY_CLIENT_SECRET;
  delete process.env.ANTIGRAVITY_CLIENT_ID;
  delete process.env.ANTIGRAVITY_CLIENT_SECRET;
  try {
    const defaults = resolveAntigravityOAuthConfig();
    // Boolean-only assertions must never serialize bundled identity on failure.
    assert.ok(
      typeof defaults?.clientId === 'string' && defaults.clientId.length > 0,
    );
    assert.ok(
      typeof defaults?.clientSecret === 'string' &&
        defaults.clientSecret.length > 0,
    );
    const empty = resolveAntigravityOAuthConfig({});
    assert.ok(
      empty?.clientId === defaults?.clientId &&
        empty?.clientSecret === defaults?.clientSecret,
    );
    for (const config of [
      { clientSecret: 'dummy' },
      { clientId: 12 },
      { clientId: 'bad id' },
      { clientId: 'dummy', clientSecret: 12 },
    ])
      assert.equal(resolveAntigravityOAuthConfig(config), undefined);
    process.env.ANTIGRAVITY_CLIENT_ID = 'dummy-env';
    process.env.ANTIGRAVITY_CLIENT_SECRET = 'dummy-env-secret';
    assert.deepEqual(resolveAntigravityOAuthConfig(), {
      clientId: 'dummy-env',
      clientSecret: 'dummy-env-secret',
    });
    assert.deepEqual(
      resolveAntigravityOAuthConfig({ clientId: 'dummy-config' }),
      { clientId: 'dummy-config' },
    );
    assert.equal(
      resolveAntigravityOAuthConfig({ clientSecret: 'dummy-unpaired' }),
      undefined,
    );
  } finally {
    if (id === undefined) delete process.env.ANTIGRAVITY_CLIENT_ID;
    else process.env.ANTIGRAVITY_CLIENT_ID = id;
    if (secret === undefined) delete process.env.ANTIGRAVITY_CLIENT_SECRET;
    else process.env.ANTIGRAVITY_CLIENT_SECRET = secret;
  }
});
