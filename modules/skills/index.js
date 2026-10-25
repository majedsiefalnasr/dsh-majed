// Internal Skills integration. Apache-2.0 implementation lives in vendor/.
export const SKILLS_GATE_ROUTE = '/api/dsh-majed/skills/status';
// Static ownership only: never infer standalone runtime state from this assertion.
export const SKILLS_OWNERSHIP = Object.freeze({
  owner: 'dsh-majed',
  sourceLabel: 'Majed Skills',
  replaces: '@michengai/dsh-skills-manager',
  sharedApi: '/api/dsh-skills-manager',
});
export function skillsEnabled(config = {}) {
  if (config.skills?.enabled !== true) return false;
  if (config.skills.standaloneDisabled !== true) {
    throw new Error('dsh-majed Skills conflict check: disable @michengai/dsh-skills-manager in both host and client, then set skills.standaloneDisabled: true before enabling. No automatic uninstall is performed.');
  }
  return true;
}
export function registerSkills(ctx, config = {}, load = () => import('./native.js')) {
  const enabled = skillsEnabled(config);
  ctx.inject(['connection'], (webCtx) => {
    // Connection admits the browser and requires an owner before this callback.
    // Canonical /api paths also enter the native remote pairing/auth rewrite.
    webCtx.reflect.get('connection').fetch.register({ path: SKILLS_GATE_ROUTE, methods: ['GET', 'HEAD'], requestBody: 'buffered', fetch(request) {
      return new Response(request.method === 'HEAD' ? null : JSON.stringify({ enabled }), { status: 200, headers: {
        'content-type': 'application/json', 'cache-control': 'no-store',
        'x-dsh-skills-owner': SKILLS_OWNERSHIP.owner,
        'x-dsh-skills-source': SKILLS_OWNERSHIP.sourceLabel,
      } });
    } });
  });
  if (!enabled) return;
  ctx.inject(['webServer', 'skills', 'tools', 'sessions', 'connection'], (skillsCtx) => {
    let disposed = false;
    skillsCtx.effect(() => () => { disposed = true; }, 'dsh-majed: Skills lifecycle');
    // Do not return the import promise: Cordis waits for returned setup before
    // disposal, preventing the guard above from running during a pending import.
    // Detach setup, await apply, and report failures through the native logger.
    Promise.resolve().then(load).then(async (module) => {
      if (!disposed) await module.apply(skillsCtx);
    }).catch((error) => { skillsCtx.logger.error(error); });
  });
}
