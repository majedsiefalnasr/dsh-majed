// Adapted from V1ki/dsh-plugin-subscriptions v0.9.12 (b802311) test/account-manager-ui.spec.ts, MIT; see src/PROVENANCE.md.
// Dispositions: pure helpers moved to src/settings/account-preferences.ts. `mergeLatestAccounts` is deliberately
// stronger than the reference (field-intent merge with an `original` snapshot, ded9f33 remediation), so the
// reference "save latest, not the old draft" expectations are asserted with the editor's unchanged original
// and extended with intent cases. Copy checks read the owned locale JSON (ar replaces the reference zh).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { accountModelRows, accountPoolSelection, mergeAccountChanges, mergeIntent, mergeLatestAccounts } from '../../src/settings/account-preferences.js'

const models = [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }]
test('account pool defaults include newly discovered models; [] includes none', () => {
  assert.deepEqual([...accountPoolSelection({}, models)], ['a', 'b'])
  assert.deepEqual([...accountPoolSelection({ poolModels: [] }, models)], [])
  assert.deepEqual([...accountPoolSelection({ poolModels: ['a'] }, models)], ['a'])
})
test('saved unavailable model IDs remain editable without inventing discovered models', () => {
  assert.deepEqual(accountModelRows({ key: 'personal', label: 'Personal', models: [] }, { poolModels: ['gone'] }), [
    { id: 'gone', name: 'gone', unavailable: true },
  ])
})
test('model editor saves latest accounts, not its old draft, including removal', () => {
  const draft = { visibleModels: ['a'], accounts: { personal: { alias: 'Old' } } }
  const original = { visibleModels: ['b'], accounts: { personal: { alias: 'Old' } } }
  assert.deepEqual(mergeLatestAccounts(draft, { accounts: { personal: { alias: 'New', poolEnabled: false } } }, original), {
    visibleModels: ['a'], accounts: { personal: { alias: 'New', poolEnabled: false } },
  })
  assert.deepEqual(mergeLatestAccounts(draft, {}, original), { visibleModels: ['a'] }, 'an account removed elsewhere stays removed when this editor did not touch it')
  assert.deepEqual(mergeLatestAccounts(draft, { accounts: { gone: { alias: 'X' } } }, { ...original, accounts: {} }).accounts, { gone: { alias: 'X' }, personal: { alias: 'Old' } })
  assert.equal(draft.accounts.personal.alias, 'Old')
})
test('field intent: only the editor-changed fields win over concurrent saves; explicit deletions apply', () => {
  const original = { visibleModels: ['a'], contextWindows: { a: 100, b: 200 }, tools: { web_search: true } }
  const draft = { visibleModels: ['a'], contextWindows: { a: 150, b: 200 }, tools: { web_search: false } }
  const latest = { visibleModels: ['a', 'b'], contextWindows: { a: 100, b: 250 }, tools: { web_search: true, image_generate: false } }
  assert.deepEqual(mergeIntent(latest, original, draft), {
    visibleModels: ['a', 'b'], contextWindows: { a: 150, b: 250 }, tools: { web_search: false, image_generate: false },
  })
  assert.deepEqual(mergeIntent({ displayName: 'X' }, { displayName: 'X' }, {}), {}, 'an explicit deletion removes the latest value')
  assert.deepEqual(mergeIntent({ displayName: 'Y' }, {}, {}), { displayName: 'Y' }, 'untouched fields follow latest')
})
test('account manager preserves latest other settings and untouched accounts', () => {
  const latest = { visibleModels: [], tools: { image_generate: false }, contextWindows: { a: 1000 },
    accounts: { work: { alias: 'Work' }, personal: { alias: 'Old' } } }
  assert.deepEqual(mergeAccountChanges(latest, { personal: { poolEnabled: false, independentEntry: true, poolModels: [] } }), {
    ...latest, accounts: { work: { alias: 'Work' }, personal: { poolEnabled: false, independentEntry: true, poolModels: [] } },
  })
  assert.equal(latest.accounts.personal.alias, 'Old')
})
test('account manager has complete copy in both locales and explicitly limits isolation claims', () => {
  const read = (name: string) => (JSON.parse(readFileSync(new URL(`../../../locale/${name}.json`, import.meta.url), 'utf8')) as { subscriptions: Record<string, string> }).subscriptions
  const en = read('en'), ar = read('ar')
  const keys = Object.keys(en).filter(key => key.startsWith('accounts'))
  assert.equal(keys.length, Object.keys(ar).filter(key => key.startsWith('accounts')).length)
  assert.ok(keys.length >= 19)
  for (const key of keys) {
    assert.ok(en[key]?.length, `en ${key}`)
    assert.ok(ar[key]?.length, `ar ${key}`)
  }
  assert.match(en.accountsHint, /only to LLM routing/)
  assert.match(en.accountsIndependentHint, /no fallback/)
  assert.deepEqual(mergeIntent({ contextWindows: { a: 1, b: 2 } }, { contextWindows: { a: 1, b: 2 } }, { contextWindows: { a: 1 } }), { contextWindows: { a: 1 } }, 'the editor deleting a context window removes it')
})
