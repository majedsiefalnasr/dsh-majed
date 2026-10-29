/** Presence-only component. Authentication and Owner authorization belong to connection's shared /api bridge. */
interface Route {
  path: string;
  methods: readonly string[];
  requestBody: 'buffered';
  fetch(request: Request): Promise<Response>;
}
interface Context {
  inject(names: string[], callback: (ctx: Context) => void): void;
  get(name: 'connection'): { fetch: { register(route: Route): () => unknown } };
  effect(callback: () => (() => unknown), label: string): unknown;
}
export function apply(ctx: Context): void {
  ctx.inject(['connection'], (ctx) => {
    const connection = ctx.get('connection');
    ctx.effect(() => connection.fetch.register({
      path: '/api/majed-subscriptions.status', methods: ['POST'], requestBody: 'buffered',
      async fetch(request) {
        if (request.headers.get('content-type')?.split(';')[0]?.trim() !== 'application/json') {
          return new Response('content type must be application/json', { status: 415 });
        }
        let body;
        try { body = await request.json(); } catch { return new Response('invalid JSON', { status: 400 }); }
        if (body?.type !== 'client-request' || typeof body.rpcId !== 'string' || body.method !== 'majed-subscriptions.status') {
          return new Response('invalid probe envelope', { status: 400 });
        }
        return Response.json({ type: 'server-response', rpcId: body.rpcId,
          result: { ok: true, value: { ok: true, component: 'subscriptions', version: '0.2.0' } } });
      },
    }), 'dsh-majed: subscriptions presence route');
  });
}
