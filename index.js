/** Public host entry: accepted preferences plus inert authenticated Settings. */
import { apply as baseline } from './lib/baseline/host.js';
import { apply as settings } from './lib/management/settings.js';

export function apply(ctx) {
  baseline(ctx);
  settings(ctx);
}
