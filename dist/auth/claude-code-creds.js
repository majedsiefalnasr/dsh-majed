/**
 * Claude Code's own login, read (and, for imported accounts only, written back on refresh) from the same store the
 * `claude` CLI uses. Ported from reference v0.9.12 src/auth/claude-code-creds.ts; see PROVENANCE.md (#132).
 *
 * Every OS call goes through a {@link ClaudeCredsIo} so tests inject fakes. The production defaults touch the real
 * macOS Keychain and `~/.claude/.credentials.json`; they run only from an explicit user import and from the refresh
 * of an account imported that way (its `keychainBound` flag).
 */
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
const PRIMARY_SERVICE = 'Claude Code-credentials';
const DEFAULT_SCOPES = 'user:profile user:inference user:sessions:claude_code user:mcp_servers';
function toSession(data) {
    // Empty-string tokens (seen from a corrupted Keychain item left by a Claude Code logout) pass the typeof gate
    // but are useless and would poison the auth store, so they are rejected here.
    if (typeof data.accessToken !== 'string' || data.accessToken.length === 0
        || typeof data.refreshToken !== 'string' || data.refreshToken.length === 0
        || typeof data.expiresAt !== 'number' || !Number.isFinite(data.expiresAt)) {
        return undefined;
    }
    const scopes = Array.isArray(data.scopes) ? data.scopes.join(' ') : typeof data.scopes === 'string' ? data.scopes : DEFAULT_SCOPES;
    return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: Math.trunc(data.expiresAt),
        scopes,
        ...typeof data.emailAddress === 'string' ? { emailAddress: data.emailAddress } : {},
        ...typeof data.subscriptionType === 'string' ? { subscriptionType: data.subscriptionType } : {},
    };
}
function parseBlob(raw) {
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch {
        return undefined;
    }
    return toSession(parsed.claudeAiOauth ?? parsed);
}
/** The production IO: `/usr/bin/security` for the Keychain, `$CLAUDE_CONFIG_DIR` (or `~/.claude`) for the file. */
export const SYSTEM_CLAUDE_CREDS_IO = {
    platform: process.platform,
    readKeychainRaw() {
        try {
            return execFileSync('/usr/bin/security', ['find-generic-password', '-s', PRIMARY_SERVICE, '-w'], {
                timeout: 3000,
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'pipe'],
            }).trim();
        }
        catch {
            return undefined;
        }
    },
    getKeychainAccountName() {
        try {
            const output = execFileSync('/usr/bin/security', ['find-generic-password', '-s', PRIMARY_SERVICE], {
                timeout: 2000,
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'pipe'],
            });
            return /"acct"<blob>="([^"]*)"/.exec(output)?.[1];
        }
        catch {
            return undefined;
        }
    },
    writeKeychainRaw(account, raw) {
        try {
            execFileSync('/usr/bin/security', ['add-generic-password', '-s', PRIMARY_SERVICE, '-a', account, '-w', raw, '-U'], {
                timeout: 2000,
                stdio: 'ignore',
            });
            return true;
        }
        catch {
            return false;
        }
    },
    credentialsFilePath() {
        return join(process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), '.claude'), '.credentials.json');
    },
    readFileRaw(path) {
        try {
            return readFileSync(path, 'utf8');
        }
        catch {
            return undefined;
        }
    },
    writeFileRaw(path, raw) {
        try {
            // Hardening over the reference: never write through a symlink planted at the credentials path. The
            // check-then-write is still not atomic (accepted residual risk, see docs/ai/ticket-132-verification.md).
            if (existsSync(path) && lstatSync(path).isSymbolicLink())
                return false;
            const dir = dirname(path);
            if (!existsSync(dir))
                mkdirSync(dir, { recursive: true, mode: 0o700 });
            writeFileSync(path, raw, { encoding: 'utf8', mode: 0o600 });
            chmodSync(path, 0o600);
            return true;
        }
        catch {
            return false;
        }
    },
};
/**
 * Read the current Claude Code session from its source of truth: the macOS Keychain first, then the credentials
 * file. Returns undefined when neither holds a complete login.
 */
