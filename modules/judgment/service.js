import { lstat, readFile, mkdir, open, rename, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { isValidAddress, normalizedAddress } from '../../lib/management/judgment-settings.js';

const fail = code => Object.assign(new Error(code), { code });
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const only = (value, keys) => object(value) && Object.keys(value).every(key => keys.includes(key));
const writers = new Map();
const TEST = Object.freeze({ state: 'Majed judgment connection test. No conversation data.',
  questions: { connection: { type: 'choice', instructions: 'Select ready to confirm this protocol responds.', criteria: { ready: 'Connection test' } } } });

async function abortable(work, signal) {
  signal.throwIfAborted();
  let abort;
  try {
    return await Promise.race([work, new Promise((_, reject) => {
      abort = () => reject(fail('cancelled'));
      signal.addEventListener('abort', abort, { once: true });
    })]);
  } finally { signal.removeEventListener('abort', abort); }
}

async function responseBody(response, signal) {
  if (Number(response.headers.get('content-length')) > 65536) {
    void response.body?.cancel().catch(() => {});
    throw fail('protocol_failed');
  }
  const reader = response.body?.getReader();
  if (!reader) throw fail('protocol_failed');
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await abortable(reader.read(), signal);
      if (done) return Buffer.concat(chunks).toString('utf8');
      size += value.byteLength;
      if (size > 65536) throw fail('protocol_failed');
      chunks.push(value);
    }
  } finally { void reader.cancel().catch(() => {}); reader.releaseLock(); }
}

function configuration(input) {
  if (!only(input, ['version', 'protocol', 'address', 'model', 'credential']) || input.version !== 1) throw fail('invalid_configuration');
  if (!['systemone', 'decisions'].includes(input.protocol) || typeof input.address !== 'string' || !isValidAddress(input.protocol, input.address)) throw fail('invalid_configuration');
  const url = new URL(input.address);
  if (url.username || url.password || url.search || url.hash || url.protocol !== 'https:' || input.address.length > 2048) throw fail('invalid_configuration');
  if (typeof input.model !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._/-]{0,127}$/.test(input.model) || input.model.includes('..')) throw fail('invalid_configuration');
  if (input.credential !== null && (typeof input.credential !== 'string' || !input.credential.trim() || input.credential.length > 8192 || /[\r\n]/.test(input.credential))) throw fail('invalid_configuration');
  return { ...input, address: normalizedAddress(input.protocol, input.address) };
}

