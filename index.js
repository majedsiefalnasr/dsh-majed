/** Public host entry: accepted preferences plus inert authenticated Settings. */
import { apply as baseline } from './lib/baseline/host.js';
import { apply as settings } from './lib/management/settings.js';
import { apply as skills } from './modules/skills/service.js';
import { AUTO_ROUTE_ID } from './modules/auto/index.js';
import { applyJudgment } from './modules/judgment/native.js';
import { applyCodexAccounts } from './modules/subscriptions/codex/native.js';
import { applyManagedMcp } from './modules/mcp/native.js';
import { applyCommandApproval } from './modules/hooks/approval.js';
import { applyCommandMode } from './modules/command-mode/index.js';
import { applyNativeApiReferences } from './modules/catalog/native-api-mount.js';
import { applyPolicySettings } from './modules/command-policy/settings-mount.js';

export { AUTO_ROUTE_ID };

export function apply(ctx, config = {}) {
  baseline(ctx);
  settings(ctx);
  applyManagedMcp(ctx, config.managedMcp || {});
  skills(ctx);
  applyJudgment(ctx, config.judgment);
  applyCodexAccounts(ctx, config.codexAccounts || {});
  applyCommandApproval(ctx, config.hooksApproval || {});
  const policyOptions = { ...(config.commandPolicy || {}) };
  const ownerPolicy = applyPolicySettings(ctx, policyOptions);
  const commandModes = applyCommandMode(ctx, { settings: ownerPolicy.settings });
  policyOptions.ledger = commandModes.policy;
  applyNativeApiReferences(ctx, config.nativeApi || {});
  // Deterministic Auto routing is opt-in and explicitly enabled; no automatic
  // activation here. The Auto core (candidate enrollment, eligibility filtering,
  // priority selection with session stickiness, bounded failover budget) is
  // available as a module and wired to the native picker only through explicit
  // Owner enablement (T21/T22/T23).
}
