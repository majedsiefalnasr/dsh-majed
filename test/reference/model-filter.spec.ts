import { test } from 'node:test'
import assert from 'node:assert/strict'
// Ported from V1ki/dsh-plugin-subscriptions v0.9.12 (b802311) test/model-filter.spec.ts, MIT; see src/PROVENANCE.md.
// Disposition: imports retargeted to src/settings/model-filter.ts; locale checks read the owned locale JSON and
// assert Arabic script instead of the reference's Chinese; every logic case is kept verbatim.
import { readFileSync } from 'node:fs'
import { modelEditorNotice, modelEditorState, modelListState, savedModelIds } from '../../src/settings/model-filter.js'

const locale = (name: string) => (JSON.parse(readFileSync(new URL(`../../../locale/${name}.json`, import.meta.url), 'utf8')) as { subscriptions: Record<string, string> }).subscriptions
const en = locale('en'), zh = locale('ar')

test('a provider without rows reports provider-empty, not an empty filter result', () => {
  assert.equal(modelListState(0, 0), 'provider-empty')
})

test('a query that matches nothing keeps the existing filter message', () => {
  assert.equal(modelListState(3, 0), 'filter-empty')
})

test('matches render rows, including the single-match and all-match cases', () => {
  assert.equal(modelListState(3, 1), 'rows')
  assert.equal(modelListState(3, 3), 'rows')
})

test('the empty-provider check is the FIRST branch, so a query cannot outrank it', () => {
  // Same input as the first case on purpose: what this pins is the ORDER of the two
  // checks. Swapping them (asking 'did the query match?' first) turns the reported
  // symptom back on — an empty provider would print the filter message again.
  assert.equal(modelListState(0, 0), 'provider-empty')
  // The signature cannot express 'a query outranks an empty provider' any other way:
  // `matched` can never exceed `total`, so the only overlapping input is (0, 0).
})

test('saved visibility and display names are rows too, so they are never swallowed', () => {
  assert.deepEqual(savedModelIds(['a'], { b: 'Bee' }), ['a', 'b'])
  assert.deepEqual(savedModelIds(['a', 'a'], undefined), ['a'])
  assert.deepEqual(savedModelIds(undefined, undefined), [])
  // The editor feeds discovered + saved into the total: with a saved row (and a matching
  // query) the editor must show rows, not the empty-provider notice.
  const discovered: string[] = []
  const saved = savedModelIds(['saved-model'], undefined)
  assert.equal(modelListState(discovered.length + saved.length, saved.length), 'rows')
  assert.equal(modelListState(discovered.length + saved.length, 0), 'filter-empty')
  assert.equal(modelListState(discovered.length + saved.length, saved.length + saved.length), 'rows')
})

test('the notice names the reason the payload proves, not a guess', () => {
  // No account connected at all.
  assert.equal(modelEditorNotice([]), 'noAccount')
  // Accounts exist but every discovery failed or timed out: retry, do not tell them to log in.
  assert.equal(modelEditorNotice([{ key: 'a', label: 'A', models: [], unavailable: true }]), 'discoveryFailed')
  assert.equal(
    modelEditorNotice([
      { key: 'a', label: 'A', models: [], unavailable: true },
      { key: 'b', label: 'B', models: [], unavailable: true },
    ]),
    'discoveryFailed',
  )
  // A connected account answered (even with nothing in it): neutral copy, not "log in".
  assert.equal(modelEditorNotice([{ key: 'a', label: 'A', models: [] }]), 'noModels')
  assert.equal(
    modelEditorNotice([
      { key: 'a', label: 'A', models: [], unavailable: true },
      { key: 'b', label: 'B', models: [] },
    ]),
    'noModels',
  )
})

test('saved subagent speeds keep undiscovered models editable without duplicating rows', () => {
  const saved = savedModelIds(undefined, undefined, { 'saved-codex': 'fast' })
  assert.deepEqual(saved, ['saved-codex'])
  assert.equal(modelEditorState({ discovered: 0, saved: saved.length, matched: saved.length, accounts: [] }).listState, 'rows')
  assert.deepEqual(savedModelIds(['shared'], { shared: 'Shared' }, { shared: 'standard', extra: 'fast' }), ['shared', 'extra'])
})

test('the combined decision counts saved rows and picks the honest notice', () => {
  // Nothing discovered, nothing saved: no rows, and the reason is "no account yet".
  assert.deepEqual(modelEditorState({ discovered: 0, saved: 0, matched: 0, accounts: [] }), {
    listState: 'provider-empty',
    noticeKey: 'modelDefaultsNoAccount',
  })
  // Saved rows keep the editor useful even with an empty catalog.
  assert.deepEqual(modelEditorState({ discovered: 0, saved: 2, matched: 2, accounts: [] }), {
    listState: 'rows',
    noticeKey: 'modelDefaultsNoAccount',
  })
  // Discovered rows plus a query that excludes them keeps the filter message.
  assert.deepEqual(modelEditorState({ discovered: 3, saved: 0, matched: 0, accounts: [{ key: 'a', label: 'A', models: [] }] }), {
    listState: 'filter-empty',
    noticeKey: 'modelDefaultsNoModels',
  })
  // Every connected account failed discovery: say so instead of asking them to log in.
  assert.deepEqual(
    modelEditorState({ discovered: 0, saved: 0, matched: 0, accounts: [{ key: 'a', label: 'A', models: [], unavailable: true }] }),
    { listState: 'provider-empty', noticeKey: 'modelDefaultsDiscoveryFailed' },
  )
})
test('every notice has copy in both dictionaries, and the Arabic one is Arabic', () => {
  const keys = ['modelDefaultsNoModels', 'modelDefaultsNoAccount', 'modelDefaultsDiscoveryFailed'] as const
  for (const key of keys) {
    assert.ok(en[key].length > 0, key)
    assert.ok(zh[key].length > 0, key)
    assert.match(zh[key], /[\u0600-\u06ff]/, key + ' must be translated, not left in English')
  }
  assert.match(en.modelDefaultsNoAccount, /account/i)
  assert.match(en.modelDefaultsDiscoveryFailed, /refresh/i)
})
