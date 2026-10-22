---
status: accepted
---
# Command hooks reuse the `hooks.json` format and are approved with a typed confirmation

Hooks run shell commands, so they are declared in the same `.dsh/hooks.json` and `$DSH_HOME/hooks.json` files `dsh-hooks` reads, giving a cutover without data migration, and edited from the Settings UI. Each hook is inert until the owner approves its exact content hash after a server-verified nonce and typed confirmation; any change voids the approval, events reach the command through stdin only, and a hook never grants authority over native tool guards. Approval is allowed from the remote GUI as well, with its source and time recorded, because commands still run only on the DSH host. Old `dsh-hooks` approvals are not imported.

## Consequences
Commands run as the DSH OS user without a sandbox, which is why approval is gated this strongly.
