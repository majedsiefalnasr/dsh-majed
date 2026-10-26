import test from 'node:test';
import assert from 'node:assert/strict';
import { mountOverlays } from '../../modules/skills/overlay.js';

// Controlled public-context doubles: native scope precedence is covered separately.
function fixture() {
  const listeners = new Map(), effects = [], rows = new Set(), invalidators = new Set();
  let live = [], fail = false;
  const context = () => ({
    get: name => name === 'agents' ? { list() { assert.equal(listeners.size, 2); return live; } } : { registerProvider() {} },
    on(name, run) { listeners.set(name, run); return () => listeners.delete(name); },
    effect(run) { effects.push(run()); },
    plugin(plugin) {
      const abort = new AbortController();
      let error;
      const owned = [];
      const skills = { registerProvider(create) {
        const row = { invalidations: 0 }; owned.push(row);
        create({ signal: abort.signal, invalidate() { row.invalidations++; } });
        if (fail) throw new Error('registration failed');
        rows.add(row);
      } };
      try {
        plugin.apply({ skills, reflect: { trace() { return skills; } } });
      } catch (value) { error = value; abort.abort(); }
      return { then(resolve, reject) { return error ? reject(error) : resolve(); },
        async dispose() { for (const row of owned) rows.delete(row); abort.abort(); } };
    },
  });
  const ctx = context();
  return { ctx, rows, invalidators, listeners, effects, agent: id => ({ id, ctx: context() }),
    setLive(value) { live = value; }, fail() { fail = true; },
    emit: (name, agent) => listeners.get(name)?.({ agent }) };
}
const core = { listProviderCandidates: async () => [], getProviderSkill() {} };

test('selected preset registration shares exact Agent invalidation and teardown ownership', async () => {
  const f = fixture(), agent = f.agent('preset'); f.setLive([agent]);
  const get = f.ctx.get;
  f.ctx.get = name => name === 'agentPresets' ? { serviceFor(value, key) {
    assert.equal(value, agent); assert.equal(key, 'skills'); return {};
  } } : get(name);
  const runtime = await mountOverlays(f.ctx, core, f.invalidators);
  assert.equal(f.rows.size, 3);
  for (const invalidate of f.invalidators) invalidate();
  assert.ok([...f.rows].every(row => row.invalidations === 1));
  await f.emit('agent/disposed', agent);
  assert.equal(f.rows.size, 1); assert.equal(f.invalidators.size, 1);
  await runtime.dispose(); assert.equal(f.rows.size, 0); assert.equal(f.listeners.size, 0);
});

test('overlay owns pre-existing, new and reused-id Agents by exact identity and cleans feature restart', async () => {
  const f = fixture(), first = f.agent('same'); f.setLive([first]);
  const runtime = await mountOverlays(f.ctx, core, f.invalidators);
  assert.equal(f.rows.size, 2);
  await f.emit('agent/created', first); assert.equal(f.rows.size, 2);
  const replacement = f.agent('same'); await f.emit('agent/created', replacement);
  assert.equal(f.rows.size, 3);
  for (const invalidate of f.invalidators) invalidate();
  assert.ok([...f.rows].every(row => row.invalidations === 1));
  await f.emit('agent/disposed', first); assert.equal(f.rows.size, 2);
  await f.emit('agent/disposed', first); assert.equal(f.rows.size, 2);
  await runtime.dispose(); assert.equal(f.rows.size, 0); assert.equal(f.invalidators.size, 0); assert.equal(f.listeners.size, 0);
  f.setLive([replacement]);
  const restarted = await mountOverlays(f.ctx, core, f.invalidators);
  assert.equal(f.rows.size, 2);
  await restarted.dispose(); assert.equal(f.rows.size, 0);
});

test('overlay rolls back providers and listeners after partial Agent registration failure', async () => {
  const f = fixture(); f.setLive([f.agent('failed')]);
  const original = f.ctx.plugin;
  f.ctx.plugin = plugin => { const root = original(plugin); f.fail(); return root; };
  await assert.rejects(mountOverlays(f.ctx, core, f.invalidators), /registration failed/);
  assert.equal(f.rows.size, 0); assert.equal(f.invalidators.size, 0); assert.equal(f.listeners.size, 0);
});
