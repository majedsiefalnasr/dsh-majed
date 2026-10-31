// Fixture-only Grok lifecycle regressions at the assembled component RPC seam.
import React from 'react';
import { create, act } from 'react-test-renderer';
import ts from 'typescript';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../src/grok-card.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const exports = {};
vm.runInNewContext(compiled, { exports, require: () => ({ ProviderAccountManager: 'div', controlCss: '', styles: new Proxy({}, { get: () => ({}) }) }), setInterval, clearInterval, Date });
const { createGrokCard } = exports;
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import fsPromises from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { apply } from '../dist/subscriptions.js';
const tick = () => new Promise(resolve => setImmediate(resolve));
function host(attachments) {
  const routes = new Map(), cleanups = [];
  const ctx = { logger: { warn() {} }, llm: { registerAdapter() { return { replace() {} }; } },
    get: name => name === 'attachments' ? attachments : ({ fetch: { register(route) { routes.set(route.path, route); return () => routes.delete(route.path); } } }),
    effect(fn) { const cleanup = fn(); if (cleanup) cleanups.push(cleanup); },
    inject(names, fn) { if ([].concat(names).includes('connection')) fn(ctx); } };
  apply(ctx, {});
  return { async call(endpoint, payload = {}, signal) {
    const method = `majed-subscriptions.${endpoint}`;
    return (await (await routes.get(`/api/${method}`).fetch(new Request(`http://localhost/api/${method}`, {
      method: 'POST', signal, headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'client-request', rpcId: 'fixture', method, payload }) }))).json()).result;
  }, dispose() { cleanups.splice(0).reverse().forEach(fn => fn()); } };
}
test('media RPC admission and cancellation reach actual storage boundaries', async () => {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t133-admission-');
  let reads = 0, observedSignal;
  const component = host({ async readImage(ref, signal) {
    reads++; observedSignal = signal; signal.throwIfAborted();
    if (ref.attachmentId.endsWith('b')) throw new Error('Image not found');
    return { ref: { mediaType: 'image/png' }, data: Buffer.from('fixture-image') };
  } });
  try {
    for (const attachmentId of ['', '../foreign', 'sha256:bad', 1]) assert.equal((await component.call('image', { attachmentId })).ok, false);
    assert.equal(reads, 0);
    const attachmentId = `sha256:${'a'.repeat(64)}`;
    assert.equal((await component.call('image', { attachmentId })).value.dataBase64, Buffer.from('fixture-image').toString('base64'));
    assert.equal((await component.call('image', { attachmentId: `sha256:${'b'.repeat(64)}` })).ok, false);
    const controller = new AbortController(); controller.abort();
    assert.equal((await component.call('image', { attachmentId }, controller.signal)).ok, false);
    assert.equal(observedSignal.aborted, true);
    const directory = join(process.env.DSH_HOME, 'plugins/majed/subscriptions/videos');
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, 'video-cancel.mp4'), Buffer.from([0, 0, 0, 8, 102, 116, 121, 112]));
    assert.equal((await component.call('video', { name: 'video-cancel.mp4' }, controller.signal)).ok, false);
  } finally { component.dispose(); }
});

test('image RPC in-flight cancellation settles storage rejection without returning late bytes', async () => {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t133-image-flight-');
  let entered;
  const started = new Promise(resolve => { entered = resolve; });
  const component = host({ readImage(_ref, signal) {
    entered();
    return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
  } });
  try {
    const controller = new AbortController();
    const pending = component.call('image', { attachmentId: `sha256:${'a'.repeat(64)}` }, controller.signal);
    await started; controller.abort();
    assert.equal((await pending).ok, false);
  } finally { component.dispose(); }
});