export function readClaudeCodeCredentials(io = SYSTEM_CLAUDE_CREDS_IO) {
    if (io.platform === 'darwin') {
        const raw = io.readKeychainRaw();
        const session = raw !== undefined ? parseBlob(raw) : undefined;
        if (session)
            return session;
    }
    const raw = io.readFileRaw(io.credentialsFilePath());
    return raw !== undefined ? parseBlob(raw) : undefined;
}
function blobMatches(raw, expectedAccessToken) {
    return parseBlob(raw)?.accessToken === expectedAccessToken;
}
/** Merge fresh tokens into an existing raw blob, preserving unrelated fields. */
function mergeIntoBlob(existingRaw, next) {
    let parsed;
    try {
        parsed = JSON.parse(existingRaw);
    }
    catch {
        return undefined;
    }
    const target = (parsed.claudeAiOauth ?? parsed);
    target.accessToken = next.accessToken;
    target.refreshToken = next.refreshToken;
    target.expiresAt = next.expiresAt;
    return JSON.stringify(parsed);
}
/**
 * Write a refreshed session back to Claude Code's own credential store, so the `claude` CLI and any other consumer
 * of the same account see the token just rotated. A stale-blob mismatch (something else rotated it first) is a
 * no-op: the caller already has that other rotation via {@link readClaudeCodeCredentials}. Only the three token
 * fields change; every other field of the blob is preserved.
 * @param next - the freshly refreshed session to persist.
 * @param expectedPriorAccessToken - the access token this refresh started from.
 * @param io - the credential store IO (production default; tests inject fakes).
 * @returns whether the write-back succeeded.
 */
export function writeBackClaudeCodeCredentials(next, expectedPriorAccessToken, io = SYSTEM_CLAUDE_CREDS_IO) {
    if (io.platform === 'darwin') {
        const raw = io.readKeychainRaw();
        if (raw === undefined || !blobMatches(raw, expectedPriorAccessToken))
            return false;
        const updated = mergeIntoBlob(raw, next);
        if (updated === undefined)
            return false;
        return io.writeKeychainRaw(io.getKeychainAccountName() ?? PRIMARY_SERVICE, updated);
    }
    const path = io.credentialsFilePath();
    const raw = io.readFileRaw(path);
    if (raw === undefined || !blobMatches(raw, expectedPriorAccessToken))
        return false;
    const updated = mergeIntoBlob(raw, next);
    return updated !== undefined && io.writeFileRaw(path, updated);
}
/** Upper bound of one profile lookup; a slow or hung lookup counts as "email unknown". */
export const CLAUDE_PROFILE_LOOKUP_TIMEOUT_MS = 5_000;
/** Same normalization as the Codex store (`trim().toLowerCase()`); undefined for a missing or blank email. */
export function normalizeEmail(value) {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim().toLowerCase() : undefined;
}
/**
 * Look an account's email up through the profile endpoint with one access token. Bounded by a timeout and by the
 * lifecycle signal; a failure, a timeout, an abort or a profile without an email all yield undefined ("unknown").
 * The caller re-checks the lifecycle signal, so an abort here is never mistaken for a verdict about the account.
 */
async function lookupEmail(accessToken, options, signal) {
    const lookup = options.profile;
    if (lookup === undefined || signal?.aborted === true)
        return undefined;
    const bounded = new AbortController();
    const stop = () => bounded.abort();
    signal?.addEventListener('abort', stop, { once: true });
    const timer = setTimeout(stop, options.profileTimeoutMs ?? CLAUDE_PROFILE_LOOKUP_TIMEOUT_MS);
    // A lookup that ignores its signal must not hold the refresh hostage either.
    const stopped = new Promise(resolve => { bounded.signal.addEventListener('abort', () => resolve(undefined), { once: true }); });
    try {
        const profile = await Promise.race([(async () => lookup(accessToken, bounded.signal))().catch(() => undefined), stopped]);
        return normalizeEmail(profile?.emailAddress) === undefined ? undefined : profile.emailAddress.trim();
    }
    finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', stop);
    }
}
/**
 * Record the account email on a session read for an explicit import. Real credential blobs normally carry no email,
 * so when the blob has none the profile endpoint is asked with its access token (bounded, best effort); the imported
 * session then carries the email and later comparisons need no network. When the lookup fails, times out or is
 * aborted the session is returned unchanged, without an email (a later refresh tries again).
 */
