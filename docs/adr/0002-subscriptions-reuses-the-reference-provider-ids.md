# Subscriptions reuses the reference plugin's provider ids

DSH stores every model choice as `provider/model` (default model, sessions, task cards, subagent routes). The Subscriptions component registers the same provider ids as the reference plugin dsh-plugin-subscriptions (`codex`, `claude`, `grok`, `copilot`, `antigravity`), so every saved choice keeps working whichever of the two is running and nothing breaks when the reference is later removed. DSH rejects two registrations of one provider id, so only one of them can run at a time: our component ships switched off, and the Owner swaps the two with their component switches. Each keeps its own storage, RPC routes and tool names, so they never share or refresh the same credentials. The reference stays installed as the Owner's fallback until he accepts ours and removes it himself.

## Considered Options
- New provider ids so both run together: every model would appear twice and every saved choice would stay bound to the reference, breaking when it is removed.
