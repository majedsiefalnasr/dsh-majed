/** Stable error kinds of the Waycraft subscriptions RPC (names align with the skills route codes). */
export const RPC_ERROR_KINDS = [
    'invalid-request',
    'not-found',
    'forbidden',
    'conflict',
    'too-large',
    'unavailable',
    'internal',
];
/** An RPC failure with a known kind; anything else is classified by {@link rpcErrorKind}. */
export class RpcFailure extends Error {
    kind;
    constructor(kind, message) {
        super(message);
        this.kind = kind;
    }
}
const KIND_BY_STATUS = {
    400: 'invalid-request',
    401: 'forbidden',
    403: 'forbidden',
    404: 'not-found',
    409: 'conflict',
    413: 'too-large',
    429: 'unavailable',
};
/** Map any thrown value to one stable kind; unknown shapes are `internal`. */
export function rpcErrorKind(error) {
    if (error instanceof RpcFailure)
        return error.kind;
    const status = error?.status;
    if (typeof status === 'number')
        return (KIND_BY_STATUS[status] ?? (status >= 500 ? 'unavailable' : 'internal'));
    if (error instanceof Error && /^payload\./.test(error.message))
        return 'invalid-request';
    if (error instanceof Error && /unavailable|disabled/i.test(error.message))
        return 'unavailable';
    return 'internal';
}
