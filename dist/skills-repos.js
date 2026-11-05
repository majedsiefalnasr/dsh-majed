// Repository subscription and tracked-install workflow adapted from dsh-skills-manager 1.2.29 (Apache-2.0); see PROVENANCE.md.
import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { lstat, mkdir, open, readdir, readFile, realpath, rename, rm, stat, writeFile, } from 'node:fs/promises';
import { isIP } from 'node:net';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';
import { Unzip, UnzipInflate } from 'fflate';
import { parseDocument } from 'yaml';
import { publishImports } from './skills-import.js';
import { checkedTrashPath, trashEntry } from './skills-trash.js';
export class RepoError extends Error {
    code;
    status;
    constructor(code, status = 400) {
        super(code);
        this.code = code;
        this.status = status;
    }
}
const STATUS = {
    'repo-duplicate': 409,
    'repo-busy': 409,
    'repo-state-invalid': 409,
    'repo-stale': 409,
    'repo-conflict': 409,
    'repo-cancelled': 409,
    'repo-trashed': 409,
    'repo-missing': 409,
    'repo-snapshot-changed': 409,
    'repo-not-found': 404,
    'repo-skill-missing': 404,
    'repo-not-installed': 404,
    'repo-timeout': 504,
    'create-readonly': 403,
    'repo-invalid-root': 409,
    'repo-root-valid': 409,
};
const fail = (code) => new RepoError(code, STATUS[code] ?? 400);
const DEFAULTS = {
    timeoutMs: 300_000,
    maxArchiveBytes: 32 * 1024 * 1024,
    maxEntries: 5000,
    maxTotalBytes: 64 * 1024 * 1024,
    maxRepositories: 30,
    maxInstalls: 300,
    maxStateBytes: 16 * 1024 * 1024,
};
// Fixed maxima that persisted state is validated against. Config values are WRITE-TIME caps only and are
// clamped to these, so lowering a limit between restarts never makes previously saved state unreadable.
const HARD = {
    entries: 5000,
    repositories: 200,
    installs: 2000,
    stateBytes: 64 * 1024 * 1024,
};
const MAX_DEPTH = 12;
const MAX_FILE = 32 * 1024 * 1024;
const MAX_SKILLS = 500;
const SKILL_DOC_MAX = 256 * 1024;
const SKILL_FILE_MAX = 1024 * 1024;
const SKILL_TOTAL_MAX = 8 * 1024 * 1024;
const SKILL_ENTRY_MAX = 512;
const MAX_URL = 2048;
// Files sit at most MAX_DEPTH + 1 levels deep (the ingest walk's depth), each part at most 255 units.
const MAX_RELATIVE = (MAX_DEPTH + 2) * 256;
const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const sha256 = (data) => createHash('sha256').update(data).digest('hex');
// ---------------------------------------------------------------- input parsing
const RESERVED = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i;
function safeSubdirectory(value) {
    if (value === undefined || value === null || value === '')
        return '';
    if (typeof value !== 'string' || value.length > 512)
        throw fail('repo-subdirectory');
    const parts = value.split('/');
    if (parts.length > 64 ||
        parts.some((part) => !part ||
            part === '.' ||
            part === '..' ||
            part.length > 200 ||
            /[\\:<>"|?*\u0000-\u001f]/.test(part) ||
            /[. ]$/.test(part) ||
            RESERVED.test(part)))
        throw fail('repo-subdirectory');
    return value;
}
function safeRef(value) {
    if (value === undefined || value === null || value === '')
        return '';
    if (typeof value !== 'string' ||
        value.length > 200 ||
        !/^[A-Za-z0-9_./-]+$/.test(value) ||
        value.startsWith('-') ||
        value.includes('..') ||
        value.startsWith('/') ||
        value.endsWith('/') ||
        value.includes('//'))
        throw fail('repo-ref');
    return value === 'HEAD' ? '' : value;
}
const OWNER = /^[a-z0-9][a-z0-9-]{0,38}$/i;
const REPO_NAME = /^[a-z0-9_.-]{1,100}$/i;
function github(owner, name) {
    const repo = name.replace(/\.git$/i, '');
    if (!OWNER.test(owner) || !REPO_NAME.test(repo) || /^\.+$/.test(repo))
        throw fail('repo-url');
    return { owner: owner.toLowerCase(), name: repo.toLowerCase() };
}
/** Parses one user-supplied repository description; every rejection is `repo-url|repo-ref|repo-subdirectory`. */
export function parseSource(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input))
        throw fail('repo-url');
    const body = input;
    if (typeof body.url !== 'string')
        throw fail('repo-url');
    const raw = body.url.trim();
    if (!raw || raw.length > MAX_URL || /[\u0000-\u001f\u007f]/.test(raw))
        throw fail('repo-url');
    let source;
    let markerRef = '';
    let markerSub = '';
    if (isAbsolute(raw)) {
        source = {
            kind: 'local',
            url: resolve(raw),
            ref: '',
            subdirectory: '',
        };
    }
    else {
        if (/[%?#\s\\]/.test(raw) || raw.startsWith('-') || raw.includes('@'))
            throw fail('repo-url');
        const short = /^([^/:]+)\/([^/:]+)$/.exec(raw);
        if (short) {
            source = {
                kind: 'github',
                ...github(short[1], short[2]),
                ref: '',
                subdirectory: '',
            };
        }
        else {
            let url;
            try {
                url = new URL(raw);
            }
            catch {
                throw fail('repo-url');
            }
            const host = url.hostname.toLowerCase();
            if ((url.protocol !== 'https:' && url.protocol !== 'http:') ||
                url.username ||
                url.password ||
                !host ||
                host.startsWith('github.com.'))
                throw fail('repo-url');
            const parts = url.pathname.split('/').filter(Boolean);
            const marker = parts.findIndex((part, index) => (part === 'tree' && index >= 2) ||
                (part === 'branch' && parts[index - 1] === 'src') ||
                (part === 'tree' && parts[index - 1] === '-'));
            let base = parts;
            if (marker >= 0) {
                const after = parts.slice(marker + 1);
                markerRef = after[0] ?? '';
                markerSub = after.slice(1).join('/');
                base = parts.slice(0, parts[marker - 1] === '-' || parts[marker - 1] === 'src'
                    ? marker - 1
                    : marker);
            }
            if (host === 'github.com' || host === 'www.github.com') {
                if (url.protocol !== 'https:' || base.length !== 2)
                    throw fail('repo-url');
                source = {
                    kind: 'github',
                    ...github(base[0], base[1]),
                    ref: '',
                    subdirectory: '',
                };
            }
            else {
                if (!base.length)
                    throw fail('repo-url');
                source = {
                    kind: 'git',
                    url: `${url.protocol}//${url.host}/${base.join('/')}`,
                    ref: '',
                    subdirectory: '',
                };
            }
        }
    }
    // Persisted values must pass validState: cap the normalized (percent-encoded) URL, not just the input.
    if (source.url !== undefined && source.url.length > MAX_URL)
        throw fail('repo-url');
    source.ref = safeRef(body.ref !== undefined && body.ref !== '' ? body.ref : markerRef);
    source.subdirectory = safeSubdirectory(body.subdirectory !== undefined && body.subdirectory !== ''
        ? body.subdirectory
        : markerSub);
    return source;
}
const identity = (source) => {
    const { kind, url, owner, name, ref, subdirectory } = source;
    return sha256(JSON.stringify({ kind, url, owner, name, ref, subdirectory })).slice(0, 24);
};
const labelOf = (source) => source.kind === 'github' ? `${source.owner}/${source.name}` : source.url;
const originOf = (source) => ({
    kind: source.kind,
    ...(source.url ? { url: source.url } : {}),
    ...(source.owner ? { owner: source.owner, name: source.name } : {}),
    ref: source.ref,
    subdirectory: source.subdirectory,
    label: labelOf(source),
});
// ---------------------------------------------------------------- host policy (SSRF)
function privateV4(a, b, c = 1) {
    return (a === 0 ||
        a === 10 ||
        a === 127 ||
        (a === 100 && b >= 64 && b <= 127) ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        (a === 192 && b === 0) ||
        (a === 198 && (b === 18 || b === 19)) ||
        (a === 198 && b === 51 && c === 100) ||
        (a === 203 && b === 0 && c === 113) ||
        a >= 224);
}
/** Expands an IPv6 literal (optionally ending in dotted IPv4) into eight 16-bit groups. */
function groupsOf(value) {
    let text = value.split('%')[0];
    const dotted = /(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(text);
    if (dotted) {
        const [a, b, c, d] = dotted.slice(1).map(Number);
        text =
            text.slice(0, dotted.index) +
                ((a << 8) | b).toString(16) +
                ':' +
                ((c << 8) | d).toString(16);
    }
    const [head, tail, extra] = text.split('::');
    if (extra !== undefined)
        return undefined;
    const left = head ? head.split(':') : [];
    const right = tail ? tail.split(':') : [];
    const fill = tail === undefined ? 0 : 8 - left.length - right.length;
    if (fill < 0 || (tail === undefined && left.length !== 8))
        return undefined;
    const all = [...left, ...Array(fill).fill('0'), ...right].map((part) => Number.parseInt(part, 16));
    return all.length === 8 && all.every((n) => n >= 0 && n <= 0xffff)
        ? all
        : undefined;
}
const v4Of = (high, low) => privateV4(high >> 8, high & 255, low >> 8);
export function privateAddress(address) {
    const value = address.replace(/^\[|\]$/g, '').toLowerCase();
    if (isIP(value) === 4) {
        const [a, b, c] = value.split('.').map(Number);
        return privateV4(a, b, c);
    }
    if (isIP(value) !== 6)
        return true;
    const g = groupsOf(value);
    if (!g)
        return true;
    const [g0, g1, g2, g3, g4, g5, g6, g7] = g;
    // ::/96 (unspecified, loopback and IPv4-compatible), ::ffff:0:0/96 (IPv4-mapped).
    if (g0 === 0 && g1 === 0 && g2 === 0 && g3 === 0 && g4 === 0) {
        if (g5 === 0)
            return true;
        if (g5 === 0xffff)
            return v4Of(g6, g7);
    }
    // ::ffff:0:0:0/96 SIIT (RFC 2765) translates an embedded IPv4 address.
    if (g0 === 0 && g1 === 0 && g2 === 0 && g3 === 0 && g4 === 0xffff && g5 === 0)
        return v4Of(g6, g7);
    // 64:ff9b::/96 NAT64 embeds an IPv4 address; 64:ff9b:1::/48 is local-use.
    if (g0 === 0x64 && g1 === 0xff9b) {
        if (g2 === 0 && g3 === 0 && g4 === 0 && g5 === 0)
            return v4Of(g6, g7);
        return true;
    }
    // 2002::/16 6to4 embeds an IPv4 address in the next 32 bits.
    if (g0 === 0x2002)
        return true;
    // 2001::/32 Teredo, 2001:db8::/32 documentation.
    if (g0 === 0x2001 && (g1 === 0 || g1 === 0xdb8))
        return true;
    return ((g0 & 0xfe00) === 0xfc00 || // fc00::/7 unique local
        (g0 & 0xffc0) === 0xfe80 || // fe80::/10 link local
        (g0 & 0xffc0) === 0xfec0 || // fec0::/10 site local (deprecated)
        (g0 & 0xff00) === 0xff00 // ff00::/8 multicast
    );
}
/** Preflight only: the name is resolved again by Git, but redirects are never followed. */
async function assertPublicHost(url) {
    const host = new URL(url).hostname.toLowerCase();
    const literal = host.replace(/^\[|\]$/g, '');
    if (host === 'localhost' ||
        host.endsWith('.localhost') ||
        host.endsWith('.local') ||
        host.endsWith('.internal'))
        throw fail('repo-host');
    if (isIP(literal)) {
        if (privateAddress(literal))
            throw fail('repo-host');
        return;
    }
    let addresses;
    try {
        addresses = await lookup(host, { all: true });
    }
    catch {
        throw fail('repo-network');
    }
    if (!addresses.length ||
        addresses.some((item) => privateAddress(item.address)))
        throw fail('repo-host');
}
// ---------------------------------------------------------------- cancellable run
class Run {
    controller = new AbortController();
    reason;
    timer;
    off = [];
    constructor(timeoutMs, ...signals) {
        this.timer = setTimeout(() => this.abort('repo-timeout'), timeoutMs);
        for (const signal of signals) {
            if (!signal)
                continue;
            if (signal.aborted)
                this.abort('repo-cancelled');
            const listener = () => this.abort('repo-cancelled');
            signal.addEventListener('abort', listener, { once: true });
            this.off.push(() => signal.removeEventListener('abort', listener));
        }
    }
    get signal() {
        return this.controller.signal;
    }
    abort(reason) {
        this.reason ??= reason;
        this.controller.abort();
    }
    check() {
        if (this.signal.aborted)
            throw fail(this.reason ?? 'repo-cancelled');
    }
    done() {
        clearTimeout(this.timer);
        for (const off of this.off)
            off();
    }
}
async function treeBytes(path, limit) {
    let total = 0;
    const stack = [path];
    while (stack.length) {
        const current = stack.pop();
        let items;
        try {
            items = await readdir(current, { withFileTypes: true });
        }
        catch {
            continue;
        }
        for (const item of items) {
            const child = join(current, item.name);
            if (item.isDirectory())
                stack.push(child);
            else if (item.isFile())
                total += await lstat(child).then((info) => info.size, () => 0);
            if (total > limit)
                return total;
        }
    }
    return total;
}
/** Hashes and copies every regular file under `tree`; links and special files are skipped. */
async function ingest(tree, destination, skip, limits, run) {
    const entries = [];
    let count = 0;
    let total = 0;
    await mkdir(destination, { recursive: true });
    const walk = async (directory, relative, depth) => {
        run.check();
        if (depth > MAX_DEPTH)
            throw fail('repo-limit');
        const items = (await readdir(directory, { withFileTypes: true })).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
        for (const item of items) {
            if (item.name === '.git')
                continue;
            const path = relative ? `${relative}/${item.name}` : item.name;
            if (!item.isDirectory() && !item.isFile())
                continue;
            if (skip.has(path))
                continue;
            if (/[\\:\u0000-\u001f]/.test(item.name))
                continue;
            if (++count > limits.entries)
                throw fail('repo-limit');
            const full = join(directory, item.name);
            if (item.isDirectory()) {
                await walk(full, path, depth + 1);
                continue;
            }
            const info = await lstat(full);
            if (!info.isFile())
                continue;
            total += info.size;
            if (info.size > MAX_FILE || total > limits.total)
                throw fail('repo-limit');
            const bytes = await readFile(full);
            await mkdir(dirname(join(destination, path)), { recursive: true });
            await writeFile(join(destination, path), bytes, {
                flag: 'wx',
                mode: 0o600,
            });
            entries.push({ path, hash: sha256(bytes), size: bytes.length });
        }
    };
    await walk(tree, '', 0);
    return entries;
}
/** Resolves `base/subdirectory` refusing any link on the way. */
async function subtree(base, subdirectory) {
    let current = base;
    for (const part of subdirectory ? subdirectory.split('/') : []) {
        current = join(current, part);
        const info = await lstat(current).catch(() => undefined);
        if (!info || !info.isDirectory() || info.isSymbolicLink())
            throw fail('repo-subdirectory');
    }
    return current;
}
const treeHashOf = (files) => sha256([...files]
    .sort((a, b) => (a.path < b.path ? -1 : 1))
    .map((file) => `${file.path}\0${file.hash}\n`)
    .join(''));
// ---------------------------------------------------------------- skill scanning
function frontMatter(bytes) {
    let text;
    try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    }
    catch {
        return undefined;
    }
    const front = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
    if (!front)
        return undefined;
    const parsed = parseDocument(front[1]);
    if (parsed.errors.length)
        return undefined;
    const data = parsed.toJS({ maxAliasCount: 50 });
    if (!data ||
        typeof data.name !== 'string' ||
        typeof data.description !== 'string' ||
        !data.description.trim())
        return undefined;
    return { name: data.name.trim(), description: data.description.trim() };
}
async function scanSkills(manifest, directory) {
    const roots = manifest
        .filter((entry) => basename(entry.path) === 'SKILL.md')
        .map((entry) => (entry.path === 'SKILL.md' ? '.' : dirname(entry.path)));
    if (roots.length > MAX_SKILLS)
        throw fail('repo-limit');
    const skills = [];
    for (const root of roots) {
        const prefix = root === '.' ? '' : `${root}/`;
        const files = manifest
            .filter((entry) => entry.path.startsWith(prefix))
            .map((entry) => ({ ...entry, path: entry.path.slice(prefix.length) }));
        const record = {
            path: root,
            name: root === '.' ? 'root' : basename(root),
            description: '',
            valid: false,
            files: files.length,
            treeHash: treeHashOf(files),
        };
        const document = files.find((file) => file.path === 'SKILL.md');
        if (files.length > SKILL_ENTRY_MAX ||
            files.some((file) => file.size > SKILL_FILE_MAX || file.path.split('/').length > MAX_DEPTH) ||
            files.reduce((sum, file) => sum + file.size, 0) > SKILL_TOTAL_MAX ||
            document.size > SKILL_DOC_MAX)
            record.code = 'repo-skill-limit';
        else {
            const meta = frontMatter(await readFile(join(directory, prefix, 'SKILL.md')));
            if (!meta || !SKILL_NAME.test(meta.name) || meta.name.length > 100)
                record.code = 'repo-skill-metadata';
            else {
                record.name = meta.name;
                record.description = meta.description.slice(0, 1000);
                record.valid = true;
            }
        }
        skills.push(record);
    }
    skills.sort((a, b) => a.name !== b.name ? (a.name < b.name ? -1 : 1) : a.path < b.path ? -1 : 1);
    return skills;
}
// ---------------------------------------------------------------- Git
const GIT_OPTIONS = [
    '-c',
    'protocol.allow=never',
    '-c',
    'protocol.http.allow=always',
    '-c',
    'protocol.https.allow=always',
    '-c',
    'protocol.file.allow=always',
    '-c',
    'protocol.ext.allow=never',
    '-c',
    'http.followRedirects=false',
    '-c',
    'core.symlinks=false',
    '-c',
    'core.autocrlf=false',
    '-c',
    'core.hooksPath=/dev/null',
    '-c',
    'core.fsmonitor=false',
    '-c',
    'credential.helper=',
    '-c',
    'submodule.recurse=false',
    '--literal-pathspecs',
];
function classify(stderr) {
    const text = stderr.toLowerCase();
    if (/couldn't find remote ref|invalid refspec|not our ref|no such remote ref|did not match/.test(text))
        return 'repo-notfound';
    if (/repository not found|does not appear to be a git repository|not a git repository|returned error: 404/.test(text))
        return 'repo-notfound';
    if (/could not read username|authentication failed|terminal prompts disabled|returned error: 40[13]/.test(text))
        return 'repo-auth';
    if (/redirect|unable to access|could not resolve host|failed to connect|connection (refused|reset|timed out)|ssl|returned error: [345]\d\d/.test(text))
        return 'repo-network';
    return 'repo-git';
}
function runGit(executable, args, cwd, home, run, maxOutput = 8 * 1024 * 1024) {
    return new Promise((resolvePromise, reject) => {
        run.check();
        // Argv only, never a shell: user-controlled values stay one argument after `--`.
        const child = spawn(executable, [...GIT_OPTIONS, ...args], {
            cwd,
            env: {
                PATH: process.env.PATH ?? '/usr/bin:/bin',
                HOME: home,
                GIT_TERMINAL_PROMPT: '0',
                GIT_CONFIG_NOSYSTEM: '1',
                GIT_CONFIG_GLOBAL: '/dev/null',
                GIT_ASKPASS: '',
                LC_ALL: 'C',
            },
            stdio: ['ignore', 'pipe', 'pipe'],
            detached: true,
        });
        const out = [];
        let size = 0;
        let errText = '';
        const kill = () => {
            try {
                if (child.pid)
                    process.kill(-child.pid, 'SIGKILL');
            }
            catch {
                child.kill('SIGKILL');
            }
        };
        const onAbort = () => kill();
        run.signal.addEventListener('abort', onAbort, { once: true });
        child.stdout.on('data', (chunk) => {
            size += chunk.length;
            if (size > maxOutput) {
                run.abort('repo-limit');
                kill();
                return;
            }
            out.push(chunk);
        });
        child.stderr.on('data', (chunk) => {
            errText = (errText + chunk.toString('utf8')).slice(-8192);
        });
        child.on('error', (error) => {
            run.signal.removeEventListener('abort', onAbort);
            reject(fail(error.code === 'ENOENT' ? 'repo-git-missing' : 'repo-git'));
        });
        child.on('close', (code) => {
            run.signal.removeEventListener('abort', onAbort);
            if (run.signal.aborted)
                return reject(fail(run.reason ?? 'repo-cancelled'));
            if (code === 0)
                return resolvePromise(Buffer.concat(out).toString('utf8'));
            reject(fail(classify(errText)));
        });
    });
}
async function acquireGit(config, source, work, out, run) {
    const repo = join(work, 'repo');
    const home = join(work, 'home');
    await mkdir(repo, { recursive: true });
    await mkdir(home, { recursive: true });
    const git = config.git ?? 'git';
    const step = (args, max) => runGit(git, args, repo, home, run, max);
    // Transient disk guard: Git history objects count while the fetch runs.
    const cap = config.maxTotalBytes * 4;
    let measuring = false;
    const guard = setInterval(() => {
        if (measuring)
            return;
        measuring = true;
        void treeBytes(repo, cap)
            .then((bytes) => {
            if (bytes > cap)
                run.abort('repo-limit');
        })
            .finally(() => {
            measuring = false;
        });
    }, 400);
    try {
        await step(['init', '-q']);
        const refs = source.ref
            ? [`refs/heads/${source.ref}`, `refs/tags/${source.ref}`, source.ref]
            : ['HEAD'];
        let fetched = false;
        for (const [index, ref] of refs.entries()) {
            try {
                await step([
                    'fetch',
                    '-q',
                    '--depth',
                    '1',
                    '--no-tags',
                    '--no-recurse-submodules',
                    '--',
                    source.url,
                    ref,
                ]);
                fetched = true;
                break;
            }
            catch (error) {
                if (!(error instanceof RepoError) ||
                    error.code !== 'repo-notfound' ||
                    index === refs.length - 1)
                    throw error;
            }
        }
        if (!fetched)
            throw fail('repo-notfound');
        const commit = (await step(['rev-parse', 'FETCH_HEAD^{commit}'])).trim();
        if (!/^[0-9a-f]{40}([0-9a-f]{24})?$/.test(commit))
            throw fail('repo-git');
        const listing = (await step([
            'ls-tree',
            '-r',
            '-l',
            '-z',
            'FETCH_HEAD',
            ...(source.subdirectory ? ['--', source.subdirectory] : []),
        ]))
            .split('\0')
            .filter(Boolean);
        if (!listing.length)
            throw fail('repo-subdirectory');
        const skip = new Set();
        let total = 0;
        const prefix = source.subdirectory ? `${source.subdirectory}/` : '';
        if (listing.length > config.maxEntries * 4)
            throw fail('repo-limit');
        for (const line of listing) {
            const match = /^(\d{6}) (\w+) [0-9a-f]+\s+(-|\d+)\t([\s\S]*)$/.exec(line);
            if (!match)
                throw fail('repo-git');
            total += match[3] === '-' ? 0 : Number(match[3]);
            // Symlinks and submodules are never content: Git writes links as plain files here.
            if (match[1] === '120000' || match[1] === '160000')
                skip.add(match[4].startsWith(prefix)
                    ? match[4].slice(prefix.length)
                    : match[4]);
        }
        if (total > config.maxTotalBytes * 2)
            throw fail('repo-limit');
        await step([
            'checkout',
            '-q',
            'FETCH_HEAD',
            ...(source.subdirectory ? ['--', source.subdirectory] : []),
        ]);
        const tree = await subtree(repo, source.subdirectory);
        const entries = await ingest(tree, out, skip, {
            entries: config.maxEntries,
            total: config.maxTotalBytes,
        }, run);
        return { fingerprint: commit, entries };
    }
    finally {
        clearInterval(guard);
    }
}
// ---------------------------------------------------------------- GitHub archive
async function readCapped(response, limit, run) {
    const declared = Number(response.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > limit)
        throw fail('repo-limit');
    const reader = response.body?.getReader();
    if (!reader)
        throw fail('repo-archive');
    const chunks = [];
    let length = 0;
    try {
        while (true) {
            run.check();
            const part = await reader.read();
            if (part.done)
                break;
            length += part.value.byteLength;
            if (length > limit) {
                await reader.cancel().catch(() => undefined);
                throw fail('repo-limit');
            }
            chunks.push(part.value);
        }
    }
    finally {
        reader.releaseLock();
    }
    return Buffer.concat(chunks);
}
function extractArchive(bytes, limits) {
    const files = [];
    const seen = new Set();
    let count = 0;
    let total = 0;
    let root;
    let failure;
    const unzip = new Unzip((file) => {
        if (++count > limits.entries)
            throw fail('repo-limit');
        const directory = file.name.endsWith('/');
        const parts = (directory ? file.name.slice(0, -1) : file.name).split('/');
        if (parts.length < (directory ? 1 : 2) ||
            parts.length > MAX_DEPTH + 2 ||
            parts.some((part) => !part ||
                part === '.' ||
                part === '..' ||
                part.length > 200 ||
                /[\\:\u0000-\u001f]/.test(part)))
            throw fail('repo-archive');
        root ??= parts[0];
        if (parts[0] !== root)
            throw fail('repo-archive');
        if (directory)
            return;
        const path = parts.slice(1).join('/');
        if (seen.has(path.toLowerCase()))
            throw fail('repo-archive');
        seen.add(path.toLowerCase());
        if (file.originalSize !== undefined && file.originalSize > MAX_FILE)
            throw fail('repo-limit');
        const chunks = [];
        let size = 0;
        file.ondata = (error, chunk, final) => {
            // fflate re-delivers anything thrown here as an archive error, so only record the outcome.
            if (failure)
                return;
            if (error) {
                failure = fail('repo-archive');
                return;
            }
            size += chunk.length;
            total += chunk.length;
            if (size > MAX_FILE || total > limits.total) {
                failure = fail('repo-limit');
                file.terminate();
                return;
            }
            chunks.push(chunk);
            if (final)
                files.push({ path, data: Buffer.concat(chunks) });
        };
        file.start();
    });
    unzip.register(UnzipInflate);
    // Small slices bound the work done between limit checks: one slice inflates to at most ~1 MiB.
    try {
        for (let offset = 0; offset < bytes.length && !failure; offset += 1024)
            unzip.push(bytes.subarray(offset, offset + 1024), offset + 1024 >= bytes.length);
    }
    catch (error) {
        throw (failure ?? (error instanceof RepoError ? error : fail('repo-archive')));
    }
    if (failure)
        throw failure;
    if (!files.length)
        throw fail('repo-archive');
    return files;
}
async function acquireArchive(config, source, work, out, run) {
    const base = (config.githubArchiveBase ?? 'https://codeload.github.com').replace(/\/$/, '');
    const refs = source.ref
        ? [`refs/heads/${source.ref}`, `refs/tags/${source.ref}`, source.ref]
        : ['HEAD'];
    let bytes;
    for (const ref of refs) {
        let response;
        try {
            response = await fetch(`${base}/${source.owner}/${source.name}/zip/${ref}`, {
                redirect: 'error',
                signal: run.signal,
                headers: { accept: 'application/zip' },
            });
        }
        catch {
            run.check();
            throw fail('repo-network');
        }
        if (response.status === 404) {
            await response.body?.cancel().catch(() => undefined);
            continue;
        }
        if (!response.ok) {
            await response.body?.cancel().catch(() => undefined);
            throw fail('repo-network');
        }
        try {
            bytes = await readCapped(response, config.maxArchiveBytes, run);
        }
        catch (error) {
            run.check();
            throw error instanceof RepoError ? error : fail('repo-network');
        }
        break;
    }
    if (!bytes)
        throw fail('repo-notfound');
    const files = extractArchive(bytes, {
        entries: config.maxEntries,
        total: config.maxTotalBytes,
    });
    const tree = join(work, 'tree');
    for (const file of files) {
        run.check();
        await mkdir(dirname(join(tree, file.path)), { recursive: true });
        // ZIP link metadata is neutralized: payload bytes become ordinary files.
        await writeFile(join(tree, file.path), file.data, {
            flag: 'wx',
            mode: 0o600,
        });
    }
    const entries = await ingest(await subtree(tree, source.subdirectory), out, new Set(), {
        entries: config.maxEntries,
        total: config.maxTotalBytes,
    }, run);
    return { fingerprint: sha256(bytes), entries };
}
// ---------------------------------------------------------------- local folders
async function isGitFolder(path) {
    if (await lstat(join(path, '.git')).then(() => true, () => false))
        return true;
    return ((await lstat(join(path, 'HEAD')).then((i) => i.isFile(), () => false)) &&
        (await lstat(join(path, 'objects')).then((i) => i.isDirectory(), () => false)));
}
async function acquireFolder(config, source, out, run) {
    const base = await realpath(source.url).catch(() => undefined);
    const info = base ? await stat(base).catch(() => undefined) : undefined;
    if (!base || !info?.isDirectory())
        throw fail('repo-local');
    const entries = await ingest(await subtree(base, source.subdirectory), out, new Set(), {
        entries: config.maxEntries,
        total: config.maxTotalBytes,
    }, run);
    return { fingerprint: treeHashOf(entries), entries };
}
// ---------------------------------------------------------------- state
const emptyState = () => ({
    version: 1,
    repositories: [],
    installs: [],
});
const HEX = (length) => new RegExp(`^[0-9a-f]{${length}}$`);
const KIND_OF_FINGERPRINT = {
    'git-commit': /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/,
    'archive-sha256': HEX(64),
    'folder-sha256': HEX(64),
};
const KIND_OF_SOURCE = {
    git: ['git-commit'],
    github: ['archive-sha256'],
    local: ['folder-sha256'],
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const DESTINATIONS = ['user-dsh', 'user-agents'];
/** Relative, traversal-free, forward-slash path (a skill folder or file inside a snapshot). */
function relativePath(value, allowDot = false) {
    if (typeof value !== 'string' || value.length > MAX_RELATIVE)
        return false;
    if (allowDot && value === '.')
        return true;
    return (!!value &&
        value
            .split('/')
            .every((part) => !!part &&
            part !== '.' &&
            part !== '..' &&
            part.length <= 255 &&
            !/[\\\u0000-\u001f]/.test(part)));
}
/** Re-runs persisted source fields through the rules parseSource applies to user input. */
function validSource(item) {
    try {
        if (safeRef(item.ref) !== item.ref)
            return false;
        if (safeSubdirectory(item.subdirectory) !== item.subdirectory)
            return false;
        if (item.kind === 'github') {
            if (item.url !== undefined)
                return false;
            if (typeof item.owner !== 'string' || typeof item.name !== 'string')
                return false;
            // Check the stored (already normalized) values directly: github() strips a trailing `.git`, which is
            // not idempotent (`foo.git.git` is stored as `foo.git`).
            return (OWNER.test(item.owner) &&
                REPO_NAME.test(item.name) &&
                !/^\.+$/.test(item.name) &&
                item.owner === item.owner.toLowerCase() &&
                item.name === item.name.toLowerCase() &&
                item.label === `${item.owner}/${item.name}`);
        }
        if (item.owner !== undefined || item.name !== undefined)
            return false;
        const url = item.url;
        if (typeof url !== 'string' || url !== item.label)
            return false;
        if (/[\u0000-\u001f\u007f]/.test(url))
            return false;
        if (isAbsolute(url))
            return resolve(url) === url;
        if (item.kind !== 'git')
            return false;
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();
        return ((parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
            !parsed.username &&
            !parsed.password &&
            !parsed.search &&
            !parsed.hash &&
            !!host &&
            host !== 'github.com' &&
            host !== 'www.github.com' &&
            !host.startsWith('github.com.') &&
            parsed.pathname.length > 1 &&
            !parsed.pathname.endsWith('/') &&
            url === `${parsed.protocol}//${parsed.host}${parsed.pathname}`);
    }
    catch {
        return false;
    }
}
/** Deep shape check: persisted state is untrusted input to later filesystem operations. */
function validState(value) {
    const state = value;
    const text = (item, max = 4096) => typeof item === 'string' && item.length <= max;
    const optional = (item, max = 4096) => item === undefined || text(item, max);
    const object = (item) => !!item && typeof item === 'object' && !Array.isArray(item);
    const fingerprint = (kind, item) => typeof kind === 'string' &&
        typeof item === 'string' &&
        !!KIND_OF_FINGERPRINT[kind]?.test(item);
    const origin = (item) => object(item) &&
        ['git', 'github', 'local'].includes(item.kind) &&
        optional(item.url, MAX_URL) &&
        optional(item.owner, 100) &&
        optional(item.name, 100) &&
        text(item.ref, 200) &&
        text(item.subdirectory, 512) &&
        text(item.label, 2200) &&
        validSource(item);
    const skill = (item) => object(item) &&
        relativePath(item.path, true) &&
        text(item.name, 256) &&
        // Only a valid skill's name is ever used as a folder name.
        (item.valid !== true ||
            (SKILL_NAME.test(item.name) && item.name.length <= 100)) &&
        text(item.description, 1000) &&
        typeof item.valid === 'boolean' &&
        optional(item.code, 64) &&
        Number.isInteger(item.files) &&
        item.files >= 0 &&
        item.files <= HARD.entries &&
        HEX(64).test(item.treeHash);
    return (object(state) &&
        state.version === 1 &&
        Array.isArray(state.repositories) &&
        Array.isArray(state.installs) &&
        state.repositories.length <= HARD.repositories &&
        state.installs.length <= HARD.installs &&
        state.repositories.every((repo) => object(repo) &&
            HEX(24).test(repo.id) &&
            origin(repo) &&
            text(repo.label, 2200) &&
            KIND_OF_SOURCE[repo.kind]?.includes(repo.fingerprintKind) &&
            fingerprint(repo.fingerprintKind, repo.fingerprint) &&
            text(repo.refreshedAt, 64) &&
            (repo.error === undefined ||
                (object(repo.error) &&
                    text(repo.error.code, 64) &&
                    text(repo.error.at, 64))) &&
            Array.isArray(repo.skills) &&
            repo.skills.length <= MAX_SKILLS &&
            repo.skills.every(skill)) &&
        state.installs.every((item) => object(item) &&
            UUID.test(item.id) &&
            (item.repoId === undefined || HEX(24).test(item.repoId)) &&
            origin(item.origin) &&
            relativePath(item.skillPath, true) &&
            typeof item.name === 'string' &&
            SKILL_NAME.test(item.name) &&
            item.name.length <= 100 &&
            DESTINATIONS.includes(item.source) &&
            text(item.root) &&
            isAbsolute(item.root) &&
            // A root that no longer matches the configured destination is reported as `invalid-root`, not fatal.
            item.scope === 'user' &&
            KIND_OF_FINGERPRINT[item.fingerprintKind] !== undefined &&
            fingerprint(item.fingerprintKind, item.fingerprint) &&
            text(item.installedAt, 64) &&
            (item.trashId === undefined || UUID.test(item.trashId)) &&
            Array.isArray(item.files) &&
            item.files.length <= SKILL_ENTRY_MAX &&
            item.files.every((file) => object(file) && relativePath(file.path) && HEX(64).test(file.hash))));
}
export function createRepositories(options) {
    const config = { ...DEFAULTS, ...options.config };
    config.maxEntries = Math.min(config.maxEntries, HARD.entries);
    config.maxRepositories = Math.min(config.maxRepositories, HARD.repositories);
    config.maxInstalls = Math.min(config.maxInstalls, HARD.installs);
    config.maxStateBytes = Math.min(config.maxStateBytes, HARD.stateBytes);
    const file = join(options.stateDir, 'repositories.json');
    const snapshots = join(options.stateDir, 'repository-snapshots');
    const lifetime = new AbortController();
    const refreshing = new Set();
    let state = emptyState();
    let invalid = false;
    let loaded = '';
    const sync = async () => {
        const info = await stat(file).catch(() => undefined);
        const stamp = info ? `${info.mtimeMs}:${info.size}` : 'none';
        if (stamp === loaded)
            return;
        loaded = stamp;
        if (!info) {
            state = emptyState();
            invalid = false;
            return;
        }
        try {
            if (info.size > HARD.stateBytes)
                throw new Error('large');
            const parsed = JSON.parse(await readFile(file, 'utf8'));
            if (!validState(parsed))
                throw new Error('shape');
            state = parsed;
            invalid = false;
        }
        catch {
            state = emptyState();
            invalid = true;
        }
    };
    const ready = async () => {
        await sync();
        if (invalid)
            throw fail('repo-state-invalid');
    };
    // `shrinking` writes (uninstall, unsubscribe, forget, Trash notes) may exceed a since-lowered write cap
    // up to the fixed ceiling; only growth operations are held to the configured cap.
    const persist = async (next, shrinking = false) => {
        await mkdir(options.stateDir, { recursive: true });
        const serialized = JSON.stringify(next);
        // Refuse here, before touching the file: sync() would otherwise reject the whole state.
        if (Buffer.byteLength(serialized) >
            (shrinking ? HARD.stateBytes : config.maxStateBytes))
            throw fail('repo-limit');
        const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
        try {
            await writeFile(temporary, serialized, {
                flag: 'wx',
                mode: 0o600,
            });
            await rename(temporary, file);
        }
        catch {
            await rm(temporary, { force: true });
            throw fail('repo-state-write');
        }
        state = next;
        const info = await stat(file);
        loaded = `${info.mtimeMs}:${info.size}`;
    };
    const snapshotDir = (repo) => {
        const directory = join(snapshots, `${repo.id}-${repo.fingerprint.slice(0, 16)}`);
        if (dirname(directory) !== snapshots)
            throw fail('repo-state-invalid');
        return directory;
    };
    const clone = () => structuredClone(state);
    // Network/Git phase: outside the mutation queue so a slow repository never blocks other work.
    const acquire = async (source, signal) => {
        const run = new Run(config.timeoutMs, signal, lifetime.signal);
        await mkdir(snapshots, { recursive: true });
        const work = join(snapshots, `.work-${randomUUID()}`);
        const out = join(work, 'out');
        try {
            run.check();
            let fingerprintKind;
            let result;
            await mkdir(work);
            if (source.kind === 'github') {
                fingerprintKind = 'archive-sha256';
                result = await acquireArchive(config, source, work, out, run);
            }
            else if (source.kind === 'git') {
                fingerprintKind = 'git-commit';
                if (!source.url.startsWith('/') && !config.allowPrivateHosts)
                    await assertPublicHost(source.url);
                if (source.url.startsWith('/')) {
                    const base = await realpath(source.url).catch(() => undefined);
                    if (!base || !(await isGitFolder(base)))
                        throw fail('repo-local');
                    source = { ...source, url: source.url };
                }
                result = await acquireGit(config, source, work, out, run);
            }
            else {
                fingerprintKind = 'folder-sha256';
                result = await acquireFolder(config, source, out, run);
            }
            run.check();
            const skills = await scanSkills(result.entries, out);
            return {
                work,
                out,
                skills,
                fingerprintKind,
                fingerprint: result.fingerprint,
            };
        }
        catch (error) {
            await rm(work, { recursive: true, force: true });
            if (run.signal.aborted &&
                !(error instanceof RepoError && error.code === 'repo-limit'))
                throw fail(run.reason ?? 'repo-cancelled');
            throw error instanceof RepoError ? error : fail('repo-failed');
        }
        finally {
            run.done();
        }
    };
    /** Swaps the new snapshot in; callers hold the mutation queue. */
    const publishSnapshot = async (repo, acquired) => {
        const final = snapshotDir(repo);
        await rm(final, { recursive: true, force: true });
        await rename(acquired.out, final);
        await rm(acquired.work, { recursive: true, force: true });
    };
    const discard = (acquired) => rm(acquired.work, { recursive: true, force: true });
    const diskStatus = async (record) => {
        const target = join(record.root, record.name);
        const info = await lstat(target).catch(() => undefined);
        if (!info)
            return 'missing';
        if (!info.isDirectory())
            return 'modified';
        try {
            const found = new Map();
            let count = 0;
            const walk = async (directory, relative, depth) => {
                if (depth > MAX_DEPTH)
                    throw new Error('limit');
                for (const item of await readdir(directory, { withFileTypes: true })) {
                    if (++count > SKILL_ENTRY_MAX * 2)
                        throw new Error('limit');
                    const path = relative ? `${relative}/${item.name}` : item.name;
                    if (item.isDirectory())
                        await walk(join(directory, item.name), path, depth + 1);
                    else if (item.isFile()) {
                        const data = await open(join(directory, item.name), 'r');
                        try {
                            const size = (await data.stat()).size;
                            if (size > SKILL_FILE_MAX)
                                throw new Error('limit');
                            found.set(path, sha256(await data.readFile()));
                        }
                        finally {
                            await data.close();
                        }
                    }
                    else
                        throw new Error('link');
                }
            };
            await walk(target, '', 0);
            return found.size === record.files.length &&
                record.files.every((item) => found.get(item.path) === item.hash)
                ? 'installed'
                : 'modified';
        }
        catch {
            return 'modified';
        }
    };
    const view = async (expose, trashIds) => {
        await sync();
        if (!expose)
            return { repositories: [], repoInstalls: [] };
        if (invalid)
            return {
                repositories: [],
                repoInstalls: [],
                repoError: 'repo-state-invalid',
            };
        const installs = await Promise.all(state.installs.map(async (record) => ({
            ...record,
            path: join(record.root, record.name),
            status: record.trashId
                ? !trashIds || trashIds.has(record.trashId)
                    ? 'trashed'
                    : 'missing'
                : // Never read or act outside the configured destination: a moved root is only reported.
                    options.destination(record.source) &&
                        resolve(options.destination(record.source).root) === record.root
                        ? await diskStatus(record)
                        : 'invalid-root',
        })));
        const repositories = await Promise.all(state.repositories.map(async (repo) => {
            const skills = await Promise.all(repo.skills.map(async (skill) => {
                const tracked = installs.find((item) => item.repoId === repo.id &&
                    item.skillPath === skill.path &&
                    item.status !== 'trashed' &&
                    item.status !== 'invalid-root');
                let status = skill.valid ? 'available' : 'invalid';
                const conflicts = [];
                if (tracked)
                    status =
                        tracked.status === 'installed' ? 'installed' : tracked.status;
                else if (skill.valid) {
                    // Same names install refuses: `<name>` and `<name>.md` in each destination.
                    let known = 0;
                    for (const id of DESTINATIONS) {
                        const dest = options.destination(id);
                        if (!dest)
                            continue;
                        known++;
                        for (const name of [skill.name, `${skill.name}.md`])
                            if (await lstat(join(dest.root, name)).then(() => true, () => false)) {
                                conflicts.push(id);
                                break;
                            }
                    }
                    // `status` reflects the default destination; `conflicts` lists every blocked one.
                    if (known && conflicts.includes('user-dsh'))
                        status = 'conflict';
                }
                return {
                    path: skill.path,
                    name: skill.name,
                    description: skill.description,
                    valid: skill.valid,
                    ...(skill.code ? { code: skill.code } : {}),
                    files: skill.files,
                    status,
                    conflicts,
                    ...(tracked ? { installId: tracked.id } : {}),
                };
            }));
            return { ...repo, skills, refreshing: refreshing.has(repo.id) };
        }));
        return { repositories, repoInstalls: installs };
    };
    const mapTrash = (error) => error instanceof RepoError
        ? error
        : new RepoError(error instanceof Error && error.message.startsWith('trash-')
            ? error.message
            : 'trash-failed', 409);
    const api = {
        view,
        close: () => lifetime.abort(),
        async add(input, signal) {
            await ready();
            const source = parseSource(input);
            const id = identity(source);
            const exists = () => state.repositories.some((repo) => repo.id === id);
            if (exists())
                throw fail('repo-duplicate');
            if (state.repositories.length >= config.maxRepositories)
                throw fail('repo-limit');
            if (refreshing.has(id))
                throw fail('repo-busy');
            let acquired;
            refreshing.add(id);
            try {
                const detected = source.kind === 'local' &&
                    (await isGitFolder(source.url).catch(() => false))
                    ? { ...source, kind: 'git' }
                    : source;
                if (detected.kind === 'local' &&
                    !(await stat(source.url).then((i) => i.isDirectory(), () => false)))
                    throw fail('repo-local');
                // The identity stays tied to the user's input; the detected kind only selects the fetcher.
                acquired = await acquire(detected, signal);
                const finalSource = detected;
                return await options.exclusive(async () => {
                    await ready();
                    if (exists()) {
                        await discard(acquired);
                        throw fail('repo-duplicate');
                    }
                    if (state.repositories.length >= config.maxRepositories) {
                        await discard(acquired);
                        throw fail('repo-limit');
                    }
                    const record = {
                        ...finalSource,
                        id,
                        label: labelOf(finalSource),
                        fingerprint: acquired.fingerprint,
                        fingerprintKind: acquired.fingerprintKind,
                        refreshedAt: new Date().toISOString(),
                        skills: acquired.skills,
                    };
                    await publishSnapshot(record, acquired);
                    const next = clone();
                    next.repositories.push(record);
                    try {
                        await persist(next);
                    }
                    catch (error) {
                        await rm(snapshotDir(record), { recursive: true, force: true });
                        throw error;
                    }
                    return { id };
                });
            }
            finally {
                refreshing.delete(id);
            }
        },
        /** Refreshes one repository; a failure keeps the previous usable snapshot and records the error. */
        async refresh(id, signal) {
            await ready();
            const repo = state.repositories.find((item) => item.id === id);
            if (!repo)
                throw fail('repo-not-found');
            if (refreshing.has(repo.id))
                throw fail('repo-busy');
            refreshing.add(repo.id);
            try {
                let acquired;
                try {
                    acquired = await acquire(repo, signal);
                }
                catch (error) {
                    const code = error instanceof RepoError ? error.code : 'repo-failed';
                    if (code === 'repo-cancelled')
                        throw error;
                    await options.exclusive(async () => {
                        await ready();
                        const current = state.repositories.find((item) => item.id === repo.id);
                        if (!current)
                            return;
                        const next = clone();
                        next.repositories.find((item) => item.id === repo.id).error = {
                            code,
                            at: new Date().toISOString(),
                        };
                        try {
                            await persist(next);
                        }
                        catch {
                            // The error marker is advisory: at the state cap the refresh error is still reported.
                        }
                    });
                    return { id: repo.id, error: code };
                }
                return await options.exclusive(async () => {
                    await ready();
                    const current = state.repositories.find((item) => item.id === repo.id);
                    if (!current) {
                        await discard(acquired);
                        throw fail('repo-not-found');
                    }
                    const previous = snapshotDir(current);
                    const updated = {
                        ...current,
                        fingerprint: acquired.fingerprint,
                        fingerprintKind: acquired.fingerprintKind,
                        refreshedAt: new Date().toISOString(),
                        skills: acquired.skills,
                    };
                    delete updated.error;
                    await publishSnapshot(updated, acquired);
                    const next = clone();
                    next.repositories[next.repositories.findIndex((item) => item.id === repo.id)] = updated;
                    try {
                        await persist(next);
                    }
                    catch (error) {
                        // Keep the previous snapshot usable when the new one could not be recorded.
                        if (previous !== snapshotDir(updated))
                            await rm(snapshotDir(updated), { recursive: true, force: true });
                        throw error;
                    }
                    if (previous !== snapshotDir(updated))
                        await rm(previous, { recursive: true, force: true });
                    return {
                        id: repo.id,
                        fingerprint: updated.fingerprint,
                        changed: updated.fingerprint !== current.fingerprint,
                    };
                });
            }
            finally {
                refreshing.delete(repo.id);
            }
        },
        async refreshAll(signal) {
            await ready();
            const ids = state.repositories.map((repo) => repo.id);
            const result = {
                total: ids.length,
                refreshed: [],
                failed: [],
            };
            for (const id of ids) {
                if (signal?.aborted || lifetime.signal.aborted)
                    throw fail('repo-cancelled');
                try {
                    const one = await api.refresh(id, signal);
                    if ('error' in one && one.error)
                        result.failed.push({ id, code: one.error });
                    else if ('fingerprint' in one)
                        result.refreshed.push({
                            id,
                            fingerprint: one.fingerprint,
                            changed: one.changed,
                        });
                }
                catch (error) {
                    if (error instanceof RepoError && error.code === 'repo-cancelled')
                        throw error;
                    result.failed.push({
                        id,
                        code: error instanceof RepoError ? error.code : 'repo-failed',
                    });
                }
            }
            return result;
        },
        /** Unsubscribe: installed files and their provenance stay. */
        async remove(id) {
            return options.exclusive(async () => {
                await ready();
                const repo = state.repositories.find((item) => item.id === id);
                if (!repo)
                    throw fail('repo-not-found');
                const next = clone();
                next.repositories = next.repositories.filter((item) => item.id !== id);
                for (const record of next.installs)
                    if (record.repoId === id)
                        delete record.repoId;
                await persist(next, true);
                await rm(snapshotDir(repo), { recursive: true, force: true });
                return {};
            });
        },
        async install(input, cancelled) {
            return options.exclusive(async () => {
                await ready();
                const repo = state.repositories.find((item) => item.id === input.id);
                if (!repo)
                    throw fail('repo-not-found');
                const dest = options.destination(input.source);
                if (!dest)
                    throw fail('create-readonly');
                if (input.snapshot !== repo.fingerprint)
                    throw fail('repo-stale');
                const skill = repo.skills.find((item) => item.path === input.path);
                if (!skill)
                    throw fail('repo-skill-missing');
                if (!skill.valid)
                    throw fail('repo-skill-invalid');
                if (state.installs.length >= config.maxInstalls)
                    throw fail('repo-limit');
                const root = resolve(dest.root);
                for (const path of [
                    join(root, skill.name),
                    join(root, `${skill.name}.md`),
                ])
                    if (await lstat(path).then(() => true, () => false))
                        throw fail('repo-conflict');
                // Re-read the snapshot bytes and verify them against the scanned baseline.
                const base = skill.path === '.'
                    ? snapshotDir(repo)
                    : join(snapshotDir(repo), skill.path);
                const files = new Map();
                const manifest = [];
                let total = 0;
                const walk = async (directory, relative, depth) => {
                    if (depth > MAX_DEPTH)
                        throw fail('repo-snapshot-changed');
                    for (const item of await readdir(directory, {
                        withFileTypes: true,
                    })) {
                        const path = relative ? `${relative}/${item.name}` : item.name;
                        if (item.isDirectory())
                            await walk(join(directory, item.name), path, depth + 1);
                        else if (item.isFile()) {
                            const bytes = await readFile(join(directory, item.name));
                            total += bytes.length;
                            if (bytes.length > SKILL_FILE_MAX ||
                                total > SKILL_TOTAL_MAX ||
                                files.size >= SKILL_ENTRY_MAX)
                                throw fail('repo-snapshot-changed');
                            files.set(path, bytes);
                            manifest.push({ path, hash: sha256(bytes) });
                        }
                        else
                            throw fail('repo-snapshot-changed');
                    }
                };
                try {
                    await walk(base, '', 0);
                }
                catch (error) {
                    throw error instanceof RepoError
                        ? error
                        : fail('repo-snapshot-changed');
                }
                if (treeHashOf(manifest) !== skill.treeHash || !files.has('SKILL.md'))
                    throw fail('repo-snapshot-changed');
                const result = await publishImports([{ name: skill.name, source: labelOf(repo), files }], root, 'skip', false, cancelled);
                if (result.skipped.length)
                    throw fail('repo-conflict');
                if (!result.imported.length)
                    throw new RepoError(result.failed[0]?.code ?? 'repo-install-failed', 409);
                const record = {
                    id: randomUUID(),
                    repoId: repo.id,
                    origin: originOf(repo),
                    skillPath: skill.path,
                    name: skill.name,
                    source: dest.id,
                    root,
                    scope: 'user',
                    fingerprint: repo.fingerprint,
                    fingerprintKind: repo.fingerprintKind,
                    files: manifest,
                    installedAt: new Date().toISOString(),
                };
                const next = clone();
                next.installs.push(record);
                try {
                    await persist(next);
                }
                catch (error) {
                    await rm(join(root, skill.name), { recursive: true, force: true });
                    throw error;
                }
                options.changed();
                return { warnings: result.warnings };
            });
        },
        /** Moves a tracked copy to the shared Trash; provenance follows the Trash entry. */
        async uninstall(id, cancelled) {
            return options.exclusive(async () => {
                await ready();
                const record = state.installs.find((item) => item.id === id);
                if (!record)
                    throw fail('repo-not-installed');
                if (record.trashId)
                    throw fail('repo-trashed');
                const dest = options.destination(record.source);
                // The destination changed since install: never touch disk there; the record can be forgotten instead.
                if (!dest || resolve(dest.root) !== record.root)
                    throw fail('repo-invalid-root');
                const target = join(record.root, record.name);
                if (!(await lstat(target).then((i) => i.isDirectory(), () => false)))
                    throw fail('repo-missing');
                let result;
                try {
                    await checkedTrashPath(record.root, true);
                    result = await trashEntry(options.trashRoot, {
                        name: record.name,
                        source: record.source,
                        scope: 'global',
                        root: record.root,
                        origin: target,
                    }, cancelled);
                }
                catch (error) {
                    throw mapTrash(error);
                }
                const next = clone();
                next.installs.find((item) => item.id === id).trashId = result.id;
                await persist(next, true);
                options.changed();
                return result.warning
                    ? { warning: result.warning, path: result.path }
                    : {};
            });
        },
        /** Record-only removal of an `invalid-root` install: no disk access, nothing is deleted. */
        async forget(id) {
            return options.exclusive(async () => {
                await ready();
                const record = state.installs.find((item) => item.id === id);
                if (!record)
                    throw fail('repo-not-installed');
                if (record.trashId)
                    throw fail('repo-trashed');
                const dest = options.destination(record.source);
                if (dest && resolve(dest.root) === record.root)
                    throw fail('repo-root-valid');
                const next = clone();
                next.installs = next.installs.filter((item) => item.id !== id);
                await persist(next, true);
                return {};
            });
        },
        // Trash hooks run inside the caller's mutation slot; they never throw.
        async noteTrashed(root, origin, trashId) {
            if (!trashId)
                return;
            try {
                await sync();
                if (invalid)
                    return;
                const record = state.installs.find((item) => !item.trashId &&
                    item.root === root &&
                    join(item.root, item.name) === origin);
                if (!record)
                    return;
                const next = clone();
                next.installs.find((item) => item.id === record.id).trashId = trashId;
                await persist(next, true);
            }
            catch {
                /* provenance is advisory for the generic Trash button */
            }
        },
        async noteRestored(trashId) {
            try {
                await sync();
                if (invalid || !state.installs.some((item) => item.trashId === trashId))
                    return;
                const next = clone();
                delete next.installs.find((item) => item.trashId === trashId).trashId;
                await persist(next, true);
            }
            catch {
                /* see noteTrashed */
            }
        },
        async noteDeleted(trashId) {
            try {
                await sync();
                if (invalid || !state.installs.some((item) => item.trashId === trashId))
                    return;
                const next = clone();
                next.installs = next.installs.filter((item) => item.trashId !== trashId);
                await persist(next, true);
            }
            catch {
                /* see noteTrashed */
            }
        },
    };
    return api;
}
