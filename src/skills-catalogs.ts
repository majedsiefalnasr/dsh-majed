// ClawHub / skills.sh discovery and installation adapted from dsh-skills-manager 1.2.29 (Apache-2.0); see PROVENANCE.md.
import { createHash, randomUUID } from 'node:crypto';
import {
  lstat,
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { publishImports } from './skills-import.js';
import {
  assertPublicHost,
  type Destination,
  validScope,
  extractArchive,
  frontMatter,
  HEX,
  RepoError,
  readCapped,
  relativePath,
  Run,
  SKILL_DOC_MAX,
  SKILL_ENTRY_MAX,
  SKILL_FILE_MAX,
  SKILL_NAME,
  SKILL_TOTAL_MAX,
  type Tracked,
  treeHashOf,
  UUID,
} from './skills-repos.js';
import { checkedTrashPath, trashEntry } from './skills-trash.js';

/** Host-code seams only (tests, packaging); never reachable from a request body. */
export interface CatalogConfig {
  /** ClawHub origin; default https://clawhub.ai. */
  clawhubBase?: string;
  /** skills.sh origin; default https://skills.sh. */
  skillsShBase?: string;
  /** Tests only: allow loopback/private catalog hosts and plain http. */
  allowPrivateHosts?: boolean;
  timeoutMs?: number;
  /** Time-to-live of cached browse/search answers. */
  cacheMs?: number;
  maxCacheEntries?: number;
  maxInstalls?: number;
  maxStateBytes?: number;
}
const DEFAULTS = {
  clawhubBase: 'https://clawhub.ai',
  skillsShBase: 'https://skills.sh',
  timeoutMs: 15_000,
  cacheMs: 60_000,
  maxCacheEntries: 50,
  maxInstalls: 300,
  maxStateBytes: 16 * 1024 * 1024,
};
// Fixed maxima that persisted state is validated against (config values are write-time caps only).
const HARD = {
  installs: 2000,
  stateBytes: 64 * 1024 * 1024,
  cacheMs: 5 * 60_000,
  cacheEntries: 200,
};
// Reference limits kept: see PROVENANCE.md.
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const SAFE_PATH = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9._/-]+$/;
const MAX_JSON = 1024 * 1024;
const MAX_TEXT = 1024 * 1024;
const MAX_PACKAGE = 8 * 1024 * 1024;
const MAX_FILES = 100;
const MAX_QUERY = 100;
const MAX_CURSOR = 4096;
const LIST_PAGE = 10;
const SEARCH_MAX = 100;
const CATALOGS = ['clawhub', 'skillsh'] as const;
type CatalogKind = (typeof CATALOGS)[number];

const reject = (code: string, status: number) => new RepoError(code, status);
const query = () => reject('catalog-query', 400);
const upstream = () => reject('catalog-upstream', 502);
const bad = () => reject('catalog-response', 502);
const sha256 = (data: string | Uint8Array) =>
  createHash('sha256').update(data).digest('hex');
/** Untrusted catalog text is data: control, bidirectional-mark/override, line-separator, zero-width space and BOM characters never reach the UI (ZWNJ/ZWJ are kept: Persian, Indic and emoji text need them). */
const clean = (value: string) =>
  value.replace(
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u200b\u200e\u200f\u2028\u2029\u202a-\u202e\u2066-\u2069\u061c\ufeff]/g,
    '',
  );
/** YAML front matter parsing can throw (alias bombs); treat that as a malformed document. */
const parseFront = (bytes: Uint8Array) => {
  try {
    return frontMatter(bytes);
  } catch {
    return undefined;
  }
};
const count = (value: unknown) =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
    ? value
    : undefined;
const record = (value: unknown): Record<string, any> | undefined =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, any>)
    : undefined;

