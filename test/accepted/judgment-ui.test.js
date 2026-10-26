import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createBaselineHarness } from './helpers/baseline-client-harness.js';
const tick = async () => { for (let i = 0; i < 10; i++) await new Promise(resolve => setImmediate(resolve)); };

for (const language of ['en', 'ar']) test(`judgment Settings require explicit test consent and never refill the credential (${language})`, async t => {
  const source = await readFile(new URL('../../client.js', import.meta.url), 'utf8');
  const calls = [];
  const harness = createBaselineHarness(source, { language, connection: { rpc: { async call(channel, method, payload) {
    calls.push({ channel, method, payload });
    if (method === 'majed/settings/status') return { ok: true, value: { module: 'routing', enabled: false, state: 'disabled' } };
    return { ok: true, value: payload.action === 'validate' ? { requestedModel: 'jev-requested', actualModel: 'jev-actual', choice: 'ready', usage: { input_tokens: 2 } }
      : { protocol: 'systemone', addressConfigured: true, modelConfigured: true, credentialConfigured: true, smartEnabled: false } };
  } } } });
  t.after(() => harness.dispose()); harness.apply();
  const view = harness.render('majed-routing'); await tick(); view.render();
  assert.equal(view.one(n => n.props['data-majed-judgment'] === true).props.dir, language === 'ar' ? 'rtl' : 'ltr');
  assert.equal(view.one(n => n.props['data-judgment-field'] === 'credential').props.value, '');
  assert.equal(view.one(n => n.props['data-judgment-action'] === 'validate').props.disabled, true);
  view.one(n => n.props['data-judgment-field'] === 'consent').props.onChange({ target: { checked: true } }); view.render();
  await view.one(n => n.props['data-judgment-action'] === 'validate').props.onClick(); await tick(); view.render();
  assert.ok(calls.some(call => call.channel === '/api' && call.method === 'majed/judgment/manage' && call.payload.action === 'validate' && call.payload.consent === true));
  assert.equal(view.one(n => n.props['data-judgment-field'] === 'consent').props.checked, false);
  assert.equal(view.one(n => n.props['data-judgment-field'] === 'credential').props.value, '');
});
