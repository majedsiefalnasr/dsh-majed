import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import userEvent from '@testing-library/user-event';

const source = await readFile(new URL('../../dist/client.js', import.meta.url), 'utf8');
const KEY = 'dsh-majed:settings:v1';
const h = React.createElement;
// Built production client, public Settings registrations, real ReactDOM events,
// localStorage, CSSOM and MutationObserver. Presentation primitives are adapters,
// not installed native components; jsdom cannot prove glyphs or browser geometry.
async function mount(t, { stored, fallback = false, language = 'en' } = {}) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><main></main><aside id="chrome">Sidebar</aside><section data-chat-flow-kind="assistant-step"><p id="arabic">مرحبا بالعالم</p><p id="english">Hello world</p><p>المسار <code id="path">/tmp/example.js</code></p><pre id="command">npm test</pre></section><textarea id="draft">Keep this draft</textarea></body></html>', {
    url: 'https://example.test', runScripts: 'outside-only', pretendToBeVisual: true,
  });
  const { window } = dom, { document } = window;
  const previous = new Map();
  for (const [key, value] of Object.entries({ window, document, IS_REACT_ACT_ENVIRONMENT: true })) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const hostStyle = document.createElement('style');
  hostStyle.textContent = ':root{--dsw-font-s-14:400 14px/20px HostFont;--dsw-font-markdown:400 19px HostFont} #chrome{font-size:14px}';
  document.head.append(hostStyle);
  const chatStyle = document.createElement('style');
  chatStyle.dataset.pluginCss = 'AssistantMarkdown.module.css';
  chatStyle.textContent = '[data-chat-flow-kind] p{font-size:19px}';
  document.head.append(chatStyle);
  // jsdom 26's CSSOM drops !important on custom properties (unlike browsers).
  // Adapt priority bookkeeping only; values, declarations and observers stay real.
  const bodyStyle = document.body.style, priorities = new Map();
  const setProperty = bodyStyle.setProperty.bind(bodyStyle), removeProperty = bodyStyle.removeProperty.bind(bodyStyle);
  const getPriority = bodyStyle.getPropertyPriority.bind(bodyStyle);
  bodyStyle.setProperty = (name, value, priority = '') => {
    setProperty(name, value, priority);
    if (name.startsWith('--')) priorities.set(name, priority);
  };
  bodyStyle.getPropertyPriority = name => priorities.get(name) ?? getPriority(name);
  bodyStyle.removeProperty = name => { priorities.delete(name); return removeProperty(name); };
  document.body.style.setProperty('--dsw-font-family', 'InitialThemeFont');
  document.body.style.setProperty('--dsh-content-font-size', '19px');
  if (stored !== undefined) window.localStorage.setItem(KEY, typeof stored === 'string' ? stored : JSON.stringify(stored));
  window.localStorage.setItem('unrelated-profile-preference', 'keep');
  const primitives = fallback ? {} : {
    Switch: ({ label, checked, onChange }) => h('button', { type: 'button', role: 'switch', 'aria-label': label, 'aria-checked': checked, onClick: () => onChange(!checked) }),
    Menu: ({ open, anchor, selectedId, items, onSelect }) => h(React.Fragment, null, anchor,
      open && h('div', { role: 'menu' }, items.map(item => h('button', {
        key: item.id, type: 'button', role: 'menuitemradio', 'aria-checked': item.id === selectedId,
        onClick: () => onSelect(item.id),
      }, item.label)))),
  };
  const effects = [], registrations = new Map(), dictionaries = new Map(), calls = [];
  let plugin;
  window.__ModuleLoader__ = { load: module => { plugin = module.factory(name => {
    if (name === 'react') return React;
    if (name === '@deepseek-ai/dsh-client-ui-primitives') return primitives;
    throw new Error(`Unexpected dependency: ${name}`);
  }); } };
  window.eval(source);
  const ctx = {
    effect(effect) { const stop = effect(); if (typeof stop === 'function') effects.push(stop); },
    locale: { register(ns, values) { dictionaries.set(ns, values); return () => dictionaries.delete(ns); }, bind: ns => key => dictionaries.get(ns)[language][key] ?? key },
    slots: {
      inject(name, register) { const stop = register(); if (stop) effects.push(stop); },
      register(metadata, Component) { registrations.set(metadata.id, Component); return () => registrations.delete(metadata.id); },
    },
    connection: { rpc: { call(...args) { calls.push(args); throw new Error('E01 must not dispatch host operations'); } } },
  };
  plugin.apply(ctx);
  const root = createRoot(document.querySelector('main'));
  await act(async () => root.render(h(React.Fragment, null, ...['majed-ui-font-size', 'majed-font-source', 'majed-bidi'].map(id => h('section', { key: id, 'data-row': id }, h(registrations.get(id), { t: ctx.locale.bind('majed') }))))));
  let disposed = false;
  const dispose = async () => {
    if (disposed) return;
    disposed = true;
    await act(async () => { root.unmount(); effects.reverse().forEach(stop => stop()); });
  };
  t.after(async () => {
    await dispose(); dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  });
  const user = userEvent.setup({ document });
  const interact = fn => act(async () => fn());
  return { window, document, user, interact, dispose, calls,
    row: id => document.querySelector(`[data-row="majed-${id}"]`),
    button: label => [...document.querySelectorAll('button')].find(button => button.getAttribute('aria-label') === label),
    saved: () => JSON.parse(window.localStorage.getItem(KEY)),
    familyLabel: () => fallback ? document.querySelector('[data-row="majed-font-source"] select').selectedOptions[0].textContent : document.querySelector('[data-row="majed-font-source"] .majed-selector').textContent.replace(/▾$/, ''),
    async chooseFamily(label) {
      if (fallback) await interact(() => user.selectOptions(document.querySelector('[data-row="majed-font-source"] select'), label));
      else {
        await interact(() => user.click(document.querySelector('[data-row="majed-font-source"] .majed-selector')));
        await interact(() => user.click([...document.querySelectorAll('[role="menuitemradio"]')].find(item => item.textContent === label)));
      }
    },
  };
}

