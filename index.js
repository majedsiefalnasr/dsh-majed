/** Public host entry: accepted preferences plus inert authenticated Settings. */
import { apply as baseline } from './lib/baseline/host.js';
import { apply as settings } from './lib/management/settings.js';
import { AUTO_ROUTE_ID } from './modules/auto/index.js';

export { AUTO_ROUTE_ID };

export function apply(ctx) {
  baseline(ctx);
  settings(ctx);
  // Deterministic Auto routing is opt-in and explicitly enabled; no automatic
  // activation here. The Auto core (candidate enrollment, eligibility filtering,
  // priority selection with session stickiness, bounded failover budget) is
  // available as a module and wired to the native picker only through explicit
  // Owner enablement (T21/T22/T23).
}
