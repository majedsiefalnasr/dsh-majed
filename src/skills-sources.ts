// Registered-project resolution and custom-source path validation for the Skill manager (#147).
// Behaviour adapts dsh-skills-manager v1.2.29 src/core.ts (project roots, validateSourceRootPath,
// scanCustomSourceCandidates); see src/PROVENANCE.md. Every check here runs on the host: paths and
// project identities supplied by the browser are never trusted without re-resolution.
import { createHash } from 'node:crypto';
import { lstat, opendir, readdir, realpath, stat } from 'node:fs/promises';
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from 'node:path';
import { discoverReadonlyEntries } from './skills-discovery.js';

export const MAX_CUSTOM_SOURCES = 32;
export const MAX_LABEL = 48;
export const MAX_PATH = 1024;
const MAX_SCAN_DEPTH = 2;
const MAX_SCAN_CANDIDATES = 40;
/** Directories a single preview may visit; the walk stops there and reports `truncated`. */
export const MAX_SCAN_VISITED = 2000;

/**
 * Custom sources rank after every built-in user root. Built-in external roots use 510 + index
 * (src/skills.ts), so 535 and above stays clear of them; user-dsh and user-agents use 400 and 500 and
 * the default for a configured source is 300 + index. The base ends in 5 and the step is 10, so a custom
 * rank and its source-relative policy overlay (rank - 1) cannot equal any of those ranks.
 */
export const CUSTOM_RANK_BASE = 535;
export const CUSTOM_RANK_STEP = 10;

export interface RootError {
  ok: false;
  code: string;
  params: Record<string, string>;
}