test('video RPC refuses an owned-name symlink instead of reading its target', async () => {
  const home = process.env.DSH_HOME = await mkdtemp('/tmp/majed-t133-video-');
  const directory = join(home, 'plugins/majed/subscriptions/videos');
  await mkdir(directory, { recursive: true });
  const target = join(home, 'foreign.mp4');
  await writeFile(target, Buffer.from('fixture foreign bytes'));
  await symlink(target, join(directory, 'video-fixture.mp4'));
  const component = host();
  try { assert.equal((await component.call('video', { name: 'video-fixture.mp4' })).ok, false); }
  finally { component.dispose(); }
});
test('video RPC validates names, missing files, regular files and MP4 bytes while surviving remount', async () => {
  const home = process.env.DSH_HOME = await mkdtemp('/tmp/majed-t133-video-matrix-');
  const directory = join(home, 'plugins/majed/subscriptions/videos');
  await mkdir(join(directory, 'video-directory.mp4'), { recursive: true });
  await writeFile(join(directory, 'video-invalid.mp4'), 'not an mp4');
  const bytes = Buffer.from([0, 0, 0, 8, 102, 116, 121, 112]);
  await writeFile(join(directory, 'video-persisted.mp4'), bytes);
  let component = host();
  try {
    for (const name of ['../foreign.mp4', '/tmp/foreign.mp4', 'video-missing.mp4', 'video-directory.mp4', 'video-invalid.mp4', 'video-fixture.webm']) {
      assert.equal((await component.call('video', { name })).ok, false, name);
    }
    const first = await component.call('video', { name: 'video-persisted.mp4' });
    assert.equal(first.ok, true);
    assert.equal(first.value.mediaType, 'video/mp4');
    assert.equal(first.value.dataBase64, bytes.toString('base64'));
    component.dispose(); component = host();
    assert.deepEqual(await component.call('video', { name: 'video-persisted.mp4' }), first);
  } finally { component.dispose(); }
});

test('video RPC deterministically refuses concurrent growth after admitted-size read', async () => {
  const home = process.env.DSH_HOME = await mkdtemp('/tmp/majed-t133-growth-');
  const directory = join(home, 'plugins/majed/subscriptions/videos');
  await mkdir(directory, { recursive: true });
  const path = join(directory, 'video-growth.mp4');
  await writeFile(path, Buffer.from([0, 0, 0, 8, 102, 116, 121, 112]));
  const original = fsPromises.open;
  let mutated = false;
  fsPromises.open = async (...args) => {
    const handle = await original(...args);
    if (args[0] === path) {
      const read = handle.read.bind(handle);
      handle.read = async (...readArgs) => {
        const result = await read(...readArgs);
        await fsPromises.appendFile(path, Buffer.alloc(32)); mutated = true;
        return result;
      };
    }
    return handle;
  };
  syncBuiltinESMExports();
  const component = host();
  try {
    const result = await component.call('video', { name: 'video-growth.mp4' });
    assert.equal(mutated, true); assert.equal(result.ok, false);
    assert.match(JSON.stringify(result), /changed during read/);
  } finally { component.dispose(); fsPromises.open = original; syncBuiltinESMExports(); }
});

test('video RPC cancellation during actual handle read rejects and closes the handle', async () => {
  const home = process.env.DSH_HOME = await mkdtemp('/tmp/majed-t133-video-flight-');
  const directory = join(home, 'plugins/majed/subscriptions/videos'); await mkdir(directory, { recursive: true });
  const path = join(directory, 'video-flight.mp4'); await writeFile(path, Buffer.from([0, 0, 0, 8, 102, 116, 121, 112]));
  const controller = new AbortController(), original = fsPromises.open;
  let closed = false;
  fsPromises.open = async (...args) => {
    const handle = await original(...args);
    if (args[0] === path) {
      const read = handle.read.bind(handle), close = handle.close.bind(handle);
      handle.read = async (...values) => { const result = await read(...values); controller.abort(); return result; };
      handle.close = async () => { closed = true; return close(); };
    }
    return handle;
  }; syncBuiltinESMExports();
  const component = host();
  try { assert.equal((await component.call('video', { name: 'video-flight.mp4' }, controller.signal)).ok, false); assert.equal(closed, true); }
  finally { component.dispose(); fsPromises.open = original; syncBuiltinESMExports(); }
});

test('video RPC refuses a symlinked owned videos directory', async () => {
  const home = process.env.DSH_HOME = await mkdtemp('/tmp/majed-t133-parent-link-');
  const directory = join(home, 'plugins/majed/subscriptions');
  const foreign = join(home, 'foreign-videos');
  await mkdir(directory, { recursive: true }); await mkdir(foreign);
  await writeFile(join(foreign, 'video-foreign.mp4'), Buffer.from([0, 0, 0, 8, 102, 116, 121, 112]));
  await symlink(foreign, join(directory, 'videos'));
  const component = host();
  try { assert.equal((await component.call('video', { name: 'video-foreign.mp4' })).ok, false); }
  finally { component.dispose(); }
});

