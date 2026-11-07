// Deprecated browser aliases. The monolithic client entry needs a live DSH page to exercise, so
// these assert the shipped source: new keys are written/read first, the retired ones are read-only fallbacks,
// and the old public hook is an alias of the new object.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LEGACY_GLOBAL, LEGACY_SETTINGS_KEY } from '../dist/legacy-names.js';

const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
const dist = readFileSync(
  new URL('../dist/client.js', import.meta.url),
  'utf8',
);

for (const [label, text] of [
  ['client.js', source],
  ['dist/client.js', dist],
])
  test(`source inspection ${label}: settings keys read new then legacy and write only the new key`, () => {
    assert.ok(text.includes(`'${LEGACY_SETTINGS_KEY}'`));
    assert.match(
      text,
      /localStorage\.getItem\(STORE_KEY\)\s*\|\|\s*localStorage\.getItem\(LEGACY_STORE_KEY\)/,
    );
    assert.ok(
      !/setItem\(LEGACY_STORE_KEY/.test(text),
      'legacy key never written',
    );
    assert.ok(
      !/removeItem\(LEGACY_STORE_KEY/.test(text),
      'legacy key never deleted',
    );
  });

for (const [label, text] of [
  ['client.js', source],
  ['dist/client.js', dist],
])
  test(`source inspection ${label}: the old global hook is a deprecated alias of __dshWaycraft`, () => {
    assert.ok(text.includes(`'${LEGACY_GLOBAL}'`));
    assert.match(text, /window\[LEGACY_GLOBAL\]\s*=\s*window\.__dshWaycraft/);
    assert.match(text, /delete window\[LEGACY_GLOBAL\]/);
  });
