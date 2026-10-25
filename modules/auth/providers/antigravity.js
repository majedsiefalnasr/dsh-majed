// Antigravity device authorization strategy.
//
// Antigravity authenticates through a device flow mirroring Grok's shape but
// with its own provider-specific failure codes. Provider specific failure
// codes are reported, never a shared OAuth protocol.

import { randomUUID } from 'node:crypto';

const PREFIX = 'ANTIGRAVITY';

export function createAntigravityAuth({ clock } = {}) {
  const provider = 'antigravity';
  const mechanisms = Object.freeze(['device']);
  const deviceTtlMs = 10 * 60_000;
  const deviceIntervalMs = 5_000;
  const now = clock && typeof clock.now === 'function' ? () => clock.now() : () => Date.now();

  const codes = Object.freeze({
    DEVICE_EXPIRED: `${PREFIX}_DEVICE_EXPIRED`,
    ACCESS_DENIED: `${PREFIX}_ACCESS_DENIED`,
    SLOW_DOWN: `${PREFIX}_SLOW_DOWN`,
    INVALID_STATE: `${PREFIX}_INVALID_STATE`,
    INVALID_CODE: `${PREFIX}_INVALID_CODE`,
    REFRESH_FAILED: `${PREFIX}_REFRESH_FAILED`,
    REVOKED: `${PREFIX}_REVOKED`,
    NOT_AUTHENTICATED: `${PREFIX}_NOT_AUTHENTICATED`,
    UNKNOWN_ACCOUNT: `${PREFIX}_UNKNOWN_ACCOUNT`,
    MECHANISM_NOT_SUPPORTED: `${PREFIX}_MECHANISM_NOT_SUPPORTED`,
  });

  function createDeviceChallenge() {
    const deviceCode = `ag_device_${randomUUID()}`;
    const userCode = `AG-${randomUUID().slice(0, 8).toUpperCase()}`;
    return { deviceCode, userCode, verificationUri: 'https://antigravity.device/enter' };
  }

  // Antigravity has no browser/manual surface in this bounded integration.
  function createBrowserChallenge() {
    throw new Error('Antigravity does not expose a browser/manual mechanism.');
  }

  function refreshWillFail() {
    return false;
  }

  return Object.freeze({
    provider,
    mechanisms,
    deviceTtlMs,
    deviceIntervalMs,
    codes,
    now,
    createDeviceChallenge,
    createBrowserChallenge,
    refreshWillFail,
  });
}