const retained = { uiFontSize: 18, fontSource: 'inter', bidi: false, notifyMode: 'off', notifyDone: false, notifyAction: false, accountMenu: false, autoCopy: false, autoApprove: { fixture: 'safe' } };

test('profile reload rehydrates selected appearance without leaking to another profile; disposal removes only owned changes', async t => {
  const first = await mount(t, { stored: { ...retained, bidi: true } });
  await first.chooseFamily('Roboto');
  const persisted = first.saved();
  assert.equal(persisted.fontSource, 'roboto');
  await first.dispose();
  assert.equal(first.document.body.style.getPropertyValue('--dsw-font-family'), 'InitialThemeFont');
  assert.equal(first.document.querySelector('[data-majed-appearance], [data-majed-ui-font], [data-majed-bidi], [data-majed-fontfaces], [data-dsh-rtl]'), null);
  assert.equal(first.document.body.style.getPropertyValue('--dsh-content-font-size'), '19px');
  await first.interact(async () => first.document.body.style.setProperty('--dsw-font-family', 'AfterDisposalFont'));
  assert.equal(first.document.body.style.getPropertyValue('--dsw-font-family'), 'AfterDisposalFont', 'disposed observer does not reapply overrides');
  assert.deepEqual(first.saved(), persisted, 'disposal does not erase preferences');

  const reload = await mount(t, { stored: persisted });
  assert.equal(reload.familyLabel(), 'Roboto');
  assert.equal(reload.row('ui-font-size').querySelector('.majed-value').textContent, '18');
  assert.match(reload.document.body.style.getPropertyValue('--dsw-font-family'), /^"Roboto Majed",/);
  assert.equal(reload.document.querySelector('#arabic').getAttribute('dir'), 'rtl');
  // Bundled Latin face declarations leave Arabic uncovered so native fallback can
  // render it. This proves the declared fallback contract, not actual glyphs.
  const faceRules = [...reload.document.querySelector('[data-majed-fontfaces]').sheet.cssRules];
  assert.ok(faceRules.length > 0);
  assert.ok(faceRules.every(rule => rule.style.getPropertyValue('unicode-range').split(',').every(range => {
    const [start, end = start] = range.trim().replace(/^U\+/i, '').split('-').map(value => Number.parseInt(value, 16));
    return 0x0645 < start || 0x0645 > end; // Arabic meem in the rendered fixture.
  })));
  assert.match(reload.document.body.style.getPropertyValue('--dsw-font-family'), /system-ui.*Arial, sans-serif/);
  await reload.dispose();
  const other = await mount(t);
  assert.equal(other.familyLabel(), 'DSH default');
  assert.equal(other.row('ui-font-size').querySelector('.majed-value').textContent, '14');
  assert.equal(other.window.localStorage.getItem(KEY), null);
});

