/** Feature-owned registrations; Agent identity, never session id, owns teardown. */
export async function mountOverlays(ctx, core, invalidators) {
  const agents = new Map();
  const stops = [];
  let closed = false;
  const plugin = { inject: ['skills'], apply(owner) {
    owner.skills.registerProvider(control => {
      invalidators.add(control.invalidate);
      control.signal.addEventListener('abort', () => invalidators.delete(control.invalidate), { once: true });
      return { name: 'dsh-majed-skills', async list(options) {
        return (await core.listProviderCandidates(options)).map(candidate => ({ ...candidate, provider: 'dsh-majed-skills' }));
      }, get: (candidate, options) => core.getProviderSkill(candidate, options) };
    });
  } };
  const root = ctx.plugin(plugin);
  const detach = async agent => {
    const fiber = agents.get(agent);
    if (!fiber) return;
    agents.delete(agent);
    await fiber.dispose();
  };
  const attach = async agent => {
    if (closed || agents.has(agent)) return;
    if (!agent.ctx?.get('skills')?.registerProvider) throw new Error('skills_unavailable');
    const fiber = agent.ctx.plugin(plugin);
    agents.set(agent, fiber);
    try { await fiber; if (closed) await detach(agent); }
    catch (error) { await detach(agent); throw error; }
  };
  let disposal;
  const dispose = () => disposal ??= (async () => {
    closed = true;
    for (const stop of stops.splice(0)) stop();
    const results = await Promise.allSettled([...agents.values()].map(fiber => fiber.dispose()));
    agents.clear();
    try { await root.dispose(); }
    finally {
      const failed = results.find(result => result.status === 'rejected');
      if (failed) throw failed.reason;
    }
  })();
  // Register listeners before enumeration so a new Agent cannot be missed.
  try {
    stops.push(ctx.on('agent/created', ({ agent }) => attach(agent)));
    stops.push(ctx.on('agent/disposed', ({ agent }) => detach(agent)));
    await root;
    for (const agent of ctx.get('agents')?.list() ?? []) await attach(agent);
    return { dispose };
  } catch (error) { await dispose(); throw error; }
}
