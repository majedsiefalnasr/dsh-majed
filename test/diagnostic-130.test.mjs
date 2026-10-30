// Final #130 P2 security regressions: diagnostic sanitization of arbitrary exception text (http.ts safeDiagnostic).
// Independent review of d6d849a found unknown-secret forms, known-secret encodings, JSON tails and a quadratic cost.
// Fake fetch only; no real network, accounts or proxy. Timing guards are deliberately loose (CI-noise tolerant).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import { mkdtemp, mkdir, readFile } from 'node:fs/promises';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { Context } from '@deepseek-ai/cordis';
import { apply } from '../dist/subscriptions.js';
import { safeDiagnostic, describeFetchError, proxySetConfig, resetProxyForTests } from '../dist/http.js';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await mkdir('/tmp/majed-t130', { recursive: true });

const b64 = value => Buffer.from(value, 'utf8').toString('base64');
const UNK = 'UNK-secret-91Zq';

// ---------------------------------------------------------------- unknown secrets (nothing is known to the host)
const UNKNOWN_SAMPLES = [
  // userinfo on any scheme
  `connect failed ftp://user:${UNK}@host:21/file`,
  `via socks5://u:${UNK}@127.0.0.1:1080 refused`,
  `via socks5h://u:${UNK}@127.0.0.1:1080 refused`,
  `redis+tls://:${UNK}@cache.internal:6380`,
  `relative //u:${UNK}@host/path`,
  `ftp://user:p@${UNK}@host/x`,
  // quoted authorization headers, every scheme
  `{"Authorization":"Bearer ${UNK}"}`,
  `{"Authorization":"Basic ${UNK}"}`,
  `{"Proxy-Authorization":"Token ${UNK}"}`,
  `{"authorization":"Digest username=\\"u\\", realm=\\"r\\", response=\\"${UNK}\\""}`,
  `{'Authorization': 'Bearer ${UNK}'}`,
  `Authorization: Digest username="u", response="${UNK}"`,
  `Proxy-Authorization: Negotiate ${UNK}${UNK}`,
  `Authorization: Bearer ${UNK}`,
  `authorization=Basic ${UNK}`,
  // bare schemes outside any header key
  `upstream said Bearer ${UNK} was rejected`,
  `upstream sent Basic ${b64(`u:pw-${UNK}`)} twice`,
  // cookies
  `Cookie: sid=${UNK}; theme=dark`,
  `Set-Cookie: sid=${UNK}; Path=/; HttpOnly`,
  `{"cookie":"sid=${UNK}"}`,
  `{"Set-Cookie":["a=${UNK}","b=${UNK}"],"ok":false}`,
  // other key names
  `{"pwd":"${UNK}"}`,
  `passphrase=${UNK}`,
  `{"passphrase":"${UNK}"}`,
  `https://h/p?token=${UNK}&x=1`,
  `{'password': '${UNK}'}`,
  `bad {"password":"has \\"escaped\\" quote ${UNK}"}`,
  // arrays, objects and tails under sensitive keys
  `{"password":["${UNK}","${UNK}2"],"x":1}`,
  `{"token":{"a":"${UNK}","b":["${UNK}"]},"after":true}`,
  `{"secret":[{"k":"${UNK}"}]} trailing safe-tail`,
  `[{"password":"${UNK}"},{"token":"${UNK}"}]`,
  `{"a":[1,2,{"b":{"apiKey":["${UNK}"]}}]}`,
  // unicode-escaped key names (only a structural parse sees these)
  `{"pass\\u0077ord":"${UNK}"}`,
  `{"\\u0061pi_key":["${UNK}"]}`,
  // JSON embedded in a JSON string and in escaped text
  `{"message":"{\\"password\\":\\"${UNK}\\"}"}`,
  `body: {\\"password\\":\\"${UNK}\\"}`,
  // truncated / unterminated
  `{"a":1,"password":"${UNK}`,
  `{"a":1,"token":["${UNK}", `,
  // surrounding noise must not shield the value
  `HTTP 407 from proxy: {"error":{"detail":{"auth":{"password":"${UNK}"}}}} (retry later)`,
];

