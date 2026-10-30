// Adapted from V1ki/dsh-plugin-subscriptions v0.9.12 (b802311) test/client-command.spec.ts, MIT; see src/PROVENANCE.md.
// Dispositions: the second locale string is Arabic (the reference used Chinese).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fastCommandDescription } from '../../src/speed/fast-command.js'

test('/fast description is a callable locale resolver', () => {
  let locale = 'commandFast'
  const description = fastCommandDescription(() => locale)
  assert.equal(description(), 'commandFast')
  locale = 'تبديل مستوى السرعة'
  assert.equal(description(), 'تبديل مستوى السرعة')
})
