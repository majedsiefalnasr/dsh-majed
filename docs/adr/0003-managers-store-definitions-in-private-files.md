---
status: accepted
---
# Manager definitions live in private files under DSH_HOME, not in the profile config

MCP server definitions and Hook approvals are stored in dsh-majed's own files (atomic writes, re-read on each request, secrets masked in the UI) and applied by per-server plugin fibers, instead of editing the profile `cordis.patch.yml` through the configuration editor. The editor path required proving root-entry ownership and failed repeatedly in live saves; private files are simpler and work identically through the remote GUI.

**2026-10-25 runtime amendment:** [ADR 0010](./0010-allow-mcp-sdk-through-public-dsh-apis.md) permits a Majed-owned official MCP SDK client through public DSH APIs when needed, retaining the native client as default. The original per-server plugin-fiber choice is no longer mandatory for every connection. Private storage, single ownership and isolated lifecycles remain required.

## Considered Options
- Config-editor entry with ownership proof (the first implementation): native, but fragile.
- Marker block in the profile YAML (as `dsh-mcp-console` does): couples to host config layout.
