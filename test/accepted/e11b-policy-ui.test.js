import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createBaselineHarness } from './helpers/baseline-client-harness.js';
const tick = async () => { for (let i = 0; i < 10; i++) await new Promise(resolve => setImmediate(resolve)); };
for (const language of ['en', 'ar']) test(`Owner policy Settings edit and reset independently with redacted failures (${language})`, async t => {
  const calls = [];
  const harness = createBaselineHarness(await readFile(new URL('../../client.js', import.meta.url), 'utf8'), { language, connection: { rpc: { async call(channel, method, payload) {
    calls.push({ method, payload });
    if (method !== 'majed/command-policy') return { ok: true, value: {} };
    if (payload.action === 'set') return { ok: false, error: { message: 'RAW_SECRET' } };
    if (payload.action === 'ledger') return { ok: true, value: { ledger: { counts: { unknown_script: 1 }, entries: [] } } };
    return { ok: true, value: { settings: { trustedProjects: ['/project'], denyEffects: ['publish'] } } };
  } } } });
  t.after(() => harness.dispose()); harness.apply();
  const view = harness.render('majed-routing'); await tick(); view.render();
  assert.equal(view.one(n => n.props['data-majed-policy'] === true).props.dir, language === 'ar' ? 'rtl' : 'ltr');
  const field = key => view.one(n => n.props['data-policy-field'] === key);
  field('trustedProjects').props.onChange({ target: { value: '["/other"]' } }); view.render();
  await view.one(n => n.props['data-policy-save'] === 'trustedProjects').props.onClick(); await tick(); view.render();
  assert.ok(view.nodes(n => n.props.role === 'alert').length);
  assert.doesNotMatch(JSON.stringify(view.nodes(() => true)), /RAW_SECRET/);
  await view.one(n => n.props['data-policy-reset'] === 'trustedProjects').props.onClick(); await tick(); view.render();
  assert.ok(calls.some(c => c.method === 'majed/command-policy' && c.payload.action === 'reset' && c.payload.field === 'trustedProjects'));
  assert.equal(field('denyEffects').props.value, '[\n  "publish"\n]');
  view.one(n => n.props['data-policy-session'] === true).props.onChange({ target: { value: 's1' } }); view.render();
  await view.one(n => n.props['data-policy-refresh'] === true).props.onClick(); await tick(); view.render();
  assert.match(JSON.stringify(view.one(n => n.props['data-policy-ledger'] === true)), /unknown_script/);
});

test('policy field responses preserve unrelated dirty drafts on reset and save', async t => {
  let settings = { trustedProjects: ['/project'], denyEffects: ['publish'] };
  const harness = createBaselineHarness(await readFile(new URL('../../client.js', import.meta.url), 'utf8'), { connection: { rpc: { async call(channel, method, payload) {
    if (method !== 'majed/command-policy') return { ok: true, value: {} };
    if (payload.action === 'set') settings = { ...settings, [payload.field]: payload.value };
    if (payload.action === 'reset') settings = { ...settings, [payload.field]: payload.field === 'aggressiveDestructive' ? true : payload.field === 'ownerContext' ? {} : [] };
    return { ok: true, value: { settings } };
  } } } });
  t.after(() => harness.dispose()); harness.apply();
  const view = harness.render('majed-routing'); await tick(); view.render();
  const field = key => view.one(n => n.props['data-policy-field'] === key);
  const action = (type, key) => view.one(n => n.props[`data-policy-${type}`] === key);
  field('denyEffects').props.onChange({ target: { value: '["delete"]' } }); view.render();
  await action('reset', 'trustedProjects').props.onClick(); await tick(); view.render();
  assert.equal(field('denyEffects').props.value, '["delete"]');
  field('trustedProjects').props.onChange({ target: { value: '["/saved"]' } }); view.render();
  await action('save', 'trustedProjects').props.onClick(); await tick(); view.render();
  assert.equal(field('denyEffects').props.value, '["delete"]');
  assert.equal(field('trustedProjects').props.value, '[\n  "/saved"\n]');
});
