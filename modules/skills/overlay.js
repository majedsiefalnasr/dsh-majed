/** Feature-owned registrations; Agent identity, never session id, owns teardown. */
export async function mountOverlays(ctx, core, invalidators) {
  const agents = new Map();
  const stops = [];
  let closed = false;
  const provider = (owner, skills, name = 'dsh-majed-skills') => {
    skills.registerProvider(control => {
      invalidators.add(control.invalidate);
      control.signal.addEventListener('abort', () => invalidators.delete(control.invalidate), { once: true });
      return { name, async list(options) {
        return (await core.listProviderCandidates(options)).map(candidate => ({ ...candidate, provider: name }));
      }, get: (candidate, options) => core.getProviderSkill(candidate, options) };
    });
  };
  const plugin = { inject: ['skills'], apply(owner) { provider(owner, owner.skills); } };
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
    const selected = ctx.get('agentPresets')?.serviceFor?.(agent, 'skills');
    const fiber = agent.ctx.plugin({ inject: ['skills'], apply(owner) {
      provider(owner, owner.skills);
      // serviceFor can return an isolated implementation outside Agent.ctx's
      // realm. Public tracing binds its registration to this Agent-owned fiber
      // and scope, rather than borrowing the preset's standing owner context.
      if (selected) provider(owner, owner.reflect.trace(selected), 'dsh-majed-preset-skills');
    } });
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
