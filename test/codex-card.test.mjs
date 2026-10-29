import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../src/codex-card.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
function fixture(locale, status) {
  const dictionary = JSON.parse(requireText(locale)).subscriptions;
  let cursor = 0, effects = [], view;
  const slots = [], calls = [];
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
    if (endpoint === 'status') return { ok: true, value: { providers: { codex: status } } };
    if (endpoint === 'usage') return { ok: true, value: { supported: true, windows: [{ kind: 'weekly', usedPercent: 95, resetsAt: 2000000000000 }], resetCredits: [{ id: 'credit' }] } };
    if (endpoint === 'prepareReset') return { ok: true, value: { ticket: 'ticket', expiresAt: Date.now() + 60000 } };
    return { ok: true, value: { ok: true } };
  } };
  const Card = exports.createCodexCard(React, {}, rpc, key => dictionary[key]);
  const render = () => { cursor = 0; view = Card(); const pending = effects; effects = []; pending.forEach(fn => fn()); return view; };
  const settle = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); render(); };
  const nodes = (node = view) => [node, ...(node?.children?.flat(Infinity).flatMap(child => typeof child === 'object' && child ? nodes(child) : []) ?? [])];
  const text = node => typeof node === 'string' || typeof node === 'number' ? String(node) : node?.children?.flat(Infinity).map(text).join(' ') ?? '';
  return { render, settle, nodes, text: () => text(view), calls, click(key) { const button = nodes().find(node => node.tag === 'button' && text(node) === dictionary[key]); assert.ok(button, key); assert.equal(!!button.props.disabled, false, key); button.props.onClick(); }, dictionary };
}
import { readFileSync } from 'node:fs';
function requireText(locale) { return readFileSync(new URL(`../locale/${locale}.json`, import.meta.url), 'utf8'); }
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
