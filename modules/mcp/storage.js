// Private Majed storage for MCP server definitions.
// Atomic writes (temp file + rename) and request-time reads keep valid state
// safe from corrupt stores and concurrent/external edits. Secrets live only in
// this private store; snapshots, errors and logs never see them.
import { readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export function createMcpDefinitionStore(filePath) {
  let disposed = false;
  async function read() {
    if (disposed) throw new Error('Store disposed.');
    let raw;
    try { raw = await readFile(filePath, 'utf8'); }
    catch (error) {
      if (error.code === 'ENOENT') return { servers: [] };
      throw error;
    }
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch { throw Object.assign(new Error('Corrupt store.'), { code: 'CORRUPT_STORE' }); }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !Array.isArray(parsed.servers)) {
      throw Object.assign(new Error('Corrupt store.'), { code: 'CORRUPT_STORE' });
    }
    return parsed;
  }
  async function save(config) {
    if (disposed) throw new Error('Store disposed.');
    const next = { servers: config.servers };
    const dir = dirname(filePath);
    const tmp = join(dir, `.majed-mcp-${process.pid}-${Date.now()}.tmp`);
    try {
      await writeFile(tmp, JSON.stringify(next), 'utf8');
      await rename(tmp, filePath);
    } catch (error) {
      try { await unlink(tmp); } catch {}
      throw error;
    }
    return next;
  }
  return { read, save, dispose: () => { disposed = true; } };
}
