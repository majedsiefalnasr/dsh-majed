// Ticket #135: the Antigravity Settings card renders in English and Arabic and drives the owned RPC with fake data only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
const source = await readFile(new URL('../src/antigravity-card.ts', import.meta.url), 'utf8');
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
  const shared = { visibleUsageWindows: (provider, windows = [], models) => windows.filter(w => models === undefined || !w.scope || models.includes(w.scope)), ProviderAccountManager: 'ManageFixture', controlCss: '', styles: new Proxy({}, { get: () => ({}) }) };
  vm.runInNewContext(compiled, { exports, require: () => shared, window: { open }, setInterval: () => 1, clearInterval() {}, navigator: { clipboard: { writeText: async code => calls.push({ copied: code }) } }, Date, Error, JSON, Object });
  const rpc = { async call(_, method, payload) {
    calls.push({ method, payload });
    const endpoint = method.split('.').pop();
    if (respond) { const result = await respond(endpoint, payload); if (result) return result; }
    if (endpoint === 'status') return { ok: true, value: { providers: { antigravity: status } } };
    if (endpoint === 'usage') return { ok: true, value: { supported: true, windows: [{ kind: 'session', usedPercent: 40, resetsAt: 2000000000000 }] } };
    return { ok: true, value: { ok: true } };
  } };
  const Card = exports.createAntigravityCard(React, {}, rpc, key => dictionary[key]);
  const render = () => { cursor = 0; view = Card(); const pending = effects; effects = []; pending.forEach(fn => { const cleanup = fn(); if (cleanup) cleanups.push(cleanup); }); return view; };
  const settle = async () => { for (let frame = 0; frame < 4; frame++) { for (let i = 0; i < 12; i++) await Promise.resolve(); render(); } };
  const nodes = (node = view) => [node, ...(node?.children?.flat(Infinity).flatMap(child => typeof child === 'object' && child ? nodes(child) : []) ?? [])];
  const text = node => node?.tag === 'style' ? '' : typeof node === 'string' || typeof node === 'number' ? String(node) : node?.children?.flat(Infinity).map(text).join(' ') ?? '';
  return { render, settle, nodes, textOf: text, unmount: () => cleanups.reverse().forEach(fn => fn()), text: () => text(view), calls, dictionary,
    click(key) { const button = nodes().find(node => node.tag === 'button' && text(node) === dictionary[key]); assert.ok(button, `button ${key}`); button.props.onClick(); },
    has(key) { return nodes().some(node => node.tag === 'button' && text(node) === dictionary[key]); } };
}
for (const locale of ['en', 'ar']) test(`Antigravity card renders filtered quotas and routes Manage in ${locale}`, async () => {
  const page = fixture(locale, { busy:false, visibleModels:['shown-model'], accounts:[{key:'fixture',account:'fixture@example.invalid',isDefault:true}] }, async endpoint => endpoint === 'usage' ? {ok:true,value:{supported:true,windows:[{kind:'other',scope:'shown-model',usedPercent:25},{kind:'other',scope:'hidden-model',usedPercent:80}]}} : undefined);
  page.render(); await page.settle();
  assert.match(page.text(), /Google Antigravity/);
  assert.match(page.text(), /shown-model/);
  assert.equal(page.text().includes('hidden-model'), false);
  assert.ok(page.text().includes(page.dictionary.usageTitle));
  assert.ok(page.nodes().some(n=>n.tag==='bdi' && n.props.dir==='ltr'));
  page.click('accountsManage'); await page.settle();
  assert.equal(page.nodes().find(n=>n.tag==='ManageFixture').props.provider,'antigravity');
  page.unmount();
});
