---
status: accepted
---
# Each feature is a DSH plugin component

dsh-majed stays one plugin, but every feature beyond the core preferences is declared as its own DSH plugin component: a separate Loader row (`id`, `name`) in the bundle patch, which the Plugins page lists under "Components" with its own switch. Switching a row off disposes only that feature's host half, with no restart under HMR, so the Owner can turn off one feature without disabling the plugin. This replaces ADR-0001's "independently enabled module" with the host's own mechanism instead of a plugin-internal toggle.

## Consequences
- DSH loads one browser half per package, owned by the core `majed` row, which must therefore stay on. The browser half hides a feature's UI itself while that feature's row is off.
- Each component row needs a globally unique `id`, an exported subpath entry, and its own locale `meta` title and icon.
- The existing 0.2.0 preferences stay in the core row; they are split into rows only when each is revisited as a feature.