/** Same path, or `child` inside `parent`. */
export function isSameOrDescendant(parent: string, child: string): boolean {
  const rel = relative(resolve(parent), resolve(child));
  return (
    rel === '' ||
    (!isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`))
  );
}

export const pathIdentity = (path: string): string =>
  process.platform === 'win32' ? resolve(path).toLowerCase() : resolve(path);

/** Resolves links in the nearest existing ancestor so overlap checks cannot be bypassed by a symlink. */
export async function comparisonPath(path: string): Promise<string> {
  let current = resolve(path);
  const missing: string[] = [];
  for (;;) {
    try {
      return resolve(await realpath(current), ...missing);
    } catch {
      const parent = dirname(current);
      if (parent === current) return resolve(path);
      missing.unshift(basename(current));
      current = parent;
    }
  }
}

/** Overlap check for paths that already went through `comparisonPath`. */
export const overlapsResolved = (left: string, right: string): boolean =>
  isSameOrDescendant(left, right) || isSameOrDescendant(right, left);

const fail = (code: string, params: Record<string, string>): RootError => ({
  ok: false,
  code,
  params,
});

export interface Other {
  id: string;
  path: string;
}

/** Protected roots resolved once (via `comparisonPath`) so repeated validations stay cheap. */
export interface PreparedRoots {
  others: Other[];
  reserved: string[];
}

/** `others` are every protected root; `reserved` are manager-owned folders. */
export async function prepareRoots(
  others: Other[],
  reserved: string[],
): Promise<PreparedRoots> {
  const [resolvedOthers, resolvedReserved] = await Promise.all([
    Promise.all(
      others.map(async ({ id, path }) => ({
        id,
        path: await comparisonPath(path),
      })),
    ),
    Promise.all(reserved.map((path) => comparisonPath(path))),
  ]);
  return { others: resolvedOthers, reserved: resolvedReserved };
}

/**
 * Validates a source folder requested by the browser. `roots.others` are every protected root
 * (built-in user roots, other custom sources, available project roots); `roots.reserved` are
 * manager-owned folders. The returned path is the canonical real path, so a later link swap in an
 * ancestor cannot redirect it.
 */
export async function validateRootPath(
  requested: unknown,
  roots: PreparedRoots,
  excludeId?: string,
): Promise<{ ok: true; path: string } | RootError> {
  const path = typeof requested === 'string' ? requested.trim() : '';
  if (!path || !isAbsolute(path) || path.includes('\0'))
    return fail('root-not-absolute', { path });
  if (path.length > MAX_PATH) return fail('root-too-long', { path });
  let info: Awaited<ReturnType<typeof stat>>;
  try {
    info = await stat(path);
  } catch {
    return fail('root-not-found', { path });
  }
  if (!info.isDirectory()) return fail('root-not-directory', { path });
  const canonical = await realpath(path);
  for (const folder of roots.reserved)
    if (overlapsResolved(canonical, folder))
      return fail('root-reserved', { path });
  for (const other of roots.others) {
    if (other.id === excludeId) continue;
    if (overlapsResolved(canonical, other.path))
      return fail('root-overlap', { path, other: other.id });
  }
  return { ok: true, path: canonical };
}

export function customSlug(
  label: string,
  taken: Set<string>,
): string | undefined {
  const base =
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 24)
      .replace(/-+$/g, '') || 'source';
  for (let n = 1; n <= MAX_CUSTOM_SOURCES + 1; n++) {
    const id = `custom:${n === 1 ? base : `${base}-${n}`}`;
    if (!taken.has(id)) return id;
  }
  return undefined;
}

export const CUSTOM_ID = /^custom:[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function lstatOrNull(path: string) {
  return lstat(path).catch(() => null);
}

const byName = (a: { name: string }, b: { name: string }) =>
  a.name < b.name ? -1 : a.name > b.name ? 1 : 0;

async function collectSkillDirectories(root: string, signal?: AbortSignal) {
  const found: { path: string; depth: number; segments: string[] }[] = [];
  let visited = 0;
  let truncated = false;
  const walk = async (
    directory: string,
    depth: number,
    segments: string[],
  ): Promise<void> => {
    if (signal?.aborted) return;
    if (found.length >= MAX_SCAN_CANDIDATES || visited >= MAX_SCAN_VISITED) {
      truncated = true;
      return;
    }
    visited++;
    const skills = join(directory, 'skills');
    if ((await lstatOrNull(skills))?.isDirectory())
      found.push({ path: skills, depth, segments });
    if (depth >= MAX_SCAN_DEPTH) return;
    let entries: import('node:fs').Dirent[];
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }
    // Sorted so the visit order, and therefore which directories a cap cuts off, never depends on the filesystem.
    entries.sort(byName);
    for (const entry of entries) {
      if (signal?.aborted) return;
      // Dirent.isDirectory() is false for symlinks, so links are never followed.
      if (!entry.isDirectory()) continue;
      if (
        entry.name.startsWith('.') ||
        entry.name === 'skills' ||
        entry.name === 'node_modules'
      )
        continue;
      await walk(join(directory, entry.name), depth + 1, [
        ...segments,
        entry.name,
      ]);
    }
  };
  await walk(root, 0, []);
  return { found, truncated };
}

export interface Candidate {
  path: string;
  label: string;
  group: string;
  depth: number;
  skillCount: number;
  conflict: boolean;
  registered: boolean;
}

/**
 * Read-only preview: lists skills folders two levels below `requested`; registers nothing. A root
 * that is reserved, or lies inside another source, is refused before anything is walked.
 */
export async function scanCandidates(
  requested: unknown,
  roots: PreparedRoots,
  registeredPaths: string[],
  signal?: AbortSignal,
): Promise<
  | { ok: true; root: string; candidates: Candidate[]; truncated: boolean }
  | RootError
> {
  const path = typeof requested === 'string' ? requested.trim() : '';
  if (!path || !isAbsolute(path) || path.includes('\0'))
    return fail('root-not-absolute', { path });
  if (path.length > MAX_PATH) return fail('root-too-long', { path });
  let info: Awaited<ReturnType<typeof stat>>;
  try {
    info = await stat(path);
  } catch {
    return fail('root-not-found', { path });
  }
  if (!info.isDirectory()) return fail('root-not-directory', { path });
  const root = await realpath(path);
  if (roots.reserved.some((folder) => overlapsResolved(root, folder)))
    return fail('root-reserved', { path });
  const inside = roots.others.find((other) =>
    isSameOrDescendant(other.path, root),
  );
  if (inside) return fail('root-overlap', { path, other: inside.id });
  const aborted = () => fail('scan-aborted', { path });
  const product = basename(root) || root;
  const registered = new Set(registeredPaths.map(pathIdentity));
  const candidates: Candidate[] = [];
  const walked = await collectSkillDirectories(root, signal);
  for (const item of walked.found) {
    if (signal?.aborted) return aborted();
    // Real containment: a skills folder that resolves outside the scanned tree is not offered.
    const real = await realpath(item.path).catch(() => undefined);
    if (!real || !isSameOrDescendant(root, real)) continue;
    const found = await discoverReadonlyEntries(real, signal);
    const conflict =
      roots.reserved.some((folder) => overlapsResolved(real, folder)) ||
      roots.others.some((other) => overlapsResolved(real, other.path));
    candidates.push({
      path: real,
      label:
        item.depth === 0 ? product : [product, ...item.segments].join(' / '),
      group: product,
      depth: item.depth,
      skillCount: found.entries.length,
      conflict,
      registered: registered.has(pathIdentity(real)),
    });
  }
  if (signal?.aborted) return aborted();
  candidates.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return { ok: true, root, candidates, truncated: walked.truncated };
}

// ---- registered projects -------------------------------------------------------------------

export const PROJECT_SOURCES: Array<{
  kind: string;
  dir: string;
  label: string;
  rank: number;
}> = [
  { kind: 'dsh', dir: '.dsh', label: 'DSH', rank: 100 },
  { kind: 'agents', dir: '.agents', label: 'Agents', rank: 200 },
  ...[
    ['copilot', '.github', 'Copilot'],
    ['codex', '.codex', 'Codex'],
    ['claude', '.claude', 'Claude'],
    ['gemini', '.gemini', 'Gemini'],
    ['opencode', '.opencode', 'OpenCode'],
    ['cursor', '.cursor', 'Cursor'],
    ['windsurf', '.windsurf', 'Windsurf'],
    ['trae', '.trae', 'Trae'],
    ['trae-cn', '.trae-cn', 'Trae CN'],
    ['roo', '.roo', 'Roo'],
    ['codebuddy', '.codebuddy', 'CodeBuddy'],
    ['workbuddy', '.workbuddy', 'WorkBuddy'],
    ['qoder', '.qoder', 'Qoder'],
    ['lingma', '.lingma', 'Lingma'],
  ].map(([kind, dir, label], i) => ({
    kind,
    dir,
    label,
    rank: 210 + i * 10,
  })),
];

export const projectId = (root: string): string =>
  createHash('sha256').update(pathIdentity(root)).digest('hex').slice(0, 16);

export interface Project {
  id: string;
  name: string;
  /** The registered workspace path as reported by the host. */
  path: string;
  /** Canonical project root (nearest `.git` ancestor, else the workspace itself). */
  root?: string;
  available: boolean;
  /** Present when unavailable: project-missing | project-unreadable | project-unavailable. */
  code?: string;
}

/** Resolves a workspace path to its project root; failures become a diagnostic code, never a throw. */
export async function resolveProject(path: string): Promise<Project> {
  const base = {
    name: basename(path) || path,
    path,
  };
  const unavailable = (code: string): Project => ({
    ...base,
    id: projectId(`missing:${path}`),
    available: false,
    code,
  });
  if (!isAbsolute(path)) return unavailable('project-unavailable');
  let real: string;
  try {
    real = await realpath(path);
    if (!(await stat(real)).isDirectory())
      return unavailable('project-missing');
    await (await opendir(real)).close();
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    return unavailable(
      code === 'ENOENT' || code === 'ENOTDIR'
        ? 'project-missing'
        : code === 'EACCES' || code === 'EPERM'
          ? 'project-unreadable'
          : 'project-unavailable',
    );
  }
  let root = real;
  for (let current = real; ; current = dirname(current)) {
    if (await lstatOrNull(join(current, '.git'))) {
      root = current;
      break;
    }
    if (dirname(current) === current) break;
  }
  return { ...base, id: projectId(root), root, available: true };
}
