import { randomUUID } from 'node:crypto';
import { lstat, mkdir, open, realpath, rename, rm, writeFile, } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, dirname, isAbsolute, join, resolve, sep } from 'node:path';
import { parseDocument } from 'yaml';
import { discoverReadonlyEntries } from './skills-discovery.js';
import { CUSTOM_ID, CUSTOM_RANK_BASE, CUSTOM_RANK_STEP, comparisonPath, customSlug, isSameOrDescendant, MAX_CUSTOM_SOURCES, MAX_LABEL, overlapsResolved, PROJECT_SOURCES, prepareRoots, resolveProject, scanCandidates, validateRootPath, } from './skills-sources.js';
export const name = 'dsh-waycraft/skills';
export const inject = ['skills'];
const diag = (code, params, message) => ({ code, params, message });
function policyValue(value, fallback) {
    if (value === undefined)
        return fallback;
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'number' && (value === 0 || value === 1))
        return value === 1;
    if (typeof value !== 'string')
        return undefined;
    if (/^(true|yes|on|1)$/i.test(value))
        return true;
    if (/^(false|no|off|0)$/i.test(value))
        return false;
    return undefined;
}
const READ_LIMIT = 1024 * 1024;
const MAX_REQUEST = 16384;
/** Reads at most `limit` bytes; `oversized` reports a longer file (text is then the prefix). */
async function readBounded(path, limit) {
    const handle = await open(path, 'r');
    try {
        if (!(await handle.stat()).isFile())
            throw new Error('Not a file');
        const buffer = Buffer.alloc(limit + 1);
        let total = 0;
        while (total < buffer.length) {
            const next = await handle.read(buffer, total, buffer.length - total, total);
            if (!next.bytesRead)
                break;
            total += next.bytesRead;
        }
        return {
            text: buffer.subarray(0, Math.min(total, limit)).toString('utf8'),
            oversized: total > limit,
        };
    }
    finally {
        await handle.close();
    }
}
async function scan(source, order, signal, diagnostics) {
    const sourceId = source.id;
    const root = await realpath(resolve(source.path)).catch(() => resolve(source.path));
    const discovered = await discoverReadonlyEntries(root, signal);
    if (discovered.truncated)
        diagnostics.push(diag('discovery-truncated', { source: sourceId }, `${sourceId}: discovery truncated`));
    if (!discovered.exists)
        diagnostics.push(diag('source-unavailable', { source: sourceId }, `${sourceId}: source unavailable`));
    if (discovered.errors.length)
        diagnostics.push(diag('unreadable-entries', { source: sourceId, count: String(discovered.errors.length) }, `${sourceId}: ${discovered.errors.length} entries could not be read`));
    const rank = source.rank ??
        (sourceId === 'user-dsh'
            ? 400
            : sourceId === 'user-agents'
                ? 500
                : 300 + order);
    const result = [];
    const base = {
        provider: 'majed-skills',
        source: sourceId,
        rank,
        eligible: true,
    };
    const invalid = (path, text, own) => result.push({
        ...base,
        name: path.split(/[\\/]/).slice(-2).join('/'),
        description: '',
        path,
        locator: path,
        eligible: false,
        policyValid: false,
        metadataValid: false,
        invocation: { modelInvocable: false, userInvocable: false },
        content: text,
        original: text,
        diagnostics: own,
    });
    const note = (own) => diagnostics.push(own);
    for (const entry of discovered.entries) {
        if (signal?.aborted)
            return [];
        const path = entry.docPath;
        const actual = await realpath(path).catch(() => undefined);
        if (!actual) {
            note(diag('unreadable-skill', { source: sourceId, path }, `${sourceId}: unreadable skill ${path}`));
            continue;
        }
        const own = [];
        // Linked bundles are allowed (read-only) but a document resolving outside the root is reported.
        if (actual !== root && !actual.startsWith(root + sep))
            own.push(diag('linked-outside-root', { source: sourceId, path }, `${sourceId}: skill document resolves outside the source ${path}`));
        let text;
        let oversized;
        try {
            ({ text, oversized } = await readBounded(actual, READ_LIMIT));
        }
        catch {
            note(diag('unreadable-skill', { source: sourceId, path }, `${sourceId}: unreadable skill ${path}`));
            continue;
        }
        if (oversized)
            own.push(diag('oversized-skill', { source: sourceId, path }, `${sourceId}: oversized skill ${path}`));
        if (!text) {
            note(diag('empty-skill', { source: sourceId, path }, `${sourceId}: empty skill ${path}`));
            continue;
        }
        const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
        const fail = (code, what) => {
            const d = diag(code, { source: sourceId, path }, `${sourceId}: ${what} ${path}`);
            for (const item of own)
                note(item);
            note(d);
            invalid(path, text, [...own, d]);
        };
        if (!match) {
            fail('invalid-frontmatter', 'invalid frontmatter');
            continue;
        }
        const doc = parseDocument(match[1], { uniqueKeys: true });
        if (doc.errors.length) {
            fail('invalid-yaml', 'invalid YAML');
            continue;
        }
        let data;
        try {
            data = doc.toJS({ maxAliasCount: 50 });
        }
        catch {
            fail('invalid-yaml', 'invalid YAML');
            continue;
        }
        if (!data ||
            typeof data !== 'object' ||
            Array.isArray(data) ||
            typeof data.name !== 'string' ||
            !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.name) ||
            typeof data.description !== 'string') {
            fail('invalid-metadata', 'invalid metadata');
            continue;
        }
        const modelDisabled = policyValue(data['disable-model-invocation'], false);
        const user = policyValue(data['user-invocable'], true);
        const valid = modelDisabled !== undefined && user !== undefined;
        if (!valid)
            own.push(diag('invalid-policy', { source: sourceId, path }, `${sourceId}: invalid invocation policy ${path}`));
        for (const item of own)
            if (!diagnostics.includes(item))
                note(item);
        result.push({
            ...base,
            name: data.name,
            description: data.description,
            path,
            locator: path,
            // An oversized document is loadable by the native provider, so it is kept as a denied candidate.
            eligible: !oversized,
            policyValid: valid && !oversized,
            author: {
                modelInvocable: valid && !modelDisabled,
                userInvocable: valid && user === true,
            },
            invocation: { modelInvocable: false, userInvocable: false },
            content: oversized ? '' : text.slice(match[0].length),
            original: text,
            diagnostics: own,
        });
    }
    return result;
}
export function apply(ctx, config = {}) {
    const dshHome = process.env.DSH_HOME || join(homedir(), '.dsh');
    const builtins = [
        ['ccswitch', '.cc-switch'],
        ['codex', '.codex', 'DSH_CODEX_HOME'],
        ['claude', '.claude', 'DSH_CLAUDE_HOME'],
        ['gemini', '.gemini', 'DSH_GEMINI_HOME'],
        ['opencode', '.config/opencode', 'DSH_OPENCODE_HOME'],
        ['cursor', '.cursor', 'DSH_CURSOR_HOME'],
        ['copilot', '.copilot', 'DSH_COPILOT_HOME'],
        ['windsurf', '.codeium/windsurf', 'DSH_WINDSURF_HOME'],
        ['windsurf-user', '.windsurf', 'DSH_WINDSURF_USER_HOME'],
        ['trae', '.trae', 'DSH_TRAE_HOME'],
        ['trae-cn', '.trae-cn', 'DSH_TRAE_CN_HOME'],
        ['openclaw', '.openclaw', 'DSH_OPENCLAW_HOME'],
        ['clawdbot', '.clawdbot', 'DSH_CLAWDBOT_HOME'],
        ['roo', '.roo', 'DSH_ROO_HOME'],
        ['codebuddy', '.codebuddy', 'DSH_CODEBUDDY_HOME'],
        ['workbuddy', '.workbuddy', 'DSH_WORKBUDDY_HOME'],
        ['qoder', '.qoder', 'DSH_QODER_HOME'],
        ['qoder-cn', '.qoder-cn', 'DSH_QODER_CN_HOME'],
        ['lingma', '.lingma', 'DSH_LINGMA_HOME'],
        ['antigravity', '.gemini/config', 'DSH_ANTIGRAVITY_HOME'],
    ];
    const labels = {
        ccswitch: 'CC Switch',
        codex: 'Codex',
        claude: 'Claude',
        gemini: 'Gemini',
        opencode: 'OpenCode',
        cursor: 'Cursor',
        copilot: 'Copilot',
        windsurf: 'Windsurf',
        'windsurf-user': 'Windsurf (user)',
        trae: 'Trae',
        'trae-cn': 'Trae CN',
        openclaw: 'OpenClaw',
        clawdbot: 'Clawdbot',
        roo: 'Roo',
        codebuddy: 'CodeBuddy',
        workbuddy: 'WorkBuddy',
        qoder: 'Qoder',
        'qoder-cn': 'Qoder CN',
        lingma: 'Lingma',
        antigravity: 'Antigravity',
    };
    const baseSources = config.sources ?? [
        { id: 'user-dsh', label: 'DSH', path: join(dshHome, 'skills'), rank: 400 },
        {
            id: 'user-agents',
            label: 'Agents',
            path: join(process.env.AGENTS_HOME || join(homedir(), '.agents'), 'skills'),
            rank: 500,
        },
        ...builtins.map(([id, path, env], i) => ({
            id,
            label: labels[id],
            path: join((env && process.env[env]) || join(homedir(), path), 'skills'),
            rank: 510 + i,
        })),
    ];
    const statePath = config.statePath ?? join(dshHome, 'majed-skills', 'state.json');
    const emptyState = () => ({
        sources: Object.create(null),
        copies: Object.create(null),
        customSources: [],
        projects: Object.create(null),
    });
    let state = emptyState();
    let corrupt = false;
    const isFlags = (value) => !!value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        Object.values(value).every((x) => typeof x === 'boolean');
    const parseState = (parsed) => {
        const invalid = () => new Error('Invalid skill state');
        if (!parsed || typeof parsed !== 'object')
            throw invalid();
        const value = parsed;
        if (!isFlags(value.sources) || !isFlags(value.copies))
            throw invalid();
        const custom = value.customSources ?? [];
        if (!Array.isArray(custom) || custom.length > MAX_CUSTOM_SOURCES)
            throw invalid();
        const seen = new Set();
        for (const item of custom) {
            if (!item ||
                typeof item !== 'object' ||
                typeof item.id !== 'string' ||
                !CUSTOM_ID.test(item.id) ||
                seen.has(item.id) ||
                typeof item.label !== 'string' ||
                !item.label ||
                item.label.length > MAX_LABEL ||
                typeof item.path !== 'string' ||
                !isAbsolute(item.path) ||
                (item.group !== undefined &&
                    (typeof item.group !== 'string' || item.group.length > MAX_LABEL)))
                throw invalid();
            seen.add(item.id);
        }
        const projects = value.projects ?? {};
        if (!projects || typeof projects !== 'object' || Array.isArray(projects))
            throw invalid();
        const nextProjects = Object.create(null);
        for (const [id, entry] of Object.entries(projects)) {
            const item = entry;
            if (!/^[0-9a-f]{16}$/.test(id) ||
                !item ||
                !isFlags(item.sources) ||
                !isFlags(item.copies))
                throw invalid();
            nextProjects[id] = {
                sources: Object.assign(Object.create(null), item.sources),
                copies: Object.assign(Object.create(null), item.copies),
            };
        }
        return {
            sources: Object.assign(Object.create(null), value.sources),
            copies: Object.assign(Object.create(null), value.copies),
            customSources: custom.map((item) => ({
                id: item.id,
                label: item.label,
                path: item.path,
                ...(item.group ? { group: item.group } : {}),
            })),
            projects: nextProjects,
        };
    };
    const loadState = () => readBounded(statePath, READ_LIMIT)
        .then(({ text, oversized }) => {
        if (oversized)
            throw new Error('Invalid skill state');
        state = parseState(JSON.parse(text));
        corrupt = false;
    })
        .catch((error) => {
        corrupt = error.code !== 'ENOENT';
    });
    let ready = loadState();
    const controls = new Set();
    let revision = 0;
    /**
     * Custom sources rank after every built-in (see CUSTOM_RANK_BASE), by registration order. They
     * therefore never share a rank, or an overlay rank, with a native root such as custom-300.
     */
    const customSource = (item, index) => ({
        id: item.id,
        path: item.path,
        label: item.label,
        ...(item.group ? { group: item.group } : {}),
        custom: true,
        rank: CUSTOM_RANK_BASE + index * CUSTOM_RANK_STEP,
    });
    const globalSources = () => [
        ...baseSources,
        ...(corrupt ? [] : state.customSources).map(customSource),
    ];
    const reservedFolders = () => [dirname(statePath)];
    // ---- registered projects: always re-resolved from the host registry, never from the client ----
    /** Last workspace list the host reported successfully; reused when the registry later fails. */
    let knownWorkspaces = [];
    let registryUnavailable = false;
    const registeredProjects = async () => {
        let paths = knownWorkspaces;
        try {
            const registry = ctx.get?.('workspaceRegistry');
            if (typeof registry?.list !== 'function')
                throw new Error('Workspace registry unavailable');
            paths = registry
                .list()
                .map((item) => item.path ?? item.cwd)
                .filter((value) => typeof value === 'string');
            knownWorkspaces = paths;
            registryUnavailable = false;
        }
        catch {
            // Fail closed: keep the last known-good project set so disabled project skills stay denied.
            registryUnavailable = true;
        }
        const resolved = await Promise.all([...new Set(paths)].map((path) => resolveProject(path)));
        const seen = new Set();
        return resolved.filter((item) => !seen.has(item.id) && seen.add(item.id));
    };
    /** Persistent while the registry cannot be read and there is project state to protect. */
    const registryDiagnostics = () => registryUnavailable &&
        (knownWorkspaces.length || Object.keys(state.projects).length)
        ? [
            diag('registry-unavailable', {}, 'Workspace registry unavailable; project policy may not apply'),
        ]
        : [];
    /** Project skill roots: agent-specific hidden folders that stay inside the project root. */
    const globalResolved = () => Promise.all(globalSources().map((item) => comparisonPath(item.path)));
    const projectSources = async (project, protectedResolved) => {
        const found = [];
        const diagnostics = [];
        if (!project.available || !project.root)
            return { sources: found, diagnostics };
        const protectedPaths = protectedResolved ?? (await globalResolved());
        for (const entry of PROJECT_SOURCES) {
            const id = `project-${entry.kind}:${project.id}`;
            const path = join(project.root, entry.dir, 'skills');
            const info = await lstat(path).catch(() => undefined);
            if (!info)
                continue;
            const real = await realpath(path).catch(() => undefined);
            if (!real || !(await lstat(real).catch(() => undefined))?.isDirectory())
                continue;
            if (!isSameOrDescendant(project.root, real)) {
                diagnostics.push(diag('project-source-outside', { source: id, project: project.id }, `${entry.label}: project skill folder resolves outside the project`));
                continue;
            }
            // `real` is a realpath and every comparison path is already resolved.
            const clash = [...protectedPaths, ...found.map((x) => x.path)].some((other) => overlapsResolved(real, other));
            if (clash) {
                diagnostics.push(diag('project-source-overlap', { source: id, project: project.id }, `${entry.label}: project skill folder overlaps another source`));
                continue;
            }
            found.push({
                id,
                path: real,
                label: entry.label,
                rank: entry.rank,
                kind: entry.kind,
                project: project.id,
            });
        }
        return { sources: found, diagnostics };
    };
    /** Scans the sources; state is applied synchronously afterwards so the result is never stale. */
    const scanSources = async (list, signal, extra = []) => {
        const scanDiagnostics = [...extra];
        const raw = (await Promise.all(list.map((source, i) => scan(source, i, signal, scanDiagnostics).catch(() => {
            scanDiagnostics.push(diag('source-unavailable', { source: source.id }, `${source.id}: source unavailable`));
            return [];
        })))).flat();
        return { raw, scanDiagnostics };
    };
    const scanAll = async (signal) => {
        await ready;
        return scanSources(globalSources(), signal);
    };
    const scanProject = async (project, signal) => {
        await ready;
        const { sources: list, diagnostics } = await projectSources(project);
        return { list, ...(await scanSources(list, signal, diagnostics)) };
    };
    /** Same-rank copies are ordered by source identity then path, never by registration order. */
    const precedence = (a, b) => a.rank - b.rank ||
        (a.source < b.source ? -1 : a.source > b.source ? 1 : 0) ||
        (a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
    const settle = (raw, sourceOn, copyOn) => {
        const copies = raw.map((copy) => {
            const eligible = copy.eligible && !corrupt && sourceOn(copy) && copyOn(copy);
            return {
                ...copy,
                eligible,
                invocation: eligible && copy.policyValid && copy.author
                    ? copy.author
                    : { modelInvocable: false, userInvocable: false },
            };
        });
        const byName = new Map();
        for (const copy of copies)
            if (copy.metadataValid !== false)
                byName.set(copy.name, [...(byName.get(copy.name) ?? []), copy]);
        for (const group of byName.values()) {
            group.sort(precedence);
            const winner = group.find((copy) => copy.eligible);
            for (const copy of group)
                if (winner && copy !== winner && copy.eligible)
                    copy.shadowedBy = winner.path;
        }
        return { copies, groups: byName };
    };
    const stateDiagnostics = (scanDiagnostics) => corrupt
        ? [
            diag('state-invalid', {}, 'Invalid skill state; managed skills are disabled'),
            ...scanDiagnostics,
        ]
        : scanDiagnostics;
    const finalize = (raw, scanDiagnostics) => {
        const list = globalSources();
        const { copies, groups } = settle(raw, (copy) => state.sources[copy.source] ??
            list.find((x) => x.id === copy.source)?.enabled ??
            true, (copy) => state.copies[copy.path] !== false);
        return { copies, groups, diagnostics: stateDiagnostics(scanDiagnostics) };
    };
    const projectState = (id) => state.projects[id] ?? { sources: {}, copies: {} };
    const finalizeProject = (project, list, raw, scanDiagnostics) => {
        const own = projectState(project.id);
        const kinds = new Map(list.map((item) => [item.id, item.kind ?? '']));
        const { copies, groups } = settle(raw, (copy) => own.sources[kinds.get(copy.source) ?? ''] ?? true, (copy) => own.copies[copy.path] !== false);
        return { copies, groups, diagnostics: stateDiagnostics(scanDiagnostics) };
    };
    // Provider listings share one scan per revision; state is applied after it, so deny state is never stale.
    let scanCache;
    const sharedScan = () => {
        if (scanCache?.revision !== revision)
            scanCache = { revision, scan: scanAll() };
        return scanCache.scan;
    };
    let projectScans = {
        revision: -1,
        scans: new Map(),
    };
    const sharedProjectScan = (project) => {
        if (projectScans.revision !== revision)
            projectScans = { revision, scans: new Map() };
        let scanned = projectScans.scans.get(project.id);
        if (!scanned) {
            scanned = scanProject(project);
            projectScans.scans.set(project.id, scanned);
        }
        return scanned;
    };
    const catalog = async () => {
        // The manager UI always rescans, which also refreshes the shared cache.
        const scan = scanAll();
        scanCache = { revision, scan };
        const { raw, scanDiagnostics } = await scan;
        return finalize(raw, scanDiagnostics);
    };
    const projectCatalog = async (project) => {
        const { list, raw, scanDiagnostics } = await scanProject(project);
        return { list, ...finalizeProject(project, list, raw, scanDiagnostics) };
    };
    /** The registered, available project whose root contains `cwd`, if any. */
    const projectForCwd = async (cwd) => {
        if (typeof cwd !== 'string' || !isAbsolute(cwd))
            return undefined;
        // A cwd that no longer exists still resolves through its nearest existing ancestor, so a
        // vanished subdirectory of a project keeps that project's deny policy.
        const real = await comparisonPath(cwd);
        let best;
        for (const project of await registeredProjects())
            if (project.available &&
                project.root &&
                isSameOrDescendant(project.root, real) &&
                (!best?.root || project.root.length > best.root.length))
                best = project;
        return best;
    };
    const native = ({ author: _author, original: _original, diagnostics: _diagnostics, shadowedBy: _shadowedBy, ...candidate }) => candidate;
    const registrations = new Map();
    const install = (target) => (target.get?.('skills') ?? target.skills).registerProvider((control) => {
        controls.add(control);
        control.signal.addEventListener('abort', () => controls.delete(control), {
            once: true,
        });
        let snapshot = new Map();
        let snapshotRevision = -1;
        /** One overlay candidate per same-name group, ranked just ahead of the group's best copy. */
        const overlay = (group) => {
            const winner = group.find((copy) => copy.eligible) ?? group[0];
            // Source-relative policy overlay preserves unrelated runtime/project precedence.
            return {
                ...native(winner),
                rank: Math.min(...group.map((copy) => copy.rank)) - 1,
            };
        };
        return {
            name: 'majed-skills',
            async list(options) {
                if (control.signal.aborted)
                    return [];
                const { raw, scanDiagnostics } = await sharedScan();
                if (control.signal.aborted)
                    return [];
                // State is read after the scan completes, so a toggle that landed meanwhile is
                // already reflected and the deny overlay never disappears.
                const { copies, groups } = finalize(raw, scanDiagnostics);
                if (snapshotRevision !== revision)
                    snapshot = new Map();
                snapshotRevision = revision;
                for (const copy of copies)
                    snapshot.set(copy.path, native(copy));
                const result = [...groups.values()]
                    .filter((group) => {
                    const only = group[0];
                    return (group.length > 1 ||
                        !['user-dsh', 'user-agents'].includes(only.source) ||
                        !only.eligible ||
                        !only.policyValid ||
                        state.copies[only.path] !== undefined);
                })
                    .map(overlay);
                // Project overlays only for the registered project that contains the caller's cwd.
                const project = await projectForCwd(options?.cwd);
                if (project && !control.signal.aborted) {
                    const scanned = await sharedProjectScan(project);
                    if (control.signal.aborted)
                        return [];
                    const own = finalizeProject(project, scanned.list, scanned.raw, scanned.scanDiagnostics);
                    if (snapshotRevision !== revision)
                        return result;
                    for (const copy of own.copies)
                        snapshot.set(copy.path, native(copy));
                    // Only the .dsh and .agents project roots are discovered natively; the other project roots
                    // exist only here, so they too surface only as overlays where policy deviates.
                    for (const group of own.groups.values())
                        if (group.some((copy) => !copy.eligible || !copy.policyValid))
                            result.push(overlay(group));
                }
                return result;
            },
            async get(candidate) {
                if (control.signal.aborted || snapshotRevision !== revision)
                    return undefined;
                return snapshot.get(candidate.path);
            },
        };
    });
    let operations = Promise.resolve();
    let closing = false;
    ctx.effect(() => () => {
        closing = true;
        return operations;
    }, 'majed-skills pending state writes');
    /** Atomic, owner-only state replacement; callers hold the serialized `operations` slot. */
    const writeState = async (next) => {
        await mkdir(dirname(statePath), { recursive: true });
        const temporary = `${statePath}.${process.pid}.${randomUUID()}.tmp`;
        try {
            await writeFile(temporary, JSON.stringify(next), { mode: 0o600 });
            await rename(temporary, statePath);
        }
        finally {
            await rm(temporary, { force: true });
        }
        state = next;
        revision++;
        for (const control of controls)
            control.invalidate();
    };
    const flags = (value) => Object.assign(Object.create(null), value);
    const cloneState = () => {
        const projects = Object.create(null);
        for (const [id, item] of Object.entries(state.projects))
            projects[id] = {
                sources: flags(item.sources),
                copies: flags(item.copies),
            };
        return {
            sources: flags(state.sources),
            copies: flags(state.copies),
            customSources: state.customSources.map((item) => ({ ...item })),
            projects,
        };
    };
    const fail = (status, code, params = {}) => Response.json({ code, params }, { status });
    const strip = ({ content: _content, original: _original, ...summary }) => summary;
    const summarize = (project) => ({
        id: project.id,
        name: project.name,
        path: project.path,
        available: project.available,
        code: project.code,
    });
    const projectView = async (project) => {
        if (!project.available)
            return {
                ...summarize(project),
                sources: [],
                copies: [],
                diagnostics: [
                    diag(project.code ?? 'project-unavailable', { project: project.id }, `${project.name}: project unavailable`),
                ],
            };
        const { list, copies, diagnostics } = await projectCatalog(project);
        const own = projectState(project.id);
        return {
            ...summarize(project),
            sources: list.map((item) => ({
                ...item,
                // Project DSH keeps the reference restriction: no source-level switch.
                readonly: item.kind === 'dsh',
                enabled: !corrupt && (own.sources[item.kind ?? ''] ?? true),
            })),
            copies: copies.map(strip),
            diagnostics,
        };
    };
    const payload = async (project, projects, expose = true) => {
        const { copies, diagnostics } = await catalog();
        return {
            sources: globalSources().map((source) => ({
                ...source,
                enabled: !corrupt && (state.sources[source.id] ?? source.enabled ?? true),
            })),
            copies: copies.map(strip),
            corrupt,
            diagnostics: [...diagnostics, ...registryDiagnostics()],
            projects: expose ? projects.map(summarize) : [],
            ...(project ? { project: await projectView(project) } : {}),
        };
    };
    /** Every folder a new custom source must not overlap: global roots and available project roots. */
    const protectedRoots = async (projects) => {
        const others = globalSources().map(({ id, path }) => ({ id, path }));
        const resolved = await globalResolved();
        for (const project of projects)
            for (const item of (await projectSources(project, resolved)).sources)
                others.push({ id: item.id, path: item.path });
        return others;
    };
    const text = (value, limit = MAX_LABEL) => typeof value === 'string' && value.trim().length <= limit
        ? value.trim()
        : undefined;
    const customAdd = async (items, projects) => {
        const next = cloneState();
        const results = [];
        // Protected roots are resolved once; each added source joins the prepared set.
        const prepared = await prepareRoots([
            ...(await protectedRoots(projects)),
            ...next.customSources.map(({ id, path }) => ({ id, path })),
        ].filter((value, index, all) => all.findIndex((other) => other.id === value.id) === index), reservedFolders());
        for (const item of items) {
            const requested = typeof item.path === 'string' ? item.path : '';
            const label = item.label === undefined
                ? undefined
                : text(item.label) || (item.label === '' ? undefined : null);
            const group = item.group === undefined ? undefined : text(item.group);
            if (label === null || (item.group !== undefined && group === undefined)) {
                results.push({ status: 'rejected', code: 'custom-label' });
                continue;
            }
            const checked = await validateRootPath(requested, prepared);
            if (!checked.ok) {
                // The same folder (even through a link) is already registered: idempotent success.
                const other = checked.params.other
                    ? next.customSources.find((x) => x.id === checked.params.other)
                    : undefined;
                if (checked.code === 'root-overlap' &&
                    other &&
                    (await comparisonPath(other.path)) ===
                        (await comparisonPath(requested)))
                    results.push({ status: 'registered', id: other.id });
                else
                    results.push({
                        status: 'rejected',
                        code: checked.code,
                        params: { path: requested },
                    });
                continue;
            }
            if (next.customSources.length >= MAX_CUSTOM_SOURCES) {
                results.push({
                    status: 'rejected',
                    code: 'custom-limit',
                    params: { limit: String(MAX_CUSTOM_SOURCES) },
                });
                continue;
            }
            const name = label || basename(checked.path) || 'source';
            const id = customSlug(name, new Set(next.customSources.map((x) => x.id)));
            if (!id) {
                results.push({
                    status: 'rejected',
                    code: 'custom-limit',
                    params: { limit: String(MAX_CUSTOM_SOURCES) },
                });
                continue;
            }
            next.customSources.push({
                id,
                label: name.slice(0, MAX_LABEL),
                path: checked.path,
                ...(group ? { group } : {}),
            });
            prepared.others.push({ id, path: checked.path });
            results.push({ status: 'added', id });
        }
        if (results.some((x) => x.status === 'added'))
            await writeState(next);
        return results;
    };
    const customUpdate = async (body, projects) => {
        const next = cloneState();
        const record = next.customSources.find((x) => x.id === body.id);
        if (!record)
            return fail(404, 'custom-unknown');
        if (typeof body.label !== 'string' || !body.label.trim())
            return fail(400, 'custom-label');
        if (body.label.trim().length > MAX_LABEL)
            return fail(409, 'custom-label');
        if (body.group !== undefined && typeof body.group !== 'string')
            return fail(400, 'custom-label');
        if (typeof body.group === 'string' && body.group.trim().length > MAX_LABEL)
            return fail(409, 'custom-label');
        if (body.path !== undefined) {
            const checked = await validateRootPath(body.path, await prepareRoots([
                ...(await protectedRoots(projects)),
                ...next.customSources.map(({ id, path }) => ({ id, path })),
            ], reservedFolders()), record.id);
            if (!checked.ok)
                return fail(409, checked.code, checked.params);
            if (checked.path !== record.path) {
                // Policy keyed by the old location must not silently apply to the new folder.
                delete next.sources[record.id];
                for (const path of Object.keys(next.copies))
                    if (isSameOrDescendant(record.path, path))
                        delete next.copies[path];
            }
            record.path = checked.path;
        }
        record.label = body.label.trim();
        if (typeof body.group === 'string') {
            if (body.group.trim())
                record.group = body.group.trim();
            else
                delete record.group;
        }
        await writeState(next);
        return undefined;
    };
    const customRemove = async (id) => {
        const next = cloneState();
        const index = next.customSources.findIndex((x) => x.id === id);
        if (index < 0)
            return fail(404, 'custom-unknown');
        const [removed] = next.customSources.splice(index, 1);
        // Only Waycraft state is edited: the folder and its skills are never touched.
        delete next.sources[id];
        for (const path of Object.keys(next.copies))
            if (isSameOrDescendant(removed.path, path))
                delete next.copies[path];
        await writeState(next);
        return undefined;
    };
    ctx.inject?.(['connection'], (target) => {
        const connection = target.get?.('connection');
        if (!connection)
            return;
        target.effect(() => connection.fetch.register({
            path: '/api/majed-skills.catalog',
            methods: ['POST'],
            requestBody: 'buffered',
            async fetch(request) {
                if (closing)
                    return new Response('Skill manager is stopping', { status: 503 });
                if (request.headers.get('content-type')?.split(';')[0] !==
                    'application/json')
                    return new Response('JSON required', { status: 415 });
                const origin = request.headers.get('origin');
                if (origin && origin !== new URL(request.url).origin)
                    return new Response('Origin rejected', { status: 403 });
                if (request.headers.get('sec-fetch-site') === 'cross-site')
                    return new Response('Origin rejected', { status: 403 });
                const declared = Number(request.headers.get('content-length'));
                if (Number.isFinite(declared) && declared > MAX_REQUEST)
                    return new Response('Request too large', { status: 413 });
                try {
                    const reader = request.body?.getReader();
                    let requestText = '';
                    let length = 0;
                    if (reader) {
                        try {
                            const decoder = new TextDecoder();
                            while (true) {
                                const part = await reader.read();
                                if (part.done)
                                    break;
                                length += part.value.byteLength;
                                if (length > MAX_REQUEST) {
                                    await reader.cancel();
                                    return new Response('Request too large', { status: 413 });
                                }
                                requestText += decoder.decode(part.value, { stream: true });
                            }
                            requestText += decoder.decode();
                        }
                        finally {
                            reader.releaseLock();
                        }
                    }
                    const body = JSON.parse(requestText);
                    const marked = request.headers.get('x-majed-skills') === '1';
                    const actions = [
                        'list',
                        'detail',
                        'toggle',
                        'ping',
                        'reload',
                        'custom-scan',
                        'custom-add',
                        'custom-update',
                        'custom-remove',
                    ];
                    if (!body ||
                        typeof body !== 'object' ||
                        Array.isArray(body) ||
                        !actions.includes(body.action ?? 'list') ||
                        (body.project !== undefined && typeof body.project !== 'string'))
                        return new Response('Invalid skill action', { status: 400 });
                    // Presence probe: proves the route exists without scanning any source.
                    if (body.action === 'ping')
                        return Response.json({ ok: true });
                    // A project selector (and the project list itself) exposes workspace paths: marker only.
                    if (body.action === 'list' &&
                        body.project !== undefined &&
                        !marked)
                        return new Response('Mutation marker required', {
                            status: 403,
                        });
                    if (body.action === 'reload') {
                        // Retry path for a corrupt state file: re-read it once the user fixed it.
                        if (!marked)
                            return new Response('Mutation marker required', {
                                status: 403,
                            });
                        // Chained on the serialized operations so a toggle can never interleave with it.
                        const reloaded = operations.then(loadState);
                        operations = reloaded.catch(() => undefined);
                        ready = reloaded;
                        await reloaded;
                        // Native consumers must see the re-read state, not the old deny snapshot.
                        revision++;
                        for (const control of controls)
                            control.invalidate();
                    }
                    await ready;
                    // The project is always re-resolved from the host registry; the id is only a selector.
                    let projectsOnce;
                    // Resolved at most once per request and shared by every step below.
                    const projects = () => (projectsOnce ??= registeredProjects());
                    let project;
                    if (body.project !== undefined) {
                        project = (await projects()).find((item) => item.id === body.project);
                        if (!project)
                            return fail(404, 'project-unregistered');
                    }
                    if (body.action === 'detail') {
                        if (!marked)
                            return new Response('Mutation marker required', {
                                status: 403,
                            });
                        const { copies } = project
                            ? await projectCatalog(project)
                            : await catalog();
                        const copy = copies.find((copy) => copy.path === body.id);
                        if (!copy)
                            return new Response('Unknown skill', { status: 404 });
                        const { content: _content, original, ...rest } = copy;
                        return Response.json({ ...rest, content: original ?? '' });
                    }
                    if (body.action === 'custom-scan') {
                        if (!marked)
                            return new Response('Mutation marker required', {
                                status: 403,
                            });
                        const found = await scanCandidates(body.path, await prepareRoots(await protectedRoots(await projects()), reservedFolders()), state.customSources.map((x) => x.path), request.signal);
                        if (!found.ok)
                            return fail(409, found.code, found.params);
                        return Response.json(found);
                    }
                    if (body.action?.startsWith('custom-')) {
                        if (!marked)
                            return new Response('Mutation marker required', {
                                status: 403,
                            });
                        const items = body.items;
                        if ((body.action === 'custom-add' &&
                            (!Array.isArray(items) ||
                                !items.length ||
                                items.length > 64 ||
                                items.some((x) => !x || typeof x !== 'object' || Array.isArray(x)))) ||
                            (body.action === 'custom-update' &&
                                (typeof body.id !== 'string' ||
                                    typeof body.label !== 'string' ||
                                    !body.label.trim())) ||
                            (body.action === 'custom-remove' &&
                                typeof body.id !== 'string'))
                            return new Response('Invalid custom source request', {
                                status: 400,
                            });
                        let results;
                        const mutation = operations.then(async () => {
                            if (closing)
                                return new Response('Skill manager is stopping', {
                                    status: 503,
                                });
                            if (corrupt)
                                return new Response('Skill state is invalid', {
                                    status: 409,
                                });
                            if (body.action === 'custom-add') {
                                results = await customAdd(items, await projects());
                                return undefined;
                            }
                            return body.action === 'custom-update'
                                ? customUpdate(body, await projects())
                                : customRemove(body.id);
                        });
                        operations = mutation.catch(() => undefined);
                        const error = await mutation;
                        if (error)
                            return error;
                        return Response.json({
                            ...(await payload(project, await projects())),
                            results,
                        });
                    }
                    if (body.action === 'toggle') {
                        if (!marked)
                            return new Response('Mutation marker required', {
                                status: 403,
                            });
                        const mutation = operations.then(async () => {
                            if (closing)
                                return new Response('Skill manager is stopping', {
                                    status: 503,
                                });
                            if (corrupt)
                                return new Response('Skill state is invalid', {
                                    status: 409,
                                });
                            if (typeof body.enabled !== 'boolean' ||
                                typeof body.id !== 'string')
                                return new Response('Invalid toggle', { status: 400 });
                            const next = cloneState();
                            if (project) {
                                const view = project.available
                                    ? await projectCatalog(project)
                                    : undefined;
                                const own = (next.projects[project.id] ??= {
                                    sources: Object.create(null),
                                    copies: Object.create(null),
                                });
                                if (body.kind === 'source') {
                                    const source = view?.list.find((x) => x.id === body.id);
                                    if (!source)
                                        return new Response('Unknown skill target', {
                                            status: 400,
                                        });
                                    // Reference restriction: the project DSH source has no switch.
                                    if (source.kind === 'dsh')
                                        return fail(409, 'project-dsh-source');
                                    own.sources[source.kind ?? ''] = body.enabled;
                                }
                                else if (body.kind === 'copy' &&
                                    view?.copies.some((x) => x.path === body.id))
                                    own.copies[body.id] = body.enabled;
                                else
                                    return new Response('Unknown skill target', {
                                        status: 400,
                                    });
                            }
                            else {
                                const { copies } = await catalog();
                                const valid = body.kind === 'source'
                                    ? globalSources().some((x) => x.id === body.id)
                                    : body.kind === 'copy' &&
                                        copies.some((x) => x.path === body.id);
                                if (!valid)
                                    return new Response('Unknown skill target', {
                                        status: 400,
                                    });
                                (body.kind === 'source' ? next.sources : next.copies)[body.id] = body.enabled;
                            }
                            await writeState(next);
                            return undefined;
                        });
                        operations = mutation.catch(() => undefined);
                        const error = await mutation;
                        if (error)
                            return error;
                    }
                    return Response.json(await payload(project, await projects(), marked));
                }
                catch {
                    return new Response('Skill operation failed', { status: 400 });
                }
            },
        }), 'majed-skills catalog');
    });
    ctx.effect(() => {
        const stop = install(ctx);
        const add = ({ agent }) => {
            if (!registrations.has(agent.id))
                registrations.set(agent.id, install(agent.ctx));
        };
        const remove = ({ agent }) => {
            registrations.get(agent.id)?.();
            registrations.delete(agent.id);
        };
        const offCreated = ctx.on?.('agent/created', add);
        const offDisposed = ctx.on?.('agent/disposed', remove);
        for (const agent of ctx.get?.('agents')?.list() ?? [])
            add({ agent });
        return () => {
            offCreated?.();
            offDisposed?.();
            for (const dispose of registrations.values())
                dispose();
            registrations.clear();
            stop();
        };
    }, 'majed-skills availability overlay');
}
