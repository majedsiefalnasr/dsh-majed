import { createPrivateStore } from '../subscriptions/codex/storage.js';
import { normalizeSettings } from './index.js';

export const POLICY_FIELDS = Object.freeze(['trustedProjects', 'knownEffects', 'checkpointEffects', 'denyEffects', 'checkpointPaths', 'denyPaths', 'aggressiveDestructive', 'ownerContext']);
const record = value => value && typeof value === 'object' && !Array.isArray(value);
const keysOnly = (value, keys) => Object.keys(value).every(key => keys.includes(key));
const failure = () => Object.assign(new Error('invalid_request'), { code: 'invalid_request', status: 400 });
export const policyDefaults = () => ({ ...Object.fromEntries(POLICY_FIELDS.slice(0, 6).map(key => [key, []])), aggressiveDestructive: true, ownerContext: { task: { authorizedTargets: [], prohibitions: [] }, knownScripts: {}, sessionTempDirs: [] } });
const list = value => Array.isArray(value) && value.length <= 64 && value.every(item => typeof item === 'string' && item.length > 0 && item.length <= 512 && !/[\0\r\n]/.test(item));
export function validPolicySettings(value) {
  if (!record(value) || !keysOnly(value, POLICY_FIELDS) || Buffer.byteLength(JSON.stringify(value)) > 65536) return false;
  const normalized = normalizeSettings(value);
  if (normalized.settingsInvalid) return false;
  for (const key of POLICY_FIELDS.slice(0, 6)) if (!Array.isArray(value[key]) || JSON.stringify(normalized[key]) !== JSON.stringify(value[key])) return false;
  const context = value.ownerContext;
  return typeof value.aggressiveDestructive === 'boolean' && record(context) && keysOnly(context, ['task', 'knownScripts', 'sessionTempDirs'])
    && record(context.task) && keysOnly(context.task, ['authorizedTargets', 'prohibitions'])
    && ['authorizedTargets', 'prohibitions'].every(key => context.task[key] === undefined || (list(context.task[key]) && context.task[key].every(target => /^(path|effect|branch|db|push|rollback):[^\0*?[{$~]+$/.test(target))))
    && list(context.sessionTempDirs) && context.sessionTempDirs.every(path => path.startsWith('/'))
    && record(context.knownScripts) && Object.keys(context.knownScripts).length <= 32
    && Object.entries(context.knownScripts).every(([key, script]) => key.length > 0 && key.length <= 256 && typeof script === 'string' && script.length <= 16384);
}
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
/** Owner-only file; atomic 0600 commits and corrupt/unsafe refusal reuse the durable settings pattern. */
export function createPolicySettingsStore(path) {
  const store = createPrivateStore(path, { empty: () => ({ version: 1, settings: policyDefaults() }), validate: data => data?.version === 1 && validPolicySettings(data.settings) });
  return {
    read: async () => freeze((await store.load()).settings),
    async set(field, value, signal) {
      if (!POLICY_FIELDS.includes(field)) throw failure();
      await store.transaction(data => { data.settings[field] = value; if (!validPolicySettings(data.settings)) throw failure(); }, { signal });
    },
    async reset(field, signal) { return this.set(field, policyDefaults()[field], signal); },
  };
}
