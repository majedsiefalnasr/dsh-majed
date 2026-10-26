import { lstatSync, readFileSync, mkdirSync, openSync, writeFileSync, fsyncSync, closeSync, renameSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { HOOK_EVENTS } from './index.js';
const STATUSES = ['running', 'completed', 'blocked', 'error', 'cancelled', 'timeout', 'skipped', 'interrupted'];

/** Metadata only: never persist command, input, output, reason, path or session. */
export function createExecutionHistory(directory) {
  const file = join(directory, 'runs.json');
  let runs = [];
  try {
    const info = lstatSync(file);
    if (!info.isFile() || info.isSymbolicLink() || info.size > 262144) throw new Error('invalid_history');
    const value = JSON.parse(readFileSync(file, 'utf8'));
    if (value.version !== 1 || !Array.isArray(value.runs) || value.runs.length > 200) throw new Error('invalid_history');
    for (const row of value.runs) {
      if (!row || Object.keys(row).some(key => !['id', 'hookId', 'event', 'status', 'startedAt', 'endedAt', 'exitCode'].includes(key)) ||
        typeof row.id !== 'string' || row.id.length > 64 || typeof row.hookId !== 'string' || row.hookId.length > 128 ||
        !HOOK_EVENTS.includes(row.event) || !STATUSES.includes(row.status) || !Number.isSafeInteger(row.startedAt) ||
        (row.endedAt !== undefined && !Number.isSafeInteger(row.endedAt)) || (row.exitCode !== undefined && !Number.isSafeInteger(row.exitCode))) throw new Error('invalid_history');
      runs.push({ ...row, status: row.status === 'running' ? 'interrupted' : row.status });
    }
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  function flush() {
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    if (lstatSync(directory).isSymbolicLink()) throw new Error('invalid_history');
    const temporary = join(directory, '.runs-' + randomUUID());
    let fd;
    try {
      fd = openSync(temporary, 'wx', 0o600);
      writeFileSync(fd, JSON.stringify({ version: 1, runs })); fsyncSync(fd); closeSync(fd); fd = undefined;
      renameSync(temporary, file);
    } finally { if (fd !== undefined) closeSync(fd); try { unlinkSync(temporary); } catch (error) { if (error.code !== 'ENOENT') throw error; } }
  }
  return {
    record(row) {
      const next = { id: row.id, hookId: row.hookId, event: row.event, status: row.status, startedAt: row.startedAt };
      if (row.endedAt !== undefined) next.endedAt = row.endedAt;
      if (Number.isSafeInteger(row.exitCode)) next.exitCode = row.exitCode;
      const previous = runs;
      runs = [...runs.filter(value => value.id !== next.id), next].slice(-200);
      try { flush(); } catch (error) { runs = previous; throw error; }
    },
    snapshot: () => runs.slice().reverse().map(row => ({ ...row })),
  };
}
