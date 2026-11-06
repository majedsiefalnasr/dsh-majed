/**
 * One-release migration of the on-disk state from the retired `majed` directories to `waycraft`
 * (ticket #159). Copy, never move: legacy files are NEVER deleted or modified. Credential contents
 * are never logged. A copy is staged beside its target, validated, then published with `link()`
 * (which fails if the target exists), so an existing new file is never overwritten.
 */
import { randomBytes } from 'node:crypto';
import {
  chmodSync,
  closeSync,
  fsyncSync,
  linkSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeSync,
} from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { LEGACY_PLUGIN_DIR, LEGACY_SKILLS_DIR } from './legacy-names.js';

const STAGE_MARK = '.migrating-';
const STALE_STAGE_MS = 10 * 60 * 1000;
/** Tree copy bounds: a larger tree is not migrated (legacy stays readable). */
export const TREE_MAX_ENTRIES = 20_000;
export const TREE_MAX_BYTES = 512 * 1024 * 1024;
const FILE_MAX_BYTES = 128 * 1024 * 1024;

export type MigrationStatus = 'copied' | 'exists' | 'no-legacy' | 'failed';
export interface MigrationResult {
  status: MigrationStatus;
  reason?: string;
}

/** Write the whole buffer; `writeSync` may write less than asked. */
function writeAll(fd: number, data: Buffer): void {
  let offset = 0;
  while (offset < data.length)
    offset += writeSync(fd, data, offset, data.length - offset);
}

const warned = new Set<string>();
/** Diagnostic without contents: only the file name class and a short reason. */
function diagnose(path: string, reason: string): void {
  const key = `${path}:${reason}`;
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(
    `dsh-waycraft: legacy storage migration skipped for ${basename(path)}: ${reason}`,
  );
}

