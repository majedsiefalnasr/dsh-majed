import { readFile, realpath, stat, lstat, mkdir, open, rename, unlink } from 'node:fs/promises';
import { join, resolve, relative, isAbsolute } from 'node:path';
import { homedir } from 'node:os';
import { createHash, randomBytes } from 'node:crypto';
import { validateCommandHook } from './index.js';
import { resolveManagementScope } from '../../lib/management/scope.js';

export const APPROVAL_METHOD = 'majed/hooks/approval';
export const APPROVAL_PATH = '/api/' + APPROVAL_METHOD;
const PHRASE = 'RUN AS DSH USER';
const MAX_BYTES = 262144;
const writers = new Map();
const hash = value => createHash('sha256').update(value).digest('hex');
const reject = code => { throw Object.assign(new Error(code), { code }); };
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const only = (value, keys) => object(value) && Object.keys(value).every(key => keys.includes(key));

// This private file never shares reference definitions or imports old Approvals.
function privateStore(directory) {
  const file = join(directory, 'commands.json');
  async function read() {
    let raw;
    try {
      const info = await lstat(file);
      if (!info.isFile() || info.isSymbolicLink() || info.size > MAX_BYTES) reject('store_unavailable');
      raw = await readFile(file, 'utf8');
    } catch (error) { if (error.code === 'ENOENT') return { revision: null, value: { version: 1, entries: [] } }; throw error; }
    let value;
    try { value = JSON.parse(raw); } catch { reject('store_unavailable'); }
    if (!only(value, ['version', 'entries']) || value.version !== 1 || !Array.isArray(value.entries) || value.entries.length > 128) reject('store_unavailable');
    const seen = new Set();
    for (const entry of value.entries) {
      if (!only(entry, ['scope', 'root', 'hook', 'generation', 'approval']) || !['user', 'project'].includes(entry.scope) || typeof entry.root !== 'string' || !isAbsolute(entry.root) || typeof entry.generation !== 'string') reject('store_unavailable');
      entry.hook = validateCommandHook(entry.hook);
      const key = JSON.stringify([entry.scope, entry.root, entry.hook.id]);
      if (seen.has(key)) reject('store_unavailable'); seen.add(key);
      if (entry.approval && (!only(entry.approval, ['fingerprint', 'receivedAt', 'origin']) || !/^[a-f0-9]{64}$/.test(entry.approval.fingerprint) || !Number.isSafeInteger(entry.approval.receivedAt) || entry.approval.origin !== 'unknown')) reject('store_unavailable');
    }
    return { revision: hash(raw), value };
  }
  async function save(observed, value, signal) {
    const raw = JSON.stringify(value);
    if (Buffer.byteLength(raw) > MAX_BYTES) reject('store_full');
    await mkdir(directory, { recursive: true, mode: 0o700 });
    if ((await lstat(directory)).isSymbolicLink()) reject('store_unavailable');
    const temporary = join(directory, '.commands-' + randomBytes(16).toString('hex'));
    let handle;
    try {
      handle = await open(temporary, 'wx', 0o600);
      await handle.writeFile(raw); await handle.sync(); await handle.close(); handle = undefined;
      if ((await read()).revision !== observed.revision) reject('state_changed');
      signal?.throwIfAborted();
      await rename(temporary, file);
    } finally { await handle?.close(); await unlink(temporary).catch(() => {}); }
  }
  return { file, read, save };
}

async function inside(root, value, directory = false) {
  const canonical = await realpath(resolve(root, value || '.'));
  const path = relative(root, canonical);
  if (path === '..' || path.startsWith('../') || isAbsolute(path)) reject('invalid_scope');
  const info = await stat(canonical);
  if (directory ? !info.isDirectory() : !info.isFile() || info.size > 1048576) reject('invalid_scope');
  return canonical;
}

async function reviewEntry(entry) {
  const cwd = await inside(entry.root, entry.hook.cwd || '.', true);
  const watched = [...new Set([...(entry.hook.watchedFiles || []), ...(entry.hook.source === 'file' ? [entry.hook.command] : [])])].sort();
  const files = [];
  for (const file of watched) {
    const path = await inside(entry.root, file);
    files.push({ path, fingerprint: hash(await readFile(path)) });
  }
  const normalized = { ...entry.hook, command: entry.hook.command.replace(/\r\n/g, '\n'), cwd, watchedFiles: files };
  const fingerprint = hash(JSON.stringify({ scope: entry.scope, root: entry.root, generation: entry.generation, hook: normalized }));
  return { ...normalized, scope: entry.scope, root: entry.root, fingerprint, origin: 'unknown', phrase: PHRASE,
    disclosure: 'Commands run on the DSH host as its OS user, outside a sandbox. Original local/remote origin is unknown. Execution is unavailable.' };
}

