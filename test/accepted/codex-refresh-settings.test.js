import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createBaselineHarness } from './helpers/baseline-client-harness.js';

const tick = async () => { for (let i = 0; i < 20; i++) await new Promise(resolve => setImmediate(resolve)); };

for (const language of ['en', 'ar']) for (const rejected of [false, true]) test(`rejected credential refresh reconciles the rendered account and catalog without replay (${language}, ${rejected ? 'transport' : 'envelope'})`, async t => {
  const source = await readFile(new URL('../../client.js', import.meta.url), 'utf8');
  const calls = [];
  let revoked = false;
  const harness = createBaselineHarness(source, { language, connection: { rpc: { async call(channel, method, payload) {
    if (method === 'majed/settings/status') return { ok: true, value: { module: payload.module, enabled: false, state: 'disabled' } };
    calls.push(payload.action);
    if (payload.action === 'refresh') {
      revoked = true;
      if (rejected) throw new Error('private-provider-detail');
      return { ok: false, error: { code: 'reauthentication_required', message: 'private-provider-detail' } };
    }
    assert.equal(payload.action, 'status');
    assert.equal(payload.mode, revoked ? 'passive' : undefined);
    return { ok: true, value: { enabled: true, state: revoked ? 'reauthentication_required' : 'connected', runtimeEnabled: true,
      accounts: [{ id: 'retained-identity', label: 'fixture@example.test', state: revoked ? 'reauthentication_required' : 'connected' }],
      runtime: { models: revoked ? [] : [{ id: 'fixture-model', name: 'Fixture model' }], catalogs: revoked ? [] : [{ models: [{ id: 'fixture-model', name: 'Fixture model' }] }], preferences: {} } } };
  } } } });
  t.after(() => harness.dispose());
  harness.apply(); const view = harness.render('majed-subscriptions'); await tick(); view.render();
  assert.ok(view.one(n => n.props['data-codex-model-settings'] === true));
  await view.one(n => n.props['data-codex-action'] === 'refresh').props.onClick(); await tick(); view.render();
  assert.deepEqual(calls, ['status', 'refresh', 'status']);
  const rendered = JSON.stringify(view.nodes(() => true));
  assert.doesNotMatch(rendered, /private-provider-detail/);
  assert.ok(view.one(n => n.props['data-majed-codex'] === true));
  assert.equal(view.one(n => n.props['data-majed-codex'] === true).props.dir, language === 'ar' ? 'rtl' : 'ltr');
  assert.ok(view.one(n => n.type === 'p' && n.props.children?.includes('fixture@example.test')));
  assert.ok(view.one(n => n.type === 'p' && n.props.children?.includes(language === 'ar' ? 'سجّل الدخول مجددًا لإعادة ربط هذا الحساب.' : 'Sign in again to reconnect this account.')));
  assert.equal(view.one(n => n.props.role === 'alert').props.children.join(''), language === 'ar'
    ? 'فشلت عملية الحساب. حدّث الحالة أو أعد الربط. لا تُعرض تفاصيل بيانات الاعتماد.'
    : 'Account operation failed. Refresh status or reconnect. No credential details are displayed.');
  assert.equal(view.nodes(n => n.props['data-codex-model-settings'] === true).length, 0);
  assert.equal(view.one(n => n.props['data-codex-action'] === 'default').props.disabled, true);
});

for (const language of ['en', 'ar']) test(`transient refresh keeps connected passive account settings hidden until full status (${language})`, async t => {
  const source = await readFile(new URL('../../client.js', import.meta.url), 'utf8');
  const calls = [];
  const connected = { enabled: true, state: 'connected', runtimeEnabled: true,
    accounts: [{ id: 'retained', label: 'fixture@example.test', state: 'connected' }],
    runtime: { catalogs: [], preferences: { accounts: { retained: { alias: 'Nondefault alias', independentEntry: true } } } } };
  const harness = createBaselineHarness(source, { language, connection: { rpc: { async call(channel, method, payload) {
    if (method === 'majed/settings/status') return { ok: true, value: { enabled: false } };
    calls.push(payload);
    if (payload.action === 'refresh') return { ok: false, error: { code: 'runtime_unavailable' } };
    return { ok: true, value: payload.mode === 'passive' ? { ...connected, runtime: undefined } : connected };
  } } } });
  t.after(() => harness.dispose()); harness.apply();
  const view = harness.render('majed-subscriptions'); await tick(); view.render();
  const alias = () => view.nodes(n => n.type === 'input' && n.props.maxLength === 128);
  assert.equal(alias()[0].props.value, 'Nondefault alias');
  assert.ok(view.one(n => n.type === 'input' && n.props.type === 'checkbox' && n.props.checked === true));
  await view.one(n => n.props['data-codex-action'] === 'refresh').props.onClick(); await tick(); view.render();
  assert.deepEqual(calls.map(p => [p.action, p.mode]), [['status', undefined], ['refresh', undefined], ['status', 'passive']]);
  assert.equal(alias().length, 0);
  assert.equal(view.nodes(n => n.props['data-codex-model-settings'] === true).length, 0);
  assert.ok(view.one(n => n.type === 'p' && n.props.children?.includes('fixture@example.test')));
  assert.equal(view.one(n => n.props.role === 'alert').props.children.join(''), language === 'ar'
    ? 'تتطلب نماذج Codex محمّل المضيف ودعم التحضير المرتبط بالحساب. حدّث إلى مضيف مدعوم وحاول مجددًا.'
    : 'Codex models require the host loader and account-bound preparation support. Update to a supported host and try again.');
  await view.one(n => n.props['data-codex-action'] === 'status').props.onClick(); await tick(); view.render();
  assert.equal(calls.at(-1).mode, undefined);
  assert.equal(alias()[0].props.value, 'Nondefault alias');
  assert.ok(view.one(n => n.type === 'input' && n.props.type === 'checkbox' && n.props.checked === true));
  assert.equal(view.nodes(n => n.props.role === 'alert').length, 0);
});