export async function recordClaudeEmail(session, options = {}, signal) {
    if (normalizeEmail(session.emailAddress) !== undefined)
        return session;
    const email = await lookupEmail(session.accessToken, options, signal);
    return email === undefined ? session : { ...session, emailAddress: email };
}
/**
 * Decide whether Claude Code's store holds the SAME account as the stored session, so its tokens may be adopted.
 * The only account identity is the email. Real blobs usually carry none, and Anthropic issues a new refresh token on
 * every refresh, so refresh-token continuity cannot identify an account that the `claude` CLI refreshed first. A
 * missing email is therefore resolved through the profile endpoint (stored side with the stored access token, source
 * side with the SOURCE access token; a stored token that already expired simply yields no answer). Adopt only when
 * both emails are known and equal after trim + lower-casing (the Codex store's normalization). If a lookup fails,
 * times out, is aborted or returns no email, the account is NOT proven and nothing is adopted; the single exception
 * is "no email known on either side after the lookups" together with an identical refresh token (the store holds the
 * very refresh token this account already owns).
 */
async function resolveIdentity(stored, source, options, signal) {
    let storedEmail = normalizeEmail(stored.emailAddress);
    let sourceEmail = normalizeEmail(source.emailAddress);
    let known = stored;
    let sourceRaw = source.emailAddress?.trim();
    if (storedEmail === undefined || sourceEmail === undefined) {
        const [fromStored, fromSource] = await Promise.all([
            storedEmail === undefined ? lookupEmail(stored.accessToken, options, signal) : undefined,
            sourceEmail === undefined ? lookupEmail(source.accessToken, options, signal) : undefined,
        ]);
        if (fromStored !== undefined) {
            known = { ...stored, emailAddress: fromStored };
            storedEmail = normalizeEmail(fromStored);
        }
        if (fromSource !== undefined) {
            sourceRaw = fromSource;
            sourceEmail = normalizeEmail(fromSource);
        }
    }
    const same = storedEmail !== undefined && sourceEmail !== undefined
        ? storedEmail === sourceEmail
        : storedEmail === undefined && sourceEmail === undefined && stored.refreshToken === source.refreshToken;
    const email = known.emailAddress ?? sourceRaw;
    return { same, stored: known, ...email === undefined ? {} : { email } };
}
/**
 * Refresh a Claude session, first checking whether Claude Code's own store already holds a fresher token (rotated by
 * the `claude` CLI or another consumer) before hitting the OAuth endpoint ourselves, and writing our own refresh
 * back to that store so every consumer of the account stays synced. Called only for `keychainBound` accounts.
 *
 * Differences from the reference, on purpose: a source session is adopted only when it is provably the same account
 * (see {@link resolveIdentity}: matching normalized emails, resolved through the profile endpoint when a blob has
 * none), because Claude Code may have switched to another login; a different or unproven account needs an explicit
 * new import, is never persisted under this one, and the store is never written for it (no write-back whenever the
 * source was not adopted). Limits: resolving needs a network profile lookup, and it is not live-verified whether
 * real blobs carry an email. Every returned session keeps `keychainBound`, so the binding survives the TokenManager
 * save, and carries any email learned here. The optional `signal` is the component lifecycle: once aborted, nothing
 * reads or writes Claude Code's store and nothing is returned for persisting (an abort is not a permanent failure).
 * @param session - the session TokenManager wants refreshed.
 * @param doRefresh - the actual OAuth refresh-token grant (network call).
 * @param io - the credential store IO (production default; tests inject fakes).
 * @param signal - aborted when the owning component is disposed.
 * @param identity - the profile lookup seam and its timeout.
 * @returns the freshest available session, still bound.
 */
export async function refreshClaudeSynced(session, doRefresh, io = SYSTEM_CLAUDE_CREDS_IO, signal, identity = {}) {
    signal?.throwIfAborted();
    const fromSource = readClaudeCodeCredentials(io);
    let base = session;
    // True when the store holds a login that is not this account (or not provably so): never written back.
    let foreign = false;
    if (fromSource !== undefined && fromSource.accessToken !== session.accessToken) {
        const verdict = await resolveIdentity(session, fromSource, identity, signal);
        signal?.throwIfAborted();
        if (verdict.same) {
            base = {
                ...fromSource,
                ...verdict.email === undefined ? {} : { emailAddress: verdict.email },
                ...fromSource.subscriptionType === undefined && session.subscriptionType !== undefined ? { subscriptionType: session.subscriptionType } : {},
                keychainBound: true,
            };
        }
        else {
            base = verdict.stored;
            foreign = true;
        }
    }
    if (base.expiresAt > Date.now() + 60_000)
        return { ...base, keychainBound: true };
    const next = { ...await doRefresh(base), keychainBound: true };
    signal?.throwIfAborted();
    if (!foreign)
        writeBackClaudeCodeCredentials(next, base.accessToken, io);
    return next;
}