test('invalid profile data falls back safely and localized reset labels resolve', async t => {
  const view = await mount(t, { stored: '{invalid', fallback: true, language: 'zh' });
  assert.equal(view.row('ui-font-size').querySelector('.majed-value').textContent, '14');
  assert.equal(view.row('font-source').querySelector('select').value, 'dsh');
  assert.equal(view.row('bidi').querySelector('input').checked, true);
  for (const label of ['重置应用界面字号', '重置应用字体', '重置双向文本']) {
    const reset = view.button(label);
    assert.ok(reset);
    assert.equal(reset.textContent, '重置');
    await view.interact(() => view.user.click(reset));
  }
  assert.equal(view.saved().uiFontSize, 14);
  assert.equal(view.saved().fontSource, 'dsh');
  assert.equal(view.saved().bidi, true);
});

test('size controls retain bounds, reset repeatedly by keyboard, and preserve chat/draft content', async t => {
  const view = await mount(t, { stored: retained, fallback: true });
  const increment = view.button('Increase app UI font size'), decrement = view.button('Decrease app UI font size');
  for (let i = 0; i < 4; i++) await view.interact(() => view.user.click(increment));
  assert.equal(view.saved().uiFontSize, 20);
  assert.equal(increment.disabled, true);
  for (let i = 0; i < 12; i++) await view.interact(() => view.user.click(decrement));
  assert.equal(view.saved().uiFontSize, 11);
  assert.equal(decrement.disabled, true);
  const reset = view.button('Reset app UI font size');
  reset.focus();
  await view.interact(() => view.user.keyboard('[Space][Enter]'));
  assert.equal(view.saved().uiFontSize, 14);
  assert.equal(view.document.querySelector('#draft').value, 'Keep this draft');
  assert.equal(view.document.querySelector('#path').textContent, '/tmp/example.js');
  assert.equal(view.document.body.style.getPropertyValue('--dsh-content-font-size'), '19px');
  assert.equal(view.document.querySelector('[data-majed-ui-font]').textContent, '');
});

test('family reset returns to the latest theme value after external theme changes while a family is selected', async t => {
  const view = await mount(t, { stored: retained });
  await view.interact(async () => {
    view.document.body.style.setProperty('--dsw-font-family', 'UpdatedThemeFont');
    view.document.body.style.setProperty('--dsh-claude-font-prose', 'UpdatedThemeProse', 'important');
  });
  assert.match(view.document.body.style.getPropertyValue('--dsw-font-family'), /^"Inter Majed",/);
  await view.interact(() => view.user.click(view.button('Reset app font')));
  assert.equal(view.document.body.style.getPropertyValue('--dsw-font-family'), 'UpdatedThemeFont');
  assert.equal(view.document.body.style.getPropertyValue('--dsh-claude-font-prose'), 'UpdatedThemeProse');
  assert.equal(view.document.body.style.getPropertyPriority('--dsh-claude-font-prose'), 'important');
  assert.deepEqual(view.saved(), { ...retained, fontSource: 'dsh' });
});

