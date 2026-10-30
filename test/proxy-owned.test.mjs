import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat } from 'node:fs/promises';
import { proxyGetConfig, proxySetConfig, resetProxyForTests, proxyTestConnection } from '../dist/http.js';
test('owned proxy preserves omitted password and never returns it; URL credentials are rejected', async () => {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t130/proxy-');
  await resetProxyForTests();
  try {
    const secret = 'fixture-password-only';
    const saved = await proxySetConfig({ enabled: true, url: 'https://proxy.example.test:8443', username: 'fixture', password: secret, bypass: ['localhost'] });
    assert.equal(saved.passwordSet, true); assert.equal(JSON.stringify(saved).includes(secret), false);
    const next = await proxySetConfig({ enabled: false, url: 'http://proxy.example.test:8080' });
    assert.equal(next.passwordSet, true); assert.equal(JSON.stringify(await proxyGetConfig()).includes(secret), false);
    const path = `${process.env.DSH_HOME}/plugins/majed/subscriptions/proxy.json`;
    assert.equal((await stat(path)).mode & 0o777, 0o600);
    assert.equal((await stat(`${process.env.DSH_HOME}/plugins/majed/subscriptions`)).mode & 0o777, 0o700);
    assert.ok((await readFile(path, 'utf8')).includes(secret));
    await assert.rejects(proxySetConfig({ enabled: true, url: `http://fixture:${secret}@proxy.example.test` }), error => !error.message.includes(secret));
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => { throw new Error(`outer ${secret}`, { cause: new Error('Authorization: Bearer fixture-token https://user:fixture-url-password@proxy.test') }); };
    try {
      const result = await proxyTestConnection('https://destination.test');
      const serialized = JSON.stringify(result);
      for (const value of [secret, 'fixture-token', 'fixture-url-password']) assert.equal(serialized.includes(value), false, serialized);
    } finally { globalThis.fetch = originalFetch; }
    globalThis.fetch = async () => new Response('fixture');
    try {
      const direct = await proxyTestConnection('https://destination.test', { enabled: false, url: 'http://proxy.test', bypass: [] });
      assert.equal(direct.ok, true); assert.equal(direct.viaProxy, false);
      const bypass = await proxyTestConnection('https://destination.test', { enabled: true, url: 'http://proxy.test', bypass: ['destination.test'] });
      assert.equal(bypass.ok, true); assert.equal(bypass.viaProxy, false);
    } finally { globalThis.fetch = originalFetch; }
    assert.equal((await proxySetConfig({ enabled: false, url: '', password: null })).passwordSet, false);
  } finally { await resetProxyForTests(); }
});
