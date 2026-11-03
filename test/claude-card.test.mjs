// Ticket #132: the Claude Settings card renders in English and Arabic and drives the owned RPC with fake data only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
const source = await readFile(new URL('../src/claude-card.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const requireText = locale => readFileSync(new URL(`../locale/${locale}.json`, import.meta.url), 'utf8');
function fixture(locale, status, respond, open = () => ({ location: {}, close() {} })) {
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
  const shared = { ProviderAccountManager: 'ManageFixture', controlCss: '', styles: new Proxy({}, { get: () => ({}) }) };
  vm.runInNewContext(compiled, { exports, require: () => shared, window: { open }, setInterval: () => 1, clearInterval() {}, Date, Error, JSON, Object });
  const rpc = { async call(_, method, payload) {
    calls.push({ method, payload });
    const endpoint = method.split('.').pop();
    if (respond) { const result = await respond(endpoint, payload); if (result) return result; }
    if (endpoint === 'status') return { ok: true, value: { providers: { claude: status } } };
    if (endpoint === 'usage') return { ok: true, value: { supported: true, windows: [{ kind: 'session', usedPercent: 40, resetsAt: 2000000000000 }] } };
    return { ok: true, value: { ok: true } };
  } };
  const Card = exports.createClaudeCard(React, {}, rpc, key => dictionary[key]);
  const render = () => { cursor = 0; view = Card(); const pending = effects; effects = []; pending.forEach(fn => { const cleanup = fn(); if (cleanup) cleanups.push(cleanup); }); return view; };
  const settle = async () => { for (let frame = 0; frame < 4; frame++) { for (let i = 0; i < 12; i++) await Promise.resolve(); render(); } };
  const nodes = (node = view) => [node, ...(node?.children?.flat(Infinity).flatMap(child => typeof child === 'object' && child ? nodes(child) : []) ?? [])];
  const text = node => node?.tag === 'style' ? '' : typeof node === 'string' || typeof node === 'number' ? String(node) : node?.children?.flat(Infinity).map(text).join(' ') ?? '';
  return { render, settle, nodes, textOf: text, unmount: () => cleanups.reverse().forEach(fn => fn()), text: () => text(view), calls, dictionary,
    click(key) { const button = nodes().find(node => node.tag === 'button' && text(node) === dictionary[key]); assert.ok(button, `button ${key}`); button.props.onClick(); },
    has(key) { return nodes().some(node => node.tag === 'button' && text(node) === dictionary[key]); } };
}
const loginCalls = page => page.calls.filter(call => call.method.endsWith('.login'));

for (const locale of ['en', 'ar']) test(`Claude card groups identity, account controls and usage with its own data attributes in ${locale}`, async () => {
  const page = fixture(locale, { busy: false, accounts: [{ key: 'a', account: 'fixture@example.test', plan: 'max', isDefault: true, expiresAt: 2000000000000 }], clientVersion: { version: '2.1.0', source: 'fallback' } });
  page.render(); await page.settle();
  assert.equal(page.nodes().some(n => n.props['data-majed-claude-card']), true);
  assert.equal(page.nodes().some(n => n.props['data-majed-codex-card'] || n.props['data-majed-codex-part']), false, 'no Codex attributes leak into the Claude card');
  const group = name => page.nodes().find(n => n.props['data-majed-claude-part'] === name);
  assert.match(page.textOf(group('header')), /Claude.*2\.1\.0/);
  assert.equal(page.nodes(group('account-header')).filter(n => n.tag === 'button').length, 2);
  assert.match(page.text(), /fixture@example.test/); assert.match(page.text(), /max/); assert.match(page.text(), /40%/);
  assert.ok(page.text().includes(page.dictionary.connected));
  // With a connected account both ways of adding another one are offered, and each carries its translated label.
  assert.equal(page.has('addAccountOAuth'), true); assert.equal(page.has('addAccountKeychain'), true);
  assert.notEqual(page.dictionary.addAccountOAuth, 'addAccountOAuth');
  if (locale === 'ar') assert.match(page.dictionary.addAccountKeychain, /[\u0600-\u06ff]/);
  assert.ok(page.calls.every(call => call.payload.provider === 'claude'), 'every call names the claude provider');
});

test('with no account the single login button asks for the import-first path (no method)', async () => {
  const page = fixture('en', { busy: false, accounts: [] });
  page.render(); await page.settle();
  assert.ok(page.text().includes(page.dictionary.notLoggedIn));
  assert.equal(page.has('addAccountOAuth'), false);
  page.click('login'); await page.settle();
  assert.deepEqual(loginCalls(page).map(call => JSON.parse(JSON.stringify(call.payload))), [{ provider: 'claude' }]);
});

test('the account buttons send the explicit method values the server validates', async () => {
  const page = fixture('en', { busy: false, accounts: [{ key: 'a' }] });
  page.render(); await page.settle();
  page.click('addAccountOAuth'); await page.settle();
  page.click('addAccountKeychain'); await page.settle();
  assert.deepEqual(loginCalls(page).map(call => call.payload.method), ['oauth', 'keychain']);
});

test('an imported login (empty authorize URL) opens no window and refreshes status', async () => {
  const opened = [];
  const status = { busy: false, accounts: [] };
  const page = fixture('en', status, endpoint => { if (endpoint === 'login') { status.accounts = [{ key: 'a', account: 'imported@example.test' }]; return { ok: true, value: { authorizeUrl: '' } }; } },
    (...args) => { opened.push(args); return null; });
  page.render(); await page.settle(); page.click('login'); await page.settle();
  assert.deepEqual(opened, []);
  assert.match(page.text(), /imported@example.test/);
  assert.equal(page.nodes().some(n => n.tag === 'a'), false);
});

test('browser authorization opens the returned URL after the RPC with noopener, then cancel clears it', async () => {
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  const status = { busy: false, accounts: [] };
  const opened = [];
  const authorizeUrl = 'https://authorization.example.test/claude?state=fake';
  const page = fixture('en', status, endpoint => { if (endpoint === 'login') return pending; if (endpoint === 'cancel') status.busy = false; },
    (...args) => { opened.push(args); return null; });
  try {
    page.render(); await page.settle(); page.click('login'); await page.settle();
    assert.deepEqual(opened, [], 'no early or blank window');
    status.busy = true; release({ ok: true, value: { authorizeUrl } }); await page.settle();
    assert.deepEqual(opened, [[authorizeUrl, '_blank', 'noopener']]);
    const link = page.nodes().find(n => n.tag === 'a');
    assert.equal(link.props.href, authorizeUrl); assert.equal(link.props.rel, 'noopener noreferrer');
    assert.ok(page.text().includes(page.dictionary.loginProgress));
    page.click('cancelLogin'); await page.settle();
    assert.equal(page.calls.filter(c => c.method.endsWith('.cancel')).length, 1);
    assert.equal(opened.length, 1);
  } finally { release({ ok: false, error: { message: 'cleanup' } }); page.unmount(); }
});

test('a failed login shows its message and opens nothing; an unmounted card does not navigate', async () => {
  const opened = [];
  const failing = fixture('en', { busy: false, accounts: [] }, endpoint => endpoint === 'login' ? { ok: false, error: { message: 'no Claude Code credentials found' } } : undefined, (...args) => { opened.push(args); return null; });
  failing.render(); await failing.settle(); failing.click('login'); await failing.settle();
  assert.equal(failing.nodes().find(n => n.props.role === 'alert').children[0], 'no Claude Code credentials found');
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  const page = fixture('en', { busy: false, accounts: [] }, endpoint => endpoint === 'login' ? pending : undefined, (...args) => { opened.push(args); return null; });
  page.render(); await page.settle(); page.click('login'); await page.settle();
  page.unmount(); release({ ok: true, value: { authorizeUrl: 'https://authorization.example.test/late' } });
  for (let i = 0; i < 20; i++) await Promise.resolve();
  assert.deepEqual(opened, []);
});

test('a collision shows the concise Claude unavailable status and disables login', async () => {
  const page = fixture('en', { busy: false, accounts: [] }, endpoint => endpoint === 'status'
    ? { ok: true, value: { providers: { claude: { busy: false, accounts: [] } }, claudeRegistrationError: 'Claude registration is unavailable' } } : undefined);
  page.render(); await page.settle();
  assert.ok(page.text().includes(page.dictionary.claudeProviderUnavailable));
  assert.equal(page.nodes().find(n => n.tag === 'button' && page.textOf(n) === page.dictionary.login).props.disabled, true);
});

test('a status without a Claude entry (component older than the card) still renders as not logged in', async () => {
  const page = fixture('en', undefined, endpoint => endpoint === 'status' ? { ok: true, value: { providers: { codex: { accounts: [] } } } } : undefined);
  page.render(); await page.settle();
  assert.ok(page.text().includes(page.dictionary.notLoggedIn));
});

test('confirmed logout waits for confirmation and sends only the chosen account', async () => {
  const page = fixture('en', { busy: false, accounts: [{ key: 'a', account: 'fake@example.test' }] });
  page.render(); await page.settle(); page.click('logout'); page.render();
  assert.equal(page.calls.some(c => c.method.endsWith('.logout')), false, 'logout waits for confirmation');
  const dialog = page.nodes().find(n => n.props.role === 'dialog');
  page.nodes(dialog).find(n => n.tag === 'button' && n.children.includes(page.dictionary.logout)).props.onClick(); await page.settle();
  assert.deepEqual(JSON.parse(JSON.stringify(page.calls.find(c => c.method.endsWith('.logout')).payload)), { provider: 'claude', account: 'a' });
});

test('the card does not render reset-credit controls (Codex only) and Manage opens the Claude manager', async () => {
  const page = fixture('en', { busy: false, accounts: [{ key: 'a' }] });
  page.render(); await page.settle();
  assert.equal(page.nodes().some(n => n.tag === 'details' && /reset/.test(n.props.className ?? '')), false);
  page.click('accountsManage'); page.render();
  const manager = page.nodes().find(n => n.tag === 'ManageFixture');
  assert.equal(manager.props.provider, 'claude');
});
