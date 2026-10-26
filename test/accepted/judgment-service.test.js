import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createJudgmentService } from '../../modules/judgment/service.js';
import { apply } from '../../index.js';
import { Context } from '@deepseek-ai/cordis';

test('Owner configures a separate private judgment service, restarts, and explicitly validates its real protocol', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-r15-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const path = join(directory, 'judgment.json'); const sends = [];
  const transport = async (url, options) => {
    sends.push({ url, options });
    assert.equal(options.headers.authorization, 'Bearer fixture-credential');
    assert.equal(options.redirect, 'error');
    assert.deepEqual(JSON.parse(options.body), { model: 'jev-requested', state: 'Majed judgment connection test. No conversation data.',
      questions: { connection: { type: 'choice', instructions: 'Select ready to confirm this protocol responds.', criteria: { ready: 'Connection test' } } } });
    return Response.json({ model: 'jev-actual', answers: { connection: { type: 'choice', choice: 'ready' } }, usage: { input_tokens: 7, output_tokens: 2, cost: 0.0001 } });
  };
  let service = createJudgmentService({ path, fetch: transport });
  const saved = await service.configure({ protocol: 'systemone', address: 'https://judge.example', model: 'jev-requested', credential: { action: 'replace', value: 'fixture-credential' } });
  assert.equal(saved.credentialConfigured, true);
  assert.doesNotMatch(JSON.stringify(saved), /fixture-credential/);
  assert.equal((await stat(path)).mode & 0o777, 0o600);
  await service.dispose();
  service = createJudgmentService({ path, fetch: transport });
  t.after(() => service.dispose());
  assert.equal((await service.snapshot()).credentialConfigured, true);
  await assert.rejects(service.validate({ consent: false }), { code: 'consent_required' });
  assert.equal(sends.length, 0);
  const result = await service.validate({ consent: true });
  assert.equal(sends[0].url, 'https://judge.example/v1/systemone');
  assert.equal(result.requestedModel, 'jev-requested');
  assert.equal(result.actualModel, 'jev-actual');
  assert.deepEqual(result.usage, { input_tokens: 7, output_tokens: 2, cost: 0.0001 });
  assert.equal(result.choice, 'ready');
  assert.doesNotMatch(JSON.stringify(result), /credential|confidence|explanation/);
});

test('production entry exposes consented judgment management through the native Fetch boundary', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-r15-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const routes = []; const ctx = new Context();
  ctx.provide('connection', { fetch: { register(route) { routes.push(route); } } });
  const fiber = ctx.plugin({ apply }, { judgment: { path: join(directory, 'judgment.json') } }); await fiber;
  t.after(() => fiber.dispose());
  const route = routes.find(route => route.path === '/api/majed/judgment/manage');
  assert.ok(route, 'production entry must register the actual service');
  const call = async payload => (await (await route.fetch(new Request('https://fixture/api/majed/judgment/manage', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'client-request', rpcId: 'fixture-1', method: 'majed/judgment/manage', payload }) }))).json()).result;
  assert.equal((await call({ action: 'status' })).value.credentialConfigured, false);
  const saved = await call({ action: 'configure', config: { protocol: 'decisions', address: 'https://judge.example/api/alpha/decisions', model: 'jev', credential: { action: 'replace', value: 'fixture-secret' } } });
  assert.equal(saved.ok, true);
  assert.equal(saved.value.credentialConfigured, true);
  assert.doesNotMatch(JSON.stringify(saved), /fixture-secret/);
  assert.equal((await call({ action: 'validate', consent: false })).error.code, 'consent_required');
});

test('judgment validation has a finite deadline even when a transport ignores cancellation', { timeout: 1000 }, async t => {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-r15-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const service = createJudgmentService({ path: join(directory, 'judgment.json'), deadlineMs: 20, fetch: () => new Promise(() => {}) });
  t.after(() => service.dispose());
  await service.configure({ protocol: 'decisions', address: 'https://judge.example/api/alpha/decisions', model: 'jev', credential: { action: 'replace', value: 'fixture-value' } });
  await assert.rejects(service.validate({ consent: true }), { code: 'cancelled' });
});

test('judgment rejects non-string Choice answers rather than coercing their identity', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-r15-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  let choice = ['ready'];
  const service = createJudgmentService({ path: join(directory, 'judgment.json'), fetch: async () => Response.json({ model: 'jev', answers: { connection: { type: 'choice', choice } }, usage: { input_tokens: 1, output_tokens: 1 } }) });
  t.after(() => service.dispose());
  await service.configure({ protocol: 'systemone', address: 'https://judge.example', model: 'jev', credential: { action: 'replace', value: 'fixture-value' } });
  await assert.rejects(service.validate({ consent: true }), { code: 'protocol_failed' });
  choice = 'ready';
  assert.equal((await service.validate({ consent: true })).choice, 'ready');
});

test('credential replacement cannot silently remove an existing credential', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-r15-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const service = createJudgmentService({ path: join(directory, 'judgment.json') });
  t.after(() => service.dispose());
  await service.configure({ protocol: 'systemone', address: 'https://judge.example', model: 'jev', credential: { action: 'replace', value: 'fixture-value' } });
  await assert.rejects(service.configure({ credential: { action: 'replace', value: null } }), { code: 'invalid_configuration' });
  assert.equal((await service.snapshot()).credentialConfigured, true);
  assert.equal((await service.configure({ credential: { action: 'remove' } })).credentialConfigured, false);
});

