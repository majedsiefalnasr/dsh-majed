// Import behavior adapted from dsh-skills-manager v1.2.29; see PROVENANCE.md.
import { randomUUID } from 'node:crypto';
import {
  cp,
  lstat,
  mkdir,
  open,
  opendir,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';
import { parseDocument } from 'yaml';
import { Unzip, UnzipInflate } from 'fflate';
import { setImmediate as yieldTurn } from 'node:timers/promises';

const FILE_MAX = 1024 * 1024;
const TOTAL_MAX = 8 * FILE_MAX;
const ENTRY_MAX = 512;
type Files = Map<string, Uint8Array>;
type Item = { name: string; source: string; files: Files };
function problem(code: string): never {
  throw new Error(code);
}
export function safeImportPath(path: string): string {
  const parts = path.split('/');
  if (
    !path ||
    path.length > 1024 ||
    parts.length > 12 ||
    /[\\\u0000:]/.test(path) ||
    parts.some(
      (p) =>
        !p ||
        p === '.' ||
        p === '..' ||
        p.length > 200 ||
        /[. ]$/.test(p) ||
        /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(p),
    )
  )
    problem('import-path');
  return path;
}
export async function importRootSafe(root: string): Promise<boolean> {
  for (let current = resolve(root); ; current = dirname(current)) {
    const info = await lstat(current).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return undefined;
      throw error;
    });
    if (info && (info.isSymbolicLink() || !info.isDirectory())) return false;
    if (dirname(current) === current) return true;
  }
}
async function readBytes(path: string): Promise<Uint8Array> {
  const handle = await open(path, 'r');
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > FILE_MAX) problem('import-limit');
    const buffer = Buffer.alloc(FILE_MAX + 1);
    let length = 0;
    while (length < buffer.length) {
      const result = await handle.read(
        buffer,
        length,
        buffer.length - length,
        length,
      );
      if (!result.bytesRead) break;
      length += result.bytesRead;
    }
    if (length > FILE_MAX) problem('import-limit');
    return buffer.subarray(0, length);
  } finally {
    await handle.close();
  }
}
function item(source: string, files: Files): Item {
  const document = files.get('SKILL.md');
  if (!document) problem('import-empty');
  const text = new TextDecoder('utf-8', { fatal: true }).decode(document);
  const front = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  if (!front) problem('import-metadata');
  const parsed = parseDocument(front[1]);
  if (parsed.errors.length) problem('import-metadata');
  const data = parsed.toJS({ maxAliasCount: 50 });
  if (
    !data ||
    typeof data.name !== 'string' ||
    typeof data.description !== 'string' ||
    !data.description.trim()
  )
    problem('import-metadata');
  const name = data.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!name || name.length > 128 || /[\\/.\u0000]/.test(data.name))
    problem('import-name');
  return { name, source, files };
}
type Batch = { items: Item[]; failed: Array<{ name: string; code: string }> };
type UploadBudget = { input: number; expanded: number; entries: number };
export function uploadedItems(entries: unknown, budget?: UploadBudget): Batch {
  if (!Array.isArray(entries) || !entries.length || entries.length > ENTRY_MAX)
    problem('import-limit');
  const files: Files = new Map();
  const seen = new Set<string>();
  let total = 0;
  for (const entry of entries) {
    if (
      !entry ||
      typeof entry.path !== 'string' ||
      typeof entry.data !== 'string'
    )
      problem('import-path');
    const path = safeImportPath(entry.path);
    const key = path.toLowerCase();
    if (seen.has(key)) problem('import-duplicate');
    seen.add(key);
    if (
      entry.data.length > Math.ceil(FILE_MAX / 3) * 4 ||
      entry.data.length % 4 ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(entry.data)
    )
      problem('import-limit');
    const bytes = Buffer.from(entry.data, 'base64');
    if (bytes.toString('base64') !== entry.data) problem('import-encoding');
    total += bytes.length;
    if (budget) {
      budget.input += bytes.length;
      budget.expanded += bytes.length;
      budget.entries++;
      if (
        budget.input > FILE_MAX ||
        budget.expanded > TOTAL_MAX ||
        budget.entries > ENTRY_MAX
      )
        problem('import-limit');
    }
    if (bytes.length > FILE_MAX || total > TOTAL_MAX) problem('import-limit');
    files.set(path, bytes);
  }
  const result: Batch = { items: [], failed: [] };
  const candidate = (source: string, bundle: Files) => {
    try {
      result.items.push(item(source, bundle));
    } catch (error) {
      result.failed.push({
        name: source,
        code:
          error instanceof Error && error.message.startsWith('import-')
            ? error.message
            : 'import-metadata',
      });
    }
  };
  if (files.has('SKILL.md')) {
    candidate('upload', files);
    return result;
  }
  const roots = [...files.keys()]
    .filter((p) => p.endsWith('/SKILL.md'))
    .map((p) => p.slice(0, -9));
  for (const root of roots) {
    if (roots.some((other) => other !== root && root.startsWith(`${other}/`)))
      problem('import-path');
    const bundle: Files = new Map();
    for (const [path, bytes] of files)
      if (path.startsWith(`${root}/`))
        bundle.set(path.slice(root.length + 1), bytes);
    candidate(root, bundle);
  }
  for (const [path, bytes] of files)
    if (!path.includes('/') && /\.md$/i.test(path))
      candidate(path, new Map([['SKILL.md', bytes]]));
  if (!result.items.length && !result.failed.length) problem('import-empty');
  return result;
}
export async function zipItems(
  encoded: unknown,
  cancelled: () => boolean,
  budget: UploadBudget = { input: 0, expanded: 0, entries: 0 },
): Promise<Batch> {
  if (
    typeof encoded !== 'string' ||
    encoded.length > 1400000 ||
    encoded.length % 4 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)
  )
    problem('import-limit');
  const bytes = Buffer.from(encoded, 'base64');
  if (bytes.toString('base64') !== encoded) problem('import-encoding');
  budget.input += bytes.length;
  if (budget.input > FILE_MAX) problem('import-limit');
  const entries: Array<{ path: string; data: string }> = [];
  const seen = new Set<string>();
  let total = 0,
    count = 0,
    active = 0;
  const unzip = new Unzip((file) => {
    if (++count > ENTRY_MAX || ++budget.entries > ENTRY_MAX)
      problem('import-limit');
    const directory = file.name.endsWith('/');
    const path = safeImportPath(directory ? file.name.slice(0, -1) : file.name);
    if (seen.has(path.toLowerCase())) problem('import-duplicate');
    seen.add(path.toLowerCase());
    if (file.originalSize !== undefined && file.originalSize > FILE_MAX)
      problem('import-limit');
    if (directory) return;
    let size = 0;
    const chunks: Uint8Array[] = [];
    active++;
    file.ondata = (error, chunk, final) => {
      if (error) throw error;
      size += chunk.length;
      total += chunk.length;
      budget.expanded += chunk.length;
      if (
        size > FILE_MAX ||
        total > TOTAL_MAX ||
        budget.expanded > TOTAL_MAX ||
        cancelled()
      ) {
        file.terminate();
        problem(cancelled() ? 'import-cancelled' : 'import-limit');
      }
      chunks.push(chunk);
      if (final) {
        active--;
        entries.push({ path, data: Buffer.concat(chunks).toString('base64') });
      }
    };
    file.start();
  });
  unzip.register(UnzipInflate);
  for (let offset = 0; offset < bytes.length; offset += 1024) {
    if (cancelled()) problem('import-cancelled');
    unzip.push(
      bytes.subarray(offset, offset + 1024),
      offset + 1024 >= bytes.length,
    );
    await yieldTurn();
  }
  if (active) problem('import-archive');
  return uploadedItems(entries);
}

