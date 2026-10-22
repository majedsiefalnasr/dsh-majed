---
status: accepted
---
# Manager definitions live in private files under DSH_HOME, not in the profile config

MCP server definitions and Hook approvals are stored in dsh-majed's own files (atomic writes, re-read on each request, secrets masked in the UI) and applied by per-server plugin fibers, instead of editing the profile `cordis.patch.yml` through the configuration editor. The editor path required proving root-entry ownership and failed repeatedly in live saves; private files are simpler and work identically through the remote GUI.

## Considered Options
- Config-editor entry with ownership proof (the first implementation): native, but fragile.
- Marker block in the profile YAML (as `dsh-mcp-console` does): couples to host config layout.
