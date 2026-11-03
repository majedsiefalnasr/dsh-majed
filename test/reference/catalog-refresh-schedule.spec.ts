/** MIT b802311 shared scheduler/cache tests; composition adapted in owned host fixtures. */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ModelCatalogCache } from '../../src/providers/common.js'
import { CATALOG_REFRESH_INTERVAL_MS, startCatalogRefresh } from '../../src/providers/catalog-refresh.js'
const settle = () => new Promise(resolve => setImmediate(resolve))
const now = 1_800_000_000_000

function saved(ageMs: number) {
  const models = [{ id: 'cached', name: 'Cached' }]
  return new ModelCatalogCache({ load: async () => ({ at: now - ageMs, models }), save: async () => {}, clear: async () => {} })
}

test('opening and resolving stale cached models does not trigger automatic discovery', async () => {
  const models = [{ id: 'cached', name: 'Cached' }]
  const cache = new ModelCatalogCache({ load: async () => ({ at: 1, models }), save: async () => {}, clear: async () => {} })
  let requests = 0
  const fetcher = async () => { requests++; return models }
  for (let i = 0; i < 20; i++) {
    assert.deepEqual(await cache.get(fetcher, true), models)
    assert.deepEqual(await cache.resolve(fetcher), models)
  }
  assert.equal(requests, 0, 'menu and capability reads must not start a refresh between scheduled runs')
})

test('startup skips a catalog younger than five minutes, then refreshes after one hour', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now })
  const cache = saved(60_000)
  let requests = 0
  const fetcher = async () => { requests++; return [{ id: 'new', name: 'New' }] }
  const stop = startCatalogRefresh(() => cache.get(fetcher))
  try {
    await settle()
    assert.equal(requests, 0)
    t.mock.timers.tick(59 * 60_000)
    for (let i = 0; i < 20; i++) await cache.get(fetcher, true)
    assert.equal(requests, 0)
    t.mock.timers.tick(60_000)
    await settle()
    assert.equal(requests, 1)
    assert.equal((await cache.resolve(fetcher))?.[0].id, 'new')
  } finally { stop() }
})

test('stale startup refreshes immediately and disposal stops future network work', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now })
  const cache = saved(6 * 60_000)
  let requests = 0
  let signal!: AbortSignal
  const stop = startCatalogRefresh(async next => {
    signal = next
    return cache.get(async () => { requests++; return [{ id: 'fresh', name: 'Fresh' }] })
  })
  await settle()
  assert.equal(requests, 1)
  stop()
  assert.equal(signal.aborted, true)
  t.mock.timers.tick(2 * CATALOG_REFRESH_INTERVAL_MS)
  await settle()
  assert.equal(requests, 1)
})

test('failed background refresh preserves cached selection and waits an hour before retrying', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now })
  const cache = saved(6 * 60_000)
  let requests = 0, failures = 0
  const fetcher = async () => { requests++; throw new Error('offline') }
  const stop = startCatalogRefresh(() => cache.get(fetcher), () => { failures++ })
  try {
    await settle()
    assert.equal(requests, 1)
    t.mock.timers.tick(59 * 60_000)
    for (let i = 0; i < 20; i++) assert.equal((await cache.resolve(fetcher))?.[0].id, 'cached')
    assert.equal(requests, 1)
    t.mock.timers.tick(60_000)
    await settle()
    assert.equal(requests, 2)
    assert.equal(failures, 2)
    cache.invalidate()
    await cache.get(async () => { requests++; return [{ id: 'manual', name: 'Manual' }] })
    assert.equal(requests, 3, 'manual refresh is immediate instead of waiting for the timer')
  } finally { stop() }
})

test('slow refresh runs never overlap and the next interval starts after completion', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now })
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  let runs = 0
  const stop = startCatalogRefresh(async () => { runs++; await gate })
  try {
    t.mock.timers.tick(2 * CATALOG_REFRESH_INTERVAL_MS)
    await settle()
    assert.equal(runs, 1)
    release()
    await settle()
    t.mock.timers.tick(CATALOG_REFRESH_INTERVAL_MS - 1)
    await settle()
    assert.equal(runs, 1)
    t.mock.timers.tick(1)
    await settle()
    assert.equal(runs, 2)
  } finally { release(); stop() }
})
