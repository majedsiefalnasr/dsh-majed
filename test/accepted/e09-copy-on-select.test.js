import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const source = await readFile(new URL('../../dist/client.js', import.meta.url), 'utf8');
const KEY = 'dsh-majed:settings:v1', h = React.createElement;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const settle = () => sleep(60); // the client debounces selection reads by 30 ms

// E09 (Q135): the built client is mounted in jsdom with its real Settings row,
// profile store and copy-on-select effect. Selection is a real jsdom Selection.
// The clipboard API, execCommand fallback and mobile selection handles are test
// doubles/absent: this is controlled evidence, not real browser, OS-permission,
// native-mobile or paired-remote clipboard behavior.
async function mount(t, { autoCopy = true, clipboard, execCommand = () => false } = {}) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><main></main><p id="page">Selectable page text</p></body></html>', { url: 'https://example.test', runScripts: 'outside-only', pretendToBeVisual: true });
  const { window } = dom, { document } = window, previous = new Map();
  for (const [key, value] of Object.entries({ window, document, IS_REACT_ACT_ENVIRONMENT: true })) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  if (autoCopy) window.localStorage.setItem(KEY, JSON.stringify({ autoCopy: true }));
  const writes = [], commands = [], live = [];
  // Count only the selection gestures the client listens for (React keeps its own listeners on the document).
  const WATCHED = new Set(['mouseup', 'dblclick', 'keyup']);
  const add = document.addEventListener.bind(document), remove = document.removeEventListener.bind(document);
  document.addEventListener = (type, fn, options) => { if (WATCHED.has(type)) live.push([type, fn]); add(type, fn, options); };
  document.removeEventListener = (type, fn, options) => { const i = live.findIndex(([t2, f2]) => t2 === type && f2 === fn); if (i >= 0) live.splice(i, 1); remove(type, fn, options); };
  if (clipboard) Object.defineProperty(window.navigator, 'clipboard', { configurable: true, value: { writeText: (text) => { writes.push(text); return clipboard(text); } } });
  document.execCommand = (name) => { commands.push(name); return execCommand(name); };
  const effects = [], registrations = new Map(), dictionaries = new Map();
  let plugin;
  const primitives = {
    Switch: ({ label, checked, onChange }) => h('button', { type: 'button', role: 'switch', 'aria-label': label, 'aria-checked': checked, onClick: () => onChange(!checked) }),
    Menu: 'menu',
  };
  window.__ModuleLoader__ = { load: (module) => { plugin = module.factory((name) => {
    if (name === 'react') return React;
    if (name === '@deepseek-ai/dsh-client-ui-primitives') return primitives;
    throw new Error(`Unexpected dependency: ${name}`);
  }); } };
  window.eval(source);
  const ctx = {
    effect(fn) { const stop = fn(); if (typeof stop === 'function') effects.push(stop); },
    locale: { register(ns, values) { dictionaries.set(ns, values); return () => dictionaries.delete(ns); }, bind: (ns) => (key) => dictionaries.get(ns).en[key] ?? key },
    slots: { inject(name, fn) { const stop = fn(); if (stop) effects.push(stop); }, register(meta, Component) { registrations.set(meta.id, Component); return () => registrations.delete(meta.id); } },
    uiWorkspace: { openSession() {} },
    connection: { rpc: { call() { throw new Error('copy on select must not dispatch host operations'); } } },
  };
  plugin.apply(ctx);
  const root = createRoot(document.querySelector('main'));
  await act(async () => root.render(h(registrations.get('majed-auto-copy'), { t: ctx.locale.bind('majed') })));
  let disposed = false;
  const dispose = async () => { if (!disposed) { disposed = true; await act(async () => { root.unmount(); effects.reverse().forEach((stop) => stop()); }); } };
  t.after(async () => { await dispose(); window.close(); for (const [key, descriptor] of previous) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } });
  const select = (node) => { const range = document.createRange(); range.selectNodeContents(node); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); };
  return { window, document, writes, listenerCount: () => live.length, commands, dispose, select,
    page: document.getElementById('page'),
    toast: () => document.querySelector('.majed-toast'),
    async release(node = document.getElementById('page')) { node.dispatchEvent(new window.MouseEvent('mouseup', { bubbles: true })); await settle(); },
    async toggle() { await act(async () => document.querySelector('[role="switch"]').click()); },
  };
}

test('a rejected clipboard write with a failing fallback reports an error, never success', async (t) => {
  const view = await mount(t, { clipboard: async () => { throw new Error('NotAllowedError'); } });
  view.select(view.page);
  await view.release();
  assert.deepEqual(view.writes, ['Selectable page text']);
  const toast = view.toast();
  assert.ok(toast.hasAttribute('data-show'));
  assert.equal(toast.textContent, 'Could not copy the selection');
  assert.equal(toast.getAttribute('role'), 'status');
  assert.equal(toast.getAttribute('aria-live'), 'polite');
});

test('success feedback appears only after the clipboard write resolves', async (t) => {
  let resolveWrite;
  const view = await mount(t, { clipboard: () => new Promise((resolve) => { resolveWrite = resolve; }) });
  view.select(view.page);
  await view.release();
  assert.deepEqual(view.writes, ['Selectable page text']);
  assert.equal(view.toast(), null, 'a pending write is not reported as copied');
  resolveWrite();
  await sleep(0);
  assert.equal(view.toast().textContent, 'Copied to clipboard');
  assert.ok(view.toast().hasAttribute('data-show'));
  assert.equal(view.toast().getAttribute('role'), 'status');
  assert.equal(view.toast().getAttribute('aria-live'), 'polite');
  assert.equal(view.commands.length, 0, 'the legacy fallback is not used after a successful write');
});

