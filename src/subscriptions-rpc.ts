export async function callSubscriptionsAuth<T>(rpc: any, endpoint: string, payload: object): Promise<T> {
  const result = await rpc.call('/api', `majed-subscriptions.${endpoint}`, payload);
  if (!result?.ok) throw new Error(result?.error?.message ?? 'Subscriptions unavailable');
  return result.value;
}
