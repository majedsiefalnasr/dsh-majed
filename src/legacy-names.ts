/**
 * Deprecated names kept for ONE release after the rename to `waycraft`
 *
 * This is the single source of the retired product name in `src/`: every alias, read-fallback and
 * migration source elsewhere imports from here. Removal plan: delete this module, its consumers'
 * fallbacks and `test/legacy-*.test.mjs` in the release after the rename (see docs/ai/rename-waycraft.md).
 */

/** Old `plugins/<dir>/subscriptions` storage directory segment. */
export const LEGACY_PLUGIN_DIR = 'majed';
/** Old skills state root directory name under the DSH home. */
export const LEGACY_SKILLS_DIR = 'majed-skills';
/** Old RPC method prefix of the subscriptions host (`/api/<prefix><endpoint>`). */
export const LEGACY_RPC_PREFIX = 'majed-subscriptions.';
/** Old skills catalog route path and its CSRF-style marker header. */
export const LEGACY_SKILLS_ROUTE = '/api/majed-skills.catalog';
export const LEGACY_SKILLS_HEADER = 'x-majed-skills';
/** Old localStorage keys (read fallback only; never written, never deleted). */
export const LEGACY_USAGE_BADGE_KEY = 'majed.subscriptions.usageBadgeMode';
export const LEGACY_SETTINGS_KEY = 'dsh-majed:settings:v1';
/** Old public browser hook, kept as a deprecated alias of `window.__dshWaycraft`. */
export const LEGACY_GLOBAL = '__dshMajed';
/** Old bundled-font URL prefix served by the host half. */
export const LEGACY_FONT_ROUTE = '/plugins/dsh-majed/fonts';
/** Old slot/section/panel ids mapped to their new ids (saved nav state). */
export const LEGACY_PANEL_IDS: Readonly<Record<string, string>> = {
  'majed-skills': 'waycraft-skills',
  'majed-subscriptions': 'waycraft-subscriptions',
};
/**
 * Retired tool names, registered as deprecated aliases of the same implementation for one release.
 * Keys are the canonical tool names.
 */
export const LEGACY_TOOL_ALIASES = {
  x_search: 'dsh_majed_x_search',
  video_generate: 'dsh_majed_video_generate',
  image_generate: 'dsh_majed_image_generate',
} as const;
/** Old toolview slot key for a tool name. */
export const legacyToolviewKey = (name: string): string => `dsh_majed_${name}`;
