/**
 * Claude Code's own login, read (and, for imported accounts only, written back on refresh) from the same store the
 * `claude` CLI uses. Ported from reference v0.9.12 src/auth/claude-code-creds.ts; see PROVENANCE.md (#132).
 *
 * Every OS call goes through a {@link ClaudeCredsIo} so tests inject fakes. The production defaults touch the real
 * macOS Keychain and `~/.claude/.credentials.json`; they run only from an explicit user import and from the refresh
 * of an account imported that way (its `keychainBound` flag).
 */
import { execFileSync } from 'node:child_process'
import { chmodSync, existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import type { ClaudeSession } from './store.js'

const PRIMARY_SERVICE = 'Claude Code-credentials'

/** The OS touch points of the credential store: the macOS Keychain item and the credentials file. */
export interface ClaudeCredsIo {
  readonly platform: string
  /** Current Keychain item payload, or undefined when absent or unreadable. */
  readKeychainRaw(): string | undefined
  /** Keychain account name of the item (for the update), or undefined when unknown. */
  getKeychainAccountName(): string | undefined
  /** Replace the Keychain item payload; false when the update fails. */
  writeKeychainRaw(account: string, raw: string): boolean
  /** Path of Claude Code's `.credentials.json`. */
  credentialsFilePath(): string
  readFileRaw(path: string): string | undefined
  /** Write the credentials file owner-only; false when the write fails. */
  writeFileRaw(path: string, raw: string): boolean
}

interface RawCreds {
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
  scopes?: string[] | string
  subscriptionType?: string
  emailAddress?: string
}

interface CredentialBlob {
  claudeAiOauth?: RawCreds
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
  scopes?: string[] | string
  subscriptionType?: string
  emailAddress?: string
}

const DEFAULT_SCOPES = 'user:profile user:inference user:sessions:claude_code user:mcp_servers'

function toSession(data: RawCreds): ClaudeSession | undefined {
  // Empty-string tokens (seen from a corrupted Keychain item left by a Claude Code logout) pass the typeof gate
  // but are useless and would poison the auth store, so they are rejected here.
  if (typeof data.accessToken !== 'string' || data.accessToken.length === 0
    || typeof data.refreshToken !== 'string' || data.refreshToken.length === 0
    || typeof data.expiresAt !== 'number' || !Number.isFinite(data.expiresAt)) {
    return undefined
  }
  const scopes = Array.isArray(data.scopes) ? data.scopes.join(' ') : typeof data.scopes === 'string' ? data.scopes : DEFAULT_SCOPES
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresAt: Math.trunc(data.expiresAt),
    scopes,
    ...typeof data.emailAddress === 'string' ? { emailAddress: data.emailAddress } : {},
    ...typeof data.subscriptionType === 'string' ? { subscriptionType: data.subscriptionType } : {},
  }
}

function parseBlob(raw: string): ClaudeSession | undefined {
  let parsed: CredentialBlob
  try {
    parsed = JSON.parse(raw)
  } catch {
    return undefined
  }
  return toSession(parsed.claudeAiOauth ?? parsed)
}

/** The production IO: `/usr/bin/security` for the Keychain, `$CLAUDE_CONFIG_DIR` (or `~/.claude`) for the file. */
export const SYSTEM_CLAUDE_CREDS_IO: ClaudeCredsIo = {
  platform: process.platform,
  readKeychainRaw() {
    try {
      return execFileSync('/usr/bin/security', ['find-generic-password', '-s', PRIMARY_SERVICE, '-w'], {
        timeout: 3000,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim()
    } catch {
      return undefined
    }
  },
  getKeychainAccountName() {
    try {
      const output = execFileSync('/usr/bin/security', ['find-generic-password', '-s', PRIMARY_SERVICE], {
        timeout: 2000,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      })
      return /"acct"<blob>="([^"]*)"/.exec(output)?.[1]
    } catch {
      return undefined
    }
  },
  writeKeychainRaw(account, raw) {
    try {
      execFileSync('/usr/bin/security', ['add-generic-password', '-s', PRIMARY_SERVICE, '-a', account, '-w', raw, '-U'], {
        timeout: 2000,
        stdio: 'ignore',
      })
      return true
    } catch {
      return false
    }
  },
  credentialsFilePath() {
    return join(process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), '.claude'), '.credentials.json')
  },
  readFileRaw(path) {
    try {
      return readFileSync(path, 'utf8')
    } catch {
      return undefined
    }
  },
  writeFileRaw(path, raw) {
    try {
      // Hardening over the reference: never write through a symlink planted at the credentials path. The
      // check-then-write is still not atomic (accepted residual risk, see docs/ai/ticket-132-verification.md).
      if (existsSync(path) && lstatSync(path).isSymbolicLink()) return false
      const dir = dirname(path)
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true, mode: 0o700 })
      writeFileSync(path, raw, { encoding: 'utf8', mode: 0o600 })
      chmodSync(path, 0o600)
      return true
    } catch {
      return false
    }
  },
}

