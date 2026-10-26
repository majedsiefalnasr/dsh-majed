// Adapted from V1ki/dsh-plugin-subscriptions 9930c5e (MIT); see PROVENANCE.md.
export const CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann';
export const TOKEN_URL = 'https://auth.openai.com/oauth/token';
export const codexFlow = {
  callbackPath: '/auth/callback',
  listen: { host: 'localhost', ports: [1455, 1457] },
  buildAuthorizeUrl({ redirectUri, state, pkce }) {
    return 'https://auth.openai.com/oauth/authorize?' + new URLSearchParams({
      response_type: 'code', client_id: CLIENT_ID, redirect_uri: redirectUri,
      scope: 'openid profile email offline_access api.connectors.read api.connectors.invoke',
      code_challenge: pkce.challenge, code_challenge_method: 'S256', state,
      id_token_add_organizations: 'true', codex_cli_simplified_flow: 'true', originator: 'codex_cli_rs',
    });
  },
};
const fail = code => Object.assign(new Error(code), { code });
function claims(jwt) {
  try { return JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString()); }
  catch { return {}; }
}
export function sessionFrom(tokens, previous, now = Date.now()) {
  const identity = claims(tokens.id_token || previous?.idToken || '');
  const auth = identity['https://api.openai.com/auth'];
  const accountId = auth?.chatgpt_account_id || previous?.accountId;
  const user = auth?.chatgpt_user_id || auth?.user_id || identity.email || previous?.user;
  const expiresAt = typeof tokens.expires_in === 'number' && tokens.expires_in > 0
    ? now + tokens.expires_in * 1000 : Number(claims(tokens.access_token || '').exp) * 1000;
  const refreshToken = tokens.refresh_token ?? previous?.refreshToken;
  if (typeof tokens.access_token !== 'string' || !tokens.access_token || typeof refreshToken !== 'string' || !refreshToken || typeof accountId !== 'string' || !accountId || !Number.isFinite(expiresAt) || expiresAt <= now) throw fail('invalid_token_response');
  if (previous && (accountId !== previous.accountId || (previous.user && user !== previous.user))) throw fail('invalid_token_response');
  return { accessToken: tokens.access_token, refreshToken, expiresAt, accountId,
    ...(tokens.id_token || previous?.idToken ? { idToken: tokens.id_token || previous.idToken } : {}),
    ...(typeof user === 'string' ? { user } : {}), label: identity.email || previous?.label || 'Codex account' };
}
async function requestGrant(fetchFn, fields, { refresh = false, previous, signal, now } = {}) {
  const body = { client_id: CLIENT_ID, ...fields };
  // Upstream Codex uses form encoding for exchange and JSON for refresh.
  const response = await fetchFn(TOKEN_URL, { method: 'POST', signal,
    headers: { 'content-type': refresh ? 'application/json' : 'application/x-www-form-urlencoded' },
    body: refresh ? JSON.stringify(body) : new URLSearchParams(body).toString(),
  });
  if (!response.ok) {
    let error; try { error = (await response.json()).error; } catch { /* redact all remote error text */ }
    throw fail(['invalid_grant', 'refresh_token_expired', 'refresh_token_reused', 'refresh_token_invalidated'].includes(error) ? 'reauthentication_required' : 'token_request_failed');
  }
  return sessionFrom(await response.json(), previous, now);
}
export async function grant(fetchFn, fields, options = {}) {
  const { signal } = options;
  signal?.throwIfAborted();
  let onAbort;
  const aborted = new Promise((_, reject) => {
    onAbort = () => reject(fail('request_cancelled'));
    signal?.addEventListener('abort', onAbort, { once: true });
  });
  try { return await Promise.race([requestGrant(fetchFn, fields, options), aborted]); }
  finally { signal?.removeEventListener('abort', onAbort); }
}
