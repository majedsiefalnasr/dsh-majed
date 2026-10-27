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

test('Settings slice uses native body and heading tokens, modal overflow guard, narrow viewport stacking', () => {
  assert.match(source, /\.majed-management\{[^}]*font:var\(--dsw-font-s-14\)/, 'Manager body selects native Settings typography rather than inheriting an unspecified slot parent');
  assert.match(source, /\.majed-management__title\{[^}]*font:var\(--dsw-font-m-18\)/, 'Manager heading uses a token defined by native DSH');
  assert.ok(!source.includes('--dsw-font-s-18'), 'the nonexistent s-18 token cannot silently invalidate the heading font');
  assert.ok(source.includes('.majed-management__title'), 'Settings section title element rendered');
  assert.ok(source.includes('overflow:auto'), 'modal overflow guard on Settings section');
  assert.ok(source.includes('@media (max-width:'), 'narrow viewport stacking media query');
});
