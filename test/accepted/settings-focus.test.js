import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import userEvent from '@testing-library/user-event';

const source = await readFile(new URL('../../dist/client.js', import.meta.url), 'utf8');

// Public Settings registration mounted with real ReactDOM and DOM focus/events.
// DSH's presentation-only Switch is an adapter with its controlled button contract;
// this is not the installed DSH runtime or a live browser acceptance test.
async function mount(t, { fallback = false } = {}) {
  const dom = new JSDOM('<button id="account">Account</button><main></main>', {
    url: 'https://example.test', runScripts: 'outside-only',
  });
  const previous = new Map();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true })) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const h = React.createElement;
  // Installed Switch (BD in index-CN7NIWNw.js) explicitly destructures these
  // props; notably it does NOT forward arbitrary aria-* props to its button.
  const primitives = fallback ? {} : { Switch: ({ label, checked, disabled = false, title, className, onChange }) =>
    h('button', { type: 'button', role: 'switch', 'aria-label': label, 'aria-checked': checked, disabled, title, className, onClick: () => onChange(!checked) }, h('span')) };
  let plugin;
  dom.window.__ModuleLoader__ = { load: module => { plugin = module.factory(name => {
    if (name === 'react') return React;
    if (name === '@deepseek-ai/dsh-client-ui-primitives') return primitives;
    throw new Error(`Unexpected dependency: ${name}`);
  }); } };
  dom.window.eval(source);
  const pending = [], calls = [], sections = new Map(), dictionaries = new Map();
  const ctx = {
    effect(effect, name) { if (name === 'dsh-majed: dictionaries') effect(); },
    locale: {
      register(ns, values) { dictionaries.set(ns, values); },
      bind: ns => key => dictionaries.get(ns).en[key] ?? key,
    },
    slots: {
      inject(name, register) { if (name === 'settings.section') register(); },
      register(metadata, Component) { sections.set(metadata.id, Component); return () => {}; },
    },
    connection: { rpc: { call(channel, endpoint, payload, signal) {
      calls.push({ channel, endpoint, payload, signal });
      return new Promise((resolve, reject) => pending.push({ resolve, reject }));
    } } },
  };
  plugin.apply(ctx);
  const root = createRoot(dom.window.document.querySelector('main'));
  const render = async module => act(async () => root.render(h(sections.get(`majed-${module}`), { t: ctx.locale.bind('majed') })));
  await render('mcp');
  const settle = async (enabled = false, failure) => act(async () => {
    const request = pending.shift();
    if (failure) request.reject(new Error(failure));
    else request.resolve({ ok: true, value: { module: calls.at(-1).payload.module, enabled, state: enabled ? 'ready' : 'disabled' } });
  });
  const user = userEvent.setup({ document: dom.window.document });
  const interact = fn => act(async () => fn());
  t.after(async () => {
    await act(async () => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  return { document: dom.window.document, root, calls, pending, settle, user, interact, render,
    control: () => dom.window.document.querySelector('[role="switch"], input'),
    refresh: () => dom.window.document.querySelector('.majed-management-refresh'),
  };
}

for (const fallback of [false, true]) {
  const kind = fallback ? 'checkbox fallback' : 'native Switch contract';
  test(`keyboard readiness toggle keeps focus and next Tab reaches Refresh (${kind})`, async t => {
    const view = await mount(t, { fallback });
    assert.equal(view.control().disabled, true, 'unknown initial readiness is not actionable');
    await view.settle();
    const control = view.control();
    control.focus();
    await view.interact(() => view.user.keyboard('[Space]'));
    assert.equal(view.calls.length, 2);
    assert.equal(control.disabled, false, 'pending readiness must not disable the focused control');
    assert.equal(view.document.activeElement, control);
    assert.equal(control.closest('[role="group"]').getAttribute('aria-disabled'), 'true');
    await view.settle(true);
    assert.equal(control.closest('[role="group"]').getAttribute('aria-disabled'), 'false');
    assert.equal(view.document.activeElement, control);
    assert.equal(fallback ? control.checked : control.getAttribute('aria-checked'), fallback ? true : 'true');
    await view.interact(() => view.user.tab());
    assert.equal(view.document.activeElement, view.refresh());
    control.focus();
    await view.interact(() => view.user.keyboard('[Space]'));
    assert.equal(view.calls.length, 3, 'a completed request must not block the next toggle');
    assert.equal(view.calls.at(-1).payload.enabled, false);
    await view.settle(false);
    assert.equal(fallback ? control.checked : control.getAttribute('aria-checked'), fallback ? false : 'false');
  });

  test(`pending readiness is single-flight without stealing moved focus (${kind})`, async t => {
    const view = await mount(t, { fallback });
    await view.settle();
    view.control().focus();
    await view.interact(() => view.user.keyboard('[Space][Space][Space]'));
    assert.equal(view.calls.length, 2, 'repeat toggles cannot overlap the pending RPC');
    assert.equal(view.calls[1].payload.enabled, true);
    assert.equal(view.calls[1].signal.aborted, false);
    await view.interact(() => view.user.tab());
    assert.equal(view.document.activeElement, view.refresh(), 'Refresh remains in the pending tab order');
    await view.interact(() => view.user.keyboard('[Enter][Space]'));
    assert.equal(view.calls.length, 2, 'Refresh cannot overlap a toggle');
    await view.settle(true);
    assert.equal(view.document.activeElement, view.refresh(), 'completion cannot steal moved focus');
    await view.interact(() => view.user.keyboard('[Enter]'));
    assert.equal(view.calls.length, 3, 'Refresh becomes actionable after settlement');
    assert.equal(view.calls[2].payload.enabled, undefined, 'Refresh is a read-only status request');
    assert.equal(view.document.activeElement, view.refresh());
    await view.settle(false, 'transport failure: HTTP 403');
    assert.equal(view.document.activeElement, view.refresh(), 'error settlement retains Refresh focus');
    assert.ok(view.document.querySelector('[role="alert"]'));
    assert.equal(fallback ? view.control().checked : view.control().getAttribute('aria-checked'), fallback ? true : 'true', 'failed requests retain confirmed readiness');
  });
}

for (const action of ['navigation', 'unmount']) {
  test(`late toggle response cannot steal focus after ${action}`, async t => {
    const view = await mount(t);
    await view.settle();
    view.control().focus();
    await view.interact(() => view.user.keyboard('[Space]'));
    const oldControl = view.control(), signal = view.calls.at(-1).signal;
    if (action === 'navigation') await view.render('hooks');
    else await act(async () => view.root.unmount());
    const account = view.document.getElementById('account');
    account.focus();
    assert.equal(signal.aborted, true, 'leaving the section aborts its request');
    // Resolve the old request even if the transport ignored its abort signal.
    await view.settle(true);
    assert.equal(view.document.activeElement, account);
    assert.equal(oldControl.isConnected, false);
    if (action === 'navigation') {
      assert.equal(view.control().getAttribute('aria-checked'), 'false');
      await view.settle();
      assert.equal(view.document.activeElement, account);
    }
  });
}
