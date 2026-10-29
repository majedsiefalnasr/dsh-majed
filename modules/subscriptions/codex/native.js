import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { createCodexAccounts } from './accounts.js';
import { createCodexUsage } from './usage.js';

export const CODEX_ACCOUNTS_METHOD = 'majed/subscriptions/codex';
export const CODEX_ACCOUNTS_PATH = '/api/' + CODEX_ACCOUNTS_METHOD;
const error = code => Object.assign(new Error(code), { code });
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const keys = (value, allowed) => Object.keys(value).every(key => allowed.includes(key));
const allowedErrors = new Set(['invalid_request', 'module_disabled', 'runtime_unavailable', 'invalid_callback', 'login_not_pending', 'login_pending', 'account_not_found', 'account_paused', 'invalid_state', 'duplicate_account', 'identity_mismatch', 'reauthentication_required', 'refresh_failed', 'unsafe_account_store', 'corrupt_account_store', 'INVALID_REQUEST', 'NO_ADAPTER', 'DUPLICATE_ADAPTER']);
const json = value => Response.json(value, { headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });

async function message(request) {
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') throw error('invalid_request');
  const reader = request.body?.getReader(); if (!reader) throw error('invalid_request');
  let size = 0, timer; const chunks = [];
  const deadline = new Promise((_, reject) => { timer = setTimeout(() => reject(error('invalid_request')), 5000); });
  try {
    while (true) {
      request.signal.throwIfAborted();
      const { value, done } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      size += value.byteLength; if (size > 8192) throw error('invalid_request'); chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString());
  } finally { clearTimeout(timer); void reader.cancel().catch(() => {}); reader.releaseLock(); }
}

