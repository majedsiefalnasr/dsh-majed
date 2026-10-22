---
status: accepted
---
# One plugin hosts the Skills, MCPs and Hooks managers

dsh-majed ships all managers as isolated modules of a single plugin instead of separate plugins like `dsh-pouch`. One install, version, CHANGELOG and set of shared UI and route plumbing outweigh the cost of one release covering all three. Each module is independently enabled and must fail without stopping the others.

## Considered Options
- One plugin per manager (the `dsh-pouch` pattern): independent releases, but three installs, three changelogs and duplicated plumbing.
