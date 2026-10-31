import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import React from 'react';
import { create, act } from 'react-test-renderer';
import { readFile } from 'node:fs/promises';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
async function load(name, browser = { addEventListener() {}, removeEventListener() {} }, document = {}) {
  const source = await readFile(new URL(`../src/${name}.tsx`, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  const jsx = await import('react/jsx-runtime');
  vm.runInNewContext(compiled, { exports, require: name => name === 'react' ? React : name === 'react/jsx-runtime' ? jsx : {}, window: browser, document });
  return exports;
}
test('lightbox focuses close, traps Tab, closes on Escape and restores opener focus', async () => {
  const listeners = new Map();
  let restored = 0, focused = 0;
  const { MessageImage } = await load('ImageGallery', { addEventListener(key, fn) { listeners.set(key, fn); }, removeEventListener(key) { listeners.delete(key); } }, { activeElement: { focus() { restored++; } } });
  const labels = { image: 'Image', open: 'Open', openNamed: name => name, loading: 'Loading', loadFailed: 'Retry', lightbox: { dialog: 'Preview', close: 'Close' } };
  let renderer;
  try {
    await act(async () => { renderer = create(React.createElement(MessageImage, { attachment: { attachmentId: 'fixture', width: 100, height: 100 }, variant: 'single', labels, load: async () => 'data:image/png;base64,fixture' }), { createNodeMock: element => element.type === 'button' ? { focus() { focused++; } } : {} }); });
    await act(async () => renderer.root.findByType('button').props.onClick());
    assert.equal(focused, 1);
    assert.equal(renderer.root.findByProps({ role: 'dialog' }).props['aria-modal'], true);
    let prevented = false;
    await act(async () => listeners.get('keydown')({ key: 'Tab', preventDefault() { prevented = true; } }));
    assert.equal(prevented, true);
    await act(async () => listeners.get('keydown')({ key: 'Escape' }));
    assert.equal(renderer.root.findAllByProps({ role: 'dialog' }).length, 0);
    assert.equal(restored, 1);
  } finally { if (renderer) await act(async () => renderer.unmount()); }
});
test('decoded thumbnail failure exposes retry and a new component instance reloads persisted references', async () => {
  const { MessageImage } = await load('ImageGallery');
  const attachment = { attachmentId: 'persisted-fixture', width: 100, height: 100 };
  const labels = { image: 'Image', open: 'Open', openNamed: name => name, loading: 'Loading', loadFailed: 'Retry', lightbox: { dialog: 'Preview', close: 'Close' } };
  let renderer, calls = 0;
  const props = { attachment, variant: 'single', labels, load: async ref => { assert.equal(ref.attachmentId, attachment.attachmentId); calls++; return 'data:image/png;base64,fixture'; } };
  try {
    await act(async () => { renderer = create(React.createElement(MessageImage, props)); });
    await act(async () => renderer.root.findByType('img').props.onError());
    assert.equal(renderer.root.findByType('button').children[0], 'Retry');
    await act(async () => renderer.root.findByType('button').props.onClick());
    assert.equal(calls, 2);
    await act(async () => renderer.unmount());
    await act(async () => { renderer = create(React.createElement(MessageImage, props)); });
    assert.equal(calls, 3);
    await act(async () => renderer.root.findByType('button').props.onClick());
    await act(async () => renderer.root.findByProps({ role: 'dialog' }).props.onClick());
    assert.equal(renderer.root.findAllByProps({ role: 'dialog' }).length, 0);
    await act(async () => renderer.root.findByType('button').props.onClick());
    await act(async () => renderer.root.findAllByType('button').at(-1).props.onClick());
    assert.equal(renderer.root.findAllByProps({ role: 'dialog' }).length, 0);
  } finally { if (renderer) await act(async () => renderer.unmount()); }
});

test('image retry copy is parameter-free in both supported locales', async () => {
  for (const locale of ['en', 'ar']) {
    const dictionary = JSON.parse(await readFile(new URL(`../locale/${locale}.json`, import.meta.url), 'utf8'));
    assert.doesNotMatch(dictionary.subscriptions.imageLoadFailed, /\{[^}]+\}/);
  }
});
test('media thumbnail uses DSH typography tokens and failure retry remains usable', async () => {
  const { MessageImage } = await load('ImageGallery');
  let renderer, calls = 0;
  const labels = { image: 'Image', open: 'Open', openNamed: name => name, loading: 'Loading', loadFailed: 'Retry image', lightbox: { dialog: 'Preview', close: 'Close' } };
  try {
    await act(async () => { renderer = create(React.createElement(MessageImage, { attachment: { attachmentId: 'fixture', width: 100, height: 100 }, variant: 'single', labels, load: async () => { calls++; throw new Error('fixture'); } })); });
    const retry = renderer.root.findByType('button');
    assert.equal(retry.props.style.font, 'var(--dsw-font-s-12)');
    await act(async () => retry.props.onClick());
    assert.equal(calls, 2);
  } finally { if (renderer) await act(async () => renderer.unmount()); }
});
