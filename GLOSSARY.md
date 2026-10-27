# dsh-majed

A single plugin for DeepSeek Harness (DSH) that adds app-wide preferences and, in development, management of Skills, MCP servers and Hooks from DSH Settings.

## Language

**Manager**:
A Settings section of dsh-majed through which the owner manages one kind of capability: Skills, MCP servers or Hooks.
_Avoid_: Console, panel, dashboard

**Reference plugin**:
A third-party plugin used as a source of behavior and implementation examples for dsh-majed. It need not be installed; an installed reference is removed by the Owner only after the agreed replacement criteria are met.
_Avoid_: Dependency, companion

**Cutover**:
The explicit, reversible step that disables a reference plugin and enables its dsh-majed replacement, with a backup taken first.
_Avoid_: Migration, switch

**Command hook**:
A hook that runs a shell command on an agent lifecycle event, only after the owner has approved its exact content.
_Avoid_: Script hook, trigger

**Tool rule**:
A hook policy that denies tool calls by wildcard name and runs no code.
_Avoid_: Deny hook, block list

**Approval**:
The owner's recorded consent to run one exact version of a command hook; any change to the hook voids it.
_Avoid_: Trust, whitelist

**Parity list**:
The features of a reference plugin that dsh-majed must cover before the owner deletes that plugin; deferred items become tickets.
_Avoid_: Roadmap, feature matrix

**Owner**:
The authenticated person who administers the DSH instance, locally or through the remote GUI.
_Avoid_: Admin, user

**Auto**:
An Owner-selected mode that chooses among explicitly included account/model candidates using the Owner's priority order and retains a healthy selection within a session.
_Avoid_: Automatic account pool, intelligent routing

**Smart Auto**:
An optional enhancement to Auto that asks a judgment service to choose an eligible model and reasoning effort for the task, retaining priority-based selection as its fallback.
_Avoid_: Jev mode, autonomous provider

**Auto membership**:
The Owner's explicit consent for an account/model candidate to participate in Auto selection; account availability alone is not membership.
_Avoid_: Login consent, implicit enrollment

**Auto candidate**:
An explicitly enrolled provider, account and model combination with an Owner-defined priority and permitted reasoning efforts.
_Avoid_: Available account, model pool member

**Shadow evaluation**:
An opt-in comparison that records Smart Auto's proposed selection without applying it to execution.
_Avoid_: Trial routing, silent rollout
