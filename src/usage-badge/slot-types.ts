/** Connection RPC caller shape shared by the composer surfaces (structural; no host type import). */
export interface RpcLike { call(channel: string, method: string, payload: unknown): Promise<any> }
export interface ConnectionLike { rpc: RpcLike }