export async function uploadBatch(
  entries: unknown,
  archives: unknown,
  cancelled: () => boolean,
) {
  if (!Array.isArray(archives) || archives.length > ENTRY_MAX)
    problem('import-limit');
  const budget: UploadBudget = { input: 0, expanded: 0, entries: 0 };
  const batch: Batch & { inputs: Array<{ name: string; names: string[] }> } = {
    items: [],
    failed: [],
    inputs: [],
  };
  if (Array.isArray(entries) && entries.length) {
    const found = uploadedItems(entries, budget);
    batch.items.push(...found.items);
    batch.failed.push(...found.failed);
  }
  for (const archive of archives) {
    if (cancelled()) problem('import-cancelled');
    if (!archive || typeof archive.path !== 'string') problem('import-path');
    safeImportPath(archive.path);
    try {
      const found = await zipItems(archive.data, cancelled, budget);
      batch.inputs.push({
        name: archive.path,
        names: [
          ...found.items.map((value) => value.name),
          ...found.failed.map((value) => value.name),
        ],
      });
      batch.items.push(...found.items);
      batch.failed.push(...found.failed);
    } catch (error) {
      const code =
        error instanceof Error && error.message.startsWith('import-')
          ? error.message
          : 'import-archive';
      if (
        [
          'import-limit',
          'import-path',
          'import-duplicate',
          'import-cancelled',
        ].includes(code)
      )
        throw error;
      batch.failed.push({ name: archive.path, code });
      batch.inputs.push({ name: archive.path, names: [] });
    }
  }
  if (!batch.items.length && !batch.failed.length) problem('import-empty');
  return batch;
}

