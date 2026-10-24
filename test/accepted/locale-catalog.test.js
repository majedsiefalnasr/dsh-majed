import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createBaselineHarness } from './helpers/baseline-client-harness.js';

const source = await readFile(new URL('../../dist/client.js', import.meta.url), 'utf8');

// Public locale boundary fixture, based on the native addLanguage contract:
// dictionaries do not publish catalog entries, duplicates reject, fallbacks must
// exist, and each disposer can withdraw only its exact owned definition.
function createCatalog() {
  const catalog = new Map([
    ['zh', Object.freeze({ id: 'zh', label: '中文', fallback: 'en' })],
    ['en', Object.freeze({ id: 'en', label: 'English' })],
  ]);
  let revision = 0;
  const snapshot = () => ({ active: 'en', revision, locales: [...catalog.values()] });
  return {
    getLocale: snapshot,
    getSnapshot: snapshot,
    setLocale() { assert.fail('catalog registration must not write the locale preference'); },
    addLanguage(input) {
      const { id, label, fallback } = input;
      assert.equal(typeof id, 'string'); assert.equal(typeof label, 'string');
      const key = id.toLowerCase();
      assert.equal(catalog.has(key), false, `locale "${id}" is already registered`);
      assert.ok(catalog.has(fallback.toLowerCase()), 'fallback must already be registered');
      const definition = Object.freeze({ id, label, fallback });
      catalog.set(key, definition); revision++;
      return () => {
        if (catalog.get(key) !== definition) return;
        catalog.delete(key); revision++;
      };
    },
  };
}
function applyWithCatalog(harness, catalog) {
  harness.apply((plugin, context) => plugin.apply({
    ...context, locale: { ...context.locale, ...catalog },
  }));
}

test('client publishes selectable Arabic separately from dictionaries and withdraws it on cleanup', t => {
  const catalog = createCatalog();
  const baseline = catalog.getLocale().locales;
  const harness = createBaselineHarness(source);
  t.after(() => harness.dispose());
  applyWithCatalog(harness, catalog);
  assert.ok(harness.dictionaries.get('majed').ar, 'Arabic dictionary is registered');
  assert.deepEqual(catalog.getLocale().locales, [
    ...baseline, { id: 'ar', label: 'العربية', fallback: 'en' },
  ], 'dictionary registration alone must not count as a selectable language');
  assert.equal(catalog.getLocale().active, 'en');
  assert.equal(harness.storage.size, 0);
  assert.ok(harness.registrations.has('majed-skills'), 'existing Settings remain registered');
  harness.dispose();
  assert.deepEqual(catalog.getLocale().locales, baseline);
  assert.equal(harness.dictionaries.size, 0);
  assert.equal(harness.registrations.size, 0);
});

test('older locale APIs fail closed without blocking baseline Settings or writing preferences', t => {
  for (const catalog of [
    {},
    { getSnapshot: () => ({ locales: [] }), addLanguage() { assert.fail('English fallback is absent'); } },
    { getSnapshot: () => ({}), addLanguage() { assert.fail('catalog is unavailable'); } },
    { getSnapshot: () => ({ locales: [{ id: 'en' }] }) },
  ]) {
    const harness = createBaselineHarness(source);
    t.after(() => harness.dispose());
    assert.doesNotThrow(() => applyWithCatalog(harness, catalog));
    assert.ok(harness.registrations.has('majed-skills'));
    assert.ok(harness.registrations.has('majed-ui-font-size'));
    assert.ok(harness.dictionaries.get('majed').ar);
    assert.equal(harness.storage.size, 0);
  }
});

test('client respects another plugin\'s Arabic definition without taking disposal ownership', t => {
  const catalog = createCatalog();
  const stop = catalog.addLanguage({ id: 'AR', label: 'Existing Arabic', fallback: 'en' });
  t.after(stop);
  const baseline = catalog.getSnapshot().locales;
  const harness = createBaselineHarness(source);
  t.after(() => harness.dispose());
  applyWithCatalog(harness, catalog);
  assert.deepEqual(catalog.getSnapshot().locales, baseline);
  harness.dispose();
  assert.deepEqual(catalog.getSnapshot().locales, baseline, 'foreign language survives plugin disposal');
});
