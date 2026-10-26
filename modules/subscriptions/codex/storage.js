import { open, readFile, mkdir, rename, unlink, lstat } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

const queues = new Map();
const fail = code => Object.assign(new Error(code), { code });
function validAccount(account) {
  const session = account?.session;
  return /^[a-f0-9]{64}$/.test(account?.id) && typeof account.revision === 'string'
    && ['connected', 'reauthentication_required'].includes(account.state)
    && session && ['accessToken', 'refreshToken', 'accountId', 'label'].every(key => typeof session[key] === 'string' && session[key].length > 0)
    && Number.isFinite(session.expiresAt);
}
// Majed owns this file exclusively. Never opens or migrates a reference store.
export function createPrivateStore(path) {
  async function load() {
    try {
      const info = await lstat(path);
      if (!info.isFile() || info.isSymbolicLink() || (process.platform !== 'win32' && (info.mode & 0o077))) throw fail('unsafe_account_store');
      const data = JSON.parse(await readFile(path, 'utf8'));
      if (data.version !== 1 || !Array.isArray(data.accounts) || !data.accounts.every(validAccount)
        || new Set(data.accounts.map(a => a.id)).size !== data.accounts.length
        || (data.default !== null && !data.accounts.some(a => a.id === data.default))) throw fail('corrupt_account_store');
      return data;
    } catch (error) {
      if (error.code === 'ENOENT') return { version: 1, accounts: [], default: null };
      throw fail(error.code === 'unsafe_account_store' ? error.code : 'corrupt_account_store');
    }
  }
  async function transaction(change, { signal } = {}) {
    const previous = queues.get(path) || Promise.resolve();
    const next = previous.catch(() => {}).then(async () => {
      signal?.throwIfAborted();
      const data = await load();
      const result = await change(data);
      await mkdir(dirname(path), { recursive: true, mode: 0o700 });
      const temporary = `${path}.${randomUUID()}.tmp`;
      let file;
      try {
        file = await open(temporary, 'wx', 0o600);
        await file.writeFile(JSON.stringify(data)); await file.sync(); await file.close(); file = undefined;
        // Cancellation wins until the atomic commit point. No await may occur
        // between this check and issuing rename.
        signal?.throwIfAborted();
        await rename(temporary, path);
      } finally { await file?.close(); await unlink(temporary).catch(() => {}); }
      return result;
    });
    queues.set(path, next);
    try { return await next; }
    finally { if (queues.get(path) === next) queues.delete(path); }
  }
  return { load, transaction };
}