export async function localItems(
  path: unknown,
  root: string,
  cancelled: () => boolean,
): Promise<Batch> {
  if (typeof path !== 'string' || !isAbsolute(path) || path.length > 4096)
    problem('import-path');
  const source = resolve(path);
  if (
    source === root ||
    source.startsWith(`${root}/`) ||
    root.startsWith(`${source}/`)
  )
    problem('import-overlap');
  if (!(await importRootSafe(dirname(source)))) problem('import-linked');
  const entries: Array<{ path: string; data: string }> = [];
  let count = 0,
    total = 0;
  const walk = async (target: string, relative: string, depth: number) => {
    if (cancelled()) problem('import-cancelled');
    if (++count > ENTRY_MAX || depth > 12) problem('import-limit');
    const stat = await lstat(target);
    if (stat.isSymbolicLink()) problem('import-linked');
    if (stat.isDirectory()) {
      const directory = await opendir(target);
      for await (const child of directory)
        await walk(
          join(target, child.name),
          relative ? `${relative}/${child.name}` : child.name,
          depth + 1,
        );
    } else {
      if (!stat.isFile()) problem('import-linked');
      safeImportPath(relative);
      const bytes = await readBytes(target);
      total += bytes.length;
      if (total > TOTAL_MAX) problem('import-limit');
      entries.push({
        path: relative,
        data: Buffer.from(bytes).toString('base64'),
      });
    }
  };
  const info = await lstat(source);
  await walk(source, info.isDirectory() ? '' : basename(source), 0);
  return uploadedItems(entries);
}
export async function publishImports(
  items: Item[],
  root: string,
  conflict: unknown,
  dryRun: boolean,
  cancelled: () => boolean,
) {
  if (!['skip', 'overwrite'].includes(String(conflict)))
    problem('import-conflict');
  const result = {
    pending: [] as Array<{ name: string }>,
    conflicts: [] as Array<{ name: string }>,
    imported: [] as Array<{ name: string; overwritten: boolean }>,
    skipped: [] as Array<{ name: string }>,
    failed: [] as Array<{ name: string; code: string; recovery?: string[] }>,
    warnings: [] as Array<{ name: string; code: string; recovery: string[] }>,
  };
  const counts = new Map<string, number>();
  for (const value of items)
    counts.set(value.name, (counts.get(value.name) ?? 0) + 1);
  if (!(await importRootSafe(root))) problem('import-linked');
  for (const value of items) {
    const target = join(root, value.name);
    const existing: string[] = [];
    const recovery: string[] = [];
    try {
      if (cancelled()) problem('import-cancelled');
      if (counts.get(value.name)! > 1) problem('import-duplicate');
      for (const path of [target, join(root, `${value.name}.md`)]) {
        const info = await lstat(path).catch((error: NodeJS.ErrnoException) => {
          if (error.code === 'ENOENT') return undefined;
          throw error;
        });
        if (info?.isSymbolicLink()) problem('import-linked');
        if (info) existing.push(path);
      }
      (existing.length ? result.conflicts : result.pending).push({
        name: value.name,
      });
      if (dryRun) continue;
      if (existing.length && conflict === 'skip') {
        result.skipped.push({ name: value.name });
        continue;
      }
      await mkdir(root, { recursive: true });
      const stage = join(root, `.import-${randomUUID()}`);
      const backups: Array<{ path: string; backup: string }> = [];
      let owned = false,
        published = false;
      try {
        await mkdir(stage);
        owned = true;
        for (const [path, bytes] of value.files) {
          if (cancelled()) problem('import-cancelled');
          const destination = join(stage, safeImportPath(path));
          await mkdir(dirname(destination), { recursive: true });
          await writeFile(destination, bytes, { flag: 'wx' });
        }
        if (cancelled()) problem('import-cancelled');
        if (!(await importRootSafe(root))) problem('import-linked');
        for (const path of existing) {
          const backup = join(root, `.backup-${randomUUID()}`);
          await rename(path, backup);
          backups.push({ path, backup });
        }
        // Once replacement starts it completes or restores, even if shutdown cancels new work.
        await rename(stage, target);
        owned = false;
        published = true;
        result.imported.push({
          name: value.name,
          overwritten: !!existing.length,
        });
      } catch (error) {
        let recoveryFailed = false;
        for (const { path, backup } of backups.reverse()) {
          try {
            await rename(backup, path);
          } catch {
            // Keep the original backup until fallback restoration fully succeeds.
            try {
              await cp(backup, path, {
                recursive: true,
                force: false,
                errorOnExist: true,
                verbatimSymlinks: true,
              });
              await rm(backup, { recursive: true });
            } catch {
              recoveryFailed = true;
              recovery.push(backup);
            }
          }
        }
        if (recoveryFailed) problem('import-recovery');
        throw error;
      } finally {
        if (owned) await rm(stage, { recursive: true, force: true });
        if (published)
          for (const { backup } of backups) {
            try {
              await rm(backup, { recursive: true, force: true });
            } catch {
              result.warnings.push({
                name: value.name,
                code: 'import-cleanup',
                recovery: [backup],
              });
            }
          }
      }
    } catch (error) {
      result.failed.push({
        name: value.name,
        code:
          error instanceof Error && error.message.startsWith('import-')
            ? error.message
            : 'import-failed',
        ...(recovery.length ? { recovery } : {}),
      });
    }
  }
  return result;
}
