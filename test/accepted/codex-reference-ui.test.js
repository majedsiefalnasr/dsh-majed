import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createBaselineHarness } from './helpers/baseline-client-harness.js';
const tick = async view => { for (let i = 0; i < 12; i++) await new Promise(resolve => setImmediate(resolve)); view.render(); };
for (const language of ['en', 'ar']) test(`ported reference renders controlled quota windows and saved-only pool controls (${language})`, async t => {
  const source = await readFile(new URL('../../dist/client.js', import.meta.url), 'utf8');
  const id = 'a'.repeat(64), calls = [];
  const catalog = { provider: 'codex', settings: { accounts: {} }, accounts: [{ key: id, label: 'fixture@example.test', models: [{ id: 'fixture', name: 'Fixture' }] }], models: [{ id: 'fixture', name: 'Fixture', efforts: [] }], tools: [] };
  const harness = createBaselineHarness(source, { language, connection: { rpc: { async call(channel, method, p) {
    calls.push({ method, p });
    if (method === 'majed/settings/status') return { ok: true, value: { enabled: true } };
    if (method === 'majed/subscriptions.status') return { ok: true, value: { providers: { codex: { busy: false, accounts: [{ key: id, account: 'fixture@example.test', isDefault: true }], clientVersion: { version: '0.165.0', source: 'fallback' } } } } };
    if (method === 'majed/subscriptions.usage') return { ok: true, value: { supported: true, plan: 'plus', windows: [{ kind: 'session', usedPercent: 39, resetsAt: 1900000000000 }, { kind: 'weekly', usedPercent: 53, resetsAt: 1900500000000 }] } };
    if (method === 'majed/subscriptions.providerSettings') return { ok: true, value: catalog };
    return { ok: true, value: { enabled: true, runtimeEnabled: true, runtimeAvailable: true, state: 'connected', accounts: [], runtime: { catalogs: [], preferences: {} } } };
  } } } });
  t.after(() => harness.dispose()); harness.apply(); const view = harness.render('majed-subscriptions');
  await tick(view); await tick(view); await tick(view);
  const text = JSON.stringify(view.nodes(() => true));
  assert.match(text, /39%/); assert.match(text, /53%/); assert.match(text, /fixture@example.test/);
  assert.ok(calls.some(c => c.method === 'majed/subscriptions.usage'));
  const manage = view.one(n => n.type === 'button' && n.props['aria-haspopup'] === 'dialog');
  manage.props.onClick(); await tick(view); await tick(view);
  const dialog = view.one(n => n.type === 'dialog' && n.props.className === 'dsh-subscription-manager'); assert.ok(dialog);
  const managed = JSON.stringify(view.nodes(() => true));
  assert.match(managed, language === 'ar' ? /محفوظ؛ يُطبق/ : /Saved; applies when manual pools arrive/);
  assert.doesNotMatch(managed, /Prompt cache lifetime|عمر ذاكرة/);
});
