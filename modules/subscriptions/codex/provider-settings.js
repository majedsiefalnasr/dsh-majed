// Adapted from V1ki/dsh-plugin-subscriptions v0.9.11 src/provider-settings.ts.
// MIT, commit 7639ed9958a9a1c4159faa1f4e6e15e9ede60b7d; see PROVENANCE.md.
const plain = v => v && typeof v === 'object' && !Array.isArray(v);
const invalid = () => { throw Object.assign(new Error('INVALID_REQUEST'), { code: 'INVALID_REQUEST' }); };
const id = v => typeof v === 'string' && v.length > 0 && v.length <= 512 && !/[\u0000-\u001f\u007f]/.test(v) && !['__proto__', 'constructor', 'prototype'].includes(v);
const name = v => typeof v === 'string' && v.length <= 80 && !/[\u0000-\u001f\u007f]/.test(v);
export function validateProviderSettings(raw) {
  if (!plain(raw) || JSON.stringify(raw).length > 60000 || Object.keys(raw).some(k => !['displayName', 'accounts', 'visibleModels', 'modelDisplayNames', 'contextWindows', 'subagentSpeeds'].includes(k))) invalid();
  const result = structuredClone(raw);
  if ('displayName' in raw && !name(raw.displayName)) invalid();
  const list = v => Array.isArray(v) && v.length <= 128 && v.every(id);
  if ('visibleModels' in raw && !list(raw.visibleModels)) invalid();
  for (const key of ['accounts', 'modelDisplayNames', 'contextWindows', 'subagentSpeeds']) {
    if (!(key in raw)) continue;
    if (!plain(raw[key]) || Object.keys(raw[key]).length > 128) invalid();
    for (const [model, value] of Object.entries(raw[key])) {
      if (!id(model)) invalid();
      if (key === 'modelDisplayNames' && !name(value)) invalid();
      if (key === 'contextWindows' && (!Number.isSafeInteger(value) || value <= 0 || value > 10000000)) invalid();
      if (key === 'subagentSpeeds' && !['standard', 'fast'].includes(value)) invalid();
      if (key === 'accounts') {
        if (!/^[a-f0-9]{64}$/.test(model) || !plain(value) || Object.keys(value).some(k => !['alias', 'poolEnabled', 'independentEntry', 'poolModels'].includes(k))) invalid();
        if ('alias' in value && !name(value.alias)) invalid();
        for (const flag of ['poolEnabled', 'independentEntry']) if (flag in value && typeof value[flag] !== 'boolean') invalid();
        if ('poolModels' in value && !list(value.poolModels)) invalid();
      }
    }
  }
  return result;
}
