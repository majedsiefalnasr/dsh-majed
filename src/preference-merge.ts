/**
 * Field-level intent merge shared by the host store (atomic update) and the browser editor.
 * Pure on purpose: it is bundled into the client, so it imports nothing.
 */
const own = (record: object, key: string): unknown => (Object.hasOwn(record, key) ? (record as Record<string, unknown>)[key] : undefined)
/** Plain data-property write: a `__proto__` model id must stay a key, never rewrite the prototype. */
const put = (record: object, key: string, value: unknown): void => {
  Object.defineProperty(record, key, { value, enumerable: true, writable: true, configurable: true })
}

/**
 * Apply only the fields this editor changed (`draft` against `original`) on top of `latest`,
 * including explicit deletions. Fields the editor did not touch keep `latest`'s value, so a
 * concurrent writer's change to them survives. Arrays and scalars are replaced as a unit.
 */
export function mergeIntent<T extends object>(latest: T, original: T, draft: T): T {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(latest)) put(result, key, own(latest, key))
  const keys = new Set([...Object.keys(original), ...Object.keys(draft)])
  for (const key of keys) {
    const old = own(original, key), next = own(draft, key)
    if (JSON.stringify(old) === JSON.stringify(next)) continue
    const fresh = own(result, key)
    if (next && typeof next === 'object' && !Array.isArray(next)) {
      put(result, key, mergeIntent(
        (fresh && typeof fresh === 'object' && !Array.isArray(fresh) ? fresh : {}) as object,
        (old && typeof old === 'object' && !Array.isArray(old) ? old : {}) as object,
        next,
      ))
    } else if (next === undefined) delete result[key]
    else put(result, key, next)
  }
  return result as T
}