/** Exact native Fetch registration delegates authentication/CSRF to DSH. */
export function applyCodexAccounts(ctx, config = {}) {
  ctx.inject(['connection'], owner => {
    let service, usage, runtime, llm, loader, enabled = false, switching = false;
    const path = config.path || join(resolve(process.env.DSH_HOME || join(homedir(), '.dsh')), 'plugins', 'dsh-majed', 'codex-auth.json');
    const create = () => createCodexAccounts({
      path, settingsPath: config.catalogPath || path + '.catalog',
      ...(config.fetch ? { fetch: config.fetch } : {}), ...(config.ports ? { ports: config.ports } : {}),
    });
    owner.inject(['llm'], runtimeOwner => {
      llm = runtimeOwner.llm;
      runtimeOwner.effect(() => async () => { await runtime?.dispose(); runtime = undefined; llm = undefined; }, 'dsh-majed: Codex LLM availability');
    });
    owner.inject(['loader'], moduleOwner => {
      loader = moduleOwner.loader;
      moduleOwner.effect(() => async () => { await runtime?.dispose(); runtime = undefined; loader = undefined; }, 'dsh-majed: Codex public module loader');
    });
    owner.effect(() => async () => { usage?.dispose(); await runtime?.dispose(); await service?.dispose(); }, 'dsh-majed: Codex account disposal');
    const endpoints = ['providerSettings', 'setProviderSettings', 'status', 'login', 'manual', 'cancel', 'logout', 'setDefault', 'usage', 'prepareReset', 'consumeReset', 'speed', 'setSpeed', 'modelDefaults', 'setModelDefault'];
    for (const endpoint of endpoints) {
      const method = 'majed/subscriptions.' + endpoint, path = '/api/' + method;
      owner.connection.fetch.register({ path, methods: ['POST'], requestBody: 'streaming', async fetch(request) {
        let rpcId;
        try {
          if (request.method !== 'POST' || new URL(request.url).pathname !== path) throw error('invalid_request');
          const input = await message(request);
          if (!object(input) || !keys(input, ['type', 'rpcId', 'method', 'payload']) || input.type !== 'client-request' || input.method !== method || typeof input.rpcId !== 'string' || !/^[\w-]{1,128}$/.test(input.rpcId)) throw error('invalid_request');
          rpcId = input.rpcId; const p = input.payload;
          const fields = { status: [], providerSettings: ['provider', 'force'], setProviderSettings: ['provider', 'settings'], login: ['provider', 'account'], manual: ['provider', 'input'], cancel: ['provider'], logout: ['provider', 'account'], setDefault: ['provider', 'account'], usage: ['provider', 'account', 'force'], prepareReset: ['account'], consumeReset: ['account', 'ticket'], speed: ['sessionId'], setSpeed: ['sessionId', 'tier'], modelDefaults: ['provider'], setModelDefault: ['provider', 'model', 'effort'] };
          if (!object(p) || !keys(p, fields[endpoint]) || ('provider' in p && p.provider !== 'codex') || ('account' in p && (typeof p.account !== 'string' || !/^[a-f0-9]{64}$/.test(p.account))) || ('force' in p && typeof p.force !== 'boolean')) throw error('invalid_request');
          request.signal.throwIfAborted();
          if (!enabled || switching || !service) throw error('module_disabled');
          let value;
          if (endpoint === 'status') {
            const snapshot = await service.snapshot({ management: true });
            value = { providers: { codex: { busy: snapshot.state === 'pending', accounts: snapshot.accounts.map(a => ({ key: a.id, account: a.label, expiresAt: a.expiresAt, isDefault: a.default, state: a.state })), ...(snapshot.loginFailure ? { detail: snapshot.loginFailure } : {}), clientVersion: { version: config.clientVersion || '0.165.0', source: config.clientVersion ? 'config' : 'fallback' } } } };
          } else if (endpoint === 'login') value = await service.begin(p.account);
          else if (endpoint === 'manual') {
            if (typeof p.input !== 'string' || p.input.length > 4096) throw error('invalid_request');
            try { value = await service.complete(p.input); } catch (failure) { if (failure.code !== 'login_not_pending') throw failure; value = await service.snapshot(); }
          } else if (endpoint === 'cancel') value = await service.cancel();
          else if (endpoint === 'logout') value = await service.signOut(p.account);
          else if (endpoint === 'setDefault') value = await service.setDefault(p.account);
          else if (['usage', 'prepareReset', 'consumeReset'].includes(endpoint)) {
            if (!p.account || (endpoint === 'consumeReset' && (typeof p.ticket !== 'string' || p.ticket.length > 128))) throw error('invalid_request');
            usage ||= createCodexUsage({ accounts: service, ...(config.fetch ? { fetch: config.fetch } : {}) });
            value = endpoint === 'usage' ? await usage.read(p.account) : endpoint === 'prepareReset' ? await usage.prepare(p.account) : await usage.consume(p.account, p.ticket);
          } else {
            if (!runtime) throw error('runtime_unavailable');
            if (endpoint === 'providerSettings') { if (p.force) await runtime.invalidate(); value = await runtime.providerSettings();
              const snapshot = await service.snapshot({ management: true });
              value.accounts = value.accounts.map(a => ({ ...a, label: snapshot.accounts.find(s => s.id === a.key)?.label || a.label }));
            } else if (endpoint === 'setProviderSettings') value = await runtime.setProviderSettings(p.settings);
            else if (endpoint === 'speed') value = await runtime.speed(p.sessionId);
            else if (endpoint === 'setSpeed') value = await runtime.setSpeed(p.sessionId, p.tier);
            else if (endpoint === 'modelDefaults') value = { provider: 'codex', models: (await runtime.providerSettings()).models };
            else if (endpoint === 'setModelDefault') value = await runtime.configure({ model: p.model, defaultEffort: p.effort || null });
          }
          return json({ type: 'server-response', rpcId, result: { ok: true, value } });
        } catch (failure) {
          const code = allowedErrors.has(failure.code) || ['usage_unavailable', 'reset_unavailable', 'invalid_reset_ticket', 'reset_unconfirmed'].includes(failure.code) ? failure.code : 'service_unavailable';
          return json(rpcId ? { type: 'server-response', rpcId, result: { ok: false, error: { code, message: code, details: {} } } } : { error: code });
        }
      } });
    }
    owner.connection.fetch.register({ path: CODEX_ACCOUNTS_PATH, methods: ['POST'], requestBody: 'streaming', async fetch(request) {
      let rpcId;
      try {
        if (request.method !== 'POST' || new URL(request.url).pathname !== CODEX_ACCOUNTS_PATH) throw error('invalid_request');
        const input = await message(request);
        if (!object(input) || !keys(input, ['type', 'rpcId', 'method', 'payload']) || input.type !== 'client-request' || input.method !== CODEX_ACCOUNTS_METHOD || typeof input.rpcId !== 'string' || !/^[\w-]{1,128}$/.test(input.rpcId)) throw error('invalid_request');
        rpcId = input.rpcId; const p = input.payload;
        if (!object(p) || !keys(p, ['action', 'enabled', 'callback', 'account', 'settings', 'sessionId', 'tier', 'mode']) || !['status', 'enable', 'runtime', 'catalog', 'configure', 'speed', 'setSpeed', 'begin', 'complete', 'cancel', 'refresh', 'remove', 'default', 'pause', 'resume', 'signOut'].includes(p.action)) throw error('invalid_request');
        if (p.action === 'status' && (!keys(p, ['action', 'mode']) || ('mode' in p && p.mode !== 'passive'))) throw error('invalid_request');
        if (p.action !== 'status' && 'mode' in p) throw error('invalid_request');
        if (['catalog', 'cancel'].includes(p.action) && !keys(p, ['action'])) throw error('invalid_request');
        if (p.action === 'begin' && (!keys(p, ['action', 'account']) || ('account' in p && !/^[a-f0-9]{64}$/.test(p.account)))) throw error('invalid_request');
        if (['enable', 'runtime'].includes(p.action) && (typeof p.enabled !== 'boolean' || !keys(p, ['action', 'enabled']))) throw error('invalid_request');
        if (p.action === 'configure' && (!object(p.settings) || !keys(p, ['action', 'settings']))) throw error('invalid_request');
        if (['speed', 'setSpeed'].includes(p.action) && (typeof p.sessionId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(p.sessionId)
          || !keys(p, p.action === 'speed' ? ['action', 'sessionId'] : ['action', 'sessionId', 'tier'])
          || (p.action === 'setSpeed' && !['standard', 'fast'].includes(p.tier)))) throw error('invalid_request');
        if (p.action === 'complete' && (typeof p.callback !== 'string' || p.callback.length > 4096 || !keys(p, ['action', 'callback']))) throw error('invalid_request');
        if (['refresh', 'remove', 'default', 'pause', 'resume', 'signOut'].includes(p.action) && (typeof p.account !== 'string' || !/^[a-f0-9]{64}$/.test(p.account) || !keys(p, ['action', 'account']))) throw error('invalid_request');
        request.signal.throwIfAborted();
        if (switching) throw error('module_disabled');
        if (p.action === 'enable') {
          switching = true;
          try {
            if (!p.enabled) { enabled = false; await runtime?.dispose(); runtime = undefined; await service?.dispose(); service = undefined; }
            else { service ||= create(); enabled = true; }
          } finally { switching = false; }
        }
        let value;
        if (!enabled) {
          if (!['status', 'enable'].includes(p.action)) throw error('module_disabled');
          value = { enabled: false, state: 'disabled', accounts: [] };
        } else {
          if (p.action === 'runtime') {
            switching = true;
            try {
              if (!p.enabled) { await runtime?.dispose(); runtime = undefined; }
              else if (!runtime) {
                if (!llm || !loader?.import) throw error('runtime_unavailable');
                let llmModule;
                try { llmModule = await loader.import('@deepseek-ai/dsh-llm'); }
                catch { throw error('runtime_unavailable'); }
                // Capability gate, not a version inference: account-bound
                // preparation must exist on both public host contracts.
                if (typeof llm.prepareCall !== 'function' || typeof llmModule.LlmAdapter?.prototype?.prepareCall !== 'function') throw error('runtime_unavailable');
                const { createCodexRuntime } = await import('./runtime.js');
                runtime = await createCodexRuntime({ accounts: service, llm, llmModule, path: config.catalogPath || path + '.catalog',
                  ...(config.fetch ? { fetch: config.fetch } : {}), resolveAttachments: () => owner.get('attachments'), resolveAgents: () => owner.get('agents'),
                  ...(config.clientVersion ? { clientVersion: config.clientVersion } : {}),
                });
              }
            } finally { switching = false; }
            value = await service.snapshot();
          }
          else if (p.action === 'speed' || p.action === 'setSpeed') {
            if (!runtime) throw error('module_disabled');
            value = p.action === 'speed' ? await runtime.speed(p.sessionId) : await runtime.setSpeed(p.sessionId, p.tier);
          }
          else if (p.action === 'configure' || p.action === 'catalog') {
            if (!runtime) throw error('module_disabled');
            if (p.action === 'configure') await runtime.configure(p.settings); else await runtime.invalidate();
            value = await service.snapshot();
          }
          else if (p.action === 'begin') value = await service.begin(p.account);
          else if (p.action === 'complete') value = await service.complete(p.callback);
          else if (p.action === 'cancel') value = await service.cancel();
          else if (p.action === 'refresh') value = await service.refresh(p.account);
          else if (p.action === 'remove') value = await service.remove(p.account);
          else if (p.action === 'default') value = await service.setDefault(p.account);
          else if (p.action === 'pause') value = await service.pause(p.account);
          else if (p.action === 'signOut') value = await service.signOut(p.account);
          else if (p.action === 'resume') value = await service.resume(p.account);
          else value = await service.snapshot();
          value = { enabled: true, ...value, runtimeAvailable: !!llm && !!loader, runtimeEnabled: !!runtime,
            ...(runtime && p.mode !== 'passive' && !['speed', 'setSpeed'].includes(p.action) ? { runtime: await runtime.snapshot() } : {}) };
        }
        return json({ type: 'server-response', rpcId, result: { ok: true, value } });
      } catch (failure) {
        const code = allowedErrors.has(failure.code) ? failure.code : 'service_unavailable';
        return rpcId ? json({ type: 'server-response', rpcId, result: { ok: false, error: { code, message: code, details: {} } } }) : Response.json({ error: code }, { status: 400 });
      }
    } });
  });
}