test('mounted size reset immediately restores 14 without resetting family, direction or other profile preferences', async t => {
  const view = await mount(t, { stored: retained });
  assert.equal(view.row('ui-font-size').querySelector('.majed-value').textContent, '18');
  const reset = view.button('Reset app UI font size');
  assert.ok(reset, 'size has an individually named reset action');
  reset.focus();
  await view.interact(() => view.user.keyboard('[Enter]'));
  assert.equal(view.row('ui-font-size').querySelector('.majed-value').textContent, '14');
  assert.deepEqual(view.saved(), { ...retained, uiFontSize: 14 });
  assert.equal(view.document.documentElement.style.getPropertyValue('--dsh-content-font-size'), '');
  assert.equal(view.document.body.style.getPropertyValue('--dsh-content-font-size'), '19px');
  assert.equal(view.window.getComputedStyle(view.document.querySelector('#arabic')).fontSize, '19px');
  assert.equal(view.document.querySelector('[data-majed-ui-font]').textContent, '');
  assert.match(view.document.body.style.getPropertyValue('--dsw-font-family'), /^"Inter Majed",/);
  assert.equal(view.document.querySelector('[data-majed-bidi]'), null);
  assert.equal(view.document.activeElement, reset);
  assert.equal(view.window.localStorage.getItem('unrelated-profile-preference'), 'keep');
  assert.deepEqual(view.calls, []);
});

for (const fallback of [false, true]) {
  test(`mounted family reset restores native theme immediately and preserves other settings (${fallback ? 'fallback' : 'primitive contract'})`, async t => {
    const view = await mount(t, { stored: retained, fallback });
    const reset = view.button('Reset app font');
    assert.ok(reset, 'font family has its own reset action');
    await view.interact(() => view.user.click(reset));
    assert.equal(view.familyLabel(), 'DSH default');
    assert.equal(view.document.body.style.getPropertyValue('--dsw-font-family'), 'InitialThemeFont');
    assert.equal(view.document.querySelector('[data-majed-fontfaces]'), null);
    assert.deepEqual(view.saved(), { ...retained, fontSource: 'dsh' });
    assert.match(view.document.querySelector('[data-majed-appearance]').textContent, /--majed-ui-d:4px/);
    assert.equal(view.document.querySelector('[data-majed-bidi]'), null);
    assert.equal(view.document.querySelector('#draft').value, 'Keep this draft');
    assert.deepEqual(view.calls, []);
  });
}

for (const fallback of [false, true]) {
  test(`mounted direction reset restores per-paragraph bidi and LTR code (${fallback ? 'fallback' : 'primitive contract'})`, async t => {
    const view = await mount(t, { stored: retained, fallback });
    const reset = view.button('Reset bidirectional text');
    assert.ok(reset, 'paragraph direction has its own reset action');
    await view.interact(() => view.user.click(reset));
    const control = view.row('bidi').querySelector('[role="switch"], input');
    assert.equal(fallback ? control.checked : control.getAttribute('aria-checked'), fallback ? true : 'true');
    assert.deepEqual(view.saved(), { ...retained, bidi: true });
    assert.equal(view.document.querySelector('#arabic').getAttribute('dir'), 'rtl');
    assert.equal(view.window.getComputedStyle(view.document.querySelector('#arabic')).direction, 'rtl');
    assert.equal(view.window.getComputedStyle(view.document.querySelector('#arabic')).unicodeBidi, 'isolate');
    assert.equal(view.window.getComputedStyle(view.document.querySelector('#english')).unicodeBidi, 'plaintext');
    for (const id of ['path', 'command']) {
      const computed = view.window.getComputedStyle(view.document.querySelector(`#${id}`));
      assert.equal(computed.direction, 'ltr');
      assert.equal(computed.unicodeBidi, 'isolate');
    }
    assert.equal(view.document.body.style.getPropertyValue('--dsh-content-font-size'), '19px');
    assert.match(view.document.body.style.getPropertyValue('--dsw-font-family'), /^"Inter Majed",/);
    assert.deepEqual(view.calls, []);
  });
}