// ---------------------------------------------------------------- request validation
function requestQuery(value: unknown): string {
  if (typeof value !== 'string') throw query();
  const q = value.trim();
  if (!q || q.length > MAX_QUERY) throw query();
  return q;
}
function requestLimit(value: unknown, max: number): number {
  if (value === undefined) return max;
  const number =
    typeof value === 'string' && /^[0-9]{1,3}$/.test(value)
      ? Number(value)
      : value;
  if (typeof number !== 'number' || !Number.isInteger(number)) throw query();
  if (number < 1 || number > max) throw query();
  return number;
}
export interface Identity {
  catalog: CatalogKind;
  /** `clawhub:owner/slug` or `skillsh:owner/repo/skillId`. */
  id: string;
  /** Human-readable origin (reference: `owner/slug`, `owner/repo/skillId`). */
  origin: string;
  owner?: string;
  slug?: string;
  source?: string;
  skillId?: string;
}
function identity(input: unknown): Identity {
  const body = record(input);
  if (!body) throw reject('catalog-identity', 400);
  const ident = (value: unknown) =>
    typeof value === 'string' && IDENTIFIER.test(value);
  if (body.catalog === 'clawhub') {
    if (!ident(body.owner) || !ident(body.slug))
      throw reject('catalog-identity', 400);
    return {
      catalog: 'clawhub',
      id: `clawhub:${body.owner}/${body.slug}`,
      origin: `${body.owner}/${body.slug}`,
      owner: body.owner,
      slug: body.slug,
    };
  }
  if (body.catalog === 'skillsh') {
    const parts = typeof body.source === 'string' ? body.source.split('/') : [];
    if (parts.length !== 2 || !parts.every(ident) || !ident(body.skillId))
      throw reject('catalog-identity', 400);
    return {
      catalog: 'skillsh',
      id: `skillsh:${body.source}/${body.skillId}`,
      origin: `${body.source}/${body.skillId}`,
      source: body.source,
      skillId: body.skillId,
    };
  }
  throw reject('catalog-identity', 400);
}

// ---------------------------------------------------------------- persisted installs
interface CatalogInstall {
  id: string;
  catalog: CatalogKind;
  catalogId: string;
  origin: string;
  /** Download URL the package came from (public, fixed catalog endpoint). */
  url: string;
  /** SHA-256 of the downloaded package bytes. */
  digest: string;
  name: string;
  source: string;
  root: string;
  scope: 'user' | 'project';
  project?: string;
  treeHash: string;
  files: Tracked[];
  installedAt: string;
  trashId?: string;
}
interface CatalogState {
  version: 1;
  installs: CatalogInstall[];
}
const emptyState = (): CatalogState => ({ version: 1, installs: [] });
function validState(value: unknown): value is CatalogState {
  const state = record(value);
  if (!state || state.version !== 1 || !Array.isArray(state.installs))
    return false;
  if (state.installs.length > HARD.installs) return false;
  const text = (item: unknown, max: number) =>
    typeof item === 'string' && item.length <= max;
  return state.installs.every((item) => {
    const entry = record(item);
    return (
      !!entry &&
      typeof entry.id === 'string' &&
      UUID.test(entry.id) &&
      CATALOGS.includes(entry.catalog) &&
      text(entry.catalogId, 768) &&
      text(entry.origin, 768) &&
      text(entry.url, 2048) &&
      typeof entry.digest === 'string' &&
      HEX(64).test(entry.digest) &&
      typeof entry.name === 'string' &&
      SKILL_NAME.test(entry.name) &&
      entry.name.length <= 256 &&
      validScope(entry) &&
      typeof entry.root === 'string' &&
      entry.root.startsWith('/') &&
      entry.root.length <= 4096 &&
      typeof entry.treeHash === 'string' &&
      HEX(64).test(entry.treeHash) &&
      text(entry.installedAt, 64) &&
      (entry.trashId === undefined ||
        (typeof entry.trashId === 'string' && UUID.test(entry.trashId))) &&
      Array.isArray(entry.files) &&
      entry.files.length <= SKILL_ENTRY_MAX &&
      entry.files.every((file: unknown) => {
        const f = record(file);
        return (
          !!f &&
          relativePath(f.path) &&
          typeof f.hash === 'string' &&
          HEX(64).test(f.hash) &&
          (f.x === undefined || f.x === true)
        );
      })
    );
  });
}