test('unknown secrets in every non-http userinfo, header, cookie, key and JSON form never survive', () => {
  for (const sample of UNKNOWN_SAMPLES) {
    const out = safeDiagnostic(sample);
    assert.equal(out.includes(UNK), false, `${sample}\n -> ${out}`);
    assert.equal(out.includes(`pw-${UNK}`), false);
    assert.equal(out.includes(b64(`u:pw-${UNK}`)), false, out);
    assert.match(out, /redacted/i, `${sample} -> ${out}`);
  }
});

test('numeric and structured sensitive JSON values are redacted whole, tails included', () => {
  const out = safeDiagnostic('x {"password":1234567,"token":{"deep":[1,2,3]},"api_key":true,"keep":"visible"} y');
  assert.equal(/1234567|deep|\[1,2,3\]|true/.test(out), false, out);
  assert.match(out, /"keep":"visible"/);
  assert.match(out, / y$/);
  assert.equal(safeDiagnostic('{"password":["a","b"]} tail ok'), '{"password":"[redacted]"} tail ok');
});

test('useful safe diagnostics stay readable and unchanged', () => {
  for (const safe of [
    'connect ECONNREFUSED 127.0.0.1:9',
    'getaddrinfo ENOTFOUND proxy.test',
    'proxy URL must use the http:// or https:// scheme',
    'GET https://api.x.ai/v1/models failed with HTTP 502',
    '{"status":"failed","user":"x","count":3}',
    'basic authentication is required',
    'bearer token missing',
    'test destination must be http or https (got "ftp://")',
  ]) assert.equal(safeDiagnostic(safe), safe);
  const mixed = safeDiagnostic(`connect ECONNREFUSED 127.0.0.1:9 via http://u:${UNK}@127.0.0.1:9`);
  assert.match(mixed, /^connect ECONNREFUSED 127\.0\.0\.1:9 via http:\/\/\[redacted\]@127\.0\.0\.1:9$/);
});

// ---------------------------------------------------------------- known stored/draft secrets in every encoding
test('known secrets disappear in raw, URI, form, JSON-escaped, base64 and combined user:password forms', async () => {
  await resetProxyForTests();
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t130/diag-known-');
  try {
    const password = `Pa ss/wörd"+&=\\${UNK}`;
    const username = 'fixture.user@corp';
    await proxySetConfig({ enabled: false, url: 'http://127.0.0.1:9', username, password });
    const draftPassword = `draft pw/"x" ${UNK}!`;
    const draftUser = 'draft-user';
    const forms = secret => [secret, encodeURIComponent(secret), encodeURIComponent(secret).replace(/%20/g, '+'), encodeURI(secret),
      encodeURIComponent(secret).toLowerCase(), JSON.stringify(secret).slice(1, -1), b64(secret), b64(secret).replace(/=+$/, ''), Buffer.from(secret).toString('base64url'), b64(`:${secret}`)];
    const combined = (user, secret) => [b64(`${user}:${secret}`), b64(`${user}:${secret}`).replace(/=+$/, ''), Buffer.from(`${user}:${secret}`).toString('base64url')];
    const stored = [...forms(password), ...combined(username, password)];
    const draft = [...forms(draftPassword), ...combined(draftUser, draftPassword)];
    const wrap = value => `failure A ${value} B Authorization: Basic ${value} {"x":"${value}"}`;
    for (const value of stored) {
      const out = safeDiagnostic(wrap(value));
      assert.equal(out.includes(value), false, `stored form leaked: ${value} -> ${out}`);
    }
    for (const value of draft) {
      const out = safeDiagnostic(wrap(value), [draftPassword], [draftUser]);
      assert.equal(out.includes(value), false, `draft form leaked: ${value} -> ${out}`);
    }
    // The plain user:password text form for the stored and draft pairs.
    assert.equal(safeDiagnostic(`bad ${username}:${password} here`).includes(password), false);
    assert.equal(safeDiagnostic(`bad ${draftUser}:${draftPassword} here`, [draftPassword]).includes(draftPassword), false);
    // describeFetchError redacts every layer of the cause chain and aggregate entries.
    const error = Object.assign(new Error(`outer ${b64(`${username}:${password}`)}`, { cause: new Error(`inner ${encodeURIComponent(password)} ${UNK}-aggregate`) }), { errors: [new Error(`child ${password}`), `str ${b64(password)}`] });
    const described = describeFetchError(error);
    for (const form of [...forms(password), ...combined(username, password)]) assert.equal(described.includes(form), false, described);
    assert.match(described, /outer|inner|child/, 'safe layers stay visible');
  } finally { await resetProxyForTests(); }
});

