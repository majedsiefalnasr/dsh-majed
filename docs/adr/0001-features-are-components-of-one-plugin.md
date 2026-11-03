# Each feature is a component of one plugin

dsh-majed stays a single plugin, and every feature beyond the core preferences is declared as its own DSH plugin component: a separate Loader row in the bundle patch, which the Plugins page lists under "Components" with its own switch. One install, one version and one changelog outweigh the cost of one release covering several features, and the component switch still lets the Owner turn off one feature without disabling the plugin. Switching a row off disposes only that feature's host half, live under HMR.

## Considered Options
- One plugin per feature: independent releases and switches, but one install, changelog and set of shared plumbing per feature.

## Consequences
- DSH loads one browser half per package, owned by the core `majed` row, which must stay on. The browser half hides a feature's UI itself while that feature's row is off.
- Each component row needs a globally unique `id`, an exported subpath entry, and its own locale title and icon.
