import { mkdir, open, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { homedir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { parseDocument } from 'yaml';
import { discoverReadonlyEntries } from './skills-discovery.js';
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
        order,
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
    const sources = config.sources ?? [
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
    let state = {
        sources: Object.create(null),
        copies: Object.create(null),
    };
    let corrupt = false;
    const loadState = () => readBounded(statePath, READ_LIMIT)
        .then(({ text, oversized }) => {
        if (oversized)
            throw new Error('Invalid skill state');
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object')
            throw new Error('Invalid skill state');
        const value = parsed;
        if (!value.sources ||
            typeof value.sources !== 'object' ||
            Array.isArray(value.sources) ||
            !value.copies ||
            typeof value.copies !== 'object' ||
            Array.isArray(value.copies) ||
            [
                ...Object.values(value.sources),
                ...Object.values(value.copies),
            ].some((x) => typeof x !== 'boolean'))
            throw new Error('Invalid skill state');
        state = {
            sources: Object.assign(Object.create(null), value.sources),
            copies: Object.assign(Object.create(null), value.copies),
        };
        corrupt = false;
    })
        .catch((error) => {
        corrupt = error.code !== 'ENOENT';
    });
    let ready = loadState();
    const controls = new Set();
    let revision = 0;
    /** Scans the sources; state is applied synchronously afterwards so the result is never stale. */
    const scanAll = async (signal) => {
        await ready;
        const scanDiagnostics = [];
        const raw = (await Promise.all(sources.map((source, i) => scan(source, i, signal, scanDiagnostics).catch(() => {
            scanDiagnostics.push(diag('source-unavailable', { source: source.id }, `${source.id}: source unavailable`));
            return [];
        })))).flat();
        return { raw, scanDiagnostics };
    };
    const finalize = (raw, scanDiagnostics) => {
        const copies = raw.map((copy) => {
            const sourceOn = !corrupt &&
                (state.sources[copy.source] ??
                    sources.find((x) => x.id === copy.source)?.enabled ??
                    true);
            const eligible = copy.eligible &&
                sourceOn &&
                !corrupt &&
                state.copies[copy.path] !== false;
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
            group.sort((a, b) => a.rank - b.rank || (a.order ?? 0) - (b.order ?? 0));
            const winner = group.find((copy) => copy.eligible);
            for (const copy of group)
                if (winner && copy !== winner && copy.eligible)
                    copy.shadowedBy = winner.path;
        }
        const diagnostics = corrupt
            ? [
                diag('state-invalid', {}, 'Invalid skill state; managed skills are disabled'),
                ...scanDiagnostics,
            ]
            : scanDiagnostics;
        return { copies, groups: byName, diagnostics };
    };
    // Provider listings share one scan per revision; state is applied after it, so deny state is never stale.
    let scanCache;
    const sharedScan = () => {
        if (scanCache?.revision !== revision)
            scanCache = { revision, scan: scanAll() };
        return scanCache.scan;
    };
    const catalog = async () => {
        // The manager UI always rescans, which also refreshes the shared cache.
        const scan = scanAll();
        scanCache = { revision, scan };
        const { raw, scanDiagnostics } = await scan;
        return finalize(raw, scanDiagnostics);
    };
    const native = ({ author: _author, original: _original, diagnostics: _diagnostics, order: _order, shadowedBy: _shadowedBy, ...candidate }) => candidate;
    const registrations = new Map();
    const install = (target) => (target.get?.('skills') ?? target.skills).registerProvider((control) => {
        controls.add(control);
        control.signal.addEventListener('abort', () => controls.delete(control), {
            once: true,
        });
        let snapshot = [];
        let snapshotRevision = -1;
        return {
            name: 'majed-skills',
            async list() {
                if (control.signal.aborted)
                    return [];
                const { raw, scanDiagnostics } = await sharedScan();
                if (control.signal.aborted)
                    return [];
                // State is read after the scan completes, so a toggle that landed meanwhile is
                // already reflected and the deny overlay never disappears.
                const { copies, groups } = finalize(raw, scanDiagnostics);
                snapshot = copies.map(native);
                snapshotRevision = revision;
                return [...groups.values()]
                    .filter((group) => {
                    const only = group[0];
                    return (group.length > 1 ||
                        !['user-dsh', 'user-agents'].includes(only.source) ||
                        !only.eligible ||
                        !only.policyValid ||
                        state.copies[only.path] !== undefined);
                })
                    .map((group) => {
                    const winner = group.find((copy) => copy.eligible) ?? group[0];
                    // Source-relative policy overlay preserves unrelated runtime/project precedence.
                    return {
                        ...native(winner),
                        rank: Math.min(...group.map((copy) => copy.rank)) - 1,
                    };
                });
            },
            async get(candidate) {
                if (control.signal.aborted || snapshotRevision !== revision)
                    return undefined;
                return snapshot.find((copy) => copy.path === candidate.path);
            },
        };
    });
    let operations = Promise.resolve();
    let closing = false;
    ctx.effect(() => () => {
        closing = true;
        return operations;
    }, 'majed-skills pending state writes');
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
                    let payload = '';
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
                                payload += decoder.decode(part.value, { stream: true });
                            }
                            payload += decoder.decode();
                        }
                        finally {
                            reader.releaseLock();
                        }
                    }
                    const body = JSON.parse(payload);
                    if (!body ||
                        typeof body !== 'object' ||
                        Array.isArray(body) ||
                        !['list', 'detail', 'toggle', 'ping', 'reload'].includes(body.action ?? 'list'))
                        return new Response('Invalid skill action', { status: 400 });
                    // Presence probe: proves the route exists without scanning any source.
                    if (body.action === 'ping')
                        return Response.json({ ok: true });
                    if (body.action === 'reload') {
                        // Retry path for a corrupt state file: re-read it once the user fixed it.
                        if (request.headers.get('x-majed-skills') !== '1')
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
                    if (body.action === 'detail') {
                        if (request.headers.get('x-majed-skills') !== '1')
                            return new Response('Mutation marker required', {
                                status: 403,
                            });
                        const { copies } = await catalog();
                        const copy = copies.find((copy) => copy.path === body.id);
                        if (!copy)
                            return new Response('Unknown skill', { status: 404 });
                        const { content: _content, original, ...rest } = copy;
                        return Response.json({ ...rest, content: original ?? '' });
                    }
                    if (body.action === 'toggle') {
                        if (request.headers.get('x-majed-skills') !== '1')
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
                            const { copies } = await catalog();
                            const valid = body.kind === 'source'
                                ? sources.some((x) => x.id === body.id)
                                : body.kind === 'copy' &&
                                    copies.some((x) => x.path === body.id);
                            if (!valid)
                                return new Response('Unknown skill target', {
                                    status: 400,
                                });
                            const next = {
                                sources: { ...state.sources },
                                copies: { ...state.copies },
                            };
                            (body.kind === 'source' ? next.sources : next.copies)[body.id] = body.enabled;
                            await mkdir(dirname(statePath), { recursive: true });
                            const temporary = `${statePath}.${process.pid}.${randomUUID()}.tmp`;
                            try {
                                await writeFile(temporary, JSON.stringify(next), {
                                    mode: 0o600,
                                });
                                await rename(temporary, statePath);
                            }
                            finally {
                                await rm(temporary, { force: true });
                            }
                            state = next;
                            revision++;
                            for (const control of controls)
                                control.invalidate();
                            return undefined;
                        });
                        operations = mutation.catch(() => undefined);
                        const error = await mutation;
                        if (error)
                            return error;
                    }
                    const { copies, diagnostics } = await catalog();
                    return Response.json({
                        sources: sources.map((source) => ({
                            ...source,
                            enabled: !corrupt &&
                                (state.sources[source.id] ?? source.enabled ?? true),
                        })),
                        copies: copies.map(({ content: _content, original: _original, ...summary }) => summary),
                        corrupt,
                        diagnostics,
                    });
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