/** Production consent workflow only. No process runner or hook event registration. */
export function applyCommandApproval(ctx, options = {}) {
  const enabled = options.enabled === true;
  let disposed = false;
  const pending = new Map();
  const now = options.now || Date.now;
  const directory = resolve(options.stateDirectory || join(process.env.DSH_HOME || join(homedir(), '.dsh'), 'majed', 'hooks'));
  const store = privateStore(directory);
  async function operation(owner, input, signal, receivedAt) {
    if (!enabled) return { enabled: false, executionAvailable: false, hooks: [] };
    if (disposed) reject('unavailable');
    if (!only(input, ['action', 'scope', 'sessionId', 'workspaceId', 'hook', 'id', 'nonce', 'phrase'])) reject('invalid_request');
    const allowed = { list: [], save: ['hook'], review: ['id'], approve: ['id', 'nonce', 'phrase'], revoke: ['id'], remove: ['id'] };
    if (!Object.hasOwn(allowed, input.action) || !['user', 'project'].includes(input.scope)) reject('invalid_request');
    if (!only(input, ['action', 'scope', ...(input.scope === 'project' ? ['sessionId', 'workspaceId'] : []), ...allowed[input.action]])) reject('invalid_request');
    let root;
    if (input.scope === 'user') root = await realpath(options.userDirectory || homedir());
    else {
      const services = { sessions: owner.get('sessions'), sessionPersistence: owner.get('sessionPersistence'), workspaceRegistry: owner.get('workspaceRegistry') };
      if (Object.values(services).some(value => !value)) reject('scope_unavailable');
      root = (await resolveManagementScope(services, input, signal))?.projectPath;
      if (!root) reject('invalid_scope');
    }
    signal.throwIfAborted();
    const observed = await store.read(); const next = observed.value;
    const id = input.action === 'save' ? input.hook?.id : input.id;
    const index = next.entries.findIndex(entry => entry.scope === input.scope && entry.root === root && entry.hook.id === id);
    const entry = next.entries[index];
    let approvalExpiresAt;
    const challengeKey = JSON.stringify([input.scope, root, id]);
    async function contexts() {
      const services = { sessions: owner.get('sessions'), sessionPersistence: owner.get('sessionPersistence'), workspaceRegistry: owner.get('workspaceRegistry') };
      if (Object.values(services).some(value => !value) || typeof services.workspaceRegistry.list !== 'function') return [];
      const values = [];
      // One live native session per project supplies a supported, revalidated
      // scope selector. Never infer context from private client viewing fields.
      for (const workspace of services.workspaceRegistry.list().slice(0, 64)) {
        for (const sessionId of workspace.sessionIds.slice(0, 32)) {
          if (!services.sessions.get(sessionId)) continue;
          const selectors = { sessionId, workspaceId: workspace.id };
          const resolved = await resolveManagementScope(services, selectors, signal);
          if (resolved) { values.push({ ...selectors, label: resolved.projectPath }); break; }
        }
      }
      return values;
    }
    const snapshot = async () => ({ enabled: true, executionAvailable: false, contexts: await contexts(), hooks: await Promise.all(next.entries.filter(entry => entry.scope === input.scope && entry.root === root).map(async entry => {
      let valid = false;
      try { valid = !!entry.approval && entry.approval.fingerprint === (await reviewEntry(entry)).fingerprint; } catch {}
      return { hook: entry.hook, approval: entry.approval ? { receivedAt: entry.approval.receivedAt, origin: entry.approval.origin, valid } : null };
    })) });
    if (input.action === 'list') return snapshot();
    if (input.action === 'save') {
      const hook = validateCommandHook(input.hook);
      if (!hook.id.trim() || !hook.command.trim()) reject('invalid_request');
      const replacement = { scope: input.scope, root, hook, generation: randomBytes(16).toString('hex'), approval: null };
      await reviewEntry(replacement);
      if (index < 0) next.entries.push(replacement); else next.entries[index] = replacement;
      pending.delete(challengeKey);
    } else {
      if (!entry) reject('not_found');
      if (input.action === 'review') {
        // Bound process-memory consent challenges; challenges do not survive restart.
        for (const [key, item] of pending) if (item.expiresAt <= now()) pending.delete(key);
        if (pending.size >= 128 && !pending.has(challengeKey)) reject('too_many_reviews');
        const review = await reviewEntry(entry); const nonce = randomBytes(32).toString('hex');
        const expiresAt = now() + 120000;
        pending.set(challengeKey, { nonce, fingerprint: review.fingerprint, revision: observed.revision, expiresAt });
        return { nonce, expiresAt, review };
      }
      if (input.action === 'approve') {
        const challenge = pending.get(challengeKey);
        // Every attempted redemption consumes its nonce, including a bad phrase.
        pending.delete(challengeKey);
        if (!challenge || challenge.nonce !== input.nonce || challenge.expiresAt <= now() || input.phrase !== PHRASE) reject('invalid_approval');
        approvalExpiresAt = challenge.expiresAt;
        const review = await reviewEntry(entry);
        if (challenge.revision !== observed.revision || challenge.fingerprint !== review.fingerprint) reject('state_changed');
        entry.approval = { fingerprint: review.fingerprint, receivedAt, origin: 'unknown' };
      } else if (input.action === 'revoke') { entry.approval = null; pending.delete(challengeKey); }
      else if (input.action === 'remove') { next.entries.splice(index, 1); pending.delete(challengeKey); }
    }
    if (disposed) reject('unavailable');
    signal.throwIfAborted();
    // Recheck watched bytes/cwd and native project identity after asynchronous work.
    if (input.action === 'approve' && (entry.approval.fingerprint !== (await reviewEntry(entry)).fingerprint || approvalExpiresAt <= now())) reject('state_changed');
    if (input.scope === 'project') {
      const scope = await resolveManagementScope({ sessions: owner.get('sessions'), sessionPersistence: owner.get('sessionPersistence'), workspaceRegistry: owner.get('workspaceRegistry') }, input, signal);
      if (scope?.projectPath !== root) reject('state_changed');
    }
    if (disposed) reject('unavailable');
    await store.save(observed, next, signal);
    return snapshot();
  }
  ctx.inject(['connection'], owner => {
    disposed = false;
    owner.effect(() => () => { disposed = true; pending.clear(); }, 'dsh-majed: Command Approval lifecycle');
    // Native Connection authenticates BrowserAuth/paired devices and requires
    // Owner before exact Fetch delivery. No client address/header grants origin.
    owner.connection.fetch.register({ path: APPROVAL_PATH, methods: ['POST'], requestBody: 'buffered', async fetch(request) {
      const receivedAt = now();
      let rpcId;
      const send = value => Response.json(value, { headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
      try {
        if (request.method !== 'POST' || new URL(request.url).pathname !== APPROVAL_PATH || request.headers.get('content-type') !== 'application/json') reject('invalid_request');
        if (Number(request.headers.get('content-length')) > 32768) reject('invalid_request');
        const raw = await request.text();
        if (Buffer.byteLength(raw) > 32768) reject('invalid_request');
        const message = JSON.parse(raw);
        if (!only(message, ['type', 'rpcId', 'method', 'payload']) || message.type !== 'client-request' || message.method !== APPROVAL_METHOD || typeof message.rpcId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(message.rpcId)) reject('invalid_request');
        rpcId = message.rpcId;
        const prior = writers.get(store.file) || Promise.resolve();
        const task = prior.catch(() => {}).then(() => operation(owner, message.payload, request.signal, receivedAt));
        writers.set(store.file, task);
        try { return send({ type: 'server-response', rpcId, result: { ok: true, value: await task } }); }
        finally { if (writers.get(store.file) === task) writers.delete(store.file); }
      } catch (error) {
        const codes = ['invalid_request', 'invalid_scope', 'scope_unavailable', 'invalid_approval', 'state_changed', 'not_found', 'too_many_reviews', 'store_full'];
        const code = codes.includes(error.code) ? error.code : 'unavailable';
        return send({ type: 'server-response', rpcId, result: { ok: false, error: { code, message: code, details: {} } } });
      }
    } });
  });
}