// ---------------------------------------------------------------- packages
interface Package {
  name: string;
  description: string;
  body: string;
  files: Map<string, Uint8Array>;
  manifest: Tracked[];
  treeHash: string;
  digest: string;
}
function splitSkill(text: string) {
  return text.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '');
}
function buildPackage(
  entries: Array<{ path: string; data: Uint8Array }>,
  digest: string,
): Package {
  let list = entries;
  // A package may wrap everything in one folder; strip it when SKILL.md is not at the top.
  if (!list.some((item) => item.path === 'SKILL.md')) {
    const top = list[0]?.path.split('/')[0];
    if (
      top &&
      list.every((item) => item.path.startsWith(`${top}/`)) &&
      list.some((item) => item.path === `${top}/SKILL.md`)
    )
      list = list.map((item) => ({
        ...item,
        path: item.path.slice(top.length + 1),
      }));
  }
  if (!list.length || list.length > SKILL_ENTRY_MAX)
    throw reject('catalog-package', 502);
  const files = new Map<string, Uint8Array>();
  const manifest: Tracked[] = [];
  let total = 0;
  for (const item of list) {
    if (!relativePath(item.path) || files.has(item.path))
      throw reject('catalog-package', 502);
    total += item.data.length;
    if (item.data.length > SKILL_FILE_MAX || total > SKILL_TOTAL_MAX)
      throw reject('repo-limit', 400);
    files.set(item.path, item.data);
    manifest.push({ path: item.path, hash: sha256(item.data) });
  }
  const doc = files.get('SKILL.md');
  if (!doc || doc.length > SKILL_DOC_MAX) throw reject('catalog-package', 502);
  const meta = parseFront(doc);
  if (!meta || !SKILL_NAME.test(meta.name))
    throw reject('catalog-package', 502);
  return {
    name: meta.name,
    description: clean(meta.description),
    body: clean(splitSkill(new TextDecoder().decode(doc))),
    files,
    manifest,
    treeHash: treeHashOf(manifest),
    digest,
  };
}

/** Bounded, link-refusing read of an installed copy; undefined when it is not a plain tree. */
async function readInstalled(dir: string): Promise<Tracked[] | undefined> {
  const manifest: Tracked[] = [];
  let total = 0;
  const walk = async (current: string, prefix: string, depth: number) => {
    if (depth > 12) throw new Error('deep');
    for (const item of await readdir(current, { withFileTypes: true })) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      const full = join(current, item.name);
      if (item.isDirectory()) await walk(full, path, depth + 1);
      else if (item.isFile()) {
        const info = await lstat(full);
        total += info.size;
        if (manifest.length >= SKILL_ENTRY_MAX || total > SKILL_TOTAL_MAX)
          throw new Error('large');
        manifest.push({
          path,
          hash: sha256(await readFile(full)),
          ...((info.mode & 0o111) !== 0 ? { x: true as const } : {}),
        });
      } else throw new Error('special');
    }
  };
  try {
    if (!(await lstat(dir)).isDirectory()) return undefined;
    await walk(dir, '', 0);
  } catch {
    return undefined;
  }
  return manifest;
}

