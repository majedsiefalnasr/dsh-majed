// Adapted workflow from dsh-skills-manager 1.2.29 (Apache-2.0); see PROVENANCE.md.
import { randomUUID } from 'node:crypto';
import {
  cp,
  lstat,
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

export interface TrashItem {
  id: string;
  name: string;
  source: string;
  scope: string;
  root: string;
  origin: string;
  deletedAt: string;
}
const exists = async (path: string) =>
  lstat(path).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  });
/** Preflight only: concurrent malicious same-principal filesystem replacement is excluded. */
export async function checkedTrashPath(path: string, absent = false) {
  for (let current = resolve(path); ; current = dirname(current)) {
    const stat = await exists(current);
    if (!stat && !absent) throw new Error('trash-missing');
    if (stat?.isSymbolicLink()) throw new Error('trash-linked');
    if (current !== resolve(path) && stat && !stat.isDirectory())
      throw new Error('trash-linked');
    if (dirname(current) === current) break;
  }
}
async function checkedTree(path: string) {
  let entries = 0,
    bytes = 0;
  const walk = async (current: string, depth: number): Promise<void> => {
    if (++entries > 512 || depth > 12) throw new Error('trash-limit');
    const stat = await lstat(current);
    if (stat.isSymbolicLink() || (!stat.isFile() && !stat.isDirectory()))
      throw new Error('trash-linked');
    if (stat.isFile()) {
      bytes += stat.size;
      if (bytes > 8 * 1024 * 1024) throw new Error('trash-limit');
    } else
      for (const item of await readdir(current))
        await walk(join(current, item), depth + 1);
  };
  await checkedTrashPath(path);
  await walk(path, 0);
}
const validId = (id: unknown): id is string =>
  typeof id === 'string' && /^[a-f0-9-]{36}$/.test(id);
export interface TrashScan {
  items: TrashItem[];
  /** Valid-id entries whose record could not be read or validated. */
  skipped: number;
  /** More valid entries exist than the safe listing cap. */
  overLimit: boolean;
}
const TRASH_CAP = 2000;
export async function scanTrash(root: string): Promise<TrashScan> {
  await checkedTrashPath(root, true);
  const entries = await readdir(root).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  // Junk and staging names must not consume slots: filter before applying the cap.
  const ids = entries.filter(validId);
  const items: TrashItem[] = [];
  let skipped = 0;
  for (const id of ids.slice(0, TRASH_CAP)) {
    try {
      const file = join(root, id, 'metadata.json');
      await checkedTrashPath(file);
      const stat = await lstat(file);
      if (!stat.isFile() || stat.size > 16384) {
        skipped++;
        continue;
      }
      const item = JSON.parse(await readFile(file, 'utf8')) as TrashItem;
      if (
        item.id === id &&
        ['name', 'source', 'scope', 'root', 'origin', 'deletedAt'].every(
          (key) => typeof item[key as keyof TrashItem] === 'string',
        )
      )
        items.push(item);
      else skipped++;
    } catch {
      /* Invalid or linked records are never mutation targets, but are counted. */
      skipped++;
    }
  }
  items.sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
  return { items, skipped, overLimit: ids.length > TRASH_CAP };
}
export async function listTrash(root: string): Promise<TrashItem[]> {
  return (await scanTrash(root)).items;
}
export async function trashEntry(
  root: string,
  record: Omit<TrashItem, 'id' | 'deletedAt'>,
  cancelled: () => boolean,
) {
  await checkedTree(record.origin);
  await checkedTrashPath(root, true);
  await mkdir(root, { recursive: true });
  const item: TrashItem = {
    ...record,
    id: randomUUID(),
    deletedAt: new Date().toISOString(),
  };
  const stage = join(root, `.stage-${item.id}`),
    final = join(root, item.id);
  let published = false;
  try {
    await mkdir(stage);
    await cp(record.origin, join(stage, 'content'), {
      recursive: true,
      errorOnExist: true,
      force: false,
    });
    await writeFile(join(stage, 'metadata.json'), JSON.stringify(item), {
      flag: 'wx',
      mode: 0o600,
    });
    if (cancelled()) throw new Error('trash-cancelled');
    await rename(stage, final);
    published = true;
    // Keep the complete published Trash copy before touching the active entry.
    const quarantine = join(dirname(record.origin), `.trashed-${item.id}`);
    await rename(record.origin, quarantine);
    try {
      await rm(quarantine, { recursive: true });
    } catch {
      return { warning: 'trash-cleanup', path: quarantine };
    }
    return {};
  } catch (error) {
    // A published copy is recovery material, even when removing the active entry failed.
    if (published) return { warning: 'trash-recovery', path: final };
    throw error;
  } finally {
    if (!published) await rm(stage, { recursive: true, force: true });
  }
}
export async function restoreEntry(
  root: string,
  item: TrashItem,
  cancelled: () => boolean,
) {
  const container = join(root, item.id),
    content = join(container, 'content');
  await checkedTree(content);
  await checkedTrashPath(item.origin, true);
  // Directory and flat Markdown entries of the same name both block restoration.
  const stem = item.origin.endsWith('.md')
    ? item.origin.slice(0, -3)
    : item.origin;
  if ((await exists(stem)) || (await exists(`${stem}.md`)))
    throw new Error('trash-conflict');
  await mkdir(dirname(item.origin), { recursive: true });
  const stage = join(dirname(item.origin), `.restore-${randomUUID()}`);
  let published = false;
  try {
    await cp(content, stage, {
      recursive: true,
      errorOnExist: true,
      force: false,
    });
    if (cancelled()) throw new Error('trash-cancelled');
    await rename(stage, item.origin);
    published = true;
    try {
      await rm(container, { recursive: true });
    } catch {
      return { warning: 'trash-cleanup', path: container };
    }
    return {};
  } finally {
    if (!published) await rm(stage, { recursive: true, force: true });
  }
}
export async function deleteEntry(root: string, item: TrashItem) {
  const target = join(root, item.id);
  await checkedTree(target);
  await rm(target, { recursive: true });
}
