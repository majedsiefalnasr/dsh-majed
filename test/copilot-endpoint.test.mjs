// #134 account-specific HTTP differential; no provider traffic.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CopilotAdapter } from '../dist/providers/copilot.js';
import { AccountTokenManager } from '../dist/providers/accounts.js';

test('selected account controls incompatible catalog metadata and actual streaming endpoint; discovery abort sends no chat', async () => {
  const sessions = new Map(['a', 'b'].map(key => [key, { accessToken: key, refreshToken: `fixture-${key}`, expiresAt: 4000000000000 }]));
  const tokens = new AccountTokenManager({ provider: 'copilot', displayName: 'Fixture',
    makeOptions: () => ({ preemptMs: 0, refresh: async s => s, isPermanent: () => false }),
    io: { list: async () => [...sessions].map(([key, session]) => ({ key, session })), get: async key => sessions.get(key ?? 'a'), save: async () => {}, remove: async () => {} } });
  const original = globalThis.fetch, calls = [];
  let hang = false, entered;
  const entry = new Promise(resolve => { entered = resolve; });
  const fake = async (url, init) => {
    const account = new Headers(init?.headers).get('authorization')?.slice(7);
    if (String(url).includes('/api/releases/stable')) return Response.json(['1.107.0']);
    if (String(url).endsWith('/models')) {
      if (hang) { entered(); return new Promise(() => {}); }
      return Response.json({ data: [{ id: 'same', name: account, model_picker_enabled: true,
        supported_endpoints: [account === 'a' ? '/chat/completions' : '/responses'],
        capabilities: { limits: { max_context_window_tokens: account === 'a' ? 8000 : 32000 }, supports: { reasoning_effort: account === 'a' ? ['low'] : ['high'] } } }] });
    }
    calls.push({ url: String(url), account, body: JSON.parse(init.body) });
    assert.equal(String(url), `https://api.githubcopilot.com/${account === 'a' ? 'chat/completions' : 'responses'}`, 'wrong protocol rejected by incompatible fixture');
    return account === 'a'
      ? new Response('data: {"choices":[{"delta":{"content":"chat-a"},"finish_reason":null}]}\n\ndata: [DONE]\n\n')
      : new Response('data: {"type":"response.output_text.delta","item_id":"fixture","delta":"responses-b"}\n\ndata: {"type":"response.completed","response":{}}\n\n');
  };
  globalThis.fetch = fake;
  const adapter = new CopilotAdapter({ tokens, models: [], discovery: true, streamIdleTimeoutMs: 1000, fetchFn: fake });
  try {
    // Warm the opposite account first: a provider-wide cache would choose the wrong wire.
    for (const [account, context, effort, reply] of [['b', 32000, 'high', 'responses-b'], ['a', 8000, 'low', 'chat-a'], ['b', 32000, 'high', 'responses-b']]) {
      const model = await adapter.resolveOwnModel('copilot', 'same', account);
      assert.equal(model.context.contextWindow, context);
      assert.deepEqual(model.reasoning.efforts.map(e => e.id), [effort]);
      const chunks = [];
      for await (const chunk of adapter.streamAccount({ provider: 'copilot', model: 'same', messages: [], reasoningEffort: effort, signal: new AbortController().signal }, account)) chunks.push(chunk);
      assert.ok(JSON.stringify(chunks).includes(reply));
    }
    assert.deepEqual(calls.map(c => c.account), ['b', 'a', 'b']);
    assert.equal(calls[0].body.reasoning.effort, 'high');
    assert.equal(calls[1].body.reasoning_effort, 'low');
    hang = true; adapter.clearAccountCatalog('b');
    const controller = new AbortController();
    const aborted = (async () => { for await (const _ of adapter.streamAccount({ provider: 'copilot', model: 'same', messages: [], signal: controller.signal }, 'b')) {} })();
    await entry; controller.abort(new Error('fixture abort'));
    await assert.rejects(aborted);
    assert.equal(calls.length, 3, 'aborted discovery never dispatches inference');
  } finally { globalThis.fetch = original; }
});