/**
 * Read the current Claude Code session from its source of truth: the macOS Keychain first, then the credentials
 * file. Returns undefined when neither holds a complete login.
 */
export function readClaudeCodeCredentials(io: ClaudeCredsIo = SYSTEM_CLAUDE_CREDS_IO): ClaudeSession | undefined {
  if (io.platform === 'darwin') {
    const raw = io.readKeychainRaw()
    const session = raw !== undefined ? parseBlob(raw) : undefined
    if (session) return session
  }
  const raw = io.readFileRaw(io.credentialsFilePath())
  return raw !== undefined ? parseBlob(raw) : undefined
}

function blobMatches(raw: string, expectedAccessToken: string): boolean {
  return parseBlob(raw)?.accessToken === expectedAccessToken
}

/** Merge fresh tokens into an existing raw blob, preserving unrelated fields. */
function mergeIntoBlob(existingRaw: string, next: ClaudeSession): string | undefined {
  let parsed: CredentialBlob
  try {
    parsed = JSON.parse(existingRaw)
  } catch {
    return undefined
  }
  const target = (parsed.claudeAiOauth ?? parsed) as RawCreds
  target.accessToken = next.accessToken
  target.refreshToken = next.refreshToken
  target.expiresAt = next.expiresAt
  return JSON.stringify(parsed)
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
export function writeBackClaudeCodeCredentials(
  next: ClaudeSession,
  expectedPriorAccessToken: string,
  io: ClaudeCredsIo = SYSTEM_CLAUDE_CREDS_IO,
): boolean {
  if (io.platform === 'darwin') {
    const raw = io.readKeychainRaw()
    if (raw === undefined || !blobMatches(raw, expectedPriorAccessToken)) return false
    const updated = mergeIntoBlob(raw, next)
    if (updated === undefined) return false
    return io.writeKeychainRaw(io.getKeychainAccountName() ?? PRIMARY_SERVICE, updated)
  }
  const path = io.credentialsFilePath()
  const raw = io.readFileRaw(path)
  if (raw === undefined || !blobMatches(raw, expectedPriorAccessToken)) return false
  const updated = mergeIntoBlob(raw, next)
  return updated !== undefined && io.writeFileRaw(path, updated)
}

/**
 * Whether Claude Code's store still holds the SAME account as the stored session, so its tokens may be adopted.
 * The only stable identity a blob carries is its email address: when both sides carry one they must match. Without
 * a comparable pair, only refresh-token continuity (the store holds the very refresh token this account already
 * owns) proves it is the same login. Anything else is a different or unknown account and is never adopted.
 */
function sameAccount(stored: ClaudeSession, source: ClaudeSession): boolean {
  if (stored.emailAddress !== undefined && source.emailAddress !== undefined) return stored.emailAddress === source.emailAddress
  return stored.refreshToken === source.refreshToken
}

/**
 * Refresh a Claude session, first checking whether Claude Code's own store already holds a fresher token (rotated by
 * the `claude` CLI or another consumer) before hitting the OAuth endpoint ourselves, and writing our own refresh
 * back to that store so every consumer of the account stays synced. Called only for `keychainBound` accounts.
 *
 * Differences from the reference, on purpose: a source session is adopted only when it is provably the same account
 * (see {@link sameAccount}), because Claude Code may have switched to another login; a different account needs an
 * explicit new import and is never persisted under this one. Every returned session keeps `keychainBound`, so the
 * binding survives the TokenManager save. The optional `signal` is the component lifecycle: once aborted, nothing
 * reads or writes Claude Code's store and nothing is returned for persisting.
 * @param session - the session TokenManager wants refreshed.
 * @param doRefresh - the actual OAuth refresh-token grant (network call).
 * @param io - the credential store IO (production default; tests inject fakes).
 * @param signal - aborted when the owning component is disposed.
 * @returns the freshest available session, still bound.
 */
export async function refreshClaudeSynced(
  session: ClaudeSession,
  doRefresh: (session: ClaudeSession) => Promise<ClaudeSession>,
  io: ClaudeCredsIo = SYSTEM_CLAUDE_CREDS_IO,
  signal?: AbortSignal,
): Promise<ClaudeSession> {
  signal?.throwIfAborted()
  const fromSource = readClaudeCodeCredentials(io)
  const adopt = fromSource !== undefined && fromSource.accessToken !== session.accessToken && sameAccount(session, fromSource)
  const base: ClaudeSession = adopt ? { ...fromSource, keychainBound: true } : session
  if (base.expiresAt > Date.now() + 60_000) return { ...base, keychainBound: true }
  const next: ClaudeSession = { ...await doRefresh(base), keychainBound: true }
  signal?.throwIfAborted()
  writeBackClaudeCodeCredentials(next, base.accessToken, io)
  return next
}
