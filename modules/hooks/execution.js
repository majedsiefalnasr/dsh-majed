// Scheduling and result composition adapted from moon16u/dsh-pouch
// e9c2aa153b4ac223eee187d730e4877ec5feb16d, hooks/engine.js (MIT).
// Authority, scope and metadata history belong exclusively to Majed.
import { randomUUID } from 'node:crypto';
import { realpath } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createCommandExecutionAuthority } from './approval.js';
import { createExecutionHistory } from './history.js';
import { EVENTS, matches } from './vendor/pouch/protocol.js';
import { bounded, parseOutput, runCommand } from './vendor/pouch/runner.js';
import { registerAdapters } from './vendor/pouch/adapters.js';
const empty = () => ({ block: false, ask: false, contexts: [] });

/** Bounded process-local dispatch. No replay, reference discovery or trust import. */
export class CommandExecution {
  constructor(owner, options) {
    this.owner = owner;
    this.authority = createCommandExecutionAuthority(options, owner);
    this.history = createExecutionHistory(this.authority.directory);
    this.lifetime = new AbortController(); this.pending = new Set(); this.seen = new Map(); this.active = 0; this.queue = [];
  }
  register() {}
  async slot(signal) {
    signal.throwIfAborted();
    if (this.active < 4) { this.active++; return; }
    if (this.queue.length >= 64) throw new Error('queue_full');
    await new Promise((resolve, reject) => {
      const entry = { resolve, signal };
      entry.abort = () => { const index = this.queue.indexOf(entry); if (index >= 0) this.queue.splice(index, 1); reject(signal.reason); };
      signal.addEventListener('abort', entry.abort, { once: true }); this.queue.push(entry);
    });
  }
  release() {
    const entry = this.queue.shift();
    if (entry) { entry.signal.removeEventListener('abort', entry.abort); entry.resolve(); } else this.active--;
  }
  dispatch(event, agent, extra = {}, identity, signal) {
    if (!EVENTS[event] || this.lifetime.signal.aborted || !agent?.session?.header?.id) return Promise.resolve(empty());
    if (process.env.DSH_HOOK_ACTIVE === '1') return Promise.resolve(empty());
    const key = JSON.stringify([agent.session.header.id, event, identity]);
    if (this.seen.has(key)) return this.seen.get(key).task;
    // Never evict an in-flight event: doing so could execute the same identity twice.
    if (this.seen.size >= 2048) {
      for (const [key, item] of this.seen) { if (item.done) { this.seen.delete(key); break; } }
      if (this.seen.size >= 2048) return Promise.resolve({ ...empty(), block: EVENTS[event].block, reason: 'Hook event capacity exceeded.' });
    }
    const record = { done: false };
    record.task = this.dispatchOnce(event, agent, extra, identity, signal).catch(() => ({ ...empty(), block: !signal?.aborted && EVENTS[event].block, reason: 'Hook infrastructure unavailable.' })).finally(() => { record.done = true; });
    this.seen.set(key, record); this.track(record.task); return record.task;
  }
  track(task) { this.pending.add(task); void task.finally(() => this.pending.delete(task)).catch(() => {}); }
  async dispatchOnce(event, agent, extra, identity, signal) {
    const combined = signal ? AbortSignal.any([signal, this.lifetime.signal]) : this.lifetime.signal;
    const entries = await this.authority.list(agent, event, combined);
    const input = { ...extra, hook_event_name: event, session_id: agent.session.header.id, event_id: String(identity) };
    if (Buffer.byteLength(JSON.stringify(input)) > 1048576) throw new Error('input_limit');
    const jobs = [];
    for (const entry of entries) {
      if ((!entry.hook.subagents && agent.session.header.parentSession) || !matches(entry.hook.matcher || '*', extra.tool_name ?? extra.source ?? extra.trigger ?? '')) continue;
      const task = this.run(entry, event, agent, input, combined); this.track(task);
      if (!entry.hook.async) jobs.push(task);
    }
    const results = await Promise.all(jobs);
    let remaining = 262144; const contexts = [];
    for (const text of results.flatMap(result => result.contexts).slice(0, 64)) {
      const value = bounded(text, remaining); if (value) contexts.push(value); remaining -= Buffer.byteLength(value); if (remaining <= 0) break;
    }
    return { block: results.some(result => result.block), ask: results.some(result => result.ask), contexts,
      reason: bounded(results.filter(result => result.block || result.ask).map(result => result.reason).join('\n'), 8192) };
  }
  async run(selected, event, agent, input, signal) {
    const row = { id: randomUUID(), hookId: selected.hook.id, event, startedAt: Date.now(), status: 'skipped' };
    let occupied = false;
    try {
      // Unapproved definitions remain inert, including fail-closed policies.
      if (!selected.fingerprint) return empty();
      await this.slot(signal); occupied = true;
      const review = await this.authority.revalidate(agent, selected, signal);
      const hook = selected.hook;
      const entry = { ...hook, event, cwd: review.cwd, shell: hook.shell || 'auto', timeout: (hook.limits?.timeout ?? 30000) / 1000,
        maxOutputBytes: hook.limits?.output ?? 65536, contextBytes: hook.contextBytes ?? 16384, onError: hook.onError || 'continue', env: {} };
      // Explicit names only; dangerous shell startup variables cannot be restored.
      for (const name of hook.env) if (!/^(BASH_ENV|ENV|NODE_OPTIONS|DSH_HOOK_.*)$/i.test(name) && process.env[name] !== undefined) entry.env[name] = process.env[name];
      if (hook.source === 'file') {
        const file = await realpath(resolve(selected.root, hook.command));
        const environment = await this.owner.subprocess.terminalEnvironment(signal);
        const powershell = entry.shell === 'pwsh' || (entry.shell === 'auto' && environment.platform === 'windows');
        entry.command = powershell ? "& '" + file.replaceAll("'", "''") + "'" : "'" + file.replaceAll("'", "'\\''") + "'";
      }
      row.status = 'running'; this.history.record(row);
      const result = await runCommand(this.owner.subprocess, entry, { ...input, cwd: review.cwd }, signal,
        beforeSignal => this.authority.revalidate(agent, selected, beforeSignal));
      row.status = result.status; row.exitCode = result.exitCode;
      const parsed = parseOutput(entry, result); if (parsed.block) row.status = 'blocked';
      return hook.async ? empty() : parsed;
    } catch (error) {
      row.status = signal.aborted ? 'cancelled' : error.code === 'invalid_approval' ? 'skipped' : 'error';
      return { ...empty(), block: row.status === 'error' && selected.hook.onError === 'block' && EVENTS[event].block, reason: 'Hook execution failed.' };
    } finally {
      if (occupied) this.release(); row.endedAt = Date.now();
      // Persist metadata only, including skipped/revoked launches. A failed final
      // write cannot disclose command output through errors or native logging.
      try { this.history.record(row); } catch { this.owner.logger?.warn?.('Majed hook history unavailable.'); }
    }
  }
  async dispose() { this.lifetime.abort(new Error('disposed')); await Promise.allSettled([...this.pending]); this.seen.clear(); }
}

export function applyCommandExecution(ctx, options = {}) {
  if (options.enabled !== true) return;
  ctx.inject(['subprocess'], owner => {
    const engine = new CommandExecution(owner, options);
    owner.provide('commandHookExecution', engine);
    registerAdapters(owner, engine);
    owner.effect(() => () => engine.dispose(), 'Majed Command hook execution');
  });
}