test('a rejected write is reported as copied only when the legacy fallback confirms success', async (t) => {
  const view = await mount(t, { clipboard: async () => { throw new Error('denied'); }, execCommand: () => true });
  view.select(view.page);
  await view.release();
  assert.deepEqual(view.commands, ['copy']);
  assert.equal(view.toast().textContent, 'Copied to clipboard');
});

test('without a clipboard API a failing fallback reports unsupported, a throwing one too', async (t) => {
  for (const execCommand of [() => false, () => { throw new Error('blocked'); }]) {
    const view = await mount(t, { execCommand });
    view.select(view.page);
    await view.release();
    assert.deepEqual(view.commands, ['copy']);
    assert.equal(view.toast().textContent, 'Copying is not available here');
    assert.ok(view.toast().hasAttribute('data-show'));
    assert.equal(view.toast().getAttribute('role'), 'status');
    await view.dispose();
  }
});

test('without a clipboard API a confirmed legacy fallback is reported as copied', async (t) => {
  const view = await mount(t, { execCommand: () => true });
  view.select(view.page);
  await view.release();
  assert.equal(view.toast().textContent, 'Copied to clipboard');
});

test('failure feedback does not leave the error state on a later success', async (t) => {
  let fail = true;
  const view = await mount(t, { clipboard: async () => { if (fail) throw new Error('denied'); } });
  view.select(view.page);
  await view.release();
  assert.equal(view.toast().getAttribute('data-tone'), 'error');
  fail = false;
  view.window.getSelection().removeAllRanges();
  await view.release();
  view.select(view.page.firstChild);
  const range = view.window.getSelection().getRangeAt(0);
  range.setEnd(view.page.firstChild, 10);
  await view.release();
  await sleep(0);
  assert.equal(view.toast().textContent, 'Copied to clipboard');
  assert.equal(view.toast().getAttribute('data-tone'), null);
});

test('excluded targets copy nothing and show nothing', async (t) => {
  const view = await mount(t, { clipboard: async () => {} });
  const { document } = view;
  const fixtures = [
    ['input', (el) => { el.value = 'draft prompt'; }], ['textarea', (el) => { el.value = 'draft prompt'; }],
  ];
  for (const [tag, fill] of fixtures) {
    const el = document.createElement(tag); fill(el); document.body.append(el);
    el.focus(); el.select();
    await view.release(el);
    el.remove();
  }
  const composer = document.createElement('div');
  composer.setAttribute('contenteditable', 'true'); composer.textContent = 'composer draft';
  Object.defineProperty(composer, 'isContentEditable', { value: true });
  document.body.append(composer);
  view.select(composer);
  await view.release(composer);
  const xterm = document.createElement('div'); xterm.className = 'xterm'; xterm.textContent = 'terminal output';
  document.body.append(xterm);
  view.select(xterm);
  await view.release(xterm);
  assert.deepEqual(view.writes, []);
  assert.deepEqual(view.commands, []);
  assert.equal(view.toast(), null);
});

test('collapsed and whitespace-only selections copy nothing and show nothing', async (t) => {
  const view = await mount(t, { clipboard: async () => {} });
  view.window.getSelection().removeAllRanges();
  await view.release();
  const blank = view.document.createElement('p'); blank.textContent = '   ';
  view.document.body.append(blank);
  view.select(blank);
  await view.release(blank);
  assert.deepEqual(view.writes, []);
  assert.equal(view.toast(), null);
});

test('an identical selection is not copied or announced twice', async (t) => {
  const view = await mount(t, { clipboard: async () => {} });
  view.select(view.page);
  await view.release();
  await view.release();
  assert.deepEqual(view.writes, ['Selectable page text']);
});

test('turning the setting off stops listening and later selections copy nothing', async (t) => {
  const view = await mount(t, { clipboard: async () => {} });
  assert.ok(view.listenerCount() > 0, 'enabled setting listens for selections');
  await view.toggle();
  assert.equal(view.listenerCount(), 0);
  view.select(view.page);
  await view.release();
  assert.deepEqual(view.writes, []);
  assert.equal(view.toast(), null);
  await view.toggle();
  assert.ok(view.listenerCount() > 0, 'turning it back on listens again');
});

test('disposal removes listeners and feedback, and a late result shows nothing', async (t) => {
  let resolveWrite;
  const view = await mount(t, { clipboard: () => new Promise((resolve) => { resolveWrite = resolve; }) });
  view.select(view.page);
  await view.release();
  await view.dispose();
  resolveWrite();
  await sleep(0);
  assert.equal(view.listenerCount(), 0);
  assert.equal(view.toast(), null);
  assert.equal(view.document.querySelector('style[data-majed-toast-style]'), null);
});

test('a visible toast is removed on disposal', async (t) => {
  const view = await mount(t, { clipboard: async () => {} });
  view.select(view.page);
  await view.release();
  assert.ok(view.toast());
  await view.dispose();
  assert.equal(view.toast(), null);
  assert.equal(view.document.querySelector('style[data-majed-toast-style]'), null);
});
