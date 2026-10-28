// Private Majed definitions, not profile YAML or another plugin's store.
import { readFile, lstat, mkdir, open, rename, unlink } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { randomBytes, createHash } from 'node:crypto';
import { validateServers } from './index.js';

const writers = new Map();
const digest = value => createHash('sha256').update(value).digest('hex');
const corrupt = () => Object.assign(new Error('Corrupt store.'), { code: 'CORRUPT_STORE' });
const valid = value => {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => key !== 'servers')) throw corrupt();
  validateServers(value.servers);
  return { servers: value.servers || [] };
};
export function createMcpDefinitionStore(filePath) {
  const file = resolve(filePath); let disposed = false;
  async function observe() {
    if (disposed) throw new Error('Store disposed.');
    let raw;
    try {
      const info = await lstat(file);
      if (!info.isFile() || info.isSymbolicLink() || info.size > 262144) throw corrupt();
      raw = await readFile(file, 'utf8');
    } catch (error) { if (error.code === 'ENOENT') return { revision: null, value: { servers: [] } }; throw error; }
    let parsed; try { parsed = valid(JSON.parse(raw)); } catch { throw corrupt(); }
    return { revision: digest(raw), value: parsed };
  }
  async function commit(observed, config) {
    if (disposed) throw new Error('Store disposed.');
    const next = valid(config), raw = JSON.stringify(next), directory = dirname(file);
    if (Buffer.byteLength(raw) > 262144) throw corrupt();
    await mkdir(directory, { recursive: true, mode: 0o700 });
    if ((await lstat(directory)).isSymbolicLink()) throw corrupt();
    const temporary = join(directory, '.majed-mcp-' + randomBytes(16).toString('hex') + '.tmp');
    let handle;
    try {
      handle = await open(temporary, 'wx', 0o600); await handle.writeFile(raw); await handle.sync(); await handle.close(); handle = undefined;
      if (disposed || (await observe()).revision !== observed.revision) throw new Error('MCP state changed.');
      await rename(temporary, file);
    } finally { await handle?.close(); await unlink(temporary).catch(() => {}); }
    return structuredClone(next);
  }
  function update(change) {
    const prior = writers.get(file) || Promise.resolve();
    const task = prior.catch(() => {}).then(async () => {
      const observed = await observe();
      return commit(observed, await change(structuredClone(observed.value), observed.revision));
    });
    writers.set(file, task);
    return task.finally(() => { if (writers.get(file) === task) writers.delete(file); });
  }
  return { read: async () => (await observe()).value, observe, update, save: config => update(() => config), dispose() { disposed = true; } };
}