test('a secret cut by the input bound leaves no partial prefix behind', async () => {
  await resetProxyForTests();
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t130/diag-cut-');
  try {
    const secret = `S${'S'.repeat(38)}!`; // 40 chars; replaced copies shrink to 10, so the cut tail would surface in the output
    const out = safeDiagnostic(secret.repeat(102) + secret, [secret]);
    assert.equal(out.includes('SSS'), false, out);
  } finally { await resetProxyForTests(); }
});

// ---------------------------------------------------------------- bounded, linear cost
test('huge adversarial error text is bounded before expensive work and stays fast', () => {
  const inputs = {
    passwords: 'password '.repeat(120_000),
    pairs: 'password='.repeat(120_000),
    tokens: '"token":"'.repeat(120_000),
    unterminated: `{"password":"${'a'.repeat(1_000_000)}`,
    braces: '{'.repeat(1_000_000),
    nestedValid: `${'['.repeat(20_000)}${']'.repeat(20_000)}`,
    nestedObjects: '{"a":'.repeat(20_000) + '1' + '}'.repeat(20_000),
    brackets: '[x]'.repeat(300_000),
    bearer: 'Bearer '.repeat(150_000),
    userinfo: 'ftp://'.repeat(200_000),
    slashes: '//@'.repeat(300_000),
    quotes: '"'.repeat(1_000_000),
    keysThenGarbage: `${'{"password":'.repeat(50_000)}`,
    cookies: 'Cookie:'.repeat(150_000),
    spaces: `password${' '.repeat(1_000_000)}x`,
  };
  const started = performance.now();
  for (const [name, input] of Object.entries(inputs)) {
    const t0 = performance.now();
    const out = safeDiagnostic(input);
    const elapsed = performance.now() - t0;
    assert.ok(out.length <= 1024, `${name} output bounded (${out.length})`);
    assert.ok(elapsed < 1500, `${name} took ${elapsed.toFixed(0)}ms`);
  }
  assert.ok(performance.now() - started < 8000, 'whole adversarial set stays far below the former quadratic cost');
  // describeFetchError bounds an oversized aggregate and cause chain the same way.
  const huge = Object.assign(new Error('x'.repeat(2_000_000)), { errors: Array.from({ length: 5000 }, () => new Error('password=zz'.repeat(5000))) });
  const t1 = performance.now();
  assert.ok(describeFetchError(huge).length <= 1024);
  assert.ok(performance.now() - t1 < 3000);
});

test('cost does not grow with oversized input: 8x more repeated key words cost about the same (quadratic regression guard)', () => {
  // The former lazy key pattern took ~250ms on 16KB and ~16s on 128KB of this input.
  const run = words => { const input = 'password'.repeat(words); const t0 = performance.now(); for (let i = 0; i < 3; i += 1) safeDiagnostic(input); return performance.now() - t0; };
  run(2_000); // warm
  const small = Math.max(run(2_000), 1), large = run(16_000);
  assert.ok(large < Math.max(small * 20, 1000), `small=${small.toFixed(1)}ms large=${large.toFixed(1)}ms`);
  assert.ok(large < 3000);
});

test('non-error throwables never throw out of the sanitizer', () => {
  const hostile = { toString() { throw new Error('boom'); } };
  assert.equal(typeof safeDiagnostic(hostile), 'string');
  assert.equal(typeof safeDiagnostic(null), 'string');
  assert.equal(typeof safeDiagnostic(Object.assign(new Error('x'), { message: { toString() { throw new Error('boom'); } } })), 'string');
  assert.equal(typeof safeDiagnostic(Symbol('s')), 'string');
});