// ---------------------------------------------------------------- the module
export interface CatalogOptions {
  config: CatalogConfig | undefined;
  stateDir: string;
  trashRoot: string;
  destination: (
    id: unknown,
    project?: unknown,
  ) => Promise<Destination | undefined>;
  exclusive: <T>(fn: () => Promise<T>) => Promise<T>;
  changed: () => void;
}
export function createCatalogs(options: CatalogOptions) {
  const config = { ...DEFAULTS, ...options.config };
  config.maxInstalls = Math.min(config.maxInstalls, HARD.installs);
  config.maxStateBytes = Math.min(config.maxStateBytes, HARD.stateBytes);
  config.cacheMs = Math.min(config.cacheMs, HARD.cacheMs);
  config.maxCacheEntries = Math.min(config.maxCacheEntries, HARD.cacheEntries);
  const privateOk = options.config?.allowPrivateHosts === true;
  const file = join(options.stateDir, 'catalogs.json');
  const lifetime = new AbortController();
  const cache = new Map<string, { at: number; value: unknown }>();
  let state = emptyState();
  let invalid = false;
  let loaded = '';

  const sync = async () => {
    const info = await stat(file).catch(() => undefined);
    const stamp = info ? `${info.mtimeMs}:${info.size}` : 'none';
    if (stamp === loaded) return;
    loaded = stamp;
    if (!info) {
      state = emptyState();
      invalid = false;
      return;
    }
    try {
      if (info.size > HARD.stateBytes) throw new Error('large');
      const parsed = JSON.parse(await readFile(file, 'utf8'));
      if (!validState(parsed)) throw new Error('shape');
      state = parsed;
      invalid = false;
    } catch {
      state = emptyState();
      invalid = true;
    }
  };
  const ready = async () => {
    await sync();
    if (invalid) throw reject('repo-state-invalid', 409);
  };
  const persist = async (next: CatalogState, shrinking = false) => {
    await mkdir(options.stateDir, { recursive: true });
    const serialized = JSON.stringify(next);
    if (
      Buffer.byteLength(serialized) >
      (shrinking ? HARD.stateBytes : config.maxStateBytes)
    )
      throw reject('repo-limit', 400);
    const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, serialized, { flag: 'wx', mode: 0o600 });
      await rename(temporary, file);
    } catch {
      await rm(temporary, { force: true });
      throw reject('repo-state-write', 400);
    }
    state = next;
    const info = await stat(file);
    loaded = `${info.mtimeMs}:${info.size}`;
  };
  const clone = (): CatalogState => structuredClone(state);

  // ---- network (fixed catalog endpoints only)
  const endpoint = (kind: CatalogKind) => {
    const base = new URL(
      kind === 'clawhub' ? config.clawhubBase : config.skillsShBase,
    );
    if (base.protocol !== 'https:' && !privateOk) throw upstream();
    return base;
  };
  /** One bounded GET: no redirects, host preflight, content-type and size checked, cancellable. */
  const get = async (
    url: URL,
    type: 'json' | 'text' | 'zip',
    limit: number,
    signal: AbortSignal | undefined,
  ): Promise<Uint8Array> => {
    const run = new Run(config.timeoutMs, signal, lifetime.signal);
    try {
      if (!privateOk) await assertPublicHost(url.href);
      let response: Response;
      try {
        response = await fetch(url, {
          redirect: 'error',
          signal: run.signal,
          headers: {
            accept:
              type === 'json'
                ? 'application/json'
                : type === 'zip'
                  ? 'application/zip'
                  : 'text/markdown, text/plain',
          },
        });
      } catch {
        run.check();
        throw upstream();
      }
      if (!response.ok) {
        await response.body?.cancel().catch(() => undefined);
        throw upstream();
      }
      const kind = (response.headers.get('content-type') ?? '')
        .split(';')[0]
        .trim()
        .toLowerCase();
      const allowed =
        type === 'json'
          ? kind === 'application/json' || kind.endsWith('+json')
          : type === 'text'
            ? kind.startsWith('text/')
            : [
                'application/zip',
                'application/x-zip-compressed',
                'application/octet-stream',
              ].includes(kind);
      if (!allowed) {
        await response.body?.cancel().catch(() => undefined);
        throw bad();
      }
      try {
        return await readCapped(response, limit, run);
      } catch (error) {
        run.check();
        throw error instanceof RepoError ? error : upstream();
      }
    } finally {
      run.done();
    }
  };
  const getJson = async (url: URL, signal: AbortSignal | undefined) => {
    const bytes = await get(url, 'json', MAX_JSON, signal);
    try {
      const parsed = JSON.parse(new TextDecoder().decode(bytes));
      if (!record(parsed)) throw bad();
      return parsed;
    } catch (error) {
      throw error instanceof RepoError ? error : bad();
    }
  };
  /** Short TTL cache for browse/search answers; failures are never cached. */
  const cached = async <T>(key: string, load: () => Promise<T>): Promise<T> => {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < config.cacheMs) return hit.value as T;
    const value = await load();
    if (config.cacheMs > 0 && config.maxCacheEntries > 0) {
      cache.delete(key);
      cache.set(key, { at: Date.now(), value });
      while (cache.size > config.maxCacheEntries)
        cache.delete(cache.keys().next().value as string);
    }
    return value;
  };

  // ---- ClawHub / skills.sh responses
  const clawhubItem = (value: unknown) => {
    const item = record(value);
    if (!item) return undefined;
    const owner = item.ownerHandle ?? record(item.owner)?.handle;
    const slug = item.slug;
    if (
      typeof owner !== 'string' ||
      typeof slug !== 'string' ||
      !IDENTIFIER.test(owner) ||
      !IDENTIFIER.test(slug)
    )
      return undefined;
    const stats =
      record(item.stats) ?? record(record(item.native)?.skill)?.stats;
    const numbers = record(stats) ?? {};
    return {
      id: `clawhub:${owner}/${slug}`,
      catalog: 'clawhub' as const,
      owner,
      slug,
      name:
        typeof item.displayName === 'string' &&
        item.displayName.trim() &&
        item.displayName.length <= 256
          ? clean(item.displayName.trim())
          : slug,
      summary:
        typeof item.summary === 'string' && item.summary.length <= 8192
          ? clean(item.summary)
          : '',
      downloads: count(item.downloads) ?? count(numbers.downloads),
      installs: count(numbers.installs),
      stars: count(numbers.stars),
    };
  };
  const skillsShItem = (value: unknown) => {
    const item = record(value);
    if (!item || typeof item.source !== 'string') return undefined;
    const parts = item.source.split('/');
    if (
      parts.length !== 2 ||
      !parts.every((part) => IDENTIFIER.test(part)) ||
      typeof item.skillId !== 'string' ||
      !IDENTIFIER.test(item.skillId) ||
      typeof item.name !== 'string' ||
      !item.name.trim() ||
      item.name.trim().length > 256
    )
      return undefined;
    return {
      id: `skillsh:${item.source}/${item.skillId}`,
      catalog: 'skillsh' as const,
      source: item.source,
      skillId: item.skillId,
      name: clean(item.name.trim()),
      installs: count(item.installs),
    };
  };

  // ---- package download
  const packageUrl = (ident: Identity) => {
    if (ident.catalog === 'clawhub') {
      const url = new URL('/api/v1/download', endpoint('clawhub'));
      url.searchParams.set('slug', ident.slug!);
      url.searchParams.set('owner', ident.owner!);
      return url;
    }
    return new URL(
      `/api/download/${ident.source}/${ident.skillId}`,
      endpoint('skillsh'),
    );
  };
  const loadPackage = async (
    ident: Identity,
    signal: AbortSignal | undefined,
  ): Promise<{ pkg: Package; url: string }> => {
    const url = packageUrl(ident);
    if (ident.catalog === 'clawhub') {
      const bytes = await get(url, 'zip', MAX_PACKAGE, signal);
      const entries = (() => {
        try {
          return extractArchive(
            bytes,
            { entries: SKILL_ENTRY_MAX, total: SKILL_TOTAL_MAX },
            'flat',
          );
        } catch (error) {
          throw error instanceof RepoError
            ? error
            : reject('repo-archive', 400);
        }
      })();
      return { pkg: buildPackage(entries, sha256(bytes)), url: url.href };
    }
    const bytes = await get(url, 'json', MAX_PACKAGE, signal);
    let payload: Record<string, any> | undefined;
    try {
      payload = record(JSON.parse(new TextDecoder().decode(bytes)));
    } catch {
      throw bad();
    }
    const listed = payload?.files;
    if (!Array.isArray(listed) || !listed.length || listed.length > MAX_FILES)
      throw bad();
    const entries: Array<{ path: string; data: Uint8Array }> = [];
    const seen = new Set<string>();
    for (const item of listed) {
      const entry = record(item);
      if (
        !entry ||
        typeof entry.path !== 'string' ||
        typeof entry.contents !== 'string' ||
        !SAFE_PATH.test(entry.path) ||
        entry.path
          .split('/')
          .some((segment: string) => segment.startsWith('.')) ||
        !relativePath(entry.path) ||
        entry.path.split('/').length > 14 ||
        seen.has(entry.path.toLowerCase())
      )
        throw reject('repo-archive', 400);
      seen.add(entry.path.toLowerCase());
      entries.push({ path: entry.path, data: Buffer.from(entry.contents) });
    }
    return { pkg: buildPackage(entries, sha256(bytes)), url: url.href };
  };

  // ---- installed copies
  const diskStatus = async (item: CatalogInstall) => {
    const manifest = await readInstalled(join(item.root, item.name));
    if (!manifest)
      return (await lstat(join(item.root, item.name)).then(
        () => true,
        () => false,
      ))
        ? 'modified'
        : 'missing';
    return treeHashOf(manifest) === treeHashOf(item.files)
      ? 'installed'
      : 'modified';
  };
  const conflicts = async (root: string, name: string) => {
    for (const path of [join(root, name), join(root, `${name}.md`)])
      if (
        await lstat(path).then(
          () => true,
          () => false,
        )
      )
        return true;
    return false;
  };

  return {
    close() {
      lifetime.abort();
    },
    /** Installed catalog copies with their live disk status (never lists backups). */
    async view(expose: boolean, trashIds: Set<string> | undefined) {
      await sync();
      if (!expose || invalid) return { catalogInstalls: [] };
      const catalogInstalls = [];
      for (const item of state.installs) {
        const dest = await options.destination(item.source, item.project);
        const status = item.trashId
          ? trashIds && !trashIds.has(item.trashId)
            ? 'missing'
            : 'trashed'
          : !dest || resolve(dest.root) !== item.root
            ? 'invalid-root'
            : await diskStatus(item);
        catalogInstalls.push({ ...item, status });
      }
      return { catalogInstalls };
    },
    /** ClawHub popular ranking: download-sorted, 10 per page, opaque cursor (reference limits). */
    async clawhubList(
      input: { limit?: unknown; cursor?: unknown; sort?: unknown },
      signal?: AbortSignal,
    ) {
      const limit = requestLimit(input.limit, LIST_PAGE);
      if (input.sort !== undefined && input.sort !== 'downloads') throw query();
      if (
        input.cursor !== undefined &&
        (typeof input.cursor !== 'string' ||
          !input.cursor ||
          input.cursor.length > MAX_CURSOR)
      )
        throw query();
      const url = new URL('/api/v1/skills', endpoint('clawhub'));
      url.searchParams.set('sort', 'downloads');
      url.searchParams.set('limit', String(limit));
      if (input.cursor) url.searchParams.set('cursor', input.cursor as string);
      return cached(url.href, async () => {
        const payload = await getJson(url, signal);
        if (!Array.isArray(payload.items)) throw bad();
        const next = payload.nextCursor;
        if (
          next !== undefined &&
          next !== null &&
          (typeof next !== 'string' || next.length > MAX_CURSOR)
        )
          throw bad();
        const items = payload.items
          .map(clawhubItem)
          .filter(Boolean)
          .slice(0, limit);
        return {
          items,
          nextCursor: typeof next === 'string' && next ? next : null,
        };
      });
    },
    async clawhubSearch(
      input: { q?: unknown; limit?: unknown },
      signal?: AbortSignal,
    ) {
      const q = requestQuery(input.q);
      const limit = requestLimit(input.limit, SEARCH_MAX);
      const url = new URL('/api/v1/search', endpoint('clawhub'));
      url.searchParams.set('q', q);
      url.searchParams.set('limit', String(limit));
      return cached(url.href, async () => {
        const payload = await getJson(url, signal);
        if (!Array.isArray(payload.results)) throw bad();
        const items = new Map<
          string,
          NonNullable<ReturnType<typeof clawhubItem>>
        >();
        for (const entry of payload.results) {
          const source = record(entry)?.source;
          if (source !== undefined && source !== 'clawhub') continue;
          const item = clawhubItem(entry);
          if (item && !items.has(item.id)) items.set(item.id, item);
          if (items.size >= limit) break;
        }
        return { items: [...items.values()] };
      });
    },
    async skillsShSearch(input: { q?: unknown }, signal?: AbortSignal) {
      const q = requestQuery(input.q);
      const url = new URL('/api/search', endpoint('skillsh'));
      url.searchParams.set('q', q);
      return cached(url.href, async () => {
        const payload = await getJson(url, signal);
        if (!Array.isArray(payload.skills)) throw bad();
        const items = new Map<
          string,
          NonNullable<ReturnType<typeof skillsShItem>>
        >();
        for (const entry of payload.skills) {
          const item = skillsShItem(entry);
          if (item && !items.has(item.id)) items.set(item.id, item);
          if (items.size >= SEARCH_MAX) break;
        }
        return { items: [...items.values()] };
      });
    },
    /** Read-only details: description and SKILL.md body as plain text (never rendered as markup). */
    async detail(input: unknown, signal?: AbortSignal) {
      const ident = identity(input);
      if (ident.catalog === 'clawhub') {
        const url = new URL(
          `/api/v1/skills/${encodeURIComponent(ident.slug!)}/file`,
          endpoint('clawhub'),
        );
        url.searchParams.set('path', 'SKILL.md');
        url.searchParams.set('owner', ident.owner!);
        const bytes = await get(url, 'text', MAX_TEXT, signal);
        const meta = parseFront(bytes);
        if (!meta) throw bad();
        return {
          id: ident.id,
          origin: ident.origin,
          name: clean(meta.name),
          description: clean(meta.description),
          body: clean(splitSkill(new TextDecoder().decode(bytes))),
        };
      }
      const { pkg } = await loadPackage(ident, signal);
      return {
        id: ident.id,
        origin: ident.origin,
        name: pkg.name,
        description: pkg.description,
        body: pkg.body,
      };
    },
    /** Confirmed USER-destination install of the downloaded, validated package, with provenance. */
    async install(
      input: Record<string, unknown>,
      cancelled: () => boolean,
      signal?: AbortSignal,
    ) {
      const ident = identity(input.skill);
      if (input.confirm !== true) throw reject('catalog-confirm', 400);
      const dest = await options.destination(input.destination, input.project);
      if (!dest) throw reject('create-readonly', 403);
      const { pkg, url } = await loadPackage(ident, signal);
      return options.exclusive(async () => {
        await ready();
        if (state.installs.length >= config.maxInstalls)
          throw reject('repo-limit', 400);
        const root = resolve(dest.root);
        const duplicate = state.installs.find(
          (item) =>
            item.catalogId === ident.id &&
            item.root === root &&
            item.name === pkg.name,
        );
        const next = clone();
        // A record whose copy vanished is stale; installing again replaces it.
        if (duplicate) {
          const present = await lstat(join(root, pkg.name)).then(
            () => true,
            () => false,
          );
          if (present || duplicate.trashId) throw reject('repo-conflict', 409);
          next.installs = next.installs.filter(
            (item) => item.id !== duplicate.id,
          );
        }
        const entry: CatalogInstall = {
          id: randomUUID(),
          catalog: ident.catalog,
          catalogId: ident.id,
          origin: ident.origin,
          url,
          digest: pkg.digest,
          name: pkg.name,
          source: dest.id,
          root,
          scope: dest.project ? 'project' : 'user',
          ...(dest.project ? { project: dest.project } : {}),
          treeHash: pkg.treeHash,
          files: pkg.manifest,
          installedAt: new Date().toISOString(),
        };
        if (await conflicts(root, pkg.name)) {
          // Reassociate: an identical untracked copy is adopted instead of rewritten.
          const present = await readInstalled(join(root, pkg.name));
          const owned = state.installs.some(
            (item) =>
              item.root === root && item.name === pkg.name && !item.trashId,
          );
          if (
            owned ||
            input.reassociate !== true ||
            !present ||
            treeHashOf(present.map(({ path, hash }) => ({ path, hash }))) !==
              pkg.treeHash
          )
            throw reject('repo-conflict', 409);
          entry.files = present;
          next.installs.push(entry);
          await persist(next);
          options.changed();
          return { reassociated: true, warnings: [] };
        }
        const result = await publishImports(
          [{ name: pkg.name, source: ident.id, files: pkg.files }],
          root,
          'skip',
          false,
          cancelled,
        );
        if (result.skipped.length) throw reject('repo-conflict', 409);
        if (!result.imported.length)
          throw new RepoError(
            result.failed[0]?.code ?? 'repo-install-failed',
            409,
          );
        next.installs.push(entry);
        try {
          await persist(next);
        } catch (error) {
          await rm(join(root, pkg.name), { recursive: true, force: true });
          throw error;
        }
        options.changed();
        return { warnings: result.warnings };
      });
    },
    /** Moves a catalog copy to the shared Trash; provenance follows the Trash entry. */
    async uninstall(id: unknown, project: unknown, cancelled: () => boolean) {
      return options.exclusive(async () => {
        await ready();
        const item = state.installs.find((entry) => entry.id === id);
        if (!item) throw reject('repo-not-installed', 404);
        if (item.project !== project) throw reject('project-mismatch', 409);
        if (item.trashId) throw reject('repo-trashed', 409);
        const dest = await options.destination(item.source, item.project);
        if (!dest || resolve(dest.root) !== item.root)
          throw reject('repo-invalid-root', 409);
        const target = join(item.root, item.name);
        if (
          !(await lstat(target).then(
            (info) => info.isDirectory(),
            () => false,
          ))
        )
          throw reject('repo-missing', 409);
        let result;
        try {
          await checkedTrashPath(item.root, true);
          result = await trashEntry(
            options.trashRoot,
            {
              name: item.name,
              source: item.source,
              scope: item.project ?? 'global',
              root: item.root,
              origin: target,
            },
            cancelled,
          );
        } catch (error) {
          throw error instanceof RepoError
            ? error
            : reject(
                error instanceof Error && error.message.startsWith('trash-')
                  ? error.message
                  : 'trash-failed',
                409,
              );
        }
        const next = clone();
        next.installs.find((entry) => entry.id === id)!.trashId = result.id;
        await persist(next, true);
        options.changed();
        return result.warning
          ? { warning: result.warning, path: result.path }
          : {};
      });
    },
    /**
     * Record-only removal of an `invalid-root` copy, or of a record whose Trash entry was removed outside
     * the app (`trashIds` is the verified current Trash listing); no disk access, nothing is deleted.
     */
    async forget(id: unknown, project: unknown, trashIds?: Set<string>) {
      return options.exclusive(async () => {
        await ready();
        const item = state.installs.find((entry) => entry.id === id);
        if (!item) throw reject('repo-not-installed', 404);
        if (item.project !== project) throw reject('project-mismatch', 409);
        const orphaned =
          !!item.trashId && !!trashIds && !trashIds.has(item.trashId);
        if (item.trashId && !orphaned) throw reject('repo-trashed', 409);
        const dest = await options.destination(item.source, item.project);
        if (!orphaned && dest && resolve(dest.root) === item.root)
          throw reject('repo-root-valid', 409);
        const next = clone();
        next.installs = next.installs.filter((entry) => entry.id !== id);
        await persist(next, true);
        return {};
      });
    },
    // Trash hooks run inside the caller's mutation slot; they never throw.
    async noteTrashed(
      root: string,
      origin: string,
      trashId: string | undefined,
    ) {
      if (!trashId) return;
      try {
        await sync();
        if (invalid) return;
        const found = state.installs.find(
          (item) =>
            !item.trashId &&
            item.root === root &&
            join(item.root, item.name) === origin,
        );
        if (!found) return;
        const next = clone();
        next.installs.find((item) => item.id === found.id)!.trashId = trashId;
        await persist(next, true);
      } catch {
        /* provenance is advisory for the generic Trash button */
      }
    },
    async noteRestored(trashId: string) {
      try {
        await sync();
        if (invalid || !state.installs.some((item) => item.trashId === trashId))
          return;
        const next = clone();
        delete next.installs.find((item) => item.trashId === trashId)!.trashId;
        await persist(next, true);
      } catch {
        /* see noteTrashed */
      }
    },
    async noteDeleted(trashId: string) {
      try {
        await sync();
        if (invalid || !state.installs.some((item) => item.trashId === trashId))
          return;
        const next = clone();
        next.installs = next.installs.filter(
          (item) => item.trashId !== trashId,
        );
        await persist(next, true);
      } catch {
        /* see noteTrashed */
      }
    },
  };
}
export type Catalogs = ReturnType<typeof createCatalogs>;