test('failed or oversized judgment responses release their owned stream', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-r15-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  let cancelled = 0, status = 401;
  const service = createJudgmentService({ path: join(directory, 'judgment.json'), fetch: async () => new Response(new ReadableStream({ cancel() { cancelled++; } }), { status, headers: status === 200 ? { 'content-length': '1000000' } : {} }) });
  t.after(() => service.dispose());
  await service.configure({ protocol: 'systemone', address: 'https://judge.example', model: 'jev', credential: { action: 'replace', value: 'fixture-value' } });
  await assert.rejects(service.validate({ consent: true }), { code: 'protocol_failed' });
  assert.equal(cancelled, 1);
  status = 200;
  await assert.rejects(service.validate({ consent: true }), { code: 'protocol_failed' });
  assert.equal(cancelled, 2);
});

test('connection validation requires the documented protocol usage record', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-r15-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  let usage;
  const service = createJudgmentService({ path: join(directory, 'judgment.json'), fetch: async () => Response.json({ model: 'jev', answers: { connection: { type: 'choice', choice: 'ready' } }, usage }) });
  t.after(() => service.dispose());
  await service.configure({ protocol: 'systemone', address: 'https://judge.example', model: 'jev', credential: { action: 'replace', value: 'fixture-value' } });
  await assert.rejects(service.validate({ consent: true }), { code: 'protocol_failed' });
  usage = { input_tokens: 1, output_tokens: 2 };
  assert.deepEqual((await service.validate({ consent: true })).usage, usage);
});

test('a judgment completed after credential removal cannot validate stale settings', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-r15-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  let release, started;
  const received = new Promise(resolve => { started = resolve; });
  const service = createJudgmentService({ path: join(directory, 'judgment.json'), fetch: () => {
    started(); return new Promise(resolve => { release = resolve; });
  } });
  t.after(() => service.dispose());
  await service.configure({ protocol: 'systemone', address: 'https://judge.example', model: 'jev', credential: { action: 'replace', value: 'fixture-value' } });
  const decision = service.validate({ consent: true });
  const checked = assert.rejects(decision, { code: 'state_changed' });
  await received;
  await service.configure({ credential: { action: 'remove' } });
  release(Response.json({ model: 'jev', answers: { connection: { type: 'choice', choice: 'ready' } }, usage: { input_tokens: 1, output_tokens: 1 } }));
  await checked;
  assert.equal((await service.snapshot()).credentialConfigured, false);
});

test('disposal while reading configuration prevents any later judgment dispatch', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-r15-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  let sends = 0;
  const service = createJudgmentService({ path: join(directory, 'judgment.json'), fetch: async () => {
    sends++; return Response.json({ model: 'jev', answers: { connection: { type: 'choice', choice: 'ready' } } });
  } });
  await service.configure({ protocol: 'systemone', address: 'https://judge.example', model: 'jev', credential: { action: 'replace', value: 'fixture-value' } });
  const checked = assert.rejects(service.validate({ consent: true }));
  await service.dispose(); await checked;
  assert.equal(sends, 0);
});

test('judgment management refuses malformed RPC identifiers before saving any credentials', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-r15-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const routes = [], ctx = new Context();
  ctx.provide('connection', { fetch: { register(route) { routes.push(route); } } });
  const fiber = ctx.plugin({ apply }, { judgment: { path: join(directory, 'judgment.json') } }); await fiber;
  t.after(() => fiber.dispose());
  const route = routes.find(route => route.path === '/api/majed/judgment/manage');
  for (const rpcId of [undefined, null, 123, ['identifier']]) {
    const response = await route.fetch(new Request('https://fixture/api/majed/judgment/manage', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'client-request', rpcId, method: 'majed/judgment/manage', payload: { action: 'configure', config: { protocol: 'systemone', address: 'https://judge.example', model: 'jev', credential: { action: 'replace', value: 'fixture-secret' } } } }) }));
    assert.equal((await response.json()).result.error.code, 'invalid_request');
  }
  await assert.rejects(stat(join(directory, 'judgment.json')), { code: 'ENOENT' });
});

test('cancelled judgment releases a response returned later by an uncooperative transport', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-r15-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  let release, started, cancellations = 0;
  const received = new Promise(resolve => { started = resolve; });
  const service = createJudgmentService({ path: join(directory, 'judgment.json'), fetch: () => {
    started(); return new Promise(resolve => { release = resolve; });
  } });
  t.after(() => service.dispose());
  await service.configure({ protocol: 'systemone', address: 'https://judge.example', model: 'jev', credential: { action: 'replace', value: 'fixture-value' } });
  const controller = new AbortController();
  const checked = assert.rejects(service.validate({ consent: true, signal: controller.signal }), { code: 'cancelled' });
  await received; controller.abort(); await checked;
  release(new Response(new ReadableStream({ cancel() { cancellations++; } })));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(cancellations, 1);
});

test('an in-flight judgment cannot gain choices that were absent from its dispatched request', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-r15-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  let release, started;
  const received = new Promise(resolve => { started = resolve; });
  const service = createJudgmentService({ path: join(directory, 'judgment.json'), fetch: (url, options) => {
    assert.deepEqual(Object.keys(JSON.parse(options.body).questions.route.criteria), ['original']);
    started(); return new Promise(resolve => { release = resolve; });
  } });
  t.after(() => service.dispose());
  await service.configure({ protocol: 'systemone', address: 'https://judge.example', model: 'jev', credential: { action: 'replace', value: 'fixture-value' } });
  const input = { state: 'Bounded task', questions: { route: { type: 'choice', instructions: 'Choose the authorized route', criteria: { original: 'Original route' } } } };
  const checked = assert.rejects(service.decide(input, { consent: true }), { code: 'protocol_failed' });
  await received; input.questions.route.criteria.added = 'Route added after dispatch';
  release(Response.json({ model: 'jev', answers: { route: { type: 'choice', choice: 'added' } }, usage: { input_tokens: 1, output_tokens: 1 } }));
  await checked;
});