// ---------------------------------------------------------------- complete serialized RPC and rendered output
function load(path) {
  const exports = {};
  const js = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(js, { exports, require(id) {
    if (id === 'react') return React;
    if (id === 'react/jsx-runtime') { const el = (tag, props, key) => { const { children, ...rest } = props; return React.createElement(tag, key === undefined ? rest : { ...rest, key }, ...(children === undefined ? [] : Array.isArray(children) ? children : [children])); }; return { Fragment: React.Fragment, jsx: el, jsxs: el }; }
    const child = resolve(dirname(path), id.replace(/\.js$/, '.ts'));
    return load(existsSync(child) ? child : child + 'x');
  }, document: { activeElement: null }, HTMLElement: class {}, window: { dispatchEvent() {} }, CustomEvent: class {}, console, Error }, { filename: path });
  return exports;
}
const { ProxySettings } = load(resolve('src/settings/ProxySettings.tsx'));
const text = node => node.children.map(child => typeof child === 'string' ? child : text(child)).join('');

async function mountHost() {
  const routes = new Map(), cleanups = [];
  const ctx = { logger: { warn() {} }, llm: { registerAdapter: () => ({ replace() {} }) },
    get: name => name === 'connection' ? { fetch: { register(route) { routes.set(route.path, route); return () => routes.delete(route.path); } } } : undefined,
    inject(names, fn) { if ([].concat(names).includes('connection')) fn(ctx); }, effect(fn) { const off = fn(); if (off) cleanups.push(off); } };
  apply(ctx, { codexClientVersion: '1.2.3' });
  const raw = async (endpoint, payload = {}) => {
    const method = `majed-subscriptions.${endpoint}`;
    return (await routes.get(`/api/${method}`).fetch(new Request(`http://localhost/api/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'client-request', rpcId: 'fixture', method, payload }) }))).text();
  };
  return { raw, dispose: () => cleanups.reverse().forEach(off => off()) };
}

test('known and unknown secrets are absent from the complete serialized RPC response and the rendered error (saved and draft)', async () => {
  await resetProxyForTests();
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t130/diag-rpc-');
  const host = await mountHost();
  const originalFetch = globalThis.fetch;
  const SAVED = 'saved pw/"+ 9Zq', DRAFT = 'draft pw/"+ 4Lm', SAVED_USER = 'saved.user', DRAFT_USER = 'draft.user';
  const seen = [];
  try {
    const set = JSON.parse(await host.raw('proxySet', { enabled: true, url: 'http://127.0.0.1:9', username: SAVED_USER, password: SAVED, bypass: ['bypass.test'] }));
    assert.equal(set.result.ok, true);
    const stored = JSON.stringify(JSON.parse(await readFile(`${process.env.DSH_HOME}/plugins/majed/subscriptions/proxy.json`, 'utf8')));
    // Which secrets the host can know for each request: the stored pair always; the draft pair only when the draft carries it.
    const leakage = (secret, user) => [secret, encodeURIComponent(secret), b64(secret), b64(`${user}:${secret}`), JSON.stringify(secret).slice(1, -1)];
    let mode = 0; // 0 stored only, 1 draft with password, 2 draft without password
    const message = () => {
      const parts = [SAVED_USER + ':' + SAVED, SAVED];
      const secrets = mode === 1 ? [[SAVED, SAVED_USER], [DRAFT, DRAFT_USER], [SAVED, DRAFT_USER]] : mode === 2 ? [[SAVED, SAVED_USER], [SAVED, DRAFT_USER]] : [[SAVED, SAVED_USER]];
      for (const [secret, user] of secrets) parts.push(`outer ${secret} ${encodeURIComponent(secret)} ${b64(secret)} ${b64(`${user}:${secret}`)} Proxy-Authorization: Basic ${b64(`${user}:${secret}`)}`);
      parts.push(`{"Authorization":"Bearer ${UNK}-bearer","Cookie":"sid=${UNK}-cookie","pwd":"${UNK}-pwd","nested":{"list":[{"password":["${UNK}-arr",{"deep":"${UNK}-deep"}]}]}}`,
        `ftp://u:${UNK}-ftp@h socks5://u:${UNK}-socks@h`,
        `{"message":"{\\"token\\":\\"${UNK}-inner\\"}","pass\\u0077ord":"${UNK}-uni"}`);
      return parts.join(' | ');
    };
    globalThis.fetch = async (url, init) => { seen.push({ url: String(url), method: init?.method }); throw Object.assign(new Error(message()), { cause: new Error(message()), errors: [new Error(message())] }); };
    const requests = [
      { url: 'https://bypass.test/health' },
      { url: 'https://bypass.test/health', proxy: { enabled: true, url: 'http://127.0.0.1:9', username: DRAFT_USER, password: DRAFT, bypass: ['bypass.test'] } },
      { url: 'https://bypass.test/health', proxy: { enabled: true, url: 'http://127.0.0.1:9', username: DRAFT_USER, bypass: ['bypass.test'] } },
    ];
    const responses = [];
    for (const [index, request] of requests.entries()) { mode = index; responses.push(await host.raw('proxyTest', request)); }
    const knownFor = index => (index === 1 ? [[SAVED, SAVED_USER], [DRAFT, DRAFT_USER], [SAVED, DRAFT_USER]] : index === 2 ? [[SAVED, SAVED_USER], [SAVED, DRAFT_USER]] : [[SAVED, SAVED_USER]]);
    for (const [index, response] of responses.entries()) {
      const body = JSON.parse(response);
      assert.equal(body.result.ok, true);
      assert.equal(body.result.value.ok, false);
      for (const [secret, user] of knownFor(index)) for (const form of leakage(secret, user)) assert.equal(response.includes(form), false, `${form} leaked in ${response}`);
      assert.equal(/UNK-secret-91Zq/.test(response), false, response);
      assert.equal(response.includes('Bearer '), false);
      assert.match(body.result.value.error, /outer/, 'the safe prefix of the failure remains visible');
      // Rendered through the real proxy dialog: the visible tree carries none of it either.
      let page;
      const rpc = { async call(_, method) { return method.endsWith('proxyGet') ? { ok: true, value: { enabled: true, url: 'http://127.0.0.1:9', username: SAVED_USER, passwordSet: true, bypass: [] } } : body.result; } };
      await act(async () => { page = Renderer.create(React.createElement(ProxySettings, { rpc, t: (key, params = {}) => `${key} ${Object.values(params).join(' ')}` }), { createNodeMock: () => ({ showModal() {}, close() {} }) }); });
      const button = label => page.root.findAllByType('button').find(node => text(node) === label);
      await act(async () => button('proxyConfigure ').props.onClick());
      await act(async () => { await button('proxyTest ').props.onClick(); });
      const rendered = JSON.stringify(page.toJSON());
      assert.match(rendered, /proxyTestFail/, 'the failure message is rendered');
      for (const [secret, user] of knownFor(index)) for (const form of leakage(secret, user)) assert.equal(rendered.includes(JSON.stringify(form).slice(1, -1)), false, `${form} leaked in rendered tree`);
      assert.equal(/UNK-secret-91Zq/.test(rendered), false);
      await act(async () => page.unmount());
    }
    // Sanitizing a diagnostic must not alter credentials or transport: the file still holds the real password,
    // the probes reached the unmodified destination and the stored view still reports the password as set.
    assert.equal(JSON.stringify(JSON.parse(await readFile(`${process.env.DSH_HOME}/plugins/majed/subscriptions/proxy.json`, 'utf8'))), stored);
    assert.equal(JSON.parse(await host.raw('proxyGet')).result.value.passwordSet, true);
    assert.ok(seen.length >= 3 && seen.every(call => call.url === 'https://bypass.test/health' && call.method === 'GET'));
  } finally { globalThis.fetch = originalFetch; host.dispose(); await resetProxyForTests(); }
});
