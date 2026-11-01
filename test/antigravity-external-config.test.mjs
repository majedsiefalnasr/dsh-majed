import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveAntigravityOAuthConfig } from '../dist/providers/antigravity.js';

test('external OAuth configuration is optional, validated, and never combines sources', () => {
  const id = process.env.ANTIGRAVITY_CLIENT_ID, secret = process.env.ANTIGRAVITY_CLIENT_SECRET;
  delete process.env.ANTIGRAVITY_CLIENT_ID; delete process.env.ANTIGRAVITY_CLIENT_SECRET;
  try {
    assert.ok(resolveAntigravityOAuthConfig() === undefined);
    for (const config of [{clientSecret:'dummy'}, {clientId:12}, {clientId:'bad id'}, {clientId:'dummy',clientSecret:12}]) assert.equal(resolveAntigravityOAuthConfig(config), undefined);
    process.env.ANTIGRAVITY_CLIENT_ID = 'dummy-env'; process.env.ANTIGRAVITY_CLIENT_SECRET = 'dummy-env-secret';
    assert.deepEqual(resolveAntigravityOAuthConfig(), {clientId:'dummy-env',clientSecret:'dummy-env-secret'});
    assert.deepEqual(resolveAntigravityOAuthConfig({clientId:'dummy-config'}), {clientId:'dummy-config'});
    assert.equal(resolveAntigravityOAuthConfig({clientSecret:'dummy-unpaired'}), undefined);
  } finally {
    if (id === undefined) delete process.env.ANTIGRAVITY_CLIENT_ID; else process.env.ANTIGRAVITY_CLIENT_ID=id;
    if (secret === undefined) delete process.env.ANTIGRAVITY_CLIENT_SECRET; else process.env.ANTIGRAVITY_CLIENT_SECRET=secret;
  }
});