function lstatOrUndefined(path: string) {
  try {
    return lstatSync(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}

/** Legacy twin of a new `plugins/waycraft/subscriptions/<file>` path, or undefined for other paths. */
export function legacyStorePath(newPath: string): string | undefined {
  const dir = dirname(newPath);
  if (basename(dir) !== 'subscriptions') return undefined;
  const plugin = dirname(dir);
  if (basename(plugin) !== 'waycraft') return undefined;
  const plugins = dirname(plugin);
  if (basename(plugins) !== 'plugins') return undefined;
  return join(plugins, LEGACY_PLUGIN_DIR, 'subscriptions', basename(newPath));
}

/** Remove abandoned stage files of a previous interrupted copy; only ours (same uid, old, marked). */
function cleanStages(dir: string, base: string): void {
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of names) {
    if (!name.startsWith(`${base}${STAGE_MARK}`) || !name.endsWith('.tmp'))
      continue;
    try {
      const stat = lstatSync(join(dir, name));
      if (
        stat.isFile() &&
        (process.getuid === undefined || stat.uid === process.getuid()) &&
        Date.now() - stat.mtimeMs > STALE_STAGE_MS
      )
        unlinkSync(join(dir, name));
    } catch {}
  }
}

/** Copy one legacy file to `newPath` if the new file is absent. Never overwrites, never touches legacy. */
export function migrateFile(newPath: string, oldPath: string): MigrationResult {
  let stage: string | undefined;
  try {
    if (lstatOrUndefined(newPath) !== undefined) return { status: 'exists' };
    const old = lstatOrUndefined(oldPath);
    if (old === undefined) return { status: 'no-legacy' };
    if (!old.isFile()) throw new Error('legacy path is not a regular file');
    if (old.size > FILE_MAX_BYTES) throw new Error('legacy file is too large');
    const data = readFileSync(oldPath);
    if (oldPath.endsWith('.json')) JSON.parse(data.toString('utf8'));
    const dir = dirname(newPath);
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    cleanStages(dir, basename(newPath));
    stage = join(
      dir,
      `${basename(newPath)}${STAGE_MARK}${process.pid}-${randomBytes(6).toString('hex')}.tmp`,
    );
    // Credential stores are owner-only whatever the legacy mode was; other files keep their mode.
    const mode = ['auth.json', 'proxy.json'].includes(basename(newPath))
      ? old.mode & 0o700
      : old.mode & 0o777;
    const fd = openSync(stage, 'wx', mode);
    try {
      writeAll(fd, data);
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
    chmodSync(stage, mode);
    try {
      linkSync(stage, newPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST')
        return { status: 'exists' };
      throw error;
    }
    return { status: 'copied' };
  } catch (error) {
    const reason =
      error instanceof SyntaxError
        ? 'legacy file is not valid JSON'
        : error instanceof Error
          ? error.message
          : String(error);
    diagnose(newPath, reason);
    return { status: 'failed', reason };
  } finally {
    if (stage !== undefined) {
      try {
        unlinkSync(stage);
      } catch {}
    }
  }
}

/**
 * Path a store should READ: the new file after migration, or the legacy file when the new one is
 * absent and could not be created. Writers always use the new path.
 */
export function readableStorePath(newPath: string): string {
  const legacy = legacyStorePath(newPath);
  if (legacy === undefined) return newPath;
  const result = migrateFile(newPath, legacy);
  if (result.status === 'failed' && lstatOrUndefined(legacy)?.isFile())
    return legacy;
  return newPath;
}

/** Legacy twin of a new media directory (`images` or `videos`). */
export function legacyMediaDirectory(newDirectory: string): string | undefined {
  return legacyStorePath(newDirectory);
}

/** Legacy skills root for a DSH home. */
export function legacySkillsRoot(dshHome: string): string {
  return join(dshHome, LEGACY_SKILLS_DIR);
}

interface TreeBudget {
  entries: number;
  bytes: number;
}

function copyTree(
  from: string,
  to: string,
  budget: TreeBudget,
  top: boolean,
): void {
  const stat = lstatSync(from);
  mkdirSync(to, { mode: 0o700 });
  for (const name of readdirSync(from)) {
    const source = join(from, name);
    const info = lstatSync(source);
    if (info.isSymbolicLink()) continue; // never follow links out of the root
    if (++budget.entries > TREE_MAX_ENTRIES)
      throw new Error('legacy tree has too many entries');
    if (info.isDirectory()) {
      copyTree(source, join(to, name), budget, false);
    } else if (info.isFile()) {
      budget.bytes += info.size;
      if (budget.bytes > TREE_MAX_BYTES)
        throw new Error('legacy tree is too large');
      const data = readFileSync(source);
      if (top && name.endsWith('.json')) JSON.parse(data.toString('utf8'));
      const fd = openSync(join(to, name), 'wx', info.mode & 0o777);
      try {
        writeAll(fd, data);
        fsyncSync(fd);
      } finally {
        closeSync(fd);
      }
      chmodSync(join(to, name), info.mode & 0o777);
    }
  }
  chmodSync(to, stat.mode & 0o777);
}

/**
 * Copy the legacy skills root to `newRoot` when absent: copy into a sibling stage directory, then
 * rename it into place (atomic; refuses a non-empty existing target). Bounded; symlinks skipped.
 */
export function migrateTree(newRoot: string, oldRoot: string): MigrationResult {
  let stage: string | undefined;
  try {
    if (lstatOrUndefined(newRoot) !== undefined) return { status: 'exists' };
    const old = lstatOrUndefined(oldRoot);
    if (old === undefined) return { status: 'no-legacy' };
    if (!old.isDirectory()) throw new Error('legacy path is not a directory');
    const parent = dirname(newRoot);
    mkdirSync(parent, { recursive: true });
    try {
      for (const name of readdirSync(parent)) {
        if (!name.startsWith(`${basename(newRoot)}${STAGE_MARK}`)) continue;
        const stale = join(parent, name);
        const info = lstatSync(stale);
        if (
          info.isDirectory() &&
          (process.getuid === undefined || info.uid === process.getuid()) &&
          Date.now() - info.mtimeMs > STALE_STAGE_MS
        )
          rmSync(stale, { recursive: true, force: true });
      }
    } catch {}
    stage = `${newRoot}${STAGE_MARK}${process.pid}-${randomBytes(6).toString('hex')}`;
    copyTree(oldRoot, stage, { entries: 0, bytes: 0 }, true);
    renameSync(stage, newRoot);
    stage = undefined;
    return { status: 'copied' };
  } catch (error) {
    const reason =
      error instanceof SyntaxError
        ? 'legacy file is not valid JSON'
        : error instanceof Error
          ? error.message
          : String(error);
    diagnose(newRoot, reason);
    return { status: 'failed', reason };
  } finally {
    if (stage !== undefined) {
      try {
        rmSync(stage, { recursive: true, force: true });
      } catch {}
    }
  }
}
