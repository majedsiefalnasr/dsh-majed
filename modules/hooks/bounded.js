import { createCommandExecutionAuthority } from './approval.js';

/** Dormant synthetic SessionStart seam. No native event registration or tool authority.
 * A single process-local slot rejects concurrent dispatch rather than queueing it.
 */
export function createBoundedSessionStart(owner, options = {}) {
  let active = false;
  const authority = options.enabled === true ? createCommandExecutionAuthority(options, owner) : null;
  return {
    async run(event, agent, signal) {
      if (!authority || event !== 'SessionStart' || active) return [];
      active = true;
      try {
        const selected = await authority.list(agent, signal);
        const results = [];
        for (const entry of selected) {
          let handle; let timer;
          const deadline = new AbortController();
          const combined = AbortSignal.any([signal, deadline.signal]);
          try {
            const hook = entry.hook;
            // This bounded slice deliberately excludes file commands, alternate
            // shells, environment restoration and matcher semantics.
            if (!entry.approval || hook.source !== 'inline' || ![undefined, 'auto', 'bash'].includes(hook.shell) || hook.env.length || hook.matcher) { results.push({ status: 'skipped' }); continue; }
            timer = setTimeout(() => deadline.abort(new Error('hook timeout')), Math.min(hook.limits?.timeout ?? 30000, 30000));
            if ((await owner.subprocess.terminalEnvironment(combined)).platform !== 'posix') throw new Error('unsupported_platform');
            const executable = await owner.subprocess.resolveExecutable('bash', {}, combined);
            const review = await authority.revalidate(agent, entry, combined);
            combined.throwIfAborted();
            // No await between the final authority check and native spawn.
            handle = owner.subprocess.spawn({ argv: [executable, '--noprofile', '--norc', '-c', hook.command], cwd: review.cwd,
              env: { BASH_ENV: undefined, ENV: undefined, NODE_OPTIONS: undefined, DSH_HOOK_ACTIVE: '1' },
              stdio: { stdin: { data: JSON.stringify({ hook_event_name: 'SessionStart', session_id: agent.session.header.id }) + '\n' }, stdout: { maxBytes: Math.min(hook.limits?.output ?? 65536, 65536) }, stderr: { maxBytes: 65536 } }, graceMs: 500, signal: combined });
            const outcome = await handle.done;
            const output = handle.collected.stdout.readFrom(0);
            results.push({ status: deadline.signal.aborted ? 'timeout' : signal.aborted ? 'cancelled' : outcome.exitCode === 0 && !output.lossy ? 'completed' : 'error' });
          } catch { results.push({ status: signal.aborted ? 'cancelled' : deadline.signal.aborted ? 'timeout' : 'skipped' }); }
          finally {
            clearTimeout(timer);
            if (handle) { handle.terminate(); if (!await handle.waitForExit(AbortSignal.timeout(2000))) throw new Error('Hook process cleanup did not reach quiescence'); }
          }
        }
        return results;
      } finally { active = false; }
    },
  };
}
