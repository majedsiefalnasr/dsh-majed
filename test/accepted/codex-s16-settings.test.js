import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as llmModule from '@deepseek-ai/dsh-llm';
import { createCodexRuntime } from '../../modules/subscriptions/codex/runtime.js';

test('reference settings project into the real catalog and resolved metadata, while pools remain saved-only', async t => {
  const directory = await mkdtemp(join(tmpdir(), 's16-settings-')); t.after(() => rm(directory, { recursive: true, force: true }));
  const id = 'a'.repeat(64); let adapter;
  const runtime = await createCodexRuntime({ llmModule, path: join(directory, 'catalog'), accounts: { snapshot: async () => ({ accounts: [{ id, label: 'f•••@example.test', state: 'connected', default: true }] }), subscribe: () => () => {}, session: async () => ({ accessToken: 'fixture', accountId: 'fixture' }) },
    llm: { registerAdapter(providers, value) { adapter = value; return Object.assign(() => {}, { replace() {} }); } }, fetch: async () => Response.json({ models: [{ slug: 'fixture', display_name: 'Fixture', context_window: 400000, max_context_window: 400000, supports_fast_mode: true }] }) });
  t.after(() => runtime.dispose());
  await runtime.setProviderSettings({ displayName: 'My Codex', accounts: { [id]: { alias: 'Work', independentEntry: true, poolEnabled: false, poolModels: [] } }, visibleModels: ['fixture'], modelDisplayNames: { fixture: 'Custom' }, contextWindows: { fixture: 100000 } });
  const models = await adapter.listModels('codex');
  assert.equal(models.find(m => m.id === 'fixture').name, 'Custom');
  assert.equal(models.find(m => m.id.startsWith('~account:')).name, 'Work · Custom');
  assert.equal((await adapter.resolveModel('codex', 'fixture')).context.contextWindow, 100000);
  assert.equal((await runtime.providerSettings()).settings.accounts[id].poolEnabled, false);
  assert.equal(adapter.providerInfo('codex').name, 'My Codex');
  await assert.rejects(runtime.setProviderSettings({ promptCacheTtl: '1h' }), { code: 'INVALID_REQUEST' });
});
