import type { RpcErrorKind } from '../rpc-errors.js';
type ConnectionHandle = {
  rpc: {
    call(channel: string, method: string, payload: unknown): Promise<any>;
  };
};
type RpcResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { message: string; kind?: RpcErrorKind } };

/**
 * The node half mounts every endpoint as an exact POST route on the shared
 * `/api` channel (`/api/waycraft-subscriptions.<endpoint>`), so the browser
 * reaches it through the `/api` channel with a prefixed endpoint name.
 * A dedicated channel is no longer used: since dsh 0.1.5 `rpc.handle`
 * cannot register one from a plugin (see `src/auth/rpc.ts`).
 */
const SUBSCRIPTIONS_AUTH_CHANNEL = '/api';
const SUBSCRIPTIONS_AUTH_PREFIX = 'waycraft-subscriptions.';

/** Business error returned by a `subscriptions-auth` endpoint (error branch message). */
export class SubscriptionsAuthError extends Error {
  /** Stable error kind from the host; `internal` for older hosts that send none. */
  readonly kind: RpcErrorKind;
  constructor(message: string, kind: RpcErrorKind = 'internal') {
    super(message);
    this.kind = kind;
  }
}

/**
 * Call one `subscriptions-auth` endpoint and unwrap the business result.
 * Shared by the settings section, the composer Speed toggle, the usage
 * badge, and the image/video toolviews.
 * @param rpc - Connection RPC caller.
 * @param endpoint - endpoint name (`status`, `usage`, `image`, ...).
 * @param payload - endpoint-owned request payload.
 * @returns the success value, cast by the caller to the endpoint's shape.
 */
export async function callSubscriptionsAuth<T>(
  rpc: ConnectionHandle['rpc'],
  endpoint: string,
  payload: unknown,
): Promise<T> {
  let result: RpcResult<unknown>;
  try {
    result = await rpc.call(
      SUBSCRIPTIONS_AUTH_CHANNEL,
      `${SUBSCRIPTIONS_AUTH_PREFIX}${endpoint}`,
      payload,
    );
  } catch (error) {
    // The transport rejected rather than answering; surface the same way.
    throw new SubscriptionsAuthError(
      error instanceof Error ? error.message : String(error),
      'unavailable',
    );
  }
  if (!result.ok)
    throw new SubscriptionsAuthError(result.error.message, result.error.kind);
  return result.value as T;
}
