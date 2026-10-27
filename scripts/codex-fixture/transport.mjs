// Synthetic transport only. Never delegates to a network implementation.
const TOKEN = 'https://auth.openai.com/oauth/token';
const CATALOG = 'https://chatgpt.com/backend-api/codex/models?client_version=0.153.4';
const RESPONSES = 'https://chatgpt.com/backend-api/codex/responses';
const frame = data => `data: ${JSON.stringify(data)}\n\n`;
export function createFixtureFetch() {
  const counts = { token: 0, catalog: 0, responses: 0, denied: 0 };
  return {
    counters: () => ({ ...counts }),
    async fetch(url, options = {}) {
      if (url === TOKEN && options.method === 'POST') {
        counts.token++;
        const identity = { email: 'synthetic-codex@example.test', 'https://api.openai.com/auth': { chatgpt_account_id: 'synthetic-fixture-workspace', chatgpt_user_id: 'synthetic-fixture-user' } };
        return Response.json({ access_token: 'SYNTHETIC-FIXTURE-NOT-A-CREDENTIAL', refresh_token: 'SYNTHETIC-FIXTURE-REFRESH', expires_in: 3600,
          id_token: 'synthetic.' + Buffer.from(JSON.stringify(identity)).toString('base64url') + '.not-signed' });
      }
      if (url === CATALOG && (!options.method || options.method === 'GET')) {
        counts.catalog++;
        return Response.json({ models: [{ slug: 'synthetic-codex', display_name: 'Synthetic Codex — fixture only', context_window: 120000,
          supported_reasoning_levels: [{ effort: 'low' }, { effort: 'high' }], default_reasoning_level: 'low', service_tiers: [{ id: 'priority' }] }] });
      }
      if (url === RESPONSES && options.method === 'POST') {
        counts.responses++;
        return new Response(frame({ type: 'response.output_text.delta', item_id: 'synthetic-message', content_index: 0, delta: 'SYNTHETIC CODEX FIXTURE: no provider inference occurred.' })
          + frame({ type: 'response.completed', response: { usage: { input_tokens: 7, output_tokens: 3 }, output: [] } }), { headers: { 'content-type': 'text/event-stream' } });
      }
      counts.denied++;
      throw new Error('fixture_transport_denied');
    },
  };
}
