/** Stable error kinds of the Waycraft subscriptions RPC (names align with the skills route codes). */
export const RPC_ERROR_KINDS = [
  'invalid-request',
  'not-found',
  'forbidden',
  'conflict',
  'too-large',
  'unavailable',
  'internal',
] as const;
export type RpcErrorKind = (typeof RPC_ERROR_KINDS)[number];

/** An RPC failure with a known kind; anything else is classified by {@link rpcErrorKind}. */
export class RpcFailure extends Error {
  readonly kind: RpcErrorKind;
  constructor(kind: RpcErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

const KIND_BY_STATUS: Record<number, RpcErrorKind> = {
  400: 'invalid-request',
  401: 'forbidden',
  403: 'forbidden',
  404: 'not-found',
  409: 'conflict',
  413: 'too-large',
  429: 'unavailable',
};

/** Map any thrown value to one stable kind; unknown shapes are `internal`. */
export function rpcErrorKind(error: unknown): RpcErrorKind {
  if (error instanceof RpcFailure) return error.kind;
  const status = (error as { status?: unknown } | null)?.status;
  if (typeof status === 'number')
    return (
      KIND_BY_STATUS[status] ?? (status >= 500 ? 'unavailable' : 'internal')
    );
  if (error instanceof Error && /^payload\./.test(error.message))
    return 'invalid-request';
  if (error instanceof Error && /unavailable|disabled/i.test(error.message))
    return 'unavailable';
  return 'internal';
}
