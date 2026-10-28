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

**Subscriptions**:
The feature family for provider subscription accounts, integrated API model access, usage and supported search/image/video capabilities. Subscription access and API access retain distinct credentials, billing and limits; Auto and Smart Auto consume only explicitly eligible routes.
_Avoid_: Auto pool, Chat-only subscriptions

**Subscription account**:
An Owner-managed identity with a provider whose login state, direct-chat availability, tool activation and routing participation are distinct. A connected account is not implicitly enrolled in Auto or contextual judgment.
_Avoid_: Auto candidate, Implicit enrollment

**API connection**:
An Owner-configured model-access connection with its own service destination and authentication, distinct from subscription login. Its availability alone does not authorize Auto participation or subscription-to-API fallback.
_Avoid_: Subscription account, Shared subscription credit

**Command auto-approval**:
An Owner-selected session mode for automatically answering eligible command permission requests within native DSH safeguards. It is distinct from model-routing Auto and Approval of a command hook.
_Avoid_: Auto mode, Hook Approval

**Auto safe**:
A command auto-approval mode for uninterrupted routine development that retains a human boundary around materially destructive or hard-to-reverse actions. It is not a read-only mode.
_Avoid_: Read-only mode

**Auto aggressive**:
A command auto-approval mode that also delegates project-risk decisions normally withheld by Auto safe, while retaining security and sensitive-data restrictions. It is not an override of native security controls.
_Avoid_: Unrestricted access, Security bypass

**Command fallback policy**:
The Owner-controlled, mode-specific rules used to decide command permission requests when contextual judgment is unavailable. It is distinct from a judgment refusal and from Auto's model-selection fallback.
_Avoid_: Command whitelist, Auto fallback

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
An explicitly enrolled model-access route identifying its provider, subscription account or API connection, and model, with an Owner-defined priority and permitted reasoning efforts.
_Avoid_: Available account, model pool member

**Skill source**:
The origin of a skill's instructions and resources, distinct from the scopes in which that skill is available. A source may be writable or read-only.
_Avoid_: Skill scope, Skill ownership policy

**Skill availability**:
The effective permission for a skill to be discovered or invoked manually or by the model in a given context. Availability is distinct from storing the skill or granting authority to its tools.
_Avoid_: Installed means enabled, Tool authorization

**Effective skill**:
The source-specific skill selected for an invocation name in a particular context under native precedence and applicable availability policy.
_Avoid_: Merged skill, First displayed skill

**Shadow evaluation**:
An opt-in comparison that records Smart Auto's proposed selection without applying it to execution.
_Avoid_: Trial routing, silent rollout
