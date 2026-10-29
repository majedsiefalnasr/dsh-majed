// Adapted from V1ki/dsh-plugin-subscriptions v0.9.11, src/providers/codex.ts.
// Commit 7639ed9958a9a1c4159faa1f4e6e15e9ede60b7d, MIT; see PROVENANCE.md.
import { randomUUID } from 'node:crypto';
const base = 'https://chatgpt.com/backend-api/wham/';
const fail = code => Object.assign(new Error(code), { code });
const date = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) ? Date.parse(value) : undefined;
function windowOf(value, fallback, now) {
  if (!value || !Number.isFinite(value.used_percent)) return undefined;
  const seconds = value.limit_window_seconds;
  const matches = target => seconds >= target * .95 && seconds <= target * 1.05;
  const kind = !Number.isFinite(seconds) || seconds <= 0 ? fallback : matches(18000) ? 'session' : matches(604800) ? 'weekly' : 'other';
  const resetsAt = Number.isFinite(value.reset_at) && value.reset_at > 0 ? value.reset_at * 1000
    : Number.isFinite(value.reset_after_seconds) && value.reset_after_seconds > 0 ? now + value.reset_after_seconds * 1000 : undefined;
  return { kind, usedPercent: value.used_percent, ...(resetsAt ? { resetsAt } : {}) };
}
/** Host-only credential access; bounded responses and one-use tickets fence uncertain redemption. */
export function createCodexUsage({ accounts, fetch: transport = globalThis.fetch, now = Date.now }) {
  const tickets = new Map(), spent = new Set(), lifecycle = new AbortController();
  async function request(account, endpoint, body) {
    try {
      const signal = AbortSignal.any([lifecycle.signal, AbortSignal.timeout(15000)]);
      const session = await accounts.session(account, { signal });
      const response = await transport(base + endpoint, { signal, redirect: 'error', ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}), headers: {
        authorization: `Bearer ${session.accessToken}`, 'chatgpt-account-id': session.accountId, originator: endpoint === 'usage' ? 'codex_cli_rs' : 'Codex Desktop',
        'openai-beta': 'codex-1', accept: 'application/json', ...(body ? { 'content-type': 'application/json' } : {}),
      } });
      if (!response.ok) { await response.body?.cancel(); throw fail('usage_unavailable'); }
      const reader = response.body?.getReader(); if (!reader) throw fail('usage_unavailable');
      let size = 0; const chunks = [];
      try { while (true) { signal.throwIfAborted(); const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > 65536) throw fail('usage_unavailable'); chunks.push(value); } }
      finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
      return JSON.parse(Buffer.concat(chunks).toString());
    } catch { throw fail('usage_unavailable'); }
  }
  async function credits(account) {
    const data = await request(account, 'rate-limit-reset-credits');
    if (!Array.isArray(data?.credits) || data.credits.length > 128) throw fail('usage_unavailable');
    return data.credits.filter(c => c && c.status === 'available' && c.reset_type === 'codex_rate_limits').map(c => ({
      ...(typeof c.id === 'string' && c.id.length <= 256 ? { id: c.id } : {}), ...(date(c.granted_at) ? { grantedAt: date(c.granted_at) } : {}), ...(date(c.expires_at) ? { expiresAt: date(c.expires_at) } : {}),
    }));
  }
  return {
    async read(account) {
      const data = await request(account, 'usage');
      const windows = [windowOf(data?.rate_limit?.primary_window, 'session', now()), windowOf(data?.rate_limit?.secondary_window, 'weekly', now())].filter(Boolean);
      const result = { supported: true, windows, ...(typeof data?.plan_type === 'string' && data.plan_type.length <= 80 ? { plan: data.plan_type } : {}) };
      try { result.resetCredits = await credits(account); } catch { result.resetCreditsError = 'usage_unavailable'; }
      return result;
    },
    async prepare(account) {
      const credit = (await credits(account)).find(c => c.id && !spent.has(account + ':' + c.id) && (!c.expiresAt || c.expiresAt > now()));
      if (!credit) throw fail('reset_unavailable');
      for (const [key, entry] of tickets) if (entry.expiresAt <= now()) tickets.delete(key);
      if (tickets.size >= 128) throw fail('reset_unavailable');
      const ticket = randomUUID(); tickets.set(ticket, { account, credit: credit.id, expiresAt: now() + 60000 });
      return { ticket, credit, expiresAt: now() + 60000 };
    },
    async consume(account, ticket) {
      const entry = tickets.get(ticket);
      if (!entry || entry.account !== account || entry.expiresAt <= now() || spent.has(account + ':' + entry.credit)) throw fail('invalid_reset_ticket');
      tickets.delete(ticket); spent.add(account + ':' + entry.credit);
      const data = await request(account, 'rate-limit-reset-credits/consume', { redeem_request_id: ticket, credit_id: entry.credit });
      if (data?.code !== 'reset') throw fail('reset_unconfirmed');
      return { ok: true };
    },
    dispose() { lifecycle.abort(); tickets.clear(); spent.clear(); },
  };
}