test('Grok saved alias reaches the rendered card through assembled status RPC', async () => {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t133-alias-');
  const store = await import('../dist/auth/store.js');
  await store.saveAccountSession('grok', 'fixture', { accessToken: 'fake-access', refreshToken: 'fake-refresh', expiresAt: 4000000000000, account: 'fixture@example.test', tokenEndpoint: 'https://accounts.x.ai/token' });
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json({});
  const component = host();
  let renderer;
  try {
    assert.equal((await component.call('setProviderSettings', { provider: 'grok', settings: { accounts: { fixture: { alias: 'My fixture alias' } } } })).ok, true);
    const Card = createGrokCard(React, {}, { call: (_path, method, payload) => component.call(method.split('.').at(-1), payload) }, key => key);
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    await act(async () => { renderer = create(React.createElement(Card)); await tick(); });
    for (let i = 0; i < 100 && !JSON.stringify(renderer.toJSON()).includes('fixture@example.test'); i++) await act(async () => { await tick(); });
    assert.match(JSON.stringify(renderer.toJSON()), /My fixture alias/);
  } finally { if (renderer) await act(async () => renderer.unmount()); component.dispose(); globalThis.fetch = original; }
});
test('Grok stalled discovery is busy, cancellation settles login and permits retry; late response cannot revive it', async () => {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t133-discovery-');
  const original = globalThis.fetch;
  let resolveDiscovery;
  globalThis.fetch = () => new Promise(resolve => { resolveDiscovery = resolve; });
  const component = host();
  try {
    const pending = component.call('login', { provider: 'grok' });
    await tick();
    assert.equal((await component.call('status')).value.providers.grok.busy, true);
    await component.call('cancel', { provider: 'grok' });
    assert.equal((await component.call('status')).value.providers.grok.busy, false);
    const cancelled = await Promise.race([pending, new Promise(resolve => setTimeout(() => resolve('hung'), 100))]);
    assert.notEqual(cancelled, 'hung');
    assert.equal(cancelled.ok, false);
    const retry = component.call('login', { provider: 'grok' });
    await tick();
    assert.equal((await component.call('status')).value.providers.grok.busy, true);
    component.dispose();
    assert.notEqual(await Promise.race([retry, new Promise(resolve => setTimeout(() => resolve('hung'), 100))]), 'hung');
    resolveDiscovery(Response.json({ authorization_endpoint: 'https://accounts.x.ai/authorize', token_endpoint: 'https://accounts.x.ai/token' }));
    await tick();
    const store = await import('../dist/auth/store.js');
    assert.deepEqual(await store.listAccounts('grok'), []);
  } finally { component.dispose(); globalThis.fetch = original; }
});

test('Grok cancel during stalled token body releases busy and rejects late credentials', async () => {
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t133-exchange-');
  const original = globalThis.fetch;
  let finishBody, bodyStarted = false;
  globalThis.fetch = async url => String(url).includes('openid-configuration')
    ? Response.json({ authorization_endpoint: 'https://accounts.x.ai/authorize', token_endpoint: 'https://accounts.x.ai/token' })
    : { ok: true, status: 200, json() { bodyStarted = true; return new Promise(resolve => { finishBody = resolve; }); } };
  const component = host();
  try {
    const login = await component.call('login', { provider: 'grok' });
    assert.equal(login.ok, true);
    const url = new URL(login.value.authorizeUrl);
    const callback = new URL(url.searchParams.get('redirect_uri'));
    callback.searchParams.set('code', 'fake-code'); callback.searchParams.set('state', url.searchParams.get('state'));
    assert.equal((await component.call('manual', { provider: 'grok', input: callback.href })).ok, true);
    for (let i = 0; i < 100 && !bodyStarted; i++) await tick();
    assert.equal(bodyStarted, true);
    await component.call('cancel', { provider: 'grok' });
    assert.equal((await component.call('status')).value.providers.grok.busy, false);
    const retry = await component.call('login', { provider: 'grok' });
    assert.equal(retry.ok, true);
    finishBody({ access_token: 'fake-late-access', refresh_token: 'fake-late-refresh', expires_in: 3600 });
    await tick();
    assert.deepEqual((await component.call('status')).value.providers.grok.accounts, []);
    assert.equal((await component.call('status')).value.providers.grok.busy, true, 'old settlement must not release the new attempt');
    await component.call('cancel', { provider: 'grok' });
  } finally { component.dispose(); globalThis.fetch = original; }
});
