import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../src/codex-card.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function fixture(locale, status, respond) {
  const dictionary = JSON.parse(requireText(locale)).subscriptions;
  let cursor = 0, effects = [], view;
  const slots = [], calls = [], cleanups = [];
  const React = {
    createElement: (tag, props, ...children) => ({ tag, props: props ?? {}, children }),
    useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }]; },
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial }; },
    useEffect(fn, deps) { const index = cursor++; if (!slots[index] || deps.some((value, i) => value !== slots[index][i])) { slots[index] = deps; effects.push(fn); } },
  };
  const exports = {};
  vm.runInNewContext(compiled, { exports, window: { open: () => ({ location: {}, close() {} }) }, setInterval: () => 1, clearInterval() {}, Date, Error });
  const rpc = { async call(_, method, payload) {
    calls.push({ method, payload });
    const endpoint = method.split('.').pop();
    if (respond) { const result = await respond(endpoint, payload); if (result) return result; }
    if (endpoint === 'status') return { ok: true, value: { providers: { codex: status } } };
    if (endpoint === 'usage') return { ok: true, value: { supported: true, windows: [{ kind: 'weekly', usedPercent: 95, resetsAt: 2000000000000 }], resetCredits: [{ id: 'credit' }] } };
    if (endpoint === 'prepareReset') return { ok: true, value: { ticket: 'ticket', expiresAt: Date.now() + 60000 } };
    return { ok: true, value: { ok: true } };
  } };
  const Card = exports.createCodexCard(React, {}, rpc, key => dictionary[key]);
  const render = () => { cursor = 0; view = Card(); const pending = effects; effects = []; pending.forEach(fn => { const cleanup = fn(); if (cleanup) cleanups.push(cleanup); }); return view; };
  const settle = async () => { for (let frame = 0; frame < 4; frame++) { for (let i = 0; i < 12; i++) await Promise.resolve(); render(); } };
  const nodes = (node = view) => [node, ...(node?.children?.flat(Infinity).flatMap(child => typeof child === 'object' && child ? nodes(child) : []) ?? [])];
  const text = node => node?.tag === 'style' ? '' : typeof node === 'string' || typeof node === 'number' ? String(node) : node?.children?.flat(Infinity).map(text).join(' ') ?? '';
  return { render, settle, nodes, textOf: text, unmount: () => cleanups.reverse().forEach(fn => fn()), text: () => text(view), calls, click(key) { const button = nodes().find(node => node.tag === 'button' && text(node) === dictionary[key]); assert.ok(button, key); assert.equal(!!button.props.disabled, false, key); button.props.onClick(); }, dictionary };
}
import { readFileSync } from 'node:fs';
function requireText(locale) { return readFileSync(new URL(`../locale/${locale}.json`, import.meta.url), 'utf8'); }
for (const locale of ['en', 'ar']) test(`reference hierarchy groups provider identity, account controls and usage in ${locale}`, async () => {
  const page = fixture(locale, { busy: false, accounts: [{ key: 'a', account: 'fixture@example.test', isDefault: true }], clientVersion: { version: '1.2.3', source: 'fallback' } });
  page.render(); await page.settle();
  const group = name => page.nodes().find(n => n.props['data-majed-codex-part'] === name);
  assert.ok(group('header'), 'provider header groups status dot, name and CLI version');
  assert.match(page.textOf(group('header')), /Codex.*1.2.3/);
  assert.ok(group('account-header'), 'compact star and logout share account identity row');
  assert.equal(page.nodes(group('account-header')).filter(n => n.tag === 'button').length, 2);
  assert.ok(group('usage-header'), 'usage label, plan and refresh share a header');
  assert.ok(page.nodes(group('usage-header')).some(n => n.tag === 'button'));
  assert.equal(page.nodes().find(n => n.tag === 'summary').children.some(n => n?.tag === 'svg'), true);
  assert.ok(group('actions'), 'login actions follow account rows');
});

test('collision card has concise unavailable status without duplicating section warning', async () => {
  const page = fixture('en', { busy: false, accounts: [] }, endpoint => endpoint === 'status' ? { ok: true, value: { providers: { codex: { busy: false, accounts: [] } }, registrationError: 'fixture collision' } } : undefined);
  page.render(); await page.settle();
  assert.ok(!page.text().includes(page.dictionary.coexistence));
  assert.ok(page.text().includes(page.dictionary.providerUnavailable));
});