/** Separately owned protocol client; no Smart activation or provider registration. */
export function createJudgmentService({ path, fetch: transport = globalThis.fetch, deadlineMs = 3000 } = {}) {
  if (!path) throw fail('store_required');
  let closed = false;
  const pending = new Set();
  const live = () => { if (closed) throw fail('unavailable'); };
  async function read() {
    live();
    try {
      const info = await lstat(path);
      if (!info.isFile() || info.isSymbolicLink() || info.size > 16384 || (process.platform !== 'win32' && (info.mode & 0o077))) throw fail('store_unavailable');
      const raw = await readFile(path, 'utf8');
      return { raw, value: configuration(JSON.parse(raw)) };
    } catch (error) {
      if (error.code === 'ENOENT') return { raw: null, value: null };
      throw fail('store_unavailable');
    }
  }
  const summary = value => ({ protocol: value?.protocol || null, addressConfigured: !!value?.address,
    modelConfigured: !!value?.model, credentialConfigured: !!value?.credential, smartEnabled: false });
  async function configure(input, signal) {
    if (!only(input, ['protocol', 'address', 'model', 'credential'])) throw fail('invalid_configuration');
    const prior = writers.get(path) || Promise.resolve();
    const task = prior.catch(() => {}).then(async () => {
      live(); signal?.throwIfAborted();
      const observed = await read();
      const next = { version: 1, credential: null, ...observed.value };
      for (const key of ['protocol', 'address', 'model']) if (key in input) next[key] = input[key];
      if ('credential' in input) {
        const edit = input.credential;
        if (!only(edit, ['action', 'value']) || !['keep', 'replace', 'remove'].includes(edit.action) || (edit.action !== 'replace' && 'value' in edit)) throw fail('invalid_configuration');
        if (edit.action === 'replace') {
          if (typeof edit.value !== 'string' || !edit.value.trim()) throw fail('invalid_configuration');
          next.credential = edit.value;
        }
        if (edit.action === 'remove') next.credential = null;
      }
      const value = configuration(next);
      await mkdir(dirname(path), { recursive: true, mode: 0o700 });
      const temporary = `${path}.${randomUUID()}.tmp`;
      let handle;
      try {
        handle = await open(temporary, 'wx', 0o600);
        await handle.writeFile(JSON.stringify(value)); await handle.sync(); await handle.close(); handle = undefined;
        if ((await read()).raw !== observed.raw) throw fail('state_changed');
        live(); signal?.throwIfAborted();
        await rename(temporary, path);
        return summary(value);
      } finally { await handle?.close(); await unlink(temporary).catch(() => {}); }
    });
    writers.set(path, task);
    try { return await task; } finally { if (writers.get(path) === task) writers.delete(path); }
  }
  async function decide(input, { consent, signal } = {}) {
    live();
    if (consent !== true) throw fail('consent_required');
    const observed = await read();
    live(); signal?.throwIfAborted();
    const config = observed.value;
    if (!config?.credential) throw fail('credential_required');
    // The consumer supplies a bounded current task and opaque choices, never a
    // provider/account registry or another plugin's private credential state.
    if (!only(input, ['state', 'questions']) || typeof input.state !== 'string' || input.state.length > 4096 || !object(input.questions) || Object.keys(input.questions).length !== 1) throw fail('invalid_decision');
    const [name, question] = Object.entries(input.questions)[0];
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(name) || !only(question, ['type', 'instructions', 'criteria']) || question.type !== 'choice' || typeof question.instructions !== 'string' || question.instructions.length > 1024 || !object(question.criteria)) throw fail('invalid_decision');
    const choices = Object.entries(question.criteria);
    if (!choices.length || choices.length > 64 || choices.some(([id, description]) => !/^[A-Za-z0-9_-]{1,128}$/.test(id) || typeof description !== 'string' || description.length > 512)) throw fail('invalid_decision');
    const permittedChoices = new Set(choices.map(([id]) => id));
    const body = JSON.stringify({ model: config.model, state: input.state,
      questions: { [name]: { type: 'choice', instructions: question.instructions, criteria: Object.fromEntries(choices) } } });
    const controller = new AbortController(); pending.add(controller);
    const timer = setTimeout(() => controller.abort(), Math.min(3000, deadlineMs));
    const combined = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;
    try {
      combined.throwIfAborted();
      const url = config.protocol === 'systemone' && !new URL(config.address).pathname.endsWith('/v1/systemone') ? config.address.replace(/\/$/, '') + '/v1/systemone' : config.address;
      const response = await abortable(Promise.resolve().then(() => {
        live(); combined.throwIfAborted();
        return transport(url, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${config.credential}` },
          body, signal: combined, redirect: 'error' });
      }), combined);
      if (!response.ok) {
        void response.body?.cancel().catch(() => {});
        throw fail('protocol_failed');
      }
      const raw = await responseBody(response, combined);
      const result = JSON.parse(raw); const answer = result.answers?.[name];
      if (typeof result.model !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._/-]{0,255}$/.test(result.model) || result.model.includes(config.credential) || answer?.type !== 'choice' || typeof answer.choice !== 'string' || !permittedChoices.has(answer.choice)) throw fail('protocol_failed');
      if (!object(result.usage) || ['input_tokens', 'output_tokens'].some(key => !Number.isSafeInteger(result.usage[key]) || result.usage[key] < 0)) throw fail('protocol_failed');
      const usage = {};
      for (const key of ['input_tokens', 'output_tokens', 'cost']) if (Number.isFinite(result.usage?.[key]) && result.usage[key] >= 0) usage[key] = result.usage[key];
      // A response to an earlier endpoint/model/credential must not validate or
      // influence consumers after the Owner has changed that configuration.
      if ((await abortable(read(), combined)).raw !== observed.raw) throw fail('state_changed');
      live(); combined.throwIfAborted();
      return { requestedModel: config.model, actualModel: result.model, choice: answer.choice, usage };
    } catch (error) { throw fail(combined.aborted ? 'cancelled' : error.code === 'state_changed' ? 'state_changed' : 'protocol_failed'); }
    finally { clearTimeout(timer); pending.delete(controller); }
  }
  return { snapshot: async () => summary((await read()).value), configure, decide,
    validate: ({ consent, signal } = {}) => decide(TEST, { consent, signal }),
    async dispose() { closed = true; for (const controller of pending) controller.abort(); } };
}
