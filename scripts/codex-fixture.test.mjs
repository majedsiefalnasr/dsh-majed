import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCodexAccounts } from '../modules/subscriptions/codex/accounts.js';
import { createFixtureFetch } from './codex-fixture/transport.mjs';

test('fixture refuses all URLs except exact token, catalog and Responses endpoints', async () => {
  const { fetch, counters } = createFixtureFetch();
  for (const url of ['https://example.test', 'https://auth.openai.com/oauth/token?x=1', 'https://chatgpt.com/backend-api/codex/models?client_version=other', 'https://chatgpt.com/backend-api/codex/responses/']) {
    await assert.rejects(fetch(url), /fixture_transport_denied/);
  }
  assert.deepEqual(counters(), { token: 0, catalog: 0, responses: 0, denied: 4 });
});

test('fixture returns labelled synthetic identity, catalog and terminal SSE', async () => {
  const { fetch, counters } = createFixtureFetch();
  const tokens = await (await fetch('https://auth.openai.com/oauth/token', { method: 'POST' })).json();
  assert.match(tokens.access_token, /^SYNTHETIC-FIXTURE/);
  const catalog = await (await fetch('https://chatgpt.com/backend-api/codex/models?client_version=0.153.4')).json();
  assert.equal(catalog.models[0].slug, 'synthetic-codex');
  const sse = await (await fetch('https://chatgpt.com/backend-api/codex/responses', { method: 'POST' })).text();
  assert.match(sse, /response.completed/); assert.match(sse, /no provider inference occurred/);
  assert.deepEqual(counters(), { token: 1, catalog: 1, responses: 1, denied: 0 });
});

test('real account service consumes synthetic callback and retains identity after service restart', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'majed-codex-service-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const transport = createFixtureFetch();
  const config = { path: join(directory, 'auth.json'), ports: [0], fetch: transport.fetch };
  const service = createCodexAccounts(config); t.after(() => service.dispose());
  const attempt = await service.begin();
  const authorize = new URL(attempt.authorizeUrl);
  assert.match(authorize.searchParams.get('code_challenge'), /^[A-Za-z0-9_-]{43}$/);
  const callback = new URL(authorize.searchParams.get('redirect_uri'));
  callback.searchParams.set('state', authorize.searchParams.get('state'));
  callback.searchParams.set('code', 'SYNTHETIC-FIXTURE-CODE');
  await service.complete(callback.href);
  assert.equal((await service.snapshot()).accounts[0].label, 'synthetic-codex@example.test');
  await service.dispose();
  const restarted = createCodexAccounts(config); t.after(() => restarted.dispose());
  assert.equal((await restarted.snapshot()).accounts[0].label, 'synthetic-codex@example.test');
  assert.equal(transport.counters().token, 1);
});

test('launcher rejects arbitrary retained paths and invalid arguments before spawning a host', () => {
  for (const args of [['restart', '/'], ['new', '/tmp'], ['unknown']]) {
    const result = spawnSync(process.execPath, ['scripts/codex-fixture/launch.mjs', ...args], { encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.doesNotMatch(result.stdout, /Owned fixture run:/);
    assert.match(result.stderr, /unsafe fixture run|usage:/);
  }
});