for (const locale of ['en', 'ar']) test(`Codex account actions and guarded reset render and operate in ${locale}`, async () => {
  const page = fixture(locale, { busy: false, accounts: [{ key: 'a', account: 'fixture@example.test', plan: 'plus', expiresAt: 2000000000000, isDefault: true }], clientVersion: { version: '1.2.3', source: 'fallback' } });
  page.render(); await page.settle();
  assert.match(page.text(), /fixture@example.test/); assert.match(page.text(), /plus/); assert.match(page.text(), /★/); assert.match(page.text(), /1.2.3/);
  page.click('logout'); page.render();
  assert.equal(page.calls.some(call => call.method.endsWith('.logout')), false);
  page.click('cancel'); page.render();
  page.click('refreshUsage'); await page.settle();
  assert.match(page.text(), /95%/); assert.equal(page.nodes().find(node => node.props.role === 'progressbar').props['aria-valuenow'], 95);
  page.click('useReset'); await page.settle();
  const confirm = page.nodes().find(node => node.tag === 'button' && node.children.includes(page.dictionary.confirm));
  assert.equal(confirm.props.disabled, true);
  assert.equal(page.calls.some(call => call.method.endsWith('.consumeReset')), false);
  page.nodes().find(node => node.props.type === 'checkbox').props.onChange({ target: { checked: true } }); page.render();
  page.click('confirm'); await page.settle();
  assert.equal(page.calls.filter(call => call.method.endsWith('.consumeReset')).length, 1);
  assert.equal(page.calls.find(call => call.method.endsWith('.consumeReset')).payload.ticket, 'ticket');
});


test('reference reset affordance explains weekly guard without preparing a spend', async () => {
  const page = fixture('en', { busy: false, accounts: [{ key: 'a' }] }, endpoint => endpoint === 'usage' ? { ok: true, value: { supported: true, windows: [{ kind: 'weekly', usedPercent: 79, resetsAt: 2000000000000 }], resetCredits: [{ id: 'fake' }] } } : undefined);
  page.render(); await page.settle();
  const use = page.nodes().find(n => n.tag === 'button' && n.children.includes(page.dictionary.useReset));
  assert.equal(use.props['aria-disabled'], true);
  assert.equal(use.props.title, page.dictionary.resetGuard);
  use.props.onClick(); await page.settle();
  assert.equal(page.calls.some(c => c.method.endsWith('.prepareReset')), false);
});

test('confirmed logout retains its own label and sends only the chosen account', async () => {
  const page = fixture('en', { busy: false, accounts: [{ key: 'a', account: 'fake@example.test' }] });
  page.render(); await page.settle(); page.click('logout'); page.render();
  const dialog = page.nodes().find(n => n.props.role === 'dialog');
  const logout = page.nodes(dialog).find(n => n.tag === 'button' && n.children.includes(page.dictionary.logout));
  assert.ok(logout); logout.props.onClick(); await page.settle();
  assert.equal(page.calls.find(c => c.method.endsWith('.logout')).payload.account, 'a');
});

test('automatic card loading reuses fresh tracker usage while explicit refresh bypasses it', async () => {
  const { PoolUsageTracker } = await import('../dist/providers/pool-usage.js');
  let fetches = 0;
  const tracker = new PoolUsageTracker(() => async () => {
    fetches++;
    return { supported: true, windows: [{ kind: 'weekly', usedPercent: fetches }] };
  });
  await tracker.snapshotFor('codex', 'a');
  const page = fixture('en', { busy: false, accounts: [{ key: 'a' }] }, async (endpoint, payload) => {
    if (endpoint === 'usage') return { ok: true, value: await tracker.snapshotFor('codex', payload.account, payload.force === true) };
  });
  page.render(); await page.settle();
  assert.equal(fetches, 1, 'automatic mount must reuse the fresh shared snapshot');
  assert.equal(page.calls.find(c => c.method.endsWith('.usage')).payload.force, false);
  page.click('refreshUsage'); await page.settle();
  assert.equal(fetches, 2, 'manual refresh must fetch a new snapshot');
  assert.equal(page.calls.filter(c => c.method.endsWith('.usage')).at(-1).payload.force, true);
  page.unmount();
});

test('usage loads once per appearance, failures do not auto-retry, removed accounts lose cached state', async () => {
  const status = { busy: false, accounts: [{ key: 'a' }] };
  const page = fixture('en', status, endpoint => endpoint === 'usage' ? { ok: false, error: { message: 'fixture usage failure' } } : undefined);
  page.render(); await page.settle(); await page.settle();
  assert.equal(page.calls.filter(c => c.method.endsWith('.usage')).length, 1, JSON.stringify({ calls: page.calls, text: page.text() }));
  assert.match(page.text(), /fixture usage failure/);
  status.accounts = [];
  page.click('addAccount'); await page.settle(); await page.settle();
  assert.doesNotMatch(page.text(), /fixture usage failure/);
  status.accounts = [{ key: 'a' }];
  page.click('login'); await page.settle(); await page.settle();
  assert.equal(page.calls.filter(c => c.method.endsWith('.usage')).length, 2);
});