for (const statusFailure of ['envelope', 'transport']) test(`failed reconciliation never retains actionable connected metadata (${statusFailure})`, async t => {
  const source = await readFile(new URL('../../client.js', import.meta.url), 'utf8');
  const calls = [];
  const harness = createBaselineHarness(source, { connection: { rpc: { async call(channel, method, payload) {
    if (method === 'majed/settings/status') return { ok: true, value: { enabled: false } };
    calls.push(payload.action);
    if (calls.length === 1) return { ok: true, value: { enabled: true, state: 'connected', accounts: [{ id: 'retained', label: 'fixture@example.test', state: 'connected' }], runtimeEnabled: true, runtime: { catalogs: [{ models: [{ id: 'fixture-model' }] }] } } };
    if (statusFailure === 'transport') throw new Error('private-provider-detail');
    return { ok: false, error: { code: 'service_unavailable' } };
  } } } });
  t.after(() => harness.dispose()); harness.apply();
  const view = harness.render('majed-subscriptions'); await tick(); view.render();
  await view.one(n => n.props['data-codex-action'] === 'refresh').props.onClick(); await tick(); view.render();
  assert.deepEqual(calls, ['status', 'refresh', 'status']);
  assert.equal(view.nodes(n => n.props['data-codex-model-settings'] === true).length, 0);
  assert.equal(view.one(n => n.props['data-codex-action'] === 'default').props.disabled, true);
  assert.equal(view.one(n => n.props['data-codex-action'] === 'refresh').props.disabled, true);
  assert.doesNotMatch(JSON.stringify(view.nodes(() => true)), /Account connected\.|private-provider-detail/);
});

for (const phase of ['refresh', 'reconcile', 'unmount']) test(`refresh ${phase} ignores late transport settlement`, async t => {
  const source = await readFile(new URL('../../client.js', import.meta.url), 'utf8');
  const calls = []; let release, releaseReplacement, signal;
  const connected = { enabled: true, state: 'connected', runtimeEnabled: true,
    accounts: [{ id: 'retained', label: 'fixture@example.test', state: 'connected' }],
    runtime: { catalogs: [{ models: [{ id: 'fixture-model' }] }], preferences: {} } };
  const harness = createBaselineHarness(source, { connection: { rpc: { call(channel, method, payload, abort) {
    if (method === 'majed/settings/status') return Promise.resolve({ ok: true, value: { enabled: false } });
    calls.push(payload);
    if (calls.length === 1) return Promise.resolve({ ok: true, value: connected });
    if (phase === 'reconcile' && payload.action === 'refresh') return Promise.resolve({ ok: false, error: { code: 'runtime_unavailable' } });
    if (payload.action === 'status' && payload.mode !== 'passive') {
      return new Promise(resolve => { releaseReplacement = () => resolve({ ok: true, value: { ...connected, accounts: [{ ...connected.accounts[0], label: 'replacement@example.test' }] } }); });
    }
    signal = abort;
    return new Promise(resolve => { release = () => resolve({ ok: true, value: connected }); });
  } } } });
  t.after(() => harness.dispose()); harness.apply();
  const view = harness.render('majed-subscriptions'); await tick(); view.render();
  const operation = view.one(n => n.props['data-codex-action'] === 'refresh').props.onClick();
  await tick();
  let settled = false;
  operation.then(() => { settled = true; });
  if (phase === 'unmount') view.unmount();
  if (phase !== 'unmount') harness.runTimers(35_000);
  await tick();
  assert.equal(settled, true, 'owned operation settles without releasing transport or firing an unmount deadline');
  await operation;
  assert.equal([...harness.timers.values()].filter(timer => timer.delay === 35_000).length, 0);
  assert.equal(signal.aborted, true);
  assert.equal(calls.length, phase === 'reconcile' ? 3 : 2);
  if (phase === 'reconcile') assert.equal(calls[2].mode, 'passive');
  if (phase !== 'unmount') {
    view.render();
    assert.equal(view.nodes(n => n.props['data-codex-model-settings'] === true).length, 0);
    assert.equal(view.one(n => n.props['data-codex-action'] === 'default').props.disabled, true);
    assert.equal(view.one(n => n.props['data-codex-action'] === 'status').props.disabled, false);
    assert.equal(view.one(n => n.props.role === 'alert').props.children.join(''), phase === 'reconcile'
      ? 'Codex models require the host loader and account-bound preparation support. Update to a supported host and try again.'
      : 'Account operation failed. Refresh status or reconnect. No credential details are displayed.');
  }
  let replacement;
  if (phase !== 'unmount') {
    replacement = view.one(n => n.props['data-codex-action'] === 'status').props.onClick();
    await tick(); view.render();
    assert.equal(view.one(n => n.props['data-codex-action'] === 'status').props.disabled, true);
  }
  release(); await tick();
  if (phase !== 'unmount') {
    view.render();
    assert.equal(view.nodes(n => n.props['data-codex-model-settings'] === true).length, 0);
    assert.equal(view.one(n => n.props['data-codex-action'] === 'default').props.disabled, true);
    assert.equal(view.one(n => n.props['data-codex-action'] === 'status').props.disabled, true, 'old work cannot clear replacement busy');
    releaseReplacement(); await replacement; await tick(); view.render();
    assert.ok(view.one(n => n.type === 'p' && n.props.children?.includes('replacement@example.test')));
    assert.equal(view.one(n => n.props['data-codex-action'] === 'status').props.disabled, false);
    assert.ok(view.one(n => n.props['data-codex-model-settings'] === true));
  }
});
