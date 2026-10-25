// Copilot browser / manual OAuth strategy.
//
// Copilot authenticates through a browser authorization-code flow (auth URL +
// state, validated callback) and a manual token-entry path. Provider specific
// failure codes are reported, never a shared OAuth protocol.

import { randomUUID } from 'node:crypto';

const PREFIX = 'COPILOT';

export function createCopilotAuth({ clock } = {}) {
  const provider = 'copilot';
  const mechanisms = Object.freeze(['browser', 'manual']);
  const now = clock && typeof clock.now === 'function' ? () => clock.now() : () => Date.now();

  const codes = Object.freeze({
    INVALID_STATE: `${PREFIX}_INVALID_STATE`,
    INVALID_CODE: `${PREFIX}_INVALID_CODE`,
    ACCESS_DENIED: `${PREFIX}_ACCESS_DENIED`,
    REFRESH_FAILED: `${PREFIX}_REFRESH_FAILED`,
    REVOKED: `${PREFIX}_REVOKED`,
    NOT_AUTHENTICATED: `${PREFIX}_NOT_AUTHENTICATED`,
    UNKNOWN_ACCOUNT: `${PREFIX}_UNKNOWN_ACCOUNT`,
    MECHANISM_NOT_SUPPORTED: `${PREFIX}_MECHANISM_NOT_SUPPORTED`,
    MISSING_TOKENS: `${PREFIX}_MISSING_TOKENS`,
  });

  function createBrowserChallenge() {
    const state = `cp_state_${randomUUID()}`;
    const authUrl = `https://copilot.login/authorize?state=${encodeURIComponent(state)}`;
    return { authUrl, state };
  }

  // Copilot has no device surface in this bounded integration.
  function createDeviceChallenge() {
    throw new Error('Copilot does not expose a device mechanism.');
  }

  function refreshWillFail() {
    return false;
  }

  return Object.freeze({
    provider,
    mechanisms,
    codes,
    now,
    createBrowserChallenge,
    createDeviceChallenge,
    refreshWillFail,
  });
}