test('remounted busy card recovers host authorization metadata and supports paste and cancel', async () => {
  const status = { busy: true, pendingAuth: { authorizeUrl: 'https://auth.example.test/authorize' }, accounts: [] };
  const page = fixture('en', status, endpoint => {
    if (endpoint === 'cancel' || endpoint === 'manual') status.busy = false;
  });
  page.render(); await page.settle();
  assert.equal(page.nodes().find(n => n.tag === 'a').props.href, status.pendingAuth.authorizeUrl);
  page.nodes().find(n => n.tag === 'input').props.onChange({ target: { value: 'fake-callback' } }); page.render();
  page.click('submitCallback'); await page.settle();
  assert.equal(status.busy, false);
  status.busy = true;
  const remount = fixture('en', status, endpoint => { if (endpoint === 'cancel') status.busy = false; });
  remount.render(); await remount.settle(); remount.click('cancelLogin'); await remount.settle();
  assert.equal(status.busy, false);
});

for (const locale of ['en', 'ar']) test(`reset credits expose expiry, usability and prepared context in ${locale}`, async () => {
  const expiry = 2000000000000;
  const page = fixture(locale, { accounts: [{ key: 'a' }], busy: false }, endpoint => {
    if (endpoint === 'usage') return { ok: true, value: { supported: true, windows: [{ kind: 'weekly', usedPercent: 87, resetsAt: expiry }], resetCredits: [{ id: 'expired', expiresAt: 1 }, { id: 'unknown' }, { id: 'future', expiresAt: expiry }] } };
    if (endpoint === 'prepareReset') return { ok: true, value: { ticket: 'context-ticket', expiresAt: Date.now() + 60000, weeklyUsedPercent: 87, creditExpiresAt: expiry } };
  });
  page.render(); await page.settle();
  assert.ok(page.text().includes(page.dictionary.creditExpiryUnknown));
  assert.ok(page.text().includes(page.dictionary.creditExpired));
  assert.ok(page.text().includes(new Date(expiry).toLocaleString()));
  page.click('useReset'); await page.settle();
  assert.match(page.text(), /87%/);
  const dialog = page.nodes().find(n => n.props.role === 'dialog');
  assert.ok(page.nodes(dialog).some(n => n.children?.includes(new Date(expiry).toLocaleString())));
  assert.equal(page.nodes().find(n => n.tag === 'button' && n.children.includes(page.dictionary.confirm)).props.disabled, true);
});


test('automatic usage and manual refresh share one in-flight request', async () => {
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  const page = fixture('en', { accounts: [{ key: 'a' }] }, endpoint => endpoint === 'usage' ? pending : undefined);
  page.render(); await page.settle();
  page.click('refreshUsage'); await page.settle();
  assert.equal(page.calls.filter(c => c.method.endsWith('.usage')).length, 1);
  release({ ok: true, value: { windows: [{ kind: 'weekly', usedPercent: 33 }] } });
  await page.settle(); assert.match(page.text(), /33%/);
});

test('start, unmount, remount on the same auth controller, paste then cancel frees host busy', async () => {
  const { mkdtemp } = await import('node:fs/promises');
  process.env.DSH_HOME = await mkdtemp('/tmp/majed-t129/remount-');
  const { CodexAuthController } = await import('../dist/auth/controller.js');
  const { OAuthFlowManager } = await import('../dist/auth/oauth-flow.js');
  const controller = new CodexAuthController(new OAuthFlowManager(), () => {});
  const saved = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('fake exchange rejected'); };
  const respond = async (endpoint, payload) => {
    if (endpoint === 'status') return { ok: true, value: { providers: { codex: await controller.status() } } };
    if (endpoint === 'login') return { ok: true, value: await controller.login() };
    if (endpoint === 'manual') controller.manual(payload.input);
    if (endpoint === 'cancel') controller.cancel();
    return { ok: true, value: {} };
  };
  try {
    for (const action of ['submitCallback', 'cancelLogin']) {
      const first = fixture('en', {}, respond); first.render(); await first.settle(); first.click('login');
      await new Promise(resolve => setImmediate(resolve)); await first.settle();
      assert.equal((await controller.status()).busy, true); first.unmount();
      const next = fixture('en', {}, respond); next.render();
      for (let i = 0; i < 10; i++) await new Promise(resolve => setImmediate(resolve));
      await next.settle();
      const link = next.nodes().find(n => n.tag === 'a'); assert.ok(link);
      assert.deepEqual(Object.keys((await controller.status()).pendingAuth), ['authorizeUrl']);
      if (action === 'submitCallback') {
        next.nodes().find(n => n.tag === 'input').props.onChange({ target: { value: 'fake-code' } }); next.render();
      }
      next.click(action); await new Promise(resolve => setImmediate(resolve)); await next.settle(); next.unmount();
      assert.equal((await controller.status()).busy, false);
    }
  } finally { controller.dispose(); globalThis.fetch = saved; }
});
