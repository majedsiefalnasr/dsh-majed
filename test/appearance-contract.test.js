import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../client.js', import.meta.url), 'utf8');

test('Majed appearance retains browser-local preferences and native font tokens', () => {
  assert.ok(source.includes("const STORE_KEY = 'dsh-majed:settings:v1'"));
  assert.ok(source.includes("'--dsw-font-family'"));
  assert.ok(source.includes('font:var(--dsw-font-s-14)'));
  assert.ok(source.includes("style.setProperty(name, stack, 'important')"));
});

test('token scaling stays additive and separate from chat typography', () => {
  assert.ok(source.includes('calc(${m[1]}px + var(--majed-ui-d))'));
  assert.ok(source.includes('const TOKEN_RE = /(--dsw-font-(?!markdown|family)'));
  assert.ok(source.includes('return lines.length ? `body{${lines.join(\'\')}}`'));
  assert.ok(source.includes('s.uiFontSize - UI_BASE_PX'));
});

test('appearance reacts to lazily loaded manager styles and cleans up', () => {
  assert.ok(source.includes('headObserver.observe(document.head, { childList: true })'));
  assert.ok(source.includes("n.addEventListener('load', sheetLoaded, { once: true })"));
  assert.ok(source.includes("sheet.removeEventListener('load', sheetLoaded)"));
  assert.ok(source.includes('headObserver.disconnect(); bodyObserver.disconnect()'));
});

test('Settings slice visual contract: 18px heading, modal overflow guard, narrow viewport stacking', () => {
  assert.ok(source.includes('font:var(--dsw-font-s-18)'), '18px typography used for Settings section heading');
  assert.ok(source.includes('.majed-management__title'), 'Settings section title element rendered');
  assert.ok(source.includes('overflow:auto'), 'modal overflow guard on Settings section');
  assert.ok(source.includes('@media (max-width:'), 'narrow viewport stacking media query');
});
